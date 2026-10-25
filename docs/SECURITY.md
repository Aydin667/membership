# Security notes

The demo includes CSP, X-Frame-Options, nosniff, referrer policy, permissions policy, input sanitization, request-size limits and simple per-IP rate limiting.

Before mainnet:
- Audit fee-routing and gas-sponsorship programs.
- Verify wallet signatures server-side with nonce expiry and replay protection.
- Index token balances independently; never trust client-submitted holdings.
- Add Sybil controls where perks are scarce or high-value.
- Meter benefit usage per wallet and per tier.
- Verify all vendor webhooks with signatures and idempotency keys.
- Store no private keys in the frontend or repository.
- Separate treasury authority from deployment authority and use multisig/timelocks.
- Add abuse controls for referral/partner redemptions and anti-bot protections.
