p.FireEffect = function (curX, curY)
{
	for (let i = 0; i < this.neighbors.length; i++){
		let px = this.neighbors[i];
		if (px.frozen) { this.lt = 0;  if (dice(10)) px.unFreeze(100); return; }
		if (px.physT === 'LIQUID' && (!px.brn && px.type != 'LAVA'))
		{
			if (px.frozen) px.unFreeze(100);
			else {
				if (px.y > 0 && dice(20)) {
					px = px.replace('BUBBLE', px.type === 'WATER' ? 'STEAM' : 'DUST');
				}
			}
			continue;
		}
		if (shouldBurn(this, px)) px.setToFire(this.type);
	}
	this.updatePosition(ROWOFF[curY] + curX);
}

p.MagmaEffect = function(curX, curY)
{
	let pxFound = 0;
	if (!this.u && dice(500)) new Particle(this.x, this.y - 1, 'DUST');
	for (let i = 0; i < this.neighbors.length; i++){
		let px = this.neighbors[i];
		if (px) pxFound += (px.type === 'MAGMA' ? .05 : 1);
		if (px && px.physT === 'LIQUID' && !px.brn && dice(20)) {
			if (px.frozen) px.unFreeze(2000);
			else this.setType('ROCK');				
		}
		if (px && shouldBurnParticle('MAGMA', px))
		{
			px.setToFire();
			if (!pxAtI(ROWOFF[px.y - 1] + px.x, this)) new Particle(px.x, px.y - 1, 'DUST');
		}
	}
	if (this.timeAlive > this.lt && pxFound <= 3) this.setType('ROCK');
	this.updatePosition(ROWOFF[curY] + curX);
}
p.LavaEffect = function(curX, curY)
{
	if (!this.u && dice(200)) new Particle(this.x, this.y - 1, 'DUST');
	for (let i = 0; i < this.neighbors.length; i++){
		let px = this.neighbors[i];
		if (px.type === this.type) continue;
		if (px.type === 'WATER' || px.type === 'BUBBLE')
		{
			this.setType('ROCK');
			px.setType('STEAM'); continue;
		}
		if (shouldBurn(this, px))
		{
			px.setType('LAVA');
			if (dice(50)) explodeRadius(this.x * PIXELSIZE, this.y * PIXELSIZE, 10, 3, 'FIRE', 'FIRE');
			break;
		}
	}
}

p.applyFrost = function (ignoreType = null, frostAmount = this.frozen - 1, resetDur = false) {
	if (!this.neighbors || !this.neighbors.length) return;
	let px = this.neighbors[r_range(0, this.neighbors.length)];
	if (px.freeze) return;
	if (ignoreType && px.type === ignoreType) return;
	if (px.brnpwr) { if (this.frozen && dice(10)) { this.unFreeze(px.warm); this.warm = 500; } }
	else px.setFrozen(frostAmount);
};

p.applyCorrosion = function () {
	for (let i = 0; i < this.neighbors.length; i++) {
	const px = this.neighbors[i];
	if (!px) continue;
	if (px.type === this.type) continue;
	if (px.physT === 'LIQUID' || px.physT === 'GAS') continue;
	if (px.cor >= this.cor) continue;
	if (this.cor <= px.dns) continue;
	if (this.type === 'MUSHX') { px.replace?.('ACID'); continue; }
	if (!dice(1001 - this.cor + px.dns)) continue;
	const res = px.replace?.('BUBBLE', this.type);
	const n = res || px;
	const curClr =
		n.baseColor ??
		n.color ??
		n.properties?.color ??
		PARTICLE_PROPERTIES[n.type]?.color;
	if (!curClr) continue;
	const newClr = addColor(curClr, this.baseColor, 0.5);
	n.setColor(newClr);
	}
}

p.makeHole = function(px){
	for (let x = -3; x < 3; x++) {
		for (let y = -3; y < 0; y++) {
			let npx = pxAtI(ROWOFF[px.y + y] + px.x + x, this);
			if (npx && (npx.updT != 'ALIVE' && npx.physT === 'SOLID')) {
				npx.updT = 'STATIC';
				npx.setColor(addColor(PARTICLE_PROPERTIES[npx.type].color, "rgba(0,0,0,1)", .1));
			}
		}
	}
	if (dice(2)) this.xDir = r_range(-1, 1);
	else this.yDir = r_range(-2, 2);
	px.toRemove();
}