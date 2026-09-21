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
