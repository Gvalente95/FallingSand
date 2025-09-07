p.swap = function(other)
{
	if (isOutOfBorder(this.x, this.y)) return;
	let otherX = other.x, otherY = other.y;
	grid[this.x][this.y] = null;
	other.updatePosition(this.x, this.y, false);
	grid[otherX][otherY] = null;
	this.updatePosition(otherX, otherY, false);
}
	
p.hasTouchedSurfaceCheck = function()
	{
		let y = 0;
		let px = null;
		let hasBubble = this.type == 'WATER';
		while (++y < 50)
		{
			if (this.y + y >= GRIDH - 1) {
				if (hasBubble && dice(10)) new Particle(this.newX, this.newY - 1, this.type == 'LAVA' ? 'SMOKE' : 'BUBBLE');
				return (true);
			}
			px = pxAtP(this.x, this.y + y);
			if (px && (px.physT == 'SOLID' || px.physT == 'STATIC')) {
				if (hasBubble && dice(10)) new Particle(this.newX, this.newY - 1, this.type == 'LAVA' ? 'SMOKE' : 'BUBBLE');
				return (true);
			}
			if (!px) break;
		}
		return (px != null);
}

p.setVel = function (newX = 0, newY = 0) { this.velX = newX; this.velY = newY; }

p.setColor = function(color = this.properties.color) {
    this.color = color;
    if (color.startsWith("rgb")) {
        const rgb = color.match(/\d+/g);
        this.rgb = `${rgb[0]},${rgb[1]},${rgb[2]}`;
    } else this.rgb = hexToRgb(color);
}

p.replace = function(newType){
	let p = [this.x, this.y];
	this.toRemove();
	new Particle(p[0], p[1], newType);
}

p.setType = function(newType)
{
	this.type = newType;
	this.properties = PARTICLE_PROPERTIES[newType];
	this.douse = this.properties.douse;
	this.physT = this.properties.physT;
	this.lt = this.properties.lt * f_range(.5, 1.5);
	this.brn = this.properties.brn;
	this.brnpwr = this.properties.brnpwr;
	this.cor = this.properties.cor;
	this.dns = this.properties.dns;
	this.spreadAmount = this.properties.spread;
	this.updT = this.properties.updT;
	this.inWater = false;
	this.setColor(
		this.physT != 'LIQUID' || this.type == 'LAVA' ? randomizeColor(this.properties.color) : this.properties.color);
	this.xDir = r_range(0, 2) == 0 ? -1 : 1;
	this.yDir = r_range(0, 2) == 0 ? -1 : 1;
	if (this.updT == 'STATIC') { this.velY = 0; this.velX = 0; }
	if (this.type == 'PLANT' || this.type == 'FISH')
	{
		this.velX = 0; this.velY = 0;
		this.dirAng = Math.atan2(f_range(-1,1), f_range(-1,1));
		this.oscPhase = Math.random() * Math.PI * 2;
		this.oscSpeed = f_range(0.0025, 0.006);
		this.oscAmp = this.type == 'FISH' ? f_range(.3, 1) : f_range(2, 6);
	}
	else if (this.type == 'COAL') { this.velX = 0; }
}

function shouldBurn(agressor, victim)
{
	let brn = victim.brn;
	if (victim.wet && victim.wetType) brn = PARTICLE_PROPERTIES[victim.wetType].brn;
	if (!agressor.brnpwr || !brn) return (0);
	let sumChance = Math.max(1, 2000 - brn - agressor.brnpwr);
	return (dice(sumChance));
}

function shouldBurnType(typeA, typeB)
{
	let burnForce = PARTICLE_PROPERTIES[typeA].brnpwr;
	let brn = PARTICLE_PROPERTIES[typeB].brn;
	if (!burnForce || !brn) return (0);
	let sumChance = Math.max(1, 2000 - brn - burnForce);
	return (dice(sumChance));
}
function shouldBurnParticle(typeA, victim)
{
	let burnForce = PARTICLE_PROPERTIES[typeA].brnpwr;
	let brn = victim.brn;
	if (victim.wet && victim.wetType) brn = PARTICLE_PROPERTIES[victim.wetType].brn;
	if (!burnForce || !brn) return (0);
	let sumChance = Math.max(1, 2000 - brn - burnForce);
	return (dice(sumChance));
}

function getSin(t, freq, amp, phase) {
	return (Math.sin(t * freq + phase) * amp);
}
