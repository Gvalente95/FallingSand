function deleteCells(x = MOUSE.x, y = MOUSE.y, radius = 10, type = null, isDisc = true) {
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


function launchCell(type, x, y, clr, vx, vy, isRandomized) {
	const newP = new Cell(x, y, type);
	if (clr){
		if (randomizeChance > 0 && isRandomized && dice(randomizeChance)) newP.setColor(randomizeColor(clr, 5));
		else newP.setColor(clr);
	}
	newP.velX += vx;
	newP.velY += vy;
	return newP;
}

var randomizeChance = 2;
function launchCells(type = 'SAND', px = MOUSE.x, py = MOUSE.y, rx = BRUSHSIZE, ry = BRUSHSIZE, isDisc = BRUSHTYPE == BRUSHTYPES.DISC, useMouseDx = true, avx = 0, avy = 0) {
	if (type === "PLAYER") {
		let gx = Math.round(px / PIXELSIZE);
		let gy = Math.round(py / PIXELSIZE);
		if (!PLAYER)
			PLAYER = new Player(gx, gy);
		else {
			PLAYER.place(gx, gy);
			PLAYER.mv = [0, 0];
		}
		return;
	}
	let launchedCells = [];
	let color = null;
	if (useMouseDx && CELL_PROPERTIES[type].physT === 'GAS') useMouseDx = false;

	const addedX = useMouseDx ? (MOUSE.dx / PIXELSIZE) * (CELL_PROPERTIES[type].physT == PHYSTYPES.LIQUID ? .4 : .05) : 0;
	const addedY = useMouseDx ? (MOUSE.dy / PIXELSIZE) * (CELL_PROPERTIES[type].physT == PHYSTYPES.LIQUID ? .4 : .05) : 0;

	let isRandomized = CELL_PROPERTIES[type].physT === 'SOLID' && type != 'Rainbow';
	if (type === 'GBLADE' || type === 'FISH' || type === 'SHROOM' || type === 'MUSHX') isRandomized = false;
	if (type === 'RAINBOW') color = getRainbowColor(FRAME, .1);
	else if (isRandomized) color = addColor(CELL_PROPERTIES[type].color, getRainbowColor(FRAME, .1), .1);

	if (activeCells.length > MAXCells) return;

	const cx = Math.floor(px / PIXELSIZE);
	const cy = Math.floor(py / PIXELSIZE);
	if (rx === 1 && ry === 1) {
		const ix = clamp(cx, 0, GW - 1);
		const iy = clamp(cy, 0, GH - 1);
		const c = launchCell(type, ix, iy, color, addedX + avx, addedY + avy, isRandomized);
		if (c && c.active)
			launchedCells.push(c);
		return launchedCells;
	}
	const rxg = Math.max(0, Math.floor(rx));
	const ryg = Math.max(0, Math.floor(ry));

	for (let gy = cy - ryg; gy <= cy + ryg; gy++){
		for (let gx = cx - rxg; gx <= cx + rxg; gx++){
			if (isDisc){
				const dx = gx - cx, dy = gy - cy;
				if ((dx*dx)/(rxg*rxg || 1) + (dy*dy)/(ryg*ryg || 1) > 1) continue;
			}
			const ix = clamp(gx, 0, GW - 1);
			const iy = clamp(gy, 0, GH - 1);
			const c = launchCell(type, ix, iy, color, addedX + avx, addedY + avy, isRandomized);
			if (c && c.active)
				launchedCells.push(c);
		}
	}
	return launchedCells;
}

function delCellsAtMouse() {deleteCells(MOUSE.x - BRUSHSIZE / 2 + PIXELSIZE, MOUSE.y - BRUSHSIZE / 2 + PIXELSIZE, BRUSHSIZE, null, BRUSHTYPE == 'DISC');}

function delAllCells(type = null)
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
	delAllCells();
	activeCells = [];
	initGrid();
}

function delOldestCells(num) {
	activeCells.splice(0, num);
}

function flushDestroyedCells()
{
	for (let i = 0; i < destroyedCells.length; i++) destroyedCells[i].onRemove();
	destroyedCells = [];
}