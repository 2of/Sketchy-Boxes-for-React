
import { between, spread, smooth, usePrefersReducedMotion }  from "../Support/DrawingSupport.jsx";
import { mulberry32 } from "../Support/Seed.jsx";



import React, { useLayoutEffect, useMemo, useRef, useState } from "react";


const BOX = 12; // cross-axis room for the wobble, in px

const buildStroke = (seed, length, rough, overshoot, horizontal, pass) => {
  // different stream per pass so the second stroke doesn't trace the first
  const rand = mulberry32(seed + pass * 7919);

  const a0 = -between(rand, 0, overshoot);
  const a1 = length + between(rand, 0, overshoot);
  const n = Math.max(3, Math.round((a1 - a0) / 11));
  const tilt = spread(rand, rough);
  const mid = BOX / 2;

  let drift = 0;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    drift = drift * 0.6 + spread(rand, rough * 0.5);
    const along = a0 + (a1 - a0) * t;
    const across = mid + tilt * (t - 0.5) + drift;
    pts.push(horizontal ? { x: along, y: across } : { x: across, y: along });
  }
  return smooth(pts);
};

const HandDrawnDivider = ({
  seed = 1,
  visible = true,
  horizontal = false,
  length = 44, // fallback only; the real length is measured from the parent
  trim = 3, // px kept clear at each end of the parent
  rough = 1.2,
  overshoot = 2,
  strokeWidth = 2.6,
  passes = 2,
  color = "var(--text-primary)"
}) => {
  const reduced = usePrefersReducedMotion();
  const svgRef = useRef(null);
  const [measured, setMeasured] = useState(null);

  // Span the full height (or width, when horizontal) of the divider's box, which the
  // stylesheet stretches to match the tallest cluster in the platter.
  useLayoutEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return undefined;
    const read = () => {
      const r = el.getBoundingClientRect();
      const size = Math.round(horizontal ? r.width : r.height);
      setMeasured(size > 0 ? size : null);
    };
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [horizontal]);

  const len = measured ? Math.max(12, measured - trim * 2) : length;

  const paths = useMemo(
    () =>
      Array.from({ length: passes }, (_, p) =>
        buildStroke(seed, len, rough, overshoot, horizontal, p)
      ),
    [seed, len, rough, overshoot, horizontal, passes]
  );

  const width = horizontal ? len : BOX;
  const height = horizontal ? BOX : len;

  const svgStyle = horizontal
    ? { left: trim, top: "50%", transform: "translateY(-50%)" }
    : { top: trim, left: "50%", transform: "translateX(-50%)" };

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", overflow: "visible", pointerEvents: "none", ...svgStyle }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke={color}
          strokeWidth={i === 0 ? strokeWidth : strokeWidth * 0.55}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={i === 0 ? 1 : 0.6}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: visible ? 0 : 1,
            transition: reduced
              ? "none"
              : `stroke-dashoffset 0.35s ease ${i * 0.06}s`
          }}
        />
      ))}
    </svg>
  );
};

export default HandDrawnDivider;