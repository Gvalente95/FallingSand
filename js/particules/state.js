p.stopFire = function ()
{
	this.burning = 0;
	if (this.wet) this.color = addColor(PARTICLE_PROPERTIES[this.type].color, "rgba(6, 88, 241, 1)", .3);
	else this.color = PARTICLE_PROPERTIES[this.type].color;
	this.rgb = hexToRgb(this.color);
}
p.setToFire = function()
{
	if (this.wet > 50 && this.wetType != 'OIL') { this.wet -= 50; return; }
	if (this.burning) return;
	if (this.type == 'MAGMA') this.setType('MAGMA');
	else if (this.type == 'MAGMA') this.setType('LAVA');
	else {
		this.burning = 120 - (this.burnable / 10);
		this.setColor(this.type == 'COAL' ? 'rgba(129, 89, 80, 1)' : 'rgba(228, 76, 16, 1)');
	}
}

p.setWet = function(wetAmount = 100, type = 'WATER') {
	if (this.solType != 'SOLID') return (0);
	if (this.burner) return (0);
	if (this.wet) { this.wet = wetAmount; this.wetType = type; return (1); }
	if (type != 'OIL') this.burning = 0;
	this.setColor(addColor(PARTICLE_PROPERTIES[this.type].color, PARTICLE_PROPERTIES[type].color, .3));
	this.wet = wetAmount;
	this.wetType = type;
	return (1);
}
