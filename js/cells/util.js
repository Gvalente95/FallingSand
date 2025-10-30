p.swap = function(other)
{
	const otherX = other.x, otherY = other.y;
	other.i = this.x + (this.y * GW);
	this.i = otherX + (otherY * GW);
	grid1[this.i] = this;
	grid1[other.i] = other;
	other.x = this.x;
	other.y = this.y;
	this.x = otherX;
	this.y = otherY;
}

p.hasTouchedSurfaceCheck = function()
	{
		let y = 0;
		let cell = null;
		let hasBubble = this.type == 'WATER' && this.timeAlive > 2;
		let newY;
		while (++y < 50)
		{
			newY = this.y + y;
			if (newY >= GH - 1) {
				if (hasBubble && dice(10)) new Cell(this.newX, this.newY - 1, this.type == 'LAVA' ? 'DUST' : 'BUBBLE');
				return (true);
			}
			cell = cellAtI(ROWOFF[newY] + this.x);
			if (cell && (cell.physT == 'SOLID')) {
				if (hasBubble && dice(10)) new Cell(this.newX, this.newY - 1, this.type == 'LAVA' ? 'DUST' : 'BUBBLE');
				return (true);
			}
			if (!cell) break;
		}
		return (cell != null);
}

p.setColor = function(color = this.properties.color) {
	this.color = color;
	const rgb = color.match(/\d+/g);
	this.rgb = `${rgb[0]},${rgb[1]},${rgb[2]}`;
}

p.replace = function(newType, transformType = null){
	let p = [this.x, this.y];
	this.toRemove();
	let newP = new Cell(p[0], p[1], newType);
	if (transformType) newP.transformType = transformType;
	return (newP);
}

function shouldBurn(agressor, victim)
{
	let brn = victim.brn;
	if (victim.wet && victim.wetType) brn = CELL_PROPERTIES[victim.wetType].brn;
	if (!agressor.brnpwr || !brn) return (0);
	let sumChance = Math.max(1, 2000 - brn - agressor.brnpwr);
	return (dice(sumChance));
}

function shouldBurnType(typeA, typeB)
{
	let burnForce = CELL_PROPERTIES[typeA].brnpwr;
	let brn = CELL_PROPERTIES[typeB].brn;
	if (!burnForce || !brn) return (0);
	let sumChance = Math.max(1, 2000 - brn - burnForce);
	return (dice(sumChance));
}
function shouldBurnCell(typeA, victim)
{
	let burnForce = CELL_PROPERTIES[typeA].brnpwr;
	let brn = victim.brn;
	if (victim.wet && victim.wetType) brn = CELL_PROPERTIES[victim.wetType].brn;
	if (!burnForce || !brn) return (0);
	let sumChance = Math.max(1, 2000 - brn - burnForce);
	return (dice(sumChance));
}

p.getRandomNeighbor = function (ignoreType = null) {
    const dirs = [[1, 0],[-1, 0],[0, 1],[0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const rdir = dirs[r_range(0, dirs.length)];
    const nx = this.x + rdir[0];
    const ny = this.y + rdir[1];
    if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) return;
	const cell = cellAtI(ROWOFF[ny] + nx, this);
	if (!cell || cell === this || (ignoreType && cell.type === ignoreType)) return null;
	return cell;
};
