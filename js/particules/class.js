let id = 0;
class Particle{
	constructor(x, y, type, velX = f_range(-.3, .3), velY = (PARTICLE_PROPERTIES[type].solType == 'GAS' ? -1 : f_range(0, 3)), lifeTime = PARTICLE_PROPERTIES[type].lifeTime * f_range(.5, 1.5))
	{
		if (isOutOfBorder(x, y)) return (this.toRemove(), 0);
		this.properties = PARTICLE_PROPERTIES[type];
		let pxAtPos = getPxlAtPos(x, y, this);
		if (pxAtPos)
		{
			if (type == pxAtPos.type) { this.toRemove(); return; }
			else if (this.properties.solType == 'GAS' && type != 'STEAM')
			{
				if (pxAtPos.type == 'WATER' && type == 'FIRE') pxAtPos.setType('STEAM');
				else if (type != pxAtPos.type && shouldBurnParticle(type, pxAtPos)) pxAtPos.setToFire();
				this.toRemove();
				return;
			}
			else pxAtPos.toRemove();
		}
		this.ground = null;
		this.wetType = null;
		this.parent = null;
		this.hasTouchedSurface = false;
		this.hasTouchedBorder = false;
		this.id = id++;
		this.lifeTime = lifeTime;
		this.startTime = now;
		this.timeAlive = 0;
		this.growSpeed = r_range(1, 3);
		this.wet = 0;
		this.frozen = 0;
		this.burning = 0;
		this.setVel(velX, velY);
		this.setType(type);
		this.x = clamp(x, 0, GRIDW);
		this.y = clamp(y, 0, GRIDH);
		this.newX = x;
		this.newY = y;
		this.active = true;
		grid[this.x][this.y] = this;
		activeParticles.push(this);
	}
	updateVelocity()
	{
		if (this.type == 'BLOB') return;
		let isGrounded = this.ground && (this.ground.solType == 'SOLID') && this.ground.velY == 0;
		if (this.type == 'WATER' && this.ground && !getPxlAtPos(this.x, this.y - 1) && dice(200) && this.ground.type == this.type)
			this.setType('BUBBLE');
		if (this.ground && this.ground.solType == 'LIQUID' && this.solType == 'SOLID')
		{
			this.velY *= .7;
			let minV = (4 - this.ground.density) * .5;
			if (this.velY < minV) this.velY = minV;
			if (this.velY < .3 && dice(5)) this.velY = .3;
		}
		else if (isGrounded && this.solType != 'GAS')
		{
			this.velY = (this.ground.type == 'WOOD' ? 1 : 0);
			this.velX *= (1 - XDRAG);
			if (Math.abs(this.velX) < .01) this.velX = 0;
		}
		else if (this.solType != 'GAS') this.velY += GRAVITY;
		else if ((this.type == 'STEAM' || this.type == 'CLOUD') || this.id % 5 == 0)
			this.velX = getSin(now * .002, 5, .9, this.id * .3);
	}

	updateMovement(){
		let newX = this.x + (this.velX * SIMSPEED);
		let newY = this.y + (this.velY * SIMSPEED);
		let xDiff = newX - this.x, yDiff = newY - this.y;
		let steps = Math.ceil(Math.max(Math.abs(xDiff), Math.abs(yDiff)));
		let xStep = steps > 0 ? xDiff / steps : 0;
		let yStep = steps > 0 ? yDiff / steps : 0;
		let curX = this.x, curY = this.y;
		let lastValidx = curX, lastValidy = curY;
		if (this.type === 'BLOB') return (this.newX = Math.round(newX), this.newY = Math.round(newY), 0);
		for (let i = 0; i < steps; i++) {
			curX += xStep; curY += yStep;
			let realX = Math.round(curX); let realY = Math.round(curY);
			if (isOutOfBorder(realX, realY)) { curX = lastValidx; curY = lastValidy; break; }
			let pxAtPos = getPxlAtPos(realX, realY, this);
			if (!pxAtPos){ lastValidx = curX; lastValidy = curY; continue; }
			if (this.douse) pxAtPos.setWet(100, this.type);
			if (shouldBurn(this, pxAtPos)) {pxAtPos.setToFire();}
			if (shouldBurn(pxAtPos, this)) this.setToFire();
			else if (this.solType === 'LIQUID' && pxAtPos.solType === 'LIQUID') {
				const a = this.type, b = pxAtPos.type;
				if ((a === 'LAVA' && b === 'WATER') || (a === 'WATER' && b === 'LAVA')) {
					if (a === 'LAVA') (dice(5) ? this.setType('COAL') : pxAtPos.setType('STEAM'));
					else this.setType('STEAM');
					curX -= xStep; curY -= yStep; break;
				}
				if (pxAtPos.density < this.density) { this.swap(pxAtPos); curX = this.x; curY = this.y; break; }
			}
			else if (this.solType == 'SOLID' && pxAtPos.solType == 'LIQUID')
			{
				if (i != steps - 1) continue;
				this.swap(pxAtPos);
				curX = this.x; curY = this.y;
				break;
			}
			else if ((this.type == 'ACID') && pxAtPos.type != this.type && dice(pxAtPos.density))
			{
				pxAtPos.setType('BUBBLE');
				curX -= xStep; curY -= yStep;
				break;
			}
			let leftR = dice(2) ? -1 : 1;
			let px = getPxlAtPos(realX + leftR, realY, this);
			if (!px && (realX + leftR >= 0 && realX + leftR < GRIDW)) curX += leftR;
			else if (!getPxlAtPos(realX - leftR, realY, this) && (realX - leftR >= 0 && realX - leftR < GRIDW)) curX -= leftR;
			else {curX -= xStep;curY -= yStep; break;}
		}
		this.newX = Math.round(curX); this.newY = Math.round(curY);
	}
	updatePosition(newX, newY, nullifyThis = true, checkIfNull = true)
	{
		if (!this.active) return;
		let px = getPxlAtPos(newX, newY, this);
		if (this.solType === 'GAS' && px) return (this.toRemove(), 0);
		const clampedX = Math.floor(clamp(newX, 0, GRIDW - 1));
		const clampedY = Math.floor(clamp(newY, 0, GRIDH - 1));
		if (clampedX != newX || clampedY != newY) this.velX = 0;
		if (nullifyThis)
		{
			if (clampedX == this.x && clampedY == this.y) return (0);
			grid[this.x][this.y] = null;
		}
		this.x = clampedX; this.y = clampedY;
		grid[this.x][this.y] = this;
		return (1);
	}
	updateLifeTime(){
		this.timeAlive = now - this.startTime;
		if (this.timeAlive > this.lifeTime)
		{
			if (this.type == 'MAGMA') return;
			if (this.solType == 'SOLID') {
				let y = this.y - 1;
				let p = getPxlAtPos(this.x, y);
				while (p && p.updType == 'DYNAMIC')
				{
					grid[p.x][p.y] = null;
					grid[p.x][++p.y] = p;
					p = getPxlAtPos(this.x, --y);
				}
			}
			return (this.toRemove(), 0);
		}
	}
	updateCloud(){
		this.velX += this.flowDir * .1;
		let newX = this.x + this.velX;
		let newY = this.y;
		let px = getPxlAtPos(newX, newY, this);
		if (px && px.type != this.type) { this.swap(px); return; }
		if (isOutOfBorder(newX, newY)) { this.toRemove(); return; }
		this.updatePosition(newX, newY, this);
	}
	updateBlob(curX, curY) {
		if (this.parent || (time % (this.growSpeed)) != 0) return;
		let inWater = false;
		const px = getPxlAtPos(curX, curY, this);
		if (px) {
			if (px.type == 'WATER' || px.type == 'BLOB') { inWater = true; px.toRemove();}
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
			if (isStuck) {
				// if (this.timeAlive > 1500) this.parent = rpx[0];
				return (this.setColor());
			}
			else if (this.color != "rgba(133, 190, 154, 1)") {
				this.setColor("rgba(133, 190, 154, 1)");
				if (this.timeAlive > 6000) this.toRemove();
			}
		}
	}
	updateState()
	{
		if (this.frozen)
		{
			this.velX = 0;
			this.velY = 0;
			if (time % 10 == 0 && --this.frozen <= 0) this.setColor();
		}
		if (this.wet)
		{
			if (this.burning) { if (this.wetType == 'OIL') this.wet = 0; else this.stopFire();}
			if (time % 10 == 0 && --this.wet <= 0) this.setColor();
			else if (this.wet > 80)
			{
				let depth = 2;
				for (let x = -depth; x < depth; x++)
				for (let y = -depth; y < depth; y++)
				{
					if (x == 0 && y == 0) continue;
					if (isOutOfBorder(this.x + x, this.y + y)) continue;
					let px = getPxlAtPos(this.x + x, this.y + y, this);
					if (px) px.setWet(this.wet - 10, this.wetType);
				}
			}
		}
		if (this.burning)
		{
			if (--this.burning <= 0)
			{
				if (this.type == 'OIL') this.lifeTime = 0;
				else if (this.type == 'SAND' && dice(20)) this.setType('GLASS');
				else this.setType('COAL')
				this.burning = 0;
			}
			else if (dice(10) && !getPxlAtPos(this.x, this.y - 1)) new Particle(this.x, this.y - 1, 'FIRE');
			let depth = 2;
			for (let x = -depth; x < depth; x++)
				for (let y = -depth; y < depth; y++)
				{
					if (x == 0 && y == 0) continue;
					if (isOutOfBorder(this.x + x, this.y + y)) continue;
					let px = getPxlAtPos(this.x + x, this.y + y, this);
					if (px && !px.burning && shouldBurnParticle('FIRE', px)) px.setToFire();
					if (!px && dice(30)) new Particle(this.x + x, this.y + y, 'SMOKE');
				}
		}
	}
	updateLightning() {
		
	}

	updateType() {
		if (this.type === 'WOOD') return;
		if (this.type == 'CLOUD') return this.updateCloud();
		else if (this.type == 'STEAM' && this.y < 50 && dice(5))
			{ launchParticules('CLOUD', this.x * PIXELSIZE, this.y * PIXELSIZE, 10, true); this.toRemove(); }
		if (this.solType != 'STATIC') {
			this.ground = getPxlAtPos(this.x, this.y + (this.solType == 'GAS' ? -1 : 1), this);
			this.updateVelocity();
			if (this.velX || this.velY) this.updateMovement();
			if (this.solType == 'LIQUID') this.updateLiquid(this.newX, this.newY);
		}
		if (this.type == 'TORCH' && dice(10))
			new Particle(this.x, this.y - 1, 'FIRE');
		if (this.type == 'FIRE' || this.type === 'TORCH') this.FireEffect(this.newX, this.newY);
		else if (this.type == 'MAGMA') this.MagmaEffect(this.newX, this.newY);
		else if (this.type == 'LAVA') this.LavaEffect(this.newX, this.newY);
		else if (this.type == 'BLOB') this.updateBlob(this.newX, this.newY);
		else if (this.solType != 'LIQUID') this.updatePosition(this.newX, this.newY);
	}
	update() {
		if (!this.active) return;
		this.updateState();
		this.updateLifeTime();
		this.updateType();
	}

	toRemove(){
		this.x = -1; this.y = -1; this.active = false;
		destroyedParticles.push(this);
	}
	onRemove(){
		let index = activeParticles.indexOf(this);
		if (index != -1) activeParticles.splice(index, 1);
		if (!isOutOfBorder(this.x, this.y) && grid[this.x][this.y] == this)
			grid[this.x][this.y] = null;
	}
};
const p = Particle.prototype;






class ParticleEmitter{
	constructor(x, y, type)
	{
		this.x = x;
		this.y = y;
		this.type = type;
		this.radius = BRUSHSIZE;
	}

	update()
	{
		if ((KEYS['x'] || KEYS['Backspace']) && (Math.abs(MOUSEX - this.x) < PIXELSIZE * 20 && Math.abs(MOUSEY - this.y) < PIXELSIZE * 20))
			this.onRemove();
		else launchParticules(this.type, this.x, this.y, this.radius, true, false);
	}

	onRemove()
	{
		let index = particleEmitters.indexOf(this);
		if (index != -1) particleEmitters.splice(index, 1);
		for (const key in this) this[key] = null;
	}
}

function spawnEmitterAtMouse() {
	particleEmitters.push(new ParticleEmitter(MOUSEX, MOUSEY, particleKeys[TYPEINDEX]));	
}
