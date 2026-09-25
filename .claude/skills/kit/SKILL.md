---
name: kit
description: Add to or change the Admin panel's library in the VIZ 2.0 prototype — a Foundations section (tokens, scales, icons), a component page at its Atomic Design layer (atom, molecule, organism, template), a screen under Pages, or a modal documented live through ?state=. Use it whenever the designer asks to add, draw, document, move, rename or fix anything in the kit or the design system — kit-nav.js, a kit/components page, Foundations, pages.html, a Modals page — or to bring an older kit page up to the Button page's standard, even when they never say "kit" ("додай Tooltip", "намалюй стани Input", "новий компонент", "задокументуй модалку", "зареєструй екран"). Not for designing a whole new product area end to end.
---

# Kit: foundations, components, pages

The library exists for one reader: the frontend developer who ports the prototype to
Spartan and was not in the room. So every part of it has one source of truth and the kit
draws from it rather than keeping copies: the tree is written once in `kit-nav.js`, a
component's look lives in its recipe in `components.css`, and a modal is shown by loading
the real screen. A copy in the kit is a second source that drifts the first time the real
one is tuned — this reasoning is behind most of the steps below (decisions 101, 104, 107).

`CLAUDE.md` has the settled rules and the file map; this skill is the order of work.

## The map

| What | Lives in | Registered in `assets/kit-nav.js` |
|---|---|---|
| Foundations | `kit/foundations.html`, one `<section id>` per part; values in `assets/theme.css` | `DESIGN_SYSTEM` → Foundations, `href: 'kit/foundations.html#<id>'` |
| Atom, molecule, organism, template | `kit/components/<name>.html`; recipe in `assets/components.css` | its layer's `items`, with a `blurb` |
| Screen | `screens/<area>.html` (+ `assets/<area>.js`); spec `docs/<area>.md` | `PAGES` → Screens: the `href: null` row gets its path |
| Modal | `pages/<modal>.html`; its states in the owning screen's `STATES` map | `PAGES` → Modals |

The sidebar, the section list under the open item, the two overviews (`index.html`,
`pages.html`) and the previous/next pager are all rendered from `kit-nav.js`. Never
hand-edit them; add the line and they follow.

## 1. Decide what it is

**Layer = where it is built, not where it is used** (101). A Badge stays an atom though it
lives in table rows.

- **Atom**: one control, nothing inside it is a component of its own.
- **Molecule**: a few atoms that only mean something together (Form field, Metrics).
- **Organism**: a whole region of a screen with behaviour of its own (Table, Filters, Dialog).
- **Template**: the layout of a screen with nothing real in it (Form example).
- **Page**: a template filled with the real thing — a screen, or a modal's states.

Layer, name and the shadcn/Spartan counterpart are the designer's calls. If one is in doubt,
state your pick with a one-line reason and ask before building; a component filed in the
wrong layer is filed wrong in the developer's head too.

A whole new product area (Products, Users & Organizations, Custodians, Issuers, Settings)
is bigger than this skill: its field model and its list and record design come from the
designer and the product owner first. Do the registration part only and say that the area
design itself is separate work.

## 2. Before editing

- **Peer sessions.** `components.css`, `kit-nav.js`, `app.js`, `screens/*` and `docs/*` are
  shared with other sessions. Check `stat -f '%Sm %N' <files>`. If one changed in the last
  few minutes, prepare the change in the scratchpad, wait until the files have been quiet
  for about four minutes, re-read, then patch. A new `kit/components/<name>.html` is yours
  alone.
- **What is already decided.** Grep `docs/decisions.md` for the component's name and read
  the ones that apply with `python3 scripts/decisions.py show N`. Build to them; don't
  reopen them.
- **What already exists.** Grep `components.css` for a recipe — several components exist as
  recipes with no kit page yet (tooltip, skeleton). Grep `screens/` and `assets/app.js` for
  where it is used: the kit draws a component the way the screen uses it, same markup.
- **The reference page.** `kit/components/button.html` is the one page that meets the full
  standard. Copy the head, the shell and the scripts from it, not from memory — CDN
  versions and asset paths change.

## 3a. A component

**The recipe** in `components.css`:

- Named as shadcn/Spartan: `.x` base, `.x-<variant>`, `.x-<size>` (default size has no
  class), composed with `@apply`, mapping 1:1 to the Helm inputs (12). Put it beside its
  relatives in the file and quote the decisions it follows in its comment block.
- **States are declared once and shared with the kit:**
  `.x-default:hover, .x-default[data-demo~="hover"] { … }`, the same for `:focus-visible`
  and `[data-demo~="focus"]`. Disabled, loading and invalid need no hook — the demo carries
  the real `disabled`, `aria-busy="true"`, `aria-invalid="true"`. A demo that restates a
  colour instead would drift (104). Product markup never sets `data-demo`.
- Many older recipes (`.input` among them) still carry `hover:` / `focus-visible:` as
  prefixes inside the base `@apply`. A prefix cannot be reached by the hook, so move that
  state out into a rule of its own first — the comment above `.btn:focus-visible` shows
  the pattern — and check the real state still looks the same.
- Respect the settled scales: spacing 2/4/6/8/12/16/24 (87), radius 4px base (28), type
  ladder (77, 78), status colours never from the brand (31), RemixIcon line by default and
  fill for active or selected (10), borders on the page and shadows only on floating layers
  (11). No dark or responsive variants. The lint hook reports what slips.

**The page** `kit/components/<name>.html`:

- `<title><Name> · <Layer> · VIZ 2.0 Admin panel</title>`; assets at `../../assets/…`.
- `p.kit-eyebrow` = the layer; `h1.page-title` = the name; `p.kit-meta` =
  `Spartan: <code>hlm…</code> · shadcn: <code>….tsx</code>`, or
  `Ours — no shadcn or Spartan equivalent`; then one lead paragraph: what it is for and
  when not to use it.
- Sections are `<h2 id="…" class="section-title mt-14">`. The sidebar lists every `h2` that
  has an id as a story under the open item, so an `h2` without one drops out of the tree.
  Usual order, only the ones the component has: **Variants · Sizes · States** · sections
  particular to it · **Rules · Markup**.
- A specimen sits in `<div class="mt-3 rounded-lg border p-6">`.
- **States is a matrix**: variants as rows, states as columns (Rest, Hover, Focus,
  Disabled, and whatever else it has), each cell a real element. Draw, don't describe: the
  text beside a specimen gives the reason or the rule, never a sentence standing in for a
  state that is not drawn (104 was written after exactly that).
- **A floating layer** (tooltip, menu, select list, filter panel) is positioned by `app.js`,
  and the kit pages so far open it for real, on hover or click. How to show one open
  without a pointer is not settled yet: use the real trigger, and if the page needs the
  open state visible at rest, put that to the designer rather than inventing a hook.
- **Rules**: a bullet list, decision numbers inline (`decision&nbsp;102`).
- **Markup**: a `<pre>` with the escaped markup exactly as the screen uses it, then one line
  with the Spartan equivalent.
- Close with `<nav class="kit-pager" data-kit-pager></nav>`, then `kit-nav.js`, then
  `app.js`.

**Register it**: one item in its layer in `kit-nav.js`, next to its closest relative:
`{ title: 'Tooltip', href: 'kit/components/tooltip.html', blurb: '…' }`. The blurb is one
sentence and shows on the overview card, so it must agree with the decisions — counts of
variants and sizes especially. Check it against them; that is where the kit drifts first.

**An older page** (Input, Select, Checkbox… still describe states in prose): when asked to
touch one, bring that page up to this anatomy. Leave other pages alone unless asked.

## 3b. Foundations

- Values live in `theme.css`, in two layers: **BRAND** (the hue and everything built from it)
  and **SYSTEM** (neutrals, lines, status). A white-label swap replaces BRAND and nothing
  else (31). A new token takes the shadcn name pattern (`--x`, `--x-foreground`) in OKLCH (5).
- A new step on a scale (type, spacing, radius) changes every screen, so it is a decision,
  never a quiet edit. Propose it; build it once the designer settles it.
- On `foundations.html` a part is `<section id="…" class="mt-16">` with an
  `h2.section-title`. Specimens read the live token (`var(--x)`, the utility class), not a
  pasted hex, so the page follows the theme.
- A new part: add it under Foundations in `kit-nav.js` as `kit/foundations.html#<id>` and fix
  the layer's `note`, which counts the sections ("One page, eight sections").

## 3c. A screen

- A screen is product: the Spartan developer ports it, and the lint's product rules apply
  (spacing ladder, no responsive, no rounding of financial values).
- It is assembled only from the system. If it needs something the system has not got, the
  component comes first (3a), then the screen.
- Register it: in `PAGES` → Screens, give the existing `href: null` row its path and rewrite
  its blurb for what is built. The order is the product owner's; keep it.
- Its spec is `docs/<area>.md`, shaped like `docs/instruments.md`. A domain fact the product
  owner has not confirmed is marked *to confirm*, never invented.

## 3d. A modal

- A modal is documented by loading the real screen with `?state=<id>`, never by copying its
  markup (107).
- In the owning screen's script, the `STATES` map at its end (see the tail of
  `instruments.js`): one entry per state, opened by the real functions — through a real
  click where one exists, so the screen's own handlers run. A state the demo data cannot
  reach is forced on the way in, and the page says it is forced.
- The page `pages/<modal>.html`: copy the viewer block and its script from
  `pages/instrument-record.html` (a 1440×900 frame scaled to fit, allowed out of the text
  column). Then one table per group of states — **State** (a
  `<button type="button" class="kit-state" data-state="<id>">`) · **How it is reached** ·
  **What is different**. Every `data-state` needs a `STATES` key and the other way round.
- End with **Not drawn yet**: what the modal does not have (validation, pending, failure),
  so a gap is not mistaken for a decision.
- Register it in `PAGES` → Modals, the blurb naming the modes and the number of states.
- If the screen is Instruments, update `docs/instruments.md` as well.

## 4. Finish

1. **Decisions.** Record what the designer settled in this conversation:
   `python3 scripts/decisions.py add --summary … --decision … --notes …` (never pick a
   number by hand), and `set-status` on any older one it changes. Quote the number where the
   rule lives — the recipe comment, the page's Rules. Choices you made yourself are not
   decisions yet: list them for the designer as open.
2. **Spec.** `docs/instruments.md` if the Instruments screen changed.
3. **Worklog.** Re-read `docs/worklog.md` (other sessions write to it), add plain lines under
   today's date in **Done**, **Found** or **Open**, decision numbers in brackets. Append
   only, never rewrite lines you did not write.
4. **Lint.** `python3 scripts/lint.py` with no arguments. The hook checks only the lines just
   written; the full run also catches broken links, such as a `kit-nav.js` href to a page
   that does not exist.
5. **Preview.** Start the `prototype` entry of `.claude/launch.json` and open the page at the
   pane's default size — never resize, the tool is desktop only. Check: the console is free
   of errors; the sidebar shows the item in the right layer with its sections under it; the
   overview card and the pager are there. Take a screenshot.
6. **Sync check.** Ask the `sync-check` agent where the kit, the screen, the spec and the
   decisions disagree now. Fix what is plainly yours; bring judgement calls to the designer.
7. Commit only when the designer asks, as `Kit: what changed`.

## Report back

A few lines: what was added and where to see it, the decisions recorded, what is left open.
Drift found on the way (a blurb that contradicts a decision, a state with no handler) is
reported; fix it only when it is small and in scope, otherwise ask.
