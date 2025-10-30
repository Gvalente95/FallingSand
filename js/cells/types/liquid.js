p.shouldSpreadCheck = function () {
	if (hasInput) return true;
	let massMax = 3;
	let massAbove = 0;
	const base = this.i;
	const step = -GW;
	while (++massAbove < massMax) {
		const q = grid1[base + step * massAbove];
		if (!q || q.physT != 'LIQUID') return true;
	}
	return false;
};

p.updateLiquid = function (curX, curY, spreadAm = this.spreadAmount) {
	if (this.spread < 2) return (this.updatePosition(ROWOFF[curY] + curX));
	const up = cellAtI(ROWOFF[curY - 1] + curX, this);
	if (up && up.dns > this.dns && up.physT === 'LIQUID' && up.type !== 'BUBBLE') {
		this.velX = 0; this.swap(up); return;
	}
	if (!this.hasTouchedSurface) {
		if (this.hasTouchedSurfaceCheck()) this.hasTouchedSurface = true;
		else { this.updatePosition(ROWOFF[curY] + curX); return; }
	}
	if (!this.ground || curY == GH - 1) return (this.updatePosition(ROWOFF[curY] + curX));
	if (this.timeAlive > 1 && (secTick || hasInput)) this.shouldSpread = this.shouldSpreadCheck();
	if (!this.shouldSpread) return (this.updatePosition(ROWOFF[curY] + curX));
	let xDir = this.xDir || 1;
	if ((curX <= 0 && xDir < 0) || (curX >= GW - 1 && xDir > 0)) xDir = -xDir;

	const maxSteps = Math.min(spreadAm - 1, xDir > 0 ? (GW - 1 - curX) : curX);
	let newX = curX;
	let found = false;
	for (let i = 1; i <= maxSteps; i++) {
		const xp = curX + i * xDir;
		const cell = cellAtI(ROWOFF[curY] + xp);
		if (!cell) { newX = xp; found = true; break; }
		if (cell.updT === 'ALIVE') continue;
		if (cell.physT !== 'LIQUID') break;
		if (cell.type !== this.type && cell.dns > this.dns) { this.swap(cell); return; }
		if (curY < GH - 1) {
			const below = cellAtI(ROWOFF[curY + 1] + xp);
			if (!below) { newX = xp; curY++; found = true; break; }	
		}
	}
	if (!found) this.xDir *= -1;
	this.updatePosition(ROWOFF[curY] + newX);
};
