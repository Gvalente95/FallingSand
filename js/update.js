function updateInput()
{
	PXATMOUSE = pxAtI(ROWOFF[MOUSEGRIDY] + MOUSEGRIDX);
	if (MOUSEPRESSED && !isTwoFingerTouch) {
		if ((BRUSHACTION === 'CUT') || (KEYS['Shift'] && !isWheeling)) deleteParticulesAtMouse();
		else if (BRUSHACTION) {
			switch (BRUSHACTION) {
				case 'VIBRATE': vibrateRadius(); break;
				case 'EXPLODE': explodeRadius(); break;
				case 'LIQUEFY': selectRadius('LIQUID'); break;
				default: return;
			}
		}
		else launchParticules(particleKeys[TYPEINDEX]);
	}
	if (KEYS['Backspace']) deleteParticulesAtMouse();
	if (KEYS['x'] && PXATMOUSE) deleteAllParticules(PXATMOUSE.type);
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
			launchParticlesRect(particleKeys[TYPEINDEX], r_range(1, GW - 1), 1, 1, 50);
	}
	for (let i = 0; i < particleEmitters.length; i++)
		particleEmitters[i].update();
	for (let i = 0; i < activeParticles.length; i++){
		let p = activeParticles[i];
		p.update();
	}
}

function update() {
	updateInput();
	updateTime();
	if (!inPause) updateParticules();
	flushDestroyedParticles();
	render();
	requestAnimationFrame(update);
}
