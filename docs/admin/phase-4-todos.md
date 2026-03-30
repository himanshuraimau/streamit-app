# Phase 4 Todos

Last updated: 2026-03-30
Scope: finance dashboard, transaction investigation, withdrawals queue, commission config, reconciliation

## Completed

- [x] Backend: finance summary endpoint (`GET /api/admin/finance/summary`).
- [x] Backend: finance transactions endpoint (`GET /api/admin/finance/transactions`).
- [x] Backend: withdrawal queue endpoint (`GET /api/admin/finance/withdrawals`).
- [x] Backend: withdrawal review endpoint (`POST /api/admin/finance/withdrawals/:withdrawalId/review`).
- [x] Backend: commission config endpoints (`GET/PATCH /api/admin/finance/config/commission`).
- [x] Backend: reconciliation endpoint (`GET /api/admin/finance/reconciliation`).
- [x] Backend: role protection added for commission config update (SUPER_ADMIN only).
- [x] Backend: Prisma schema updated with `CreatorWithdrawalRequest` and `WithdrawalStatus`.
- [x] Backend: migration file added for withdrawal table and admin action enum updates.
- [x] Frontend: finance page added with summary metrics, transactions panel, withdrawals queue, and reconciliation cards.
- [x] Frontend: commission config editor wired to backend API.
- [x] Frontend: withdrawal action buttons wired (approve/reject/hold/release/mark paid).
- [x] Frontend: finance routes added (`/finance/wallet`, `/finance/withdrawals`).
- [x] Frontend: finance navigation added to admin shell.
- [x] Validation: backend Prisma client regenerated.
- [x] Validation: backend typecheck with Bun passed.
- [x] Validation: admin frontend build with Bun passed.

## Bun Commands Used

- [x] `bun run db:generate` (backend)
- [x] `bun run typecheck` (backend)
- [x] `bun run build` (admin-frontend)

## Follow-Up Items

- [x] Add creator-facing API and UI flow to submit withdrawal requests.
- [ ] Add backend integration tests for withdrawal state transitions and permission checks.
- [ ] Add seeded finance fixtures for local QA with realistic withdrawal queue data.
- [ ] Add CSV export for transactions and reconciliation snapshots.
