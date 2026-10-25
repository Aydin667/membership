# MEMBERSHIP

**Coins that pay for things holders actually use.**

MEMBERSHIP is a launchpad concept where projects route a defined share of creator/trading fees into a transparent holder-utility budget. Creators configure membership tiers using holdings + hold duration, choose a benefit stack, and publish the rules at launch.

## MVP features
- Holder tiers based on USD holdings and days held
- Fee-funded benefit stacks
- Gas Pass / Holder Terminal / Wallet Shield / Partner Perks modules
- Funding-coverage simulator
- Public membership-program rules receipt with SHA-256 fingerprint
- Phantom browser wallet connection intent
- Security headers, request limits, body-size limits, input validation
- Responsive SaaS/fintech frontend

## Demo boundaries
This MVP does **not** custody funds, verify live token balances, route creator fees on mainnet, pay vendors, sponsor real transactions, or enforce access onchain. Those require audited Solana programs, token/RPC indexing, vendor integrations, metered benefit delivery, and production persistence.

## Run
```bash
npm test
npm start
```
