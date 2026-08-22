/**
 * The sketchbook hero, as a plain DOM engine.
 *
 * The leaf that turns is a real curved surface: a chain of nested strips
 * whose tangent sweeps through an arc, so the page bends the way paper
 * bends instead of pivoting like a flat door. Everything below the React
 * layer is imperative on purpose — a page turn is a per-frame job and
 * re-rendering a strip chain sixty times a second would be silly.
 *
 * React owns the shell (arrows, tools, the index); this owns the book.
 */
import { PLATES, plateUrl, LANDING_PLATE, type Plate } from "./plates";

/** where the paper sits inside a plate SVG — must match the generator */
export const PAPER = { x0: 0.034, x1: 0.966, y0: 0.07, y1: 0.93 };
/** gutter → outer edge of the sheet, as a fraction of the spread */
const SPAN = PAPER.x1 - 0.5;
/** strips in the chain — enough for a smooth curve */
const N = 18;
/** peak curl of the arc, in radians */
const BETA = 0.6;

const TILT_X = 4.5;
const TILT_Y = 7;
export const ZOOM_MIN = 0.9;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 1.16;
/** how much bigger the page looks through the glass */
const MAG = 2.3;

export type Dir = "next" | "prev";

/** the class names the engine needs out of the CSS module */
export type SketchbookClasses = {
  intro: string;
  introDeep: string;
  sbFull: string;
  sbHalf: string;
  left: string;
  right: string;
  sbHalfImg: string;
  gutterShade: string;
  curl: string;
  next: string;
  prev: string;
  strip: string;
  edge: string;
  face: string;
  front: string;
  back: string;
  sh: string;
  gl: string;
  sbZone: string;
  sbPrev: string;
  sbNext: string;
  sbCaption: string;
  live: string;
  loupeOn: string;
  held: string;
};

export type SketchbookElements = {
  wrap: HTMLElement;
  stage: HTMLElement;
  /** the untransformed frame: the loupe lives here, the tilt happens inside */
  frame: HTMLElement;
  book: HTMLElement;
  captions: HTMLElement;
  zoomWrap: HTMLElement;
  zoomInner: HTMLElement;
  loupe: HTMLElement;
};

export type SketchbookOptions = {
  el: SketchbookElements;
  css: SketchbookClasses;
  /** the plate now facing up */
  onPlate: (index: number) => void;
  onZoom: (zoom: number) => void;
  /** first drag, tap, key or button — the hint can go away */
  onTouched: () => void;
  /** skip the opening riffle (used for reduced motion and small screens) */
  startAt?: number;
};

export type Sketchbook = {
  step: (dir: Dir) => void;
  goTo: (index: number) => void;
  zoomBy: (factor: number) => void;
  resetZoom: () => void;
  setLoupe: (on: boolean) => void;
  destroy: () => void;
};

const M = PLATES.length;
/** index into the ring of plates, without tripping noUncheckedIndexedAccess */
const plateAt = (i: number): Plate => PLATES[((i % M) + M) % M] as Plate;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export function createSketchbook(opts: SketchbookOptions): Sketchbook {
  const { el, css } = opts;
  const { wrap, stage, frame, book, captions, zoomWrap, zoomInner, loupe } = el;
  const reduced =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse =
    typeof matchMedia === "function" &&
    matchMedia("(max-width: 640px), (pointer: coarse)").matches;

  /** every listener taken out again on destroy */
  const bound: Array<() => void> = [];
  function on<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window,
    type: K | string,
    fn: (ev: never) => void,
    options?: AddEventListenerOptions
  ) {
    const handler = fn as EventListener;
    target.addEventListener(type, handler, options);
    bound.push(() => target.removeEventListener(type, handler, options));
  }

  let idx = 0;
  let turn: { dir: Dir; from: number; to: number; t: number } | null = null;
  let strips: HTMLElement[] = [];
  let dead = false;

  /* ------------------------------------------------------------ paint */
  const div = (cls: string) => {
    const d = document.createElement("div");
    d.className = cls;
    return d;
  };
  function halfEl(side: "left" | "right", plate: number) {
    const d = div(`${css.sbHalf} ${side === "left" ? css.left : css.right}`);
    const im = new Image();
    im.className = `${css.sbHalfImg} ${side === "left" ? css.left : css.right}`;
    im.draggable = false;
    im.alt = "";
    im.src = plateUrl(plateAt(plate));
    d.appendChild(im);
    d.appendChild(
      div(`${css.gutterShade} ${side === "left" ? css.left : css.right}`)
    );
    return d;
  }
  /** build the strip chain once per turn; the background offsets are pure
      geometry, so they never need touching again while it animates */
  function buildCurl(dir: Dir, from: number, to: number) {
    strips = [];
    const c = div(`${css.curl} ${dir === "next" ? css.next : css.prev}`);
    c.style.setProperty("--n", String(N));
    c.style.setProperty("--span", String(SPAN));
    let host: HTMLElement = c;
    for (let i = 0; i < N; i++) {
      const s = div(css.strip);
      const gut = "calc(var(--bw) * 0.5)";
      const sw = `calc(var(--bw) * ${SPAN} / ${N})`;
      const A = `calc(-1 * (${gut} + ${i} * ${sw}))`; /* faces the from-page */
      const B = `calc(${i + 1} * ${sw} - ${gut})`; /*   faces the to-page   */
      const f = div(`${css.face} ${css.front}`);
      const b = div(`${css.face} ${css.back}`);
      const dress = (e: HTMLElement, plate: number, px: string) => {
        e.style.backgroundImage = `url(${plateUrl(plateAt(plate))})`;
        e.style.backgroundPositionX = px;
      };
      dress(f, from, dir === "next" ? A : B);
      dress(b, to, dir === "next" ? B : A);
      for (const parent of [f, b]) {
        parent.appendChild(div(css.sh));
        parent.appendChild(div(css.gl));
      }
      s.appendChild(f);
      s.appendChild(b);
      if (i === N - 1) s.classList.add(css.edge);
      host.appendChild(s);
      host = s;
      strips.push(s);
    }
    return c;
  }
  function applyTurn(t: number) {
    const th = Math.PI * t; /* how far the leaf has swung */
    const beta = BETA * Math.sin(Math.PI * t); /* flat at both ends */
    const D = 180 / Math.PI;
    const tt = th + beta;
    const td = (2 * beta) / N;
    frame.style.setProperty("--tt", `${(tt * D).toFixed(2)}deg`);
    frame.style.setProperty("--td", `${(td * D).toFixed(3)}deg`);
    frame.style.setProperty("--shade", Math.sin(Math.PI * t).toFixed(3));
    fadeCaption(t);
    for (let i = 0; i < strips.length; i++) {
      const l1 = Math.abs(Math.cos(tt - i * td)); /* facing, at the near edge */
      const l2 = Math.abs(
        Math.cos(tt - (i + 1) * td)
      ); /* ...and the far edge */
      const st = (strips[i] as HTMLElement).style;
      st.setProperty("--lit", l1.toFixed(3));
      st.setProperty("--a1", ((1 - l1) * 0.62).toFixed(3));
      st.setProperty("--a2", ((1 - l2) * 0.62).toFixed(3));
    }
  }
  function paint() {
    book.textContent = "";
    if (!turn) {
      const f = div(css.sbFull);
      const im = new Image();
      im.src = plateUrl(plateAt(idx));
      im.alt = plateAt(idx).title;
      im.draggable = false;
      f.appendChild(im);
      book.appendChild(f);
      frame.style.setProperty("--shade", "0");
    } else {
      const fwd = turn.dir === "next";
      book.appendChild(halfEl("left", fwd ? turn.from : turn.to));
      book.appendChild(halfEl("right", fwd ? turn.to : turn.from));
      book.appendChild(buildCurl(turn.dir, turn.from, turn.to));
      applyTurn(turn.t);
    }
    const a = document.createElement("button");
    a.className = `${css.sbZone} ${css.sbPrev}`;
    a.setAttribute("aria-label", "previous plate");
    const b = document.createElement("button");
    b.className = `${css.sbZone} ${css.sbNext}`;
    b.setAttribute("aria-label", "next plate");
    book.appendChild(a);
    book.appendChild(b);
    layout();
    caption();
    opts.onPlate(turn ? turn.to : idx);
    syncZoomLayer();
    placeLoupe();
  }

  /* --------------------------------------------------------- captions */
  let capOut: HTMLElement | null = null;
  let capIn: HTMLElement | null = null;
  function caption() {
    captions.textContent = "";
    capOut = capIn = null;
    const p = document.createElement("p");
    if (turn) {
      capOut = p;
      capOut.className = `${css.sbCaption} ${css.live}`;
      capOut.textContent = plateAt(turn.from).title;
      capIn = document.createElement("p");
      capIn.className = `${css.sbCaption} ${css.live}`;
      capIn.textContent = plateAt(turn.to).title;
      captions.appendChild(capOut);
      captions.appendChild(capIn);
      fadeCaption(turn.t);
    } else {
      p.className = css.sbCaption;
      p.textContent = plateAt(idx).title;
      captions.appendChild(p);
    }
  }
  /** the old title is gone before the new one arrives, so the two never
      sit on top of each other mid-drag */
  function fadeCaption(t: number) {
    if (!capOut || !capIn) return;
    capOut.style.opacity = (1 - clamp((t - 0.1) / 0.28, 0, 1)).toFixed(3);
    capIn.style.opacity = clamp((t - 0.56) / 0.3, 0, 1).toFixed(3);
  }
  function layout() {
    frame.style.setProperty("--bw", `${book.clientWidth}px`);
  }

  /* ------------------------------------------------------ spring loop */
  type Spring =
    | {
        kind: "spring";
        v: number;
        target: number;
        done?: () => void;
        k: number;
        c: number;
      }
    | {
        kind: "tween";
        from: number;
        target: number;
        dur: number;
        e: number;
        done?: () => void;
      };
  let spring: Spring | null = null;
  let raf: number | null = null;
  let last = 0;

  function animateTo(target: number, done?: () => void, k = 150, c = 22) {
    spring = { kind: "spring", v: 0, target, done, k, c };
    kick();
  }
  /** the riffle wants a fixed tempo, not a spring settling time */
  function tweenTo(target: number, dur: number, done?: () => void) {
    spring = {
      kind: "tween",
      from: turn ? turn.t : 0,
      target,
      dur,
      e: 0,
      done,
    };
    kick();
  }
  function tick(now: number) {
    raf = null;
    if (dead) return;
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    if (spring && turn) {
      const s = spring;
      if (s.kind === "tween") {
        s.e += dt;
        const k = Math.min(1, s.e / s.dur);
        turn.t = s.from + (s.target - s.from) * k;
        applyTurn(turn.t);
        if (k >= 1) {
          spring = null;
          s.done?.();
        }
      } else {
        const x = turn.t - s.target;
        s.v += (-s.k * x - s.c * s.v) * dt;
        turn.t += s.v * dt;
        if (Math.abs(turn.t - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
          turn.t = s.target;
          spring = null;
          applyTurn(turn.t);
          s.done?.();
        } else applyTurn(turn.t);
      }
    }
    viewSpring();
    const lmoved = loupeEase();
    /* kick() may already have queued the next frame from a done-callback */
    if ((spring || viewActive || lmoved) && raf === null)
      raf = requestAnimationFrame(tick);
  }
  function kick() {
    if (raf === null && !dead) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  /* ------------------------------------------- tilt + zoom of the book */
  const view = { rx: 0, ry: 0, z: 1, trx: 0, try_: 0, tz: 1 };
  let viewActive = false;
  let lastZ = 1;
  function applyView() {
    frame.style.setProperty("--rx", `${view.rx.toFixed(2)}deg`);
    frame.style.setProperty("--ry", `${view.ry.toFixed(2)}deg`);
    frame.style.setProperty("--zoom", view.z.toFixed(3));
    /* the glass stays put, but the page under it has moved */
    if (view.z !== lastZ) {
      lastZ = view.z;
      placeLoupe();
    }
  }
  function viewSpring() {
    const e = 0.14;
    let moved = false;
    const pairs: Array<["rx" | "ry" | "z", "trx" | "try_" | "tz"]> = [
      ["rx", "trx"],
      ["ry", "try_"],
      ["z", "tz"],
    ];
    for (const [k, t] of pairs) {
      const d = view[t] - view[k];
      if (Math.abs(d) > 0.0006) {
        view[k] += d * e;
        moved = true;
      } else view[k] = view[t];
    }
    if (moved) applyView();
    viewActive = moved;
    return moved;
  }
  function setView(rx: number, ry: number, z: number) {
    view.trx = clamp(rx, -TILT_X, TILT_X);
    view.try_ = clamp(ry, -TILT_Y, TILT_Y);
    view.tz = clamp(z, ZOOM_MIN, ZOOM_MAX);
    viewActive = true;
    kick();
    opts.onZoom(view.tz);
  }
  /** the book leans toward the cursor — no dragging, and never far */
  function tiltTo(cx: number, cy: number) {
    if (drag) return; /* hold still while a page is being turned */
    const r = book.getBoundingClientRect();
    if (!r.width) return;
    const nx = clamp((cx - (r.left + r.width / 2)) / (r.width * 0.62), -1, 1);
    const ny = clamp((cy - (r.top + r.height / 2)) / (r.height * 0.9), -1, 1);
    setView(-ny * TILT_X, nx * TILT_Y, view.tz);
  }

  /* ------------------------------------------------------- the loupe */
  const zoomOn = () => loupeOn && !coarse;
  let loupeOn = !coarse;
  let lx: number | null = null;
  let ly = 0;
  let lgrab: { cx: number; cy: number; lx0: number; ly0: number } | null = null;
  let lTarget: { x: number; y: number } | null = null;

  const loupeSize = () => Math.round(clamp(book.clientWidth * 0.235, 165, 262));
  const bookBox = () => ({
    x: 0,
    y: 0,
    w: book.clientWidth,
    h: book.clientHeight,
  });
  /** park it on the desk at the lower right, half off the book */
  function restLoupe() {
    const b = bookBox();
    lx = b.x + b.w * 0.88;
    ly = b.y + b.h * 0.855;
    placeLoupe();
  }
  /** mirror whatever the book is showing into the magnified copy */
  function syncZoomLayer() {
    zoomInner.textContent = "";
    for (const c of Array.from(book.children)) {
      if (c.classList.contains(css.sbZone))
        continue; /* hit targets need no copy */
      zoomInner.appendChild(c.cloneNode(true));
    }
  }
  /**
   * The glass sits above the tilt, in the book's untransformed pixels, so the
   * lean of the page never nudges it. What the tilt does change is which part
   * of the paper is under the glass, and only the scale matters enough to
   * correct for: the book is drawn about its own centre.
   */
  function placeLoupe() {
    if (lx === null) return;
    const B = bookBox();
    const bw = B.w;
    const bh = B.h;
    if (!bw) return;
    const R = loupeSize() / 2;
    const bez = R * 2 * 0.058;
    loupe.style.setProperty("--lr", `${R * 2}px`);
    loupe.style.transform = `translate3d(${(lx - R).toFixed(1)}px,${(
      ly - R
    ).toFixed(1)}px,0)`;
    loupe.classList.toggle(css.loupeOn, zoomOn());

    /* where the paper's edges actually land once the book is scaled */
    const z = view.z;
    const cx = bw / 2;
    const cy = bh / 2;
    const x0 = cx + (bw * PAPER.x0 - cx) * z;
    const x1 = cx + (bw * PAPER.x1 - cx) * z;
    const y0 = cy + (bh * PAPER.y0 - cy) * z;
    const y1 = cy + (bh * PAPER.y1 - cy) * z;
    /* How far the glass's own centre is inside the paper. The copy fades out
       as it wanders off the sheet, so you are left looking through plain
       glass rather than at a sliver of page on flat desk. */
    const nx = clamp(lx, x0, x1);
    const ny = clamp(ly, y0, y1);
    const inside =
      lx > x0 && lx < x1 && ly > y0 && ly < y1
        ? Math.min(lx - x0, x1 - lx, ly - y0, y1 - ly)
        : -Math.hypot(lx - nx, ly - ny);
    const k = clamp((inside + R * 0.3) / (R * 0.55), 0, 1);

    zoomWrap.style.opacity = (zoomOn() ? k : 0).toFixed(3);
    if (k <= 0.002) return;
    const r = (R - bez).toFixed(1);
    const mask = `radial-gradient(circle ${r}px at ${lx.toFixed(
      1
    )}px ${ly.toFixed(1)}px,#000 calc(100% - 1px),transparent 100%)`;
    zoomWrap.style.webkitMaskImage = mask;
    zoomWrap.style.maskImage = mask;
    /* the page point beneath the glass, magnified about that same spot so the
       lens keeps showing MAG times whatever is on screen */
    const px = cx + (lx - cx) / z;
    const py = cy + (ly - cy) / z;
    const s = MAG * z;
    zoomInner.style.transform = `translate(${(lx - px * s).toFixed(1)}px,${(
      ly -
      py * s
    ).toFixed(1)}px) scale(${s.toFixed(4)})`;
  }
  /** the leaf shoves the glass aside as it sweeps past */
  function shoveLoupe(dir: Dir) {
    if (!zoomOn() || lx === null || lgrab) return;
    const b = bookBox();
    /* which page point the glass covers, once the book's scale is undone */
    const nx = (b.w / 2 + (lx - b.x - b.w / 2) / view.z) / b.w;
    const ny = (b.h / 2 + (ly - b.y - b.h / 2) / view.z) / b.h;
    if (nx < 0.02 || nx > 0.98 || ny < 0.06 || ny > 0.94)
      return; /* already clear */
    lTarget = {
      x: b.x + b.w * (dir === "next" ? 0.12 : 0.88),
      y: b.y + b.h * 0.855,
    };
    kick();
  }
  function loupeEase() {
    if (!lTarget || lx === null) return false;
    if (lgrab) {
      lTarget = null;
      return false;
    }
    const dx = lTarget.x - lx;
    const dy = lTarget.y - ly;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      lx = lTarget.x;
      ly = lTarget.y;
      lTarget = null;
      placeLoupe();
      return false;
    }
    lx += dx * 0.17;
    ly += dy * 0.17;
    placeLoupe();
    return true;
  }

  /* ------------------------------------------------------ turn control */
  function startTurn(dir: Dir, t: number) {
    spring = null;
    if (turn) {
      idx = turn.to;
      turn = null;
    } /* settle anything still in flight */
    shoveLoupe(dir);
    const from = idx;
    turn = {
      dir,
      from,
      to: dir === "next" ? (from + 1) % M : (from - 1 + M) % M,
      t: t || 0,
    };
    paint();
  }
  function commit() {
    if (!turn) return;
    if (reduced) {
      idx = turn.to;
      turn = null;
      paint();
      return;
    }
    animateTo(
      1,
      () => {
        if (!turn) return;
        idx = turn.to;
        turn = null;
        paint();
      },
      170,
      26
    );
  }
  function cancel() {
    if (!turn) return;
    animateTo(
      0,
      () => {
        turn = null;
        paint();
      },
      150,
      24
    );
  }
  function step(dir: Dir) {
    endIntro();
    if (turn) {
      idx = turn.to;
      turn = null;
    }
    startTurn(dir, 0);
    commit();
  }
  function goTo(i: number) {
    endIntro();
    if (i === idx) return;
    if (turn) {
      idx = turn.to;
      turn = null;
    }
    const fwd = (i - idx + M) % M;
    const back = (idx - i + M) % M;
    if (Math.min(fwd, back) === 1) {
      step(fwd === 1 ? "next" : "prev");
      return;
    }
    idx = i;
    paint();
  }

  /* ------------------------------------------------------ pointer work */
  let drag: {
    dir: Dir;
    x0: number;
    w: number;
    moved: number;
    vel: number;
    tPrev: number;
  } | null = null;

  on(stage, "pointerdown", (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault(); /* no text selection, no image drag */
    const onBook = (e.target as HTMLElement).closest(`.${css.sbZone}`);
    stage.setPointerCapture(e.pointerId);
    opts.onTouched();
    if (!onBook || introOn) return;
    const r = book.getBoundingClientRect();
    const dir: Dir = (e.clientX - r.left) / r.width > 0.5 ? "next" : "prev";
    startTurn(dir, 0);
    drag = {
      dir,
      x0: e.clientX,
      w: r.width,
      moved: 0,
      vel: 0,
      tPrev: performance.now(),
    };
  });
  on(stage, "pointermove", (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    const raw = (drag.dir === "next" ? -dx : dx) / (drag.w * 0.62);
    const t = clamp(raw, 0, 1);
    const now = performance.now();
    drag.vel =
      (t - (turn ? turn.t : 0)) / Math.max(0.001, (now - drag.tPrev) / 1000);
    drag.tPrev = now;
    if (turn) {
      turn.t = t;
      applyTurn(t);
    }
  });
  function endDrag() {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!turn) return;
    if (d.moved < 6) {
      commit(); /* a tap, not a drag */
      return;
    }
    if (turn.t > 0.42 || d.vel > 1.1) commit();
    else cancel();
  }
  on(stage, "pointerup", endDrag);
  on(stage, "pointercancel", endDrag);
  on(stage, "dragstart", (e: Event) => e.preventDefault());
  on(stage, "selectstart", (e: Event) => e.preventDefault());
  /* the wheel belongs to the page — zoom is on the toolbar, or a double
     click to come back to 100% */
  on(stage, "dblclick", () => setView(view.trx, view.try_, 1));

  on(
    window,
    "pointermove",
    (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tiltTo(e.clientX, e.clientY);
    },
    { passive: true } as AddEventListenerOptions
  );
  on(window, "pointerout", (e: PointerEvent) => {
    if (!e.relatedTarget) setView(0, 0, view.tz);
  });
  on(window, "blur", () => setView(0, 0, view.tz));
  on(window, "resize", () => {
    layout();
    lx = null;
    restLoupe();
  });
  on(window, "keydown", (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
    )
      return;
    /* only while the book is somewhere on screen */
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    e.preventDefault();
    opts.onTouched();
    step(e.key === "ArrowRight" ? "next" : "prev");
  });

  on(loupe, "pointerdown", (e: PointerEvent) => {
    if (!zoomOn() || e.button !== 0 || lx === null) return;
    e.preventDefault();
    e.stopPropagation(); /* never starts a page turn */
    lTarget = null;
    lgrab = { cx: e.clientX, cy: e.clientY, lx0: lx, ly0: ly };
    loupe.classList.add(css.held);
    loupe.setPointerCapture(e.pointerId);
    opts.onTouched();
  });
  on(loupe, "pointermove", (e: PointerEvent) => {
    if (!lgrab) return;
    const b = bookBox();
    const R = loupeSize() / 2;
    /* the glass carries none of the book's transform, so the cursor maps 1:1 */
    lx = clamp(
      lgrab.lx0 + (e.clientX - lgrab.cx),
      b.x - R * 0.7,
      b.x + b.w + R * 0.7
    );
    ly = clamp(
      lgrab.ly0 + (e.clientY - lgrab.cy),
      b.y - R * 0.7,
      b.y + b.h + R
    );
    placeLoupe();
  });
  const dropLoupe = () => {
    lgrab = null;
    loupe.classList.remove(css.held);
  };
  on(loupe, "pointerup", dropLoupe);
  on(loupe, "pointercancel", dropLoupe);

  /* ---------------------------------------------------------- riffle */
  let riffle: Array<{ bell: number; dur: number }> = [];
  let riffleAt = 0;
  let introOn = false;
  function endIntro() {
    if (!introOn) return;
    introOn = false;
    wrap.classList.remove(css.intro, css.introDeep);
    /* the riffle shoved the glass aside on every turn — put it back down */
    if (!lgrab) restLoupe();
  }
  function riffleStep() {
    const s = riffle[riffleAt];
    if (!s) {
      endIntro();
      paint();
      return;
    }
    wrap.classList.toggle(css.introDeep, s.bell > 0.55);
    startTurn("next", 0);
    tweenTo(1, s.dur, () => {
      if (!turn) return;
      idx = turn.to;
      turn = null;
      riffleAt++;
      if (introOn && riffleAt < riffle.length) {
        paint();
        riffleStep();
      } else {
        endIntro();
        paint();
      }
    });
  }
  function startIntro() {
    if (coarse || reduced) {
      idx = LANDING_PLATE;
      paint();
      return;
    }
    const steps = M + LANDING_PLATE;
    riffle = [];
    for (let r = 0; r < steps; r++) {
      const bell = Math.sin(Math.PI * (r / (steps - 1)));
      riffle.push({ bell, dur: 0.26 - 0.19 * bell });
    }
    riffleAt = 0;
    introOn = true;
    wrap.classList.add(css.intro);
    riffleStep();
  }

  /* ------------------------------------------------------------ boot */
  let introTimer: ReturnType<typeof setTimeout> | null = null;
  idx = opts.startAt ?? 0;
  paint();
  applyView();
  opts.onZoom(view.tz);
  restLoupe();
  void Promise.all(
    PLATES.map((p) => {
      const im = new Image();
      im.src = plateUrl(p);
      return im.decode
        ? im.decode().catch(() => undefined)
        : new Promise<void>((res) => {
            im.onload = im.onerror = () => res();
          });
    })
  ).then(() => {
    if (dead) return;
    restLoupe();
    introTimer = setTimeout(startIntro, 220);
  });

  return {
    step,
    goTo,
    zoomBy: (factor) => setView(view.trx, view.try_, view.tz * factor),
    resetZoom: () => setView(view.trx, view.try_, 1),
    setLoupe: (isOn) => {
      loupeOn = isOn;
      if (isOn && lx === null) restLoupe();
      loupe.classList.toggle(css.loupeOn, zoomOn());
      placeLoupe();
    },
    destroy: () => {
      dead = true;
      if (raf !== null) cancelAnimationFrame(raf);
      if (introTimer) clearTimeout(introTimer);
      for (const off of bound) off();
    },
  };
}
