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
			px = getPxlAtPos(this.x, this.y + y);
			if (px && (px.solType == 'SOLID' || px.solType == 'STATIC')) {
				if (hasBubble && dice(10)) new Particle(this.newX, this.newY - 1, this.type == 'LAVA' ? 'SMOKE' : 'BUBBLE');
				return (true);
			}
			if (!px) break;
		}
		return (px != null);
}

p.setVel = function (newX = 0, newY = 0) { this.velX = newX; this.velY = newY; }

p.setColor = function (color = this.properties.color) { this.color = color; this.rgb = hexToRgb(this.color);}

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
	this.solType = this.properties.solType;
	this.lifeTime = this.properties.lifeTime * f_range(.5, 1.5);
	this.burnable = this.properties.burnable;
	this.burner = this.properties.burner;
	this.density = this.properties.density;
	this.spreadAmount = this.properties.spread;
	this.updType = this.properties.updType;
	this.setColor(
		this.solType != 'LIQUID' || this.type == 'LAVA' ? randomizeColor(this.properties.color) : this.properties.color);
	this.flowDir = r_range(0, 2) == 0 ? -1 : 1;
	if (this.updType == 'STATIC') { this.velY = 0; this.velX = 0; }
	if (this.type == 'PLANT')
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
	let burnable = victim.burnable;
	if (victim.wet && victim.wetType) burnable = PARTICLE_PROPERTIES[victim.wetType].burnable;
	if (!agressor.burner || !burnable) return (0);
	let sumChance = Math.max(1, 2000 - burnable - agressor.burner);
	return (dice(sumChance));
}
function shouldBurnType(typeA, typeB)
{
	let burnForce = PARTICLE_PROPERTIES[typeA].burner;
	let burnable = PARTICLE_PROPERTIES[typeB].burnable;
	if (!burnForce || !burnable) return (0);
	let sumChance = Math.max(1, 2000 - burnable - burnForce);
	return (dice(sumChance));
}
function shouldBurnParticle(typeA, victim)
{
	let burnForce = PARTICLE_PROPERTIES[typeA].burner;
	let burnable = victim.burnable;
	if (victim.wet && victim.wetType) burnable = PARTICLE_PROPERTIES[victim.wetType].burnable;
	if (!burnForce || !burnable) return (0);
	let sumChance = Math.max(1, 2000 - burnable - burnForce);
	return (dice(sumChance));
}

function getSin(t, freq, amp, phase) {
	return (Math.sin(t * freq + phase) * amp);
}



let curLetterIndex = 0;
let curLetterPosIndex = 0;
function updateStart() {
	let yb = CANVH / 2;
	let wm = 20;
	let lh = 40;
	let lw = 40;

	let text = {
		"S": {Pos:[0,lh],Steps:[[lw,lh],[lw,lh-lh/3],[0,lh-lh/3],[0,0],[lw, 0]]},
		"A": {Pos:[lw,yb],Steps:[[0,lh],[lw/2,0],[lw,lh],[lw-lw/4,lh/2],[lw/4,lh/2]]},
		"N": {Pos:[(lw+wm)*2,yb],Steps:[[0,lh],[0,0],[lw,lh],[lw,0]]},
		"D": {Pos:[(lw+wm)*3,yb],Steps:[[0,lh],[lw/3,lh],[lw,lh-lh/3],[lw,lh/3],[lw/3,0],[0,0],[0,lh]]}
	};

	requestAnimationFrame(updateStart);
}