p.swap = function(other)
{
	let otherX = other.x, otherY = other.y;
	other.updatePosition(this.x, this.y, false);
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
			px = getPxlAtPos(this.x, this.y + y);
			if (px && px.solType == 'SOLID') {
				if (hasBubble && dice(10)) new Particle(this.newX, this.newY - 1, this.type == 'LAVA' ? 'SMOKE' : 'BUBBLE');
				return (true);
			}
			if (!px) break;
		}
		return (px != null);
}

p.setVel = function (newX = 0, newY = 0) { this.velX = newX; this.velY = newY; }

p.setColor = function (color = this.properties.color) {this.color = color; this.rgb = hexToRgb(this.color);}

p.setType = function(newType)
{
	this.type = newType;
	this.properties = PARTICLE_PROPERTIES[newType];
	this.douse = this.properties.douse;
	this.solType = this.properties.solType;
	this.lifeTime = this.properties.lifeTime * f_range(.5, 1.5);
	this.flammability = this.properties.flammability;
	this.density = this.properties.density;
	this.spreadAmount = this.properties.spread;
	this.updType = this.properties.updType;
	this.color = this.solType != 'LIQUID' || this.type == 'LAVA' ? randomizeColor(this.properties.color) : this.properties.color;
	this.rgb = hexToRgb(this.color);
	this.flowDir = r_range(0, 2) == 0 ? -1 : 1;
	if (this.updType == 'STATIC') { this.velY = 0; this.velX = 0; }
	if (this.type == 'BLOB')
	{
		this.velX = 0; this.velY = 0;
		this.dirAng = Math.atan2(f_range(-1,1), f_range(-1,1));
		this.oscPhase = Math.random() * Math.PI * 2;
		this.oscSpeed = f_range(0.0025, 0.006);
		this.oscAmp = f_range(2, 6);
	}
	if (this.type == 'COAL') { this.velX = 0; }
}

function shouldBurn(agressor, victim)
{
	let flammability = victim.flammability;
	if (victim.wet && victim.wetType) flammability = PARTICLE_PROPERTIES[victim.wetType].flammability;
	if (!agressor.burner || !flammability) return (0);
	let sumChance = Math.max(1, 2000 - flammability - agressor.burner);
	return (dice(sumChance));
}
function shouldBurnType(typeA, typeB)
{
	let burnForce = PARTICLE_PROPERTIES[typeA].burner;
	let flammability = PARTICLE_PROPERTIES[typeB].flammability;
	if (!burnForce || !flammability) return (0);
	let sumChance = Math.max(1, 2000 - flammability - burnForce);
	return (dice(sumChance));
}
function shouldBurnParticle(typeA, victim)
{
	let burnForce = PARTICLE_PROPERTIES[typeA].burner;
	let flammability = victim.flammability;
	if (victim.wet && victim.wetType) flammability = PARTICLE_PROPERTIES[victim.wetType].flammability;
	if (!burnForce || !flammability) return (0);
	let sumChance = Math.max(1, 2000 - flammability - burnForce);
	return (dice(sumChance));
}

function getSin(t, freq, amp, phase) {
	return (Math.sin(t * freq + phase) * amp);
}

