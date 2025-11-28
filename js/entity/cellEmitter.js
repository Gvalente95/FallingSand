class CellEmitter{
	constructor(x, y, type, capacity = 5000)
	{
		this.capacity = 5000;
		this.cells = [];
		this.x = x;
		this.y = y;
		this.type = type;
		this.radius = Math.max(BRUSHSIZE, 1);
	}

	update()
	{
		if ((INPUT.keys['x'] || INPUT.keys['backspace']) && (Math.abs(MOUSE.x - this.x) < PIXELSIZE * 20 && Math.abs(MOUSE.y - this.y) < PIXELSIZE * 20))
			this.onRemove();
		else {
			let newCells = launchCells(this.type, this.x, this.y, this.radius, this.radius, true, [0, 0]);
			if (newCells && newCells.length > 0)
				this.cells.push(...newCells);
			if (this.cells.length < this.capacity) return;

			const surplus = this.cells.length - this.capacity;
			console.log(surplus);
			for (let i = 0; i < surplus; i++) {
				this.cells[i].toRemove();
			}
			this.cells.splice(0, surplus);
		}
	}

	onRemove()
	{
		let index = cellEmitters.indexOf(this);
		if (index != -1) cellEmitters.splice(index, 1);
	}
}

function spawnEmitterAtMouse() {
	cellEmitters.push(new CellEmitter(MOUSE.x, MOUSE.y, cellKeys[TYPEINDEX]));	
}

function getEmitterAtPos(x = MOUSE.x, y = MOUSE.y, radius = 10) {
	for (const ce of cellEmitters) {
		if (Math.abs(ce.x - x) <= radius && Math.abs(ce.y - y) <= radius)
			return ce;
	}
}
