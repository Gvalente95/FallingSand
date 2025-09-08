p.updateCloud = function () {
	if (time % 3 == 0) return;
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
		if (px.type == 'WATER' || px.type == 'PLANT') { inWater = true; px.toRemove();}
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
	if (this.timeAlive < 2000) {
		let rpx = getPxlsInRect(this.x, this.y, 3, 3, this.type);
		let isStuck = (rpx.length > 4);
		if (isStuck) {return (this.setColor());}
		else if (this.color != "rgba(133, 190, 154, 1)") {
			this.setColor("rgba(133, 190, 154, 1)");
			if (this.timeAlive > 6000) this.toRemove();
		}
	}
}

p.updateFrost = function(curX, curY){
	if (this.timeAlive < 200 * this.fseed)
		this.setColor(addColor(this.properties.color, 'rgba(92, 145, 198, 1)', this.timeAlive / 200 * this.fseed));
	this.applyFrost('FROST', 20);
	// this.updatePosition(curX, curY);
}

p.updateAnt = function (curX, curY) {
	if (this.burning) return;
	if (this.inWater) {
		if (this.inWater == 100) this.xDir = rdir();
		else if (this.inWater > 100) {
			this.velY = -1;
			if (dice(2)) {
				let rx = pxAtP(this.x + this.xDir, this.y, this);
				if (rx && rx.physT == 'LIQUID') this.swap(rx);
			}
			let px = pxAtP(this.x, this.y - 1, this);
			if (px && px.physT == 'LIQUID') return (this.swap(px));
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
		if (curY == 0 || curX == GRIDH - 1) {
			if (isValid(curX + 1, curY, 0, 0)) curX++;
			else if (isValid(curX - 1, curY, 0, 0)) curX--;
		}
		if (dice(20)) {
			this.xDir = dice(2) ? -1 : 1;
		}
	}

	function isAtCorner(x, y) { return ((x == 0 && y == 0) || (x == GRIDW - 1 && y == 0) || (x == 0 && y == GRIDH - 1) || (x == GRIDW - 1 && y == GRIDH - 1)) }
	function isValid(x, y, xd, yd) { return (!pxAtP(x + xd, y + yd, this) && !isOutOfBorder(x + xd, y + yd)); }
	function isAtBorder(x, y) { return (x == 0 || x == GRIDW - 1 || y == 0 || y == GRIDH - 1); }

	if (curX <= 0 || curX >= GRIDW - 1) {
		if (dice(4) && isAtCorner(curX, curY)) this.xDir *= -1;
		else {
			this.xDir = 0;
			if (curY == GRIDH - 1) this.yDir = -1;
			if (curY <= 0) { this.yDir = 0; this.xDir = curX <= 0 ? 1 : -1; }
		}
	}
	else if (curY <= 0 || curY >= GRIDH - 1) {
		if (dice(4) && isAtCorner(curX, curY)) this.yDir *= -1;
		else {
			this.yDir = 0;
			if (curX == 0) this.xDir = -1;
			if (curX <= 0) this.xDir = 0;
		}
	}
	if ((!isAtBorder(curX, curY)) && !pxAtP(curX + this.xDir, curY + 1, this) && (!pxAtP(curX - 1, curY, this) && !pxAtP(curX + 1, curY, this))) {
		curY++;
		if (this.yDir == -1) this.yDir = 0;
		this.xDir = 0;
	}
	let px = pxAtP(curX + this.xDir, curY + this.yDir);
	if (!px && dice(10)) {
		px = pxAtP(curX + this.xDir, curY - 1);
		if (px) this.yDir = -1;
	}
	if (px) {
		if (px.physT == 'LIQUID' || px.wet) { this.inWater++;  }
		if (px.type == 'ANT' || px.type == 'ANTEGG' || px.physT == 'LIQUID') {
			this.swap(px);
			return;
		}
		if ((px.physT == 'SOLID' || px.physT == 'STATIC') && dice(px.dns)) {
			for (let x = -2; x < 2; x++) {
				for (let y = -2; y < 2; y++) {
					let npx = pxAtP(px.x + x, px.y + y, this);
					if (npx) {
						npx.physT = 'STATIC';
						// npx.setColor(addColor(PARTICLE_PROPERTIES[npx.type].color, "rgba(0,0,0,1)", .1));
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

p.updateFish = function(){
	let l = pxAtP(this.x, this.y + 1, this);
	if (!l || l.physT != 'LIQUID') l = pxAtP(this.x - 1, this.y, this);
	if (!l || l.physT != 'LIQUID') l = pxAtP(this.x + 1, this.y, this);
	if (!l || l.physT != 'LIQUID') l = pxAtP(this.x, this.y - 1);
	if (!l || l.physT != 'LIQUID') {
		this.updatePosition(this.newX, this.newY);
		this.inWater = false;
		if (dice(300)) this.velY = -1;
		this.timeInWater = 0;
		return;
	}
	this.inWater = true;
	if (dice(1000)) {
		let px = pxAtP(this.newX, this.newY - 1, this);
		if (px && px.physT == 'LIQUID') {
			let type = px.type;
			px.replace('BUBBLE');
			px.transformType = type;
		}
	}
	if (++this.timeInWater < 30) {
		this.velY *= .9;
		if (dice(10)) this.velX = rdir();
		let px = pxAtP(this.newX, this.newY, this);
		if (px && px.physT == 'LIQUID') this.swap(px);
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
	if(this.velX==null){ this.velX=f_range(-1,1); this.velY=f_range(-1,1); }
	if ((this.x < 10 && this.velX < 0) || (this.x > GRIDW - 11 && this.velX > 0))
		this.velX *= -1;
	if (this.y <= 10 && this.velY < 0) this.velY = 1;
	else if (this.y >= GRIDH - 11 && this.velY > 0) this.velY = -1;
	if (!this.velX) this.velX = f_range(-1, 1);
	const nn = getNeighbors(this.x, this.y, this.type, FLOCK.r, this.color);
	if (!nn.length) {
		this.velX = this.xDir;
		const nx = this.x + Math.round(this.velX*SIMSPEED*dt);
		const ny = this.y + Math.round(this.velY * SIMSPEED*dt);
		return (this.updatePosition(nx, ny));
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
			if(a && (a.physT==='LIQUID' || a.type && this.type)){ this.swap(a); return; }
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
		if (this.timeAlive <= 2000) return (this.updatePosition(curX, curY));
		if (atBorder(curX, curY)) this.hasTouchedBorder = true;
		else {
			let down = pxAtP(this.x, this.y + 1, this);
			if (down && (down.hasTouchedBorder || ((down.physT == 'SOLID' || down.physT == 'STATIC') && down.type != this.type))) this.hasTouchedBorder = true;
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
	if (up && (up.type != this.type && (up.physT == 'SOLID' || up.physT == 'STATIC'))) {
		this.digType = up.type;
		up.toRemove();
		up = null;
		this.maxHeight = this.heigth + r_range(2, this.heigth / 3);
	}
	else this.digType = null;
	if (up) {
		if (up.type == 'WATER' && this.type != 'SHROOM') return;
		if (up.cor && this.type == 'SHROOM') return;
		if (up.type == this.type) return;
	}
	if ((!up && this.heigth < this.maxHeight) || (up && up.physT == 'LIQUID')) {
		if (up)
		{
			this.inWater = true;
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
		if (this.child) this.setColor(addColor(this.baseColor, 'rgba(255, 255, 255, 1)', Math.max(this.heigth * .02), 1));
		this.parent = newHead;
	}
}

p.updateType = function () {
	if (this.cor) this.applyCorrosion();
	if (this.type === 'WOOD') return;
	if (this.type === 'CLOUD') return this.updateCloud();
	if (this.isShroom && this.hasTouchedBorder) return (this.updateShroom(this.x, this.y));
	else if (this.type == 'TORCH' && dice(10))
		new Particle(this.x, this.y - 1, 'FIRE');
	else if (this.type == 'STEAM' && this.y < 50 && dice(5))
		{ launchParticules('CLOUD', this.x * PIXELSIZE, this.y * PIXELSIZE, 10, true); this.toRemove(); }
	if (this.physT != 'STATIC' || this.type == 'PLANT') {
		this.ground = pxAtP(this.x, this.y + (this.physT == 'GAS' ? -1 : 1), this);
		this.updateVelocity();
		if (this.velX || this.velY) this.updateMovement();
		if (this.physT == 'LIQUID') this.updateLiquid(this.newX, this.newY);
	}
	if (this.type == 'FROST') this.updateFrost(this.newX, this.newY);
	else if (this.isShroom) this.updateShroom(this.newX, this.newY);
	else if (this.type == 'ANT') this.updateAnt(this.newX, this.newY);
	else if (this.type == 'FIRE' || this.type === 'TORCH') this.FireEffect(this.newX, this.newY);
	else if (this.type == 'MAGMA') this.MagmaEffect(this.newX, this.newY);
	else if (this.type == 'LAVA') this.LavaEffect(this.newX, this.newY);
	else if (this.type == 'FISH') this.updateFish(this.newX, this.newY);
	else if (this.type == 'PLANT') this.updatePlant(this.newX, this.newY);
	else if (this.physT != 'LIQUID') this.updatePosition(this.newX, this.newY);
}
