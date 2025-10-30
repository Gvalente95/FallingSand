function deleteParticules(x = MOUSE.x, y = MOUSE.y, radius = 10, type = null, isDisc = true) {
    const radiusSquared = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
			if (!isDisc || (dx * dx + dy * dy) <= radiusSquared) {
				let px = x + dx * PIXELSIZE;
				let py = y + dy * PIXELSIZE;
				let gx = Math.floor((px) / PIXELSIZE);
				let gy = Math.floor(py / PIXELSIZE);
				const p = cellAtI(ROWOFF[gy] + gx);
				if (p && (!type || p.type == type)) p.toRemove(true);
            }
        }
	}
}

var randomizeChance = 2;
function launchParticules(type = 'SAND', x = MOUSE.x, y = MOUSE.y, radius = BRUSHSIZE, isDisc = BRUSHTYPE == BRUSHTYPES.DISC, useMouseDx = true, avx = 0, avy = 0)
{
	let color = null;

	if (useMouseDx && CELL_PROPERTIES[type].physT === 'GAS') useMouseDx = false;
	let addedX = !useMouseDx ? 0 : (MOUSE.dx / PIXELSIZE) * (CELL_PROPERTIES[type].physT == PHYSTYPES.LIQUID ? .4 : .05);
	let addedY = !useMouseDx ? 0 : (MOUSE.dy / PIXELSIZE) * (CELL_PROPERTIES[type].physT == PHYSTYPES.LIQUID ? .4 : .05);

	let isRandomized = CELL_PROPERTIES[type].physT === 'SOLID' && type != 'Rainbow';
	if (type === 'GBLADE') isRandomized = false;
	if (type === 'FISH' || type === 'SHROOM' || type === 'MUSHX') isRandomized = false;
	if (type === 'RAINBOW') color = getRainbowColor(FRAME, .1);
	else if (isRandomized) color = addColor(CELL_PROPERTIES[type].color, getRainbowColor(FRAME, .1), .1);

	if (activeCells.length > MAXCells) return;
	const radiusSquared = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (!isDisc || (dx * dx + dy * dy) <= radiusSquared) {
				let px = x + dx * PIXELSIZE;
				let py = y + dy * PIXELSIZE;
				let gridX = Math.floor(px / PIXELSIZE);
				let gridY = Math.floor(py / PIXELSIZE);
				let clampedX = clamp(gridX, 1, GW - 1);
				let clampedY = clamp(gridY, 1, GH - 1);
				let newP = new Cell(clampedX, clampedY, type);
				if (color) {
					if (randomizeChance > 0 && (isRandomized && dice(randomizeChance))) newP.setColor(randomizeColor(color, 5));
					else newP.setColor(color);
				}
				if (radius <= 1) return;
				newP.velX += addedX + avx;
				newP.velY += addedY + avy;
            }
        }
	}
}

function deleteParticulesAtMouse() {deleteParticules(MOUSE.x - BRUSHSIZE / 2 + PIXELSIZE, MOUSE.y - BRUSHSIZE / 2 + PIXELSIZE, BRUSHSIZE, null, BRUSHTYPE == 'DISC');}

function deleteAllParticules(type = null)
{
	for (let i = 0; i < activeCells.length; i++)
	{
		let p = activeCells[i];
		if (!type || p.type == type)
			destroyedCells.push(p);
	}
}

function launchCellsRect(type, xp, yp, w, h) {
	for (let y = 0; y < h; y++){
		for (let x = 0; x < w; x++){
			newP = new Cell(xp, yp, type);
			if (type === 'RAINBOW') newP.setColor(getRainbowColor(FRAME, .1));
		}
	}
}


function vibrateRadius(cx = MOUSE.x, cy = MOUSE.y, radius = BRUSHSIZE, intensity = 5, isCircle = BRUSHTYPE == 'DISC') {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (isCircle && dx*dx + dy*dy > r2) continue;
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

function selectRadius(selType = 'GRAB', cx = MOUSE.x, cy = MOUSE.y, radius = BRUSHSIZE, isCircle = BRUSHTYPE == 'DISC') {
	const r2 = radius * radius;
	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			if (!isCircle || (dx * dx + dy * dy) <= r2) {
				let rx = cx + dx * PIXELSIZE;
				let ry = cy + dy * PIXELSIZE;
				let gx = Math.floor(rx / PIXELSIZE);
				let gy = Math.floor(ry / PIXELSIZE);
				if (isOutOfBorder(gx,gy)) break;
				let i = ROWOFF[gy] + gx
				const p = cellAtI(i);
				if (!p) continue;
				if (selType === 'LIQUID') {
					if (p.physT === 'LIQUID') continue;
					p.physT = 'LIQUID';
					p.spreadAmount = 20;
					p.dns = 2;
					p.color = addColor(p.properties.color, 'rgb(68, 146, 170)', .4);
					continue;
				}
				p.velX = p.velY = 0;
				p.selType = selType;
				p.color = addColor(p.baseColor, 'rgb(0, 0, 0)', .4);
				if (grid1[i] === p) grid1[i] = null;
				p.sx = Math.floor(dx);
				p.sy = Math.floor(dy);
				selCells.push(p);
			}
		}
	}
}

function resetSelectedType(typeToReset) {
	for (let i = 0; i < selCells.length; i++){
		let p = selCells[i];
		if (p.selType != typeToReset) continue;
		if (typeToReset === 'GRAB') {
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

function explodeRadius(cx = MOUSE.x, cy = MOUSE.y, radius = BRUSHSIZE, intensity = 2, transformType = null, ignoreType = null) {
	const r2 = radius * radius;
	let xPushLimits = [0, intensity];
	let yPushLimits = [0, intensity];
	for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if ((dx * dx + dy * dy) <= r2) {
				let rx = cx + dx * PIXELSIZE;
				let ry = cy + dy * PIXELSIZE;
				let gx = Math.floor(rx / PIXELSIZE);
				let gy = Math.floor(ry / PIXELSIZE);
				if (isOutOfBorder(gx, gy)) break;
				const p = cellAtI(ROWOFF[gy] + gx);
				if (!p) continue;
				if (ignoreType && p.type == ignoreType) continue;
				if (p.expl) p.lt = 0;
				let ddy = dy;
				let ddx = rdir();
				if (dy >= -radius / 2) {
					ddy = -radius / 20;
					ddx *= 2;
				}
				if (p.physT === 'STATIC') p.physT = 'DYNAMIC';
				p.velX = clamp(ddx * f_range(xPushLimits[0], xPushLimits[1]) * dt, -10, 10);
				p.velY = clamp(ddy * f_range(yPushLimits[0], yPushLimits[1]) * dt, -10, 10);
				if (transformType === 'FIRE' && shouldBurnType('FIRE', p.type)) p.setToFire('FIRE', 10);
				else if (transformType && dice(100)) p.setType(transformType);
            }
        }
	}
}

function resetCells()
{
	for (let i = 0; i < cellEmitters.length; i++) cellEmitters[i].onRemove();
	cellEmitters = [];
	deleteAllParticules();
	activeCells = [];
	initGrid();
}

function deleteOldestParticules(num) {
	activeCells.splice(0, num);
}

function flushDestroyedCells()
{
	for (let i = 0; i < destroyedCells.length; i++) destroyedCells[i].onRemove();
	destroyedCells = [];
}