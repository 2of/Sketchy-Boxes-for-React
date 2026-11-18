


import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";


import { squigglePath } from "../Support/Paths";
import { mulberry32 } from "../Support/Seed";
import { usePrefersReducedMotion } from "../Support/DrawingSupport";
import { between } from "../Support/DrawingSupport";
import { spread } from "../Support/DrawingSupport";

import { smooth } from "../Support/DrawingSupport";



// import { squigglePath } from "../../../containers/art/handdrawncontainer/Support/Paths.jsx";
// import { mulberry32 } from "../../../containers/art/handdrawncontainer/Support/Seed.jsx";
// import { between } from "../../../containers/art/handdrawncontainer/Support/DrawingSupport.jsx";
// import { usePrefersReducedMotion } from "../../../containers/art/handdrawncontainer/Support/DrawingSupport.jsx";
// import { spread } from "../../../containers/art/handdrawncontainer/Support/DrawingSupport.jsx";
const FONT_CLASS = "handdrawn-font";
// import { smooth } from "../../../containers/art/handdrawncontainer/Support/DrawingSupport.jsx";
const EASE = "var(--ease-decelerate, cubic-bezier(0, 0, 0.2, 1))";

export default function HandDrawnHeader({
  children,
  size: sizeName,


  seed,
  color = "var(--text-primary, currentColor)",
  jitter = 1,
  
  
  
  wobble,
  doubleStroke = true,
  underline = "none",
  
  
  underlineColor = "var(--accent, currentColor)",
  underlineWidth,
  underlineGap,
  
  
  highlight,
  highlightOpacity = 0.3,
  animate = "none",
  fps = 10,
  drawn = true,
  drawIn = false,
  drawDuration = 1.2,
  as: Tag = "h2",
  className,
  style,
}) {
  const text = Array.isArray(children) ? children.join("") : String(children ?? "");
  const innerRef = useRef(null);
  const base = useRef(seed ?? Math.floor(Math.random() * 1e9));
  const highlightColor = highlight === true ? "var(--accent, currentColor)" : highlight;
  const filterId = `hdh-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [size, setSize] = useState({ w: 0, h: 0, fs: 32 });
  const [tick, setTick] = useState(0);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(drawIn ? false : drawn);
  const reduced = usePrefersReducedMotion();

  if (seed !== undefined) base.current = seed;

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({
        w: el.offsetWidth,
        h: el.offsetHeight,
        fs: parseFloat(getComputedStyle(el).fontSize) || 32,
      });
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  useEffect(() => {
    if (reduced) {
      setVisible(drawn);
      return;
    }
    const id = requestAnimationFrame(() => setVisible(drawn));
    return () => cancelAnimationFrame(id);
  }, [drawn, reduced]);

  const boiling = !reduced && (animate === "boil" || (animate === "hover" && active));
  useEffect(() => {
    if (!boiling) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000 / Math.max(1, fps));
    return () => clearInterval(id);
  }, [boiling, fps]);

  const words = useMemo(() => {
    const rand = mulberry32(base.current + tick * 104729);
    let index = 0;
    return text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) =>
        [...word].map((char) => ({
          char,
          index: index++,
          rotate: spread(rand, 3.2 * jitter),
          dy: spread(rand, 0.05 * jitter),
          dx: spread(rand, 0.015 * jitter),
          scale: 1 + spread(rand, 0.05 * jitter),
          ghostX: spread(rand, 0.035),
          ghostY: spread(rand, 0.035),
        }))
      );
  }, [text, tick, jitter]);

  const total = words.reduce((n, w) => n + w.length, 0) || 1;
  const stagger = drawDuration / total;
  const letterDuration = Math.max(0.12, stagger * 2.2);

  const fs = size.fs;
  const wob = wobble ?? fs * 0.06;
  const uWidth = underlineWidth ?? Math.max(1.5, fs * 0.075);
  const uGap = underlineGap ?? fs * 0.05;
  const ghostStroke = Math.max(0.75, fs * 0.025);
  const noiseFreq = (1.4 / fs).toFixed(4);

  const decor = useMemo(() => {




     ///// save 
    if (!size.w || !size.h) return null;
    const rand = mulberry32(base.current + 555 + tick * 7907);
    const y = size.h + uGap;
    let lines = [];
    if (underline === "line") lines = [linePath(size.w, y, rand, fs * 0.06, fs * 0.2)];
    if (underline === "double")
      lines = [
        linePath(size.w, y, rand, fs * 0.06, fs * 0.2),
        linePath(size.w, y + uWidth * 2.2, rand, fs * 0.07, fs * 0.15),
      ];
    if (underline === "squiggle") lines = [squigglePath(size.w, y + fs * 0.05, rand, fs * 0.09, fs * 0.35)];

    let mark = null;
    if (highlightColor) {
      const my = size.h * 0.62;
      mark = smooth([
        { x: -fs * 0.15, y: my + spread(rand, fs * 0.07) },
        { x: size.w * 0.35, y: my + spread(rand, fs * 0.1) },
        { x: size.w * 0.7, y: my + spread(rand, fs * 0.1) },
        { x: size.w + fs * 0.15, y: my + spread(rand, fs * 0.07) },
      ]);
    }
    return { lines, mark, markWidth: size.h * 0.55 };
  }, [size.w, size.h, fs, underline, uGap, uWidth, highlightColor, tick]);

  const drawTransition = (delay) =>
    reduced ? "none" : `stroke-dashoffset ${Math.max(0.3, drawDuration * 0.5)}s ${EASE} ${delay}s`;

  const svgStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
    pointerEvents: "none",
  };

  return (
    <Tag
      className={[FONT_CLASS, sizeName && `${FONT_CLASS}--${sizeName}`, className].filter(Boolean).join(" ")}
      aria-label={text}
      style={{ margin: 0, ...style }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id={filterId} x="-5%" y="-15%" width="110%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={noiseFreq}
            numOctaves="2"
            seed={(base.current % 1000) + (tick % 997)}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={wob} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <span ref={innerRef} style={{ position: "relative", display: "inline-block", color }}>
        {decor?.mark && (
          <svg width={size.w} height={size.h} aria-hidden="true" style={{ ...svgStyle, zIndex: 0 }}>
            <path
              d={decor.mark}
              pathLength="1"
              fill="none"
              strokeWidth={decor.markWidth}
              strokeLinecap="round"
              strokeOpacity={highlightOpacity}
              strokeDasharray="1 1"
              strokeDashoffset={visible ? 0 : 1}
              style={{ stroke: highlightColor, transition: drawTransition(0) }}
            />
          </svg>
        )}

        <span aria-hidden="true" style={{ position: "relative", zIndex: 1, filter: wob > 0 ? `url(#${filterId})` : undefined }}>
          {words.map((word, wi) => (
            <span
              key={wi}
              style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: wi < words.length - 1 ? "0.28em" : 0 }}
            >










              {word.map((l) => (
                <span
                  key={l.index}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    transform: `translate(${l.dx}em, ${l.dy}em) rotate(${l.rotate}deg) scale(${l.scale})`,
                    transformOrigin: "50% 80%",
                    clipPath: visible ? "inset(-30% -20% -30% -20%)" : "inset(-30% 120% -30% -20%)",
                    transition: reduced ? "none" : `clip-path ${letterDuration}s ${EASE} ${l.index * stagger}s`,
                  }}
                >


                  {doubleStroke && (
                    <span
                      style={{
                        position: "absolute",
                        left: `${l.ghostX}em`,
                        top: `${l.ghostY}em`,
                        color: "transparent",
                        WebkitTextStroke: `${ghostStroke}px currentColor`,
                        opacity: 0.45,
                      }}
                    >
                      {l.char}
                    </span>
                  )}
                  {l.char}
                </span>
              ))}
            </span>
          ))}
        </span>

        {decor?.lines.length > 0 && (
          <svg width={size.w} height={size.h} aria-hidden="true" style={{ ...svgStyle, zIndex: 2 }}>
            {decor.lines.map((d, i) => (
              <path
                key={i}
                d={d}
                pathLength="1"
                fill="none"
                strokeWidth={uWidth * (i === 0 ? 1 : 0.75)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1 1"
                strokeDashoffset={visible ? 0 : 1}
                style={{ stroke: underlineColor, transition: drawTransition(drawDuration * 0.7 + i * 0.15) }}
              />
            ))}
          </svg>
        )}
      </span>
    </Tag>
  );
}
