# Architecture

The MVP is dependency-light: Node's HTTP server serves a static frontend and JSON API. Demo state is stored in `data/store.json`.

## Production components
1. Solana balance/indexing service for wallet holdings and holding-duration history.
2. Audited fee-router / treasury programs with immutable or timelocked program rules.
3. Vendor adapters for gas sponsorship, analytics, security services, partner credits and events.
4. Postgres for programs, members, usage ledgers, receipts and provider invoices.
5. Redis/rate limits, job workers and webhook verification for recurring benefit delivery.
6. Authenticated wallet-signature sessions and replay protection.
7. Usage metering so benefits cannot exceed funded budgets.

## Core rule
A membership program must never promise a benefit that is not currently funded or contractually available. Coverage must be public and benefit delivery should fail closed when budget or provider availability is exhausted.
