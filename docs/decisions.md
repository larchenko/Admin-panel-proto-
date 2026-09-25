# Decisions log

The index: one line per decision. The full wording and the reasoning are in `decisions-full.md` — look a decision up with `python3 scripts/decisions.py show 53` instead of reading that file whole.

The number is a permanent id: it is quoted from `components.css`, `instruments.js`, the kit pages and `instruments.md`, so it is never reused and never reassigned. Ids are not strictly in date order — 73–79 were renumbered on 2026-09-21 and 114 on 2026-09-25, each time because two sessions had handed out the same number. The date column says when.

- **Add** a decision with `python3 scripts/decisions.py add --summary "…" --decision "…" --notes "…"`. It takes the next number under a file lock and writes both files. Never pick a number by hand.
- **Change** a status with `python3 scripts/decisions.py set-status 46 "superseded by 108"`.
- **Check** both files with `python3 scripts/decisions.py check` before committing.

Status is one of: `fixed` · `fixed for prototype` · `fixed for now` · `placeholder` · `open` · `amended by N` (still stands, N changes part of it) · `superseded by N` (no longer holds) · `resolved by N` (it was an open question and N answered it). Rows marked superseded or resolved are history: follow the number in the status.

| # | Date | Decision | Status |
|---|---|---|---|
| 1 | 2026-09-20 | Production frontend is Spartan UI (Angular); the prototype borrows shadcn/ui's design language (tokens, recipes, markup), no React. | fixed |
| 2 | 2026-09-20 | Icons are RemixIcon (`@ng-icons/remixicon` on the Spartan side). | fixed |
| 3 | 2026-09-20 | UI in English, light theme only, no authentication, one role (Master Admin). | fixed |
| 4 | 2026-09-20 | Tailwind v4 browser build, no build step; `tailwind.js` fetches the CSS and hands it to Tailwind. | fixed for prototype |
| 5 | 2026-09-20 | The theme is one file, `assets/theme.css`: shadcn token names, OKLCH values. | fixed |
| 6 | 2026-09-20 | Font is Archivo (Google Fonts), weights 400 / 500 / 600. | fixed |
| 7 | 2026-09-20 | Colours: shadcn neutral preset with a near-black primary. | superseded by 23 |
| 8 | 2026-09-20 | Behaviour through native HTML (`<dialog>`, `popover`) plus minimal vanilla JS in `app.js`. | fixed |
| 9 | 2026-09-20 | Body text 14px (`text-sm`), three weights 400 / 500 / 600. | amended by 77 |
| 10 | 2026-09-20 | Icons are line by default, fill only for active or selected; 16px inline, 20px nav and toolbar; icon-only controls need `aria-label` and a tooltip. | fixed |
| 11 | 2026-09-20 | Elevation: borders for content on the page, shadows only for floating layers. | fixed |
| 12 | 2026-09-20 | Components are short recipe classes in `components.css` (`btn btn-outline btn-sm`) built with `@apply`, mapping 1:1 to Helm inputs. | fixed |
| 13 | 2026-09-20 | Button: shadcn variants and sizes sm 32 / default 36 / lg 40 plus icon; one default per view, destructive only in confirmations. | fixed |
| 14 | 2026-09-21 | Form controls are native elements styled by recipes (select excepted, see 17). | fixed for prototype |
| 15 | 2026-09-21 | Field anatomy: label, control, then description or error; required by default, `Optional` in the label, no asterisks; validate on blur and submit. | amended by 64 and 70 |
| 16 | 2026-09-21 | Switch only for settings that apply at once; a checkbox inside a form with Save; read-only for system values, disabled for temporarily locked ones. | fixed |
| 17 | 2026-09-21 | Select is a custom component (button + listbox in `app.js`), not the native `<select>`, so it looks the same in every browser. | fixed |
| 18 | 2026-09-21 | Fields in a row align to the top (`.field` content-start, `.field-row` items-start). | fixed |
| 19 | 2026-09-21 | Status tokens `--success`, `--warning`, `--info` (+ `-foreground`) added to the theme. | fixed |
| 20 | 2026-09-21 | Card: no shadow, `rounded-lg`, otherwise shadcn anatomy. | amended by 77 |
| 21 | 2026-09-21 | Badge: the shadcn variants plus soft success / warning / info; a status is always a badge in its own column. | amended by 119 |
| 22 | 2026-09-21 | Table base recipe: muted header band, the name links to the record, numbers right-aligned `tabular-nums`, sortable headers are buttons with `aria-sort`. | amended by 40, 50, 55, 109 and 122 |
| 23 | 2026-09-21 | Brand colour `#200766` is `--primary`; greys stay pure neutral; the brand hue feeds `--ring`, `--accent`, `--sidebar-accent`. | amended by 31 |
| 24 | 2026-09-21 | Status colours red `#C03347`, yellow `#D09425`, green `#33A35E`; each has `--x`, `--x-foreground` and `--x-ink` (text on its 10% tint). | fixed |
| 25 | 2026-09-23 | Logo `assets/logo.svg`, used as delivered; asset URLs carry `?v=<date>`, bumped whenever the artwork changes. | amended by 111 |
| 26 | 2026-09-21 | Raised: `--border` and `--input` at 1.26:1, below the 3:1 a control boundary needs. | resolved by 27 |
| 27 | 2026-09-21 | `--input` darkened to 3:1 for control boundaries; `--border` stays light and only divides content. | fixed |
| 28 | 2026-09-21 | Radius base 4px (`--radius: 0.25rem`): controls 2px, cards and tables 4px. | fixed |
| 29 | 2026-09-21 | Density stays shadcn default: controls 32 / 36 / 40px, table rows 40px, base text 14px. | fixed |
| 30 | 2026-09-21 | Open: one column carrying two related values. | resolved by 40 |
| 31 | 2026-09-21 | Status colours never come from the brand; `theme.css` has a BRAND layer and a SYSTEM layer, and a white-label swap replaces only the first. | fixed |
| 32 | 2026-09-21 | Market data and Performance are one section with one shared header (Source, DataBasedOn, last update) and one Refresh. | fixed |
| 33 | 2026-09-21 | Financial values are never rounded or padded to a fixed precision. | amended by 53 |
| 34 | 2026-09-21 | Tabs are underline tabs, not shadcn's pill container. | fixed |
| 35 | 2026-09-21 | Dropdown menus use the native `popover` attribute, positioned from the trigger in `app.js`. | fixed for prototype |
| 36 | 2026-09-21 | First column set of the instruments list (twelve columns, no identifiers). | superseded by 40 and 52 |
| 37 | 2026-09-21 | Deactivation date shown in the Status cell. | superseded by 47 |
| 38 | 2026-09-21 | Open: the instruments table is wider than 1440 and scrolls sideways. | resolved by 56 |
| 39 | 2026-09-21 | Open: list states other than empty — loading, fetch error, first run. | open |
| 40 | 2026-09-21 | Every column of the instruments list carries two levels. | superseded by 46 |
| 41 | 2026-09-21 | Country as a flag after the instrument name. | superseded by 110 |
| 42 | 2026-09-21 | No row-selection checkbox on the instruments list until a bulk action exists. | fixed |
| 43 | 2026-09-21 | Tooltip component: a tooltip only expands what is already on screen; shown on hover and on focus. | amended by 47 and 51 |
| 44 | 2026-09-21 | Instrument search matches every identifier as well as the name. | fixed |
| 45 | 2026-09-21 | A missing value in a table is an em dash, never a worded placeholder. | amended by 108 |
| 46 | 2026-09-21 | Two levels are per column, not a rule for the whole table. | superseded by 108 |
| 47 | 2026-09-21 | Table headers are always one line. | amended by 108 |
| 48 | 2026-09-21 | Inactive shows only the badge; the details go in a structured tooltip (title + label/value rows, never a sentence). | fixed |
| 49 | 2026-09-21 | A read-only boolean in a table is a static checkbox (`.check-static`), filled or empty, not a tick against a dash. | fixed |
| 50 | 2026-09-21 | The table has no wrapper border or radius — it lies on the page and gets a frame only from a container it sits in. | amended by 54 and 55 |
| 51 | 2026-09-21 | The Instrument column's second line is the Bloomberg code alone, unlabelled; other identifiers live on the record. | amended by 108 |
| 52 | 2026-09-21 | Instruments list column order; `Created` dropped from the list, `Price updated` renamed `Updated`. | superseded by 115 |
| 53 | 2026-09-21 | `Last price` in the instruments list shows exactly two decimals (round half up, `'` thousands) — display only; the one exception to 33. | fixed |
| 54 | 2026-09-21 | The header band has rules above and below; a sortable header button fills its whole cell. | fixed |
| 55 | 2026-09-21 | Rows are padded 12px each side and `.table-wrap` bleeds 12px (`-mx-3`), so the text stays on the page edges. | fixed |
| 56 | 2026-09-21 | Column chooser is an icon button in the actions column header; Instrument is locked; the rules for which columns may be offered. | amended by 108 and 109 |
| 57 | 2026-09-21 | Column order is set in the same menu, by drag or ArrowUp / ArrowDown; one Reset. | fixed |
| 58 | 2026-09-21 | The first column is pinned left, with a shadow only while the table is scrolled. | amended by 74 |
| 59 | 2026-09-21 | Tooltip is the inverse of the page (near-black, white text), not the brand colour. | fixed |
| 60 | 2026-09-21 | The page title is the first block inside the scrolling page, not a fixed header bar. | amended by 78 |
| 61 | 2026-09-21 | Dialog 512px, record dialog 768px; height capped at 85vh, only the body scrolls; field groups are not cards. | fixed |
| 62 | 2026-09-21 | Creating an instrument is enter → fetch → create. | superseded by 83 |
| 63 | 2026-09-21 | A failed fetch never blocks creation. | superseded by 83 |
| 64 | 2026-09-21 | Identifiers: "at least one" rule, two open fields, ten behind a disclosure. | superseded by 70 and 82 |
| 65 | 2026-09-21 | Set-once fields are editable only while empty. | superseded by 79 |
| 66 | 2026-09-21 | A failed update is reported in the Updated column, never in Status. | amended by 84 and 108 |
| 67 | 2026-09-21 | After Create the new row is highlighted at the top of the list — no toast. | fixed |
| 68 | 2026-09-21 | A confirmation inside a dialog is a `popover="manual"` inside the `.dialog`, never a second `<dialog>`. | fixed for prototype |
| 69 | 2026-09-21 | New components: Dialog, Alert, Skeleton, plus the record's recipes (`.form-section`, `.props`, `.stats`, `.range`, `.disclosure`). | fixed |
| 70 | 2026-09-21 | The instrument form validates nothing: no required fields, no errors, no `Optional` tags. | fixed |
| 71 | 2026-09-21 | No `Create another` in the create dialog. | fixed |
| 72 | 2026-09-21 | The list opens with four counts; only Failed updates is a button (it filters the list); the counts describe the whole set, never the query. | fixed |
| 73 | 2026-09-21 | Instrument fields are grouped into General details, Financial identifiers, Market data & performance, Record info; Active sits in the header. | fixed |
| 74 | 2026-09-21 | The row-actions column is pinned right, with a shadow only while something is under it. | fixed |
| 75 | 2026-09-21 | Create, view and edit are modes of one centred dialog over the list (a routed dialog in Angular). | amended by 91 |
| 76 | 2026-09-21 | No rules inside the shell; the sidebar's zones are separated by space. | fixed |
| 77 | 2026-09-21 | Type ladder: every step changes at least two of size, weight and colour; overline 12/600 muted. | amended by 78 |
| 78 | 2026-09-21 | Heading sizes 36 / 24 / 18 (page title · dialog and section · card and form section); body 14, overline and caption 12. | fixed |
| 79 | 2026-09-21 | Every field in the record is editable, in create and edit alike; a fetch only fills empty fields. | fixed |
| 80 | 2026-09-21 | An anchored overlay opens below and flips above only when it does not fit; capped to the room it has; `data-prefer="top"` for footer selects. | fixed |
| 81 | 2026-09-21 | Identifiers are mono only in the record dialog, not in the list. | fixed |
| 82 | 2026-09-21 | All twelve identifiers are open in the form, no disclosure. | amended by 85 |
| 83 | 2026-09-21 | Creating an instrument fetches nothing; the data arrives with the scheduled update. | fixed |
| 84 | 2026-09-21 | The UI word is *update*, not *fetch*; a never-updated instrument reads *Awaiting first update*. | fixed |
| 85 | 2026-09-21 | The SIX triplet is one row of three (`.field-row-3`, only for one value in parts); Yahoo code stays alone at half width. | fixed |
| 86 | 2026-09-21 | Export to Excel: an outlined button at the right of the toolbar; exports the query in the chosen columns at full precision; no toast. | fixed |
| 87 | 2026-09-21 | Spacing ladder 2 / 4 / 6 / 8 / 12 / 16 / 24 with four rules; 20 and 28 are off the ladder; 24 is the ceiling on a screen. | fixed |
| 88 | 2026-09-21 | `.overline` cancels Tailwind's utility of the same name with the one `!important` in `components.css`. | fixed |
| 89 | 2026-09-21 | Every list filter lives in one live-applying panel behind a Filters button; a chip row shows what is on; Clear all clears everything. | fixed |
| 90 | 2026-09-21 | One identifier filter for all twelve identifiers: Field + Condition (Empty / Filled). | fixed |
| 91 | 2026-09-21 | The record dialog has two modes, create and record: viewing and editing are the same screen; Save changes lights up when the form is dirty. | amended by 95, 96 |
| 92 | 2026-09-21 | `--chart-1..5` are rebuilt from the brand; `--chart-1` is the brand, the others step around the status hues. | fixed |
| 93 | 2026-09-21 | The record has two tabs, Instrument details and Instrument performance; create has none; the third form section is Data source. | fixed |
| 94 | 2026-09-21 | Price chart: the session under the cursor is printed below as text; windows 1M–3Y as a toggle group; keyboard navigable. | fixed |
| 95 | 2026-09-22 | Row menu View details · Refresh data · Delete; delete is refused while the instrument has products, and offers Edit instead. | amended by 97, 100 and 109 |
| 96 | 2026-09-22 | General details reordered; Products in the header; Industry group depends on Financial sector. | amended by 97, 98 |
| 97 | 2026-09-22 | The record dialog has no More menu; Products is a small metric card (a link) in its header. | amended by 100 |
| 98 | 2026-09-22 | The form keeps two fixed columns; short fields are capped (`max-w-40`) inside their column. | fixed for prototype |
| 99 | 2026-09-22 | The field is labelled *Financial sector* everywhere it is shown; `sector` stays its name in the data. | amended by 108 |
| 100 | 2026-09-22 | The record header carries the Active switch (off asks first, on applies at once); the footer carries Delete instrument. | fixed for prototype |
| 101 | 2026-09-22 | The design system follows Atomic Design in a Storybook-style shell; the tree is written once, in `kit-nav.js`. | fixed |
| 102 | 2026-09-22 | Button has five variants; `btn-secondary` is dropped. | fixed |
| 103 | 2026-09-22 | Button size is set by the container: `btn-sm` on screens, default height only in dialog footers, `btn-lg` unused. | fixed |
| 104 | 2026-09-22 | The kit draws every state of every variant, through `data-demo` hooks that share the real `:hover` and `:focus-visible` rules. | fixed |
| 105 | 2026-09-23 | The prototype opens on the design system; the kit sidebar switches between Design system and Pages. | fixed |
| 106 | 2026-09-23 | The product is called *Admin panel*. | fixed |
| 107 | 2026-09-23 | Modals are a section under Pages; each modal state is the real screen loaded live through `?state=`. | fixed |
| 108 | 2026-09-25 | Every column of the instruments list holds one value — no second line; the default column set. | amended by 110 and 115 |
| 109 | 2026-09-25 | Row actions are four ghost icon buttons (View details · Edit in list · Refresh data · Delete), not a More menu. | amended by 116 and 120 |
| 110 | 2026-09-25 | Country is a column, in words; no flags anywhere in the list. | amended by 115 |
| 111 | 2026-09-25 | The logo is the VIZIBILITY wordmark, 20px tall in the sidebar. | amended by 112 |
| 112 | 2026-09-25 | The mark (`logo-mark.svg`, the "V.") is delivered; the collapsed rail shows it. | fixed |
| 113 | 2026-09-25 | A highlighted item in a select list or a menu runs the full width of the list; items do not wrap. | fixed |
| 114 | 2026-09-21 | The list filters on Status, Pricer, Currency, Source, Sector, Country and one identifier condition; every select's off value is *All*. | fixed |
| 115 | 2026-09-25 | Instruments list default columns: Instrument · Status · Pricer · Currency · Last price (source in tooltip) · Last update · Timestamp · Type · Products · Created · actions; the rest in the column chooser. | amended by 117 and 123 |
| 116 | 2026-09-25 | Row-action tooltips are one verb: View · Edit · Refresh · Delete. | amended by 125 |
| 117 | 2026-09-25 | Last update and Timestamp are shown as an age (5m ago, 3h ago, 2d ago); the date and time are the tooltip, on two rows. | fixed |
| 118 | 2026-09-25 | Row edit also edits Status (the switch) and Pricer (a checkbox); Save is the confirmation, the record's Deactivate? question is not asked again. | amended by 119 and 124 |
| 119 | 2026-09-25 | Active / Inactive badges carry a check mark and a cross, not a dot; in row edit, Status is a checkbox, not a switch. | fixed |
| 120 | 2026-09-25 | Refresh moves out of the row actions into the Last update cell, before the age, visible on row hover only. | amended by 121 |
| 121 | 2026-09-25 | Refresh sits after the Last update value, not before; a double-click on a row opens row edit. | fixed |
| 122 | 2026-09-25 | Every text value in the instruments list is set in the same style; Type and Country lose their muted grey. Grey marks only the em dash and a price kept after a failed update. | fixed |
| 123 | 2026-09-25 | Created and Modified show the date alone; the full date and time are the tooltip, on two rows. | fixed |
| 124 | 2026-09-25 | Row edit covers every editable column that is shown: Financial sector, Industry group and Country join it, the industry select following the sector. | fixed |
| 125 | 2026-09-25 | An icon-only control's tooltip is one word — the column chooser's reads Columns — and a tooltip is measured at the viewport origin before it is placed. | fixed |
