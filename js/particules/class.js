let id = 0;
class Particle{
	constructor(x, y, type, velX = f_range(-.3, .3), velY = (PARTICLE_PROPERTIES[type].physT == 'GAS' ? -1 : f_range(0, 3)), lt = PARTICLE_PROPERTIES[type].lt * f_range(.5, 1.5), color = null)
	{
		if (isOutOfBorder(x, y)) return (this.toRemove(), 0);
		this.properties = PARTICLE_PROPERTIES[type];
		let pxAtPos = pxAtP(x, y, this);
		if (pxAtPos)
		{
			if (type == pxAtPos.type) { this.toRemove(); return; }
			else if (this.properties.physT == 'GAS' && type != 'STEAM')
			{
				if (pxAtPos.physT == 'WATER' && type == 'FIRE') {
					pxAtPos.replace('FIRE');
				}
				else if (type != pxAtPos.type && shouldBurnParticle(type, pxAtPos)) pxAtPos.setToFire();
				return (this.toRemove(), 0);
			}
			else pxAtPos.toRemove();
		}
		this.ground = null;
		this.wetType = null;
		this.parent = null;
		this.childrens = [];
		this.hasTouchedSurface = false;
		this.hasTouchedBorder = false;
		this.id = id++;
		this.lt = lt;
		this.startTime = now;
		this.timeAlive = 0;
		this.growSpeed = r_range(1, 3);
		this.wet = 0;
		this.warm = 0;
		this.frozen = 0;
		this.prvP = [];
		this.fseed = f_range(.1, 1);
		this.burning = 0;
		this.setVel(velX, velY);
		this.setType(type);
		if (color) this.setColor(color);
		this.x = clamp(x, 0, GRIDW);
		this.y = clamp(y, 0, GRIDH);
		this.newX = x;
		this.newY = y;
		this.active = true;
		this.prvP.push([this.x, this.y, this.velX, this.velY]);
		grid[this.x][this.y] = this;
		activeParticles.push(this);
	}
	updateVelocity()
	{
		if (this.type == 'ANT' && this.hasTouchedBorder) { return;}
		if (this.type == 'FISH' && this.inWater) return;
		if (this.physT == 'STATIC') return;
		let isGrounded = this.ground && (this.ground.physT == 'SOLID') && this.ground.velY == 0;
		if (this.type == 'WATER' && this.ground && !pxAtP(this.x, this.y - 1) && dice(200) && this.ground.type == this.type)
			this.setType('BUBBLE');
		if (this.ground && this.ground.physT == 'LIQUID' && this.physT == 'SOLID')
		{
			this.velY *= .7;
			let minV = (4 - this.ground.dns) * .5;
			if (this.velY < minV) this.velY = minV;
			if (this.velY < .3 && dice(5)) this.velY = .3;
		}
		else if (isGrounded && this.physT != 'GAS' && this.updT != 'ALIVE')
		{
			this.velY = (this.ground.type == 'WOOD' ? 1 : 0);
			this.velX *= (1 - XDRAG);
			if (Math.abs(this.velX) < .01) this.velX = 0;
		}
		else if (this.physT != 'GAS') this.velY += GRAVITY;
		else if ((this.type == 'STEAM' || this.type == 'CLOUD') || this.id % 5 == 0)
			this.velX = getSin(now * .002, 5, .9, this.id * .3);
	}

	updateMovement() {
		if (this.type == 'ANT' && this.hasTouchedBorder) return;
		if (this.type == 'FISH' && this.inWater) return;
		let newX = this.x + (this.velX * SIMSPEED * (dt));
		let newY = this.y + (this.velY * SIMSPEED * (dt));
		let xDiff = newX - this.x, yDiff = newY - this.y;
		let steps = Math.ceil(Math.max(Math.abs(xDiff), Math.abs(yDiff)));
		let xStep = steps > 0 ? xDiff / steps : 0;
		let yStep = steps > 0 ? yDiff / steps : 0;
		let curX = this.x, curY = this.y;
		let lastValidx = curX, lastValidy = curY;
		if (this.type === 'PLANT' || (this.type == 'FISH' && this.inWater)) return (this.newX = Math.round(newX), this.newY = Math.round(newY), 0);
		for (let i = 0; i < steps; i++) {
			curX += xStep; curY += yStep;
			let realX = Math.round(curX); let realY = Math.round(curY);
			if (isOutOfBorder(realX, realY)) { curX = lastValidx; curY = lastValidy; break; }
			let pxAtPos = pxAtP(realX, realY, this);
			if (!pxAtPos){ lastValidx = curX; lastValidy = curY; continue; }
			if (this.douse) pxAtPos.setWet(100, this.type);
			if (shouldBurn(this, pxAtPos)) {pxAtPos.setToFire();}
			if (shouldBurn(pxAtPos, this)) this.setToFire();
			else if (this.physT === 'GAS' && pxAtPos.physT === 'LIQUID' && pxAtPos.y < this.y) {
				this.swap(pxAtPos); curX = this.x; curY = this.y; break;
			}
			else if (this.physT === 'LIQUID' && pxAtPos.physT === 'LIQUID') {
				const a = this.type, b = pxAtPos.type;
				if ((a === 'LAVA' && b === 'WATER') || (a === 'WATER' && b === 'LAVA')) {
					if (a === 'LAVA') (dice(5) ? this.setType('COAL') : pxAtPos.setType('STEAM'));
					else this.setType('STEAM');
					curX -= xStep; curY -= yStep; break;
				}
				if (pxAtPos.dns < this.dns) { this.swap(pxAtPos); curX = this.x; curY = this.y; break; }
			}
			else if (this.physT == 'SOLID' && pxAtPos.physT == 'LIQUID')
			{
				if (i != steps - 1) continue;
				this.swap(pxAtPos);
				curX = this.x; curY = this.y;
				break;
			}
			else if (this.cor && this.cor > pxAtPos.dns && dice(1001 - this.cor + (pxAtPos.dns)))
			{
				pxAtPos.replace('BUBBLE');
				curX -= xStep; curY -= yStep;
				break;
			}
			let leftR = dice(2) ? -1 : 1;
			let px = pxAtP(realX + leftR, realY, this);
			if (!px && (realX + leftR >= 0 && realX + leftR < GRIDW)) curX += leftR;
			else if (!pxAtP(realX - leftR, realY, this) && (realX - leftR >= 0 && realX - leftR < GRIDW)) curX -= leftR;
			else {curX -= xStep;curY -= yStep; break;}
		}
		this.newX = Math.round(curX); this.newY = Math.round(curY);
	}
	updatePosition(newX, newY, nullifyThis = true, checkIfNull = true)
	{
		if (!this.active) return;
		let px = pxAtP(newX, newY, this);
		if (this.physT === 'GAS' && px) return (this.toRemove(), 0);
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
	updatelt(){
		this.timeAlive = now - this.startTime;
		if (this.timeAlive > this.lt)
		{
			if (this.type == 'ANTEGG'){
				let npx = new Particle(this.x , this.y, 'ANT');
			}
			else if (this.type == 'MAGMA') return;
			else if (this.physT == 'SOLID') {
				let y = this.y - 1;
				let p = pxAtP(this.x, y);
				while (p && p.updT == 'DYNAMIC')
				{
					grid[p.x][p.y] = null;
					grid[p.x][++p.y] = p;
					p = pxAtP(this.x, --y);
				}
			}
			return (this.toRemove(), 0);
		}
	}
	update() {
		if (!this.active) return;
		this.prvP.push([this.x, this.y, this.velX, this.velY]);
		if (this.prvP.length > TRAILAMOUNT) this.prvP.shift();
		this.updateState();
		if (this.frozen) return;
		this.updatelt();
		this.updateType();
	}

	toRemove(){
		this.x = -100; this.y = -100; this.active = false;
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
