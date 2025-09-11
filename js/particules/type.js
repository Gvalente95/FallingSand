p.shouldSpreadCheck = function () {
	let massMax = 3;
	let massAbove = 0;
	while (++massAbove < massMax) {
		let px = pxAtP(this.x, this.y - massAbove);
		if (!px || px.physT != 'LIQUID') return (true);
	}
	return (false);
}

p.updateLiquid = function (curX, curY, spreadAm = this.spreadAmount) {
	const up = pxAtP(curX, curY - 1);
	if (up && up.dns > this.dns && up.physT === 'LIQUID' && up.type !== 'BUBBLE') {
		this.velX = 0; this.swap(up); return;
	}
	if (!this.hasTouchedSurface) {
		if (this.hasTouchedSurfaceCheck()) this.hasTouchedSurface = true;
		else { this.updatePosition(curX, curY); return; }
	}
	if (!this.ground) return (this.updatePosition(curX, curY));
	// if (this.timeAlive > 1 && time % 200 == 0) this.shouldSpread = this.shouldSpreadCheck();
	// this.setColor(this.shouldSpread ? 'rgba(21, 255, 0, 1)' : 'rgba(255, 0, 0, 1)');
	// if (!this.shouldSpread) return (this.updatePosition(curX, curY));
	let xDir = this.xDir || 1;
	if ((curX <= 0 && xDir < 0) || (curX >= GRIDW - 1 && xDir > 0)) xDir = -xDir;

	const maxSteps = Math.min(spreadAm - 1, xDir > 0 ? (GRIDW - 1 - curX) : curX);
	let newX = curX;
	let found = false;
	for (let i = 1; i <= maxSteps; i++) {
		const xp = curX + i * xDir;
		const cell = pxAtP(xp, curY);
		if (!cell) {newX = xp; found = true; break;}
		if (cell.updT === 'ALIVE') continue;
		if (cell.physT !== 'LIQUID') break;
		if (cell.type !== this.type && cell.dns > this.dns) { this.swap(cell); return; }
		const below = pxAtP(xp, curY + 1);
		if (!below) { newX = xp; curY++; found = true; break; }
	}
	if (!found) this.xDir *= -1;
	this.updatePosition(newX, curY);
};

p.updateCloud = function () {
	if (time % 3 === 0) return;
	let newX = this.x + this.xDir;
	let newY = this.y;
	let px = pxAtP(newX, newY, this);
	if (px) {
		if (dice(2)) px.xDir = -this.xDir;
		else { this.xDir = -px.xDir; newX = this.x + this.xDir; }
		// this.swap(px); return;
	}
	if (isOutOfBorder(newX, newY)) { this.toRemove(); return; }
	this.updatePosition(newX, newY, this);
}

p.updatePlant = function(curX, curY){
	if (this.parent || (time % (this.growSpeed)) != 0) return;
	let inWater = false;
	const px = pxAtP(curX, curY, this);
	if (px) {
		if (px.type === 'WATER' || px.type === 'PLANT') { inWater = true; px.toRemove();}
		else return (this.setColor());
	}
	if (dice(30)) this.dirAng += f_range(-0.2, 0.2);
	const t = now * this.oscSpeed + this.oscPhase;
	const ang = this.dirAng + this.oscAmp * Math.sin(t);
	const speed = inWater ? .2 : 1;
	this.velX = Math.cos(ang) * speed;
	this.velY = Math.sin(ang) * speed;
	const ox = this.x, oy = this.y;
	this.updatePosition(curX, curY);
	const clone = new Particle(ox, oy, this.type);
	clone.parent = this;
	if (dice(10))this.dirAng += f_range(-0.3, 0.3);
	if (this.timeAlive < 2) {
		let rpx = getPxlsInRect(this.x, this.y, 3, 3, this.type);
		let isStuck = (rpx.length > 4);
		if (isStuck) {return (this.setColor());}
		else if (this.color != "rgba(133, 190, 154, 1)") {
			this.setColor("rgba(133, 190, 154, 1)");
			if (this.timeAlive > 6) this.toRemove();
		}
	}
}

p.updateFrost = function(curX, curY){
	if (this.timeAlive < .2 * this.fseed)
		this.setColor(addColor(this.properties.color, 'rgba(92, 145, 198, 1)', this.timeAlive / (.2 * this.fseed)));
	this.applyFrost('ICE', 20);
	this.updatePosition(curX, curY);
}

p.updateAnt = function (curX, curY) {
	if (this.burning) return;
	if (this.inWater) {
		if (this.timeInWater === 100) this.xDir = rdir();
		else if (this.timeInWater > 100) {
			this.velY = -1;
			if (dice(2)) {
				let rx = pxAtP(this.x + this.xDir, this.y, this);
				if (rx && rx.physT === 'LIQUID') this.swap(rx);
			}
			let px = pxAtP(this.x, this.y - 1, this);
			if (px && px.physT === 'LIQUID') return (this.swap(px));
			if (!pxAtP(this.x, this.y + 1, this)) return (this.updatePosition(this.x, this.y + 1));
			return;
		}
		else this.velX = 0, this.xDir = 0;
	}
	if (!this.hasTouchedSurface) {
		this.hasTouchedSurface = (this.y >= GRIDH - 1) || (this.ground && this.ground.type != this.type);
		if (!this.hasTouchedSurface) {
			let px = pxAtP(curX, curY, this);
			if (px) this.swap(px);
			else this.updatePosition(curX, curY); return;
		}
		this.xDir = rdir();
		this.yDir = 0;
	}
	if (dice(50)) return;

	curX = this.x;
	curY = this.y;

	if (dice(3000)) {
		new Particle(curX - this.xDir, curY - this.yDir, 'ANTEGG');
		this.xDir = this.yDir = 0;
	}
	if (!this.xDir && !this.yDir) {
		if (curY === 0 || curX === GRIDH - 1) {
			if (isValid(curX + 1, curY, 0, 0)) curX++;
			else if (isValid(curX - 1, curY, 0, 0)) curX--;
		}
		if (dice(20)) {
			this.xDir = dice(2) ? -1 : 1;
		}
	}

	function isValid(x, y, xd, yd) { return (!pxAtP(x + xd, y + yd, this) && !isOutOfBorder(x + xd, y + yd)); }

	if (curX <= 0 || curX >= GRIDW - 1) {
		if (dice(4) && atCorner(curX, curY)) this.xDir *= -1;
		else {
			this.xDir = 0;
			if (curY === GRIDH - 1) this.yDir = -1;
			if (curY <= 0) { this.yDir = 0; this.xDir = curX <= 0 ? 1 : -1; }
		}
	}
	else if (curY <= 0 || curY >= GRIDH - 1) {
		if (dice(4) && atCorner(curX, curY)) this.yDir *= -1;
		else {
			this.yDir = 0;
			if (curX === 0) this.xDir = -1;
			if (curX <= 0) this.xDir = 0;
		}
	}
	if ((!atBorder(curX, curY)) && !pxAtP(curX + this.xDir, curY + 1, this) && (!pxAtP(curX - 1, curY, this) && !pxAtP(curX + 1, curY, this))) {
		curY++;
		if (this.yDir === -1) this.yDir = 0;
		this.xDir = 0;
	}
	let px = pxAtP(curX + this.xDir, curY + this.yDir);
	if (!px && dice(10)) {
		px = pxAtP(curX + this.xDir, curY - 1);
		if (px) this.yDir = -1;
	}
	if (px) {
		if (px.physT === 'LIQUID' || px.wet) { this.inWater = true; this.timeInWater++;  }
		if (px.type === 'ANT' || px.type === 'ANTEGG' || px.physT === 'LIQUID') {
			this.swap(px);
			return;
		}
		if (px.physT === 'SOLID' && dice(px.dns)) {
			for (let x = -2; x < 2; x++) {
				for (let y = -2; y < 2; y++) {
					let npx = pxAtP(px.x + x, px.y + y, this);
					if (npx) {
						npx.updT = 'STATIC';
						npx.setColor(addColor(PARTICLE_PROPERTIES[npx.type].color, "rgba(0,0,0,1)", .1));
					}
				}
			}
			px.toRemove();
			if (dice(2)) this.yDir = (rdir());
		}
	}
	if (isValid(curX, curY, this.xDir, this.yDir))
		this.updatePosition(curX + this.xDir, curY + this.yDir);
	else {
		let tr = 1;
		while (!isValid(curX, --curY, this.xDir, this.yDir) && curY > 0 && tr--) {
			continue;
		}
		if (isValid(curX, curY, this.xDir, this.yDir))
			this.updatePosition(curX + this.xDir, curY + this.yDir);
		else {
			if (dice(10)) this.xDir *= -1;
			else if (dice(10)) this.yDir *= -1;
		}
	}
};

SWIMSPEED = 10;
p.updateFish = function(){
	let l = pxAtP(this.x, this.y + 1, this);
	if (!l || l.physT != 'LIQUID') l = pxAtP(this.x - 1, this.y, this);
	if (!l || l.physT != 'LIQUID') l = pxAtP(this.x + 1, this.y, this);
	if (!l || l.physT != 'LIQUID') l = pxAtP(this.x, this.y - 1);
	if (!l || l.physT != 'LIQUID') {
		this.updatePosition(this.newX, this.newY);
		this.inWater = false;
		if (dice(300)) this.velY = -2;
		this.timeInWater = 0;
		return;
	}
	this.inWater = true;
	if (dice(1000)) {
		let px = pxAtP(this.newX, this.newY - 1, this);
		if (px && px.physT === 'LIQUID') {
			let type = px.type;
			px = px.replace('BUBBLE');
			px.transformType = type;
		}
	}
	if (++this.timeInWater < 30) {
		this.velY *= .8;
		if (dice(10)) this.velX = rdir() * SWIMSPEED;
		let px = pxAtP(this.newX, this.newY, this);
		if (px && px.physT === 'LIQUID') this.swap(px);
		return;
	}
	function getNeighbors(x,y,type,r, clr){
		const out=[]; const rr=r|0;
		for(let oy=-rr; oy<=rr; oy++){
			const yy=y+oy; if(yy<0||yy>=GRIDH) continue;
			for(let ox=-rr; ox<=rr; ox++){
				const xx=x+ox; if(xx<0||xx>=GRIDW) continue;
				if(ox===0&&oy===0) continue;
				const q = pxAtP(xx, yy);
			if (!q) continue;
			if (q.type !== type) continue;
			if (q.color != clr) continue;
			if(q.inWater!==true) continue;
				out.push(q);
			}
		} return out;
	};

	let BorderLimit = 20;
	if ((this.velX < 0 && this.x < BorderLimit) || (this.x > GRIDW - BorderLimit && this.velX > 0)) {
		this.velX *= .9;
		if (Math.abs(this.velX) < .5) this.velX = - Math.sign(this.velX);
	}
	else if (this.velX <= 0 && this.x < BorderLimit) this.velX = 1;
	else if (this.velX >= 0 && this.x > GRIDW - BorderLimit) this.velX = -1;

	if (!this.velX) this.velX = rdir() * SWIMSPEED;
	const nn = getNeighbors(this.x, this.y, this.type, FLOCK.r, this.color);
	if (!nn.length) {
		this.velX = this.xDir * SWIMSPEED;
		const nx = this.x + Math.round(this.velX * SIMSPEED * dt);
		const ny = this.y + Math.round(this.velY * SIMSPEED * dt);
		let px = pxAtP(nx, ny, this);
		if (!px) return (this.updatePosition(nx, ny));
	}
	let sx=0, sy=0, ax=0, ay=0, cx=0, cy=0, n=0;
	for(const q of nn){
		const dx=this.x-q.x, dy=this.y-q.y;
		const d2 = dx*dx+dy*dy||1;
		sx += dx/d2; sy += dy/d2;
		ax += q.velX; ay += q.velY;
		cx += q.x;   cy += q.y;
		n++;
	}
	if(n>0){
		ax/=n; ay/=n;
		cx = (cx/n - this.x); cy = (cy/n - this.y);
	}

	let desX = this.velX + FLOCK.sep*sx + FLOCK.ali*ax + FLOCK.coh*cx;
	let desY = this.velY + FLOCK.sep*sy + FLOCK.ali*ay + FLOCK.coh*cy;

	const sp = Math.hypot(desX,desY) || 1;
	const spc = Math.min(sp, FLOCK.maxSpd);
	desX = desX/sp*spc; desY = desY/sp*spc;

	let axx = desX - this.velX, ayy = desY - this.velY;
	const acc = Math.hypot(axx,ayy) || 1;
	const accc = Math.min(acc, FLOCK.maxAcc);
	axx = axx/acc*accc; ayy = ayy/acc*accc;

	this.velX += axx; this.velY += ayy;

	const k = SIMSPEED*dt;
	const nx = this.x + Math.round(this.velX*k);
	const ny = this.y + Math.round(this.velY*k);

	const tgt = pxAtP(nx, ny, this);
	if (tgt) {
		const alt = [
			[nx, this.y],[this.x, ny],
			[this.x+Math.sign(this.velX), this.y],
			[this.x, this.y+Math.sign(this.velY)]
		];
		for(const [axn,ayn] of alt){
			const a=pxAtP(axn,ayn,this);
			if(a && (a.physT==='LIQUID' || a.type === this.type)){ this.swap(a); return; }
			if(!a){ this.updatePosition(axn,ayn); return; }
		}
		this.velX *= 0.5; this.velY *= 0.5;
		return;
	}
	let npx = pxAtP(nx, ny, this);
	if (npx) this.swap(npx);
	else this.updatePosition(nx, ny);
};

p.updateShroom = function (curX, curY) {
	if (!this.hasTouchedBorder) {
		if (this.timeAlive <= 2) return (this.updatePosition(curX, curY));
		if (atBorder(curX, curY)) this.hasTouchedBorder = true;
		else {
			let down = pxAtP(this.x, this.y + 1, this);
			if ((down) && (down.hasTouchedBorder || (down.physT === 'SOLID' && down.type != this.type))) this.hasTouchedBorder = true;
		}
		if (!this.hasTouchedBorder) return (this.updatePosition(curX, curY));
	}
	if (this.parent && !this.child && (curX != this.x || curY != this.y)) {
		this.parent.toRemove();
		this.updatePosition(curX, curY);
	}
	if (!this.isGrower || this.parent) return;
	if (!dice(this.growSpeed)) return;
	let px = this.x; let py = this.y;
	if (dice(4) && 0) {
		if (dice(2)) px += rdir();
		else py += rdir();
	}
	else { py--; if (dice(5)) px += rdir(); }
	let up = pxAtP(px, py, this);
	if (up && (up.type != this.type && up.physT === 'SOLID')) {
		this.digType = up.type;
		up.toRemove();
		up = null;
		this.maxHeight = this.heigth + r_range(2, this.heigth / 3);
	}
	else this.digType = null;
	if (up) {
		if (up.physT != 'LIQUID') return;
		if (up.type === 'WATER' && this.type != 'SHROOM') return;
		if (up.cor && this.type === 'SHROOM') return;
		if (up.type === this.type) return;
	}
	if ((!up && this.heigth < this.maxHeight) || (up && up.physT === 'LIQUID')) {
		let wetColor = null;
		if (up)
		{
			this.inWater = true;
			wetColor = up.color;
			this.maxHeight = this.heigth + r_range(2, this.heigth / 3);
			up.toRemove();
			up = null;
		}
		let newHead = new Particle(px, py, this.type);
		newHead.hasTouchedBorder = true;
		newHead.isGrower = this.isGrower;
		newHead.growSpeed = this.growSpeed;
		newHead.digType = this.digType;
		newHead.maxHeight = this.maxHeight;
		newHead.timeAlive = this.timeAlive;
		newHead.ground = this;
		newHead.velX = newHead.velY = 0;
		newHead.yLimit = this.yLimit;
		newHead.headColor = this.headColor;
		newHead.id = this.id;
		newHead.child = this;
		newHead.heigth = this.heigth + 1;
		if (this.child) {
			if (wetColor)
				newColor = addColor(this.baseColor, wetColor, f_range(.5, .8));
			else
				newColor = addColor(this.baseColor, 'rgba(255, 255, 255, 1)', Math.round(Math.max(this.heigth * .02), 1));
			this.setColor(newColor);
		}
		this.parent = newHead;
	}
}

p.updateSteam = function(newX, newY){
	if (this.y < 50 && dice(5))
	{
		launchParticules('CLOUD', this.x * PIXELSIZE, this.y * PIXELSIZE, 10, true);
		this.toRemove();
	}
	this.updatePosition(newX, newY);
}

const UPDATE_HANDLERS = {
	ICE:   p => p.updateFrost(p.newX, p.newY),
	STEAM: p => p.updateSteam(p.newX, p.newY),
	ANT:   p => p.updateAnt(p.newX, p.newY),
	FISH:  p => p.updateFish(p.newX, p.newY),
	PLANT: p => p.updatePlant(p.newX, p.newY),
	SHROOM: p => p.updateShroom(p.newX, p.newY),
	SHROOMX: p => p.updateShroom(p.newX, p.newY),
	FIRE:  p => p.FireEffect(p.newX, p.newY),
	TORCH: p => p.FireEffect(p.newX, p.newY),
	MAGMA: p => p.MagmaEffect(p.newX, p.newY),
	LAVA: p => p.LavaEffect(p.newX, p.newY),
};

p.updateType = function () {
	if (this.cor) this.applyCorrosion();
	if (this.physT == 'LIQUID') {
		if (this.frozen) return;
		this.updateVelocity();
		this.updateMovement();
		this.updateLiquid(this.newX, this.newY);
		return;
	}
	else if (this.type === 'CLOUD') return this.updateCloud();
	else if (this.isShroom && this.hasTouchedBorder) return this.updateShroom(this.x, this.y);
	else if (this.type === 'TORCH' && dice(10)) new Particle(this.x, this.y - 1, 'FIRE');
	if (this.updT === 'STATIC') return;
	if (this.type !== 'PLANT') this.updateVelocity();
	if (this.velX || this.velY) this.updateMovement();
	const h = UPDATE_HANDLERS[this.type];
	if (h) return h(this);
	this.updatePosition(this.newX, this.newY);
};


p.setType = function(newType)
{
	this.type = newType;
	this.isShroom = this.type == 'SHROOM' || this.type == 'SHROOMX';
	this.properties = PARTICLE_PROPERTIES[newType];
	this.cr = this.properties.cr;
	this.lt = this.properties.lt * f_range(.5, 1.5);
	this.douse = this.properties.douse;
	this.physT = this.properties.physT;
	this.expl = this.properties.expl;
	this.brn = this.properties.brn;
	this.brnpwr = this.properties.brnpwr;
	this.cor = this.properties.cor;
	this.dns = this.properties.dns;
	this.spreadAmount = this.properties.spread;
	this.updT = this.properties.updT;
	this.inWater = false;
	this.timeInWater = 0;
	this.ground = null;
	this.xDir = rdir(); this.yDir = rdir();
	this.heigth = 0;
	this.parent = null;
	this.child = null;
	this.transformType = null;
	if (ISGAME) setTimeout(() => { discoverType(this) }, 50);
	if (this.updT == 'STATIC') { this.velY = 0; this.velX = 0; }
	if (this.type == 'FISH') {
		let clrs = ["rgba(135, 60, 163, 1)", "rgba(11, 93, 61, 1)", this.properties.color];
		this.setColor(clrs[r_range(0, clrs.length)]);
	}
	else if (this.isShroom) {
		this.headColor = randomizeColor(this.properties.color, 50);
		this.setColor(randomizeColor(newType == 'SHROOMX' ? 'rgba(71, 45, 119, 1)' : 'rgba(45, 119, 83, 1)'));
		this.isGrowing = false;
		this.isGrower = this.id % 4 == 0;
		this.maxHeight = r_range(2, 20);
		this.growSpeed = r_range(2, 6);
	}
	else this.setColor(this.physT != 'LIQUID' || this.type == 'LAVA' ? randomizeColor(this.properties.color) : this.properties.color);
	this.baseColor = this.color;
	if (this.type == 'PLANT')
	{
		this.growSpeed = r_range(1, 3);
		this.velX = 0; this.velY = 0;
		this.dirAng = Math.atan2(f_range(-1,1), f_range(-1,1));
		this.oscPhase = Math.random() * Math.PI * 2;
		this.oscSpeed = f_range(0.0025, 0.006);
		this.oscAmp = f_range(2, 6);
	}
	else if (this.type == 'ANTEGG') this.transformType = 'ANT';
	else if (this.type == 'COAL') { this.velX = 0; }
}