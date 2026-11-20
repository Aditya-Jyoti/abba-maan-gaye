class Component extends DCLogic {
  state = { view: new URLSearchParams(location.search).get('view') || this.props.startView || 'india', hover: null, stop: 1, phase: 0, map: null, fitI: 1, fitS: 1, mobile: false };
  theme() {
    return {
      fill: (h, id, dim) => { const w = (h * 0.85 + 12) % 360; return dim ? `oklch(0.9 0.03 ${w})` : `oklch(0.85 0.1 ${w})`; },
      side: (h, id, dim) => { const w = (h * 0.85 + 12) % 360; return dim ? `oklch(0.8 0.03 ${w})` : `oklch(0.66 0.09 ${w})`; },
      depth: 4, lift: 11, exitMs: 900, backPhotoDelay: '0.15s', socket: () => 'oklch(0.55 0.05 192)',
      tripColors: ['oklch(0.62 0.16 32)', 'oklch(0.5 0.1 200)'], bend: 0.22,
      zoomBox: this.state.mobile ? [350, 400, 640, 700] : [420, 410, 980, 640], indiaDim: 0.28,
      zoomRegion: this.state.mobile ? [112, 445, 215, 550] : null,
      callAbs: this.state.mobile
        ? { mumbai: [146, 226], alibaug: [150, 500], lonavala: [330, 250], pune: [470, 420], mahabaleshwar: [430, 618] }
        : { mumbai: [-34, 330], alibaug: [-44, 468], lonavala: [222, 372], pune: [262, 470], mahabaleshwar: [228, 580] },
      cityList: this.state.mobile ? ['solapur', 'kolhapur', 'ratnagiri', 'satara'] : ['nagpur', 'solapur', 'kolhapur', 'amravati', 'nanded', 'ratnagiri', 'chandrapur', 'jalgaon', 'latur'],
      cityLeft: this.state.mobile ? ['ratnagiri', 'solapur'] : ['ratnagiri'],
    };
  }
  // per-state: display name, icons, angle override, leader label [x, y, anchor]
  cfg() {
    return {
      'ladakh': { icon: 'mountain', icon2: 'mountain' }, 'jammu-and-kashmir': { n: 'Jammu &\nKashmir', icon: 'boat' },
      'himachal-pradesh': { n: 'Himachal\nPradesh', icon: 'pine' }, 'punjab': { icon: 'golden' }, 'haryana': {},
      'chandigarh': { lead: [238, 188, 'start'] }, 'delhi': { lead: [256, 262, 'start'], iconAt: [246, 270, 'qutub', .62] },
      'uttarakhand': { icon: 'temple' }, 'uttar-pradesh': { n: 'Uttar\nPradesh', icon: 'taj', icon2: 'tree' },
      'rajasthan': { icon: 'hawa', icon2: 'camel' }, 'gujarat': { icon: 'statue', icon2: 'camel' },
      'madhya-pradesh': { n: 'Madhya\nPradesh', icon: 'stupa', icon2: 'tree' }, 'maharashtra': { icon: 'gateway', icon2: 'hills', ang: -6 },
      'goa': { lead: [134, 592, 'end'] }, 'karnataka': { icon: 'palace', icon2: 'palm' }, 'kerala': { icon: 'boat' },
      'tamil-nadu': { n: 'Tamil\nNadu', icon: 'gopuram', icon2: 'palm' }, 'puducherry': { lead: [300, 690, 'start'] },
      'andhra-pradesh': { n: 'Andhra\nPradesh', icon: 'temple' }, 'telangana': { icon: 'charminar' },
      'chhattisgarh': { icon: 'waterfall' }, 'odisha': { icon: 'konark' }, 'jharkhand': { icon: 'hills' }, 'bihar': { icon: 'stupa' },
      'west-bengal': { n: 'West\nBengal', icon: 'victoria' }, 'sikkim': { lead: [478, 262, 'middle'] }, 'assam': { icon: 'tea' },
      'arunachal-pradesh': { n: 'Arunachal\nPradesh', icon: 'pine' }, 'meghalaya': { icon: 'waterfall' },
      'nagaland': { ang: 0 }, 'manipur': {}, 'mizoram': {}, 'tripura': { lead: [534, 404, 'end'] },
      'dadra-and-nagar-haveli-and-daman-and-diu': { n: 'DNH & DD', lead: [114, 456, 'end'] },
      'andaman-and-nicobar-islands': { n: 'Andaman & Nicobar', lead: [592, 622, 'start'] }, 'lakshadweep': { lead: [100, 706, 'end'], dot: [124.3, 684.3] },
    };
  }
  onResize = () => {
    const W = window.innerWidth, H = window.innerHeight, mobile = W < 900;
    const fitI = mobile ? Math.min(W / 652, (H - 60) / 800) : Math.max(0.6, Math.min((H - 40) / 800, (W - 64) / 700, 1.3));
    const fitS = mobile ? W / 700 : fitI;
    const s = this.state;
    if (Math.abs(fitI - s.fitI) > 0.004 || Math.abs(fitS - s.fitS) > 0.004 || mobile !== s.mobile) this.setState({ fitI, fitS, mobile });
  };
  componentDidMount() {
    this.onResize(); window.addEventListener('resize', this.onResize);
    Promise.all([document.fonts ? document.fonts.ready : null, new Promise(r => setTimeout(r, 900))]).then(() => this.setState({ fontsOk: true }));
    import((window.__resources && window.__resources.core) || './travel-core.js').then(m => { this.lib = m; m.boot(this); });
  }
  componentWillUnmount() { window.removeEventListener('resize', this.onResize); (this._timers || []).forEach(clearTimeout); }
  renderVals() {
    const v = this.lib ? this.lib.makeVals(this, this.theme()) : { ready: false };
    if (!v.ready || !this.state.fontsOk) return { loaderOp: 1, loaderVis: 'visible', loaderDelay: '0s', homeOp: 0, homePE: 'none' };
    const s = this.state, hv = s.hover, home = s.view === 'india';
    const enter = (id) => () => { if (s.view === 'india') this.setState({ hover: id }); };
    const mob = s.mobile, inState = s.view === 'state';
    const labels = [], icons = [], leads = [];
    let ovPhotos = [], outline = '';
    if (s.map) {
      const L = s.map.labels || {}, C = this.cfg(), P = s.map.places;
      outline = s.map.outline || '';
      s.map.states.forEach(st => {
        const c = C[st.id] || {}, l = L[st.id]; if (!l) return;
        const ty = hv === st.id ? -11 : 0, t = c.n || st.name;
        if (c.lead) {
          const [lx, ly, a] = c.lead;
          leads.push({ t, lx, ly, cx: c.dot ? c.dot[0] : l.lx, cy: c.dot ? c.dot[1] : l.ly, ty, ax: a === 'end' ? '-100%' : (a === 'start' ? '0%' : '-50%') });
        } else {
          labels.push({ t, x: l.lx, y: l.ly, ang: c.ang ?? l.ang, ty, s: (Math.max(7.5, Math.min(13.5, l.r * 0.4)) * (mob ? 1.3 : 1)).toFixed(1) });
        }
        const add = (type, x, y, room) => { const sc = Math.max(.5, Math.min(1, room / 16)); icons.push({ ['is_' + type]: true, x, y: +(y + 11 * sc).toFixed(1), sc: sc.toFixed(2), ty }); };
        if (c.icon) add(c.icon, l.ix, l.iy, l.ir);
        if (c.icon2 && l.i2r > 6 && !mob) add(c.icon2, l.i2x, l.i2y, l.i2r);
        if (c.iconAt) { const [x, y, type, sc] = c.iconAt; icons.push({ ['is_' + type]: true, x, y, sc, ty }); }
      });
      const lift = (id) => hv === id ? -14 : 0;
      ovPhotos = [
        { x: 150, y: 486, rot: -8, lift: lift('maharashtra') }, { x: 173, y: 502, rot: 7, lift: lift('maharashtra') },
        { x: P.jaisalmer[0] + 4, y: P.jaisalmer[1] + 2, rot: -6, lift: lift('rajasthan') },
        { x: P.alleppey[0], y: P.alleppey[1] + 2, rot: 6, lift: lift('kerala') },
      ];
    }
    const lak = (v.states || []).find(x => x.id === 'lakshadweep');
    const islands = s.map && s.map.lakshadweep ? s.map.lakshadweep.map(([x, y, r]) => ({ x, y, r, f: lak ? lak.fill : '#e9cf9a' })) : [];
    const boats = [[58, 500, '#c4532f', 1], [96, 610, '#e0a64a', .85], [34, 650, '#3f8f86', .9], [66, 724, '#c4532f', .8], [160, 768, '#3f8f86', .9],
      [442, 552, '#e0a64a', 1], [356, 690, '#c4532f', .85], [520, 520, '#3f8f86', .9], [560, 600, '#c4532f', .8], [-130, 420, '#e0a64a', 1.1], [-70, 640, '#3f8f86', 1], [760, 470, '#c4532f', 1.05], [790, 300, '#e0a64a', .9]]
      .map(([x, y, c, sz], i) => ({ x, y, c, s: sz, d: (i * .37 % 2).toFixed(2), dur: (3 + (i % 4) * .4).toFixed(1) }));
    return {
      ...v, labels, icons, leads, ovPhotos, outline, boats, islands,
      fit: (inState ? s.fitS : s.fitI).toFixed(4), shiftX: 0,
      pinS: mob ? (1.05 / s.fitS).toFixed(2) : 1, leadDisp: mob ? 'none' : 'block',
      loaderOp: 0, loaderVis: 'hidden', loaderDelay: '.7s',
      cardZoom: mob ? .5 : .74, homeZ: mob ? 0 : 2, deskOnly: mob ? 'none' : 'block',
      backL: mob ? 12 : 52, backT: mob ? 58 : 48,
      tcd: mob ? { l: '12px', r: '12px', b: '22px', mw: 'none' } : { l: 'auto', r: '52px', b: '52px', mw: '300px' },
      stp: mob ? { l: 'auto', r: '-12px', t: '24px', s: .6 } : { l: '52px', r: 'auto', t: '48px', s: 1 },
      pc: mob ? {
        c1: { l: '28px', t: '116px', r: 'auto', b: 'auto' }, c5: { l: '272px', t: '140px', r: 'auto', b: 'auto' },
        c3: { l: '24px', t: 'auto', r: 'auto', b: '52px' }, c6: { l: '264px', t: 'auto', r: 'auto', b: '24px' },
        c2: { l: 'auto', t: 'auto', r: '24px', b: '84px' }, c4: { l: 'auto', t: 'calc(50% + 70px)', r: '10px', b: 'auto' },
      } : {
        c1: { l: '70px', t: 'calc(50% - 250px)', r: 'auto', b: 'auto' }, c2: { l: '210px', t: 'auto', r: 'auto', b: '120px' },
        c3: { l: '34px', t: 'calc(50% - 20px)', r: 'auto', b: 'auto' }, c4: { l: 'auto', t: 'calc(50% + 10px)', r: '36px', b: 'auto' },
        c5: { l: 'auto', t: '205px', r: '90px', b: 'auto' }, c6: { l: 'auto', t: 'auto', r: '200px', b: '110px' },
      }, cityS: mob ? (0.95 / s.fitS).toFixed(2) : 1, 
      seaOp: inState && !s.leaving ? .55 : 1,
      depthAnim: s.leaving ? 'ghDepthOut .85s cubic-bezier(.5,0,.3,1) both' : 'ghDepth 1.2s cubic-bezier(.3,1.15,.45,1) both',
      distAnim: s.leaving ? 'ghOut .25s ease both' : 'ghIn .5s 1s ease both',
      enterMH: enter('maharashtra'), enterRJ: enter('rajasthan'), enterKL: enter('kerala'),
      leaveCard: () => this.setState({ hover: null }),
      liftMH: 0, liftRJ: 0, liftKL: 0,
      homeOp: home ? 1 : 0, homePE: home ? 'auto' : 'none',
      homeShiftL: home ? 0 : -60, homeShiftR: home ? 0 : 60,
      homeDelay: home && s.back ? '0.1s' : '0s',
    };
  }
}
