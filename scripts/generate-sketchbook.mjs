/**
 * Draws the nine sketchbook spreads (plus the botanical trim) used by the
 * landing page hero, and writes them to `public/sketchbook/`.
 *
 *   node scripts/generate-sketchbook.mjs
 *
 * Each spread is one open book: two sheets of paper on a stack of page
 * edges, the whole thing transparent outside the paper so the shadows the
 * hero casts underneath it can show through. The geometry is shared with
 * the page-turn code in `src/views/landing/sketchbookEngine.ts` — the
 * constants below and the `PAPER` box there have to agree, otherwise the
 * turning leaf tears away from the edge of the sheet.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sketchbook");

/* ---------------------------------------------------------- geometry */
const W = 1760;
const H = 1100;
const PAD_X = 0.034; /* paper inset — see PAPER in sketchbookEngine.ts */
const PAD_Y = 0.07;
const PX = W * PAD_X;
const PY = H * PAD_Y;
const PW = W - 2 * PX;
const PH = H - 2 * PY;
const GUT = W / 2;

/* one page's writable area */
const MARGIN_OUT = 62;
const MARGIN_GUT = 58;
const MARGIN_TOP = 58;
const MARGIN_BOT = 74;
const page = (side) => {
  const x = side === "l" ? PX + MARGIN_OUT : GUT + MARGIN_GUT;
  const r = side === "l" ? GUT - MARGIN_GUT : PX + PW - MARGIN_OUT;
  return { x, y: PY + MARGIN_TOP, w: r - x, h: PH - MARGIN_TOP - MARGIN_BOT, cx: (x + r) / 2 };
};

/* ------------------------------------------------------------ colour */
const INK = "#332c22";
const INK_2 = "rgba(51,44,34,.62)";
const INK_3 = "rgba(51,44,34,.34)";
const EARTH = "#9a6a3e";
const HUE = {
  earth: "#9a6a3e",
  clay: "#b4553f",
  ochre: "#c9973f",
  moss: "#4d7a6a",
  slate: "#5c6f8a",
  plum: "#7b5670",
};

/* --------------------------------------------------------- utilities */
/** deterministic noise so a re-run produces byte-identical artwork */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let R = rng(7);
const n = (v) => Math.round(v * 100) / 100;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** a straight run drawn by hand: subdivided, nudged off true */
function hand(x1, y1, x2, y2, amp = 1.5, over = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ax = x1 - ux * over * R();
  const ay = y1 - uy * over * R();
  const bx = x2 + ux * over * R();
  const by = y2 + uy * over * R();
  const steps = Math.max(2, Math.round(len / 46));
  let d = `M${n(ax)} ${n(ay)}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const bow = Math.sin(t * Math.PI) * amp * (R() - 0.5) * 2;
    d += `L${n(ax + (bx - ax) * t - uy * bow)} ${n(ay + (by - ay) * t + ux * bow)}`;
  }
  return d;
}
/** wobbly box, corners deliberately overshot the way a pen overshoots */
function boxPath(x, y, w, h, amp = 1.4, over = 5) {
  return [
    hand(x, y, x + w, y, amp, over),
    hand(x + w, y, x + w, y + h, amp, over),
    hand(x + w, y + h, x, y + h, amp, over),
    hand(x, y + h, x, y, amp, over),
  ].join(" ");
}
function stroke(d, { c = INK, w = 1.7, o = 1, cap = "round", dash = null } = {}) {
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round" opacity="${o}"${
    dash ? ` stroke-dasharray="${dash}"` : ""
  }/>`;
}
/** drawn twice, faintly, the way a pen goes back over a line */
function box(x, y, w, h, { c = INK, sw = 1.7, o = 1, amp = 1.3 } = {}) {
  return (
    stroke(boxPath(x, y, w, h, amp, 5), { c, w: sw, o }) +
    stroke(boxPath(x, y, w, h, amp * 1.5, 3), { c, w: sw * 0.7, o: o * 0.34 })
  );
}
function hatch(x, y, w, h, { c = INK, gap = 9, ang = -38, o = 0.3, sw = 1.1 } = {}) {
  const id = `h${Math.round(R() * 1e6)}`;
  const t = Math.tan((ang * Math.PI) / 180);
  let d = "";
  for (let k = -Math.abs(h * t) - gap; k < w + gap; k += gap) {
    d += hand(x + k, y, x + k + h * t, y + h, 0.8, 0);
  }
  return `<g clip-path="url(#${id})"><clipPath id="${id}"><rect x="${n(x)}" y="${n(y)}" width="${n(
    w
  )}" height="${n(h)}"/></clipPath>${stroke(d, { c, w: sw, o })}</g>`;
}
/** the squiggle that stands in for a line of handwriting */
function scribble(x, y, w, { c = INK_2, sw = 2, amp = 2.1 } = {}) {
  let d = `M${n(x)} ${n(y)}`;
  const steps = Math.max(3, Math.round(w / 17));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    d += `Q${n(x + w * (t - 0.5 / steps))} ${n(y + (i % 2 ? -amp : amp) * (0.6 + R()))} ${n(
      x + w * t
    )} ${n(y + (R() - 0.5) * 1.2)}`;
  }
  return stroke(d, { c, w: sw, o: 0.72 });
}
function lines(x, y, w, count, { lh = 21, ragged = 0.26, c = INK_2, sw = 2 } = {}) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const cut = i === count - 1 ? 0.35 + R() * 0.3 : 1 - R() * ragged;
    s += scribble(x, y + i * lh, w * cut, { c, sw });
  }
  return s;
}
function text(x, y, str, { size = 22, c = INK, anchor = "start", italic = false, track = 0, weight = 400, o = 1, caps = false } = {}) {
  return `<text x="${n(x)}" y="${n(y)}" fill="${c}" opacity="${o}" font-family="Georgia,'Times New Roman',serif" font-size="${size}" font-weight="${weight}" letter-spacing="${track}" text-anchor="${anchor}"${
    italic ? ' font-style="italic"' : ""
  }>${esc(caps ? String(str).toUpperCase() : str)}</text>`;
}
/** a soft pool of colour, the way a wash sits in the tooth of the paper */
function wash(x, y, w, h, hue, o = 0.3, rot = 0) {
  const id = `w${Math.round(R() * 1e6)}`;
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${hue}" stop-opacity="${o}"/><stop offset=".62" stop-color="${hue}" stop-opacity="${
    o * 0.55
  }"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${n(
    x + w / 2
  )}" cy="${n(y + h / 2)}" rx="${n(w / 2)}" ry="${n(h / 2)}" fill="url(#${id})" transform="rotate(${rot} ${n(
    x + w / 2
  )} ${n(y + h / 2)})" filter="url(#soft)"/>`;
}
function arrow(x1, y1, x2, y2, { c = INK, sw = 1.9, bow = 0, dash = null, head = 13 } = {}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cxp = mx - (dy / len) * bow;
  const cyp = my + (dx / len) * bow;
  const a = Math.atan2(y2 - cyp, x2 - cxp);
  const s =
    stroke(`M${n(x1)} ${n(y1)}Q${n(cxp)} ${n(cyp)} ${n(x2)} ${n(y2)}`, { c, w: sw, dash }) +
    stroke(
      `M${n(x2 - Math.cos(a - 0.4) * head)} ${n(y2 - Math.sin(a - 0.4) * head)}L${n(x2)} ${n(y2)}L${n(
        x2 - Math.cos(a + 0.4) * head
      )} ${n(y2 - Math.sin(a + 0.4) * head)}`,
      { c, w: sw }
    );
  return s;
}

/* -------------------------------------------------- the book chrome */
/** page edges, gutter shading, ruled margin, folio — everything that is
    the same on every spread */
function chrome(num, dateline) {
  const stack = [];
  for (let i = 5; i > 0; i--) {
    const inset = i * 3.2;
    stack.push(
      `<rect x="${n(PX - inset * 0.55)}" y="${n(PY + inset * 0.5)}" width="${n(
        PW + inset * 1.1
      )}" height="${n(PH - inset * 0.5)}" rx="7" fill="#ded3bf" opacity="${(0.5 - i * 0.06).toFixed(2)}"/>`
    );
  }
  const l = page("l");
  const r = page("r");
  return `
  <g>
    ${stack.join("")}
    <rect x="${n(PX)}" y="${n(PY)}" width="${n(PW)}" height="${n(PH)}" rx="6" fill="url(#sheet)"/>
    <rect x="${n(PX)}" y="${n(PY)}" width="${n(PW)}" height="${n(PH)}" rx="6" fill="url(#grain)" opacity=".5"/>
    <rect x="${n(GUT - 84)}" y="${n(PY)}" width="168" height="${n(PH)}" fill="url(#gutter)"/>
    ${stroke(hand(GUT, PY + 12, GUT, PY + PH - 12, 2.6), { c: INK, w: 1.1, o: 0.24 })}
    <rect x="${n(PX)}" y="${n(PY)}" width="${n(PW)}" height="${n(PH)}" rx="6" fill="none" stroke="rgba(51,44,34,.28)" stroke-width="1.2"/>
    <rect x="${n(PX)}" y="${n(PY)}" width="${n(PW)}" height="${n(PH)}" rx="6" fill="url(#vignette)"/>
    ${stroke(hand(l.x - 22, PY + 34, l.x - 22, PY + PH - 34, 2.4), { c: HUE.clay, w: 1.2, o: 0.3 })}
    ${stroke(hand(r.x + r.w + 22, PY + 34, r.x + r.w + 22, PY + PH - 34, 2.4), { c: HUE.clay, w: 1.2, o: 0.3 })}
    ${text(l.x, PY + PH - 30, dateline, { size: 15, c: INK_3, track: 3.4, caps: true })}
    ${text(r.x + r.w, PY + PH - 30, `Plate ${String(num).padStart(2, "0")}`, {
      size: 15,
      c: INK_3,
      track: 3.4,
      anchor: "end",
      caps: true,
    })}
    ${speckle()}
  </g>`;
}
function speckle() {
  let s = "";
  for (let i = 0; i < 70; i++) {
    const x = PX + R() * PW;
    const y = PY + R() * PH;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.5 + R() * 1.5)}" fill="${INK}" opacity="${n(
      0.03 + R() * 0.07
    )}"/>`;
  }
  return s;
}

/* ------------------------------------------------------- ink motifs */
/** one task card, the atom the whole board is built from */
function card(x, y, w, h, { hue = HUE.earth, rows = 2, chip = true, avatar = true, lift = 0, o = 1 } = {}) {
  let s = `<g opacity="${o}"${lift ? ` transform="translate(${n(-lift * 0.5)} ${n(-lift)})"` : ""}>`;
  if (lift) {
    s += `<rect x="${n(x + lift * 0.4)}" y="${n(y + lift + 4)}" width="${n(w)}" height="${n(
      h
    )}" rx="8" fill="rgba(78,62,38,.26)" filter="url(#soft)"/>`;
  }
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="7" fill="#fdf9ef" opacity=".92"/>`;
  s += box(x, y, w, h, { sw: 1.9 });
  s += lines(x + 15, y + 30, w - 46, rows, { lh: 22, sw: 2.3 });
  const fy = y + h - 20;
  if (chip) {
    s += `<rect x="${n(x + 15)}" y="${n(fy - 13)}" width="42" height="17" rx="8.5" fill="${hue}" opacity=".3"/>`;
    s += stroke(boxPath(x + 15, fy - 13, 42, 17, 0.8, 2), { c: hue, w: 1.4, o: 0.9 });
  }
  if (avatar) {
    const ax = x + w - 26;
    s += `<circle cx="${n(ax)}" cy="${n(fy - 5)}" r="11" fill="${hue}" opacity=".26"/>`;
    s += stroke(`M${n(ax - 11)} ${n(fy - 5)}a11 11 0 1 0 22 0a11 11 0 1 0 -22 0`, { c: INK, w: 1.4, o: 0.75 });
    s += stroke(`M${n(ax - 5)} ${n(fy - 2)}q5 5 10 0`, { c: INK, w: 1.3, o: 0.55 });
    s += `<circle cx="${n(ax - 4)}" cy="${n(fy - 9)}" r="1.5" fill="${INK}" opacity=".75"/><circle cx="${n(
      ax + 4
    )}" cy="${n(fy - 9)}" r="1.5" fill="${INK}" opacity=".75"/>`;
  }
  return s + "</g>";
}
/** a column, filled with cards down to its foot */
function column(x, y, w, h, title, { hue = HUE.earth, lift = false, tilt = 0, density = 1, done = false, ghostAfter = -1 } = {}) {
  const cards = [];
  let cy = y + 76;
  while (cy < y + h - 46) {
    const ch = Math.round((72 + R() * 26) / density);
    if (cy + ch > y + h - 16) break;
    cards.push([cy, ch]);
    cy += ch + 16;
  }
  let s = "";
  if (lift) {
    s += `<rect x="${n(x + 9)}" y="${n(y + 18)}" width="${n(w)}" height="${n(
      h
    )}" rx="12" fill="rgba(78,62,38,.22)" filter="url(#soft)"/>`;
  }
  s += `<g${tilt ? ` transform="rotate(${tilt} ${n(x + w / 2)} ${n(y + h / 2)})"` : ""}>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="10" fill="${hue}" opacity=".1"/>`;
  s += box(x, y, w, h, { sw: 2, amp: 1.7 });
  s += text(x + 18, y + 38, title, { size: 26, c: INK, track: 0.4 });
  s += `<circle cx="${n(x + w - 28)}" cy="${n(y + 31)}" r="14" fill="${hue}" opacity=".22"/>`;
  s += text(x + w - 28, y + 38, String(cards.length), { size: 19, c: INK_2, anchor: "middle" });
  s += stroke(hand(x + 16, y + 56, x + w - 16, y + 56, 1.3), { c: INK, w: 1.3, o: 0.42 });
  for (let i = 0; i < cards.length; i++) {
    const [ty, ch] = cards[i];
    if (i === ghostAfter) {
      /* the hole a card leaves while it is in the air */
      s += `<rect x="${n(x + 15)}" y="${n(ty)}" width="${n(w - 30)}" height="${n(ch)}" rx="7" fill="${hue}" opacity=".1"/>`;
      s += stroke(boxPath(x + 15, ty, w - 30, ch, 1, 2), { c: INK, w: 2, o: 0.5, dash: "11 9" });
      continue;
    }
    s += card(x + 15, ty, w - 30, ch, { hue, rows: ch > 88 ? 2 : 1 });
    if (done) s += stroke(`M${n(x + 26)} ${n(ty + ch / 2)}l11 13l22 -28`, { c: HUE.moss, w: 3.4, o: 0.9 });
  }
  return s + "</g>";
}
/** the caption a plate carries in its own margin */
function heading(p, title, sub, body) {
  return (
    text(p.x, p.y + 46, title, { size: 60, italic: true }) +
    stroke(hand(p.x, p.y + 70, p.x + Math.min(p.w, 300), p.y + 70, 1.6), { c: EARTH, w: 2.4, o: 0.62 }) +
    text(p.x, p.y + 104, sub, { size: 18, c: INK_3, track: 4.2, caps: true }) +
    lines(p.x, p.y + 152, p.w - 8, body, { lh: 33, sw: 2.4 })
  );
}
/** the line in the bottom margin, in a smaller hand */
function footnote(p, str) {
  return (
    stroke(hand(p.x, p.y + p.h - 44, p.x + p.w * 0.42, p.y + p.h - 44, 1.4), { c: INK, w: 1.2, o: 0.26 }) +
    text(p.x, p.y + p.h - 12, str, { size: 23, c: INK_2, italic: true })
  );
}
/** a swatch of colour, taped down */
function swatch(x, y, w, h, hue, label) {
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="3" fill="${hue}" opacity=".34"/>`;
  s += hatch(x, y, w, h, { c: hue, gap: 7, o: 0.4, ang: -46 });
  s += box(x, y, w, h, { sw: 1.5, o: 0.8 });
  for (const tx of [x - 8, x + w - 22]) {
    s += `<rect x="${n(tx)}" y="${n(y - 12)}" width="30" height="20" rx="2" fill="#e2d7bd" opacity=".7" transform="rotate(${
      tx < x ? -8 : 7
    } ${n(tx + 15)} ${n(y - 2)})"/>`;
  }
  return s + (label ? text(x + w / 2, y + h + 28, label, { size: 19, c: INK_2, anchor: "middle", caps: true, track: 2.4 }) : "");
}

/* ------------------------------------------------------- the plates */
const PLATES = [
  {
    file: "the-board.svg",
    title: "The Board",
    sub: "Everything, at a glance",
    date: "Sheet one · the whole table",
    draw(l, r) {
      let s = heading(l, "The Board", "Everything at a glance", 5);
      /* the same board again, small, the way you sketch it before you build it */
      const tw = (l.w - 36) / 4;
      const ty = l.y + 320;
      s += wash(l.x - 30, ty - 40, l.w + 60, 300, HUE.ochre, 0.16, -6);
      for (let i = 0; i < 4; i++) {
        const cx = l.x + i * (tw + 12);
        s += box(cx, ty, tw - 6, 250, { sw: 1.5, o: 0.72 });
        for (let k = 0; k < 4 - (i % 2); k++) {
          s += `<rect x="${n(cx + 11)}" y="${n(ty + 20 + k * 46)}" width="${n(tw - 28)}" height="34" rx="5" fill="${
            Object.values(HUE)[i + 1]
          }" opacity=".24"/>`;
          s += stroke(boxPath(cx + 11, ty + 20 + k * 46, tw - 28, 34, 0.9, 2), { c: INK, w: 1.2, o: 0.4 });
        }
      }
      s += text(l.x, ty + 300, "four lists, one afternoon", { size: 25, italic: true });
      s += lines(l.x, ty + 328, l.w - 60, 2, { lh: 31, sw: 2.3 });
      s += footnote(l, "start here · every card is on this page");

      const colW = (r.w - 3 * 14) / 4;
      const names = ["Backlog", "Doing", "Review", "Done"];
      const hues = [HUE.slate, HUE.ochre, HUE.plum, HUE.moss];
      let g = wash(r.x - 20, r.y + 20, r.w + 40, r.h - 40, HUE.earth, 0.13, 3);
      for (let i = 0; i < 4; i++) {
        g += column(r.x + i * (colW + 14), r.y + 22, colW, r.h - 40, names[i], {
          hue: hues[i],
          density: 1 + i * 0.06,
          done: i === 3,
        });
      }
      return s + g;
    },
  },
  {
    file: "lists-in-motion.svg",
    title: "Lists in Motion",
    sub: "Columns",
    date: "Reordering the day",
    draw(l, r) {
      let s = heading(l, "Lists in Motion", "Columns", 4);
      s += wash(l.x - 10, l.y + 300, l.w + 20, 250, HUE.ochre, 0.16, 5);
      s += box(l.x + 8, l.y + 320, l.w - 24, 210, { sw: 1.7, amp: 1.6 });
      s += text(l.x + 32, l.y + 372, "A list is a promise", { size: 34, italic: true });
      s += lines(l.x + 32, l.y + 406, l.w - 92, 3, { lh: 31, sw: 2.3 });
      s += text(l.x + 32, l.y + 508, "hold · lift · set down", { size: 20, c: EARTH, track: 3.4, caps: true });
      s += arrow(l.x + 40, l.y + 596, l.x + 300, l.y + 596, { c: EARTH, bow: -26, dash: "9 8", sw: 2.2 });
      s += text(l.x + 170, l.y + 640, "drag a whole column", { size: 24, italic: true, anchor: "middle", c: INK_2 });
      s += footnote(l, "order is an opinion, held lightly");

      const colW = (r.w - 2 * 22) / 3;
      const names = ["Doing", "Backlog", "Review"];
      const hues = [HUE.ochre, HUE.slate, HUE.plum];
      let g = "";
      for (let i = 0; i < 3; i++) {
        const x = r.x + i * (colW + 22);
        g += column(x, r.y + 92, colW, r.h - 116, names[i], {
          hue: hues[i],
          lift: i === 1,
          tilt: i === 1 ? -2.4 : 0,
          density: 1.1,
        });
      }
      /* the arc the middle column travels along */
      g += arrow(r.x + colW * 1.5 + 22, r.y + 56, r.x + colW * 0.5, r.y + 56, {
        c: EARTH,
        bow: 44,
        dash: "10 8",
        sw: 2.4,
        head: 16,
      });
      g += text(r.x + colW, r.y + 20, "swap", { size: 26, c: EARTH, italic: true, anchor: "middle" });
      return s + g;
    },
  },
  {
    file: "a-card-up-close.svg",
    title: "A Card, Up Close",
    sub: "Anatomy",
    date: "Studied at arm's length",
    draw(l, r) {
      let s = heading(l, "A Card, Up Close", "Anatomy", 4);
      const parts = [
        ["title", "what it is"],
        ["priority", "how loud"],
        ["assignee", "whose hands"],
        ["comments", "what was said"],
        ["position", "where it sits"],
      ];
      parts.forEach((p, i) => {
        const y = l.y + 320 + i * 62;
        s += `<circle cx="${n(l.x + 13)}" cy="${n(y - 9)}" r="6" fill="${EARTH}" opacity=".85"/>`;
        s += text(l.x + 40, y, p[0], { size: 25, c: INK, track: 2.4, caps: true });
        s += text(l.x + l.w - 12, y, p[1], { size: 22, c: INK_3, italic: true, anchor: "end" });
        s += stroke(hand(l.x + 40, y + 13, l.x + l.w - 12, y + 13, 1.2), { c: INK, w: 1.1, o: 0.2 });
      });
      /* the card again, thumbnail size, the way it sits in a column */
      s += wash(l.x + 20, l.y + 632, 300, 190, HUE.moss, 0.14, 4);
      s += card(l.x + 44, l.y + 660, 250, 120, { hue: HUE.ochre, rows: 2 });
      s += text(l.x + 340, l.y + 706, "actual size,", { size: 23, c: INK_2, italic: true });
      s += text(l.x + 340, l.y + 736, "in a column", { size: 23, c: INK_2, italic: true });
      s += footnote(l, "five fields, and no more than five");

      /* the card itself, blown up, with leaders out to its labels */
      const cw = r.w * 0.8;
      const ch = 400;
      const cx = r.x + 2;
      const cy = r.y + 190;
      let g = wash(cx - 40, cy - 60, cw + 150, ch + 140, HUE.ochre, 0.18, 3);
      g += `<rect x="${n(cx + 10)}" y="${n(cy + 20)}" width="${n(cw)}" height="${n(
        ch
      )}" rx="12" fill="rgba(78,62,38,.2)" filter="url(#soft)"/>`;
      g += `<rect x="${n(cx)}" y="${n(cy)}" width="${n(cw)}" height="${n(ch)}" rx="10" fill="#fdf9ef" opacity=".94"/>`;
      g += box(cx, cy, cw, ch, { sw: 2.4, amp: 1.6 });
      g += text(cx + 32, cy + 68, "Integrate Ant Design", { size: 36 });
      g += lines(cx + 32, cy + 112, cw - 110, 2, { lh: 34, sw: 2.4 });
      g += stroke(hand(cx + 32, cy + 196, cx + cw - 32, cy + 196, 1.4), { c: INK, w: 1.2, o: 0.24 });
      /* the small print: a checklist, half struck through */
      for (let i = 0; i < 3; i++) {
        const y = cy + 232 + i * 38;
        g += stroke(boxPath(cx + 34, y - 16, 20, 20, 0.7, 2), { c: INK, w: 1.5, o: 0.7 });
        if (i < 2) g += stroke(`M${n(cx + 38)} ${n(y - 7)}l7 8l14 -17`, { c: HUE.moss, w: 2.6 });
        g += scribble(cx + 70, y - 4, 200 + (i % 2) * 74, { sw: 2.3 });
      }
      g += `<rect x="${n(cx + 32)}" y="${n(cy + ch - 74)}" width="104" height="34" rx="17" fill="${
        HUE.clay
      }" opacity=".28"/>`;
      g += stroke(boxPath(cx + 32, cy + ch - 74, 104, 34, 0.9, 2), { c: HUE.clay, w: 1.6, o: 0.9 });
      g += text(cx + 84, cy + ch - 50, "High", { size: 21, c: INK, anchor: "middle" });
      const av = cx + cw - 62;
      g += `<circle cx="${n(av)}" cy="${n(cy + ch - 56)}" r="23" fill="${HUE.moss}" opacity=".26"/>`;
      g += stroke(`M${n(av - 23)} ${n(cy + ch - 56)}a23 23 0 1 0 46 0a23 23 0 1 0 -46 0`, { c: INK, w: 1.7 });
      g += text(av, cy + ch - 48, "JD", { size: 19, c: INK_2, anchor: "middle" });
      g += stroke(
        `M${n(cx + cw - 168)} ${n(cy + ch - 74)}h44a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-28l-12 12v-12a9 9 0 0 1 -13 -9v-18a9 9 0 0 1 9 -9z`,
        { c: INK, w: 1.6, o: 0.8 }
      );
      g += text(cx + cw - 142, cy + ch - 47, "3", { size: 20, c: INK_2 });

      const label = (y, str, from) => {
        const lx = r.x + r.w;
        return (
          arrow(lx - 12, y, from[0], from[1], { c: EARTH, sw: 1.5, bow: 16, head: 11 }) +
          text(lx, y - 14, str, { size: 22, c: EARTH, anchor: "end", italic: true })
        );
      };
      g += label(cy - 60, "title", [cx + cw - 70, cy + 52]);
      g += label(cy + 118, "notes", [cx + cw - 110, cy + 130]);
      g += label(cy + ch - 142, "priority", [cx + 150, cy + ch - 58]);
      g += label(cy + ch + 46, "assignee", [cx + cw - 56, cy + ch - 30]);
      g += text(r.x + r.w / 2, r.y + r.h - 6, "one card, read at four inches", {
        size: 23,
        c: INK_2,
        italic: true,
        anchor: "middle",
      });
      return s + g;
    },
  },
  {
    file: "drag-and-drop.svg",
    title: "Drag & Drop",
    sub: "The gesture",
    date: "Held, then let go",
    draw(l, r) {
      let s = heading(l, "Drag & Drop", "The gesture", 4);
      s += text(l.x, l.y + 320, "pick it up anywhere", { size: 34, italic: true });
      s += lines(l.x, l.y + 360, l.w - 24, 3, { lh: 32, sw: 2.4 });
      s += text(l.x, l.y + 470, "past halfway, it commits", { size: 20, c: EARTH, track: 3.2, caps: true });
      /* the pointer, drawn as a hand closing on a corner */
      const hx = l.x + 176;
      const hy = l.y + 520;
      s += wash(hx - 110, hy - 30, 380, 300, HUE.moss, 0.14, -6);
      s += stroke(
        `M${hx} ${hy + 118}q-8 -60 8 -96q8 -18 21 -8q8 6 5 26l-5 34q8 -44 18 -60q9 -14 21 -5q10 8 3 29l-12 42q12 -37 24 -45q12 -8 18 4q7 10 -4 31l-16 39q13 -23 24 -26q12 -4 14 8q3 10 -10 31l-29 47q-18 29 -52 26q-26 -3 -37 -26z`,
        { c: INK, w: 2.4 }
      );
      s += hatch(hx + 6, hy + 52, 100, 78, { c: INK, gap: 12, o: 0.14 });
      s += stroke(boxPath(hx - 96, hy - 6, 150, 76, 1.2, 3), { c: INK, w: 1.8, o: 0.55, dash: "9 8" });
      s += footnote(l, "let go early and the card walks home");

      const colW = (r.w - 70) / 2.05;
      let g = column(r.x, r.y + 60, colW, r.h - 92, "Doing", { hue: HUE.ochre, density: 1.15 });
      g += column(r.x + colW + 70, r.y + 60, colW, r.h - 92, "Review", {
        hue: HUE.plum,
        density: 1.15,
        ghostAfter: 1,
      });
      /* and the card in the air, between the two */
      const fx = r.x + colW - 46;
      const fy = r.y + 420;
      g += `<g transform="rotate(-7 ${n(fx + 110)} ${n(fy + 44)})">${card(fx, fy, 224, 96, {
        hue: HUE.ochre,
        lift: 24,
      })}</g>`;
      g += arrow(r.x + colW - 20, r.y + 330, r.x + colW + 116, r.y + 230, { c: EARTH, bow: 76, dash: "10 9", sw: 2.4, head: 16 });
      g += text(r.x + colW + 34, r.y + 384, "drop", { size: 26, c: EARTH, italic: true, anchor: "middle" });
      return s + g;
    },
  },
  {
    file: "priority-marks.svg",
    title: "Priority Marks",
    sub: "Triage",
    date: "Four marks, in order",
    draw(l, r) {
      let s = heading(l, "Priority Marks", "Triage", 4);
      s += text(l.x, l.y + 306, "read the colour", { size: 34, italic: true });
      s += text(l.x, l.y + 344, "before the words", { size: 34, italic: true });
      s += lines(l.x, l.y + 386, l.w - 30, 3, { lh: 32, sw: 2.4 });
      const sw = (l.w - 60) / 4;
      [HUE.clay, HUE.ochre, HUE.moss, HUE.slate].forEach((hue, i) => {
        s += swatch(l.x + 6 + i * (sw + 18), l.y + 510, sw - 6, 120, hue, ["1", "2", "3", "4"][i]);
      });
      s += footnote(l, "four is enough · five is a debate");

      const marks = [
        ["Urgent", HUE.clay, "today"],
        ["High", HUE.ochre, "this week"],
        ["Normal", HUE.moss, "queued"],
        ["Low", HUE.slate, "someday"],
      ];
      let g = "";
      marks.forEach((m, i) => {
        const y = r.y + 30 + i * ((r.h - 40) / 4);
        g += wash(r.x - 10, y - 6, r.w * 0.94, 130, m[1], 0.16, i % 2 ? 3 : -3);
        /* a pennant on a pin */
        g += stroke(hand(r.x + 26, y + 10, r.x + 26, y + 116, 1.3), { c: INK, w: 2.4 });
        g += `<path d="M${n(r.x + 29)} ${n(y + 14)}L${n(r.x + 156)} ${n(y + 40)}L${n(r.x + 29)} ${n(
          y + 68
        )}Z" fill="${m[1]}" opacity=".46"/>`;
        g += stroke(`M${n(r.x + 29)} ${n(y + 14)}L${n(r.x + 156)} ${n(y + 40)}L${n(r.x + 29)} ${n(y + 68)}`, {
          c: INK,
          w: 2.1,
        });
        g += text(r.x + 192, y + 52, m[0], { size: 42, italic: true });
        g += text(r.x + 196, y + 86, m[2], { size: 20, c: INK_3, track: 3.4, caps: true });
        g += hatch(r.x + 430, y + 18, 200 - i * 42, 62, { c: m[1], gap: 9, o: 0.5, ang: -52 });
        g += stroke(hand(r.x, y + 148, r.x + r.w - 10, y + 148, 1.5), { c: INK, w: 1.1, o: 0.18 });
      });
      return s + g;
    },
  },
  {
    file: "hands-on-deck.svg",
    title: "Hands on Deck",
    sub: "Assignees",
    date: "Who has the ball",
    draw(l, r) {
      let s = heading(l, "Hands on Deck", "Assignees", 4);
      const who = ["J. Doe", "A. Rahim", "M. Osei", "K. Tan"];
      who.forEach((name, i) => {
        const y = l.y + 330 + i * 78;
        const hue = Object.values(HUE)[i + 1];
        s += `<circle cx="${n(l.x + 30)}" cy="${n(y - 10)}" r="26" fill="${hue}" opacity=".26"/>`;
        s += stroke(`M${n(l.x + 4)} ${n(y - 10)}a26 26 0 1 0 52 0a26 26 0 1 0 -52 0`, { c: INK, w: 1.8 });
        s += `<circle cx="${n(l.x + 22)}" cy="${n(y - 17)}" r="2.2" fill="${INK}"/><circle cx="${n(
          l.x + 38
        )}" cy="${n(y - 17)}" r="2.2" fill="${INK}"/>`;
        s += stroke(`M${n(l.x + 19)} ${n(y - 3)}q11 9 22 0`, { c: INK, w: 1.5, o: 0.75 });
        s += text(l.x + 74, y, name, { size: 28 });
        s += text(l.x + l.w - 10, y, `${3 - i} open`, { size: 20, c: INK_3, anchor: "end", track: 2.2, caps: true });
        s += stroke(hand(l.x + 74, y + 16, l.x + l.w - 10, y + 16, 1.2), { c: INK, w: 1, o: 0.18 });
      });
      s += footnote(l, "one name per card, or the card is nobody's");

      /* the same four, ringed around the sprint they share */
      const cx = r.cx;
      const cy = r.y + r.h / 2;
      let g = wash(cx - 300, cy - 300, 600, 600, HUE.earth, 0.15);
      g += `<rect x="${n(cx - 150)}" y="${n(cy - 104)}" width="300" height="208" rx="10" fill="#fdf9ef" opacity=".8"/>`;
      g += box(cx - 150, cy - 104, 300, 208, { sw: 2.3 });
      g += text(cx, cy - 52, "Sprint 12", { size: 38, anchor: "middle", italic: true });
      g += lines(cx - 116, cy - 12, 232, 3, { lh: 30, sw: 2.3 });
      g += text(cx, cy + 84, "eleven cards", { size: 20, c: INK_3, anchor: "middle", track: 3, caps: true });
      const seats = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
      seats.forEach((p, i) => {
        const hue = Object.values(HUE)[i + 1];
        const x = cx + p[0] * 250;
        const y = cy + p[1] * 240;
        g += `<circle cx="${n(x)}" cy="${n(y)}" r="46" fill="${hue}" opacity=".26"/>`;
        g += stroke(`M${n(x - 46)} ${n(y)}a46 46 0 1 0 92 0a46 46 0 1 0 -92 0`, { c: INK, w: 2 });
        g += `<circle cx="${n(x - 14)}" cy="${n(y - 10)}" r="3.2" fill="${INK}"/><circle cx="${n(x + 14)}" cy="${n(
          y - 10
        )}" r="3.2" fill="${INK}"/>`;
        g += stroke(`M${n(x - 18)} ${n(y + 11)}q18 15 36 0`, { c: INK, w: 1.8, o: 0.8 });
        g += text(x, y + 78, who[i], { size: 22, anchor: "middle", c: INK_2, italic: true });
        g += arrow(x - p[0] * 54, y - p[1] * 40, cx + p[0] * 156, cy + p[1] * 86, {
          c: EARTH,
          sw: 1.6,
          dash: "8 7",
          bow: 20 * p[0] * p[1],
          head: 12,
        });
      });
      return s + g;
    },
  },
  {
    file: "margin-notes.svg",
    title: "Margin Notes",
    sub: "Comments",
    date: "Thinking, in the margin",
    draw(l, r) {
      let s = heading(l, "Margin Notes", "Comments", 4);
      s += text(l.x, l.y + 320, "the card remembers", { size: 34, italic: true });
      s += lines(l.x, l.y + 358, l.w - 20, 5, { lh: 32, sw: 2.4 });
      /* a nib, resting where it was put down */
      const nx = l.x + 40;
      const ny = l.y + 630;
      s += wash(nx - 60, ny - 130, 380, 220, HUE.slate, 0.14, -8);
      s += stroke(`M${nx} ${ny}l168 -118`, { c: INK, w: 8, o: 0.85 });
      s += stroke(`M${nx + 160} ${ny - 124}l22 -16l-8 26z`, { c: EARTH, w: 2, o: 0.9 });
      s += `<path d="M${nx - 2} ${ny + 2}l-22 22l34 -12z" fill="${INK}" opacity=".85"/>`;
      s += text(l.x + 230, ny - 40, "reply, in ink", { size: 26, c: INK_2, italic: true });
      s += footnote(l, "a decision without its reason is a rumour");

      let g = "";
      const bubble = (x, y, w, h, hue, tailLeft, rows) => {
        let b = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="16" fill="${hue}" opacity=".22"/>`;
        b += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="16" fill="#fdf9ef" opacity=".34"/>`;
        b += box(x, y, w, h, { sw: 2 });
        b += stroke(
          tailLeft ? `M${n(x + 30)} ${n(y + h)}l-20 32l50 -28` : `M${n(x + w - 30)} ${n(y + h)}l20 32l-50 -28`,
          { c: INK, w: 2 }
        );
        const ax = tailLeft ? x + 40 : x + w - 40;
        b += `<circle cx="${n(ax)}" cy="${n(y + 38)}" r="18" fill="${hue}" opacity=".34"/>`;
        b += stroke(`M${n(ax - 18)} ${n(y + 38)}a18 18 0 1 0 36 0a18 18 0 1 0 -36 0`, { c: INK, w: 1.5, o: 0.85 });
        b += `<circle cx="${n(ax - 6)}" cy="${n(y + 33)}" r="1.9" fill="${INK}"/><circle cx="${n(ax + 6)}" cy="${n(
          y + 33
        )}" r="1.9" fill="${INK}"/>`;
        b += lines(tailLeft ? x + 72 : x + 26, y + 34, w - 104, rows, { lh: 30, sw: 2.4 });
        return b;
      };
      g += wash(r.x - 20, r.y, r.w + 40, r.h, HUE.earth, 0.12);
      g += bubble(r.x, r.y + 20, r.w * 0.84, 132, HUE.ochre, true, 3);
      g += bubble(r.x + r.w * 0.16, r.y + 216, r.w * 0.84, 104, HUE.moss, false, 2);
      g += bubble(r.x, r.y + 396, r.w * 0.78, 148, HUE.clay, true, 3);
      g += text(r.x + r.w, r.y + 636, "three notes, one card", { size: 24, c: INK_2, italic: true, anchor: "end" });
      g += stroke(hand(r.x + 6, r.y + 668, r.x + r.w, r.y + 668, 1.8), { c: EARTH, w: 1.8, o: 0.42 });
      return s + g;
    },
  },
  {
    file: "the-round-trip.svg",
    title: "The Round Trip",
    sub: "Typed, end to end",
    date: "Client · server · table",
    draw(l, r) {
      let s = heading(l, "The Round Trip", "Typed, end to end", 4);
      const stack = ["Next.js", "tRPC", "Prisma", "MySQL"];
      stack.forEach((t, i) => {
        const y = l.y + 340 + i * 72;
        s += `<rect x="${n(l.x)}" y="${n(y - 36)}" width="${n(l.w - 16)}" height="54" rx="9" fill="${
          Object.values(HUE)[i + 1]
        }" opacity=".16"/>`;
        s += box(l.x, y - 36, l.w - 16, 54, { sw: 1.6, o: 0.8 });
        s += text(l.x + 22, y, t, { size: 28 });
        s += text(l.x + l.w - 44, y, String(i + 1), { size: 20, c: INK_3, anchor: "end" });
      });
      s += text(l.x, l.y + 664, "one type, all the way down", { size: 26, italic: true });
      s += footnote(l, "if the shape is wrong, it never compiles");

      const cx = r.cx;
      const cy = r.y + r.h / 2 - 10;
      let g = wash(cx - 300, cy - 280, 600, 560, HUE.slate, 0.15);
      const node = (x, y, w, h, t, sub, hue) =>
        `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="10" fill="${hue}" opacity=".18"/>` +
        box(x, y, w, h, { sw: 2.2 }) +
        text(x + w / 2, y + h / 2 - 2, t, { size: 30, anchor: "middle" }) +
        text(x + w / 2, y + h / 2 + 28, sub, { size: 17, c: INK_3, anchor: "middle", track: 3.2, caps: true });
      g += node(cx - 306, cy - 262, 272, 134, "board", "browser", HUE.ochre);
      g += node(cx + 34, cy - 262, 272, 134, "router", "trpc", HUE.moss);
      g += node(cx + 34, cy + 74, 272, 134, "client", "prisma", HUE.plum);
      g += node(cx - 306, cy + 74, 272, 134, "table", "mysql", HUE.slate);
      g += arrow(cx - 26, cy - 195, cx + 26, cy - 195, { c: EARTH, sw: 2.1, head: 14 });
      g += arrow(cx + 170, cy - 120, cx + 170, cy + 66, { c: EARTH, sw: 2.1, head: 14 });
      g += arrow(cx + 26, cy + 141, cx - 26, cy + 141, { c: EARTH, sw: 2.1, head: 14 });
      g += arrow(cx - 170, cy + 66, cx - 170, cy - 120, { c: EARTH, sw: 2.1, dash: "9 8", head: 14 });
      g += text(cx + 2, cy - 212, "query", { size: 22, c: EARTH, italic: true, anchor: "middle" });
      g += text(cx - 188, cy - 18, "rows", { size: 22, c: EARTH, italic: true, anchor: "end" });
      g += text(cx + 190, cy - 18, "call", { size: 22, c: EARTH, italic: true });
      g += text(cx + 2, cy + 172, "select", { size: 22, c: EARTH, italic: true, anchor: "middle" });
      g += text(cx, cy + 268, "optimistic on the way out,", { size: 24, c: INK_2, italic: true, anchor: "middle" });
      g += text(cx, cy + 300, "honest on the way back", { size: 24, c: INK_2, italic: true, anchor: "middle" });
      return s + g;
    },
  },
  {
    file: "ready-to-ship.svg",
    title: "Ready to Ship",
    sub: "Done",
    date: "The last column",
    draw(l, r) {
      let s = heading(l, "Ready to Ship", "Done", 4);
      const done = ["Remove unused tests", "Fix typo in config", "Update LICENSE.md", "Improve TS setup", "Add list API"];
      done.forEach((t, i) => {
        const y = l.y + 330 + i * 66;
        s += stroke(`M${n(l.x + 4)} ${n(y - 10)}l13 16l26 -34`, { c: HUE.moss, w: 4 });
        s += text(l.x + 62, y, t, { size: 27, o: 0.78 });
        s += stroke(hand(l.x + 56, y - 8, l.x + 56 + t.length * 13.4, y - 8, 1.4), { c: INK, w: 1.5, o: 0.42 });
      });
      s += text(l.x, l.y + 700, "then the page turns", { size: 28, italic: true });
      s += footnote(l, "nine plates · then back to the first");

      let g = wash(r.x - 20, r.y, r.w + 40, r.h, HUE.moss, 0.14);
      g += column(r.x, r.y + 30, r.w * 0.5, r.h - 60, "Done", { hue: HUE.moss, density: 1.1, done: true });
      /* a paper boat, off down the river */
      const bx = r.x + r.w * 0.6;
      const by = r.y + 250;
      g += `<path d="M${n(bx)} ${n(by)}l210 0l-44 88h-122z" fill="#fdf9ef" opacity=".9"/>`;
      g += stroke(`M${n(bx)} ${n(by)}l210 0l-44 88h-122z`, { c: INK, w: 2.4 });
      g += `<path d="M${n(bx + 106)} ${n(by - 6)}l0 -110l74 110z" fill="${HUE.ochre}" opacity=".34"/>`;
      g += stroke(`M${n(bx + 104)} ${n(by)}l0 -118l80 118`, { c: INK, w: 2.4 });
      for (let i = 0; i < 5; i++) {
        g += stroke(`M${n(bx - 60 + i * 14)} ${n(by + 130 + i * 30)}q34 -18 68 0t68 0t68 0`, {
          c: HUE.slate,
          w: 2.4,
          o: 0.48 - i * 0.07,
        });
      }
      g += text(bx + 104, r.y + r.h - 24, "shipped", { size: 26, c: INK_2, italic: true, anchor: "middle" });
      return s + g;
    },
  },
];

/* ------------------------------------------------------------ defs */
const DEFS = `
<defs>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
  <linearGradient id="sheet" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f7f1e4"/><stop offset=".5" stop-color="#f2ebdc"/><stop offset="1" stop-color="#ece4d3"/>
  </linearGradient>
  <linearGradient id="gutter" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8a7452" stop-opacity="0"/>
    <stop offset=".42" stop-color="#8a7452" stop-opacity=".22"/>
    <stop offset=".5" stop-color="#6d5a3a" stop-opacity=".3"/>
    <stop offset=".58" stop-color="#8a7452" stop-opacity=".22"/>
    <stop offset="1" stop-color="#8a7452" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="vignette" cx=".5" cy=".5" r=".72">
    <stop offset=".6" stop-color="#7b6746" stop-opacity="0"/>
    <stop offset="1" stop-color="#7b6746" stop-opacity=".16"/>
  </radialGradient>
  <pattern id="grain" width="120" height="120" patternUnits="userSpaceOnUse">
    <rect width="120" height="120" fill="none"/>
    ${Array.from({ length: 46 }, (_, i) => {
      const x = ((i * 37) % 120) + ((i * 13) % 7);
      const y = ((i * 61) % 120) + ((i * 5) % 9);
      return `<circle cx="${x}" cy="${y}" r="${(i % 3) * 0.4 + 0.5}" fill="#8a7452" opacity="0.07"/>`;
    }).join("")}
  </pattern>
</defs>`;

function svg(body, { w = W, h = H, defs = DEFS } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${defs}${body}</svg>\n`;
}

/* ------------------------------------------------------------- trim */
function sprig(seed, flip) {
  R = rng(seed);
  const w = 420;
  const h = 900;
  let s = "";
  const stemX = flip ? w - 90 : 90;
  s += stroke(`M${stemX} ${h}C${stemX + (flip ? -40 : 40)} ${h * 0.7} ${stemX + (flip ? -20 : 20)} ${h * 0.4} ${stemX + (flip ? -70 : 70)} ${h * 0.08}`, {
    c: "#5c6a4a",
    w: 3.4,
    o: 0.85,
  });
  for (let i = 0; i < 9; i++) {
    const t = 0.08 + i * 0.1;
    const y = h - t * h * 0.94;
    const x = stemX + (flip ? -1 : 1) * (34 * Math.sin(t * 3.4) + t * 52);
    const len = 130 - i * 7 + (i % 2) * 24;
    const dir = i % 2 ? 1 : -1;
    const ex = x + (flip ? -1 : 1) * len * (dir > 0 ? 1 : 0.55);
    const ey = y - 66 - (i % 3) * 14;
    s += `<path d="M${n(x)} ${n(y)}Q${n((x + ex) / 2 + dir * 26)} ${n(y - 74)} ${n(ex)} ${n(ey)}Q${n(
      (x + ex) / 2 - dir * 14
    )} ${n(y - 18)} ${n(x)} ${n(y)}Z" fill="#6b7a56" opacity="${(0.24 + (i % 3) * 0.06).toFixed(2)}" stroke="#4c563c" stroke-width="1.6" stroke-opacity=".55"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const y = h * (0.12 + i * 0.09);
    const x = stemX + (flip ? -1 : 1) * (60 + i * 12);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(5 + R() * 6)}" fill="${
      i % 2 ? HUE.clay : HUE.ochre
    }" opacity=".34"/>`;
  }
  return svg(s, { w, h, defs: "" });
}
function bloom() {
  R = rng(31);
  let s = "";
  const cx = 260;
  const cy = 250;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const rx = 96 + R() * 26;
    const ry = 46 + R() * 14;
    const px = cx + Math.cos(a) * 82;
    const py = cy + Math.sin(a) * 82;
    s += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(rx)}" ry="${n(ry)}" transform="rotate(${n(
      (a * 180) / Math.PI
    )} ${n(px)} ${n(py)})" fill="${i % 2 ? HUE.clay : HUE.ochre}" opacity=".28" stroke="#7a5a3a" stroke-width="2" stroke-opacity=".72"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="46" fill="${HUE.earth}" opacity=".42"/>`;
  s += stroke(`M${cx - 46} ${cy}a46 46 0 1 0 92 0a46 46 0 1 0 -92 0`, { c: "#6d4c2b", w: 2 });
  for (let i = 0; i < 26; i++) {
    const a = R() * Math.PI * 2;
    const rr = R() * 38;
    s += `<circle cx="${n(cx + Math.cos(a) * rr)}" cy="${n(cy + Math.sin(a) * rr)}" r="${n(
      1.4 + R() * 2
    )}" fill="#6d4c2b" opacity=".4"/>`;
  }
  s += stroke(`M${cx} ${cy + 46}q-16 120 -40 214`, { c: "#5c6a4a", w: 4, o: 0.8 });
  s += `<path d="M${cx - 4} ${cy + 190}q-88 -30 -104 -104q92 6 104 104Z" fill="#6b7a56" opacity=".28" stroke="#4c563c" stroke-width="1.6" stroke-opacity=".5"/>`;
  return svg(s, { w: 520, h: 520, defs: "" });
}
function divider() {
  R = rng(11);
  const w = 1200;
  const h = 90;
  let s = stroke(hand(40, 46, w - 40, 46, 3.4), { c: INK, w: 1.8, o: 0.72 });
  s += stroke(hand(120, 56, w - 120, 56, 2.6), { c: INK, w: 1.1, o: 0.34 });
  const cx = w / 2;
  s += `<path d="M${cx} 20q46 20 0 50q-46 -30 0 -50Z" fill="${HUE.ochre}" opacity=".3" stroke="${INK}" stroke-width="1.6" stroke-opacity=".7"/>`;
  for (let i = 1; i <= 4; i++) {
    for (const dir of [-1, 1]) {
      const x = cx + dir * (70 + i * 62);
      s += `<path d="M${n(x)} ${n(46 - dir * 2)}q${dir * 26} -22 ${dir * 44} -4q-${dir * 22} 20 -${
        dir * 44
      } 4Z" fill="#6b7a56" opacity="${(0.3 - i * 0.05).toFixed(2)}" stroke="#4c563c" stroke-width="1.2" stroke-opacity=".4"/>`;
    }
  }
  return svg(s, { w, h, defs: "" });
}
/** the painted ground the whole page sits on */
function bgWash() {
  R = rng(5);
  const w = 1600;
  const h = 1200;
  let s = `<rect width="${w}" height="${h}" fill="#ece7dc"/>`;
  const blobs = [
    [200, 120, 620, 420, HUE.ochre, 0.13],
    [1050, 60, 640, 460, HUE.moss, 0.11],
    [560, 420, 780, 520, HUE.earth, 0.1],
    [-60, 620, 620, 480, HUE.clay, 0.08],
    [1120, 640, 620, 520, HUE.slate, 0.09],
  ];
  for (const b of blobs) s += wash(b[0], b[1], b[2], b[3], b[4], b[5], R() * 40 - 20);
  for (let i = 0; i < 520; i++) {
    s += `<circle cx="${n(R() * w)}" cy="${n(R() * h)}" r="${n(0.6 + R() * 1.7)}" fill="#6d5a3a" opacity="${n(
      0.02 + R() * 0.06
    )}"/>`;
  }
  return svg(s, {
    w,
    h,
    defs: `<defs><filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="70"/></filter></defs>`,
  });
}

/* ------------------------------------------------------------ write */
mkdirSync(OUT, { recursive: true });
PLATES.forEach((p, i) => {
  R = rng(101 + i * 17);
  const body = chrome(i + 1, p.date) + p.draw(page("l"), page("r"));
  writeFileSync(join(OUT, p.file), svg(body));
});
writeFileSync(join(OUT, "sprig-left.svg"), sprig(3, false));
writeFileSync(join(OUT, "sprig-right.svg"), sprig(19, true));
writeFileSync(join(OUT, "bloom.svg"), bloom());
writeFileSync(join(OUT, "divider.svg"), divider());
writeFileSync(join(OUT, "paper-wash.svg"), bgWash());
console.log(`wrote ${PLATES.length} plates + 5 trim pieces to public/sketchbook/`);
