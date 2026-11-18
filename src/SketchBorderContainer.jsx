import { useMemo, useRef } from "react";
import HandDrawnContainer from "./Containers/HandDrawn-Container.jsx";
import SketchPin, { PIN_SPOTS } from "./Art/Pin.jsx";
import { mulberry32 } from "./Support/Seed.jsx";
import { Tape, TAPE_SPOTS, expandTape } from "./Art/Tape.jsx";

// Shorthand names -> lib variables. Anything else (hex, rgb, var(), color-mix) passes through.
const COLOR_TOKENS = {
  ink: "--hd-ink",           "text-primary": "--hd-ink",
  paper: "--hd-paper",       "bg-l1": "--hd-paper",
  "paper-2": "--hd-paper-2", "bg-l2": "--hd-paper-2",
  accent: "--hd-accent",
  accent2: "--hd-accent-2",
  highlight: "--hd-highlight",
};

function resolveThemeColor(val) {
  if (typeof val !== "string") return val;
  const name = COLOR_TOKENS[val.replace(/^--/, "")];
  return name ? `var(${name})` : val;
}

// Notebook rules, built only from theme variables.
const MARGIN_COLOR = "color-mix(in srgb, var(--accent) 45%, transparent)";
const RULE_COLOR = "color-mix(in srgb, var(--accent2) 40%, transparent)";

const MARGIN = `linear-gradient(to right, transparent 2.1rem, ${MARGIN_COLOR} 2.1rem, ${MARGIN_COLOR} calc(2.1rem + 1px), transparent calc(2.1rem + 1px))`;
const RULES = `repeating-linear-gradient(to bottom, transparent 0, transparent 1.45rem, ${RULE_COLOR} 1.45rem, ${RULE_COLOR} calc(1.45rem + 1px))`;

// bg      = paper colour (theme variable)
// image   = inline background (lined paper only)
// pattern = literal global class name from your main scss, drawn as an overlay
export const PAPERS = {
  lined:  { bg: "var(--hd-paper)", image: `${MARGIN}, ${RULES}` },
  grid:   { bg: "var(--hd-paper)", pattern: "hd-pattern-grid" },
  dotted: { bg: "var(--hd-paper)", pattern: "hd-pattern-dots-wide" },
  plain:  { bg: "var(--hd-paper)" },
  aged:   { bg: "var(--hd-paper-2)", image: `${MARGIN}, ${RULES}` },
};

const SHADOWS = {
  soft:   "0 1px 1px color-mix(in srgb, var(--hd-shadow) 30%, transparent), 0 6px 14px -8px var(--hd-shadow)",
  lifted: "0 2px 2px color-mix(in srgb, var(--hd-shadow) 35%, transparent), 0 14px 26px -12px var(--hd-shadow)",
};
export const SKETCH_PRESETS = {
  sticker: {
    container: { shape: "rounded", borderRadius: 22, strokeWidth: 3.5, passes: 1, roughness: 1.6, overshoot: 3, padding: "1.25rem" },
    shadow: "lifted",
    tilt: "auto",
  },
  pill: {
    container: { shape: "rounded", borderRadius: 999, strokeWidth: 1.8, passes: 2, roughness: 2, overshoot: 4, padding: "0.6rem 1.4rem" },
    shadow: "soft",
  },
  round2endsfornav: {
    container: { shape: "rounded", borderRadius: 999, strokeWidth: 1.5, passes: 2, roughness: 1.6, overshoot: 3, padding: "0.5rem 1.2rem" },
  },
  note: {
    container: {
      shape: "rectangle",
      strokeWidth: 1.3,
      passes: 1,
      roughness: 1.4,
      overshoot: 2,
      padding: "1.4rem 1.25rem 1.25rem",
      color: "color-mix(in srgb, var(--text-primary) 40%, transparent)",
    },
    shadow: "soft",
    tape: "top",
    tilt: "auto",
  },
  pinned: {
    container: { shape: "rectangle", strokeWidth: 2, passes: 2, roughness: 2.5, overshoot: 5, padding: "1.5rem 1.25rem 1.25rem" },
    shadow: "soft",
    pin: "top",
    tilt: "auto",
  },
  taped: {
    container: { shape: "rectangle", strokeWidth: 2, passes: 2, roughness: 3, overshoot: 6, padding: "1.5rem" },
    shadow: "soft",
    tape: "corners",
    tilt: "auto",
  },
  polaroid: {
    container: { shape: "rectangle", strokeWidth: 1.5, passes: 1, roughness: 1.5, overshoot: 3, padding: "0.9rem 0.9rem 3.2rem" },
    shadow: "lifted",
    tape: "top",
    tilt: "auto",
  },
  circled: {
    container: { shape: "rounded", borderRadius: 999, strokeWidth: 3, passes: 2, roughness: 3.5, overshoot: 18, padding: "0.9rem 1.6rem", color: "var(--accent)" },
  },
  scribble: {
    container: { shape: "rectangle", strokeWidth: 2.4, passes: 3, roughness: 5.5, overshoot: 16, padding: "1.5rem" },
  },
  quiet: {
    container: { shape: "rounded", borderRadius: 8, strokeWidth: 1.5, passes: 1, roughness: 1.5, overshoot: 3 },
  },

  "catalogue-pined-note": {
    container: { shape: "rectangle", strokeWidth: 1.4, passes: 1, roughness: 1.3, overshoot: 3, padding: "1.6rem 1.25rem 1.25rem 2.8rem", color: "var(--text-primary)" },
    paper: "lined",
    shadow: "soft",
    pin: "top",
    tilt: "auto",
  },
  "Catalogue-written-note": {
    container: { shape: "rectangle", strokeWidth: 1.1, passes: 1, roughness: 1.1, overshoot: 2, padding: "1.25rem 1.5rem 1.25rem 2.8rem", color: "var(--text-primary)" },
    paper: "aged",
    shadow: "soft",
    tilt: "auto",
  },
  "Catalogue-Tape-1": {
    container: { shape: "rectangle", strokeWidth: 1.4, passes: 1, roughness: 1.5, overshoot: 3, padding: "1.5rem 1.25rem 1.25rem", color: "var(--text-primary)" },
    paper: "grid",
    shadow: "soft",
    tape: "top",
    tilt: "auto",
  },
  "Catalogue-tape-2": {
    container: { shape: "rectangle", strokeWidth: 1.6, passes: 2, roughness: 2, overshoot: 4, padding: "1.5rem", color: "var(--text-primary)" },
    paper: "dotted",
    shadow: "lifted",
    tape: "corners",
    tilt: "auto",
  },

  card: {
    container: { shape: "rounded", borderRadius: 6, strokeWidth: 2, passes: 2, roughness: 2.5, overshoot: 5, padding: "1.25rem" },
    shadow: "soft",
  },
};


export default function SketchOutline({
  children,
  preset,
  pin,
  pinColor = "accent",
  tape,
  tapeColor = "highlight",
  shadow,
  tilt,
  seed,

  paper,   // "lined" | "grid" | "dotted" | "plain" | "aged" | "none"
  pattern, // any literal global class, e.g. "pattern-crosshatch" | "dots" | "none"

  backgroundColor,
  backgroundColours,
  backgroundColors,
  isTransparent = false,
  color,
  style,
  ...rest
}) {
  const baseSeed = useRef(seed ?? Math.floor(Math.random() * 1e9));
  if (seed !== undefined) baseSeed.current = seed;
  const s = baseSeed.current;

  const cfg = (typeof preset === "string" ? SKETCH_PRESETS[preset] : preset) ?? {};
  const set = Object.fromEntries(
    Object.entries({ ...rest, ...(color ? { color } : {}) }).filter(([, v]) => v !== undefined)
  );
  
  const rawBg = backgroundColor ?? backgroundColours ?? backgroundColors;
  const bgColor = resolveThemeColor(rawBg);

  const container = { 
    ...cfg.container, 
    ...(bgColor ? { backgroundColor: bgColor } : {}),
    isTransparent,
    ...set 
  };

  if (container.color) {
    container.color = resolveThemeColor(container.color);
  }
  if (container.backgroundColor) {
    container.backgroundColor = resolveThemeColor(container.backgroundColor);
  }

  const pinSpot = (pin ?? cfg.pin) === true ? "top" : pin ?? cfg.pin;
  const resolvedPinColor = resolveThemeColor(pinColor);
  
  const tapeSpots = expandTape(tape ?? cfg.tape);
  const resolvedTapeColor = resolveThemeColor(tapeColor);

  const shadowName = shadow ?? cfg.shadow;
  const lean = tilt ?? cfg.tilt ?? 0;
  const degrees = lean === "auto" ? ((s % 200) / 200 - 0.5) * 2.4 : Number(lean) || 0;

  const boxShadow = useMemo(() => {
    return shadowName && SHADOWS[shadowName] ? SHADOWS[shadowName] : undefined;
  }, [shadowName]);

  const tapeAngles = useMemo(() => {
    const rand = mulberry32(s + 29);
    return Object.fromEntries(Object.keys(TAPE_SPOTS).map((k) => [k, TAPE_SPOTS[k].base + (rand() - 0.5) * 8]));
  }, [s]);

  // Explicit props win over the preset; "none" (or unknown) = nothing drawn.
  const paperCfg = PAPERS[paper ?? cfg.paper];
  const patternClass =
    pattern === "none" ? undefined : pattern ?? cfg.pattern ?? paperCfg?.pattern;

  const layer = {
    position: "absolute",
    inset: 2,
    pointerEvents: "none",
  };

  return (
    <HandDrawnContainer
      {...container}
      seed={s}
      style={{
        boxShadow,
        transform: degrees ? `rotate(${degrees.toFixed(2)}deg)` : undefined,
        isolation: "isolate",
        ...cfg.style,
        ...style,
      }}
    >
      {paperCfg && (
        <span
          aria-hidden="true"
          style={{
            ...layer,
            zIndex: -2,
            backgroundColor: paperCfg.bg,
            backgroundImage: paperCfg.image,
          }}
        />
      )}
      {patternClass && (
        <span
          aria-hidden="true"
          className={patternClass}
          style={{ ...layer, zIndex: -1 }}
        />
      )}
      {children}
      {tapeSpots.map((spot) => (
        <Tape key={spot} spot={spot} rotate={tapeAngles[spot]} color={resolvedTapeColor} />
      ))}
      {pinSpot && PIN_SPOTS[pinSpot] && <SketchPin spot={pinSpot} color={resolvedPinColor} seed={s} />}
    </HandDrawnContainer>
  );
}