// Shared data + view-model for all three Ghumakkad directions.
// Each DC passes a theme; this returns the flat values its template binds to.

export const TRIP = {
  id: 'western-ghats-2025',
  title: 'Monsoon on the Western Ghats',
  state: 'Maharashtra',
  range: '12-21 Jul 2025',
  color: 0, // index into theme.tripColors
};

export const STOPS = [
  { key: 'mumbai', name: 'Mumbai', date: '12 Jul', dateLong: '12-13 July 2025', nights: 2,
    title: 'Salt air and the first rain',
    dek: 'The monsoon arrived the same afternoon we did, and the city didn\'t slow down for either of us.',
    body: [
      'We landed into a sky the colour of wet slate. By the time the cab reached Marine Drive the first proper downpour had begun, and the promenade emptied in about forty seconds, except for the chai sellers, who simply moved their stoves under the nearest awning and kept pouring.',
      'The next morning we rode the local from Churchgate with the doors open, the way everyone does, and ate vada pav standing up outside Dadar station. Mumbai in July is loud, soaked and completely unbothered. It was the right place to start.',
    ],
    quote: 'Mumbai in July is loud, soaked and completely unbothered.',
    photos: ['Marine Drive at dusk', 'Vada pav stall, Dadar', 'Gateway in drizzle', 'Open door, Western line', 'Bandra lanes', 'Chai at Colaba'],
    details: [['Stayed', 'Colaba guesthouse'], ['Getting there', 'Flight into BOM'], ['Weather', '27 C, heavy rain'], ['Don\'t miss', 'Kala Ghoda on foot']] },
  { key: 'lonavala', name: 'Lonavala', date: '14 Jul', dateLong: '14-15 July 2025', nights: 2,
    title: 'Clouds you can walk through',
    dek: 'Two hours up the expressway, the ghats swallowed the road and gave us back waterfalls.',
    body: [
      'Somewhere past Khopoli the expressway climbs into the cloud and stays there. Lonavala in the monsoon is less a town than a weather system. Every ridge is streaming, every hairpin has a waterfall, and every waterfall has a family standing under it in their clothes.',
      'We walked out to Tiger\'s Leap at seven and saw absolutely nothing for twenty minutes. Then the fog tore open for maybe ten seconds and the whole valley was there, impossibly green, before it closed again. Afterwards: corn roasted on coals and a box of chikki for the road.',
    ],
    quote: 'The fog tore open for ten seconds and the whole valley was there.',
    photos: ['Tiger\'s Leap in fog', 'Bhushi Dam steps', 'Chikki counter', 'Rajmachi trail', 'Ghat waterfall', 'Corn on the coals'],
    details: [['Stayed', 'Hillside homestay'], ['Getting there', 'Expressway, 2 hrs'], ['Weather', '22 C, fog & showers'], ['Don\'t miss', 'Tiger\'s Leap at dawn']] },
  { key: 'pune', name: 'Pune', date: '16 Jul', dateLong: '16-17 July 2025', nights: 2,
    title: 'Old wadas, new coffee',
    dek: 'A city of Peshwa gateways and third-wave cafes, separated by about one auto ride.',
    body: [
      'Pune felt like exhaling. We spent the first morning around Shaniwar Wada and the old peths, where the lanes are narrow enough that the rain only reaches you in stripes, and the afternoon drinking very serious coffee in Koregaon Park.',
      'The real reason to come, though, is breakfast. Misal pav with a fiery tarri, eaten at a steel table while the cook argues cricket with the regulars, we went back twice.',
    ],
    quote: 'The lanes are narrow enough that the rain only reaches you in stripes.',
    photos: ['Shaniwar Wada gate', 'Koregaon Park cafe', 'Misal pav', 'Sinhagad ridge', 'Tulshibaug market', 'Peth doorway'],
    details: [['Stayed', 'Boutique hotel, Deccan'], ['Getting there', 'Road from Lonavala, 1.5 hrs'], ['Weather', '24 C, light rain'], ['Don\'t miss', 'Misal at a peth cafe']] },
  { key: 'mahabaleshwar', name: 'Mahabaleshwar', date: '18 Jul', dateLong: '18-19 July 2025', nights: 2,
    title: 'Strawberries in the mist',
    dek: 'The plateau was quieter than we expected, and greener than anywhere we\'ve been.',
    body: [
      'Monsoon is off-season up here, which means half the viewpoints are hidden in cloud and none of the crowds turn up. We had Arthur\'s Seat to ourselves, a cold wind coming up off the Savitri valley and the sound of water everywhere.',
      'Strawberry season is long gone by July, but the farm sheds still sell jam and thick strawberry cream, and we were not about to say no. The drive down to Pratapgad the next morning was the most beautiful road of the whole trip.',
    ],
    quote: 'We had Arthur\'s Seat to ourselves and the sound of water everywhere.',
    photos: ['Arthur\'s Seat', 'Farm-shed jam jars', 'Venna Lake boats', 'Pratapgad steps', 'Mist over the plateau', 'Wilson Point'],
    details: [['Stayed', 'Old colonial bungalow'], ['Getting there', 'Via Wai, 3 hrs'], ['Weather', '18 C, constant mist'], ['Don\'t miss', 'The Pratapgad road']] },
  { key: 'alibaug', name: 'Alibaug', date: '20 Jul', dateLong: '20-21 July 2025', nights: 2,
    title: 'Ending at the edge of the sea',
    dek: 'Down from the ghats to the Konkan coast, and a ferry back to where it all began.',
    body: [
      'After a week in the hills the sea felt enormous. We walked out to Kolaba Fort at low tide, ankle-deep across the sand bar, and ate a fish thali that ruined every other fish thali for us.',
      'On the last evening the rain held off long enough for an actual sunset at Kihim. The next morning we took the ferry back across the harbour to the Gateway, the city we\'d started in, slightly drier this time.',
    ],
    quote: 'The rain held off long enough for an actual sunset.',
    photos: ['Kolaba Fort, low tide', 'Ferry from the Gateway', 'Fish thali', 'Varsoli beach', 'Kihim sunset', 'Coconut grove stay'],
    details: [['Stayed', 'Cottage near Kihim'], ['Getting there', 'Road from Mahabaleshwar, 4 hrs'], ['Weather', '28 C, breaks of sun'], ['Don\'t miss', 'Fort walk at low tide']] },
];

// Second Maharashtra trip, shows how several trips coexist with different pin/line colours.
export const TRIP2 = { title: 'Caves & Kitchens', range: 'Jan 2024', color: 1,
  stops: [['nashik', 'Nashik'], ['aurangabad', 'Aurangabad'], ['ellora', 'Ellora'], ['ajanta', 'Ajanta']] };

export const VISITED = {
  maharashtra: { trips: 2, photos: ['Marine Drive at dusk', 'Tiger\'s Leap in fog'], label: '2 trips, 9 stops' },
  rajasthan: { trips: 1, photos: ['Jaisalmer fort walls'], label: '1 trip, Desert Winter' },
  kerala: { trips: 1, photos: ['Backwater houseboat'], label: '1 trip, Backwaters' },
};

// Callout offsets (px from pin) for the photo clusters in state view.
const CALLOUT = { mumbai: [-168, -78], lonavala: [195, -28], pune: [150, 112], mahabaleshwar: [-90, 140], alibaug: [-176, 48] };

export async function loadMap() {
  const r = await fetch((window.__resources && window.__resources.mapdata) || './india-map.json');
  return r.json();
}

function mhZoom(map, left = 250, right = 34, boost = 1.3, box = null, region = null) {
  const mh = map.states.find(s => s.id === 'maharashtra');
  const [[x0, y0], [x1, y1]] = region ? [[region[0], region[1]], [region[2], region[3]]] : mh.bb;
  if (box) { const [cx, cy, w, h] = box; const k = Math.min(w / (x1 - x0), h / (y1 - y0)); return { k, tx: cx - k * (x0 + x1) / 2, ty: cy - k * (y0 + y1) / 2 }; }
  const k = boost * Math.min((map.w - left - right) / (x1 - x0), (map.h - 140) / (y1 - y0));
  return { k, tx: left - k * x0, ty: map.h / 2 - k * (y0 + y1) / 2 };
}

const curve = (pts, bend) => pts.reduce((d, p, i) => {
  if (!i) return `M${p[0]},${p[1]}`;
  const q = pts[i - 1]; const mx = (q[0] + p[0]) / 2, my = (q[1] + p[1]) / 2;
  const dx = p[0] - q[0], dy = p[1] - q[1];
  return d + ` Q${(mx - dy * bend).toFixed(1)},${(my + dx * bend).toFixed(1)} ${p[0]},${p[1]}`;
}, '');

// theme: { fill(hue,id), side(hue,id), stroke, depth, lift, tripColors:[c1,c2], bend, zoomLeft }
export function makeVals(c, theme) {
  const map = c.state.map; if (!map) return { ready: false };
  const s = c.state; const view = s.view;
  const zoomed = view === 'state';
  const Z = mhZoom(map, theme.zoomLeft ?? 250, 34, theme.zoomBoost ?? 1.3, theme.zoomBox, theme.zoomRegion);
  const z = zoomed ? Z : { k: 1, tx: 0, ty: 0 };
  const set = (o) => c.setState(o);
  const clearT = () => { (c._timers || []).forEach(clearTimeout); c._timers = []; };
  const later = (fn, ms) => { c._timers = c._timers || []; c._timers.push(setTimeout(fn, ms)); };

  // Every navigation plays an exit first: blog fades down, pins shrink away, then the map moves.
  const goIndia = () => {
    clearT();
    if (view === 'blog') {
      set({ exiting: true, toMap: true });
      later(() => { window.scrollTo(0, 0); set({ view: 'state', exiting: false, toMap: false, leaving: true, hover: null }); }, 380);
      later(() => set({ view: 'india', leaving: false, back: true }), 380 + (theme.exitMs ?? 160));
    } else if (view === 'state') {
      set({ leaving: true });
      later(() => set({ view: 'india', leaving: false, back: true, hover: null }), theme.exitMs ?? 300);
    } else set({ view: 'india', hover: null });
  };
  const goState = () => {
    clearT();
    if (view === 'blog') {
      set({ exiting: true, toMap: true });
      later(() => { window.scrollTo(0, 0); set({ view: 'india', exiting: false, toMap: false, back: false, hover: null }); }, 380);
      later(() => set({ view: 'state' }), 480);
    } else set({ view: 'state', hover: null, back: false, leaving: false });
  };
  const openStop = (i) => {
    clearT();
    set({ opening: true });
    later(() => { window.scrollTo(0, 0); set({ view: 'transition', stop: i, phase: 0, hover: null, opening: false }); }, 260);
    later(() => set({ phase: 1 }), 320);
    later(() => set({ phase: 2 }), 1000);
    later(() => set({ view: 'blog', phase: 0 }), 2550);
  };
  const jumpStop = (i) => {
    clearT(); if (i === s.stop) return;
    set({ exiting: true });
    later(() => { window.scrollTo(0, 0); set({ stop: i, exiting: false }); }, 300);
  };

  const states = map.states.map(st => {
    const isMH = st.id === 'maharashtra';
    const dim = zoomed && !isMH;
    return {
      id: st.id, d: st.d,
      fill: isMH && zoomed && theme.socket && !s.leaving ? theme.socket(st.hue) : theme.fill(st.hue, st.id, dim), side: theme.side(st.hue, st.id, dim),
      onEnter: () => { if (!zoomed && c.state.hover !== st.id) set({ hover: st.id }); },
      onLeave: () => { if (c.state.hover === st.id) set({ hover: null }); },
      onClick: () => { if (isMH && !zoomed) goState(); },
      cursor: isMH && !zoomed ? 'pointer' : 'default',
    };
  });
  const hs = !zoomed && s.hover ? map.states.find(x => x.id === s.hover) : null;
  const hoverState = hs ? {
    d: hs.d, fill: theme.fill(hs.hue, hs.id, false), side: theme.side(hs.hue, hs.id, false), name: hs.name,
    x: hs.cx, y: hs.bb[0][1] - theme.lift - 10,
    sub: VISITED[hs.id] ? VISITED[hs.id].label : 'Not yet visited',
    visited: !!VISITED[hs.id], isMH: hs.id === 'maharashtra',
  } : null;

  // overview photo previews (1-2 per visited state)
  const overviewPhotos = [];
  Object.entries(VISITED).forEach(([id, v]) => {
    const st = map.states.find(x => x.id === id);
    v.photos.forEach((label, i) => overviewPhotos.push({
      key: id + i, label,
      x: st.cx + (v.photos.length > 1 ? (i ? 26 : -26) : 0), y: st.cy - (i ? 6 : 20),
      rot: (i ? 7 : -6), lift: s.hover === id ? -theme.lift - 6 : 0,
    }));
  });

  const P = (k) => { const p = map.places[k]; return [p[0] * Z.k + Z.tx, p[1] * Z.k + Z.ty]; };
  const tc = theme.tripColors;
  const pins = STOPS.map((st, i) => {
    const [x, y] = P(st.key); const [dx, dy] = CALLOUT[st.key]; const ab = theme.callAbs && theme.callAbs[st.key];
    return { n: i + 1, name: st.name, date: st.date, x, y, cx: ab ? ab[0] : x + dx, cy: ab ? ab[1] : y + dy, rot: [-5, 4, -3, 6, -4][i],
      photos: st.photos.slice(0, 3), color: tc[0], onClick: () => openStop(i), delay: (300 + i * 90) + 'ms' };
  });
  const tripLine = curve(STOPS.map(st => P(st.key)), theme.bend ?? 0.18);
  const pins2 = TRIP2.stops.map(([k, name], i) => { const [x, y] = P(k); return { n: i + 1, name, x, y, color: tc[1], ly: k === 'aurangabad' ? 12 : (k === 'ellora' ? -16 : -4) }; });
  const tripLine2 = curve(TRIP2.stops.map(([k]) => P(k)), theme.bend ?? 0.18);

  const stop = STOPS[s.stop];
  const stopsNav = STOPS.map((st, i) => ({
    n: i + 1, name: st.name, date: st.date, active: i === s.stop, notActive: i !== s.stop, past: i < s.stop, isLast: i === STOPS.length - 1, notLast: i < STOPS.length - 1,
    onClick: () => jumpStop(i),
  }));

  // timeline transition track: 5 nodes across TW px; phase 2 zooms into active
  const TW = theme.trackW ?? 1040, TK = theme.trackZoom ?? 2.6;
  const nodeX = (i) => i * TW / 4;
  const track = s.phase >= 2
    ? `translateX(${(TW / 2 - nodeX(s.stop) * TK).toFixed(1)}px) scale(${TK})`
    : 'translateX(0px) scale(1)';
  const tlNodes = STOPS.map((st, i) => ({ n: i + 1, nn: '0' + (i + 1), name: st.name, date: st.date, x: nodeX(i), y: [10, -46, 28, -34, 16][i],
    active: i === s.stop, notActive: i !== s.stop, op: s.phase >= 2 && i !== s.stop ? 0.22 : 1, photo: st.photos[0], title: st.title, dateLong: st.dateLong }));

  return {
    ready: true,
    isIndia: view === 'india', isState: view === 'state', isMap: view === 'india' || view === 'state',
    isTransition: view === 'transition', isBlog: view === 'blog',
    phase1: s.phase >= 1, phase2: s.phase >= 2,
    mapTransform: `translate(${z.tx}px, ${z.ty}px) scale(${z.k})`,
    sideTransform: `translate(0px, ${(theme.depth / z.k).toFixed(2)}px)`,
    states, hoverState, hasHover: !!hoverState, overviewPhotos,
    pins, tripLine, pins2, tripLine2,
    trip: TRIP, trip2: TRIP2, tripColor: tc[0], tripColor2: tc[1],
    stop: { ...stop, n: s.stop + 1, total: STOPS.length, nn: '0' + (s.stop + 1),
      gallery: stop.photos.map((label, i) => ({ label, rot: [-2.2, 1.6, -1.2, 2.4, -1.8, 1.1][i], tall: i === 1 || i === 3, span: i === 0 || i === 3 ? 2 : 1 })),
      details2: stop.details.map(([k, v]) => ({ k, v })),
      prev: STOPS[s.stop - 1] || null, next: STOPS[s.stop + 1] || null },
    hasPrev: s.stop > 0, hasNext: s.stop < STOPS.length - 1,
    goPrev: () => s.stop > 0 && jumpStop(s.stop - 1), goNext: () => s.stop < 4 && jumpStop(s.stop + 1),
    stopsNav, tlNodes, track, trackW: TW,
    wipeClip: s.toMap ? 'circle(150% at 6% 3%)' : 'circle(0% at 6% 3%)',
    pageOp: s.exiting ? 0 : 1, pageY: s.exiting ? 18 : 0,
    pinsOp: s.leaving || s.opening ? 0 : 1, pinsScale: s.leaving || s.opening ? 0.85 : 1,
    photoDelay: s.back ? (theme.backPhotoDelay ?? '1.15s') : '0.5s',
    // "pop-out" mode: India stays put and recedes; Maharashtra lifts out and grows as a 3D slab
    indiaTransform: zoomed && !s.leaving ? 'translate(0px, 30px) scale(0.92)' : 'translate(0px, 0px) scale(1)',
    indiaOp: zoomed && !s.leaving ? (theme.indiaDim ?? 0.45) : 1,
    cityDots: map.cities ? Object.entries(map.cities).filter(([k]) => (theme.cityList || []).includes(k)).map(([k, p]) => {
      const x = p[0] * Z.k + Z.tx, y = p[1] * Z.k + Z.ty, left = (theme.cityLeft || []).includes(k);
      return { name: k[0].toUpperCase() + k.slice(1), x, y, tx: left ? '-100%' : '0%', ox: left ? -9 : 9 }; }) : [],
    mhDistricts: map.mhDistricts || '',
    sideFlat: `translate(0px, ${theme.depth}px)`,
    zoomTx: Z.tx.toFixed(1), zoomTy: Z.ty.toFixed(1), zoomK: Z.k.toFixed(3),
    hero: (() => { const mh = map.states.find(x => x.id === 'maharashtra'); return {
      d: mh.d, fill: theme.fill(mh.hue, mh.id, false), side: theme.side(mh.hue, mh.id, false),
      d1: (6 / Z.k).toFixed(2), d2: (12 / Z.k).toFixed(2), d3: (18 / Z.k).toFixed(2) }; })(),
    heroAnim: s.leaving ? 'ghShrink .85s cubic-bezier(.5,0,.3,1) both' : 'ghGrow 1.2s cubic-bezier(.3,1.15,.45,1) both',
    heroTilt: s.leaving ? 'ghTiltOut .85s ease both' : 'ghTilt 1.2s ease both',
    blocks: (STORIES[stop.key] ? STORIES[stop.key].story : [['p', stop.body[0]], ['duo', stop.photos[1], stop.photos[2]], ['quote', stop.quote], ['p', stop.body[1]], ['wide', stop.photos[3]]])
      .map(([t, a, b, c]) => ({ ['is' + t[0].toUpperCase() + t.slice(1)]: true, text: a, a, b, c, kick: b })),
    see: (STORIES[stop.key] || { see: [] }).see.map(([name, line, meta], i) => ({ name, line, meta, rot: [-2, 1.5, -1, 2][i % 4] })),
    eat: (STORIES[stop.key] || { eat: [] }).eat.map(([name, line, price]) => ({ name, line, price })),
    setHover: (id) => set({ hover: id }),
    goIndia, goState, skipTransition: () => { clearT(); set({ view: 'blog', phase: 0 }); },
    stopProgress: ((s.stop) / 4 * 100).toFixed(1) + '%',
  };
}

export async function boot(c) {
  const map = await loadMap();
  c.setState({ map });
}

// Long-form story per stop. Block types: h [title, kicker], p [text], side [text, photo], sideL [text, photo],
// duo [photoA, photoB], trio [a, b, c], wide [photo], quote [text], tip [text].
export const STORIES = {
  mumbai: {
    story: [
      ["h", "Landing into the monsoon", "Day 1"],
      ["p", "We landed into a sky the colour of wet slate. Four of us, one shared umbrella that broke before we left the airport, and a plan that mostly consisted of eating. By the time the cab reached Marine Drive the first proper downpour had begun and the promenade emptied in about forty seconds, except for the chai sellers, who simply moved their stoves under the nearest awning and kept pouring."],
      ["side", "We dumped the bags at a guesthouse in Colaba and walked straight back out. Leopold Cafe was loud and full of steam. The Gateway of India was half hidden behind spray from the harbour wall, and every few minutes a wave would clear the railing and soak whoever was taking a selfie. Nobody minded. That is the thing about Mumbai in July: everyone is already wet, so nobody is in a hurry to stay dry.", "Gateway in drizzle"],
      ["p", "Dinner was at a tiny Irani place near Kala Ghoda, bun maska and keema pav, then a long walk along the Queen's Necklace with the lights coming on in a curve all the way to Malabar Hill."],
      ["trio", "Marine Drive at dusk", "Bun maska, Kyani", "Queen's Necklace"],
      ["h", "The train, the doors, the vada pav", "Day 2"],
      ["p", "The next morning we rode the local from Churchgate with the doors open, the way everyone does, holding the overhead bar and leaning out just enough to feel the rain. The trick is to stand on the side away from the platform, otherwise you get swept off at Dadar by a wall of office workers."],
      ["quote", "Mumbai in July is loud, soaked and completely unbothered."],
      ["sideL", "Outside Dadar station we ate vada pav standing up, dripping chutney onto our shoes. Then Bandra for the afternoon: graffiti lanes in Ranwar, a long sit on the rocks at Bandstand watching the sea throw itself at the sea link, and far too much coffee.", "Vada pav stall, Dadar"],
      ["wide", "Open door, Western line"],
      ["tip", "Buy a first-class day pass on the local. It costs a little more, the carriages are calmer, and you can hop on and off all day."],
      ["p", "We ended at Juhu, where the beach was almost empty and the bhel puri stall was not. It was the right place to start."],
    ],
    see: [["Marine Drive", "The sea-front curve, best at dusk when the lights come on", "Free, 1-2 hrs"], ["Gateway of India", "Go early before the crowds, or in the rain for drama", "Free, 30 min"], ["Bandra lanes", "Ranwar and Chapel Road murals, small cafes", "Half day"], ["Kala Ghoda", "Galleries, bookshops and the old fort district", "Half day"]],
    eat: [["Vada pav", "Outside any station. Dadar is the classic.", "Rs 25"], ["Bun maska and chai", "An Irani cafe breakfast that takes an hour on purpose.", "Rs 80"], ["Bombay sandwich", "Grilled, layered, green chutney everywhere.", "Rs 120"]],
  },
  lonavala: {
    story: [
      ["h", "Up the ghats into the cloud", "Day 3"],
      ["p", "Somewhere past Khopoli the expressway climbs into the cloud and stays there. One minute you can see the trucks ahead, the next you are driving through milk. Lonavala in the monsoon is less a town than a weather system. Every ridge is streaming, every hairpin has a waterfall, and every waterfall has a family standing under it in their clothes."],
      ["side", "We checked into a hillside homestay run by an uncle who refused to let us leave without a second breakfast. Poha, then pakoras, then chai, then advice. The advice was mostly about which waterfalls were safe and which ones were for showing off. We nodded and then went to the showing-off ones anyway.", "Homestay porch, morning"],
      ["duo", "Bhushi Dam steps", "Ghat waterfall"],
      ["p", "Bhushi Dam is basically a giant staircase with a river running down it. You sit on the steps and the water pours over your legs. It is cold, slippery, absolutely packed and one of the most joyful places I have ever been. Someone's speaker was playing old Bollywood songs and half the dam was singing along."],
      ["h", "Tiger's Leap and the ten-second view", "Day 4"],
      ["p", "We walked out to Tiger's Leap at seven and saw absolutely nothing for twenty minutes. Just white. Then the fog tore open for maybe ten seconds and the whole valley was there, impossibly green, a river at the bottom, before it closed again. We stood there for another half hour hoping it would happen twice. It did not."],
      ["quote", "The fog tore open for ten seconds and the whole valley was there."],
      ["sideL", "The afternoon was Karla Caves, two thousand years old, cut straight into the cliff. The big chaitya hall has a wooden ceiling that is somehow still there, and the inside is so quiet after the noise of the road that we all started whispering without meaning to.", "Karla Caves hall"],
      ["trio", "Corn on the coals", "Chikki counter", "Rajmachi trail"],
      ["p", "On the way back we stopped for bhutta roasted on coals with lime and chilli rubbed on it, and bought far too much chikki. Maganlal is the famous one. Every shop claims to be the original."],
      ["wide", "Tiger's Leap in fog"],
      ["tip", "Go to the viewpoints at sunrise on a weekday. By ten the road to Tiger's Leap is a parking lot."],
    ],
    see: [["Tiger's Leap", "A sheer cliff viewpoint, best when the fog breaks", "Free, 1 hr"], ["Bhushi Dam", "Sit on the overflowing steps. Wear shoes you can lose.", "Free, 2 hrs"], ["Karla Caves", "Buddhist rock-cut halls from the 2nd century BC", "Rs 25, 1-2 hrs"], ["Rajmachi Fort", "A muddy, gorgeous monsoon trek to an old fort", "Full day"]],
    eat: [["Bhutta", "Corn on coals with lime and chilli salt.", "Rs 40"], ["Chikki", "Peanut and jaggery brittle. Try the chocolate one once.", "Rs 150/box"], ["Pakoras and chai", "At any roadside shack when it starts raining. It will.", "Rs 60"]],
  },
  pune: {
    story: [
      ["h", "Old city, slow morning", "Day 5"],
      ["p", "Pune felt like exhaling. After two days of waterfalls we wanted something with a roof. We spent the first morning around Shaniwar Wada and the old peths, where the lanes are narrow enough that the rain only reaches you in stripes, and every second doorway has a carved wooden frame older than our grandparents."],
      ["side", "Shaniwar Wada is mostly walls and gates now. The palace inside burned down in 1828, but the Delhi Gate with its elephant spikes is still there, and the gardens are a good place to sit and listen to a guide tell the ghost story with great enthusiasm.", "Shaniwar Wada gate"],
      ["trio", "Tulshibaug market", "Peth doorway", "Dagdusheth temple"],
      ["p", "Tulshibaug market sells everything: brass lamps, plastic buckets, wedding garlands, a very small and very angry parrot. We bought a set of steel tumblers we did not need and carried them for the rest of the trip."],
      ["quote", "The lanes are narrow enough that the rain only reaches you in stripes."],
      ["h", "Misal, coffee, Sinhagad", "Day 6"],
      ["sideL", "The real reason to come, though, is breakfast. Misal pav with a fiery tarri, eaten at a steel table while the cook argues cricket with the regulars. We went back twice. The second time he gave us extra farsan without asking, which we took as acceptance.", "Misal pav"],
      ["p", "In the afternoon we drove up to Sinhagad fort. The road is all switchbacks and the top was in cloud, but the stalls at the summit sell kanda bhaji and thick curd in clay pots, and that is reason enough. The evening was Koregaon Park, very serious coffee and a long argument about whether Pune or Mumbai has the better food. Pune won, narrowly."],
      ["wide", "Sinhagad ridge"],
      ["tip", "Do the peths on foot with a local walking tour. They know which courtyards you are allowed to step into."],
    ],
    see: [["Shaniwar Wada", "The Peshwa fort walls and the famous Delhi Gate", "Rs 25, 1 hr"], ["Old peths", "Wooden wadas, temples and markets in the old city", "Half day"], ["Sinhagad Fort", "A short drive and climb to a misty hilltop fort", "Half day"], ["Aga Khan Palace", "Gardens and the Gandhi memorial", "Rs 25, 1 hr"]],
    eat: [["Misal pav", "Spicy sprout curry with a bread roll. Ask for extra tarri.", "Rs 90"], ["Kanda bhaji", "Onion fritters at the top of Sinhagad, with curd.", "Rs 50"], ["Mastani", "A milkshake so thick it needs a spoon.", "Rs 120"]],
  },
  mahabaleshwar: {
    story: [
      ["h", "The plateau in the off season", "Day 7"],
      ["p", "Monsoon is off-season up here, which means half the viewpoints are hidden in cloud and none of the crowds turn up. The drive in through Wai and Pasarni ghat is the kind of road where you stop every ten minutes because the view is ridiculous, then stop again because the view is gone and there is a waterfall instead."],
      ["side", "We stayed in an old colonial bungalow with a fireplace, a dog called Biscuit and a caretaker who made hot chocolate at nine every night whether you asked or not. It rained for fourteen hours straight. Nobody complained.", "Bungalow fireplace"],
      ["duo", "Mist over the plateau", "Venna Lake boats"],
      ["p", "We had Arthur's Seat to ourselves, a cold wind coming up off the Savitri valley and the sound of water everywhere. Venna Lake had exactly one boat out, rowed by a very determined couple in raincoats. We hired the second one and got lost in fog about thirty metres from the jetty."],
      ["quote", "We had Arthur's Seat to ourselves and the sound of water everywhere."],
      ["h", "Jam, cream and the Pratapgad road", "Day 8"],
      ["sideL", "Strawberry season is long gone by July, but the farm sheds still sell jam and thick strawberry cream, and we were not about to say no. Mapro garden was open and bright pink. We bought jars for every relative and ate one of them in the car.", "Farm-shed jam jars"],
      ["p", "The drive down to Pratapgad the next morning was the most beautiful road of the whole trip. The fort itself sits on a ridge with clouds moving through the walls, and there are about five hundred steps, each one wet. At the top a man sold us roasted peanuts in paper cones and told us the whole Shivaji and Afzal Khan story with sound effects."],
      ["trio", "Pratapgad steps", "Wilson Point", "Strawberry cream"],
      ["wide", "Arthur's Seat"],
      ["tip", "Carry a proper rain jacket, not an umbrella. The wind on the viewpoints turns umbrellas inside out in seconds."],
    ],
    see: [["Arthur's Seat", "The big cliff viewpoint over the Savitri valley", "Free, 1 hr"], ["Pratapgad Fort", "Shivaji's ridge fort, 500 wet steps to the top", "Half day"], ["Venna Lake", "Rowing boats and horse rides on the shore", "Rs 300, 1 hr"], ["Lingmala Falls", "A long drop off the plateau, roaring in July", "1-2 hrs"]],
    eat: [["Strawberry cream", "Fresh cream and fruit, even out of season somehow.", "Rs 150"], ["Corn pattice", "Fried and crisp, from the market lane.", "Rs 60"], ["Hot chocolate", "Ask your homestay. They will make it.", "Free"]],
  },
  alibaug: {
    story: [
      ["h", "Down to the Konkan coast", "Day 9"],
      ["p", "After a week in the hills the sea felt enormous. The road down from the plateau drops through Mahad and then flattens into rice fields so green they look fake, with egrets standing in every single one like they were placed there by a set designer."],
      ["side", "We stayed in a cottage near Kihim with a coconut grove for a garden and a hammock that four grown men are not supposed to sit in at once. We found that out. The owner's mother cooked lunch every day and refused to tell us what was in the sol kadhi.", "Coconut grove stay"],
      ["p", "In the afternoon we walked out to Kolaba Fort at low tide, ankle-deep across the sand bar, timing the walk back so the sea did not cut us off. Inside there is a temple, a freshwater well and a lot of crabs who did not want visitors."],
      ["trio", "Kolaba Fort, low tide", "Fish thali", "Varsoli beach"],
      ["quote", "The rain held off long enough for an actual sunset."],
      ["h", "Last light and the ferry home", "Day 10"],
      ["sideL", "The fish thali at a little place on the main road ruined every other fish thali for us. Surmai fry, prawn curry, rice bhakri and the pink sol kadhi again. We ordered a second round and then lay in the hammock for two hours, carefully this time.", "Fish thali"],
      ["p", "On the last evening the rain held off long enough for an actual sunset at Kihim, the first one of the whole trip. The next morning we took the ferry from Mandwa back across the harbour to the Gateway, the city we had started in, slightly drier this time and about three kilos heavier each."],
      ["wide", "Kihim sunset"],
      ["tip", "Take the Mandwa ferry instead of the road from Mumbai. It is an hour on the water instead of three in traffic."],
    ],
    see: [["Kolaba Fort", "Walk out across the sand at low tide only", "Rs 25, 2 hrs"], ["Kihim beach", "Quiet, wide and lined with coconut groves", "Free"], ["Varsoli beach", "Close to town, good for an evening walk", "Free"], ["Mandwa ferry", "The fun way to and from Mumbai", "Rs 250, 1 hr"]],
    eat: [["Fish thali", "Surmai fry, prawn curry, sol kadhi. Get two.", "Rs 350"], ["Sol kadhi", "Pink kokum and coconut drink. Cooling and addictive.", "Rs 40"], ["Tender coconut", "From the grove, opened with one swing.", "Rs 50"]],
  },
};
