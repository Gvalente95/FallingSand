
p.updateFly = function (curX, curY) {
	this.updatePosition(ROWOFF[curY] + curX);

	const spd = 0.5;
	const margin = 40;
	let fx = f_range(-spd, spd);
	let fy = f_range(-spd, spd);

	if (curX < margin) fx += (margin - curX) * 0.02;
	else if (curX > GW - margin) fx -= (curX - (GW - margin)) * 0.02;

	if (curY < margin) fy += (margin - curY) * 0.02;
	else if (curY > GH - margin) fy -= (curY - (GH - margin)) * 0.02;

	this.velX += fx;
	this.velY += fy;

	if (!this.isSlowingDown && fdice(2)) this.isSlowingDown = true;
	if (this.isSlowingDown) {
		this.velX *= .9;
		this.velY *= .9;
		if (fdice(5)) this.isSlowingDown = false;
	}
}


p.updateAlien = function (curX, curY) {
	if (this.parent || (FRAME % (this.growSpeed)) != 0) return;
	if (curX >= GW) curX = GW - 1;
	if (curX < 0) curX = 0;
	let inWater = false;
	const cell = cellAtI(ROWOFF[curY] + curX, this);
	if (cell) {
		if (cell.type === 'WATER') { inWater = true; cell.toRemove(); }
		else if (cell.type == this.type && cell.parent) { cell.toRemove(); }
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
	const clone = new Cell(ox, oy, this.type);
	clone.parent = this;
	if (dice(10))this.dirAng += f_range(-0.3, 0.3);
	// if (this.timeAlive < 2) {
	// 	let rcell = getcelllsInRect(this.x, this.y, 3, 3, this.type);
	// 	let isStuck = (rcell.length > 4);
	// 	if (isStuck) {return (this.setColor());}
	// 	else if (this.color != "rgba(133, 190, 154, 1)") {
	// 		this.setColor("rgba(133, 190, 154, 1)");
	// 		if (this.timeAlive > 6) this.toRemove();
	// 	}
	// }
}

p.updateAnt = function (curX, curY) {
	if (this.type === 'FIREANT' && dice(5)) {
		var xx = this.x + this.xDir;
		var yy = this.y + this.yDir;
		let flameX = (xx === 0 ? 1 : xx >= GW - 1 ? GW - 2 : xx);
		let flameY = (yy === 0 ? 1 : yy >= GH - 1 ? GH - 2 : yy);
		newP = new Cell(flameX, flameY, 'FIRE');
		if (this.xDir) {newP.velX = 0; newP.velY = this.y < 50 ? 1 : -1}
		if (this.yDir) { newP.velY = 0; newP.velX = this.x < 50 ? 1 : -1 };
	}
	if (this.burning) { this.updatePosition(ROWOFF[curY] + curX); return;}
	if (this.inWater) {
		if (this.timeInWater === 100) { this.xDir = rdir();}
		else if (this.timeInWater > 100) {
			if (!cellAtI(ROWOFF[this.y + 1] + this.x, this)) { this.inWater = false; return (this.updatePosition(ROWOFF[this.y + 1] + this.x)); }
			this.velY = -1;
			if (!this.xDir) this.xDir = rdir();
			let cell = cellAtI(ROWOFF[this.y - 1] + this.x, this);
			if (cell && cell.physT === 'LIQUID') return (this.swap(cell));
			cell = cellAtI(ROWOFF[this.y] + this.x + this.xDir, this);
			if (cell) { this.swap(cell); return; }
			this.xDir *= -1;
			cell = cellAtI(ROWOFF[this.y] + this.x + this.xDir, this);
			if (cell && cell.physT === 'LIQUID') return (this.swap(cell));
			return;
		}
		else this.velX = 0, this.xDir = 0;
	}
	if (!this.d && !atBorder(curX, curY)) {
		this.hasTouchedSurface = false;
		this.updatePosition(ROWOFF[curY] + curX);
		return;
	}
	if (!this.hasTouchedSurface) {
		let gr = this.d;
		this.hasTouchedSurface = (this.y >= GH - 1) || (gr && ((gr.type === this.type && gr.hasTouchedSurface) || gr.hasTouchedBorder));
		if (!this.hasTouchedSurface) {
			let cell = cellAtI(ROWOFF[curY] + curX, this);
			if (cell) { cell = cellAtI(ROWOFF[curY] + curX + this.xDir, this); if (!cell) curX++; else this.xDir *= -1; }
			if (!cell) this.updatePosition(ROWOFF[curY] + curX);
			return;
		}
		this.isBurrower = dice(30);
		this.xDir = rdir();
		this.yDir = 0;
	}
	let rChance = r_range(0, 12000);
	if (rChance > 11500) return;
	curX = this.x; curY = this.y;
	if (this.timeAlive > 10 && rChance == 0) {
		new Cell(curX - this.xDir, curY - this.yDir, 'ANTEGG');
		this.xDir = this.yDir = 0;
	}
	if (!this.xDir && !this.yDir) {this.xDir = rdir(); this.yDir = rdir();}

	function isValid(x, y, xd, yd) {
		return (!cellAtI(ROWOFF[y + yd] + x + xd, this) && !isOutOfBorder(x + xd, y + yd));
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
		let l = cellAtI(ROWOFF[curY] + curX - 1, this);
		let r = cellAtI(ROWOFF[curY] + curX + 1, this);
		if (!d && !l && !r) {
			this.hasTouchedSurface = false;
			curY++;
			this.yDir = 1;
			this.xDir = 0;
			return (this.updatePosition(ROWOFF[curY] + curX));
		}
		if (d) this.ground = d;
	}
	
	let cell = cellAtI(ROWOFF[curY + this.yDir] + curX + this.xDir);
	if (cell && cell.type === this.type) cell = null;
	if (!cell && dice(10) && this.neighborCount) {
		cell = this.neighbors[r_range(0, this.neighbors.length)];
	}
	if (cell) {
		if (cell.physT === 'LIQUID' || cell.wet) { this.inWater = true; this.timeInWater++;  }
		if (cell.updT == 'ALIVE') {
			this.swap(cell);
			return;
		}
		if (cell.physT === 'SOLID')
		{
			if (this.isBurrower && dice(cell.dns / 10))
				return (this.makeHole(cell));
			if (this.xDir === 1) {
				if (!this.ru || this.ru.type === this.type) this.updatePosition(ROWOFF[cell.y - 1] + cell.x);
				else if (!this.rd || this.rd.type === this.type) this.updatePosition(ROWOFF[cell.y + 1] + cell.x);
				else this.xDir *= -1;
			}
			else {
				if (!this.lu || this.lu.type === this.type) this.updatePosition(ROWOFF[cell.y - 1] + cell.x);
				else if (!this.ld || this.ld.type === this.type) this.updatePosition(ROWOFF[cell.y + 1] + cell.x);
				else this.xDir *= -1;
			}
			return;
		}
	}
	if (isValid(curX, curY, this.xDir, this.yDir))
		this.updatePosition(ROWOFF[curY + this.yDir] + curX + this.xDir);
	else {
		if (cell && isValid(curX, curY, this.xDir, this.yDir))
			this.updatePosition(ROWOFF[curY + this.yDir] + curX + this.xDir);
		else if (cell && isValid(curX, curY, this.xDir, 1)) {
			this.hasTouchedSurface = false;
			this.velY = 0;
			this.updatePosition(ROWOFF[curY + 1] + curX + this.xDir);}
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
		let cell = this.neighbors[i];
		if (cell.physT === 'LIQUID') break;
	}
	this.inWater = i < this.neighborCount;
	if (!this.inWater) {
		this.updatePosition(ROWOFF[this.newY] + this.newX);
		if (dice(300)) this.velY = -2;
		this.timeInWater = 0;
		return;
	}
	// let l = cellAtI(ROWOFF[this.y + 1] + this.x, this);
	// if (!l || l.physT != 'LIQUID') l = cellAtI(ROWOFF[this.y] + this.x - 1, this);
	// if (!l || l.physT != 'LIQUID') l = cellAtI(ROWOFF[this.y] + this.x + 1, this);
	// if (!l || l.physT != 'LIQUID') l = cellAtI(ROWOFF[this.y - 1] + this.x);
	// if (!l || l.physT != 'LIQUID') {
	// 	this.updatePosition(ROWOFF[this.newY] + this.newX);
	// 	this.inWater = false;
	// 	if (dice(300)) this.velY = -2;
	// 	this.timeInWater = 0;
	// 	return;
	// }
	// this.inWater = true;

	if (dice(1000)) {
		let cell = this.u;
		if (cell && cell.physT === 'LIQUID') {
			let type = cell.type;
			cell = cell.replace('BUBBLE', type);
		}
	}
	if (++this.timeInWater < 30) {
		this.velY *= .8;
		if (dice(10)) this.velX = rdir() * SWIMSPEED;
		let cell = cellAtI(ROWOFF[this.newY] + this.newX, this);
		if (cell && cell.physT === 'LIQUID') this.swap(cell);
		return;
	}
	function getNeighbors(x,y,type,r, clr){
		const out=[]; const rr=r|0;
		for(let oy=-rr; oy<=rr; oy++){
			const yy=y+oy; if(yy<0||yy>=GH) continue;
			for(let ox=-rr; ox<=rr; ox++){
				const xx=x+ox; if(xx<0||xx>=GW) continue;
				if(ox===0&&oy===0) continue;
				const q = cellAtI(ROWOFF[yy] + xx);
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
		let cell = cellAtI(ROWOFF[ny] + nx, this);
		if (!cell) return (this.updatePosition(ROWOFF[ny] + nx));
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

	const tgt = cellAtI(ROWOFF[ny] + nx, this);
	if (tgt && tgt.physT != 'LIQUID') {
		const alt = [
			[nx, this.y],[this.x, ny],
			[this.x+Math.sign(this.velX), this.y],
			[this.x, this.y+Math.sign(this.velY)]
		];
		for(const [axn,ayn] of alt){
			const a=cellAtI(ROWOFF[ayn] + axn,this);
			if(a && (a.physT==='LIQUID' || a.type === this.type)){ this.swap(a); return; }
			if(!a){ this.updatePosition(ROWOFF[ayn] + axn); return; }
		}
		this.velX *= 0.5; this.velY *= 0.5;
		return;
	}
	let ncell = cellAtI(ROWOFF[ny] + nx, this);
	if (ncell) this.swap(ncell);
	else this.updatePosition(ROWOFF[ny] + nx);
};

p.updateShroom = function (curX, curY) {
	if (this.dead) return (this.updatePosition(ROWOFF[curY] + curX));
	if (this.timeAlive <= 2 && !this.child) return (this.updatePosition(ROWOFF[curY] + curX));
	if (!this.hasTouchedBorder) {
		if (atBorder(curX, curY)) this.hasTouchedBorder = true;
		else {
			let down = cellAtI(ROWOFF[this.y + 1] + this.x, this);
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
	let cell = this.x; let py = this.y - 1;
	if (dice(10)) cell += rdir();
	let up = cellAtI(ROWOFF[py] + cell, this);
	if (up && (up.physT === 'SOLID' && up.updT != 'ALIVE')) {
		this.swap(up);
		return;
	}
	if (up) {
		if (up.physT != 'LIQUID') return;
		if (up.type === 'WATER' && this.type != 'SHROOM') return;
		if (up.cor && this.type === 'SHROOM') return;
		if (up.type === this.type) return;
		if (up.type === 'ENTITY') return;
	}
	if ((!up && this.heigth < this.maxHeight) || (up && up.physT === 'LIQUID')) {
		if (up)
		{
			this.inWater = true;
			this.maxHeight = this.heigth + r_range(2, this.heigth / 3);
			up.toRemove();
			up = null;
		}
		let newHead = new Cell(cell, py, this.type);
		newHead.hasTouchedBorder = true;
		newHead.isGrower = this.isGrower;
		newHead.growSpeed = this.growSpeed;
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
		let l = cellAtI(this.i - 1);
		let r = cellAtI(this.i + 1);
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
	if (!this.isGrower) { return; }
	if (this.child && this.child.type !== this.type) {
		this.killFamily();
	}
	if (this.timeAlive < .1 && this.cut > TREEPERFRAME) { this.cut = 0; return;}
	if (this.heigth > this.maxHeight || this.y <= 15) { stopHead(this, true); return;}
	if (this.parent) return;
	if (this.xDir && dice(10)) this.xDir = 0;
	if (this.branch && dice(40)) this.xDir = rdir();
	if (this.branch) this.yDir = r_range(-1, this.isBaobab ? 0 : 1);
	newX = clamp(this.x + this.xDir, 3, GW - 4), newY = clamp(this.y + this.yDir, 0, GH - 1);
	if (this.heigth > this.maxHeight / 3 && dice(10)) makeBranch(this);
	let spot = cellAtI([ROWOFF[newY] + newX], this);
	if (spot) {
		this.inWater = spot.physT === 'LIQUID';
		if (spot.type === 'LEAF' || this.inWater) {
			spot.toRemove();
			spot = null;
		}
		else return (stopHead(this, spot.type !== 'TREE'));
	}
	if (!spot) growNewHead(newX, newY, this);
	else if (!cellAtI[ROWOFF[newY] + this.x - this.xDir, this]) this.xDir *= -1;
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
		let cell = cellAtI(ROWOFF[ny] + nx);
		if (cell && cell.type !== 'LEAF' && cell.physT != 'LIQUID') {
			xDir *= -1;
			nx = xDir + head.x;
			cell = cellAtI(ROWOFF[ny] + nx);
		}
		if (cell && (cell.type === 'LEAF')) cell.toRemove();
		else if (cell) { return;}
		let newHead = growNewHead(nx, ny, head);
		newHead.xDir = xDir;
		newHead.branch = head.branch + 1;
		newHead.heigth = head.heigth - 300;
	}

	function growNewHead(x, y, headChild, leavesBehind = !dice(10)) {
		let head = new Cell(x, y, headChild.type);
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
				let cell = cellAtI(i);
				if (cell && cell.physT === 'LIQUID') {
					cell.toRemove();
					cell = null;
				}
				if (isBehind) {
					if (cell) continue;
					newLeaf(head, sx, sy, color, true);
					continue;
				}
				if (!cell) {
					newLeaf(head, sx, sy, color, false);
					continue;
				}
				if (cell.type === 'TREE' || cell.type === 'LEAF') {
					cell.setColor(color);
					cell.isBehind = false;
					cell.familyId = head.familyId;
				}
			}
		}
	}

	function newLeaf(head, x, y, color, isBehind) {
		let isBee = dice(200);
		let leaf = new Cell(x, y, isBee ? 'BEE' : 'LEAF');
		if (!leaf.active) return;
		leaf.familyId = head.familyId;
		if (isBee) return;
		leaf.setColor(color);
		leaf.isBehind = isBehind;
		if (!dice(20)) leaf.updT = 'STATIC';
	}
}

p.updateLeaf = function () {
	if (FRAME % 2 !== 0) return;
	if (this.y >= GH) return;

	if (this.updT === 'STATIC') {
		let down = cellAtI(this.i + GH - 1);
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
	let atPos = cellAtI(newI);
	if (!atPos)
		this.updatePosition(newI);
};

p.updateBee = function () {

	if (this.id % 5 == 0) {
		if (FRAME % 4 !== 0) return;
		if (this.fx == null) { this.fx = this.x; this.fy = this.y; }
		this.angle += 0.1;
		if (this.angle > Math.PI) this.angle -= Math.PI * 2;
		else if (this.angle <= -Math.PI) this.angle += Math.PI * 2;
		const speed = 0.5;
		this.fx += Math.cos(this.angle) * speed;
		this.fy += Math.sin(this.angle) * speed;
		const ix = clamp(this.fx | 0, 0, GW - 1);
		const iy = clamp(this.fy | 0, 0, GH - 1);
		const newI = ROWOFF[iy] + ix;
		const cell = cellAtI(newI);
		if (!cell) this.updatePosition(newI);
	}


	else if (this.id % 6 === 0) {
		if (FRAME % 2 !== 0) return;
		if (this._phase === undefined) this._phase = Math.random() * Math.PI * 2;
		const amplitude = 1;
		const speed = 0.3;
		let drift = Math.round(Math.sin(FRAME * speed + this._phase) * amplitude);

		let newX = clamp(this.x + this.xDir, 0, GW - 1);
		if (newX != this.x + this.xDir) this.xDir *= -1;

		let newY = clamp(this.y + drift, 0, GH - 1);
		let newI = ROWOFF[newY] + newX;
		let down = cellAtI(newI);

		var isTooFar = Math.abs(newX - this.startX) > 20;
		if (down || isTooFar) {
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
		let cell = cellAtI(newI)
		if (cell && cell.type === 'LEAF') { this.swap(cell); return; }
		if (cell || dice(10)) this.xDir = this.yDir = 0;
		if (Math.abs(newX - this.startX) > 10) this.xDir = newX > this.startX ? -1 : 1;
		if (Math.abs(newY - this.startY) > 10) this.yDir = newY > this.startY ? -1 : 1;
		if (!cell) this.updatePosition(newI);
	}
};


p.updateGrassBlade = function (newX, newY) {
	this.updatePosition(ROWOFF[newY] + newX);
	if (this.finalSet) {
		if (!this.colorSet && this.ground) {
			this.setColor(this.ground.color);
			this.colorSet = true;
		}
		return;
	}
	if (this.timeAlive < .1)
		return;
	let underGround;
	for (let y = 1; y < this.height; y++) {
		underGround = cellAtI(this.i + GW * y, this);
		if (!underGround || underGround.type !== this.type)
			return;
	}
	if (underGround) {
		if (!this.finalSet && underGround.hasTouchedBorder)
			this.finalSet = true;
		underGround.toRemove();
	}
	else
		this.toRemove();
};