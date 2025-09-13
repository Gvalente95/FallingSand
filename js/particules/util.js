p.swap = function(other)
{
	const otherX = other.x, otherY = other.y;
	other.i = this.x + (this.y * GW);
	this.i = otherX + (otherY * GW);
	grid1[this.i] = this;
	grid1[other.i] = other;
	other.x = this.x;
	other.y = this.y;
	this.x = otherX;
	this.y = otherY;
}

p.hasTouchedSurfaceCheck = function()
	{
		let y = 0;
		let px = null;
		let hasBubble = this.type == 'WATER' && this.timeAlive > 2;
		let newY;
		while (++y < 50)
		{
			newY = this.y + y;
			if (newY >= GH - 1) {
				if (hasBubble && dice(10)) new Particle(this.newX, this.newY - 1, this.type == 'LAVA' ? 'SMOKE' : 'BUBBLE');
				return (true);
			}
			px = pxAtI(ROWOFF[newY] + this.x);
			if (px && (px.physT == 'SOLID')) {
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
	return (new Particle(p[0], p[1], newType));
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
