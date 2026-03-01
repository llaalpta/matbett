# Frontend Visual Direction

## Scope

Defines the visual and interaction direction for MatBett frontend work.

This project should feel like a professional finance/operations tool, not a
marketing site.

## Core Intent

The UI should feel:

- operational
- clear
- trustworthy
- dense enough for efficient use
- optimized for scanning data and reviewing statuses
- safe for workflows where mistakes matter

The visual goal is not novelty. The visual goal is fast comprehension,
low-error interaction, and stable repeatable use.

## Primary Priorities

1. Readability
2. Clear hierarchy
3. Consistent forms
4. Strong data tables
5. Obvious status colors
6. Safe interaction patterns
7. Low visual noise

## Explicit Avoids

Do not introduce:

- flashy gradients
- oversized cards
- decorative-only UI
- trendy startup marketing aesthetics
- excessive whitespace that reduces data density
- oversized typography that weakens information hierarchy

## General UI Rules

- Prefer restrained surfaces, borders, separators, and typography over
  decoration.
- Favor compact spacing that still preserves legibility.
- Keep page rhythm tight and intentional; avoid large empty blocks between
  operational sections.
- Use cards only when they add grouping clarity. Do not wrap every section in a
  large padded card by default.
- Prefer simple neutral backgrounds and consistent section framing.
- Use emphasis sparingly so that real alerts, totals, and state changes remain
  visible.

## Hierarchy

- Page titles should be concise and operational.
- Put key actions near the title or section header, not floating far away.
- Show context first, then controls, then details.
- Use short explanatory copy and only where it reduces mistakes.
- Do not let helper text compete visually with primary data.

## Forms

- Forms must feel consistent across promotions, rewards, qualify conditions,
  deposits, and bets.
- Keep labels, required markers, field widths, and spacing predictable.
- Group related fields tightly.
- Use read-only and disabled states clearly, with reasons visible when the user
  cannot act.
- Avoid long vertical stacks of oversized controls when a denser grouped layout
  works.
- Prefer compact section headers with actions aligned on the same row when
  screen width allows.
- On smaller screens, collapse that layout vertically without changing meaning.

## Tables and Data Presentation

- Prefer tables over card grids for operational datasets.
- Lists intended for review, comparison, or tracking should default to a table
  mental model.
- Table columns should prioritize:
  - identity
  - status
  - dates
  - amounts
  - progress
  - available actions
- Numeric values should align consistently and use compact, comparable formats.
- Operational tables should prefer compact rows, restrained emphasis, and short
  secondary lines over spacious card-like presentation.
- Totals, yields, balances, and risk/profit figures should be easy to compare at
  a glance.
- Expansions and nested details should support audit/review workflows, not
  decorative disclosure.
- Avoid rendering nested tables inside extra cards when the parent table already
  provides enough framing.

## Status Semantics

Status colors must be semantically consistent across entities.

- Green: completed, fulfilled, used, success
- Amber: pending, qualifying, in progress, warning-state workflow
- Blue: informational active state, received, in use, neutral-progress context
- Red: failed, expired, destructive, blocking issues
- Gray: inactive, disabled, archived, structural non-actionability

Do not reuse status colors loosely between domains. A color should mean the same
kind of thing everywhere.

## Interaction Safety

- Destructive actions must be visually distinct from primary actions.
- Show why an action is disabled when the user can reasonably expect it to be
  available.
- Prefer clear confirmations for destructive operations, not for normal save
  flows.
- When status or lifecycle restrictions apply, explain them close to the
  blocked section.
- Favor stable explicit actions over hidden or surprising behaviors.

## Noise Control

- Minimize duplicate helper copy.
- If the same explanation is already visible in context, do not restate it in a
  second banner or paragraph.
- Use alerts for true warnings, not routine instructions.
- Avoid icon overload.
- Avoid color-heavy UI when typography and layout already communicate enough.

## Bet Registration Notes

- Bet registration should behave like an execution tool.
- Scenario context, target participation, stake proposal, totals, and outcomes
  must be visually obvious before secondary details.
- Dense summary tables are preferred over decorative summary cards.
- Contextual launchers from rewards and qualify conditions should be compact,
  operational entry points, not promotional banners.

## Delivery Rule

When making frontend changes, prefer incremental alignment with this direction
over isolated one-off styling tweaks.

If a new screen or refactor introduces a better operational pattern, reuse it in
later screens instead of inventing a new visual language.
