p.swap = function(other)
{
	if (isOutOfBorder(this.x, this.y)) return;
	let otherX = other.x, otherY = other.y;
	grid1[idx(this.x, this.y)] = null;
	other.updatePosition(this.x, this.y, false);
	grid1[idx(otherX, otherY)] = null;
	this.updatePosition(otherX, otherY, false);
}

p.hasTouchedSurfaceCheck = function()
	{
		let y = 0;
		let px = null;
		let hasBubble = this.type == 'WATER' && this.timeAlive > 2;
		while (++y < 50)
		{
			if (this.y + y >= GRIDH - 1) {
				if (hasBubble && dice(10)) new Particle(this.newX, this.newY - 1, this.type == 'LAVA' ? 'SMOKE' : 'BUBBLE');
				return (true);
			}
			px = pxAtP(this.x, this.y + y);
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
