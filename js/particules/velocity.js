p.updateLiquidVelocity = function (g) {
	if (!g && this.type === 'WATER' && dice(20000)) {
		const n = this.replace('BUBBLE');
		n.transformType = 'WATER';
		return;
	}
	if (dice(400) && !pxAtP(this.x, this.y - 1, this))
	{
		const n = this.replace('BUBBLE');
		n.transformType = 'WATER';
		return;
	}
	this.velY += GRAVITY;
	// this.velY *= 1 - g.dns * .1;
	// this.velX *= .99;
};

p.updateGasVelocity = function () {
	if (this.type === 'STEAM' || this.type === 'CLOUD' || ((this.id + time) % 5) === 0)
		this.velX = getSin(now * 0.002, 5, 0.9, this.id * 0.3);
};

p.updateSolidVelocity = function (g) {
	if (this.type === 'ANT' && this.hasTouchedBorder) return;
	if (this.type === 'FISH' && this.inWater) return;
	if (g && g.physT === 'LIQUID') {
		this.velY += GRAVITY;
		this.velY *= 1 - g.dns * .1;
		this.velX *= .99;
		return;
	}
	const grounded = g && (g.physT === 'SOLID' || g.frozen) && g.velY === 0;
	if (grounded && this.updT !== 'ALIVE') {
		this.velY = g.updT === 'STATIC' ? 1 : 0;
		this.velX *= (1 - XDRAG);
		if (this.velX > -0.01 && this.velX < 0.01) this.velX = 0;
	} else if (!g) this.velY += GRAVITY;
};

p.updateVelocity = function () {
	const pt = this.physT;
	const g = pxAtP(this.x, this.y + (pt === 'GAS' ? -1 : 1), this);
	this.ground = g;
	if (pt === 'LIQUID') return this.updateLiquidVelocity(g);
	if (pt === 'GAS') return this.updateGasVelocity();
	if (this.updT !== 'STATIC') return this.updateSolidVelocity(g);
};
