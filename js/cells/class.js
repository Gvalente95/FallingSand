let id = 0;
class Cell{
	constructor(x, y, type, velX = f_range(-.3, .3), velY = (CELL_PROPERTIES[type].physT == 'GAS' ? -1 : f_range(0, 3)), lt = CELL_PROPERTIES[type].lt * f_range(.5, 1.5))
	{
		if (!this.spawn(x, y, type)) { this.toRemove(); return;}
		this.childrens = [];
		this.ground = null;
		this.wetType = null;
		this.parent = null;
		this.hasTouchedSurface = false;
		this.selType = null;
		this.shouldSpread = true;
		this.hasTouchedBorder = false;
		this.fseed = f_range(.1, 1);
		this.id = id++;
		this.isCreator = this.id % 100 === 0;
		this.lt = lt;
		this.startTime = nowSec;
		this.timeAlive = 0;
		this.burning = 0;
		this.wet = 0;
		this.warm = 0;
		this.frozen = 0;
		this.velX = velX;
		this.velY = velY;
		this.x = x;
		this.y = y;
		this.startX = x, this.startY = y;
		this.i = ROWOFF[this.y] + this.x;
		grid1[this.i] = this;
		activeCells.push(this);
		this.active = true;
		this.setType(type);
	}

	spawn(x, y, type) {
		if (isOutOfBorder(x, y)) return (false);
		let cell = cellAtI(x + y * GW, this);
		if (!cell) return (true);
		if (cell.type === 'PLAYER') return (false);
		if (type === cell.type) return (false);
		if (CELL_PROPERTIES[type].physT !== 'GAS') { cell.toRemove(); return (true); }
		if (CELL_PROPERTIES[type].freeze) { this.x = x, this.y = y; this.applyFrost(type, 50, true); }
		if (shouldBurnCell(type, cell)) cell.setToFire(type);
		else if (cell.physT === 'LIQUID' && type === 'FIRE') {
			cell.setType('FIRE', 'STEAM');
			cell.velX = 0;
		}
		return (false);
	}

	updatePosition(di){
		if (!this.active) return 0;
		if (di === this.i) return 0;
		const hit = grid1[di];
		if (hit && hit !== this && hit.active && !(this.type === "PLAYER" && hit.type === "PLAYER")) {
			if (this.physT === 'GAS') { this.toRemove(); return 0; }
			return this.swap(hit);
		}
		grid1[this.i] = null;
		this.i = di;
		this.x = di % GW;
		this.y = (di / GW) | 0;
		grid1[di] = this;
		if (this.isShroom && this.parent) {
			let cell = this.parent.x;
			if (Math.abs(this.x - cell) > 1) cell = Math.sign(this.x - cell);
			let newPi = ROWOFF[this.y - 1] + cell;
			this.parent.updatePosition(newPi);
		}
		return 1;
	};

	updateLifeTime(){
		this.timeAlive = (nowSec - this.startTime);
		if (this.timeAlive > this.lt && !this.frozen)
		{
			if (this.type === 'HESTIA' && this.id != -1) {
				let spawnX = this.startX, spawnY = this.startY;
				let i = cellAtI(ROWOFF[spawnY] + spawnX);
				if (i) {
					if (i.type != this.type) i.toRemove();
					return;
				}
				new Cell(spawnX, spawnY, this.type);
				if (dice(10)) { this.replace('DUST'); return; }
			}
			if (this.transformType && (this.type !== 'STEAM' || this.y < 50)) return (this.replace(this.transformType));
			if (this.type === 'MAGMA') return;
			if (this.expl) {
				explodeRadius(this.x * PIXELSIZE, this.y * PIXELSIZE, 5, 10 * PIXELSIZE, 'FIRE');
				if (!this.u && this.id % 5 === 0) {
					launchParticules('SMOKE', (this.x - 4) * PIXELSIZE, (this.y - 6) * PIXELSIZE, 8, true);
				}
				if (1) { this.setType('COAL'); this.setToFire(); return; }
			}
			if (this.physT !== 'GAS') {
				const x = this.x;
				for (let yy = this.y - 1; yy >= 0; yy--) {
					const i0 = idx(x, yy);
					const q = grid1[i0];
					if (!q || q.type !== this.type) break;
					grid1[i0] = null;
					const ny = yy + 1, i1 = idx(x, ny);
					grid1[i1] = q;
					q.y = ny; q.newY = ny; q.i = i1;
				}
			}
			this.toRemove();
			return 0;
		}
	}
	update() {
		if (!this.active) return;
		if (this.selType === 'GRAB') {
			this.x = clamp(MOUSE.gridX + this.sx, 0, GW - 1);
			this.y = clamp(MOUSE.gridY + this.sy, 0, GH - 1);
			return;
		}
		this.updateState();
		if (this.frozen) {
			if (this.y > GH - 1 || !dice(500)) return;
			let gi = ROWOFF[this.y + 1] + this.x;
			const g = cellAtI(gi, this);
			if (!g) {
				if (this.type != 'WATER') this.updatePosition(gi);
			this.unFreeze(0);}
			return;
		}
		this.updateLifeTime();
		this.updateType();
	}

	killFamily() {
		for (let i = 0; i < activeCells.length; i++){
			let p = activeCells[i];
			if (p === this) continue;
			if (p.familyId === this.familyId) {
				p.familyId = -1;
				p.dead = true;
				p.velY = p.velX = 0;
				if (p.type === 'LEAF' && p.updT === 'STATIC') p.updT = 'ALIVE';
			}
		}
	}

	toRemove(killFam = false){
		this.x = -100; this.y = -100; this.active = false;
		if (this.parent) { this.parent.child = null; }
		if (this.child) this.child.parent = null;
		if (killFam && this.familyId != -1) {
			this.killFamily();
		}
		destroyedCells.push(this);
	}
	onRemove() {
		const i = activeCells.indexOf(this);
		if (i !== -1) activeCells.splice(i, 1);
		const si = this.i;
		if ((si >>> 0) < grid1.length && grid1[si] === this) grid1[si] = null;
		this.i = -1;
	}
}; const p = Cell.prototype;

class CellEmitter{
	constructor(x, y, type)
	{
		this.x = x;
		this.y = y;
		this.type = type;
		this.radius = BRUSHSIZE;
	}

	update()
	{
		if ((INPUT.keys['x'] || INPUT.keys['Backspace']) && (Math.abs(MOUSE.x - this.x) < PIXELSIZE * 20 && Math.abs(MOUSE.y - this.y) < PIXELSIZE * 20))
			this.onRemove();
		else launchParticules(this.type, this.x, this.y, this.radius, true, false);
	}

	onRemove()
	{
		let index = cellEmitters.indexOf(this);
		if (index != -1) cellEmitters.splice(index, 1);
		// for (const key in this) this[key] = null;
	}
}

function spawnEmitterAtMouse() {
	cellEmitters.push(new CellEmitter(MOUSE.x, MOUSE.y, cellKeys[TYPEINDEX]));	
}
