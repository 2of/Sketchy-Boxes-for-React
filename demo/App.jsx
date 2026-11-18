import { useState, useEffect, useRef } from "react";
import { SketchOutline, HandDrawnHeader, SKETCH_PRESETS, PAPERS } from "../src/index.js";
import defaultCopy from "./demo.json"; // <-- point to your JSON file

const PRESET_NAMES = Object.keys(SKETCH_PRESETS);
const PAPER_NAMES = Object.keys(PAPERS);
const FILLS = ["highlight", "accent", "accent2", "paper-2"];
const PIN_COLOURS = ["accent", "accent2", "highlight", "ink"];
const TAPE_COLOURS = ["highlight", "accent2", "accent", "paper-2"];
const HOVERS = ["lift", "press", "grow", "tilt", "wiggle"];
const ENTERS = ["pop", "rise", "drop"];
const IDLES = ["float", "sway"];

const css = `

`;

/* Replaces `{token}` placeholders in JSON strings */
function fmt(str = "", vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

/* Mounts its children when scrolled into view, so entrances and drawIn play on arrival. */
function Reveal({ children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ minHeight: shown ? undefined : "12rem" }}>
      {shown && children}
    </div>
  );
}

function Section({ title, note, children }) {
  return (
    <section>
      <HandDrawnHeader as="h2" size="lg" underline="squiggle" animate="hover">
        {title}
      </HandDrawnHeader>
      {note && <p className="sec-note">{note}</p>}
      {children}
    </section>
  );
}

function Sample({ label, children }) {
  return (
    <div>
      {children}
      <div className="label">{label}</div>
    </div>
  );
}

function CodeBlock({ lines, pkg, toolbar, seed }) {
  const [copied, setCopied] = useState(false);
  const code = (lines || []).map((line) => fmt(line, { pkg })).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <SketchOutline preset="note" paper="plain" seed={seed}>
      <div className="code-wrap">
        <pre className="code-block">{code}</pre>
        <button
          type="button"
          className="copy-btn"
          aria-label={toolbar.copyAria}
          onClick={handleCopy}
        >
          {copied ? toolbar.copied : toolbar.copy}
        </button>
      </div>
    </SketchOutline>
  );
}

export default function App({ copy = defaultCopy }) {
  const [roll, setRoll] = useState(0); // bump to re-roll every seed
  const [replay, setReplay] = useState(0); // bump to replay entrances
  const [theme, setTheme] = useState("auto");
  const [pg, setPg] = useState({ preset: "pinned", hover: "lift", enter: "pop", idle: "", boil: false });

  const seed = (n) => n * 97 + roll * 1013;

  const { pkg, hero, toolbar, bodies, plain, sections, snippets, steps, props } = copy;

  const Body = ({ title = bodies.default.title, text = bodies.default.text }) => (
    <>
      <p className="card-title">{title}</p>
      {text && <p className="card-body">{text}</p>}
    </>
  );

  const cycleTheme = () => {
    const next = theme === "auto" ? "dark" : theme === "dark" ? "light" : "auto";
    setTheme(next);
    if (next === "auto") delete document.documentElement.dataset.hdTheme;
    else document.documentElement.dataset.hdTheme = next;
  };

  return (
    <>
      <style>{css}</style>
      <div className="demo">
        {/* ---------- Hero ---------- */}
        <div className="stack">
          <div className="bar">
            <span className="label">{pkg}</span>
            <div className="row">
              <button onClick={() => setRoll((r) => r + 1)}>{toolbar.reroll}</button>
              <button onClick={cycleTheme}>{fmt(toolbar.theme, { mode: theme })}</button>
            </div>
          </div>
          <HandDrawnHeader as="h1" size="xl" underline="squiggle" animate="hover" drawIn>
            {hero.title}
          </HandDrawnHeader>
          <p className="sec-note">{hero.intro}</p>
        </div>

        {/* ---------- How to use ---------- */}
        <Section title={sections.howToUse.title} note={sections.howToUse.note}>
          <div className="steps">
            {steps.map((step, idx) => (
              <div key={step.title} className="stack">
                <p className="step-title">
                  {idx + 1}. {step.title}
                </p>
                {step.blocks.map((block, bIdx) =>
                  block.code ? (
                    <CodeBlock
                      key={bIdx}
                      lines={snippets[block.code]}
                      pkg={pkg}
                      toolbar={toolbar}
                      seed={seed(200 + idx * 10 + bIdx)}
                    />
                  ) : (
                    <p key={bIdx} className="card-body">
                      {block.text}
                    </p>
                  )
                )}
              </div>
            ))}

            <div className="stack" style={{ marginTop: "1rem" }}>
              <HandDrawnHeader as="h3" underline="squiggle">
                {sections.howToUse.propsTitle}
              </HandDrawnHeader>
              <SketchOutline preset="card" paper="plain" seed={seed(299)}>
                <div style={{ overflowX: "auto" }}>
                  <table className="props-table">
                    <thead>
                      <tr>
                        <th>{sections.howToUse.propsHead.prop}</th>
                        <th>{sections.howToUse.propsHead.what}</th>
                        <th>{sections.howToUse.propsHead.values}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.map((p) => (
                        <tr key={p.name}>
                          <td><code>{p.name}</code></td>
                          <td>{p.what}</td>
                          <td><code>{p.values}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SketchOutline>
            </div>
          </div>
        </Section>

        {/* ---------- Playground ---------- */}
        <Section title={sections.playground.title} note={sections.playground.note}>
          <div className="row" style={{ marginBottom: "2rem" }}>
            {[
              ["preset", PRESET_NAMES],
              ["hover", ["none", ...HOVERS]],
              ["enter", ["", ...ENTERS]],
              ["idle", ["", ...IDLES]],
            ].map(([key, opts]) => (
              <label key={key} className="label">
                {sections.playground.fields[key]}{" "}
                <select value={pg[key]} onChange={(e) => setPg({ ...pg, [key]: e.target.value })}>
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o || toolbar.none}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label className="label">
              <input
                type="checkbox"
                checked={pg.boil}
                onChange={(e) => setPg({ ...pg, boil: e.target.checked })}
              />{" "}
              {sections.playground.fields.boil}
            </label>
          </div>
          <div style={{ maxWidth: "20rem" }}>
            <SketchOutline
              key={`${pg.preset}-${pg.enter}-${pg.idle}-${replay}`}
              preset={pg.preset}
              hover={pg.hover}
              enter={pg.enter || undefined}
              idle={pg.idle || undefined}
              animate={pg.boil ? "boil" : "hover"}
              seed={seed(7)}
            >
              <Body title={bodies.playground.title} text={bodies.playground.text} />
            </SketchOutline>
          </div>
        </Section>

        {/* ---------- Headers ---------- */}
        <Section title={sections.headers.title} note={sections.headers.note}>
          <div className="grid">
            <Sample label={sections.headers.samples.big.label}>
              <HandDrawnHeader as="h1" underline="squiggle">
                {sections.headers.samples.big.text}
              </HandDrawnHeader>
            </Sample>
            <Sample label={sections.headers.samples.highlighted.label}>
              <HandDrawnHeader as="h2" size="lg" underline="squiggle" highlight>
                {sections.headers.samples.highlighted.text}
              </HandDrawnHeader>
            </Sample>
            <Sample label={sections.headers.samples.hover.label}>
              <HandDrawnHeader as="h2" animate="hover" underline="squiggle">
                {sections.headers.samples.hover.text}
              </HandDrawnHeader>
            </Sample>
            <Sample label={sections.headers.samples.drawIn.label}>
              <HandDrawnHeader as="h2" drawIn underline="squiggle">
                {sections.headers.samples.drawIn.text}
              </HandDrawnHeader>
            </Sample>
            <Sample label={sections.headers.samples.plain.label}>
              <HandDrawnHeader as="h3">{sections.headers.samples.plain.text}</HandDrawnHeader>
            </Sample>
            <Sample label={sections.headers.samples.small.label}>
              <HandDrawnHeader as="h4" underline="squiggle">
                {sections.headers.samples.small.text}
              </HandDrawnHeader>
            </Sample>
          </div>
        </Section>

        {/* ---------- Every preset ---------- */}
        <Section title={sections.presets.title} note={sections.presets.note}>
          <div className="grid">
            {PRESET_NAMES.map((name, i) => (
              <Sample key={name} label={fmt(sections.presets.label, { name })}>
                <SketchOutline preset={name} hover="lift" seed={seed(i + 1)}>
                  <Body title={name} />
                </SketchOutline>
              </Sample>
            ))}
          </div>
        </Section>

        {/* ---------- Papers ---------- */}
        <Section title={sections.paper.title} note={sections.paper.note}>
          <div className="grid">
            {PAPER_NAMES.map((name, i) => (
              <Sample key={name} label={fmt(sections.paper.label, { name })}>
                <SketchOutline preset="note" paper={name} hover="lift" seed={seed(i + 20)}>
                  <Body title={name} text={bodies.paper.text} />
                </SketchOutline>
              </Sample>
            ))}
          </div>
        </Section>

        {/* ---------- Fills ---------- */}
        <Section title={sections.fills.title} note={sections.fills.note}>
          <div className="grid">
            {FILLS.map((c, i) => (
              <Sample key={c} label={fmt(sections.fills.solidLabel, { value: c })}>
                <SketchOutline preset="sticker" paper="none" backgroundColor={c} hover="grow" seed={seed(i + 40)}>
                  <Body title={bodies.solid.title} />
                </SketchOutline>
              </Sample>
            ))}
            {FILLS.slice(0, 3).map((c, i) => (
              <Sample key={`t-${c}`} label={fmt(sections.fills.tintedLabel, { value: c })}>
                <SketchOutline
                  preset="card"
                  paper="none"
                  backgroundColor={c}
                  isTransparent
                  transparentOpacity={0.3}
                  hover="lift"
                  seed={seed(i + 50)}
                >
                  <Body title={bodies.tinted.title} />
                </SketchOutline>
              </Sample>
            ))}
            <Sample label={sections.fills.customLabel}>
              <SketchOutline preset="pill" paper="none" backgroundColor="#c9e4ff" hover="grow" seed={seed(60)}>
                {plain.custom}
              </SketchOutline>
            </Sample>
          </div>
        </Section>

        {/* ---------- Tape and pins ---------- */}
        <Section title={sections.tapePins.title} note={sections.tapePins.note}>
          <div className="grid">
            {TAPE_COLOURS.map((c, i) => (
              <Sample key={c} label={fmt(sections.tapePins.tapeTopLabel, { value: c })}>
                <SketchOutline preset="polaroid" tapeColor={c} hover="lift" seed={seed(i + 70)}>
                  <Body title={bodies.taped.title} text={bodies.taped.text} />
                </SketchOutline>
              </Sample>
            ))}
            {TAPE_COLOURS.slice(0, 2).map((c, i) => (
              <Sample key={`c-${c}`} label={fmt(sections.tapePins.tapeCornersLabel, { value: c })}>
                <SketchOutline preset="taped" tapeColor={c} hover="lift" seed={seed(i + 80)}>
                  <Body title={bodies.cornerTape.title} />
                </SketchOutline>
              </Sample>
            ))}
            {PIN_COLOURS.map((c, i) => (
              <Sample key={c} label={fmt(sections.tapePins.pinLabel, { value: c })}>
                <SketchOutline preset="pinned" pinColor={c} hover="lift" seed={seed(i + 90)}>
                  <Body title={bodies.pinned.title} />
                </SketchOutline>
              </Sample>
            ))}
          </div>
        </Section>

        {/* ---------- Hover ---------- */}
        <Section title={sections.hover.title} note={sections.hover.note}>
          <Reveal>
            <div className="grid">
              {HOVERS.map((h, i) => (
                <Sample key={h} label={fmt(sections.hover.label, { name: h })}>
                  <SketchOutline preset="card" hover={h} animate="hover" seed={seed(i + 100)}>
                    <Body title={h} text={bodies.hover.text} />
                  </SketchOutline>
                </Sample>
              ))}
            </div>
          </Reveal>
        </Section>

        {/* ---------- Entrances ---------- */}
        <Section title={sections.entrances.title} note={sections.entrances.note}>
          <button className="replay" onClick={() => setReplay((r) => r + 1)}>
            {toolbar.replay}
          </button>
          <Reveal>
            <div className="grid" key={replay} style={{ marginTop: "1.5rem" }}>
              {ENTERS.flatMap((e, row) =>
                [0, 1].map((n) => {
                  const delay = (row * 2 + n) * 90;
                  return (
                    <Sample key={`${e}-${n}`} label={fmt(sections.entrances.label, { name: e, delay })}>
                      <SketchOutline
                        preset={n ? "note" : "sticker"}
                        enter={e}
                        enterDelay={delay}
                        hover="lift"
                        seed={seed(row * 2 + n + 120)}
                      >
                        <Body title={e} />
                      </SketchOutline>
                    </Sample>
                  );
                })
              )}
            </div>
          </Reveal>
        </Section>

        {/* ---------- Idle ---------- */}
        <Section title={sections.idle.title} note={sections.idle.note}>
          <Reveal>
            <div className="grid">
              <Sample label={sections.idle.floatLabel}>
                <SketchOutline preset="polaroid" idle="float" hover="grow" seed={seed(140)}>
                  <Body title={bodies.floating.title} />
                </SketchOutline>
              </Sample>
              <Sample label={sections.idle.swayLabel}>
                <SketchOutline preset="pinned" idle="sway" seed={seed(141)}>
                  <Body title={bodies.swaying.title} />
                </SketchOutline>
              </Sample>
              <Sample label={sections.idle.boilLabel}>
                <SketchOutline preset="circled" animate="boil" seed={seed(142)}>
                  {plain.boil}
                </SketchOutline>
              </Sample>
              <Sample label={sections.idle.drawInLabel}>
                <SketchOutline preset="sticker" drawIn drawDuration={1.4} seed={seed(143)}>
                  <Body title={bodies.drawIn.title} />
                </SketchOutline>
              </Sample>
            </div>
          </Reveal>
        </Section>

        {/* ---------- Wobble tuning ---------- */}
        <Section title={sections.wobble.title} note={sections.wobble.note}>
          <Reveal>
            <div className="grid">
              <Sample label={sections.wobble.calmLabel}>
                <SketchOutline preset="card" roughness={1} passes={1} hover="lift" seed={seed(150)}>
                  <Body title={bodies.calm.title} />
                </SketchOutline>
              </Sample>
              <Sample label={sections.wobble.chaoticLabel}>
                <SketchOutline preset="card" roughness={6} passes={3} hover="lift" seed={seed(151)}>
                  <Body title={bodies.chaotic.title} />
                </SketchOutline>
              </Sample>
              <Sample label={sections.wobble.tiltLabel}>
                <SketchOutline preset="note" tilt={-4} hover="tilt" seed={seed(152)}>
                  <Body title={bodies.fixedTilt.title} />
                </SketchOutline>
              </Sample>
            </div>
          </Reveal>
        </Section>
      </div>
    </>
  );
}
