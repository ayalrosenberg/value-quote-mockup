/* =====================================================================
   Value Quoting — mockup data

   SAMPLE DATA. Every price, customer and person in this file is invented
   for the demo. Clause wording, list structures and the few fixed fees
   (contract fee, valet fee, recovery fee, fine redirection, documentation
   fees, night-work allowance) follow Value's current quote letters.
   ===================================================================== */
window.VQ = window.VQ || {};
(function (VQ) {
  'use strict';

  /* ---------- dates ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const today = new Date(); today.setHours(12, 0, 0, 0);
  VQ.today = iso(today);
  VQ.addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  VQ.addMonths = (s, n) => { const d = parse(s); d.setMonth(d.getMonth() + n); return iso(d); };
  VQ.dayOffset = n => VQ.addDays(VQ.today, n);
  VQ.daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  /* next occurrence of day/month strictly after a date */
  VQ.nextOn = (s, month, day) => {
    const d = parse(s); let y = d.getFullYear();
    let c = new Date(y, month - 1, day, 12);
    if (c <= d) c = new Date(y + 1, month - 1, day, 12);
    return iso(c);
  };

  /* ---------- formatting, the way Value's letters write it ---------- */
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  VQ.fmt = {
    money(n, dec = 2) {
      if (n == null || isNaN(n)) return '';
      const neg = n < 0; n = Math.abs(n);
      const [i, f] = n.toFixed(dec).split('.');
      return (neg ? '-' : '') + 'R' + group(i) + (dec ? ',' + f : '');
    },
    short(n) { /* R445k, R1,2m */
      if (n == null || isNaN(n)) return '—';
      if (n >= 1e6) return 'R' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + 'm';
      if (n >= 1e3) return 'R' + Math.round(n / 1e3) + 'k';
      return 'R' + Math.round(n);
    },
    num(n, dec = 0) {
      if (n == null || isNaN(n)) return '';
      const [i, f] = Number(n).toFixed(dec).split('.');
      return group(i) + (dec ? ',' + f : '');
    },
    pct(n, dec = 2) { return Number(n).toFixed(dec).replace('.', ',') + '%'; },
    date(s) { if (!s) return ''; const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; },
    dshort(s) { if (!s) return ''; const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; },
    dord(s) { if (!s) return ''; const d = parse(s); return `${ord(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; },
    dayMonth(month, day) { return `${ord(day)} ${MONTHS[month - 1]}`; },
    parseNum(str) {
      if (str == null) return null;
      const s = String(str).replace(/[Rr\s ]/g, '').replace(',', '.');
      if (s === '') return null;
      const n = Number(s);
      return isNaN(n) ? null : n;
    },
  };

  /* ---------- the seven brands ---------- */
  VQ.DIVISIONS = [
    {
      id: 'vtr', name: 'Value Truck Rental', strap: 'Truck Rental', color: '#782890', ink: '#fff', enabled: true,
      family: 'Vehicles over time', sells: 'Trucks and vans by the day, week or month, with or without a driver.',
      logo: 'assets/logo-truck-rental.png', title: 'TRANSPORT RATES', closing: 'Yours sincerely', opener: '',
      fuelMode: 'separate', payDays: 30, esc: { charges: [10, 1], labour: [3, 1] },
      ownerTitle: 'Business Development Executive', approver: { name: 'Johan Botha', title: 'Sales Manager' },
    },
    {
      id: 'log', name: 'Value Logistics', strap: 'Logistics', color: '#782890', ink: '#fff', enabled: true,
      family: 'Shipments', sells: 'Distribution to stores, distribution centres and homes, nationally and over the border.',
      logo: 'assets/logo-logistics.png', title: 'DISTRIBUTION RATES SCHEDULE', closing: 'Yours faithfully',
      opener: 'We thank you for your enquiry and take pleasure in submitting the following proposal for your approval.',
      fuelMode: 'surcharge', payDays: 30, esc: { charges: [1, 1], labour: [1, 1], min: 7.5 },
      ownerTitle: 'Regional Supply Chain Manager', approver: { name: 'Thabo Mokoena', title: 'National Divisional Director Supply Chain' },
    },
    {
      id: 'exp', name: 'Value Express', strap: 'Express', color: '#F8B800', ink: '#201820', enabled: true,
      family: 'Shipments', sells: 'Door-to-door courier, local and international, priced by weight or by box.',
      logo: 'assets/logo-express.png', title: 'RATES SCHEDULE', closing: 'Yours faithfully', singleSign: true, noPeriod: true,
      opener: 'The Department of Fuel and Energy has advised that effective from {date} the fuel rate will be {price} per litre.',
      fuelMode: 'surcharge', fuelClause: 'fuelmon', payDays: 30, esc: { charges: [1, 1], labour: [1, 1] },
      ownerTitle: 'Sales Executive', approver: { name: 'Naledi Sithole', title: 'Divisional Manager – Express' },
      footer: ['Value Logistics Proprietary Limited | Registration Number: 1920/000560/07 | Registered Address: 10 Essex Street, Tunney Ext. 10, Elandsfontein, 1601', 'PO BOX 778 Isando, 1600 | Business Address: 277 Maple Road, Pomona AH, Kempton Park, 1619 | Tel: +27 11 570 2000 | Customer Care Centre: 0861 900 400'],
    },
    {
      id: 'vcl', name: 'Value Chemical Logistics', strap: 'Chemical Logistics', color: '#0068A0', ink: '#fff', enabled: true,
      family: 'Shipments', sells: 'Dangerous goods between branches and on to customers, priced by lane and weight band; decanting.',
      logo: 'assets/logo-chemical.png', title: 'DISTRIBUTION RATES SCHEDULE', closing: 'Yours faithfully', opener: '',
      fuelMode: 'surcharge', payDays: 60, months: 12, esc: { charges: [1, 1], labour: [1, 1] },
      ownerTitle: 'Customer Relations Specialist Manager', approver: { name: 'Kagiso Molefe', title: 'Commercial Manager' },
    },
    {
      id: 'whs', name: 'Value Warehousing', strap: 'Warehousing', color: '#782890', ink: '#fff', enabled: true,
      family: 'Warehouse activity', sells: 'Receiving, storage, picking and dispatch, priced per activity for each contract year.',
      logo: null, title: 'WAREHOUSING RATES SCHEDULE', closing: 'Yours faithfully',
      opener: 'We thank you for your enquiry and take pleasure in submitting the following proposal for your approval.',
      fuelMode: 'none', payDays: 30, months: 24, esc: { anniversary: true },
      ownerTitle: 'Customer Relations Manager', approver: { name: 'Thabo Mokoena', title: 'National Divisional Director Supply Chain' },
      footer: ['Value Logistics Proprietary Limited | Registration Number: 1920/000560/07 | Head Office: 49 Brewery Road, Isando, 1601', 'PO BOX 778 Isando, 1600 | Tel: +27 11 570 2000 | Customer Care Centre: 0860 1000 46'],
    },
    {
      id: 'vdd', name: 'Value Dedicated Distribution', strap: 'Dedicated Distribution', color: '#782890', ink: '#fff', enabled: true,
      family: 'Vehicles over time', sells: 'A contract fleet and crews working only for one customer, at one or more branches.',
      logo: 'assets/logo-dedicated.png', title: 'NATIONAL TRANSPORT RATES', closing: 'Yours sincerely',
      opener: 'The Department of Fuel and Energy has advised that effective from {date} the fuel price will be {price} per litre inland and {coastal} per litre at the coast.',
      fuelMode: 'perkm', payDays: 30, months: 36, esc: { charges: [11, 1], labour: [3, 1] },
      ownerTitle: 'Account Manager', approver: { name: 'Riaan du Plessis', title: 'Divisional Manager' },
    },
    {
      id: 'vff', name: 'Value Film Fleet', strap: 'Film Fleet', color: '#D83E9A', ink: '#fff', enabled: true,
      family: 'Vehicles over time', sells: 'Vehicles for film and television shoots, by the six-day week, on the production’s own insurance.',
      logo: null, title: 'FEATURE RATES', closing: 'Yours sincerely', noPeriod: true,
      opener: 'We thank you for your enquiry and take pleasure in submitting the following proposal for your approval.',
      fuelMode: 'separate', payDays: 30, months: 1, esc: { charges: [10, 1], labour: [3, 1], min: 7.5 },
      ownerTitle: 'Value Film Fleet Business Head', approver: { name: 'Marius Coetzee', title: 'Executive Operations Director' },
      footer: ['Value Logistics Proprietary Limited | Registration Number: 1920/000560/07 | Head Office: 49 Brewery Road, Isando, 1601', 'PO BOX 778 Isando, 1600 | Tel: +27 11 570 2000 | Customer Care Centre: 0860 1000 46'],
    },
  ];

  VQ.LEGAL_FOOTER = [
    'Value Logistics Proprietary Limited | Registration Number: 1920/000560/07 | Registered Address: 10 Essex Street, Tunney Ext. 10, Elandsfontein, 1601',
    'PO BOX 778 Isando, 1600 | Tel: +27 11 570 2000 | Customer Care Centre: 0860 1000 46',
  ];

  /* ---------- people (invented) ---------- */
  VQ.USERS = {
    sam: { name: 'Sam Naidoo', initials: 'sn', phone: '082 555 0134' },
    aisha: { name: 'Aisha Khan', initials: 'ak', phone: '083 555 0177' },
    lerato: { name: 'Lerato Dube', initials: 'ld', phone: '071 555 0119' },
    pieter: { name: 'Pieter van Wyk', initials: 'pw', phone: '082 555 0162' },
  };
  VQ.ME = 'sam';

  /* ---------- customers (invented) ---------- */
  VQ.CUSTOMERS = [
    { id: 'c1', name: 'Karoo Fresh Produce (Pty) Ltd', acc: 'CPT30418K', street: '14 Packhouse Road', suburb: 'Ceres Industria', town: 'Ceres', code: '6835', tel: '(023) 555 0142', contacts: [{ title: 'Ms', name: 'Nomsa Jacobs', role: 'Fleet Manager', email: 'nomsa.jacobs@karoofresh.example' }] },
    { id: 'c2', name: 'Atlantic Home & Living (Pty) Ltd', acc: 'CPT27765A', street: 'Unit 4, Protea Business Park', suburb: 'Atlantis Industrial', town: 'Cape Town', code: '7349', tel: '(021) 555 0188', contacts: [{ title: 'Mr', name: 'Daniel Petersen', role: 'Supply Chain Manager', email: 'daniel.petersen@atlantichome.example' }, { title: 'Ms', name: 'Fatima Abrahams', role: 'Logistics Co-ordinator', email: 'fatima.abrahams@atlantichome.example' }] },
    { id: 'c3', name: 'Highveld Hardware Wholesalers', acc: 'JNB11873H', street: '221 Foundry Lane', suburb: 'Elandsfontein', town: 'Germiston', code: '1429', tel: '(011) 555 0107', contacts: [{ title: 'Mr', name: 'Sipho Nkosi', role: 'Operations Director', email: 'sipho.nkosi@highveldhardware.example' }] },
    { id: 'c4', name: 'Umgeni Paper Converters', acc: 'DBN09254U', street: '6 Mill Street', suburb: 'New Germany', town: 'Pinetown', code: '3610', tel: '(031) 555 0153', contacts: [{ title: 'Ms', name: 'Priya Govender', role: 'Procurement Manager', email: 'priya.govender@umgenipaper.example' }] },
    { id: 'c5', name: 'Bushveld Agri Supplies', acc: '', street: '40 Silo Road', suburb: 'Ladine', town: 'Polokwane', code: '0699', tel: '(015) 555 0126', contacts: [{ title: 'Mr', name: 'Hennie Steyn', role: 'Owner', email: 'hennie@bushveldagri.example' }] },
    { id: 'c6', name: 'Protea Pharma Distributors', acc: 'JNB14402P', street: '17 Capsule Close', suburb: 'Halfway House', town: 'Midrand', code: '1685', tel: '(011) 555 0171', contacts: [{ title: 'Dr', name: 'Zanele Mthembu', role: 'Head of Distribution', email: 'zanele.mthembu@proteapharma.example' }] },
    { id: 'c7', name: 'Table Bay Beverages', acc: 'CPT22190T', street: '3 Bottlers Way', suburb: 'Epping Industria', town: 'Cape Town', code: '7460', tel: '(021) 555 0114', contacts: [{ title: 'Mr', name: 'Andile Zulu', role: 'Transport Manager', email: 'andile.zulu@tablebaybev.example' }] },
    { id: 'c8', name: 'Sandton Event Hire', acc: 'JNB18061S', street: '9 Marquee Street', suburb: 'Kya Sand', town: 'Randburg', code: '2163', tel: '(011) 555 0195', contacts: [{ title: 'Ms', name: 'Chloe Fourie', role: 'Operations Manager', email: 'chloe@sandtoneventhire.example' }] },
    { id: 'c9', name: 'Limpopo Citrus Packers', acc: 'POL05530L', street: 'Farm Road 12', suburb: 'Letsitele', town: 'Tzaneen', code: '0885', tel: '(015) 555 0148', contacts: [{ title: 'Mr', name: 'Willem Pretorius', role: 'Packhouse Manager', email: 'willem@limpopocitrus.example' }] },
    { id: 'c11', name: 'Lighthouse Pictures (Pty) Ltd', acc: 'JNB19244L', street: '12 Studio Lane', suburb: 'Bryanston', town: 'Sandton', code: '2191', tel: '(011) 555 0166', contacts: [{ title: 'Ms', name: 'Thandeka Mabuza', role: 'Line Producer', email: 'thandeka@lighthousepictures.example' }] },
    { id: 'c10', name: 'Garden Route Tile & Bath', acc: 'GRJ03217G', street: '55 Kiln Road', suburb: 'Tamsui Industria', town: 'George', code: '6529', tel: '(044) 555 0131', contacts: [{ title: 'Ms', name: 'Megan Daniels', role: 'Branch Manager', email: 'megan@gardenroutetile.example' }] },
  ];

  /* ---------- fuel table (prices and percentages are sample values) ---------- */
  VQ.FUEL = [
    { date: '2026-11-01', inland: 32.06, coastal: 31.27, pct: { exp: 51.22, log: 48.35, vcl: 72.40 } },
    { date: '2026-10-01', inland: 33.26, coastal: 32.47, pct: { exp: 54.10, log: 51.10, vcl: 75.60 } },
    { date: '2026-09-01', inland: 32.71, coastal: 31.92, pct: { exp: 52.80, log: 49.85, vcl: 74.10 } },
    { date: '2026-08-01', inland: 31.48, coastal: 30.69, pct: { exp: 49.85, log: 47.05, vcl: 70.90 } },
    { date: '2026-07-01', inland: 30.12, coastal: 29.33, pct: { exp: 46.60, log: 45.20, vcl: 67.30 } },
    { date: '2026-06-01', inland: 29.22, coastal: 28.43, pct: { exp: 44.45, log: 44.10, vcl: 65.00 } },
  ];
  VQ.fuelNow = () => VQ.FUEL[0];

  /* ---------- vehicles ---------- */
  VQ.VEHICLES = [
    { k: 'ldv1', name: '1 Ton L.D.V./with Canopy', tons: 1, contrib: 12500 },
    { k: 'pv1', name: '1 Ton Panelvan', tons: 1, contrib: 12500 },
    { k: 'rf1', name: '1 Ton Refrigerated Vehicle', tons: 1, fridge: true, contrib: 15000 },
    { k: 'qtm', name: 'Toyota Quantum 16 Seater', tons: 1, pax: true },
    { k: 'cs4', name: '4 Ton Curtainside/Panelvan', tons: 4, contrib: 18500 },
    { k: 'tl4', name: '4 Ton Panelvan with Taillift', tons: 4, contrib: 18500 },
    { k: 'rf4', name: '4 Ton Refrigerated Vehicle', tons: 4, fridge: true, contrib: 22500 },
    { k: 'cs8', name: '8 Ton Curtainside/Panelvan', tons: 8, contrib: 25000 },
    { k: 'tl8', name: '8 Ton Curtainside/Panelvan with Taillift', tons: 8, contrib: 25000 },
    { k: 'pv12', name: '12 Ton Panelvan', tons: 12, contrib: 32500 },
    { k: 'rf12', name: '12 Ton Refrigerated Vehicle', tons: 12, fridge: true, contrib: 37500 },
    { k: 'cs14', name: '14 Ton Curtainside with Taillift', tons: 14, contrib: 35000 },
    { k: 'tt18', name: '18 Ton Truck Tractor with 12 Metre Dropside Trailer', tons: 18, contrib: 45000 },
    { k: 'tt32', name: '32 Ton Truck Tractor with Superlink Curtainside Trailer', tons: 32, contrib: 65000 },
  ];
  const vname = k => VQ.VEHICLES.find(v => v.k === k).name;

  VQ.JOBS = {
    Transport: ['Crew', 'Driver Code 10', 'Driver Code 14'],
    'Site and office': ['Site Controller', 'Site Supervisor', 'Site Manager', 'Supervisor', 'Administrator', 'Administration Clerk', 'Data Capturer', 'Debriefer', 'RLOG Controller'],
    Warehouse: ['Checker', 'Checker/Picker', 'Picker', 'Scanner', 'General Worker', 'Loaders', 'Cleaners', 'Receiving Clerk', 'Dispatch Clerk', 'Forklift Driver', 'Quality Checker', 'Security'],
  };
  VQ.EXP_SAMPLE = { dom: { 'on-main': [620, 3.5], 'on-reg': [140, 4], 'nd-main': [410, 6], 'eco-main': [260, 18], 'eco-reg': [90, 22] }, boxes: { 'bx-m': 180, 'cc-12': 95, 'cc-28': 40, 'sh-10': 60 }, intl: { n: 24, kg: 2.5, zone: '5' } };
  VQ.CENTRES = [
    ['BFN', 'Bloemfontein'], ['CPT', 'Cape Town'], ['DBN', 'Durban'], ['ELS', 'East London'], ['GRJ', 'George'], ['JNB', 'Johannesburg'],
    ['KBY', 'Kimberley'], ['KLD', 'Klerksdorp'], ['MFK', 'Mafikeng'], ['NLS', 'Nelspruit'], ['PLZ', 'Port Elizabeth'], ['POL', 'Polokwane'], ['PTA', 'Pretoria'], ['TRK', 'Transkei'],
  ];

  /* ---------- table-building helpers ---------- */
  const L = (key, label) => ({ key, label, type: 'label' });
  const I = (key, label) => ({ key, label, type: 'info' });
  const P = (key, label, dec = 2) => ({ key, label, type: 'price', dec });

  /* Truck Rental — sample rate book */
  const DAILY = { ldv1: [695, 3.10, 145], pv1: [745, 3.10, 145], rf1: [995, 3.65, 185], qtm: [1295, 3.95, null], cs4: [1395, 4.95, 245], tl4: [1495, 5.20, 265], rf4: [1895, 5.85, 315], cs8: [1995, 6.85, 345], tl8: [2150, 7.10, 365], pv12: [2650, 8.40, 445], rf12: [3350, 9.60, 525], cs14: [2950, 9.10, 485], tt18: [4450, 12.80, 695], tt32: [5950, 15.60, 895] };
  const dailyRows = Object.keys(DAILY).map(k => {
    const [day, km, dw] = DAILY[k];
    const row = { id: k, veh: k, l: { vehicle: vname(k) }, s: { day, km } };
    if (dw == null) row.t = { dw: 'Customer’s own' }; else row.s.dw = dw;
    return row;
  });
  const WEEKLY = [['pv1', 1500, 3450, 3.10, 650], ['cs4', 1500, 6450, 4.95, 1100], ['cs4', 2000, 6950, 4.95, 1100], ['cs8', 2000, 9450, 6.85, 1550], ['cs8', 3000, 10400, 6.85, 1550]];
  const weeklyRows = WEEKLY.map(([k, kmIncl, week, excess, dw]) => ({ id: `${k}-${kmIncl}`, veh: k, kmIncl, l: { vehicle: vname(k), kmIncl }, s: { week, excess, dw } }));
  const MONTHLY = { pv1: [14950, 1450, 3.10, 2150], rf1: [19800, 1700, 3.65, 2750], cs4: [27500, 2400, 4.95, 3450], tl4: [29800, 2500, 5.20, 3650], rf4: [36900, 2800, 5.85, 4450], cs8: [38900, 3500, 6.85, 4950], tl8: [41600, 3600, 7.10, 5250], pv12: [52400, 4200, 8.40, 6350], rf12: [64800, 4800, 9.60, 7450] };
  const monthlyRows = [];
  Object.keys(MONTHLY).forEach(k => {
    const [base, step, excess, dw] = MONTHLY[k];
    [3000, 4000, 5000, 6000].forEach((kmIncl, i) => monthlyRows.push({ id: `${k}-${kmIncl}`, veh: k, kmIncl, l: { vehicle: vname(k), kmIncl }, s: { month: base + step * i, excess, dw } }));
  });

  /* Logistics — sample rate book, ex Cape Town */
  const PERKG = [
    ['Johannesburg', 3.45, 4.10, 5.25, 6.40], ['Durban', 3.95, 4.60, 5.75, 6.90], ['Harrismith', 4.20, 4.95, 6.10, null], ['Nelspruit', 4.65, 5.40, 6.55, null],
    ['Polokwane', 4.55, 5.30, 6.45, 7.60], ['Bloemfontein', 3.25, 3.90, 5.05, 6.20], ['Cape Town', 1.35, 1.80, 2.65, 3.50], ['George', 2.45, 3.10, 4.25, 5.40],
    ['Port Elizabeth', 2.95, 3.60, 4.75, 5.90], ['East London', 3.55, 4.20, null, null], ['Mafikeng', 4.85, 5.60, null, null], ['Transkei', 4.95, 5.70, null, null],
  ];
  const up = (n, f) => n == null ? null : Math.round(n * f * 20) / 20;
  const kgRows = f => PERKG.map(([c, ...z]) => {
    const s = {}; z.forEach((v, i) => { if (v != null) s['z' + (i + 1)] = up(v, f); });
    return { id: c.toLowerCase().replace(/ /g, '-'), l: { centre: c }, s };
  });
  const minRows = f => [
    { id: 'local', l: { centre: 'Local ({origin} Zone 1)' }, s: { min: up(98, f) } },
    { id: 'main', l: { centre: 'Main centres (Polokwane, Johannesburg, George, Nelspruit, Bloemfontein, Port Elizabeth, Durban, Harrismith & East London)' }, s: { min: up(185, f) } },
    { id: 'out', l: { centre: 'Outlying' }, s: { min: up(265, f) } },
  ];
  const distTables = f => [
    { id: 'min', title: 'Minimum charges', cols: [L('centre', 'Centre'), P('min', 'Minimum charge for first 10 kg')], rows: minRows(f) },
    { id: 'kg', title: 'Rate per kg thereafter', cols: [L('centre', 'Centre'), P('z1', 'Zone 1'), P('z2', 'Zone 2'), P('z3', 'Zone 3'), P('z4', 'Zone 4')], rows: kgRows(f) },
  ];
  const zoneRows = arr => arr.map(([z, min, kg]) => ({ id: String(z).toLowerCase(), l: { zone: String(z) }, s: { min, kg } }));
  const borderCols = lab => [L('zone', lab), P('min', 'Minimum charge for first 10 kg'), P('kg', 'Rate per kg thereafter')];

  /* Warehousing — sample rate book. One table per warehouse, one price per contract year. */
  VQ.WAREHOUSES = [['DBN', 'Durban', 1], ['JHB', 'Johannesburg', 1.04]];
  const r2 = n => n >= 1000 ? Math.round(n / 10) * 10 : n >= 100 ? Math.round(n) : Math.round(n * 20) / 20;
  const whCols = first => [L('act', first), I('unit', 'Charged'), P('y1', '{y1}'), Object.assign(P('y2', '{y2}'), { year: 2 })];
  const whTables = (rows, first, suffix) => VQ.WAREHOUSES.map(([code, name, f]) => ({
    id: code, branch: code, title: name + (suffix || ''), cols: whCols(first || 'Description'),
    rows: rows.map(([id, act, unit, v]) => ({ id, l: { act, unit }, s: { y1: r2(v * f), y2: r2(v * f * 1.065) } })),
  }));
  const WH_IN = [
    ['in-carton', 'Carton unloading', 'per carton', 1.85], ['in-pallet', 'Pallet unloading', 'per pallet', 38.5],
    ['in-p20', 'Palletised 20 ft container unloading', 'per container', 1450], ['in-p40', 'Palletised 40 ft container unloading', 'per container', 2350],
    ['in-u20a', 'Unpalletised 20 ft container destuffing, more than 10 batches', 'per container', 3950], ['in-u20b', 'Unpalletised 20 ft container destuffing, 10 batches or fewer', 'per container', 3450],
    ['in-u40a', 'Unpalletised 40 ft container destuffing, more than 10 batches', 'per container', 6250], ['in-u40b', 'Unpalletised 40 ft container destuffing, 10 batches or fewer', 'per container', 5450],
    ['in-u40sat', 'Unpalletised 40 ft container destuffing and put away, on a Saturday', 'per container', 8150], ['in-u40sun', 'Unpalletised 40 ft container destuffing and put away, on a Sunday or public holiday', 'per container', 10900],
  ];
  const WH_STORE = [
    ['st-b1', 'Pallet position, {b1}', 'per pallet a month', 178], ['st-b2', 'Pallet position, {b2}', 'per pallet a month', 165],
    ['st-b3', 'Pallet position, {b3}', 'per pallet a month', 158], ['st-b4', 'Pallet position, {b4}', 'per pallet a month', 152],
    ['st-half', 'Half pallet position', 'per half pallet a month', 96],
  ];
  const WH_PICK = [
    ['pk-shrink', 'Shrink', 'per shrink', 2.95], ['pk-c1', 'Case, up to 19 cases per order', 'per case', 3.4], ['pk-c2', 'Case, 20 to 49 cases per order', 'per case', 2.95],
    ['pk-c3', 'Case, 50 or more cases per order', 'per case', 2.55], ['pk-layer', 'Layer (14 cases per layer)', 'per layer', 24.5], ['pk-pallet', 'Full pallet', 'per pallet', 62],
  ];
  const WH_ORD = [['or-return', 'Return management', 'per return order', 185], ['or-admin', 'Administration fee', 'per order fulfilled', 28.5]];
  /* invented volumes a year, used by "Fill in sample volumes" and by the opening quote */
  VQ.WH_SAMPLE = { pallets: 3900, vol: { 'in-carton': 31200, 'in-pallet': 12300, 'in-p20': 2, 'in-p40': 3, 'in-u20a': 23, 'in-u20b': 71, 'in-u40a': 38, 'in-u40b': 115, 'in-u40sat': 4, 'in-u40sun': 2,
    'st-half': 60, 'pk-shrink': 36000, 'pk-c1': 68400, 'pk-c2': 80100, 'pk-c3': 77100, 'pk-layer': 720, 'pk-pallet': 10200, 'or-return': 174, 'or-admin': 1680 } };

  /* Express — sample rate book, ex Johannesburg */
  VQ.BOXES = [
    ['bx-s', 'Stock box, small', 'VB1001', 23, 15, 15], ['bx-m', 'Stock box, medium', 'VB1002', 30, 23, 30], ['bx-l', 'Stock box, large', 'VB1003', 60, 45, 30],
    ['sh-25', 'Sharps bin kit, 2,5 litre', 'VB2025', 20, 20, 15], ['sh-5', 'Sharps bin kit, 5 litre', 'VB2050', 20, 20, 24.5], ['sh-10', 'Sharps bin kit, 10 litre', 'VB2100', 28, 26, 28],
    ['ret-s', 'Return carton, small', 'VB3001', 20, 20, 24.5], ['dg', 'Dangerous goods box', 'VB4001', 33, 36, 27], ['cc-12', 'Cold-chain shipper, 12 litre (2–8 °C)', 'VB5012', 40, 35, 38],
    ['cc-28', 'Cold-chain shipper, 28 litre (2–8 °C)', 'VB5028', 45.7, 41.9, 43.2], ['cc-56', 'Cold-chain shipper, 56 litre (2–8 °C)', 'VB5056', 53.3, 49.5, 50.2], ['amb-l', 'Insulated shipper, ambient, large', 'VB6001', 76, 79, 56],
  ].map(([id, name, code, l, h, d]) => ({ id, name, code, l, h, d, vol: Math.round(l * h * d / 5000 * 100) / 100 }));
  VQ.ZONES = [['JNB1', 1], ['PTA1', 1], ['DBN1', 1.15], ['CPT1', 1.25], ['PLZ1', 1.2], ['BFN1', 1.1], ['ELS1', 1.25], ['POL1', 1.15], ['NLS1', 1.15]];
  const EXP_DOM = [
    ['local-main', 'Local Express', 'Main centres', 5000, 'Collection today for delivery by 17h00 the next working day', 85, 5, 4.2],
    ['on-main', 'Overnight Express', 'Main centres', 5000, 'Collection today for delivery by 10h30 the next working day', 165, 2, 14.5],
    ['on-reg', 'Overnight Express', 'Regional centres', 5000, 'Collection today for delivery by 10h30 the next working day', 215, 3, 18.9],
    ['nd-main', 'Next Day Express', 'Main centres', 5000, 'Collection today for delivery by 17h00 the next working day', 125, 3, 11.2],
    ['nd-reg', 'Next Day Express', 'Regional centres', 5000, 'Collection today for delivery by 17h00 the next working day', 165, 3, 14.8],
    ['eco-main', 'Economy Express', 'Main centres', 4000, 'Collection today for delivery within 24 – 72 hours', 140, 10, 5.9],
    ['eco-reg', 'Economy Express', 'Regional centres', 4000, 'Collection today for delivery within 48 – 72 hours', 185, 10, 7.4],
  ];
  const IZ = [[3, 1], [4, 1.15], [5, 1.3], [6, 1.5], [7, 1.7], [8, 1.95]];
  const intlRows = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7].map(kg => {
    const s = {}; IZ.forEach(([z, f]) => { s['z' + z + 'd'] = Math.round((380 + 95 * (kg - .5)) * f); s['z' + z + 'n'] = Math.round((440 + 110 * (kg - .5)) * f); });
    return { id: 'w' + String(kg).replace('.', '_'), kg, l: { w: kg === .5 ? 'Min. 0,5 kg' : String(kg).replace('.', ',') + ' kg' }, s };
  });
  intlRows.push((() => { const s = {}; IZ.forEach(([z, f]) => { s['z' + z + 'd'] = Math.round(95 * f); s['z' + z + 'n'] = Math.round(110 * f); }); return { id: 'extra', l: { w: 'Per 0,5 kg thereafter' }, s }; })());

  /* Dedicated Distribution — sample rate book */
  VQ.BRANCHES = [['JHB', 'Johannesburg', 'inland'], ['PTA', 'Pretoria', 'inland'], ['KLD', 'Klerksdorp', 'inland'], ['CPT', 'Cape Town', 'coastal'], ['ELS', 'East London', 'coastal'], ['PLZ', 'Port Elizabeth', 'coastal']];
  /* km per litre by vehicle class and branch; the 8-ton figures are the ones in the current quote */
  VQ.CONS = {
    4: { JHB: 6.40, PTA: 6.40, KLD: 6.35, CPT: 6.30, ELS: 6.10, PLZ: 6.15 },
    8: { JHB: 4.55, PTA: 4.55, KLD: 4.50, CPT: 4.55, ELS: 4.18, PLZ: 4.24 },
    14: { JHB: 3.65, PTA: 3.65, KLD: 3.60, CPT: 3.60, ELS: 3.40, PLZ: 3.45 },
  };
  VQ.DD_VEH = [
    ['v4h', '4 Ton Hazchem Panelvan', 4, 38500, 1.45, 450000], ['v8h', '8 Ton Hazchem Panelvan', 8, 52500, 1.95, 750000],
    ['v8t', '8 Ton Panelvan with Taillift', 8, 49800, 1.85, 750000], ['v8c', '8 Ton Curtainside with Tow Hitch', 8, 47900, 1.80, 750000],
    ['v14', '14 Ton Curtainside with Taillift', 14, 68500, 2.60, 1200000],
  ].map(([k, name, cls, month, maint, git]) => ({ k, name, cls, month, maint, git }));
  const C2 = (key, label) => ({ key, label, type: 'calc' });
  const ddCols = (period, per) => [L('vehicle', 'Vehicle description'), L(per === 'branch' ? 'branch' : 'region', per === 'branch' ? 'Branch' : 'Region')]
    .concat(per === 'branch' ? [C2('qty', 'Quantity')] : []).concat([P(period, period === 'day' ? 'Rate per vehicle per day' : 'Rate per vehicle per month'), P('maint', 'Maintenance rate per km (from the 1st km)'), C2('fuelp', 'Fuel price'), C2('fuelkm', 'Fuel rate per km (from the 1st km)')]);
  const ddRows = (per, f, period) => {
    const out = [];
    VQ.DD_VEH.forEach(v => (per === 'branch' ? VQ.BRANCHES : [['inland', 'Inland', 'inland'], ['coastal', 'Coastal', 'coastal']]).forEach(([code, name, region]) => out.push({
      id: `${v.k}-${code}`, veh: v.k, cls: v.cls, branch: per === 'branch' ? code : null, region,
      l: per === 'branch' ? { vehicle: v.name, branch: name } : { vehicle: v.name, region: name },
      s: { [period]: Math.round(v.month * f / (period === 'day' ? 10 : 1)) * (period === 'day' ? 1 : 1), maint: v.maint } })));
    return out;
  };
  const DD_JOBS = [['crew', 'Crew', 14200], ['d10', 'Driver Code 10', 18900], ['d14', 'Driver Code 14', 22800], ['deb', 'Debriefer', 16500], ['sup', 'Site Supervisor', 28500]];
  VQ.DD_JOBS = DD_JOBS;
  VQ.DD_SAMPLE = { fleet: [{ veh: 'v8h', branch: 'JHB', qty: 8, km: 4200 }, { veh: 'v8h', branch: 'CPT', qty: 5, km: 3900 }, { veh: 'v4h', branch: 'PTA', qty: 3, km: 3500 }],
    crew: { crew: { JHB: 16, CPT: 10, PTA: 6 }, d10: { JHB: 8, CPT: 5, PTA: 3 } } };

  /* Chemical Logistics — sample rate book. A lane is a from–to pair; each lane has a minimum and nine weight bands. */
  VQ.HUBS = [['JHB', 'Johannesburg'], ['DBN', 'Durban'], ['CPT', 'Cape Town'], ['PLZ', 'Port Elizabeth']];
  VQ.BANDS = ['0 – 100 kg', '101 – 200 kg', '201 – 500 kg', '501 – 1 000 kg', '1 001 – 1 500 kg', '1 501 – 2 000 kg', '2 001 – 4 000 kg', '4 001 – 6 000 kg', '6 000 kg +'];
  VQ.BAND_TOP = [100, 200, 500, 1000, 1500, 2000, 4000, 6000, Infinity];
  VQ.HAZ = [['c2', 'Class 2', 'Gases'], ['c3', 'Class 3', 'Flammable liquids'], ['c4', 'Class 4', 'Flammable solids'], ['c51', 'Class 5.1', 'Oxidising substances'], ['c61', 'Class 6.1', 'Toxic substances'], ['c8', 'Class 8', 'Corrosive substances'], ['c9', 'Class 9', 'Miscellaneous dangerous goods']];
  const DIST = { 'JHB-BFN': .9, 'JHB-POL': .8, 'JHB-NLS': .9, 'JHB-MFK': .8, 'JHB-DBN': 1, 'JHB-CPT': 1.6, 'JHB-PLZ': 1.4, 'JHB-ELS': 1.3, 'DBN-CPT': 1.7, 'DBN-PLZ': 1.3, 'DBN-ELS': 1, 'DBN-BFN': 1, 'CPT-PLZ': 1, 'CPT-ELS': 1.2, 'CPT-BFN': 1.3, 'PLZ-ELS': .6, 'PLZ-BFN': .9 };
  const dist = (a, b) => a === b ? .35 : (DIST[a + '-' + b] || DIST[b + '-' + a] || 1.2);
  const STEP = [1, .92, .84, .76, .70, .65, .60, .56, .52];
  const laneRow = (from, to, base, minBase) => {
    const c = to.slice(0, 3), z = +to.slice(3) || 1, f = dist(from, c) * [1, 1, 1.3, 1.7, 2.2][z];
    const s = { min: Math.round(minBase * Math.max(.6, f)) };
    STEP.forEach((k, i) => { s['b' + (i + 1)] = Math.round(base * f * k * 100) / 100; });
    return { id: from + '1-' + to, from, l: { from: from + '1', to }, s };
  };
  const laneCols = () => [L('from', 'From'), L('to', 'To'), P('min', 'Buy-in minimum per consignment')].concat(VQ.BANDS.map((b, i) => P('b' + (i + 1), b)));
  const XIS = []; VQ.HUBS.forEach(([a]) => VQ.HUBS.forEach(([b]) => { if (a !== b) XIS.push(laneRow(a, b + '1', 2.2, 450)); }));
  const zs = (c, n) => Array.from({ length: n }, (x, i) => c + (i + 1));
  const EXPL = [].concat(['BFN', 'JNB', 'MFK', 'NLS', 'POL'].flatMap(c => zs(c === 'JNB' ? 'JHB' : c, c === 'MFK' ? 2 : c === 'NLS' ? 3 : 4)).map(t => laneRow('JHB', t, 2.4, 220)),
    zs('DBN', 4).map(t => laneRow('DBN', t, 2.4, 220)), zs('CPT', 4).map(t => laneRow('CPT', t, 2.4, 220)), zs('PLZ', 4).concat(['ELS1']).map(t => laneRow('PLZ', t, 2.4, 220)));
  const ECOL = [];
  VQ.HUBS.forEach(([a]) => VQ.HUBS.forEach(([b]) => { if (a !== b) ['1', '2'].forEach(z => ECOL.push(laneRow(a, b + z, 2.9, 380))); }));
  VQ.HUBS.forEach(([a]) => ['BFN1', 'ELS1'].forEach(t => { if (!(a === 'PLZ' && t === 'ELS1')) ECOL.push(laneRow(a, t, 2.9, 380)); }));
  VQ.VCL_SAMPLE = { hubs: ['JHB', 'DBN'], vol: { xis: [24, 1600], exp: [320, 140], eco: [90, 380] }, litres: 0, haz: ['c8', 'c3'] };

  /* Film Fleet — sample rate book */
  VQ.FF_VEH = [
    ['f1', '1 Ton L.D.V.', 3950, 1200, 3.4], ['f2', 'Toyota 4x4 Double Cab', 5450, 1200, 4.2], ['f3', 'Toyota 1.3 Ton Panelvan', 4250, 1200, 3.6], ['f4', 'Peugeot Boxer L4H2', 5950, 1500, 4.4],
    ['f5', 'Toyota Quantum 16 Seater', 6450, 1500, 4.6], ['f6', '4 Ton Panelvan with Taillift', 8950, 1500, 5.6], ['f9', '2 Ton Refrigerated Vehicle', 9450, 1500, 6.4],
    ['f7', '8 Ton Dropside', 11450, 1500, 7.2], ['f8', '8 Ton Panelvan with Taillift', 12950, 1500, 7.6],
  ].map(([k, name, week, kmIncl, excess]) => ({ k, name, week, kmIncl, excess }));
  VQ.FF_SAMPLE = { production: 'The Long Road Home (feature film)', days: 34, base: 'Johannesburg', vehicles: [{ veh: 'f2', qty: 3, km: 900 }, { veh: 'f5', qty: 2, km: 1300 }, { veh: 'f8', qty: 2, km: 700 }, { veh: 'f6', qty: 1, km: 1100 }],
    insurer: 'Example Underwriting Managers on behalf of Example Insure', policy: 'FLM-204118', cover: 1200000 };

  /* ---------- service blocks and extras ----------
     kind 'service' is picked in step 2, kind 'extra' in step 5.
     Each block has one or more price tables. Every table has the same
     shape: columns that describe the row, and columns that carry a price. */
  VQ.BLOCKS = {
    'vtr.daily': {
      div: 'vtr', kind: 'service', name: 'Daily hire', period: 'day', byVehicle: true, heading: 'DAILY HIRE',
      desc: 'A price per day, plus a price for every kilometre driven.',
      tables: [{ id: 't', title: 'Vehicle Description and Rates', cols: [L('vehicle', 'Vehicle description'), P('day', 'Hire rate per day'), P('km', 'Rate per kilometre'), P('dw', 'Damage waiver rate per day')], rows: dailyRows }],
    },
    'vtr.weekly': {
      div: 'vtr', kind: 'service', name: 'Weekly hire', period: 'week', byVehicle: true, heading: 'WEEKLY HIRE',
      desc: 'A price per five-day week that includes a kilometre allowance.',
      note: 'The above rates are based on a five day week.',
      tables: [{ id: 't', title: 'Vehicle Description and Rates', cols: [L('vehicle', 'Vehicle description'), P('week', 'Hire rate per week'), I('kmIncl', 'Kilometres included per week'), P('excess', 'Excess per kilometre'), P('dw', 'Damage waiver rate per week')], rows: weeklyRows }],
    },
    'vtr.monthly': {
      div: 'vtr', kind: 'service', name: 'Monthly hire', period: 'month', byVehicle: true, heading: 'MONTHLY HIRE',
      desc: 'A price per month that includes a kilometre allowance, with a price for extra kilometres.',
      tables: [{ id: 't', title: 'Vehicle Description and Rates', cols: [L('vehicle', 'Vehicle description'), P('month', 'Hire rate per month'), I('kmIncl', 'Kilometres included per month'), P('excess', 'Excess per kilometre'), P('dw', 'Damage waiver rate per month')], rows: monthlyRows }],
    },
    'vtr.labour': {
      div: 'vtr', kind: 'extra', name: 'Drivers and crew', desc: 'People supplied with the vehicle, with overtime and allowances.',
      tables: [
        { id: 'rates', title: 'Labour rates', cols: [L('job', 'Category'), P('day', 'Per day'), P('week', 'Per week'), P('month', 'Per month'), P('ot1', 'Overtime Mon–Sat, per hour'), P('ot2', 'Sundays, per hour'), P('ot3', 'Public holidays, per hour')],
          rows: [
            { id: 'crew', l: { job: 'Crew' }, s: { day: 620, week: 3100, month: 12400, ot1: 98, ot2: 131, ot3: 163 } },
            { id: 'd10', l: { job: 'Driver Code 10' }, s: { day: 980, week: 4900, month: 19600, ot1: 142, ot2: 189, ot3: 236 } },
            { id: 'd14', l: { job: 'Driver Code 14' }, s: { day: 1250, week: 6250, month: 25000, ot1: 178, ot2: 237, ot3: 296 } },
          ] },
        { id: 'allow', title: 'Sleep-out and night work', cols: [L('item', 'Allowance'), P('amt', 'Rate')],
          rows: [
            { id: 'sleep', l: { item: 'Sleep-out allowance per night' }, s: { amt: 285 } },
            { id: 'night2', l: { item: 'Night work allowance – 2nd hour' }, s: { amt: 22 } },
            { id: 'nightn', l: { item: 'Night work allowance per hour thereafter' }, s: { amt: 4.83 } },
          ] },
      ],
    },
    'vtr.fees': {
      div: 'vtr', kind: 'extra', name: 'Standard fees', defaultOn: true, desc: 'Fixed fees that apply to every hire. Each is stored once and printed wherever it is mentioned.',
      tables: [{ id: 't', title: 'Fees', cols: [L('item', 'Fee'), P('amt', 'Amount'), I('unit', 'Charged')],
        rows: [
          { id: 'contract', l: { item: 'Contract fee', unit: 'per contract' }, s: { amt: 130 } },
          { id: 'valet', l: { item: 'Valet fee', unit: 'per vehicle returned dirty' }, s: { amt: 1495 } },
          { id: 'recovery', l: { item: 'Vehicle recovery fee', unit: 'per incident' }, s: { amt: 7450 } },
          { id: 'fine', l: { item: 'Traffic fine redirection fee', unit: 'per incident, plus 15% of the fine' }, s: { amt: 290 } },
        ] }],
    },
    'vtr.delivery': {
      div: 'vtr', kind: 'extra', name: 'Delivery and collection of the vehicle', desc: 'When Value brings the vehicle to the customer and fetches it afterwards.',
      tables: [{ id: 't', title: 'Delivery and collection charges', cols: [L('desc', 'Description'), P('del', 'Rate per delivery'), P('col', 'Rate per collection')],
        rows: [
          { id: 'near-day', l: { desc: '0 to 50 kilometre radius, Monday to Friday between 07h00 and 17h00' }, s: { del: 650, col: 650 } },
          { id: 'near-eve', l: { desc: '0 to 50 kilometre radius, Monday to Friday between 17h00 and 19h00' }, s: { del: 950, col: 950 } },
          { id: 'far', l: { desc: 'Far outlying areas exceeding 50 kilometres — per kilometre after 50 kilometres' }, s: { del: 12.5, col: 12.5 } },
        ] }],
    },
    'vtr.tyres': {
      div: 'vtr', kind: 'extra', name: 'Tyre call-outs', desc: 'Call-out fee and kilometre rate for roadside tyre repairs.',
      tables: [{ id: 't', title: 'Repair costs for tyres', cols: [L('item', 'Charge'), P('day', 'Day'), P('night', 'Night'), P('wkend', 'Weekends and public holidays')],
        rows: [
          { id: 'callout', l: { item: 'Call-out fee' }, s: { day: 850, night: 1250, wkend: 1450 } },
          { id: 'perkm', l: { item: 'Rate per km (including fuel)' }, s: { day: 9.5, night: 11.5, wkend: 12.5 } },
        ] }],
    },

    'log.dist': {
      div: 'log', kind: 'service', name: 'Distribution', heading: 'Ex {origin}',
      desc: 'A minimum charge for the first 10 kg, then a price per kg by destination centre and zone.',
      tables: distTables(1),
    },
    'log.rev': {
      div: 'log', kind: 'service', name: 'Reverse logistics', heading: 'Reverse Logistics (Returns, Re-deliveries & Upliftments)',
      desc: 'Returns, re-deliveries and uplifts, priced the same way as distribution.',
      tables: distTables(1.15),
    },
    'log.border': {
      div: 'log', kind: 'service', name: 'Over-border road freight', heading: 'OVER BORDER ROAD FREIGHT RATES',
      desc: 'Namibia, Botswana, Eswatini and Lesotho — a minimum plus a price per kg by zone.',
      tables: [
        { id: 'nam', title: 'Namibia', cols: borderCols('Namibia zone'), rows: zoneRows([[1, 420, 6.90], [2, 480, 7.80], [3, 520, 8.40], [4, 560, 9.10], [5, 620, 9.90], [6, 680, 10.80], [7, 740, 11.90]]) },
        { id: 'bot', title: 'Botswana', cols: borderCols('Botswana zone'), rows: zoneRows([[1, 380, 6.20], [2, 430, 7.00], [3, 470, 7.70], [4, 560, 9.20], [5, 620, 10.10]]) },
        { id: 'esw', title: 'Eswatini', cols: borderCols('Destination'), rows: zoneRows([['Mbabane', 390, 6.40], ['Other', 450, 7.30]]) },
        { id: 'les', title: 'Lesotho', cols: borderCols('Destination'), rows: zoneRows([['Maseru', 360, 5.90], ['Other', 430, 6.90]]) },
      ],
    },
    'log.inhouse': {
      div: 'log', kind: 'service', name: 'In-house operation', heading: 'IN-HOUSE OPERATION',
      desc: 'Value staff working at the customer’s own site, charged per month.',
      tables: [{ id: 't', title: 'Monthly in-house charges', cols: [L('job', 'Category'), P('month', 'Per month'), P('ot1', 'Overtime Mon–Sat, per hour'), P('ot2', 'Sundays, per hour'), P('ot3', 'Public holidays, per hour')],
        rows: [{ id: 'sc', l: { job: 'Site Controller' }, s: { month: 28500, ot1: 165, ot2: 220, ot3: 275 } }] }],
    },
    'log.sur': {
      div: 'log', kind: 'extra', name: 'Surcharges per consignment', defaultOn: true, desc: 'Extra charges for deliveries that need special handling.',
      tables: [{ id: 't', title: 'Surcharges per consignment', cols: [L('item', 'Surcharge'), P('first', 'First 10 kg'), P('kg', 'Per kg thereafter'), P('flat', 'Per consignment')],
        rows: [
          { id: 'chain', l: { item: 'Chain store deliveries / reverse logistics' }, s: { first: 95, kg: 0.45 } },
          { id: 'dc', l: { item: 'DC delivery / reverse logistics surcharge' }, s: { first: 85, kg: 0.40 } },
          { id: 'ndd', l: { item: 'Deliveries outside nominated delivery days' }, s: { flat: 1250 } },
          { id: 'noncol', l: { item: 'Non-collection fee' }, s: { flat: 350 } },
          { id: 'special', l: { item: 'Saturday, Sunday, public holiday, same day, home and early deliveries' }, s: { flat: 0 }, por: { flat: true } },
        ] }],
    },
    'log.fees': {
      div: 'log', kind: 'extra', name: 'Fees', defaultOn: true, desc: 'Documentation, pallet wrap and extra proof-of-delivery copies.',
      tables: [{ id: 't', title: 'Fees', cols: [L('item', 'Fee'), P('amt', 'Amount'), I('unit', 'Charged')],
        rows: [
          { id: 'doc', l: { item: 'Documentation / administration fee', unit: 'per invoice' }, s: { amt: 14 } },
          { id: 'obdoc', l: { item: 'Over-border documentation fee', unit: 'per invoice' }, s: { amt: 333 } },
          { id: 'wrap', l: { item: 'Pallet wrap for DC deliveries', unit: 'per kg delivered' }, s: { amt: 0.12 } },
          { id: 'pod', l: { item: 'Additional proof-of-delivery copy', unit: 'per copy' }, s: { amt: 35 } },
        ] }],
    },
  };

  Object.assign(VQ.BLOCKS, {
    'whs.in': { div: 'whs', kind: 'service', name: 'Inbound', cat: 'INBOUND', desc: 'Unloading cartons, pallets and containers, by container size, how it is packed and the day of the week.', tables: whTables(WH_IN) },
    'whs.store': { div: 'whs', kind: 'service', name: 'Storage', cat: 'STORAGE', desc: 'A price per pallet position a month. The price depends on which volume band the stock falls in.', tables: whTables(WH_STORE) },
    'whs.pick': { div: 'whs', kind: 'service', name: 'Picking, packing and loading', cat: 'PICKING / PACKING / LOADING', desc: 'Per shrink, case, layer or full pallet. Case prices depend on the size of the order.', tables: whTables(WH_PICK) },
    'whs.orders': { div: 'whs', kind: 'service', name: 'Returns and order administration', cat: 'ORDER FULFILMENT', desc: 'Handling of returned orders, and an administration fee per order fulfilled.', tables: whTables(WH_ORD) },
    'whs.consum': {
      div: 'whs', kind: 'extra', name: 'Consumables at fixed rates', defaultOn: true, desc: 'Packaging and stationery billed monthly on what is used, plus a 10% administration fee.',
      tables: [{ id: 't', title: 'Fixed rate for consumables', cols: [L('act', 'Product'), I('unit', 'Unit of measure'), P('amt', 'Rate')],
        rows: [['label', 'Label (roll)', '100 x 37 mm, 2 000 per roll', 185], ['paper', 'Paper (box)', 'A4, 80 g, 5 packs of 500', 395], ['tape', 'Clear tape (roll)', '48 mm x 45 m', 9.5], ['sectape', 'Security tape (roll)', '46 mm, tamper evident', 145],
          ['box', 'Stock box 5 (each)', '450 x 300 x 300 mm', 8.9], ['wrap', 'Pallet wrap (roll)', '400 mm x 400 m, 13 micron', 78], ['pouch', 'Invoice pouches (box)', 'A5, 1 000 per box', 420], ['bolt', 'Bolt seals (box)', '250 per box', 1950], ['seal', 'Plastic seals (box)', '1 000 per box', 640]]
          .map(([id, act, unit, amt]) => ({ id, l: { act, unit }, s: { amt } })) }],
    },
    'whs.labour': {
      div: 'whs', kind: 'extra', name: 'Ad hoc labour and overtime', desc: 'Extra hands for rework and bundling at normal-time rates, and overtime outside operating hours.',
      tables: [
        { id: 'adhoc', title: 'Ad hoc labour, rate per hour, Monday to Friday', cols: [L('act', 'Category'), P('y1', '{y1}'), Object.assign(P('y2', '{y2}'), { year: 2 })],
          rows: [['gw', 'General Worker', 62], ['fl', 'Forklift Driver', 84], ['sec', 'Security', 71], ['qc', 'Quality Checker', 78], ['sup', 'Supervisor', 118]].map(([id, act, v]) => ({ id, l: { act }, s: { y1: v, y2: r2(v * 1.065) } })) },
        { id: 'ot', title: 'Overtime, rate per hour', cols: [L('act', 'Category'), P('ot1', 'Overtime Mon–Sat, per hour'), P('ot2', 'Sundays, per hour'), P('ot3', 'Public holidays, per hour')],
          rows: [['load', 'Loaders', 93], ['recv', 'Receiving Clerk', 105], ['disp', 'Dispatch Clerk', 105], ['fl', 'Forklift Driver', 126], ['cp', 'Checker/Picker', 99], ['gw', 'General Worker', 93], ['sc', 'Site Controller', 165], ['sec', 'Security', 107]]
            .map(([id, act, v]) => ({ id, l: { act }, s: { ot1: v, ot2: Math.round(v * 4 / 3), ot3: Math.round(v * 5 / 3) } })) },
      ],
    },
    'whs.transport': {
      div: 'whs', kind: 'extra', name: 'Staff transport after overtime', desc: 'A price per single trip when staff work late and have to be taken home after 18h30.',
      tables: [
        { id: 'DBN', branch: 'DBN', title: 'Durban, rate per single trip', cols: whCols('Destination').filter(c => c.key !== 'unit'), rows: [['ham', 'Hammarsdale', 420], ['inc', 'Inchanga', 480]].map(([id, act, v]) => ({ id, l: { act }, s: { y1: v, y2: r2(v * 1.065) } })) },
        { id: 'JHB', branch: 'JHB', title: 'Johannesburg, rate per single trip', cols: whCols('Destination').filter(c => c.key !== 'unit'), rows: [['tem', 'Tembisa', 390], ['sow', 'Soweto', 520], ['kat', 'Katlehong and Vosloorus', 560]].map(([id, act, v]) => ({ id, l: { act }, s: { y1: v, y2: r2(v * 1.065) } })) },
      ],
    },
  });

  Object.assign(VQ.BLOCKS, {
    'exp.dom': {
      div: 'exp', kind: 'service', name: 'Domestic express', desc: 'A minimum charge that covers the first few kilograms, then a price per kg, by service and type of centre.',
      tables: [{ id: 't', title: 'Domestic Express – Collections', cols: [L('svc', 'Service type'), L('ctr', 'Centres'), I('factor', 'Volumetric factor'), P('min', 'Minimum per consignment'), I('minKg', 'Kg covered by the minimum'), P('kg', 'Rate per kg thereafter')],
        rows: EXP_DOM.map(([id, svc, ctr, factor, det, min, minKg, kg]) => ({ id, minKg, factor, l: { svc, ctr, factor: group(factor), minKg: minKg + ' kg', det }, s: { min, kg } })) }],
    },
    'exp.box': {
      div: 'exp', kind: 'service', name: 'Distribution per box', desc: 'A fixed Overnight Express price for each standard box, per destination zone. Printed as Annexure A.',
      tables: [{ id: 't', title: 'Annexure A – Overnight Express rate per box', cols: [L('box', 'Box'), I('code', 'Box code'), I('vol', 'Volumetric weight, kg')].concat(VQ.ZONES.map(([z]) => P(z, z))),
        rows: VQ.BOXES.map(b => { const s = {}; VQ.ZONES.forEach(([z, f]) => { s[z] = Math.round((55 + b.vol * 8.5) * f); }); return { id: b.id, l: { box: b.name, code: b.code, vol: String(b.vol).replace('.', ',') }, s }; }) }],
    },
    'exp.intl': {
      div: 'exp', kind: 'service', name: 'International', desc: 'A price per shipment by weight step and world zone, for documents and for parcels.',
      tables: [{ id: 't', title: 'Value Express – International Tariff Schedule', cols: [L('w', 'Weight')].concat(...IZ.map(([z]) => [P('z' + z + 'd', 'Zone ' + z + ', documents', 0), P('z' + z + 'n', 'Zone ' + z + ', non-documents', 0)])), rows: intlRows }],
    },
    'exp.cartage': {
      div: 'exp', kind: 'service', name: 'Airport cartage and high-value shipments', desc: 'A price per trip from OR Tambo, by vehicle, including armoured vehicles with armed crew.',
      tables: [
        { id: 'air', title: 'Airfreight import transport', cols: [L('desc', 'Description'), P('trip', 'Rate per trip')],
          rows: [['t1', 'Cartage – 1 Ton Panelvan, OR Tambo to Centurion', 1450], ['t4', 'Cartage – 4 Ton Panelvan, OR Tambo to Centurion', 2650], ['t8', 'Cartage – 8 Ton Panelvan, OR Tambo to Centurion', 3850]].map(([id, desc, trip]) => ({ id, l: { desc }, s: { trip } })) },
        { id: 'hv', title: 'High value shipments', cols: [L('desc', 'Description'), P('amt', 'Rate'), I('unit', 'Charged')],
          rows: [['a2', 'Cartage – 2 Ton Armoured Vehicle, OR Tambo to Value City (07h30 to 17h30)', 6900, 'per trip'], ['a4', 'Cartage – 4 Ton Armoured Vehicle, OR Tambo to Value City (07h30 to 17h30)', 9800, 'per trip'],
            ['gs', 'Ground support in the event of an attempted hijacking or recovery', 2500, 'per hour'], ['as', 'Air support in the event of an attempted hijacking or recovery', 18500, 'per hour'], ['hr', 'High risk delivery surcharge', 450, 'per waybill']]
            .map(([id, desc, amt, unit]) => ({ id, l: { desc, unit }, s: { amt } })) },
      ],
    },
    'exp.inhouse': {
      div: 'exp', kind: 'service', name: 'In-house operation', desc: 'Value staff at the customer’s site, free of charge while the customer spends above an agreed minimum each month.',
      tables: [
        { id: 'min', title: 'Free in-house operation', cols: [L('item', 'Condition'), P('amt', 'Minimum average monthly expenditure')], rows: [{ id: 'spend', l: { item: 'In-house operation supplied free of charge, reviewed quarterly' }, s: { amt: 250000 } }] },
        { id: 'ot', title: 'Overtime, rate per hour', cols: [L('job', 'Category'), P('ot1', 'Overtime Mon–Sat, per hour'), P('ot2', 'Sundays, per hour'), P('ot3', 'Public holidays, per hour')],
          rows: [['sc', 'Site Controller', 165], ['dc', 'Data Capturer', 120], ['ck', 'Checker', 98], ['gw', 'General Worker', 93], ['rl', 'RLOG Controller', 150], ['sn', 'Scanner', 98]]
            .map(([id, job, v]) => ({ id, l: { job }, s: { ot1: v, ot2: Math.round(v * 4 / 3), ot3: Math.round(v * 5 / 3) } })) },
      ],
    },
    'exp.sur': {
      div: 'exp', kind: 'extra', name: 'Domestic surcharges', defaultOn: true, desc: 'A flat amount per waybill, added to the rate when a delivery needs something extra.',
      tables: [{ id: 't', title: 'Domestic surcharges per waybill', cols: [L('item', 'Surcharge'), P('amt', 'Per waybill')],
        rows: [['ppe', 'Additional personal protective equipment per delivery', 45], ['reg', 'Regional collection/delivery fee', 95], ['rem', 'Remote collection/delivery fee', 185], ['early', 'Early delivery service', 350],
          ['lsd', 'Local same day express (main centres only)', 450], ['sd', 'Same day express (main centres only)', 1250], ['sat', 'Saturdays', 650], ['sun', 'Sundays and public holidays', 0, true], ['ah', 'After hours', 850],
          ['nc', 'Non-collection fee', 180], ['risk', 'High risk areas (excluding Baragwanath Hospital)', 120], ['home', 'Home deliveries', 85], ['mine', 'Mines and nature reserves', 220]]
          .map(([id, item, amt, por]) => ({ id, l: { item }, s: { amt }, por: por ? { amt: true } : undefined })) }],
    },
  });

  Object.assign(VQ.BLOCKS, {
    'vdd.core': { div: 'vdd', kind: 'service', name: 'Core contractual fleet', heading: 'CORE CONTRACTUAL FLEET', desc: 'Vehicles for the whole contract: a price per vehicle a month, plus maintenance and fuel for every kilometre.',
      tables: [{ id: 't', title: 'Vehicle Description and Rates', cols: ddCols('month', 'branch'), rows: ddRows('branch', 1, 'month') }] },
    'vdd.labour': { div: 'vdd', kind: 'service', name: 'Labour for the contractual fleet', desc: 'Drivers and crew per branch, a price per person a month, with overtime.',
      tables: [{ id: 't', title: 'Labour Rates and Working Hours', cols: [L('job', 'Category'), P('month', 'Labour rate per month, per person'), P('ot1', 'Overtime Mon–Sat, per hour'), P('ot2', 'Sundays, per hour'), P('ot3', 'Public holidays, per hour')],
        rows: DD_JOBS.map(([id, job, m]) => { const h = Math.round(m / 195 * 1.5); return { id, l: { job }, s: { month: m, ot1: h, ot2: Math.round(h * 4 / 3), ot3: Math.round(h * 5 / 3) } }; }) }] },
    'vdd.adhoc': { div: 'vdd', kind: 'service', name: 'Ad hoc fleet', heading: 'AD HOC FLEET', desc: 'Extra vehicles when the core fleet is not enough, by the day or by the month, priced for inland and coastal branches.',
      tables: [{ id: 'day', title: 'Daily ad hoc fleet', cols: ddCols('day', 'region'), rows: ddRows('region', 1.05, 'day') },
        { id: 'month', title: 'Monthly ad hoc fleet', cols: ddCols('month', 'region'), rows: ddRows('region', 1.12, 'month') }] },
    'vdd.cube': { div: 'vdd', kind: 'service', name: 'Rate per cube', heading: 'RATE PER CUBE – CONTRACTUAL FLEET', desc: 'One all-in price per cubic metre moved, including vehicles, people, hub and fuel.',
      tables: [{ id: 't', title: 'Rates', cols: [L('area', 'Area'), P('cube', 'Rate per cubic metre including fuel')],
        rows: [['JHB', 185], ['PTA', 190], ['KLD', 215], ['CPT', 205], ['ELS', 230], ['PLZ', 220]].map(([b, v]) => ({ id: b, branch: b, l: { area: VQ.BRANCHES.find(x => x[0] === b)[1] }, s: { cube: v } })) }] },
    'vdd.mgmt': { div: 'vdd', kind: 'extra', name: 'On-site management', desc: 'Staff, IT and a data line at each branch, a price per branch a month.',
      tables: [{ id: 't', title: 'On-Site Management / Head Office', cols: [L('item', 'Component')].concat(VQ.BRANCHES.map(([b, n]) => Object.assign(P(b, n), { branch: b }))),
        rows: [['staff', 'On-site staffing', [98500, 72000, 46500, 84500, 52500, 49500]], ['it', 'IT hardware', [6500, 5200, 4100, 6100, 4300, 4300]], ['dig', 'Diginet line', [3200, 3200, 3200, 3200, 3200, 3200]],
          ['sec', 'At-store security charge per high-risk area', [null, null, null, null, 18500, null]]]
          .map(([id, item, vs]) => { const s = {}; VQ.BRANCHES.forEach(([b], i) => { if (vs[i] != null) s[b] = vs[i]; }); return { id, l: { item }, s }; }) }] },
    'vdd.addons': { div: 'vdd', kind: 'extra', name: 'Vehicle additions', desc: 'Devices and systems added to the fleet, per unit a month.',
      tables: [{ id: 't', title: 'Vehicle additions', cols: [L('item', 'Description'), P('amt', 'Rate'), I('unit', 'Charged')],
        rows: [['hh', 'Handheld device with vehicle cradle', 545, 'per device a month'], ['cam', '4 way camera system', 1250, 'per vehicle a month'], ['tms', 'Transport management system (planning and en-route execution)', 690, 'per vehicle a month'], ['seal', 'Metal seals', 4.85, 'each']]
          .map(([id, item, amt, unit]) => ({ id, l: { item, unit }, s: { amt } })) }] },
    'vdd.allow': { div: 'vdd', kind: 'extra', name: 'Allowances', defaultOn: true, desc: 'Sleep-out, dual man and night work allowances for drivers and crew.',
      tables: [{ id: 't', title: 'Allowances', cols: [L('item', 'Allowance'), P('amt', 'Rate')],
        rows: [['sleep', 'Sleep-out allowance per night', 285], ['dual', 'Dual man allowance', 675.71], ['night2', 'Night work allowance – 2nd hour', 22], ['nightn', 'Night work allowance per hour thereafter', 4.83]].map(([id, item, amt]) => ({ id, l: { item }, s: { amt } })) }] },
  });

  Object.assign(VQ.BLOCKS, {
    'vcl.xis': { div: 'vcl', kind: 'service', name: 'Inter-branch transfers (XIS)', code: 'xis', heading: 'TERTIARY DISTRIBUTION RATES', desc: 'Warehouse to warehouse only, between the four hubs. A minimum per consignment, then a price per kg by weight band.',
      tables: [{ id: 't', title: 'Inter Branch Transfers – Service Type XIS', cols: laneCols(), rows: XIS }] },
    'vcl.exp': { div: 'vcl', kind: 'service', name: 'Secondary distribution – express (EXP)', code: 'exp', desc: 'From the hub to the final customer in the same region, by destination zone.',
      tables: [{ id: 't', title: 'Delivery from Secondary Hub to Final Customer – Service Type EXP', cols: laneCols(), rows: EXPL }] },
    'vcl.eco': { div: 'vcl', kind: 'service', name: 'Secondary distribution – economy (ECO)', code: 'eco', desc: 'From the hub to final customers in other regions, on the scheduled line-haul days.',
      tables: [{ id: 't', title: 'Delivery from Secondary Hub to Final Customer – Service Type ECO', cols: laneCols(), rows: ECOL }] },
    'vcl.decant': { div: 'vcl', kind: 'service', name: 'Break bulk decanting', desc: 'Pouring bulk liquid into the customer’s tanks and bins, a price per litre.',
      tables: [{ id: 't', title: 'Break Bulk Decanting', cols: [L('hub', 'Hub'), P('litre', 'Rate per litre', 2)],
        rows: [['CPT', .48], ['DBN', .45], ['PLZ', .52]].map(([b, v]) => ({ id: b, from: b, l: { hub: 'Ex ' + VQ.HUBS.find(h => h[0] === b)[1] }, s: { litre: v } })) }] },
    'vcl.sur': { div: 'vcl', kind: 'extra', name: 'Surcharges per consignment', defaultOn: true, desc: 'Extra charges for early, weekend and out-of-schedule deliveries, failed collections and remote sites.',
      tables: [{ id: 't', title: 'Surcharges per consignment', cols: [L('item', 'Surcharge'), P('amt', 'Rate')],
        rows: [['early', 'Early deliveries', 450], ['sat', 'Saturday deliveries', 1850], ['same', 'Same day deliveries (zone 1 only)', 1250], ['ndd', 'Deliveries outside nominated delivery days', 1100], ['nc', 'Non-collection fee', 380],
          ['pod', 'Additional copy of a proof of delivery', 35], ['remote', 'Remote deliveries: mines, power stations, farms, co-ops, game farms, lodges, nature reserves and townships, per delivery', 420]]
          .map(([id, item, amt]) => ({ id, l: { item }, s: { amt } })) }] },
  });

  Object.assign(VQ.BLOCKS, {
    'vff.weekly': { div: 'vff', kind: 'service', name: 'Weekly hire', period: 'week', byVehicle: true, desc: 'A price per six-day week, including a kilometre allowance. Kilometres are pooled per vehicle for the shoot.',
      tables: [{ id: 't', title: 'Vehicle Description and Rates', cols: [L('vehicle', 'Vehicle description'), P('week', 'Hire rate per week'), I('kmIncl', 'Km’s included'), P('excess', 'Excess per kilometre'), I('ins', 'Vehicle insurance')],
        rows: VQ.FF_VEH.map(v => ({ id: v.k, veh: v.k, kmIncl: v.kmIncl, l: { vehicle: v.name, kmIncl: v.kmIncl, ins: 'Customer’s own' }, s: { week: v.week, excess: v.excess } })) }] },
    'vff.fees': { div: 'vff', kind: 'extra', name: 'Standard fees', defaultOn: true, desc: 'Fees that come with every shoot. Each is stored once and printed wherever it is mentioned.',
      tables: [{ id: 't', title: 'Fees', cols: [L('item', 'Fee'), P('amt', 'Amount'), I('unit', 'Charged')],
        rows: [['contract', 'Contract fee', 'per contract', 130], ['cancel', 'Cancellation fee', 'per vehicle, if cancelled on the day of rental', 1450], ['valet', 'Valet fee', 'per vehicle returned dirty', 1495],
          ['proxy', 'Outstanding proxies at the end of the shoot', 'per shoot, to cover outstanding fines', 2500], ['fine', 'Traffic fine redirection fee', 'per incident, plus 15% of the fine', 290],
          ['etag', 'E-tag', 'per vehicle a month, plus toll fees at cost plus 15%', 85], ['recovery', 'Vehicle recovery fee', 'per incident', 7450]]
          .map(([id, item, unit, amt]) => ({ id, l: { item, unit }, s: { amt } })) }] },
    'vff.delivery': { div: 'vff', kind: 'extra', name: 'Delivery and collection to set', defaultOn: true, desc: 'When Value brings vehicles to the unit base and fetches them afterwards, by distance and time of day.',
      tables: [{ id: 't', title: 'Delivery and collection charges', cols: [L('desc', 'Description'), P('del', 'Rate per delivery'), P('col', 'Rate per collection')],
        rows: [['a-day', 'Surrounding areas within a 0 to 25 kilometre radius, Monday to Friday between 07h00 and 17h00', 450], ['a-eve', 'Surrounding areas within a 0 to 25 kilometre radius, Monday to Friday between 17h00 and 19h00', 650],
          ['b-day', 'Further outlying areas within a 26 to 50 kilometre radius, Monday to Friday between 07h00 and 17h00', 750], ['b-eve', 'Further outlying areas within a 26 to 50 kilometre radius, Monday to Friday between 17h00 and 19h00', 950],
          ['c', 'Far outlying areas exceeding 51 kilometres — base fee, plus R12,50 per kilometre', 1150]].map(([id, desc, v]) => ({ id, l: { desc }, s: { del: v, col: v } })) }] },
    'vff.tyres': { div: 'vff', kind: 'extra', name: 'Tyre call-outs', desc: 'Call-out fee and kilometre rate for tyre repairs on set.',
      tables: [{ id: 't', title: 'Repair costs for tyres', cols: [L('item', 'Charge'), P('day', 'Day'), P('night', 'Night'), P('wkend', 'Weekends and public holidays')],
        rows: [{ id: 'callout', l: { item: 'Call-out fee' }, s: { day: 850, night: 1250, wkend: 1450 } }, { id: 'perkm', l: { item: 'Rate per km (including fuel)' }, s: { day: 9.5, night: 11.5, wkend: 12.5 } }] }] },
  });

  /* blocks of the divisions that are listed but not walked in this mockup */
  VQ.OTHER_BLOCKS = {
  };

  /* ---------- included / excluded lists ({fee:x} pulls the amount from the fees block) ---------- */
  VQ.INCL = {
    vtr: {
      included: [['veh', 'Vehicle Charge'], ['track', 'Vehicle Tracking'], ['disk', 'License Disk Fees'], ['dwq', 'Damage Waiver as Separately Quoted Above (not applicable to customer’s own insurance)']],
      excluded: [['fuel', 'Fuel'], ['labour', 'Labour'], ['ot', 'Overtime'], ['sleep', 'Sleep-out Allowance'], ['toll', 'Toll Gate Fees'], ['permit', 'Over Border Vehicle Permit Fees'],
        ['fines', 'Traffic Fines & Handling Fees at 15% of the Cost of the Fine'], ['valet', 'A Valet Fee of {fee:valet} May Be Levied for Returning Dirty Vehicles'],
        ['contrib', 'Damage Contribution (not applicable to customer’s own insurance)'], ['git', 'Goods In Transit Insurance'], ['contract', 'Contract Fees at {fee:contract} per contract'], ['vat', 'VAT']],
    },
    vff: {
      included: [['veh', 'Vehicle Charge'], ['track', 'Vehicle Tracking'], ['disk', 'License Disk Fees']],
      excluded: [['fuel', 'Fuel (vehicles returned to our premises will be filled with diesel and charged to your account)'], ['labour', 'Labour'], ['ot', 'Overtime'], ['sleep', 'Sleep-Out Allowance'], ['pre', 'Pre-Delivery (subject to availability of vehicles)'],
        ['cancel', 'Cancellation Fee of {fee:cancel} per Vehicle (applicable if the booking is cancelled on the day of the rental)'], ['valet', 'Valet Service Fee of {fee:valet} May Be Levied for Returning Dirty Vehicles'], ['toll', 'Toll Gate Fees'],
        ['pool', 'Kilometres will be pooled per vehicle registration number for the shoot and excess kilometres will be charged accordingly'], ['permit', 'Over Border Permit Fees (available on request at an additional cost)'],
        ['fines', 'Traffic Fines & Fine Handling Fees +15% of the Cost of the Fine'], ['oneway', 'One Way Rental/Drop Off Fee'], ['long', 'Long Distance Rates (rates available on request)'], ['fit', 'Fittings & Fixtures (rates available on request)'],
        ['dw', 'Damage Waiver & Contribution'], ['ins', 'Vehicle Insurance & Excess'], ['git', 'Goods In Transit Insurance'], ['contract', 'Contract Fees at {fee:contract} per contract'], ['vat', 'VAT']],
    },
    vcl: {
      included: [['git', 'Goods In Transit Risk Acceptance'], ['equip', 'Decanting Equipment'], ['ppe', 'Personal Protective Equipment'], ['decal', 'Decant Allowance'], ['train', 'Training'], ['dga', 'Dangerous Goods Allowance']],
      excluded: [['fuel', '{fuelPct} Fuel Surcharge as at {fuelDate} at {fuelPrice} per litre'], ['tanks', 'Tanks and bins (to be supplied by yourselves)'], ['vat', 'VAT']],
    },
    vdd: {
      included: [['veh', 'Vehicle Charge'], ['track', 'Vehicle Tracking'], ['dw', 'Damage Waiver and Contribution'], ['git', 'Stated Goods In Transit Risk Acceptance'], ['repl', 'Replacement Vehicles'], ['contract', 'Contract Fees']],
      excluded: [['ot', 'Overtime'], ['sleep', 'Sleep-out Allowance'], ['permit', 'Over Border Vehicle Permit Fees'], ['toll', 'Toll Gate Fees'], ['vat', 'VAT']],
    },
    exp: {
      included: [],
      excluded: [['fuel', '{fuelPct} Fuel Surcharge as at {fuelDate} at {fuelPrice} per litre'], ['git', 'Goods In Transit Insurance'], ['vat', 'VAT']],
    },
    whs: {
      included: [['space', 'Warehouse Space'], ['office', 'Office Space of 15 m²'], ['secur', 'Security on Premises'], ['util', 'Electricity, Water, Rates & Taxes'], ['it', 'Computer with Software, IT Equipment & Maintenance thereof'],
        ['wms', 'Warehouse Management System'], ['rack', 'Racking & Sprinklers'], ['fine', 'Fine Picking & Packing'], ['mhe', 'Material Handling Equipment'], ['phone', 'Telephone and Telephone System'],
        ['staff', 'Personnel for Management, Receiving, Data Capturing, Security, Dispatching, Supervision and Operating Forklifts']],
      excluded: [['ot', 'Overtime in Excess of Specified Operating Hours'], ['ottrans', 'Overtime Staff Transport'], ['nonstd', 'Prices for Non-Standard Activities'], ['pack', 'Packaging Material'],
        ['ins', 'Insurance of Products for all Risks Inside and Outside the Facility'], ['label', 'Product Labelling/Re-Labelling'], ['stat', 'Stationery & Consumables plus 10% Administration Fee'], ['shrink', 'Shrink Wrap'],
        ['rework', 'Product Reworks and/or Product Bundling'], ['cc', 'Customer Collections'], ['night', 'Night Work Allowance'], ['chep', 'CHEP Pallets 5% Administration Fee'], ['vat', 'VAT']],
    },
    log: {
      included: [['collect', 'Collection from Your Premises at {collection}']],
      excluded: [['doc', 'Documentation/Administration Fees of {fee:doc} per Invoice'], ['fuel', '{fuelPct} Fuel Surcharge as at {fuelDate} at {fuelPrice} per litre'], ['git', 'Goods In Transit Insurance'], ['vat', 'VAT']],
    },
  };

  /* ---------- clause library ({blank} marks a value the engine fills in) ---------- */
  VQ.CLAUSES = [
    { id: 'hours', title: 'Working hours and overtime', divs: ['vtr', 'log', 'whs', 'exp', 'vdd'], text: 'Our official working hours are from 07h00 to 17h00, Monday to Friday. Any time worked outside of these official working hours, including Saturdays, Sundays and Public Holidays, shall be considered overtime and will be charged per hour as follows:' },
    { id: 'nbc', title: 'Bargaining-council limits', divs: ['vtr', 'log', 'whs', 'exp', 'vdd'], text: 'As per the National Bargaining Council for the Road Freight and Logistics Industry (NBCRFLI) Main Collective Agreement, the maximum overtime permissible per week (Monday – Saturday) is 30 hours. The maximum total hours an employee is allowed to work per week (Monday – Sunday) is 90 hours. Kindly ensure that the working hours stipulations are adhered to.' },
    { id: 'driver', title: 'Driver supplied by Value', divs: ['vtr'], text: 'Kindly note that in the event that we supply you with a driver/crew, such driver/crew becomes the responsibility of your company and they will take instructions directly from you. You shall at all times, whilst the driver/crew is under your control, be responsible and liable for the actions of the driver/crew.' },
    { id: 'night', title: 'Night work', divs: ['vtr', 'log', 'whs', 'exp', 'vdd'], text: 'Night work is defined as any work between 18h00 and 06h00. No night work allowance is payable for the first hour.' },
    { id: 'dw', title: 'Damage waiver', divs: ['vtr'], text: 'Should the damage waiver option be selected you will be covered for vehicle damage or theft of the vehicle and third party damage or loss, up to specified limits and subject to certain exclusions. In the event of an incident which is covered by the Damage Waiver Fee, you will be liable to Value Logistics for the Damage Contribution as stated. Terms and conditions are available on request.' },
    { id: 'own', title: 'Customer’s own insurance', divs: ['vtr', 'vff'], text: 'Thank you for your letter stating that Value Logistics’ vehicles are fully comprehensively insured by {insurer} under your policy number {policy}, valid from {from} to {to}. Should you be making use of your own insurance, you will be held liable for standing time while the vehicle is being repaired. We will advise you of the exact number of days and the cost involved together with the assessor’s report.' },
    { id: 'recovery', title: 'Vehicle recovery', divs: ['vtr', 'vff'], text: 'A recovery fee of {recovery} per incident will be charged in case of any attempted vehicle recovery due to hijacking, theft or other extraordinary circumstances. This fee does not include any associated towing charges and air response related fees, which will be billed by Value Logistics to you separately.' },
    { id: 'fines', title: 'Traffic fine management', divs: ['vtr', 'vff'], text: 'A traffic fine redirection fee of {fine} as well as a handling fee of 15% of the value of the fine will be applicable per incident.' },
    { id: 'gitx', title: 'Goods in transit — not included', divs: ['vtr', 'log', 'vff'], text: 'Rates do not include Goods In Transit Insurance or SASRIA. Goods In Transit Insurance to be arranged by yourself with your own insurance company.' },
    { id: 'gitr', title: 'Goods in transit — risk accepted', divs: ['log', 'vdd', 'vcl'], text: 'Please note that Goods In Transit Risk Acceptance to the value of {max} (including VAT) per load, on the cost price of your product is included in the quoted rates. Any claim above {max} (including VAT) shall be for your account. It is specifically recorded that this is not insurance cover, but risk acceptance.' },
    { id: 'escc', title: 'Escalation — charges', divs: ['vtr', 'vdd', 'vcl'], text: 'Charges will escalate annually on the {day}, in line with increases for the transport sector. The next escalation date will be the {next}.' },
    { id: 'esccmin', title: 'Escalation — charges, with a minimum', divs: ['log', 'vff'], text: 'Charges will escalate with a minimum of {min} on the {next}. Thereafter, annual escalations will be applied in accordance with the Value Logistics cost escalation matrix, which is aligned to prevailing transport sector increases and will be subject to mutual agreement between the parties.' },
    { id: 'escl', title: 'Escalation — labour', divs: ['vtr', 'log', 'vdd', 'vcl', 'vff'], text: 'Labour rates will automatically escalate annually in line with national labour rate increases as determined by the National Bargaining Council for the Roadfreight Industry. The next escalation date will be the {next}.' },
    { id: 'fuelsep', title: 'Fuel — charged separately', divs: ['vtr', 'vff'], text: 'Rates exclude fuel. Fuel will be charged separately. Fuel is based on the current market price of fuel and is subject to fluctuations in the fuel price. If a driver is supplied by Value Logistics, fuel will be calculated based on the national average fuel consumption per vehicle category. This consumption based fuel is vatable. Should you make use of your own driver, fuel will be calculated based on the actual litres used.' },
    { id: 'fuelsur', title: 'Fuel — surcharge', divs: ['log', 'vcl'], text: '{pct} Fuel Surcharge as at {date} at {price} per litre. Prices are based on the current market price of fuel and are subject to fluctuations in the fuel price. The fuel surcharge will be automatically adjusted in January, April, July and October. Fluctuations above R0,20c per litre will automatically be adjusted in the month of the fuel adjustment. The fuel surcharge will not be adjusted below 0%.' },
    { id: 'escann', title: 'Escalation — on the contract anniversary', divs: ['whs'], text: '{what} will escalate annually, on the anniversary of the contract. The next escalation date will be the {next}.' },
    { id: 'whvol', title: 'Rates depend on volumes', divs: ['whs'], text: 'Rates are based on the specified volumes. Should the volumes vary materially, Value reserves the right to review the rates; any changes will be mutually agreed upon before implementation.' },
    { id: 'whins', title: 'Insurance of stock in the warehouse', divs: ['whs'], text: 'Please make certain that your insurance company covers the product against all risk and SASRIA whilst in our care. The product is stored at your own risk. If your insurance company wishes to inspect our warehouse, this can be done by making an appointment with our Warehouse Manager.' },
    { id: 'fuelmon', title: 'Fuel — surcharge adjusted monthly', divs: ['exp'], text: '{pct} Fuel Surcharge as at {date} at {price} per litre. Prices are based on the current market price of fuel and are subject to fluctuations in the fuel price. This percentage is based on the current fuel price and is adjusted monthly in accordance with the national fuel price.' },
    { id: 'boxvol', title: 'Rates per box', divs: ['exp'], text: 'The quoted rate per box is based on volumetric weight only, calculated on fixed box dimensions as stipulated in Annexure B, with the assumption that the volumetric weight of a consignment will always be greater than the actual weight. Should this assumption no longer hold true, or should box dimensions change, Value Express reserves the right to review the rates quoted.' },
    { id: 'inhouse', title: 'Free in-house operation', divs: ['exp'], text: 'An in-house operation will be supplied free of charge based on a minimum average monthly expenditure of {min}, which will be reviewed on a quarterly basis. Should the average monthly expenditure be less than {min}, Value Express will inform you prior to the commencement of any in-house costs.' },
    { id: 'intlx', title: 'International — exclusions', divs: ['exp'], text: 'A volumetric factor of 5 000 shall apply. An additional charge per kg for waybills affected by x-ray services under Part 108 legislation will be charged accordingly. The above rates are exclusive of the fuel surcharge, airline security fee surcharge at 1%, currency surcharge at 1%, import VAT, import duties, clearance and inspection fees, demurrage, goods in transit insurance and VAT.' },
    { id: 'fuelkm', title: 'Fuel — a rate per kilometre', divs: ['vdd'], text: 'Prices are based on the market price of fuel as at {date}: {inland} per litre inland and {coastal} per litre at the coast, and are subject to fluctuations in the fuel price. The inland price applies to {inlandBranches}; the coastal price applies to {coastalBranches}. The fuel rate per kilometre is the fuel price divided by the agreed fuel consumption, and will be adjusted automatically every month. The fuel consumption will be reviewed every six months and adjusted in line with actual operational measurements.' },
    { id: 'dwinc', title: 'Damage waiver — included', divs: ['vdd'], text: 'Your rates include damage waiver and contribution, therefore you will be covered for vehicle damage or theft of the vehicle and third party damage or loss, up to specified limits and subject to certain exclusions. Terms and conditions are available on request.' },
    { id: 'repl', title: 'Tracking and replacement vehicles', divs: ['vdd'], text: 'Vehicles will be fitted with a tracking system. In the event of a mechanical breakdown or a service, a replacement vehicle will be supplied. The rate for replacement vehicles is included in the quoted rates; kilometres travelled by the replacement vehicle will be added on the contract.' },
    { id: 'flex', title: 'Flexibility', divs: ['vdd'], text: 'The core fleet may be reduced for operational requirements in the event that you no longer need the vehicles, provided a 3 month notice period is given.' },
    { id: 'dg', title: 'Transportation of dangerous goods', divs: ['vcl'], text: 'All dangerous goods are to be transported in terms of Chapter 8 of the National Road Traffic Act 1996. The nature of all dangerous goods transported, with the relevant UN numbers, must be shown on the waybill. A Tremcard must be attached and a dangerous goods declaration needs to be completed.' },
    { id: 'vclclaim', title: 'Contribution to a claim', divs: ['vcl'], text: 'In the event of any loss or claim you will be responsible to contribute towards the loss in the amount of 10% of the claim, with a minimum of R25 000,00, for general incidents and accidents; and 20% of the claim, with a minimum of R50 000,00, for theft and hijacking.' },
    { id: 'pods', title: 'Proofs of delivery', divs: ['vcl', 'log'], text: 'Original proofs of delivery are delivered to you free of charge, and electronic proofs of delivery can be viewed online. Additional copies of proofs of delivery already handed over are charged at the rate in the surcharges.' },
    { id: 'aircraft', title: 'Aircraft liability', divs: ['vtr', 'vff'], text: 'Should you make use of your own driver, it is specifically recorded that Value Logistics will under no circumstances be liable for any damages, whether direct or indirect, suffered by you in respect of any incidents involving aircraft, regardless of you informing Value Logistics that you will be entering airport grounds. You shall be solely responsible to take out the relevant insurance to cover yourself for aircraft related incidents.' },
    { id: 'dispatch', title: 'Dispatching of vehicles', divs: ['vff'], text: 'Vehicles will only be dispatched on receipt of an official order and insurance letter.' },
    { id: 'credit', title: 'If credit is not approved', divs: ['vff'], text: 'The stated rates are on condition that an account is opened and approved before the vehicle leaves our premises. Should the credit application not be approved, one of the following options is available: a pre-authorised deposit by credit card, with an additional 5% for bank charges; an upfront direct deposit; or 7 day payment terms, subject to the approval of the Board of Directors.' },
    { id: 'payloads', title: 'Payloads', divs: ['vtr', 'vdd', 'vff'], text: 'The payload of the vehicle i.e. the total mass of goods being transported, may differ depending on the distribution of the load in the vehicle. Please refer to the licence disc on the vehicle in order to confirm the GVM (gross vehicle mass) and Tare thereof, so as to ensure that the payload of the vehicle is not exceeded. It is your responsibility to ensure that the correct payload and load distribution is adhered to.' },
    { id: 'interface', title: 'IT interface', divs: ['log'], text: 'A Generic Distribution interface is included in our rates. Should any further IT customisation be required, these costs will be for the customer’s account.' },
    { id: 'params', title: 'Quotation parameters', divs: ['log'], text: 'The above parameters will be monitored, and should it vary, Value reserves the right to review the rates; any changes will be mutually agreed upon before implementation.' },
    { id: 'vat', title: 'Value added tax', divs: ['vtr', 'log', 'whs', 'exp', 'vdd', 'vcl', 'vff'], text: 'All the quoted rates are VAT exclusive.' },
    { id: 'conf', title: 'Confidentiality', divs: ['vtr', 'log', 'whs', 'exp', 'vdd', 'vcl', 'vff'], text: 'The information contained in this quote is commercial in nature and is confidential and sensitive. The parties agree that they will treat it confidentially and use it solely for the purpose for which this quote was intended. Should you not be the intended recipient of this document, please notify {division} and promptly destroy the quote.' },
    { id: 'pay', title: 'Terms of payment', divs: ['vtr', 'log', 'whs', 'exp', 'vdd', 'vcl', 'vff'], text: 'Our terms of payment are {days} days from date of statement. Any late payments will attract interest at the prime lending rate plus 2%.' },
    { id: 'account', title: 'Account approved first', divs: ['vtr'], text: 'The stated rates are on condition that an account is opened and approved before the vehicle leaves our premises.' },
    { id: 'tnc', title: 'Terms and conditions', divs: ['vtr', 'log', 'whs', 'exp', 'vdd', 'vcl', 'vff'], text: 'Any change in legislation that will impact the scope of work, will result in {division} reviewing the rates on this proposal. This quotation is subject to our standard trading terms and conditions, a copy of which is available on request. This quotation is valid for a period of {valid} days from date of this quotation.' },
    { id: 'accept', title: 'Acceptance by use', divs: ['vtr', 'log', 'whs', 'exp', 'vdd', 'vcl', 'vff'], text: 'By your utilising the services as set out in this quote, you confirm your acceptance of this quote.' },
  ];
  VQ.clause = id => VQ.CLAUSES.find(c => c.id === id).text;
  VQ.fill = (text, vals) => text.replace(/\{([a-zA-Z:]+)\}/g, (m, k) => vals[k] != null ? vals[k] : m);

  /* ---------- approval rules (proposed) ---------- */
  VQ.FLOOR = 0.10; /* prices more than 10% below standard need approval */
  VQ.RULES = [
    ['Every quote', 'Second signatory for the division', 'Two Value signatures appear on eight of the nine current quote letters'],
    ['Any price more than 10% below the standard rate', 'Second signatory, with the reason shown', 'Proposed'],
    ['Payment terms other than the division default', 'Second signatory', 'Terms of 60 and 67 days exist today as exceptions'],
    ['A special condition typed in by hand', 'Second signatory', 'Proposed'],
    ['Contract of 36 months or longer, or more than R750 000 a month', 'Directors of the Value Group', '“Subject to the final approval of the directors” on long contracts'],
  ];

  /* ---------- opening set of quotes (built into full quotes by app.js) ---------- */
  VQ.SEED = [
    { num: 20418, div: 'vtr', cust: 'c3', owner: 'sam', status: 'accepted', age: 41, blocks: ['vtr.monthly', 'vtr.labour'], vehicles: [{ veh: 'cs8', qty: 2, km: 4000, driver: 'd10' }, { veh: 'tl4', qty: 1, km: 3000, driver: '' }], months: 12 },
    { num: 20422, div: 'log', cust: 'c7', owner: 'aisha', status: 'accepted', age: 33, blocks: ['log.dist', 'log.rev'], vols: [612, 96500, 455], adjust: -3 },
    { num: 20425, div: 'vtr', cust: 'c8', owner: 'lerato', status: 'sent', age: 12, blocks: ['vtr.daily', 'vtr.delivery'], vehicles: [{ veh: 'tl4', qty: 3, km: 1800, driver: '' }], months: 1 },
    { num: 20426, div: 'log', cust: 'c10', owner: 'aisha', status: 'sent', age: 26, blocks: ['log.dist'], vols: [140, 21800, 96] },
    { num: 20427, div: 'vtr', cust: 'c9', owner: 'sam', status: 'approved', age: 4, blocks: ['vtr.monthly'], vehicles: [{ veh: 'rf4', qty: 2, km: 5000, driver: '' }], months: 6 },
    { num: 20428, div: 'vtr', cust: 'c4', owner: 'lerato', status: 'awaiting', age: 2, blocks: ['vtr.monthly', 'vtr.labour', 'vtr.delivery'], vehicles: [{ veh: 'cs8', qty: 4, km: 5000, driver: 'd10' }], months: 24, adjust: -12, note: 'Customer is moving four trucks from a competitor. Matched their monthly rate to win the 24-month term.' },
    { num: 20429, div: 'log', cust: 'c6', owner: 'aisha', status: 'awaiting', age: 1, blocks: ['log.dist', 'log.rev', 'log.inhouse'], vols: [820, 64000, 410], payDays: 45, note: 'Customer pays all suppliers on 45 days. Volumes justify it.' },
    { num: 20430, div: 'vtr', cust: 'c5', owner: 'sam', status: 'draft', age: 0, blocks: ['vtr.weekly'], vehicles: [{ veh: 'cs4', qty: 1, km: 1500, driver: '' }], months: 2 },
    { num: 20409, div: 'vtr', cust: 'c7', owner: 'pieter', status: 'expired', age: 46, blocks: ['vtr.monthly'], vehicles: [{ veh: 'pv1', qty: 5, km: 3000, driver: '' }], months: 12 },
    { num: 20412, div: 'log', cust: 'c4', owner: 'aisha', status: 'declined', age: 38, blocks: ['log.dist'], vols: [95, 18200, 88] },
    /* other divisions: shown in the list so it reads company-wide; not opened in this mockup */
    { num: 20419, div: 'exp', cust: 'c6', owner: 'pieter', status: 'sent', age: 9, blocks: ['exp.dom', 'exp.box', 'exp.intl'], express: true },
    { num: 20421, div: 'whs', cust: 'c2', owner: 'aisha', status: 'approved', age: 6, blocks: ['whs.in', 'whs.store', 'whs.pick', 'whs.orders'], wh: ['DBN', 'JHB'], months: 24 },
    { num: 20423, div: 'vdd', cust: 'c3', owner: 'pieter', status: 'accepted', age: 20, blocks: ['vdd.core', 'vdd.labour', 'vdd.mgmt'], dd: true, months: 36 },
    { num: 20424, div: 'vcl', cust: 'c9', owner: 'pieter', status: 'draft', age: 3, blocks: ['vcl.xis', 'vcl.exp', 'vcl.eco'], vcl: true },
    { num: 20420, div: 'vff', cust: 'c11', owner: 'lerato', status: 'accepted', age: 15, blocks: ['vff.weekly'], film: true },
  ];
})(window.VQ);
