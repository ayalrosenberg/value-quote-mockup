/* =====================================================================
   Value Quoting — the letter
   Builds the customer document from the quote, in the same order and
   wording as Value's current letters. One function per division layout;
   everything else is shared.
   ===================================================================== */
(function (VQ) {
  'use strict';
  const { fmt, BLOCKS } = VQ, M = VQ.model;
  const esc = VQ.esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const gap = (v, ph) => v ? esc(v) : `<span class="l-gap">${ph}</span>`;
  const p = t => `<p>${t}</p>`;
  const ul = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  const C = (id, vals) => esc(VQ.fill(VQ.clause(id), vals || {}));
  /* the strap of a division logo, its letters spread to the width of the wordmark */
  VQ.strapFill = d => `<span class="strap fill" style="--sbg:${d.color};--sink:${d.ink}" role="img" aria-label="${esc(d.strap)}">${d.strap.split('').map(ch => ch === ' ' ? '<b class="sp"></b>' : `<b>${esc(ch)}</b>`).join('')}</span>`;
  const whName = code => (VQ.WAREHOUSES.find(w => w[0] === code) || [code, code])[1];

  function counter() {
    let a = 0, b = 0;
    return {
      reset() { a = 0; b = 0; },
      sec(t, id) { a++; b = 0; return `<h3${id ? ` id="${id}"` : ''}><span>${a}.</span>${t}</h3>`; },
      sub(t) { b++; return `<h4><span>${a}.${b}</span>${t}</h4>`; },
    };
  }

  /* one price cell, written the way the letters write it */
  function cell(q, c, r, ln, t) {
    if (c.type === 'label') return esc(M.text(q, t, r.l[c.key]));
    if (c.type === 'calc') return M.calc(q, t, r, c).text;
    if (c.type === 'info') return c.key === 'kmIncl' ? fmt.num(r.l[c.key]) : esc(r.l[c.key] || '');
    if (r.s[c.key] == null) return (r.t && r.t[c.key]) ? esc(r.t[c.key]).toUpperCase() : '–';
    if (ln.por[c.key]) return 'Available on request';
    if (ln.p[c.key] == null) return '<span class="l-gap">R 0,00</span>';
    return fmt.money(ln.p[c.key], c.dec);
  }
  /* a price table: only the rows that are in the quote; optionally only some columns */
  function table(q, bid, tid, keys) {
    const t = BLOCKS[bid].tables.find(x => x.id === tid);
    const cols = keys ? t.cols.filter(c => keys.includes(c.key)) : M.colsOf(q, t);
    const rows = M.rowsOn(q, bid, tid);
    if (!rows.length) return `<p class="l-gap">No rows selected for this table yet.</p>`;
    return `<table class="lt"><thead><tr>${cols.map(c => `<th>${esc(M.text(q, t, c.label))}</th>`).join('')}</tr></thead><tbody>${rows.map(({ r, ln }) =>
      `<tr>${cols.map(c => `<td class="${c.type === 'label' ? 'tl' : ''}">${cell(q, c, r, ln, t)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function inclItems(q, which) {
    const f = q.fuel || {};
    const vals = { collection: esc(q.profile.collection || 'your premises'), fuelPct: f.pct != null ? fmt.pct(f.pct) : '', fuelDate: fmt.date(f.date), fuelPrice: fmt.money(f.price) + 'c' };
    return (VQ.INCL[q.divId][which] || []).filter(([id]) => !q.inclOff[id]).map(([id, text]) =>
      esc(text).replace(/\{fee:(\w+)\}/g, (m, k) => fmt.money(M.fee(q, k))).replace(/\{(\w+)\}/g, (m, k) => vals[k] != null ? vals[k] : m));
  }

  function head(q) {
    const c = q.customer, k = q.contact, last = k.name ? k.name.trim().split(' ').slice(-1)[0] : '';
    return `<section class="l-meta" id="doc-top">
      <p>${fmt.date(q.quoteDate)}</p>
      <p><b>OUR REF: ${esc(M.ref(q))}</b></p>
      <div class="l-addr">
        <div>${p(gap(c.name, 'Company name'))}${p(gap(c.street, 'Street'))}${c.suburb ? p(esc(c.suburb)) : ''}${p(gap(c.town, 'Town'))}${p(gap(c.code, '0000'))}</div>
        <p>Account number: ${c.acc ? esc(c.acc) : (c.name ? 'to be opened' : '')}</p>
      </div>
      <p>Tel. No.: ${gap(c.tel, '(000) 000 0000')}</p>
      <p>Email: ${gap(k.email, 'name@company')}</p>
      <p class="l-att"><b><u>ATTENTION:</u>&nbsp; ${k.name ? esc(k.title + '. ' + k.name) : '<span class="l-gap">Contact person</span>'}</b></p>
      <p>Dear ${last ? esc(k.title + '. ' + last) : '<span class="l-gap">…</span>'},</p>
    </section>`;
  }

  function overtimeTable(q, bid, tid) {
    return table(q, bid, tid, [BLOCKS[bid].tables.find(x => x.id === tid).cols[0].key, 'ot1', 'ot2', 'ot3']);
  }

  function escalation(q, d, n) {
    const e = M.esc(q); let h = n.sec('ESCALATION', 'doc-terms');
    h += n.sub('Charges') + p(d.esc.min ? C('esccmin', { min: fmt.pct(d.esc.min, 1), next: fmt.dord(e.chargesNext) }) : C('escc', { day: e.chargesDay, next: fmt.dord(e.chargesNext) }));
    if (d.id !== 'vff') h += n.sub('Labour') + p(C('escl', { next: fmt.dord(e.labourNext) }));
    h += n.sub('Fuel') + p(d.fuelMode === 'perkm' ? C('fuelkm', fuelVals(q)) : d.fuelMode === 'surcharge' ? C(d.fuelClause || 'fuelsur', { pct: fmt.pct(q.fuel.pct), date: fmt.date(q.fuel.date), price: fmt.money(q.fuel.price) + 'c' }) : C('fuelsep'));
    return h;
  }
  function fuelVals(q) {
    const f = q.fuel || {}, br = r => VQ.BRANCHES.filter(b => b[2] === r).map(b => b[1]);
    const list = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0];
    return { date: fmt.date(f.date), inland: fmt.money(f.price), coastal: fmt.money(f.coastal), inlandBranches: list(br('inland')), coastalBranches: list(br('coastal')) };
  }
  function closing(q, d, n) {
    let h = '';
    if (q.terms.months && !d.noPeriod) h += n.sec('CONTRACT PERIOD') + p(`The contract duration will be for a period of ${q.terms.months} month${q.terms.months === 1 ? '' : 's'}, commencing on ${fmt.date(q.terms.start)}.`);
    h += n.sec('VALUE ADDED TAX') + p(C('vat'));
    h += n.sec('CONFIDENTIALITY') + p(C('conf', { division: d.name }));
    h += n.sec('TERMS OF PAYMENT') + p(C('pay', { days: q.terms.payDays })) + (d.id === 'vtr' ? p(C('account')) : '');
    if (q.terms.special && q.terms.special.trim()) h += n.sec('SPECIAL CONDITIONS') + p(esc(q.terms.special.trim()));
    h += n.sec('TERMS AND CONDITIONS') + p(C('tnc', { division: d.name, valid: 30 })) + p(C('accept'));
    return h;
  }
  function sign(q, d) {
    const u = M.user(q.owner);
    return `<section class="l-sign" id="doc-sign">
      <p>If any further information is required pertaining to the above, please do not hesitate to contact myself.</p>
      <p>${d.closing}</p>
      <div class="l-sigs">
        ${d.singleSign ? '' : `<div><i></i><b>${esc(u.name.toUpperCase())}</b><span>${esc(d.ownerTitle.toUpperCase())}</span><span>${u.phone}</span></div>`}
        <div><i></i><b>${esc(d.approver.name.toUpperCase())}</b><span>${esc(d.approver.title.toUpperCase())}</span></div>
      </div>
      <p class="l-signed"><b>SIGNED AT __________________ ON THIS ____ DAY OF _____________________</b></p>
      <div class="l-for"><i></i><b>FOR AND ON BEHALF OF ${esc((q.customer.name || 'COMPANY NAME').toUpperCase())}</b></div>
    </section>`;
  }

  /* ---------- Value Truck Rental: Transport Rates ---------- */
  function vtr(q, d) {
    const n = counter(); let h = '';
    const hire = M.selected(q, 'service'), labour = !!q.sel['vtr.labour'];
    const period = { 'vtr.daily': ['day', 'Day'], 'vtr.weekly': ['week', 'Week'], 'vtr.monthly': ['month', 'Month'] };
    if (!hire.length) h += `<p class="l-gap">The hire rates will appear here once a service is ticked.</p>`;
    hire.forEach(bid => {
      const b = BLOCKS[bid]; n.reset();
      h += `<h2 class="l-part">${b.heading}</h2>`;
      h += n.sec('RATES') + n.sub(b.tables[0].title) + table(q, bid, 't');
      if (b.note) h += p(b.note);
      const heavy = M.rowsOn(q, bid, 't').some(({ r }) => VQ.VEHICLES.find(v => v.k === r.veh).tons >= 12);
      if (heavy) h += p('Kindly note that vehicles from 12 Tons will only be supplied with Value Logistics drivers.');
      h += n.sub('Included in Rates') + p('The above rates include:') + ul(inclItems(q, 'included'));
      h += n.sub('Exclusions') + p('The above rates are exclusive of:') + ul(inclItems(q, 'excluded'));
      if (labour) {
        const rows = M.rowsOn(q, 'vtr.labour', 'rates');
        h += n.sec('LABOUR') + n.sub(`Labour Rates per ${period[bid][1]}`) + `<table class="l-at">${rows.map(({ r, ln }) =>
          `<tr><td>${esc(r.l.job)}</td><td>@</td><td>${fmt.money(ln.p[period[bid][0]])}</td></tr>`).join('')}</table>`;
      }
    });

    h += `<h2 class="l-part" id="doc-extras">GENERAL</h2>`; n.reset();
    if (labour) {
      h += n.sec('LABOUR') + n.sub('Working Hours and Overtime') + p(C('hours')) + overtimeTable(q, 'vtr.labour', 'rates') + p(C('driver')) + p(C('nbc'));
      h += n.sub('Sleep Out and Night Work Allowance') + table(q, 'vtr.labour', 'allow') + p(C('night'));
    }
    if (q.terms.dw === 'own') {
      h += n.sec('VEHICLE INSURANCE') + p(C('own', { insurer: gapText(q.terms.insurer, 'insurer'), policy: gapText(q.terms.policy, 'policy number'), from: gapText(fmt.date(q.terms.insFrom), 'date'), to: gapText(fmt.date(q.terms.insTo), 'date') }));
    } else {
      const seen = new Set();
      hire.forEach(bid => M.rowsOn(q, bid, 't').forEach(({ r }) => seen.add(r.veh)));
      const vs = VQ.VEHICLES.filter(v => seen.has(v.k) && v.contrib);
      h += n.sec('VEHICLE DAMAGE WAIVER') + n.sub('Vehicle Damage Contribution – Value’s Damage Waiver');
      if (vs.length) h += `<table class="lt"><thead><tr><th>Vehicle description</th><th>Damage contribution per incident ex VAT</th></tr></thead><tbody>${vs.map(v => `<tr><td class="tl">${esc(v.name)}</td><td>${fmt.money(v.contrib)}</td></tr>`).join('')}</tbody></table>`;
      h += p(C('dw'));
    }
    h += n.sec('VEHICLE RECOVERY') + p(C('recovery', { recovery: fmt.money(M.fee(q, 'recovery')) }));
    h += n.sec('TRAFFIC FINE MANAGEMENT') + p(C('fines', { fine: fmt.money(M.fee(q, 'fine')) }));
    if (q.sel['vtr.tyres']) h += n.sec('REPAIR COSTS FOR TYRES') + table(q, 'vtr.tyres', 't') + p('The above rates are exclusive of the cost for repairs, labour, replacement tyres, factory assessment reports and other costs related to damages/repairs.');
    if (q.sel['vtr.delivery']) h += n.sec('DELIVERY AND COLLECTION CHARGES') + p('Delivery and collection fees will be charged as follows:') + table(q, 'vtr.delivery', 't');
    h += n.sec('GOODS IN TRANSIT INSURANCE') + p(C('gitx'));
    h += escalation(q, d, n);
    h += n.sec('PAYLOADS') + p(C('payloads'));
    h += closing(q, d, n);
    return h;
  }
  const gapText = (v, ph) => v || `[${ph}]`;

  /* ---------- Value Film Fleet: Feature Rates ---------- */
  function vff(q, d) {
    let h = ''; const n = counter(), f = q.profile.film, t = q.terms, on = id => !!q.sel[id];
    if (f.production) h += p(`<b>Production: ${esc(f.production)}</b>`);
    if (f.start && f.end) h += p(`Shoot dates: ${fmt.date(f.start)} to ${fmt.date(f.end)} (${M.weeks(q)} week${M.weeks(q) > 1 ? 's' : ''}), unit base ${esc(f.base)}.`);
    if (!on('vff.weekly')) return h + `<p class="l-gap">The rates will appear here once weekly hire is ticked.</p>`;
    h += n.sec('RATES') + n.sub('Vehicle Description and Rates') + table(q, 'vff.weekly', 't');
    h += p('Vehicles will be subject to availability and rates are based on a 6 day week.');
    h += p(`Kindly note that should we not have received the proxies from you by the end of the shoot, an additional ${fmt.money(M.fee(q, 'proxy'))} will be invoiced to cover any outstanding fines incurred during the shoot.`);
    h += p('The Customer indemnifies and holds Value harmless against any and all bodily injury, death, losses, liabilities, damages, costs and expenses of any nature which may arise as a result of, or in connection with, the use of the vehicles.');
    h += n.sub('Included in Rates') + p('The above rates include:') + ul(inclItems(q, 'included'));
    h += n.sub('Exclusions') + p('The above rates are exclusive of:') + ul(inclItems(q, 'excluded'));
    h += n.sec('LABOUR') + p(`${esc(q.customer.name || 'The production')} shall make use of its own labour.`);
    h += n.sec('INSURANCE', 'doc-terms') + p(C('own', { insurer: t.insurer || '[insurer]', policy: t.policy || '[policy number]', from: t.insFrom ? fmt.date(t.insFrom) : '[date]', to: t.insTo ? fmt.date(t.insTo) : '[date]' }))
      + p(`Cover is stated at ${t.cover ? fmt.money(t.cover) : '[value]'} per vehicle. For vehicles with a value above this, a new insurance letter will be required. Should you or your insurance company wish to assess vehicle damage, please do so within 5 days of receiving the repair quotation.`);
    h += `<div id="doc-extras">${n.sec('E-TAGS')}${p(`E-tags can be fitted at an additional cost of ${fmt.money(M.fee(q, 'etag'))} per vehicle, per month, excluding actual toll gate fees. Toll gate fees will be administered by Value Logistics and recovered from you at cost plus a 15% administration fee.`)}</div>`;
    h += n.sec('VEHICLE RECOVERY') + p(C('recovery', { recovery: fmt.money(M.fee(q, 'recovery')) }));
    h += n.sec('TRAFFIC FINE MANAGEMENT') + p(C('fines', { fine: fmt.money(M.fee(q, 'fine')) }));
    if (on('vff.tyres')) h += n.sec('REPAIR COSTS FOR TYRES') + table(q, 'vff.tyres', 't') + p('The above rates are exclusive of the cost for repairs, labour, replacement tyres, factory assessment reports and other costs related to damages/repairs.');
    if (on('vff.delivery')) h += n.sec('DELIVERY AND COLLECTION CHARGES') + p('Delivery and collection fees will be charged as follows:') + table(q, 'vff.delivery', 't');
    h += n.sec('DISPATCHING OF VEHICLES') + p(C('dispatch'));
    h += n.sec('GOODS IN TRANSIT INSURANCE') + p(C('gitx'));
    h += escalation(q, d, n);
    h += n.sec('PAYLOADS') + p(C('payloads'));
    h += n.sec('AIRCRAFT LIABILITY') + p(C('aircraft'));
    h += closing(q, d, n).replace(/(TERMS OF PAYMENT<\/h3><p>[^<]*<\/p>)/, '$1' + p(C('credit')));
    return h;
  }

  /* ---------- Value Chemical Logistics: Distribution Rates Schedule ---------- */
  function vcl(q, d) {
    let h = ''; const on = id => !!q.sel[id], n = counter(), v = q.profile.vcl;
    const lanes = bid => table(q, bid, 't').replace('class="lt"', 'class="lt l-box"') + `<p class="l-cap">Kindly note that a volumetric factor of 4 000 shall apply.</p>`;
    if (!M.selected(q, 'service').length) return `<p class="l-gap">The rates will appear here once a service is ticked.</p>`;
    if (on('vcl.xis')) {
      h += `<h2 class="l-part">TERTIARY DISTRIBUTION RATES</h2>` + n.sec('RATES') + n.sub('Inter Branch Transfers (warehouse to warehouse only, excludes delivery to customer) – Service Type XIS') + lanes('vcl.xis');
    }
    if (on('vcl.exp') || on('vcl.eco') || on('vcl.decant')) {
      n.reset(); h += `<h2 class="l-part">SECONDARY DISTRIBUTION RATES</h2>` + n.sec('RATES');
      if (on('vcl.exp')) h += n.sub('Destinations and Rates (delivery from secondary hub to final customer) – Service Type EXP') + lanes('vcl.exp');
      if (on('vcl.eco')) h += n.sub('Destinations and Rates (delivery from secondary hub to final customer) – Service Type ECO') + lanes('vcl.eco');
      if (on('vcl.decant')) h += n.sub('Break Bulk Decanting') + table(q, 'vcl.decant', 't');
    }
    h += n.sub('Inclusions') + p('The above rates include:') + ul(inclItems(q, 'included').filter((x, i) => on('vcl.decant') || i === 0));
    h += n.sub('Exclusions') + p('The above rates are exclusive of:') + ul(inclItems(q, 'excluded').filter(x => on('vcl.decant') || !/Tanks/.test(x)));
    n.reset(); h += `<h2 class="l-part" id="doc-extras">GENERAL</h2>`;
    if (on('vcl.sur')) h += n.sec('SURCHARGES PER CONSIGNMENT') + `<table class="l-at">${M.rowsOn(q, 'vcl.sur', 't').map(({ r, ln }) => `<tr><td>${esc(r.l.item)}</td><td>@</td><td>${ln.por.amt ? 'Available on request' : fmt.money(ln.p.amt)}</td></tr>`).join('')}</table>` + p('Re-deliveries will be charged at standard rates.');
    h += n.sec('PROOFS OF DELIVERY') + p(C('pods'));
    const haz = VQ.HAZ.filter(x => v.haz.includes(x[0]));
    h += n.sec('DANGEROUS GOODS') + p(haz.length ? `The above rates are based on the transport of the following dangerous goods: ${esc(haz.map(x => x[1] + ', ' + x[2].toLowerCase()).join('; '))}.` : '<span class="l-gap">The dangerous goods classes carried will be listed here.</span>') + p(C('dg'));
    h += n.sec('GOODS IN TRANSIT RISK ACCEPTANCE') + p(C('gitr', { max: q.terms.gitMax ? fmt.money(q.terms.gitMax) : '[maximum value]' })) + p(C('vclclaim'));
    h += escalation(q, d, n);
    h += closing(q, d, n);
    return h;
  }

  /* ---------- Value Dedicated Distribution: National Transport Rates ---------- */
  function vdd(q, d) {
    let h = ''; const n = counter(), on = id => !!q.sel[id], fb = M.fleetBranches(q);
    const bname = c => VQ.BRANCHES.find(b => b[0] === c)[1];
    const fleetBr = fb.length ? fb : VQ.BRANCHES.map(b => b[0]);
    if (fb.length) h = `<p><b>For ${esc(fb.map(bname).join(', ').replace(/, ([^,]*)$/, ' and $1'))}</b></p>`;
    if (!M.selected(q, 'service').length) return h + `<p class="l-gap">The rates will appear here once a service is ticked.</p>`;
    const incl = () => n.sub('Included in Rates') + p('The above rates include:') + ul(inclItems(q, 'included')) + n.sub('Exclusions') + p('The above rates are exclusive of:') + ul(inclItems(q, 'excluded'));
    if (on('vdd.core')) {
      const t = BLOCKS['vdd.core'].tables[0], rows = M.rowsOn(q, 'vdd.core', 't'); let body = '';
      VQ.DD_VEH.forEach(v => {
        const mine = rows.filter(x => x.r.veh === v.k); if (!mine.length) return;
        body += mine.map(({ r, ln }, i) => `<tr>${i ? '' : `<td class="tl" rowspan="${mine.length}">${esc(v.name)}</td>`}<td class="tl">${esc(r.l.branch)}</td>${['qty', 'month', 'maint', 'fuelp', 'fuelkm'].map(k => `<td>${cell(q, t.cols.find(c => c.key === k), r, ln, t)}</td>`).join('')}</tr>`).join('');
        if (fb.length) body += `<tr class="l-tot"><td colspan="2">TOTAL</td><td>${fmt.num(mine.reduce((a, x) => a + M.calc(q, t, x.r, { key: 'qty' }).v, 0))}</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
      });
      h += `<h2 class="l-part">${BLOCKS['vdd.core'].heading}</h2>` + n.sec('RATES') + n.sub('Vehicle Description and Rates')
        + `<table class="lt"><thead><tr><th>Vehicle description</th><th>Branch</th><th>Quantity per branch</th><th>Rate per vehicle per month</th><th>Maintenance rate (billed from 1st km)</th><th>Fuel price</th><th>Fuel rate per kilometre (billed from 1st km)</th></tr></thead><tbody>${body}</tbody></table>`
        + p('The above fuel rate per kilometre is based on the fuel consumptions below.') + incl();
      if (on('vdd.labour')) {
        const lr = M.rowsOn(q, 'vdd.labour', 't'), crew = q.profile.crew, hasQty = lr.some(({ r }) => Object.values(crew[r.id] || {}).some(Boolean));
        h += n.sec('LABOUR – CONTRACTUAL FLEET');
        if (hasQty) {
          const tot = lr.reduce((a, { r }) => a + fleetBr.reduce((b, c) => b + ((crew[r.id] || {})[c] || 0), 0), 0);
          h += n.sub('Labour Quantity') + `<table class="lt"><thead><tr><th>Categories</th>${fleetBr.map(c => `<th>${esc(bname(c))}</th>`).join('')}</tr></thead><tbody>${lr.map(({ r }) => `<tr><td class="tl">${esc(r.l.job)}</td>${fleetBr.map(c => `<td>${(crew[r.id] || {})[c] || '-'}</td>`).join('')}</tr>`).join('')}<tr class="l-tot"><td>TOTAL</td><td colspan="${fleetBr.length}">${fmt.num(tot)}</td></tr></tbody></table>`;
        }
        h += n.sub('Labour Rates and Working Hours') + p(C('hours')) + table(q, 'vdd.labour', 't') + n.sub('Overtime') + p(C('nbc'));
      }
      if (on('vdd.allow')) h += n.sub('Sleep-out, Dual Man and Night Work Allowances') + table(q, 'vdd.allow', 't') + p('Sleep-out allowance applies from 22h00, should a driver or crew sleep away from the depot or residential address, or when the interval between shifts is less than 9 hours. ' + VQ.clause('night'));
      const classes = [...new Set(rows.map(x => x.r.cls))].sort((a, b) => a - b);
      h += n.sec('FUEL CONSUMPTION') + `<table class="lt"><thead><tr><th>Region</th>${classes.map(c => `<th>${c} ton vehicles km/ℓ</th>`).join('')}</tr></thead><tbody>${fleetBr.map(b => `<tr><td class="tl">${esc(bname(b))}</td>${classes.map(c => `<td>${fmt.num(VQ.CONS[c][b], 2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        + p('The above fuel consumption will be reviewed every six months and will be adjusted in line with the actual operational measurements.');
    }
    if (on('vdd.adhoc')) {
      n.reset(); h += `<h2 class="l-part">${BLOCKS['vdd.adhoc'].heading}</h2>` + n.sec('RATES') + n.sub('Daily Ad Hoc Fleet') + table(q, 'vdd.adhoc', 'day') + n.sub('Monthly Ad Hoc Fleet') + table(q, 'vdd.adhoc', 'month') + p('The above fuel rate per kilometre is based on the average fuel consumption of the inland and coastal branches.');
    }
    if (on('vdd.cube')) {
      n.reset(); h += `<h2 class="l-part">${BLOCKS['vdd.cube'].heading}</h2>` + n.sec('RATES') + table(q, 'vdd.cube', 't') + n.sub('Included in Rates') + ul(['Hub Rental', 'Vehicle Charge', 'Driver/Required Crew', 'Loading/Checking Team', 'Supervision and Contract Management', 'Overtime', 'Tracking', 'Trolleys', 'Replacement Vehicles', 'Damage Waiver and Contribution', 'Stated Goods In Transit Risk Acceptance', 'Contract Fees']);
    }
    n.reset(); h += `<h2 class="l-part" id="doc-extras">GENERAL</h2>`;
    if (on('vdd.mgmt')) {
      const t = BLOCKS['vdd.mgmt'].tables[0], cols = M.colsOf(q, t), rows = M.rowsOn(q, 'vdd.mgmt', 't');
      h += n.sec('ON-SITE MANAGEMENT / HEAD OFFICE') + `<table class="lt"><thead><tr>${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(({ r, ln }) => `<tr>${cols.map(c => `<td class="${c.type === 'label' ? 'tl' : ''}">${cell(q, c, r, ln, t)}</td>`).join('')}</tr>`).join('')}
        <tr class="l-tot"><td>TOTAL PER MONTH</td>${cols.slice(1).map(c => `<td>${fmt.money(rows.reduce((a, x) => a + (x.ln.p[c.key] || 0), 0))}</td>`).join('')}</tr></tbody></table>`;
    }
    if (on('vdd.addons')) h += n.sec('VEHICLE ADDITIONS') + table(q, 'vdd.addons', 't') + p('Operation software, implementation, integration and development costs are excluded from the above rates.');
    const seen = new Set(M.rowsOn(q, 'vdd.core', 't').map(x => x.r.veh)), gv = VQ.DD_VEH.filter(v => !seen.size || seen.has(v.k));
    h += n.sec('GOODS IN TRANSIT RISK ACCEPTANCE') + p('Goods in transit risk acceptance to the values stated below per load, on the cost price of your product, is included in the quoted rates. Any claim above the stated amounts (including VAT) shall be for your account.')
      + `<table class="lt"><thead><tr><th>Vehicle description</th><th>Maximum load value (including VAT)</th></tr></thead><tbody>${gv.map(v => `<tr><td class="tl">${esc(v.name)}</td><td>${fmt.money(v.git)}</td></tr>`).join('')}</tbody></table>`
      + p('It is specifically recorded that this is not insurance cover, but risk acceptance. There shall be no damage contribution payable by you.');
    h += n.sec('DAMAGE WAIVER AND VEHICLE DAMAGE CONTRIBUTION') + p(C('dwinc'));
    h += n.sec('VEHICLE TRACKING AND REPLACEMENT VEHICLES') + p(C('repl'));
    h += n.sec('FLEXIBILITY') + p(C('flex'));
    h += n.sec('PAYLOADS') + p(C('payloads'));
    h += escalation(q, d, n);
    h += closing(q, d, n);
    return h;
  }

  /* ---------- Value Express: Rates Schedule ---------- */
  function exp(q, d) {
    const n = counter(); let h = '', f = q.fuel || {};
    const on = id => !!q.sel[id];
    if (!M.selected(q, 'service').length) return `<p class="l-gap">The rates will appear here once a service is ticked.</p>`;
    if (on('exp.dom') || on('exp.box')) {
      h += n.sec('RATES – DOMESTIC SERVICES AND TARIFFS');
      if (on('exp.dom')) {
        const rows = M.rowsOn(q, 'exp.dom', 't');
        h += n.sub('Domestic Express – Collections') + `<table class="lt"><thead><tr><th>Service type</th><th>Centres</th><th>Volumetric factor</th><th>Delivery details</th><th>Minimum per consignment</th><th>Rate</th></tr></thead><tbody>${rows.map(({ r, ln }) => {
          const min = ln.por.min ? 'Available on request' : `${fmt.money(ln.p.min)} for ${r.minKg} kg’s`, kg = ln.por.kg ? 'Available on request' : `${fmt.money(ln.p.kg)} per kg`;
          return `<tr><td class="tl">${esc(r.l.svc)}</td><td>${esc(r.l.ctr)}</td><td>${fmt.num(r.factor)}</td><td>${esc(r.l.det)} (as per route guide)</td><td>${min}</td><td>${kg}</td></tr>`; }).join('')}</tbody></table>`
          + p('Delivery standards are subject to mode of transport and route guide. Should you require more information with regards to the route guide kindly contact the sales representative.');
      }
      if (on('exp.box')) h += n.sub('Distribution Rate per Box – Overnight Express') + p('Overnight Express is charged per box at the rates in Annexure A, below. The box dimensions are those listed in Annexure B.') + table(q, 'exp.box', 't').replace('class="lt"', 'class="lt l-box"') + p(C('boxvol'));
      h += n.sub('Exclusions') + p('The rates as stated above are exclusive of:') + ul(inclItems(q, 'excluded'));
    }
    if (on('exp.inhouse')) {
      const ln = M.line(q, 'exp.inhouse', 'min', 'spend');
      h += n.sec('IN-HOUSE OPERATION') + n.sub('Monthly In-House Charges') + p(C('inhouse', { min: fmt.money(ln && ln.p.amt) }));
      h += n.sub('Working Hours and Overtime') + p(C('hours')) + table(q, 'exp.inhouse', 'ot') + n.sub('Night Work Allowance') + p(C('night') + ' A night work allowance of R22,00 is paid from the second hour and R4,83 per hour for every hour worked thereafter.');
    }
    if (on('exp.sur')) {
      h += `<div id="doc-extras">${n.sec('DOMESTIC SURCHARGES')}` + p('Surcharge per waybill in addition to the rates:')
        + `<table class="l-at">${M.rowsOn(q, 'exp.sur', 't').map(({ r, ln }) => `<tr><td>${esc(r.l.item)}</td><td>=</td><td>${ln.por.amt ? 'Available on request' : fmt.money(ln.p.amt)}</td></tr>`).join('')}</table></div>`;
    }
    h += n.sec('CROSS BORDER SERVICES & TARIFFS') + p('Cross border rates are available on request.');
    if (on('exp.intl')) {
      const rows = M.rowsOn(q, 'exp.intl', 't'), zs = [3, 4, 5, 6, 7, 8];
      h += n.sec('INTERNATIONAL SERVICES & TARIFFS') + n.sub('Value Express – International Tariff Schedule')
        + `<table class="lt l-intl"><thead><tr><th rowspan="2">Weight</th>${zs.map(z => `<th colspan="2">Zone ${z}</th>`).join('')}</tr><tr>${zs.map(() => '<th>Docs</th><th>Non docs</th>').join('')}</tr></thead><tbody>${rows.map(({ r, ln }) =>
          `<tr><td><b>${esc(r.l.w)}</b></td>${zs.map(z => ['d', 'n'].map(k => `<td>${ln.por['z' + z + k] ? 'POR' : fmt.money(ln.p['z' + z + k], 0)}</td>`).join('')).join('')}</tr>`).join('')}</tbody></table>`
        + p(C('intlx'));
    }
    if (on('exp.cartage')) {
      if (M.rowsOn(q, 'exp.cartage', 'air').length) h += n.sec('AIRFREIGHT IMPORT TRANSPORT') + table(q, 'exp.cartage', 'air') + p('The rates include fuel as at ' + fmt.date(f.date) + ' and exclude crew, overtime, sleep-out allowance, toll gate fees, goods in transit insurance and VAT.');
      if (M.rowsOn(q, 'exp.cartage', 'hv').length) h += n.sec('HIGH VALUE SHIPMENTS') + table(q, 'exp.cartage', 'hv') + p('The rates include an armed driver, armed crew and two armed officers in their own support vehicles.');
    }
    h += escalation(q, d, n);
    h += closing(q, d, n);
    return h;
  }

  /* ---------- Value Warehousing: Warehousing Rates Schedule ---------- */
  function whs(q, d) {
    const n = counter(); let h = '';
    const ws = q.profile.warehouses || [], y2 = M.hasY2(q), services = M.selected(q, 'service');
    if (!ws.length || !services.length) h += `<p class="l-gap">The rates will appear here once a warehouse and a service are ticked.</p>`;
    else {
      h += n.sec('INDICATIVE COSTS');
      ws.forEach(code => {
        const span = y2 ? 4 : 3;
        let rows = '';
        services.forEach(bid => {
          const t = BLOCKS[bid].tables.find(x => x.id === code), on = M.rowsOn(q, bid, code);
          if (!on.length) return;
          rows += `<tr class="l-grp"><td colspan="${span}">${esc(BLOCKS[bid].cat)}</td></tr>` + on.map(({ r, ln }) =>
            `<tr><td class="tl">${esc(M.text(q, t, r.l.act))}</td><td class="tl">${esc(r.l.unit)}</td><td>${cell(q, t.cols[2], r, ln, t)}</td>${y2 ? `<td>${cell(q, t.cols[3], r, ln, t)}</td>` : ''}</tr>`).join('');
        });
        h += n.sub(`Rates – ${whName(code)}`) + `<table class="lt"><thead><tr><th>Description</th><th>Charged</th><th>${esc(M.yearText(q, 1))}</th>${y2 ? `<th>${esc(M.yearText(q, 2))}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table>`;
      });
      const t0 = [];
      ws.forEach(code => {
        const w = q.profile.wh[code] || { vol: {} }; let rows = '';
        services.forEach(bid => {
          const t = BLOCKS[bid].tables.find(x => x.id === code);
          M.rowsOn(q, bid, code).forEach(({ r }) => {
            if (/^st-b/.test(r.id)) return;
            if (w.vol[r.id]) rows += `<tr><td class="tl">${esc(M.text(q, t, r.l.act))}</td><td class="tl">${esc(BLOCKS[bid].cat)}</td><td>${fmt.num(w.vol[r.id])}${r.id === 'st-half' ? ' a month' : ' a year'}</td></tr>`;
          });
        });
        if (w.pallets && q.sel['whs.store']) rows = `<tr><td class="tl">Pallets stored</td><td class="tl">STORAGE</td><td>${fmt.num(w.pallets)} a month</td></tr>` + rows;
        if (rows) t0.push(n.sub(`Volumes – ${whName(code)}`) + `<table class="lt"><thead><tr><th>Description</th><th>Category</th><th>Volume</th></tr></thead><tbody>${rows}</tbody></table>`);
      });
      if (t0.length) h += t0.join('') + p(C('whvol'));
    }
    if (q.sel['whs.consum']) h += `<div id="doc-extras">${n.sub('Fixed Rate for Consumables')}${table(q, 'whs.consum', 't')}</div>` + p('Consumables and packaging material will be billed separately on a month to month basis depending on the amount used for each month. There will be a 10% admin fee chargeable for the ordering and procurement of the packaging materials.');
    h += n.sub('Included in Package') + ul(inclItems(q, 'included'));
    h += n.sub('Exclusions') + ul(inclItems(q, 'excluded'));
    if (q.sel['whs.labour']) {
      h += n.sec('LABOUR') + n.sub('Ad hoc Labour (Normal Time Rates)') + p('In the event that additional labour is required for support activities such as rework and product bundling or any other additional activities, the following labour rates will apply:') + table(q, 'whs.labour', 'adhoc');
      h += n.sub('Working Hours and Overtime') + p(C('hours')) + table(q, 'whs.labour', 'ot') + p(C('nbc')) + n.sub('Night Work Allowance') + p(C('night'));
    }
    if (q.sel['whs.transport']) {
      h += n.sec('OVERTIME TRANSPORT') + p('In the event that overtime is required to be worked and the staff have to be transported after hours, the following rates will apply:');
      ws.forEach(code => { if (M.rowsOn(q, 'whs.transport', code).length) h += `<p class="l-cap">${whName(code)}</p>` + table(q, 'whs.transport', code); });
      h += p('The above rates are based on a single trip and a trip consists of a maximum of 8 staff members. Transport will be provided after 18h30.');
    }
    if (ws.length) h += n.sec('LOCATION OF WAREHOUSE') + p(`The warehouse${ws.length > 1 ? 's are' : ' is'} located in ${ws.map(whName).join(' and ')}.`);
    h += n.sec('WAREHOUSE INSURANCE FOR YOUR PRODUCT', 'doc-terms') + p('Warehouse insurance for your product is not included in this rates schedule ______________________ INITIAL') + p(C('whins'));
    const e = M.esc(q);
    h += n.sec('ESCALATION') + n.sub('Charges') + p(C('escann', { what: 'Charges', next: fmt.dord(e.chargesNext) })) + n.sub('Labour') + p(C('escann', { what: 'Labour', next: fmt.dord(e.labourNext) }));
    h += closing(q, d, n);
    return h;
  }

  /* ---------- Value Logistics: Distribution Rates Schedule ---------- */
  function log(q, d) {
    const n = counter(); let h = '';
    const on = id => !!q.sel[id], f = q.fuel || {};
    const two = bid => `<p class="l-cap">Minimum Charges</p>${table(q, bid, 'min')}<p class="l-cap">Rate per kg thereafter</p>${table(q, bid, 'kg')}`;
    if (!M.selected(q, 'service').length) h += `<p class="l-gap">The rates will appear here once a service is ticked.</p>`;

    if (on('log.dist') || on('log.rev')) {
      h += n.sec('RATES');
      if (on('log.dist')) h += n.sub(`Ex ${esc(q.profile.origin)}`) + two('log.dist') + p('<b>Inclusions</b> — the above rates are inclusive of:') + ul(inclItems(q, 'included'));
      if (on('log.rev')) h += n.sub(BLOCKS['log.rev'].heading) + two('log.rev');
      h += n.sub('Exclusions') + p('The above rates are exclusive of:') + ul(inclItems(q, 'excluded'));
      h += n.sub('Conditions of Rates') + ul([`A volumetric factor of ${fmt.num(q.profile.factor)} shall apply.`, 'Consolidation of consignments on the same day with the same service type to the same consignee.',
        'Value Logistics will not pick up any stock or returns from your customers or any other party that has not been delivered by Value Logistics.']);
      if (on('log.sur')) h += `<div id="doc-extras">${n.sub('Surcharges Per Consignment')}${table(q, 'log.sur', 't')}</div>`;
      if (on('log.fees')) {
        const rows = M.rowsOn(q, 'log.fees', 't').filter(({ r }) => r.id !== 'doc' && r.id !== 'obdoc');
        if (rows.length) h += n.sub('Other Charges') + ul(rows.map(({ r, ln }) => `${esc(r.l.item)} @ ${fmt.money(ln.p.amt)} ${esc(r.l.unit)}`));
      }
    }
    if (on('log.border')) {
      h += n.sec('OVER BORDER ROAD FREIGHT RATES') + n.sub(`Ex ${esc(q.profile.origin)}`);
      BLOCKS['log.border'].tables.forEach(t => { if (M.rowsOn(q, 'log.border', t.id).length) h += `<p class="l-cap">${t.title}</p>` + table(q, 'log.border', t.id); });
      h += n.sub('Exclusions') + ul([`Documentation/Administration Fees of ${fmt.money(M.fee(q, 'doc'))} per Invoice`, `Over Border Documentation Fees of ${fmt.money(M.fee(q, 'obdoc'))} per Invoice`,
        `${fmt.pct(f.pct)} Fuel Surcharge as at ${fmt.date(f.date)} at ${fmt.money(f.price)}c per litre`, 'Goods In Transit Insurance', 'VAT']);
    }
    if (q.profile.consignments) {
      const v = M.volumes(q), s = q.profile.split;
      h += n.sec('QUOTATION PARAMETERS') + `<table class="lt l-par"><thead><tr><th colspan="2">Parameters</th></tr></thead><tbody>
        <tr><td class="tl">Average chargeable mass per month</td><td>${fmt.num(v.chargeable)}</td></tr>
        <tr><td class="tl">Average actual mass per month</td><td>${fmt.num(q.profile.actualKg)}</td></tr>
        <tr><td class="tl">Average cubic metres per month</td><td>${fmt.num(q.profile.cube, 2)}</td></tr>
        <tr><td class="tl">Average consignments per month</td><td>${fmt.num(q.profile.consignments)}</td></tr>
        <tr><td class="tl">Average kg’s per delivery</td><td>${fmt.num(v.perDrop, 2)}</td></tr>
        <tr><td class="tl">Average cubic metres per delivery</td><td>${fmt.num(v.cubePerDrop, 2)}</td></tr>
        <tr><td class="tl">Drop type split: retail / distribution centre / front doors</td><td>${fmt.pct(s.retail, 1)} / ${fmt.pct(s.dc, 1)} / ${fmt.pct(s.door, 1)}</td></tr>
      </tbody></table>` + p(C('params'));
    }
    if (on('log.inhouse')) {
      const sc = M.rowsOn(q, 'log.inhouse', 't');
      h += n.sec('IN-HOUSE OPERATION') + n.sub('Monthly In-House Charges') + p('You will be responsible for all in-house charges associated with the operation.');
      h += p(`The in-house operation will be charged at ${sc.length ? fmt.money(sc.reduce((a, x) => a + (x.ln.p.month || 0), 0)) : ''} per month and will consist of the following:`) + ul(sc.map(({ r }) => `1 x ${esc(r.l.job)}`));
      h += n.sub('Working Hours and Overtime') + p(C('hours')) + overtimeTable(q, 'log.inhouse', 't') + p(C('nbc')) + n.sub('Night Work Allowance') + p(C('night'));
    }
    h += n.sec('IT INTERFACE') + p(C('interface'));
    h += n.sec(q.terms.git === 'risk' ? 'GOODS IN TRANSIT RISK ACCEPTANCE' : 'GOODS IN TRANSIT INSURANCE') + p(q.terms.git === 'risk' ? C('gitr', { max: q.terms.gitMax ? fmt.money(q.terms.gitMax) : '[maximum value]' }) : C('gitx'));
    h += escalation(q, d, n);
    h += closing(q, d, n);
    return h;
  }

  VQ.doc = {
    render(q) {
      const d = M.div(q.divId);
      const dmy = s => { const [y, m, dd] = s.split('-'); return `${dd}/${m}/${y.slice(2)}`; };
      if (q.lite) return `<article class="letter l-none"><p>The letter for ${esc(d.name)} is not built in this mockup.</p><p>It walks Truck Rental and Logistics. The other five divisions would use the same screens with their own service blocks.</p></article>`;
      const state = (q.status === 'draft' || q.status === 'awaiting') ? `<div class="l-draft">Draft — ${q.status === 'awaiting' ? 'waiting for approval' : 'not yet approved'}</div>` : '';
      const logo = !d ? `<img class="l-logo l-logo-plain" src="assets/value-wordmark.png" alt="Value">`
        : d.logo ? `<img class="l-logo" src="${d.logo}" alt="${esc(d.name)}">`
        : `<span class="lockup l-lock"><img src="assets/value-wordmark.png" alt="Value">${VQ.strapFill(d)}</span>`;
      const body = !d ? `<p class="l-gap">Choose a division and its services, and the rest of the letter takes shape here.</p>`
        : `<h2 class="l-title" id="doc-rates">${d.title}</h2>${d.opener ? p(esc(VQ.fill(d.opener, { date: fmt.date(q.fuel && q.fuel.date), price: fmt.money(q.fuel && q.fuel.price) + 'c', coastal: fmt.money(q.fuel && q.fuel.coastal) + 'c' }))) : ''}${({ vtr, log, whs, exp, vdd, vcl, vff })[d.id](q, d)}${sign(q, d)}`;
      return `<article class="letter" style="--div:${d ? d.color : '#782890'}">${state}
        <header class="l-head"><img class="l-arrow" src="assets/brand-arrow.png" alt="">${logo}</header>
        ${head(q)}${body}
        <footer class="l-foot"><p class="l-init">Initial quote date: ${dmy(q.initialDate)}</p><p>${((d && d.footer) || VQ.LEGAL_FOOTER).join('<br>')}</p></footer>
      </article>`;
    },
  };
})(window.VQ);
