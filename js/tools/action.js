function vibrateRadius(cx = MOUSE.wx, cy = MOUSE.wy, radius = BRUSHSIZE, intensity = 5, isCircle = BRUSHTYPE == "DISC") {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (isCircle && dx * dx + dy * dy > r2) continue;
      let rx = cx + dx * PIXELSIZE;
      let ry = cy + dy * PIXELSIZE;
      let gx = Math.floor(rx / PIXELSIZE);
      let gy = Math.floor(ry / PIXELSIZE);
      if (isOutOfBorder(gx, gy)) break;
      const p = cellAtI(ROWOFF[gy] + gx);
      if (!p) continue;
      p.velX = f_range(-intensity, intensity + 1);
      p.velY = f_range(-intensity, intensity + 1);
    }
  }
}

function selectRadius(selType = "GRAB", cx = MOUSE.wx, cy = MOUSE.wy, radius = BRUSHSIZE, isCircle = BRUSHTYPE == "DISC") {
  const r2 = radius * radius;
  const centerGX = Math.floor(cx / PIXELSIZE);
  const centerGY = Math.floor(cy / PIXELSIZE);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (!isCircle || dx * dx + dy * dy <= r2) {
        let rx = cx + dx * PIXELSIZE;
        let ry = cy + dy * PIXELSIZE;
        let gx = Math.floor(rx / PIXELSIZE);
        let gy = Math.floor(ry / PIXELSIZE);
        if (isOutOfBorder(gx, gy)) break;
        let i = ROWOFF[gy] + gx;
        const p = cellAtI(i);
        if (!p) continue;
        if (selType === "LIQUID") {
          if (p.physT === "LIQUID") continue;
          p.physT = "LIQUID";
          p.spreadAmount = 20;
          p.dns = 2;
          p.color = addColor(p.properties.color, "rgb(68, 146, 170)", 0.4);
          continue;
        }
        p.velX = p.velY = 0;
        p.selType = selType;
        p.color = addColor(p.baseColor, "rgb(0, 0, 0)", 0.4);
        if (grid1[i] === p) grid1[i] = null;
        p.sx = gx - centerGX;
        p.sy = gy - centerGY;
        selCells.push(p);
      }
    }
  }
}

function explodeRadius(cx = MOUSE.wx, cy = MOUSE.wy, radius = BRUSHSIZE, intensity = 2, transformType = null, ignoreType = null) {
  const r2 = radius * radius;
  let xPushLimits = [0, intensity];
  let yPushLimits = [0, intensity];
  impactCells = 9999999;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dd = dx * dx + dy * dy;
      if (dd <= r2) {
        let rx = cx + dx * PIXELSIZE;
        let ry = cy + dy * PIXELSIZE;
        let gx = Math.floor(rx / PIXELSIZE);
        let gy = Math.floor(ry / PIXELSIZE);
        if (isOutOfBorder(gx, gy)) break;
        const p = cellAtI(ROWOFF[gy] + gx);
        if (!p) continue;
        if (ignoreType && p.type == ignoreType) continue;
        if (dd <= r2 / 2) {
          p.setType("SMOKE");
          continue;
        }
        if (p.expl) p.lt = 0;
        let ddy = rdir();
        let ddx = rdir();
        if (dy >= -radius / 2) {
          ddy = -radius / 10;
          ddx *= 2;
        }
        if (p.physT === "STATIC") p.physT = "DYNAMIC";
        p.velX = clamp(ddx * f_range(xPushLimits[0], xPushLimits[1]) * dt, -10, 10);
        p.velY = clamp(ddy * f_range(yPushLimits[0], yPushLimits[1]) * dt, -10, 10);
        if (transformType === "FIRE" && shouldBurnType("FIRE", p.type)) p.setToFire("FIRE", 10);
        else if (transformType && dice(100)) p.setType(transformType);
      }
    }
  }
}

function resetSelectedType(typeToReset) {
  for (let i = 0; i < selCells.length; i++) {
    let p = selCells[i];
    if (p.selType != typeToReset) continue;
    if (typeToReset === "GRAB") {
      let idx = ROWOFF[p.y] + p.x;
      let pAt = grid1[idx];
      if (pAt && pAt != p) pAt.toRemove();
      p.updatePosition(idx);
      p.selType = null;
      p.velX += MOUSE.dx / PIXELSIZE;
      p.velY += MOUSE.dy / PIXELSIZE;
      p.newX = p.x;
      p.newY = p.y;
      p.color = p.baseColor;
    }
  }
}
