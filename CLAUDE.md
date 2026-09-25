# VIZ 2.0 Admin panel — HTML prototype

An HTML prototype of the Admin panel for a structured-products management system.
Production frontend is Spartan UI (Angular); the prototype borrows the shadcn/ui
design language — tokens, recipe classes, markup — and no React. The designer is
the author; the reader of every doc and code comment is the frontend developer who
ports this to Spartan and was not in the room.

## Run

```bash
python3 serve.py
```

http://localhost:4173 (a port as argument or `$PORT` overrides it). In the Claude app
use the `prototype` entry in `.claude/launch.json` (autoPort). No build step and no
npm: Tailwind v4 browser build, RemixIcon and Archivo come from CDNs.

## Where things are

```
prototype/                      the site root (Vercel serves this folder)
  index.html                    design-system overview, the landing page
  pages.html                    the six areas, built and not built
  pages/instrument-record.html  the record modal in all its states, live frames
  kit/foundations.html          tokens, type, spacing, icons
  kit/navigation.html           sidebar and app shell
  kit/components/*.html         one page per component
  screens/instruments.html      the one built screen
  assets/theme.css              tokens: BRAND layer + SYSTEM layer
  assets/components.css         every component recipe (~1.1k lines)
  assets/app.js                 shared behaviour: select, menus, popovers, filters, dialogs
  assets/instruments.js         Instruments screen only, demo data, ?state= scaffolding
  assets/instruments-performance.js  the price chart
  assets/kit-nav.js             the kit's tree, written once; sidebar, overview and pager read it
  assets/kit.css                kit chrome only, never ported
  assets/tailwind.js            loads theme.css + components.css into Tailwind, sets the favicon
docs/
  decisions.md                  decisions index, one line each: read this
  decisions-full.md             full wording and reasoning: look up, never read whole
  instruments.md                field model and screen spec for Instruments (~650 lines)
  worklog.md                    one entry per working day, written to paste into Jira
  domain.md                     scope, entities, role
  setup.md                      how to run, folder layout, dependencies
scripts/decisions.py            the only way to add or change a decision
scripts/lint.py                 checks the settled rules; also runs as a hook after every edit
.claude/agents/sync-check.md    read-only agent: where screen, kit, docs and decisions disagree
```

## Reading cheaply

- Start from `docs/decisions.md`. For the reasoning behind one decision:
  `python3 scripts/decisions.py show 53`.
- `instruments.md`, `components.css`, `app.js` and `instruments.js` are long. Find the
  heading, recipe or block with grep and read that range, not the whole file.
- Code quotes decisions as `decision 53`; grep for the number to find where a rule lives.

## Settled rules

These are decided. Do not reopen them unless the designer does.

- **Stack.** Recipes in `components.css`, named as shadcn/Spartan (`.btn-outline` ↔
  `hlmBtn variant="outline"`), built with `@apply` (12). Behaviour is native HTML plus
  vanilla JS (8). Icons are RemixIcon only, never Lucide (2, 10).
- **Scope.** English UI, light theme only, no login or auth screens, one role (3).
- **Desktop only.** An internal tool used at one fixed desktop size. Never resize the
  browser pane, test other widths or add responsive behaviour.
- **Numbers.** Financial values keep full precision and are never rounded (33). The one
  exception is Last price in the instruments list: two decimals, display only (53).
- **No captions under headings.** A section heading stands alone: the users are trained
  staff, and a line explaining the section repeats the heading and pushes the controls
  down. A non-obvious rule goes on the field it constrains, into an error, or into a
  decision. A line carrying live values (`Updated … · data dated …`) is data and stays.
- **Colour.** Status colours never come from the brand (31); the brand is `#200766` (23).
- **Scales.** Type ladder 36 / 24 / 18 / 14 / 12, every step changes two of size, weight
  and colour (77, 78). Spacing ladder 2 / 4 / 6 / 8 / 12 / 16 / 24, no 20 or 28, 24 is the
  ceiling (87). Button size follows the container (103). Radius 4px base (28).
- **Tables and forms.** A missing value is an em dash (45). One value per list cell (108).
  The instrument form validates nothing (70).
- **Assets.** Bump `?v=<date>` on asset URLs when artwork changes (25).
- **Domain.** A fact the product owner has not confirmed is marked *to confirm*, never
  invented.

## Recording decisions

When the designer settles something — a rule, a trade-off, a deviation from shadcn — record it:

```bash
python3 scripts/decisions.py add --summary "One line" --decision "Full wording" --notes "Why"
```

It takes the next number under a lock and writes both files; never pick a number by
hand. When a new decision changes an older one, update the older status with
`set-status 46 "superseded by 108"`. Quote the number in the comment where the rule
lives in code. Old rows keep the words they were written with. If the Instruments
screen changes, update `docs/instruments.md` as well.

## Worklog

`docs/worklog.md` is the day-by-day record, newest day first, and its entries are
pasted into Jira comments as they stand. When a piece of work lands — a screen
change, a fix, a finding — add it under today's date in the part it belongs to:
**Done** (what changed, where to see it, decision numbers in brackets), **Found**
(bugs, data inconsistencies, questions raised), **Open** (what was left for a
decision). Plain sentences and short bullets; no file paths unless the reader
must open the file; no numbers in prose that do not change what the reader does.
Append only: re-read the file first (other sessions write to it too), add your
lines to the existing day or start the day if it is missing, and never rewrite
lines you did not write.

## Kit and screens

- A new component is a page under `kit/components/` plus one line in `kit-nav.js` (101).
- The kit draws states rather than describing them, through `data-demo` hooks that
  share the real rule (104).
- A modal is documented by loading the real screen with `?state=<id>`, never by copying
  its markup (107).
- Verify in the preview at its default desktop size: console free of errors, then a
  screenshot.

## Checks

- `scripts/lint.py` runs as a hook after every Edit and Write and reports only the lines
  just written that break a settled rule: off-ladder spacing, responsive or dark
  variants, Lucide, `btn-secondary`, rounded financial values, worded placeholders,
  captions under headings, `!important`, a personal name. Fix what it reports. A line
  that breaks a rule on purpose carries `lint-ok` in a comment, with the reason.
- `python3 scripts/lint.py` with no arguments checks every file, plus broken links, the
  decisions log and code that quotes a superseded decision. Run it before committing.
- After a change that touches a screen, a component or a decision, ask the `sync-check`
  agent where the screen, the kit, `instruments.md` and the decisions now disagree. It
  only reports; fixing is the main session's job.

## Parallel sessions

The designer often runs two or three Claude sessions in this repo on the same screens.

- Before editing `screens/*.html`, `assets/*.js`, `components.css` or `docs/*.md`, check
  the peer sessions and the files' modification times.
- If a peer is busy in the same files, prepare the change in the scratchpad, wait until
  the files have been quiet for about four minutes, then re-read and patch. Waiting beats
  overwriting someone's work.
- Never commit or revert changes you did not make without asking.

## Git

- `main` tracks `viz-2-0` → `https://vizibility.ghe.com/VIZ-2-0/admin-panel-proto.git`.
  Push there only.
- Commit when the designer asks. Message style: `Area: what changed`, for example
  `Kit: Modals section, the record modal in all eleven states`.
- Vercel deploys `prototype/` (`vercel.json`, `noindex` on every page).
