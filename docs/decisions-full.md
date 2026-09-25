# Decisions log — full text

The wording and the reasoning behind each line of `decisions.md`. The status of a decision lives only there. Look one up with `python3 scripts/decisions.py show <number>`; do not read this file whole.

## 1 · 2026-09-20

Production frontend is Spartan UI (Angular). Prototype borrows the shadcn/ui design language: tokens, class recipes, markup. No React.

**Why.** Markup should map 1:1 to Spartan Helm components.

## 2 · 2026-09-20

Icons: RemixIcon.

**Why.** Spartan side: `@ng-icons/remixicon`. Line vs fill rule: decision&nbsp;10.

## 3 · 2026-09-20

UI language English. Light theme only. No authentication in scope. One role (Master Admin).

**Why.** See `domain.md`.

## 4 · 2026-09-20

Tailwind v4 via the browser build (`@tailwindcss/browser`), no build step.

**Why.** The browser build cannot `@import` files, so `assets/tailwind.js` fetches `theme.css` and hands it to Tailwind. Switch to Tailwind CLI only if pages get slow. Not for production.

## 5 · 2026-09-20

Theme lives in one file `prototype/assets/theme.css`, imported by every page.

**Why.** Tokens named exactly as shadcn (neutral preset), OKLCH values.

## 6 · 2026-09-20

Font: Archivo via Google Fonts, weights 400/500/600.

**Why.** Chosen 2026-09-21, replacing the Inter placeholder. Loaded with one `<link>` per page; production should self-host the variable file.

## 7 · 2026-09-20

Colours: shadcn neutral preset, near-black primary.

**Why.** Token set verified against spartan.ng/documentation/theming on 2026-09-20: identical names, OKLCH. Added `--destructive-foreground` and `--chart-1..5` for parity.

## 8 · 2026-09-20

Behaviour via native HTML (`<dialog>`, `popover`) plus minimal vanilla JS in `app.js`.

**Why.** Keeps the deliverable an HTML prototype, not an app.

## 9 · 2026-09-20

Base text size 14px (`text-sm`) on the body; three weights 400/500/600. Type roles listed on `kit/foundations.html`.

**Why.** shadcn convention for dense admin UIs.

## 10 · 2026-09-20

Icons: line variant by default; fill only for active nav / selected state. Sizes 16px inline, 20px nav and toolbar, 30px+ empty states. Icon-only controls need `aria-label` + tooltip.

**Why.** One icon per meaning, vocabulary on `kit/foundations.html`.

## 11 · 2026-09-20

Elevation: borders for content on the page; shadow only for floating layers (popover `shadow-md`, dialog `shadow-lg`, subtle `shadow-xs` on buttons/inputs).

**Why.** Mirrors shadcn defaults.

## 12 · 2026-09-20

Components are written as short recipe classes in `assets/components.css` (`btn btn-outline btn-sm`), composed with `@apply` from the same utilities shadcn uses.

**Why.** Readable markup, one place to change a component, literal mapping to Helm inputs (`hlmBtn variant="outline" size="sm"`). `tailwind.js` now loads `theme.css` + `components.css`.

## 13 · 2026-09-20

Button: six variants (default, secondary, outline, ghost, destructive, link), three sizes (sm 32, default 36, lg 40) plus icon. One default per view; destructive only inside confirmations; verb labels.

**Why.** Matches shadcn/Spartan names exactly.

## 14 · 2026-09-21

Form controls are native HTML elements (`input`, `textarea`, checkbox, radio, checkbox-as-switch) styled with recipes.

**Why.** Keyboard and screen-reader behaviour for free. Spartan replaces them with hlm-checkbox etc.; closed states match. Select excluded, see 17.

## 15 · 2026-09-21

Field anatomy: label above, control, then description OR error (error replaces description). Fields required by default; exceptions marked "Optional" in the label. No asterisks. Validate on blur and submit.

**Why.** Helper/description text is `text-xs` per foundations (shadcn uses `text-sm`); dev should keep `text-xs`.

## 16 · 2026-09-21

Switch only for settings that apply immediately. Inside a form with Save use a checkbox. Read-only for system-owned values, disabled for temporarily uneditable ones.

## 17 · 2026-09-21

Select is a custom component (trigger button + listbox, behaviour in `app.js`), not the native `<select>`.

**Why.** User requirement: identical look in every browser. Value is carried by a hidden input.

## 18 · 2026-09-21

`.field` uses `content-start`, `.field-row` uses `items-start`, so fields in a row align to the top even when one shows an error.

**Why.** Fixes labels drifting when a sibling field is taller.

## 19 · 2026-09-21

Added semantic status tokens `--success`, `--warning`, `--info` (+ `-foreground`) to the theme. Not part of shadcn; added the way Spartan documents custom colours.

**Why.** Values are 600–700 shades so they work as text on a 10% tint.

## 20 · 2026-09-21

Card: no shadow, `rounded-lg`, title `font-medium` (shadcn: `shadow-sm`, `rounded-xl`, `font-semibold`). Anatomy and class names otherwise as shadcn.

**Why.** Follows foundations decisions 9 and 11.

## 21 · 2026-09-21

Badge: four shadcn variants + soft `badge-success/-warning/-info` for statuses. Status is always a badge in its own column; dot only on "alive" states; `badge-destructive` (solid) for failures. Status vocabulary is a proposal until lifecycle statuses are confirmed.

## 22 · 2026-09-21

Table: 40px rows, header on `bg-muted/40`, cell padding `px-3` with `px-4` on outer cells (shadcn: `p-2`). Name column medium weight and links to detail; identifiers mono; numbers right-aligned `tabular-nums`; row actions behind one More button; sortable headers are buttons with `aria-sort`.

**Why.** List-view toolbar and footer patterns documented alongside. Audited 2026-09-21: what is left of this row in the built list is the `bg-muted/40` header band, the Name column in medium weight linking to the detail page, right-aligned `tabular-nums` numbers, one More button per row and sortable headers as buttons with `aria-sort`. Rows are 53px, not 40 (40, then 46); every cell is `px-3`, with no `px-4` on the outer ones (55); the header's own type is now the overline role (77). `identifiers mono` held while the list carried ISIN and the rest — the one identifier left in the list is the Bloomberg code (51) and it is set in Archivo, not mono; mono is now a record-view rule only.

## 23 · 2026-09-21

Brand colour `#200766` = `oklch(0.260 0.145 281.533)` becomes `--primary`. Greys stay pure neutral (chroma 0). The brand hue 281.5 is reused for `--ring`, `--accent` (selected rows, 4% tint), `--sidebar-accent`.

**Why.** White on the brand reads 16.4:1, so it needs no adjustment as a button fill. Keeping the greys neutral means the brand is the only colour on a data-heavy screen; a tinted grey ramp stays available if the UI later looks too cold. `--chart-1..5` are still the shadcn defaults and must be rebuilt from the brand when the first chart appears.

## 24 · 2026-09-21

Status colours as given: red `#C03347`, yellow `#D09425`, green `#33A35E`. Each status now carries three tokens: `--x` (the colour: dots, solid fills), `--x-foreground` (text on a solid fill), `--x-ink` (text on the 10% tint used by soft badges).

**Why.** One colour cannot do all three jobs: as text the brand green reaches 2.9:1 and the yellow 2.4:1. The ink shade is the same hue darkened until it clears 4.5:1 on its own tint. The dot keeps the full-strength colour — it is decorative, the label carries the meaning. `info` had no value of its own; see 31 for where it ended up. Contrast is measured live on `kit/foundations.html`.

## 25 · 2026-09-23

The logo is `prototype/assets/logo.svg` (mark + “viz”), used as delivered. Sidebar header at 28px tall; the collapsed rail shows the mark alone, stacked over the toggle, and the nav moves down 36px with it (accepted). The mark alone, `logo-mark.svg`, is the favicon and the kit-sidebar brand. Replaces the 2026-09-21 wordmark placeholder.

**Why.** Asset URLs carry `?v=<date>` — bump it when the artwork changes, so browsers drop the cached copy.

## 26 · 2026-09-21

Raised: `--border` and `--input` were both `oklch(0.922 0 0)`, 1.26:1 against the page, below the 3:1 WCAG 1.4.11 asks for a line that is the only thing marking a control.

## 27 · 2026-09-21

`--input` darkened to `oklch(0.668 0 0)` — the lightest grey that clears 3:1 against the page. `--border` stays at `oklch(0.922 0 0)`.

**Why.** The two tokens now mean different things: `--input` is the boundary of a control the user must find (input, textarea, select, checkbox, radio, outline button), `--border` only separates content that is already visible (card edges, table rules, dividers). Darkening both would turn every screen into a grid. Deviation from shadcn, and the reason is on `kit/foundations.html`. Side effect: the off state of a switch (`bg-input`) is now a proper mid-grey instead of a near-white track.

## 28 · 2026-09-21

`--radius: 0.25rem` (4px), down from shadcn's 10px. Steps stay shadcn's (base−4 / −2 / base / +4), giving 0 / 2 / 4 / 8px: buttons, inputs, badges and checkboxes 2px, cards and tables 4px.

**Why.** Deliberately technical rather than friendly — this is a financial back office. The step formula is untouched, so a developer changes one number in the Spartan theme. Checkbox was shadcn's hardcoded `rounded-[4px]`; it now uses `rounded-md` so it follows the base.

## 29 · 2026-09-21

Density stays at shadcn defaults: controls 32/36/40px, table rows 40px, base text 14px.

**Why.** Revisit together with the table work below. Audited 2026-09-21: controls (32/36/40) and base text (14px) hold. `table rows 40px` does not — two-level cells put the list at 53px (40, then 46). 40px is still the height of the header row and of a single-level table. 46 raised rows to 53px for the second line; 108 removes the second line, so the 40px row stands again.

## 30 · 2026-09-21

Open: a table cell that carries two related values in one column (e.g. ISIN above the instrument name).

**Why.** Raised 2026-09-21, to be designed later. It changes row height, so density (29) is settled only after this.

## 31 · 2026-09-21

Status colours are never derived from, tinted with, or replaced by the brand. `theme.css` is split into a BRAND layer (`--primary`, `--accent`, `--ring`, three `--sidebar-*`) and a SYSTEM layer (neutrals, lines, all four statuses); a white-label swap replaces the first and leaves the second alone. `--info` therefore becomes a plain blue `oklch(0.500 0.160 240)` (#006AB4) instead of the brand hue lightened.

**Why.** A status describes the state of the system, not who owns the product: if green turns violet because a client's brand is violet, the colour carries no information and every badge has to be read word by word. Corollary, written into the theme file: if a client's brand lands on a status hue, the brand moves in the UI, not the status. Also blocks status badges from using `badge-default` / `badge-secondary`.

## 32 · 2026-09-21

`Market data` and `Performance` are one section with one shared header (Source, DataBasedOn, LastUpdate, Refresh data, ErrorMessage) and one Refresh button for both.

**Why.** Source and DataBasedOn describe where the whole section's numbers come from, so they cannot live inside either block. One refresh means one freshness stamp; two refresh cycles would let a fresh price sit next to a stale 5-day change with nothing saying so.

## 33 · 2026-09-21

Financial values are never rounded or padded to a fixed precision. A column may show 3.194% next to 1.586753%.

**Why.** Product owner: the users are financial staff and decide what precision they need; dropping digits drops information. Applies to percent changes and volatility, and to prices everywhere except the Last price column of the instruments list, which 53 fixes at two decimals.

## 34 · 2026-09-21

Tabs are underline tabs, not shadcn/Spartan's pill container.

**Why.** Deviation. Here tabs are page-level navigation over 13 instrument types; a pill container that wide reads as a toolbar. Roles, keyboard behaviour and Helm structure are unchanged — only `hlmTabsTrigger` styling.

## 35 · 2026-09-21

Dropdown menus are built on the native `popover` attribute, positioned from the trigger in `app.js`.

**Why.** A menu positioned inside `.table-wrap` is clipped by its horizontal scroll. The top layer avoids that, and the browser supplies Escape and click-outside. Spartan uses `hlm-menu` (CDK overlay), same result.

## 36 · 2026-09-21

Instruments list columns: Name, Type, Currency, Sector, Country, Last price, Source, Price updated, Products, Pricer, Status, Created.

**Why.** Identifiers (ISIN etc.) deliberately excluded from the list — general attributes only. Industry group excluded as well: the values are long and low-scan ("Technology Hardware & Equipment"); it stays a filter and a detail-page field.

## 37 · 2026-09-21

Deactivation date is shown in the Status cell next to the Inactive badge, not in its own column.

**Why.** A separate column would be empty on almost every row. Keeps rows at one line and 40px, so it does not reopen decision 30.

## 38 · 2026-09-21

Open: the instruments table is wider than a 1440 screen and scrolls horizontally.

**Why.** Raised 2026-09-21. Fix is a column-visibility control in the toolbar (shadcn's "Columns" dropdown) with a default set of visible columns, or dropping Country and Sector from the default view. Needs a product decision on which columns are the default.

## 39 · 2026-09-21

Open: list-view states other than empty — loading, fetch error, and the "no instruments yet" first-run state.

**Why.** The empty state on the instruments screen is an inline placeholder, not the real component.

## 40 · 2026-09-21

superseded by 46 — every column of the instruments list carries two levels: a primary value and a related second value under it. Nine columns instead of fourteen; row height 40px -> 53px.

**Why.** Pairs: Instrument + identifiers, Type + currency, Last price + source, Price updated + time, Sector + industry group, Products + pricer, Status + deactivation date, Created + time. Header cells use the same two-level structure, so the column label names both lines. Resolves decision 30 and sets list density; decision 29 still holds for forms and toolbars.

## 41 · 2026-09-21

Country is a flag after the instrument name, not a column.

**Why.** Square 16x16 SVGs (flag-icons 1x1) rather than small raster images, so the tile stays crisp at any zoom and sits on the same square grid as the row's other icons; a 2px radius and a hairline inset ring keep flags with a white field, like Japan, from bleeding into the row. `alt` carries the country name so it is not lost for screen readers, and a tooltip repeats it for everyone else. The prototype pulls the SVGs from a CDN; production should bundle the set it needs. Instruments with no country (indices, commodities) keep an empty 16px slot so names stay aligned.

## 42 · 2026-09-21

No row-selection checkbox on the instruments list.

**Why.** Product owner: no bulk actions are planned for instruments. Add the column back with the first bulk action, not before.

## 43 · 2026-09-21

Tooltip component added (`.tooltip`, one shared bubble).

**Why.** Rule: a tooltip only expands what is already on screen. It is also used for the full identifier list when that line is truncated. Shown on hover and on focus; the badge gets `tabindex="0"` so it is reachable by keyboard.

## 44 · 2026-09-21

Instrument search matches identifiers as well as the name.

**Why.** Typing an ISIN or a RIC finds the instrument. In the prototype the row carries name and identifiers in one searchable string; in production this is a server-side search across both.

## 45 · 2026-09-21

An instrument with no Bloomberg code shows an em dash on the second line, not a worded placeholder.

**Why.** Designer: a sentence-shaped placeholder is heavier than the values around it and pulls the eye to the one row that has nothing to say. The em dash is the table's existing "no value" mark, so a missing code reads the same way as any other empty cell. Whether a missing code is worth flagging is a data-quality question, not a list one.

## 46 · 2026-09-21

Two levels are per column, not a rule for the whole table. Two-level: Instrument (+ BBG ticker, see 51), Last price (+ source), Updated (+ time), Sector (+ industry group). One level: Type, Currency, Products, Pricer, Status.

**Why.** Product owner: Type/Currency and Products/Pricer are separate facts and get separate columns. A pair shares a column only when the second value qualifies the first and is useless without it.

## 47 · 2026-09-21

Table headers are always one line. The second line of a cell is never named in the header.

**Why.** A two-line header competes with the data for attention and makes the header band taller on every screen. Consequence: the meaning of a second line must be obvious from the value itself (a time under a date, a source under a price). If it is not obvious, it does not belong on a second line.

## 48 · 2026-09-21

Inactive shows only the badge. Date, time and who deactivated live in the tooltip. Tooltip content is structured — an optional title plus label/value rows (`data-tooltip` + `data-tooltip-rows`), never a sentence.

**Why.** Keeps the Status column narrow and makes the tooltip scannable. Same structure is used for the full identifier list.

## 49 · 2026-09-21

A read-only boolean in a table is a static checkbox (`.check-static`), not a tick against an em dash. Filled box = true, empty box = false. It is a `span`: no tab stop, no cursor, no control semantics; the value is carried by an `sr-only` label.

**Why.** Designer: in the Pricer column the tick and the dash were two thin marks of similar size, so the column read as texture and the two states had to be resolved one row at a time. A filled square against an empty square differs in shape, weight and colour at once, and still differs in greyscale. Not a disabled `hlm-checkbox`: disabled means "editable, but not now", and its 50% opacity would undo the contrast. The only visual difference from the real checkbox is the missing `shadow-xs`.

## 50 · 2026-09-21

amended by 54 — the table has no wrapper border and no radius. It lies on the page instead of sitting on a card above it. Outer cells are flush (`pl-0` / `pr-0`), so the first column, the row rules and the footer all end on the same two page edges; the last row keeps its rule. A table gets a frame only from a container it is placed inside (card, dialog), never from itself.

**Why.** Designer: on a screen whose whole job is one list, a card frame draws a box around the only thing on the page and then indents its contents 16px from everything else in the layout. What structures the table without it: the tinted header band, a rule under every row, and the row hover. The last row's rule comes back because there is no card edge left to close the table above the footer. Open, and now more visible: the table is wider than the page and the clipped right edge no longer has a border to explain it — see decision 38.

## 51 · 2026-09-21

The second line of the Instrument column carries one identifier: the Bloomberg code, with no `BBG Ticker:` label. Every other identifier (ISIN, CUSIP, FIGI, SEDOL, VALOR, WKN, RIC, Yahoo, SIX) is dropped from the list and lives on the detail page. No tooltip on that line — there is nothing left to expand.

**Why.** Product owner: the Bloomberg code is the one identifier the back office actually works with; the middot chain was five values wide, truncated on most rows, and readable only through a tooltip, so it cost the widest column on the screen and returned a lookup. Search still matches every identifier (44), so an ISIN finds the instrument even though it is not printed. Amends 43 and 48: the identifier list is no longer a tooltip case. The label is dropped too — `AAPL US Equity` is recognisable as a Bloomberg code to the people who use this screen, and a label repeated on every row is twelve copies of a word nobody needs to read.

## 52 · 2026-09-21

Instruments list column order: Instrument, Type, Sector, Products, Pricer, Currency, Last price, Updated, Status. `Created` is dropped from the list; `Price updated` is renamed `Updated`.

**Why.** Product owner. The row now reads in four groups — what the instrument is (Instrument, Type, Sector), what uses it (Products, Pricer), what it is worth (Currency, Last price, Updated), what state it is in (Status, last, next to the row actions that change it). Currency moved with the price pair so `GBp` still sits beside the number. Created never decided anything on this screen and stays on the detail page; the header keeps `Updated` short because the date under it is obviously a date (47). Supersedes the column list in 36 and drops the Created pair from 46.

## 53 · 2026-09-21

`Last price` in the instruments list is displayed at exactly two decimals, rounded half up, thousands separated by `'`. Display only: the stored value and every calculation use the full precision received from the source. An exception to 33, scoped to this column.

**Why.** Product owner. The column is scanned, not read: with mixed precision (227.858 next to 101.2360) the decimal points still line up but the digit counts do not, so the eye has to re-measure each number to compare magnitudes. Two decimals make the column comparable at a glance. Cost, accepted knowingly: instruments quoted more finely lose digits on this screen — SARON 3M reads 1.25 instead of 1.2485, which hides basis points, and fund NAVs lose their fourth decimal. The full value stays on the instrument detail page, where a price is read rather than scanned. If the lost precision turns out to matter in the list, the answer is a tooltip carrying the exact value (43), not a return to ragged precision.

## 54 · 2026-09-21

The header band is closed by a rule above and below (`border-y`). A sortable header is a button that fills its cell: the cell gives up its padding (`th:has(.table-sort) { p-0 }`), the button takes `h-10 w-full px-3` and no radius, so its hover band covers the whole column, edge to edge, and a right-aligned column right-aligns the button (shadcn: an `h-8 -ml-2 px-2 rounded-md` pill inside the cell).

**Why.** Designer: as a pill the hover band was a small rounded box floating inside a much larger cell — it read as a control dropped onto the header rather than as the header reacting, it was inset from the column edges in a table where every other band (row hover, header tint) runs the full width, and the rounded corners contradicted decision 28's 4px language at a size where they only looked soft. Full-cell hover also gives the largest possible click target for a control people hit repeatedly. The top rule closes the band against the toolbar above it, which the tint alone was too faint to do.

## 55 · 2026-09-21

Table rows are padded **3 (12px)** left and right, and `.table-wrap` bleeds the same **12px** outwards (`-mx-3`). Net effect: the text column sits exactly on the page's left and right edges, and the row band and rules run 12px past it on both sides.

**Why.** Designer: flush cells (decision 50) left the hover band starting on the first character. 12px is the unit the table already uses between columns (`px-3`), so a row now has the same 12px on every internal boundary and on both of its own edges — nothing new was added to the scale. The bleed is what keeps the two properties together: padding inside the row, and the first column still in line with the search field above and the count below. It eats 12px of the page's 24px gutter, which is why the value is 3 and not 4 — at 16px the row band would come within 8px of the sidebar.

## 56 · 2026-09-21

Column chooser lives in the table header, in the row-actions column: an icon button directly above the row `More` buttons, labelled by a tooltip, never by visible text. Which columns the list shows is a per-user setting. **Locked:** Instrument (always shown, always first) and the row-actions column (not in the menu, always last). **On by default:** Type, Sector, Products, Pricer, Currency, Last price, Updated, Status. **Offered, off by default:** Country, Last close, Chg YTD, Volatility 90D, Created, Modified.

**Why.** Instrument is locked because it is the row's identity and the link to the detail page — a list whose rows cannot be identified is not a list. Everything else is the user's business, including Status: someone who has filtered to Active does not need the column. What is deliberately **not** offered, and the rule behind each: (a) individual identifiers — they already ride under the name as the second line and search matches them (44), so ten identifier columns would repeat what is on screen; (b) Industry group, Source, the times under dates, the deactivation date — a second line belongs to its column and is shown or hidden with it, never on its own; (c) Id, Created by, Modified by — a UUID is not scannable, and the "by" fields are written by the fetcher (`system@capital-viz.com`), so a column of them would read as an audit trail that it is not; (d) type-dependent fields (TotalEntities, LastBid, Open/High/Low) — a column that is a dash on nine rows out of ten is noise; they stay on the detail page. Rule for any column proposed later: offer it only if the value is short enough to scan in one line, present on most rows, and worth comparing down the column. Placement: the control belongs to the table, not to the toolbar — the toolbar answers "which rows", the header answers "which columns", and putting it at the top of the actions column stacks it over the per-row menus, so every control that acts on the table's structure sits on one vertical line. It is the one icon-only control on the screen; the tooltip is its label and `aria-label` carries the same words. Resolves 38: the default set fits 1440, and the user reaches everything else without the table getting wider for everybody.

## 57 · 2026-09-21

Column order is a per-user setting too, built in the same menu: the list is the order, top to bottom. Drag by the handle, or focus a handle and use ArrowUp / ArrowDown — same result, no mouse needed. Instrument cannot be moved; hidden columns keep their place in the list, so switching one back on returns it where the user left it. One Reset restores the default set and the default order.

**Why.** Drag with no keyboard equivalent would make the feature unusable for part of the audience and untestable for us. Reordering lives in the same popover as visibility because they are one question — "what do I want to see, and in what order" — and because dragging column headers directly cannot be done on a table that already scrolls horizontally. In production both settings are stored per user, like the collapsed sidebar rail; in the prototype they reset on reload.

## 58 · 2026-09-21

The **first** column is pinned to the left edge of the scrolling table (`data-pin-first` on `.table-wrap`, `position: sticky; left: 0`). A shadow on its inner edge appears only once the table is actually scrolled. The row-actions column is **not** pinned — it scrolls with everything else.

**Why.** Designer: on a table wider than the screen the identity of the row is the one thing that must never scroll away. Scrolled right, the earlier build showed prices, dates and statuses that belonged to nobody — the name column was cut to fragments. Actions stay unpinned deliberately: two pinned columns squeeze the data between them, and the menu is reached after you have found the row, not while scanning. Two consequences, both accepted: (a) the column chooser sits in the actions header (56), so it scrolls away too — with the default columns the table is ~1180px against ~1160px of room at 1440, so it is a nudge of scrolling, not a hunt; (b) a pinned cell paints its own background, so each row state — default, hover, selected — is repeated by hand in `components.css` as an exact colour mix, and a new row state has to be added there or the pinned cell will not follow it. The `Instrument` column is ~286px, which is that much width that no longer scrolls; if it starts to hurt, cap it before giving up the pin. Consequence (a) is void as of 74, which pinned the actions column after all, so the column chooser no longer scrolls away; the pin on the first column and consequence (b) still stand.

## 59 · 2026-09-21

The tooltip surface is the inverse of the page — `--foreground` with `--background` text (near-black #0A0A0A, white text at 19.8:1, labels at 60% still 7.3:1) — not the brand. shadcn's `bg-primary` is a deviation we drop.

**Why.** Designer: with `--primary` the tooltip was a deep violet panel appearing over a table of numbers, which read as a promotional element rather than the system answering a question. Brand colour should mark what the product is (wordmark, primary action, focus ring), not annotate data. Inverse-of-page is the same pattern shadcn itself uses for a tooltip in its zinc theme and it carries no hue, so the bubble sits over any content without tinting it. It also survives a white-label swap untouched, which the brand version did not.

## 60 · 2026-09-21

The page title is the first block **inside** the scrolling page body (`.page-header` → `.page-title`, 24px/600), not a fixed header bar. The 56px header strip and its bottom rule are gone; the block is closed by 24px of space. `.shell-header` / `.shell-title` are removed.

**Why.** Designer: the old header gave the page's own name the same size as a section heading (16px/500) and then drew a rule under it, so the screen opened with a band of chrome and the eye reached the tabs without ever being told what it was looking at — the first real step in the hierarchy was the table. At 24px against 14px body text the title is the largest thing on the screen and the tabs below read as a level under it, which is what they are. The rule went because the only thing it separated was the title from the tabs that belong to it; the sidebar keeps its own header rule, which now closes the wordmark against the nav instead of continuing across the page. Consequence, accepted: title and primary action scroll away with the list, like every other page-level control on the screen (the toolbar, the count). Nothing on this screen is sticky, so the page still scrolls as one thing — if a sticky action is ever needed, it belongs to the table, not to a reinstated header bar.

## 61 · 2026-09-21

Dialog sizes: `.dialog` 512px (shadcn default), `.dialog-lg` 768px for the record. Height caps at 85vh and only `.dialog-body` scrolls, so the record title and the buttons that act on it are never scrolled away. Field groups inside are **not** cards.

**Why.** 768px is the width at which two columns of fields still read as pairs; below it the pairs stack and the form doubles in height. A card inside a dialog is a frame inside a frame and indents its content away from the dialog's own edges — the same reasoning as decision 50 for the table: the container frames the content, the group only separates it, with a heading and a rule.

## 62 · 2026-09-21

Creating an instrument is **enter → fetch → create**, in that order and on one screen. The fetch is keyed on the pair *Source + the identifier that source uses* (SIX → SIX Code, Yahoo → Yahoo code, Bloomberg → Bloomberg code); until both are there the Fetch button is disabled and the hint names the missing field. Sources that deliver by hand (Email, Excel, web scraping) cannot fetch at all and say so.

**Why.** Product owner: the instrument is *initiated* — the admin checks that the provider really returns this instrument before the record exists. Consequence: the fetch runs before there is anything to save, so its result is a preview inside the form, not a stored state, and Source has to be chosen before the identifier can do anything. Audited 2026-09-21: 83 removes the fetch from creation altogether, so the order *enter → fetch → create* and the Fetch button this row is about are both gone. What survives it is the keying itself — *Source + the identifier that source uses* — which is still how an update is addressed, and `Refresh data` in the record view (32) is unaffected.

## 63 · 2026-09-21

A failed fetch never blocks creation. The instrument can also be created without fetching at all, after one confirmation (*Create without market data?*).

**Why.** Product owner: save it even with the error. Instruments whose source is a mailbox have no fetch to run, so a mandatory fetch would make them impossible to create. The confirmation exists because an instrument with no price is a real, but rarely intended, outcome.

## 64 · 2026-09-21

Financial identifiers invert decision 15: not one of the twelve is required on its own, and the rule lives on the **section** — *at least one identifier*. Bloomberg code and ISIN are open; the other ten sit behind a `More identifiers (10)` disclosure that carries its count.

**Why.** The identifier is what the fetch is keyed on, so the record needs one, but which one depends on the source and the instrument. A section-level error is a new pattern: `.form-section-error` under the section title, same look as a field error. The disclosure is what keeps a twelve-field group from being half the scroll of the form.

## 65 · 2026-09-21

Set-once fields (Currency, Country, Sector, Industry group) behave as *editable only while empty*. A fetch fills the empty ones and leaves what the admin typed. In **create** everything stays editable — nothing is saved, so nothing is set yet. In **edit** a field that already holds a value is rendered as a read-only value with a note, never as a disabled control.

**Why.** Product owner chose *editable, but only while empty*, which resolves the provider-versus-admin conflict by itself: what is already there is already set. Read-only is text, not a disabled input — disabled means "editable, but not now" and its 50% opacity is the wrong contrast for data that is only being read (same reasoning as decision 49). The `Optional` tag is dropped from a locked label: it describes filling a field in.

## 66 · 2026-09-21

A failed fetch is reported in the list in the **Updated** column: a destructive `Failed` marker in place of the date, the reason in the tooltip (attempt time, source, provider message, per 48), and the second line saying which data is still on screen. An instrument that was never fetched shows an em dash and *Never fetched*. The Last price cell keeps its old value in grey and says nothing about the failure.

**Why.** The Status column is the lifecycle axis — Active / Inactive — and a broken fetch is a different axis; mixing them is what decision 31 forbids for status colours, for the same reason: the column stops carrying one meaning. Updated is already the freshness column, so a failure belongs there, and one failure is reported once. Open: whether a data error also deserves a filter in the toolbar, otherwise broken instruments are only findable by scrolling.

## 67 · 2026-09-21

Feedback after Create is the **new row, highlighted at the top of the list** for three seconds — not a toast.

**Why.** The list is behind the dialog the whole time, so when the dialog closes the created instrument is already on screen; a toast would announce what the admin is looking at, and add a component whose only job is to disappear. If creation ever moves somewhere the list is not visible, the toast comes back with it.

## 68 · 2026-09-21

Confirmations inside a dialog (*Discard changes?*, *Create without market data?*) are `popover="manual"` elements **inside** the `.dialog`, not a second `<dialog>`.

**Why.** Two native constraints, both found by testing. One Escape closes every native dialog in the top-layer stack, so a confirmation opened as a `<dialog>` is dismissed together with the form it is protecting. And a modal `<dialog>` makes everything outside itself inert, so a popover that is not its descendant renders but cannot be clicked. `manual` also means Escape cannot dismiss the question — it has to be answered, which is what a confirmation is for. In Spartan both are `hlm-alert-dialog` on a CDK overlay and neither constraint exists.

## 69 · 2026-09-21

New components: **Dialog** (native `<dialog>` + `showModal()`), **Alert** (shadcn `alert.tsx` / `hlm-alert`, with `-ink` text on a 10% status tint), **Skeleton**, plus the smaller recipes the record needs — `.form-section`, `.props` (read-only label/value pairs), `.stats` (the six percent-change periods as one hairline grid), `.range` (52-week low/high with the current price marked), `.disclosure`.

**Why.** `.range` and `.stats` answer what `instruments.md` asked for: a range with the price marked on it reads better than two numbers, and the six periods read across as one object. Everything else is shadcn anatomy with the project's own type and radius.

## 70 · 2026-09-21

**The instrument form validates nothing.** No required fields, no field errors, no rule on the identifiers group, and no `Optional` tags — with nothing required, the word marks no difference and only repeats itself down the form. Create saves whatever is on screen.

**Why.** Product owner: this is the administrator's job — they decide what an instrument needs and know which of the twelve identifiers exists for it. Supersedes the identifier rule in 64 and takes this form out of decision 15, which still holds everywhere else. What stays is not validation but capability: the Fetch button is disabled until the source has its identifier, because without it there is nothing to ask the provider. The one remaining question, *Create without market data?*, is about a consequence rather than about a field — say so and it goes too.

## 71 · 2026-09-21

`Create another` is dropped from the create dialog footer.

**Why.** Product owner. The list is behind the dialog and the new row lands on top of it (67), so the loop back to an empty form is one click on **New instrument** — a permanent checkbox on every creation to save it is not worth the footer space.

## 72 · 2026-09-21

**The Instruments list opens with a row of four counts** (`.metrics` / `.metric`, between the page title and the type tabs): Total instruments, Active with the inactive count beside it, Pricer enabled against the active count, and Failed updates in the last 24h. The first three are read; the fourth is a toggle button that filters the list to the instruments whose last fetch failed. The counts describe the whole set, never the current query.

**Why.** Product owner asked for a summary so an admin sees what needs attention on arrival; designer set what it is allowed to contain. The screen had already refused an intro paragraph (decision 60's reasoning: on a list opened every day, a block that is read once costs vertical space forever) and this row costs the same ~90px, so it has to be a different kind of block, and it is: a paragraph is read once, a count is read every morning, and one of these four is a control. The row is ordered from what the set **is** to what needs **doing**, so the eye lands on the alert last and stays there — the same left-to-right logic the table columns already use (decision 44's ordering). Four cells is the ceiling; a fifth number nobody acts on turns the row into decoration, and the test for any cell proposed later is whether an admin would do something differently because of it. Pricer enabled is the weakest of the four on that test — it is coverage, not attention — and it is the first to go. **Only a count that can land on exactly itself may be a button.** Failed updates is counted from the rows, so clicking it always produces that number of rows and the footer count agrees with the cell; Total and Active are aggregates over a set the page has not loaded, so they stay text. That rule, not visual taste, is why one cell in four is interactive, and it is also what closes the open question from the list's first pass — a broken instrument used to be findable only by scrolling, and the toolbar has no filter for it. While the filter is on, the cell's second line says *showing only these*, so the cell states what the list is showing and pressing it again clears. Two things the row deliberately does not do. It does not follow the filters: a tab or a toolbar select narrows the table without touching the counts, because the strip is the state of the catalogue and the footer count is the state of the query — if both moved, neither would mean anything. And it does not disappear at zero: the alert cell keeps its place and its label, drops the destructive colour, reads *none in the last 24h* and stops being a button. A row that changes shape when the news is good cannot be read at a glance. Destructive here is the status colour, not an accent — a 5% tint with the `-ink` shade for text, the same recipe as a soft badge (decision on status colours), so the one loud cell in four is loud for a reason. The value is 24px, the h2 step of the ladder (78), but it is a number and not a heading: nothing in the row is an `h2`, and the page keeps one h1.

## 73 · 2026-09-21

Instrument fields are grouped into four blocks: **General details**, **Financial identifiers**, **Market data & performance**, **Record info**. `Active` sits in the page header, not in a group.

**Why.** Grouping agreed field by field with the product owner; the full list is in `domain.md`.

## 74 · 2026-09-21

The row-actions column is pinned to the right edge of the scrolling table (`position: sticky; right: 0`). A shadow on its left edge appears only while something is hidden underneath it.

**Why.** Required by 56: a control in the header of a table that scrolls sideways is unreachable the moment the table is scrolled, and the default set already needs ~1180px. Pinning also fixes the older annoyance that the row menu ran away from the row. Cost, and it is real: a pinned cell paints its own background, so each row state (default, hover, selected) is repeated by hand in `components.css` as an exact colour mix — a new row state has to be added there too or the pinned cell will not follow it. The shadow is state, not decoration: no shadow means nothing is hidden. Reverses the *actions stay unpinned* half of 58: the reasoning there — two pinned columns squeeze the data between them — lost to 56, because a control in a header that scrolls away is not a control.

## 75 · 2026-09-21

The instrument record has no page of its own: **create, view and edit are three modes of one centred dialog** opened over the list. The row name and *View details* open `view`; *Edit* and the footer button switch the same dialog to `edit`; *New instrument* opens it empty in `create`.

**Why.** Product owner, after a page and a right-hand sheet were both drafted. One surface means one set of field definitions, one fetch control and one place to change any of it. The list never goes away, so closing the dialog puts the admin back exactly where they were and the question *where do we land after Create* answers itself (see 67). Cost, for the developer: a dialog has no URL, so a half-filled form cannot be linked and the browser Back button closes the page rather than the dialog — in Angular this must be a **routed** dialog (`/instruments/new`, `/instruments/:id`) over the list route.

## 76 · 2026-09-21

No rules inside the shell. The sidebar header loses `border-b` and the footer loses `border-t`; the three zones are held apart by space — `pt-6 pb-4` on the header (72px, not a fixed 56px box) and `pt-4` over the footer. The sidebar's right edge is the only line left in the frame.

**Why.** Follows 60: once the page header's rule was gone, the sidebar's was half of a line that no longer went anywhere, and the footer's was drawing a box around two items that already sit alone at the bottom of a column. Designer: a rule should separate two different surfaces, not two zones of the same one — the right edge does the first, these two did the second, and on a screen that is already a grid of table rules every extra hairline is spent. The spacing is not arbitrary: 24px over the wordmark puts it on the same optical line as the page title, and 24+32+16 puts the first nav item at 80px, level with the page's tabs — so the sidebar and the page step down together. The footer's `pt-4` only shows itself when the nav list grows long enough to reach it; with five areas the empty space does the work.

## 77 · 2026-09-21

amended by 78 — **Type ladder, and the rule that governs it: every step changes at least two of size, weight and colour.** Page title 24/600 (`.page-title`) · dialog and section title 20/600 (`.dialog-title`, new `.section-title`) · card and form-section title 16/600 (`.card-title`, `.form-section-title`) · body 14/400 · emphasis inside body 14/500 · secondary 14/400 muted · overline 12/600 muted (new `.overline`, and now the table `th`, `.menu-label`, `.sidebar-group-label`) · caption 12/400 muted. Base stays 14px and the weights stay 400/500/600 (6, 9). Amends 20: a card title is `font-semibold`, not `font-medium`.

**Why.** Designer: the gradation had no visual contrast. Under the 24px page title everything from a dialog title to a table header to a form label sat at 14px and was told apart by weight alone — Archivo 500 against 400 at 14px is a difference you can measure and cannot see — so the screen had two levels, "the title" and "everything else", and the section a field belonged to had to be worked out from the spacing. Fixing it by making the weights heavier would not have worked: weight is the weakest of the three axes at this size, and we only have three weights. So the three heading levels are now a size apart **and** all 600, 500 is left to emphasise a word inside a line of body text where the neighbours are the reference, and the 12px roles take case and colour as well. The overline is the one exception to the two-axis rule as stated, and only looks like one: against 14/400 body it is two size steps smaller and a grey lighter as well, so weight is its third axis, not its only one. The table header moves furthest: it was 14/500 in `--foreground` on a `bg-muted/40` band, one weight step from the data underneath it, and is now 12/600 in `--muted-foreground` — 4.58:1 on that band, so it clears AA, and the band differs from the data by size, weight and colour instead of by its tint alone. Uppercase was tried on the overline and dropped the same day — designer's call. It bought a fourth axis nobody needed once size, weight and colour were already doing the work, and it charged for it twice: four columns became header-bound instead of content-bound (Products, Pricer, Currency, Last price) and the default table went to 1264px, against ~1160px of room at 1440, which turned the nudge of horizontal scrolling noted in 58 into about 100px of it. Without it the table is **1191px**, 27px narrower than the 1218px it was before this decision, so the type ladder pays for itself in width. Uppercase also caps the role at one or two words before it starts costing reading speed, and `Volatility 90D` was already close to that line. What deliberately did **not** change: a form label stays 14/500 above its input, because the field border already separates the two; a read-only value keeps a 12px muted label over a 14px foreground value, which is two axes without touching weight.

## 78 · 2026-09-21

**The three heading sizes are 36 / 24 / 18, replacing 24 / 20 / 16.** h1 page title 36/600 `tracking-tight` `leading-tight` (`.page-title`) · h2 dialog and section title 24/600 `tracking-tight` (`.dialog-title`, `.section-title`) · h3 card and form-section title 18/600 (`.card-title`, `.form-section-title`). Body 14, overline 12, caption 12 unchanged; the rule from 77 (two axes per step) unchanged. The kit pages' own `h1` drops its one-off `text-3xl` (30px) and takes `.page-title` like everything else. `.page-header` goes from `items-start` to `items-center`.

**Why.** Designer: three levels were there after 61, but the top of the ladder was not far enough from the bottom — 24px is only 1.7&times; the body text, so the page title read as a slightly larger heading rather than as the name of the screen. The new ladder is **36 &rarr; 24 &rarr; 18 &rarr; 14 &rarr; 12**, ratios 1.5 / 1.33 / 1.29 / 1.17: the jumps get smaller on the way down, which is the shape a scale should have. The page title has to be findable from anywhere on the screen; the card title only has to win against the line underneath it. The three heading levels still map to three structural levels and nothing else: one h1 per screen (60), h2 for a dialog's own title or a section of a page, h3 for a card or a group of fields inside either. A dialog stays h2 deliberately — it is a block of the screen, not a screen of its own, and the list behind it keeps the h1. `.page-header` had to change with it: at 36px the title's line box is 45px tall, and the 32px primary action pinned to its top sat 13px above the title's optical centre. Centred, they read as one line. That holds only while `.page-description` is one line, which is its contract; if it ever wraps, this goes back to `items-start` with a matching `mt` on the action. Measured after the change: nothing overflows, the dialog header grows by 1px (64 &rarr; 65) because the badge beside the title was already the tallest thing in it, and the instruments table is untouched at 1191px — the heading sizes cost no width, only vertical space at the top of a screen, which is the one place on these screens that has it to give.

## 79 · 2026-09-21

**Every field in the record is editable, in create and in edit alike.** Nothing is locked after the first save and no field carries a *Set at creation* note. Supersedes 65.

**Why.** Product owner, and the same reasoning as 70: the administrator is the one who knows when a provider's sector or currency is wrong, and a field they cannot correct turns a bad value into a support ticket. What survives from 65 is the one rule that needs no UI: a fetch fills only the fields that are still empty, so it never overwrites what someone typed. Consequence for the developer: `set once` in the field model is now a statement about where a value comes from, not a permission — the API must accept all of them on update.

## 80 · 2026-09-21

**An overlay anchored to a trigger opens below it and flips above when it does not fit below and there is more room above** — a select near the bottom of the screen opens upward, one near the top opens downward. The side is decided on every open and re-decided while the overlay is open if the page scrolls or the window resizes; the overlay is then capped to the height that side actually has (288px stays the ceiling), so a long list scrolls inside itself. 4px between trigger and overlay, 8px between overlay and the edge of the screen. `data-prefer="top"` on a `.select-content` asks it to start upward — used by **Rows per page** in the table footer — and the fit check still applies, so it flips back down rather than run off the top.

**Why.** Product owner: the pagination select opened downward off the bottom of the screen, which is where a page footer always is. Designer: fixing that one select would have left the rule unwritten, and the row-action menu had already solved the same problem its own way — it has flipped above since it was built, with these exact 4px and 8px. So the rule is now one rule for both, and the select is the one that changed. Chosen deliberately over the simpler reading, *below the middle of the screen opens up, above it opens down*: a short list with room where it is should not move at all. Movement is the cost of the flip — the list appears somewhere other than where the eye expects — so it is spent only when the alternative is a list that runs off the screen. In practice the two rules agree wherever it matters, because a trigger near the bottom edge is exactly where the list stops fitting below. The height cap is the other half of it. A flip alone still fails when neither side has room (a long list, a short window): before this, the list simply extended past the edge and the items at the end were unreachable. Capped, the list is always fully scrollable within the room it has, and the cap is never larger than the recipe's own 288px, so nothing gets taller than it was designed to be. `data-prefer` exists for the case the rule cannot know about: a control whose place on the screen is structural rather than incidental. A page footer is the bottom of the page by definition, so its select should not change direction with the scroll position of the table above it. It is a preferred side, not a fixed one — a preference that could push a list off the top of the screen would be a worse bug than the one this decision fixes.

## 81 · 2026-09-21

Identifiers are set in **mono only in the record dialog** (`.input font-mono`, and `.prop-value font-mono` for the few that are values). In the list the one identifier that is left — the Bloomberg code on the second line of the Instrument column (51) — stays in Archivo. Closes the `identifiers mono` half of 22.

**Why.** Designer, asked directly whether to make the list match: no. Mono buys digit alignment down a column, and that is worth having where identifiers are stacked and compared, which is the record view. In the list the Bloomberg code is one line under a name, read as a label rather than compared with anything, and a second typeface on that line would make a quiet second value look like data of its own kind. Raised by the 2026-09-21 audit of this log, which found 22 still claiming mono for a list that no longer carries the identifiers it was written for.

## 82 · 2026-09-21

**All twelve financial identifiers are open in the form.** The `More identifiers (10)` disclosure is gone; the twelve sit in six rows of two, in the order the domain lists them. Supersedes the disclosure half of 64.

**Why.** Designer: identifiers are not entered one at a time and they are not rare — an instrument arrives as a data sheet and they are pasted in one pass, so the disclosure was opened on every create and closed on none. What it saved was five lines of scroll in a dialog that already scrolls; what it cost was a click before any work could start, and ten fields that the browser's own find and a person's own scan could not see. The count `(10)` was the tell: a label that has to say how much it is hiding is hiding too much. `.disclosure` stays in the kit as a component — it is the right recipe for something genuinely rare — but no screen uses it now.

## 83 · 2026-09-21

**Creating an instrument fetches nothing.** The *Fetch data* button, its four result states and the *Create without market data?* confirmation are removed; the record is written and the numbers arrive on their own, with the system's update rule. Market data in the create form is Source and Based on, nothing else. A new row shows an em dash for a price and *Awaiting first update* under it. Supersedes 63.

**Why.** Product owner: data updates on a rule the system keeps, so a fetch at creation was a second, manual path to the same values — one that had to be designed for success, failure and not-run-at-all, and that left the create form asking a question (*Create without market data?*) about a state that is now simply what every new instrument looks like for a while. Removing it takes three states, one confirmation and one disabled-button rule out of the form, and puts the whole question of *when is this data current* in one place instead of two. `Refresh data` in the row menu and in view mode stays: that is the manual override for the cases that cannot wait, and it acts on a record that already exists. **Open, and it blocks nothing in the UI:** the rule itself — how often each source is pulled, one schedule or one per source, and what an instrument created just after a run waits for. Until it is written, the form says *with the scheduled update*.

## 84 · 2026-09-21

**The word in the interface is *update*, not *fetch*.** Amends 66: the marker and the tooltip title read *Last update failed*, the summary cell stays *Failed updates*, and an instrument that has never had data reads **Awaiting first update** under an em dash, not *Never fetched*. The rule 66 set is unchanged — failure is reported in Updated, never in Status.

**Why.** Follows 83. Once nothing is fetched by hand, *fetch* named a mechanism the administrator never triggers and never sees; *update* names the thing they actually wait for, and it is already the word on the column header and on the summary count, so the screen now says it the same way in all three places. *Never fetched* had a second problem beyond the word: it read as a verdict on the instrument when it is a statement about time — every instrument is in that state for a while, by design, from the moment it is created. *Awaiting first update* says the same fact forward. `fetch` survives in `domain.md` and in the field notes, where it describes how the data gets in; that is the developer's vocabulary, not the screen's.

## 85 · 2026-09-21

**The SIX triplet is one row of three** (`.field-row-3`): SIX Code, SIX Schema and SIX Bc sit side by side at the foot of Financial identifiers, and **Yahoo code stays alone in the half-width row above them**, its right half deliberately empty. Amends the geometry of 82 — the identifiers are twelve fields in the domain's order, but they are five rows of two and one row of three, not six rows of two. New recipe `.field-row-3`, to be used only for values that are one thing in parts.

**Why.** Designer: SIX Code, SIX Schema and SIX Bc are not three identifiers. They are one — the code, the schema the code is expressed in, and the source code it came from — and none of the three means anything without the other two. Laid out in pairs they broke across two rows, which put SIX Code next to Yahoo code and SIX Schema next to SIX Bc, so the form said *two unrelated pairs* about values that are read and filled in one gesture. On one row they are one object, and the row is also the shape of the thing in the source system. This is a rule about meaning, not about width: `.field-row-3` is for values that belong to each other, and a row of three unrelated fields is three fields nobody reads as a group. That is written into the recipe's comment and into the kit's Form field rules, because three-across is exactly the variant a later hand reaches for to make a long form shorter. Yahoo code alone is the deliberate part, and it is deliberate twice over. Nine identifiers outside the SIX block is an odd number, so in the domain's order one of them always falls alone; Yahoo is the ninth, which puts the gap immediately before the SIX row, where a break is wanted anyway. And it stays **half width** rather than spanning the row: every identifier here is a short code, and the width of an input is a promise about the length of its content — a full-width box for `AAPL` invites a sentence. The empty half is the end of the pairs, not a hole. Rejected: re-pairing RIC with Yahoo as *vendor symbols*, which only moves the lone field to WKN and breaks the domain order 82 fixed; and letting Yahoo span, which is the one change that would make the field lie about what goes in it.

## 86 · 2026-09-21

**Export to Excel is one outlined button at the right end of the list toolbar.** It exports the **query, not the page**: every instrument the type tab, the search and the four filters leave, in the **columns the chooser has on and in their order** (56, 57), at **full stored precision** — the two decimals of `Last price` are a display rule for the column (53), not the number. Three states and no fourth: idle; busy, which is the kit's loading button (disabled, `aria-busy`, spinner, *Preparing…*); and disabled when the query matches nothing. No success message.

**Why.** Designer, after the product owner asked for the list to be exportable. **Why the toolbar and not the page header:** the header carries the actions of the *area* — *New instrument* creates a record that has nothing to do with what is on screen (60). Export does: the file is exactly what the reader has narrowed the list down to, so the button belongs on the row with the controls that decide it. Next to *New instrument* it would have read as *export the catalogue*, which is the one thing it does not do. **Why outlined:** one filled button per screen. Export is the second-most-wanted thing here and the recipe for that is `btn-outline` — same size, same row, less weight. **Why the query and not the page:** pagination is a reading device, and a file of 25 rows because the footer says 25 is a surprise that is only found after the file is opened. There is no row selection on this screen (42), so the filters *are* the selection — which is also why the button sits beside them. **Why the columns follow the chooser:** the file should be the table the reader built; someone who turned on Volatility 90D wants it in the sheet, and the chooser's Reset is one click away for the default set. **Why no toast:** a download is the browser's own event and every browser reports it in its own chrome — a second confirmation inside the page would be the app telling the reader something the window frame just told them. **Why disabled at zero rows:** an empty sheet is not a result, and the empty state next to the button already says why there is nothing. The busy state is what the prototype can show of a request it does not make: in production the click is the request and the response is the file, and the button is held disabled until it arrives so the same file is not asked for three times. Cost paid: the search input went from `w-72` to `w-64` so the row still fits 1440 next to the sidebar. **Open:** what the file is called and whether it carries the filters in its name; whether the sheet follows the table's sort; what a several-thousand-row export does, which is a server question (built and streamed, or built and mailed); and how a failed export reports itself — the one state not designed, because it is the server's failure and the shape of it is not known yet. Not offered and not asked for: CSV, PDF, and exporting one instrument from the record dialog.

## 87 · 2026-09-21

**Spacing ladder: seven steps, and four rules that decide which one to use.** 0.5 (2px) two lines that are one value · 1 (4px) items in a list that is one object · 1.5 (6px) an icon next to 12px text, and a menu row's vertical padding · 2 (8px) a label and its control, an icon and its label, two separate buttons, a table cell's `py` · 3 (12px) inside a control and between table columns · 4 (16px) between fields, and between a block and its own furniture · 6 (24px) the page inset, block to block, section to section, and two fields side by side. **5 (20px) and 7 (28px) are off the ladder.** The rules: **(1)** every gap is larger than the gaps inside it — 8 / 16 / 24 down a form; **(2)** across is wider than down — 24 side by side against 16 stacked; **(3)** padding has three tiers, control 12 · band 16 · container 24; **(4)** 24 is the ceiling on a screen, and anything needing more separation gets a rule, a surface or a container. Written into `components.css`, specimen on `kit/foundations.html`.

**Why.** Designer, reading the ladder back off the built screens rather than inventing one. The kit had been claiming "inside components 2–3, between components 4–6, between sections 8+" since the kit was first written, and two of those three were false: the product's largest spacing is **24**, not 32+ (8+ appears only on the kit's own pages, which are documents, not screens), and the interesting values were never the sizes but what each one asserts. **Why a ladder at all, on a product with no cards around most of its content:** space *is* the grouping device here. The form is deliberately not a stack of cards, the table has no wrapper (50), the sidebar has no rules in it (76), and the page header is closed by space (60) — so the only thing telling a reader that a label belongs to the field under it, and that the field belongs to the section around it, is rule 1. It is the spacing counterpart of the two-axis rule in 77: a level has to be *seen*, and 20 against 16 is a difference you can measure and cannot see. **Why 5 is refused:** it is exactly the value a hand reaches for when 4 feels tight and 6 feels loose, and reaching for it is the tell that rule 1 has been broken somewhere upstream. Three places had it and all three were that: `grid gap-5` in the view-mode market-data block (the read-only values inside it are 16 apart, so the gap around them has to clear 16 — it is now **24**, which is rule 1 doing the arithmetic instead of the eye), the same block copied into the kit, and `.dialog-body px-6 py-5`, the one box in the system that padded itself differently on two axes for no reason — now `p-6`, so a dialog's inset is one number like a card's. Four demo boxes on the foundations page went `p-5` → `p-6` for the same reason. **Why 24 is the ceiling:** this is a dense back office where the whole job is comparing rows, and past about 24px the eye stops reading a gap as a gap and starts looking for the thing that is missing from it. The single 48 in the product is an empty table body, where the emptiness is the message. **What this does not change:** every existing screen. The ladder was already there in the components — every layout gap in the prototype but the three named above was on it — so this writes down what the screens already do, deletes those three, and gives the next hand a reason to quote instead of a range to guess inside. **Open:** nothing blocking. If a screen ever needs a block separation larger than 24 the answer is a rule or a surface, and if that turns out to be wrong twice, this decision gets amended rather than worked around.

## 88 · 2026-09-21

**`.overline` keeps its name and cancels Tailwind's built-in utility of the same name**, with `text-decoration-line: none !important` written into the recipe as plain CSS. The role is unchanged — 12 / 600 `muted-foreground`, exactly as 77 and 78 set it — and so is every usage, the typography table in `components.css` and the specimen on `kit/foundations.html`.

**Why.** Tailwind ships an `overline` utility (`text-decoration-line: overline`), so every `class="overline"` in the prototype was rendering with a literal line drawn above the text: 14 elements on `kit/foundations.html`, 2 on `index.html`, 1 on `kit/components.html`. The three places that carry the overline role without the class — table `th`, `.menu-label`, `.sidebar-group-label` — were never affected. **Why `@apply ... no-underline` does not fix it:** Tailwind v4 declares `@layer theme, base, components, utilities`, the recipe lives in `components` and the utility in `utilities`, and a later layer beats an earlier one no matter what the earlier one says. Measured in the browser: adding `text-decoration-line: none` to the components rule left the computed value at `overline`; adding it `!important` gave `none`. An important declaration inverts the layer order, which is why it is the only thing that wins from inside the recipe. **Why not rename to `.eyebrow`:** designer's call. The word *overline* is the role's name in the type ladder and is quoted in 22, 77 and 78; renaming would have touched 27 references across five files and left three decision rows describing a class that no longer exists. One `!important` is a smaller debt than a name that stops matching its own record. **The cost, stated plainly:** the name still shadows a Tailwind utility, so anyone who later writes `class="overline"` wanting the decoration gets a 12 / 600 grey label instead — use `[text-decoration-line:overline]` if that is ever actually wanted. This is the only `!important` in `components.css`; the comment above the rule says why it is there so nobody tidies it away.

## 89 · 2026-09-21

**Every list filter lives in one panel behind a Filters button, and a chip row under the toolbar says what it left on.** The toolbar keeps three things: the search box, the **Filters** button with a count of the filters that are on, and Export at the right end. The panel is a native popover aligned to the button's left edge (`data-align="start"`), 520px wide, fields two across so it opens downward rather than covering the page; it applies **live** — there is no Apply button — so the footer count and the chips move while it is open. Every filter the panel holds gets a **chip** that clears itself; a filter whose own control is visible (the search box, the type tab, the Failed updates cell) gets none. **Clear all** — in the panel header, on each chip row and in the empty state — clears all of it, the search box and the Failed updates cell included.

**Why.** Replaces the four inline selects of the earlier toolbar. The count of filters asked for was ten; five inline selects were already the width of the search box plus half the table, and the answer of wrapping to a second row costs ~90px above the table permanently — the same cost the intro paragraph was refused for (72), for controls that are touched far less often than the intro would be read. The panel also removes the ceiling: an eleventh filter is a row in a panel, not a decision about the toolbar. What it costs is one click before Status or Currency, which is why the chip row is not optional — it is the only thing that keeps a narrowed list honest when the panel is shut. `.filter-panel`, `.filter-chips`, `.chip` and `.btn-count` in `components.css`; the engine, the chips and Clear all are one block in `assets/app.js`. A popover is fixed to the viewport, so the menu block now re-places every open popover — this panel, the row menus and the column chooser — on scroll and resize, and closes one whose trigger has scrolled off the screen; before that the panel tore away from its button on the first wheel click. Open: filters are not remembered between visits, like the chosen columns (56) and the collapsed rail; and there is no saved-filter-set feature — if one is ever asked for, this panel is where it lands.

## 90 · 2026-09-21

**Identifier filtering is one filter for all twelve identifiers, not one control per identifier**: a **Field** select (Bloomberg code, ISIN, CUSIP, FIGI, SEDOL, VALOR, WKN, RIC, Yahoo code, SIX Code, SIX Schema, SIX Bc) and a **Condition** select with exactly two values — **Empty** and **Filled**. Presence is the whole question: matching a value is the search box's job, which already matches every identifier (44), so there is no *contains* and no value box. Half a filter filters nothing: until both selects are set the list is untouched, and the Condition select stays disabled until a field is picked. **Ref. Ticker in the old back office is RIC** (the Refinitiv ticker), and that is the name it keeps here.

**Why.** The old back office had three fixed toggles — Ref. Ticker, Yahoo code, Schema SIX — plus a text search on BC Six. Three is an arbitrary three: the same question ("which instruments are missing the identifier their source is keyed on?") is asked of ISIN, VALOR and SIX Code just as often, and twelve tri-state toggles is not a panel, it is a form. One row asks it of any of them. The BC Six search box is not rebuilt: searching a code is searching, and the search box already matches every identifier (44) — a second search field inside the filters panel would be a second place to type the same thing. Open if it turns out the search box is too blunt for a short shared code such as `67`: the answer is a better search, not a value box in this row. Identifiers ride on the row as one attribute, `data-ids="isin=US0378331005;ric=AAPL.O"`, because nothing but this filter reads them; the parser splits on the first `=` only, so values containing `=` (`XAU=`, `SARON3MD=`) survive, and values may not contain `;`.

## 91 · 2026-09-21

**The record dialog has two modes, not three: `create` and `record`. Viewing an instrument and editing it are the same screen.** Opening a record — from the name in the list or *Open* in the row menu — shows every editable value as a live field, already filled. There is no read-only pass, no *Edit* button and no mode to switch into. What cannot be typed is not a disabled field but a value printed beside the fields, in the section it belongs to: **Products** in General details, the prices, the six changes, the 52-week range and Volatility 90D under Source and Based on, and the whole of Record info at the foot. The footer is **Close · Save changes**, and *Save changes* is disabled until the form is dirty. The header's name and subtitle follow the Name, Type and Bloomberg fields as they are typed. *Edit* leaves both More menus; the row menu's *View details* and *Edit* become one **Open**. Amends 75, which set three modes.

**Why.** Designer, 2026-09-21. **Why:** the two modals were the same instrument twice. An admin who opened a record to check a ticker and found it wrong had to press *Edit*, wait for the same fields to be drawn again, and re-find the one they were looking at — a mode change that carried no new information and cost the reading position. Every field the view showed was a field the form showed; the only honest difference between them was whether the fields could be typed in, and that is not a difference worth a second screen. **Why the fields are live rather than read-only with an inline edit per field:** click-to-edit hides which values are editable until they are hovered, and this record has four groups where editability is the interesting distinction — a form that is simply open says it in one look. **Why the fetched numbers are values and not disabled inputs:** a disabled input is still drawn as a control, so it invites a click that will never do anything and reads as *temporarily* unavailable. These numbers are never typed by anyone; they are not fields at all. **Why Save changes starts disabled:** reading is the common case. A primary action lit on open is an action waiting to be pressed, and there is nothing yet to save. Dirty is app.js's own `data-guard` flag, the same one *Discard changes?* reads (68), so the button and the confirmation can never disagree. **Why the header follows the form:** with one surface there is no moment where the title and the Name field can be showing two different names. **Cost:** the record dialog is now one long scroll — three sections and Record info — where view and edit were two shorter ones. Accepted: 768px at 85vh with only the body scrolling (75) was already the shape, and one scroll through an instrument beats two screens of the same instrument. **Open:** whether *Save changes* should also write the edited values back into the row behind the dialog; in the prototype it closes and the list keeps what it had.

## 92 · 2026-09-21

**`--chart-1..5` are rebuilt from the brand, and `--chart-1` *is* the brand.** The shadcn defaults (orange, teal, slate, two yellows) are gone. 1 `#200766` = `--primary` · 2 `#9E5598` · 3 `#147175` · 4 `#8183CD` · 5 `#284E7D`. Every one clears 3:1 against the page, which is what WCAG 1.4.11 asks of a line that carries meaning.

**Why.** Decision 23 parked this until the first chart appeared, and the price history on the instrument record is it. **Why 1 is the brand:** a back-office chart is almost always one series, and one series drawn in the product's own colour needs no legend and no second colour to explain it. **Why the other four step around the status hues** (18 red, 77 yellow, 152 green, 240 blue): a series must never be readable as a state (31). They also alternate light and dark, which is what keeps them apart in greyscale. **What is provisional:** everything above 1. A five-colour categorical set chosen against no data is a guess, and it is revisited when a chart with unrelated series actually exists. A series that encodes a status takes the status colour, not a chart colour.

## 93 · 2026-09-21

**The record is two tabs: `Instrument details` and `Instrument performance`.** The strip sits between the dialog header and the body and does not scroll with the panel (`.dialog-tabs` — the same underline tabs as a page's, 34). **Details** is the form plus Record info: General details, Financial identifiers, Data source, Record info. **Performance** is the whole `Market data & performance` section (32): the freshness line and `Refresh data`, Last price and Last close, the price chart with the session readout, the six percent changes, the 52-week range, Volatility 90D. **`create` has no strip at all.** The form's third section is renamed **Data source** — it holds Source and DataBasedOn and no market data.

**Why.** The record was already a full 85vh of scrolling before any history was added, and the chart block is about 380px of it: without a split, `Price change` and everything under it leaves the screen on a record that is mostly read. **Why the seam is here:** 91 made reading and editing the same act, so the dialog can no longer be divided by mode — it divides by **ownership** instead. The first tab is everything an admin types, the second is everything a provider sends, and nothing on the second is ever typed (32, 83), so switching away from it can lose nothing. That also answers the obvious objection to tabbing a form: a half-filled field is never hidden by this strip, because the second tab has no fields. **Why `create` has no strip:** a new instrument has no history, so the tab would open on an empty state every time — a promise the screen cannot keep. **What is deliberately not split:** Record info stays with the details, small type at the bottom of the form, because it is about the row in the database and not about the market.

## 94 · 2026-09-21

**The price chart prints the session under the cursor as text under the chart, and the window is a toggle group of six periods — 1M, 3M, 6M, YTD, 1Y, 3Y — not a drag brush.** One line of closing prices in `--chart-1`, horizontal grid only, no area fill. The plot takes focus: left and right arrows move one session, with Shift a month, Home and End the ends; leaving it with the pointer puts the readout back on the latest session. Default window 1Y, the same period as the 52-week range printed under it. The readout is five cells — Session date, Open, Close, High, Low — in the same `.stats` strip the percent changes use, and `aria-live="polite"`. `LastOpen`, `LastHigh` and `LastLow` are that latest session's three values, so they are printed once, as the session, and no longer as their own props.

**Why.** **Why the values are not in a tooltip, which is what the reference did:** the whole reason the panel exists is that someone needs to read a day's numbers. A number that exists only while the mouse is held still cannot be checked against the field above it, cannot be copied, and cannot be reached without a mouse. Printing it under the chart costs one row and turns the chart into a pointing device instead of a container for hidden data. **Why periods and not the brush:** a two-handle brush is mouse-only — the column chooser got keyboard reordering for the same reason (57) — and an admin checking an instrument wants *a month* or *a year*, not an arbitrary window they have to drag twice to get. Six buttons also name their windows, which a brush never does. If free ranges are wanted later, the brush is an addition to this control, not a replacement for it. **Why no candles and no volume:** this is a back office, not a terminal; the question it answers is "does this series look like the numbers we are publishing", and a line answers it. **The demo series:** a deterministic walk per instrument, ending on the record's last close and corrected so every stated percent change lands on its own session, with the 52-week range read back off the same series — so nothing on the panel can contradict anything else on it. In production the series is a second endpoint (daily OHLC) and the drawing is a chart library. **Open:** an exact-date lookup. Hovering to 12 March is imprecise; if admins turn out to check specific dates the answer is a date field or a session table under the chart, not a bigger chart.

## 95 · 2026-09-22

**The instrument's More menu is *View details* · *Refresh data* · *Delete instrument*. Deactivate is out of both menus, and *Open* is renamed *View details*.** Delete always asks first, and the question has two forms, decided by one number the row already carries — `ProductCount`. **No products:** *Delete `<name>`?* · "The instrument, its identifiers and its price history go with it. This cannot be undone." · Cancel · **Delete instrument** (destructive). **One or more products:** the delete is **refused**. *`<name>` cannot be deleted* · a warning alert naming the number — *34 products read this instrument* — and what it would cost them · Cancel · **Edit instrument** (primary), which closes the question and opens the record. The same component answers from inside the record, minus the alternative: there the primary button is *Back to the instrument*, because the record already is the editor. `#confirm-delete` on the list is a modal `<dialog>`; `#confirm-delete-record` is a `popover="manual"` inside the record dialog, for the stacking reason in 68.

**Why.** Designer, 2026-09-22. **Why *View details* and not *Open*:** *Open* names the mechanism, not the destination — every row in the list opens something. The menu item now says what is behind it, and it matches the words the screen's own documentation uses. **Why delete rather than deactivate in the menu:** deactivation is a state of the record (see `instruments.md`, *Active*), not an action on a list row — it belongs beside the status badge, where it can also be reversed. Deleting is the one thing in this menu the row cannot undo, so it is the one thing that earns a confirmation. **Why products refuse the delete instead of warning about it:** a product priced from an instrument does not degrade when the instrument goes, it breaks — its valuations stop and the history behind them is gone. A warning asks an admin to accept a consequence they cannot see the shape of; a refusal that prints the number tells them what they actually hit. **Why *Edit instrument* is offered in its place:** an instrument with 293 products on it is almost never unwanted — it is wrong. The delete is reached from the same menu as the record, so the dialog hands over the thing that was wanted rather than leaving a dead end. **Why the count is read off the row and not fetched:** the number in the question and the number in the Products column behind it can then never disagree; in production the server owns the refusal and this dialog only states the count it was given with the row. **Costs, stated plainly:** (1) nothing on the screen can deactivate an instrument any more — the switch beside the status badge has to be drawn, and until it is, this is the screen's first open item; (2) the refusal is a design rule that the API has to agree with — if the server cascades instead, this dialog becomes a destructive confirmation that asks for the name to be typed, and only the copy changes; (3) the confirmation is duplicated in markup, once at the top level and once inside the record, because a modal dialog makes everything outside it inert (68) — in Spartan both are one `hlm-alert-dialog`. **No undo and no toast:** the row leaving the list is the confirmation, and the kit has no toast (89, `kit/components.html`); if deletes turn out to be frequent, undo is a new component, not a tweak.

## 96 · 2026-09-22

**General details is reordered and the pair of taxonomy fields is made dependent.** (1) **Products moves into the dialog header**, on the description line beside the type and the ticker — `Equity · NESN SW Equity · 34 products`, the count in `foreground` and medium weight, the identity in `muted-foreground` and truncating before it. It is no longer a `.prop` at the foot of General details. (2) **Instrument name and Instrument type share one row**, name on the left, and the note under the type (*The type decides which fields the instrument has*) is deleted. (3) **Country and Currency swap places** and the row splits `1fr 10rem` instead of in half, so Currency is the width of what it holds; the `GBp` option drops its *— pence* gloss, which now lives in `instruments.md` only. (4) **Sector is labelled Financial sector**, and **Industry group is its dependent list**: each option carries `data-sector`, only the chosen sector's options are offered, the select is disabled with *Pick a financial sector first.* until a sector exists, and an industry that does not belong to the new sector is cleared. Amends 91.

**Why.** Designer, 2026-09-22. **Why Products belongs in the header:** it is the number that decides what may be done to the instrument — deletion is refused while it is above zero (95) — and it was sitting below three groups of fields, found by scrolling. In the header it is read in the same glance as the name and the status, which is where every other question about the record's identity is answered. It stays text rather than a badge because a badge beside the status badge would read as a second state. **Why it keeps the word:** *34* alone is a number with no unit; the header has no label to give it one. **Why name and type share a row:** they are the two answers that make an instrument nameable at all, and they were the only two single-field rows in a section that is otherwise pairs — a form that starts with two full-width controls looks like it will be twelve. **Why the type's note goes:** it warned about something the form then shows anyway — pick Credit index and Total entities appears. A sentence that describes what the next click demonstrates is furniture. **Why Currency is sized to content:** a half-row control holding `CHF` reads as a field that is missing something, and the eye stops to check. 10rem fits the longest value with room to spare; Country takes the slack because it is the long value of the pair. **Why the swap:** country then currency is the order the row is read in — the place first, then the money it trades in — and it matches the list, where Country sits left of Currency. **Why the industry list is dependent and not just long:** sixteen industry groups across seven sectors offered as one list makes every wrong pair reachable, and a wrong pair is not caught by validation because nothing here is required (70). Filtering makes the invalid combination unavailable rather than rejected. **Why disabled and not empty:** an empty select with a placeholder says *nothing is chosen*; a disabled one with a line under it says *nothing can be chosen yet, and here is why*. Same pattern as the identifier filter's Condition select (90). **Why the leftover is cleared and not kept:** an instrument whose sector and industry disagree is worse than one with an empty industry, and the admin can see the field went empty. **What is provisional:** the mapping. It is GICS industry groups and it covers every pair the demo rows use, but the agreed taxonomy is the product owner's — in production both lists come from the server and the second is fetched for the sector. **Open:** the list column header and the filters panel still say *Sector*. If *Financial sector* is the official name, both follow; the column header is the only place where the extra word costs width.

## 97 · 2026-09-22

**The record dialog has no More menu, and Products is a card in its header.** The `⋮` button and the `#instrument-menu` popover are deleted, and with them the record's own copy of the delete confirmation. **Deleting is a list action**: the row menu is the one place it is asked from (95). *Refresh data* is unaffected — it is the button on the performance tab (93). **Products** leaves the description line it was put on by 96 and becomes a **`.metric metric-sm` card between the heading and the close button** — the label *Products* over the bare number, the list's own metric cell at a smaller size (padding down a step, value 20px so it does not tie with the 24px title). It is an `<a>`, because `ProductCount` always leads to the products it counts (`domain.md`); `a.metric` gets the same hover and focus ring as a clickable cell. Amends 95 and 96.

**Why.** Designer, 2026-09-22. **Why the menu goes:** it held two items, and both had somewhere better to be — *Refresh data* is already a button on the tab that shows the data it refreshes, and *Delete* is asked of a row, not of an open form. A menu that exists to hold one action that is elsewhere is a button that hides things. **What it costs, stated plainly:** an admin who opened a record and decided to delete it has to close the dialog and use the row menu. Accepted: deleting is rare, refused outright while products exist (95), and the return trip is one Escape — against a header that is now two controls instead of three on every record that is only being read. **Why a card and not a line of text:** the count answers *how much is built on this*, and on a line beside the type and the ticker it read as part of the instrument's name rather than as a number. In the cell it has a label, a size and a border of its own — the same object the summary row above the list uses, so the screen says its numbers one way. **Why it is a link:** the number is never the end of the question. It is `href="#"` here and the Products screen is where it goes. **Why small:** a 24px value beside a 24px title is two things shouting; 20px under a 12px label is read second, which is the right order. **Cost:** a new size variant (`metric-sm`) and an `<a>` state on a recipe that had `<div>` and `<button>` — both documented on `kit/components.html`.

## 98 · 2026-09-22

**The form keeps its two columns, and a short answer is capped inside its column rather than given a column of its own.** Every row of General details is the plain two-column `.field-row` again, so Instrument name, Country and Financial sector are one width (the left column) and Industry group is the right column's full width. **Instrument type and Currency are `max-w-40` (10rem) inside the right column**, left-aligned with it — the same width as each other and the same left edge as Industry group. Replaces the `1fr 10rem` split 96 gave the Country/Currency row.

**Why.** Designer, 2026-09-22. **Why:** a row that splits at a different point from the rows above it moves the second column, and the eye reads that as a new group starting. With the columns fixed, the form has two vertical lines down its whole length and the short controls simply stop early — which is the thing that was actually wanted from 96: a control the width of what it holds, not a column the width of one control. **Why the cap and not a narrower grid:** the column is where the field *starts*; how far it runs is the field's business. `max-w-*` on the `.field` says exactly that and leaves the grid alone. **What it costs:** a bit of unused width to the right of Instrument type and Currency. That is the point — empty space beside a three-character value reads as finished, where a half-width box around it reads as unfinished.

## 99 · 2026-09-22

**The field is called *Financial sector* everywhere it is shown: the record form, the list's column header, the filters panel and the column chooser.** `Sector` stays the field's name in the data and in `domain.md`; only the label changes. The column's second line is still the industry group, and the filter's off value is still *All*.

**Why.** Designer, 2026-09-22. **Why:** 96 renamed it in the form only, which left the same value labelled two ways on one screen — an admin filtering by *Sector* and then editing *Financial sector* has to work out that they are the same field, and the frontend gets two names for one API key. A label is either the field's name or it is not. **What it costs:** seven characters in a column header, which is the only place in the list where the longer name takes width; the column's own cells are unchanged and still cap at 220px. **Not renamed:** the `sector` data attribute, the `data-col`, the hidden input's `name`, and every decision row above that quotes the old label — the log is a record of what was decided, not a copy of the current screen.

## 100 · 2026-09-22

**The record header carries the status switch, and the record footer carries Delete.** **Status:** the badge reads the state and a `.switch` beside it changes it — the *badge plus a switch* the header owed `Active` since `domain.md`. Switching **off** asks first (*Deactivate Apple Inc.?* · market-data updates stop, the last price freezes · a warning naming the products that freeze with it) and the switch is put straight back until the answer comes, so it never shows a state the record does not have; switching **on** is its own answer and applies at once. The switch sits **outside the form**: the status is an act with its own confirmation, it never makes *Save changes* light up, and *Save changes* still writes only fields (91). **Delete:** a `btn-outline` **Delete instrument** at the left end of the footer (`.dialog-footer-start`), opening the same two answers as the list's (95) — refused with the product count, or destructive with no undo. **One confirmation element for both acts**, `#confirm-record`, a manual popover inside the dialog (68), filled by `instruments.js`. Deactivating writes the row too: status, the `data-inactive` mute (55), the Deactivated tooltip, and the inactive count above the list. Amends 95 and 97.

**Why.** Designer, 2026-09-22. **Why the switch and not a menu item:** deactivation is reversible and it is a *state*, so the control that changes it belongs next to the thing that shows it — a toggle says what is true now and what pressing it does, which a menu item named *Deactivate* only half says (and it needed a second, differently named item for the way back). **Why off asks and on does not:** switching off stops updates for every product reading the instrument; switching on restores what was stopped and loses nothing. A confirmation on a harmless act teaches people to dismiss confirmations. **Why the switch is outside the form:** a status that waited for *Save changes* would sit in two states at once — visibly off, actually on — and it would make the form dirty, so closing the record would ask to discard a change that was never a field. **Why Delete came back into the record after 97 removed it:** designer's call, 2026-09-22 — an admin who has just read the record is exactly who has decided it should go, and closing the dialog to reach a row menu is a detour. What 97 removed is the *menu*, and it stays removed: this is a named button, in the footer, where the record's other verbs are. **Why the button is not red:** the destructive answer belongs to the confirmation, never to the button that opens it (`kit/components.html`). **Why one confirmation for both:** the two questions have the same shape — what it does, how many products feel it, one answer — and two near-identical blocks in one dialog is two places to change the same copy. **Costs:** the record header now has four things (name, badge, switch, Products card) plus the close button; and the status writes straight to the row, so the prototype's undo for it is switching it back.

## 101 · 2026-09-22

**The design system is ordered by Atomic Design and read in a Storybook-style shell: a tree in a left sidebar, one page per component.** Five layers, in build order: **Foundations** (tokens, type, spacing, icons) → **Atoms** (Button, Input, Textarea, Select, Checkbox, Radio, Switch, Badge) → **Molecules** (Form field, Card, Metrics, Alert) → **Organisms** (Table, Filters, Dialog, Navigation) → **Templates** (Form example, Instruments screen). A component sits in the layer it is *built* at, not the layer it is used at — a Badge stays an atom although it spends its life inside a table row. `kit/components.html` is now the overview; each component has its own page under `kit/components/`, with its sections listed in the sidebar under the open item, a filter box (`/` focuses it) and previous/next links.

**Why.** Designer, 2026-09-22. **Why:** the catalogue had reached 1 441 lines and sixteen components on one page, so the only way to find a component's states was to scroll past every other component, and nothing on the page said which parts the rest were built from. Atomic Design is also the order to build in: an atom whose states are undecided makes every organism holding it a guess. **Consequences:** the tree is written once, in `assets/kit-nav.js` — adding a component is a page plus one line there, and the sidebar, the overview and the pager all follow. `assets/kit.css` carries the shell and is deliberately *not* in the list `tailwind.js` concatenates: everything in that list (`theme.css`, `components.css`) is what the Angular developer ports into Spartan, and documentation chrome does not belong there. The in-page anchor lists and the top header strip are gone from every kit page; the tree replaced both.

## 102 · 2026-09-22

**The button has five variants, not shadcn's six: `btn-secondary` is dropped.** What remains: `btn-default` (the one primary action), `btn-outline` (the second action beside it, and the quiet ones — Cancel, Export, Filters), `btn-ghost` (toolbars, icon buttons in rows), `btn-destructive` (irreversible, only inside a confirmation), `btn-link` (an action that *undoes state* and sits in a panel header — Clear all, Reset).

**Why.** Designer, 2026-09-22. **Why:** counted across the whole prototype, `btn-secondary` had **zero** uses — ghost 27, outline 28, default 10, destructive 5, link 4, secondary 0. Not an oversight: its documented job, *a second action of equal weight beside the primary one*, does not occur in this back office. Every pair here is Cancel + Save, which is outline + default. Left on the Button page it taught a false choice — the next person reaches for `secondary` for a Cancel and the product has two ways to draw the same button. **Consequences:** the recipe is gone from `components.css`, which keeps the note saying why, and the Button page states the absence as a rule. Spartan still ships `variant="secondary"` — this is our system declining to sanction it, not a gap in the library, so it is cheap to reinstate the day an action actually needs it. The `--secondary` token stays: `badge-secondary` and the quiet fills still use it (the Foundations swatch note was corrected to say so).

## 103 · 2026-09-22

**A button's size is decided by the container it stands in, not by how important the action is.** `btn-sm` (32px) for anything that lives on a screen: the page toolbar, every icon button in a table row, panel headers, pagination, a dialog's close ✕, controls inside a dialog body. Default height (36px) **only** in a dialog or confirmation footer. `btn-lg` (40px): nothing, so far.

**Why.** Designer, 2026-09-22. **Why:** the rule was already obeyed everywhere and written down nowhere — counted on the Instruments screen, 25 of 39 buttons are `btn-sm`, the other 14 are default height and **every one of the 14 is in a footer**. Stating it as *the container decides* removes the judgement call: the question is never "how important is this action" but "what am I standing in", and two buttons side by side can no longer disagree. **Open:** `btn-lg` is where `btn-secondary` was before 102 — zero uses, and the empty state it was reserved for (*Clear all filters*) uses `btn-sm` like the rest of that screen. Either an action earns it or it goes.

## 104 · 2026-09-22

**The kit draws states, it does not describe them — and it draws every variant in every state.** Hover and focus are reachable in the kit through `[data-demo~="hover"]` / `[data-demo~="focus"]`, hung off the *same* rule as `:hover` and `:focus-visible` in `components.css` rather than restated: `.btn-default:hover, .btn-default[data-demo~="hover"] { … }`. Disabled and loading need no hook — the demo carries the real `disabled` / `aria-busy`. Button now shows a 5 variants × 5 states matrix, and a second one for label-only / icon+label / icon-only.

**Why.** Designer, 2026-09-22. **Why:** the page had said *"focus shows a 3px ring (press Tab)"* beside a button identical to the one marked Rest — a caption, not a specimen, and nothing at all for the four variants that were not `btn-default`. **Why the shared rule and not a copy:** a demo that restates the hover colour is a second source of truth and drifts the first time someone tunes the real one. Sharing the declaration makes drift impossible. `data-demo` is never set in product markup; it costs one attribute selector per state. **Consequence:** this is the pattern for every other component page — Input, Select, Checkbox and the rest still describe their states where they should draw them. **Found by it:** the focus ring measures **2.06:1** against the page (`--ring` at 50%), and the destructive ring **1.33:1** — WCAG 1.4.11 asks 3:1 of a focus indicator. Raised as a separate question; the solid `--ring` would be 5.10:1.

## 105 · 2026-09-23

**The prototype opens on the design system, and the kit sidebar carries a two-way switcher: `Design system` / `Pages`.** `prototype/index.html` **is** the design-system overview — no landing page in front of it — so `/` lands straight in the kit. `prototype/pages.html` is the other half: the six areas of the Admin panel, the one that is built linked and the five that are not listed greyed, marked *not built*. The switcher sits between the logo and the filter box; the *Design system* caption that used to sit under the brand is gone, because the switcher now says which half is open. The old `kit/components.html` is deleted — the root took its content — and `Instruments screen` moves out of **Templates** into **Pages**.

**Why.** Designer, 2026-09-23. **Why the split falls there:** it is Atomic Design's own last step (101). A *template* is the layout of a screen with nothing real in it — the form example; a *page* is that template filled with the real thing — the Instruments list. So the switcher is not a convenience over the tree, it is the one seam the method already had. **Why the root and not a redirect:** an entry page whose only job is to link onward is a click charged for nothing, and it was the only page in the prototype outside the kit shell. **Why the unbuilt screens are listed at all:** a system that shows only what exists says nothing about what is owed; five greyed rows are how the sidebar tells a developer the difference between *done* and *not started*. They are spans, not links — nothing to go to, and the word *not built* carries it, since grey alone reads as merely quiet. **Consequences:** `kit/components.html` now 404s; entries 88, 95, 97 and 100 point at it and are left as written, since the log records what was decided when. The sidebar footer's *Prototype index* link is gone with the page it led to, and the filter box renames itself *Find a screen* on the Pages side.

## 106 · 2026-09-23

**The product is called *Admin panel*.** Every `<title>`, the kit sidebar's brand line, the docs and the README say `Admin panel`; the app sidebar's home link is the logo (decision 25), so the name does not appear there.

**Why.** Designer, 2026-09-23. **Why:** the product answered to two names — the screens had said *Admin Panel* since they were built, while the kit, the titles and the docs still said *Back office*. One name, and it is the one already on the screen. **What was deliberately left alone:** `docs/instruments.md` says *the old back office* about VIZ 1.0 — that is the previous system, not this one; and the rows above in this log keep the words they were written with. `domain.md` no longer glosses the product as *(admin panel)* — it is the name now, not the gloss.

## 107 · 2026-09-23

**Modals are a navigation section of their own under Pages, and a modal is documented by loading the real screen, not by copying it.** `pages/instrument-record.html` lists the eleven states of `#instrument` — create · record at rest · record edited · record on the performance tab · record deactivated · *Discard changes?* · *Deactivate?* · delete refused · delete destructive · and the list's own two — each one opened live in a frame by `screens/instruments.html?state=<id>`. The `?state=` block at the end of `instruments.js` is documentation scaffolding: product code never reads it, and with no query string it does nothing.

**Why.** Designer, 2026-09-23. **Why modals sit apart from screens:** nothing navigates to a modal — it is a state of the screen that opens it — but its own states are where most of a screen's decisions actually live, so a line in the Screens list would have buried them. **Why a live frame and not specimens:** a modal only exists inside the screen that opens it, and a copy in the kit is a second source of truth that goes stale the first time the real one is tuned — the same reason `data-demo` shares a declaration with `:hover` instead of restating it (104). The frame runs at 1440×900 and is scaled down to the room the page has, rather than being squeezed into it: a 768px dialog inside a 700px frame wraps in ways the real screen never does. It is also allowed out of the text column, since prose wants a measured line length and a specimen wants the screen. **Two states are forced, and the page says so:** no instrument in the demo data has a product count of zero, so the destructive branch of either delete confirmation cannot be reached by clicking; `?state=delete` and `?state=list-delete` set the count to zero on the way in. **Written down because it was found by doing this:** the record has no validation state at all (nothing sets `aria-invalid`), nothing is ever pending (`.skeleton` is in the recipes and unused), and saving is instant and silent — no saving state, no failure, no confirmation. All three are on the page under *Not drawn yet*, so the gaps are not mistaken for decisions.

## 108 · 2026-09-25

**Every column of the instruments list holds one value. No cell has a second line.** The four two-level columns of 46 are split: **Bloomberg code** becomes a column of its own after Instrument; **Source** a column after Last price; **Industry group** a column after Financial sector, off by default; and a date with its time is one value in one cell, `18 Sep 2026, 10:12:03`, in Updated, Created and Modified alike. The failed-update marker (66) keeps its cell and moves its *Showing* line into the tooltip's last row; a never-updated instrument is an em dash whose tooltip reads *Awaiting first update*. Default columns, in order: Instrument, Bloomberg code, Type, Financial sector, Products, Pricer, Currency, Last price, Source, Updated, Status. Offered off by default: Industry group, Country, Last close, Chg YTD, Volatility 90D, Created, Modified. Rows return to one line. Supersedes 46; amends 45, 47, 51, 52, 56, 66 and 99 where they speak of a second line.

**Why.** Designer, 2026-09-25, after the product manager asked to edit Name, Code, Type, Currency, Last price and Source directly in the table. **Why:** inline editing is one control per cell in every product that has it (Salesforce refuses compound fields outright; Airtable, Notion, Attio edit one attribute per cell; Shopify flattens its stacked list into a separate spreadsheet before it lets anyone type). A two-level cell would have to become two stacked fields in edit and grow the row to 81px, or send the second value to a popover; neither is a table anyone else ships. With one value per cell an editable cell is exactly one control and the row grows by 4px. The pairing that 46 protected — a source under its price, a code under its name — is not lost, it moves one column to the right, where it can also be sorted and turned off. **What it costs:** two more default columns; the default set needs about 1410px and scrolls sideways on a 1440 screen next to the sidebar, with Instrument pinned (58). A row of *Financial sector* next to a dash-filled *Industry group* is why the latter is off by default. **Edit in list** itself stays a proposal (the row menu's *Edit in list*, row edit à la PatternFly: Enter saves, Escape cancels, Save lights up when dirty, the sorted column unsorts on save, and Last price is read-only while the source is SIX, Yahoo or Bloomberg, per 83); it is not yet a decision.

## 109 · 2026-09-25

**Row actions are four icon buttons in the row, not a More menu: *View details* · *Edit in list* · *Refresh data* · *Delete instrument*, in that order.** Each is a 32px `btn-ghost btn-icon btn-sm` with a tooltip and an `aria-label` that names the instrument (10); 4px between them (87, `.row-actions`). *Refresh data* is `disabled` on an inactive row, whose updates are stopped (100). While a row is in edit (108) the four are replaced by Save and Cancel. The `#row-menu` popover is deleted; `.menu` stays for the column chooser. The kit's table demo shows the same pattern with three icons. Amends 22 (one More button per row), 56 (the chooser sits above the row action icons) and 95 (the menu's items are now the icons; everything 95 says about Delete's two answers stands).

**Why.** Designer, 2026-09-25. **Why:** with editing moving into the list (108), the row has four actions an administrator reaches for many times a day, and a menu puts every one of them two clicks away and hides which exist. Four icons make each one click and visible on every row. **Order:** the menu's order is kept — view, edit, refresh, then delete last, so the destructive action is never between two safe ones. **Delete is a ghost icon, not a destructive one:** a red icon on every row would shout down the data; the confirmation (95) carries the red, and the icon only asks. **What it costs:** the actions column grows from 48px to about 148px, and twelve rows show forty-eight icons — the visual weight is taken out by the ghost variant, which paints nothing until hover. Bulk actions remain out of scope (42).

## 110 · 2026-09-25

**Country is a column, in words. There are no flags anywhere in the list.** The `Country` column moves from *offered, off by default* to *on by default*, after Financial sector; an instrument without a country shows the em dash. The flag tile after the name, its CDN SVG set, the empty 16px slot and the `.flag` / `.flag-empty` recipes are deleted. Supersedes 41; amends the default column list in 108.

**Why.** Designer, 2026-09-25. **Why:** with one value per cell (108) the name cell was the last cell carrying two things — a name and a country — and a flag is the one value in the row that could not be sorted, filtered by eye or typed into. A word can. A flag also asks the reader to know 20-odd flags by sight, and an index or a commodity has none, so the tile was blank on a third of the rows. **What it costs:** one more default column (about 100px), and the sidebar-plus-1440 case scrolls a little further; the Instrument column stays pinned (58).

## 111 · 2026-09-25

**The logo is the VIZIBILITY wordmark, `prototype/assets/logo.svg` (327×40, `#0B062A`), used as delivered.** Sidebar header at **20px** tall, not 28: at 28px the wordmark is 229px wide, more than the 256px sidebar can give it beside the collapse button; at 20px it is 164px. The collapsed rail shows the wordmark's **V** alone, cropped from the same file (43.218 of 327 units), and the header grows by 28px, not 36. `logo-mark.svg` is that V on its own — favicon and kit-sidebar brand — and stands in until a mark is delivered. `alt` reads *Vizibility*. Asset URLs bumped to `?v=2026-09-25`. Amends 25.

**Why.** Designer, 2026-09-25, artwork supplied the same day. The delivered file has no separate mark, so the V is a derivation, not brand-approved: if a mark exists, it replaces `logo-mark.svg` and the crop rule in `components.css`. The fill `#0B062A` is not `--primary` (`#200766`, 23); the logo is not recoloured to match, per 25.

## 112 · 2026-09-25

**The mark is delivered: `logo-mark.svg` is the "V." (54×40, `#0B062A`), used as delivered.** The collapsed rail shows this file, not a crop of the wordmark: the brand link holds two images, `.sidebar-wordmark` and `.sidebar-mark`, and the rail state swaps which one is shown. Both are 20px tall, so the V is the same size open and collapsed. The crop rule from 111 is deleted. Amends 111.

**Why.** Designer, 2026-09-25, artwork supplied the same day. Two images rather than one `src` swapped in JS: the state is already a CSS attribute (`data-collapsed`), and a second 1KB SVG costs less than a script that has to know two file names.

## 113 · 2026-09-25

**In a select list and in a menu, the highlighted item runs the full width of the list.** The container's inset is vertical only (`py-1`, was `p-1`); the item loses its `rounded-sm` and takes the 4px it gained as padding (`pl-3 pr-9` on `.select-item`, `px-3` on `.menu-item`), so the text stays where it was and only the highlight grows to the edges. Items are `whitespace-nowrap`: a long option (*Structured product*) widens the list past a narrow trigger instead of wrapping to two lines. The column chooser keeps its own list and is unchanged.

**Why.** Designer, 2026-09-25, from the record form's Type select, where *Structured product* wrapped inside the 10rem trigger (98) and the highlight sat as a pill 4px short of each edge. Edge to edge, the option reads as the row it is; the pill reads as a button inside a row. shadcn's `p-1` inset is the deviation dropped. Same rule for `.menu-item` so the two lists stay one component to the eye.

## 114 · 2026-09-21

**The Instruments list filters on seven things: Status, Pricer, Currency, Source, Sector, Country and one identifier condition** (90) — plus the search box, the type tabs and the Failed updates cell, which are filters with their own controls. **Pricer** (Yes / No) and **Source** are new; Status, Currency, Sector and Country move into the panel unchanged. Every select reads **All** as its off value, because the label above it already says what it is.

**Why.** Pricer answers "what does the pricer actually offer", which the summary row counts (72) but could not list. Source is the other half of every data-quality question: *Source is SIX and SIX Code is empty* is an instrument that will never update, which until now was findable only by reading rows. Deliberately not filters: Type (the tabs), anything on the detail page only, and a date range on Updated — the ageing question is asked by sorting on Updated and by the Failed updates cell, and a date picker in the panel would be the largest control in it for the rarest question. Prototype: `data-pricer`, `data-source` and `data-ids` are on every row in `screens/instruments.html` and are written for a created instrument by `instruments.js`; in production the query goes to the server and the panel sends the same seven names. *Numbered 91 until 2026-09-25, when it was found sharing that id with the record-dialog decision; renumbered to 114.*

## 115 · 2026-09-25

**The instruments list's default columns, in order: Instrument · Status · Pricer · Currency · Last price · Last update · Timestamp · Type · Products · Created · actions.** Everything else is offered in the column chooser, off by default: Bloomberg code, Source, Last close, Chg YTD, Volatility 90D, Financial sector, Industry group, Country, Modified. Two new things: **the source moves into the Last price tooltip** (*Source: SIX*, on a focusable span, so it is reachable by keyboard like the Inactive badge's), and **Timestamp is a new column** — the time the *provider* stamped on the price, as against *Last update*, which is when our system wrote it; the two can differ by days when the provider hands over an older price. `Updated` is renamed **Last update** in the header, the chooser and the record's market-data note, which now reads *Last update … · Timestamp …*. Hidden columns keep their place next to their relatives (Bloomberg code after Instrument, Source after Last price, the three market-data columns after Timestamp, the taxonomy trio after Type, Modified after Created). Amends 108 (default set) and 110 (Country off by default again); supersedes the order in 52.

**Why.** Product manager, 2026-09-25, relayed by the designer. The list is the product manager's reading order, taken as given. **Timestamp** is the record's *data dated* (32): the field exists, it only had no column. The name is the product manager's; a header that says *Timestamp* next to *Last update* asks the reader to know which clock is which, so the two are documented side by side in `instruments.md`. **Provider** in the request is the field the product calls *Source* everywhere (32, 62, 91); one field, one name (99), so the tooltip says *Source*. The default set is 1414px wide at the fixed desktop size, which fits the list next to the sidebar.

## 116 · 2026-09-25

**The tooltip on a row action is one verb: *View* · *Edit* · *Refresh* · *Delete*.** The object is the row the icon sits in, so naming it again (*View details*, *Delete instrument*) repeats what the eye already has. The `aria-label` keeps the full sentence with the instrument's name (*Delete Apple Inc.*), because a screen reader has no row to look at. Same in the kit's table demo. Amends 109.

**Why.** Designer, 2026-09-25. A tooltip is read in the half-second before the click; one word is what fits that.

## 117 · 2026-09-25

**Last update and Timestamp in the instruments list are relative: *just now* under a minute, then `Nm ago`, `Nh ago`, `Nd ago`.** Each cell is a `<time datetime>` (the absolute value stays in the markup and is what a sort would use), focusable, with the date and the time in its tooltip on two rows — *Date 18 Sep 2026 · Time 10:12:03* — the same two rows the Inactive badge already uses. The record's note under Market data keeps the absolute form. The prototype fixes its clock at 2026-09-18 10:17 so the ages read the same on any day; production uses the real clock and re-renders the cells on a timer. Created and Modified stay absolute. Amends 115.

**Why.** Product manager, 2026-09-25, relayed by the designer. The two columns answer one question — is this price fresh — and an age answers it at a glance where a date has to be subtracted from today. The absolute value is one hover away for the cases that need it (which run, which provider stamp). The unit stops at days: a price weeks old is a broken feed, and *41d ago* says so more plainly than *1mo ago* would.

## 118 · 2026-09-25

**Row edit (108) covers Status and Pricer as well.** Status becomes the same switch the record header carries (100), with the word *Active* / *Inactive* beside it following the switch; Pricer becomes the real checkbox behind the static one (49). Saving writes the badge, the row's muted state, the Refresh icon's disabled state and the two summary counts. **Save is the confirmation:** switching the row off and pressing Save is two deliberate steps, so the *Deactivate <name>?* question of 100 is not asked a third time on top of them. The editable set in a row is now Name · Bloomberg code · Status · Pricer · Currency · Last price · Source · Type.

**Why.** Designer, 2026-09-25, on the product manager's request that Active and Pricer be editable in the list too. The switch rather than a select: it is the control the record already uses for the same field, and a two-value field is a switch. Open: whether a row deactivated from the list should also show the products warning the record shows (100); the row has no room for it, so if it is wanted it is a modal, the same *#confirm-delete* pattern (95).

## 119 · 2026-09-25

**The Active badge is `badge-success` with `ri-check-line`; the Inactive badge is `badge-secondary` with `ri-close-line`.** The dot of 21 stays for the multi-state lifecycle vocabulary (Live, Expiring); a two-state field gets the two icons, because *Active* and *Inactive* differ by a prefix and the eye needs a shape that differs. Everywhere the pair is drawn: the list, the record header, `addRow`, `setStatus`, `syncStatus`, the kit's badge and dialog pages. **In row edit (108, 118) Status is a `.checkbox`, not a `.switch`:** ticked is Active and matches the badge's check, clear is Inactive; the word beside it follows. Amends 21 and 118.

**Why.** Designer, 2026-09-25. A switch says *on / off*; a checkbox says *yes, this holds* — and next to Pricer's checkbox one column over, two checkboxes read as one row of facts where a switch read as a control of a different kind. The record header keeps its switch (100) until told otherwise: there it stands alone under the name and is the one control that changes state, not one of a row.

## 120 · 2026-09-25

**Refresh data is no longer one of the row-end actions: it sits in the Last update cell, before the age, and is invisible until the row is hovered, the button is focused, or it is busy** (`.cell-action`). It keeps its 32px box in every state, so the age does not move when it appears; the disabled state on an inactive row (100) stays. The row-end actions are three: View · Edit · Delete. Amends 109.

**Why.** Designer, 2026-09-25. Refresh acts on the thing the Last update cell shows — the age of the price — so it belongs to that value, not to the row's generic actions: the reader asking *is this fresh?* and the reader about to refresh are the same person looking at the same cell. Hidden until hover because it is the one action among the four that is reached for from the value, not from the row's edge; the three that remain are always visible. Keyboard users reach it by Tab, where it shows itself on focus.

## 121 · 2026-09-25

**Two corrections to the row (120, 108): the Refresh action sits *after* the Last update value, and a double-click anywhere on a row that is not a control — not a link, a button, a field or a select — switches the row into edit, the same as its Edit icon.** The double-click is swallowed so it selects no text; the name field takes focus. A row already in edit ignores it. Amends 120.

**Why.** Designer, 2026-09-25. After, not before: the age is what the eye lands on and the action follows it, the way the row-end icons follow the row. Double-click is the spreadsheet reflex the product manager's request (108) was about; it costs nothing to the reader who never uses it, since the Edit icon stays.

## 122 · 2026-09-25

**All text in the instruments list is one style — `foreground`, 14/400 — whatever the column.** The `muted` class comes off the Type and Country cells. What stays grey is state, not a column: the em dash for a missing value (45), the whole of an inactive row (55), and a Last price kept on screen after a failed update (66). The name keeps its medium weight as the row's identity (22). Amends 22.

**Why.** Designer, 2026-09-25. Grey on a whole column said *this matters less*, and no column in the default set does; the reader sorts columns by position, not by ink. Grey is kept for the three cases where it says something about the value itself.

## 123 · 2026-09-25

**Created and Modified in the instruments list show the date only — `23 Sep 2025` — and carry the full stamp in the tooltip on two rows, *Date* and *Time*, the same rows Last update and Timestamp use (117).** The cell is a `<time datetime>` like theirs, without the `data-age` flag that makes a cell relative, so the sort key and the record keep the second. Amends 115.

**Why.** Designer, 2026-09-25. A record's creation is a day, not a second: the question these columns answer is *when did this arrive*, and `12 Jan 2025` answers it where `12 Jan 2025, 09:14:22` makes the reader parse a time nobody compares. The second is one hover away, and the age form of 117 would be wrong here — *372d ago* is harder to place than the date.

## 124 · 2026-09-25

**A column that can be edited is edited in row edit whenever it is shown (108, 118, 124): Financial sector, Industry group and Country join Name, Bloomberg code, Status, Pricer, Currency, Last price, Source and Type.** The three are selects with the record form's own option lists; the industry select offers only the chosen sector's groups and is disabled while there is no sector, exactly as the form does (96) — changing the sector empties it. An empty value shows the em dash as the select's placeholder. Which columns are visible is the user's business (56); the controls exist in the hidden cells too and simply stay hidden with them. Amends 118.

**Why.** Designer, 2026-09-25, on the product manager's note that the columns must be editable when visible. The rule is stated once so that no future column has to ask: if the record can edit it and the list can show it, the row can edit it. What stays read-only in the row is what the record cannot edit either — Products, Last update, Timestamp, Created, Modified — and Last price while the source writes it (108).

## 125 · 2026-09-25

**The tooltip on an icon-only control is one word, in the table header as in the row: the column chooser's reads *Columns*, not *Choose and reorder columns*.** The `aria-label` keeps the sentence. **Placement follows what Radix does by default and Spartan's CDK overlay does with fallbacks:** above the trigger, centred; flipped below when there is no room above; shifted along the edge to stay 8px inside the viewport, which near an edge means it is no longer centred on the trigger — accepted, the arrowless bubble does not point anyway. **Fix in `app.js`:** the bubble is moved to the viewport origin before it is measured, so a stale position from the previous tooltip can no longer squeeze the new text into the room left of the edge and wrap it. Amends 116.

**Why.** Designer, 2026-09-25. The wrapped, off-centre bubble on the column chooser was two things: a sentence where a word was due, and a measurement taken with last time's `left` still applied. shadcn documents no placement rules of its own — its tooltip page defers to the primitive (Radix: side `top`, align `center`, `avoidCollisions` true, `collisionPadding` 0; Spartan: `position` `top` with CDK fallbacks). Our 8px gutter is the one thing we add, so the bubble never touches the edge.
