function isOutOfBorder(x, y) { return (x < 0 || x > GRIDW - 1 || y < 0 || y > GRIDH - 1) };
function atCorner(x, y) { return ((x == 0 && y == 0) || (x == 0 && y == GRIDH - 1) || (x == GRIDW - 1 && y == 0) || (x == GRIDW - 1 && y == GRIDH - 1)) };
function atBorder(x, y) { return (x == 0 || y == 0 || x == GRIDW - 1 || y == GRIDH - 1) };

function deleteParticules(x = MOUSEX, y = MOUSEY, radius = 10, type = null, isDisc = true) {
    const radiusSquared = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
			if (!isDisc || (dx * dx + dy * dy) <= radiusSquared) {
				let px = x + dx * PIXELSIZE;
				let py = y + dy * PIXELSIZE;
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
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (!isDisc || (dx * dx + dy * dy) <= radiusSquared) {
				let px = x + dx * PIXELSIZE;
				let py = y + dy * PIXELSIZE;
				let gridX = Math.floor(px / PIXELSIZE);
				let gridY = Math.floor(py / PIXELSIZE);
				let clampedX = clamp(gridX, 1, GRIDW - 1);
				let clampedY = clamp(gridY, 1, GRIDH - 1);
				let newP = new Particle(clampedX, clampedY, type);
				if (type === 'RAINBOW') newP.setColor(getRainbowColor(time, .1));
				if (!useMouseDx) continue;
				newP.velX += (MOUSEDX / PIXELSIZE) * (newP.physT == PHYSTYPES.LIQUID ? .5 : .2);
				newP.velY += (MOUSEDY / PIXELSIZE) * (newP.physT == PHYSTYPES.LIQUID ? .5 : .2);
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


function vibrateRadius(cx = MOUSEX, cy = MOUSEY, radius = BRUSHSIZE, intensity = 5, isCircle = BRUSHTYPE == 'DISC') {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (isCircle && dx*dx + dy*dy > r2) continue;
		let rx = cx + dx * PIXELSIZE;
		let ry = cy + dy * PIXELSIZE;
		let gx = Math.floor(rx / PIXELSIZE);
		let gy = Math.floor(ry / PIXELSIZE);
		if (isOutOfBorder(gx, gy)) break;
		const p = pxAtP(gx, gy);
		if (!p) continue;
		p.velX = f_range(-intensity, intensity + 1);
		p.velY = f_range(-intensity, intensity + 1);
    }
  }
}

function pushRadius(cx = MOUSEX, cy = MOUSEY, radius = BRUSHSIZE, isCircle = BRUSHTYPE == 'DISC') {
	const r2 = radius * radius;
	const moved = new Set();

	if (selParticles && selParticles.length > 0) return;
  
	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			if (!isCircle || (dx * dx + dy * dy) <= r2) {
				let rx = cx + dx * PIXELSIZE;
				let ry = cy + dy * PIXELSIZE;
				let gx = Math.floor(rx / PIXELSIZE);
				let gy = Math.floor(ry / PIXELSIZE);
				if (isOutOfBorder(gx,gy)) break;
				const p = pxAtP(gx, gy);
				if (!p) continue;
				p.isSel = true;
				p.velY = p.velX = 0;
				if (grid[p.x][p.y] == p) grid[p.x][p.y] = null;
				selParticles.push(p);
				}
			}
		}
}

function explodeRadius(cx = MOUSEX, cy = MOUSEY, radius = BRUSHSIZE, intensity = 5, setToFire = 0, ignoreType = null) {
	const r2 = radius * radius;
	let xPushLimits = [intensity * .01, intensity * .09];
	let yPushLimits = [intensity * .1, intensity * .14];
	for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if ((dx * dx + dy * dy) <= r2) {
				let rx = cx + dx * PIXELSIZE;
				let ry = cy + dy * PIXELSIZE;
				let gx = Math.floor(rx / PIXELSIZE);
				let gy = Math.floor(ry / PIXELSIZE);
				if (isOutOfBorder(gx, gy)) break;
				const p = pxAtP(gx, gy);
				if (!p) continue;
				if (ignoreType && p.type == ignoreType) continue;
				if (p.expl) p.lt = 0;
				let ddy = gy;
				let ddx = gx;
				if (dy >= -radius / 2) {
					ddy = -radius / 2;
					ddx = r_range(-radius, radius);
				}
				if (p.physT = 'STATIC') p.physT = 'DYNAMIC';
				p.velX = ddx * f_range(xPushLimits[0], xPushLimits[1]) * dt;
				p.velY = ddy * f_range(yPushLimits[0], yPushLimits[1]) * dt;
				if (setToFire && dice(2000)) p.setToFire(setToFire);
            }
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
