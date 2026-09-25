# Worklog

One entry per working day, newest first. Each entry is written so that it can be
pasted into a Jira comment as it stands: plain sentences, short bullets, a
decision number in brackets where the reasoning lives in `decisions.md`, no
file paths unless the reader has to open the file. Three parts per day —
**Done** (what changed and where to see it), **Found** (bugs, data
inconsistencies, open questions raised), **Open** (what was deliberately left
for a decision). Every session appends to the day it worked on; nobody rewrites
another session's lines (see `CLAUDE.md`, *Worklog*).

## 2026-09-25 — Instruments list: one value per cell, row edit, columns, brand

**Done**

- Analysed the product manager's request to edit Name, Code, Type, Currency,
  Last price and Source in the table. Finding: no product ships inline editing
  of a stacked two-value cell; every one edits one attribute per cell (Salesforce
  refuses compound fields, Shopify flattens into a separate bulk editor). Options
  written up; the list was rebuilt on that basis.
- The instruments list holds one value per cell, no second lines [108]. Bloomberg
  code, Source and Industry group became columns; a date and its time became one
  value.
- Row edit ("Edit in list", also a double-click on the row): each editable cell
  becomes one control in place, Enter saves, Escape cancels, Save lights up when
  something changed, a sorted column unsorts on save [108, 121]. Editable: Name,
  Bloomberg code, Status (checkbox), Pricer (checkbox), Currency, Last price,
  Source, Type, Financial sector, Industry group, Country [118, 119, 124]. Last
  price stays read-only while the source is SIX, Yahoo or Bloomberg, since the
  source writes it [83]. Column widths are frozen while a row is in edit, so the
  table does not re-flow.
- Row actions are icons in the row, not a More menu: View · Edit · Delete at the
  row end, Refresh in the Last update cell after the age, visible on hover
  [109, 120, 121]. Tooltips are one word [116, 125].
- Country is a column in words; the flags are gone [110].
- Default columns, in the product manager's order: Instrument · Status · Pricer ·
  Currency · Last price · Last update · Timestamp · Type · Products · Created ·
  actions; the rest in the column chooser [115]. The source rides in the Last
  price tooltip. Timestamp is new: the provider's stamp on the price, as against
  Last update, when our system wrote it.
- Last update and Timestamp read as an age (5m ago, 3h ago, 2d ago) with the date
  and time in a two-row tooltip [117]; Created and Modified show the date with
  the same tooltip [123]. The prototype's clock is fixed at 18 Sep 2026, 10:17.
- Active / Inactive badges carry a check mark and a cross instead of the dot
  [119]. All list text is one style; Type and Country lost their grey [122].
- Select lists and menus: the highlighted item runs edge to edge, options never
  wrap [113].
- Brand: the VIZIBILITY wordmark replaces the old logo, 20px tall in the
  sidebar; the "V." mark in the collapsed rail and as favicon [111, 112].
- Tooltip: the column chooser's reads "Columns"; a measuring bug that wrapped
  a tooltip near the right edge is fixed [125].
- Decisions log split into an index (`decisions.md`) and the full text
  (`decisions-full.md`), with `scripts/decisions.py` as the only way to add or
  change a decision; `CLAUDE.md` added (another session, same day). This
  worklog started.
- Kit overview: the Button card said six variants and three sizes; it now says
  five variants, size set by the container [102, 103].

**Found**

- A leftover of the removed row menu rendered a "Delete instrument" button at
  the foot of the page; removed.
- Demo data: Nestlé shows 336.85 in the list and 84.7234 in the record. Not
  touched.
- Rows are 49px, not the 40px of [29]: the 32px icon button plus 8px padding
  either side. Predates today's work.
- The default set is about 1410px wide at the fixed desktop size and fits next
  to the sidebar; with Bloomberg code, Source or the taxonomy columns switched
  on, the table scrolls sideways and the row actions leave the screen. Pinning
  the actions column to the right (as [74] once did) is worth reconsidering.

**Open**

- "Timestamp" next to "Last update" asks the reader to know which clock is
  which; "Price time" or "Priced at" would read on its own. Left as the product
  manager named it.
- Row edit does not ask "Deactivate?" when the status checkbox is cleared; Save
  is the confirmation [118]. Whether the products warning the record shows
  belongs in the list too is undecided.
- The record header keeps its status switch [100]; the row uses a checkbox
  [119]. One control or two is a call to make.
- Today's work is committed in six thematic commits: brand, select and
  tooltip, badge, instruments list, decisions tooling, spec and worklog.

## 2026-09-23 — Kit structure, brand, modals

**Done**

- Kit rebuilt as an Atomic Design tree, one page per component; a switcher
  between Design system and Pages; the product is called *Admin panel* [101,
  105, 106].
- Modals are a section under Pages; every state of the record modal is the real
  screen loaded live [107].
- The VIZ logo replaced the wordmark placeholder [25]. Dev server takes its port
  from `$PORT`.

## 2026-09-22 — Instruments screen

**Done**

- The Instruments screen: list with toolbar, filters, column chooser, the
  record dialog in create and record modes, delete asked from the list [91–100].
- Navigation kit and the component recipes it needs. Vercel serves `prototype/`
  as the site root.

## 2026-09-21 — Theme and components

**Done**

- Theme: brand colour #200766, Archivo, status tokens with ink shades, 4px
  radius, control borders at 3:1; statuses are system colours, never brand
  [23, 24, 28, 31].
- Components: form controls (field, input, textarea, select, checkbox, radio,
  switch), custom select with keyboard support, card, badge with status
  variants, table with toolbar and footer [17, 21, 22].

## 2026-09-20 — Setup and foundations

**Done**

- Project restarted on the shadcn language with Spartan as the production
  target: shared theme, environment check, foundations page with token parity,
  type / icon / elevation rules, first component recipes and a no-cache dev
  server [2, 8, 10, 12].
