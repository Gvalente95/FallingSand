p.updateBurn = function () {
	this.warm = 100;
	if (this.frozen) { this.frozen -= 50; this.burning = 0; }
	if (--this.burning <= 0)
	{
		if (this.type == 'OIL') this.lt = 0;
		else if (this.type == 'SAND' && dice(20)) this.setType('GLASS');
		else this.setType('COAL');
		this.burning = 0;
	}
	else if (dice(10) && !pxAtP(this.x, this.y - 1)) new Particle(this.x, this.y - 1, 'FIRE');
	let depth = 2;
	for (let x = -depth; x < depth; x++)
		for (let y = -depth; y < depth; y++)
		{
			if (x == 0 && y == 0) continue;
			if (isOutOfBorder(this.x + x, this.y + y)) continue;
			let px = pxAtP(this.x + x, this.y + y, this);
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
	if (this.frozen) { this.frozen -= 50; return; }
	if (this.wet > 50 && this.wetType != 'OIL') { this.wet -= 50; return; }
	if (this.burning) return;
	if (this.type == 'MAGMA') this.setType('MAGMA');
	else if (this.type == 'MAGMA') this.setType('LAVA');
	else {
		this.burning = 120 - (this.brn / 10);
		this.setColor(this.type == 'COAL' ? 'rgba(129, 89, 80, 1)' : 'rgba(228, 76, 16, 1)');
	}
}

p.setWet = function(wetAmount = 100, type = 'WATER') {
	if (this.physT != 'SOLID') return (0);
	if (this.brnpwr) return (0);
	if (this.wet) { this.wet = wetAmount; this.wetType = type; return (1); }
	if (type != 'OIL') this.burning = 0;
	this.setColor(addColor(PARTICLE_PROPERTIES[this.type].color, PARTICLE_PROPERTIES[type].color, .3));
	this.wet = wetAmount;
	this.wetType = type;
	return (1);
}

p.updateWet = function () {
	if (this.burning) { if (this.wetType == 'OIL') this.wet = 0; else this.stopFire();}
	if (time % 10 == 0 && --this.wet <= 0) this.setColor();
	else if (this.wet > 80)
	{
		let depth = 2;
		for (let x = -depth; x < depth; x++)
		for (let y = -depth; y < depth; y++)
		{
			if (x == 0 && y == 0) continue;
			if (isOutOfBorder(this.x + x, this.y + y)) continue;
			let px = pxAtP(this.x + x, this.y + y, this);
			if (px) px.setWet(this.wet - 10, this.wetType);
		}
	}
	if (dice(5000)) {
		let pxAb = pxAtP(this.x, this.y - 1);
		if (pxAb && pxAb.type === this.wetType)
			pxAb.replace('BUBBLE');			
	}
}

p.setFrozen = function (freezeAmount) {
	if (this.burning || this.warm) return;
	if (this.frozen) { this.frozen = freezeAmount; return; }
	this.frozen = freezeAmount;
	this.setColor(randomizeColor('rgba(140, 184, 208, 0)'));
}

p.unFreeze = function(warmAmount = 5){
	this.frozen = 0;
	this.warm = warmAmount;
	this.setColor();
}

p.updateFrost = function () {
	
	this.applyFrost('FROST', this.frozen);
	if (--this.frozen <= 0 || this.warm || this.burning) this.unFreeze();
}

p.updateState = function()
{
	if (this.warm) this.warm--;
	if (this.frozen) this.updateFrost();
	if (this.wet) this.updateWet();
	if (this.burning) this.updateBurn();
}