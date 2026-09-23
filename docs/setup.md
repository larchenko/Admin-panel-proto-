# Running the prototype

The pages import `theme.css` over HTTP, so they must be served, not opened as files.

From the project root:

```bash
python3 serve.py
```

Then open http://localhost:4173

`serve.py` is Python's built-in static server with caching disabled, so edits to
`theme.css`, `components.css`, `kit.css` and the scripts show up on a normal reload.
Plain `python3 -m http.server --directory prototype` also works but the browser
may keep old copies of those files; use a hard reload (Cmd+Shift+R) then.

## Folder layout

```
prototype/
  index.html          THE LANDING PAGE — the design-system overview, every component by layer
  pages.html          the other half of the switcher: the six screens, built and unbuilt
  pages/              one page per modal, each drawn live from the screen that opens it
  kit/                the design system, ordered atoms -> molecules -> organisms -> templates
    foundations.html    tokens, type, spacing, icons
    navigation.html     the sidebar and the app shell
    components/         one page per component (button.html, table.html ...)
  screens/            the screens themselves (instruments.html)
  assets/theme.css    tokens + Tailwind mapping + base styles (the theme)
  assets/components.css  component recipes (.btn, .btn-outline ...) built with @apply
  assets/tailwind.js  loads theme.css + components.css into the Tailwind browser build, and sets
                      the favicon (one <script> per page)
  assets/app.js       shared behaviour
  assets/logo.svg     the full lockup, used in the app sidebar
  assets/logo-mark.svg  the mark alone: favicon, and the kit sidebar's brand
  assets/kit.css      the kit shell: the sidebar these docs are read in. NOT part of the theme —
                      it is documentation chrome, so tailwind.js does not load it
  assets/kit-nav.js   the map, written down once: both trees (design system, pages), the switcher,
                      each section's overview and the previous/next pager all read this one file
docs/
  domain.md           scope, entities, roles
  decisions.md        decisions log
  setup.md            this file
```

## Dependencies (all from CDN, versions pinned)

- Tailwind CSS v4 browser build `@tailwindcss/browser@4.1.14`
- RemixIcon `remixicon@4.6.0`
- Archivo via Google Fonts (weights 400/500/600)
