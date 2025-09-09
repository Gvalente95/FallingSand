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
			else if ((type == 'SHROOM' || type == 'SHROOMX') && (pxAtPos.physT == 'SOLID' || pxAtPos.physT == 'STATIC')) {color = pxAtPos.color;}
			if (this.properties.physT == 'GAS' && type != 'STEAM')
			{
				if (pxAtPos.physT == 'LIQUID' && type == 'FIRE') {
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
	updateVelocity() {
		if (this.physT === 'STATIC') return;
		if (this.type === 'ANT' && this.hasTouchedBorder) return;
		if (this.type === 'FISH' && this.inWater) return;
		const g = this.ground;
		const grounded = g && (g.physT === 'SOLID' || g.frozen) && g.velY === 0;
		if (this.type === 'WATER' && g && !pxAtP(this.x, this.y - 1) && dice(200) && g.type === this.type) {
			this.setType('BUBBLE');
			this.transformType = 'WATER';
		}
		if (g && g.physT === 'LIQUID' && this.physT === 'SOLID') {
			this.velY *= 0.7;
			const minV = (4 - g.dns) * 0.5;
			if (this.velY < minV) this.velY = minV;
			if (this.velY < 0.3 && dice(5)) this.velY = 0.3;
		} else if (grounded && this.physT !== 'GAS' && this.updT !== 'ALIVE') {
			this.velY = g.type === 'WOOD' ? 1 : 0;
			this.velX *= (1 - XDRAG);
			if (this.velX > -0.01 && this.velX < 0.01) this.velX = 0;
		}	else if (this.physT !== 'GAS' && !g) this.velY += GRAVITY;
		else if (this.type === 'STEAM' || this.type === 'CLOUD' || (this.id % 5) === 0) {
			this.velX = getSin(now * 0.002, 5, 0.9, this.id * 0.3);
		}
	}
	
	updateMovement() {
		if (this.type === 'ANT' && this.hasTouchedBorder && !this.inWater) return;
		if (this.type === 'PLANT' || (this.type === 'FISH' && this.inWater && this.timeInWater < 30)) {
			this.newX = Math.round(this.x + this.velX);
			this.newY = Math.round(this.y + this.velY);
			return;
		}

		const k = SIMSPEED * dt;
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
			if (this.type === 'FISH' && hit.physT === 'LIQUID') continue;
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
				else if (this.type == 'ICE') this.velY = this.velX = 0;
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

	updatePosition(newX, newY, nullifyThis = true)
	{
		if (!this.active) return;
		let px = pxAtP(newX, newY, this);
		if (px && this.physT === 'GAS') return (this.toRemove(), 0);
		else if (px) { return (this.swap(px)); }
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
		if (this.timeAlive > this.lt && !this.frozen)
		{
			if (this.transformType) return (this.replace(this.transformType));
			if (this.type == 'MAGMA') return;
			if (this.expl) {
				explodeRadius(this.x, this.y, 5, 20 * PIXELSIZE, 5);
				if (dice(10)) {
					this.setType('COAL');
					this.setToFire(40);
					return;	
				}
			}
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
		// this.prvP.push([this.x, this.y, this.velX, this.velY]);
		// if (this.prvP.length > TRAILAMOUNT) this.prvP.shift();
		this.updateState();
		if (this.frozen) return;
		this.updateLifeTime();
		this.updateType();
	}

	toRemove(){
		this.x = -100; this.y = -100; this.active = false;
		if (this.parent) {if (this.isShroom) this.parent.toRemove(); else this.parent.child = null;}
		if (this.child) this.child.parent = null;
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
		// for (const key in this) this[key] = null;
	}
}

function spawnEmitterAtMouse() {
	particleEmitters.push(new ParticleEmitter(MOUSEX, MOUSEY, particleKeys[TYPEINDEX]));	
}
