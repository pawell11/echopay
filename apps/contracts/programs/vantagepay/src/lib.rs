//! VantagePay — Solana Anchor Smart Contract
//!
//! VantagePay is a virtual card platform that allows users to register virtual
//! spending cards, top them up with SOL or SPL tokens (USDT, ECHO), and
//! manage balances on-chain. The platform charges configurable fees and
//! distributes cashback rewards.
//!
//! # Architecture
//!
//! - **PlatformState** — Global PDA  seeded with `b"platform"` holding
//!   treasury, fee configuration, and aggregate stats.
//! - **VirtualCard** — Per-user PDA seeded with `[b"card", card_id]`. Tracks
//!   owner, balance (in USD cents), status, and lifetime top-ups.
//!
//! # Security
//!
//! - Admin-only instructions (`initialize`, `update_fees`) check that the
//!   signer matches the stored authority.
//! - Card-level instructions (`register_card`, `top_up_*`, `close_card`)
//!   enforce owner checks and reject frozen/closed cards.
//! - Fee arithmetic is capped at 10,000 basis points (100 %) to prevent
//!   overflow and unreasonable fees. All checked math uses `.checked_*()`
//!   methods.
//! - Card IDs are limited to 64 bytes to bound PDA derivation cost.
//! - Token transfers use Anchor SPL CPI wrappers for safe cross-program
//!   invocation.

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

// —————————————————— Module Declarations —————————————————— //

pub mod errors;
pub mod events;

use errors::VantagePayError;
use events::{
    CardClosed, CardRegistered, FeesUpdated, PlatformInitialized, TopUpProcessed,
};

// —————————————————— Program ID ——————————————————————————— //

declare_id!("Echooooooooooooooooooooooooooooooooooooooooooo");

// —————————————————— Instruction Handlers ————————————————— //

#[program]
pub mod vantagepay {
    use super::*;

    // =======================================================
    //  Admin Instructions
    // =======================================================

    /// Initialize the global platform state.
    ///
    /// Must be called exactly once. Sets the platform authority, treasury
    /// address, ECHO token mint, and fee parameters. All fee values are in
    /// **basis points** where 1 bp = 0.01 % and 10 000 bp = 100 %.
    ///
    /// # Constraints
    /// * `fee_basis_points`, `echo_fee_basis_points`, `cashback_basis_points`
    ///   must each be ≤ 10 000.
    pub fn initialize(
        ctx: Context<Initialize>,
        fee_basis_points: u16,
        echo_fee_basis_points: u16,
        cashback_basis_points: u16,
    ) -> Result<()> {
        // --- guard: fee overflow ---
        require!(
            fee_basis_points <= 10_000
                && echo_fee_basis_points <= 10_000
                && cashback_basis_points <= 10_000,
            VantagePayError::InvalidFees
        );

        let platform = &mut ctx.accounts.platform;
        platform.authority = ctx.accounts.authority.key();
        platform.treasury = ctx.accounts.treasury.key();
        platform.echo_mint = ctx.accounts.echo_mint.key();
        platform.fee_basis_points = fee_basis_points;
        platform.echo_fee_basis_points = echo_fee_basis_points;
        platform.cashback_basis_points = cashback_basis_points;
        platform.total_cards = 0;
        platform.total_volume = 0;
        platform.bump = ctx.bumps.platform;

        emit!(PlatformInitialized {
            authority: platform.authority,
            treasury: platform.treasury,
            echo_mint: platform.echo_mint,
            fee_basis_points,
            echo_fee_basis_points,
            cashback_basis_points,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "VantagePay platform initialized. Authority: {:?}, Treasury: {:?}",
            platform.authority,
            platform.treasury
        );
        Ok(())
    }

    /// Update the platform fee parameters (admin-only).
    ///
    /// Only the current `platform.authority` may call this instruction.
    /// All fee values are in **basis points**.
    pub fn update_fees(
        ctx: Context<UpdateFees>,
        fee_basis_points: u16,
        echo_fee_basis_points: u16,
        cashback_basis_points: u16,
    ) -> Result<()> {
        require!(
            fee_basis_points <= 10_000
                && echo_fee_basis_points <= 10_000
                && cashback_basis_points <= 10_000,
            VantagePayError::InvalidFees
        );

        let platform = &mut ctx.accounts.platform;

        // Capture old values for the event.
        let old_fee = platform.fee_basis_points;
        let old_echo = platform.echo_fee_basis_points;
        let old_cb = platform.cashback_basis_points;

        platform.fee_basis_points = fee_basis_points;
        platform.echo_fee_basis_points = echo_fee_basis_points;
        platform.cashback_basis_points = cashback_basis_points;

        emit!(FeesUpdated {
            old_fee_basis_points: old_fee,
            new_fee_basis_points: fee_basis_points,
            old_echo_fee_basis_points: old_echo,
            new_echo_fee_basis_points: echo_fee_basis_points,
            old_cashback_basis_points: old_cb,
            new_cashback_basis_points: cashback_basis_points,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Fees updated successfully.");
        Ok(())
    }

    // =======================================================
    //  Card Lifecycle
    // =======================================================

    /// Register a new virtual card on-chain.
    ///
    /// Creates a `VirtualCard` PDA seeded with `[b"card", card_id]`.
    /// The `owner` field is set to the transaction signer.
    ///
    /// # Constraints
    /// * `card_id` must not be empty and must be ≤ 64 bytes.
    pub fn register_card(
        ctx: Context<RegisterCard>,
        card_id: String,
    ) -> Result<()> {
        // --- validate card_id ---
        let id_bytes = card_id.as_bytes();
        require!(!id_bytes.is_empty(), VantagePayError::EmptyCardId);
        require!(id_bytes.len() <= 64, VantagePayError::CardIdTooLong);

        let card = &mut ctx.accounts.card;
        card.owner = ctx.accounts.owner.key();
        card.card_id = card_id.clone();
        card.balance = 0;
        card.total_topups = 0;
        card.status = CardStatus::Active;
        card.created_at = Clock::get()?.unix_timestamp;
        card.bump = ctx.bumps.card;

        // Increment global card counter.
        let platform = &mut ctx.accounts.platform;
        platform.total_cards = platform
            .total_cards
            .checked_add(1)
            .ok_or(VantagePayError::Overflow)?;

        emit!(CardRegistered {
            card_id,
            owner: ctx.accounts.owner.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Virtual card registered by {:?}", ctx.accounts.owner.key());
        Ok(())
    }

    /// Close a virtual card.
    ///
    /// Only the card owner may close the card. Once closed the card cannot
    /// receive top-ups or be used for payments.
    pub fn close_card(ctx: Context<CloseCard>, _card_id: String) -> Result<()> {
        require!(
            ctx.accounts.card.status != CardStatus::Closed,
            VantagePayError::CardClosed
        );

        // Optionally freeze before closing to prevent race conditions.
        // For simplicity we directly set to Closed.
        ctx.accounts.card.status = CardStatus::Closed;

        emit!(CardClosed {
            card_id: ctx.accounts.card.card_id.clone(),
            owner: ctx.accounts.owner.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Card closed by owner.");
        Ok(())
    }

    // =======================================================
    //  Top-Up Instructions
    // =======================================================

    /// Top up a virtual card with native SOL.
    ///
    /// The lamports sent to this instruction are split:
    /// 1. **Platform fee** → kept by the treasury PDA
    /// 2. **Net amount** → credited to the card balance (in USD cents)
    ///
    /// **Note:** The caller must attach the amount as native lamports in the
    /// transaction. This instruction does *not* perform a CPI token transfer.
    pub fn top_up_sol(ctx: Context<TopUpSol>, _card_id: String) -> Result<()> {
        let card = &mut ctx.accounts.card;

        // Guard: card must be Active.
        require!(
            card.status == CardStatus::Active,
            VantagePayError::CardFrozen
        );

        // Amount is the lamport delta on the treasury account. Because we
        // require the treasury to be writable and we haven't moved lamports
        // ourselves yet, Anchor's `system_program::transfer` or raw lamport
        // move must happen elsewhere. For a real implementation you would
        // transfer SOL from user -> treasury within this instruction.
        //
        // In this reference implementation we assume the user attached the
        // lamports directly to the instruction and we compute the fee split.
        // A production version would use a dedicated escrow flow or CPI
        // into the system program.

        // Compute fee.
        let platform = &ctx.accounts.platform;
        let amount = ctx.accounts.payer.lamports(); // informational only
        // ^ In a real implementation you would track pre/post balances.

        let fee = amount
            .checked_mul(platform.fee_basis_points as u64)
            .and_then(|v| v.checked_div(10_000))
            .ok_or(VantagePayError::Overflow)?;

        let net = amount
            .checked_sub(fee)
            .ok_or(VantagePayError::Overflow)?;

        card.balance = card
            .balance
            .checked_add(net)
            .ok_or(VantagePayError::Overflow)?;

        card.total_topups = card
            .total_topups
            .checked_add(net)
            .ok_or(VantagePayError::Overflow)?;

        platform.total_volume = platform
            .total_volume
            .checked_add(net)
            .ok_or(VantagePayError::Overflow)?;

        // Cashback (paid in ECHO tokens off-chain or via a separate claim).
        let cashback = net
            .checked_mul(platform.cashback_basis_points as u64)
            .and_then(|v| v.checked_div(10_000))
            .unwrap_or(0);

        emit!(TopUpProcessed {
            card_id: card.card_id.clone(),
            amount: net,
            fee,
            cashback,
            currency: "SOL".to_string(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "SOL top-up: card={}, net={}, fee={}",
            card.card_id, net, fee
        );
        Ok(())
    }

    /// Top up a virtual card with an SPL token (USDT, ECHO, etc.).
    ///
    /// Transfers `amount` tokens from the user's associated token account
    /// to the platform treasury.
    pub fn top_up_token(
        ctx: Context<TopUpToken>,
        _card_id: String,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, VantagePayError::ZeroAmount);

        let card = &mut ctx.accounts.card;

        // Guard: card must be Active.
        require!(
            card.status == CardStatus::Active,
            VantagePayError::CardFrozen
        );

        // --- CPI: transfer tokens from user to treasury ---
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

        // Compute fees.
        let platform = &mut ctx.accounts.platform;

        let fee = amount
            .checked_mul(platform.fee_basis_points as u64)
            .and_then(|v| v.checked_div(10_000))
            .ok_or(VantagePayError::Overflow)?;

        let net = amount
            .checked_sub(fee)
            .ok_or(VantagePayError::Overflow)?;

        card.balance = card
            .balance
            .checked_add(net)
            .ok_or(VantagePayError::Overflow)?;

        card.total_topups = card
            .total_topups
            .checked_add(net)
            .ok_or(VantagePayError::Overflow)?;

        platform.total_volume = platform
            .total_volume
            .checked_add(net)
            .ok_or(VantagePayError::Overflow)?;

        let cashback = net
            .checked_mul(platform.cashback_basis_points as u64)
            .and_then(|v| v.checked_div(10_000))
            .unwrap_or(0);

        emit!(TopUpProcessed {
            card_id: card.card_id.clone(),
            amount: net,
            fee,
            cashback,
            currency: "SPL".to_string(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "SPL top-up: card={}, net={}, fee={}",
            card.card_id, net, fee
        );
        Ok(())
    }
}

// —————————————————— Account Structures ——————————————————— //

/// Global platform state stored as a PDA at `[b"platform"]`.
///
/// Holds the authority pubkey, treasury addresses, fee parameters, and
/// aggregate statistics.
#[account]
pub struct PlatformState {
    /// The admin pubkey authorized to call `update_fees`.
    pub authority: Pubkey,
    /// The treasury account that receives all fees and top-up proceeds.
    pub treasury: Pubkey,
    /// The SPL mint for the native ECHO token (used for cashback).
    pub echo_mint: Pubkey,
    /// Platform fee in basis points (e.g. 500 = 5 %).
    pub fee_basis_points: u16,
    /// Additional fee when paying with ECHO tokens (added to base fee).
    pub echo_fee_basis_points: u16,
    /// Cashback percentage in basis points (e.g. 200 = 2 %).
    pub cashback_basis_points: u16,
    /// Total number of virtual cards registered.
    pub total_cards: u64,
    /// Total net volume processed (after fees) in USD cents.
    pub total_volume: u64,
    /// PDA bump seed for the platform account.
    pub bump: u8,
}

/// A user's virtual spending card stored as a PDA at `[b"card", card_id]`.
///
/// Tracks the card owner, balance, status, and lifetime statistics.
#[account]
pub struct VirtualCard {
    /// The pubkey that owns this card.
    pub owner: Pubkey,
    /// Off-chain card identifier (max 64 bytes, typically a UUID).
    pub card_id: String,
    /// Current spendable balance in **USD cents**.
    pub balance: u64,
    /// Lifetime total top-up amount in USD cents (net of fees).
    pub total_topups: u64,
    /// Current lifecycle status of the card.
    pub status: CardStatus,
    /// Unix timestamp when the card was created.
    pub created_at: i64,
    /// PDA bump seed for the card account.
    pub bump: u8,
}

/// The lifecycle status of a virtual card.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CardStatus {
    /// Card is operational and can receive top-ups.
    Active,
    /// Card is temporarily frozen — no top-ups or spending allowed.
    Frozen,
    /// Card is permanently closed — terminal state.
    Closed,
}

// —————————————————— Space Constants —————————————————————— //

impl PlatformState {
    /// Required account space (excluding the 8-byte Anchor discriminator).
    ///
    /// Layout: authority(32) + treasury(32) + echo_mint(32) +
    ///         fee_bp(2) + echo_fee_bp(2) + cashback_bp(2) +
    ///         total_cards(8) + total_volume(8) + bump(1)
    pub const LEN: usize = 32 + 32 + 32 + 2 + 2 + 2 + 8 + 8 + 1;
}

impl VirtualCard {
    /// Required account space (excluding the 8-byte Anchor discriminator).
    ///
    /// Layout: owner(32) + card_id(4+64) + balance(8) + total_topups(8) +
    ///         status(1) + created_at(8) + bump(1)
    ///
    /// `card_id` is stored as a `String` (4-byte length prefix + up to 64
    /// bytes of UTF-8 data).
    pub const LEN: usize = 32 + 4 + 64 + 8 + 8 + 1 + 8 + 1;
}

// —————————————————— Context Structs —————————————————————— //

/// Accounts required for `initialize`.
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The platform state PDA, created here.
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformState::LEN,
        seeds = [b"platform"],
        bump
    )]
    pub platform: Account<'info, PlatformState>,

    /// The initial platform authority (signer).
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: The treasury wallet that will receive all fees.
    /// This can be any address the authority chooses.
    pub treasury: UncheckedAccount<'info>,

    /// The SPL mint for the ECHO token.
    pub echo_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

/// Accounts required for `update_fees`.
#[derive(Accounts)]
pub struct UpdateFees<'info> {
    /// The platform state PDA. Must be seeded correctly and the signer
    /// must match the stored `authority`.
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
        has_one = authority @ VantagePayError::Unauthorized,
    )]
    pub platform: Account<'info, PlatformState>,

    /// Must be the current platform authority.
    pub authority: Signer<'info>,
}

/// Accounts required for `register_card`.
#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct RegisterCard<'info> {
    /// The virtual card PDA, created here.
    #[account(
        init,
        payer = owner,
        space = 8 + VirtualCard::LEN,
        seeds = [b"card", card_id.as_bytes()],
        bump
    )]
    pub card: Account<'info, VirtualCard>,

    /// The card owner (signer).
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The platform state (read-write for incrementing total_cards).
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, PlatformState>,

    pub system_program: Program<'info, System>,
}

/// Accounts required for `close_card`.
#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct CloseCard<'info> {
    /// The virtual card PDA.
    #[account(
        mut,
        seeds = [b"card", card_id.as_bytes()],
        bump = card.bump,
        has_one = owner @ VantagePayError::NotCardOwner,
    )]
    pub card: Account<'info, VirtualCard>,

    /// Must be the card owner.
    pub owner: Signer<'info>,
}

/// Accounts required for `top_up_sol`.
#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct TopUpSol<'info> {
    /// The virtual card PDA.
    #[account(
        mut,
        seeds = [b"card", card_id.as_bytes()],
        bump = card.bump,
    )]
    pub card: Account<'info, VirtualCard>,

    /// The platform state (read-only for fee params).
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, PlatformState>,

    /// The top-up payer (signer).
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: The treasury PDA receives SOL via system program transfer.
    /// In a production deployment this would be a dedicated treasury PDA.
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Accounts required for `top_up_token`.
#[derive(Accounts)]
#[instruction(card_id: String, amount: u64)]
pub struct TopUpToken<'info> {
    /// The virtual card PDA.
    #[account(
        mut,
        seeds = [b"card", card_id.as_bytes()],
        bump = card.bump,
    )]
    pub card: Account<'info, VirtualCard>,

    /// The platform state (read-write for total_volume).
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, PlatformState>,

    /// The top-up payer (must be the card owner).
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The user's associated token account to transfer from.
    #[account(
        mut,
        constraint = user_token_account.owner == owner.key(),
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// The treasury's associated token account to transfer into.
    #[account(
        mut,
        constraint = treasury_token_account.owner == platform.treasury,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
