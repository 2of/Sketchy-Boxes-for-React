import { between, spread, smooth } from "./DrawingSupport.jsx";

export function arcPoints(cx, cy, rx, ry, startAngle, endAngle, rand, rough, numPts = 4) {
  const pts = [];
  let drift = (rand() - 0.5) * 2 * rough;
  for (let i = 0; i <= numPts; i++) {
    const t = i / numPts;
    const angle = startAngle + (endAngle - startAngle) * t;
    drift = drift * 0.6 + (rand() - 0.5) * 2 * rough * 0.8;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    pts.push({
      x: cx + Math.max(1, rx + drift) * cosA,
      y: cy + Math.max(1, ry + drift) * sinA,
    });
  }
  return pts;
}

export function sidePoints(from, to, rand, rough, overshoot = 0) {
  if (!from || !to) return [];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return [from];

  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const startPush = overshoot ? between(rand, -overshoot * 0.4, overshoot) : 0;
  const endPush = overshoot ? between(rand, -overshoot * 0.4, overshoot) : 0;
  const a = { x: from.x - ux * startPush, y: from.y - uy * startPush };
  const b = { x: to.x + ux * endPush, y: to.y + uy * endPush };

  const segments = Math.max(2, Math.round(len / 40));
  const pts = [];
  let drift = (rand() - 0.5) * 2 * rough;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    drift = drift * 0.6 + (rand() - 0.5) * 2 * rough * 0.8;
    const bow = Math.sin(t * Math.PI) * (rand() - 0.5) * 2 * rough * 0.5;
    pts.push({
      x: a.x + (b.x - a.x) * t + nx * (drift + bow),
      y: a.y + (b.y - a.y) * t + ny * (drift + bow),
    });
  }
  return pts;
}

export function parseRadius(radiusProp, width, height) {
  const maxR = Math.min(width, height) / 2;

  if (radiusProp === "left") {
    const r = Math.min(16, maxR);
    return [r, 0, 0, r];
  }
  if (radiusProp === "right") {
    const r = Math.min(16, maxR);
    return [0, r, r, 0];
  }
  if (radiusProp === "none") {
    return [0, 0, 0, 0];
  }
  if (radiusProp === "both" || radiusProp === true) {
    const r = Math.min(16, maxR);
    return [r, r, r, r];
  }

  if (Array.isArray(radiusProp)) {
    return radiusProp.map((val) => {
      if (typeof val === "string" && val.endsWith("%")) {
        return Math.min(width, height) * (parseFloat(val) / 100);
      }
      return Math.min(parseFloat(val) || 0, maxR);
    });
  }

  if (typeof radiusProp === "number") {
    const r = Math.min(radiusProp, maxR);
    return [r, r, r, r];
  }
  if (typeof radiusProp === "string" && radiusProp.endsWith("%")) {
    const r = Math.min(width, height) * (parseFloat(radiusProp) / 100);
    return [r, r, r, r];
  }

  const val = parseFloat(radiusProp) || 0;
  const clamped = Math.min(val, maxR);
  return [clamped, clamped, clamped, clamped];
}

export function buildVariableRadiusPath(w, h, borderRadius, inset, rough, overshoot, rand) {
  const l = inset;
  const t = inset;
  const r = w - inset;
  const b = h - inset;
  const [rtl, rtr, rbr, rbl] = parseRadius(borderRadius, r - l, b - t);

  const getCornerPoints = (cx, cy, rx, ry, startAngle, endAngle, sharpPt) => {
    if (rx <= 0.5 || ry <= 0.5) {
      return [{
        x: sharpPt.x + spread(rand, rough * 0.5),
        y: sharpPt.y + spread(rand, rough * 0.5),
      }];
    }
    return arcPoints(cx, cy, rx, ry, startAngle, endAngle, rand, rough);
  };

  const tlArc = getCornerPoints(l + rtl, t + rtl, rtl, rtl, Math.PI, (3 * Math.PI) / 2, { x: l, y: t });
  const trArc = getCornerPoints(r - rtr, t + rtr, rtr, rtr, -Math.PI / 2, 0, { x: r, y: t });
  const brArc = getCornerPoints(r - rbr, b - rbr, rbr, rbr, 0, Math.PI / 2, { x: r, y: b });
  const blArc = getCornerPoints(l + rbl, b - rbl, rbl, rbl, Math.PI / 2, Math.PI, { x: l, y: b });

  const topSide = sidePoints(tlArc[tlArc.length - 1], trArc[0], rand, rough);
  const rightSide = sidePoints(trArc[trArc.length - 1], brArc[0], rand, rough);
  const bottomSide = sidePoints(brArc[brArc.length - 1], blArc[0], rand, rough);
  const leftSide = sidePoints(blArc[blArc.length - 1], tlArc[0], rand, rough);

  const fullSequence = [
    ...tlArc,
    ...topSide,
    ...trArc,
    ...rightSide,
    ...brArc,
    ...bottomSide,
    ...blArc,
    ...leftSide,
  ];

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

  return smooth([...fullSequence, extraPt]);
}

export function buildRoundPath(w, h, borderRadius, inset, rough, overshoot, rand) {
  return buildVariableRadiusPath(w, h, borderRadius, inset, rough, overshoot, rand);
}

export function linePath(w, y, rand, rough, overshoot) {
  const x0 = -between(rand, 0, overshoot);
  const x1 = w + between(rand, 0, overshoot);
  const n = Math.max(3, Math.round((x1 - x0) / 60));
  const tilt = spread(rand, rough);
  let drift = 0;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    drift = drift * 0.6 + spread(rand, rough * 0.5);
    pts.push({ x: x0 + (x1 - x0) * t, y: y + tilt * (t - 0.5) + drift });
  }
  return smooth(pts);
}

export function squigglePath(w, y, rand, amp, stepSize) {
  const x0 = -between(rand, 0, amp);
  const x1 = w + between(rand, 0, amp);
  const step = between(rand, stepSize * 0.8, stepSize * 1.15);
  const pts = [];
  let up = rand() > 0.5;
  for (let x = x0; x <= x1; x += step * between(rand, 0.8, 1.2)) {
    pts.push({ x, y: y + (up ? -1 : 1) * amp * between(rand, 0.6, 1.2) });
    up = !up;
  }
  pts.push({ x: x1, y });
  return smooth(pts);
}
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