/*!
 * Let's Get It Jumping Party Builder
 * A self-contained web component: <lgij-party-builder>.
 * Art, styles, sounds, and logic all live inside its shadow root, so the host page cannot restyle it.
 * Built by 757Comply. Do not edit the built file by hand; change the source and rebuild.
 */
import CSS from './party-builder.css';

const TAG = 'lgij-party-builder';
const VERSION = __LGIJ_VERSION__;

const NS = 'http://www.w3.org/2000/svg';
const C = { gold: '#F5B32E', red: '#E8343A', blue: '#1F6FD1', pink: '#E83E8C', green: '#6BBF3B', purple: '#8E5CC9', ink: '#1E2A4A', white: '#FFFFFF', yellow: '#FFD84D' };
const PALETTES = {
  rainbow: ['#E8343A', '#F5B32E', '#1F6FD1', '#E83E8C', '#6BBF3B', '#8E5CC9'],
  unicorn: ['#F7A8CF', '#C9B6F2', '#9FD3F5', '#E83E8C', '#8E5CC9', '#FFC8E3'],
  sunshine: ['#F5B32E', '#FFD84D', '#E8343A', '#F28C28', '#E83E8C', '#FFB347'],
  ocean: ['#1F6FD1', '#4FB0F0', '#6BBF3B', '#17A2B8', '#0E4C92', '#7FD1E3'],
  berry: ['#E83E8C', '#8E5CC9', '#E8343A', '#F7A8CF', '#B4236A', '#5B3A9E']
};
const STEP_COLORS = [C.red, C.gold, C.blue, C.pink, C.green];

const DEFAULTS = {
  apiBase: '/api/party',
  phone: '[GHL BUSINESS NUMBER]',
  ageRange: 'Up to age 7',
  units: [
    { slug: 'toddler-slide', name: 'Toddler Bounce House with Slide', short: 'Slide house', hourlyRate: 50 },
    { slug: 'rainbow', name: 'Rainbow Bounce House', short: 'Rainbow', hourlyRate: 50 },
    { slug: 'unicorn', name: 'Unicorn Bounce House', short: 'Unicorn', hourlyRate: 35, ribbon: 'Our smaller bouncer' },
    { slug: 'toddler-slide-play', name: 'Toddler Bounce House with Slide & Play Area', short: 'Slide & play', hourlyRate: 50 }
  ],
  minimumHours: 2,
  maximumHours: 8,
  earliestStart: '09:00',
  latestEnd: '20:00',
  defaultStart: '11:00',
  minimumNoticeDays: 2,
  monthsAhead: 11,
  bookingFee: 50,
  bookingFeeCredited: null,
  balanceDueText: null,
  taxRate: null,
  holdMinutes: 30,
  serviceArea: null,
  links: { policies: '/policies', privacy: '/privacy-sms-terms' }
};

/* ---------------- small helpers ---------------- */
const money = n => {
  const v = Math.round(n * 100) / 100;
  return '$' + (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => !!(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoMonth = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const parseISODate = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const hm = s => { const [h, m] = String(s).split(':').map(Number); return h + (m || 0) / 60; };
const hhmm = h => `${pad(Math.floor(h))}:${pad(Math.round((h - Math.floor(h)) * 60))}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmtTime = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); const ap = hh >= 12 ? 'PM' : 'AM'; const h12 = ((hh + 11) % 12) + 1; return `${h12}:${pad(mm)} ${ap}`; };
const fmtDate = d => `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const lum = hex => { const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const textOn = hex => (lum(hex) > .42 ? C.ink : '#FFFFFF');
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const ph = s => `<span class="placeholder">${esc(s)}</span>`;
const digitsOnly = s => String(s || '').replace(/\D/g, '');

function ensureFonts() {
  try {
    if (document.querySelector('link[href*="fonts.googleapis.com"][href*="Fredoka"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap';
    document.head.appendChild(l);
  } catch (e) { /* fonts fall back to rounded system faces */ }
}

/* ---------------- sound: every effect is synthesized, nothing loads ---------------- */
function makeSound(isOn) {
  let ctx = null;
  const ensure = () => {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const env = (g, t, peak, dur) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
  const noise = (c, dur) => { const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; };
  const go = fn => () => { if (!isOn()) return; const c = ensure(); if (c) fn(c, c.currentTime); };
  return {
    prime() { if (isOn()) ensure(); },
    boing: go((c, t) => { const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(540, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.4); l.frequency.value = 17; lg.gain.value = 28; l.connect(lg); lg.connect(o.frequency); env(g, t, 0.2, 0.45); o.connect(g).connect(c.destination); o.start(t); l.start(t); o.stop(t + 0.5); l.stop(t + 0.5); }),
    whoosh: (dur = 0.8) => go((c, t) => { const n = noise(c, dur), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(250, t); f.frequency.exponentialRampToValueAtTime(2600, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(f).connect(g).connect(c.destination); n.start(t); n.stop(t + dur); })(),
    thud: go((c, t) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18); env(g, t, 0.3, 0.2); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.22); }),
    boop: (up = true) => go((c, t) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(up ? 620 : 900, t); o.frequency.exponentialRampToValueAtTime(up ? 980 : 520, t + 0.12); env(g, t, 0.14, 0.16); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.18); })(),
    tick: go((c, t) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 1300; env(g, t, 0.05, 0.04); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.05); }),
    pfft: go((c, t) => { const n = noise(c, 0.35), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.35); env(g, t, 0.12, 0.35); n.connect(f).connect(g).connect(c.destination); n.start(t); n.stop(t + 0.35); }),
    chime: go((c, t0) => { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((fr, i) => { const o = c.createOscillator(), g = c.createGain(), t = t0 + i * 0.09; o.type = 'sine'; o.frequency.value = fr; env(g, t, 0.13, 0.5); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.55); }); })
  };
}

/* ---------------- page-level overlay for confetti and toasts (immune to host transforms) ---------------- */
let overlay = null;
function getOverlay() {
  if (overlay && overlay.host.isConnected) return overlay;
  const host = document.createElement('div');
  host.setAttribute('data-lgij-overlay', '');
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{all:initial}
    canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
    .toast{position:fixed;left:50%;top:var(--t,14px);letter-spacing:normal;word-spacing:normal;text-transform:none;font-style:normal;margin:0;box-sizing:border-box;transform:translate(-50%,calc(-100% - 60px));visibility:hidden;background:#1E2A4A;color:#fff;border-radius:999px;padding:10px 18px;font:800 14.5px/1.35 'Nunito',ui-rounded,system-ui,sans-serif;max-width:calc(100% - 32px);text-align:center;transition:transform .45s cubic-bezier(.34,1.7,.55,1);box-shadow:0 10px 24px -10px rgba(30,42,74,.6)}
    .toast.show{transform:translate(-50%,0);visibility:visible}
    @media (prefers-reduced-motion: reduce){.toast{transition:none}}
  </style><canvas aria-hidden="true"></canvas><div class="toast" role="status"></div>`;
  document.body.appendChild(host);
  overlay = { host, canvas: root.querySelector('canvas'), toast: root.querySelector('.toast'), timer: 0 };
  return overlay;
}

/* ---------------- original art ---------------- */
const SKIN = ['#8D5524', '#F1C27D', '#C68642', '#5C3A1E'];
const HAIR = ['#2B1B12', '#6B3F1F', '#3B2A1A', '#1A120C'];
const SHIRT = [C.pink, C.blue, C.green, C.gold, C.purple, C.red];
let jumperSeed = 0;
const jumper = (x, y, s = 1, delay = 0) => {
  const i = jumperSeed++; const sk = SKIN[i % 4], hr = HAIR[(i + 1) % 4], sh = SHIRT[i % 6];
  return `<g transform="translate(${x},${y}) scale(${s})"><g class="jumper" style="--d:${delay}s">
    <path d="M-5 -6 L-7 0 M5 -6 L7 0" stroke="${C.ink}" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="-8.5" y="-23" width="17" height="19" rx="7" fill="${sh}"/>
    <path d="M-8 -19 L-15 -31 M8 -19 L15 -31" stroke="${sk}" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="0" cy="-31" r="9" fill="${sk}"/>
    <path d="M-9 -32 Q-9 -42 0 -42 Q9 -42 9 -32 Q6 -37 0 -37 Q-6 -37 -9 -32 Z" fill="${hr}"/>
    <circle cx="-3.2" cy="-31" r="1.2" fill="${C.ink}"/><circle cx="3.2" cy="-31" r="1.2" fill="${C.ink}"/>
    <path d="M-3.5 -27.5 Q0 -24.5 3.5 -27.5" stroke="${C.ink}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </g></g>`;
};
const net = (x, y, w, h, fill, line) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}"/>`;
  for (let gx = x + 12; gx < x + w - 4; gx += 12) s += `<line x1="${gx}" y1="${y + 3}" x2="${gx}" y2="${y + h - 3}" stroke="${line}" stroke-width="1.2"/>`;
  for (let gy = y + 12; gy < y + h - 4; gy += 12) s += `<line x1="${x + 3}" y1="${gy}" x2="${x + w - 3}" y2="${gy}" stroke="${line}" stroke-width="1.2"/>`;
  return s;
};
const turret = (x, y0, h, body, cap, band) => `<rect x="${x}" y="${y0}" width="22" height="${h}" rx="11" fill="${body}"/>
  <rect x="${x}" y="${y0 + h * 0.35}" width="22" height="9" fill="${band}"/><rect x="${x}" y="${y0 + h * 0.65}" width="22" height="9" fill="${band}"/>
  <path d="M${x - 3} ${y0 + 3} Q${x + 11} ${y0 - 30} ${x + 25} ${y0 + 3} Z" fill="${cap}"/>
  <line x1="${x + 11}" y1="${y0 - 22}" x2="${x + 11}" y2="${y0 - 36}" stroke="${C.ink}" stroke-width="2"/><path d="M${x + 11} ${y0 - 36} l12 4 l-12 4 z" fill="${C.pink}"/>`;

const ART = {
  'toddler-slide': { w: 200, h: 175, jumpers: [[-46, -26], [-12, -26]],
    draw: () => `<rect x="-92" y="-26" width="132" height="26" rx="13" fill="${C.green}"/>
      <rect x="-84" y="-114" width="118" height="92" rx="12" fill="${C.blue}"/>
      ${net(-70, -100, 90, 54, '#DDEBFF', '#9DBFEA')}
      <rect x="-88" y="-124" width="126" height="18" rx="9" fill="${C.red}"/>
      ${turret(-98, -140, 140, C.red, C.gold, C.yellow)}${turret(28, -140, 140, C.red, C.gold, C.yellow)}
      <path d="M48 -88 L62 -88 Q102 -46 102 0 L74 0 Q72 -42 48 -64 Z" fill="${C.gold}"/>
      <path d="M58 -82 Q92 -44 90 -2" stroke="${C.white}" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>
      <rect x="-60" y="-30" width="64" height="9" rx="4.5" fill="${C.pink}"/>` },
  rainbow: { w: 200, h: 175, jumpers: [[-30, -26], [8, -26], [40, -26]],
    draw: () => {
      let arcs = ''; const cols = [C.red, C.gold, C.yellow, C.green, C.blue, C.purple];
      cols.forEach((c, i) => { const r = 88 - i * 10; arcs += `<path d="M${-r} -22 V-86 A${r} ${r * 0.62} 0 0 1 ${r} -86 V-22" stroke="${c}" stroke-width="10.5" fill="none" stroke-linecap="round"/>`; });
      return `<path d="M-80 -24 V-88 A80 50 0 0 1 80 -88 V-24 Z" fill="#E9F5FF"/>
        ${net(-64, -96, 128, 66, '#E9F5FF', '#B9D7F2')}
        ${arcs}
        <rect x="-98" y="-26" width="196" height="26" rx="13" fill="${C.blue}"/>
        <rect x="-104" y="-104" width="20" height="104" rx="10" fill="${C.gold}"/><rect x="84" y="-104" width="20" height="104" rx="10" fill="${C.gold}"/>
        <circle cx="-94" cy="-108" r="9" fill="${C.pink}"/><circle cx="94" cy="-108" r="9" fill="${C.pink}"/>`;
    } },
  unicorn: { w: 170, h: 175, jumpers: [[-22, -24], [14, -24]],
    draw: () => `<rect x="-78" y="-24" width="156" height="24" rx="12" fill="${C.pink}"/>
      <rect x="-66" y="-104" width="132" height="84" rx="12" fill="${C.white}" stroke="#F2C6DD" stroke-width="3"/>
      ${net(-52, -92, 104, 50, '#FFF3FA', '#F3C9DF')}
      <rect x="-66" y="-108" width="132" height="14" rx="7" fill="#C9B6F2"/>
      <rect x="-82" y="-118" width="20" height="118" rx="10" fill="#C9B6F2"/><rect x="62" y="-118" width="20" height="118" rx="10" fill="#C9B6F2"/>
      <circle cx="-72" cy="-120" r="10" fill="${C.pink}"/><circle cx="72" cy="-120" r="10" fill="${C.pink}"/>
      <g transform="translate(0,-120)">
        <circle cx="-22" cy="-6" r="8" fill="#F7A8CF"/><circle cx="-26" cy="8" r="8" fill="#C9B6F2"/><circle cx="-20" cy="-20" r="7" fill="#9FD3F5"/>
        <ellipse cx="0" cy="0" rx="24" ry="21" fill="${C.white}" stroke="#F2C6DD" stroke-width="2.5"/>
        <ellipse cx="13" cy="9" rx="13" ry="9" fill="#FFE6F2"/>
        <path d="M-6 -19 L2 -50 L9 -18 Z" fill="${C.gold}"/><path d="M-2 -28 L6 -30 M0 -37 L5 -39" stroke="${C.white}" stroke-width="1.6"/>
        <path d="M-12 -16 L-8 -30 L-2 -17 Z" fill="${C.white}" stroke="#F2C6DD" stroke-width="2"/>
        <path d="M-3 -2 Q1 2 5 -2" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="-6" cy="6" r="3.5" fill="#F7A8CF"/>
      </g>` },
  'toddler-slide-play': { w: 236, h: 175, jumpers: [[-78, -26], [-48, -26], [80, -26]],
    draw: () => {
      const balls = [[60, -40, C.red], [72, -44, C.blue], [86, -40, C.gold], [98, -43, C.green], [66, -50, C.purple], [92, -51, C.pink]];
      return `<rect x="-116" y="-26" width="110" height="26" rx="13" fill="${C.blue}"/>
        <rect x="-108" y="-112" width="96" height="90" rx="12" fill="${C.red}"/>
        ${net(-96, -100, 72, 52, '#FFE5E6', '#F2A9AD')}
        <rect x="-112" y="-122" width="104" height="17" rx="8.5" fill="${C.blue}"/>
        ${turret(-122, -138, 138, C.blue, C.gold, C.green)}${turret(-20, -138, 138, C.blue, C.gold, C.green)}
        <path d="M2 -84 L16 -84 Q46 -44 48 0 L22 0 Q20 -40 2 -60 Z" fill="${C.green}"/>
        <path d="M12 -78 Q38 -42 36 -2" stroke="${C.white}" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>
        ${balls.map(b => `<circle cx="${b[0]}" cy="${b[1]}" r="7" fill="${b[2]}"/>`).join('')}
        <rect x="52" y="-42" width="62" height="42" rx="12" fill="${C.gold}"/>
        <rect x="52" y="-42" width="62" height="10" rx="5" fill="${C.red}"/>
        <line x1="108" y1="-42" x2="108" y2="-96" stroke="${C.ink}" stroke-width="3"/>
        <rect x="94" y="-110" width="24" height="16" rx="3" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/>
        <ellipse cx="100" cy="-92" rx="8" ry="3" fill="none" stroke="${C.red}" stroke-width="2.5"/>`;
    } }
};
const artFor = slug => ART[slug] || ART['toddler-slide'];
const unitViewBox = a => `${-a.w / 2 - 14} ${-a.h - 6} ${a.w + 28} ${a.h + 12}`;

/* Pretend availability for demo mode only */
const DEMO_TAKEN = { 'toddler-slide': [5, 20], rainbow: [19, 26], unicorn: [9, 24], 'toddler-slide-play': [22] };

/* ---------------- config ---------------- */
function readConfig(host) {
  let cfg = JSON.parse(JSON.stringify(DEFAULTS));
  const node = host.querySelector('script[type="application/json"][data-lgij-config]');
  if (node) {
    try {
      const user = JSON.parse(node.textContent || '{}');
      for (const k of Object.keys(user)) {
        if (k === 'links' && user.links && typeof user.links === 'object') cfg.links = Object.assign({}, cfg.links, user.links);
        else if (user[k] !== undefined) cfg[k] = user[k];
      }
    } catch (e) { console.warn(`[${TAG}] config JSON could not be read, using defaults`, e); }
  }
  if (host.hasAttribute('api-base')) cfg.apiBase = host.getAttribute('api-base');
  if (host.hasAttribute('phone')) cfg.phone = host.getAttribute('phone');
  cfg.units = (cfg.units || []).filter(u => u && u.slug && u.name && Number(u.hourlyRate) > 0).map(u => Object.assign({ short: u.name }, u, { hourlyRate: Number(u.hourlyRate) }));
  if (!cfg.units.length) cfg.units = JSON.parse(JSON.stringify(DEFAULTS.units));
  return cfg;
}

/* ---------------- the app ---------------- */
function createApp(host, root, cfg) {
  const demo = host.hasAttribute('demo');
  const showControls = host.hasAttribute('controls');
  const $ = s => root.querySelector(s);
  const $$ = s => Array.from(root.querySelectorAll(s));
  const UNIT = Object.fromEntries(cfg.units.map(u => [u.slug, u]));
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };
  const envState = { sound: false, calm: false, palette: 'rainbow' };
  const calm = () => mq.matches || envState.calm;
  const Sound = makeSound(() => envState.sound);
  const cleanups = [];
  let destroyed = false;

  const START = hm(cfg.earliestStart), END = hm(cfg.latestEnd), MINH = cfg.minimumHours, MAXH = cfg.maximumHours;
  const LAST_START = END - MINH;
  const SLOTS_N = Math.round((LAST_START - START) * 2);
  const today = sod(new Date());
  const minDate = addDays(today, cfg.minimumNoticeDays);
  const pal = () => PALETTES[envState.palette] || PALETTES.rainbow;

  const state = {
    step: 1, units: [], date: null, startIdx: Math.max(0, Math.min(SLOTS_N, Math.round((hm(cfg.defaultStart) - START) * 2))), len: MINH,
    details: {}, pay: 'all', held: null, org: false, orgFromArea: false, orgDone: false, orgError: '', detailsOk: false,
    month: new Date(today.getFullYear(), today.getMonth(), 1), busy: false, followup: false, netError: ''
  };
  const startHour = () => START + state.startIdx * 0.5;
  const maxLenFor = h => Math.max(MINH, Math.min(MAXH, Math.floor(END - h)));
  const rental = () => state.units.reduce((s, slug) => s + UNIT[slug].hourlyRate * state.len, 0);
  const taxOf = r => (typeof cfg.taxRate === 'number' ? Math.round(r * cfg.taxRate * 100) / 100 : null);
  const feeOnTop = cfg.bookingFeeCredited === false;
  const feeKnown = cfg.bookingFeeCredited === true || cfg.bookingFeeCredited === false;
  const balanceText = () => (cfg.balanceDueText ? esc(cfg.balanceDueText) : ph('[BALANCE DUE TIMING]'));
  const feeLine = () => (cfg.bookingFeeCredited === true ? 'counts toward your total' : cfg.bookingFeeCredited === false ? 'added to your total' : ph('[BOOKING FEE CREDITED]'));

  /* ---------- availability ---------- */
  const avail = new Map();
  const availKey = (units, month) => `${[...units].sort().join(',')}|${month}`;
  async function fetchMonth(units, monthDate) {
    const month = isoMonth(monthDate), key = availKey(units, month);
    if (avail.has(key)) return avail.get(key);
    const p = (async () => {
      if (demo) {
        await wait(120);
        const open = new Set(); const daysIn = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        for (let n = 1; n <= daysIn; n++) {
          const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), n);
          if (d < minDate || n === 12 || n === 13) continue;
          if (units.some(s => (DEMO_TAKEN[s] || []).includes(n))) continue;
          open.add(isoDate(d));
        }
        return { ok: true, open, earliest: isoDate(minDate) };
      }
      const url = `${cfg.apiBase}/availability?units=${encodeURIComponent([...units].sort().join(','))}&month=${month}`;
      const r = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (!r.ok) throw new Error('availability ' + r.status);
      const j = await r.json();
      return { ok: true, open: new Set(Array.isArray(j.open) ? j.open : []), earliest: j.earliest || isoDate(minDate) };
    })().catch(err => { console.warn(`[${TAG}]`, err); avail.delete(key); return { ok: false }; });
    avail.set(key, p);
    const res = await p;
    if (res.ok) avail.set(key, res); else avail.delete(key);
    return res;
  }
  function monthData(monthDate) { const v = avail.get(availKey(state.units, isoMonth(monthDate))); return v && !(v instanceof Promise) ? v : null; }
  function dayStatus(d) {
    if (d < minDate) return 'soon';
    const m = monthData(d); if (!m) return 'loading';
    if (isoDate(d) < m.earliest) return 'soon';
    return m.open.has(isoDate(d)) ? 'open' : 'taken';
  }
  function invalidateAvailability() { avail.clear(); }

  /* ---------- api ---------- */
  async function postJSON(path, body) {
    const r = await fetch(`${cfg.apiBase}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (e) { /* not JSON */ }
    if (!j) throw new Error(`${path} ${r.status}`);
    return j;
  }
  async function apiBooking(payload) {
    if (demo) { await wait(900); return { ok: true, payUrl: '#demo', holdExpiresAt: new Date(Date.now() + cfg.holdMinutes * 60000).toISOString() }; }
    return postJSON('booking', payload);
  }
  async function apiRequest(payload) {
    if (demo) { await wait(700); return { ok: true }; }
    return postJSON('request', payload);
  }

  /* ---------- shell ---------- */
  root.innerHTML = `<style>${CSS}</style>
  <div class="lgij" part="root">
    ${showControls ? `<header class="topbar">
      <div class="brand"><div class="brand-name">Party Builder<small>${demo ? 'Demo mode · nothing is booked or sent' : "Let's Get It Jumping"}</small></div></div>
      <div class="ctrls">
        <button type="button" class="ctrl squish" data-ctl="sound" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path class="waves" d="M17 9l4 6M21 9l-4 6"/></svg><span>Sound off</span></button>
        <button type="button" class="ctrl squish" data-ctl="calm" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M5 7h9M5 17h11"/></svg><span>Calm mode</span></button>
        ${demo ? `<button type="button" class="ctrl demo squish" data-ctl="demo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg><span>Play the demo</span></button>` : ''}
      </div></header>` : ''}
    <div class="builder stick" data-el="builder">
      <div class="stage-wrap">
        <div class="stage">
          <svg data-el="scene" viewBox="0 0 800 480" role="img" aria-label="Your backyard party: chosen bouncers inflate here, the sun shows your party time, and the lemonade stand shows your total"></svg>
          <div class="stage-hint" data-el="hint">Tap a bouncer to set up your yard</div>
        </div>
        <p class="stage-caption">Tap the bouncers in the yard to make the jumpers flip.</p>
      </div>
      <section class="panel" data-el="panel" aria-labelledby="stepTitle">
        <nav class="flags" data-el="flags" aria-label="Booking steps"></nav>
        <div data-el="body"></div>
        <div class="actions" data-el="actions">
          <div class="mini"><small>Your party</small><strong data-el="mini">$0</strong></div>
          <button type="button" class="btn squish" data-el="back">Back</button>
          <button type="button" class="btn go squish" data-el="next">Next</button>
        </div>
      </section>
    </div>
    <p class="sr-only" aria-live="polite" data-el="live"></p>
  </div>`;
  const E = name => root.querySelector(`[data-el="${name}"]`);
  const wrap = root.querySelector('.lgij');
  const scene = E('scene');

  const live = msg => { const l = E('live'); l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 30); };
  const toast = msg => {
    const o = getOverlay();
    let top = 14;
    try { const v = parseFloat(getComputedStyle(host).getPropertyValue('--lgij-sticky-top')); if (!isNaN(v)) top = v + 4; } catch (e) { /* default */ }
    o.toast.style.setProperty('--t', `calc(env(safe-area-inset-top, 0px) + ${top}px)`);
    o.toast.textContent = msg; o.toast.classList.add('show'); clearTimeout(o.timer); o.timer = setTimeout(() => o.toast.classList.remove('show'), 2800);
  };

  /* ---------- motion helpers ---------- */
  const springVals = (from, to, k = 170, damp = 11) => { const out = []; let x = from, v = 0; const dt = 1 / 60; for (let i = 0; i < 260; i++) { const a = -k * (x - to) - damp * v; v += a * dt; x += v * dt; out.push(x); if (i > 12 && Math.abs(x - to) < 0.002 && Math.abs(v) < 0.02) break; } out.push(to); return out; };
  const springTo = (el, fn, from, to, k, damp) => {
    if (calm() || !el.animate) { el.style.transform = fn(to); return Promise.resolve(); }
    const vals = springVals(from, to, k, damp);
    const a = el.animate(vals.map(v => ({ transform: fn(v) })), { duration: vals.length * 1000 / 60, easing: 'linear', fill: 'forwards' });
    return a.finished.then(() => { el.style.transform = fn(to); a.cancel(); }).catch(() => {});
  };

  /* ---------- scene ---------- */
  const SKY = [[9, '#8ACFF7', '#E3F5FF'], [12, '#4FB0F0', '#CDEEFF'], [15.5, '#5FB4EE', '#FFF0C7'], [18, '#F3A35C', '#FFD9A6'], [20, '#E06C8E', '#FFC18C']];
  const skyAt = h => {
    if (h <= SKY[0][0]) return [SKY[0][1], SKY[0][2]];
    for (let i = 0; i < SKY.length - 1; i++) { const [h0, a0, b0] = SKY[i], [h1, a1, b1] = SKY[i + 1]; if (h <= h1) { const t = (h - h0) / (h1 - h0); return [mix(a0, a1, t), mix(b0, b1, t)]; } }
    return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
  };
  const sunPos = h => { const t = (h - 8) / 12; return [70 + t * 660, 262 - Math.sin(Math.PI * t) * 200]; };
  const uid = 'lgij' + Math.random().toString(36).slice(2, 8);

  function buildScene() {
    const pickets = []; for (let x = -6; x < 806; x += 26) pickets.push(`<path d="M${x} 362 V306 L${x + 9} 295 L${x + 18} 306 V362 Z"/>`);
    const stripes = []; for (let i = 0; i < 9; i++) stripes.push(`<path d="M${-60 + i * 110} 480 L${i * 110 - 10} 352 L${i * 110 + 45} 352 L${-5 + i * 110} 480 Z"/>`);
    const bunt = []; for (let i = 0; i < 17; i++) { const t = (i + .5) / 17, x = t * 800, y = 18 + 4 * 34 * t * (1 - t); bunt.push(`<path data-flag="${i}" d="M${x - 15} ${y - 1} L${x + 15} ${y - 1} L${x} ${y + 26} Z"/>`); }
    const bulbs = []; for (let i = 1; i < 16; i++) { const t = i / 16, x = 128 + t * 492, y = 196 + 70 * 4 * t * (1 - t) * 0.5 + t * 8; bulbs.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="#FFE9A3"/>`); }
    const cloud = (x, y, s, dur, delay) => `<g class="cloud" style="animation-duration:${dur}s;animation-delay:${delay}s"><g transform="translate(${x},${y}) scale(${s})" fill="#fff" opacity=".95"><circle cx="0" cy="0" r="20"/><circle cx="22" cy="-10" r="26"/><circle cx="50" cy="0" r="20"/><rect x="-6" y="0" width="62" height="18" rx="9"/></g></g>`;
    scene.innerHTML = `
      <defs>
        <linearGradient id="${uid}sky" x1="0" y1="0" x2="0" y2="1"><stop class="sky-stop" data-el="sky1" offset="0" stop-color="#8ACFF7"/><stop class="sky-stop" data-el="sky2" offset="1" stop-color="#E3F5FF"/></linearGradient>
        <radialGradient id="${uid}glow"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient>
        <linearGradient id="${uid}grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86D04F"/><stop offset="1" stop-color="#58A833"/></linearGradient>
        <filter id="${uid}bulb" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="800" height="480" fill="url(#${uid}sky)"/>
      <path data-el="arc" d="" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" opacity=".85"/>
      <g class="sun" data-el="sun"><circle r="64" fill="url(#${uid}glow)"/><g class="sun-rays" stroke="#FFD23F" stroke-width="5" stroke-linecap="round">${Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return `<line x1="${(Math.cos(a) * 38).toFixed(1)}" y1="${(Math.sin(a) * 38).toFixed(1)}" x2="${(Math.cos(a) * 50).toFixed(1)}" y2="${(Math.sin(a) * 50).toFixed(1)}"/>`; }).join('')}</g><circle r="30" fill="#FFD84D"/><circle cx="-10" cy="-4" r="2.6" fill="${C.ink}"/><circle cx="10" cy="-4" r="2.6" fill="${C.ink}"/><path d="M-9 6 Q0 14 9 6" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="-17" cy="5" r="4" fill="#FFB0A0" opacity=".7"/><circle cx="17" cy="5" r="4" fill="#FFB0A0" opacity=".7"/></g>
      ${cloud(120, 84, 1.1, 80, -20)}${cloud(520, 140, .8, 110, -70)}${cloud(360, 60, .7, 140, -110)}
      <g class="bunting"><path d="M0 18 Q400 86 800 18" stroke="${C.ink}" stroke-width="2" fill="none" opacity=".55"/><g data-el="bunt">${bunt.join('')}</g></g>
      <g fill="#5BA83D"><circle cx="300" cy="300" r="34"/><circle cx="340" cy="290" r="40"/><circle cx="388" cy="302" r="30"/><circle cx="470" cy="298" r="36"/><circle cx="512" cy="306" r="28"/></g>
      <g><rect x="664" y="206" width="16" height="110" fill="#7A5232"/><circle cx="672" cy="190" r="56" fill="#4C9535"/><circle cx="630" cy="216" r="38" fill="#58A33C"/><circle cx="716" cy="214" r="40" fill="#58A33C"/><circle cx="676" cy="152" r="34" fill="#63B046"/></g>
      <g>
        <path d="M-10 168 L150 168 L172 198 L-10 198 Z" fill="#7C8EA8"/>
        <rect x="-10" y="198" width="168" height="10" fill="#A9D8E0"/>
        <rect x="-10" y="208" width="160" height="100" fill="#FFF6E4"/>
        ${[222, 238, 254, 270, 286].map(y => `<line x1="-10" y1="${y}" x2="150" y2="${y}" stroke="#EADBC0" stroke-width="2"/>`).join('')}
        <rect x="30" y="228" width="44" height="48" rx="3" fill="#BFE3F2" stroke="#fff" stroke-width="4"/><rect x="16" y="226" width="12" height="52" rx="2" fill="${C.blue}"/><rect x="76" y="226" width="12" height="52" rx="2" fill="${C.blue}"/>
        <rect x="116" y="206" width="10" height="104" fill="#fff"/><rect x="146" y="206" width="10" height="104" fill="#fff"/>
        <rect x="104" y="294" width="62" height="16" fill="#C9B79A"/>
      </g>
      <g class="bulbs" data-el="bulbs"><path d="M128 196 Q374 266 620 204" stroke="${C.ink}" stroke-width="1.5" fill="none" opacity=".5"/><g filter="url(#${uid}bulb)" data-el="bulbglow">${bulbs.join('')}</g><g>${bulbs.join('')}</g></g>
      <g fill="#E5DCCB"><rect x="0" y="314" width="800" height="8" rx="3"/><rect x="0" y="342" width="800" height="8" rx="3"/></g>
      <g fill="#FFFFFF" stroke="#E2D8C6" stroke-width="1.5">${pickets.join('')}</g>
      <rect y="352" width="800" height="128" fill="url(#${uid}grass)"/>
      <g fill="#fff" opacity=".07">${stripes.join('')}</g>
      <g class="ghost" data-el="ghost">
        <rect x="236" y="306" width="250" height="138" rx="26" fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="4" stroke-dasharray="12 10"/>
        <text x="361" y="372" text-anchor="middle" font-size="22" fill="#fff">Your bouncer</text><text x="361" y="400" text-anchor="middle" font-size="22" fill="#fff">goes here</text>
        <path class="ghost-arrow" d="M361 410 l-12 -12 h8 v-14 h8 v14 h8 z" fill="#fff" transform="translate(0,14)"/>
      </g>
      <g data-el="yard"></g>
      <g transform="translate(718,452)">
        <ellipse cx="0" cy="2" rx="80" ry="8" fill="rgba(30,42,74,.18)"/>
        <rect x="-64" y="-150" width="7" height="92" fill="#9A6232"/><rect x="57" y="-150" width="7" height="92" fill="#9A6232"/>
        <path d="M-74 -152 H74 V-134 ${Array.from({ length: 6 }, (_, i) => `Q${74 - i * 24.66 - 12.33} -122 ${74 - (i + 1) * 24.66} -134`).join(' ')} Z" fill="${C.pink}"/>
        ${Array.from({ length: 3 }, (_, i) => `<rect x="${-74 + 24.66 + i * 49.32}" y="-152" width="24.66" height="18" fill="#fff"/>`).join('')}
        <rect x="-72" y="-66" width="144" height="66" rx="6" fill="#C98A4B"/>
        ${[-44, -22].map(y => `<line x1="-72" y1="${y}" x2="72" y2="${y}" stroke="#9A6232" stroke-width="2"/>`).join('')}
        <rect x="-76" y="-72" width="152" height="10" rx="4" fill="#9A6232"/>
        <g transform="translate(-50,-72)"><path d="M0 0 h18 l-3 -26 h-12 z" fill="#FFE57A" stroke="#fff" stroke-width="2"/><rect x="2" y="-30" width="14" height="5" rx="2" fill="#fff"/></g>
        <g transform="translate(38,-72)"><path d="M0 0 h12 l-2 -14 h-8 z" fill="#FFE57A" stroke="#fff" stroke-width="1.5"/><path d="M14 0 h12 l-2 -14 h-8 z" fill="#FFE57A" stroke="#fff" stroke-width="1.5"/></g>
        <g data-el="sign"><rect x="-56" y="-128" width="112" height="56" rx="6" fill="#2F4A3A" stroke="#C98A4B" stroke-width="5"/>
          <text class="hand-text" data-el="signTop" x="0" y="-108" text-anchor="middle" font-size="17" fill="#F6F3E8">Your party</text>
          <text class="board-text" data-el="signTotal" x="0" y="-80" text-anchor="middle" font-size="26" fill="#FFE9A3">$0</text></g>
        <g class="date-balloon" data-el="dateBalloon" opacity="0"><path d="M-60 -150 Q-74 -180 -96 -196" stroke="${C.ink}" stroke-width="1.5" fill="none"/><g transform="translate(-100,-226)"><ellipse data-el="balBody" rx="26" ry="31" fill="${C.pink}"/><path data-el="balKnot" d="M-3 30 l3 6 l3 -6 z" fill="${C.pink}"/><ellipse cx="-9" cy="-12" rx="6" ry="10" fill="#fff" opacity=".35"/><text class="board-text" data-el="balDow" y="-4" text-anchor="middle" font-size="10" fill="#fff">SAT</text><text class="board-text" data-el="balDate" y="11" text-anchor="middle" font-size="12" fill="#fff">OCT 24</text></g></g>
      </g>`;
    paintPalette();
  }
  function paintPalette() {
    const p = pal();
    root.querySelectorAll('[data-el="bunt"] path').forEach((el, i) => el.setAttribute('fill', p[i % 5]));
  }

  function updateSky() {
    const h = startHour(), [a, b] = skyAt(h);
    E('sky1').style.stopColor = a; E('sky2').style.stopColor = b;
    const [x, y] = sunPos(h); E('sun').style.transform = `translate(${x}px, ${y}px)`;
    if (state.step >= 3 && !state.org) {
      const end = h + state.len; let d = '';
      for (let i = 0; i <= 24; i++) { const hh = h + (end - h) * i / 24; const [px, py] = sunPos(hh); d += (i ? ' L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1); }
      E('arc').setAttribute('d', d);
    } else E('arc').setAttribute('d', '');
    const e = Math.max(0, Math.min(1, (h - 15) / 4));
    root.querySelectorAll('[data-el="bulbs"] circle').forEach(c => { c.style.opacity = (0.3 + 0.7 * e).toFixed(2); });
    E('bulbglow').style.opacity = e.toFixed(2);
    const tc = root.querySelector('.timecard'); if (tc) { tc.style.setProperty('--sky1', a); tc.style.setProperty('--sky2', b); }
  }

  const SPOTS = { 1: [[340, 1.12]], 2: [[200, .92], [450, .92]], 3: [[130, .74], [312, .74], [494, .74]], 4: [[96, .58], [240, .58], [384, .58], [532, .58]] };
  function spotsFor(n) {
    if (SPOTS[n]) return SPOTS[n];
    const s = Math.max(.32, .58 * 4 / n), out = []; for (let i = 0; i < n; i++) out.push([60 + (i + .5) * (540 / n), s]); return out;
  }
  function layoutYard() {
    const n = state.units.length; const spots = spotsFor(n);
    state.units.forEach((slug, i) => { const el = root.querySelector(`[data-el="yard"] [data-slug="${slug}"]`); if (!el) return; const [x, s] = spots[i]; el.style.transform = `translate(${x}px, 448px) scale(${s})`; });
    E('ghost').style.display = n ? 'none' : '';
    E('hint').style.opacity = n ? 0 : 1;
  }
  async function addBouncer(slug, opts = {}) {
    const u = UNIT[slug], a = artFor(slug);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'b-outer no-trans'); g.setAttribute('data-slug', slug); g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0');
    g.setAttribute('aria-label', `${u.name} in your yard. Press to bounce.`);
    const wig = `<g class="b-wiggles" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M${-a.w / 2 - 10} -100 q-8 10 0 20"/><path d="M${-a.w / 2 - 22} -90 q-8 10 0 20"/><path d="M${a.w / 2 + 10} -100 q8 10 0 20"/><path d="M${a.w / 2 + 22} -90 q8 10 0 20"/></g>`;
    g.innerHTML = `<ellipse class="b-shadow" cx="0" cy="3" rx="${a.w / 2}" ry="10"/><g class="b-drop"><g class="b-inflate">${a.draw()}</g><g class="b-jumpers">${a.jumpers.map((p, i) => jumper(p[0], p[1], 0.92, i * 0.23)).join('')}</g>${wig}</g>`;
    E('yard').appendChild(g);
    layoutYard(); g.getBoundingClientRect(); requestAnimationFrame(() => g.classList.remove('no-trans'));
    g.addEventListener('click', () => bounceTap(g));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bounceTap(g); } });
    const drop = g.querySelector('.b-drop'), inf = g.querySelector('.b-inflate'), jumps = g.querySelector('.b-jumpers'), shadow = g.querySelector('.b-shadow');
    if (calm() || opts.instant || !drop.animate) { jumps.classList.add('on'); inf.classList.add('breathe'); return; }
    inf.style.transform = 'scale(1.3, .16)';
    shadow.animate([{ transform: 'scale(.25)', opacity: .2 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520, easing: 'ease-in' });
    const fall = drop.animate([{ transform: 'translateY(-470px)' }, { transform: 'translateY(0)' }], { duration: 540, easing: 'cubic-bezier(.55,0,1,.45)' });
    try { await fall.finished; } catch (e) { /* cancelled */ }
    if (!g.isConnected) return;
    Sound.thud();
    await wait(120);
    Sound.whoosh(0.75);
    await springTo(inf, v => `scale(${(1.3 - 0.3 * v).toFixed(3)}, ${(0.16 + 0.84 * v).toFixed(3)})`, 0, 1, 115, 8.5);
    if (!g.isConnected) return;
    Sound.boing();
    const w = g.querySelector('.b-wiggles'); w.classList.remove('flash'); void w.getBBox(); w.classList.add('flash');
    jumps.classList.add('on'); inf.classList.add('breathe');
  }
  function removeBouncer(slug) {
    const g = root.querySelector(`[data-el="yard"] [data-slug="${slug}"]`); if (!g) return;
    g.removeAttribute('data-slug');
    if (calm() || !g.animate) { g.remove(); layoutYard(); return; }
    Sound.pfft();
    g.querySelector('.b-jumpers').classList.remove('on');
    const inf = g.querySelector('.b-inflate'); inf.classList.remove('breathe');
    const a = inf.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.08,.9)', offset: .25 }, { transform: 'scale(1.35,.08)', opacity: .6 }], { duration: 480, easing: 'ease-in', fill: 'forwards' });
    g.querySelector('.b-shadow').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, fill: 'forwards' });
    a.finished.then(() => g.remove()).catch(() => g.remove());
    layoutYard();
  }
  function bounceTap(g) {
    if (!g.isConnected) return;
    Sound.boing();
    if (calm()) return;
    const inf = g.querySelector('.b-inflate');
    inf.classList.remove('breathe');
    springTo(inf, v => `scale(${(1 + 0.14 * (1 - v)).toFixed(3)}, ${(1 - 0.16 * (1 - v)).toFixed(3)})`, 0, 1, 260, 7).then(() => inf.classList.add('breathe'));
    const js = Array.from(g.querySelectorAll('.jumper')); const j = js[Math.floor(Math.random() * js.length)];
    if (j) { j.classList.remove('flip'); void j.getBBox(); j.classList.add('flip'); j.addEventListener('animationend', () => j.classList.remove('flip'), { once: true }); }
  }

  let lastSign = '';
  function setSign(top, total) {
    const t = E('signTotal'), tp = E('signTop');
    if (tp.textContent !== top) tp.textContent = top;
    if (total === lastSign) return; lastSign = total;
    const board = E('sign');
    if (calm() || !board.animate) { t.textContent = total; return; }
    board.style.transformBox = 'fill-box'; board.style.transformOrigin = '50% 50%';
    const a = board.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.05)' }], { duration: 140, easing: 'ease-in' });
    a.finished.then(() => { t.textContent = total; board.animate([{ transform: 'scaleY(.05)' }, { transform: 'scaleY(1.08)' }, { transform: 'scaleY(1)' }], { duration: 300, easing: 'ease-out' }); }).catch(() => { t.textContent = total; });
  }
  function showDateBalloon() {
    const b = E('dateBalloon');
    if (!state.date) { b.setAttribute('opacity', 0); b.classList.remove('bob'); return; }
    E('balDow').textContent = DAYS[state.date.getDay()].slice(0, 3).toUpperCase();
    E('balDate').textContent = `${MONTHS[state.date.getMonth()].slice(0, 3).toUpperCase()} ${state.date.getDate()}`;
    const was = b.getAttribute('opacity') === '1';
    b.setAttribute('opacity', 1);
    if (!was && !calm() && b.animate) { const a = b.animate([{ transform: 'translateY(120px) scale(.3)', opacity: 0 }, { transform: 'translateY(-10px) scale(1.05)', opacity: 1, offset: .7 }, { transform: 'translateY(0) scale(1)' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.3,1)' }); a.finished.then(() => b.classList.add('bob')).catch(() => {}); }
    else if (!calm()) b.classList.add('bob');
  }

  /* ---------- confetti ---------- */
  function confetti(originEl) {
    if (calm()) return;
    const o = getOverlay(), cv = o.canvas, cx = cv.getContext('2d'); if (!cx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = originEl.getBoundingClientRect(); const ox = r.left + r.width / 2, oy = Math.max(40, r.top + r.height * 0.3);
    const cols = pal();
    const P = Array.from({ length: 170 }, () => ({ x: ox, y: oy, vx: (Math.random() - .5) * 15, vy: -Math.random() * 15 - 4, s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)], round: Math.random() < .3 }));
    let f = 0;
    (function tick() {
      cx.clearRect(0, 0, innerWidth, innerHeight); f++;
      P.forEach(p => { p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; if (p.round) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 7); cx.fill(); } else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); });
      if (f < 190) requestAnimationFrame(tick); else cx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  /* ---------- panel rendering ---------- */
  const STEPS = [{ n: 1, label: 'Bouncer' }, { n: 2, label: 'Date' }, { n: 3, label: 'Time' }, { n: 4, label: 'Details' }, { n: 5, label: 'Pay' }];
  const hopTitle = t => { let i = 0; return t.split(' ').map(w => `<span class="word">${w.split('').map(ch => `<span class="hop" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' '); };
  const titleHTML = t => `<h2 id="stepTitle" tabindex="-1" aria-label="${esc(t)}"><span aria-hidden="true">${hopTitle(t)}</span></h2>`;
  const canReach = n => n === 1 || (n === 2 && state.units.length > 0) || (n === 3 && state.units.length > 0 && !!state.date) || (n === 4 && state.units.length > 0 && !!state.date) || (n === 5 && state.units.length > 0 && !!state.date && state.detailsOk);

  function renderFlags() {
    E('flags').innerHTML = STEPS.map((s, i) => `<button type="button" class="flag ${s.n < state.step ? 'done' : ''} ${s.n === state.step ? 'current' : ''}" style="--c:${STEP_COLORS[i]}" data-n="${s.n}" ${canReach(s.n) && !state.held ? '' : 'disabled'} ${s.n === state.step ? 'aria-current="step"' : ''}><span class="pennant" aria-hidden="true"></span><span>${s.label}</span></button>`).join('');
    E('flags').querySelectorAll('.flag').forEach(b => b.addEventListener('click', () => { const n = +b.dataset.n; if (n !== state.step) go(n); }));
  }
  function updateTotals() {
    const r = rental(); const txt = state.units.length ? money(r) : '$0';
    E('mini').innerHTML = state.units.length ? `${txt} <span>${typeof cfg.taxRate === 'number' ? '+ ' + money(taxOf(r)) + ' tax' : '+ tax'}</span>` : '$0';
    if (state.held) setSign('See you', `${MONTHS[state.held.dateObj.getMonth()].slice(0, 3)} ${state.held.dateObj.getDate()}!`);
    else setSign('Your party', txt);
  }

  function balloonSVG(n, status, sel, i) {
    const p = pal(); const col = p[i % p.length];
    if (status === 'taken') return `<svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 50 Q22 44 19 40" stroke="#B7AE9F" stroke-width="1.2" fill="none"/><path d="M8 26 Q6 16 14 14 Q18 8 25 13 Q33 15 31 25 Q32 33 24 37 Q19 41 14 36 Q7 33 8 26 Z" fill="#D8D1C5" transform="rotate(18 20 26)"/><text class="num" x="21" y="30" text-anchor="middle" font-size="12" fill="#6F685C">${n}</text></svg>`;
    if (status === 'soon' || status === 'loading') return `<svg viewBox="0 0 40 52" aria-hidden="true"><circle cx="20" cy="22" r="13" fill="none" stroke="#E2D8C6" stroke-width="1.6" stroke-dasharray="3 3"/><text class="num" x="20" y="27" text-anchor="middle" font-size="12" fill="#A39883">${n}</text></svg>`;
    const fill = sel ? C.gold : col, tc = sel ? C.ink : textOn(col);
    return `<svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 37 Q16 44 21 51" stroke="${C.ink}" stroke-width="1.2" fill="none" opacity=".55"/><ellipse cx="20" cy="20" rx="${sel ? 15.5 : 14}" ry="${sel ? 18 : 16.5}" fill="${fill}" ${sel ? `stroke="${C.ink}" stroke-width="2.4"` : ''}/><path d="M18 36 l2 3 l2 -3 z" fill="${fill}"/><ellipse cx="14" cy="13" rx="3.2" ry="5.5" fill="#fff" opacity=".4"/><text class="num" x="20" y="25" text-anchor="middle" font-size="13" fill="${tc}">${n}</text></svg>`;
  }

  function stepUnits() {
    return `<div class="step"><p class="eyebrow">Step 1 of 5</p>${titleHTML('Pick your bouncer')}
      <p class="sub">Tap one or a few. Every bouncer is made for kids ${esc(cfg.ageRange.toLowerCase())}, and it pops up in your yard as soon as you pick it.</p>
      <div class="units">${cfg.units.map(u => { const on = state.units.includes(u.slug); const a = artFor(u.slug); return `<button type="button" class="unit squish ${on ? 'on' : ''}" data-slug="${esc(u.slug)}" aria-pressed="${on}">
        ${u.ribbon ? `<span class="ribbon">${esc(u.ribbon)}</span>` : ''}
        <span class="unit-art"><svg viewBox="${unitViewBox(a)}" aria-hidden="true">${a.draw()}</svg></span>
        <span class="unit-name">${esc(u.name)}</span>
        <span class="unit-meta"><span class="rate">${money(u.hourlyRate)} an hour</span><span>${esc(cfg.ageRange)}</span></span>
        <svg class="check" viewBox="0 0 30 38" aria-hidden="true"><ellipse cx="15" cy="14" rx="12" ry="13.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/><path d="M13 27 l2 3 l2 -3 z" fill="${C.gold}"/><path d="M9 14 l4 4 l8 -8" stroke="${C.ink}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 30 q-3 4 1 8" stroke="${C.ink}" stroke-width="1.2" fill="none"/></svg>
      </button>`; }).join('')}</div>
      <button type="button" class="linkish" data-el="orgLink">Booking for a school, church, daycare, or company?</button></div>`;
  }

  function stepDate() {
    const m = state.month, first = new Date(m.getFullYear(), m.getMonth(), 1), daysIn = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const prevOk = m > new Date(today.getFullYear(), today.getMonth(), 1);
    const nextOk = m < new Date(today.getFullYear(), today.getMonth() + cfg.monthsAhead, 1);
    const data = monthData(m);
    let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="dow" aria-hidden="true">${d}</div>`).join('');
    for (let i = 0; i < first.getDay(); i++) cells += `<span class="day blank" aria-hidden="true"></span>`;
    for (let n = 1; n <= daysIn; n++) {
      const d = new Date(m.getFullYear(), m.getMonth(), n), st = dayStatus(d), sel = sameDay(d, state.date) && st === 'open';
      const label = `${fmtDate(d)}, ${st === 'open' ? (sel ? 'your party day' : 'open') : st === 'taken' ? 'already booked' : st === 'loading' ? 'checking' : 'too soon to book'}`;
      cells += `<button type="button" class="day ${st} ${sel ? 'sel' : ''}" data-n="${n}" aria-label="${label}" ${st === 'soon' || st === 'loading' ? 'disabled' : ''} ${sel ? 'aria-pressed="true"' : ''} style="--d:${-(n * 0.37 % 3).toFixed(2)}s">${balloonSVG(n, st, sel, n)}</button>`;
    }
    return `<div class="step"><p class="eyebrow">Step 2 of 5</p>${titleHTML('Pick your party day')}
      <p class="sub">Floating balloons are open. Droopy ones are already out at another party.</p>
      <div class="checking">${state.units.map(s => `<span class="pill">${esc(UNIT[s].short)}</span>`).join('')}</div>
      <div class="cal-head"><button type="button" class="round squish" data-el="prevM" aria-label="Previous month" ${prevOk ? '' : 'disabled'}>&lsaquo;</button><strong>${MONTHS[m.getMonth()]} ${m.getFullYear()}</strong><button type="button" class="round squish" data-el="nextM" aria-label="Next month" ${nextOk ? '' : 'disabled'}>&rsaquo;</button></div>
      <div class="cal-grid" role="group" aria-label="${MONTHS[m.getMonth()]} ${m.getFullYear()}" aria-busy="${data ? 'false' : 'true'}">${cells}</div>
      <div class="legend"><span><i style="background:${pal()[0]}"></i>Open</span><span><i class="t"></i>Already booked</span><span>Dashed: too soon to book</span></div>
      <p class="cal-note" data-el="calNote" role="status">${state.availError ? `We couldn't check dates just now. Try again in a moment, or text us at ${esc(cfg.phone)}.` : ''}</p></div>`;
  }

  function stepTime() {
    const h = startHour(), maxLen = maxLenFor(h);
    return `<div class="step"><p class="eyebrow">Step 3 of 5</p>${titleHTML('Slide the sun to set your party time')}
      <p class="sub">Every party is at least ${MINH} hours and wraps up by ${fmtTime(END).replace(':00', '')}. We deliver and set up before, and pick up after.</p>
      <div class="timecard"><div class="time-big"><small>${fmtDate(state.date)}</small><span data-el="tRange">${fmtTime(h)} to ${fmtTime(h + state.len)}</span></div>
        <label class="range-label" for="startRange">Party starts</label>
        <input class="sun-range" type="range" id="startRange" data-el="range" min="0" max="${SLOTS_N}" step="1" value="${state.startIdx}" aria-valuetext="${fmtTime(h)}">
        <div class="range-ends" aria-hidden="true"><span>${fmtTime(START).replace(':00', '')}</span><span>Noon</span><span>3 PM</span><span>${fmtTime(LAST_START).replace(':00', '')}</span></div>
        <div class="len" role="group" aria-label="Party length"><button type="button" class="round squish" data-el="lenMinus" aria-label="One hour shorter" ${state.len <= MINH ? 'disabled' : ''}>&minus;</button>
          <div class="len-val" aria-live="polite"><b data-el="lenNum">${state.len}</b> hours</div>
          <button type="button" class="round squish" data-el="lenPlus" aria-label="One hour longer" ${state.len >= maxLen ? 'disabled' : ''}>+</button></div>
        <p class="note" data-el="lenNote">${state.units.length > 1 ? 'All your bouncers stay the same hours.' : ''}</p></div></div>`;
  }

  const FIELDS = [
    { sec: 'Where is the party?' },
    { id: 'street', label: 'Street address', req: true, full: true, ac: 'street-address' },
    { id: 'city', label: 'City', req: true, ac: 'address-level2' },
    { id: 'zip', label: 'ZIP', req: true, ac: 'postal-code', mode: 'numeric' },
    { sec: 'About you (the grown-up)' },
    { id: 'firstName', label: 'First Name', req: true, ac: 'given-name' },
    { id: 'lastName', label: 'Last Name', req: true, ac: 'family-name' },
    { id: 'phone', label: 'Phone', req: true, type: 'tel', ac: 'tel' },
    { id: 'email', label: 'Email', req: true, type: 'email', ac: 'email' },
    { sec: 'About the party' },
    { id: 'eventType', label: 'Event Type', sel: ['Birthday Party', 'School Event', 'Church Event', 'Corporate Event', 'Community or HOA Event', 'Daycare Event', 'Other'] },
    { id: 'guestCount', label: 'Guest Count', type: 'number', mode: 'numeric' },
    { id: 'surfaceType', label: 'Surface Type', sel: ['Grass', 'Concrete or Asphalt', 'Indoor', 'Dirt or Sand', 'Not Sure'] },
    { id: 'powerOutlet', label: 'Power Outlet Near Setup Area', sel: ['Yes', 'No', 'Not Sure'] },
    { id: 'childName', label: "Child's Name" },
    { id: 'childBirthday', label: "Child's Birthday", type: 'date' },
    { id: 'heardAbout', label: 'How Did You Hear About Us', sel: ['Website', 'Facebook', 'Google', 'Referral', 'Other'], full: true }
  ];
  const balloonCheck = `<svg class="bal" viewBox="0 0 34 42" aria-hidden="true"><path d="M17 31 q-3 5 1 10" stroke="${C.ink}" stroke-width="1.2" fill="none"/><g class="b-body"><ellipse cx="17" cy="15" rx="13" ry="14.5"/><path d="M15 29 l2 3 l2 -3 z"/></g></svg>`;
  const smsText = `Yes, text me about my booking and occasional offers from Let's Get It Jumping. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. See our <a href="${esc(cfg.links.privacy)}" target="_blank" rel="noopener">Privacy &amp; SMS Terms</a>. <em>(optional)</em>`;
  const fieldHTML = (f, d, prefix) => {
    if (f.sec) return `<p class="fieldset-title">${f.sec}</p>`;
    const v = esc(d[f.id] || '');
    const id = `${prefix}_${f.id}`;
    const input = f.sel ? `<select id="${id}"><option value="">Choose one</option>${f.sel.map(o => `<option ${d[f.id] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
      : f.area ? `<textarea id="${id}">${v}</textarea>`
      : `<input id="${id}" type="${f.type || 'text'}" value="${v}" ${f.ac ? `autocomplete="${f.ac}"` : ''} ${f.mode ? `inputmode="${f.mode}"` : ''} ${f.req ? 'required aria-required="true"' : ''} aria-describedby="${id}_err">`;
    return `<div class="field ${f.full ? 'full' : ''}" data-f="${f.id}"><label for="${id}">${f.label} ${f.req ? '' : '<em>(optional)</em>'}</label>${input}<span class="err" id="${id}_err"></span></div>`;
  };

  function stepDetails() {
    const d = state.details;
    return `<div class="step"><p class="eyebrow">Step 4 of 5</p>${titleHTML('Tell us about the party')}
      <p class="sub">This part is for the grown-ups. The fields marked optional can be skipped.</p>
      <form class="form-grid" data-el="detailsForm" novalidate>${FIELDS.map(f => fieldHTML(f, d, 'f')).join('')}
        <div class="hp" aria-hidden="true"><label for="f_website_url">Website</label><input id="f_website_url" name="website_url" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="area-note" data-el="areaNote" hidden></div>
        <label class="bcheck" for="f_sms"><input type="checkbox" id="f_sms" ${d.smsConsent ? 'checked' : ''}>${balloonCheck}<span>${smsText}</span></label>
        <label class="bcheck" for="f_policies" data-el="polWrap"><input type="checkbox" id="f_policies" ${d.policiesAccepted ? 'checked' : ''}>${balloonCheck}<span>I have read the <a href="${esc(cfg.links.policies)}" target="_blank" rel="noopener">rental policies</a>.</span></label>
      </form></div>`;
  }

  function digitSpans(str) { return str.split('').map(ch => `<span class="digit">${esc(ch)}</span>`).join(''); }
  function totals() {
    const r = rental(), tax = taxOf(r), fee = cfg.bookingFee;
    const all = r + (tax || 0) + (feeOnTop ? fee : 0);
    const rest = r + (tax || 0) + (feeOnTop ? 0 : -fee);
    return { r, tax, fee, all, rest };
  }
  function stepReview() {
    const t = totals(), h = startHour();
    const lines = state.units.map(s => { const u = UNIT[s]; return `<div class="row"><span>${esc(u.name)}, ${state.len} hrs &times; ${money(u.hourlyRate)}</span><span>${money(u.hourlyRate * state.len)}</span></div>`; }).join('');
    const d = state.details;
    const grand = feeKnown || typeof cfg.taxRate === 'number' ? t.all : t.r;
    const totalLabel = typeof cfg.taxRate === 'number' && feeKnown ? 'Party total' : 'Rental total';
    const payAllAmt = typeof cfg.taxRate === 'number' ? money(t.all) : `${money(t.r + (feeOnTop ? t.fee : 0))} + tax`;
    const restLine = feeKnown && typeof cfg.taxRate === 'number' ? `${money(t.rest)} ${balanceText()}` : `The rest ${balanceText()}`;
    return `<div class="step"><p class="eyebrow">Step 5 of 5</p>${titleHTML('Your party, all set up')}
      <p class="sub">Check it over, pick how you want to pay, and we'll hold your date.</p>
      <div class="board" aria-label="Price board">
        <h3>${state.units.length > 1 ? 'Your bouncers' : 'Your bouncer'}</h3>${lines}
        <div class="row small"><span>Sales tax</span><span>${t.tax == null ? 'added at checkout' : money(t.tax)}</span></div>
        <div class="row small"><span>Booking fee ${money(t.fee)}</span><span>${feeLine()}</span></div>
        <div class="total"><span class="hand-text" style="font-size:24px">${totalLabel}</span><span class="amt" data-el="boardAmt">${digitSpans(money(grand))}</span></div>
      </div>
      <div class="summary"><span class="pill">${fmtDate(state.date)}</span><span class="pill">${fmtTime(h)} to ${fmtTime(h + state.len)}</span><span class="pill">${esc(d.street || '')}, ${esc(d.city || '')}</span>${d.childName ? `<span class="pill">For ${esc(d.childName)}</span>` : ''}</div>
      <fieldset class="paychoice"><legend>How would you like to pay?</legend>
        <label class="tag"><input type="radio" name="pay" value="all" ${state.pay === 'all' ? 'checked' : ''}><span class="card"><strong>Pay it all now</strong><span class="amt">${payAllAmt}</span><small>Done and dusted.${feeKnown ? '' : ' ' + ph('[BOOKING FEE CREDITED]')}</small></span></label>
        <label class="tag"><input type="radio" name="pay" value="fee" ${state.pay === 'fee' ? 'checked' : ''}><span class="card"><strong>Pay ${money(t.fee)} now</strong><span class="amt">Booking fee</span><small>${restLine}</small></span></label>
      </fieldset>
      <button type="button" class="cta" data-el="holdBtn">Hold My Date and Pay</button>
      <p class="fine">Your date is held for ${cfg.holdMinutes} minutes while you pay. We'll text and email your secure payment link.</p>
      <div data-el="holdMsg"></div></div>`;
  }

  function stepHeld() {
    const hd = state.held, dObj = hd.dateObj;
    const sleeps = Math.max(0, Math.round((sod(dObj) - today) / 864e5));
    const payIsReal = hd.payUrl && hd.payUrl !== '#demo';
    return `<div class="step held"><p class="eyebrow">You did it!</p>${titleHTML('Your date is held!')}
      <p class="sub">${fmtDate(dObj)}, ${fmtTime(hd.start)} to ${fmtTime(hd.start + hd.len)}.</p>
      <div class="count" data-el="countdown">--:--</div><p class="count-label" data-el="countLabel">left to finish paying</p>
      ${payIsReal ? `<a class="cta" style="margin-top:16px" href="${esc(hd.payUrl)}" target="_blank" rel="noopener" data-el="payNow">Pay Now</a>` : `<button type="button" class="cta" style="margin-top:16px" data-el="payNow">Pay Now</button><p class="demo-note" data-el="payNote" hidden>On the live site this opens the secure payment page. Nothing is charged in demo mode.</p>`}
      <div data-el="expired" hidden><div class="notice"><strong>Your hold ended, but your date may still be open.</strong>Pick it again and we'll hold it for you.</div><button type="button" class="cta" style="margin-top:12px" data-el="again">Book again</button></div>
      <ol class="next-list"><li>Pay with the link we just texted and emailed you.</li><li>Sign your rental agreement when it lands in your inbox.</li><li>Watch for reminders a week and two days before.</li><li>We deliver, set up, and pick up. You enjoy the party.</li></ol>
      <p class="sleeps">${sleeps} sleep${sleeps === 1 ? '' : 's'} until jump day!</p>
      <button type="button" class="linkish" data-el="startOver">Start over</button></div>`;
  }

  function stepFollowup() {
    return `<div class="step held"><p class="eyebrow">Almost there</p>${titleHTML('We saved your party!')}
      <div class="notice"><strong>Alecz will text you shortly to finish booking.</strong>Something hiccuped on our end while holding your date, but your details are safe with us. If you'd rather not wait, text us at ${esc(cfg.phone)}.</div>
      <button type="button" class="linkish" data-el="startOver">Start over</button></div>`;
  }

  const ORG_FIELDS = [
    { id: 'organizationName', label: 'Organization Name', req: true, full: true },
    { id: 'firstName', label: 'First Name', req: true, ac: 'given-name' },
    { id: 'lastName', label: 'Last Name', req: true, ac: 'family-name' },
    { id: 'phone', label: 'Phone', req: true, type: 'tel', ac: 'tel' },
    { id: 'email', label: 'Email', req: true, type: 'email', ac: 'email' },
    { id: 'eventType', label: 'Event Type', sel: ['Birthday Party', 'School Event', 'Church Event', 'Corporate Event', 'Community or HOA Event', 'Daycare Event', 'Other'] },
    { id: 'eventDate', label: 'Event Date', type: 'date', req: true },
    { id: 'eventStartTime', label: 'Event Start Time', type: 'time' },
    { id: 'eventEndTime', label: 'Event End Time', type: 'time' },
    { id: 'eventAddress', label: 'Event Address', full: true, ac: 'street-address' },
    { id: 'guestCount', label: 'Guest Count', type: 'number', mode: 'numeric' },
    { id: 'surfaceType', label: 'Surface Type', sel: ['Grass', 'Concrete or Asphalt', 'Indoor', 'Dirt or Sand', 'Not Sure'] },
    { id: 'powerOutlet', label: 'Power Outlet Near Setup Area', sel: ['Yes', 'No', 'Not Sure'] },
    { id: 'heardAbout', label: 'How Did You Hear About Us', sel: ['Website', 'Facebook', 'Google', 'Referral', 'Other'] },
    { id: 'notes', label: 'Anything we should know, like a purchase order, tax-exempt form, or insurance certificate your organization needs?', full: true, area: true }
  ];
  function stepOrg() {
    if (state.orgDone) return `<div class="step org"><p class="eyebrow">${state.orgFromArea ? 'Request sent' : 'Group request'}</p><h2 id="stepTitle" tabindex="-1">Thank you!</h2><div class="thanks">Alecz will reach out to ${state.orgFromArea ? 'see if we can make your party happen' : 'put together your quote'}.${state.orgFromArea ? '' : " If your organization needs a purchase order, tax-exempt form, or insurance certificate, she'll go over it with you."}</div><button type="button" class="linkish" data-el="orgBack">Back to family booking</button></div>`;
    const od = state.orgDraft || {};
    const fields = ORG_FIELDS.map(f => (f.id === 'organizationName' && state.orgFromArea ? Object.assign({}, f, { req: false }) : f));
    return `<div class="step org"><p class="eyebrow">${state.orgFromArea ? 'Outside our usual area' : 'Schools, churches, daycares, companies'}</p><h2 id="stepTitle" tabindex="-1">${state.orgFromArea ? "Let's talk about your party" : 'Request a group quote'}</h2>
      <p class="sub">${state.orgFromArea ? 'Send this over and Alecz will let you know if we can bring the fun to you.' : 'Tell us about your event and Alecz will put together a quote. No payment needed today.'}</p>
      <form class="form-grid" data-el="orgForm" novalidate>${fields.map(f => fieldHTML(f, od, 'o')).join('')}
        <div class="field full"><span class="label">Inflatables Requested <em>(optional)</em></span><div class="checks">${cfg.units.map(u => `<label><input type="checkbox" name="inflatables" value="${esc(u.slug)}" ${(od.inflatables || []).includes(u.slug) ? 'checked' : ''}>${esc(u.name)}</label>`).join('')}</div></div>
        <div class="hp" aria-hidden="true"><label for="o_website_url">Website</label><input id="o_website_url" name="website_url" type="text" tabindex="-1" autocomplete="off"></div>
        <label class="bcheck" for="o_sms"><input type="checkbox" id="o_sms" ${od.smsConsent ? 'checked' : ''}>${balloonCheck}<span>${smsText}</span></label>
        <div class="full" data-el="orgMsg" role="status"></div>
        <button type="submit" class="cta full" data-el="orgSubmit" style="grid-column:1/-1">${state.orgFromArea ? 'Send My Request' : 'Request My Quote'}</button></form>
      <button type="button" class="linkish" data-el="orgBack">Back to family booking</button></div>`;
  }

  /* ---------- render + wiring ---------- */
  let countdownT = 0;
  function render() {
    if (destroyed) return;
    const body = E('body');
    const flowStep = !state.held && !state.org && !state.followup;
    E('builder').classList.toggle('stick', flowStep && state.step <= 3);
    wrap.classList.toggle('calm', envState.calm);
    E('panel').classList.toggle('calm-panel', state.org);
    E('flags').hidden = !flowStep; E('actions').hidden = !flowStep;
    if (state.org) { body.innerHTML = stepOrg(); wireOrg(); updateSky(); updateTotals(); return; }
    if (state.followup) { body.innerHTML = stepFollowup(); E('startOver').addEventListener('click', resetAll); updateTotals(); return; }
    if (state.held) { body.innerHTML = stepHeld(); wireHeld(); updateSky(); updateTotals(); return; }
    renderFlags();
    body.innerHTML = [null, stepUnits, stepDate, stepTime, stepDetails, stepReview][state.step]();
    ({ 1: wireUnits, 2: wireDate, 3: wireTime, 4: wireDetails, 5: wireReview })[state.step]();
    E('back').disabled = state.step === 1;
    const nb = E('next'); nb.hidden = state.step === 5;
    nb.disabled = (state.step === 1 && !state.units.length) || (state.step === 2 && !state.date);
    nb.textContent = state.step === 4 ? 'Review my party' : 'Next';
    updateSky(); updateTotals();
  }

  function go(n) {
    if (state.step === 4) readDetails();
    if (n === 5 && state.step === 4 && !validateDetails()) return;
    if (n >= 4 && !state.date) n = 2;
    state.step = n; render();
    if (n === 2) ensureMonth();
    focusPanel();
  }
  function focusPanel() {
    const p = E('panel'), r = p.getBoundingClientRect();
    const swEl = root.querySelector('.stage-wrap'), sw = swEl.getBoundingClientRect();
    const stacked = Math.abs(sw.left - r.left) < 4;
    let limit = parseFloat(getComputedStyle(wrap).getPropertyValue('--sticky-top')) || 12;
    limit = Math.max(0, limit - 12);
    if (stacked && getComputedStyle(swEl).position === 'sticky') limit = Math.max(limit, sw.bottom);
    if (r.top < limit - 2 || r.top > innerHeight * 0.6) p.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
    const t = root.querySelector('#stepTitle');
    if (t) t.focus({ preventScroll: true });
  }

  async function ensureMonth() {
    const m = state.month, units = [...state.units];
    if (monthData(m)) return;
    const res = await fetchMonth(units, m);
    state.availError = !res.ok;
    if (state.step === 2 && !state.held && !state.org && isoMonth(state.month) === isoMonth(m) && units.join() === state.units.join()) {
      const focusN = root.activeElement && root.activeElement.dataset ? root.activeElement.dataset.n : null;
      render();
      if (focusN) { const b = root.querySelector(`.day[data-n="${focusN}"]`); if (b) b.focus({ preventScroll: true }); }
    }
  }
  async function recheckDate() {
    if (!state.date || !state.units.length) return;
    const d = state.date;
    const res = await fetchMonth([...state.units], new Date(d.getFullYear(), d.getMonth(), 1));
    if (!res.ok || !state.date || !sameDay(state.date, d)) return;
    if (dayStatus(d) !== 'open') {
      state.date = null; showDateBalloon();
      toast('That bouncer is busy on your date, so pick a new balloon.');
      if (state.step >= 3) go(2); else render();
    }
  }

  function toggleUnit(slug, opts = {}) {
    if (!UNIT[slug]) return;
    const i = state.units.indexOf(slug);
    if (i >= 0) { state.units.splice(i, 1); removeBouncer(slug); live(`${UNIT[slug].name} removed`); }
    else { state.units.push(slug); addBouncer(slug, opts); live(`${UNIT[slug].name} added to your yard`); }
    if (!state.units.length) { state.date = null; showDateBalloon(); }
    const maxLen = maxLenFor(startHour()); if (state.len > maxLen) state.len = maxLen;
    recheckDate();
  }
  function wireUnits() {
    root.querySelectorAll('.unit').forEach(b => b.addEventListener('click', () => {
      Sound.prime();
      toggleUnit(b.dataset.slug);
      const on = state.units.includes(b.dataset.slug); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      E('next').disabled = !state.units.length; renderFlags(); updateTotals();
    }));
    E('orgLink').addEventListener('click', () => openOrg(false));
  }
  function wireDate() {
    E('prevM').addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); Sound.tick(); render(); ensureMonth(); });
    E('nextM').addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); Sound.tick(); render(); ensureMonth(); });
    root.querySelectorAll('.day[data-n]').forEach(b => b.addEventListener('click', () => {
      const d = new Date(state.month.getFullYear(), state.month.getMonth(), +b.dataset.n);
      const st = dayStatus(d);
      if (st === 'taken') { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); Sound.pfft(); E('calNote').textContent = "That one's already out at a party. Try a floating balloon!"; return; }
      if (st !== 'open') return;
      state.date = d; Sound.boop(); showDateBalloon(); live(`${fmtDate(d)} picked`);
      render(); setTimeout(() => { if (state.step === 2) E('next').focus({ preventScroll: true }); }, 50);
    }));
  }
  function wireTime() {
    const r = E('range');
    const refresh = () => {
      const h = startHour(), maxLen = maxLenFor(h); let note = state.units.length > 1 ? 'All your bouncers stay the same hours.' : '';
      if (state.len > maxLen) { state.len = maxLen; note = `Parties wrap up by ${fmtTime(END).replace(':00', '')}, so we trimmed it to ${maxLen} hours.`; }
      E('tRange').textContent = `${fmtTime(h)} to ${fmtTime(h + state.len)}`;
      r.setAttribute('aria-valuetext', fmtTime(h));
      E('lenNum').textContent = state.len; E('lenMinus').disabled = state.len <= MINH; E('lenPlus').disabled = state.len >= maxLen;
      E('lenNote').textContent = note; updateSky(); updateTotals();
    };
    r.addEventListener('input', () => { state.startIdx = +r.value; Sound.tick(); refresh(); });
    const bump = d => { const maxLen = maxLenFor(startHour()); const nl = Math.max(MINH, Math.min(maxLen, state.len + d)); if (nl === state.len) return; state.len = nl; Sound.boop(d > 0); const b = E('lenNum'); b.classList.remove('hopnow'); void b.offsetWidth; b.classList.add('hopnow'); refresh(); };
    E('lenMinus').addEventListener('click', () => bump(-1)); E('lenPlus').addEventListener('click', () => bump(1));
    refresh();
  }
  function readDetails() {
    const form = E('detailsForm'); if (!form) return;
    FIELDS.forEach(f => { if (f.id) { const el = root.querySelector('#f_' + f.id); if (el) state.details[f.id] = el.value.trim(); } });
    state.details.smsConsent = root.querySelector('#f_sms').checked;
    state.details.policiesAccepted = root.querySelector('#f_policies').checked;
    state.details.website_url = root.querySelector('#f_website_url').value;
  }
  function wireDetails() {
    const f = E('detailsForm');
    f.addEventListener('input', () => { readDetails(); state.detailsOk = false; renderFlags(); });
    f.addEventListener('change', e => { readDetails(); if (e.target.type === 'checkbox' && e.target.checked) Sound.boop(); });
    f.addEventListener('submit', e => { e.preventDefault(); go(5); });
  }
  const inArea = d => {
    const list = Array.isArray(cfg.serviceArea) ? cfg.serviceArea.map(s => String(s).trim().toLowerCase()).filter(Boolean) : [];
    if (!list.length) return true;
    return list.includes(String(d.city || '').trim().toLowerCase()) || list.includes(String(d.zip || '').trim());
  };
  const MSG = { street: 'We need this to bring the fun to your door.', city: 'Which city is the party in?', zip: 'Five digits, please.', firstName: 'What should we call you?', lastName: 'And your last name?', phone: 'Ten digits so we can text your booking.', email: 'We send your receipt here.', organizationName: 'Which organization is this for?', eventDate: 'When is the event?' };
  const badField = (id, v) => (id === 'zip' ? !/^\d{5}$/.test(v) : id === 'phone' ? digitsOnly(v).replace(/^1(?=\d{10}$)/, '').length !== 10 : id === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : !v);
  function validateDetails() {
    readDetails(); let first = null; const d = state.details;
    FIELDS.filter(f => f.req).forEach(f => {
      const bad = badField(f.id, d[f.id] || '');
      const w = root.querySelector(`.field[data-f="${f.id}"]`); w.classList.remove('bad'); void w.offsetWidth;
      root.querySelector(`#f_${f.id}_err`).textContent = bad ? MSG[f.id] : '';
      root.querySelector('#f_' + f.id).setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) { w.classList.add('bad'); if (!first) first = root.querySelector('#f_' + f.id); }
    });
    const pw = E('polWrap'); pw.classList.remove('bad'); void pw.offsetWidth;
    if (!d.policiesAccepted) { pw.classList.add('bad'); if (!first) first = root.querySelector('#f_policies'); }
    if (first) { Sound.pfft(); first.focus(); toast('A few things still need filling in.'); state.detailsOk = false; return false; }
    if (!inArea(d)) {
      const n = E('areaNote'); n.hidden = false;
      n.innerHTML = `That might be outside our area, but let's talk!<br><button type="button" class="btn go squish" data-el="areaBtn">Send it as a request</button>`;
      E('areaBtn').addEventListener('click', () => openOrg(true));
      state.detailsOk = false; return false;
    }
    state.detailsOk = true; return true;
  }
  function bookingPayload() {
    const d = state.details, h = startHour();
    return {
      units: [...state.units], date: isoDate(state.date), startTime: hhmm(h), endTime: hhmm(h + state.len), hours: state.len,
      payment: state.pay,
      address: { street: d.street, city: d.city, zip: d.zip },
      contact: { firstName: d.firstName, lastName: d.lastName, phone: d.phone, email: d.email },
      party: { eventType: d.eventType || '', guestCount: d.guestCount || '', surfaceType: d.surfaceType || '', powerOutlet: d.powerOutlet || '', childName: d.childName || '', childBirthday: d.childBirthday || '', heardAbout: d.heardAbout || '' },
      whoIsThisFor: 'Individual or Family',
      smsConsent: !!d.smsConsent, policiesAccepted: !!d.policiesAccepted, website_url: d.website_url || '',
      quoted: { rental: rental(), bookingFee: cfg.bookingFee },
      source: 'party-builder', version: VERSION
    };
  }
  function wireReview() {
    root.querySelectorAll('input[name=pay]').forEach(i => i.addEventListener('change', () => { state.pay = i.value; Sound.boop(); }));
    if (!calm()) root.querySelectorAll('[data-el="boardAmt"] .digit').forEach((dg, i) => { dg.style.animationDelay = (i * 70) + 'ms'; dg.classList.add('flipnow'); });
    E('holdBtn').addEventListener('click', submitHold);
  }
  async function submitHold() {
    if (state.busy) return;
    state.busy = true;
    const b = E('holdBtn'); b.disabled = true; b.textContent = 'Holding your date...'; Sound.whoosh(0.9);
    const t0 = Date.now(); let res;
    try { res = await apiBooking(bookingPayload()); } catch (e) { console.warn(`[${TAG}]`, e); res = { ok: false, reason: 'network' }; }
    const left = 900 - (Date.now() - t0); if (left > 0 && !demo) await wait(left);
    state.busy = false;
    if (destroyed) return;
    if (res && res.ok && res.payUrl) {
      const h = startHour();
      state.held = { payUrl: res.payUrl, expiresAt: res.holdExpiresAt ? Date.parse(res.holdExpiresAt) : Date.now() + cfg.holdMinutes * 60000, date: isoDate(state.date), dateObj: state.date, start: h, len: state.len, units: [...state.units] };
      saveHold();
      render(); focusPanel(); celebrate();
      host.dispatchEvent(new CustomEvent('lgij:hold-placed', { bubbles: true, composed: true, detail: { date: state.held.date, units: state.held.units, payment: state.pay } }));
      return;
    }
    const reason = res && res.reason;
    if (reason === 'date_taken') {
      invalidateAvailability(); state.date = null; showDateBalloon();
      toast('Someone just grabbed that date. Pick another balloon!'); go(2); return;
    }
    if (reason === 'saved_for_followup') { state.followup = true; render(); focusPanel(); return; }
    b.disabled = false; b.textContent = 'Hold My Date and Pay';
    const msg = reason === 'already_holding' ? `You already have a date on hold. Check your texts and email for the payment link, or text us at ${esc(cfg.phone)}.`
      : reason === 'invalid' ? (res.message ? esc(res.message) : 'Something in your details needs another look. Go back a step and check them.')
      : `We couldn't reach our booking system. Please try again, or text us at ${esc(cfg.phone)}.`;
    E('holdMsg').innerHTML = `<div class="notice" role="alert">${msg}</div>`;
    Sound.pfft();
  }
  const HOLD_KEY = 'lgij-party-hold-v1';
  function saveHold() { try { sessionStorage.setItem(HOLD_KEY, JSON.stringify(Object.assign({}, state.held, { dateObj: undefined }))); } catch (e) { /* storage blocked */ } }
  function loadHold() {
    try {
      const raw = sessionStorage.getItem(HOLD_KEY); if (!raw) return null;
      const h = JSON.parse(raw); if (!h || !h.expiresAt || h.expiresAt < Date.now() - 6 * 3600e3) { sessionStorage.removeItem(HOLD_KEY); return null; }
      h.dateObj = parseISODate(h.date); return h;
    } catch (e) { return null; }
  }
  function clearHold() { try { sessionStorage.removeItem(HOLD_KEY); } catch (e) { /* storage blocked */ } }
  function wireHeld() {
    clearInterval(countdownT);
    const show = () => {
      const el = E('countdown'); if (!el) { clearInterval(countdownT); return; }
      const left = Math.max(0, Math.round((state.held.expiresAt - Date.now()) / 1000));
      el.textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
      if (!left) {
        clearInterval(countdownT);
        E('expired').hidden = false; E('payNow').hidden = true; E('countLabel').textContent = 'hold ended';
      }
    };
    show(); countdownT = setInterval(show, 1000);
    const pn = E('payNow');
    if (pn.tagName === 'BUTTON') pn.addEventListener('click', () => { const n = E('payNote'); if (n) n.hidden = false; Sound.boop(); });
    E('again').addEventListener('click', () => { const units = state.held.units; clearHold(); resetAll(); units.forEach(u => toggleUnit(u, { instant: true })); invalidateAvailability(); go(2); });
    E('startOver').addEventListener('click', () => { clearHold(); resetAll(); });
  }
  function celebrate() {
    Sound.chime(); confetti(root.querySelector('.stage')); live(`Your date is held for ${cfg.holdMinutes} minutes.`);
    root.querySelectorAll('[data-el="yard"] .b-outer').forEach((g, i) => setTimeout(() => bounceTap(g), 250 + i * 220));
  }
  function resetAll() {
    clearInterval(countdownT);
    [...state.units].forEach(s => removeBouncer(s));
    Object.assign(state, { step: 1, units: [], date: null, len: MINH, details: {}, pay: 'all', held: null, org: false, orgFromArea: false, orgDone: false, orgDraft: null, detailsOk: false, followup: false, busy: false, availError: false, month: new Date(today.getFullYear(), today.getMonth(), 1) });
    state.startIdx = Math.max(0, Math.min(SLOTS_N, Math.round((hm(cfg.defaultStart) - START) * 2)));
    showDateBalloon(); render();
  }

  function openOrg(fromArea) {
    if (state.step === 4) readDetails();
    const d = state.details;
    state.org = true; state.orgFromArea = fromArea; state.orgDone = false;
    state.orgDraft = fromArea ? { firstName: d.firstName, lastName: d.lastName, phone: d.phone, email: d.email, eventType: d.eventType, eventDate: state.date ? isoDate(state.date) : '', eventStartTime: hhmm(startHour()), eventEndTime: hhmm(startHour() + state.len), eventAddress: [d.street, d.city, d.zip].filter(Boolean).join(', '), guestCount: d.guestCount, surfaceType: d.surfaceType, powerOutlet: d.powerOutlet, heardAbout: d.heardAbout, inflatables: [...state.units], smsConsent: d.smsConsent } : (state.orgDraft || { inflatables: [...state.units] });
    render();
    focusPanel();
  }
  function wireOrg() {
    E('orgBack').addEventListener('click', () => { state.org = false; state.orgDone = false; render(); });
    const form = E('orgForm'); if (!form) return;
    const read = () => {
      const o = {}; ORG_FIELDS.forEach(f => { const el = root.querySelector('#o_' + f.id); if (el) o[f.id] = el.value.trim(); });
      o.inflatables = Array.from(form.querySelectorAll('input[name=inflatables]:checked')).map(i => i.value);
      o.smsConsent = root.querySelector('#o_sms').checked; o.website_url = root.querySelector('#o_website_url').value;
      state.orgDraft = o; return o;
    };
    form.addEventListener('input', read);
    form.addEventListener('submit', async e => {
      e.preventDefault(); const o = read(); let first = null;
      ORG_FIELDS.filter(f => f.req && !(f.id === 'organizationName' && state.orgFromArea)).forEach(f => {
        const bad = badField(f.id, o[f.id] || '');
        const w = form.querySelector(`.field[data-f="${f.id}"]`); w.classList.remove('bad'); void w.offsetWidth;
        root.querySelector(`#o_${f.id}_err`).textContent = bad ? (MSG[f.id] || 'Please fill this in.') : '';
        if (bad) { w.classList.add('bad'); if (!first) first = root.querySelector('#o_' + f.id); }
      });
      if (first) { first.focus(); toast('A few things still need filling in.'); return; }
      const btn = E('orgSubmit'); btn.disabled = true; btn.textContent = 'Sending...';
      let res; try { res = await apiRequest(Object.assign({}, o, { requestType: state.orgFromArea ? 'outside-area' : 'organization', whoIsThisFor: state.orgFromArea ? 'Individual or Family' : 'Organization', source: 'party-builder', version: VERSION })); } catch (err) { res = { ok: false }; }
      if (res && res.ok) { state.orgDone = true; Sound.chime(); render(); focusPanel(); return; }
      btn.disabled = false; btn.textContent = state.orgFromArea ? 'Send My Request' : 'Request My Quote';
      E('orgMsg').innerHTML = `<div class="notice" role="alert">We couldn't send that just now. Please try again, or text us at ${esc(cfg.phone)}.</div>`;
    });
  }

  E('next').addEventListener('click', () => go(state.step + 1));
  E('back').addEventListener('click', () => go(state.step - 1));

  /* ---------- environment: sound, calm, palette ---------- */
  function readEnv() {
    const h = document.documentElement;
    const attr = (name, docName) => (host.hasAttribute(name) ? host.getAttribute(name) : h.getAttribute(docName));
    const prevCalm = envState.calm, prevPal = envState.palette;
    envState.sound = attr('sound', 'data-lgij-sound') === 'on';
    envState.calm = attr('calm', 'data-lgij-calm') === 'on';
    envState.palette = attr('palette', 'data-lgij-palette') || 'rainbow';
    wrap.classList.toggle('calm', envState.calm);
    if (envState.calm && !prevCalm) root.querySelectorAll('[data-el="yard"] .b-inflate').forEach(i => { i.getAnimations && i.getAnimations().forEach(a => a.cancel()); i.style.transform = ''; });
    if (envState.palette !== prevPal) { paintPalette(); if (state.step === 2 && !state.held && !state.org) render(); }
    if (showControls) {
      const sb = root.querySelector('[data-ctl="sound"]'), cb = root.querySelector('[data-ctl="calm"]');
      if (sb) { sb.setAttribute('aria-pressed', envState.sound); sb.querySelector('span').textContent = envState.sound ? 'Sound on' : 'Sound off'; sb.querySelector('.waves').setAttribute('d', envState.sound ? 'M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12' : 'M17 9l4 6M21 9l-4 6'); }
      if (cb) cb.setAttribute('aria-pressed', envState.calm);
    }
  }
  const mo = new MutationObserver(readEnv);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lgij-sound', 'data-lgij-calm', 'data-lgij-palette'] });
  mo.observe(host, { attributes: true, attributeFilter: ['sound', 'calm', 'palette'] });
  cleanups.push(() => mo.disconnect());

  if (showControls) {
    root.querySelector('[data-ctl="sound"]').addEventListener('click', () => { host.setAttribute('sound', envState.sound ? 'off' : 'on'); setTimeout(() => { Sound.prime(); Sound.boing(); }, 0); });
    root.querySelector('[data-ctl="calm"]').addEventListener('click', () => { host.setAttribute('calm', envState.calm ? 'off' : 'on'); setTimeout(() => toast(envState.calm ? 'Calm mode: everything holds still.' : 'Full bounce mode is back on.'), 0); });
    const demoBtn = root.querySelector('[data-ctl="demo"]'); if (demoBtn) demoBtn.addEventListener('click', playDemo);
  }

  async function playDemo() {
    clearHold(); resetAll(); await wait(450);
    const w = ms => wait(calm() ? 0 : ms);
    root.querySelector('.stage').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
    toggleUnit('rainbow'); render(); await w(1500);
    toggleUnit('unicorn'); render(); await w(1500);
    await fetchMonth([...state.units], new Date(minDate.getFullYear(), minDate.getMonth(), 1));
    let d = minDate, guard = 0;
    while (guard++ < 120) {
      const mm = new Date(d.getFullYear(), d.getMonth(), 1); if (!monthData(mm)) await fetchMonth([...state.units], mm);
      if (d.getDay() === 6 && dayStatus(d) === 'open') break; d = addDays(d, 1);
    }
    state.month = new Date(d.getFullYear(), d.getMonth(), 1);
    go(2); await w(700); state.date = d; showDateBalloon(); Sound.boop(); render(); await w(1200);
    go(3); await w(500);
    for (const idx of [5, 6, 7, 8]) { state.startIdx = idx; render(); Sound.tick(); await w(220); }
    state.len = 3; render(); await w(1000);
    Object.assign(state.details, { street: '123 Example Lane', city: 'Suffolk', zip: '23434', firstName: 'Jordan', lastName: 'Example', phone: '(757) 555-0100', email: 'jordan@example.com', eventType: 'Birthday Party', guestCount: '12', surfaceType: 'Grass', powerOutlet: 'Yes', childName: 'Maya', childBirthday: '', heardAbout: 'Facebook', smsConsent: true, policiesAccepted: true });
    go(4); await w(1100);
    go(5);
    toast('Example party filled in. Nothing is booked or sent.');
  }

  /* ---------- public hooks ---------- */
  function selectUnit(slug, opts = {}) {
    if (!UNIT[slug] || state.held) return false;
    if (state.org) { state.org = false; }
    if (!state.units.includes(slug)) toggleUnit(slug, opts);
    if (state.step !== 1) go(1); else render();
    return true;
  }
  const onSelect = e => { const slug = e && e.detail && e.detail.slug; if (selectUnit(slug)) { try { host.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }); } catch (err) { /* ignore */ } } };
  window.addEventListener('lgij:select-unit', onSelect);
  cleanups.push(() => window.removeEventListener('lgij:select-unit', onSelect));
  const onMq = () => render();
  if (mq.addEventListener) { mq.addEventListener('change', onMq); cleanups.push(() => mq.removeEventListener('change', onMq)); }

  /* ---------- boot ---------- */
  buildScene();
  readEnv();
  const restored = loadHold();
  if (restored) {
    state.held = restored; state.date = restored.dateObj; state.len = restored.len;
    state.startIdx = Math.round((restored.start - START) * 2);
    restored.units.filter(s => UNIT[s]).forEach(s => { state.units.push(s); addBouncer(s, { instant: true }); });
    showDateBalloon();
  } else {
    let pre = host.getAttribute('preselect');
    try { const q = new URLSearchParams(location.search).get('unit'); if (q) pre = q; } catch (e) { /* ignore */ }
    if (pre && UNIT[pre]) { state.units.push(pre); addBouncer(pre, { instant: true }); }
  }
  render();

  return {
    selectUnit,
    destroy() { destroyed = true; clearInterval(countdownT); cleanups.forEach(f => f()); }
  };
}

class PartyBuilder extends HTMLElement {
  connectedCallback() {
    if (this._app) return;
    ensureFonts();
    const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
    try {
      this._app = createApp(this, root, readConfig(this));
      this.setAttribute('data-ready', '');
    } catch (e) {
      console.error(`[${TAG}] failed to start`, e);
      root.innerHTML = '<slot></slot>';
    }
  }
  disconnectedCallback() {
    if (this._app) { this._app.destroy(); this._app = null; }
  }
  selectUnit(slug) { return this._app ? this._app.selectUnit(slug) : false; }
  static get version() { return VERSION; }
}

if (!customElements.get(TAG)) customElements.define(TAG, PartyBuilder);
