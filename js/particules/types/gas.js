
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

p.updateBolt = function (newX, newY) {
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