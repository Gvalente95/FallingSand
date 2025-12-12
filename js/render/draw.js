function drawCircle2(ctx, pos, radius = 2, color = "white", strokeColor = "black", lineWidth = 4) {
  ctx.beginPath();
  ctx.arc(pos[0], pos[1], radius * 4, 0, 2 * Math.PI);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  if (color) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.stroke();
  ctx.closePath();
}

function drawBezierLine(start, end, ctrl, color = "white", width = 8) {
  const step = 0.001;
  ctx.fillStyle = color;

  for (let t = 0; t <= 1; t += step) {
    const mt = 1 - t;

    const x = mt * mt * start[0] + 2 * mt * t * ctrl[0] + t * t * end[0];
    const y = mt * mt * start[1] + 2 * mt * t * ctrl[1] + t * t * end[1];

    ctx.fillRect(x, y, width, width);
  }
}

let showStripes = false;
function drawLine(ctx, start, end, color = "white", width = PIXELSIZE, handleSize = 0, checkPos = false, hasStripes = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.stroke();
  if (handleSize > 0) drawCircle2(ctx, end, handleSize * _scale);
}

function drawStripedLine(p0, p1, color1, color2 = "rgba(0, 0, 0, 0)") {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);
  if (!len) return;
  const stripe = 10;
  const speed = 3;
  const ux = dx / len;
  const uy = dy / len;
  let offset = (FRAME * speed) % (stripe * 2);
  if (len <= stripe) offset = 0;
  let curX = p0[0] + ux * offset;
  let curY = p0[1] + uy * offset;
  let remaining = len - offset;
  if (remaining <= 0) {
    curX = p0[0];
    curY = p0[1];
    remaining = len;
    offset = 0;
  }
  ctx.lineWidth = 5;
  const steps = Math.ceil(remaining / stripe);
  for (let s = 0; s < steps; s++) {
    const segLen = Math.min(stripe, remaining - s * stripe);
    const nextX = curX + ux * segLen;
    const nextY = curY + uy * segLen;
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(nextX, nextY);
    ctx.strokeStyle = s % 2 === 0 ? color1 : color2;
    ctx.stroke();
    curX = nextX;
    curY = nextY;
  }
}

function drawPolyline(ctx, pts, color = "white", width = 8, handleSize = 0, checkPos = false, hasStripes = false) {
  let isBetween = false;
  let curWidth = width;

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    if (hasStripes && showStripes) drawStripedLine(pts[i - 1], pts[i], color);
    else ctx.lineTo(pts[i][0], pts[i][1]);
  }
  if (curWidth > 6) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.44)";
    ctx.lineWidth = curWidth + 2;
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = curWidth;
  ctx.stroke();
  if (handleSize > 0) drawCircle2(ctx, pts[pts.length - 1], handleSize * _scale, addColor(color, "black", 0.3), "black", 1);
  return isBetween;
}

function inflate(r, m) {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}
function hitsH(y, x1, x2, r) {
  const L = Math.min(x1, x2),
    R = Math.max(x1, x2);
  return y >= r.y && y <= r.y + r.h && !(R < r.x || L > r.x + r.w);
}
function hitsV(x, y1, y2, r) {
  const T = Math.min(y1, y2),
    B = Math.max(y1, y2);
  return x >= r.x && x <= r.x + r.w && !(B < r.y || T > r.y + r.h);
}
function pathClear(pts, rects) {
  for (const r of rects) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i],
        [x2, y2] = pts[i + 1];
      if (x1 === x2) {
        if (hitsV(x1, y1, y2, r)) return false;
      } else {
        if (hitsH(y1, x1, x2, r)) return false;
      }
    }
  }
  return true;
}
function routeOrthSoft(start, end, obstacles = [], margin = 6, step = 24, maxSteps = 4) {
  const rs = obstacles.map((r) => inflate(r, margin));
  const [x1, y1] = start,
    [x2, y2] = end;

  const L1 = [
    [x1, y1],
    [(x1 + x2) / 2, y1],
    [(x1 + x2) / 2, y2],
    [x2, y2],
  ];
  if (pathClear(L1, rs)) return L1;

  const L2 = [
    [x1, y1],
    [x1, (y1 + y2) / 2],
    [x2, (y1 + y2) / 2],
    [x2, y2],
  ];
  if (pathClear(L2, rs)) return L2;

  for (let k = 1; k <= maxSteps; k++) {
    const mx1 = (x1 + x2) / 2 - k * step,
      mx2 = (x1 + x2) / 2 + k * step;
    const A = [
      [x1, y1],
      [mx1, y1],
      [mx1, y2],
      [x2, y2],
    ];
    if (pathClear(A, rs)) return A;
    const B = [
      [x1, y1],
      [mx2, y1],
      [mx2, y2],
      [x2, y2],
    ];
    if (pathClear(B, rs)) return B;

    const my1 = (y1 + y2) / 2 - k * step,
      my2 = (y1 + y2) / 2 + k * step;
    const C = [
      [x1, y1],
      [x1, my1],
      [x2, my1],
      [x2, y2],
    ];
    if (pathClear(C, rs)) return C;
    const D = [
      [x1, y1],
      [x1, my2],
      [x2, my2],
      [x2, y2],
    ];
    if (pathClear(D, rs)) return D;
  }

  return [
    [x1, y1],
    [x1, y2],
    [x2, y2],
  ];
}
function drawRouted(ctx, start, end, color = "white", width = 8, handleSize = 0, checkPos, hasStripes) {
  const pts = routeOrthSoft(start, end, _screenObstacles, 6, 24, 4);
  return drawPolyline(ctx, pts, color, width, handleSize, checkPos, hasStripes);
}

function drawText(ctx, pos, text, color = "white", backgroundColor = null, size = 25, centered = true, cursor = "", cursorIndex = null) {
  if (!size) size = 25;
  size *= 1;
  ctx.font = size + "px MyPixelFont";

  const metrics = ctx.measureText(text);
  const w = metrics.width + 12;
  const h = size + 8;

  let x = pos[0],
    y = pos[1];
  if (centered) {
    x -= w / 2;
    y -= h / 2;
  }

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    if (!centered) ctx.fillRect(x - 5, y - h / 2, w, h);
    else ctx.fillRect(x, y, w, h);
  }

  ctx.fillStyle = color;
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, pos[0], pos[1] + 15);

  if (cursor && cursorIndex !== null) {
    const leftPart = text.slice(0, cursorIndex);
    const leftWidth = ctx.measureText(leftPart).width;
    const cursorX = centered ? pos[0] - metrics.width / 2 + leftWidth : pos[0] + leftWidth;
    ctx.fillStyle = "rgba(203, 192, 192, 1)";
    ctx.textAlign = "left";
    ctx.fillText(cursor, cursorX, pos[1]);
  }
  return w;
}

function sameSide(px, py, ax, ay, bx, by, cx, cy) {
  const cross1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  const cross2 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  return cross1 * cross2 >= 0;
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  return sameSide(px, py, ax, ay, bx, by, cx, cy) && sameSide(px, py, bx, by, cx, cy, ax, ay) && sameSide(px, py, cx, cy, ax, ay, bx, by);
}

function drawTriangle(ctx, p0, p1, p2, color = "white", width = 2) {
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.lineTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawRect(x, y, width, height, color, strokeColor, lineWidth) {
  ctx.lineWidth = lineWidth || 1;

  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(x, y, width, height);
    }
  } else if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.strokeRect(x, y, width, height);
  }
}

function drawCellCircle(x, y, radius, color = "rgba(255,255,255,1)") {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius)) {
    console.warn("drawCellCircle invalid params:", x, y, radius);
    return;
  }
  const grad = ctx.createRadialGradient(x, y, radius * 0.6, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawCircle(x, y, radius, color, strokeColor, lineWidth) {
  ctx.beginPath();
  ctx.arc(x, y, radius * 4, 0, 2 * Math.PI);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  if (color) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.stroke();
  ctx.closePath();
}
