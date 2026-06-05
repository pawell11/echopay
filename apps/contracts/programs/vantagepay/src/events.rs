use anchor_lang::prelude::*;

/// Emitted when a new virtual card is registered on-chain.
#[event]
pub struct CardRegistered {
    pub card_id: String,
    pub owner: Pubkey,
    pub timestamp: i64,
}

/// Emitted whenever a top-up is processed, including fee and cashback breakdown.
#[event]
pub struct TopUpProcessed {
    pub card_id: String,
    pub amount: u64,
    pub fee: u64,
    pub cashback: u64,
    pub currency: String, // "SOL", "USDT", "ECHO"
    pub timestamp: i64,
}

/// Emitted when a virtual card is closed.
#[event]
pub struct CardClosed {
    pub card_id: String,
    pub owner: Pubkey,
    pub timestamp: i64,
}

/// Emitted when the platform state is initialized.
#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub echo_mint: Pubkey,
    pub fee_basis_points: u16,
    pub echo_fee_basis_points: u16,
    pub cashback_basis_points: u16,
    pub timestamp: i64,
}

/// Emitted when fee parameters are updated.
#[event]
pub struct FeesUpdated {
    pub old_fee_basis_points: u16,
    pub new_fee_basis_points: u16,
    pub old_echo_fee_basis_points: u16,
    pub new_echo_fee_basis_points: u16,
    pub old_cashback_basis_points: u16,
    pub new_cashback_basis_points: u16,
    pub timestamp: i64,
}