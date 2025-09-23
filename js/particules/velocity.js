p.updateLiquidVelocity = function (g) {
	if (this.type === 'WATER') {
		if (!g && dice(20000)) {
			let type = this.type;
			const n = this.replace('BUBBLE', type);
			let curClr = n.baseColor;
			let newClr = addColor(curClr, this.baseColor, .5)
			n.setColor(newClr);
			return;
		}
		if (dice(400) && !pxAtI(ROWOFF[this.y - 1] + this.x, this))
		{
			let prvClr = this.baseColor;
			let type = this.type;
			const n = this.replace('BUBBLE', type);
			let curClr = n.baseColor;
			let newClr = addColor(curClr, prvClr, .5)
			n.setColor(newClr);
			return;
		}
	}
	if (this.updT != 'STATIC')
		this.velY += GRAVITY;
};

p.updateGasVelocity = function () {
	if (atBorder(this.x, this.y)) this.toRemove();
	if (this.type === 'SMOKE') {
		this.velY = -1.5;
		if (FRAME % 2 === 0) return;
	}
	if (this.type === 'DUST') this.velX = getSin(now * 0.002, 2, 1.2, this.id * 0.3);
	else this.velX = getSin(now * 0.002, 10, 0.6, this.id * 0.3);
};

p.updateSolidVelocity = function (g) {
	if (this.y < GH - 1 && (this.x === 0 || this.x == GW - 1 || this.y === 0)) { this.velX *= -1; this.velY = 2; }
	if (this.type === 'FISH' && this.inWater) return;
	if (this.type === 'SNOW') {
		if (FRAME % 2 != 0) { this.velX = this.velY = 0; return; }
		if (!this.velX && dice(10)) this.velX = rdir() * 2;
		this.velY = 2;
		return;
	}
	if (g && g.physT === 'LIQUID') {
		this.velY += GRAVITY;
		this.velY *= 1 - g.dns * .1;
		this.velX *= .99;
		return;
	}
	if (!this.hasTouchedBorder) {
		this.hasTouchedBorder = (this.y >= GH - 1 || (g && (g.updT === 'STATIC' || g.hasTouchedBorder)));
		if (this.hasTouchedBorder) {this.velX = 0;}	
	}
	else if (this.hasTouchedBorder > 0 && !g && this.y < GH - 1) {
		this.hasTouchedBorder--;
	}
	const grounded = g && g.velY === 0 && (g.physT === 'SOLID' || g.frozen);
	if (grounded && this.updT !== 'ALIVE') {
		this.velY = g.updT === 'STATIC' ? 1 : 0;
		this.velX *= (1 - XDRAG);
		if (Math.abs(this.velX) < .01) this.velX = 0;
	} else if (!g) this.velY += GRAVITY;
};

p.updateVelocity = function () {
	const pt = this.physT;
	// let Y = ((pt === 'GAS' || GRAVITY < 0) ? -1 : 1);
	// const g = pxAtI(ROWOFF[this.y + Y] + this.x, this);
	const g = ((GRAVITY < 0 || pt === 'GAS') ? this.u : this.d);
	this.ground = g;
	if (pt === 'LIQUID') return this.updateLiquidVelocity(g);
	if (pt === 'GAS') return this.updateGasVelocity();
	if (this.updT !== 'STATIC') return this.updateSolidVelocity(g);
};
