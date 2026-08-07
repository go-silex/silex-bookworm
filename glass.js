/* ── Liquid glass ───────────────────────────────────────────────
 * Réfraction par displacement map, méthode « normal map » :
 * on décrit le profil du biseau par une fonction de surface, on en prend
 * la dérivée pour obtenir la normale, et on encode ce vecteur dans les
 * canaux R/G de la carte lue par feDisplacementMap.
 * D'après kube.io/blog/liquid-glass-css-svg/
 * ────────────────────────────────────────────────────────────── */

(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let uid = 0;
  let defs = null;

  // Seul Chromium applique un filtre SVG via backdrop-filter ; ailleurs on
  // se contente du flou dépoli, qui reste crédible.
  const supported = (() => {
    const ua = navigator.userAgent;
    if (/Firefox/.test(ua)) return false;
    if (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return false;
    return CSS.supports('backdrop-filter', 'url(#g)');
  })();

  /* Profils de surface : hauteur du verre en fonction de la distance au bord. */
  const smootherstep = x => x * x * x * (x * (x * 6 - 15) + 10);
  const convex = x => Math.pow(1 - Math.pow(1 - x, 4), 0.25);
  const concave = x => 1 - convex(x);
  const lip = x => convex(x) * (1 - smootherstep(x)) + concave(x) * smootherstep(x);

  const PROFILES = { convex, concave, lip };

  /* Distance signée à un rectangle arrondi : < 0 à l'intérieur. */
  function sdf(x, y, w, h, r) {
    const qx = Math.abs(x - w / 2) - (w / 2 - r);
    const qy = Math.abs(y - h / 2) - (h / 2 - r);
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
  }

  function buildMap(w, h, radius, bezel, profile) {
    // La carte est générée en basse résolution : feImage l'étire, et le
    // dégradé reste lisse.
    const step = Math.max(1, Math.ceil(Math.sqrt(w * h / 60000)));
    const mw = Math.max(2, Math.round(w / step));
    const mh = Math.max(2, Math.round(h / step));

    const vx = new Float32Array(mw * mh);
    const vy = new Float32Array(mw * mh);
    const f = PROFILES[profile] || lip;
    const d = 0.004;
    let max = 0;

    for (let j = 0; j < mh; j++) {
      for (let i = 0; i < mw; i++) {
        const x = (i + 0.5) * step;
        const y = (j + 0.5) * step;
        const dist = -sdf(x, y, w, h, radius);
        if (dist < 0 || dist >= bezel) continue;

        // t = 0 au bord, 1 à la fin du biseau. On borne près du bord :
        // la dérivée y diverge, ce qui écraserait tout le reste.
        const t = Math.max(dist / bezel, 0.03);
        const slope = (f(Math.min(1, t + d)) - f(Math.max(0, t - d))) / (2 * d);

        // Direction : le gradient de la distance signée, donc vers le bord.
        const gx = sdf(x + 1, y, w, h, radius) - sdf(x - 1, y, w, h, radius);
        const gy = sdf(x, y + 1, w, h, radius) - sdf(x, y - 1, w, h, radius);
        const len = Math.hypot(gx, gy) || 1;

        const m = Math.min(slope, 8);
        const k = j * mw + i;
        vx[k] = (gx / len) * m;
        vy[k] = (gy / len) * m;
        max = Math.max(max, Math.abs(vx[k]), Math.abs(vy[k]));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = mw; canvas.height = mh;
    const img = canvas.getContext('2d').createImageData(mw, mh);
    const norm = max || 1;
    for (let k = 0; k < mw * mh; k++) {
      img.data[k * 4]     = 128 + (vx[k] / norm) * 127;
      img.data[k * 4 + 1] = 128 + (vy[k] / norm) * 127;
      img.data[k * 4 + 2] = 128;
      img.data[k * 4 + 3] = 255;
    }
    canvas.getContext('2d').putImageData(img, 0, 0);
    return canvas.toDataURL();
  }

  function ensureDefs() {
    if (defs) return defs;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);
    document.body.appendChild(svg);
    return defs;
  }

  function el(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  /* Un passage par canal, à des échelles légèrement décalées : le verre
     disperse la lumière et laisse une frange colorée sur le biseau. */
  function channel(filter, scale, sel, matrix, result) {
    filter.appendChild(el('feDisplacementMap', {
      in: 'SourceGraphic', in2: 'map', scale,
      xChannelSelector: 'R', yChannelSelector: 'G', result: sel,
    }));
    filter.appendChild(el('feColorMatrix', { in: sel, type: 'matrix', values: matrix, result }));
  }

  function liquidGlass(target, opts) {
    const o = Object.assign({
      scale: 26,        // déplacement max, en px
      chroma: 0.06,     // écart entre canaux
      bezel: 0.22,      // épaisseur du biseau, en fraction du petit côté
      profile: 'lip',
      blur: 2,
      saturate: 1.6,
      radius: null,
      fallbackBlur: 18,
    }, opts || {});

    const frosted = `blur(${o.fallbackBlur}px) saturate(${o.saturate * 100}%)`;

    if (!supported) {
      target.style.backdropFilter = frosted;
      target.style.webkitBackdropFilter = frosted;
      return { supported: false, refresh() {}, destroy() { target.style.backdropFilter = ''; } };
    }

    const id = `glass-${++uid}`;
    const filter = el('filter', {
      id, 'color-interpolation-filters': 'sRGB',
      x: '0', y: '0', width: '100%', height: '100%',
    });
    ensureDefs().appendChild(filter);

    let w = 0, h = 0;

    function build() {
      const r = target.getBoundingClientRect();
      const nw = Math.round(r.width), nh = Math.round(r.height);
      if (!nw || !nh || (nw === w && nh === h)) return;
      w = nw; h = nh;

      const css = getComputedStyle(target);
      const radius = o.radius != null ? o.radius : Math.min(parseFloat(css.borderTopLeftRadius) || 0, Math.min(w, h) / 2);
      const bezel = Math.max(4, Math.min(w, h) * o.bezel);

      filter.textContent = '';
      filter.appendChild(el('feImage', {
        href: buildMap(w, h, radius, bezel, o.profile),
        x: 0, y: 0, width: w, height: h, result: 'map', preserveAspectRatio: 'none',
      }));

      const s = o.scale;
      channel(filter, s * (1 + o.chroma), 'r0', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'R');
      channel(filter, s,                  'g0', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'G');
      channel(filter, s * (1 - o.chroma), 'b0', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'B');
      filter.appendChild(el('feBlend', { in: 'R', in2: 'G', mode: 'screen', result: 'RG' }));
      filter.appendChild(el('feBlend', { in: 'RG', in2: 'B', mode: 'screen' }));

      const fx = `url(#${id}) blur(${o.blur}px) saturate(${o.saturate * 100}%)`;
      target.style.backdropFilter = fx;
      target.style.webkitBackdropFilter = fx;
    }

    build();
    const ro = new ResizeObserver(build);
    ro.observe(target);

    return {
      supported: true,
      refresh: build,
      destroy() {
        ro.disconnect();
        filter.remove();
        target.style.backdropFilter = '';
        target.style.webkitBackdropFilter = '';
      },
    };
  }

  global.liquidGlass = liquidGlass;
})(window);
