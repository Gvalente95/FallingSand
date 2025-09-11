let id = 0;
class Particle{
	constructor(x, y, type, velX = f_range(-.3, .3), velY = (PARTICLE_PROPERTIES[type].physT == 'GAS' ? -1 : f_range(0, 3)), lt = PARTICLE_PROPERTIES[type].lt * f_range(.5, 1.5), color = null)
	{
		if (isOutOfBorder(x, y)) return (this.toRemove(), 0);
		this.properties = PARTICLE_PROPERTIES[type];
		let pxAtPos = pxAtP(x, y, this);
		if (pxAtPos)
		{
			if (type === pxAtPos.type) { this.toRemove(); return; }
			else if ((type === 'SHROOM' || type === 'SHROOMX') && pxAtPos.physT === 'SOLID') {color = pxAtPos.color;}
			if (this.properties.physT === 'GAS' && type != 'STEAM')
			{
				if (pxAtPos.physT === 'LIQUID' && type === 'FIRE') {
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
		this.shouldSpread = true;
		this.hasTouchedBorder = false;
		this.id = id++;
		this.isCreator = this.id % 100 === 0;
		this.lt = lt;
		this.startTime = now;
		this.timeAlive = 0;
		this.isSel = false;
		this.wet = 0;
		this.warm = 0;
		this.frozen = 0;
		this.fseed = f_range(.1, 1);
		this.burning = 0;
		this.setVel(velX, velY);
		this.setType(type);
		if (color) this.setColor(color);
		this.x = clamp(x, 0, GRIDW - 1);
		this.y = clamp(y, 0, GRIDH - 1);
		this.prvX = this.x, this.prvY = this.y;
		this.active = true;
		grid[this.x][this.y] = this;
		activeParticles.push(this);
	}

	updatePosition(newX, newY, nullifyThis = true)
	{
		this.prvX = this.x, this.prvY = this.y;
		if (!this.active) return;
		let px = pxAtP(newX, newY, this);
		if (px && this.physT === 'GAS') return (this.toRemove(), 0);
		else if (px) { return (this.swap(px)); }
		const clampedX = Math.floor(clamp(newX, 0, GRIDW - 1));
		const clampedY = Math.floor(clamp(newY, 0, GRIDH - 1));
		if (clampedX != newX || clampedY != newY) this.velX = 0;
		if (nullifyThis)
		{
			if (clampedX === this.x && clampedY === this.y) return (0);
			grid[this.x][this.y] = null;
		}
		this.x = clampedX; this.y = clampedY;
		grid[this.x][this.y] = this;
		return (1);
	}
	updateLifeTime(){
		this.timeAlive = (now - this.startTime) / 1000;
		if (this.timeAlive > this.lt && !this.frozen)
		{
			if (this.transformType) return (this.replace(this.transformType));
			if (this.type === 'MAGMA') return;
			if (this.expl) {
				explodeRadius(this.x * PIXELSIZE, this.y * PIXELSIZE, 5, 10 * PIXELSIZE, 3);
				if (dice(10)) { this.setType('COAL'); this.setToFire(40); return;}
			}
			if (this.physT !== 'GAS') {
				const x = this.x;
				for (let yy = this.y - 1; yy >= 0; yy--) {
					const q = grid[x][yy];
					if (!q || q.type !== this.type) break;
					grid[x][yy] = null;
					const ny = yy + 1;
					if (ny < GRIDH) {
						grid[x][ny] = q;
						q.y = ny;
						q.newY = ny;
					}
				}
			}
			return (this.toRemove(), 0);
		}
	}
	update() {
		if (!this.active) return;
		if (this.isSel) {
			this.x += Math.round(MOUSEDX / PIXELSIZE);
			this.y += Math.round(MOUSEDY / PIXELSIZE);
			return;
		}
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
		if (!isOutOfBorder(this.x, this.y) && grid[this.x][this.y] === this)
			grid[this.x][this.y] = null;
	}
}; const p = Particle.prototype;

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
