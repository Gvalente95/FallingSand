p.updateMovement = function () {
	if (this.type === 'ANT' && this.hasTouchedBorder && !this.inWater) return;
	if (this.type === 'ALIEN' || (this.type === 'FISH' && this.inWater)) {
		this.newX = Math.round(this.x + this.velX);
		this.newY = Math.round(this.y + this.velY);
		return;
	}
	let k = SIMSPEED * dt;
	if (this.physT == 'GAS') k = 1;

	let newX = this.x + this.velX * k;
	let newY = this.y + this.velY * k;

	const xDiff = newX - this.x;
	const yDiff = newY - this.y;
	let steps = Math.ceil(Math.max(Math.abs(xDiff), Math.abs(yDiff)));
	const xStep = steps > 0 ? xDiff / steps : 0;
	const yStep = steps > 0 ? yDiff / steps : 0;

	let curX = this.x, curY = this.y;
	let lastX = curX, lastY = curY;
	const side = rdir();

	for (let i = 0; i < steps; i++) {
		curX += xStep; curY += yStep;
		const realX = Math.round(curX), realY = Math.round(curY);
		if (realX < 0 || realX >= GW || realY < 0 || realY >= GH) { curX = lastX; curY = lastY; break; }

		const ii = realY * GW + realX;
		let hit = grid1[ii];
		if (!(hit && hit !== this && hit.active)) { lastX = curX; lastY = curY; continue; }

		if (hit.physT === 'STEAM' || hit.physT === 'CLOUD') continue;
		if (this.physT === 'FISH' && hit.physT === 'LIQUID') continue;
		if (this.type === 'ANT' && hit.physT === 'LIQUID' && this.inWater > 100) continue;
		if (this.douse && hit.type !== 'FISH') { if (hit.brnpwr) this.setType('STEAM'); else hit.setWet(100, this.type === 'BUBBLE' ? 'WATER' : this.type); }
		if (shouldBurn(this, hit)) { hit.setToFire(this.type); }
		if (shouldBurn(hit, this)) { this.setToFire(this.type); }
		else if (this.physT === 'GAS' && hit.physT === 'LIQUID' && hit.y < this.y) {
			this.swap(hit); curX = this.x; curY = this.y; break;
		}
		else if (this.physT === 'LIQUID' && hit.physT === 'LIQUID') {
			const a = this.type, b = hit.type;
			if ((a === 'LAVA' && b === 'WATER') || (a === 'WATER' && b === 'LAVA')) {
				if (a === 'LAVA') (dice(5) ? this.setType('COAL') : hit.setType('STEAM'));
				else this.setType('STEAM');
				curX -= xStep; curY -= yStep; break;
			}
			if (hit.dns < this.dns) { this.swap(hit); curX = this.x; curY = this.y; break; }
		}
		else if (this.physT === 'SOLID' && hit.physT === 'LIQUID') {
			if (i !== steps - 1) { lastX = curX; lastY = curY; continue; }
			this.timeInWater++;
			this.inWater = true;
			if (this.type != 'ICE' || this.timeInWater < 10) {
				this.swap(hit); curX = this.x; curY = this.y; break;
			}
			else if (this.type === 'ICE') { this.velY = this.velX = 0; }
		}
		const lx = realX + side;
		if (lx >= 0 && lx < GW) {
			const s = grid1[realY * GW + lx];
			if (!s) { curX += side; continue; }
		}
		const rx = realX - side;
		if (rx >= 0 && rx < GW) {
			const s2 = grid1[realY * GW + rx];
			if (!s2) { curX -= side; continue; }
		}
		curX -= xStep; curY -= yStep; break;
	}

	this.newX = Math.round(curX);
	this.newY = Math.round(curY);
};



p.updateStepMovement = function() {
  if (this.type === 'ANT' && this.hasTouchedBorder && !this.inWater) return;

  if (this.type === 'ALIEN' || (this.type === 'FISH' && this.inWater)) {
    // still cap to 1 cell per frame if you want uniformity
    const sx = Math.max(-1, Math.min(1, Math.trunc(this.velX)));
    const sy = Math.max(-1, Math.min(1, Math.trunc(this.velY)));
    this.newX = this.x + sx;
    this.newY = this.y + sy;
    return;
  }

  this.newX = this.x;
  this.newY = this.y;

  const stepX = Math.max(-1, Math.min(1, Math.trunc(this.velX)));
  const stepY = Math.max(-1, Math.min(1, Math.trunc(this.velY)));

  const nextX = this.x + stepX;
  const nextY = this.y + stepY;

  if (nextX < 0 || nextX >= GW || nextY < 0 || nextY >= GH) return;

  const ii = ROWOFF[nextY] + nextX;            // FIX: y*GW + x
  const hit = grid1[ii];

  if (!hit || hit === this || !hit.active) {
    this.newX = nextX; this.newY = nextY;
    return;
  }

  if (hit.physT === 'STEAM' || hit.physT === 'CLOUD') {
    this.newX = nextX; this.newY = nextY; return;
  } else if (this.physT === 'FISH' && hit.physT === 'LIQUID') {
    this.newX = nextX; this.newY = nextY; return;
  } else if (this.type === 'ANT' && hit.physT === 'LIQUID' && this.inWater > 100) {
    this.newX = nextX; this.newY = nextY; return;
  }

  if (this.douse && hit.type !== 'FISH') {
    if (hit.brnpwr) this.setType('STEAM');
    else hit.setWet(100, this.type === 'BUBBLE' ? 'WATER' : this.type);
  }

  if (shouldBurn(this, hit)) hit.setToFire(this.type);
  if (shouldBurn(hit, this)) this.setToFire(this.type);
  else if (this.physT === 'GAS' && hit.physT === 'LIQUID' && hit.y < this.y) {
    this.swap(hit); this.newX = this.x; this.newY = this.y; return;
  }
  else if (this.physT === 'LIQUID' && hit.physT === 'LIQUID') {
    const a = this.type, b = hit.type;
    if ((a === 'LAVA' && b === 'WATER') || (a === 'WATER' && b === 'LAVA')) {
      if (a === 'LAVA') (dice(5) ? this.setType('COAL') : hit.setType('STEAM'));
      else this.setType('STEAM');
      return;
    }
    if (hit.dns < this.dns) { this.swap(hit); this.newX = this.x; this.newY = this.y; return; }
  }
  else if (this.physT === 'SOLID' && hit.physT === 'LIQUID') {
    this.timeInWater++; this.inWater = true;
    if (this.type != 'ICE' || this.timeInWater < 10) {
      this.swap(hit); this.newX = this.x; this.newY = this.y; return;
    } else if (this.type === 'ICE') { this.velY = 0; this.velX = 0; }
  }

  const side = rdir();

  const lx = nextX + side;
  if (lx >= 0 && lx < GW) {
    const s = grid1[ROWOFF[nextY] + lx];       // FIX: index
    if (!s) { this.newX = nextX - 1; this.newY = nextY; return; }
  }

  const rx = nextX - side;
  if (rx >= 0 && rx < GW) {
    const s2 = grid1[ROWOFF[nextY] + rx];      // FIX: index
    if (!s2) { this.newX = nextX + 1; this.newY = nextY; return; }
  }

  this.newX = nextX; this.newY = nextY;
};
