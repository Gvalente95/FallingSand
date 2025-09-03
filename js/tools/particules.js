function isOutOfBorder(x, y) { return (x < 0 || x > GRIDW - 1 || y < 0 || y > GRIDH - 1);}

function deleteParticules(x = MOUSEX, y = MOUSEY, radius = 10, type = null, isDisc = true) {
	console.warn(isDisc);
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

function launchParticules(type = PARTICLE_TYPES.SAND, x = MOUSEX, y = MOUSEY, radius = BRUSHSIZE, isDisc = BRUSHTYPE == BRUSHTYPES.DISC, useMouseDx = true)
{
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

function explodeRadius(x, y, radius, transformType, intensity)
{
	console.warn("EXPLODE");
		const radiusSquared = radius * radius;
		for (let posY = -radius; posY <= radius; posY++) {
			for (let posX = -radius; posX <= radius; posX++) {
				if ((posX * posX + posY * posY) <= radiusSquared) {
					if (r_range(0, 100) < intensity)
					{
						let px = x + posX * PIXELSIZE;
						let py = y + posY * PIXELSIZE;
						let gridX = Math.floor(px / PIXELSIZE);
						let gridY = Math.floor(py / PIXELSIZE);
						if (isOutOfBorder(gridX, gridY)) continue;
						let pat = getPxlAtPos(gridX, gridY, this);
						if (pat) {
							if (transformType)
								pat.setType(transformType);
							else
								destroyedParticles.push(pat);
						}
						else if (transformType)
							new Particle(gridX, gridY, transformType);
					}
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
