import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { between, usePrefersReducedMotion } from "../Support/DrawingSupport.jsx";
import { mulberry32 } from "../Support/Seed.jsx";
import { buildRectanglePath, buildRoundPath, buildVariableRadiusPath } from "../Support/Paths.jsx";

export default function HandDrawnContainer({
  children,
  shape = "rounded", // "rounded" | "rectangle" | "navLeft" | "navRight" | "pill"
  borderRadius = 16,
  seed,
  color = "currentColor",
  strokeWidth = 2,
  roughness = 2.5,
  passes = 2,
  overshoot = 6,
  inset = 0,
  padding = 8,
  animate = "none",
  fps = 8,
  drawn = true,
  drawIn = false,
  drawDuration = 0.8,
  backgroundColor,
  backgroundColours,
  backgroundColors,
  isTransparent = false,
  transparentOpacity = 0.15, // fill opacity used when isTransparent is true
  as: Tag = "div",
  className,
  style,
}) {
  const ref = useRef(null);
  const baseSeed = useRef(seed ?? Math.floor(Math.random() * 1e9));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(drawIn ? false : drawn);
  const reduced = usePrefersReducedMotion();

  if (seed !== undefined) baseSeed.current = seed;

  const resolvedBg = backgroundColor ?? backgroundColours ?? backgroundColors;
  const bgOpacity = isTransparent ? transparentOpacity : 1;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const paths = useMemo(() => {
    if (!size.w || !size.h) return [];
    const count = Math.min(4, Math.max(1, Math.round(passes)));
    const out = [];
    for (let i = 0; i < count; i++) {
      const rand = mulberry32(baseSeed.current + i * 7919 + tick * 104729);

      let d = "";
      if (shape === "navLeft") {
        d = buildVariableRadiusPath(size.w, size.h, "left", inset, roughness, overshoot, rand);
      } else if (shape === "navRight") {
        d = buildVariableRadiusPath(size.w, size.h, "right", inset, roughness, overshoot, rand);
      } else if (shape === "rounded" || shape === "pill") {
        const radius = shape === "pill" ? 999 : borderRadius;
        d = buildRoundPath(size.w, size.h, radius, inset, roughness, overshoot, rand);
      } else if (shape === "rectangle") {
        d = buildRectanglePath(size.w, size.h, inset, roughness, overshoot, rand);
      } else {
        d = buildVariableRadiusPath(size.w, size.h, borderRadius, inset, roughness, overshoot, rand);
      }

      out.push({
        d,
        opacity: i === 0 ? 1 : between(rand, 0.45, 0.8),
        width: strokeWidth * (i === 0 ? 1 : between(rand, 0.6, 0.9)),
      });
    }
    return out;
  }, [size.w, size.h, shape, borderRadius, inset, roughness, overshoot, passes, strokeWidth, tick]);

  const transition = reduced ? "none" : `stroke-dashoffset ${drawDuration}s cubic-bezier(0.45, 0, 0.25, 1)`;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        padding,
        ...style,
      }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <svg
        aria-hidden="true"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: -1,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        {resolvedBg && paths[0] && (
          <path
            d={paths[0].d}
            fill={resolvedBg}
            fillOpacity={bgOpacity}
            stroke="none"
          />
        )}
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            pathLength="1"
            fill="none"
            stroke={color}
            strokeWidth={p.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={p.opacity}
            strokeDasharray="1 1"
            strokeDashoffset={visible ? 0 : 1}
            style={{ transition, transitionDelay: reduced ? "0s" : `${i * 0.12}s` }}
          />
        ))}
      </svg>
      {children}
    </Tag>
  );
}