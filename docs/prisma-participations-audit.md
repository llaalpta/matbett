# Prisma Participations Audit

## Status

Historical audit. The participation model has since been implemented further
than this checklist indicates. Do not treat unchecked items here as current
backlog without verifying the code first.

Current work should be tracked in `docs/backlog.md`.

## Estado actual (2026-03-01)
- `Bet` y `Deposit` ya son entidades core (sin `qualifyConditionId`/`usageTrackingId` directos).
- El contexto promocional vive en tablas de participacion:
  - `bet_participations`
  - `deposit_participations`
- Migraciones aplicadas desde cero con `prisma reset` OK.
- `shared` ya expone schemas/tipos de participacion para bets y deposits.
- Backend de depositos ya opera en modo participaciones (create/update/delete contextual).
- Frontend de depositos ya consume `participations` en payload y listados.

## Modelo implantado

### `BetParticipation` (N:1 con `Bet`)
- `role` (`QUALIFY_TRACKING` | `REWARD_USAGE`)
- FK a `bet`, `promotion`, `phase?`, `reward`, `qualifyCondition?`, `usageTracking?`
- Campos de contribucion: `countsAsAttempt`, `isSuccessful`, `stakeAmount`, `rolloverContribution`, `progressAfter`

### `DepositParticipation` (N:1 con `Deposit`)
- `role` (actualmente `QUALIFY_TRACKING`)
- FK a `deposit`, `promotion`, `phase?`, `reward?`, `qualifyCondition`
- Campo `countsAsQualification`

## Integridad referencial disponible
- FKs explicitas desde participaciones a jerarquia promocional.
- Indices operativos:
  - `bet_participations(role, promotionId)`
  - `bet_participations(rewardId, role)`
  - `bet_participations(qualifyConditionId)`
  - `bet_participations(usageTrackingId)`
  - `deposit_participations(role, promotionId)`
  - `deposit_participations(qualifyConditionId)`

## Checklist de implementación
- [x] Crear tablas `bet_participations` y `deposit_participations` en Prisma.
- [x] Eliminar campos legacy contextuales directos en `Bet` y `Deposit`.
- [x] Adaptar `shared` para participaciones de bets/deposits.
- [x] Adaptar backend de depósitos para operar vía participaciones.
- [x] Adaptar frontend de depósitos para leer/escribir `participations`.
- [ ] Implementar registro de apuestas (batch/hedge) persistiendo `Bet` + `BetParticipation` en una sola transacción.
- [ ] Adaptar tracking de uso de reward y tracking de qualify de tipo BET/LOSSES para consumir participaciones de apuesta.
- [ ] Añadir constraints de integridad por rol a nivel DB (CHECK/unique según política final).
- [ ] Añadir tests de consultas complejas (listados por promoción/fase/reward y agrupaciones).

## Pendientes de diseño (decisiones)
- Definir si `usageTrackingId` en `BetParticipation` será obligatorio para `REWARD_USAGE` (o si basta `rewardId` + resolución posterior).
- Confirmar si una `DEPOSIT` qualify condition seguirá siendo estrictamente 1 depósito (para llevar la unicidad a DB) o permitirá múltiples depósitos.

## Checks ejecutados (2026-03-01)
- `pnpm --filter backend prisma:migrate -- --name add_bet_deposit_participations` OK
- `pnpm --filter backend prisma:reset` OK
- `pnpm --filter backend prisma:generate` OK
- `pnpm -r typecheck` OK
- `pnpm --filter frontend ts` OK
- `pnpm --filter @matbett/shared lint` OK
- `pnpm --filter backend lint` OK
- `pnpm --filter frontend lint` OK
