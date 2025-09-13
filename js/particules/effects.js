p.FireEffect = function (curX, curY)
{
	let depth = 2;
	for (let y = -depth; y < depth; y++)
	{
		for (let x = -depth; x < depth; x++) {
			if ((x === 0 && y === 0) || isOutOfBorder(x + curX, y + curY)) continue;
			let px = pxAtI(ROWOFF[curY + y] + curX + x, this);
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
	this.updatePosition(ROWOFF[curY] + curX);
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
			let px = pxAtI(ROWOFF[realY] + realX, this);
			if (px) pxFound += (px.type === 'MAGMA' ? .05 : 1);
			else if (y < 0 && dice(500)) new Particle(realX, realY, 'SMOKE');
			if (px && px.physT === 'LIQUID' && !px.brn && dice(20)) {
				if (px.frozen) px.unFreeze(2000);
				else this.setType('ROCK');				
			}
			if (px && shouldBurnParticle('MAGMA', px))
			{
				px.setToFire();
				if (!pxAtI(ROWOFF[px.y - 1] + px.x, this)) new Particle(px.x, px.y - 1, 'SMOKE');
			}
		}
	}
	if (this.timeAlive > this.lt && pxFound <= 3) this.setType('ROCK');
	this.updatePosition(ROWOFF[curY] + curX);
}
p.LavaEffect = function(curX, curY)
{
	if (!pxAtI(ROWOFF[this.y - 1] + this.x, this) && dice(200))
		new Particle(this.x, this.y - 1, 'SMOKE');
	let depth = 3;
	let hasExplosion = false;
	for (let y = -depth; y < depth; y++) {
		for (let x = -depth; x < depth; x++) {
			let px = pxAtI(ROWOFF[curY + y] + curX + x, this);
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
			let px = pxAtI(ROWOFF[curY + y] + curX + x, this);
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
    if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) return;
	const px = pxAtI(ROWOFF[ny] + nx, this);
    if (!px || px === this || px.frozen) return;
    if (ignoreType && px.type === ignoreType) return;
	if (px.brnpwr) { if (this.frozen && dice(10)) {this.unFreeze(px.warm); this.warm = 500;} }
    else  px.setFrozen(frostAmount);
};

p.applyCorrosion = function(){
	for (let x = -2; x < 2; x++){
		for (let y = -2; y < 2; y++){
			let px = pxAtI(ROWOFF[this.y + y] + this.x + x, this);
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
