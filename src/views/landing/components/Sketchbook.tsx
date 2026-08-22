import { useCallback, useEffect, useRef, useState } from "react";

import {
  createSketchbook,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type Sketchbook as Engine,
  type SketchbookClasses,
} from "../sketchbookEngine";
import styles from "./Sketchbook.module.css";

/** CSS-module lookups are `string | undefined`, so join the ones that stuck */
const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(" ");

type Props = {
  /** fires with the plate now facing up, so the index can follow along */
  onPlate?: (index: number) => void;
  /** handed the engine once it is running, and null when it is torn down */
  onReady?: (engine: Engine | null) => void;
};

/**
 * The hero: an open sketchbook you can turn, lean, zoom and read through a
 * magnifying glass. React draws the shell and the controls; everything
 * inside the book is the engine's, because a page turn is a per-frame job.
 */
const Sketchbook = ({ onPlate, onReady }: Props) => {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const book = useRef<HTMLDivElement>(null);
  const captions = useRef<HTMLDivElement>(null);
  const zoomWrap = useRef<HTMLDivElement>(null);
  const zoomInner = useRef<HTMLDivElement>(null);
  const loupe = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);

  const [zoom, setZoom] = useState(1);
  const [loupeOn, setLoupeOn] = useState(true);
  const [touched, setTouched] = useState(false);

  /* the callbacks are read through refs so the engine is built exactly once */
  const cb = useRef({ onPlate, onReady });
  cb.current = { onPlate, onReady };

  useEffect(() => {
    const el = {
      wrap: wrap.current,
      stage: stage.current,
      frame: frame.current,
      book: book.current,
      captions: captions.current,
      zoomWrap: zoomWrap.current,
      zoomInner: zoomInner.current,
      loupe: loupe.current,
    };
    if (Object.values(el).some((node) => node === null)) return;

    const sb = createSketchbook({
      el: el as Parameters<typeof createSketchbook>[0]["el"],
      css: styles as unknown as SketchbookClasses,
      onPlate: (i) => cb.current.onPlate?.(i),
      onZoom: setZoom,
      onTouched: () => setTouched(true),
    });
    engine.current = sb;
    cb.current.onReady?.(sb);
    return () => {
      sb.destroy();
      engine.current = null;
      cb.current.onReady?.(null);
    };
  }, []);

  const toggleLoupe = useCallback(() => {
    setLoupeOn((on) => {
      engine.current?.setLoupe(!on);
      return !on;
    });
    setTouched(true);
  }, []);
  const nudgeZoom = useCallback((factor: number) => {
    engine.current?.zoomBy(factor);
    setTouched(true);
  }, []);

  return (
    <div className={styles.wrap} ref={wrap}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="sb-mblur-1">
          <feGaussianBlur stdDeviation="5 0" />
        </filter>
        <filter id="sb-mblur-2">
          <feGaussianBlur stdDeviation="14 0" />
        </filter>
      </svg>

      <div className={styles.stage} ref={stage}>
        <button
          className={cx(styles.arrow, styles.left)}
          aria-label="previous plate"
          onClick={() => {
            engine.current?.step("prev");
            setTouched(true);
          }}
        >
          <svg
            viewBox="0 0 14 44"
            width="14"
            height="44"
            fill="none"
            aria-hidden="true"
          >
            <polyline
              points="11,3 3,22 11,41"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.frame} ref={frame}>
          <div className={styles.tilt}>
            <div
              className={cx(styles.cast, styles.ambient)}
              aria-hidden="true"
            />
            <div
              className={cx(styles.cast, styles.contact)}
              aria-hidden="true"
            />
            <div
              className={cx(styles.cast, styles.hairline)}
              aria-hidden="true"
            />
            <div className={styles.book} ref={book} />
          </div>
          <div className={styles.zoomwrap} ref={zoomWrap} aria-hidden="true">
            <div className={styles.zoominner} ref={zoomInner} />
          </div>
          <div className={styles.loupe} ref={loupe}>
            <span className={styles.grip} />
            <span className={styles.ring}>
              <span className={styles.lens} />
            </span>
          </div>
        </div>

        <button
          className={cx(styles.arrow, styles.right)}
          aria-label="next plate"
          onClick={() => {
            engine.current?.step("next");
            setTouched(true);
          }}
        >
          <svg
            viewBox="0 0 14 44"
            width="14"
            height="44"
            fill="none"
            aria-hidden="true"
          >
            <polyline
              points="3,3 11,22 3,41"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles.captions} ref={captions} />

      <div className={styles.tools} role="group" aria-label="view controls">
        <button
          className={styles.tool}
          aria-label="zoom out"
          disabled={zoom <= ZOOM_MIN + 0.001}
          onClick={() => nudgeZoom(1 / ZOOM_STEP)}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="8.6" cy="8.6" r="5.6" />
            <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8" />
          </svg>
        </button>
        <span className={styles.zoomRead}>{Math.round(zoom * 100)}%</span>
        <button
          className={styles.tool}
          aria-label="zoom in"
          disabled={zoom >= ZOOM_MAX - 0.001}
          onClick={() => nudgeZoom(ZOOM_STEP)}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="8.6" cy="8.6" r="5.6" />
            <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8M8.6 6.2v4.8" />
          </svg>
        </button>
        <span className={styles.toolSep} aria-hidden="true" />
        <button
          className={styles.tool}
          aria-label="magnifier"
          aria-pressed={loupeOn}
          onClick={toggleLoupe}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="8.8" cy="8.8" r="5.8" />
            <path d="M13 13l4.4 4.4" />
            <path d="M6.4 7.2a3.2 3.2 0 0 1 2.4-1.4" opacity=".55" />
          </svg>
        </button>
      </div>

      <p className={cx(styles.hint, touched && styles.hintGone)}>
        Drag the page to turn
        <span className={styles.hintGlass}> · Drag the glass across it</span>
      </p>
    </div>
  );
};

export default Sketchbook;
