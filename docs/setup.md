# Running the prototype

The pages import `theme.css` over HTTP, so they must be served, not opened as files.

From the project root:

```bash
python3 serve.py
```

Then open http://localhost:4173

`serve.py` is Python's built-in static server with caching disabled, so edits to
`theme.css`, `components.css` and `tailwind.js` show up on a normal reload.
Plain `python3 -m http.server --directory prototype` also works but the browser
may keep old copies of those files; use a hard reload (Cmd+Shift+R) then.

## Folder layout

```
prototype/
  index.html          entry page
  assets/theme.css    tokens + Tailwind mapping + base styles (the theme)
  assets/components.css  component recipes (.btn, .btn-outline ...) built with @apply
  assets/tailwind.js  loads theme.css + components.css into the Tailwind browser build (one <script> per page)
  assets/app.js       shared behaviour (Phase 6)
  kit/                foundations and component catalogue (Phases 2–3)
  screens/            app shell and entity screens (Phases 4–5)
docs/
  domain.md           scope, entities, roles
  decisions.md        decisions log
  setup.md            this file
```

## Dependencies (all from CDN, versions pinned)

- Tailwind CSS v4 browser build `@tailwindcss/browser@4.1.14`
- RemixIcon `remixicon@4.6.0`
- Inter via Google Fonts
