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
      createdby: 'a.keller@vizibility.ch', createdon: '23 Sep 2025, 07:57:03',
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
      createdby: 'a.keller@vizibility.ch', createdon: '14 Mar 2025, 11:02:44',
      modifiedby: 'system@capital-viz.com', modifiedon: '18 Sep 2026, 10:12:03',
    },
  };

  /* --------------------------------------------------------------- helpers */

  // The demo's clock. The list's Last update and Timestamp cells are relative
  // (117) — 5m ago, 3h ago, 2d ago — and relative to *this* moment, five
  // minutes after the last scheduled update, so the data reads the same on any
  // day the prototype is opened. Production uses the real clock and re-renders
  // the cells on a timer.
  const NOW = new Date('2026-09-18T10:17:05');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  const absText = (iso) => {
    const t = new Date(iso);
    return `${pad(t.getDate())} ${MONTHS[t.getMonth()]} ${t.getFullYear()}, ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
  };
  const relText = (iso) => {
    const s = Math.max(0, Math.round((NOW - new Date(iso)) / 1000));
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };
  // A <time data-age datetime> in the list shows the relative text (117); a
  // <time datetime> without data-age shows the date alone (123). Either way
  // the absolute date and time are its tooltip, two rows (Date, Time).
  const renderTimes = (root = tbody) => {
    root.querySelectorAll('time[data-age][datetime]').forEach((t) => { t.textContent = relText(t.dateTime); });
  };
  const timeParts = (iso) => {
    const [date, time] = absText(iso).split(', ');
    return { date, time };
  };
  // Created and Modified: the date, with the full stamp in the tooltip.
  const dateCell = (iso) => {
    const { date, time } = timeParts(iso);
    return `<time datetime="${iso}" tabindex="0" data-tooltip-rows="Date=${date};Time=${time}">${date}</time>`;
  };
  const isoNow = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

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
      name: text('instrument', 'a'),
      bbg: text('bbg'),
      type: text('type'),
      sector: text('sector'),
      industry: text('industry'),
      country: text('country'),
      products: text('products'),
      pricer: !!cell('pricer')?.querySelector('[data-on]'),
      currency: text('currency'),
      source: text('source'),
      updated: cell('updated')?.querySelector('time')?.dateTime ? absText(cell('updated').querySelector('time').dateTime) : '',
      datadate: cell('timestamp')?.querySelector('time')?.dateTime ? absText(cell('timestamp').querySelector('time').dateTime) : '',
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

    // Nothing is required any more (decision 70), so an instrument can arrive
    // without a name. It gets the table's own no-value mark, like any empty cell.
    const label = d.name || '<span class="text-muted-foreground">—</span>';
    const dash = '<span aria-hidden="true">—</span>';
    const plain = (col, value, extra = '') => {
      const el = cell(col);
      el.className = value ? extra : `${extra} muted`.trim();
      el.innerHTML = value ? `<span class="block max-w-[220px] truncate">${value}</span>` : dash;
    };
    cell('instrument').innerHTML = `<span class="block max-w-[360px] font-medium"><a href="#" data-record class="block truncate underline-offset-4 hover:underline">${label}</a></span>`;
    plain('bbg', d.bbg);
    cell('type').className = '';
    cell('type').textContent = d.type;
    plain('sector', d.sector);
    plain('industry', d.industry);
    plain('country', d.country);
    cell('products').innerHTML = '<span class="text-muted-foreground">0</span>';
    cell('pricer').innerHTML = d.pricer
      ? '<span class="check-static" data-on></span><span class="sr-only">In pricer</span>'
      : '<span class="check-static"></span><span class="sr-only">Not in pricer</span>';
    cell('currency').textContent = d.currency;
    cell('price').className = 'num muted';
    cell('price').innerHTML = dash;
    cell('source').textContent = d.source || '—';
    cell('timestamp').className = 'muted';
    cell('timestamp').innerHTML = dash;
    ['close', 'chg-ytd', 'vol90'].forEach((c) => {
      const el = cell(c);
      if (!el) return;
      el.className = 'num muted';
      el.innerHTML = '<span aria-hidden="true">—</span>';
    });
    cell('updated').innerHTML = updatedCell(d.name, false, '<span class="text-muted-foreground" tabindex="0" data-tooltip="Awaiting first update">—</span>');
    cell('status').innerHTML = '<span class="badge badge-success"><i class="ri-check-line"></i> Active</span>';
    cell('created').innerHTML = dateCell(isoNow(now));
    cell('modified').innerHTML = dateCell(isoNow(now));
    cell('actions').innerHTML = rowActions(d.name);

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
    const link = e.target.closest('tbody a[data-record]');
    if (link) {
      e.preventDefault();
      openRecord(link.closest('tr'));
      return;
    }

    // Row actions are icons in the row (109); the row is the button's own.
    const rowAct = e.target.closest('tbody [data-row-act]');
    if (rowAct) {
      const row = rowAct.closest('tr');
      if (rowAct.dataset.rowAct === 'view') openRecord(row);
      if (rowAct.dataset.rowAct === 'edit') startEdit(row);
      if (rowAct.dataset.rowAct === 'refresh') refreshRow(rowAct);
      if (rowAct.dataset.rowAct === 'delete') askDelete(row);
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
     Decision 95. Delete replaces Deactivate among the row actions, and the answer
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
      badge.innerHTML = inactive ? '<i class="ri-close-line"></i> Inactive' : '<i class="ri-check-line"></i> Active';
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
    const refresh = row.querySelector('[data-row-act="refresh"]');
    if (refresh) refresh.disabled = !active;
    if (cell) {
      cell.innerHTML = active
        ? '<span class="badge badge-success"><i class="ri-check-line"></i> Active</span>'
        : `<span class="badge badge-secondary" tabindex="0" data-tooltip="Deactivated" data-tooltip-rows="Date=${date};Time=${time};By=a.keller@vizibility.ch"><i class="ri-close-line"></i> Inactive</span>`;
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

  // The row actions (109, 120). The tooltip is one verb (116); the aria-label
  // names the instrument. Refresh lives in the Last update cell (120), shown on
  // hover, and is disabled on an inactive row: its updates are stopped (100),
  // so there is nothing to refresh.
  const actionBtn = (act, label, tip, icon, extra = '') =>
    `<button type="button" class="btn btn-ghost btn-icon btn-sm${act === 'refresh' ? ' cell-action' : ''}" data-row-act="${act}" aria-label="${label}" data-tooltip="${tip}"${extra}><i class="${icon}"></i></button>`;
  function rowActions(name) {
    const who = name || 'this instrument';
    return `<div class="row-actions">${
      actionBtn('view', `View ${who}`, 'View', 'ri-file-list-line')}${
      actionBtn('edit', `Edit ${who} in list`, 'Edit', 'ri-pencil-line')}${
      actionBtn('delete', `Delete ${who}`, 'Delete', 'ri-delete-bin-line')}</div>`;
  }
  // The Last update cell: the value — the age, the Failed marker (66), or a
  // dash with *Awaiting first update* in its tooltip — then the refresh action.
  function updatedCell(name, inactive, value) {
    const who = name || 'this instrument';
    return `<span class="inline-flex items-center gap-1">${value}${
      actionBtn('refresh', `Refresh data for ${who}`, 'Refresh', 'ri-refresh-line', inactive ? ' disabled' : '')}</span>`;
  }

  // Prototype only: the icon spins for a moment. The real call is the manual
  // override of the update rule (83), and its result lands in Updated (66).
  function refreshRow(btn) {
    if (btn.disabled) return;
    const icon = btn.querySelector('i');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    icon.className = 'ri-loader-4-line animate-spin';
    setTimeout(() => {
      icon.className = 'ri-refresh-line';
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
    }, 1200);
  }

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

  renderTimes();
  syncMetrics();
  syncExport();
  industryFields();
  setMode('create');

  /* ------------------------------------------------------ row edit mode
     Proposal in answer to the product manager's request to edit Name, Code,
     Type, Currency, Last price and Source from the list. Modelled on
     PatternFly's row editing rather than cell-by-cell editing, because four of
     the six fields are coupled or system-owned:

       Code + Source     the fetch is keyed on the pair (62), so they change together
       Last price        written by the source at each update (83): a hand-typed
                         price only makes sense where the source delivers by hand
                         (Email, Excel, Web scraping), so the price field is
                         read-only for SIX, Yahoo and Bloomberg
       Last price        shown at two decimals (53) but stored in full (33), so
                         the field opens on the stored value, never the display

     One row at a time. Enter saves, Escape cancels. Every column holds one
     value (108), so every editable cell becomes exactly one control, sized to
     its column, and the row keeps its height. Saving a value in a sorted column
     unsorts that column (Cloudscape), so the row does not jump away from under
     the cursor. */

  const ROW_EDIT_COLS = ['instrument', 'bbg', 'status', 'pricer', 'currency', 'price', 'source', 'type', 'sector', 'industry', 'country', 'actions'];
  const HAND_SOURCES = ['Email', 'Excel', 'Web scraping'];
  let editing = null;   // { row, original: {col: html}, values: {...} }

  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  // A small select with the same options as the record form's control for the
  // same field, so the list and the record can never disagree on the vocabulary.
  // `keep` filters the options (the industry groups of one sector, 96);
  // `disabled` is the industry select with no sector to hang off.
  function rowSelect(name, value, label, width, { keep, disabled } = {}) {
    const src = form.querySelector(`[name="${name}"]`)?.closest('.select');
    const items = [...(src?.querySelectorAll('.select-item') || [])]
      .filter((i) => !keep || keep(i))
      .map((i) => `<div class="select-item" role="option" data-value="${esc(i.dataset.value)}"${i.dataset.sector ? ` data-sector="${esc(i.dataset.sector)}"` : ''} tabindex="-1" aria-selected="${i.dataset.value === value}">${i.textContent.trim()}</div>`)
      .join('');
    return `<div class="select select-sm ${width}">
      <button type="button" class="select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label)}"${value ? '' : ' data-placeholder'}${disabled ? ' disabled' : ''}><span>${esc(value || '—')}</span><i class="ri-arrow-down-s-line"></i></button>
      <div class="select-content" role="listbox" hidden>${items}</div>
      <input type="hidden" name="${name}" value="${esc(value)}">
    </div>`;
  }
  // The industry select of a row follows its sector (96): a new sector empties
  // it and offers that sector's groups only.
  function rowIndustry(sector, value) {
    return rowSelect('industry', value, 'Industry group', '', { keep: (i) => i.dataset.sector === sector, disabled: !sector });
  }

  function rowCells(row) {
    const cols = [...table.tHead.rows[0].cells].map((c) => c.dataset.col);
    return (col) => row.cells[cols.indexOf(col)];
  }

  // Full precision for the field: the stored value when the demo has it, else
  // the display value with the thousands mark taken out.
  function storedPrice(row, d) {
    const raw = row.dataset.price || DETAILS[d.bbg]?.price || d.price || '';
    return String(raw).replace(/'/g, '');
  }

  function syncPriceField(row) {
    const price = row.querySelector('[name="price"]');
    const source = row.querySelector('[name="source"]')?.value;
    if (!price) return;
    const byHand = HAND_SOURCES.includes(source);
    price.readOnly = !byHand;
    price.tabIndex = byHand ? 0 : -1;
    const wrap = price.closest('[data-price-wrap]');
    if (byHand) wrap.removeAttribute('data-tooltip');
    else wrap.setAttribute('data-tooltip', `Written by ${source} at each update`);
  }

  function startEdit(row) {
    if (editing?.row === row) return;
    if (editing) {
      if (editing.row.hasAttribute('data-dirty')) { editing.row.querySelector('.input')?.focus(); return; }
      cancelEdit();
    }
    const d = readRow(row);
    const cell = rowCells(row);
    d.price = cell('price')?.textContent.trim() || '';
    if (d.price === '—') d.price = '';
    const original = Object.fromEntries(ROW_EDIT_COLS.map((c) => [c, { html: cell(c).innerHTML, cls: cell(c).className }]));
    editing = { row, original, values: { ...d, price: storedPrice(row, d), active: d.status === 'Active' ? 'on' : '', pricer: d.pricer ? 'on' : '' } };

    // Freeze the column widths first, so a row entering edit does not re-flow
    // the table: each control then fills the column it replaces.
    [...table.tHead.rows[0].cells].forEach((th) => { th.style.width = `${th.getBoundingClientRect().width}px`; });

    cell('instrument').innerHTML = `<span class="block max-w-[360px]"><input class="input input-sm font-medium" name="name" value="${esc(d.name)}" aria-label="Instrument name" placeholder="Instrument name"></span>`;
    cell('bbg').className = '';
    cell('bbg').innerHTML = `<input class="input input-sm font-mono" name="bbg" value="${esc(d.bbg)}" aria-label="Bloomberg code" placeholder="Bloomberg code">`;
    // Status is a checkbox (119): ticked is Active, the badge's check mark;
    // clear is Inactive, the badge's cross. Pricer is the real checkbox behind
    // the static one (49). Both are one control per cell.
    cell('status').innerHTML = `<label class="inline-flex items-center gap-2 whitespace-nowrap"><input class="checkbox" type="checkbox" name="active" aria-label="Active"${d.status === 'Active' ? ' checked' : ''}><span data-status-word>${d.status === 'Active' ? 'Active' : 'Inactive'}</span></label>`;
    cell('pricer').innerHTML = `<input class="checkbox" type="checkbox" name="pricer" aria-label="In pricer"${d.pricer ? ' checked' : ''}>`;
    cell('type').className = '';
    cell('type').innerHTML = rowSelect('type', d.type, 'Instrument type', '');
    // The taxonomy trio, off by default (115) but editable whenever shown (124).
    cell('sector').className = '';
    cell('sector').innerHTML = rowSelect('sector', d.sector, 'Financial sector', '');
    cell('industry').className = '';
    cell('industry').innerHTML = rowIndustry(d.sector, d.industry);
    cell('country').className = '';
    cell('country').innerHTML = rowSelect('country', d.country, 'Country', '');
    cell('currency').innerHTML = rowSelect('currency', d.currency, 'Currency', '');
    cell('price').className = 'num';
    cell('price').innerHTML = `<span class="block" data-price-wrap><input class="input input-sm tabular-nums" name="price" value="${esc(editing.values.price)}" inputmode="decimal" aria-label="Last price" placeholder="Last price"></span>`;
    cell('source').innerHTML = rowSelect('source', d.source, 'Source', '');
    cell('actions').innerHTML = `
      <div class="flex items-center justify-end gap-1">
        <button type="button" class="btn btn-default btn-icon btn-sm" data-row-edit="save" aria-label="Save changes to ${esc(d.name)}" data-tooltip="Save"><i class="ri-check-line"></i></button>
        <button type="button" class="btn btn-ghost btn-icon btn-sm" data-row-edit="cancel" aria-label="Cancel editing ${esc(d.name)}" data-tooltip="Cancel"><i class="ri-close-line"></i></button>
      </div>`;
    row.setAttribute('data-editing', '');
    syncPriceField(row);
    row.querySelector('[name="name"]')?.focus();
  }

  function rowValues(row) {
    const v = {};
    row.querySelectorAll('[name]').forEach((el) => {
      v[el.name] = el.type === 'checkbox' ? (el.checked ? 'on' : '') : el.value.trim();
    });
    return v;
  }

  function syncRowDirty() {
    if (!editing) return;
    const now = rowValues(editing.row);
    const was = editing.values;
    const dirty = ['name', 'bbg', 'type', 'currency', 'price', 'source', 'active', 'pricer', 'sector', 'industry', 'country']
      .some((k) => (now[k] || '') !== (was[k] || ''));
    editing.row.toggleAttribute('data-dirty', dirty);
  }

  function restoreRow() {
    const cell = rowCells(editing.row);
    for (const c of ROW_EDIT_COLS) {
      cell(c).innerHTML = editing.original[c].html;
      cell(c).className = editing.original[c].cls;
    }
    editing.row.removeAttribute('data-editing');
    editing.row.removeAttribute('data-dirty');
    [...table.tHead.rows[0].cells].forEach((th) => { th.style.width = ''; });
  }

  function cancelEdit() {
    if (!editing) return;
    const row = editing.row;
    restoreRow();
    editing = null;
    row.querySelector('[data-row-act="edit"]')?.focus();
  }

  // A sorted column whose value just changed is unsorted rather than re-sorted:
  // the row stays where the eye left it.
  function unsort(col) {
    const btn = table.tHead.querySelector(`th[data-col="${col}"] .table-sort`);
    if (!btn || btn.getAttribute('aria-sort') === 'none') return;
    btn.setAttribute('aria-sort', 'none');
    const i = btn.querySelector('i');
    if (i) i.className = 'ri-expand-up-down-line';
  }

  function saveEdit() {
    if (!editing) return;
    const row = editing.row;
    const v = rowValues(row);
    const was = editing.values;
    restoreRow();
    editing = null;
    const cell = rowCells(row);
    const dash = '<span aria-hidden="true">—</span>';
    // `wrap` is the 220px truncating span the long taxonomy values sit in
    const plain = (col, value, wrap = false) => {
      const el = cell(col);
      el.className = value ? '' : 'muted';
      el.innerHTML = !value ? dash : wrap ? `<span class="block max-w-[220px] truncate">${esc(value)}</span>` : esc(value);
    };

    const nameEl = cell('instrument').querySelector('a');
    if (nameEl) nameEl.textContent = v.name || '—';
    plain('bbg', v.bbg);
    cell('type').textContent = v.type;
    plain('sector', v.sector, true);
    plain('industry', v.industry, true);
    plain('country', v.country);
    row.dataset.sector = v.sector;
    row.dataset.country = v.country;
    cell('currency').textContent = v.currency;
    // the price carries its source in a tooltip (115): a new price rewrites
    // the cell, an unchanged one keeps its display and only refreshes the tooltip
    if (v.price !== was.price) {
      cell('price').className = v.price ? 'num' : 'num muted';
      cell('price').innerHTML = v.price
        ? `<span tabindex="0" data-tooltip-rows="Source=${esc(v.source)}">${price2(v.price)}</span>`
        : dash;
    } else {
      cell('price').querySelector('[data-tooltip-rows]')?.setAttribute('data-tooltip-rows', `Source=${esc(v.source)}`);
    }
    // the refresh action sits in Last update (120) and names the instrument
    row.querySelector('[data-row-act="refresh"]')?.setAttribute('aria-label', `Refresh data for ${v.name || 'this instrument'}`);
    plain('source', v.source);
    cell('pricer').innerHTML = v.pricer
      ? '<span class="check-static" data-on></span><span class="sr-only">In pricer</span>'
      : '<span class="check-static"></span><span class="sr-only">Not in pricer</span>';
    row.dataset.pricer = v.pricer ? 'Yes' : 'No';
    if (v.pricer !== was.pricer) { demo.pricer = Math.max(0, demo.pricer + (v.pricer ? 1 : -1)); syncMetrics(); }
    // Save is the confirmation here: the record's *Deactivate?* question (100)
    // is not asked a second time on top of it.
    if (v.active !== was.active) setStatus(row, !!v.active);
    cell('actions').innerHTML = rowActions(v.name);

    // what the filters, the search and the record read
    const ids = Object.fromEntries((row.dataset.ids || '').split(';').filter(Boolean).map((p) => p.split('=')));
    if (v.bbg) ids.bbg = v.bbg; else delete ids.bbg;
    row.dataset.ids = Object.entries(ids).map(([k, val]) => `${k}=${val}`).join(';');
    row.dataset.name = [v.name, ...Object.values(ids)].join(' ').toLowerCase();
    row.dataset.type = v.type.toLowerCase().replace(/\s+/g, '-');
    row.dataset.currency = v.currency;
    row.dataset.source = v.source;
    row.dataset.price = v.price;
    if (DETAILS[was.bbg] && v.bbg !== was.bbg) { DETAILS[v.bbg] = DETAILS[was.bbg]; delete DETAILS[was.bbg]; }
    if (DETAILS[v.bbg]) { DETAILS[v.bbg].price = v.price; DETAILS[v.bbg].source = v.source; }

    cell('modified').innerHTML = dateCell(isoNow());

    if (v.name !== was.name) unsort('instrument');
    if (v.price !== was.price) unsort('price');
    row.querySelector('[data-row-act="edit"]')?.focus();
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('tr[data-editing] [data-row-edit]');
    if (!b) return;
    if (b.dataset.rowEdit === 'save') saveEdit(); else cancelEdit();
  });
  // A double-click anywhere on a row is the quick way in (121): the same as
  // its Edit icon. Not on a control — a link, a button, a field — whose own
  // click must win, and not on the empty-state row.
  tbody.addEventListener('dblclick', (e) => {
    const row = e.target.closest('tr[data-name]');
    if (!row || row.hasAttribute('data-editing')) return;
    if (e.target.closest('a, button, input, label, .select')) return;
    e.preventDefault();
    getSelection()?.removeAllRanges();
    startEdit(row);
  });
  document.addEventListener('input', (e) => { if (e.target.closest('tr[data-editing]')) syncRowDirty(); });
  document.addEventListener('change', (e) => {
    const row = e.target.closest('tr[data-editing]');
    if (!row) return;
    if (e.target.name === 'source') syncPriceField(row);
    if (e.target.name === 'sector') {
      const cell = rowCells(row)('industry');
      if (cell) cell.innerHTML = rowIndustry(e.target.value, '');
    }
    if (e.target.name === 'active') { const w = row.querySelector('[data-status-word]'); if (w) w.textContent = e.target.checked ? 'Active' : 'Inactive'; }
    syncRowDirty();
  });
  document.addEventListener('keydown', (e) => {
    const row = e.target.closest('tr[data-editing]');
    if (!row) return;
    if (e.target.closest('.select-content')) return;     // the listbox owns its keys
    if (e.key === 'Enter' && e.target.matches('.input')) { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelEdit(); }
  }, true);

  /* ------------------------------------------------- the kit's state links
     Documentation scaffolding and nothing else. `pages/instrument-record.html`
     loads this screen as ?state=<id> to show one state of the record modal, so
     that the kit never keeps a copy of the modal that could drift from it.
     Product code never reads this; with no query string the block does nothing.

     Two states are FORCED, and the page says so rather than pretending: no row
     in the demo data has zero products, so the destructive branch of the delete
     confirmation (95) cannot be reached by clicking. Those two set the count to
     0 on the way in. Everything else is the real path, opened by the real
     functions — `discard` even goes through the Close button, so app.js sets
     its own `pending` and the confirmation's answers work.
  */
  const rowAt = (i) => table.tBodies[0].rows[i];

  const STATES = {
    'create':             () => openCreate(),
    'record':             () => openRecord(rowAt(0)),
    'record-dirty':       () => { openRecord(rowAt(0)); form.setAttribute('data-dirty', ''); syncSave(); },
    'record-performance': () => { openRecord(rowAt(0)); dlg.querySelector('[data-tab-btn="performance"]')?.click(); },
    'record-inactive':    () => openRecord([...table.tBodies[0].rows].find((r) => r.hasAttribute('data-inactive')) || rowAt(0)),
    'discard':            () => {
      openRecord(rowAt(0));
      form.setAttribute('data-dirty', '');
      syncSave();
      dlg.querySelector('[data-only="record"][data-dialog-close]')?.click();
    },
    'deactivate':         () => { openRecord(rowAt(0)); askRecord('deactivate'); },
    'delete-refused':     () => { openRecord(rowAt(0)); askRecord('delete'); },
    'delete':             () => { openRecord(rowAt(0)); current.products = 0; askRecord('delete'); },
    'list-delete-refused': () => askDelete(rowAt(0)),
    'list-delete':        () => {
      const row = rowAt(0);
      pendingDelete = row;
      fillDelete(delList, { ...readRow(row), products: '0' });
      delList.showModal();
    },
  };

  // On DOMContentLoaded, not now: the dialog's tabs are wired by
  // instruments-performance.js, which is the next <script> on the page, so a
  // click dispatched from here would land before its listener exists.
  const wanted = new URLSearchParams(location.search).get('state');
  if (wanted && STATES[wanted]) {
    const open = () => { document.documentElement.dataset.state = wanted; STATES[wanted](); };
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', open, { once: true });
    else open();
  }

})();