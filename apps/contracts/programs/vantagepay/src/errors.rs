use anchor_lang::prelude::*;

#[error_code]
pub enum VantagePayError {
    #[msg("Unauthorized: caller is not the platform authority")]
    Unauthorized,
    #[msg("Unauthorized: caller is not the card owner")]
    NotCardOwner,
    #[msg("Card is frozen — cannot perform this operation")]
    CardFrozen,
    #[msg("Card is closed — cannot perform this operation")]
    CardClosed,
    #[msg("Insufficient balance for this operation")]
    InsufficientBalance,
    #[msg("Invalid fee parameters: fees must not exceed 10,000 basis points (100%)")]
    InvalidFees,
    #[msg("Card ID is too long (max 64 chars)")]
    CardIdTooLong,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Card ID cannot be empty")]
    EmptyCardId,
    #[msg("Arithmetic overflow — calculation failed")]
    Overflow,
}