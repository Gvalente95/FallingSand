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
function launchCells(type = 'SAND', px = MOUSE.x, py = MOUSE.y, rx = BRUSHSIZE, ry = BRUSHSIZE, isDisc = BRUSHTYPE == BRUSHTYPES.DISC, vel = [MOUSE.dx, MOUSE.dy]) {
	if (type === "ENTITY")
		return;
	if (SELENT) {
		SELENT.place(Math.round((px) / PIXELSIZE - SELENT.w / 2), Math.round(py / PIXELSIZE - SELENT.h / 2));
		SELENT.mv = vel;
		return;
	}
	if (ENTINDEX != -1) {
		if (ENTINDEX > 0) {
			SELENT = new Mob(Math.round(px / PIXELSIZE), Math.round(py / PIXELSIZE), getEntOfIndex(ENTINDEX), "MOB");
			entities.push(SELENT);
		}
		else {
			if (!PLAYER)
				PLAYER = new Player(Math.round(px / PIXELSIZE), Math.round(py / PIXELSIZE));
			SELENT = PLAYER;
		}
		return;
	}
	let launchedCells = [];
	let color = null;
	if (CELL_PROPERTIES[type].physT === 'GAS') vel = [0, 0];

	const addedX = vel[0] ? (vel[0] / PIXELSIZE) * (CELL_PROPERTIES[type].physT == PHYSTYPES.LIQUID ? .4 : .05) : 0;
	const addedY = vel[1] ? (vel[1] / PIXELSIZE) * (CELL_PROPERTIES[type].physT == PHYSTYPES.LIQUID ? .4 : .05) : 0;

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
		const c = launchCell(type, ix, iy, color, addedX, addedY, isRandomized);
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
			const c = launchCell(type, ix, iy, color, addedX, addedY, isRandomized);
			if (c && c.active)
				launchedCells.push(c);
		}
	}
	return launchedCells;
}

function launchCellsRect(type, xp, yp, w, h) {
	for (let y = 0; y < h; y++){
		for (let x = 0; x < w; x++){
			newP = new Cell(xp, yp, type);
			if (type === 'RAINBOW') newP.setColor(getRainbowColor(FRAME, .1));
		}
	}
}
