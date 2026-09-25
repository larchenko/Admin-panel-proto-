// app.js — shared behaviour for the prototype.
// Small, dependency-free helpers. Each block is one component.

/* ------------------------------------------------------------------ Select
   Markup: see components.css. Works for any number of selects on a page,
   including ones added later (event delegation on document).
*/
(() => {
  const OPEN = 'aria-expanded';

  const parts = (root) => ({
    root,
    trigger: root.querySelector('.select-trigger'),
    content: root.querySelector('.select-content'),
    items: [...root.querySelectorAll('.select-item:not([aria-disabled="true"])')],
    input: root.querySelector('input[type="hidden"]'),
  });

  const GAP = 4;      // trigger to list, matches top-[calc(100%+4px)] in the recipe
  const GUTTER = 8;   // list to the edge of the screen, same as the row menu
  const MAX = 288;    // max-h-72, the ceiling the recipe sets

  // Which side the list opens on, decided on open and re-decided while it is
  // open (decision 80). It opens below the trigger, and above when it does not
  // fit below and there is more room above — so a select near the bottom of the
  // screen opens upward and one near the top opens downward, without flipping a
  // short list that had room where it was. data-prefer="top" on the list asks
  // for the other starting side (the pagination select, which lives in a page
  // footer); the same fit check still applies, so it flips back down rather than
  // run off the top of the screen.
  // The height is capped to the room that side actually has, so a long list
  // scrolls inside itself instead of running off the edge. Measured against the
  // viewport: the list is placed in the page, not in the table's scroll box.
  function place(s) {
    s.content.removeAttribute('data-side');
    s.content.style.maxHeight = '';

    const t = s.trigger.getBoundingClientRect();
    const below = innerHeight - t.bottom - GAP - GUTTER;
    const above = t.top - GAP - GUTTER;
    const needed = s.content.scrollHeight;

    const up = s.content.dataset.prefer === 'top'
      ? needed <= above || above > below
      : needed > below && above > below;

    if (up) s.content.setAttribute('data-side', 'top');
    // 96px is a floor: below that the list is not usable as a list, so it is
    // allowed to overhang. It can only bite when both sides are that small,
    // which needs a window about 200px tall.
    s.content.style.maxHeight = Math.round(Math.min(MAX, Math.max(96, up ? above : below))) + 'px';
  }

  function closeAll(except) {
    document.querySelectorAll('.select-trigger[aria-expanded="true"]').forEach((t) => {
      const root = t.closest('.select');
      if (root !== except) close(parts(root));
    });
  }
  function open(s) {
    closeAll(s.root);
    s.content.hidden = false;
    place(s);
    s.trigger.setAttribute(OPEN, 'true');
    (s.items.find((i) => i.getAttribute('aria-selected') === 'true') || s.items[0])?.focus();
  }
  function close(s, refocus = false) {
    s.content.hidden = true;
    s.content.removeAttribute('data-side');
    s.content.style.maxHeight = '';
    s.trigger.setAttribute(OPEN, 'false');
    if (refocus) s.trigger.focus();
  }

  // The list is absolutely positioned inside .select, so it travels with the
  // trigger on its own; what can go stale while it is open is the side it chose.
  const replace = () => {
    document.querySelectorAll('.select-trigger[aria-expanded="true"]')
      .forEach((t) => place(parts(t.closest('.select'))));
  };
  addEventListener('scroll', replace, true);
  addEventListener('resize', replace);
  function choose(s, item) {
    s.items.forEach((i) => i.setAttribute('aria-selected', i === item ? 'true' : 'false'));
    s.trigger.querySelector('span').textContent = item.textContent.trim();
    s.trigger.removeAttribute('data-placeholder');
    if (s.input) {
      s.input.value = item.dataset.value ?? item.textContent.trim();
      s.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    close(s, true);
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.select-trigger');
    if (trigger) {
      if (trigger.disabled) return;
      const s = parts(trigger.closest('.select'));
      s.trigger.getAttribute(OPEN) === 'true' ? close(s) : open(s);
      return;
    }
    const item = e.target.closest('.select-item');
    if (item && item.getAttribute('aria-disabled') !== 'true') {
      choose(parts(item.closest('.select')), item);
      return;
    }
    closeAll();
  });

  document.addEventListener('keydown', (e) => {
    const trigger = e.target.closest('.select-trigger');
    if (trigger) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        open(parts(trigger.closest('.select')));
      }
      return;
    }
    const item = e.target.closest('.select-item');
    if (!item) return;
    const s = parts(item.closest('.select'));
    const i = s.items.indexOf(item);
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); s.items[Math.min(i + 1, s.items.length - 1)].focus(); break;
      case 'ArrowUp':   e.preventDefault(); s.items[Math.max(i - 1, 0)].focus(); break;
      case 'Home':      e.preventDefault(); s.items[0].focus(); break;
      case 'End':       e.preventDefault(); s.items[s.items.length - 1].focus(); break;
      case 'Enter': case ' ': e.preventDefault(); choose(s, item); break;
      case 'Escape':    e.preventDefault(); close(s, true); break;
      case 'Tab':       close(s); break;
    }
  });
})();

/* ---------------------------------------------------------------- Combobox
   Markup: see components.css. The list is filtered as the user types; the
   focus stays in the input and the active option is announced through
   aria-activedescendant. Enter picks the active option; Escape closes the
   list and, closed, puts the linked value back; Tab closes; the cross
   unlinks. The options are whatever the listbox holds — the screen fills it
   (instruments.js builds it from the list); in production a search endpoint
   does, debounced, with the same markup. A screen that sets the hidden value
   itself dispatches `combobox:sync` on the root so the input follows.
*/
(() => {
  const GAP = 4, GUTTER = 8, MAX = 288;     // the select's numbers (decision 80)

  const parts = (root) => ({
    root,
    input: root.querySelector('input[role="combobox"]'),
    clear: root.querySelector('.combobox-clear'),
    content: root.querySelector('.combobox-content'),
    items: [...root.querySelectorAll('.combobox-item')],
    empty: root.querySelector('.combobox-empty'),
    value: root.querySelector('input[type="hidden"]'),
  });
  const label = (item) => item.childNodes[0]?.textContent.trim() || item.textContent.trim();

  function place(c) {
    c.content.removeAttribute('data-side');
    c.content.style.maxHeight = '';
    const t = c.input.getBoundingClientRect();
    const below = innerHeight - t.bottom - GAP - GUTTER;
    const above = t.top - GAP - GUTTER;
    const up = c.content.scrollHeight > below && above > below;
    if (up) c.content.setAttribute('data-side', 'top');
    c.content.style.maxHeight = Math.round(Math.min(MAX, Math.max(96, up ? above : below))) + 'px';
  }
  function open(c) {
    if (c.input.disabled) return;
    c.content.hidden = false;
    place(c);
    c.input.setAttribute('aria-expanded', 'true');
  }
  function close(c) {
    c.content.hidden = true;
    c.content.removeAttribute('data-side');
    c.content.style.maxHeight = '';
    c.input.setAttribute('aria-expanded', 'false');
    setActive(c, null);
  }
  const isOpen = (c) => !c.content.hidden;

  // Match the name and every identifier (decision 44): data-search on the option
  // carries the same lowercased string the list's search box reads.
  function filter(c) {
    const q = c.input.value.trim().toLowerCase();
    let n = 0;
    c.items.forEach((i) => {
      const ok = !q || label(i).toLowerCase().includes(q) || (i.dataset.search || '').includes(q);
      i.hidden = !ok;
      if (ok) n += 1;
    });
    if (c.empty) c.empty.hidden = n > 0;
  }
  const visible = (c) => c.items.filter((i) => !i.hidden);
  const active = (c) => c.items.find((i) => i.hasAttribute('data-active')) || null;
  function setActive(c, item) {
    c.items.forEach((i) => i.toggleAttribute('data-active', i === item));
    if (item) {
      if (item.id) c.input.setAttribute('aria-activedescendant', item.id);
      item.scrollIntoView({ block: 'nearest' });
    } else {
      c.input.removeAttribute('aria-activedescendant');
    }
  }

  // The input follows the hidden value: the linked name, or nothing.
  function sync(c) {
    const v = c.value?.value || '';
    const item = c.items.find((i) => (i.dataset.value ?? label(i)) === v) || null;
    c.items.forEach((i) => i.setAttribute('aria-selected', String(i === item)));
    c.input.value = item ? label(item) : '';
    if (c.clear) c.clear.hidden = !item;
  }
  function commit(c, v) {
    if (c.value) {
      c.value.value = v;
      c.value.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync(c);
  }
  function choose(c, item) { commit(c, item.dataset.value ?? label(item)); close(c); }

  const rootOf = (t) => t.closest('.combobox');

  document.addEventListener('combobox:sync', (e) => { const r = rootOf(e.target); if (r) sync(parts(r)); });

  document.addEventListener('input', (e) => {
    if (!e.target.matches('input[role="combobox"]')) return;
    const c = parts(rootOf(e.target));
    filter(c);
    open(c);
    setActive(c, visible(c)[0] || null);
  });

  // mousedown, not click: a click would blur the input first and close the list
  document.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.combobox-item');
    if (item) { e.preventDefault(); choose(parts(rootOf(item)), item); return; }
    if (e.target.closest('.combobox-clear')) e.preventDefault();
  });
  document.addEventListener('click', (e) => {
    const clear = e.target.closest('.combobox-clear');
    if (clear) { const c = parts(rootOf(clear)); commit(c, ''); c.input.focus(); return; }
    const input = e.target.closest('input[role="combobox"]');
    if (input) { const c = parts(rootOf(input)); if (!isOpen(c)) { filter(c); open(c); } return; }
    document.querySelectorAll('.combobox input[role="combobox"][aria-expanded="true"]')
      .forEach((i) => close(parts(rootOf(i))));
  });

  document.addEventListener('keydown', (e) => {
    if (!e.target.matches('input[role="combobox"]')) return;
    const c = parts(rootOf(e.target));
    const list = visible(c);
    const i = list.indexOf(active(c));
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen(c)) { filter(c); open(c); }
        setActive(c, list[Math.min(i + 1, list.length - 1)] || null);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen(c)) setActive(c, list[Math.max(i - 1, 0)] || null);
        break;
      case 'Enter':
        if (isOpen(c)) { e.preventDefault(); const a = active(c); if (a) choose(c, a); }
        break;
      case 'Escape':
        e.preventDefault();
        if (isOpen(c)) close(c); else sync(c);
        break;
      case 'Tab':
        close(c);
        break;
    }
  });

  // Leaving without picking: the query was a query, the linked value comes back.
  document.addEventListener('focusout', (e) => {
    if (!e.target.matches('input[role="combobox"]')) return;
    const root = rootOf(e.target);
    setTimeout(() => {
      if (root.contains(document.activeElement)) return;
      const c = parts(root);
      sync(c);
      close(c);
    }, 0);
  });

  // First paint: an input whose hidden value is set shows the linked name.
  document.querySelectorAll('.combobox').forEach((root) => sync(parts(root)));
})();

/* -------------------------------------------------------------------- Menu
   Row-action menus and the Filters panel. Both are native popovers, so they
   render in the top layer and are not clipped by the table's horizontal scroll;
   the browser gives us Escape and click-outside for free. All we add is
   placement next to the trigger, keeping it there while the page moves, and
   arrow-key movement between items.
*/
(() => {
  let trigger = null;
  let open = null;      // { menu, trigger } while one is open

  // Remember which button opened the menu (capture: popovertarget fires after this).
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[popovertarget]');
    if (t) trigger = t;
  }, true);

  // A popover is fixed to the viewport, so it is placed from the trigger's rect
  // and has to be placed again whenever that rect moves — the page scrolling
  // under it, the table scrolling sideways, the window resizing. Without this
  // the panel tears away from its button on the first wheel click.
  function place(menu, from) {
    const r = from?.getBoundingClientRect();
    if (!r) return;
    const m = menu.getBoundingClientRect();
    const gap = 4;
    // Right edges aligned with the trigger, which is what a menu hanging off a
    // button at the right of a row wants. data-align="start" lines the left
    // edges up instead, for a panel that is much wider than the button that
    // opens it and sits at the left of a toolbar (the Filters panel).
    let left = menu.dataset.align === 'start' ? r.left : r.right - m.width;
    let top = r.bottom + gap;
    if (top + m.height > innerHeight - 8) top = r.top - m.height - gap; // flip above when it would overflow
    left = Math.min(left, innerWidth - m.width - 8);
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = Math.max(8, top) + 'px';
  }

  // Hide while the browser lays it out, so it never flashes in the default centre position.
  document.addEventListener('beforetoggle', (e) => {
    const menu = e.target;
    if (!menu.classList?.contains('menu')) return;
    if (e.newState === 'open') menu.style.visibility = 'hidden';
  }, true);

  document.addEventListener('toggle', (e) => {
    const menu = e.target;
    if (!menu.classList?.contains('menu')) return;
    if (e.newState !== 'open') { if (open?.menu === menu) open = null; return; }

    open = { menu, trigger };
    place(menu, trigger);
    menu.style.visibility = '';
    // A menu opens on its first item; a panel of fields has none, so it names
    // the control that should take the focus instead.
    menu.querySelector('.menu-item:not([aria-disabled="true"]), [data-autofocus]')?.focus();
  }, true);

  // capture: catches the page scrolling and the table scrolling inside it. A
  // trigger scrolled off the screen takes its menu with it: a panel left hanging
  // at the top edge belongs to a button nobody can see.
  const follow = () => {
    if (!open) return;
    const r = open.trigger?.getBoundingClientRect();
    if (r && (r.bottom < 0 || r.top > innerHeight)) { open.menu.hidePopover(); return; }
    place(open.menu, open.trigger);
  };
  addEventListener('scroll', follow, true);
  addEventListener('resize', follow);

  document.addEventListener('keydown', (e) => {
    const item = e.target.closest('.menu-item');
    if (!item) return;
    const menu = item.closest('.menu');
    const items = [...menu.querySelectorAll('.menu-item:not([aria-disabled="true"])')];
    const i = items.indexOf(item);
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); items[(i + 1) % items.length].focus(); break;
      case 'ArrowUp':   e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); break;
      case 'Home':      e.preventDefault(); items[0].focus(); break;
      case 'End':       e.preventDefault(); items[items.length - 1].focus(); break;
    }
  });
})();

/* ----------------------------------------------------------------- Tooltip
   One bubble reused by every tooltip on the page. Shown on hover and on keyboard
   focus, so it is reachable without a mouse; give the trigger tabindex="0" when
   it is not already focusable. Placed in the top layer, so a trigger inside a
   scrolling table is never clipped.

   Content is structured, not a sentence:
     data-tooltip="Deactivated"                         optional title line
     data-tooltip-rows="Date=12 Sep 2026;By=a.b@c.ch"   label=value pairs, one per line
   Either attribute works on its own. Values must not contain ";" or "=".
*/
(() => {
  let bubble;
  let current;

  const place = (el) => {
    const r = el.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const gap = 6;
    let top = r.top - b.height - gap;
    if (top < 8) top = r.bottom + gap;                                  // flip below
    let left = r.left + r.width / 2 - b.width / 2;                      // centred
    left = Math.min(Math.max(8, left), innerWidth - b.width - 8);
    bubble.style.top = top + 'px';
    bubble.style.left = left + 'px';
  };

  const render = (el) => {
    const title = el.dataset.tooltip;
    const rows = el.dataset.tooltipRows;
    bubble.replaceChildren();
    if (title) {
      const h = document.createElement('p');
      h.className = rows ? 'tooltip-title' : '';
      h.textContent = title;
      bubble.append(h);
    }
    if (!rows) return;
    const dl = document.createElement('dl');
    dl.className = 'tooltip-rows';
    rows.split(';').filter(Boolean).forEach((pair) => {
      const [label, ...rest] = pair.split('=');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = rest.join('=');
      dl.append(dt, dd);
    });
    bubble.append(dl);
  };

  const show = (el) => {
    if (!el.dataset.tooltip && !el.dataset.tooltipRows) return;
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'tooltip';
      bubble.setAttribute('popover', 'manual');
      bubble.setAttribute('role', 'tooltip');
      document.body.appendChild(bubble);
    }
    current = el;
    render(el);
    bubble.style.visibility = 'hidden';
    // Measure from the top-left corner, not from where the last tooltip sat:
    // a stale `left` near the right edge would squeeze the new text into the
    // room left of the viewport edge and wrap it before it is even placed.
    bubble.style.top = '0px';
    bubble.style.left = '0px';
    bubble.showPopover();
    place(el);
    bubble.style.visibility = '';
  };

  const hide = () => {
    current = null;
    if (bubble?.matches(':popover-open')) bubble.hidePopover();
  };

  const trigger = (t) => t.closest('[data-tooltip], [data-tooltip-rows]');

  document.addEventListener('mouseover', (e) => {
    const el = trigger(e.target);
    if (el !== current) el ? show(el) : hide();
  });
  document.addEventListener('focusin',  (e) => { const el = trigger(e.target); el ? show(el) : hide(); });
  document.addEventListener('focusout', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, true);
})();

/* -------------------------------------------------------------- List filter
   Client-side filtering for the prototype's list screens, so the type tabs, the
   search and everything in the Filters panel do something while the screen is
   reviewed. In production the server filters and this block disappears; what
   has to survive the move is the wiring, not this code.

   Wiring, all by data attributes inside one <div data-list>:
     tabs    <button role="tab" data-filter="type" data-value="equity">
     search  <input data-search="name">                matches data-name on the row
     value   <input type="hidden" data-filter="currency" data-filter-label="Currency">
             matches data-currency on the row; "" or a value starting with "All"
             means the filter is off. data-filter-label is what its chip says —
             an input without one filters but gets no chip, which is right when
             its own control is visible elsewhere (the Failed updates cell).
     ids     <input type="hidden" data-id-field> + <input type="hidden" data-id-state>
             one identifier filter for all twelve fields (decision 90);
             state is empty | filled — value matching is the search box's job
     rows    <tr data-type="equity" data-currency="USD" data-ids="isin=US03…;ric=AAPL.O">
     chips   <div data-chips>          written from the filters; each chip clears its own
     count   <span data-count data-total="248">   panel badge <span data-filter-count>
     empty   <tr data-empty hidden>
     clear   any <button data-clear-all>   filters, the identifier row and the search
     event   list:filtered on the <div data-list>, detail { shown, filtered }
*/
(() => {
  const STATE = { empty: 'is empty', filled: 'is filled' };
  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  document.querySelectorAll('[data-list]').forEach((list) => {
    const empty   = list.querySelector('[data-empty]');
    const count   = list.querySelector('[data-count]');
    const search  = list.querySelector('[data-search]');
    const chips   = list.querySelector('[data-chips]');
    const badge   = list.querySelector('[data-filter-count]');
    const idField = list.querySelector('[data-id-field]');
    const idState = list.querySelector('[data-id-state]');
    const untouched = count?.textContent ?? '';

    // Read on every pass rather than once: the prototype adds a row when an
    // instrument is created, and a row the filter never saw is never hidden.
    const rows   = () => [...list.querySelectorAll('tbody tr[data-name]')];
    const inputs = () => [...list.querySelectorAll('input[type="hidden"][data-filter]')];
    const on     = (i) => Boolean(i.value) && !i.value.startsWith('All');

    /* ---------------------------------------------------------- clearing
       A custom select (17) carries its value in a hidden input and its label in
       the trigger, so putting one back means putting both back. What it goes
       back to is what it said on load: "All currencies" for a filter that has an
       All row, nothing for one that shows a placeholder. */
    list.querySelectorAll('.select-trigger').forEach((t) => {
      t.dataset.resetText = t.querySelector('span').textContent.trim();
      if (t.hasAttribute('data-placeholder')) t.dataset.resetPlaceholder = '';
    });

    const clear = (input, quiet) => {
      const root = input.closest('.select');
      if (!root) {
        input.value = '';
      } else {
        const trigger = root.querySelector('.select-trigger');
        const blank = 'resetPlaceholder' in trigger.dataset;
        const first = root.querySelector('.select-item');
        root.querySelectorAll('.select-item')
          .forEach((i) => i.setAttribute('aria-selected', String(!blank && i === first)));
        input.value = blank ? '' : (first?.dataset.value ?? '');
        trigger.querySelector('span').textContent = trigger.dataset.resetText || '';
        trigger.toggleAttribute('data-placeholder', blank);
      }
      if (!quiet) input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const clearIds = (quiet) => {
      [idField, idState].forEach((i) => i && clear(i, true));
      syncIdRow();                       // condition back to disabled
      if (!quiet) apply();
    };

    // Clear all is every filter, including the ones whose control is not in the
    // panel, plus the search box — anything else would leave the list narrowed
    // by something the button said it had cleared.
    const clearAll = () => {
      inputs().forEach((i) => clear(i, true));
      clearIds(true);
      if (search) search.value = '';
      inputs().forEach((i) => i.dispatchEvent(new Event('change', { bubbles: true })));
      apply();
    };

    /* ------------------------------------------------------- identifiers
       One row of the panel filters all twelve identifiers: the field is picked,
       the condition is applied to that field's value on the row. The values ride
       on the row as data-ids="isin=US0378331005;ric=AAPL.O" — one attribute
       instead of twelve, because nothing but this filter reads them. */
    const ids = (row) => Object.fromEntries(
      (row.dataset.ids || '').split(';').filter(Boolean).map((pair) => {
        const at = pair.indexOf('=');
        return at < 0 ? [pair, ''] : [pair.slice(0, at), pair.slice(at + 1)];
      }),
    );

    const idQuery = () => {
      const field = idField?.value || '';
      const state = idState?.value || '';
      if (!field || !state) return null;                 // half a filter filters nothing
      return { field, state };
    };

    const idMatch = (row, q) => {
      const has = (ids(row)[q.field] || '').trim();
      return q.state === 'empty' ? has === '' : has !== '';
    };

    const idLabel = (field) => idField?.closest('.select')
      ?.querySelector(`.select-item[data-value="${field}"]`)?.textContent.trim() || field;

    /* -------------------------------------------------------------- chips */
    const chip = (text, value, onClear) => {
      const el = document.createElement('span');
      el.className = 'chip';
      const label = document.createElement('span');
      label.className = 'chip-label';
      label.textContent = text;
      el.append(label);
      if (value) {
        const strong = document.createElement('span');
        strong.textContent = value;
        el.append(strong);
      }

      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'chip-clear';
      x.setAttribute('aria-label', `Clear filter: ${text} ${value}`);
      x.innerHTML = '<i class="ri-close-line" aria-hidden="true"></i>';
      x.addEventListener('click', onClear);
      el.append(x);
      return el;
    };

    const renderChips = (active, q) => {
      if (badge) {
        badge.textContent = active.length + (q ? 1 : 0);
        badge.hidden = active.length + (q ? 1 : 0) === 0;
      }
      if (!chips) return;
      chips.replaceChildren();
      active.forEach((i) => chips.append(
        chip(`${i.dataset.filterLabel}:`, i.value, () => clear(i)),
      ));
      if (q) chips.append(chip(`${idLabel(q.field)} ${STATE[q.state]}`, '', () => clearIds()));
      chips.hidden = chips.children.length === 0;
    };

    /* -------------------------------------------------------------- apply */
    function apply() {
      const tabs = {};
      list.querySelectorAll('[role="tab"][aria-selected="true"][data-filter]').forEach((t) => {
        if (t.dataset.value !== 'all') tabs[t.dataset.filter] = t.dataset.value;
      });
      const active = inputs().filter(on);
      const q = idQuery();
      const text = (search?.value ?? '').trim().toLowerCase();

      const filtered = Boolean(text) || Boolean(q) || active.length > 0
        || Object.keys(tabs).length > 0;

      let shown = 0;
      rows().forEach((row) => {
        const ok = Object.entries(tabs).every(([k, v]) => row.dataset[camel(k)] === v)
          && active.every((i) => row.dataset[camel(i.dataset.filter)] === i.value)
          && (!q || idMatch(row, q))
          && (!text || row.dataset.name.includes(text));
        row.hidden = !ok;
        if (ok) shown++;
      });

      if (empty) empty.hidden = shown !== 0;
      if (count) {
        count.textContent = !filtered ? untouched : shown ? `1–${shown} of ${shown}` : '0 of 0';
      }
      renderChips(active.filter((i) => i.dataset.filterLabel), q);

      // Anything that acts on the query rather than on a row listens for this
      // instead of re-reading the filters: the Export button (decision 86) is
      // the first. Bubbles, so a listener on the document catches every list.
      list.dispatchEvent(new CustomEvent('list:filtered', {
        bubbles: true,
        detail: { shown, filtered },
      }));
    }

    list.querySelectorAll('[role="tab"][data-filter]').forEach((tab) => {
      tab.addEventListener('click', () => {
        list.querySelectorAll(`[role="tab"][data-filter="${tab.dataset.filter}"]`)
          .forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
        apply();
      });
    });
    list.addEventListener('change', (e) => {
      if (e.target.matches('input[type="hidden"][data-filter], [data-id-field], [data-id-state]')) apply();
    });
    search?.addEventListener('input', apply);
    list.querySelectorAll('[data-clear-all]').forEach((b) => b.addEventListener('click', clearAll));

    // The condition means nothing until a field is picked, so it is not offered
    // until then — half a filter should not look like a whole one.
    const syncIdRow = () => {
      idState?.closest('.select')?.querySelector('.select-trigger')
        ?.toggleAttribute('disabled', !idField?.value);
    };
    idField?.addEventListener('change', syncIdRow);
    syncIdRow();

    apply();
  });
})();

/* ----------------------------------------------------------------- Sidebar
   Collapse toggle. Flips data-collapsed on the nearest .sidebar; the CSS hides
   the labels and narrows the rail to 48px. The label of each item stays in the
   title attribute, so the browser shows it as a tooltip while collapsed.
   In production the state should be remembered per user; here it resets on load.
*/
(() => {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sidebar-toggle]');
    if (!btn) return;
    const sidebar = btn.closest('.sidebar') || document.querySelector('.sidebar');
    if (!sidebar) return;

    const collapsed = sidebar.toggleAttribute('data-collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    btn.setAttribute('aria-label', btn.title);
    btn.querySelector('i').className = collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line';
  });
})();

/* --------------------------------------------------------- Column chooser
   Which columns a table shows, and in what order. Both are the user's own
   setting; in production both are stored per user, here they reset on reload
   like the sidebar rail.

   Wiring:
     <div class="menu column-menu" popover data-columns data-columns-for="instrument-list">
     <li class="column-item" data-col="price" draggable="true">  list order = column order
     <li class="column-item" data-col="instrument" data-locked>  never moves, never hides
     <th data-col="price">                                       the column it drives

   Body cells carry no attributes: the header row is the map, and every row is
   reordered by the same permutation. The actions column is not in the list and
   is always appended last.
*/
(() => {
  document.querySelectorAll('[data-columns]').forEach((menu) => {
    const table = document.getElementById(menu.dataset.columnsFor)?.querySelector('table');
    const list = menu.querySelector('.column-list');
    if (!table || !list) return;

    const head = table.tHead.rows[0];
    const items = () => [...list.querySelectorAll('.column-item')];
    const rows = () => [head, ...table.tBodies[0].rows].filter((r) => r.cells.length === head.cells.length);
    const initial = items().map((li) => ({ li, on: li.querySelector('input').checked }));

    const apply = () => {
      const order = [...items().map((li) => li.dataset.col), 'actions'];
      const before = [...head.cells].map((c) => c.dataset.col);
      rows().forEach((row) => {
        const cells = [...row.cells];
        order.forEach((col) => row.appendChild(cells[before.indexOf(col)]));
      });

      const after = [...head.cells].map((c) => c.dataset.col);
      items().forEach((li) => {
        const on = li.querySelector('input').checked;
        const i = after.indexOf(li.dataset.col);
        rows().forEach((row) => (row.cells[i].hidden = !on));
      });

      const empty = table.querySelector('[data-empty] td[colspan]');
      if (empty) empty.colSpan = [...head.cells].filter((c) => !c.hidden).length;
    };

    // show / hide
    list.addEventListener('change', (e) => { if (e.target.matches('.checkbox')) apply(); });

    // reorder, pointer: lift, and the list opens a gap. Grabbing the handle lifts
    // a floating copy of the row that follows the pointer; the row's own slot
    // turns into an empty gap, and the rows between that gap and the pointer
    // slide one row over to move the gap where the row will land. The gap is the
    // whole promise: you see the shape the list will take, not a line describing
    // it. Nothing moves in the DOM until you let go.
    let drag = null;    // the row being dragged (still in the list, as the gap)
    let ghost = null;   // the floating copy under the pointer
    let slots = [];     // each row's resting place, measured once at the grab
    let from = 0;       // the dragged row's own index
    let at = 0;         // where it would land: it sits before slots[at]
    let grabY = 0;      // pointer Y when the handle was grabbed
    let ghostY = 0;     // where the floating copy started
    let atY = 0;        // pointer Y now
    let raf = 0;        // the drag frame loop

    const noop = () => at === from || at === from + 1;

    // Move the copy, pick the gap, slide the rows that stand between.
    const paint = () => {
      // The copy is measured off the list every frame, not once at the grab: the
      // popover is placed from its trigger's rect and may still be moving when
      // the handle goes down, and a copy left at stale coordinates is worse than
      // no copy at all.
      const box = list.getBoundingClientRect();
      Object.assign(ghost.style, {
        left: `${box.left + 4}px`,
        width: `${box.width - 8}px`,
        top: `${ghostY + (atY - grabY)}px`,
      });

      // The landing place is read off the resting layout, never off where the
      // rows are now: a row that has slid out of the way must not then change
      // the answer, or the two fight each other and the gap flickers.
      const y = atY - box.top + list.scrollTop;
      at = slots.findIndex((s) => s.movable && y < s.mid);
      if (at < 0) at = slots.length;

      const h = slots[from].h;
      slots.forEach(({ li }, n) => {
        const by = n > from && n < at ? -h : n >= at && n < from ? h : 0;
        li.style.transform = by ? `translateY(${by}px)` : '';
      });
    };

    // A frame loop, not just pointermove: dragging to the edge of the list has to
    // keep scrolling it while the pointer sits still there, and repainting every
    // frame also keeps the copy true if the menu itself moves under it.
    const frame = () => {
      if (!drag) return;
      raf = requestAnimationFrame(frame);
      const r = list.getBoundingClientRect();
      const step = atY < r.top + 28 ? -6 : atY > r.bottom - 28 ? 6 : 0;
      if (step) list.scrollTop += step;
      paint();
    };

    list.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest('.column-handle');
      const li = handle?.closest('.column-item');
      if (drag || !li || li.hasAttribute('data-locked')) return;
      e.preventDefault();
      const r = li.getBoundingClientRect();
      const box = list.getBoundingClientRect();
      drag = li;
      grabY = atY = e.clientY;
      ghostY = r.top;
      handle.setPointerCapture(e.pointerId);

      // Measured before anything moves, and in the list's own coordinates, so the
      // numbers survive the list scrolling under the pointer.
      slots = items().map((row) => {
        const b = row.getBoundingClientRect();
        const top = b.top - box.top + list.scrollTop;
        return { li: row, h: b.height, top, mid: top + b.height / 2, movable: !row.hasAttribute('data-locked') };
      });
      from = at = slots.findIndex((s) => s.li === li);

      // The copy goes in the popover, not in the body: the popover is in the top
      // layer, and anything outside it paints underneath however high its z-index.
      ghost = li.cloneNode(true);
      ghost.className = 'column-item column-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.querySelectorAll('input').forEach((input, i) => {
        input.checked = li.querySelectorAll('input')[i].checked;
        input.tabIndex = -1;
      });
      ghost.style.height = `${r.height}px`;   // left, width and top come from paint()
      menu.appendChild(ghost);

      li.setAttribute('data-dragging', '');
      list.setAttribute('data-dragging', '');
      paint();
      frame();
    });

    list.addEventListener('pointermove', (e) => {
      if (!drag) return;
      atY = e.clientY;
      paint();
    });

    const endDrag = (e) => {
      if (!drag) return;
      cancelAnimationFrame(raf);
      e.target.closest?.('.column-handle')?.releasePointerCapture?.(e.pointerId);

      // The DOM catches up with what the gap has been showing all along, and the
      // slid rows drop their transforms in the same frame: the layout they were
      // faking is now the real one, so nothing jumps.
      const moved = !noop();
      if (moved) list.insertBefore(drag, slots[at]?.li ?? null);
      slots.forEach(({ li }) => (li.style.transform = ''));
      if (moved) apply();

      // The copy settles into the slot the row now occupies instead of vanishing
      // mid-air, so the eye can follow the row to its new place. The row keeps
      // its gap look until the copy lands on it.
      const row = drag, copy = ghost, seat = drag.getBoundingClientRect();
      copy.setAttribute('data-settling', '');
      copy.style.top = `${seat.top}px`;
      setTimeout(() => {
        copy.remove();
        if (row !== drag) row.removeAttribute('data-dragging');   // a new drag may own it by now
      }, 140);

      list.removeAttribute('data-dragging');
      ghost = drag = null;
      slots = [];
    };
    list.addEventListener('pointerup', endDrag);
    list.addEventListener('pointercancel', endDrag);

    // reorder, keyboard: focus a handle and use the arrow keys
    list.addEventListener('keydown', (e) => {
      const handle = e.target.closest('.column-handle');
      if (!handle || !['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const li = handle.closest('.column-item');
      if (li.hasAttribute('data-locked')) return;
      const to = e.key === 'ArrowUp' ? li.previousElementSibling : li.nextElementSibling;
      if (!to || to.hasAttribute('data-locked')) return;
      e.preventDefault();
      to.insertAdjacentElement(e.key === 'ArrowUp' ? 'beforebegin' : 'afterend', li);
      handle.focus();
      apply();
    });

    menu.querySelector('[data-columns-reset]')?.addEventListener('click', () => {
      initial.forEach(({ li, on }) => {
        list.appendChild(li);
        li.querySelector('input').checked = on;
      });
      apply();
    });

    apply();
  });
})();

/* ------------------------------------------------------- Pinned column edge
   The first column of a [data-pin-first] table is sticky (see components.css).
   Its edge shadow should only appear once the table is actually scrolled, so
   the flag lives here and follows scrolling, resizing and columns being
   switched on and off.
*/
(() => {
  document.querySelectorAll('.table-wrap').forEach((wrap) => {
    const update = () => wrap.toggleAttribute('data-scrolled-start', wrap.scrollLeft > 0);
    wrap.addEventListener('scroll', update, { passive: true });
    // ResizeObserver, not a one-off call: the browser Tailwind build applies its
    // CSS after this script runs, so at load the table has no width yet. It also
    // covers the window resizing and columns being switched on and off.
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    if (wrap.firstElementChild) ro.observe(wrap.firstElementChild);
    update();
  });
})();

/* ------------------------------------------------------------------ Dialog
   Native <dialog> + showModal(): focus trap, inert background, Escape and the
   top layer are the browser's job. What this block adds:

     data-dialog-open="id"   on any button, opens that dialog
     data-dialog-close       on any button inside it, closes it
     backdrop click          closes it, same as the close button
     form[data-guard]        a form whose loss needs confirming — closing it while
                             it is dirty opens #confirm-discard first, including
                             when Escape asks (the browser would honour Escape
                             immediately, so the cancel event is intercepted)
     data-autofocus          the control focused when the dialog opens

   Dirty is tracked by any input or change inside the guarded form. In Angular
   this is a form's own dirty state plus a CanDeactivate-style confirmation.
*/
(() => {
  let pending = null;                       // the dialog waiting for the discard answer

  // A confirmation is a manual popover (see components.css), everything else is
  // a modal <dialog>; both live in the top layer and open the same way.
  const show = (el) => (el.hasAttribute('popover') ? el.showPopover() : el.showModal());
  const hide = (el) => (el.hasAttribute('popover') ? el.hidePopover() : el.close());

  const guardedForm = (dlg) => dlg?.querySelector('form[data-guard]');
  const isDirty = (dlg) => guardedForm(dlg)?.hasAttribute('data-dirty') === true;

  const finishClose = (dlg) => {
    guardedForm(dlg)?.removeAttribute('data-dirty');
    hide(dlg);
  };

  const requestClose = (dlg) => {
    if (!dlg) return;
    const confirmDlg = document.getElementById('confirm-discard');
    if (!isDirty(dlg) || !confirmDlg) { finishClose(dlg); return; }
    if (confirmDlg.matches(':popover-open')) return;      // already asking
    pending = dlg;
    show(confirmDlg);
    confirmDlg.querySelector('.btn')?.focus();
  };

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-dialog-open]');
    if (opener) {
      const dlg = document.getElementById(opener.dataset.dialogOpen);
      if (!dlg) return;
      show(dlg);
      dlg.querySelector('[data-autofocus]')?.focus();
      return;
    }

    if (e.target.closest('[data-discard-confirm]')) {          // "Discard changes"
      const c = document.getElementById('confirm-discard');
      if (c) hide(c);
      if (pending) finishClose(pending);
      pending = null;
      return;
    }

    const closer = e.target.closest('[data-dialog-close]');
    if (closer) { requestClose(closer.closest('.dialog')); return; }

    // click on the backdrop: the only place where the dialog itself is the target.
    // A confirmation is not dismissed this way — it has to be answered.
    if (e.target.matches('dialog.dialog')) requestClose(e.target);
  });

  // Escape. The event does not bubble, so listen in the capture phase.
  document.addEventListener('cancel', (e) => {
    const dlg = e.target;
    if (!dlg.classList?.contains('dialog')) return;
    if (!isDirty(dlg)) return;
    e.preventDefault();
    setTimeout(() => requestClose(dlg), 0);
  }, true);

  const markDirty = (e) => e.target.closest('form[data-guard]')?.setAttribute('data-dirty', '');
  document.addEventListener('input', markDirty);
  document.addEventListener('change', markDirty);
})();

/* -------------------------------------------------------------------- Copy
   data-copy on a button copies data-copy-value (or the text of the element it
   points at) and confirms it on the button itself for a moment. Used for the
   record Id, which is read rarely and copied often.
*/
(() => {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const value = btn.dataset.copy || document.getElementById(btn.dataset.copyFrom)?.textContent?.trim();
    if (!value) return;
    try { await navigator.clipboard.writeText(value); } catch { return; }
    const icon = btn.querySelector('i');
    if (!icon) return;
    const was = icon.className;
    icon.className = 'ri-check-line';
    btn.setAttribute('data-tooltip', 'Copied');
    setTimeout(() => { icon.className = was; btn.setAttribute('data-tooltip', 'Copy Id'); }, 1200);
  });
})();
