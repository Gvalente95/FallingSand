p.updateMovement = function() {
	if (this.type === 'ANT' && this.hasTouchedBorder && !this.inWater) return;
	if (this.type === 'PLANT' || (this.type === 'FISH' && this.inWater)) {
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
	const GW = GRIDW, GH = GRIDH;
	const side = rdir();

	for (let i = 0; i < steps; i++) {
		curX += xStep; curY += yStep;
		const realX = Math.round(curX), realY = Math.round(curY);

		if (realX < 0 || realX >= GW || realY < 0 || realY >= GH) { curX = lastX; curY = lastY; break; }

		const hit = pxAtP(realX, realY, this);
		if (!hit) { lastX = curX; lastY = curY; continue; }
		if (this.physT === 'FISH' && hit.physT === 'LIQUID') continue;
		if (this.type === 'ANT' && hit.physT === 'LIQUID' && this.inWater > 100) continue;
		if (this.douse && hit.type !== 'FISH') { if (hit.brnpwr) this.setType('STEAM'); else hit.setWet(100, this.type); }
		if (shouldBurn(this, hit)) { hit.setToFire(); }
		if (shouldBurn(hit, this)) this.setToFire();
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
			if (i !== steps - 1) continue;
			this.timeInWater++;
			this.inWater = true;
			if (this.type != 'ICE' || this.timeInWater < 10) {
				this.swap(hit); curX = this.x; curY = this.y; break;
			}
			else if (this.type === 'ICE') this.velY = this.velX = 0;
		}
		const lx = realX + side;
		if (lx >= 0 && lx < GW) {
		const s = pxAtP(lx, realY, this);
		if (!s) { curX += side; continue; }
		}
		const rx = realX - side;
		if (rx >= 0 && rx < GW && !pxAtP(rx, realY, this)) { curX -= side; continue; }

		curX -= xStep; curY -= yStep; break;
	}
	this.newX = Math.round(curX);
	this.newY = Math.round(curY);
}