/* =====================================================================
   Value Quoting — mockup screens
   Quotes list, the eight guided steps, approvals, the quote page, set-up.
   ===================================================================== */
(function (VQ) {
  'use strict';
  const { fmt, BLOCKS, DIVISIONS } = VQ, M = VQ.model, esc = VQ.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const root = () => $('#app');

  const STATUS = { draft: 'Draft', awaiting: 'Awaiting approval', approved: 'Approved', sent: 'Sent', accepted: 'Accepted', declined: 'Declined', expired: 'Expired' };
  const FLOW = ['draft', 'awaiting', 'approved', 'sent', 'accepted'];
  const STEPS = ['Customer', 'Services', 'Profile', 'Prices', 'Extras', 'Terms', 'Approve', 'Send'];
  const ui = { calc: { l: 40, w: 35, h: 38, a: 10.4 }, filter: 'all', div: '', search: '', mine: false, tab: 'letter', showOff: {}, peek: null, cust: '', sideOpen: false, setup: { tab: 'rates', div: 'vtr', block: 'vtr.monthly' }, dlg: null };
  let cur = null, curStep = 1, sideTimer = null;

  /* ---------- small pieces ---------- */
  const svg = d => `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const IC = {
    check: svg('<path d="M3 8.5l3.2 3.2L13 4.8"/>'), x: svg('<path d="M4 4l8 8M12 4l-8 8"/>'), plus: svg('<path d="M8 3v10M3 8h10"/>'),
    left: svg('<path d="M10 3L5 8l5 5"/>'), right: svg('<path d="M6 3l5 5-5 5"/>'), lock: svg('<rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/>'),
    alert: svg('<path d="M8 2.5l6 10.5H2L8 2.5zM8 6.5v3M8 11.5v.2"/>'), doc: svg('<path d="M4 2h5l3 3v9H4V2zM9 2v3h3"/>'),
  };
  const strap = (d, cls) => d ? `<span class="strap ${cls || ''}" style="--sbg:${d.color};--sink:${d.ink}">${esc(d.strap)}</span>` : '';
  /* in a logo lockup the strap's letters are spread to the width of the wordmark, as on the real logos */
  const strapFill = d => VQ.strapFill(d);
  const status = s => `<span class="status st-${s}"><i></i>${STATUS[s]}</span>`;
  const estText = q => { const e = M.estimate(q); return e == null ? null : fmt.short(e); };
  const services = q => q.lite ? q.lite : M.selected(q, 'service').map(b => BLOCKS[b].name).join(', ') || 'Nothing chosen yet';
  const setPath = (o, path, v) => { const k = path.split('.'); const last = k.pop(); k.reduce((a, x) => a[x], o)[last] = v; };
  const getPath = (o, path) => path.split('.').reduce((a, x) => a == null ? a : a[x], o);
  const go = path => { const h = '#/' + path; if (location.hash === h) route(); else location.hash = h; };

  function toast(msg) {
    let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2600);
  }
  function setNav(name) {
    $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === name));
    const n = M.store.quotes.filter(q => q.status === 'awaiting').length, b = $('#nav-badge');
    b.textContent = n; b.hidden = !n;
  }

  /* ---------- routing ---------- */
  function route() {
    const [a, b, c, d] = location.hash.replace(/^#\/?/, '').split('/');
    closeDialog();
    if (a === 'quote' && b) {
      const q = M.get(b); if (!q) return go('quotes');
      return c === 'step' ? viewWizard(q, Math.min(8, Math.max(1, parseInt(d, 10) || 1))) : viewQuote(q);
    }
    if (a === 'approvals') return viewApprovals(b);
    if (a === 'setup') return viewSetup(b);
    return viewQuotes();
  }
  const page = (cls, html) => { cur = null; const r = root(); r.className = 'app-page ' + cls; r.innerHTML = html; window.scrollTo(0, 0); };

  /* =====================================================================
     1. Quotes list
     ===================================================================== */
  function listRows() {
    const s = ui.search.trim().toLowerCase();
    return M.store.quotes.filter(q => !q.superseded)
      .filter(q => ui.filter === 'all' || q.status === ui.filter)
      .filter(q => !ui.div || q.divId === ui.div)
      .filter(q => !ui.mine || q.owner === VQ.ME)
      .filter(q => !s || (q.customer.name + ' ' + M.ref(q) + ' ' + q.customer.acc).toLowerCase().includes(s));
  }
  function listBody() {
    const rows = listRows();
    if (!rows.length) return `<tr class="empty"><td colspan="8">No quotes match these filters. <button class="link" data-act="clear-filters">Show all quotes</button></td></tr>`;
    return rows.map(q => {
      const d = M.div(q.divId), left = M.daysLeft(q), e = estText(q);
      const live = q.status === 'sent' || q.status === 'approved';
      const until = live ? `${fmt.dshort(M.validUntil(q))}<small class="${left <= 7 ? 'soon' : ''}">${left < 0 ? 'passed' : left === 0 ? 'today' : left + ' days left'}</small>` : `<span class="muted">${fmt.dshort(M.validUntil(q))}</span>`;
      return `<tr data-act="open" data-id="${q.id}">
        <td><a href="#/quote/${q.id}" class="ref">${esc(M.ref(q))}</a></td>
        <td><b>${esc(q.customer.name || 'No customer yet')}</b><small>${esc(q.customer.town || '')}</small></td>
        <td>${d ? strap(d, 'sm') : '<span class="muted">Not chosen</span>'}</td>
        <td class="what">${esc(services(q))}</td>
        <td class="r num">${e || '<span class="muted">—</span>'}</td>
        <td>${status(q.status)}</td>
        <td class="until">${until}</td>
        <td>${esc(M.user(q.owner).name)}</td>
      </tr>`;
    }).join('');
  }
  function viewQuotes() {
    setNav('quotes');
    const all = M.store.quotes.filter(q => !q.superseded);
    const by = s => all.filter(q => q.status === s);
    const sum = list => list.reduce((a, q) => a + (M.estimate(q) || 0), 0);
    const seg = s => { const l = by(s); return `<button class="pipe-seg st-${s} ${ui.filter === s ? 'on' : ''}" data-act="filter" data-v="${s}" aria-pressed="${ui.filter === s}"><b>${l.length}</b><span>${STATUS[s]}</span><em>${l.length ? fmt.short(sum(l)) + ' a month' : 'none'}</em></button>`; };
    const end = s => `<button class="pipe-end st-${s} ${ui.filter === s ? 'on' : ''}" data-act="filter" data-v="${s}" aria-pressed="${ui.filter === s}"><b>${by(s).length}</b> ${STATUS[s]}</button>`;
    page('p-quotes', `
      <header class="page-head">
        <div><h1>Quotes</h1><p class="sub">Every quote from every division, from first draft to signed rates.</p></div>
        <button class="btn primary lg" data-act="new-quote">${IC.plus} New quote</button>
      </header>
      <div class="pipe ${ui.filter === 'all' ? '' : 'filtered'}">
        <button class="pipe-all ${ui.filter === 'all' ? 'on' : ''}" data-act="filter" data-v="all" aria-pressed="${ui.filter === 'all'}"><b>${all.length}</b><span>All quotes</span></button>
        <div class="pipe-flow">${FLOW.map(seg).join('')}</div>
        <div class="pipe-ends">${end('declined')}${end('expired')}</div>
      </div>
      <div class="filters">
        <input type="search" class="in" data-inp="search" placeholder="Search by customer, account or reference" value="${esc(ui.search)}" aria-label="Search quotes">
        <select class="in" data-chg="div-filter" aria-label="Division">
          <option value="">All divisions</option>${DIVISIONS.map(d => `<option value="${d.id}" ${ui.div === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
        </select>
        <label class="tick"><input type="checkbox" data-chg="mine" ${ui.mine ? 'checked' : ''}> Only mine</label>
      </div>
      <div class="table-wrap"><table class="list">
        <thead><tr><th>Reference</th><th>Customer</th><th>Division</th><th>What is quoted</th><th class="r">Estimate a month</th><th>Status</th><th>Valid until</th><th>Owner</th></tr></thead>
        <tbody id="list-body">${listBody()}</tbody>
      </table></div>`);
  }

  /* =====================================================================
     4. Quote page
     ===================================================================== */
  function nextCard(q) {
    const d = M.div(q.divId), ap = M.approvers(q).map(a => a.name).join(' and ');
    const b = (act, label, cls) => `<button class="btn ${cls || ''}" data-act="${act}" data-id="${q.id}">${label}</button>`;
    if (q.lite) return `<h2>Not opened in this mockup</h2><p>This quote is listed so the list reads company-wide. The steps and the letter are built for Truck Rental and Logistics.</p>`;
    switch (q.status) {
      case 'draft': return `<h2>Still being put together</h2><p>${M.blockers(q).length ? M.blockers(q).length + ' thing(s) to fix before it can go for approval.' : 'Ready to go for approval.'}</p><div class="btns">${b('edit', 'Continue the quote', 'primary')}${b('delete', 'Delete draft', 'ghost')}</div>`;
      case 'awaiting': return `<h2>Waiting for ${esc(ap)}</h2><p>Nothing can be sent to the customer until it is approved.</p><div class="btns"><a class="btn primary" href="#/approvals/${q.id}">Open in approvals</a></div>`;
      case 'approved': return `<h2>Approved and ready to send</h2><p>Valid until ${fmt.date(M.validUntil(q))}.</p><div class="btns">${b('send', 'Send to ' + esc(q.contact.name.split(' ')[0] || 'customer'), 'primary')}${b('print', 'Download PDF')}</div>`;
      case 'sent': return `<h2>With the customer</h2><p>${M.daysLeft(q) >= 0 ? `Valid for ${M.daysLeft(q)} more day(s). ` : 'The 30 days have passed. '}Record the answer when it comes. Using the service also counts as acceptance.</p><div class="btns">${b('accept', 'Mark accepted', 'primary')}${b('decline', 'Mark declined')}${b('revise', 'Revise')}${b('print', 'Download PDF', 'ghost')}</div>`;
      case 'accepted': return `<h2>Accepted — these rates are active</h2><p>${d.fuelMode === 'surcharge' ? 'Fuel is adjusted from the fuel table. ' : ''}Charges next escalate on ${fmt.date(M.esc(q).chargesNext)}.</p><div class="btns">${b('escalate', 'Escalate and re-issue', 'primary')}${b('extend', 'Extend')}${b('revise', 'Revise')}${b('copy', 'Copy for another customer')}${b('print', 'Download PDF', 'ghost')}</div>`;
      default: return `<h2>${q.status === 'expired' ? 'Expired without an answer' : 'Declined by the customer'}</h2><p>Start a revision to quote again from these prices.</p><div class="btns">${b('revise', 'Revise', 'primary')}${b('copy', 'Copy for another customer')}</div>`;
    }
  }
  function timeline(q) {
    return `<ol class="tl">${q.timeline.slice().reverse().map(t => `<li><time>${fmt.dshort(t.when)}</time><p><b>${esc(t.what)}</b><span>${esc(t.who)}</span>${t.note ? `<q>${esc(t.note)}</q>` : ''}</p></li>`).join('')}</ol>`;
  }
  function viewQuote(q) {
    setNav('quotes');
    const d = M.div(q.divId), e = estText(q), revs = M.store.quotes.filter(x => x.num === q.num).sort((a, b) => b.rev - a.rev);
    page('p-quote', `
      <a class="back" href="#/quotes">${IC.left} Quotes</a>
      <header class="q-head">
        <div>
          <h1>${esc(q.customer.name || 'New quote')}</h1>
          <p class="q-sub"><span class="ref">${esc(M.ref(q))}</span>${strap(d)}${status(q.status)}${q.superseded ? '<span class="tag">Replaced by a later revision</span>' : ''}</p>
        </div>
      </header>
      <dl class="facts">
        <div><dt>Estimate a month</dt><dd class="num">${e || '—'}</dd></div>
        <div><dt>What is quoted</dt><dd>${esc(services(q))}</dd></div>
        <div><dt>Valid until</dt><dd>${fmt.dshort(M.validUntil(q))}</dd></div>
        <div><dt>${q.divId === 'vff' ? 'Shoot' : 'Contract'}</dt><dd>${q.divId === 'vff' ? M.weeks(q) + ' weeks from ' + fmt.dshort(q.profile.film.start) : q.terms.months + ' month' + (q.terms.months === 1 ? '' : 's') + ' from ' + fmt.dshort(q.terms.start)}</dd></div>
        <div><dt>Owner</dt><dd>${esc(M.user(q.owner).name)}</dd></div>
      </dl>
      <div class="q-body">
        <div class="q-letter"><div class="letter-fit">${VQ.doc.render(q)}</div></div>
        <aside class="q-side">
          <section class="next st-${q.status}">${nextCard(q)}</section>
          <section><h2>History</h2>${timeline(q)}</section>
          ${revs.length > 1 ? `<section><h2>Revisions</h2><ul class="revs">${revs.map(r => `<li class="${r.id === q.id ? 'on' : ''}"><a href="#/quote/${r.id}">${esc(M.ref(r))}</a>${status(r.status)}<small>${fmt.dshort(r.quoteDate)}</small></li>`).join('')}</ul></section>` : ''}
        </aside>
      </div>`);
  }

  /* =====================================================================
     2. The eight guided steps
     ===================================================================== */
  function viewWizard(q, step) {
    if (q.lite) return go('quote/' + q.id);
    if (q.status !== 'draft' && step < 7) step = q.status === 'awaiting' ? 7 : 8;
    const fresh = cur !== q;
    cur = q; curStep = step; if (step > q.seen) { q.seen = step; M.save(); }
    setNav('quotes');
    const r = root(); r.className = 'app-wiz' + (step === 8 ? ' no-side' : '') + (ui.sideOpen ? ' side-open' : '');
    r.innerHTML = `
      <header class="wiz-bar">
        <a class="back" href="#/quote/${q.id}">${IC.left} Save and close</a>
        <div class="wiz-id" id="wiz-id"></div>
        <div class="wiz-est"><span>Estimate</span><b id="wiz-est"></b></div>
        <button class="btn sm side-toggle" data-act="toggle-side">${IC.doc} Letter</button>
      </header>
      <div class="wiz-main">
        <nav class="steps" aria-label="Steps of the quote" id="steps"></nav>
        <main class="work" id="work" tabindex="-1"></main>
        <aside class="side" id="side" aria-label="Live letter and checks"></aside>
      </div>`;
    renderWork(); refreshChrome(true);
    if (fresh) window.scrollTo(0, 0);
  }
  function refreshChrome(now) {
    const q = cur; if (!q) return;
    const d = M.div(q.divId), e = estText(q);
    const id = $('#wiz-id'); if (id) id.innerHTML = `<b>${esc(q.customer.name || 'New quote')}</b><span class="ref">${esc(M.ref(q))}</span>${strap(d, 'sm')}`;
    const est = $('#wiz-est'); if (est) est.innerHTML = e ? `${e} <small>a month</small>` : '<small>needs a profile</small>';
    renderSteps();
    clearTimeout(sideTimer);
    if (now) renderSide(true); else sideTimer = setTimeout(() => renderSide(false), 140);
  }
  function renderSteps() {
    const q = cur, el = $('#steps'); if (!el) return;
    const checks = M.checks(q), locked = q.status !== 'draft';
    el.innerHTML = `<ol>${STEPS.map((name, i) => {
      const n = i + 1, fixes = checks.filter(c => c.step === n && c.level === 'fix').length, appr = checks.filter(c => c.step === n && c.level === 'approve').length;
      const seen = n <= q.seen, done = seen && !fixes && (n < curStep || locked) && !(n === 7 && q.status === 'draft') && !(n === 8 && q.status !== 'accepted' && q.status !== 'sent');
      const cls = [n === curStep ? 'cur' : '', done ? 'done' : '', locked && n < 7 ? 'locked' : ''].join(' ');
      const flag = !locked && seen && fixes ? `<em class="f-fix" title="${fixes} to fix">${fixes}</em>` : (!locked && seen && appr ? `<em class="f-appr" title="Needs approval">${appr}</em>` : '');
      return `<li class="${cls}"><a href="#/quote/${q.id}/step/${n}" ${n === curStep ? 'aria-current="step"' : ''}><i>${done ? IC.check : n}</i><span>${name}</span>${flag}</a></li>`;
    }).join('')}</ol>`;
  }
  const ANCHOR = { 1: 'doc-top', 2: 'doc-rates', 3: 'doc-rates', 4: 'doc-rates', 5: 'doc-extras', 6: 'doc-terms', 7: 'doc-sign', 8: 'doc-sign' };
  function renderSide(jump) {
    const q = cur, el = $('#side'); if (!q || !el) return;
    const checks = M.checks(q), open = checks.filter(c => c.level === 'fix' || c.level === 'approve').length;
    const old = $('.side-body', el), top = old ? old.scrollTop : 0;
    const order = { fix: 0, approve: 1, note: 2, ok: 3 }, word = { fix: 'To fix', approve: 'Needs approval', note: 'Worth knowing', ok: 'Fine' };
    const body = ui.tab === 'letter'
      ? `<div class="letter-zoom">${VQ.doc.render(q)}</div>`
      : `<ul class="checks">${checks.slice().sort((a, b) => order[a.level] - order[b.level]).map(c => `<li class="c-${c.level}"><button data-act="jump" data-step="${c.step}"><b>${word[c.level]}</b><span>${esc(c.text)}</span><small>Step ${c.step}, ${STEPS[c.step - 1]}</small></button></li>`).join('') || '<li class="c-ok"><span>Nothing to report yet.</span></li>'}</ul>`;
    el.innerHTML = `<div class="side-tabs" role="tablist">
        <button role="tab" aria-selected="${ui.tab === 'letter'}" data-act="side-tab" data-v="letter">Letter</button>
        <button role="tab" aria-selected="${ui.tab === 'checks'}" data-act="side-tab" data-v="checks">Checks${open ? `<em>${open}</em>` : ''}</button>
        <button class="side-close" data-act="toggle-side" aria-label="Close">${IC.x}</button>
      </div><div class="side-body">${body}</div>`;
    const nb = $('.side-body', el);
    if (ui.tab === 'letter' && jump) { const a = $('#' + ANCHOR[curStep], nb); nb.scrollTop = a ? Math.max(0, a.offsetTop * 0.5 - 12) : 0; } else nb.scrollTop = top;
  }
  function renderWork(keep) {
    const q = cur, el = $('#work'); if (!q || !el) return;
    const top = el.scrollTop;
    const body = [stepCustomer, stepServices, stepProfile, stepPrices, stepExtras, stepTerms, stepApprove, stepSend][curStep - 1](q);
    const locked = q.status !== 'draft';
    const back = curStep > 1 && !(locked && curStep === 7) ? `<a class="btn ghost" href="#/quote/${q.id}/step/${curStep - 1}">${IC.left} ${STEPS[curStep - 2]}</a>` : '<span></span>';
    const next = curStep < 8 && !(curStep === 7 && (q.status === 'draft' || q.status === 'awaiting')) ? `<a class="btn primary" href="#/quote/${q.id}/step/${curStep + 1}">Next: ${STEPS[curStep]} ${IC.right}</a>` : '<span></span>';
    el.innerHTML = `<div class="work-in step-${curStep}">${body}</div><footer class="work-nav">${back}${next}</footer>`;
    el.scrollTop = keep ? top : 0;
  }
  const field = (label, html, cls) => `<label class="f ${cls || ''}"><span>${label}</span>${html}</label>`;
  const inp = (q, path, o) => { o = o || {}; const v = getPath(q, path); return `<input class="in" type="${o.type || 'text'}" data-bind="${path}" ${o.dt ? `data-type="${o.dt}"` : ''} ${o.after ? `data-after="${o.after}"` : ''} value="${esc(v == null ? '' : (o.dt === 'num' ? fmt.num(v, o.dec || 0) : v))}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.mode ? `inputmode="${o.mode}"` : ''} ${o.min != null ? `min="${o.min}"` : ''}>`; };

  /* ---- step 1 ---- */
  function custList(q) {
    const s = ui.cust.trim().toLowerCase();
    const list = VQ.CUSTOMERS.filter(c => !s || (c.name + ' ' + c.acc + ' ' + c.town).toLowerCase().includes(s));
    if (!list.length) return `<li class="none">No account matches “${esc(ui.cust)}”. Add them as a prospect below.</li>`;
    return list.map(c => `<li><button class="cust ${q.custId === c.id ? 'on' : ''}" data-act="pick-cust" data-id="${c.id}" aria-pressed="${q.custId === c.id}">
      <b>${esc(c.name)}</b><span>${esc(c.town)}</span><span class="${c.acc ? 'acc' : 'prospect'}">${c.acc ? esc(c.acc) : 'Prospect, no account yet'}</span>${q.custId === c.id ? `<i>${IC.check}</i>` : ''}</button></li>`).join('');
  }
  function stepCustomer(q) {
    const c = VQ.CUSTOMERS.find(x => x.id === q.custId), has = q.customer.name || q.custId === 'new';
    const contacts = c && c.contacts.length > 1 ? `<div class="chips">${c.contacts.map((k, i) => `<button class="chip ${q.contact.name === k.name ? 'on' : ''}" data-act="pick-contact" data-i="${i}">${esc(k.name)}<small>${esc(k.role)}</small></button>`).join('')}</div>` : '';
    return `<h1>Who is this quote for?</h1>
      <p class="lead">Pick the account. Its details become the header of the letter, so nothing is typed twice.</p>
      <input type="search" class="in big" data-inp="cust" placeholder="Search by company, town or account number" value="${esc(ui.cust)}" aria-label="Search customers">
      <ul class="cust-list" id="cust-list">${custList(q)}</ul>
      <button class="link" data-act="new-prospect">${IC.plus} Add a prospect who has no account yet</button>
      ${has ? `<section class="panel">
        <h2>Header of the letter</h2>
        <div class="grid2">
          ${field('Company', inp(q, 'customer.name'), 'span2')}
          ${field('Account number', inp(q, 'customer.acc', { ph: 'Opened by credit control' }))}
          ${field('Telephone', inp(q, 'customer.tel'))}
          ${field('Street', inp(q, 'customer.street'), 'span2')}
          ${field('Suburb', inp(q, 'customer.suburb'))}
          <div class="grid2 tight">${field('Town', inp(q, 'customer.town'))}${field('Postal code', inp(q, 'customer.code'))}</div>
        </div>
        <h2>Addressed to</h2>${contacts}
        <div class="grid2">
          <div class="grid2 tight narrow-first">${field('Title', `<select class="in" data-bind="contact.title">${['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'].map(t => `<option ${q.contact.title === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}${field('Name', inp(q, 'contact.name'))}</div>
          ${field('Email', inp(q, 'contact.email', { type: 'email' }))}
        </div>
        <p class="auto">Quote date ${fmt.date(q.quoteDate)}. Valid for 30 days, until ${fmt.date(M.validUntil(q))}. Reference ${esc(M.ref(q))}.</p>
      </section>` : ''}`;
  }

  /* ---- step 2 ---- */
  function stepServices(q) {
    const d = M.div(q.divId), peek = ui.peek && M.div(ui.peek);
    const card = x => `<button class="divcard ${q.divId === x.id ? 'on' : ''} ${x.enabled ? '' : 'later'}" data-act="pick-div" data-id="${x.id}" aria-pressed="${q.divId === x.id}">
        <span class="lockup"><img src="assets/value-wordmark.png" alt="Value">${strapFill(x)}</span>
        <span class="sells">${esc(x.sells)}</span>
        <span class="fam">${x.enabled ? 'Priced by ' + x.family.toLowerCase() : 'Not walked in this mockup'}</span>
      </button>`;
    const block = bid => {
      const b = BLOCKS[bid], n = b.tables.reduce((a, t) => a + t.rows.length, 0);
      return `<label class="pick ${q.sel[bid] ? 'on' : ''}"><input type="checkbox" data-chg="toggle-block" data-bid="${bid}" ${q.sel[bid] ? 'checked' : ''}>
        <span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small><em>${b.tables.length} price table${b.tables.length > 1 ? 's' : ''}, ${n} rows in the rate book</em></span></label>`;
    };
    return `<h1>What does the customer need?</h1>
      <p class="lead">Start with the division. It decides the letterhead, the services on offer and the standard terms.</p>
      <div class="divs">${DIVISIONS.map(card).join('')}</div>
      ${peek ? `<div class="callout"><b>${esc(peek.name)} is not walked in this mockup.</b> It would run on these same eight steps, with these service blocks: ${VQ.OTHER_BLOCKS[peek.id].join(', ')}.</div>` : ''}
      ${d ? `<section class="panel"><h2>Services from ${esc(d.name)}</h2>
        <p class="hint">Tick everything this customer should get a price for. Each one adds its price tables to the letter.</p>
        <div class="picks">${M.blocksOf(d.id, 'service').map(block).join('')}</div></section>` : ''}`;
  }

  /* ---- step 3 ---- */
  function matchHTML(q) {
    const vs = q.profile.vehicles.filter(v => v.veh), hire = M.selected(q, 'service');
    if (!hire.length) return `<p class="hint">Tick a hire period under Services first.</p>`;
    if (!vs.length) return `<p class="hint">No vehicles listed, so the letter will carry the full rate card for ${hire.map(b => BLOCKS[b].name.toLowerCase()).join(' and ')}.</p>`;
    return `<ul class="match">${hire.map(bid => vs.map(v => {
      const r = M.bestRow(bid, v), name = VQ.VEHICLES.find(x => x.k === v.veh).name;
      return r ? `<li>${IC.check}<span><b>${BLOCKS[bid].name}:</b> ${esc(name)}${r.kmIncl ? ', ' + fmt.num(r.kmIncl) + ' km included' : ''}</span></li>` : `<li class="no">${IC.alert}<span><b>${BLOCKS[bid].name}:</b> ${esc(name)} is not in this rate book</span></li>`;
    }).join('')).join('')}</ul>`;
  }
  function volHTML(q) {
    const v = M.volumes(q), p = q.profile, sum = (p.split.retail || 0) + (p.split.dc || 0) + (p.split.door || 0);
    return `<dl class="calc">
      <div><dt>Chargeable mass a month</dt><dd>${v.chargeable ? fmt.num(v.chargeable) + ' kg' : '—'}</dd><small>${v.chargeable ? (v.volKg > (p.actualKg || 0) ? 'Volume decides: ' + fmt.num(p.cube, 2) + ' m³ at factor ' + fmt.num(p.factor) : 'Actual mass decides') : 'The larger of actual and volumetric mass'}</small></div>
      <div><dt>Average per delivery</dt><dd>${v.perDrop ? fmt.num(v.perDrop, 2) + ' kg' : '—'}</dd><small>${v.cubePerDrop ? fmt.num(v.cubePerDrop, 2) + ' m³' : 'Chargeable mass over consignments'}</small></div>
      <div class="${sum === 100 ? '' : 'bad'}"><dt>Drop types add up to</dt><dd>${fmt.num(sum, 1)}%</dd><small>${sum === 100 ? 'Retail, distribution centre, front door' : 'Should come to 100%'}</small></div>
    </dl>`;
  }
  function stepProfile(q) {
    if (!q.divId) return `<h1>What exactly do they need?</h1><p class="lead">Choose a division under Services first.</p>`;
    if (q.divId === 'vtr') {
      const rows = q.profile.vehicles.map((v, i) => `<tr>
        <td><select class="in" data-chg="pv" data-i="${i}" data-k="veh" aria-label="Vehicle"><option value="">Choose a vehicle</option>${VQ.VEHICLES.map(x => `<option value="${x.k}" ${v.veh === x.k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></td>
        <td><input class="in n" type="number" min="1" data-chg="pv" data-i="${i}" data-k="qty" value="${v.qty || 1}" aria-label="How many"></td>
        <td><input class="in n" type="number" min="0" step="500" data-chg="pv" data-i="${i}" data-k="km" value="${v.km || ''}" placeholder="0" aria-label="Kilometres a month"></td>
        <td><select class="in" data-chg="pv" data-i="${i}" data-k="driver" aria-label="Driver"><option value="">Customer drives</option><option value="d10" ${v.driver === 'd10' ? 'selected' : ''}>Value driver, Code 10</option><option value="d14" ${v.driver === 'd14' ? 'selected' : ''}>Value driver, Code 14</option></select></td>
        <td><button class="icon" data-act="del-veh" data-i="${i}" aria-label="Remove this vehicle">${IC.x}</button></td></tr>`).join('');
      return `<h1>Which vehicles, and how far?</h1>
        <p class="lead">List what the customer asked for. The engine switches on the matching rows in the rate book and works out an estimate.</p>
        <table class="ft"><thead><tr><th>Vehicle</th><th>How many</th><th>Km a month</th><th>Who drives</th><th></th></tr></thead><tbody>${rows || '<tr class="none"><td colspan="5">No vehicles listed yet.</td></tr>'}</tbody></table>
        <button class="btn" data-act="add-veh">${IC.plus} Add a vehicle</button>
        <section class="panel"><h2>What this switches on</h2><div id="match">${matchHTML(q)}</div></section>
        <section class="panel"><h2>For how long</h2><div class="grid2">${field('Hire starts', inp(q, 'terms.start', { type: 'date' }))}${field('Months', inp(q, 'terms.months', { type: 'number', dt: 'int', min: 1 }))}</div></section>`;
    }
    if (q.divId === 'whs') return whProfile(q);
    if (q.divId === 'exp') return expProfile(q);
    if (q.divId === 'vdd') return ddProfile(q);
    if (q.divId === 'vcl') return vclProfile(q);
    if (q.divId === 'vff') return ffProfile(q);
    const p = q.profile;
    return `<h1>What does their freight look like?</h1>
      <p class="lead">These figures are the basis of the quote. They are printed in the letter as the quotation parameters, and they drive the estimate.</p>
      <section class="panel"><h2>Where it leaves from</h2><div class="grid2">
        ${field('Origin', `<select class="in" data-bind="profile.origin" data-after="work">${['Cape Town', 'Johannesburg', 'Durban', 'Port Elizabeth'].map(o => `<option ${p.origin === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`)}
        ${field('Collected from', inp(q, 'profile.collection'))}</div>
        ${p.origin !== 'Cape Town' ? `<p class="hint">The sample rate book in this mockup is priced from Cape Town. A real rate book holds one set of prices per origin.</p>` : ''}</section>
      <section class="panel"><h2>A typical month</h2><div class="grid4">
        ${field('Consignments', inp(q, 'profile.consignments', { dt: 'num', mode: 'numeric', after: 'vol', ph: '0' }))}
        ${field('Actual mass, kg', inp(q, 'profile.actualKg', { dt: 'num', mode: 'numeric', after: 'vol', ph: '0' }))}
        ${field('Cubic metres', inp(q, 'profile.cube', { dt: 'num', dec: 2, mode: 'decimal', after: 'vol', ph: '0,00' }))}
        ${field('Volumetric factor', `<select class="in" data-bind="profile.factor" data-type="int" data-after="vol"><option value="5000" ${p.factor === 5000 ? 'selected' : ''}>5 000</option><option value="4000" ${p.factor === 4000 ? 'selected' : ''}>4 000</option></select>`)}
      </div>
      <h2>Where it is delivered</h2><div class="grid4">
        ${field('Retail stores, %', inp(q, 'profile.split.retail', { dt: 'num', dec: 1, mode: 'decimal', after: 'vol' }))}
        ${field('Distribution centres, %', inp(q, 'profile.split.dc', { dt: 'num', dec: 1, mode: 'decimal', after: 'vol' }))}
        ${field('Front doors, %', inp(q, 'profile.split.door', { dt: 'num', dec: 1, mode: 'decimal', after: 'vol' }))}
      </div></section>
      <section class="panel"><h2>Worked out for you</h2><div id="vol">${volHTML(q)}</div></section>`;
  }

  function shootHTML(q) {
    const w = M.weeks(q), wk = M.shootWeek(q);
    return `<dl class="calc"><div><dt>Shoot length</dt><dd>${w ? w + ' week' + (w > 1 ? 's' : '') : '—'}</dd><small>Six-day weeks, rounded up</small></div>
      <div><dt>Hire a week</dt><dd>${wk ? fmt.money(wk, 0) : '—'}</dd><small>Including excess kilometres</small></div>
      <div><dt>Hire for the shoot</dt><dd>${wk && w ? fmt.money(wk * w, 0) : '—'}</dd><small>Before delivery, fuel and fees</small></div></dl>`;
  }
  function ffProfile(q) {
    const f = q.profile.film, vs = q.profile.vehicles;
    const rows = vs.map((v, i) => `<tr>
      <td><select class="in" data-chg="pv" data-i="${i}" data-k="veh" aria-label="Vehicle"><option value="">Choose a vehicle</option>${VQ.FF_VEH.map(x => `<option value="${x.k}" ${v.veh === x.k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></td>
      <td><input class="in n" type="number" min="1" data-chg="pv" data-i="${i}" data-k="qty" value="${v.qty || 1}" aria-label="How many"></td>
      <td><input class="in n" type="number" min="0" step="100" data-chg="pv" data-i="${i}" data-k="km" value="${v.km || ''}" placeholder="0" aria-label="Kilometres a week, each"></td>
      <td><button class="icon" data-act="del-veh" data-i="${i}" aria-label="Remove this vehicle">${IC.x}</button></td></tr>`).join('');
    return `<h1>Which production, when, and which vehicles?</h1>
      <p class="lead">Rates are per six-day week. The shoot dates are printed on the letter and must fall inside the production’s insurance cover.</p>
      <div class="go"><button class="btn sm" data-act="ff-sample">Fill in a sample shoot</button></div>
      <section class="panel"><h2>The shoot</h2><div class="grid2">${field('Production', inp(q, 'profile.film.production', { ph: 'Title of the film or series' }), 'span2')}
        ${field('Shoot starts', inp(q, 'profile.film.start', { type: 'date', after: 'shoot' }))}${field('Shoot ends', inp(q, 'profile.film.end', { type: 'date', after: 'shoot' }))}
        ${field('Unit base', `<select class="in" data-bind="profile.film.base">${['Johannesburg', 'Cape Town', 'Durban'].map(o => `<option ${f.base === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`)}</div></section>
      <section class="panel"><h2>Vehicles</h2><table class="ft"><thead><tr><th>Vehicle</th><th>How many</th><th>Km a week, each</th><th></th></tr></thead><tbody>${rows || '<tr class="none"><td colspan="4">No vehicles listed yet.</td></tr>'}</tbody></table>
        <button class="btn" data-act="add-ffveh">${IC.plus} Add a vehicle</button></section>
      <section class="panel"><h2>Worked out for you</h2><div id="shoot">${shootHTML(q)}</div></section>`;
  }
  function bandHTML(q) {
    const v = q.profile.vcl, list = [['xis', 'Inter-branch'], ['exp', 'Express'], ['eco', 'Economy']].filter(([c]) => q.sel['vcl.' + c] && (v.vol[c] || [])[1]);
    if (!list.length) return '<p class="hint">Enter an average weight per consignment to see which band it is priced in.</p>';
    return `<dl class="calc">${list.map(([c, name]) => { const kg = v.vol[c][1], b = M.band(kg); return `<div><dt>${name}, ${fmt.num(kg)} kg on average</dt><dd>Band ${b}</dd><small>${VQ.BANDS[b - 1]}. Below the buy-in minimum, the minimum applies.</small></div>`; }).join('')}</dl>`;
  }
  function vclProfile(q) {
    const v = q.profile.vcl, sel = id => !!q.sel[id];
    const hub = ([c, name]) => `<label class="pick ${v.hubs.includes(c) ? 'on' : ''}"><input type="checkbox" data-chg="vhub" data-code="${c}" ${v.hubs.includes(c) ? 'checked' : ''}><span><b>${name}</b><small>${c}1 hub</small></span></label>`;
    const svc = [['xis', 'Inter-branch transfers (XIS)'], ['exp', 'Secondary – express (EXP)'], ['eco', 'Secondary – economy (ECO)']].filter(([c]) => sel('vcl.' + c));
    const haz = ([id, cls, name]) => `<label class="tick"><input type="checkbox" data-chg="vhaz" data-id="${id}" ${v.haz.includes(id) ? 'checked' : ''}><span><b>${cls}</b> ${name}</span></label>`;
    return `<h1>Where does it leave from, and what is it?</h1>
      <p class="lead">The hubs decide which lanes are quoted. The dangerous goods classes are printed in the letter and must be declared on every waybill.</p>
      <div class="go"><button class="btn sm" data-act="vcl-sample">Fill in sample volumes</button></div>
      <section class="panel"><h2>Hubs the goods leave from</h2><div class="picks">${VQ.HUBS.map(hub).join('')}</div></section>
      <section class="panel"><h2>Dangerous goods carried</h2><div class="haz">${VQ.HAZ.map(haz).join('')}</div></section>
      ${svc.length || sel('vcl.decant') ? `<section class="panel"><h2>A typical month</h2><div class="table-wrap"><table class="vt"><thead><tr><th>Service</th><th>Consignments a month</th><th>Average kg per consignment</th></tr></thead><tbody>
        ${svc.map(([c, name]) => `<tr><th scope="row">${name}</th><td><input class="in n" type="text" inputmode="numeric" data-chg="vvol" data-c="${c}" data-k="0" value="${(v.vol[c] || [])[0] ? fmt.num(v.vol[c][0]) : ''}" placeholder="0" aria-label="Consignments a month, ${name}"></td><td><input class="in n" type="text" inputmode="numeric" data-chg="vvol" data-c="${c}" data-k="1" value="${(v.vol[c] || [])[1] ? fmt.num(v.vol[c][1]) : ''}" placeholder="0" aria-label="Average kg, ${name}"></td></tr>`).join('')}
        ${sel('vcl.decant') ? `<tr><th scope="row">Litres decanted</th><td>${inp(q, 'profile.vcl.litres', { dt: 'num', mode: 'numeric', ph: '0' })}</td><td></td></tr>` : ''}</tbody></table></div></section>
        <section class="panel"><h2>Worked out for you</h2><div id="band">${bandHTML(q)}</div></section>` : ''}`;
  }
  function ddProfile(q) {
    const fl = q.profile.fleet, fb = M.fleetBranches(q), bname = c => VQ.BRANCHES.find(b => b[0] === c)[1];
    const rows = fl.map((f, i) => `<tr>
      <td><select class="in" data-chg="fl" data-i="${i}" data-k="veh" aria-label="Vehicle"><option value="">Choose a vehicle</option>${VQ.DD_VEH.map(v => `<option value="${v.k}" ${f.veh === v.k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></td>
      <td><select class="in" data-chg="fl" data-i="${i}" data-k="branch" aria-label="Branch"><option value="">Branch</option>${VQ.BRANCHES.map(([c, nm]) => `<option value="${c}" ${f.branch === c ? 'selected' : ''}>${nm}</option>`).join('')}</select></td>
      <td><input class="in n" type="number" min="1" data-chg="fl" data-i="${i}" data-k="qty" value="${f.qty || ''}" aria-label="How many"></td>
      <td><input class="in n" type="number" min="0" step="100" data-chg="fl" data-i="${i}" data-k="km" value="${f.km || ''}" placeholder="0" aria-label="Kilometres a month per vehicle"></td>
      <td><button class="icon" data-act="del-fl" data-i="${i}" aria-label="Remove this line">${IC.x}</button></td></tr>`).join('');
    const crew = q.sel['vdd.labour'] && fb.length ? `<section class="panel"><h2>Drivers and crew per branch</h2><div class="table-wrap"><table class="vt"><thead><tr><th>Category</th>${fb.map(c => `<th>${bname(c)}</th>`).join('')}</tr></thead><tbody>
      ${VQ.DD_JOBS.map(([id, job]) => `<tr><th scope="row">${job}</th>${fb.map(c => `<td><input class="in n" type="text" inputmode="numeric" data-chg="crew" data-job="${id}" data-b="${c}" value="${(q.profile.crew[id] || {})[c] || ''}" placeholder="0" aria-label="${job}, ${bname(c)}"></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>` : '';
    const classes = [...new Set(fl.filter(f => f.veh).map(f => VQ.DD_VEH.find(v => v.k === f.veh).cls))].sort((a, b) => a - b);
    const cons = fb.length && classes.length ? `<section class="panel"><h2>Agreed fuel consumption</h2><p class="hint">Fuel per km is worked out from these figures. They come from the rate book and are reviewed every six months against actual measurements.</p>
      <div class="table-wrap"><table class="rb"><thead><tr><th>Branch</th><th>Fuel price</th>${classes.map(c => `<th class="r">${c} ton, km/ℓ</th><th class="r">Fuel per km</th>`).join('')}</tr></thead><tbody>${fb.map(b => { const coast = VQ.BRANCHES.find(x => x[0] === b)[2] === 'coastal', pr = coast ? q.fuel.coastal : q.fuel.price;
        return `<tr><td>${bname(b)}</td><td>${coast ? 'Coastal' : 'Inland'}, ${fmt.money(pr)}</td>${classes.map(c => `<td class="r num">${fmt.num(VQ.CONS[c][b], 2)}</td><td class="r num"><b>${fmt.money(pr / VQ.CONS[c][b])}</b></td>`).join('')}</tr>`; }).join('')}</tbody></table></div></section>` : '';
    return `<h1>Which fleet, where, and who drives it?</h1>
      <p class="lead">List the vehicles per branch. The quote prints a line for each, with quantities and totals, and works out fuel per km for each branch.</p>
      <div class="go"><button class="btn sm" data-act="dd-sample">Fill in a sample fleet</button></div>
      <section class="panel"><h2>Core fleet</h2><table class="ft"><thead><tr><th>Vehicle</th><th>Branch</th><th>How many</th><th>Km a month, each</th><th></th></tr></thead><tbody>${rows || '<tr class="none"><td colspan="5">No vehicles listed yet.</td></tr>'}</tbody></table>
        <button class="btn" data-act="add-fl">${IC.plus} Add a line</button></section>
      ${crew}${cons}
      <section class="panel"><h2>Contract</h2><div class="grid2">${field('Starts', inp(q, 'terms.start', { type: 'date' }))}${field('Months', inp(q, 'terms.months', { type: 'number', dt: 'int', min: 1 }))}</div>
        ${q.terms.months >= 36 ? `<p class="flag f-appr">${IC.alert} Contracts of 36 months and longer go to the directors.</p>` : ''}</section>`;
  }
  function massHTML() {
    const c = ui.calc, r5 = M.chargeable(c.l, c.w, c.h, c.a, 5000), r4 = M.chargeable(c.l, c.w, c.h, c.a, 4000);
    const show = r => r.vol ? `${fmt.num(r.charge, 2)} kg<small>${r.vol >= (c.a || 0) ? 'volume decides' : 'actual weight decides'}</small>` : '—';
    return `<dl class="calc"><div><dt>Factor 5 000: Local, Overnight, Next Day, International</dt><dd>${show(r5)}</dd></div><div><dt>Factor 4 000: Economy</dt><dd>${show(r4)}</dd></div></dl>`;
  }
  function expProfile(q) {
    const e = q.profile.exp, sel = id => !!q.sel[id];
    const domRows = sel('exp.dom') ? BLOCKS['exp.dom'].tables[0].rows.map(r => {
      const v = e.dom[r.id] || [];
      return `<tr><th scope="row">${esc(r.l.svc)}<small>${esc(r.l.ctr)}</small></th><td><input class="in n" type="text" inputmode="numeric" data-chg="edom" data-id="${r.id}" data-k="0" value="${v[0] ? fmt.num(v[0]) : ''}" placeholder="0" aria-label="Consignments a month, ${esc(r.l.svc)} ${esc(r.l.ctr)}"></td><td><input class="in n" type="text" inputmode="decimal" data-chg="edom" data-id="${r.id}" data-k="1" value="${v[1] ? fmt.num(v[1], 1) : ''}" placeholder="0,0" aria-label="Average chargeable kg"></td></tr>`;
    }).join('') : '';
    const boxRows = sel('exp.box') ? VQ.BOXES.map(b => `<tr><th scope="row">${esc(b.name)}<small>${b.code}, ${String(b.l).replace('.', ',')} × ${String(b.h).replace('.', ',')} × ${String(b.d).replace('.', ',')} cm</small></th><td class="u">${fmt.num(b.vol, 2)} kg</td><td><input class="in n" type="text" inputmode="numeric" data-chg="ebox" data-id="${b.id}" value="${e.boxes[b.id] ? fmt.num(e.boxes[b.id]) : ''}" placeholder="0" aria-label="Boxes a month, ${esc(b.name)}"></td></tr>`).join('') : '';
    return `<h1>What do they send, and how much?</h1>
      <p class="lead">Rough monthly figures are enough. They drive the estimate and decide which boxes appear in Annexure A. Nothing here is printed on the letter.</p>
      <div class="go"><button class="btn sm" data-act="exp-sample">Fill in sample volumes</button></div>
      ${domRows ? `<section class="panel"><h2>Domestic express</h2><div class="table-wrap"><table class="vt"><thead><tr><th>Service</th><th>Consignments a month</th><th>Average chargeable kg</th></tr></thead><tbody>${domRows}</tbody></table></div></section>` : ''}
      ${boxRows ? `<section class="panel"><h2>Standard boxes</h2><p class="hint">Enter how many of each box they send a month. Only those boxes go into Annexure A. Leave all empty to print the full box list.</p><div class="table-wrap"><table class="vt"><thead><tr><th>Box</th><th>Volumetric weight</th><th>Boxes a month</th></tr></thead><tbody>${boxRows}</tbody></table></div></section>` : ''}
      ${sel('exp.intl') ? `<section class="panel"><h2>International</h2><div class="grid4">${field('Shipments a month', inp(q, 'profile.exp.intl.n', { dt: 'num', mode: 'numeric', ph: '0' }))}${field('Average kg', inp(q, 'profile.exp.intl.kg', { dt: 'num', dec: 1, mode: 'decimal', ph: '0,0' }))}${field('Mostly to', `<select class="in" data-bind="profile.exp.intl.zone">${[3, 4, 5, 6, 7, 8].map(z => `<option value="${z}" ${e.intl.zone == z ? 'selected' : ''}>Zone ${z}</option>`).join('')}</select>`)}</div></section>` : ''}
      <section class="panel"><h2>Chargeable weight of a parcel</h2><p class="hint">Volumetric weight is length × width × height in cm, divided by the factor. The customer pays for whichever is greater, that or the actual weight.</p>
        <div class="grid4">${[['l', 'Length, cm'], ['w', 'Width, cm'], ['h', 'Height, cm'], ['a', 'Actual weight, kg']].map(([k, lab]) => field(lab, `<input class="in n" type="text" inputmode="decimal" data-inp="calc" data-k="${k}" value="${ui.calc[k] ? String(ui.calc[k]).replace('.', ',') : ''}">`)).join('')}</div>
        <div id="mass">${massHTML()}</div></section>`;
  }
  function whCalcHTML(q) {
    const ws = q.profile.warehouses || [];
    if (!ws.length) return `<p class="hint">Tick a warehouse above.</p>`;
    return `<dl class="calc">${ws.map(code => {
      const w = q.profile.wh[code] || {}, name = VQ.WAREHOUSES.find(x => x[0] === code)[1], b = M.bands(q, code);
      return `<div><dt>${name}: storage band</dt><dd>${w.pallets ? fmt.num(w.pallets) + ' pallets' : '—'}</dd><small>${w.pallets ? 'Band 2 is ' + esc(b.b2.replace(/, base.*/, '')) : 'The bands are set around this number'}</small></div>`;
    }).join('')}<div><dt>Contract years priced</dt><dd>${M.hasY2(q) ? 2 : 1}</dd><small>${esc(M.yearText(q, 1))}${M.hasY2(q) ? '<br>' + esc(M.yearText(q, 2)) : ''}</small></div></dl>`;
  }
  function whProfile(q) {
    const ws = q.profile.warehouses || [], svc = M.selected(q, 'service');
    const tick = ([code, name]) => `<label class="pick ${ws.includes(code) ? 'on' : ''}"><input type="checkbox" data-chg="wh" data-code="${code}" ${ws.includes(code) ? 'checked' : ''}><span><b>${name}</b><small>Value Warehousing, ${code}</small></span></label>`;
    let rows = '';
    if (ws.length) {
      rows += `<tr class="grp"><th colspan="${ws.length + 2}">Storage</th></tr><tr><th scope="row">Pallets stored</th><td class="u">a month</td>${ws.map(c => `<td>${inp(q, `profile.wh.${c}.pallets`, { dt: 'num', mode: 'numeric', after: 'whcalc', ph: '0' })}</td>`).join('')}</tr>`;
      svc.forEach(bid => {
        const t = BLOCKS[bid].tables[0], list = t.rows.filter(r => !/^st-b/.test(r.id));
        if (!list.length) return;
        if (bid !== 'whs.store') rows += `<tr class="grp"><th colspan="${ws.length + 2}">${esc(BLOCKS[bid].name)}</th></tr>`;
        list.forEach(r => { rows += `<tr><th scope="row">${esc(r.l.act)}</th><td class="u">${r.id === 'st-half' ? 'a month' : 'a year'}</td>${ws.map(c => `<td>${inp(q, `profile.wh.${c}.vol.${r.id}`, { dt: 'num', mode: 'numeric', after: 'whcalc', ph: '0' })}</td>`).join('')}</tr>`; });
      });
    }
    return `<h1>Which warehouses, and how much moves through them?</h1>
      <p class="lead">Warehouse prices depend on volume. The figures here are printed in the letter as the basis of the rates, and they set the storage bands and the estimate.</p>
      <section class="panel"><h2>Warehouses</h2><div class="picks">${VQ.WAREHOUSES.map(tick).join('')}</div></section>
      <section class="panel"><h2>Contract</h2><div class="grid2">${field('Starts', inp(q, 'terms.start', { type: 'date', after: 'whcalc' }))}${field('Months', inp(q, 'terms.months', { type: 'number', dt: 'int', min: 1, after: 'whcalc' }))}</div>
        <p class="hint">Every price is quoted for each contract year the contract covers, up to two in this rate book.</p></section>
      ${ws.length && svc.length ? `<section class="panel"><div class="vol-head"><h2>Expected volumes</h2><button class="btn sm" data-act="wh-sample">Fill in sample volumes</button></div>
        <div class="table-wrap"><table class="vt"><thead><tr><th>Activity</th><th></th>${ws.map(c => `<th>${VQ.WAREHOUSES.find(x => x[0] === c)[1]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>` : `<p class="hint">Tick the services under Services to list their volumes here.</p>`}
      <section class="panel"><h2>Worked out for you</h2><div id="whcalc">${whCalcHTML(q)}</div></section>`;
  }

  /* ---- step 4: the price grid (one component for every table) ---- */
  function cellState(r, c, ln) {
    const s = r.s[c.key], v = ln.p[c.key];
    if (ln.por[c.key]) return { cls: 'por', meta: 'no price printed' };
    if (v == null || isNaN(v)) return { cls: 'miss', meta: 'price needed' };
    if (Math.abs(v - s) < 0.005) return { cls: '', meta: '' };
    const pct = s ? (v - s) / s * 100 : 0, low = s > 0 && v < s * (1 - VQ.FLOOR) - 1e-9;
    return { cls: low ? 'low' : 'chg', meta: `<s>${fmt.num(s, c.dec)}</s> ${pct > 0 ? '+' : '−'}${fmt.pct(Math.abs(pct), 1)}` };
  }
  const cellText = (c, ln) => ln.por[c.key] ? 'On request' : (ln.p[c.key] == null ? '' : fmt.num(ln.p[c.key], c.dec));
  function gridHTML(q, bid, t) {
    M.ensure(q, bid);
    if (!M.tableOn(q, t)) return '';
    const cols = M.colsOf(q, t);
    const key = bid + '|' + t.id, show = !!ui.showOff[key];
    const lines = t.rows.map(r => ({ r, ln: M.line(q, bid, t.id, r.id) }));
    const on = lines.filter(x => x.ln.on), off = lines.filter(x => !x.ln.on);
    const row = ({ r, ln }) => `<tr class="${ln.on ? '' : 'off'}">
      <td class="ck"><input type="checkbox" data-chg="row-on" data-key="${key}" data-rid="${r.id}" ${ln.on ? 'checked' : ''} aria-label="Include ${esc(M.rowLabel(t, r, q))}"></td>
      ${cols.map(c => {
        if (c.type === 'label') return `<th scope="row">${esc(M.text(q, t, r.l[c.key]))}</th>`;
        if (c.type === 'calc') { const v = M.calc(q, t, r, c); return `<td class="wk">${v.text}<small class="pmeta">${esc(v.meta || (c.key === 'qty' ? 'from the profile' : ''))}</small></td>`; }
        if (c.type === 'info') return `<td class="info">${c.key === 'kmIncl' ? fmt.num(r.l[c.key]) : esc(r.l[c.key] || '')}</td>`;
        if (r.s[c.key] == null) return `<td class="na">${r.t && r.t[c.key] ? esc(r.t[c.key]) : '–'}</td>`;
        const st = cellState(r, c, ln);
        return `<td class="pc ${st.cls}"><input class="pin" type="text" inputmode="decimal" data-price="${key}|${r.id}|${c.key}" value="${esc(cellText(c, ln))}" ${ln.on ? '' : 'disabled'} aria-label="${esc(c.label)}, ${esc(M.rowLabel(t, r, q))}"><small class="pmeta">${st.meta}</small></td>`;
      }).join('')}</tr>`;
    return `<div class="grid" data-key="${key}">
      <div class="grid-bar"><h3>${esc(t.title)}</h3><span class="count">${on.length} of ${lines.length} rows in the quote</span>
        <span class="tools"><label class="adj">Adjust by <input class="in xs" type="text" inputmode="decimal" placeholder="0" aria-label="Percentage"> %</label><button class="btn sm" data-act="adjust" data-key="${key}">Apply</button><button class="btn sm ghost" data-act="reset-table" data-key="${key}">Back to standard</button></span>
      </div>
      <div class="grid-scroll"><table class="g"><thead><tr><th class="ck"><span class="sr">In quote</span></th>${cols.map(c => `<th class="${c.type === 'calc' ? 'wk' : c.type}">${esc(M.text(q, t, c.label))}</th>`).join('')}</tr></thead>
        <tbody>${on.map(row).join('')}${show ? off.map(row).join('') : ''}</tbody></table></div>
      ${off.length ? `<button class="link more" data-act="toggle-off" data-key="${key}">${show ? 'Hide' : 'Show'} the ${off.length} row${off.length > 1 ? 's' : ''} from the rate book that ${off.length > 1 ? 'are' : 'is'} not in this quote</button>` : ''}
    </div>`;
  }
  const blockGrids = (q, bid) => BLOCKS[bid].tables.map(t => gridHTML(q, bid, t)).join('');
  function stepPrices(q) {
    const d = M.div(q.divId), sel = M.selected(q, 'service');
    if (!sel.length) return `<h1>Prices</h1><p class="lead">Tick at least one service under Services, and its price tables appear here.</p>`;
    const fuel = d.fuelMode === 'perkm' ? `Grey columns are worked out, not typed: fuel per km is the fuel price (${fmt.money(q.fuel.price)} inland, ${fmt.money(q.fuel.coastal)} coastal, ${fmt.date(q.fuel.date)}) divided by the agreed km per litre for that vehicle and branch.`
      : d.fuelMode === 'none' ? (M.hasY2(q) ? `Each line carries a price for each contract year. Year 2 starts at the Year 1 price plus 6,5%.` : `The contract is 12 months or shorter, so only Year 1 prices are quoted.`)
      : d.fuelMode === 'surcharge'
      ? `Fuel is added on top as a surcharge of <b>${fmt.pct(q.fuel.pct)}</b>, from the fuel table: ${fmt.money(q.fuel.price)} a litre on ${fmt.date(q.fuel.date)}.`
      : `Fuel is not in these prices. It is charged separately on consumption.`;
    return `<h1>Prices</h1>
      <p class="lead">Every price starts at the standard rate. Change what you need to; the letter follows as you type.</p>
      <div class="legend"><span class="k chg">Changed from standard</span><span class="k low">More than ${Math.round(VQ.FLOOR * 100)}% below standard, needs approval</span><span class="k por">Type “on request” to print no price</span><span class="fuel">${fuel}</span></div>
      ${sel.map(bid => `<section class="pblock"><header><h2>${esc(BLOCKS[bid].name)}</h2><p>${esc(BLOCKS[bid].desc)}</p></header>${blockGrids(q, bid)}</section>`).join('')}`;
  }

  /* ---- step 5 ---- */
  function stepExtras(q) {
    if (!q.divId) return `<h1>Extras</h1><p class="lead">Choose a division under Services first.</p>`;
    const f = q.fuel || {}, vals = { collection: esc(q.profile.collection || 'your premises'), fuelPct: f.pct != null ? fmt.pct(f.pct) : '', fuelDate: fmt.date(f.date), fuelPrice: fmt.money(f.price) };
    const text = t => esc(t).replace(/\{fee:(\w+)\}/g, (m, k) => `<mark>${fmt.money(M.fee(q, k))}</mark>`).replace(/\{(\w+)\}/g, (m, k) => vals[k] != null ? `<mark>${vals[k]}</mark>` : m);
    const ticks = which => VQ.INCL[q.divId][which].map(([id, t]) => `<label class="tick"><input type="checkbox" data-chg="incl" data-id="${id}" ${q.inclOff[id] ? '' : 'checked'}><span>${text(t)}</span></label>`).join('');
    return `<h1>Extras, people and what is included</h1>
      <p class="lead">Switch on what applies. Each item brings its standard price, which you can change like any other.</p>
      ${M.blocksOf(q.divId, 'extra').map(bid => { const b = BLOCKS[bid], on = !!q.sel[bid];
        return `<section class="xblock ${on ? 'on' : ''}"><label class="switch"><input type="checkbox" data-chg="toggle-block" data-bid="${bid}" ${on ? 'checked' : ''}><i></i><span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></span></label>${on ? blockGrids(q, bid) : ''}</section>`; }).join('')}
      <section class="panel"><h2>What the rates include, and what they leave out</h2>
        <p class="hint">Untick anything that does not apply. Highlighted amounts are read from the fees and the fuel table, so they always agree with the rest of the letter.</p>
        <div class="incl"><div><h3>Included</h3>${ticks('included') || '<p class="hint">Nothing is listed as included for this division.</p>'}</div><div><h3>Not included</h3>${ticks('excluded')}</div></div></section>`;
  }

  /* ---- step 6 ---- */
  function stepTerms(q) {
    const d = M.div(q.divId); if (!d) return `<h1>Terms</h1><p class="lead">Choose a division under Services first.</p>`;
    const e = M.esc(q), t = q.terms, me = M.user(q.owner);
    const radio = (path, val, label, sub) => `<label class="radio ${getPath(q, path) === val ? 'on' : ''}"><input type="radio" name="${path}" data-bind="${path}" data-after="work" value="${val}" ${getPath(q, path) === val ? 'checked' : ''}><span><b>${label}</b><small>${sub}</small></span></label>`;
    const pay = [7, 14, 30, 45, 60].map(n => `<option value="${n}" ${t.payDays === n ? 'selected' : ''}>${n} days${n === d.payDays ? ' (standard)' : ''}</option>`).join('');
    const stale = (d.fuelMode === 'surcharge' || d.fuelMode === 'perkm') && q.fuel.date !== VQ.fuelNow().date;
    return `<h1>Terms</h1>
      <p class="lead">The standard terms for ${esc(d.name)} are already filled in. Change only what was agreed with the customer.</p>
      <div class="terms">
        <section class="tcard"><h2>Contract</h2><div class="grid2">${field('Starts', inp(q, 'terms.start', { type: 'date' }))}${field('Months', inp(q, 'terms.months', { type: 'number', dt: 'int', min: 1, after: 'work' }))}</div>
          ${t.months >= 36 ? `<p class="flag f-appr">${IC.alert} Contracts of 36 months and longer go to the directors.</p>` : ''}</section>
        <section class="tcard"><h2>Payment</h2>${field('Terms from date of statement', `<select class="in" data-bind="terms.payDays" data-type="int" data-after="work">${pay}</select>`)}
          <p class="fixed">Late payment attracts interest at prime plus 2%.</p>${t.payDays !== d.payDays ? `<p class="flag f-appr">${IC.alert} Not the standard ${d.payDays} days. An approver will see this.</p>` : ''}</section>
        <section class="tcard"><h2>Escalation</h2>${e.anniversary ? `<p class="fixed">Charges and labour go up every year on the anniversary of the contract. Next: <b>${fmt.date(e.chargesNext)}</b>.</p><p class="src">${IC.lock} Set by the division. Worked out from the contract start.</p>` : `<p class="fixed">Charges go up ${e.min ? `by at least ${fmt.pct(e.min, 1)} ` : ''}every year on ${fmt.dayMonth(d.esc.charges[0], d.esc.charges[1]).replace(/(\d+)(st|nd|rd|th)/, '$1')}. Next: <b>${fmt.date(e.chargesNext)}</b>.</p>
          <p class="fixed">Labour follows the bargaining council. Next: <b>${fmt.date(e.labourNext)}</b>.</p><p class="src">${IC.lock} Set by the division. Dates are worked out from the quote date.</p>`}</section>
        <section class="tcard"><h2>${d.fuelMode === 'none' ? 'Contract years' : 'Fuel'}</h2>${d.fuelMode === 'none'
          ? `<p class="fixed">${esc(M.yearText(q, 1))}${M.hasY2(q) ? '<br>' + esc(M.yearText(q, 2)) : ''}</p><p class="src">${IC.lock} Warehousing rates carry no fuel.</p>`
          : d.fuelMode === 'perkm'
          ? `<p class="fixed">Billed per kilometre: fuel price ÷ agreed consumption. ${fmt.money(q.fuel.price)} a litre inland and ${fmt.money(q.fuel.coastal)} at the coast, as at ${fmt.date(q.fuel.date)}. Adjusted every month.</p>${stale ? `<p class="flag f-fix">${IC.alert} A newer fuel price exists. <button class="link" data-act="refresh-fuel">Refresh the fuel basis</button></p>` : `<p class="src">${IC.lock} Read from the fuel table.</p>`}`
          : d.fuelMode === 'surcharge'
          ? `<p class="fixed">A surcharge of <b>${fmt.pct(q.fuel.pct)}</b> on top of the rates, at ${fmt.money(q.fuel.price)} a litre as at ${fmt.date(q.fuel.date)}. Adjusted in January, April, July and October.</p>${stale ? `<p class="flag f-fix">${IC.alert} A newer fuel price exists. <button class="link" data-act="refresh-fuel">Refresh the fuel basis</button></p>` : `<p class="src">${IC.lock} Read from the fuel table. The reference number carries the price.</p>`}`
          : `<p class="fixed">Fuel is not in the prices. It is charged separately: on average consumption when Value supplies the driver, on actual litres when the customer drives.</p><p class="src">${IC.lock} Set by the division.</p>`}</section>
        ${d.id === 'vff' ? `<section class="tcard wide"><h2>The production’s own vehicle insurance</h2><p class="fixed">Film Fleet does not sell damage waiver. Vehicles go out only against an insurance letter, and the production pays standing time while a damaged vehicle is repaired.</p>
            <div class="grid4">${field('Insurer', inp(q, 'terms.insurer'))}${field('Policy number', inp(q, 'terms.policy'))}${field('Cover per vehicle', inp(q, 'terms.cover', { dt: 'num', mode: 'numeric', ph: 'R' }))}<div></div>${field('Cover from', inp(q, 'terms.insFrom', { type: 'date' }))}${field('Cover to', inp(q, 'terms.insTo', { type: 'date' }))}</div></section>` : ''}
        ${d.id === 'vtr' ? `<section class="tcard wide"><h2>If the vehicle is damaged</h2><div class="radios">
            ${radio('terms.dw', 'value', 'Value’s damage waiver', 'Priced per day, week or month in the rate tables. The customer pays a fixed damage contribution per incident.')}
            ${radio('terms.dw', 'own', 'The customer’s own insurance', 'No waiver is charged. An insurance letter is needed before any vehicle leaves.')}</div>
            ${t.dw === 'own' ? `<div class="grid4">${field('Insurer', inp(q, 'terms.insurer'))}${field('Policy number', inp(q, 'terms.policy'))}${field('Cover from', inp(q, 'terms.insFrom', { type: 'date' }))}${field('Cover to', inp(q, 'terms.insTo', { type: 'date' }))}</div>` : ''}</section>` : ''}
        ${d.id === 'whs' ? `<section class="tcard"><h2>The customer’s stock in the warehouse</h2><p class="fixed">Not insured by Value. The customer covers it against all risk and SASRIA, and initials this clause on the letter.</p><p class="src">${IC.lock} Set by the division.</p></section>` : `<section class="tcard ${d.id === 'log' ? 'wide' : ''}"><h2>The customer’s goods in transit</h2>${d.id === 'log' ? `<div class="radios">
            ${radio('terms.git', 'excluded', 'Not included', 'The customer arranges goods-in-transit insurance with their own insurer.')}
            ${radio('terms.git', 'risk', 'Value accepts the risk, up to a limit', 'Not insurance. Value carries direct losses up to a stated value per load.')}</div>
            ${t.git === 'risk' ? `<div class="grid2">${field('Maximum value per load, including VAT', inp(q, 'terms.gitMax', { dt: 'num', mode: 'numeric', ph: 'R' }))}</div>` : ''}`
          : d.id === 'vcl' ? `<p class="fixed">Value accepts the risk up to a maximum value per load. You contribute 10% of a claim for general incidents and 20% for theft and hijacking, each with a minimum.</p><div class="grid2">${field('Maximum value per load, including VAT', inp(q, 'terms.gitMax', { dt: 'num', mode: 'numeric', ph: 'R' }))}</div>`
          : d.id === 'vdd' ? `<p class="fixed">Value accepts the risk up to a maximum value per load for each vehicle type, printed in the letter. Damage waiver and contribution are included in the rates.</p><p class="src">${IC.lock} Set by the division.</p>`
          : `<p class="fixed">Not included. The customer arranges goods-in-transit insurance with their own insurer.</p><p class="src">${IC.lock} Set by the division.</p>`}</section>`}
        <section class="tcard wide"><h2>Special conditions</h2>${field('Anything agreed that the standard terms do not cover', `<textarea class="in" rows="3" data-bind="terms.special" placeholder="Leave empty if there is nothing to add">${esc(t.special)}</textarea>`)}
          <p class="src">Text typed here is printed as its own clause and is shown to the approver.</p></section>
        <section class="tcard wide"><h2>Who signs</h2><div class="signers"><p><b>${esc(me.name)}</b><span>${esc(d.ownerTitle)}</span></p><p><b>${esc(d.approver.name)}</b><span>${esc(d.approver.title)}</span></p><p><b>${esc(q.customer.name || 'The customer')}</b><span>Acceptance block on the last page</span></p></div></section>
      </div>`;
  }

  /* ---- step 7 ---- */
  function devTable(q, max) {
    const st = M.stats(q); if (!st.devs.length) return `<p class="fine">${IC.check} Every price is at the standard rate.</p>`;
    const rows = st.devs.slice(0, max || 12);
    return `<div class="table-wrap"><table class="dev"><thead><tr><th>Service</th><th>Line</th><th>Price</th><th class="r">Standard</th><th class="r">Quoted</th><th class="r">Difference</th></tr></thead><tbody>
      ${rows.map(x => `<tr class="${x.low ? 'low' : ''}"><td>${esc(x.block)}</td><td>${esc(x.row)}</td><td>${esc(x.col)}</td><td class="r num">${fmt.money(x.std, x.dec)}</td><td class="r num">${fmt.money(x.val, x.dec)}</td><td class="r num"><b>${x.pct > 0 ? '+' : '−'}${fmt.pct(Math.abs(x.pct), 1)}</b></td></tr>`).join('')}
      </tbody></table></div>${st.devs.length > rows.length ? `<p class="hint">And ${st.devs.length - rows.length} more changed prices.</p>` : ''}`;
  }
  function summary(q) {
    const d = M.div(q.divId), e = estText(q), st = M.stats(q);
    return `<dl class="facts in-step">
      <div><dt>Customer</dt><dd>${esc(q.customer.name || '—')}</dd></div>
      <div><dt>Division</dt><dd>${strap(d, 'sm')}</dd></div>
      <div><dt>Estimate a month</dt><dd class="num">${e || '—'}</dd></div>
      <div><dt>${q.divId === 'vff' ? 'Shoot' : 'Contract'}</dt><dd>${q.divId === 'vff' ? M.weeks(q) + ' week' + (M.weeks(q) === 1 ? '' : 's') : q.terms.months + ' month' + (q.terms.months === 1 ? '' : 's')}</dd></div>
      <div><dt>Payment</dt><dd>${q.terms.payDays} days</dd></div>
      <div><dt>Prices changed</dt><dd>${st.changed} of ${st.total}</dd></div>
    </dl>`;
  }
  function stepApprove(q) {
    const fixes = M.blockers(q), reasons = M.approvalReasons(q), aps = M.approvers(q);
    if (q.status === 'awaiting') return `<h1>Waiting for approval</h1><p class="lead">Sent to ${esc(aps.map(a => a.name).join(' and '))}. You will be able to send the quote once it is approved.</p>
      ${summary(q)}<div class="callout"><b>Trying the mockup?</b> Open the approval inbox and approve it yourself. <a class="btn sm" href="#/approvals/${q.id}">Open in approvals</a></div>`;
    if (q.status !== 'draft') return `<h1>Approved</h1><p class="lead">${esc(q.timeline.filter(t => t.what === 'Approved').map(t => `${t.who} approved this quote on ${fmt.date(t.when)}.`).slice(-1)[0] || 'This quote has been approved.')}</p>${summary(q)}`;
    return `<h1>Check, then send for approval</h1>
      <p class="lead">This is what the approver will see. Nothing goes to the customer from this step.</p>
      ${fixes.length ? `<div class="callout bad"><h2>${fixes.length} thing${fixes.length > 1 ? 's' : ''} to fix first</h2><ul>${fixes.map(c => `<li><button class="link" data-act="jump" data-step="${c.step}">${esc(c.text)}</button><small>${STEPS[c.step - 1]}</small></li>`).join('')}</ul></div>` : ''}
      ${summary(q)}
      <section class="panel"><h2>Where this quote differs from the standard rates</h2>${devTable(q)}</section>
      ${reasons.length ? `<section class="panel"><h2>What the approver is asked to accept</h2><ul class="reasons">${reasons.map(c => `<li>${IC.alert}<span>${esc(c.text)}</span></li>`).join('')}</ul></section>` : ''}
      <section class="panel"><h2>Who approves</h2><ul class="who">${aps.map(a => `<li><b>${esc(a.name)}</b><span>${esc(a.title)}</span><small>${esc(a.why)}</small></li>`).join('')}</ul>
        ${field('Note to the approver', `<textarea class="in" rows="3" data-bind="note" placeholder="Why these prices, anything they should know">${esc(q.note)}</textarea>`)}</section>
      <div class="go"><button class="btn primary lg" data-act="submit" ${fixes.length ? 'disabled' : ''}>Send for approval</button>${fixes.length ? '<span class="hint">Fix the items above first.</span>' : ''}</div>`;
  }

  /* ---- step 8 ---- */
  function stepSend(q) {
    const d = M.div(q.divId), k = q.contact;
    const letter = `<div class="letter-fit">${VQ.doc.render(q)}</div>`;
    if (q.status === 'draft' || q.status === 'awaiting') return `<h1>Send to the customer</h1><p class="lead">A quote can be sent once it is approved. ${q.status === 'draft' ? 'This one has not gone for approval yet.' : 'This one is waiting for its approver.'}</p>
      <div class="go"><a class="btn primary" href="#/quote/${q.id}/step/7">Go to Approve</a></div><h2 class="over">The letter so far</h2>${letter}`;
    const attach = `<ul class="attach"><li>${IC.doc}<span><b>${esc(d.title.toLowerCase().replace(/^./, c => c.toUpperCase()))}</b><small>${esc(M.ref(q))}, on the ${esc(d.name)} letterhead</small></span></li>
      ${d.id === 'vcl' ? `<li>${IC.doc}<span><b>Annexure to the Value Chemical Logistics rates schedule</b><small>Dangerous goods rules, zones, transit times, line-haul dispatch days</small></span></li>` : ''}
      ${d.id === 'exp' ? `<li>${IC.doc}<span><b>Annexure to the rates schedule</b><small>Main centres, what each surcharge means, how mass is worked out, claims</small></span></li>${q.sel['exp.box'] ? `<li>${IC.doc}<span><b>Annexure A and B – rates per box and box specifications</b><small>Spreadsheet, for the boxes in this quote</small></span></li>` : ''}` : ''}
      ${d.id === 'whs' ? `<li>${IC.doc}<span><b>Annexure to the warehousing rates schedule</b><small>Pallet sizes, consumables, stock takes, overtime rules</small></span></li>` : ''}
      ${d.id === 'log' ? `<li>${IC.doc}<span><b>Annexure to the distribution rates schedule</b><small>Zones, lead times, what each surcharge means, how mass is worked out, claims</small></span></li>` : ''}</ul>`;
    const head = q.status === 'approved'
      ? `<h1>Send to the customer</h1><p class="lead">Approved and ready. It goes to ${esc(k.title)} ${esc(k.name)} at ${esc(k.email || 'the address on file')}, and stays valid until ${fmt.date(M.validUntil(q))}.</p>${attach}
         <div class="go"><button class="btn primary lg" data-act="send" data-id="${q.id}">Send to ${esc(k.name.split(' ')[0] || 'customer')}</button><button class="btn" data-act="print" data-id="${q.id}">Download PDF</button></div>`
      : q.status === 'sent'
        ? `<h1>With the customer</h1><p class="lead">Sent to ${esc(k.name)}. Valid until ${fmt.date(M.validUntil(q))}. Record the answer when it comes.</p>${attach}
           <div class="go"><button class="btn primary lg" data-act="accept" data-id="${q.id}">Mark accepted</button><button class="btn" data-act="decline" data-id="${q.id}">Mark declined</button><button class="btn ghost" data-act="print" data-id="${q.id}">Download PDF</button></div>`
        : `<h1>${STATUS[q.status]}</h1><p class="lead">${q.status === 'accepted' ? 'These rates are now active for the customer.' : 'This quote is closed.'}</p><div class="go"><a class="btn primary" href="#/quote/${q.id}">Open the quote page</a><button class="btn" data-act="print" data-id="${q.id}">Download PDF</button></div>`;
    return head + `<h2 class="over">The letter</h2>${letter}`;
  }

  /* =====================================================================
     3. Approval inbox
     ===================================================================== */
  function viewApprovals(selId) {
    setNav('approvals');
    const list = M.store.quotes.filter(q => q.status === 'awaiting');
    const q = list.find(x => x.id === selId) || list[0];
    const item = x => { const d = M.div(x.divId), n = M.approvalReasons(x).length;
      return `<li><a class="appr-item ${q && q.id === x.id ? 'on' : ''}" href="#/approvals/${x.id}"><b>${esc(x.customer.name)}</b><span class="ref">${esc(M.ref(x))}</span>${strap(d, 'sm')}<span class="row"><span class="num">${estText(x) || '—'} a month</span><em>${n ? n + ' to weigh up' : 'All standard'}</em></span><small>From ${esc(M.user(x.owner).name)}, ${fmt.dshort(x.timeline[x.timeline.length - 1].when)}</small></a></li>`; };
    let detail = `<div class="appr-none"><img src="assets/brand-arrow.png" alt=""><h2>Nothing is waiting</h2><p>Quotes sent for approval appear here.</p></div>`;
    if (q) {
      const d = M.div(q.divId), reasons = M.approvalReasons(q);
      detail = `<header class="q-head"><div><h1>${esc(q.customer.name)}</h1><p class="q-sub"><span class="ref">${esc(M.ref(q))}</span>${strap(d)}<span>From ${esc(M.user(q.owner).name)}</span></p></div></header>
        ${summary(q)}
        ${q.note ? `<blockquote class="note"><p>${esc(q.note)}</p><cite>${esc(M.user(q.owner).name)}</cite></blockquote>` : ''}
        <section class="panel"><h2>What you are asked to accept</h2>${reasons.length ? `<ul class="reasons">${reasons.map(c => `<li>${IC.alert}<span>${esc(c.text)}</span></li>`).join('')}</ul>` : `<p class="fine">${IC.check} Standard prices and standard terms. This only needs your signature.</p>`}</section>
        <section class="panel"><h2>Prices that differ from the standard rates</h2>${devTable(q, 10)}</section>
        <details class="panel"><summary>Read the full letter</summary><div class="letter-fit">${VQ.doc.render(q)}</div></details>
        <section class="panel decide"><h2>Your decision</h2>${`<label class="f"><span>Comment for ${esc(M.user(q.owner).name.split(' ')[0])}</span><textarea class="in" rows="2" id="appr-note" placeholder="Optional when approving. Say what to change when sending back."></textarea></label>`}
          <div class="go"><button class="btn primary lg" data-act="approve" data-id="${q.id}">Approve</button><button class="btn" data-act="send-back" data-id="${q.id}">Send back for changes</button></div></section>`;
    }
    page('p-appr', `<header class="page-head"><div><h1>Approvals</h1><p class="sub">Quotes waiting for a second signature. In this mockup you approve as the division’s approver.</p></div></header>
      <div class="appr"><ul class="appr-list">${list.map(item).join('') || '<li class="none">No quotes are waiting.</li>'}</ul><div class="appr-detail">${detail}</div></div>`);
  }

  /* =====================================================================
     5. Set-up
     ===================================================================== */
  function viewSetup(tab) {
    setNav('setup');
    const s = ui.setup; if (tab) s.tab = tab;
    const tabs = [['rates', 'Rate books'], ['fuel', 'Fuel table'], ['clauses', 'Clause library'], ['lists', 'Shared lists'], ['rules', 'Approval rules']];
    let body = '';
    if (s.tab === 'rates') {
      const blocks = M.blocksOf(s.div); if (!blocks.includes(s.block)) s.block = blocks[0];
      const b = BLOCKS[s.block];
      const tbl = t => `<h3>${esc(t.title)}</h3><div class="table-wrap"><table class="rb"><thead><tr>${t.cols.map(c => `<th class="${c.type === 'price' || c.type === 'calc' ? 'r' : ''}">${esc(M.text(null, t, c.label))}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${t.cols.map(c =>
        c.type === 'calc' ? `<td class="r muted">${c.key === 'qty' ? 'per quote' : esc(M.calc(null, t, r, c).text)}</td>` : c.type === 'price' ? `<td class="r num">${r.s[c.key] == null ? (r.t && r.t[c.key] ? esc(r.t[c.key]) : '–') : (r.por && r.por[c.key] ? 'On request' : fmt.money(r.s[c.key], c.dec))}</td>` : `<td>${c.key === 'kmIncl' ? fmt.num(r.l[c.key]) : esc(M.text(null, t, r.l[c.key]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      body = `<div class="setup-two"><nav class="side-nav"><div class="seg">${DIVISIONS.filter(d => d.enabled).map(d => `<button class="${s.div === d.id ? 'on' : ''}" data-act="setup-div" data-id="${d.id}">${esc(d.strap)}</button>`).join('')}</div>
          <ul>${blocks.map(id => `<li><button class="${s.block === id ? 'on' : ''}" data-act="setup-block" data-id="${id}">${esc(BLOCKS[id].name)}<small>${BLOCKS[id].kind === 'service' ? 'Service' : 'Extra'}</small></button></li>`).join('')}</ul>
          <p class="hint">The other five divisions would each have a rate book here.</p></nav>
        <div><div class="setup-head"><h2>${esc(b.name)}</h2><p>${esc(b.desc)}</p><p class="src">Standard rates effective ${fmt.date('2026-10-01')}. Sales may quote up to ${Math.round(VQ.FLOOR * 100)}% below these without extra approval.</p></div>${b.tables.map(tbl).join('')}</div></div>`;
    } else if (s.tab === 'fuel') {
      body = `<div class="setup-head"><h2>Fuel table</h2><p>One place for the pump price and each division’s surcharge. Every new quote reads the top row, so no letter carries last month’s price.</p></div>
        <div class="table-wrap"><table class="rb"><thead><tr><th>From</th><th class="r">Inland, a litre</th><th class="r">Coastal, a litre</th><th class="r">Express surcharge</th><th class="r">Logistics surcharge</th><th class="r">Chemical surcharge</th></tr></thead><tbody>
        ${VQ.FUEL.map((f, i) => `<tr class="${i ? '' : 'now'}"><td>${fmt.date(f.date)}${i ? '' : ' <span class="tag">Current</span>'}</td><td class="r num">${fmt.money(f.inland)}</td><td class="r num">${fmt.money(f.coastal)}</td><td class="r num">${fmt.pct(f.pct.exp)}</td><td class="r num">${fmt.pct(f.pct.log)}</td><td class="r num">${fmt.pct(f.pct.vcl)}</td></tr>`).join('')}</tbody></table></div>
        <p class="hint">Surcharge quotes are adjusted in January, April, July and October. Truck Rental and Film Fleet charge fuel separately; Dedicated Distribution turns the price into a rate per kilometre.</p>`;
    } else if (s.tab === 'clauses') {
      body = `<div class="setup-head"><h2>Clause library</h2><p>Each clause is written once. The highlighted blanks are filled in by the engine from the quote.</p></div>
        <ul class="clauses">${VQ.CLAUSES.map(c => `<li><header><h3>${esc(c.title)}</h3><span>${c.divs.map(id => strap(M.div(id), 'sm')).join('')}</span></header><p>${esc(c.text).replace(/\{(\w+)\}/g, '<mark>$1</mark>')}</p></li>`).join('')}</ul>`;
    } else if (s.tab === 'lists') {
      body = `<div class="setup-head"><h2>Shared lists</h2><p>Picked from, never typed. One name for each vehicle, job and centre across every division.</p></div>
        <div class="lists"><section><h3>Vehicles</h3><table class="rb"><thead><tr><th>Name</th><th class="r">Tons</th><th>Notes</th></tr></thead><tbody>${VQ.VEHICLES.map(v => `<tr><td>${esc(v.name)}</td><td class="r num">${v.tons}</td><td>${[v.fridge ? 'Refrigerated' : '', v.pax ? 'Passenger, no damage waiver' : '', v.tons >= 12 ? 'Value driver only' : ''].filter(Boolean).join(', ')}</td></tr>`).join('')}</tbody></table></section>
        <section><h3>Job types</h3>${Object.keys(VQ.JOBS).map(g => `<h4>${g}</h4><p class="tags">${VQ.JOBS[g].map(j => `<span>${esc(j)}</span>`).join('')}</p>`).join('')}
          <h3>Centres</h3><p class="tags">${VQ.CENTRES.map(([c, n]) => `<span><b>${c}</b> ${esc(n)}</span>`).join('')}</p><p class="hint">A destination is a centre plus a zone, for example CPT1. Zone 1 is the metropolitan area; zones 2 to 4 are further out.</p></section></div>`;
    } else {
      body = `<div class="setup-head"><h2>Approval rules</h2><p>Who has to agree before a quote can be sent. These are proposals to be confirmed with the business.</p></div>
        <div class="table-wrap"><table class="rb"><thead><tr><th>When</th><th>Who approves</th><th>Based on</th></tr></thead><tbody>${VQ.RULES.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td class="muted">${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>`;
    }
    page('p-setup', `<header class="page-head"><div><h1>Set-up</h1><p class="sub">The things every quote draws on. Kept by administrators, changed rarely.</p></div></header>
      <div class="tabs" role="tablist">${tabs.map(([id, name]) => `<a role="tab" aria-selected="${s.tab === id}" href="#/setup/${id}">${name}</a>`).join('')}</div>${body}`);
  }

  /* =====================================================================
     Dialogs and printing
     ===================================================================== */
  function closeDialog() { const m = $('#modal'); if (m) m.remove(); ui.dlg = null; }
  function dialog(title, body, okLabel, onOk) {
    closeDialog(); ui.dlg = onOk;
    const m = document.createElement('div'); m.id = 'modal';
    m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2>${body}<div class="go"><button class="btn primary" data-act="dlg-ok">${esc(okLabel)}</button><button class="btn ghost" data-act="dlg-cancel">Cancel</button></div></div>`;
    document.body.appendChild(m); const f = $('input,textarea,button', m); if (f) f.focus();
  }
  function printLetter(q) {
    let p = $('#print-root'); if (!p) { p = document.createElement('div'); p.id = 'print-root'; document.body.appendChild(p); }
    p.innerHTML = VQ.doc.render(q); setTimeout(() => window.print(), 60);
  }

  /* =====================================================================
     Actions
     ===================================================================== */
  const Q = t => M.get(t.dataset.id) || cur;
  const tableOf = key => { const [bid, tid] = key.split('|'); return { bid, tid }; };
  const actions = {
    'new-quote'() { const q = M.create(); ui.cust = ''; ui.peek = null; ui.tab = 'letter'; ui.sideOpen = false; go(`quote/${q.id}/step/1`); },
    filter(t) { ui.filter = t.dataset.v; viewQuotes(); },
    'clear-filters'() { ui.filter = 'all'; ui.div = ''; ui.search = ''; ui.mine = false; viewQuotes(); },
    open(t, e) { if (e.target.closest('a')) return; go('quote/' + t.dataset.id); },
    edit(t) { const q = Q(t); ui.sideOpen = false; go(`quote/${q.id}/step/${Math.min(q.seen || 1, 7)}`); },
    delete(t) { const q = Q(t); dialog('Delete this draft?', `<p>${esc(M.ref(q))} for ${esc(q.customer.name || 'no customer yet')} will be removed.</p>`, 'Delete draft', () => { M.remove(q); toast('Draft deleted'); go('quotes'); }); },

    'pick-cust'(t) { M.setCustomer(cur, VQ.CUSTOMERS.find(c => c.id === t.dataset.id)); M.save(); renderWork(true); refreshChrome(true); },
    'new-prospect'() { const q = cur; q.custId = 'new'; q.customer = { name: '', acc: '', street: '', suburb: '', town: '', code: '', tel: '' }; q.contact = { title: 'Mr', name: '', role: '', email: '' }; M.save(); renderWork(true); refreshChrome(true); const f = $('[data-bind="customer.name"]'); if (f) f.focus(); },
    'pick-contact'(t) { const c = VQ.CUSTOMERS.find(x => x.id === cur.custId); cur.contact = Object.assign({}, c.contacts[+t.dataset.i]); M.save(); renderWork(true); refreshChrome(true); },
    'pick-div'(t) {
      const d = M.div(t.dataset.id);
      if (!d.enabled) { ui.peek = d.id; renderWork(true); return; }
      ui.peek = null; if (cur.divId !== d.id) M.setDivision(cur, d.id); M.save(); renderWork(true); refreshChrome(true);
    },
    'ff-sample'() {
      const F = VQ.FF_SAMPLE, st = cur.profile.film.start || VQ.addDays(VQ.today, 21);
      cur.profile.vehicles = F.vehicles.map(v => Object.assign({}, v)); Object.assign(cur.profile.film, { production: F.production, start: st, end: VQ.addDays(st, F.days), base: F.base });
      Object.assign(cur.terms, { insurer: F.insurer, policy: F.policy, cover: F.cover, insFrom: st, insTo: VQ.addDays(st, F.days + 7) });
      M.applyProfile(cur); M.save(); renderWork(true); refreshChrome(); toast('Sample shoot filled in');
    },
    'add-ffveh'() { cur.profile.vehicles.push({ veh: '', qty: 1, km: 800 }); M.save(); renderWork(true); },
    'vcl-sample'() {
      const V = VQ.VCL_SAMPLE; cur.profile.vcl = { hubs: V.hubs.slice(), vol: JSON.parse(JSON.stringify(V.vol)), litres: cur.sel['vcl.decant'] ? 12000 : V.litres, haz: V.haz.slice() };
      M.applyProfile(cur); M.save(); renderWork(true); refreshChrome(); toast('Sample volumes filled in');
    },
    'dd-sample'() {
      cur.profile.fleet = VQ.DD_SAMPLE.fleet.map(f => Object.assign({}, f)); cur.profile.crew = JSON.parse(JSON.stringify(VQ.DD_SAMPLE.crew));
      if (!cur.sel['vdd.labour']) M.toggleBlock(cur, 'vdd.labour', true);
      M.applyProfile(cur); M.save(); renderWork(true); refreshChrome(); toast('Sample fleet filled in');
    },
    'add-fl'() { cur.profile.fleet.push({ veh: '', branch: '', qty: 1, km: 4000 }); M.save(); renderWork(true); },
    'del-fl'(t) { cur.profile.fleet.splice(+t.dataset.i, 1); M.applyProfile(cur); M.save(); renderWork(true); refreshChrome(); },
    'exp-sample'() {
      const e = cur.profile.exp, S = VQ.EXP_SAMPLE;
      Object.keys(S.dom).forEach(k => { e.dom[k] = S.dom[k].slice(); }); Object.assign(e.boxes, S.boxes); Object.assign(e.intl, S.intl);
      M.applyProfile(cur, 'exp.box'); M.save(); renderWork(true); refreshChrome(); toast('Sample volumes filled in');
    },
    'wh-sample'() {
      (cur.profile.warehouses || []).forEach((c, i) => { const f = i ? 1.12 : 1; const w = cur.profile.wh[c] = cur.profile.wh[c] || { vol: {} };
        w.pallets = Math.round(VQ.WH_SAMPLE.pallets * (i ? .9 : 1)); Object.keys(VQ.WH_SAMPLE.vol).forEach(k => { w.vol[k] = Math.round(VQ.WH_SAMPLE.vol[k] * f); }); });
      M.save(); renderWork(true); refreshChrome(); toast('Sample volumes filled in');
    },
    'add-veh'() { cur.profile.vehicles.push({ veh: '', qty: 1, km: 3000, driver: '' }); M.save(); renderWork(true); },
    'del-veh'(t) { cur.profile.vehicles.splice(+t.dataset.i, 1); M.applyProfile(cur); M.save(); renderWork(true); refreshChrome(); },

    adjust(t) {
      const { bid, tid } = tableOf(t.dataset.key), box = $('input', t.closest('.tools')), pct = fmt.parseNum(box.value);
      if (!pct) { box.focus(); return; }
      M.adjust(cur, bid, tid, pct); M.save(); renderWork(true); refreshChrome(); toast(`Prices ${pct > 0 ? 'raised' : 'lowered'} by ${fmt.pct(Math.abs(pct), 1)}`);
    },
    'reset-table'(t) { const { bid, tid } = tableOf(t.dataset.key); M.resetTable(cur, bid, tid); M.save(); renderWork(true); refreshChrome(); toast('Back to the standard rates'); },
    'toggle-off'(t) { ui.showOff[t.dataset.key] = !ui.showOff[t.dataset.key]; renderWork(true); },
    'side-tab'(t) { ui.tab = t.dataset.v; renderSide(true); },
    'toggle-side'() { ui.sideOpen = !ui.sideOpen; root().classList.toggle('side-open', ui.sideOpen); },
    jump(t) { go(`quote/${cur.id}/step/${t.dataset.step}`); },
    'refresh-fuel'() { const f = VQ.fuelNow(); cur.fuel = { date: f.date, price: f.inland, coastal: f.coastal, pct: f.pct[cur.divId] }; M.save(); renderWork(true); refreshChrome(); },

    submit() { M.submit(cur); toast('Sent for approval'); viewWizard(cur, 7); },
    approve(t) { const q = Q(t), note = ($('#appr-note') || {}).value || ''; M.approve(q, note); toast(`Approved ${M.ref(q)}`); go('quote/' + q.id); },
    'send-back'(t) { const q = Q(t), box = $('#appr-note'); if (!box.value.trim()) { box.focus(); box.placeholder = 'Say what should change before you send it back'; return; } M.sendBack(q, box.value.trim()); toast('Sent back for changes'); go('approvals'); },
    send(t) { const q = Q(t); M.send(q); toast(`Sent to ${q.contact.name}`); cur ? viewWizard(q, 8) : viewQuote(q); },
    accept(t) { const q = Q(t); M.outcome(q, 'accepted'); toast('Marked as accepted'); go('quote/' + q.id); if (!cur) viewQuote(q); },
    decline(t) { const q = Q(t); M.outcome(q, 'declined'); toast('Marked as declined'); go('quote/' + q.id); if (!cur) viewQuote(q); },
    print(t) { printLetter(Q(t)); },
    revise(t) { const n = M.revise(Q(t)); toast(`Revision ${n.rev} started`); go(`quote/${n.id}/step/4`); },
    copy(t) { const n = M.copy(Q(t)); ui.cust = ''; toast('Copied. Choose the new customer.'); go(`quote/${n.id}/step/1`); },
    escalate(t) {
      const q = Q(t), d = M.div(q.divId);
      dialog('Escalate and re-issue', `<p>Raises every price in this quote and starts a new revision for approval. The initial quote date stays the same.</p><label class="f"><span>Increase, %</span><input class="in" id="dlg-pct" type="text" inputmode="decimal" value="${fmt.num(d.esc.min || 6.5, 1)}"></label>`, 'Start the revision', () => {
        const pct = fmt.parseNum($('#dlg-pct').value); if (!pct) return false;
        const n = M.revise(q, { pct, label: `Escalated by ${fmt.pct(pct, 1)} from revision ${q.rev}` }); toast(`Revision ${n.rev} started with prices up ${fmt.pct(pct, 1)}`); go(`quote/${n.id}/step/4`);
      });
    },
    extend(t) {
      const q = Q(t);
      dialog('Extend the contract', `<p>Starts a new revision that begins when the current contract ends, on ${fmt.date(VQ.addMonths(q.terms.start, q.terms.months))}, at today’s prices.</p><label class="f"><span>Further months</span><input class="in" id="dlg-months" type="number" min="1" value="12"></label>`, 'Start the extension', () => {
        const m = parseInt($('#dlg-months').value, 10); if (!m) return false;
        const n = M.revise(q, { extend: m, label: `Extension of ${m} months from revision ${q.rev}` }); toast('Extension started'); go(`quote/${n.id}/step/6`);
      });
    },
    'dlg-ok'() { const fn = ui.dlg; if (fn && fn() === false) return; closeDialog(); },
    'dlg-cancel'() { closeDialog(); },
    'setup-div'(t) { ui.setup.div = t.dataset.id; ui.setup.block = null; viewSetup(); },
    'setup-block'(t) { ui.setup.block = t.dataset.id; viewSetup(); },
    'reset-demo'() { dialog('Start the demo again?', '<p>Puts back the opening set of quotes and removes anything you have added.</p>', 'Reset', () => { M.reset(); toast('Demo data reset'); go('quotes'); route(); }); },
    'user-menu'() { $('#user-menu').hidden = !$('#user-menu').hidden; },
  };

  const changes = {
    'toggle-block'(el) { M.toggleBlock(cur, el.dataset.bid, el.checked); M.save(); renderWork(true); refreshChrome(); },
    'row-on'(el) { const { bid, tid } = tableOf(el.dataset.key); M.line(cur, bid, tid, el.dataset.rid).on = el.checked; M.save(); renderWork(true); refreshChrome(); },
    incl(el) { if (el.checked) delete cur.inclOff[el.dataset.id]; else cur.inclOff[el.dataset.id] = true; M.save(); refreshChrome(); },
    pv(el) {
      const v = cur.profile.vehicles[+el.dataset.i], k = el.dataset.k; if (!v) return;
      v[k] = (k === 'qty' || k === 'km') ? (parseInt(el.value, 10) || 0) : el.value;
      M.applyProfile(cur); M.save(); const m = $('#match'); if (m) m.innerHTML = matchHTML(cur); const sh = $('#shoot'); if (sh) sh.innerHTML = shootHTML(cur); refreshChrome();
    },
    vhub(el) { const h = cur.profile.vcl.hubs, c = el.dataset.code; if (el.checked && !h.includes(c)) h.push(c); if (!el.checked) h.splice(h.indexOf(c), 1); M.applyProfile(cur); M.save(); renderWork(true); refreshChrome(); },
    vhaz(el) { const h = cur.profile.vcl.haz, c = el.dataset.id; if (el.checked && !h.includes(c)) h.push(c); if (!el.checked) h.splice(h.indexOf(c), 1); M.save(); refreshChrome(); },
    vvol(el) { const v = cur.profile.vcl.vol[el.dataset.c] = cur.profile.vcl.vol[el.dataset.c] || [null, null]; v[+el.dataset.k] = fmt.parseNum(el.value); M.save(); const b = $('#band'); if (b) b.innerHTML = bandHTML(cur); refreshChrome(); },
    fl(el) {
      const f = cur.profile.fleet[+el.dataset.i], k = el.dataset.k; if (!f) return;
      f[k] = (k === 'qty' || k === 'km') ? (parseInt(el.value, 10) || 0) : el.value;
      M.applyProfile(cur); M.save(); if (k !== 'km') renderWork(true); refreshChrome();
    },
    crew(el) { const o = cur.profile.crew[el.dataset.job] = cur.profile.crew[el.dataset.job] || {}; o[el.dataset.b] = parseInt(el.value, 10) || 0; M.applyProfile(cur, 'vdd.labour'); M.save(); refreshChrome(); },
    edom(el) { const e = cur.profile.exp, v = e.dom[el.dataset.id] = e.dom[el.dataset.id] || [null, null]; v[+el.dataset.k] = fmt.parseNum(el.value); M.save(); refreshChrome(); },
    ebox(el) { cur.profile.exp.boxes[el.dataset.id] = fmt.parseNum(el.value) || 0; M.applyProfile(cur, 'exp.box'); M.save(); refreshChrome(); },
    wh(el) {
      const ws = cur.profile.warehouses = cur.profile.warehouses || [], c = el.dataset.code;
      if (el.checked && !ws.includes(c)) ws.push(c); if (!el.checked) ws.splice(ws.indexOf(c), 1);
      ws.sort(); cur.profile.wh[c] = cur.profile.wh[c] || { pallets: null, vol: {} };
      M.save(); renderWork(true); refreshChrome();
    },
    'div-filter'(el) { ui.div = el.value; viewQuotes(); },
    mine(el) { ui.mine = el.checked; viewQuotes(); },
  };
  const afters = {
    work() { renderWork(true); },
    shoot() { const v = $('#shoot'); if (v) v.innerHTML = shootHTML(cur); },
    vol() { const v = $('#vol'); if (v) v.innerHTML = volHTML(cur); },
    whcalc() { const v = $('#whcalc'); if (v) v.innerHTML = whCalcHTML(cur); },
  };
  function bound(el, final) {
    const q = cur; if (!q) return;
    let v = el.value; const dt = el.dataset.type;
    if (dt === 'num') v = fmt.parseNum(v);
    if (dt === 'int') { v = parseInt(v, 10); if (isNaN(v)) v = null; }
    if (el.type === 'radio' && !el.checked) return;
    setPath(q, el.dataset.bind, v); M.save();
    if (el.dataset.after && (final || el.dataset.after !== 'work')) afters[el.dataset.after]();
    refreshChrome();
  }
  function price(el, final) {
    const [bid, tid, rid, key] = el.dataset.price.split('|'), ln = M.line(cur, bid, tid, rid);
    const t = BLOCKS[bid].tables.find(x => x.id === tid), r = t.rows.find(x => x.id === rid), c = t.cols.find(x => x.key === key), raw = el.value.trim();
    if (/^(on request|por)$/i.test(raw)) ln.por[key] = true; else { delete ln.por[key]; ln.p[key] = fmt.parseNum(raw); }
    M.save();
    const td = el.closest('td'), st = cellState(r, c, ln); td.className = 'pc ' + st.cls; $('.pmeta', td).innerHTML = st.meta;
    if (final) el.value = cellText(c, ln);
    refreshChrome();
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!e.target.closest('#user-menu, [data-act="user-menu"]')) { const m = $('#user-menu'); if (m) m.hidden = true; }
    if (e.target.id === 'modal') return closeDialog();
    if (!t || !actions[t.dataset.act]) return;
    if (t.tagName === 'BUTTON' || t.tagName === 'TR') e.preventDefault();
    actions[t.dataset.act](t, e);
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.price) return price(el, false);
    if (el.dataset.bind && el.tagName !== 'SELECT' && el.type !== 'radio' && el.type !== 'date') return bound(el, false);
    if (el.dataset.chg === 'pv' && el.tagName === 'INPUT') return changes.pv(el);
    if (el.dataset.inp === 'search') { ui.search = el.value; $('#list-body').innerHTML = listBody(); }
    if (el.dataset.inp === 'calc') { ui.calc[el.dataset.k] = fmt.parseNum(el.value); $('#mass').innerHTML = massHTML(); }
    if (el.dataset.inp === 'cust') { ui.cust = el.value; $('#cust-list').innerHTML = custList(cur); }
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.price) return price(el, true);
    if (el.dataset.chg && changes[el.dataset.chg]) return changes[el.dataset.chg](el);
    if (el.dataset.bind) return bound(el, true);
  });
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('pin')) e.target.select(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDialog();
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('pin')) {
      /* Enter moves down the column, the way a spreadsheet does */
      const td = e.target.closest('td'), tr = td.parentElement, i = Array.from(tr.children).indexOf(td), next = tr.nextElementSibling;
      const n = next && next.children[i] && $('input.pin', next.children[i]); if (n) { e.preventDefault(); n.focus(); }
    }
  });
  window.addEventListener('hashchange', route);

  if (!M.load()) M.reset();
  route();
})(window.VQ);
