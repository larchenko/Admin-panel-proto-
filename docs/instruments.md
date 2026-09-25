# Instruments

Field model and screens for the Instruments area.
Agreed with the product owner on 2026-09-21. Decisions 31–39 in `decisions.md`.

## Groups

Every instrument field belongs to exactly one of four groups, plus two values that
sit outside them.

### Outside the groups

| Field | Source | Notes |
|---|---|---|
| Active | active by default, deactivated by an event or by hand | Not an attribute but the state of the whole record. Lives in the page header as a badge plus a switch. |

Deactivating stops market-data updates, so `LastUpdate` starts ageing on purpose.
The freshness indicator must say "frozen, instrument inactive" rather than show a
stale-data warning. Deactivating an instrument used by products has to warn first —
`ProductCount` and `Active` work as a pair. Deleting one is not a warning but a
refusal (decision 95): deactivation keeps the products' source and only freezes
it, deletion takes the source away.

`Active` has its control in the record header (decision 100): the badge reads the
state, the **switch** beside it changes it. Switching **off** asks first — the
confirmation names the products that will freeze; switching **on** is its own
answer and happens at once. The switch is not part of the form: it never makes
*Save changes* light up, and the status is written when the confirmation is
answered, not when the form is saved.

### 1. General details

Labelled **Instrument name** and **Instrument type**, on one row, and **Sector** is
labelled **Financial sector** (decision 96) — in the form, in the list column and in
the filters panel alike (99). `Sector` stays the field's name in the data.

The order of the section is: name and type · country and currency · financial sector
and industry group · the type-dependent block · Offer in the pricer.

Two columns all the way down (98). Instrument name, Country and Financial sector
take the left column; Industry group takes the right one. Instrument type and
Currency are the short answers: capped at 10rem inside the right column and aligned
to its left edge, so they are the same width as each other and start where Industry
group starts.

| Field | Source | Notes |
|---|---|---|
| Name | entered | Label *Instrument name*. Shares a row with Instrument Type. |
| Instrument Type | entered | equity, bond, index, fund, etf, commodity, corporate action, currency, rate, credit, credit index, structured product |
| Country | fetched or set once | e.g. United States. Left column, the same width as Instrument name above it. |
| Currency | entered | ISO 4217, plus `%` and `TBD`. `GBP` and `GBp` are separate values: `GBp` means the price arrives in pence — the option label is `GBp` and the pence rule lives here, not in the option. Sized to its content: 10rem inside the right column, the same width as Instrument type (98). |
| Sector | fetched or set once | Label *Financial sector*. e.g. Information Technology. **Decides which industry groups exist.** |
| Industry group | fetched or set once | e.g. Technology Hardware & Equipment. The sector's list, not a list of its own: disabled until a sector is chosen, and an industry left over from another sector is cleared. |
| IsForPricer | set at creation, editable | 1/0 — the instrument is offered in the pricer |
| ProductCount | calculated | Number of products using it. **A card in the dialog header**, right of the instrument name — the label *Products* over the number, `.metric metric-sm` (97) — because it is what decides whether the instrument can be deleted (95). A link, in the list and in the header both: the count always leads to the products it counts. |
| TotalEntities | set at creation, editable | Only for Credit Index |

**Sector → industry group**, the mapping the prototype carries (GICS industry
groups, and the only pairs the demo rows use are in it):

| Financial sector | Industry groups |
|---|---|
| Information Technology | Software & Services · Technology Hardware & Equipment · Semiconductors & Semiconductor Equipment |
| Health Care | Health Care Equipment & Services · Pharmaceuticals & Biotechnology |
| Financials | Banks · Financial Services · Insurance |
| Consumer Staples | Food, Beverage & Tobacco · Household & Personal Products · Consumer Staples Distribution & Retail |
| Energy | Energy |
| Industrials | Capital Goods · Commercial & Professional Services · Transportation |
| Materials | Materials |

It lives on the options as `data-sector` so the pair can be read in one place. In
production the second list is fetched for the sector that was chosen, and the two
sets are the server's, not the form's — the list above is a demo subset of GICS and
not the agreed taxonomy.

`TotalEntities` is the first type-dependent field. Treat it as a pattern, not a
special case: General details carries a block of attributes that depend on
Instrument Type, and bonds and funds will add their own.

### 2. Financial identifiers

| Field | Notes |
|---|---|
| Bloomberg code | full code including the type extension |
| ISIN | 12 characters, letters and digits — e.g. US0378331005 |
| CUSIP | 9 characters — e.g. 037833100 |
| FIGI | 12 characters, letters and digits — e.g. BBG000B9Y5X2 |
| SEDOL | 7 characters — e.g. 2046251 |
| VALOR | SIX identifier for Switzerland and Liechtenstein |
| WKN | German identifier, 6 characters — e.g. 865985 |
| RIC | LSEG/Refinitiv symbol — e.g. AAPL.O |
| Yahoo code | e.g. AAPL |
| SIX Code | e.g. AAPL |
| SIX Schema | SIX identifier type — e.g. TICKER_BC |
| SIX Bc | SIX source code — e.g. 67 |

Open: the VALOR spec says both "5-to-9 digit" and "12 digits" and the example is
missing. CUSIP, SEDOL and FIGI are described as digits but are alphanumeric —
validation must accept letters.

### 3. Market data & performance

One section, one shared header, one Refresh button. Read-only: everything here
comes from a fetch, nothing is typed.

Section header — where the numbers come from and how fresh they are:

| Field | Source | Notes |
|---|---|---|
| Source | picked from a list | SIX, Yahoo, email, Excel, web scraping … |
| DataBasedOn | set at creation, editable | Another instrument this one's data is derived from. The only editable value in the header. |
| LastUpdate | logged by the system | When we last fetched. Covers both blocks, because one Refresh drives both. |
| ErrorMessage | returned by the provider | Shown only when the last fetch failed. Old values stay visible and are marked stale. |

Market data:

| Field | Notes |
|---|---|
| LastPrice | last known price, intraday |
| LastClose | last closing price |
| LastOpen / LastHigh / LastLow | previous session |
| LastBid | structured products only |
| DataDate | timestamp of the data itself, as returned by the API — not the moment we asked. Different from LastUpdate and both matter. |

Performance:

| Field | Notes |
|---|---|
| ChgPct5D, 1M, 3M, 6M, 1YR, YTD | percent price change; reads well as one row of periods |
| Low52Week / High52Week | better as one range with the current price marked on it than as two numbers |
| Volatility90D | |

Session history — the same section, one row per trading day:

| Field | Notes |
|---|---|
| Session date | one row per trading day. Weekends and holidays are absent, not empty. |
| Open / Close / High / Low | the four prices of that session. The latest session's four **are** `LastOpen`, `LastClose`, `LastHigh`, `LastLow`, so the record prints them once, as that session, and not again as four props of their own (decision 94). |

The history is what the chart on the performance tab is drawn from, and it is why
`Market data & performance` is now a tab rather than a section at the bottom of a
form (decision 93). How far back it goes is a provider question; the screen asks
for three years and draws whatever it is given.

**Still to define:** how much history each source returns and how long the system
keeps it, and whether a session can be corrected after the fact — a provider
restating a close — and if so whether the record says so.

Which fields are visible depends on Instrument Type: `LastBid` only for structured
products, `LastOpen/High/Low` only for exchange-traded ones. Still open whether an
empty field is hidden or shown with a dash.

Refresh states to design: loading (button disabled, values skeletoned), failure
(old values kept, marked stale, reason from `ErrorMessage`), and inactive
instrument (frozen by design).

### 4. Record info

Page footer, small type. Nothing here is edited.

| Field | Notes |
|---|---|
| Id | UUID, created once, never changes. Rarely read, often copied — give it a copy button. |
| RowCreatedBy / RowCreatedOn | |
| RowModifiedBy / RowModifiedOn | Automatic fetches write here too (`system@capital-viz.com`), so this is not a record of user edits. Either separate system writes from human ones, or do not present it as an audit trail. |

## Screens

### List — `prototype/screens/instruments.html`

Sits in the app shell: the sidebar on the left with *Instruments* current, and the
page title as the first block inside the scrolling body, carrying the primary
**New instrument** action on its right (decision 60). Only the sidebar stays put;
the title scrolls away with the list. The screen carries no intro paragraph: on a
list an admin opens every day it is read once and then costs vertical space
forever, so the description of the area lives in this document instead.

Blocks down the page: the title, the summary row, underline tabs for the 12
instrument types plus All, a toolbar with search and one **Filters** button on the
left and **Export to Excel** on the right, the chip row that says what the filters
left on, the table, and the footer with the count and pagination. The
types run alphabetically after All, because no other order is defensible: volume
puts Equity first today and something else next quarter, and an admin hunting for
*Structured product* in a strip of 13 should not have to read all 13. The selected
tab is marked twice — a 3px brand underline and the label in brand colour — since
one thin line at this width is easy to lose and colour alone is not a cue for
everyone. The footer's **Rows per page** select opens upward: a page footer is
the bottom of the screen, and an overlay anchored to a trigger opens on the side
that has room for it (decision 80).

#### The summary row — decision 72

Under the title, four counts read left to right: **Total instruments**, **Active**
with the number of inactive beside it, **Pricer enabled** against that active
count, and **Failed updates** in the last 24 hours. The row costs about 90px off
the top of the table, which is exactly what the intro paragraph was refused for —
the difference is that a paragraph is read once and a count is read every
morning, and one of these four is a control.

The first three are read; the last one acts. **Failed updates** is a toggle:
pressing it filters the list to the instruments whose last update failed, pressing
it again clears, and while it is on its second line reads *showing only these* so
the cell says what the list is showing. That is the filter the toolbar does not
have, and it answers the question this screen could not answer before — a broken
instrument was findable only by scrolling.

The counts describe the whole catalogue, not the page and not the query. A type
tab or a toolbar filter narrows the table below without touching them: the strip
is the state of the set, the footer count is the state of the query. Failed
updates is the exception — it is counted from the rows, because a number that
filters has to land on exactly itself.

Zero is designed, not absent: the cell keeps its place and its label, drops the
destructive colour, reads *none in the last 24h* and stops being a button. A row
that changes shape when the news is good cannot be read at a glance.

What is deliberately not in it is anything nobody acts on. Four cells is the
ceiling. `Pricer enabled` is the weakest of the four — it is coverage, not
attention — and it is the first to go if a fifth number is ever proposed; the
test for any new cell is whether an admin would do something differently because
of it. Candidates that pass that test and are waiting for their data: instruments
that have never been updated, and instruments deactivated while products still
use them.

In the prototype the failed count is wired to the rows (`data-health="failed"`,
which only a row whose last update failed carries) so the number and the filter
can be seen to agree; total, inactive and pricer are demo values, and total
follows the footer so a created instrument moves both. In production all four
arrive with the list as one aggregate over the whole set.

#### Filtering — decisions 89, 90 and 114

Ten filters do not fit in a toolbar and none of them is opened often enough to earn
the width, so they all live in one panel behind a **Filters** button and the button
carries the number that are on. The panel is 520px wide with its fields two across,
which is what keeps it short enough to open downward under the toolbar rather than
over the page. Nothing is applied by a button: every change filters at once, so the
footer count moves while the panel is open.

| Filter | Values |
|---|---|
| Status | All · Active · Inactive |
| Pricer | All · Yes · No |
| Currency | All, then the currencies in use |
| Source | All · SIX · Yahoo · Bloomberg · Email · Excel · Web scraping |
| Financial sector | All, then the sectors in use |
| Country | All, then the countries in use |
| Identifier | a field and a state — Empty or Filled, see below |

`All` is the off value of every select, because the label above it already says
what it is. Three more filters have their own controls and are not in the panel:
the search box, the type tabs, and the **Failed updates** cell in the summary row.

Because a shut panel hides the query, a **chip row** sits under the toolbar: one
chip per filter the panel holds, each clearing itself. A filter whose own control
is on screen gets no chip — a second copy of a visible state is one state too many.
**Clear all** appears in the panel header, on the chip row and in the empty state,
and means all of it: the panel, the search box and the Failed updates cell.

##### The identifier filter

The old back office asked "is this identifier empty?" with three fixed toggles —
Ref. Ticker, Yahoo code, Schema SIX. Here it is one row that asks it of any of the
twelve: **Field**, then **Condition** — **Empty** or **Filled**, and nothing else.
Ref. Ticker is **RIC**, the Refinitiv ticker, and that is the name it goes by here.

Presence is the whole question. Matching a value is the search box's job — it already
matches every identifier, not just the Bloomberg code on screen (decision 44) — so
the row has no *contains* and no value box, and the old BC Six search field has no
control of its own.

Half a filter filters nothing: until both selects are set the list is untouched, and
the Condition select stays disabled until a field is picked, so half a filter never
looks like a whole one.

What the row is for is the data-quality question this screen could not answer:
*Source is SIX and SIX Code is empty* is an instrument that will never update — the
form does not enforce that pairing (decision 83), so the list has to surface it.

Open: whether that pairing deserves a filter of its own — one *Update key missing*
switch instead of two fields set by hand — which needs the real number, the same way
*awaiting first update* does. And whether searching a shared code such as SIX Bc `67`
through the search box is precise enough in practice; if it is not, the answer is a
better search, not a value box in this row.

#### The table

Every column holds one value (decision 108). There are no second lines: a
related value is a column of its own, and a timestamp is one string.

The two freshness columns are relative (117): a `<time datetime="…">` whose text
is the age — *just now* under a minute, then `Nm ago`, `Nh ago`, `Nd ago` — and
whose tooltip carries the absolute value on two rows, *Date* and *Time*. The
prototype's clock is fixed at 18 Sep 2026, 10:17 so the ages read the same on
any day; production uses the real clock and re-renders on a timer. The record's
market-data note keeps the absolute form (*Last update 18 Sep 2026, 10:12:03*).
Created and Modified are `<time datetime>` too, but show the date alone (123);
their tooltip carries the same two rows.

The default set and its order (decision 115):

| Column | Value |
|---|---|
| Instrument | name, links to the detail view |
| Status | Active or Inactive badge; the Inactive tooltip holds date, time and who |
| Pricer | static checkbox — filled when the instrument is in the pricer, empty when it is not |
| Currency | Currency |
| Last price | price, right aligned, always 2 decimals; the source in its tooltip (*Source: SIX*) |
| Last update | when *our* system last wrote the price, as an age — `5m ago`, `3h ago`, `2d ago` — with the date and time in the tooltip on two rows (decision 117) |
| Timestamp | the time the provider stamped on that price, shown the same way. Last update can be `5m ago` while the timestamp is `2d ago`: the provider handed over an older price. |
| Type | Instrument Type |
| Products | count, links to that list |
| Created | the date, `23 Sep 2025`; the full stamp in the tooltip on two rows, *Date* and *Time* (123) |

Sortable headers (Instrument, Products, Last price, Updated) highlight the whole
column on hover — the button is the cell (decision 54).

An inactive instrument keeps its row but mutes it (decision 55): the values go
grey, so the Inactive badge is the only lit thing in the row.

Row actions are icon buttons in the row, not a More menu (decision 109):
**View details**, **Edit in list**, **Delete instrument** at the right end, in
that order, each a 32px ghost icon with a one-word tooltip (116) and an
`aria-label` that names the instrument. **Refresh data** is the fourth action
and lives in the **Last update** cell, after the age (120, 121): invisible until
the row is hovered, the button is focused, or it is busy, and it keeps its box so
the value never moves. *View details* opens the record, which is also the editor
(decision 91); *Edit in list* switches the row itself into edit (108, 118, 119),
and so does a **double-click** anywhere on the row that is not a control (121):
Name, Bloomberg code, Status (a checkbox), Pricer (a checkbox), Currency,
Last price, Source, Type, Financial sector, Industry group and Country each
become one control in place (124) — the industry select follows the sector, as
in the record (96) — Enter saves and Escape cancels. *Refresh data* is disabled on an inactive row — its updates are stopped
(100). Delete asks first, and what it asks depends on `ProductCount`. It is asked
from here and from the **Delete instrument** button at the left end of the
record's footer (100); the record has no More menu (97): with no products it is
a plain destructive confirmation, with products it is refused — the confirmation
says how many products read the instrument and offers *Edit instrument* in place
of the delete. There is no selection checkbox — no bulk actions are planned
(decision 42).

Last price is the one column with a fixed precision: always two decimals,
rounded half up, thousands separated by `'`. The rounding is display only — the
stored value and every calculation keep the full precision the source sent
(decision 53). It applies to this column, not to prices elsewhere in the product.

Country is a column, in words, not a flag after the name (decision 110). Currency
sits directly left of the price so that `GBp` is read together with the number.

The order is the product manager's (115): the row's identity and state first
(Instrument, Status, Pricer), then what it is worth and how fresh that is
(Currency, Last price, Last update, Timestamp), then what it is and who uses it
(Type, Products), then Created. Country is a column, in words, not a flag after
the name (decision 110). Currency sits directly left of the price so that `GBp`
is read together with the number.

Search matches identifiers as well as names, so an ISIN or a RIC finds the
instrument even though only the Bloomberg code is shown.

Rows are one line. The default eleven columns need about 1410px, which fits the
list next to the sidebar at the fixed desktop size; switching more columns on
makes the table scroll sideways with the Instrument column pinned (58).

#### Choosing columns — decisions 56 and 57

The table header carries the **Columns** control: an icon at the top of the
row-actions column, directly above the row action icons, with a tooltip for a
label. It decides which columns the list shows and in what order, per user.

The **Instrument** column is pinned to the left edge (58): scrolled sideways, the
prices and dates in view still belong to a name. The actions column is not pinned
— it scrolls with the rest, and so does the Columns control sitting in its header. The list in the menu *is* the order, top
to bottom; drag by the handle or focus a handle and use the arrow keys. One Reset
puts back the default set and the default order.

Locked: **Instrument** is always shown and always first — it is the row's identity
and the link to the detail page. The row-actions column is not in the menu at all
and is always last. Everything else is the user's business, Status included:
someone who has filtered to Active does not need the column.

Available, off by default:

| Column | Value | Why it is offered but not default |
|---|---|---|
| Bloomberg code | the one identifier in the list, unlabelled, in the body face (81); an em dash when the instrument has none (45) | The name is the identity; the code is for the people who key on it. Search matches it either way (44). |
| Source | where the price comes from | It rides in the Last price tooltip by default; the column is for sorting and filtering by eye. |
| Last close | previous close, right aligned | The other half of the price pair. Full precision as received — the 2-decimal rule (53) is for `Last price` only. |
| Chg YTD | percent change, signed | One period out of six. The others (5D, 1M, 3M, 6M, 1YR) stay on the detail page; six change columns would turn the list into a market-data terminal. No red/green: the sign carries it, and colour alone is not a cue we use. |
| Volatility 90D | percent | The one risk number that is comparable across instruments. |
| Financial sector | Financial sector, truncated at 220px | Long values; a dash on every non-equity row. |
| Industry group | industry group, truncated at 220px | Qualifies the financial sector; same reason. |
| Country | country name | An em dash for indices, commodities and the like. |
| Modified | the date, with the full stamp in the tooltip (123) | Automatic fetches write here too, so it is not a record of user edits. |

Hidden columns keep their place, so a column switched on lands next to its
relatives: Bloomberg code after Instrument, Source after Last price, the three
market-data columns after Timestamp, the three taxonomy columns after Type,
Modified after Created.

Not offered, and the rule behind each:

- **Individual identifiers** (ISIN, CUSIP, FIGI, SEDOL, VALOR, WKN, RIC, Yahoo,
  SIX) — the Bloomberg code has its own column and search matches all of them
  (44). Ten more identifier columns would repeat what is already on screen.
- **The deactivation date** — it lives in the Inactive badge's tooltip, and a
  column that is empty on every active row is noise.
- **Id, Created by, Modified by** — a UUID is not scannable, and the "by" fields
  are written by the fetcher (`system@capital-viz.com`), so a column of them would
  read as an audit trail it is not.
- **Type-dependent fields** (TotalEntities, LastBid, Open / High / Low) — a column
  that is a dash on nine rows out of ten is noise. They belong on the detail page.

The test for any column proposed later: short enough to scan in one line, present
on most rows, and worth comparing down the column. Otherwise it is a detail-page
field.

Open for this screen: decision 39. Decision 38 is closed by the column chooser —
the default set fits 1440, and a user who turns on four more columns scrolls the
table sideways knowingly. Still to do: the table header should stick to the top of
the scrolling body once the page shows 25 rows instead of 12, and the chosen
columns need to be stored per user (in the prototype they reset on reload, like
the collapsed sidebar rail and, since 89, the filters — an admin who filters to
*Source is SIX and SIX Code is empty* every morning should not have to build it
every morning).

#### Export — decision 86

The right end of the toolbar carries one outlined **Export to Excel** button. It is
on that row rather than beside *New instrument* because what it exports is decided
by the controls next to it.

What goes in the file:

| | |
|---|---|
| Rows | every instrument the type tab, the search and the panel's filters leave — the whole query, not the page. The footer's count is the number of rows the file will have. |
| Columns | the ones the chooser has on, in their order (56, 57). Turn Volatility 90D on and it is in the sheet; Reset puts the default set back. |
| Values | as stored, at full precision. The two decimals on `Last price` are a rule for that column on this screen (53), not for the number. |

Three states, and there is no fourth:

- **Idle** — `btn btn-outline btn-sm`, Excel icon, *Export to Excel*.
- **Busy** — the kit's loading button: disabled, `aria-busy`, spinner, *Preparing…*.
  It stays disabled until the file arrives, so one press is one file.
- **Disabled** — the query matches nothing. The empty state beside it says why.

Nothing is shown when the file arrives. A download is reported by the browser in
its own chrome, and a message in the page would repeat it.

In the prototype the press is a 1.4s timeout in `assets/instruments.js` and no file
is produced — the busy state is the part worth reviewing. The button learns how
many rows the query left from the `list:filtered` event the filter engine in
`assets/app.js` now emits (`detail: { shown, filtered }`), which is how anything
acting on the query rather than on a row should be wired.

Open: the file name; whether the sheet follows the table's sort; what a
several-thousand-row export does, which is a server question; and what a failed
export looks like — the one state not designed, because the failure is the
server's and its shape is not known yet. Not asked for and not offered: CSV, PDF,
and exporting a single instrument from the record dialog.

### Record — one dialog, two modes

The instrument has no page of its own. `create` and `record` are two modes of one
centred dialog opened over the list (decision 75). The list stays behind it the
whole time, which is why closing the dialog needs no destination and why a created
instrument needs no toast — it is already on screen.

There is no read-only mode. Reading an instrument and editing it are the same act
(decision 91): opening a record shows every editable value as a live field,
already filled, and *Save changes* is the only thing that writes.

| Mode | Opened by | Body | Footer |
|---|---|---|---|
| create | **New instrument** in the page header | one panel, no tabs: General details, Financial identifiers, Data source | Cancel · **Create instrument** |
| record | the instrument name in the list, or *View details* in the row menu | two tabs — the same form filled, with everything calculated or logged beside the fields, and the market data and history on a tab of their own | *Delete instrument* at the left end · Close · **Save changes**, disabled until something changes |

768px wide, 85vh tall at most, and only the body scrolls, so the instrument name
and the buttons that act on it never leave the screen. Field groups inside are a
heading and a rule, not cards (decision 61). The header's name and subtitle follow
the Name, Type and Bloomberg fields as they are typed, so the title and the form
can never be showing two different instruments.

#### Two tabs — decision 93

A record carries a tab strip between the dialog header and the body:
**Instrument details** and **Instrument performance**. It does not scroll with the
panel, so the way out of a tab is always on screen. `create` has no strip.

| Tab | What is on it |
|---|---|
| Instrument details | the form — General details, Financial identifiers, Data source — and Record info under it |
| Instrument performance | the whole Market data & performance section: the freshness line and `Refresh data`, Last price and Last close, the price chart with the session readout, the six percent changes, the 52-week range, Volatility 90D |

Decision 91 made reading and editing the same act, so the dialog can no longer be
divided by mode; it divides by **ownership** instead. The first tab is everything
an admin types, the second everything a provider sends. Nothing on the second is
ever typed (decision 32), which is what makes tabbing a form safe here: the strip
can never hide a half-filled field, because the other tab has no fields.

`create` has no strip because a new instrument has no history — the tab would open
on an empty state every time.

Record info stays with the details, small type at the bottom of the form: it is
about the row in the database, not about the market.

#### The price history — decision 94

One line of closing prices against time, and under it the five values of one
session. The default window is 1Y, the same period as the 52-week range printed
below it; the toggle group above the chart offers 1M, 3M, 6M, YTD, 1Y and 3Y.

The session readout is the point of the block. Five cells — **Session date, Open,
Close, High, Low** — in the same `.stats` strip the percent changes use, following
the cursor across the chart. It is *printed under the chart*, not floated over it
in a tooltip: a number that exists only while the mouse is held still cannot be
checked against the field above it and cannot be read without a mouse. With
nothing selected it shows the latest session, which is also where it returns when
the pointer leaves.

The chart is reachable from the keyboard: the plot takes focus, left and right
move one session, Shift a month, Home and End the ends.

What it is not: a trading terminal. No candles, no volume, no moving averages, and
no drag-to-zoom brush — a two-handle brush is a mouse-only control, and an admin
checking an instrument wants *a month* or *a year*, not an arbitrary window they
have to drag twice to get. If free ranges are wanted, the brush is an addition to
the six periods, not a replacement for them.

An instrument whose first update has not run yet gets the one empty state the
panel has: *No price history yet*, in a block the height the chart would have had,
so nothing moves when the history arrives.

#### What is a field and what is a value

The distinction the dialog draws is not view against edit, it is **typed against
not typed**. A field is something an admin owns; anything calculated, fetched or
logged by the system is printed as a value next to the fields in the same section,
never as a disabled input — a disabled control invites a click that will never do
anything.

| Group | Fields | Values beside them (record mode only) |
|---|---|---|
| General details | Name, Type, Country, Currency, Sector *(labelled Financial sector)*, Industry group, IsForPricer, TotalEntities (Credit index only) | — · ProductCount is a card in the dialog header, not a value in this group (97) |
| Financial identifiers | all twelve, none required, all twelve open — no disclosure (decision 82) | — |
| Data source *(details tab)* | Source, DataBasedOn | — |
| Market data & performance *(performance tab)* | — | LastUpdate and DataDate in the section note, then Last price and Last close, the price chart with its session readout, the six percent changes, the 52-week range with the current price marked, Volatility90D |
| Record info | — | Id with a copy button, created / modified by and on |
| Active | — (a new instrument is active) | badge in the dialog header |

Create mode is the fields alone: a new instrument has no numbers, no id and no
history, so the value blocks, Record info and the whole performance tab are simply
not there, and the Data source note says where the numbers will come from instead
of when they last came.

The identifiers are laid out in pairs down the section, with one exception: **SIX
Code**, **SIX Schema** and **SIX Bc** share a single row of three
(`.field-row-3`, decision 85). They are one identifier in three parts — the code, the schema
it is expressed in, and the source code — and split over two rows of two they
read as two unrelated pairs. Yahoo code keeps the half-width row above them,
which leaves a visible break before the SIX block. Three across is for values
that belong to each other, not a way to fit more fields in.

Nothing on the form is validated and no field is marked required or optional
(decision 70): the administrator decides what an instrument needs. Nothing is
insisted on, and nothing in the form reaches a provider — creating an instrument
writes the record and ends there (decision 83).

Instrument Type is the first field because it decides what the rest of the form
holds: `TotalEntities` appears only for Credit index, and bonds and funds will add
their own blocks the same way.

#### When the data arrives

Creating an instrument never fetches anything. The record is written and the
numbers arrive on their own, with the system's update rule — so the create form
has no *Fetch data* button, no result alert and no question before creating
(decision 83). A new instrument sits in the list with an em dash for a price and
*Awaiting first update* under it.

What the form still sets is where the data will come from: the **Source**, and
the identifier that source is keyed on.

| Source | Identifier the update is keyed on |
|---|---|
| SIX | SIX Code |
| Yahoo | Yahoo code |
| Bloomberg | Bloomberg code |
| Email, Excel, web scraping | none — the data is delivered by hand |

An instrument whose source needs an identifier it does not have simply never
updates; that is a data-quality question for the list to surface, not a rule the
form enforces.

**Still to define:** the rule itself — how often each source is pulled, whether
it is one schedule for the whole system or one per source, and what happens to an
instrument created minutes after that day's run. Until it is written down, the
form says only *with the scheduled update*. `Refresh data` in the row menu and on
the record's performance tab stays as the manual override for the cases that cannot
wait. The record has no More menu of its own (97).

#### What a failed update looks like in the list

In the **Updated** column: `Failed` in destructive red instead of the date, the
reason in the tooltip (attempt, source, provider message) and, as the tooltip's
last row, *Showing* with the date of the data still on screen. An instrument
that was never fetched shows an em dash with *Awaiting first update* as its
tooltip. Status stays what it always was, the lifecycle axis (decision 66). The
word on screen is *update* everywhere — marker, tooltip and summary count
(decision 84).

#### Prototype notes

`prototype/assets/instruments.js` carries the screen's behaviour. A created
instrument lands in the list with no market data, which is now the only outcome
creating has. *Discard changes?* is a popover inside the dialog for reasons that
are native-HTML constraints, not design ones — decision 68 has them.

`prototype/assets/instruments-performance.js` carries the tab strip and the
performance panel. It is a second file rather than more of `instruments.js`
because it touches none of that file's internals: it reads the record off the DOM
through the same `data-v` hooks `fillValues` writes, and it follows the dialog's
`data-mode` instead of being called by it. Deleting it leaves a working dialog
with one panel.

The series is demo data — a deterministic walk per instrument that ends on the
record's last close and is corrected so every stated percent change lands on its
own session; the 52-week range is then read back off the same series rather than
typed, so nothing on the panel can contradict anything else on it. In production
the series is a second endpoint on the instrument and the drawing is a chart
library. As everywhere else in the prototype, the fetched values exist for two
instruments only (Apple and Nestlé): every other record opens with em dashes, and
the chart follows them into its empty state.

The chart is not in the kit. It becomes a kit component when a second screen needs
one; until then the recipe is in `assets/components.css` under *Chart*, with
`--chart-1..5` rebuilt from the brand (decision 92).

Open for this screen:

- Closed by the summary row (72): a failed update is now findable in one click.
  Still open is whether *awaiting first update* deserves the same, which needs the
  real number — if it is large it is a cell of its own, if it is a handful it belongs
  in a filter.
- **Deactivating does not change how the record reads its own freshness.** The row
  mutes and the badge flips (100), but *Updated* still ages like an active
  instrument's, where this document asks for "frozen, instrument inactive". The
  wording and where it sits are undesigned, on the list and on the performance tab
  both.
- **The refusal is a design decision, not a known API rule.** Decision 95 refuses
  a delete while products read the instrument. Confirm with the product owner that
  the server refuses it too; if it in fact cascades, the same dialog becomes a
  destructive confirmation that names the number and asks for the instrument name
  to be typed, and the copy is the only thing that changes.
- The products card in the record header is a link to nothing: `href="#"`, like the
  count in the list. Both land on the Products screen the moment it exists.
- The sector → industry group mapping in the prototype is GICS industry groups and
  covers only what the demo rows use. The agreed taxonomy is the product owner's,
  and in production the industry list is fetched for the chosen sector.
- Delete in the prototype removes the row and takes its contribution out of the
  summary counts. There is no undo and no message afterwards — the row leaving is
  the message. If deletes turn out to be frequent, an undo needs a toast, which
  the kit does not have (see the design system at `prototype/index.html`).
- `Refresh data` in record mode is drawn but does nothing in the prototype.
- `Save changes` closes the dialog and does not write the edited values back into
  the row behind it. Whether it should is open (decision 91).
- Keyboard: Escape on a dirty form should ask before closing. The behaviour is
  built, but synthetic key events cannot exercise it, so it needs one manual pass
  in a real browser.
- An exact-date lookup in the history. Hovering to 12 March is imprecise; if
  admins turn out to check specific dates, the answer is a date field or a session
  table under the chart, not a bigger chart.
- The performance tab has one empty state and no stale or failed one. A failed
  update keeps the old values and marks them stale in the list; what that looks
  like over a chart — the line greyed, the last good session named — is
  undesigned, and so is the frozen chart of a deactivated instrument.

