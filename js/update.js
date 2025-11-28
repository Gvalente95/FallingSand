function updateInput()
{
	MOUSE.cell = cellAtI(ROWOFF[MOUSE.gridY] + MOUSE.gridX);
	if (MOUSE.pressed && !isTwoFingerTouch && (!isMobile || !MOUSE.clickedOnPlayer)) {
		if ((BRUSHACTION === 'CUT') || (INPUT.keys['shift'] && !isWheeling)) delAllAtMouse();
		else if (BRUSHACTION) {
			switch (BRUSHACTION) {
				case 'VIBRATE': vibrateRadius(); break;
				case 'EXPLODE': explodeRadius(); break;
				case 'LIQUEFY': selectRadius('LIQUID'); break;
				default: return;
			}
		}
		else launchCells(cellKeys[TYPEINDEX]);
	}
	if (INPUT.keys['backspace']) delAllAtMouse();
	if (INPUT.keys['x'] && MOUSE.cell) delAllCells(MOUSE.cell.type);
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

let wakeFrame = false;
function updateParticules() {
	wakeFrame = (FRAME % 100 === 0);
	if (ISRAINING) {
		for (let i = 0; i < RAINPOW; i++)
			launchCells(cellKeys[TYPEINDEX], r_range(1, CANVW - 1), 1, 1, 1, false, [0, 0]);
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
		for (let i = 0; i < entities.length; i++)
			entities[i].update();
	}
	MOUSE.dx = MOUSE.dy = 0;
	flushDestroyedCells();
}

function loop() {
	if (!LD.active) {
		update();
		render();
		MOUSE.clicked = false;
	}
	requestAnimationFrame(loop);
}


// render("blur(5px)");
// render("contrast(2)");
// render("brightness(1.5)");
// render("grayscale(1)");
// render("invert(1)");
// render("opacity(0.5)");
// render("saturate(1.2)");
// render("sepia(.4)");
// render("drop-shadow(5px 5px 10px rgba(0,0,0,0.5))");