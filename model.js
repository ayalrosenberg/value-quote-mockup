/* =====================================================================
   Value Quoting — mockup model
   What a quote is, and the rules that act on it: reference numbers,
   price lines, the estimate, the checks, who approves, life-cycle moves.
   ===================================================================== */
(function (VQ) {
  'use strict';
  const { fmt, BLOCKS, DIVISIONS } = VQ;
  const KEY = 'value-quote-mockup-v4';
  const M = VQ.model = {};
  const clone = o => JSON.parse(JSON.stringify(o));

  M.div = id => DIVISIONS.find(d => d.id === id) || null;
  M.blocksOf = (divId, kind) => Object.keys(BLOCKS).filter(id => BLOCKS[id].div === divId && (!kind || BLOCKS[id].kind === kind));
  M.selected = (q, kind) => M.blocksOf(q.divId, kind).filter(id => q.sel[id]);
  M.user = id => VQ.USERS[id] || VQ.USERS[VQ.ME];

  /* ---------- storage ---------- */
  const store = M.store = { quotes: [], seq: 20431 };
  M.save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage is optional */ } };
  M.load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.quotes) && s.quotes.length) { store.quotes = s.quotes; store.seq = s.seq || 20431; return true; }
    } catch (e) { /* fall through to a fresh set */ }
    return false;
  };
  M.reset = () => { store.seq = 20431; store.quotes = VQ.SEED.map(build); M.save(); };
  M.get = id => store.quotes.find(q => q.id === id) || null;

  /* ---------- a new, empty quote ---------- */
  function blank() {
    return {
      id: 'q' + Math.random().toString(36).slice(2, 9), num: 0, rev: 1, divId: null, status: 'draft', owner: VQ.ME,
      custId: null, customer: { name: '', acc: '', street: '', suburb: '', town: '', code: '', tel: '' },
      contact: { title: 'Mr', name: '', role: '', email: '' },
      quoteDate: VQ.today, initialDate: VQ.today, fuel: null,
      sel: {}, lines: {}, inclOff: {},
      profile: { vehicles: [], origin: 'Cape Town', collection: '', consignments: null, actualKg: null, cube: null, factor: 5000, split: { retail: 40, dc: 40, door: 20 }, warehouses: [], wh: {}, exp: { dom: {}, boxes: {}, intl: { n: null, kg: null, zone: '5' } }, fleet: [], crew: {}, vcl: { hubs: [], vol: { xis: [null, null], exp: [null, null], eco: [null, null] }, litres: null, haz: [] }, film: { production: '', start: '', end: '', base: 'Johannesburg' } },
      terms: { start: VQ.dayOffset(14), months: 12, payDays: 30, git: 'excluded', gitMax: null, dw: 'value', insurer: '', policy: '', insFrom: '', insTo: '', special: '' },
      note: '', timeline: [], seen: 1,
    };
  }
  M.create = () => {
    const q = blank(); q.num = store.seq++;
    q.timeline.push({ when: VQ.today, who: M.user(VQ.ME).name, what: 'Quote started' });
    store.quotes.unshift(q); M.save(); return q;
  };

  M.setCustomer = (q, c) => {
    q.custId = c.id;
    q.customer = { name: c.name, acc: c.acc, street: c.street, suburb: c.suburb, town: c.town, code: c.code, tel: c.tel };
    q.contact = Object.assign({ title: 'Mr', name: '', role: '', email: '' }, c.contacts[0] || {});
    if (!q.profile.collection) q.profile.collection = [c.street, c.suburb, c.town, c.code].filter(Boolean).join(', ');
  };

  M.setDivision = (q, divId) => {
    const d = M.div(divId); if (!d || !d.enabled) return;
    q.divId = divId; q.sel = {}; q.lines = {}; q.inclOff = {};
    q.terms = Object.assign(blank().terms, { start: q.terms.start }); /* terms belong to the division: start again from its standards */
    q.terms.payDays = d.payDays;
    if (d.months) q.terms.months = d.months;
    if (divId === 'vff') { q.terms.dw = 'own'; q.profile.film.start = q.profile.film.start || VQ.addDays(q.quoteDate, 21); q.profile.film.end = q.profile.film.end || VQ.addDays(q.profile.film.start, 27); }
    if (divId === 'vcl') { q.terms.git = 'risk'; q.terms.gitMax = 1500000; }
    if (divId === 'whs') { q.profile.warehouses = VQ.WAREHOUSES.map(w => w[0]); VQ.WAREHOUSES.forEach(([c]) => { q.profile.wh[c] = q.profile.wh[c] || { pallets: null, vol: {} }; }); }
    const f = VQ.fuelNow();
    q.fuel = { date: f.date, price: f.inland, coastal: f.coastal, pct: f.pct[divId] != null ? f.pct[divId] : null };
    M.blocksOf(divId, 'extra').forEach(b => { if (BLOCKS[b].defaultOn) M.toggleBlock(q, b, true); });
  };

  /* ---------- reference number:  Q / number[rN] / [fuel price] / financial year / initials ---------- */
  M.ref = q => {
    const d = M.div(q.divId), u = M.user(q.owner);
    const [y, m] = q.initialDate.split('-').map(Number);
    const fy = String((m >= 3 ? y + 1 : y) % 100).padStart(2, '0');
    const fuel = d && d.fuelMode === 'surcharge' && q.fuel ? '/' + Math.round(q.fuel.price * 100) : '';
    return `Q/${q.num}${q.rev > 1 ? 'r' + q.rev : ''}${fuel}/${fy}/${u.initials}`;
  };
  M.validUntil = q => VQ.addDays(q.quoteDate, 30);
  M.daysLeft = q => VQ.daysBetween(VQ.today, M.validUntil(q));

  /* ---------- contract years, warehouses and storage bands ---------- */
  M.hasY2 = q => !q || !q.terms || q.terms.months > 12;
  M.yearText = (q, n) => {
    if (!q) return 'Year ' + n;
    const from = VQ.addMonths(q.terms.start, 12 * (n - 1)), to = VQ.addDays(VQ.addMonths(q.terms.start, Math.min(12 * n, q.terms.months)), -1);
    return `Year ${n}, ${fmt.dshort(from)} to ${fmt.dshort(to)}`;
  };
  M.tableOn = (q, t) => !t.branch || !q || (q.profile.warehouses || []).includes(t.branch);
  M.fleetBranches = q => q ? [...new Set((q.profile.fleet || []).filter(f => f.veh && f.branch && f.qty).map(f => f.branch))] : [];
  M.colsOf = (q, t) => { const fb = M.fleetBranches(q); return t.cols.filter(c => !(c.year === 2 && !M.hasY2(q)) && !(c.branch && fb.length && !fb.includes(c.branch))); };
  /* values the engine works out rather than anyone typing them */
  M.calc = (q, t, r, c) => {
    const f = (q && q.fuel) || { price: VQ.fuelNow().inland, coastal: VQ.fuelNow().coastal };
    const region = r.region || ((VQ.BRANCHES.find(b => b[0] === r.branch) || [])[2]);
    const price = region === 'coastal' ? f.coastal : f.price;
    if (c.key === 'qty') { const n = q ? q.profile.fleet.filter(x => x.veh === r.veh && x.branch === r.branch).reduce((a, x) => a + (x.qty || 0), 0) : 0; return { v: n, text: n ? fmt.num(n) : '–' }; }
    if (c.key === 'fuelp') return { v: price, text: fmt.money(price), meta: region };
    if (c.key === 'fuelkm') {
      const tbl = VQ.CONS[r.cls], codes = r.branch ? [r.branch] : VQ.BRANCHES.filter(b => b[2] === region).map(b => b[0]);
      const cons = codes.reduce((a, b) => a + tbl[b], 0) / codes.length, v = Math.round(price / cons * 100) / 100;
      return { v, text: fmt.money(v), meta: `${fmt.money(price)} ÷ ${fmt.num(cons, 2)} km/ℓ` };
    }
    return { v: null, text: '' };
  };
  M.bands = (q, branch) => {
    const base = q && q.profile.wh && q.profile.wh[branch] && q.profile.wh[branch].pallets;
    if (!base) return { b1: 'band 1, well below the expected volume', b2: 'band 2, around the expected volume', b3: 'band 3, above the expected volume', b4: 'band 4, well above the expected volume' };
    const n = f => Math.round(base * f), g = x => fmt.num(x);
    return { b1: `${g(n(.6))} – ${g(n(.8) - 1)} pallets`, b2: `${g(n(.8))} – ${g(n(1.2))} pallets, base ${g(base)}`, b3: `${g(n(1.2) + 1)} – ${g(n(1.4))} pallets`, b4: `more than ${g(n(1.4))} pallets` };
  };
  /* fill the placeholders a rate book uses in its labels */
  M.text = (q, t, str) => String(str == null ? '' : str)
    .replace('{origin}', q ? q.profile.origin : 'origin')
    .replace('{y1}', M.yearText(q, 1)).replace('{y2}', M.yearText(q, 2))
    .replace(/\{(b\d)\}/, (m, k) => M.bands(q, t && t.branch)[k]);

  /* ---------- price lines ---------- */
  M.ensure = (q, bid) => {
    const B = q.lines[bid] = q.lines[bid] || {};
    BLOCKS[bid].tables.forEach(t => {
      const T = B[t.id] = B[t.id] || {};
      t.rows.forEach(r => { if (!T[r.id]) T[r.id] = { on: true, p: Object.assign({}, r.s), por: Object.assign({}, r.por || {}) }; });
    });
    return B;
  };
  M.line = (q, bid, tid, rid) => (((q.lines[bid] || {})[tid] || {})[rid]) || null;
  M.rowsOn = (q, bid, tid) => {
    const t = BLOCKS[bid].tables.find(x => x.id === tid);
    if (!t || !M.tableOn(q, t)) return [];
    return t.rows.map(r => ({ r, ln: M.line(q, bid, tid, r.id) })).filter(x => x.ln && x.ln.on);
  };
  M.toggleBlock = (q, bid, on) => {
    if (on) { q.sel[bid] = true; M.ensure(q, bid); M.applyProfile(q, bid); } else delete q.sel[bid];
    /* the over-border documentation fee only applies when over-border freight is quoted */
    const ob = M.line(q, 'log.fees', 't', 'obdoc'); if (ob) ob.on = !!q.sel['log.border'];
  };

  /* the row of a hire block that best fits a vehicle in the profile */
  M.bestRow = (bid, v) => {
    const b = BLOCKS[bid]; const rows = b.tables[0].rows.filter(r => r.veh === v.veh);
    if (!rows.length) return null;
    if (rows[0].kmIncl == null) return rows[0];
    const km = b.period === 'week' ? (v.km || 0) / 4.33 : (v.km || 0);
    return rows.find(r => r.kmIncl >= km) || rows[rows.length - 1];
  };
  /* switch on the rows the profile asks for; an empty profile means "quote the whole rate card" */
  M.applyProfile = (q, only) => {
    const vs = q.profile.vehicles.filter(v => v.veh);
    M.selected(q, 'service').forEach(bid => {
      const b = BLOCKS[bid]; if (!b.byVehicle || (only && only !== bid)) return;
      const T = M.ensure(q, bid).t;
      b.tables[0].rows.forEach(r => { T[r.id].on = !vs.length; });
      vs.forEach(v => { const r = M.bestRow(bid, v); if (r) T[r.id].on = true; });
    });
    if (q.divId === 'vcl') {
      const hubs = q.profile.vcl.hubs;
      ['vcl.xis', 'vcl.exp', 'vcl.eco', 'vcl.decant'].forEach(bid => {
        if (!q.sel[bid] || (only && only !== bid)) return; const T = M.ensure(q, bid).t;
        BLOCKS[bid].tables[0].rows.forEach(r => { T[r.id].on = !hubs.length || hubs.includes(r.from); });
      });
    }
    if (q.divId === 'vdd') {
      const fl = q.profile.fleet.filter(f => f.veh && f.branch && f.qty), fb = M.fleetBranches(q);
      if (q.sel['vdd.core'] && (!only || only === 'vdd.core')) { const T = M.ensure(q, 'vdd.core').t; BLOCKS['vdd.core'].tables[0].rows.forEach(r => { T[r.id].on = !fl.length || fl.some(f => f.veh === r.veh && f.branch === r.branch); }); }
      if (q.sel['vdd.cube'] && (!only || only === 'vdd.cube')) { const T = M.ensure(q, 'vdd.cube').t; BLOCKS['vdd.cube'].tables[0].rows.forEach(r => { T[r.id].on = !fb.length || fb.includes(r.branch); }); }
      if (q.sel['vdd.labour'] && (!only || only === 'vdd.labour')) {
        const T = M.ensure(q, 'vdd.labour').t, has = id => Object.values(q.profile.crew[id] || {}).some(Boolean), any = VQ.DD_JOBS.some(([id]) => has(id));
        VQ.DD_JOBS.forEach(([id]) => { T[id].on = !any || has(id); });
      }
    }
    if (q.divId === 'exp' && q.sel['exp.box'] && (!only || only === 'exp.box')) {
      const want = Object.keys(q.profile.exp.boxes).filter(k => q.profile.exp.boxes[k] > 0), T = M.ensure(q, 'exp.box').t;
      BLOCKS['exp.box'].tables[0].rows.forEach(r => { T[r.id].on = !want.length || want.includes(r.id); });
    }
    if (q.divId === 'vtr' && vs.some(v => v.driver) && (!only || only === 'vtr.labour')) {
      const first = !q.sel['vtr.labour'];
      q.sel['vtr.labour'] = true;
      const T = M.ensure(q, 'vtr.labour').rates;
      if (first) T.crew.on = false; /* a driver was asked for, not a crew */
      const wanted = new Set(vs.map(v => v.driver).filter(Boolean));
      ['d10', 'd14'].forEach(id => { T[id].on = wanted.has(id); });
    }
  };

  const rowLabel = (t, r, q) => (t.branch ? t.title + ': ' : '') + t.cols.filter(c => c.type !== 'price' && r.l[c.key] != null && c.key !== 'unit')
    .map(c => c.key === 'kmIncl' ? fmt.num(r.l[c.key]) + ' km' : M.text(q, t, r.l[c.key])).join(', ');
  M.rowLabel = rowLabel;

  /* how the quoted prices compare with the standard rate book */
  M.stats = q => {
    const out = { total: 0, missing: 0, changed: 0, below: 0, devs: [] };
    Object.keys(q.sel).forEach(bid => {
      const b = BLOCKS[bid]; if (!b) return;
      b.tables.forEach(t => M.tableOn(q, t) && t.rows.forEach(r => {
        const ln = M.line(q, bid, t.id, r.id); if (!ln || !ln.on) return;
        M.colsOf(q, t).forEach(c => {
          if (c.type !== 'price' || r.s[c.key] == null) return;
          out.total++;
          if (ln.por[c.key]) return;
          const v = ln.p[c.key], s = r.s[c.key];
          if (v == null || isNaN(v)) { out.missing++; return; }
          if (Math.abs(v - s) < 0.005) return;
          const pct = s ? (v - s) / s * 100 : 0, low = s > 0 && v < s * (1 - VQ.FLOOR) - 1e-9;
          out.changed++; if (low) out.below++;
          out.devs.push({ bid, block: b.name, table: t.title, row: rowLabel(t, r, q), col: M.text(q, t, c.label).replace(/,.*/, ''), std: s, val: v, pct, low, dec: c.dec });
        });
      }));
    });
    out.devs.sort((a, b) => a.pct - b.pct);
    return out;
  };

  /* raise or lower every quoted price in a table by a percentage */
  const tidy = n => n >= 1000 ? Math.round(n / 10) * 10 : n >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
  M.adjust = (q, bid, tid, pct) => {
    const t = BLOCKS[bid].tables.find(x => x.id === tid);
    M.rowsOn(q, bid, tid).forEach(({ r, ln }) => t.cols.forEach(c => {
      if (c.type === 'price' && r.s[c.key] != null && ln.p[c.key] != null && !ln.por[c.key]) ln.p[c.key] = tidy(ln.p[c.key] * (1 + pct / 100));
    }));
  };
  M.resetTable = (q, bid, tid) => {
    M.rowsOn(q, bid, tid).forEach(({ r, ln }) => { ln.p = Object.assign({}, r.s); ln.por = Object.assign({}, r.por || {}); });
  };

  M.fee = (q, id) => {
    const bid = q.divId + '.fees', ln = M.line(q, bid, 't', id);
    if (ln && ln.p.amt != null) return ln.p.amt;
    const r = BLOCKS[bid] && BLOCKS[bid].tables[0].rows.find(x => x.id === id);
    return r ? r.s.amt : null;
  };

  /* ---------- derived facts ---------- */
  M.volumes = q => {
    const p = q.profile, volKg = p.cube ? p.cube * 1e6 / p.factor : 0;
    const chargeable = Math.max(p.actualKg || 0, volKg);
    return { volKg, chargeable, perDrop: p.consignments ? chargeable / p.consignments : 0, cubePerDrop: p.consignments && p.cube ? p.cube / p.consignments : 0 };
  };
  /* chargeable mass: the larger of actual mass and length x width x height / factor */
  M.chargeable = (l, w, h, actual, factor) => { const vol = l && w && h ? l * w * h / factor : 0; return { vol, charge: Math.max(vol, actual || 0) }; };
  M.weeks = q => { const f = q.profile.film; return f.start && f.end && f.end >= f.start ? Math.max(1, Math.ceil((VQ.daysBetween(f.start, f.end) + 1) / 7)) : 0; };
  M.shootWeek = q => {
    let t = 0; q.profile.vehicles.filter(v => v.veh).forEach(v => { const ln = M.line(q, 'vff.weekly', 't', v.veh), r = BLOCKS['vff.weekly'].tables[0].rows.find(x => x.id === v.veh);
      if (ln) t += (v.qty || 1) * ((ln.p.week || 0) + Math.max(0, (v.km || 0) - r.kmIncl) * (ln.p.excess || 0)); });
    return t;
  };
  M.band = kg => VQ.BAND_TOP.findIndex(t => kg <= t) + 1;
  M.esc = q => {
    const d = M.div(q.divId); if (!d) return null;
    if (d.esc.anniversary) {
      let next = VQ.addMonths(q.terms.start, 12); while (next <= q.quoteDate) next = VQ.addMonths(next, 12);
      return { anniversary: true, chargesDay: 'the anniversary of the contract', chargesNext: next, labourNext: next, min: null };
    }
    return {
      chargesDay: fmt.dayMonth(d.esc.charges[0], d.esc.charges[1]), chargesNext: VQ.nextOn(q.quoteDate, d.esc.charges[0], d.esc.charges[1]),
      labourNext: VQ.nextOn(q.quoteDate, d.esc.labour[0], d.esc.labour[1]), min: d.esc.min || null,
    };
  };

  /* a rough monthly value, for the sales person and the approver — never printed on the letter */
  const MIX = { johannesburg: .30, durban: .16, 'cape-town': .22, 'port-elizabeth': .08, bloemfontein: .05, george: .05, 'east-london': .04, polokwane: .03, nelspruit: .03, harrismith: .02, mafikeng: .01, transkei: .01 };
  const ZMIX = { z1: .60, z2: .25, z3: .10, z4: .05 };
  M.estimate = q => {
    if (q.lite) return q.est;
    if (q.divId === 'vtr') {
      const vs = q.profile.vehicles.filter(v => v.veh); if (!vs.length) return null;
      const order = ['vtr.monthly', 'vtr.weekly', 'vtr.daily'].filter(b => q.sel[b]); if (!order.length) return null;
      let total = 0;
      vs.forEach(v => {
        const qty = v.qty || 1, km = v.km || 0;
        for (const bid of order) {
          const r = M.bestRow(bid, v); if (!r) continue;
          const ln = M.line(q, bid, 't', r.id); if (!ln) continue;
          const p = ln.p, dw = q.terms.dw === 'value' ? (p.dw || 0) : 0;
          if (bid === 'vtr.monthly') total += qty * ((p.month || 0) + dw + Math.max(0, km - r.kmIncl) * (p.excess || 0));
          else if (bid === 'vtr.weekly') total += qty * (4.33 * ((p.week || 0) + dw) + Math.max(0, km - 4.33 * r.kmIncl) * (p.excess || 0));
          else total += qty * (21.67 * ((p.day || 0) + dw) + km * (p.km || 0));
          if (v.driver && q.sel['vtr.labour']) {
            const lp = (M.line(q, 'vtr.labour', 'rates', v.driver) || { p: {} }).p;
            total += qty * (bid === 'vtr.monthly' ? (lp.month || 0) : bid === 'vtr.weekly' ? 4.33 * (lp.week || 0) : 21.67 * (lp.day || 0));
          }
          break;
        }
      });
      return total;
    }
    if (q.divId === 'vff') { const w = q.sel['vff.weekly'] ? M.shootWeek(q) : 0; return w ? w * 4.33 : null; }
    if (q.divId === 'vcl') {
      const v = q.profile.vcl; let total = 0, any = false;
      ['xis', 'exp', 'eco'].forEach(code => {
        const bid = 'vcl.' + code, [n, kg] = v.vol[code] || []; if (!q.sel[bid] || !n || !kg) return;
        const rows = M.rowsOn(q, bid, 't'); if (!rows.length) return;
        const b = 'b' + M.band(kg), per = rows.reduce((a, { ln }) => a + Math.max(ln.p.min || 0, kg * (ln.p[b] || 0)), 0) / rows.length;
        total += n * per; any = true;
      });
      if (q.sel['vcl.decant'] && v.litres) { const rows = M.rowsOn(q, 'vcl.decant', 't'); if (rows.length) { total += v.litres * rows.reduce((a, x) => a + (x.ln.p.litre || 0), 0) / rows.length; any = true; } }
      return any ? total * (1 + (q.fuel && q.fuel.pct ? q.fuel.pct / 100 : 0)) : null;
    }
    if (q.divId === 'vdd') {
      let total = 0, any = false;
      if (q.sel['vdd.core']) q.profile.fleet.forEach(f => {
        if (!f.veh || !f.branch || !f.qty) return; const r = BLOCKS['vdd.core'].tables[0].rows.find(x => x.id === `${f.veh}-${f.branch}`), ln = M.line(q, 'vdd.core', 't', r.id); if (!ln) return;
        total += f.qty * ((ln.p.month || 0) + (f.km || 0) * ((ln.p.maint || 0) + M.calc(q, BLOCKS['vdd.core'].tables[0], r, { key: 'fuelkm' }).v)); any = true;
      });
      if (q.sel['vdd.labour']) VQ.DD_JOBS.forEach(([id]) => { const n = Object.values(q.profile.crew[id] || {}).reduce((a, b) => a + (b || 0), 0), ln = M.line(q, 'vdd.labour', 't', id); if (n && ln) { total += n * (ln.p.month || 0); any = true; } });
      if (q.sel['vdd.mgmt']) M.rowsOn(q, 'vdd.mgmt', 't').forEach(({ ln }) => M.fleetBranches(q).forEach(b => { total += ln.p[b] || 0; }));
      return any ? total : null;
    }
    if (q.divId === 'exp') {
      const e = q.profile.exp; let total = 0, any = false;
      if (q.sel['exp.dom']) M.rowsOn(q, 'exp.dom', 't').forEach(({ r, ln }) => {
        const v = e.dom[r.id]; if (!v || !v[0]) return; any = true;
        total += v[0] * ((ln.p.min || 0) + Math.max(0, (v[1] || 0) - r.minKg) * (ln.p.kg || 0));
      });
      if (q.sel['exp.box']) M.rowsOn(q, 'exp.box', 't').forEach(({ r, ln }) => {
        const n = e.boxes[r.id]; if (!n) return; any = true;
        const zs = VQ.ZONES.map(([z]) => ln.p[z]).filter(x => x != null); total += n * zs.reduce((a, b) => a + b, 0) / (zs.length || 1);
      });
      if (q.sel['exp.intl'] && e.intl.n && e.intl.kg) {
        const rows = BLOCKS['exp.intl'].tables[0].rows, key = 'z' + e.intl.zone + 'n';
        const step = rows.filter(r => r.kg).find(r => r.kg >= e.intl.kg), top = rows.find(r => r.kg === 7), extra = M.line(q, 'exp.intl', 't', 'extra');
        const price = step ? (M.line(q, 'exp.intl', 't', step.id) || { p: {} }).p[key] : (M.line(q, 'exp.intl', 't', top.id).p[key] + Math.ceil((e.intl.kg - 7) / .5) * extra.p[key]);
        total += e.intl.n * (price || 0); any = true;
      }
      if (!any) return null;
      return total * (1 + (q.fuel && q.fuel.pct ? q.fuel.pct / 100 : 0));
    }
    if (q.divId === 'whs') {
      let total = 0, any = false;
      (q.profile.warehouses || []).forEach(code => {
        const w = q.profile.wh[code] || { vol: {} };
        M.selected(q, 'service').forEach(bid => M.rowsOn(q, bid, code).forEach(({ r, ln }) => {
          const price = ln.p.y1 || 0;
          if (/^st-b/.test(r.id)) { if (r.id === 'st-b2' && w.pallets) { total += w.pallets * price; any = true; } return; }
          const v = w.vol[r.id]; if (!v) return;
          total += r.id === 'st-half' ? v * price : v * price / 12; any = true;
        }));
      });
      return any ? total : null;
    }
    if (q.divId === 'log') {
      const p = q.profile; if (!p.consignments || !q.sel['log.dist']) return q.sel['log.inhouse'] ? inhouse(q) : null;
      const kgPer = M.volumes(q).perDrop, originKey = p.origin.toLowerCase().replace(/ /g, '-');
      const minL = M.line(q, 'log.dist', 'min', 'local'), minM = M.line(q, 'log.dist', 'min', 'main');
      let per = 0, w = 0;
      Object.keys(MIX).forEach(c => {
        const ln = M.line(q, 'log.dist', 'kg', c); if (!ln || !ln.on) return;
        let rate = 0, zw = 0;
        Object.keys(ZMIX).forEach(z => { if (ln.p[z] != null) { rate += ln.p[z] * ZMIX[z]; zw += ZMIX[z]; } });
        if (!zw) return; rate /= zw;
        const min = ((c === originKey ? minL : minM) || { p: {} }).p.min || 0;
        per += MIX[c] * (min + Math.max(0, kgPer - 10) * rate); w += MIX[c];
      });
      if (!w) return null; per /= w;
      const fuel = q.fuel && q.fuel.pct ? q.fuel.pct / 100 : 0;
      return p.consignments * per * (1 + fuel) + p.consignments * (M.fee(q, 'doc') || 0) + inhouse(q);
    }
    return null;
  };
  function inhouse(q) { const ln = q.sel['log.inhouse'] && M.line(q, 'log.inhouse', 't', 'sc'); return ln && ln.on ? (ln.p.month || 0) : 0; }

  /* ---------- checks: what must be fixed, and what needs an approver's eye ---------- */
  M.checks = q => {
    const out = [], add = (level, text, step) => out.push({ level, text, step });
    const d = M.div(q.divId);
    if (!q.customer.name) add('fix', 'Choose the customer this quote is for', 1);
    else if (!q.contact.name) add('fix', 'Add the person the letter is addressed to', 1);
    if (!d) { add('fix', 'Choose a division', 2); return out; }
    const services = M.selected(q, 'service');
    if (!services.length) add('fix', 'Tick at least one service', 2);

    if (d.id === 'vtr') {
      const vs = q.profile.vehicles.filter(v => v.veh);
      vs.forEach(v => services.forEach(bid => {
        if (BLOCKS[bid].byVehicle && !M.bestRow(bid, v)) add('note', `${VQ.VEHICLES.find(x => x.k === v.veh).name} is not in the ${BLOCKS[bid].name.toLowerCase()} rate book`, 3);
      }));
      const onVeh = new Set();
      services.forEach(bid => M.rowsOn(q, bid, 't').forEach(({ r }) => onVeh.add(r.veh)));
      const heavy = VQ.VEHICLES.filter(v => onVeh.has(v.k) && v.tons >= 12);
      const hasDriver = q.sel['vtr.labour'] && M.rowsOn(q, 'vtr.labour', 'rates').some(x => x.r.id !== 'crew');
      if (heavy.length && vs.length && !hasDriver) add('fix', 'Vehicles of 12 tons and above come only with a Value driver. Add a driver under Extras.', 5);
      if (q.terms.dw === 'own' && !(q.terms.insurer && q.terms.policy && q.terms.insFrom && q.terms.insTo)) add('fix', 'Customer’s own insurance: add the insurer, policy number and cover dates', 6);
      if (q.terms.dw === 'value' && VQ.VEHICLES.some(v => v.pax && onVeh.has(v.k)) && vs.length) add('note', 'Passenger vehicles cannot take Value’s damage waiver. An insurance letter is needed before release.', 6);
    }
    if (d.id === 'vff') {
      const f = q.profile.film, t = q.terms;
      if (!f.start || !f.end || f.end < f.start) add('fix', 'Enter the shoot dates', 3);
      if (!(t.insurer && t.policy && t.insFrom && t.insTo && t.cover)) add('fix', 'Vehicles go out on the production’s own insurance: add the insurer, policy number, cover per vehicle and cover dates', 6);
      else if (f.start && (t.insFrom > f.start || t.insTo < f.end)) add('fix', 'The insurance cover dates do not cover the whole shoot', 6);
      if (!q.profile.vehicles.some(v => v.veh)) add('note', 'No vehicles listed, so the letter carries the full weekly rate card', 3);
    }
    if (d.id === 'vcl') {
      const v = q.profile.vcl;
      if (!v.hubs.length) add('fix', 'Tick the hubs the goods leave from', 3);
      if (!v.haz.length) add('fix', 'Declare which dangerous goods classes will be carried', 3);
      if (services.length && !['xis', 'exp', 'eco'].some(c => (v.vol[c] || [])[0]) && !v.litres) add('note', 'Add monthly volumes to see an estimate', 3);
    }
    if (d.id === 'vdd') {
      if (q.sel['vdd.core'] && !q.profile.fleet.some(f => f.veh && f.branch && f.qty)) add('fix', 'List the core fleet: which vehicles, at which branches, how many', 3);
      if (q.sel['vdd.labour'] && !Object.values(q.profile.crew).some(o => Object.values(o || {}).some(Boolean))) add('note', 'No headcount yet, so the letter prints labour rates without quantities', 3);
    }
    if (d.id === 'exp') {
      const e = q.profile.exp, has = Object.values(e.dom).some(v => v && v[0]) || Object.values(e.boxes).some(Boolean) || e.intl.n;
      if (services.length && !has) add('note', 'Add monthly volumes to see an estimate', 3);
      if (q.sel['exp.box']) add('note', 'Box prices assume volumetric weight is always above actual weight. The letter says so.', 4);
    }
    if (d.id === 'whs') {
      const ws = q.profile.warehouses || [];
      if (!ws.length) add('fix', 'Tick at least one warehouse', 3);
      else if (services.length) {
        const empty = ws.filter(c => { const w = q.profile.wh[c] || { vol: {} }; return !w.pallets && !Object.values(w.vol).some(Boolean); });
        if (empty.length) add('note', `No volumes for ${empty.map(c => VQ.WAREHOUSES.find(w => w[0] === c)[1]).join(' and ')}. Prices depend on volumes, and the letter prints them.`, 3);
      }
      if (q.terms.months > 24) add('note', `The rate book has two contract years. Years 3 to ${Math.ceil(q.terms.months / 12)} would follow the escalation clause.`, 6);
    }
    if (d.id === 'log') {
      if (services.includes('log.dist') && !q.profile.consignments) add('note', 'Add monthly volumes to see an estimate and print the quotation parameters', 3);
    }
    if (q.terms.git === 'risk' && !q.terms.gitMax) add('fix', 'Goods in transit: enter the maximum value per load that Value accepts', 6);

    const st = M.stats(q);
    if (st.missing) add('fix', `${st.missing} price${st.missing > 1 ? 's are' : ' is'} still empty`, 4);
    if (st.below) add('approve', `${st.below} price${st.below > 1 ? 's are' : ' is'} more than ${Math.round(VQ.FLOOR * 100)}% below the standard rate`, 4);
    if (q.terms.payDays !== d.payDays) add('approve', `Payment terms of ${q.terms.payDays} days instead of the standard ${d.payDays}`, 6);
    if (q.terms.special && q.terms.special.trim()) add('approve', 'A special condition has been added by hand', 6);
    if (q.terms.git === 'risk' && d.id === 'log') add('approve', 'Value accepts goods-in-transit risk on this quote', 6);
    if (q.terms.months >= 36) add('approve', `Contract of ${q.terms.months} months needs director approval`, 6);

    if ((d.fuelMode === 'surcharge' || d.fuelMode === 'perkm') && q.fuel) {
      const cur = VQ.fuelNow();
      if (q.fuel.date === cur.date) add('ok', `Fuel basis is current: ${fmt.money(q.fuel.price)} a litre on ${fmt.dshort(q.fuel.date)}`, 6);
      else add('fix', `Fuel basis is out of date (${fmt.dshort(q.fuel.date)}). Refresh it under Terms.`, 6);
    }
    if (services.length && !st.missing) add('ok', `All ${st.total} prices are filled in`, 4);
    return out;
  };
  M.blockers = q => M.checks(q).filter(c => c.level === 'fix');
  M.approvalReasons = q => M.checks(q).filter(c => c.level === 'approve');
  M.approvers = q => {
    const d = M.div(q.divId); if (!d || !d.approver) return [];
    const list = [{ name: d.approver.name, title: d.approver.title, why: 'Second signatory on every quote' }];
    const est = M.estimate(q) || 0;
    if (q.terms.months >= 36) list.push({ name: 'Directors of the Value Group', title: 'Final approval', why: `Contract of ${q.terms.months} months` });
    else if (est > 750000) list.push({ name: 'Directors of the Value Group', title: 'Final approval', why: 'More than R750 000 a month' });
    return list;
  };

  /* ---------- life of a quote ---------- */
  const log = (q, who, what, note) => q.timeline.push({ when: VQ.today, who, what, note: note || '' });
  M.submit = q => { q.status = 'awaiting'; log(q, M.user(q.owner).name, `Sent to ${M.approvers(q).map(a => a.name).join(' and ')} for approval`, q.note); M.save(); };
  M.approve = (q, note) => { q.status = 'approved'; log(q, M.div(q.divId).approver.name, 'Approved', note); M.save(); };
  M.sendBack = (q, note) => { q.status = 'draft'; log(q, M.div(q.divId).approver.name, 'Sent back for changes', note); M.save(); };
  M.send = q => { q.status = 'sent'; log(q, M.user(VQ.ME).name, `Sent to ${q.contact.name || 'the customer'}${q.contact.email ? ' at ' + q.contact.email : ''}`); M.save(); };
  M.outcome = (q, status) => { q.status = status; log(q, M.user(VQ.ME).name, status === 'accepted' ? 'Marked as accepted by the customer' : 'Marked as declined by the customer'); M.save(); };
  M.remove = q => { store.quotes = store.quotes.filter(x => x.id !== q.id); M.save(); };

  /* a new revision keeps the number and the initial quote date */
  M.revise = (q, opts) => {
    opts = opts || {};
    const n = clone(q); n.id = 'q' + Math.random().toString(36).slice(2, 9);
    n.rev = q.rev + 1; n.status = 'draft'; n.quoteDate = VQ.today; n.seen = 8; n.note = '';
    if (n.fuel && M.div(n.divId).fuelMode === 'surcharge') { const f = VQ.fuelNow(); n.fuel = { date: f.date, price: f.inland, coastal: f.coastal, pct: f.pct[n.divId] }; }
    if (opts.pct) Object.keys(n.sel).forEach(bid => BLOCKS[bid].tables.forEach(t => M.adjust(n, bid, t.id, opts.pct)));
    if (opts.extend) { n.terms.start = VQ.addMonths(q.terms.start, q.terms.months); n.terms.months = opts.extend; }
    n.timeline = [{ when: VQ.today, who: M.user(VQ.ME).name, what: opts.label || `Revision ${n.rev} started from revision ${q.rev}`, note: '' }];
    q.superseded = true; store.quotes.unshift(n); M.save(); return n;
  };
  M.copy = q => {
    const n = clone(q); n.id = 'q' + Math.random().toString(36).slice(2, 9);
    n.num = store.seq++; n.rev = 1; n.status = 'draft'; n.owner = VQ.ME; n.quoteDate = n.initialDate = VQ.today; n.seen = 8; n.note = ''; delete n.superseded;
    n.custId = null; n.customer = blank().customer; n.contact = blank().contact; n.profile.collection = '';
    n.timeline = [{ when: VQ.today, who: M.user(VQ.ME).name, what: `Copied from ${M.ref(q)}`, note: '' }];
    store.quotes.unshift(n); M.save(); return n;
  };

  /* ---------- build the opening set of quotes ---------- */
  function build(s) {
    const q = blank(); q.id = 'q' + s.num; q.num = s.num; q.owner = s.owner; q.status = s.status; q.seen = 8;
    q.quoteDate = q.initialDate = VQ.dayOffset(-s.age);
    const c = VQ.CUSTOMERS.find(x => x.id === s.cust); M.setCustomer(q, c);
    if (s.lite) { q.divId = s.div; q.lite = s.lite; q.est = s.est; }
    else {
      M.setDivision(q, s.div);
      if (s.vehicles) q.profile.vehicles = s.vehicles.map(v => Object.assign({}, v));
      if (s.film) {
        const F = VQ.FF_SAMPLE, st = VQ.addDays(q.quoteDate, 24);
        q.profile.vehicles = F.vehicles.map(v => Object.assign({}, v)); Object.assign(q.profile.film, { production: F.production, start: st, end: VQ.addDays(st, F.days), base: F.base });
        Object.assign(q.terms, { insurer: F.insurer, policy: F.policy, cover: F.cover, insFrom: st, insTo: VQ.addDays(st, F.days + 7) });
      }
      if (s.vcl) { const V = VQ.VCL_SAMPLE; q.profile.vcl = { hubs: V.hubs.slice(), vol: JSON.parse(JSON.stringify(V.vol)), litres: V.litres, haz: V.haz.slice() }; }
      if (s.dd) { q.profile.fleet = VQ.DD_SAMPLE.fleet.map(f => Object.assign({}, f)); q.profile.crew = JSON.parse(JSON.stringify(VQ.DD_SAMPLE.crew)); }
      if (s.express) {
        Object.keys(VQ.EXP_SAMPLE.dom).forEach(k => { q.profile.exp.dom[k] = VQ.EXP_SAMPLE.dom[k].slice(); });
        Object.assign(q.profile.exp.boxes, VQ.EXP_SAMPLE.boxes); Object.assign(q.profile.exp.intl, VQ.EXP_SAMPLE.intl);
      }
      if (s.wh) {
        q.profile.warehouses = s.wh.slice();
        s.wh.forEach((c, i) => { const f = i ? 1.12 : 1; q.profile.wh[c] = { pallets: Math.round(VQ.WH_SAMPLE.pallets * (i ? .9 : 1)), vol: {} };
          Object.keys(VQ.WH_SAMPLE.vol).forEach(k => { q.profile.wh[c].vol[k] = Math.round(VQ.WH_SAMPLE.vol[k] * f); }); });
      }
      if (s.vols) {
        q.profile.consignments = s.vols[0]; q.profile.actualKg = s.vols[1]; q.profile.cube = s.vols[2];
        q.profile.origin = ['Cape Town', 'Johannesburg', 'Durban'].find(o => c.town.includes(o.split(' ')[0]) || (o === 'Johannesburg' && /Midrand|Germiston|Randburg/.test(c.town)) || (o === 'Durban' && /Pinetown/.test(c.town))) || 'Cape Town';
      }
      s.blocks.forEach(b => M.toggleBlock(q, b, true));
      M.applyProfile(q);
      if (s.months) q.terms.months = s.months;
      if (s.payDays) q.terms.payDays = s.payDays;
      if (s.adjust) { const bid = s.blocks[0], t = BLOCKS[bid].tables; M.adjust(q, bid, t[t.length - 1].id, s.adjust); }
      q.note = s.note || ''; q.terms.start = VQ.addDays(q.quoteDate, 21);
    }
    const owner = M.user(s.owner).name, d = M.div(s.div), appr = d.approver ? d.approver.name : 'Divisional Manager';
    const at = n => VQ.dayOffset(-Math.max(0, s.age - n));
    const t = q.timeline = [{ when: at(0), who: owner, what: 'Quote started', note: '' }];
    q.terms.start = s.wh ? VQ.addDays(q.quoteDate, 41) : q.terms.start;
    const reached = st => ['awaiting', 'approved', 'sent', 'accepted', 'declined', 'expired'].indexOf(s.status) >= ['awaiting', 'approved', 'sent', 'accepted', 'declined', 'expired'].indexOf(st);
    if (s.status !== 'draft') t.push({ when: at(0), who: owner, what: `Sent to ${appr} for approval`, note: s.note || '' });
    if (reached('approved')) t.push({ when: at(1), who: appr, what: 'Approved', note: '' });
    if (reached('approved') && M.approvers(q).length > 1) t.push({ when: at(1), who: 'Directors of the Value Group', what: 'Approved', note: '' });
    if (reached('sent')) t.push({ when: at(1), who: owner, what: `Sent to ${q.contact.name} at ${q.contact.email}`, note: '' });
    if (s.status === 'accepted') t.push({ when: at(6), who: owner, what: 'Marked as accepted by the customer', note: '' });
    if (s.status === 'declined') t.push({ when: at(9), who: owner, what: 'Marked as declined by the customer', note: '' });
    if (s.status === 'expired') t.push({ when: at(30), who: 'Value Quoting', what: 'Expired after 30 days without a reply', note: '' });
    return q;
  }
})(window.VQ);
