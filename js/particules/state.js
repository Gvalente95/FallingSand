p.updateBurn = function () {
	if (this.frozen) { this.frozen -= 50; this.burning = 0; }
	if (--this.burning <= 0)
	{
		if (this.expl) {return (this.lt = r_range(1, 20));}
		if (this.type === 'OIL') this.lt = 0;
		else if (this.type === 'SAND' && dice(20)) this.setType('GLASS');
		else this.setType('COAL');
		this.burning = 0;
	}
	else if (dice(10) && !pxAtI(ROWOFF[this.y - 1] + this.x)) new Particle(this.x, this.y - 1, 'FIRE');
	let depth = 2;
	for (let x = -depth; x < depth; x++)
		for (let y = -depth; y < depth; y++)
		{
			if (x === 0 && y === 0) continue;
			if (isOutOfBorder(this.x + x, this.y + y)) continue;
			let px = pxAtI(ROWOFF[this.y + y] + this.x + x, this);
			if (px && !px.burning && shouldBurnParticle('FIRE', px)) px.setToFire();
			if (!px && dice(30)) new Particle(this.x + x, this.y + y, 'SMOKE');
		}
}

p.stopFire = function ()
{
	if (this.wet) this.color = addColor(PARTICLE_PROPERTIES[this.type].color, "rgba(6, 88, 241, 1)", .3);
	else this.color = PARTICLE_PROPERTIES[this.type].color;
	this.rgb = hexToRgb(this.color);
	this.burning = 0;
}

p.setToFire = function()
{
	if (this.frozen) { this.unFreeze(50); return; }
	if (this.type === 'ROCK') {return (this.setType('MAGMA'));}
	if (this.type === 'ICE') {return (this.setType('WATER'));}
	this.warm = 200;
	if (this.wet > 50 && this.wetType != 'OIL') { this.wet -= 50; return; }
	if (this.burning) return;
	if (this.type === 'MAGMA') this.setType('MAGMA');
	else if (this.type === 'MAGMA') this.setType('LAVA');
	else {
		this.burning = 120 - (this.brn / 10);
		this.setColor(addColor(this.baseColor, 'rgba(255, 0, 0, 1)', .3));
	}
}

p.setWet = function(wetAmount = 100, type = 'WATER') {
	if (this.physT != 'SOLID') return (0);
	if (this.isShroom || this.type === 'FISH') return (0);
	if (this.brnpwr) return (0);
	if (this.wet) { this.wet = wetAmount; this.wetType = type; return (1); }
	if (type != 'OIL') this.burning = 0;
	this.wetType = type;
	this.wet = wetAmount;
	this.setColor(addColor(this.baseColor, PARTICLE_PROPERTIES[this.wetType].color, .3));
	return (1);
}

p.updateWet = function () {
	if (this.burning) { if (this.wetType === 'OIL') this.wet = 0; else this.stopFire();}
	if (--this.wet <= 0) { this.setColor(this.baseColor); return;}
	else if (this.wet > 80)
	{
		let depth = 2;
		for (let x = -depth; x < depth; x++)
		for (let y = -depth; y < depth; y++)
		{
			if (x === 0 && y === 0) continue;
			if (isOutOfBorder(this.x + x, this.y + y)) continue;
			let px = pxAtI(ROWOFF[this.y + y] + this.x + x, this);
			if (px) px.setWet(this.wet - 10, this.wetType);
		}
	}
	if (dice(5000)) {
		let pxAb = pxAtI(ROWOFF[this.y - 1] + this.x);
		if (pxAb && pxAb.type === this.wetType) {
			pxAb = pxAb.replace('BUBBLE');
			pxAb.transformType = this.wetType;
		}
	}
	if (this.hasTouchedBorder && this.updT != 'ALIVE') {
		let shroomChance = (this.type === 'GRASS' ? 1000 : 10000) - this.wet;
		if (dice(shroomChance)) {
			this.setType('SHROOM');
			this.isGrower = true;
		}
	}
}

p.setFrozen = function (freezeAmount) {
	if (this.burning || this.warm) return;
	if (this.frozen) { this.frozen = freezeAmount; return; }
	this.frozen = freezeAmount;
	this.setColor(addColor(this.baseColor, 'rgba(146, 195, 205, 1)', .3));
}

p.unFreeze = function(warmAmount = 5){
	this.frozen = 0;
	this.warm = warmAmount;
	this.setColor(this.baseColor);
}

p.updateFreeze = function () {
	
	if (this.warm || this.burning) this.unFreeze();
	else this.applyFrost('ICE');
}

p.updateState = function()
{
	if (this.warm) this.warm--;
	if (this.frozen) this.updateFreeze();
	if (this.wet) this.updateWet();
	if (this.burning) this.updateBurn();
}