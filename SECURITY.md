# Security Policy

## Reporting a Vulnerability

**Do not open a public issue.** Send details to:

- **Email**: security@vantagepay.cards
- **Telegram**: @VantagePaySol

We respond within 48 hours. Please include:

- Description of the vulnerability
- Steps to reproduce
- Affected component (contracts, web, API)
- Your Solana wallet address (for bounty eligibility)

## Scope

| Component | Path | Priority |
|-----------|------|----------|
| Smart Contracts | `apps/contracts/programs/vantagepay/` | Critical |
| API Routes | `apps/web/src/app/api/` | High |
| Web Dashboard | `apps/web/src/app/dashboard/` | Medium |
| UI Components | `packages/ui/` | Low |

## Security Model

### Smart Contracts

- All arithmetic uses checked math (`checked_add`, `checked_mul`, etc.)
- Accounts use PDA seeds for deterministic, non-colliding derivation
- All mutable instructions require signer authority verification
- Fee parameters are capped at 10,000 basis points (100%)
- Card status is enforced before any operation (frozen/closed cards rejected)
- Card ID length is bounded at 64 bytes

### API

- Protected routes require `x-wallet-address` header
- Card details (full PAN, CVV) only returned from `/api/card/[id]` — never from list
- Sensitive card data never logged
- Phase 2: SIWS (Sign In With Solana) for cryptographic auth

### Frontend

- No secrets in client-side code — all API keys are server-side
- Wallet connections use audited `@solana/wallet-adapter` libraries
- Environment variables prefixed with `NEXT_PUBLIC_` are intentionally public

## Bounty Program

Coming in Phase 3. For now, critical vulnerabilities reported responsibly will be acknowledged publicly.

## Audit Status

- Internal review: May 2026
- External audit: Planned (Phase 3)
- Security contact: security@vantagepay.cards
