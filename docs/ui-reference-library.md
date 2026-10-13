# UI Reference Library for Mr.Z Trading Journal

Updated: 2026-10-13

This document records reusable design and implementation lessons from the requested reference sites. Treat these as product direction and pattern notes, not as copied source code. Do not copy proprietary UI or paid assets directly.

## Product Fit

Mr.Z Trading Journal is an operating tool for traders. The best references are dense, calm, high-contrast app patterns: dashboards, tables, settings, calendars, command actions, modals, filters, charts, and import/export workflows.

Keep the app identity:

- Near-black workspace with charcoal panels.
- Gold accent for primary selection and premium identity.
- Purple section labels for analytical modules.
- Green/red/yellow chart language for profit, stop loss, and commission.
- Compact controls, fast scanning, minimal decoration.

## Source Notes

### Untitled UI React

Use as the strongest structural reference for component architecture.

- Good for: tables, tabs, filter bars, date pickers, modals, drawers, page headers, settings pages, dashboards, charts, empty states, file uploaders, and accessible form controls.
- Engineering lesson: components should be built from accessible primitives and controlled state. Their docs emphasize React, TypeScript, Tailwind, and React Aria, but our app can apply the same ideas with existing React/CSS.
- Design lesson: make each page from reusable primitives: `Header`, `Panel`, `Field`, `Table`, `Modal`, `Toolbar`, `ChartWrap`.
- Apply to our app:
  - Standardize buttons into primary, default, danger, icon-only.
  - Make imports, exports, delete/reset actions use consistent confirmation and disabled states.
  - Build future Date Picker / Calendar / Modal patterns with keyboard and focus behavior in mind.

### Uiverse

Use as a motion and micro-interaction idea bank, not as the main design system.

- Good for: button hover states, loading states, tooltips, small form interactions, card affordances, skeleton loaders, and copy-paste prototypes.
- Risk: many examples are decorative, neon, glass, or attention-heavy. Use only if toned down into the trading-desk theme.
- Apply to our app:
  - Subtle hover lift on tool buttons.
  - Skeleton loading for charts/tables instead of empty flicker.
  - Tiny confirmation animations after save/import/export.
  - Tooltips for compact chart/table icons.

### CodeShack Snippets

Use as implementation pattern reference for specific web interactions.

- Good for: modal/dialog, native popover/dropdown, live validation, custom select, autocomplete, date picker, resizable panes, loading progress, tooltips, responsive timeline, and bar chart snippets.
- Apply to our app:
  - Form validation should show inline recovery text near fields.
  - Import/export should use native file input but styled as a normal action button.
  - Future analytics builder can use searchable selects and tabs.
  - Calendar lightbox can use native dialog-style focus trapping behavior.

### Dribbble Free Code

Use as visual inspiration only.

- Good for: seeing composition trends, login/register layouts, settings mockups, mobile density, and visual hierarchy.
- Risk: shots are often portfolio visuals, not production workflows. Do not copy screens or rely on Dribbble as proof of usability.
- Apply to our app:
  - Use sparingly for visual hierarchy ideas.
  - Prefer actual product patterns from Mobbin for workflows.
  - Keep our charts/tables more functional than promotional.

### Figma Community

Use for design-system and dashboard kit research.

- Good for: dashboard kits, admin templates, chart kits, component variants, spacing systems, light/dark mode organization.
- Risk: licenses vary by file and creator. Duplicate or inspect only when license allows; do not import unknown assets into production.
- Apply to our app:
  - Create reusable component variants before adding more one-off UI.
  - Keep design tokens explicit: color, radius, spacing, type, chart palette.
  - Use Figma kit ideas to plan component states: default, hover, active, disabled, loading, error, empty.

### Mobbin

Use as workflow evidence from shipped mobile/web products.

- Good for: comparing real apps by screen, UI element, and flow; onboarding, search, settings, account, subscription, calendar, and analytics patterns.
- Risk: Mobbin is for research and screenshots, not code reuse.
- Apply to our app:
  - Study flows, not single screens: add trade, edit trade, import/export, account switch, reset portfolio, calendar day detail.
  - Mobile layout should use task-first stacking: active portfolio, primary action, filters, content.
  - Calendar day click should open a detailed overlay with summary first, then individual trades.

## Rules For This App

1. Keep the first screen usable, not decorative.
2. New UI must support desktop and mobile from the first implementation.
3. Tables need scan priority: date, result, setup, P&L, chart links, action.
4. Forms should auto-fill defaults and calculations whenever possible.
5. Every destructive action needs confirmation and clear copy.
6. Every import/export action needs a clear target portfolio and mode.
7. Charts should answer one question each. Avoid visual effects that reduce readability.
8. Motion should communicate state: loading, saved, imported, focused, expanded.
9. Do not add a component style unless it can be reused.
10. Do not copy proprietary code or private Figma assets.

## Backlog Ideas

- Build a reusable `Dialog` component for Calendar day detail, delete/reset confirmations, import result review, and chart link previews.
- Build a reusable `DataToolbar` with search, filters, date range, saved views, and export action.
- Build a reusable `MetricCard` variant for profit/loss, count, percentage, RR, and duration.
- Add import preview before committing trades: count rows, invalid rows, date range, asset mix, target portfolio.
- Add analytics builder presets: Session Edge, LTF Entry Receive, Time Edge, Rule Violations, Psychology, Commission Drag.
- Add skeleton states for Dashboard, Analytics, History, and Calendar while data loads.
- Add keyboard-friendly modal close, focus return, and escape behavior.
- Add saved dashboard views so the user can decide which chart blocks appear.

## Reference Links

- Untitled UI React: https://www.untitledui.com/react/docs/introduction
- Dribbble Free Code: https://dribbble.com/tags/free-code
- Uiverse: https://uiverse.io/
- Figma Community: https://www.figma.com/community?fuid=1656137668980084492
- CodeShack snippets: https://codeshack.io/snippets/
- Mobbin iOS apps: https://mobbin.com/discover/apps/ios/latest
