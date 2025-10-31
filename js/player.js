class Player{
	constructor(x, y) {
		this.grounded = false;
		this.startX = x;
		this.startY = y;
		this.inWater = false;
		this.action = "";
		this.dir = "right";
		this.vel = [0, 0];
		this.mv = [0, 0];
		this.speed = .2;
		this.baseSpeed = this.speed;
		this.isAttacking = false;
		this.alive = true;
		this.showSide = null;
		this.projectiles = [];
		this.hurt = 30;
		this.timeAlive = 0;
		this.initCells(x, y, 8, 15);
	}

	getMask() {
			return [
				"....aaaaaaa..",
				"....ahhhhha...",
				"....ahhhhha...",
				"...tttttttt...",
				"..ttttttttdd..",
				".ggtttttttddd.",
				".ggtttttttddd.",
				".ggtttttttddd.",
				".ggttttttt....",
				"...ttttttt....",
				"...llllrrr....",
				"...llllrrr....",
				"...llllrrr....",
				"...llllrrr....",
				"...llllrrr...."
			];
	}

	scaleMask(mask, W, H) {
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

	initCells(x, y, w, h) {
		this.w = w;
		this.h = h;
		this.x = clamp(x, 0, GW - 1 - this.w);
		this.y = clamp(y, 0, GH - 1 - this.h);
		const limbs = {
			'a': "hat", 
			'h': "head",
			't': "torso",
			'g': "leftArm",
			'd': "rightArm",
			'l': "leftLeg",
			'r': "rightLeg",
			'b': "foot",
		}
		let colorMap = {
			'a': "rgba(78, 54, 50, 1)",
			'h': "rgba(177, 136, 136, 1)",
			't': "rgba(69, 67, 52, 1)",
			'g': "rgba(177, 136, 136, 1)",
			'd': "rgba(177, 136, 136, 1)",
			'l': "rgba(64, 114, 121, 1)",
			'r': "rgba(83, 96, 139, 1)",
			'b': "rgba(206, 188, 49, 1)",
		}
		const mask = this.scaleMask(this.getMask(), this.w, this.h);
		this.cells = [];
		for (let yy = 0; yy < this.h; yy++) {
			for (let xx = 0; xx < this.w; xx++) {
				let ch = mask[yy][xx];
				if (ch === '.') continue;
				let color = colorMap[ch];
				const cell = new Cell(this.x + xx, this.y + yy, 'PLAYER', 0, 0, Infinity);
				cell.setColor(color);
				cell.baseColor = color;
				cell.relX = xx;
				cell.hp = r_range(60, 120);
				cell.relY = yy;
				cell.limb = limbs[ch];
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
		setTimeout(() => {
			PLAYER = null;
			confirmChoice("Try Again?", () => {
				LD.reloadLevel();
			})
		}, 500);
	}

	throwProjectiles() {
		this.dir = MOUSE.gridX < this.x ? "left" : "right";
		if (FRAME % 10 !== 0)
			return;
		let x = this.dir === "left" ? this.x : this.x + this.w - 1;
		let diff = [0, 0];
		let type = "DYNAMITE";
		if (CELL_PROPERTIES[type].physT === 'GAS')
			diff[1] = -1;
		else
		{
			diff[0] = clamp(Math.round((MOUSE.gridX - this.x) * .2), -10, 10);
			diff[1] = clamp(Math.round((MOUSE.gridY - this.y) * .4), -20, 20);
		}
		new Cell(x, this.y - 2, type, diff[0], diff[1]);
		// launchCells(type, x * PIXELSIZE + r_range(-2, 2), r_range(0, -3) + (PLAYER.y - 3) * PIXELSIZE, 2, BRUSHTYPES.DISC, false, diff[0], diff[1]);
	}

	place(x, y) {
		this.x = clamp(x, 0, GW - this.w);
		this.y = clamp(y, 0, GH - this.h);
		this.updateCells();
	}

	updateCells() {
		for (let i = 0; i < this.cells.length; i++){
			let cell = this.cells[i];
			if ((cell.type !== "PLAYER" || cell.burning || cell.corrosionType) && cell.hp-- <= 0) {
				this.cells.splice(i, 1);
				this.hurt = 5;
				continue;
			}
			cell.newX = this.x + cell.relX;
			cell.newY = this.y + cell.relY;
			cell.di = ROWOFF[cell.newY] + cell.newX;
			let other = cellAtI(cell.di, cell);
			if (!other || other.updT !== 'ALIVE')
				cell.updatePosition(cell.di);
		}
		if (this.cells.length < this.cellsAtStart / 2)
			this.death();
	}

	updateState() {
		if (this.hurt) this.hurt--;
		this.isAttacking = INPUT.keys[" "];
		if (this.isAttacking)
			this.throwProjectiles();
		this.vel = [INPUT.x, INPUT.y];
		if (isMobile && MOUSE.clickedOnPlayer)
			this.vel[0] = MOUSE.gridX < this.x ? -1 : 1;
		this.grounded = this.groundCheck();
		if (this.inWater) {
			this.mv[1] += .2;
			this.grounded = false;
		}
		else if (this.grounded || this.inWater) {
			if (this.vel[1] < 0) {
				this.action = "jump";
				this.mv[1] = -10;
				this.grounded = false;
			}
			else if (this.grounded){
				this.action = "idle";
				this.mv[1] = 0;
			}
		}
		if (this.inWater && this.action !== "jump") {
			this.mv[0] *= .7;
			this.mv[1] *= .7;
		}
		else
			this.vel[1] = (this.grounded ? 0 : .7);
	}

	updateMovement() {
		this.timeAlive++;
		this.speed = this.baseSpeed * (INPUT.shift ? 2 : 1);
		this.mv[0] = (this.mv[0] + this.vel[0]) * .85;
		this.mv[1] = (this.mv[1] + this.vel[1]) * (this.isGrounded ? .85 : 1);
		let newX = Math.round(clamp(this.x + Math.trunc(this.mv[0]) * this.speed, 0, GW - 1 - this.w));
		let newY = Math.round(clamp(this.y + Math.trunc(this.mv[1]) * this.speed, 0, GH - 1 - this.h));
		if (Math.abs(this.mv[0]) >= 2) {
			if (!this.isAttacking)
				this.dir = this.mv[0] > 0 ? "right" : "left";
			if (FRAME % (INPUT.shift ? 5 : 10) === 0)
				this.showSide = (this.showSide === "left" ? "right" : "left");
			if (this.grounded)
				this.action = "walk";
			let li = ROWOFF[newY + this.h - 1] + newX;
			let ri = li + this.w;
			let i = this.mv[0] < 0 ? li : ri;
			let cell = cellAtI(i);
			let iter = 0;
			let maxIter = Math.trunc(this.mv[0]);
			while (cell && cell.physT === 'SOLID' && ((cell.updT !== "ALIVE") && !cell.parent) && cell.type !== "PLAYER") {
				newY--;
				++iter;
				if (newY <= 0 || iter > maxIter)
					break;
				cell = cellAtI(i - GW * iter);
			}
		}
		else if (this.action === 'walk'){
			this.action = 'idle';
			this.showSide = null;
		}
		this.place(newX, newY);
	}

	update() {
		if (!this.alive)
			return;
		this.updateState();
		this.updateMovement();
	}

	render(size) {
		for (let i = 0; i < this.cells.length; i++){
			let cell = this.cells[i];
			if (!this.alive) {
				showCell(cell, cell.x, cell.y, 1, size);
				continue;
			}
			let x = this.x + (this.dir === "right" ? cell.relX : this.w - cell.relX);
			let y = this.y + cell.relY;
			if (this.action === "walk" && cell.limb.includes("Leg")) {
				if (cell.limb.includes(this.showSide))
					x -= 1;
				else x += 1;
			}
			if ((this.showSide === "left") &&
				(this.limb !== "leftLeg" && this.limb !== "rightLeg")) {
				y++;
			}
			if ((this.isAttacking || MOUSE.pressed) && cell.limb.includes("Arm") && cell.limb.includes("right")) {
				y -= Math.round(this.h / 2);
			}
			else if (this.action === 'jump' && cell.limb.includes("Arm"))
				y -= 4;
			if ((this.inWater || this.action === 'jump') && cell.limb.includes("Leg") && cell.limb.includes(this.showSide)) {
				y -= 2;
			}
			if (this.hurt)
			{
				let displ = (this.hurt) / 10;
				x += r_range(-displ, displ);
				y += r_range(-displ, displ);
			}
			showCell(cell, x, y, 1, size)
		}
	}
}
