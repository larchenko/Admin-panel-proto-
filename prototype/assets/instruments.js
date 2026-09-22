// instruments.js — behaviour of the Instruments screen only.
//
// Everything here exists so the screen can be reviewed as a working thing: the
// instrument dialog in its two modes and a created instrument that actually
// lands in the list. In production the data comes from the API and this file
// disappears; what has to survive the move is the wiring described in
// docs/instruments.md, not this code.

(() => {
  const dlg = document.getElementById('instrument');
  const form = document.getElementById('instrument-form');
  const list = document.getElementById('instrument-list');
  if (!dlg || !form || !list) return;

  const table = list.querySelector('table');
  const tbody = table.tBodies[0];

  /* ------------------------------------------------------------ demo data */

  // Everything the list does not carry, for the two instruments a reviewer will open first.
  const DETAILS = {
    'AAPL US Equity': {
      isin: 'US0378331005', cusip: '037833100', figi: 'BBG000B9XRY4', sedol: '2046251',
      valor: '908440', wkn: '865985', ric: 'AAPL.O', yahoo: 'AAPL',
      'six-code': 'AAPL', 'six-schema': 'TICKER_BC', 'six-bc': '67',
      source: 'SIX', basedon: '', datadate: '17 Sep 2026, 22:00:00',
      close: '226.514', open: '226.98', high: '228.34', low: '225.71',
      price: '227.858', chg5d: '+1.842%', chg1m: '+4.117%', chg3m: '+9.628%',
      chg6m: '+11.04%', chg1y: '+18.226%', chgytd: '+12.47%',
      low52: '164.075', high52: '237.49', vol90: '24.13%',
      id: '8f3c1a90-4b2e-4d77-9c6a-0d51ee7a1b42',
      createdby: 'a.larchenko@vizibility.ch', createdon: '23 Sep 2025, 07:57:03',
      modifiedby: 'system@capital-viz.com', modifiedon: '18 Sep 2026, 10:12:03',
    },
    'NESN SW Equity': {
      isin: 'CH0038863350', sedol: '3886335', valor: '3886335', ric: 'NESN.S', yahoo: 'NESN.SW',
      'six-code': 'NESN', 'six-schema': 'TICKER_BC', 'six-bc': '4',
      source: 'SIX', basedon: '', datadate: '17 Sep 2026, 17:30:00',
      close: '84.58', open: '84.62', high: '85.06', low: '84.31',
      price: '84.7234', chg5d: '-0.614%', chg1m: '+1.238%', chg3m: '-2.417%',
      chg6m: '+3.882%', chg1y: '-5.163%', chgytd: '+2.184%',
      low52: '73.12', high52: '96.4', vol90: '16.08%',
      id: 'b1d7e504-2f18-4a3c-8e90-77cc21ab5f13',
      createdby: 'a.larchenko@vizibility.ch', createdon: '14 Mar 2025, 11:02:44',
      modifiedby: 'system@capital-viz.com', modifiedon: '18 Sep 2026, 10:12:03',
    },
  };

  const FLAGS = {
    Switzerland: 'ch', 'United States': 'us', 'United Kingdom': 'gb', Ireland: 'ie',
    Germany: 'de', France: 'fr', Japan: 'jp',
  };

  /* --------------------------------------------------------------- helpers */

  const $ = (sel, root = dlg) => root.querySelector(sel);
  const num = (v) => parseFloat(String(v).replace(/[^\d.-]/g, ''));

  // Display rounding for the list's Last price column only (decision 53).
  const price2 = (v) => {
    const n = num(v);
    if (!isFinite(n)) return '';
    const [i, d] = n.toFixed(2).split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, "'") + '.' + d;
  };

  const setV = (key, value) => {
    const el = $(`[data-v="${key}"]`);
    if (!el) return;
    const empty = value === undefined || value === null || value === '';
    el.textContent = empty ? '—' : value;
    el.classList.toggle('empty', empty);
    if (key.startsWith('chg')) {
      el.classList.toggle('stat-up', !empty && String(value).startsWith('+'));
      el.classList.toggle('stat-down', !empty && String(value).startsWith('-'));
    }
  };

  const field = (name) => form.querySelector(`[name="${name}"]`);
  const val = (name) => {
    const el = field(name);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return (el.value || '').trim();
  };
  const setVal = (name, value) => {
    const el = field(name);
    if (!el) return;
    if (el.type === 'checkbox') { el.checked = !!value; return; }
    if (el.type === 'hidden') {                       // custom select (decision 17)
      const root = el.closest('.select');
      const trigger = root.querySelector('.select-trigger');
      const item = [...root.querySelectorAll('.select-item')]
        .find((i) => (i.dataset.value || '') === value);
      root.querySelectorAll('.select-item').forEach((i) => i.setAttribute('aria-selected', String(i === item)));
      el.value = item ? value : '';
      trigger.querySelector('span').textContent = item ? item.textContent.trim() : (trigger.dataset.placeholderText || '');
      trigger.toggleAttribute('data-placeholder', !item);
      return;
    }
    el.value = value ?? '';
  };

  const IDENTIFIERS = ['bbg', 'isin', 'cusip', 'figi', 'sedol', 'valor', 'wkn', 'ric', 'yahoo', 'six-code', 'six-schema', 'six-bc'];

  /* ------------------------------------------------------------ mode */

  let current = null;      // the record the dialog is showing, null while creating

  function setMode(mode) {
    dlg.dataset.mode = mode;
    dlg.querySelectorAll('[data-only]').forEach((el) => {
      el.classList.toggle('hidden', !el.dataset.only.split(' ').includes(mode));
    });
    // One dialog reused for every instrument means the body keeps the scroll
    // position of the last one. Opening a record always starts at its name.
    const body = dlg.querySelector('.dialog-body');
    if (body) body.scrollTop = 0;
  }

  /* ----------------------------------------------------------- record mode */

  function readRow(row) {
    const cols = [...table.tHead.rows[0].cells].map((c) => c.dataset.col);
    const cell = (col) => row.cells[cols.indexOf(col)];
    const text = (col, sel) => {
      const c = cell(col);
      const el = sel ? c?.querySelector(sel) : c;
      const t = (el?.textContent || '').trim();
      return t === '—' ? '' : t;
    };
    return {
      name: text('instrument', '.cell a'),
      bbg: text('instrument', '.cell-sub'),
      type: text('type'),
      sector: text('sector', 'span:first-child'),
      industry: text('sector', '.cell-sub'),
      country: cell('country')?.textContent.trim().replace('—', '') || '',
      products: text('products'),
      pricer: !!cell('pricer')?.querySelector('[data-on]'),
      currency: text('currency'),
      source: text('price', '.cell-sub'),
      updated: [text('updated', '.cell > span:first-child'), text('updated', '.cell-sub')].filter(Boolean).join(', '),
      status: text('status'),
      row,
    };
  }

  // One way in. Reading the instrument and editing it are the same screen
  // (decision 91), so there is no second entry point and no mode to switch to:
  // the fields are live from the moment the dialog opens.
  function openRecord(row) {
    const base = readRow(row);
    current = { ...base, ...(DETAILS[base.bbg] || {}) };
    fillForm(current);
    fillValues(current);
    setMode('record');
    syncSave();
    if (!dlg.open) dlg.showModal();
  }

  // The editable half: everything an admin owns goes into the form itself.
  function fillForm(d) {
    form.removeAttribute('data-dirty');
    setVal('type', d.type);
    setVal('name', d.name);
    setVal('currency', d.currency);
    setVal('country', d.country);
    setVal('sector', d.sector);
    industryFields();                 // the sector decides the list (96)
    setVal('industry', d.industry);
    setVal('entities', d.entities || '');
    setVal('pricer', d.pricer);
    IDENTIFIERS.forEach((k) => setVal(k, d[k] || ''));
    setVal('source', d.source);
    setVal('basedon', d.basedon || '');
    typeFields();
  }

  // The read-only half: calculated, fetched and logged values, shown beside the
  // fields they belong to rather than in a panel of their own.
  function fillValues(d) {
    setV('title', d.name || 'Untitled instrument');
    setV('subtitle', [d.type, d.bbg].filter(Boolean).join(' · '));
    setV('updated', d.updated);

    // Products is a metric card in the dialog header (97): the label above it
    // says what the number counts, so the number is written bare, like the cells
    // above the list. Zero is worth printing — an instrument nothing is built on
    // is exactly the one that may be deleted (95).
    setV('products', d.products);
    ['price', 'close', 'open', 'high', 'low', 'datadate', 'vol90', 'low52', 'high52',
     'chg5d', 'chg1m', 'chg3m', 'chg6m', 'chg1y', 'chgytd',
     'id', 'createdby', 'createdon', 'modifiedby', 'modifiedon'].forEach((k) => setV(k, d[k]));

    // 52-week range: the mark is where the current price sits between the ends.
    const lo = num(d.low52), hi = num(d.high52), now = num(d.price);
    const mark = $('[data-v="range-mark"]');
    const ok = [lo, hi, now].every(isFinite) && hi > lo;
    mark.style.left = ok ? `${Math.min(100, Math.max(0, ((now - lo) / (hi - lo)) * 100))}%` : '50%';
    mark.classList.toggle('hidden', !ok);

    syncStatus();                     // badge and switch in the header (100)
  }

  /* ------------------------------------------------------------ create mode */

  // The placeholder each select starts with, remembered before anything changes
  // it — without this a reset leaves the old label sitting over an empty value.
  form.querySelectorAll('.select-trigger').forEach((t) => {
    t.dataset.placeholderText = t.querySelector('span').textContent.trim();
  });

  function resetForm() {
    form.reset();
    form.removeAttribute('data-dirty');
    form.querySelectorAll('input[type="hidden"][data-value]').forEach((h) => setVal(h.name, ''));
    typeFields();
    industryFields();
  }

  function openCreate() {
    current = null;
    resetForm();
    setV('title', 'New instrument');
    setMode('create');
    if (!dlg.open) dlg.showModal();
    $('#i-type')?.focus();
  }

  /* --------------------------------------------------------- saving is live
     Save changes is disabled until the form is dirty, so record mode opens with
     no primary action pressing to be used — reading is the common case and it
     should cost nothing. The dirty flag itself is set by app.js, on any input
     or change inside a form[data-guard], which is also what the discard
     confirmation reads.
  */
  const saveBtn = dlg.querySelector('[data-act="save"]');

  function syncSave() {
    if (saveBtn) saveBtn.disabled = !form.hasAttribute('data-dirty');
  }

  /* ------------------------------------------- the sector decides the industries
     Decision 96. Industry group is not a list of its own, it is the sector's
     list: each option carries data-sector and only its sector's options are
     offered. With no sector there is nothing to offer, so the select is disabled
     and says why, and an industry left over from another sector is cleared
     rather than kept — a pair that disagrees is worse than an empty field.

     In production the second list is fetched for the sector that was chosen and
     this function is the request; here the mapping is in the markup so the
     hand-off can read it in one place.
  */
  const industryRoot = form.querySelector('[data-field="industry"] .select');
  const industryHint = form.querySelector('[data-industry-hint]');

  function industryFields() {
    if (!industryRoot) return;
    const sector = val('sector');
    const items = [...industryRoot.querySelectorAll('.select-item')];

    items.forEach((i) => {
      const ok = Boolean(sector) && i.dataset.sector === sector;
      i.hidden = !ok;
      // hidden alone would still leave the option reachable by keyboard: the
      // select walks .select-item:not([aria-disabled="true"]).
      if (ok) i.removeAttribute('aria-disabled');
      else i.setAttribute('aria-disabled', 'true');
    });

    industryRoot.querySelector('.select-trigger').disabled = !sector;
    industryHint?.toggleAttribute('hidden', Boolean(sector));

    const chosen = val('industry');
    if (chosen && !items.some((i) => !i.hidden && i.dataset.value === chosen)) setVal('industry', '');
  }

    // Fields that exist only for some instrument types (TotalEntities is the first
  // of them; bonds and funds will add their own).
  function typeFields() {
    const type = (val('type') || '').toLowerCase();
    form.querySelectorAll('[data-for-type]').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.forType !== type);
    });
  }

  /* -------------------------------------------------------------- creating */

  // No validation: the admin decides what an instrument needs (decision 70).
  function commit() {
    const data = {
      name: val('name'), type: val('type'), currency: val('currency'),
      sector: val('sector'), industry: val('industry'), country: val('country'),
      pricer: val('pricer'), source: val('source'), bbg: val('bbg'),
      identifiers: IDENTIFIERS.map((k) => val(k)).filter(Boolean),
      // what the identifier filter reads (90), keyed by field rather than
      // flattened, because "which field is empty" is the whole question
      ids: Object.fromEntries(IDENTIFIERS.map((k) => [k, val(k)])),
    };
    addRow(data);
    form.removeAttribute('data-dirty');
    dlg.close();
  }

  function addRow(d) {
    const cols = [...table.tHead.rows[0].cells].map((c) => c.dataset.col);
    const row = tbody.querySelector('tr[data-name]').cloneNode(true);
    const cell = (col) => row.cells[cols.indexOf(col)];
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-GB', { hour12: false });

    row.dataset.name = [d.name, ...d.identifiers].join(' ').toLowerCase();
    row.dataset.type = d.type.toLowerCase().replace(/\s+/g, '-');
    row.dataset.currency = d.currency;
    row.dataset.sector = d.sector;
    row.dataset.country = d.country;
    row.dataset.status = 'Active';
    row.dataset.pricer = d.pricer ? 'Yes' : 'No';
    row.dataset.source = d.source;
    row.dataset.ids = Object.entries(d.ids)
      .filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(';');
    row.removeAttribute('data-inactive');
    // health is the data axis, not the lifecycle one (decision 66). A new
    // instrument has not been updated yet, so it is neither healthy nor failed.
    delete row.dataset.health;

    const flag = FLAGS[d.country]
      ? `<img class="flag" src="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/1x1/${FLAGS[d.country]}.svg" alt="${d.country}" data-tooltip="${d.country}">`
      : '<span class="flag-empty" aria-hidden="true"></span>';

    // Nothing is required any more (decision 70), so an instrument can arrive
    // without a name. It gets the table's own no-value mark, like any empty cell.
    const label = d.name || '<span class="text-muted-foreground">—</span>';
    cell('instrument').innerHTML = `
      <div class="cell max-w-[360px]">
        <span class="flex items-center gap-2 font-medium"><a href="#" class="truncate underline-offset-4 hover:underline">${label}</a>${flag}</span>
        <span class="cell-sub">${d.bbg || '—'}</span>
      </div>`;
    cell('type').textContent = d.type;
    cell('sector').innerHTML = d.sector
      ? `<div class="cell max-w-[220px]"><span class="truncate">${d.sector}</span><span class="cell-sub">${d.industry || '—'}</span></div>`
      : '<div class="cell max-w-[220px]"><span class="text-muted-foreground">—</span><span class="cell-sub">—</span></div>';
    cell('country').textContent = d.country || '—';
    cell('products').innerHTML = '<span class="text-muted-foreground">0</span>';
    cell('pricer').innerHTML = d.pricer
      ? '<span class="check-static" data-on></span><span class="sr-only">In pricer</span>'
      : '<span class="check-static"></span><span class="sr-only">Not in pricer</span>';
    cell('currency').textContent = d.currency;
    cell('price').innerHTML = `<div class="cell"><span class="text-muted-foreground">—</span><span class="cell-sub">${d.source}</span></div>`;
    ['close', 'chg-ytd', 'vol90'].forEach((c) => {
      const el = cell(c);
      if (!el) return;
      el.className = 'num muted';
      el.innerHTML = '<span aria-hidden="true">—</span>';
    });
    cell('updated').innerHTML = '<div class="cell"><span class="text-muted-foreground">—</span><span class="cell-sub">Awaiting first update</span></div>';
    cell('status').innerHTML = '<span class="badge badge-success"><span class="badge-dot"></span> Active</span>';
    cell('created').innerHTML = `<div class="cell"><span>${date}</span><span class="cell-sub">${time}</span></div>`;
    cell('modified').innerHTML = `<div class="cell"><span>${date}</span><span class="cell-sub">${time}</span></div>`;
    cell('actions').innerHTML = `<button type="button" class="btn btn-ghost btn-icon btn-sm" popovertarget="row-menu" aria-label="More actions for ${d.name || 'this instrument'}" title="More actions"><i class="ri-more-2-line"></i></button>`;

    row.setAttribute('data-new', '');
    tbody.prepend(row);
    row.scrollIntoView({ block: 'nearest' });

    const count = list.parentElement.querySelector('[data-count]');
    if (count) {
      const total = Number(count.dataset.total || 0) + 1;
      count.dataset.total = total;
      count.textContent = `1–${Math.min(12, total)} of ${total}`;
    }
    if (d.pricer) demo.pricer += 1;
    syncMetrics();
  }

  /* ---------------------------------------------------------------- summary
     The four counts above the list (decision 72).

     Failed updates is the only one computed: it counts the rows whose last
     update failed, so the number and the list you get by clicking it can never
     disagree — which is the whole reason the cell is a control. Total, inactive
     and pricer are demo values; total follows the footer so a created
     instrument moves both. In production all four arrive with the list as one
     aggregate over the whole set, never over the page.
  */
  const metrics = document.querySelector('[data-metrics]');
  const healthFilter = metrics?.querySelector('[data-filter="health"]');
  const failedCard = metrics?.querySelector('[data-metric-failed]');
  const countEl = list.parentElement.querySelector('[data-count]');
  const demo = { inactive: 17, pricer: 156 };

  const metric = (key) => metrics.querySelector(`[data-metric="${key}"]`);

  function syncMetrics() {
    if (!metrics) return;
    const total = Number(countEl?.dataset.total || 0);
    const active = total - demo.inactive;
    const failed = tbody.querySelectorAll('tr[data-health="failed"]').length;

    metric('total').textContent = total;
    metric('active').textContent = active;
    metric('inactive').textContent = `${demo.inactive} inactive`;
    metric('pricer').textContent = demo.pricer;
    metric('pricer-of').textContent = `of ${active} active`;
    metric('failed').textContent = failed;

    // Zero is a state, not an empty cell: the count stays, the red goes, and
    // there is nothing left to filter to, so the cell stops being a button.
    failedCard.toggleAttribute('data-zero', failed === 0);
    failedCard.disabled = failed === 0;
    if (failed === 0 && healthFilter?.value) setHealthFilter(false);

    const on = failedCard.getAttribute('aria-pressed') === 'true';
    metric('failed-note').textContent =
      failed === 0 ? 'none in the last 24h' : on ? 'showing only these' : 'last 24h';
  }

  function setHealthFilter(on) {
    healthFilter.value = on ? 'failed' : '';
    healthFilter.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // The pressed state follows the input, not the click: Clear all in the
  // filters panel (89) clears every filter the query holds, this one included,
  // and a cell that stayed pressed over an unfiltered list would be a lie.
  healthFilter?.addEventListener('change', () => {
    failedCard.setAttribute('aria-pressed', String(Boolean(healthFilter.value)));
    syncMetrics();
  });

  failedCard?.addEventListener('click', () => {
    setHealthFilter(failedCard.getAttribute('aria-pressed') !== 'true');
  });

  /* ----------------------------------------------------------------- export
     Export to Excel (decision 86). One outlined button at the right end of the
     toolbar, because what it exports is decided by the controls on that row:
     every instrument the filters leave — the whole query, not the page on
     screen — and the columns the chooser has on, in their order.

     Three states, and no fourth. Idle; busy while the server builds the file,
     which is the kit's loading button (disabled, aria-busy, spinner, changed
     label); and disabled when the query matches nothing, so the press that
     produces an empty sheet is never available. There is no success message:
     a file arriving is the browser's own event and it is reported in the
     browser's own chrome.

     In production the click is the request and the response is the file; here
     it is a timeout, so the busy state can be seen.
  */
  const exportBtn = document.querySelector('[data-export]');
  const exportIdle = exportBtn?.innerHTML;
  let exporting = false;

  function syncExport(shown) {
    if (!exportBtn || exporting) return;
    const rows = shown ?? tbody.querySelectorAll('tr[data-name]:not([hidden])').length;
    exportBtn.disabled = rows === 0;
  }

  exportBtn?.addEventListener('click', () => {
    if (exporting) return;
    exporting = true;
    exportBtn.disabled = true;
    exportBtn.setAttribute('aria-busy', 'true');
    exportBtn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> Preparing\u2026';

    setTimeout(() => {
      exporting = false;
      exportBtn.innerHTML = exportIdle;
      exportBtn.removeAttribute('aria-busy');
      exportBtn.disabled = false;
      syncExport();
    }, 1400);
  });

  // The filter engine in app.js says how many rows the query left.
  document.addEventListener('list:filtered', (e) => syncExport(e.detail.shown));

  /* ----------------------------------------------------------------- wiring */

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-new-instrument]')) { openCreate(); return; }

    // the instrument name opens the record
    const link = e.target.closest('tbody a');
    if (link && link.closest('.cell')) {
      e.preventDefault();
      openRecord(link.closest('tr'));
      return;
    }

    const rowAct = e.target.closest('#row-menu [data-row-act]');
    if (rowAct) {
      document.getElementById('row-menu').hidePopover();
      if (!lastRow) return;
      if (rowAct.dataset.rowAct === 'view') openRecord(lastRow);
      if (rowAct.dataset.rowAct === 'delete') askDelete(lastRow);
      return;
    }

    // The refused case offers the thing that was almost always wanted instead:
    // the record, open on the form.
    if (e.target.closest('[data-del-edit]')) {
      const row = pendingDelete;
      hideDelete();
      pendingDelete = null;
      if (row) openRecord(row);
      return;
    }

    if (e.target.closest('[data-del-confirm]')) {
      const row = pendingDelete;
      hideDelete();
      pendingDelete = null;
      if (!row) return;
      removeRow(row);
      return;
    }

    if (e.target.closest('[data-rec-confirm]')) {
      const kind = pendingAct;
      pendingAct = null;
      recBox.hidePopover();
      const row = current?.row;
      if (!row) return;
      if (kind === 'deactivate') setStatus(row, false);
      if (kind === 'delete') {
        // The form it was guarding no longer exists, so the guard has nothing
        // left to ask about.
        form.removeAttribute('data-dirty');
        dlg.close();
        removeRow(row);
      }
      return;
    }

    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'create') { commit(); return; }
    if (act === 'delete') { askRecord('delete'); return; }
    if (act === 'save') { form.removeAttribute('data-dirty'); syncSave(); dlg.close(); return; }
    // Refresh data is the button on the performance tab (93); it is drawn and
    // does nothing in the prototype.
    if (act === 'refresh') return;

  });

  /* -------------------------------------------------------------- deleting
     Decision 95. Delete replaces Deactivate in both More menus, and the answer
     depends on one number the list already carries: ProductCount.

       0 products   a destructive confirmation, and the row goes
       1+ products  refused. The confirmation says how many products read this
                    instrument and offers Edit instrument in place of the delete,
                    because an instrument with products on it is almost always
                    wrong rather than unwanted.

     Nothing here is a permission check: in production the server owns the refusal
     and this confirmation only reads the count it was given with the row. The
     count is read off the row rather than fetched, so the number in the question
     is the number the admin can see behind it.
  */

  const delList = document.getElementById('confirm-delete');
  let pendingDelete = null;                 // the row the open confirmation is about

  const products = (v) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;

  function fillDelete(box, d) {
    const q = (k) => box.querySelector(`[data-del="${k}"]`);
    const n = products(d.products);
    const name = d.name || 'this instrument';

    q('title').textContent = n ? `${name} cannot be deleted` : `Delete ${name}?`;
    q('desc').textContent = n
      ? 'An instrument that products are priced from is not deleted.'
      : 'The instrument, its identifiers and its price history go with it. This cannot be undone.';

    q('linked').hidden = !n;
    if (n) q('count').textContent = `${n} ${n === 1 ? 'product reads' : 'products read'} this instrument`;

    // One footer, two answers: the buttons of the case that does not apply are
    // not disabled, they are not there.
    box.querySelectorAll('[data-del-btn]').forEach((b) => {
      b.classList.toggle('hidden', (b.dataset.delBtn === 'linked') !== (n > 0));
    });
  }

  function askDelete(row) {
    pendingDelete = row;
    fillDelete(delList, readRow(row));
    delList.showModal();
    delList.querySelector('.dialog-footer [data-del-btn]:not(.hidden)')?.focus();
  }

  function hideDelete() {
    if (delList?.open) delList.close();
  }

  function removeRow(row) {
    // The demo counts above the list are not recomputed from the rows (only
    // Failed updates is), so a deleted row has to take its own contribution out
    // of them or the summary stops matching the footer.
    if (row.dataset.status === 'Inactive') demo.inactive = Math.max(0, demo.inactive - 1);
    if (row.dataset.pricer === 'Yes') demo.pricer = Math.max(0, demo.pricer - 1);
    row.remove();
    if (countEl) {
      const total = Math.max(0, Number(countEl.dataset.total || 0) - 1);
      countEl.dataset.total = total;
      countEl.textContent = `1\u2013${Math.min(12, total)} of ${total}`;
    }
    syncMetrics();
    syncExport();
  }

  /* ------------------------------------------------- the record's own two acts
     Decision 100. Deactivate and Delete are the two things that act on the whole
     instrument rather than on one of its fields, and both are asked from the
     record itself: the switch beside the status badge, and the button at the left
     end of the footer.

     Neither is part of the form. The switch is outside it, so toggling the status
     never makes Save changes light up, and the act happens when the confirmation
     is answered — Save changes still only writes the fields (91). The switch also
     never moves first: it is put straight back and the question is asked, so it
     can never show a state the record does not have.

     One confirmation element serves both, because both questions have the same
     shape — what it does, how many products feel it, and one answer.
  */
  const activeSwitch = document.getElementById('i-active');
  const recBox = document.getElementById('confirm-record');
  let pendingAct = null;                    // 'deactivate' | 'delete'

  function syncStatus() {
    const inactive = (current?.status || '') === 'Inactive';
    const badge = dlg.querySelector('.dialog-title .badge');
    if (badge) {
      const hidden = badge.classList.contains('hidden') ? ' hidden' : '';
      badge.className = `badge ${inactive ? 'badge-secondary' : 'badge-success'}${hidden}`;
      badge.innerHTML = inactive ? 'Inactive' : '<span class="badge-dot"></span> Active';
    }
    if (activeSwitch) {
      activeSwitch.checked = !inactive;
      activeSwitch.setAttribute('data-tooltip', inactive ? 'Activate' : 'Deactivate');
      activeSwitch.setAttribute('data-tooltip-rows',
        inactive ? 'On=market-data updates resume' : 'Off=market-data updates stop');
    }
  }

  // The list is the record: the row keeps the status, the mute (55) and the
  // deactivation tooltip, and the summary above it keeps its count.
  function setStatus(row, active) {
    const cols = [...table.tHead.rows[0].cells].map((c) => c.dataset.col);
    const cell = row.cells[cols.indexOf('status')];
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-GB', { hour12: false });

    row.dataset.status = active ? 'Active' : 'Inactive';
    row.toggleAttribute('data-inactive', !active);
    if (cell) {
      cell.innerHTML = active
        ? '<span class="badge badge-success"><span class="badge-dot"></span> Active</span>'
        : `<span class="badge badge-secondary" tabindex="0" data-tooltip="Deactivated" data-tooltip-rows="Date=${date};Time=${time};By=a.larchenko@vizibility.ch">Inactive</span>`;
    }

    demo.inactive = Math.max(0, demo.inactive + (active ? -1 : 1));
    if (current?.row === row) { current.status = row.dataset.status; syncStatus(); }
    syncMetrics();
  }

  function askRecord(kind) {
    if (!current?.row) return;
    pendingAct = kind;

    const q = (k) => recBox.querySelector(`[data-rec="${k}"]`);
    const n = products(current.products);
    const name = current.name || 'this instrument';
    // Deleting is refused while products read the instrument (95); deactivating
    // is not — it freezes their source, it does not take it away.
    const refused = kind === 'delete' && n > 0;

    if (kind === 'delete') {
      q('title').textContent = refused ? `${name} cannot be deleted` : `Delete ${name}?`;
      q('desc').textContent = refused
        ? 'An instrument that products are priced from is not deleted.'
        : 'The instrument, its identifiers and its price history go with it. This cannot be undone.';
      q('consequence').textContent = 'Their prices, performance and history are read from it, so deleting it '
        + 'would leave them without a source. Correct the instrument instead, or move those products to another one first.';
    } else {
      q('title').textContent = `Deactivate ${name}?`;
      q('desc').textContent = 'Market-data updates stop. The record stays readable and the last price stays where it is.';
      q('consequence').textContent = 'They keep the price it has now, and nothing recalculates until it is switched back on.';
    }

    q('linked').hidden = !n;
    if (n) q('count').textContent = `${n} ${n === 1 ? 'product reads' : 'products read'} this instrument`;
    recBox.querySelector('[data-rec-confirm]').textContent = kind === 'delete' ? 'Delete instrument' : 'Deactivate';
    recBox.querySelectorAll('[data-rec-btn]').forEach((b) => {
      b.classList.toggle('hidden', (b.dataset.recBtn === 'refused') !== refused);
    });

    recBox.showPopover();
    recBox.querySelector('.dialog-footer [data-rec-btn]:not(.hidden)')?.focus();
  }

  // Switching on is its own answer: it restores what deactivating stopped, and
  // nothing is lost by it. Switching off is asked.
  activeSwitch?.addEventListener('change', () => {
    if (!current?.row) return;
    if (activeSwitch.checked) { setStatus(current.row, true); return; }
    activeSwitch.checked = true;
    askRecord('deactivate');
  });

  // Which row opened the shared row menu.
  let lastRow = null;
  document.addEventListener('click', (e) => {
    const t = e.target.closest('tbody [popovertarget="row-menu"]');
    if (t) lastRow = t.closest('tr');
  }, true);

  // The header is the record's identity, so it follows the fields that make it
  // up: with one modal there is no moment when the title and the form can be
  // showing two different names.
  const syncHeading = () => {
    if (dlg.dataset.mode !== 'record') return;
    setV('title', val('name') || 'Untitled instrument');
    setV('subtitle', [val('type'), val('bbg')].filter(Boolean).join(' · '));
  };

  const onEdit = (e) => {
    if (!form.contains(e.target)) return;
    if (e.target.name === 'type') typeFields();
    if (e.target.name === 'sector') industryFields();
    syncHeading();
    syncSave();
  };
  // On document, not on the form: app.js sets data-dirty from its own document
  // listener and registers first, so by the time this runs the flag is already
  // there and Save can read it.
  document.addEventListener('input', onEdit);
  document.addEventListener('change', onEdit);

  dlg.addEventListener('close', () => { resetForm(); syncSave(); });

  syncMetrics();
  syncExport();
  industryFields();
  setMode('create');
})();
