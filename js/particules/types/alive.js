
p.updateAlien = function (curX, curY) {
	if (this.parent || (FRAME % (this.growSpeed)) != 0) return;
	if (curX >= GW) curX = GW - 1;
	if (curX < 0) curX = 0;
	let inWater = false;
	const px = pxAtI(ROWOFF[curY] + curX, this);
	if (px) {
		if (px.type === 'WATER') { inWater = true; px.toRemove(); }
		else if (px.type == this.type && px.parent) { px.toRemove(); }
		else { this.setColor(); return; }
	}
	if (dice(30)) this.dirAng += f_range(-0.2, 0.2);
	const t = now * this.oscSpeed + this.oscPhase;
	const ang = this.dirAng + this.oscAmp * Math.sin(t);
	const speed = inWater ? .2 : 1;
	this.velX = Math.cos(ang) * speed;
	this.velY = Math.sin(ang) * speed;
	const ox = this.x, oy = this.y;
	this.updatePosition(ROWOFF[curY] + curX);
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

p.updateAnt = function (curX, curY) {
	if (this.burning) return;
	if (this.inWater) {
		if (this.timeInWater === 100) { this.xDir = rdir();}
		else if (this.timeInWater > 100) {
			if (!pxAtI(ROWOFF[this.y + 1] + this.x, this)) { this.inWater = false; return (this.updatePosition(ROWOFF[this.y + 1] + this.x)); }
			this.velY = -1;
			if (!this.xDir) this.xDir = rdir();
			let px = pxAtI(ROWOFF[this.y - 1] + this.x, this);
			if (px && px.physT === 'LIQUID') return (this.swap(px));
			px = pxAtI(ROWOFF[this.y] + this.x + this.xDir, this);
			if (px) { this.swap(px); return; }
			this.xDir *= -1;
			px = pxAtI(ROWOFF[this.y] + this.x + this.xDir, this);
			if (px && px.physT === 'LIQUID') return (this.swap(px));
			return;
		}
		else this.velX = 0, this.xDir = 0;
	}
	if (!this.hasTouchedSurface) {
		this.hasTouchedSurface = (this.y >= GH - 1) || (this.ground && this.ground.type != this.type);
		if (!this.hasTouchedSurface) {
			let px = pxAtI(ROWOFF[curY] + curX, this);
			if (px) this.swap(px);
			else this.updatePosition(ROWOFF[curY] + curX);
			return;
		}
		this.xDir = rdir();
		this.yDir = 0;
	}
	let rChance = r_range(0, 3000);
	if (rChance > 2950) return;
	curX = this.x; curY = this.y;
	if (rChance == 0) {
		new Particle(curX - this.xDir, curY - this.yDir, 'ANTEGG');
		this.xDir = this.yDir = 0;
	}
	if (!this.xDir && !this.yDir) {this.xDir = rdir(); this.yDir = rdir();}

	function isValid(x, y, xd, yd) {
		return (!pxAtI(ROWOFF[y + yd] + x + xd, this) && !isOutOfBorder(x + xd, y + yd));
	}

	if (atBorder(curX, curY)) {
		if (curX <= 0 || curX >= GW - 1) {
			if (dice(4) && atCorner(curX, curY)) this.xDir *= -1;
			else {
				this.xDir = 0;
				if (curY === GH - 1) this.yDir = -1;
				if (curY <= 0) { this.yDir = 0; this.xDir = curX <= 0 ? 1 : -1; }
			}
		}
		else if (curY <= 0 || curY >= GH - 1) {
			if (dice(4) && atCorner(curX, curY)) this.yDir *= -1;
			else {
				this.yDir = 0;
				if (curX === 0) this.xDir = -1;
				if (curX <= 0) this.xDir = 0;
			}
		}
	}
	else {
		let d = this.ground;
		let l = pxAtI(ROWOFF[curY] + curX - 1, this);
		let r = pxAtI(ROWOFF[curY] + curX + 1, this);
		if (!d && !l && !r) {
			curY++;
			this.yDir = 1;
			this.xDir = 0;
			return (this.updatePosition(ROWOFF[curY] + curX));
		}
		if (d) this.ground = d;
	}
	
	let px = pxAtI(ROWOFF[curY + this.yDir] + curX + this.xDir);
	if (px && px.type === this.type) px = null;
	if (!px && dice(10)) {
		px = this.getRandomNeighbor(this.type);
	}
	if (px) {
		if (px.physT === 'LIQUID' || px.wet) { this.inWater = true; this.timeInWater++;  }
		if (px.updT == 'ALIVE') {
			this.swap(px);
			return;
		}
		if (px.physT === 'SOLID' && dice(px.dns / 10)) {return (this.makeHole(px));}
	}
	if (isValid(curX, curY, this.xDir, this.yDir))
		this.updatePosition(ROWOFF[curY + this.yDir] + curX + this.xDir);
	else {
		// let tr = 1;
		// while (!isValid(curX, --curY, this.xDir, this.yDir) && curY > 0 && tr--) {
		// 	continue;
		// }
		if (px && isValid(curX, curY, this.xDir, this.yDir))
			this.updatePosition(ROWOFF[curY + this.yDir] + curX + this.xDir);
		else if (px && isValid(curX, curY, this.xDir, 1)) {
			this.hasTouchedSurface = false;
			this.velY = 0;
			this.updatePosition(ROWOFF[curY + 1] + curX + this.xDir);}
		// else if (isValid(curX, curY - 1, this.xDir, 0))
		// 	this.updatePosition(ROWOFF[curY - 1] + curX + this.xDir);
		else {
			if (dice(10)) this.xDir *= -1;
			else if (dice(10)) this.yDir *= -1;
		}
	}
};

SWIMSPEED = 10;
p.updateFish = function () {
	let i;
	for (i = 0; i < this.neighborCount; i++){
		let px = this.neighbors[i];
		if (px.physT === 'LIQUID') break;
	}
	this.inWater = i < this.neighborCount;
	if (!this.inWater) {
		this.updatePosition(ROWOFF[this.newY] + this.newX);
		if (dice(300)) this.velY = -2;
		this.timeInWater = 0;
		return;
	}
	// let l = pxAtI(ROWOFF[this.y + 1] + this.x, this);
	// if (!l || l.physT != 'LIQUID') l = pxAtI(ROWOFF[this.y] + this.x - 1, this);
	// if (!l || l.physT != 'LIQUID') l = pxAtI(ROWOFF[this.y] + this.x + 1, this);
	// if (!l || l.physT != 'LIQUID') l = pxAtI(ROWOFF[this.y - 1] + this.x);
	// if (!l || l.physT != 'LIQUID') {
	// 	this.updatePosition(ROWOFF[this.newY] + this.newX);
	// 	this.inWater = false;
	// 	if (dice(300)) this.velY = -2;
	// 	this.timeInWater = 0;
	// 	return;
	// }
	// this.inWater = true;

	if (dice(1000)) {
		let px = this.u;
		if (px && px.physT === 'LIQUID') {
			let type = px.type;
			px = px.replace('BUBBLE', type);
		}
	}
	if (++this.timeInWater < 30) {
		this.velY *= .8;
		if (dice(10)) this.velX = rdir() * SWIMSPEED;
		let px = pxAtI(ROWOFF[this.newY] + this.newX, this);
		if (px && px.physT === 'LIQUID') this.swap(px);
		return;
	}
	function getNeighbors(x,y,type,r, clr){
		const out=[]; const rr=r|0;
		for(let oy=-rr; oy<=rr; oy++){
			const yy=y+oy; if(yy<0||yy>=GH) continue;
			for(let ox=-rr; ox<=rr; ox++){
				const xx=x+ox; if(xx<0||xx>=GW) continue;
				if(ox===0&&oy===0) continue;
				const q = pxAtI(ROWOFF[yy] + xx);
			if (!q) continue;
			if (q.type !== type) continue;
			if (q.color != clr) continue;
			if(q.inWater!==true) continue;
				out.push(q);
			}
		} return out;
	};

	let BorderLimit = 20;
	if ((this.velX < 0 && this.x < BorderLimit) || (this.x > GW - BorderLimit && this.velX > 0)) {
		this.velX *= .9;
		if (Math.abs(this.velX) < .5) this.velX = - Math.sign(this.velX);
	}
	else if (this.velX <= 0 && this.x < BorderLimit) this.velX = 1;
	else if (this.velX >= 0 && this.x > GW - BorderLimit) this.velX = -1;
	if ((this.velY < 0 && this.y < BorderLimit) || (this.y > GH - BorderLimit && this.velY > 0)) {
		this.velY *= .9;
		if (Math.abs(this.velY) < .5) this.velY = - Math.sign(this.velY);
	}
	else if (this.velY <= 0 && this.y < BorderLimit) this.velY = 1;
	else if (this.velY >= 0 && this.y > GH - BorderLimit) this.velY = -1;

	if (!this.velX) this.velX = rdir() * SWIMSPEED;
	const nn = getNeighbors(this.x, this.y, this.type, FLOCK.r, this.color);
	if (!nn.length) {
		this.velX = this.xDir * SWIMSPEED;
		const nx = this.x + Math.round(this.velX * SIMSPEED * dt);
		const ny = this.y + Math.round(this.velY * SIMSPEED * dt);
		let px = pxAtI(ROWOFF[ny] + nx, this);
		if (!px) return (this.updatePosition(ROWOFF[ny] + nx));
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

	const k = 1;
	const nx = clamp(this.x + Math.round(this.velX*k), 0, GW - 1);
	const ny = clamp(this.y + Math.round(this.velY*k), 0, GH - 1);

	const tgt = pxAtI(ROWOFF[ny] + nx, this);
	if (tgt && tgt.physT != 'LIQUID') {
		const alt = [
			[nx, this.y],[this.x, ny],
			[this.x+Math.sign(this.velX), this.y],
			[this.x, this.y+Math.sign(this.velY)]
		];
		for(const [axn,ayn] of alt){
			const a=pxAtI(ROWOFF[ayn] + axn,this);
			if(a && (a.physT==='LIQUID' || a.type === this.type)){ this.swap(a); return; }
			if(!a){ this.updatePosition(ROWOFF[ayn] + axn); return; }
		}
		this.velX *= 0.5; this.velY *= 0.5;
		return;
	}
	let npx = pxAtI(ROWOFF[ny] + nx, this);
	if (npx) this.swap(npx);
	else this.updatePosition(ROWOFF[ny] + nx);
};

p.updateShroom = function (curX, curY) {
	if (this.dead) return (this.updatePosition(ROWOFF[curY] + curX));
	if (this.timeAlive <= 2 && !this.child) return (this.updatePosition(ROWOFF[curY] + curX));
	if (!this.hasTouchedBorder) {
		if (atBorder(curX, curY)) this.hasTouchedBorder = true;
		else {
			let down = pxAtI(ROWOFF[this.y + 1] + this.x, this);
			if ((down) && (down.hasTouchedBorder || (down.physT === 'SOLID' && down.type != this.type))) this.hasTouchedBorder = true;
		}
		if (!this.hasTouchedBorder) return (this.updatePosition(ROWOFF[curY] + curX));
		this.familyId = r_range(0, 100000);
	}
	if (this.parent && !this.child && (curX != this.x || curY != this.y)) {
		this.parent.toRemove();
		this.updatePosition(ROWOFF[curY] + curX);
	}
	if (!this.isGrower || this.parent) return;
	if (this.y < 10) return;
	if (!dice(this.growSpeed)) return;
	let px = this.x; let py = this.y - 1;
	if (dice(10)) px += rdir();
	let up = pxAtI(ROWOFF[py] + px, this);
	if (up && (up.physT === 'SOLID' && up.updT != 'ALIVE')) {
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
		newHead.familyId = this.familyId;
		newHead.ground = this;
		newHead.isHead = true;
		newHead.velX = newHead.velY = 0;
		newHead.yLimit = this.yLimit;
		newHead.id = this.id;
		newHead.child = this;
		newHead.heigth = this.heigth + 1;
		newHead.headColor = this.headColor;
		newColor = addColor(this.baseColor, 'rgb(255, 255, 255)', .015);
		this.setColor(newColor);
		newHead.baseColor = newColor;
		this.isHead = false;
		this.parent = newHead;
	}
}

TREEPERFRAME = 1;
p.updateTree = function (newX, newY) {
	if (this.dead) {
		this.updatePosition(ROWOFF[newY] + newX);
		return;
	}
	if ((!this.growerSet && this.timeAlive < .5) || (!this.hasTouchedBorder && !this.child)) {
		this.updatePosition(ROWOFF[newY] + newX);
		return;
	}
	if (!this.growerSet) {
		let l = pxAtI(this.i - 1);
		let r = pxAtI(this.i + 1);
		if ((l && l.type === this.type) || (r && r.type === this.type)) {
			this.isGrower = false;
			this.dead = true;
		}
		else {
			this.familyId = r_range(0, 100000);
			this.isBaobab = this.x < GW / 2;
			this.cut = 0;
			this.branch = 0;
			this.isGrower = true;
			this.maxHeight = Math.round(GH * f_range(.3, .99));
		}
		this.growerSet = true;
	}
	if (!this.isGrower) { return;}
	if (this.timeAlive < .1 && this.cut > TREEPERFRAME) { this.cut = 0; return;}
	if (this.heigth > this.maxHeight || this.y <= 15) { stopHead(this, true); return;}
	if (this.parent) return;
	if (this.xDir && dice(10)) this.xDir = 0;
	if (this.branch && dice(40)) this.xDir = rdir();
	if (this.branch) this.yDir = r_range(-1, this.isBaobab ? 0 : 1);
	newX = clamp(this.x + this.xDir, 3, GW - 4), newY = clamp(this.y + this.yDir, 0, GH - 1);
	if (this.heigth > this.maxHeight / 3 && dice(10)) makeBranch(this);
	let spot = pxAtI([ROWOFF[newY] + newX], this);
	if (spot) {
		this.inWater = spot.physT === 'LIQUID';
		if (spot.type === 'LEAF' || this.inWater) {
			spot.toRemove();
			spot = null;
		}
		else return (stopHead(this, spot.type !== 'TREE'));
	}
	if (!spot) growNewHead(newX, newY, this);
	else if (!pxAtI[ROWOFF[newY] + this.x - this.xDir, this]) this.xDir *= -1;
	else this.xDir = 0;
	if (!this.xDir && !this.yDir) this.yDir = -1;

	function stopHead(head, hasLeaves) {
		if (hasLeaves) growLeaves(head, false);
		head.isGrower = false;
	}

	function makeBranch(head) {
		let xDir = rdir();
		let nx = xDir + head.x;
		let ny = head.y;
		let px = pxAtI(ROWOFF[ny] + nx);
		if (px && px.type !== 'LEAF' && px.physT != 'LIQUID') {
			xDir *= -1;
			nx = xDir + head.x;
			px = pxAtI(ROWOFF[ny] + nx);
		}
		if (px && (px.type === 'LEAF')) px.toRemove();
		else if (px) { return;}
		let newHead = growNewHead(nx, ny, head);
		newHead.xDir = xDir;
		newHead.branch = head.branch + 1;
		newHead.heigth = head.heigth - 300;
	}

	function growNewHead(x, y, headChild, leavesBehind = !dice(10)) {
		let head = new Particle(x, y, headChild.type);
		head.familyId = headChild.familyId;
		head.child = headChild;
		head.xDir = headChild.xDir;
		head.isGrower = true;
		head.yDir = headChild.yDir;
		head.cut = headChild.cut + 1;
		head.branch = headChild.branch;
		head.growerSet = true;
		head.isBaobab = headChild.isBaobab;
		head.leavesColor = headChild.leavesColor;
		head.heigth = headChild.heigth + 1;
		headChild.parent = head;
		head.maxHeight = headChild.maxHeight;
		head.hasTouchedBorder = true;
		if (headChild.isBaobab || headChild.inWater) return (head);
		if ((head.heigth > head.maxHeight / 3) || head.branch) growLeaves(head, leavesBehind);
		return head;
	}

	function growLeaves(head, isBehind) {
		let depth;
		if (head.isBaobab) { depth = r_range(4, 8); isBehind = false; }
		else depth = r_range(5, 12);
		depth = clamp(depth, 2, 23 - PIXELSIZE);
		let color;
		if (isBehind) color = addColor(head.leavesColor, 'rgb(0, 0, 0)', f_range(.1, .5));
		else color = randomizeColor(head.leavesColor);

		let dist = isBehind ? 3 : 8;
		if (head.isBaobab) dist = 0;

		let startX = head.x + r_range(-dist, dist);
		let startY = head.y + r_range(-dist, dist);

		const rx = head.isBaobab ? depth * 2 : depth;
		const ry = head.isBaobab ? depth * 0.6 : depth;

		const maxX = Math.ceil(rx);
		const maxY = Math.ceil(ry);

		for (let x = -maxX; x <= maxX; x++) {
		for (let y = -maxY; y <= maxY; y++) {
			if ((x*x)/(rx*rx) + (y*y)/(ry*ry) > 1) continue;
				let sx = startX + x;
				let sy = startY + y;
				if (isOutOfBorder(sx, sy)) continue;
				let i = ROWOFF[sy] + sx;
				let px = pxAtI(i);
				if (px && px.physT === 'LIQUID') {
					px.toRemove();
					px = null;
				}
				if (isBehind) {
					if (px) continue;
					newLeaf(head, sx, sy, color, true);
					continue;
				}
				if (!px) {
					newLeaf(head, sx, sy, color, false);
					continue;
				}
				if (px.type === 'TREE' || px.type === 'LEAF') {
					px.setColor(color);
					px.isBehind = false;
					px.familyId = head.familyId;
				}
			}
		}
	}

	function newLeaf(head, x, y, color, isBehind) {
		let isBee = dice(5000);
		let leaf = new Particle(x, y, isBee ? 'BEE' : 'LEAF');
		if (!leaf.active) return;
		leaf.familyId = head.familyId;
		if (isBee) return;
		leaf.setColor(color);
		leaf.isBehind = isBehind;
		if (!dice(20)) leaf.updT = 'STATIC';
	}
}

p.updateLeaf = function () {
	if (FRAME % 4 !== 0) return;
	if (this.y >= GH) return;

	if (this.updT === 'STATIC') {
		let down = pxAtI(this.i + GH - 1);
		if (down) return;
		if (dice(3000)) this.updT = 'ALIVE';
		else return;
	}

	if (this._phase === undefined) this._phase = Math.random() * Math.PI * 2;
	const amplitude = 1;
	const speed = 0.1;
	let drift = Math.round(Math.sin(FRAME * speed + this._phase) * amplitude);

	let newX = clamp(this.x + drift, 0, GW - 1);
	let newY = this.y + 1;
	let newI = ROWOFF[newY] + newX;
	let down = pxAtI(newI);

	if (down && down.type === this.type) { return; }
	else if (down) { return; }

	this.updatePosition(newI);
};

p.updateBee = function () {

	if (this.id % 5 == 0) {
		if (FRAME % 4 !== 0) return;
		if (this.fx == null) { this.fx = this.x; this.fy = this.y; }
		this.angle += 0.1;

		// if (dice(200)) this.angle = f_range(-Math.PI, Math.PI);
		if (this.angle > Math.PI) this.angle -= Math.PI * 2;
		else if (this.angle <= -Math.PI) this.angle += Math.PI * 2;
		const speed = 0.5;
		this.fx += Math.cos(this.angle) * speed;
		this.fy += Math.sin(this.angle) * speed;
		const ix = clamp(this.fx | 0, 0, GW - 1);
		const iy = clamp(this.fy | 0, 0, GH - 1);
		const newI = ROWOFF[iy] + ix;
		const px = pxAtI(newI);
		if (!px) this.updatePosition(newI);
	}


	else if (0) {
		if (this._phase === undefined) this._phase = Math.random() * Math.PI * 2;
		const amplitude = 1;
		const speed = 0.3;
		let drift = Math.round(Math.sin(FRAME * speed + this._phase) * amplitude);

		let newX = clamp(this.x + this.xDir, 0, GW - 1);
		if (newX != this.x + this.xDir) this.xDir *= -1;

		let newY = clamp(this.y + drift, 0, GH - 1);
		let newI = ROWOFF[newY] + newX;
		let down = pxAtI(newI);

		if (down) {
			this.xDir *= -1;
			return;
		}
		this.updatePosition(newI);
	}
	else {
		if (FRAME % 3 !== 0) return;

		if (!this.xDir && !this.yDir) {
			if (dice(20)) {
				let r = r_range(0, 4);
				if (r === 0) { this.xDir = 1; this.yDir = -1; }
				else if (r === 1) { this.xDir = -1; this.yDir = 1; }
				else if (r === 2) { this.xDir = -1; this.yDir = 1; }
				else this.xDir = 1; this.yDir = 1;
			}
			else return;
		}
		let newX = clamp(this.x + this.xDir, 0, GW - 1);
		let newY = clamp(this.y + this.yDir, 0, GH - 1);
		let newI = ROWOFF[newY] + newX;
		let px = pxAtI(newI)
		if (px && px.type === 'LEAF') { this.swap(px); return; }
		if (px || dice(10)) this.xDir = this.yDir = 0;
		if (Math.abs(newX - this.startX) > 10) this.xDir = newX > this.startX ? -1 : 1;
		if (Math.abs(newY - this.startY) > 10) this.yDir = newY > this.startY ? -1 : 1;
		if (!px) this.updatePosition(newI);
	}
};
