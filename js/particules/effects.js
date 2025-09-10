p.updateLiquid = function (curX, curY, spreadAm = this.spreadAmount) {
	if (this.frozen) return;
	const up = pxAtP(curX, curY - 1);
	if (up && up.physT === 'LIQUID' && up.dns > this.dns && up.type !== 'BUBBLE') {
		this.velX = 0;
		this.swap(up);
		return;
	}
	if (!this.hasTouchedSurface) {
		if (this.hasTouchedSurfaceCheck()) this.hasTouchedSurface = true;
		else { this.updatePosition(curX, curY); return; }
	}
	if (!this.ground) return (this.updatePosition(curX, curY));
	let xDir = this.xDir || 1;
	if ((curX <= 0 && xDir < 0) || (curX >= GRIDW - 1 && xDir > 0)) xDir = -xDir;

	const maxSteps = Math.min(spreadAm - 1, xDir > 0 ? (GRIDW - 1 - curX) : curX);
	let newX = curX;
	let found = false;

	for (let i = 1; i <= maxSteps; i++) {
		const xp = curX + i * xDir;
		const cell = pxAtP(xp, curY, this);

		if (cell) {
			if (cell.updT === 'ALIVE') continue;
			if (cell.physT !== 'LIQUID') break;
			if (cell.type !== this.type && cell.dns > this.dns) { this.swap(cell); return; }
			const below = pxAtP(xp, curY + 1, this);
			if (!below) { newX = xp; curY++; found = true; break; }
		} else {
			newX = xp; found = true; break;
		}
	}
	this.xDir = !found ? -xDir : xDir;
	curX = newX;
	this.updatePosition(curX, curY);
	// this.updatePosition(this.x, this.y);
};


p.FireEffect = function (curX, curY)
{
	let depth = 2;
	for (let y = -depth; y < depth; y++)
	{
		for (let x = -depth; x < depth; x++) {
			if ((x === 0 && y === 0) || isOutOfBorder(x + curX, y + curY)) continue;
			let px = pxAtP(curX + x, curY + y, this);
			if (px && px.physT === 'LIQUID' && (!px.brn && px.type != 'LAVA'))
			{
				if (px.frozen) px.unFreeze(10000);
				else {
					this.lt = 50;
					if (px.y > 0 && dice(20)) {
						px = px.replace('BUBBLE');
						px.transformType = px.type === 'WATER' ? 'STEAM' : 'SMOKE';
					}
				}
				continue;
			}
			if (px && shouldBurn(this, px)) px.setToFire();
		}
	}
	this.updatePosition(curX, curY);
}

p.MagmaEffect = function(curX, curY)
{
	let pxFound = 0;
	let depth = 2;
	for (let y = -depth; y < depth; y++)
	{
		for (let x = -depth; x < depth; x++) {
			if ((x === 0 && y === 0) || isOutOfBorder(x + curX, y + curY)) continue;
			let realX = curX + x, realY = curY + y;
			let px = pxAtP(realX, realY, this);
			if (px) pxFound += (px.type === 'MAGMA' ? .05 : 1);
			else if (y < 0 && dice(500)) new Particle(realX, realY, 'SMOKE');
			if (px && px.physT === 'LIQUID' && !px.brn && dice(20)) {
				if (px.frozen) px.unFreeze(2000);
				else this.setType('ROCK');				
			}
			if (px && shouldBurnParticle('MAGMA', px))
			{
				px.setToFire();
				if (!pxAtP(px.x, px.y - 1, this)) new Particle(px.x, px.y - 1, 'SMOKE');
			}
		}
	}
	if (this.timeAlive > this.lt && pxFound <= 3) this.setType('ROCK');
	this.updatePosition(curX, curY);
}
p.LavaEffect = function(curX, curY)
{
	if (!pxAtP(this.x, this.y - 1, this) && dice(200))
		new Particle(this.x, this.y - 1, 'SMOKE');
	let depth = 3;
	let hasExplosion = false;
	for (let y = -depth; y < depth; y++) {
		for (let x = -depth; x < depth; x++) {
			let px = pxAtP(curX + x, curY + y, this);
			if (!px) continue;
			if (px.type === this.type) continue;
			if (px.type === 'WATER' || px.type === 'BUBBLE') { px.setType('STEAM'); continue; }
			if (!px.brn) continue;
			if (dice(1002 - px.brn))
			{
				px.velY = 0;
				px.velX = 0;
				hasExplosion = true;
				px.setToFire();
				break;
			}
		}
	}
	if (hasExplosion)
	{
		depth = 3;
		for (let y = -depth; y < depth; y++) {
		for (let x = -depth; x < depth; x++) {
			let px = pxAtP(curX + x, curY + y, this);
			if (!px) new Particle(curX + x, curY + y, 'FIRE');
		} 
	}
	}
}

p.applyFrost = function (ignoreType = null, frostAmount = this.frozen - 1) {
    const dirs = [[1, 0],[-1, 0],[0, 1],[0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const rdir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = this.x + rdir[0];
    const ny = this.y + rdir[1];
    if (nx < 0 || nx >= GRIDW || ny < 0 || ny >= GRIDH) return;
	const px = pxAtP(nx, ny, this);
    if (!px || px === this || px.frozen) return;
    if (ignoreType && px.type === ignoreType) return;
	if (px.brnpwr) { if (this.frozen && dice(10)) {this.unFreeze(px.warm); this.warm = 500;} }
    else  px.setFrozen(frostAmount);
};

p.applyCorrosion = function(){
	for (let x = -2; x < 2; x++){
		for (let y = -2; y < 2; y++){
			let px = pxAtP(this.x + x, this.y + y, this);
			if (!px) continue;
			if (px.type === this.type) continue;
			if (px.physT === 'LIQUID') continue;
			if (px.cor >= this.cor) continue;
			if (this.cor <= px.dns) continue;
			if (this.type === 'SHROOMX') return (px.replace('ACID'));
			if (!dice(1001 - this.cor + (px.dns))) continue;
			px = px.replace('BUBBLE');
			px.transformType = this.type;
		}
	}
}
