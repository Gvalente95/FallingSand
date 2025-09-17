p.shouldSpreadCheck = function () {
	if (hasInput) return true;
	let massMax = 3;
	let massAbove = 0;
	const base = this.i;
	const step = -GW;
	while (++massAbove < massMax) {
		const q = grid1[base + step * massAbove];
		if (!q || q.physT != 'LIQUID') return true;
	}
	return false;
};

p.updateLiquid = function (curX, curY, spreadAm = this.spreadAmount) {
	if (this.spread < 2) return (this.updatePosition(ROWOFF[curY] + curX));
	const up = pxAtI(ROWOFF[curY - 1] + curX, this);
	if (up && up.dns > this.dns && up.physT === 'LIQUID' && up.type !== 'BUBBLE') {
		this.velX = 0; this.swap(up); return;
	}
	if (!this.hasTouchedSurface) {
		if (this.hasTouchedSurfaceCheck()) this.hasTouchedSurface = true;
		else { this.updatePosition(ROWOFF[curY] + curX); return; }
	}
	if (!this.ground || curY == GH - 1) return (this.updatePosition(ROWOFF[curY] + curX));
	if (this.timeAlive > 1 && (secTick || hasInput)) this.shouldSpread = this.shouldSpreadCheck();
	if (!this.shouldSpread) return (this.updatePosition(ROWOFF[curY] + curX));
	let xDir = this.xDir || 1;
	if ((curX <= 0 && xDir < 0) || (curX >= GW - 1 && xDir > 0)) xDir = -xDir;

	const maxSteps = Math.min(spreadAm - 1, xDir > 0 ? (GW - 1 - curX) : curX);
	let newX = curX;
	let found = false;
	for (let i = 1; i <= maxSteps; i++) {
		const xp = curX + i * xDir;
		const cell = pxAtI(ROWOFF[curY] + xp);
		if (!cell) { newX = xp; found = true; break; }
		// if (cell.type === 'LEAF') { this.swap(cell); return; }
		if (cell.updT === 'ALIVE') continue;
		if (cell.physT !== 'LIQUID') break;
		if (cell.type !== this.type && cell.dns > this.dns) { this.swap(cell); return; }
		if (curY < GH - 1) {
			const below = pxAtI(ROWOFF[curY + 1] + xp);
			if (!below) { newX = xp; curY++; found = true; break; }	
		}
	}
	if (!found) this.xDir *= -1;
	this.updatePosition(ROWOFF[curY] + newX);
};

p.updateCloud = function () {
	if (!this.ground) {
		let dChance = r_range(0, 600);
		if (dChance < 2) new Particle(this.x, this.y + 1, 'BOLT');
		else if (dChance < 3) {
			let p = new Particle(this.x, this.y + 1, 'WATER');
			p.fin = 3;
		}
	}
	// return;
	if (FRAME % 2 !== 0) return;
	let newX = this.x + this.xDir;
	let newY = this.y;
	if (isOutOfBorder(newX, newY)) { this.toRemove(); return; }
	this.updatePosition(ROWOFF[newY] + newX);
}

p.updatePlant = function (curX, curY) {
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
p.updateFish = function(){
	let l = pxAtI(ROWOFF[this.y + 1] + this.x, this);
	if (!l || l.physT != 'LIQUID') l = pxAtI(ROWOFF[this.y] + this.x - 1, this);
	if (!l || l.physT != 'LIQUID') l = pxAtI(ROWOFF[this.y] + this.x + 1, this);
	if (!l || l.physT != 'LIQUID') l = pxAtI(ROWOFF[this.y - 1] + this.x);
	if (!l || l.physT != 'LIQUID') {
		this.updatePosition(ROWOFF[this.newY] + this.newX);
		this.inWater = false;
		if (dice(300)) this.velY = -2;
		this.timeInWater = 0;
		return;
	}
	this.inWater = true;
	if (dice(1000)) {
		let px = pxAtI(ROWOFF[this.newY - 1] + this.newX, this);
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
	const nx = this.x + Math.round(this.velX*k);
	const ny = this.y + Math.round(this.velY*k);

	const tgt = pxAtI(ROWOFF[ny] + nx, this);
	if (tgt) {
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
	if (this.timeAlive <= 2 && !this.child) return (this.updatePosition(ROWOFF[curY] + curX));
	if (!this.hasTouchedBorder) {
		if (atBorder(curX, curY)) this.hasTouchedBorder = true;
		else {
			let down = pxAtI(ROWOFF[this.y + 1] + this.x, this);
			if ((down) && (down.hasTouchedBorder || (down.physT === 'SOLID' && down.type != this.type))) this.hasTouchedBorder = true;
		}
		if (!this.hasTouchedBorder) return (this.updatePosition(ROWOFF[curY] + curX));
	}
	if (this.parent && !this.child && (curX != this.x || curY != this.y)) {
		this.parent.toRemove();
		this.updatePosition(ROWOFF[curY] + curX);
	}
	if (!this.isGrower || this.parent) return;
	if (this.y < 10) return;
	if (!dice(this.growSpeed)) return;
	let px = this.x; let py = this.y;
	py--; if (dice(10)) px += rdir();
	let up = pxAtI(ROWOFF[py] + px, this);
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
		newHead.isHead = true;
		newHead.velX = newHead.velY = 0;
		newHead.yLimit = this.yLimit;
		newHead.id = this.id;
		newHead.child = this;
		newHead.heigth = this.heigth + 1;
		newHead.headColor = this.headColor;
		newColor = addColor(this.baseColor, 'rgba(255, 255, 255, 1)', .015);
		this.setColor(newColor);
		newHead.baseColor = newColor;
		this.isHead = false;
		this.parent = newHead;
	}
}

p.updateSteam = function(newX, newY){
	if (this.y < 60 && dice(10))
	{
		let cx = newX, cy = newY - 1;
		this.toRemove();
		let spacing = 1;
		let depth = r_range(2, 5);
		for (let x = -depth; x < depth; x++){
			for (let y = -depth; y < 0; y++){
				let gx = cx + x * spacing, gy = cy + y * spacing;
				let px = pxAtI[ROWOFF[gy] + gx];
				if (px) continue;
				new Particle(cx + x * spacing, cy + y * spacing, 'CLOUD');
			}
		}
	}
	let newI = ROWOFF[newY] + newX;
	if (pxAtI[newI]) return;
	else this.updatePosition(newI);
}

p.updateTree = function (newX, newY) {
	if (!this.hasTouchedBorder && !this.child) {
		this.yDir = -1;
		this.xDir = 0;
		this.updatePosition(ROWOFF[newY] + newX);
		return;
	}
	if (!this.growerSet) {
		let l = pxAtI(this.i - 1);
		let r = pxAtI(this.i + 1);
		if (l || r) this.isGrower = false;
		else {
			this.branch = 0;
			this.isGrower = true;
			this.maxHeight = Math.round(GH * f_range(.3, .99));
		}
		this.growerSet = true;
	}
	if (!this.isGrower) { return;}
	// if (this.timeAlive < .1) return;
	if (this.heigth > this.maxHeight) { growLeaves(this, 0); this.isGrower = 0; return;}
	if (this.parent) return;
	if (this.xDir && dice(10)) this.xDir = 0;
	if (this.branch && dice(40)) this.xDir = rdir();
	if (this.branch) this.yDir = r_range(-1, 0);
	newX = this.x + this.xDir, newY = this.y + this.yDir;
	if (this.heigth > this.maxHeight / 3 && dice(10)) makeBranch(this);
	let spot = pxAtI[ROWOFF[newY] + newX];
	// if (spot && (spot.type === this.type || spot.type === 'LEAF'))
	// {
	// 	this.swap(spot);
	// 	newX = this.x + this.xDir, newY = this.y + this.yDir;
	// 	spot = null;
	// }
	if (!spot) growNewHead(newX, newY, this);
	else if (!pxAtI[ROWOFF[newY] + this.x - this.xDir]) this.xDir *= -1;
	else this.xDir = 0;

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
		else if (px) return;
		let newP = growNewHead(nx, ny, head);
		newP.xDir = xDir;
		newP.branch = head.branch + 1;
	}

	function growNewHead(x, y, headChild, leavesBehind = !dice(10)) {
		let head = new Particle(x, y, headChild.type);
		head.child = headChild;
		head.xDir = headChild.xDir;
		head.isGrower = true;
		head.yDir = headChild.yDir;
		head.branch = headChild.branch;
		head.growerSet = true;
		head.leavesColor = headChild.leavesColor;
		head.heigth = headChild.heigth + 1;
		headChild.parent = head;
		head.maxHeight = headChild.maxHeight;
		head.hasTouchedBorder = true;
		if ((head.heigth > head.maxHeight / 3) || head.branch) growLeaves(head, leavesBehind);
		return head;
	}

	function growLeaves(head, isBehind) {
		let depth = r_range(3, 8);
		if (depth < 2) return;
		let color;
		if (isBehind) color = addColor(head.leavesColor, 'rgba(0, 0, 0, 1)', f_range(.1, .5));
		else color = randomizeColor(head.leavesColor);

		let dist = isBehind ? 3 : 8;
		let startX = head.x + r_range(-dist, dist);
		let startY = head.y + r_range(-dist, dist);
		if (depth < 2) return;
		let r2 = depth * depth;
		for (let x = -depth; x < depth + 1; x++){
			for (let y = -depth; y < depth + 1; y++){
				if ((x * x + y * y) >= r2) continue;
				let sx = startX + x;
				let sy = startY + y;
				let i = ROWOFF[sy] + sx;
				let px = pxAtI(i);
				if (px && px.physT === 'LIQUID') {
					px.toRemove();
					px = null;
				}
				if (isBehind) {
					if (px) {
						continue;
					}
					let leaf = new Particle(sx, sy, 'LEAF');
					if (!leaf.active) continue;
					leaf.setColor(color);
					leaf.isBehind = true;
					if (!dice(20)) leaf.updT = 'STATIC';
					continue;
				}
				if (!px) {
					let leaf = new Particle(sx, sy, 'LEAF');
					if (!leaf.active) continue;
					leaf.setColor(color);
					leaf.isBehind = false;
					if (!dice(20)) leaf.updT = 'STATIC';
					continue;
				}
				if (px.type === 'TREE' || px.type === 'LEAF') {
					px.setColor(color);
					px.isBehind = false;
				}
			}
		}
	}
}


p.updateLeaf = function () {
	if (FRAME % 5 != 0) return;
	if (this.y >= GH) return;

	if (this.updT === 'STATIC') {
		let down = pxAtI(this.i + GH - 1);
		if (down) return;
		if (dice(3000)) this.updT = 'ALIVE';
		else return;
	}
	if (dice(10)) this.xDir = 0;
	if (dice(8)) this.xDir = rdir();
	let drift = dice(3) ? rdir() : 0;
	let newX = clamp(this.x + this.xDir + drift, 0, GW - 1);
	let newY = this.y + 1;
	let newI = ROWOFF[newY] + newX;
	let down = pxAtI(newI);
	if (down && down.type == this.type) { this.xDir *= -1; return; }
	else if (down) { this.xDir = 0; return; }
	this.updatePosition(newI);
	if (FRAME % 16 === 0) this.xDir *= -1;
}

const UPDATE_HANDLERS = {
	STEAM: p => p.updateSteam(p.newX, p.newY),
	ANT:   p => p.updateAnt(p.newX, p.newY),
	FISH:  p => p.updateFish(p.newX, p.newY),
	PLANT: p => p.updatePlant(p.newX, p.newY),
	SHROOM: p => p.updateShroom(p.newX, p.newY),
	SHROOMX: p => p.updateShroom(p.newX, p.newY),
	FIRE:  p => p.FireEffect(p.newX, p.newY),
	TORCH: p => p.FireEffect(p.newX, p.newY),
	MAGMA: p => p.MagmaEffect(p.newX, p.newY),
	BOLT: p => p.moveStraight(p.newX, p.newY),
	TREE: p => p.updateTree(p.newX, p.newY),
};

p.updateType = function () {
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
	else if (this.isShroom && this.hasTouchedBorder && this.isGrower) return this.updateShroom(this.x, this.y);
	else if (this.type === 'TREE' && this.isGrower) return this.updateTree();
	else if (this.type === 'TORCH' && dice(10)) new Particle(this.x, this.y - 1, 'FIRE');
	if (this.updT === 'STATIC') return;
	if (this.type !== 'PLANT') this.updateVelocity();
	if (this.velX || this.velY) this.updateMovement();
	const h = UPDATE_HANDLERS[this.type];
	if (h) return h(this);
	this.updatePosition(ROWOFF[this.newY] + this.newX);
};

p.setType = function(newType, transformType = null)
{
	if (newType === 'TORCH' && !dice(8)) newType = 'FIRE';

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
		let clrs = ["rgba(135, 60, 163, 1)", "rgba(11, 93, 61, 1)", this.properties.color];
		this.setColor(clrs[r_range(0, clrs.length)]);
	}
	else if (this.isShroom) {
		this.headColor = randomizeColor(this.properties.color, 50);
		let color = newType == 'SHROOMX' ? 'rgba(71, 45, 119, 1)' : 'rgba(45, 119, 83, 1)';
		if (this.properties.rclr) color = randomizeColor(color);
		this.setColor(color);
		this.isGrowing = false;
		this.isGrower = this.id % 4 == 0;
		this.maxHeight = r_range(2, 20);
		this.growSpeed = r_range(2, 6);
	}
	else if (this.type === 'CLOUD') {
		this.size = r_range(2, 30);
		this.alpha = f_range(.1, .2);
		if (dice(10))
			this.setColor(addColor(this.properties.color, 'rgba(132, 132, 132, 1)', r_range(1, 10)));
		else	this.setColor(this.properties.color);
	}
	else this.setColor(this.properties.rclr ? randomizeColor(this.properties.color) : this.properties.color);
	this.baseColor = this.color;
	if (this.type == 'PLANT') {
		this.growSpeed = r_range(1, 3);
		this.dirAng = Math.atan2(f_range(-1, 1), f_range(-1, 1));
		this.oscPhase = Math.random() * Math.PI * 2;
		this.oscSpeed = f_range(0.0025, 0.006);
		this.oscAmp = f_range(2, 6);
	}
	else if (this.type === 'TREE') {
		let colors = ['rgba(189, 131, 212, 1)', 'rgba(199, 132, 132, 1)', 'rgba(145, 202, 157, 1)', 'rgba(191, 169, 41, 1)', 'rgba(204, 34, 34, 1)', 'rgba(34, 204, 173, 1)'];
		this.leavesColor = colors[r_range(0, colors.length)];
	}
	else if (this.type == 'ANTEGG') this.transformType = 'ANT';
	else if (this.type == 'COAL') { this.velX = 0; }
}



p.moveStraight = function (newX, newY) {
	if (this.parent) {
		return;
	}
	if (this.fseed < .99) return this.toRemove();
	let np = null;
	let ny = newY;
	let nx = newX;
	while (++ny < GH - 1) {
		nx += rdir();
		let pAti = grid1[ROWOFF[ny + 1] + nx];
		if (pAti) pAti = grid1[ROWOFF[ny + 1] + nx + 1];
		if (pAti && pAti.physT != 'GAS')
			break;
		np = new Particle(nx, ny, this.type);
		np.lt = this.lt + (GH - (ny - newY)) * .001;
		np.timeAlive = this.timeAlive;
		np.parent = this;
	}
	explodeRadius(nx * PIXELSIZE, ny * PIXELSIZE, PIXELSIZE * 4, 5, 'FIRE', this.type);
	this.toRemove();
}