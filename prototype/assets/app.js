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

  function closeAll(except) {
    document.querySelectorAll('.select-trigger[aria-expanded="true"]').forEach((t) => {
      const root = t.closest('.select');
      if (root !== except) close(parts(root));
    });
  }
  function open(s) {
    closeAll(s.root);
    s.content.hidden = false;
    s.trigger.setAttribute(OPEN, 'true');
    (s.items.find((i) => i.getAttribute('aria-selected') === 'true') || s.items[0])?.focus();
  }
  function close(s, refocus = false) {
    s.content.hidden = true;
    s.trigger.setAttribute(OPEN, 'false');
    if (refocus) s.trigger.focus();
  }
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

/* -------------------------------------------------------------------- Menu
   Row-action menus. The menu is a native popover, so it renders in the top
   layer and is not clipped by the table's horizontal scroll; the browser gives
   us Escape and click-outside for free. All we add is placement next to the
   trigger, and arrow-key movement between items.
*/
(() => {
  let trigger = null;

  // Remember which button opened the menu (capture: popovertarget fires after this).
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[popovertarget]');
    if (t) trigger = t;
  }, true);

  // Hide while the browser lays it out, so it never flashes in the default centre position.
  document.addEventListener('beforetoggle', (e) => {
    const menu = e.target;
    if (!menu.classList?.contains('menu')) return;
    if (e.newState === 'open') menu.style.visibility = 'hidden';
  }, true);

  document.addEventListener('toggle', (e) => {
    const menu = e.target;
    if (!menu.classList?.contains('menu')) return;
    if (e.newState !== 'open') return;

    const r = trigger?.getBoundingClientRect();
    if (r) {
      const m = menu.getBoundingClientRect();
      const gap = 4;
      let left = r.right - m.width;                                  // right edge aligned with the trigger
      let top = r.bottom + gap;
      if (top + m.height > innerHeight - 8) top = r.top - m.height - gap; // flip above when it would overflow
      menu.style.left = Math.max(8, left) + 'px';
      menu.style.top = Math.max(8, top) + 'px';
    }
    menu.style.visibility = '';
    menu.querySelector('.menu-item:not([aria-disabled="true"])')?.focus();
  }, true);

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

/* -------------------------------------------------------------- List filter
   Client-side filtering for the prototype's list screens, so tabs, search and
   the filter selects actually do something while the screen is reviewed.
   In production the server filters and this block disappears.

   Wiring, all by data attributes on one <div data-list>:
     tabs    <button role="tab" data-filter="type" data-value="equity">
     search  <input data-search="name">          matches data-name on the row
     select  <input type="hidden" data-filter="currency">   value "All …" = no filter
     rows    <tr data-type="equity" data-currency="USD" data-name="apple inc.">
     count   <span data-count data-total="248">
     empty   <tr data-empty hidden>
*/
(() => {
  document.querySelectorAll('[data-list]').forEach((list) => {
    const rows = [...list.querySelectorAll('tbody tr[data-name]')];
    const empty = list.querySelector('[data-empty]');
    const count = list.querySelector('[data-count]');
    const search = list.querySelector('[data-search]');
    const untouched = count?.textContent ?? '';

    const apply = () => {
      const filters = {};
      list.querySelectorAll('[role="tab"][aria-selected="true"][data-filter]').forEach((t) => {
        if (t.dataset.value !== 'all') filters[t.dataset.filter] = t.dataset.value;
      });
      list.querySelectorAll('input[type="hidden"][data-filter]').forEach((i) => {
        if (i.value && !i.value.startsWith('All')) filters[i.dataset.filter] = i.value;
      });
      const q = (search?.value ?? '').trim().toLowerCase();

      let shown = 0;
      rows.forEach((row) => {
        const ok = Object.entries(filters).every(([k, v]) => row.dataset[k] === v)
          && (!q || row.dataset.name.includes(q));
        row.hidden = !ok;
        if (ok) shown++;
      });

      if (empty) empty.hidden = shown !== 0;
      if (count) {
        const filtered = q || Object.keys(filters).length;
        count.textContent = !filtered ? untouched : shown ? `1–${shown} of ${shown}` : '0 of 0';
      }
    };

    list.querySelectorAll('[role="tab"][data-filter]').forEach((tab) => {
      tab.addEventListener('click', () => {
        list.querySelectorAll(`[role="tab"][data-filter="${tab.dataset.filter}"]`)
          .forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
        apply();
      });
    });
    list.querySelectorAll('input[type="hidden"][data-filter]').forEach((i) => i.addEventListener('change', apply));
    search?.addEventListener('input', apply);
  });
})();
