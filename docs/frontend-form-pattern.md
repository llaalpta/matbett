# Frontend Form Pattern

## Scope

Defines the standard architecture and UX rules for frontend forms, with bet registration as the main high-complexity reference.

## Rules

1. Form structure:

- Use a dedicated `use*Form` hook for React Hook Form setup and defaults.
- Keep domain behavior in small hooks (`use*Logic`, `use*Calculation`, `use*Sync`).
- Do not let large form molecules accumulate domain rules, recalculation logic, and rendering concerns in one file.
- Group domain hooks by feature under `src/hooks/domain/<domain>`.
- Keep `src/hooks` limited to hook files. Feature-specific pure helpers belong inside the relevant hook file unless they are truly cross-feature.
- Prefer a shell/content split for complex forms:
  - shell creates the RHF instance and `FormProvider`
  - content consumes form context, runs domain hooks, and renders sections

1. Calculation architecture:

- Keep formulas in pure helper functions, either inside the relevant domain hook file or in `src/utils` when they are genuinely cross-feature.
- Use `useWatch`-driven hooks to react to driver field changes.
- Only write derived values back into the form from hooks.
- If a derived field becomes manually editable, manual override is temporary and must reset when any upstream driver changes.
- Avoid wrapper hooks that only return pure functions. If the helper is local to one domain, keep it inside that hook.

1. UX projection:

- Prefer scenario-specific layouts when the persistence model is more generic than the user mental model.
- Keep backend/shared contracts stable unless a domain refactor is explicitly intended.
- Hide or summarize derived fields in the main form when the same information is presented more clearly in a results table.
- Extract large cards, tables, and sub-sections into feature components before splitting logic into more wrappers.
- Keep forms operational and dense enough for efficient execution; avoid oversized card layouts and decorative spacing.
- Align section titles and section-level actions compactly when screen width allows.
- Prefer table-like presentation for review/comparison data over decorative summary cards.
- Make disabled or read-only sections explain why they are blocked.

1. Required fields:

- Use atom-level `required` support to render asterisks and warning states consistently.
- For numeric inputs that default to `0` but are effectively empty until edited, treat `0` as empty for visual guidance.
- Use tooltip icons for persistent contextual help; avoid duplicating the same help text as inline copy.

1. Effects and handlers:

- Prefer direct event handlers when a state transition can be applied at the user interaction point.
- Use `useEffect` for cross-field synchronization, async side effects, and derived write-backs from watched state.
- Do not add orchestration effects or wrapper hooks unless they carry their own responsibility.

## Bet Registration Decisions

- `single matched betting` uses a scenario-specific layout with event fields embedded in the main leg.
- Hedge selection is derived from the main selection.
- In `single matched betting`, `Stake propuesto` on the lay leg is editable, but any change in upstream drivers must restore the formula-proposed stake.
- The strategy header should keep `Cobertura`, `Tipo de estrategia`, `Formato`, and `Modo` on the same row.
- Adjustment UX is projected at leg level even though persistence remains batch-level:
  `PREPAYMENT` appears only on non-exchange legs and `UNMATCHED` only on exchange legs.
- Summary uses two tables:
  - per-leg rows (`Back`, `Lay`) with leg-local fields only;
  - a global outcomes table with row `Global` and one column per outcome (`Beneficio si gana ...`, `Yield si gana ...`).
- Total yield is calculated against real turnover, not against summed winnings.

## References

- `apps/frontend/src/hooks/useBetBatchForm.ts`
- `apps/frontend/src/hooks/domain/bets/useBetBatchStrategyLogic.ts`
- `apps/frontend/src/hooks/domain/bets/useBetBatchSummaryLogic.ts`
- `apps/frontend/src/components/molecules/bets/BetBatchForm.tsx`
- `docs/frontend-visual-direction.md`
