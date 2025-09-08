function isOutOfBorder(x, y) { return (x < 0 || x > GRIDW - 1 || y < 0 || y > GRIDH - 1) };
function atCorner(x, y) { return ((x == 0 && y == 0) || (x == 0 && y == GRIDH - 1) || (x == GRIDW - 1 && y == 0) || (x == GRIDW - 1 && y == GRIDH - 1)) };
function atBorder(x, y) { return (x == 0 || y == 0 || x == GRIDW - 1 || y == GRIDH - 1) };

function deleteParticules(x = MOUSEX, y = MOUSEY, radius = 10, type = null, isDisc = true) {
    const radiusSquared = radius * radius;
    for (let posY = -radius; posY <= radius; posY++) {
        for (let posX = -radius; posX <= radius; posX++) {
			if (!isDisc || (posX * posX + posY * posY) <= radiusSquared) {
				let px = x + posX * PIXELSIZE;
				let py = y + posY * PIXELSIZE;
				let gridX = Math.floor((px) / PIXELSIZE);
				let gridY = Math.floor(py / PIXELSIZE);
				const p = pxAtP(gridX, gridY);
				if (p && (!type || p.type == type)) p.toRemove();
            }
        }
	}
}

function launchParticules(type = 'SAND', x = MOUSEX, y = MOUSEY, radius = BRUSHSIZE, isDisc = BRUSHTYPE == BRUSHTYPES.DISC, useMouseDx = true)
{
	if (activeParticles.length > MAXPARTICLES) return;
	const radiusSquared = radius * radius;
    for (let posY = -radius; posY <= radius; posY++) {
        for (let posX = -radius; posX <= radius; posX++) {
            if (!isDisc || (posX * posX + posY * posY) <= radiusSquared) {
				let px = x + posX * PIXELSIZE;
				let py = y + posY * PIXELSIZE;
				let gridX = Math.floor(px / PIXELSIZE);
				let gridY = Math.floor(py / PIXELSIZE);
				let clampedX = clamp(gridX, 1, GRIDW - 1);
				let clampedY = clamp(gridY, 1, GRIDH - 1);
				let newP = new Particle(clampedX, clampedY, type);
				if (type === 'RAINBOW') newP.setColor(getRainbowColor(time, .1));
				if (!useMouseDx) continue;
				newP.velX += MOUSEDX * (newP.physT == PHYSTYPES.LIQUID ? .05 : .02);
				newP.velY += MOUSEDY * (newP.physT == PHYSTYPES.LIQUID ? .05 : .02);
				if (radius <= 1) return;
            }
        }
	}
}

function deleteParticulesAtMouse()
{
	deleteParticules(MOUSEX - BRUSHSIZE / 2 + PIXELSIZE, MOUSEY - BRUSHSIZE / 2 + PIXELSIZE, BRUSHSIZE, null, BRUSHTYPE == 'DISC');
}

function deleteAllParticules(type = null)
{
	for (let i = 0; i < activeParticles.length; i++)
	{
		let p = activeParticles[i];
		if (!type || p.type == type)
			destroyedParticles.push(p);
	}
}

function launchParticlesRect(type, xp, yp, w, h) {
	for (let y = 0; y < h; y++){
		for (let x = 0; x < w; x++){
			newP = new Particle(xp, yp, type);
			if (type === 'RAINBOW') newP.setColor(getRainbowColor(time, .1));
		}
	}
}


function vibrateRadius(cx = MOUSEGRIDX, cy = MOUSEGRIDY, radius = BRUSHSIZE * 2, intensity = 5) {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx*dx + dy*dy > r2) continue;
      const gx = cx + dx, gy = cy + dy;
      if (gx < 0 || gy < 0 || gx >= GRIDW || gy >= GRIDH) continue;
      const p = pxAtP(gx, gy);
		if (!p) continue;
		p.velX = f_range(-intensity, intensity + 1);
		p.velY = f_range(-intensity, intensity + 1);
    }
  }
}

function pushRadius(cx = MOUSEGRIDX, cy = MOUSEGRIDY, radius = BRUSHSIZE * 2, intensity = 5) {
  const r2 = radius * radius;
  const moved = new Set();
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx*dx + dy*dy > r2) continue;
      const gx = cx + dx, gy = cy + dy;
      if (gx < 0 || gy < 0 || gx >= GRIDW || gy >= GRIDH) continue;
      const p = pxAtP(gx, gy);
		if (!p) continue;
      const pid = p.id != null ? p.id : (gy * GRIDW + gx);
      if (moved.has(pid)) continue;

      const dist = Math.hypot(dx, dy) || 1;
      const sgnX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
      const sgnY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
      const steps = Math.max(1, Math.round(intensity * (1 - dist / radius) * 8));

      let nx = p.x, ny = p.y;
      for (let s = 1; s <= steps; s++) {
        const tx = p.x + sgnX * s;
        const ty = p.y + sgnY * s;
        if (isOutOfBorder(tx, ty)) break;
        if (!pxAtP(tx, ty)) { nx = tx; ny = ty; } else break;
      }
      if (nx !== p.x || ny !== p.y) {
        p.updatePosition(nx, ny);
        moved.add(pid);
      }
    }
  }
}

function explodeRadius(cx = MOUSEGRIDX, cy = MOUSEGRIDY, radius = BRUSHSIZE, intensity = 5, setToFire = 0, ignoreType = null) {
	const r2 = radius * radius;
	let xPushLimits = [intensity * .01, intensity * .09];
	let yPushLimits = [intensity * .1, intensity * .14];
	for (let dy = -radius; dy <= radius; dy++) {
	for (let dx = -radius; dx <= radius; dx++) {
			if (dx*dx + dy*dy > r2) continue;
			const gx = cx + dx, gy = cy + dy;
			if (gx < 0 || gy < 0 || gx >= GRIDW || gy >= GRIDH) continue;
			const p = pxAtP(gx, gy);
			if (!p) continue;
			if (ignoreType && p.type == ignoreType) continue;
			if (p.expl) p.lt = 0;
			let ddy = dy;
			let ddx = dx;
			if (dy >= -radius / 2) {
				ddy = -radius / 2;
				ddx = r_range(-radius, radius);
			}
			p.velX = ddx * f_range(xPushLimits[0], xPushLimits[1]);
			p.velY = ddy * f_range(yPushLimits[0], yPushLimits[1]);
			if (setToFire && dice(2000)) p.setToFire(setToFire);
		}
	}
}

function resetParticles()
{
	for (let i = 0; i < particleEmitters.length; i++) particleEmitters[i].onRemove();
	particleEmitters = [];
	deleteAllParticules();
	activeParticles = [];
	initGrid();
}

function deleteOldestParticules(num) {
	activeParticles.splice(0, num);
}
