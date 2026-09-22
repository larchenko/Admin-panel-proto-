// instruments-performance.js — the record dialog's tab strip and the
// Instrument performance panel behind the second tab.
//
// Kept out of instruments.js on purpose, and it touches none of that file's
// internals: it reads the record off the DOM through the same data-v hooks
// fillValues writes, and it follows the dialog's data-mode attribute instead of
// being called by it. Deleting this file leaves a working dialog with one
// panel.
//
// The series is demo data. It is built so that the chart cannot disagree with
// the numbers printed beside it: the walk ends exactly on the record's last
// close, and every percent change the record states lands on its own session,
// so reading +4.117% off the chart at one month back gives the number in the
// row above it. In production this is a second endpoint on the instrument
// (daily OHLC) and the drawing is a chart library; what has to survive the move
// is the wiring in docs/instruments.md, not this code.

(() => {
  const dlg = document.getElementById('instrument');
  const strip = dlg?.querySelector('[role="tablist"]');
  const plot = dlg?.querySelector('[data-chart-plot]');
  if (!dlg || !strip || !plot) return;

  const svg = plot.querySelector('[data-chart-svg]');
  const empty = dlg.querySelector('[data-chart-empty]');
  const unit = dlg.querySelector('[data-chart-unit]');
  const readout = dlg.querySelector('[data-session]');
  const controls = dlg.querySelector('[data-chart-controls]');
  const tabs = [...strip.querySelectorAll('[data-tab-btn]')];
  const panels = [...dlg.querySelectorAll('[data-panel][data-tab]')];

  /* --------------------------------------------------------------- helpers */

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const r4 = (v) => Number(v.toFixed(4));

  const V = (key) => (dlg.querySelector(`[data-v="${key}"]`)?.textContent || '').trim();
  const setV = (key, text) => {
    const el = dlg.querySelector(`[data-v="${key}"]`);
    if (el) el.textContent = text;
  };
  const num = (v) => {
    const n = parseFloat(String(v).replace(/[^\d.-]/g, ''));
    return isFinite(n) ? n : NaN;
  };

  // Thousands separated by ' and every decimal kept: grouping is not rounding
  // (decision 33 — the two-decimal rule is the list's Last price column only).
  const group = (n) => {
    const [i, d] = String(n).split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, "'") + (d ? `.${d}` : '');
  };

  const parseDate = (s) => {
    const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(s || '');
    const mi = m ? MONTHS.indexOf(m[2]) : -1;
    return mi < 0 ? null : new Date(Date.UTC(+m[3], mi, +m[1]));
  };
  const fmtDate = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  // Deterministic per instrument: the same code always draws the same history,
  // so a screenshot of this panel can be compared with the next one.
  const seedOf = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const rng = (seed) => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

  /* ------------------------------------------------------------ the record
     Everything the panel needs is already on screen — the view mode wrote it.
     Reading it back through data-v is the same contract the rest of the dialog
     uses, and it keeps this file independent of how the record was fetched. */

  function record() {
    const form = document.getElementById('instrument-form');
    return {
      key: V('subtitle') || V('title'),
      // currency is a field, not a printed value: read it where it is kept
      currency: form?.querySelector('[name="currency"]')?.value || '',
      price: num(V('price')),
      close: num(V('close')),
      vol90: num(V('vol90')),
      datadate: V('datadate'),
      updated: V('updated'),
      chg5d: num(V('chg5d')), chg1m: num(V('chg1m')), chg3m: num(V('chg3m')),
      chg6m: num(V('chg6m')), chg1y: num(V('chg1y')), chgytd: num(V('chgytd')),
    };
  }

  /* ------------------------------------------------------------ the series */

  const SESSIONS = 756;                       // three years of weekdays

  function sessionsBackToJanuary(dates) {
    const year = dates[dates.length - 1].getUTCFullYear();
    let i = dates.length - 1;
    while (i > 0 && dates[i - 1].getUTCFullYear() === year) i--;
    return dates.length - 1 - i;
  }

  function build(rec) {
    const close = isFinite(rec.close) ? rec.close : rec.price;
    if (!isFinite(close) || close <= 0) return [];

    const end = parseDate(rec.datadate) || parseDate(rec.updated) || new Date();
    const dates = [];
    const d = new Date(end.getTime());
    while (dates.length < SESSIONS) {
      const wd = d.getUTCDay();
      if (wd !== 0 && wd !== 6) dates.unshift(new Date(d.getTime()));
      d.setUTCDate(d.getUTCDate() - 1);
    }

    const rand = rng(seedOf(rec.key || 'instrument'));
    const sd = ((isFinite(rec.vol90) ? rec.vol90 : 22) / 100) / Math.sqrt(252);

    // a random walk in log space, shifted so it ends on the record's last close
    const walk = new Array(SESSIONS);
    let acc = 0;
    for (let i = 0; i < SESSIONS; i++) { acc += normal(rand) * sd; walk[i] = acc; }
    const tail = walk[SESSIONS - 1];
    for (let i = 0; i < SESSIONS; i++) walk[i] -= tail;

    // Anchors: the session each stated percent change belongs to. The walk is
    // corrected towards them, so the shape stays a walk and the numbers agree.
    const back = new Map([[SESSIONS - 1, 0]]);
    const periods = [['chg5d', 5], ['chg1m', 21], ['chg3m', 63], ['chg6m', 126],
                     ['chgytd', sessionsBackToJanuary(dates)], ['chg1y', 252]];
    periods.forEach(([key, b]) => {
      const idx = SESSIONS - 1 - b;
      if (!isFinite(rec[key]) || b <= 0 || idx < 0 || back.has(idx)) return;
      back.set(idx, Math.log(close / (1 + rec[key] / 100) / close) - walk[idx]);
    });

    const anchors = [...back.entries()].sort((a, b) => a[0] - b[0]);
    const corr = new Array(SESSIONS);
    for (let i = 0, a = 0; i < SESSIONS; i++) {
      while (a < anchors.length - 1 && anchors[a + 1][0] <= i) a++;
      const [i0, v0] = anchors[a];
      const next = anchors[a + 1];
      if (i <= i0 || !next) corr[i] = v0;
      else {
        const [i1, v1] = next;
        corr[i] = v0 + ((v1 - v0) * (i - i0)) / (i1 - i0);
      }
    }

    // The daily open, high and low around each close. In production these three
    // arrive with the session and are the record's LastOpen / High / Low.
    const out = [];
    let prev = null;
    for (let i = 0; i < SESSIONS; i++) {
      const c = close * Math.exp(walk[i] + corr[i]);
      const o = (prev === null ? c : prev) * (1 + normal(rand) * sd * 0.3);
      const hi = Math.max(o, c) * (1 + Math.abs(normal(rand)) * sd * 0.6);
      const lo = Math.min(o, c) * (1 - Math.abs(normal(rand)) * sd * 0.6);
      out.push({ d: dates[i], o: r4(o), h: r4(hi), l: r4(lo), c: r4(c) });
      prev = c;
    }
    return out;
  }

  /* ------------------------------------------------------------- the chart */

  const W = 720, H = 240, X0 = 52, X1 = 712, Y0 = 10, Y1 = 204, LABEL_Y = 226;

  const state = { tab: 'details', period: '252', i: 0, lo: 0, hi: 1 };
  let rec = null, all = [], win = [], cursor = null, dot = null;

  const xAt = (i) => (win.length < 2 ? X0 : X0 + (i / (win.length - 1)) * (X1 - X0));
  const yAt = (v) => Y1 - ((v - state.lo) / (state.hi - state.lo || 1)) * (Y1 - Y0);

  function ticks(lo, hi) {
    const raw = (hi - lo) / 4 || Math.abs(hi) / 4 || 1;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) || 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step / 1e6; v += step) out.push(v);
    const dec = clamp(Math.ceil(-Math.log10(step)), 0, 4);
    return out.map((v) => ({ v, label: group(Number(v.toFixed(dec))) }));
  }

  function windowFor(period) {
    if (period === 'max') return all;
    const n = period === 'ytd' ? sessionsBackToJanuary(all.map((s) => s.d)) + 1 : +period;
    return all.slice(Math.max(0, all.length - Math.max(2, n)));
  }

  function draw() {
    const next = record();
    if (!rec || rec.key !== next.key || rec.close !== next.close) {
      rec = next;
      all = build(rec);
      state.period = '252';
      dlg.querySelectorAll('[data-period]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.period === state.period)));
    }

    const has = all.length > 1;
    plot.classList.toggle('hidden', !has);
    readout.classList.toggle('hidden', !has);
    controls?.classList.toggle('hidden', !has);
    empty.classList.toggle('hidden', has);
    if (unit) unit.textContent = rec.currency ? `, ${rec.currency}` : '';
    if (!has) return;

    win = windowFor(state.period);
    state.i = win.length - 1;

    const closes = win.map((s) => s.c);
    let lo = Math.min(...closes), hi = Math.max(...closes);
    const pad = (hi - lo) * 0.08 || hi * 0.02 || 1;
    state.lo = lo - pad;
    state.hi = hi + pad;

    const grid = ticks(state.lo, state.hi).map(({ v, label }) => {
      const y = yAt(v).toFixed(1);
      return `<line class="chart-grid" x1="${X0}" x2="${X1}" y1="${y}" y2="${y}"></line>`
           + `<text class="chart-axis chart-axis-y" x="${X0 - 8}" y="${y}" dy="3.5">${label}</text>`;
    }).join('');

    // x labels: where the month turns over, thinned to at most seven, and the
    // year instead of the month every January (the one label that is a
    // different fact, so it is the one label with weight)
    const turns = [];
    for (let i = 1; i < win.length; i++) {
      if (win[i].d.getUTCMonth() !== win[i - 1].d.getUTCMonth()) turns.push(i);
    }
    const stride = Math.ceil(turns.length / 7) || 1;
    const xAxis = turns.filter((_, k) => k % stride === 0).map((i) => {
      const m = win[i].d.getUTCMonth();
      const text = m === 0 ? win[i].d.getUTCFullYear() : MONTHS[m];
      const cls = m === 0 ? 'chart-axis chart-axis-x chart-axis-year' : 'chart-axis chart-axis-x';
      return `<text class="${cls}" x="${xAt(i).toFixed(1)}" y="${LABEL_Y}">${text}</text>`;
    }).join('');

    const path = win.map((s, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(s.c).toFixed(1)}`).join(' ');

    svg.innerHTML = `${grid}${xAxis}`
      + `<path class="chart-line" d="${path}"></path>`
      + `<line class="chart-cursor" data-cursor x1="0" x2="0" y1="${Y0}" y2="${Y1}"></line>`
      + `<circle class="chart-dot" data-dot r="3.5" cx="0" cy="0"></circle>`;
    cursor = svg.querySelector('[data-cursor]');
    dot = svg.querySelector('[data-dot]');

    // The 52-week range is read off the same series rather than carried as two
    // more typed numbers: a range that says 164 under a year of chart that never
    // goes below 178 is the kind of contradiction a prototype should not print.
    // In production both come from the provider and agree by definition.
    const year = all.slice(-252);
    const lo52 = Math.min(...year.map((s) => s.l));
    const hi52 = Math.max(...year.map((s) => s.h));
    const now = isFinite(rec.price) ? rec.price : year[year.length - 1].c;
    setV('low52', group(r4(lo52)));
    setV('high52', group(r4(hi52)));
    const mark = dlg.querySelector('[data-v="range-mark"]');
    if (mark) {
      mark.style.left = `${clamp(((now - lo52) / (hi52 - lo52)) * 100, 0, 100)}%`;
      mark.classList.remove('hidden');
    }

    const from = fmtDate(win[0].d), to = fmtDate(win[win.length - 1].d);
    plot.setAttribute('aria-label',
      `Closing price${rec.currency ? ` in ${rec.currency}` : ''}, ${from} to ${to}, `
      + `${win.length} sessions. Left and right arrow keys read one session at a time; `
      + 'the values are printed under the chart.');

    moveTo(win.length - 1);
  }

  function moveTo(i) {
    if (!win.length) return;
    state.i = clamp(i, 0, win.length - 1);
    const s = win[state.i];
    const x = xAt(state.i).toFixed(1);
    cursor?.setAttribute('x1', x);
    cursor?.setAttribute('x2', x);
    dot?.setAttribute('cx', x);
    dot?.setAttribute('cy', yAt(s.c).toFixed(1));
    setV('s-date', fmtDate(s.d));
    setV('s-open', group(s.o));
    setV('s-close', group(s.c));
    setV('s-high', group(s.h));
    setV('s-low', group(s.l));
  }

  /* ------------------------------------------------------------- the tabs */

  function syncPanels() {
    const mode = dlg.dataset.mode;
    panels.forEach((p) => {
      const inMode = !p.dataset.only || p.dataset.only.split(' ').includes(mode);
      p.classList.toggle('hidden', !(inMode && p.dataset.tab === state.tab));
    });
    if (state.tab === 'performance' && mode === 'record') draw();
  }

  function selectTab(name) {
    state.tab = name;
    tabs.forEach((t) => {
      const on = t.dataset.tabBtn === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    syncPanels();
  }

  strip.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab-btn]');
    if (t) selectTab(t.dataset.tabBtn);
  });

  strip.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const t = tabs[(to + tabs.length) % tabs.length];
    selectTab(t.dataset.tabBtn);
    t.focus();
  });

  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-period]');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    state.period = b.dataset.period;
    dlg.querySelectorAll('[data-period]').forEach((x) =>
      x.setAttribute('aria-pressed', String(x === b)));
    draw();
  });

  /* --------------------------------------------------------- reading a day */

  plot.addEventListener('pointermove', (e) => {
    if (!win.length) return;
    const r = plot.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    moveTo(Math.round(((x - X0) / (X1 - X0)) * (win.length - 1)));
  });

  // leaving the chart puts the readout back on the latest session: the panel
  // never shows a session nobody asked for
  plot.addEventListener('pointerleave', () => moveTo(win.length - 1));

  plot.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step !== undefined) { moveTo(state.i + step * (e.shiftKey ? 21 : 1)); e.preventDefault(); return; }
    if (e.key === 'Home') { moveTo(0); e.preventDefault(); }
    if (e.key === 'End') { moveTo(win.length - 1); e.preventDefault(); }
  });

  /* ------------------------------------------------------------ the dialog
     The mode is set by instruments.js; this follows it rather than being called
     by it. create has no strip, so it is always on the details panel, and a
     closed dialog forgets which tab it was on — the next thing opened is
     usually another instrument. */

  new MutationObserver(() => {
    if (dlg.dataset.mode !== 'record') selectTab('details');
    else syncPanels();
  }).observe(dlg, { attributes: true, attributeFilter: ['data-mode'] });

  dlg.addEventListener('close', () => selectTab('details'));

  selectTab('details');
})();
