// kit-nav.js — the map of the prototype, and the one place it is written down.
//
// Every kit page carries <aside class="kit-sidebar" data-kit-nav></aside> and
// this script fills it: the brand, the Design system / Pages switcher, the
// filter box and the tree. The same arrays render each section's overview
// (<div data-kit-index>) and the previous/next pager (<nav data-kit-pager>), so
// a component is added to the system in exactly one place: here, plus its own
// page under kit/components/.
//
// Two sections, and the split is Atomic Design's own (decisions 101, 105):
//
//   DESIGN_SYSTEM   Foundations → Atoms → Molecules → Organisms → Templates.
//                   A component sits in the layer it is BUILT at, not the layer
//                   it is used at — a Badge stays an atom although it spends its
//                   life inside a table row.
//   PAGES           The last layer: a template filled with the real thing. The
//                   six areas of the Admin panel, built and unbuilt.
//
// `note` is not drawn in the tree — a layer name stands on its own there. It is
// what the overview page says the layer means. An item with `href: null` is a
// screen that does not exist yet: it shows in the tree, greyed and unclickable.

(() => {
  // Everything is written relative to prototype/, resolved from this script's
  // own URL, so a page three folders deep links the same way as the index.
  const ROOT = document.currentScript.src.replace(/assets\/kit-nav\.js(\?.*)?$/, '');

  const DESIGN_SYSTEM = [
    {
      name: 'Foundations',
      note: 'What every component is made of. One page, eight sections.',
      items: [
        { title: 'Brand',           href: 'kit/foundations.html#brand' },
        { title: 'Colour',          href: 'kit/foundations.html#colour' },
        { title: 'Typography',      href: 'kit/foundations.html#typography' },
        { title: 'Spacing',         href: 'kit/foundations.html#spacing' },
        { title: 'Radius',          href: 'kit/foundations.html#radius' },
        { title: 'Shadow',          href: 'kit/foundations.html#shadow' },
        { title: 'Icons',           href: 'kit/foundations.html#icons' },
        { title: 'Spartan mapping', href: 'kit/foundations.html#spartan' },
      ],
    },
    {
      name: 'Atoms',
      note: 'One control, nothing inside it that is a component of its own.',
      items: [
        { title: 'Button',   href: 'kit/components/button.html',   blurb: 'Triggers an action. Five variants in descending emphasis; the container sets the size.' },
        { title: 'Input',    href: 'kit/components/input.html',    blurb: 'One line of text, with its error, disabled and read-only states.' },
        { title: 'Textarea', href: 'kit/components/textarea.html', blurb: 'Multi-line text that grows with its content.' },
        { title: 'Select',   href: 'kit/components/select.html',   blurb: 'One value from a list. Custom, because the native control cannot be themed.' },
        { title: 'Checkbox', href: 'kit/components/checkbox.html', blurb: 'On, off, and the mixed state a header checkbox needs.' },
        { title: 'Radio',    href: 'kit/components/radio.html',    blurb: 'One of a few options, all of them visible at once.' },
        { title: 'Switch',   href: 'kit/components/switch.html',   blurb: 'A setting that takes effect the moment it is flipped.' },
        { title: 'Badge',    href: 'kit/components/badge.html',    blurb: 'A state, read at a glance. Status colours, never brand colours.' },
      ],
    },
    {
      name: 'Molecules',
      note: 'A few atoms that only mean something together.',
      items: [
        { title: 'Form field', href: 'kit/components/field.html',   blurb: 'Label, control, hint and error as one unit — the wrapper every input is used in.' },
        { title: 'Card',       href: 'kit/components/card.html',    blurb: 'A surface that groups related content, with an optional header action.' },
        { title: 'Metrics',    href: 'kit/components/metrics.html', blurb: 'A number with its label. The summary row above a list.' },
        { title: 'Alert',      href: 'kit/components/alert.html',   blurb: 'A message that stays on the page, in one of the four status tones.' },
      ],
    },
    {
      name: 'Organisms',
      note: 'A whole region of a screen, with behaviour of its own.',
      items: [
        { title: 'Table',   href: 'kit/components/table.html',   blurb: 'The list view of every entity: toolbar, sortable header, rows, footer, column chooser.' },
        { title: 'Filters', href: 'kit/components/filters.html', blurb: 'The panel behind a Filters button, and the chip row that keeps the query visible.' },
        { title: 'Dialog',  href: 'kit/components/dialog.html',  blurb: 'A modal for one task. Anatomy, sizes, and the confirmation that opens over one.' },
        { title: 'Navigation', href: 'kit/navigation.html',      blurb: 'The sidebar: six areas of the Admin panel, their icons, states and collapsed rail.' },
      ],
    },
    {
      name: 'Templates',
      note: 'The layout of a whole screen, with nothing real in it yet.',
      items: [
        { title: 'Form example', href: 'kit/components/form-example.html', blurb: 'A record form: sections, two columns, where the buttons go.' },
      ],
    },
  ];

  const PAGES = [
    {
      name: 'Screens',
      note: 'A template filled with the real thing. Six areas, in the order the product owner gave them.',
      items: [
        { title: 'Instruments',           href: 'screens/instruments.html', blurb: 'The list inside the app shell — sidebar, page header, type tabs, search, filters, the record dialog.' },
        { title: 'Products',              href: null, blurb: 'Structured products. Types, statuses and the link to instruments are still open.' },
        { title: 'Users & Organizations', href: null, blurb: 'Who has access, and which organization they belong to.' },
        { title: 'Custodians',            href: null, blurb: 'The banks that hold the assets.' },
        { title: 'Issuers',               href: null, blurb: 'The banks that issue the products.' },
        { title: 'Settings',              href: null, blurb: 'System-wide configuration. Which settings live here is still open.' },
      ],
    },
    {
      name: 'Modals',
      note: 'What opens over a screen. Each one documented in every state it can be in, drawn live from the screen that owns it.',
      items: [
        { title: 'Instrument record', href: 'pages/instrument-record.html', blurb: 'Create and record modes, the discard guard, and the deactivate and delete confirmations — eleven states.' },
      ],
    },
  ];

  const SECTIONS = [
    { label: 'Design system', home: 'index.html', layers: DESIGN_SYSTEM },
    { label: 'Pages',         home: 'pages.html', layers: PAGES },
  ];

  // A directory index is served as index.html, so "/" and "/index.html" are the
  // same page and have to match the same way.
  const path = location.pathname.replace(/\/$/, '/index.html');
  const file = (href) => href.split('#')[0];

  // Which half of the switcher the open page belongs to. Its own overview
  // counts, so /pages.html lands on Pages even before any screen is opened.
  const holds = (sec) => path.endsWith(sec.home)
    || sec.layers.some((l) => l.items.some((i) => i.href && path.endsWith(file(i.href))));
  const section = SECTIONS.find(holds) || SECTIONS[0];

  const LAYERS = section.layers;
  const FLAT = LAYERS.flatMap((l) => l.items.filter((i) => i.href).map((i) => ({ ...i, layer: l.name })));

  // Every item that lives on the open page. Foundations puts eight of them on
  // one page; everything else puts one.
  const here = FLAT
    .filter((i) => path.endsWith(file(i.href)))
    .sort((a, b) => file(b.href).length - file(a.href).length);
  const onThisPage = here.length ? here.filter((i) => file(i.href) === file(here[0].href)) : [];

  // The open page as an entry of its own — what previous/next steps through.
  // A page that is only reached by anchors (Foundations) has none.
  const current = onThisPage.find((i) => !i.href.includes('#')) || null;
  const anchors = onThisPage.filter((i) => i.href.includes('#'));

  // FLAT copies each item, so the open one is recognised by its href, never by
  // object identity.
  const isCurrent = (item) => !!current && item.href === current.href;

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* --------------------------------------------------------------- Sidebar */
  const aside = document.querySelector('[data-kit-nav]');
  if (aside) {
    const brand = el('a', 'kit-brand');
    brand.href = ROOT + 'index.html';
    brand.innerHTML = `
      <img class="kit-brand-mark" src="${ROOT}assets/logo-mark.svg?v=2026-09-23" alt="">
      <span class="kit-brand-name">VIZ 2.0 Admin panel</span>`;
    aside.append(brand);

    // The switcher. It says which half of the prototype is open, which is why
    // the brand no longer carries a "Design system" line under it — one label
    // for one thing, and this one is also the control that changes it.
    const nav = el('nav', 'kit-switch');
    nav.setAttribute('aria-label', 'Section');
    SECTIONS.forEach((sec) => {
      const a = el('a', 'kit-switch-item', sec.label);
      a.href = ROOT + sec.home;
      if (sec === section) a.setAttribute('aria-current', 'page');
      nav.append(a);
    });
    aside.append(nav);

    const search = el('div', 'kit-search');
    const finding = section.layers === PAGES ? 'Find a screen' : 'Find a component';
    search.innerHTML = `
      <i class="ri-search-line"></i>
      <input type="search" placeholder="${finding}" aria-label="${finding}" autocomplete="off">
      <kbd>/</kbd>`;
    aside.append(search);

    const tree = el('div', 'kit-tree');
    aside.append(tree);

    LAYERS.forEach((layer) => {
      const g = el('div', 'kit-group');
      g.append(el('p', 'kit-group-label', layer.name));

      layer.items.forEach((item) => {
        // A screen that does not exist yet is listed but is not a link: the
        // tree has to be able to say "owed" as well as "there".
        if (!item.href) {
          const todo = el('span', 'kit-link kit-link-todo', `${item.title}<em>not built</em>`);
          g.append(todo);
          return;
        }

        const a = el('a', 'kit-link', item.title);
        a.href = ROOT + item.href;
        if (isCurrent(item)) a.setAttribute('aria-current', 'page');
        g.append(a);

        // The open page's own sections, listed the way Storybook lists stories.
        // The anchor is on the h2 on a component page and on the <section> on
        // the pages written before the split, so take whichever carries it.
        if (isCurrent(item)) {
          const heads = [...document.querySelectorAll('.kit-content h2')]
            .map((h) => ({ h, id: h.id || h.closest('section[id]')?.id }))
            .filter((x) => x.id);
          if (heads.length) {
            const box = el('div', 'kit-stories');
            heads.forEach(({ h, id }) => {
              const s = el('a', 'kit-story', h.textContent.trim());
              s.href = '#' + id;
              s.dataset.target = id;
              box.append(s);
            });
            g.append(box);
          }
        }
      });

      tree.append(g);
    });

    const empty = el('p', 'kit-empty', 'Nothing by that name.');
    empty.hidden = true;
    tree.append(empty);

    const foot = el('div', 'kit-sidebar-foot');
    foot.innerHTML = `Recipes: <code>assets/components.css</code><br>
      Tokens: <code>assets/theme.css</code>`;
    aside.append(foot);

    /* Filtering. Hides items and empties whole layers, so the tree keeps
       saying which layer a match belongs to. */
    const input = search.querySelector('input');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let hits = 0;
      tree.querySelectorAll('.kit-group').forEach((g) => {
        let shown = 0;
        g.querySelectorAll('.kit-link').forEach((a) => {
          const match = !q || a.textContent.toLowerCase().includes(q);
          a.hidden = !match;
          if (match) shown++;
        });
        const storyBox = g.querySelector('.kit-stories');
        if (storyBox) storyBox.hidden = !!q;
        g.hidden = shown === 0;
        hits += shown;
      });
      empty.hidden = hits > 0;
    });

    // `/` focuses the filter, as in Storybook. Esc clears it.
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)
        || document.activeElement.isContentEditable;
      if (e.key === '/' && !typing) { e.preventDefault(); input.focus(); }
      if (e.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.blur();
      }
    });

    /* Which section is being read, marked in the sidebar so that it answers
       "where am I" while the page scrolls. On a component page that is the
       story list under the open item; on Foundations, where the eight items
       ARE the sections, it is the items themselves. The one being read is the
       last heading that has passed the top of the screen. */
    const stories = [...aside.querySelectorAll('.kit-story')];
    const spied = stories.length
      ? stories.map((a) => ({ a, id: a.dataset.target }))
      : anchors
          .map((i) => i.href.split('#')[1])
          .map((id) => ({ a: tree.querySelector(`.kit-link[href$="#${id}"]`), id }))
          .filter((x) => x.a);

    const targets = spied
      .map((x) => ({ ...x, el: document.getElementById(x.id) }))
      .filter((x) => x.el);

    if (targets.length) {
      const READ_LINE = 140;   // px from the top: where a heading counts as read
      const mark = () => {
        let active = targets[0];
        for (const t of targets) {
          if (t.el.getBoundingClientRect().top <= READ_LINE) active = t;
          else break;
        }
        targets.forEach((t) => {
          if (t === active) t.a.setAttribute('aria-current', stories.length ? 'location' : 'page');
          else t.a.removeAttribute('aria-current');
        });
      };
      let queued = false;
      addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; mark(); });
      }, { passive: true });
      mark();
    }
  }

  /* ---------------------------------------------------- Previous / next */
  const pager = document.querySelector('[data-kit-pager]');
  const at = current ? FLAT.indexOf(current) : -1;
  if (pager && at >= 0) {
    const i = at;
    const link = (item, dir, icon, cls) => {
      const a = el('a', cls);
      a.href = ROOT + item.href;
      a.innerHTML = `<i class="${icon}"></i><span><span class="kit-pager-dir">${dir}</span>
        <span class="kit-pager-name">${item.title}</span></span>`;
      return a;
    };
    if (i > 0) pager.append(link(FLAT[i - 1], 'Previous', 'ri-arrow-left-line', 'kit-pager-prev'));
    if (i < FLAT.length - 1) pager.append(link(FLAT[i + 1], 'Next', 'ri-arrow-right-line', 'kit-pager-next'));
  }

  /* ---------------------------------------- The open section's overview */
  // Foundations is left out: its eight items are sections of one page, and a
  // card each would send the reader to the same page eight times.
  const index = document.querySelector('[data-kit-index]');
  if (index) {
    LAYERS.filter((l) => l.name !== 'Foundations').forEach((layer) => {
      const sec = document.createElement('section');
      sec.className = 'mt-14';
      sec.id = layer.name.toLowerCase();
      sec.innerHTML = `
        <h2 class="section-title">${layer.name}</h2>
        <p class="mt-2 max-w-2xl text-muted-foreground">${layer.note}</p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2"></div>`;
      const grid = sec.querySelector('div');
      layer.items.forEach((item) => {
        const card = document.createElement(item.href ? 'a' : 'div');
        if (item.href) {
          card.href = ROOT + item.href;
          card.className = 'rounded-lg border bg-card p-4 hover:bg-muted';
        } else {
          // Not a link, and drawn as one of the things it is missing: a dashed
          // edge and no surface, so the eye sorts built from owed without
          // reading a word.
          card.className = 'rounded-lg border border-dashed p-4';
        }
        card.innerHTML = `
          <p class="font-medium${item.href ? '' : ' text-muted-foreground'}">${item.title}${
            item.href ? '' : ' <span class="badge badge-secondary">Not built</span>'}</p>
          <p class="mt-1 text-muted-foreground">${item.blurb || ''}</p>`;
        grid.append(card);
      });
      index.append(sec);
    });
  }
})();
