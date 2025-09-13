p.updateLiquidVelocity = function (g) {
	if (this.isWater) {
		if (!g && dice(20000)) {
			const n = this.replace('BUBBLE');
			n.transformType = 'WATER';
			return;
		}
		if (dice(400) && !pxAtI(ROWOFF[this.y - 1] + this.x, this))
		{
			const n = this.replace('BUBBLE');
			n.transformType = 'WATER';
			return;
		}
	}
	this.velY += GRAVITY;
	// this.velY *= 1 - g.dns * .1;
	// this.velX *= .99;
};

p.updateGasVelocity = function () {
	if (this.type === 'STEAM' || this.type === 'CLOUD' || ((this.id + time) % 5) === 0)
		this.velX = getSin(now * 0.002, 5, 0.6, this.id * 0.3);
};

p.updateSolidVelocity = function (g) {
	// if (this.type === 'ANT' && this.hasTouchedBorder) return;
	if (this.type === 'FISH' && this.inWater) return;
	if (g && g.physT === 'LIQUID') {
		this.velY += GRAVITY;
		this.velY *= 1 - g.dns * .1;
		this.velX *= .99;
		return;
	}
	if (!this.hasTouchedBorder) {
		this.hasTouchedBorder = (this.y >= GH - 1 || (g && g.hasTouchedBorder));
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
	const g = pxAtI(ROWOFF[this.y + (pt === 'GAS' ? -1 : 1)] + this.x, this);
	this.ground = g;
	if (pt === 'LIQUID') return this.updateLiquidVelocity(g);
	if (pt === 'GAS') return this.updateGasVelocity();
	if (this.updT !== 'STATIC') return this.updateSolidVelocity(g);
};
