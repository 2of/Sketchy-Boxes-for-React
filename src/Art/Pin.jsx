import { mulberry32 } from "../Support/Seed";
/**
 * SketchPin
 *
 * A simplified, clean hand-drawn pushpin: a minimal circle head, a needle, and a drop shadow.
 */

export const PIN_SPOTS = {
  top: { left: "50%", top: "-0.9rem", center: true },
  "top-left": { left: "14%", top: "-0.9rem" },
  "top-right": { right: "14%", top: "-0.9rem" },
};

export default function SketchPin({
  spot,
  color = "var(--accent)",
  size = "1.9rem",
  rotate,
  seed = 1,
  ink = "var(--text-primary, #22252a)",
  className,
  style,
}) {
  const rand = mulberry32(seed + 13);
  const lean = rotate ?? (rand() - 0.5) * 24;

  const place = PIN_SPOTS[spot];
  const { center, ...position } = place ?? {};
  const transform = `${center ? "translateX(-50%) " : ""}rotate(${lean.toFixed(1)}deg)`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 32 38"
      width={size}
      style={{
        display: place ? undefined : "inline-block",
        height: "auto",
        overflow: "visible",
        pointerEvents: "none",
        ...(place ? { position: "absolute", zIndex: 4, ...position } : {}),
        transform,
        ...style,
      }}
    >
     
      {/* Needle */}
      <path d="M13 20 L8 32" stroke={ink} strokeWidth="1.6" strokeLinecap="round" fill="none" />

      <circle cx="14" cy="13" r="9.5" fill={color} stroke={ink} strokeWidth="1.6" />
    </svg>
  );
}
