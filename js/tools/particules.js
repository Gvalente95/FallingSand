function isOutOfBorder(x, y) { return (x < 0 || x > GRIDW - 1 || y < 0 || y > GRIDH - 1);}

function deleteParticules(x = MOUSEX, y = MOUSEY, radius = 10, type = null, isDisc = true) {
    const radiusSquared = radius * radius;
    for (let posY = -radius; posY <= radius; posY++) {
        for (let posX = -radius; posX <= radius; posX++) {
			if (!isDisc || (posX * posX + posY * posY) <= radiusSquared) {
				let px = x + posX * PIXELSIZE;
				let py = y + posY * PIXELSIZE;
				let gridX = Math.floor((px) / PIXELSIZE);
				let gridY = Math.floor(py / PIXELSIZE);
				const p = getPxlAtPos(gridX, gridY);
				if (p && (!type || p.type == type)) destroyedParticles.push(p);
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
				newP.velX += MOUSEDX * (newP.solType == SOLID_TYPES.LIQUID ? .05 : .02);
				newP.velY += MOUSEDY * (newP.solType == SOLID_TYPES.LIQUID ? .05 : .02);
				if (radius <= 1) return;
            }
        }
	}
}

function deleteParticulesAtMouse()
{
	deleteParticules(MOUSEX - BRUSHSIZE / 2, MOUSEY - BRUSHSIZE / 2, BRUSHSIZE, null, BRUSHTYPE == 'DISC');
}

function deleteAllParticules(type = null)
{
	for (const p of activeParticles)
	{
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

function exciteRadius(x = MOUSEGRIDX, y = MOUSEGRIDY, radius = BRUSHSIZE * 2, intensity = 2)
{
	const radiusSquared = radius * radius;
	for (let posY = -radius; posY <= radius; posY++) {
		for (let posX = -radius; posX <= radius; posX++) {
			if ((posX * posX + posY * posY) <= radiusSquared) {
				let px = getPxlAtPos(x, y);
				if (!px) continue;
				px.velY = -intensity;
				px.updatePosition(px.x + Math.sign(px.velX) * 3, px.y + Math.sign(px.velY) * 3);
			}
		}
	}
}

function resetParticles()
{
	for (const pe of particleEmitters) pe.onRemove();
	particleEmitters = [];
	deleteAllParticules();
	activeParticles = [];
	initGrid();
}

function deleteOldestParticules(num) {
	activeParticles.splice(0, num);
}
