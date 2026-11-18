export const TAPE_YELLOW = "color-mix(in srgb, var(--hi, #f6e27a) 62%, transparent)";

export const TAPE_SPOTS = {

    ///// same as the pin i guess
  top: { left: "50%", top: "-0.75rem", base: -3, center: true },
  "top-left": { left: "-1.1rem", top: "-0.35rem", base: -38 },
  "top-right": { right: "-1.1rem", top: "-0.35rem", base: 38 },
  bottom: { left: "50%", bottom: "-0.75rem", base: 2, center: true },
  "left-side": { left: "-1.8rem", top: "50%", base: -86, middle: true },
  "right-side": { right: "-1.8rem", top: "50%", base: 86, middle: true },
};

export const TAPE_GROUPS = {
  corners: ["top-left", "top-right"],
  sides: ["left-side", "right-side"],
};




export const expandTape = (tape) => {
  if (!tape) return [];




  if (tape === true) return ["top"];
  const list = Array.isArray(tape) ? tape : [tape];
  return list.flatMap((t) => TAPE_GROUPS[t] ?? [t]).filter((t) => TAPE_SPOTS[t]);
};

export const Tape = ({ spot, rotate, color }) => {
  const s = TAPE_SPOTS[spot];
  const transform = [



    s.center ? "translateX(-50%)" : "",
    s.middle ? "translateY(-50%)" : "",
    `rotate(${rotate.toFixed(1)}deg)`,



  ]
    .filter(Boolean)
    .join(" ");
  const { base, center, middle, ...position } = s;
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        zIndex: 3,
        width: "4.4rem",
        height: "1.3rem",
        pointerEvents: "none",
        background: color,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.14)",

        clipPath: "polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)", ///// 
        transform,
        ...position,
      }}
    />
  );
};
