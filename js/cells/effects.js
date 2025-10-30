p.FireEffect = function (curX, curY)
{
	for (let i = 0; i < this.neighbors.length; i++){
		let cell = this.neighbors[i];
		if (cell.frozen) { this.lt = 0;  if (dice(10)) cell.unFreeze(100); return; }
		if (cell.physT === 'LIQUID' && (!cell.brn && cell.type != 'LAVA'))
		{
			if (cell.frozen) cell.unFreeze(100);
			else {
				if (cell.y > 0 && dice(20)) {
					cell = cell.replace('BUBBLE', cell.type === 'WATER' ? 'STEAM' : 'DUST');
				}
			}
			continue;
		}
		if (shouldBurn(this, cell)) cell.setToFire(this.type);
	}
	this.updatePosition(ROWOFF[curY] + curX);
}

p.MagmaEffect = function(curX, curY)
{
	if (!this.u && dice(500)) new Cell(this.x, this.y - 1, 'DUST');
	for (let i = 0; i < this.neighbors.length; i++){
		let cell = this.neighbors[i];
		// if (cell) cellFound += (cell.type === 'MAGMA' ? .05 : 1);
		if (cell && cell.physT === 'LIQUID' && !cell.brn && dice(20)) {
			if (cell.frozen) cell.unFreeze(2000);
			else this.setType('ROCK');				
		}
		if (cell && shouldBurnCell('MAGMA', cell))
		{
			cell.setToFire();
			if (!cellAtI(ROWOFF[cell.y - 1] + cell.x, this)) new Cell(cell.x, cell.y - 1, 'DUST');
		}
	}
	// if (this.timeAlive > this.lt && cellFound <= 3) this.setType('ROCK');
	this.updatePosition(ROWOFF[curY] + curX);
}
p.LavaEffect = function(curX, curY)
{
	if (!this.u && dice(200)) new Cell(this.x, this.y - 1, 'DUST');
	for (let i = 0; i < this.neighbors.length; i++){
		let cell = this.neighbors[i];
		if (cell.type === this.type) continue;
		if (cell.type === 'WATER' || cell.type === 'BUBBLE')
		{
			this.setType('ROCK');
			cell.setType('STEAM'); continue;
		}
		if (shouldBurn(this, cell))
		{
			cell.setType('LAVA');
			if (dice(50)) explodeRadius(this.x * PIXELSIZE, this.y * PIXELSIZE, 10, 3, 'FIRE', 'FIRE');
			break;
		}
	}
}

p.applyFrost = function (ignoreType = null, frostAmount = this.frozen - 1, resetDur = false) {
	if (!this.neighbors || !this.neighbors.length) return;
	let cell = this.neighbors[r_range(0, this.neighbors.length)];
	if (cell.freeze) return;
	if (ignoreType && cell.type === ignoreType) return;
	if (cell.brnpwr) { if (this.frozen && dice(10)) { this.unFreeze(cell.warm); this.warm = 500; } }
	else cell.setFrozen(frostAmount);
};

p.applyCorrosion = function () {
	for (let i = 0; i < this.neighbors.length; i++) {
		const cell = this.neighbors[i];
		if (!cell) continue;
		if (cell.type === this.type) continue;
		if (cell.physT === 'LIQUID' || cell.physT === 'GAS') continue;
		if (cell.cor >= this.cor) continue;
		if (this.cor <= cell.dns) continue;
		if (this.type === 'MUSHX') { cell.replace?.('ACID'); continue; }
		if (!dice(1001 - this.cor + cell.dns)) continue;
		const res = cell.replace?.('BUBBLE', this.type);
		const n = res || cell;
		const curClr =
			n.baseColor ??
			n.color ??
			n.properties?.color ??
			CELL_PROPERTIES[n.type]?.color;
		if (!curClr) continue;
		const newClr = addColor(curClr, this.baseColor, 0.5);
		n.setColor(newClr);
		n.corrosionType = this.type;
	}
}

p.makeHole = function(cell){
	for (let x = -3; x < 3; x++) {
		for (let y = -3; y < 0; y++) {
			let ncell = cellAtI(ROWOFF[cell.y + y] + cell.x + x, this);
			if (ncell && (ncell.updT != 'ALIVE' && ncell.physT === 'SOLID')) {
				ncell.updT = 'STATIC';
				ncell.setColor(addColor(CELL_PROPERTIES[ncell.type].color, "rgba(0,0,0,1)", .1));
			}
		}
	}
	if (dice(2)) this.xDir = r_range(-1, 1);
	else this.yDir = r_range(-2, 2);
	cell.toRemove();
}