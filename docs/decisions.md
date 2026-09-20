# Decisions log

One entry per decision. Newest at the bottom. Status: fixed / placeholder / open.

| # | Date | Decision | Status | Notes |
|---|---|---|---|---|
| 1 | 2026-09-20 | Production frontend is Spartan UI (Angular). Prototype borrows the shadcn/ui design language: tokens, class recipes, markup. No React. | fixed | Markup should map 1:1 to Spartan Helm components. |
| 2 | 2026-09-20 | Icons: RemixIcon. | fixed | Spartan side: `@ng-icons/remixicon`. Line vs fill rule to be set in Phase 2. |
| 3 | 2026-09-20 | UI language English. Light theme only. No authentication in scope. One role (Master Admin). | fixed | See `domain.md`. |
| 4 | 2026-09-20 | Tailwind v4 via the browser build (`@tailwindcss/browser`), no build step. | fixed for prototype | The browser build cannot `@import` files, so `assets/tailwind.js` fetches `theme.css` and hands it to Tailwind. Switch to Tailwind CLI only if pages get slow. Not for production. |
| 5 | 2026-09-20 | Theme lives in one file `prototype/assets/theme.css`, imported by every page. | fixed | Tokens named exactly as shadcn (neutral preset), OKLCH values. |
| 6 | 2026-09-20 | Font: Inter via Google Fonts. | placeholder | No brand yet. Replace in Phase 2. |
| 7 | 2026-09-20 | Colours: shadcn neutral preset, near-black primary. | placeholder | No brand yet. Replace in Phase 2. Verify token set against the current Spartan theme before finalising. |
| 8 | 2026-09-20 | Behaviour via native HTML (`<dialog>`, `popover`) plus minimal vanilla JS in `app.js`. | fixed | Keeps the deliverable an HTML prototype, not an app. |
