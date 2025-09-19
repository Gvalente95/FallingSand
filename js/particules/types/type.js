const UPDATE_HANDLERS = {
	STEAM: p => p.updateSteam(p.newX, p.newY),
	ANT:   p => p.updateAnt(p.newX, p.newY),
	FISH:  p => p.updateFish(p.newX, p.newY),
	ALIEN: p => p.updateAlien(p.newX, p.newY),
	BEE: p => p.updateBee(p.newX, p.newY),
	TREE: p => p.updateTree(p.newX, p.newY),
	SHROOM: p => p.updateShroom(p.newX, p.newY),
	SHROOMX: p => p.updateShroom(p.newX, p.newY),
	FIRE:  p => p.FireEffect(p.newX, p.newY),
	TORCH: p => p.FireEffect(p.newX, p.newY),
	MAGMA: p => p.MagmaEffect(p.newX, p.newY),
	BOLT: p => p.updateBolt(p.newX, p.newY),
};

p.getNeighborCells = function () { 
	this.lu = (this.y > 0 && this.x > 0              ? grid1[this.i - GW - 1] : null);
	this.u  = (this.y > 0                            ? grid1[this.i - GW]     : null);
	this.ru = (this.y > 0 && this.x < GW - 1         ? grid1[this.i - GW + 1] : null);
	this.l  = (this.x > 0                            ? grid1[this.i - 1]      : null);
	this.r  = (this.x < GW - 1                       ? grid1[this.i + 1]      : null);
	this.ld = (this.y < GH - 1 && this.x > 0         ? grid1[this.i + GW - 1] : null);
	this.d  = (this.y < GH - 1                       ? grid1[this.i + GW]     : null);
	this.rd = (this.y < GH - 1 && this.x < GW - 1    ? grid1[this.i + GW + 1] : null);

	this.neighborCount = 0;
	this.neighbors = [];
	if (this.lu) this.neighbors.push(this.lu);
	if (this.u)  this.neighbors.push(this.u);
	if (this.ru) this.neighbors.push(this.ru);
	if (this.l)  this.neighbors.push(this.l);
	if (this.r)  this.neighbors.push(this.r);
	if (this.ld) this.neighbors.push(this.ld);
	if (this.d)  this.neighbors.push(this.d);
	if (this.rd) this.neighbors.push(this.rd);

	this.neighborCount = this.neighbors.length;
	return this.neighborCount;
}

p.updateType = function () {
	this.getNeighborCells();
	// this.neighbors = null;
	// this.noUpdate = this.neighborCount >= 8;
	// if (this.noUpdate) return;
	if (this.type === 'SMOKE' && FRAME % 2 == 0) return;
	if (this.cor) this.applyCorrosion();
	if (this.freeze) this.applyFrost(this.type, 50, true);
	if (this.physT === 'LIQUID') {
		if (this.frozen) return;
		this.updateVelocity();
		this.updateMovement();
		this.updateLiquid(this.newX, this.newY);
		if (this.type === 'LAVA')
			this.LavaEffect(this.x, this.y);
		return;
	}
	else if (this.type === 'CLOUD') return this.updateCloud();
	else if (this.type === 'LEAF') return this.updateLeaf();
	else if (this.isShroom && this.hasTouchedBorder && this.isGrower && !this.dead) return this.updateShroom(this.x, this.y);
	else if (this.type === 'TREE' && this.parent && !this.dead) return this.updateTree(this.x, this.y);
	else if (this.type === 'TORCH' && dice(10)) {
		new Particle(this.x, this.y - 1, 'FIRE');
	}
	if (this.updT === 'STATIC') return;
	if (this.type !== 'ALIEN') this.updateVelocity();
	if (this.velX || this.velY) this.updateMovement();
	const h = UPDATE_HANDLERS[this.type];
	if (h) return h(this);
	this.updatePosition(ROWOFF[this.newY] + this.newX);
};

p.setType = function(newType, transformType = null)
{
	if (newType === 'TORCH' && dice(2)) {
		newType = 'FIRE';
		transformType = 'FIRE';
		this.velY = -1;
	}

	this.type = newType;
	this.isWater = this.type == 'WATER' || this.type == 'HYDROGEL';
	this.isShroom = this.type == 'SHROOM' || this.type == 'SHROOMX';
	this.properties = PARTICLE_PROPERTIES[newType];
	this.cr = this.properties.cr;
	this.lt = this.properties.lt;
	this.lt *= f_range(.5, 1.5);
	this.douse = this.properties.douse;
	this.physT = this.properties.physT;
	this.expl = this.properties.expl;
	this.brn = this.properties.brn;
	this.brnpwr = this.properties.brnpwr;
	this.cor = this.properties.cor;
	this.dns = this.properties.dns;
	this.spreadAmount = this.properties.spread;
	this.freeze = this.properties.freeze;
	this.updT = this.properties.updT;
	this.inWater = false;
	this.timeInWater = 0;
	this.fin = this.properties.fin;
	this.fout = this.properties.fout;
	this.ground = null;
	this.xDir = rdir(); this.yDir = rdir();
	this.heigth = 0;
	this.parent = null;
	this.child = null;
	this.transformType = transformType;
	if (ISGAME) setTimeout(() => { discoverType(this) }, 50);

	if (this.updT == 'STATIC') { this.velY = 0; this.velX = 0; }
	if (this.type == 'FISH') {
		let clrs = ["rgb(135, 60, 163)", "rgb(11, 93, 61)", this.properties.color];
		this.setColor(clrs[r_range(0, clrs.length)]);
	}
	else if (this.isShroom) {
		this.familyId = -1;
		this.headColor = randomizeColor(this.properties.color, this.rclr);
		let color = newType == 'SHROOMX' ? 'rgb(71, 45, 119)' : 'rgb(45, 119, 83)';
		if (this.properties.rclr) color = randomizeColor(color);
		this.setColor(color);
		this.isGrowing = false;
		this.isGrower = this.id % 4 == 0;
		this.maxHeight = r_range(2, 5);
		this.growSpeed = r_range(2, 6);
	}
	else if (this.type === 'CLOUD') {
		this.size = r_range(2, 30);
		this.alpha = f_range(.1, .2);
		if (dice(10))
			this.setColor(addColor(this.properties.color, 'rgb(132, 132, 132)', r_range(1, 10)));
		else	this.setColor(this.properties.color);
	}
	else this.setColor(this.properties.rclr ? randomizeColor(this.properties.color, this.rclr) : this.properties.color);
	this.baseColor = this.color;
	if (this.type == 'ALIEN') {
		this.growSpeed = r_range(1, 3);
		this.dirAng = Math.atan2(f_range(-1, 1), f_range(-1, 1));
		this.oscPhase = Math.random() * Math.PI * 2;
		this.oscSpeed = f_range(0.0025, 0.006);
		this.oscAmp = f_range(2, 6);
	}
	else if (this.type === 'TREE') {
		this.familyId = -1; this.yDir = -1; this.xDir = 0;
		let colors = ['rgb(189, 131, 212)', 'rgb(199, 132, 132)', 'rgb(145, 202, 157)', 'rgb(191, 169, 41)', 'rgb(204, 34, 34)', 'rgb(34, 204, 173)'];
		this.leavesColor = randomizeColor(colors[Math.round(nowSec / 10) % colors.length], 30);
	}
	else if (this.type === 'BEE') {
		this.angle = f_range(-Math.PI, Math.PI);
	}
	else if (this.type == 'ANTEGG') this.transformType = 'ANT';
	else if (this.type == 'COAL') { this.velX = 0; }
}
