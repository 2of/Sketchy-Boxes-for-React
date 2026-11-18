import { between, spread, smooth, sidePoints } from "../Support";

export function buildRectanglePath(w, h, inset, rough, overshoot, rand) {
  const l = inset;
  const t = inset;
  const r = w - inset;
  const b = h - inset;
  const wiggle = rough * 1.2;

  const tl = { x: l + spread(rand, wiggle), y: t + spread(rand, wiggle) };
  const tr = { x: r + spread(rand, wiggle), y: t + spread(rand, wiggle) };
  const br = { x: r + spread(rand, wiggle), y: b + spread(rand, wiggle) };
  const bl = { x: l + spread(rand, wiggle), y: b + spread(rand, wiggle) };

  const top = sidePoints(tl, tr, rand, rough, overshoot);
  const right = sidePoints(tr, br, rand, rough, overshoot);
  const bottom = sidePoints(br, bl, rand, rough, overshoot);
  const left = sidePoints(bl, tl, rand, rough, overshoot);

  // Combine into a single continuous sequence without duplicate corner points
  const fullSequence = [
    ...top,
    ...right.slice(1),
    ...bottom.slice(1),
    ...left.slice(1),
  ];

  // Add an authentic ink overshoot finish point
  const extraDist = between(rand, overshoot * 0.5, overshoot * 1.5);
  const firstPt = fullSequence[0];
  const secondPt = fullSequence[1] || firstPt;
  const dx = secondPt.x - firstPt.x;
  const dy = secondPt.y - firstPt.y;
  const len = Math.hypot(dx, dy) || 1;
  const extraPt = {
    x: firstPt.x + (dx / len) * extraDist + spread(rand, rough),
    y: firstPt.y + (dy / len) * extraDist + spread(rand, rough),
  };

  // Run smooth ONCE across the entire unified path
  return smooth([...fullSequence, extraPt]);
}
