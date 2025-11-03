function getEntityAtPos(x, y, radius){
	for (const e of entities) {
		let xy = [e.x + e.w / 2, e.y + e.h / 2];
		if (Math.abs(x - xy[0]) < radius && Math.abs(y - xy[1]) < radius)
			return e;
	}
	return null;
}

function displaceWaterCell(liq, occ, maxPush = 12) {
  if (!liq) return false;
  const x = liq.x, y = liq.y;
  const dir = Math.sign((occ?.x ?? x) - x) || 1;

  const tryMoveTo = (nx, ny) => {
    if (nx <= 0 || nx >= GW - 1 || ny <= 0 || ny >= GH - 1) return false;
    const ni = ROWOFF[ny] + nx;
    if (!cellAtI(ni)) { liq.updatePosition(ni); return true; }
    return false;
  };

  if (tryMoveTo(x, y + 1)) return true;
  if (tryMoveTo(x + dir, y + 1)) return true;
  if (tryMoveTo(x - dir, y + 1)) return true;
  if (tryMoveTo(x + dir, y)) return true;
  if (tryMoveTo(x - dir, y)) return true;

  for (let step = 1; step <= maxPush; step++) {
    const nx = x + step * dir;
    if (nx <= 0 || nx >= GW - 1) break;
    const ni = ROWOFF[y] + nx;
    const c = cellAtI(ni);
    if (!c) {
      for (let k = step; k >= 1; k--) {
        const fromI = ROWOFF[y] + (x + (k - 1) * dir);
        const toI   = ROWOFF[y] + (x + k * dir);
        const wc = cellAtI(fromI);
        if (wc && wc.physT === 'LIQUID') wc.updatePosition(toI);
        else break;
      }
      liq.updatePosition(ROWOFF[y] + (x + dir));
      return true;
    }
    if (c.physT !== 'LIQUID') break;
  }
  return false;
}

class Entity{
	constructor(x, y, data, type) {
		this.grounded = false;
		this.startX = x;
		this.startY = y;
		this.inWater = false;
		this.type = type;
		this.action = "idle";
		this.dir = "right";
		this.vel = [0, 0];
		this.mv = [0, 0];
		this.isAttacking = false;
		this.alive = true;
		this.showSide = "left";
		this.projectiles = [];
		this.hurt = 30;
		this.timeAlive = 0;
		this.initData(data);
		this.initCells(x, y);
	}

	initData(data) {
		if (!data) {
			console.warn(`NO data found for entity ${this.type}, using fallback`);
			data = getPlayerData();
		} else {
			const fallback = getPlayerData();
			data.image  = data.image  || fallback.image;
			data.colors = data.colors || fallback.colors;
			data.stats  = data.stats  || fallback.stats;
		}
		data.stats = { ...baseStats, ...data.stats };
		this.image  = data.image;
		this.colors = data.colors;
		this.stats  = data.stats;
		this.data = data;
		this.baseSpeed = this.data.moveSpeed || .2;
		this.speed = this.baseSpeed;
	}

	debug() { console.warn("T=" + FRAME + " [ENTITY]", this.type, "stats:", this.data.stats); }

	scaleMask(mask) {
		const h = mask.length, w = mask[0].length;
		const out = Array.from({ length: H }, () => Array(W).fill('.'));
		for (let y = 0; y < H; y++) {
			const sy = Math.floor(y * h / H);
			for (let x = 0; x < W; x++) {
			const sx = Math.floor(x * w / W);
			out[y][x] = mask[sy][sx];
			}
		}
		return out;
	}

	initCells(x, y) {
		const h = this.image.length, w = this.image[0].length;
		this.w = w;
		this.h = h;
		const mask = this.image;
		this.x = clamp(x, 0, GW - 1 - this.w);
		this.y = clamp(y, 0, GH - 1 - this.h);
		const limbs = { a:"hat", h:"head", t:"torso", g:"leftArm", d:"rightArm", l:"leftLeg", r:"rightLeg", b:"foot", i:"leftEye", I:"rightEye" };
		this.cells = [];
		for (let yy = 0; yy < this.h; yy++) {
			for (let xx = 0; xx < this.w; xx++) {
				let ch = mask[yy][xx];
				if (ch === '.') continue;
				let color = this.colors[ch];
				const cell = new Cell(this.x + xx, this.y + yy, 'ENTITY', 0, 0, Infinity);
				cell.setColor(color);
				cell.baseColor = color;
				cell.hp = r_range(60, 120);
				cell.relX = xx;
				cell.relY = yy;
				cell.ent = this;
				cell.startRelX = xx;
				cell.startRelY = yy;
				if ("ahtgdlriI".includes(ch))
					cell.limb = limbs[ch];
				else
					cell.limb = "none";
				this.cells.push(cell);
				activeCells.push(cell);
			}
		}
		this.cellsAtStart = this.cells.length;
	}


	groundCheck() {
		this.inWater = false;
		let waistLevel = this.y + Math.round(this.h / 2);
		let ll = cellAtI(ROWOFF[waistLevel] + this.x - 1, null);
		let rr = cellAtI(ROWOFF[waistLevel] + this.x + this.w + 1, null);
		if ((ll && ll.physT === 'LIQUID') || (rr && rr.physT === 'LIQUID')) {
			this.inWater = true;
			return false;
		}
		if (this.y + this.h >= GH - 1)
			return (true);
		let lc = cellAtI(ROWOFF[this.y + this.h + 1] + this.x, null);
		let rc = cellAtI(ROWOFF[this.y + this.h + 1] + this.x + this.w, null);
		return ((lc && lc.physT === 'SOLID') || (rc && rc.physT === 'SOLID'));
	}

	death() {
		for (let i = 0; i < this.cells.length; i++) {
			let cell = this.cells[i];
			cell.updT = "DYNAMIC";
		}
		this.alive = false;
		return (this.alive);
	}

	splash() {
		if (!this.inWater && (this.mv[0] || this.mv[1])) {
			let px = cellAtI(ROWOFF[this.y + this.h] + this.x - 1);
			if (px && px.physT === 'LIQUID')
				explodeRadius(Math.round(this.x + this.w / 2) * PIXELSIZE, (this.y + this.h + 1) * PIXELSIZE, 5, 2, null, "ENTITY");
		}
	}

	onRemove() {
		for (const c of this.cells)
			c.onRemove();
		const i = entities.indexOf(this, 1);
		if (i != -1)
			entities.splice(i, 1);
	}

	throwProjectiles(dir, targetX, targetY, type = this.stats.projType, force = this.stats.projForce) {
		this.dir = dir;
		const x0 = this.dir === "left" ? this.x - 1 : this.x + this.w + 1;
		const y0 = Math.abs(this.y + this.h * .7);

		let mv = [0, 0];
		if (CELL_PROPERTIES[type].physT === "GAS") {
			mv[1] = -1;
		} else {
			const dx = targetX - x0;
			const dy = targetY - y0;
			const d = Math.hypot(dx, dy);
			if (d > 0) {
			let vx = Math.round((dx / d) * force);
			let vy = Math.round((dy / d) * force);
			if (vx === 0 && dx !== 0) vx = Math.sign(dx);
			if (vy === 0 && dy !== 0) vy = Math.sign(dy);
			mv = [vx, vy];
			}
		}

		const proj = new Cell(x0, y0, type, mv[0], mv[1]);
		proj.isProjectile = true;
		this.isAttacking = 5;
	}

	updateCells() {
		for (let i = 0; i < this.cells.length; i++){
			let cell = this.cells[i];
			if (cell.hp <= 0 || ((cell.type !== "ENTITY" || cell.burning || cell.corrosionType) && cell.hp-- <= 0)) {
				cell.physT = 'DYNAMIC';
				this.cells.splice(i, 1);
				this.hurt = 5;
				continue;
			}
			if (Math.abs(cell.velX) > 1 || Math.abs(cell.velY) > 1) {
				cell.hp = 0;
			}
			cell.newX = this.x + cell.relX;
			cell.newY = this.y + cell.relY;
			cell.di = ROWOFF[cell.newY] + cell.newX;
			let other = cellAtI(cell.di, cell);
			if (!other || other.updT !== 'ALIVE')
				cell.updatePosition(cell.di);
		}
		if (this.cells.length <= 5)
			this.death();
	}

	place(x, y) {
		this.x = clamp(x, 0, GW - this.w);
		this.y = clamp(y, 0, GH - this.h);
		this.updateCells();
	}

	jump() {
		if (this.inWater && cellAtI(ROWOFF[this.y - 1] + this.x))
			return;
		this.action = "jump";
		this.mv[1] = -10;
		this.grounded = false;
	}

	updateState() {
		if (this.hurt) this.hurt--;
		if (this.isAttacking) this.isAttacking--;
		this.grounded = this.groundCheck();
		if (this.inWater) {
			// this.mv[1] += .2;
			this.grounded = false;
		}
		if (this.action === 'jump' && this.mv[1] > 0)
			this.action = 'idle';
		else if (this.grounded || this.inWater) {
			if (this.vel[1] < 0)
				this.jump();
			else if (this.grounded){
				this.action = "idle";
				this.mv[1] = 0;
			}
		}
		if (this.inWater && this.action !== "jump") {				
			if (this === PLAYER) {
				this.mv[0] *= .7;
				this.mv[1] *= .8;	
			}
			else {
				this.mv[0] *= .95;
				this.mv[1] *= .95;
			}
		}
		else
			this.vel[1] = (this.grounded ? 0 : .7);
	}

	tryMove() {
		if (!this.isAttacking && this.mv[0])
			this.dir = this.mv[0] > 0 ? "right" : "left";
		if (FRAME % (INPUT.shift ? 5 : 10) === 0)
			this.showSide = (this.showSide === "left" ? "right" : "left");
		if (this.grounded)
			this.action = "walk";
		let li = ROWOFF[this.newY + this.h - 1] + this.newX;
		let ri = li + this.w;
		let i = this.mv[0] < 0 ? li : ri;
		let wallNum = 0;
		for (let y = 0; y < this.h; y++){
			let idx = i - GW * y;
			let px = cellAtI(idx);
			if (px && px.physT === 'SOLID')
				wallNum++;
		}
		if (wallNum > Math.round(this.h / 2)) {
			this.mv[0] = 0;
			this.newX = this.x;
		}
		let cell = cellAtI(i);
		if (!cell)
			return;
		let iter = 0;
		let maxIter = Math.trunc(this.mv[0]);
		while (cell && cell.physT === 'SOLID' && ((cell.updT !== "ALIVE") && !cell.parent) && cell.type !== "ENTITY") {
			this.newY--;
			++iter;
			if (this.newY <= 0 || iter > maxIter)
				break;
			cell = cellAtI(i - GW * iter);
		}
	}

	updateMovement() {
		this.timeAlive++;
		this.mv[0] = (this.mv[0] + this.vel[0]) * (1 - this.stats.moveDrag);
		this.mv[1] = (this.mv[1] + this.vel[1]) * (1 - (this.isGrounded ? this.stats.moveDrag : 0));
		if (this.mv[1] < 0) {
			const up = cellAtI(ROWOFF[this.y - 1] + this.x + Math.round(this.w / 2));
			if (up && up.physT === 'SOLID')
				this.mv[1] = 0;
		}
		if (Math.abs(this.mv[0]) < 0.5) this.mv[0] = 0;
		if (Math.abs(this.mv[1]) < 0.5) this.mv[1] = 0;
		if (!this.mv[0] && !this.mv[1]) {
			if (this.action === 'walk')
				this.action = 'idle';
			return;
		}
		this.newX = Math.round(clamp(this.x + Math.trunc(this.mv[0]) * this.speed, 0, GW - 1 - this.w));
		this.newY = Math.round(clamp(this.y + Math.trunc(this.mv[1]) * this.speed, 0, GH - 1 - this.h));
		this.tryMove();
		this.place(this.newX, this.newY);
	}

	wander() {
		if (fdice(this.stats.dirFreq) ||
			(this.x <= 0 && this.vel[0] < 0) || (this.x >= GW - 1 && this.vel[0] > 0)) {
			this.mv[0] *= -1;
			this.dir = this.dir === 'left' ? 'right' : 'left';
		}
		else if (fdice(this.stats.moveFreq))
			this.vel[0] = (this.dir === 'left' ? -this.stats.moveSpeed : this.stats.moveSpeed);
		if (fdice(this.stats.jumpFreq))
			this.vel[1] = -5;
	}

	update() {
		if (!this.alive)
			return;
		this.splash();
		this.updateState();
		this.updateMovement();
	}

	renderHpBar(size) {
		let cutIndex = Math.round(((this.cells.length) / this.cellsAtStart) * this.w);
		let y = (this.y - 2) * PIXELSIZE;
		ctx.fillStyle = "green";
		ctx.fillRect(this.x * PIXELSIZE, y, size * cutIndex, size * 2);
		let wh = this.cellsAtStart - this.cells.length;
		if (wh) {
			ctx.fillStyle = "red";
			ctx.fillRect((this.x + cutIndex) * PIXELSIZE, y, size * (this.w - cutIndex), size * 2);
		}
	}

	render(size, borderColor = null) {
		const OFF = 1;

		const posed = [];
		const occ = new Set();

		for (let i = 0; i < this.cells.length; i++) {
			const cell = this.cells[i];
			if (!this.alive) {
				posed.push({cell, x: cell.x, y: cell.y});
				occ.add(`${cell.x},${cell.y}`);
				continue;
			}
			let relX = cell.relX;
			let relY = cell.relY;
			if (this.inWater) {
				const cx = this.w / 2;
				const cy = this.h / 2;
				const dx = relX - cx;
				const dy = relY - cy;
				let angleDeg = (this.mv[1] < 0 ? 60 : this.mv[1] > 0 ? 125 : 90);
				if (!this.mv[0]) {
					angleDeg = this.mv[1]> 0 ? 180 : 0;
				}
				const angle = angleDeg * Math.PI / 180;
				const rx = dx * Math.cos(angle) + dy * Math.sin(angle);
				const ry = -dx * Math.sin(angle) + dy * Math.cos(angle);
				relX = cx + rx;
				relY = cy + ry;
				if (this.dir === 'right')
					relX = this.w - relX;
			}
			else if (this.dir === 'left')
				relX = this.w - relX;
			let x = this.x + relX;
			let y = this.y + relY;

			if (this.action === "walk" && cell.limb.includes("Leg")) {
				if (cell.limb.includes(this.showSide)) x -= 1; else x += 1;
			}
			if ((this.showSide === "left") && (this.limb !== "leftLeg" && this.limb !== "rightLeg")) y++;
			if ((this.isAttacking) && cell.limb.includes("Arm") && cell.limb.includes("right")) y -= this.isAttacking;
			else if (this.action === 'jump' && cell.limb.includes("Arm")) y -= 4;
			if ((this.inWater || this.action === 'jump') && cell.limb.includes("Leg") && cell.limb.includes(this.showSide)) y -= 2;
			if (this.hurt) {
				const displ = this.hurt / 10;
				x += r_range(-displ, displ);
				y += r_range(-displ, displ);
			}

			posed.push({cell, x, y});
			occ.add(`${x},${y}`);
		}

		for (let i = 0; i < posed.length; i++) {
			let { cell, x, y } = posed[i];
			let di = ROWOFF[y] + x;
			cell.updatePosition(di);
			if (this.inWater) {
				ctx.fillColor = getWaterColor(y);
				ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
				x += Math.round(Math.cos((FRAME * .1) + x * 0.3) * 1);
			}
			showCell(cell, x, y, 1, size);
		}

		if (this.alive && this.cells.length < this.cellsAtStart)
			this.renderHpBar(size);
		this.vel[0] = this.vel[1] = 0;

		if (!borderColor)
			return;

		ctx.fillStyle = borderColor;
		for (let i = 0; i < posed.length; i++) {
			const {x, y} = posed[i];
			const leftEmpty  = !occ.has(`${x-1},${y}`);
			const rightEmpty = !occ.has(`${x+1},${y}`);
			const upEmpty    = !occ.has(`${x},${y-1}`);
			const downEmpty  = !occ.has(`${x},${y+1}`);

			let dx = 0, dy = 0;
			if (leftEmpty) dx = -OFF;
			else if (rightEmpty) dx = OFF;
			else if (upEmpty) dy = -OFF;
			else if (downEmpty) dy = OFF;
			else continue;

			const fx = (x + dx) * PIXELSIZE;
			const fy = (y + dy) * PIXELSIZE;
			ctx.fillRect(fx, fy, size, size);
		}
	}
}

class Mob extends Entity{
	constructor(x, y, data, type) {
		super(x, y, data, type);
	}

	update() {
		if (!this.alive)
			return;
		super.wander();
		if (PLAYER && this.stats.projType && fdice(this.stats.projFreq))
			this.throwProjectiles('left', PLAYER.x, PLAYER.y);
		super.update();
	}

	render(size) {
		super.render(size);
	}
}

class Player extends Entity{
	constructor(x, y, data) {
		super(x, y, data, "PLAYER");
	}

	updateHealth() {
		if (!this.alive)
			setTimeout(() => {
			PLAYER = null;
			confirmChoice("Try Again?", () => {
				LD.reloadLevel();
			})
		}, 500);
	}

	update() {
		this.updateHealth();
		if (!this.alive)
			return;
		this.speed = this.baseSpeed * ((INPUT.shift || this.inWater) ? 2 : 1);
		if (INPUT.keys[" "] && !this.isAttacking)
			this.throwProjectiles(MOUSE.gridX < this.x ? "left" : "right", MOUSE.gridX, MOUSE.gridY);
		this.vel = [INPUT.x, INPUT.y];
		if (isMobile && MOUSE.clickedOnPlayer)
			this.vel[0] = MOUSE.gridX < this.x ? -1 : 1;
		super.update();
	}

	render(size) {
		const borderColor = "rgba(170, 0, 255, 0.44)";
		super.render(size);
	}
}


class Door extends Entity{
	constructor(x, y, data) {
		super(x, y, data, "Door");
		for (const c of this.cells) {
			c.setColor(randomizeColor(c.baseColor, 50))
			c.baseColor = c.color;
		}
		this.hurt = 0;
	}

	update() {
		// super.update();
		// for (const c of this.cells) {
		// 	// c.relX = c.startRelX + Math.sin((FRAME * .1) + c.startRelX * 0.3) * 1;
		// 	c.relY = c.startRelY + Math.cos((FRAME * .5) + c.startRelY * 0.3) * 1;
		// }
	}

	render(size) {
		for (let i = 0; i < this.cells.length; i++) {
			const cell = this.cells[i];
			let x = this.x + cell.relX;
			let y = this.y + cell.relY;
			x += Math.cos((FRAME * .5) + x * 0.3);
			y += Math.cos((FRAME * .1) + y * 0.3);

			showCell(cell, x, y, 1, size);
		}
	}
}