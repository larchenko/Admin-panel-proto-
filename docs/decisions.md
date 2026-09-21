# Decisions log

One entry per decision. Newest at the bottom. Status: fixed / placeholder / open.

| # | Date | Decision | Status | Notes |
|---|---|---|---|---|
| 1 | 2026-09-20 | Production frontend is Spartan UI (Angular). Prototype borrows the shadcn/ui design language: tokens, class recipes, markup. No React. | fixed | Markup should map 1:1 to Spartan Helm components. |
| 2 | 2026-09-20 | Icons: RemixIcon. | fixed | Spartan side: `@ng-icons/remixicon`. Line vs fill rule to be set in Phase 2. |
| 3 | 2026-09-20 | UI language English. Light theme only. No authentication in scope. One role (Master Admin). | fixed | See `domain.md`. |
| 4 | 2026-09-20 | Tailwind v4 via the browser build (`@tailwindcss/browser`), no build step. | fixed for prototype | The browser build cannot `@import` files, so `assets/tailwind.js` fetches `theme.css` and hands it to Tailwind. Switch to Tailwind CLI only if pages get slow. Not for production. |
| 5 | 2026-09-20 | Theme lives in one file `prototype/assets/theme.css`, imported by every page. | fixed | Tokens named exactly as shadcn (neutral preset), OKLCH values. |
| 6 | 2026-09-20 | Font: Inter via Google Fonts. | placeholder | No brand yet. Replace when a brand exists. |
| 7 | 2026-09-20 | Colours: shadcn neutral preset, near-black primary. | placeholder | No brand yet. Replace when a brand exists. Token set verified against spartan.ng/documentation/theming on 2026-09-20: identical names, OKLCH. Added `--destructive-foreground` and `--chart-1..5` for parity. |
| 8 | 2026-09-20 | Behaviour via native HTML (`<dialog>`, `popover`) plus minimal vanilla JS in `app.js`. | fixed | Keeps the deliverable an HTML prototype, not an app. |
| 9 | 2026-09-20 | Base text size 14px (`text-sm`) on the body; three weights 400/500/600. Type roles listed on `kit/foundations.html`. | fixed | shadcn convention for dense admin UIs. |
| 10 | 2026-09-20 | Icons: line variant by default; fill only for active nav / selected state. Sizes 16px inline, 20px nav and toolbar, 30px+ empty states. Icon-only controls need `aria-label` + tooltip. | fixed | One icon per meaning, vocabulary on `kit/foundations.html`. |
| 11 | 2026-09-20 | Elevation: borders for content on the page; shadow only for floating layers (popover `shadow-md`, dialog `shadow-lg`, subtle `shadow-xs` on buttons/inputs). | fixed | Mirrors shadcn defaults. |
| 12 | 2026-09-20 | Components are written as short recipe classes in `assets/components.css` (`btn btn-outline btn-sm`), composed with `@apply` from the same utilities shadcn uses. | fixed | Readable markup, one place to change a component, literal mapping to Helm inputs (`hlmBtn variant="outline" size="sm"`). `tailwind.js` now loads `theme.css` + `components.css`. |
| 13 | 2026-09-20 | Button: six variants (default, secondary, outline, ghost, destructive, link), three sizes (sm 32, default 36, lg 40) plus icon. One default per view; destructive only inside confirmations; verb labels. | fixed | Matches shadcn/Spartan names exactly. |
| 14 | 2026-09-21 | Form controls are native HTML elements (`input`, `textarea`, checkbox, radio, checkbox-as-switch) styled with recipes. | fixed for prototype | Keyboard and screen-reader behaviour for free. Spartan replaces them with hlm-checkbox etc.; closed states match. Select excluded, see 17. |
| 15 | 2026-09-21 | Field anatomy: label above, control, then description OR error (error replaces description). Fields required by default; exceptions marked "Optional" in the label. No asterisks. Validate on blur and submit. | fixed | Helper/description text is `text-xs` per foundations (shadcn uses `text-sm`); dev should keep `text-xs`. |
| 16 | 2026-09-21 | Switch only for settings that apply immediately. Inside a form with Save use a checkbox. Read-only for system-owned values, disabled for temporarily uneditable ones. | fixed | |
| 17 | 2026-09-21 | Select is a custom component (trigger button + listbox, behaviour in `app.js`), not the native `<select>`. | fixed | User requirement: identical look in every browser. Value is carried by a hidden input. |
| 18 | 2026-09-21 | `.field` uses `content-start`, `.field-row` uses `items-start`, so fields in a row align to the top even when one shows an error. | fixed | Fixes labels drifting when a sibling field is taller. |
| 19 | 2026-09-21 | Added semantic status tokens `--success`, `--warning`, `--info` (+ `-foreground`) to the theme. Not part of shadcn; added the way Spartan documents custom colours. | fixed | Values are 600–700 shades so they work as text on a 10% tint. |
| 20 | 2026-09-21 | Card: no shadow, `rounded-lg`, title `font-medium` (shadcn: `shadow-sm`, `rounded-xl`, `font-semibold`). Anatomy and class names otherwise as shadcn. | fixed | Follows foundations decisions 9 and 11. |
| 21 | 2026-09-21 | Badge: four shadcn variants + soft `badge-success/-warning/-info` for statuses. Status is always a badge in its own column; dot only on "alive" states; `badge-destructive` (solid) for failures. Status vocabulary is a proposal until lifecycle statuses are confirmed. | fixed | |
| 22 | 2026-09-21 | Table: bordered wrapper, 40px rows, header on `bg-muted/40`, cell padding `px-3` with `px-4` on outer cells (shadcn: `p-2`). Name column medium weight and links to detail; identifiers mono; numbers right-aligned `tabular-nums`; row actions behind one More button; sortable headers are buttons with `aria-sort`. | fixed | List-view toolbar and footer patterns documented alongside. |
