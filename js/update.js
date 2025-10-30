function updateInput()
{
	MOUSE.cell = cellAtI(ROWOFF[MOUSE.gridY] + MOUSE.gridX);
	if (MOUSE.pressed && !isTwoFingerTouch) {
		if ((BRUSHACTION === 'CUT') || (INPUT.keys['shift'] && !isWheeling)) deleteParticulesAtMouse();
		else if (BRUSHACTION) {
			switch (BRUSHACTION) {
				case 'VIBRATE': vibrateRadius(); break;
				case 'EXPLODE': explodeRadius(); break;
				case 'LIQUEFY': selectRadius('LIQUID'); break;
				default: return;
			}
		}
		else launchParticules(cellKeys[TYPEINDEX]);
	}
	if (INPUT.keys['backspace']) deleteParticulesAtMouse();
	if (INPUT.keys['x'] && MOUSE.cell) deleteAllParticules(MOUSE.cell.type);
	INPUT.update();
}

let now = performance.now(), nowSec = now / 1000;
let last = now, prvNow = now;
let fps = '?', ticks = 0;
let FRAME = 0, secTick = false;
function updateTime() {
	now = performance.now();
	nowSec = now / 1000;
	dt = Math.min((nowSec - last) / .03, 3);
	last = nowSec;
	ticks++;
	secTick = now - prvNow > 1000;
	if (!secTick) return;
	prvNow = now;
	fps = ticks;
	infoFps.textContent = `FPS: ${fps}`;
	ticks = 0;
}

function updateParticules() {
	if (ISRAINING) {
		for (let i = 0; i < RAINPOW; i++)
			launchCellsRect(cellKeys[TYPEINDEX], r_range(1, GW - 1), 1, 1, 50);
	}
	for (let i = 0; i < cellEmitters.length; i++)
		cellEmitters[i].update();
	for (let i = 0; i < activeCells.length; i++){
		let p = activeCells[i];
		p.update();
	}
}

function update() {
	updateInput();
	updateTime();
	if (!inPause) {
		updateParticules();
		if (PLAYER) PLAYER.update();
	}
	flushDestroyedCells();
}

function loop() {
	update();
	render();
	requestAnimationFrame(loop);
}
