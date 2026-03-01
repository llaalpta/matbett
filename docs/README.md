# Documentation Index

This folder contains MatBett technical documentation.

## Living Documents

These documents describe the current system and should be kept synchronized with
code changes:

- `backlog.md`: current work queue and next recommended focus.
- `promotion-logic.md`: promotion persistence model and transactional strategy.
- `frontend-form-pattern.md`: frontend form architecture and UX standard.
- `frontend-feedback-pattern.md`: frontend validation/API feedback standard.
- `frontend-visual-direction.md`: operational visual direction for frontend UI.
- `ui-consolidation-plan.md`: current UI consolidation status and remaining UI
  work.
- `codex-mcp.md`: project MCP inventory and local Codex setup reference.
- `rollover-field-to-calculation-matrix.md`: rollover field impact matrix.
- `bonus-rollover-naming-conventions.md`: canonical naming and wording.

## Functional References

These documents remain useful for domain intent or implementation details, but
they are not the next-step backlog by themselves:

- `bet-registration-implementation-plan.md`: functional source of truth for bet
  registration behavior and scenario intent.
- `lifecycle-policy-refactor-plan.md`: completed lifecycle/status policy
  refactor record plus deferred validation scenarios.

## Historical Plans And Audits

These files capture past implementation planning or audits. Do not treat their
open checkboxes as current work until they are revalidated against code and moved
to `backlog.md`:

- `bet-registration-tracking-recalc-plan.md`
- `bet-registration-domain-refactor-plan.md`
- `prisma-participations-audit.md`
- `promotions-table-refinement-plan.md`

## Scope Rule

Keep active, decision-grade guidance in living documents. Historical plans can
remain for traceability, but current priorities must be consolidated in
`backlog.md`.

## Style Guide

All living documents should follow:

1. English language.
2. Clear scope section.
3. Operationally useful content: decisions, rules, commands, references.
4. No duplicated roadmap or checklist fragments across files.
