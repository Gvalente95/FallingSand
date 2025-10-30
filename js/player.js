class Player{
	constructor(x, y, w, h) {
		this.grounded = false;
		this.velX = 0;
		this.velY = 0;
		this.inWater = false;
		this.action = "";
		this.dir = "right";
		this.jumpTimer = 0;
		this.isAttacking = false;
		this.alive = true;
		this.showSide = null;
		this.projectiles = [];
		this.initCells(x, y, w, h);
	}

	getMask() {
			return [
				"....aaaaaa...",
				".....hhhhh....",
				".....hhhhh....",
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
			'a': "rgba(187, 31, 31, 1)",
			'h': "rgba(177, 136, 136, 1)",
			't': "rgba(69, 67, 52, 1)",
			'g': "rgba(177, 136, 136, 1)",
			'd': "rgba(177, 136, 136, 1)",
			'l': "rgba(64, 114, 121, 1)",
			'r': "rgba(137, 114, 162, 1)",
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
				cell.relX = xx;
				cell.hp = 100;
				cell.relY = yy;
				cell.limb = limbs[ch];
				this.cells.push(cell);
				activeCells.push(cell);
			}
		}
	}

	groundCheck(inputMovement) {
		this.inWater = false;
		if (this.y + this.h >= GH - 1)
			return (true);
		let yPlus = (inputMovement[1] > 0 ? inputMovement[1] + 1 : 2);
		for (let y = 0; y < yPlus; y++){
			for (let x = 0; x < 2; x++){
				let cell = cellAtI(ROWOFF[this.y + y + this.h + 1] + this.x + (x == 0 ? 1 : this.w - 1), null);
				if (!cell) return (false);
				if (cell.physT === 'LIQUID') {
					this.inWater = true;
					return true;
				}
			}
		}
		return (true);
	}

	death() {
		for (let i = 0; i < this.cells.length; i++) {
			let cell = this.cells[i];
			cell.updT = "DYNAMIC";
		}
		this.alive = false;
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
		// launchParticules(type, x * PIXELSIZE + r_range(-2, 2), r_range(0, -3) + (PLAYER.y - 3) * PIXELSIZE, 2, BRUSHTYPES.DISC, false, diff[0], diff[1]);
	}

	updateCells() {
		for (let i = 0; i < this.cells.length; i++){
			let cell = this.cells[i];
			if ((cell.type !== "PLAYER" || cell.burning || cell.corrosionType) && cell.hp-- <= 0) {
				this.cells.splice(i, 1);
				continue;
			}
			cell.newX = this.x + cell.relX;
			cell.newY = this.y + cell.relY;
			cell.di = ROWOFF[cell.newY] + cell.newX;
			let other = cellAtI(cell.di, cell);
			if (!other)
				cell.updatePosition(cell.di);
		}
	}

	updateState() {
		this.isAttacking = INPUT.keys[" "];
		if (this.isAttacking)
			this.throwProjectiles();
		let inputMovement = [INPUT.x, INPUT.y];
		if (INPUT.keys['shift']) {
			inputMovement[0] *= 3;
			inputMovement[1] *= 3;
		}
		this.grounded = this.groundCheck(inputMovement);
		if (this.grounded && inputMovement[1] < 0)
			this.jumpTimer = 1;
		if (this.inWater && !inputMovement[1])
			this.velY = (FRAME % 4 == 0 ? -1 : 0);
		else if (this.jumpTimer) {
			this.velY = -(4 - this.jumpTimer);
			this.action = "jump";
			this.jumpTimer--;
		}
		else if (this.grounded) {
			this.action = "idle";
			this.velY = 0;
		}
		else if (FRAME % 3 === 0)
			this.velY += GRAVITY > 0 ? 1 : -1;
		return inputMovement;
	}

	updateMovement(mv) {
		let newX = clamp(this.x + mv[0], 0, GW - 1 - this.w);
		let newY = clamp(this.y + mv[1] + this.velY, 0, GH - 1 - this.h);
		if (mv[0]) {
			if (!this.isAttacking)
				this.dir = mv[0] > 0 ? "right" : "left";
			if (FRAME % (INPUT.shift ? 5 : 10) === 0)
				this.showSide = (this.showSide === "left" ? "right" : "left");
			if (!this.jumpTimer)
				this.action = "walk";
			let li = ROWOFF[newY + this.h - 1] + newX;
			let ri = li + this.w;
			let i = mv[0] < 0 ? li : ri;
			let cell = cellAtI(i);
			let iter = 0;
			let maxIter = mv[0];
			while (cell && cell.physT === 'SOLID' && (cell.type !== "TREE" || !cell.parent) && cell.type !== "PLAYER") {
				newY--;
				++iter;
				if (newY <= 0 || iter > maxIter)
					break;
				cell = cellAtI(i - GW * iter);
			}
		}
		else
			this.showSide = null;
		this.x = newX;
		this.y = newY;
		this.updateCells();
	}

	update() {
		if (!this.alive)
			return;
		let mv = this.updateState();
		this.updateMovement(mv);
	}

	render(size) {
		for (let i = 0; i < this.cells.length; i++){
			let cell = this.cells[i];
			if (!this.alive) {
				showCell(cell, cell.x, cell.y, 1, size);
				continue;
			}
			if (this.action === "walk" && cell.limb.includes("Leg") && cell.limb.includes(this.showSide))
				continue;
			let x = this.x + (this.dir === "right" ? cell.relX : this.w - cell.relX);
			let y = this.y + cell.relY;
			if ((this.showSide === "left") &&
				(this.limb !== "leftLeg" && this.limb !== "rightLeg")) {
				y++;
			}
			if ((this.isAttacking || MOUSE.pressed) && cell.limb.includes("Arm") && cell.limb.includes("right")) {
				y -= Math.round(this.h / 2);
			}
			showCell(cell, x, y, 1, size)
		}
	}
}
