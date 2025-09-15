function updateInput()
{
	PXATMOUSE = pxAtI(ROWOFF[MOUSEGRIDY] + MOUSEGRIDX);
	if (MOUSEPRESSED && !isTwoFingerTouch) {
		if ((BRUSHACTION === 'CUT') || (KEYS['Shift'] && !isWheeling)) deleteParticulesAtMouse();
		else if (BRUSHACTION) {
			if (BRUSHACTION === 'VIBRATE') vibrateRadius();
			else if (BRUSHACTION === 'EXPLODE') explodeRadius();
			else if (BRUSHACTION === 'LIQUEFY') selectRadius('LIQUID');
			else return;
		}
		else launchParticules(particleKeys[TYPEINDEX]);
	}
	if (KEYS['Backspace']) deleteParticulesAtMouse();
	if (KEYS['x'] && PXATMOUSE) deleteAllParticules(PXATMOUSE.type);
}

function flushDestroyedParticles()
{
	for (let i = 0; i < destroyedParticles.length; i++) destroyedParticles[i].onRemove();
	destroyedParticles = [];
}

let now = performance.now();
let nowSec = now / 1000;
let last = now;
let prvNow = now;
let fps = '?';
let ticks = 0;
let FRAME = 0;
let secTick = false;
function updateTime() {
	now = performance.now();
	nowSec = now / 1000;
	dt = (nowSec - last) / .03;
	last = nowSec;
	if (dt > 3) dt = 3;
	ticks++;
	if (now - prvNow > 1000) {
		prvNow = now;
		fps = ticks;
		infoFps.textContent = `FPS: ${fps}`;
		ticks = 0;
		secTick = true;
	}
	else secTick = false;
}

function update(loop = !inPause) {
	if (isInInputField) return (requestAnimationFrame(update));
	updateTime();
	updateInput();
	if (inPause && loop)
	{
		flushDestroyedParticles();	
		render();
		requestAnimationFrame(update);
		return;
	}
	FRAME++;
	for (let i = 0; i < particleEmitters.length; i++) particleEmitters[i].update();
	for (let i = 0; i < activeParticles.length; i++) activeParticles[i].update();
	flushDestroyedParticles();
	if (ISRAINING)
		for (let i = 0; i < RAINPOW; i++)
			launchParticlesRect(particleKeys[TYPEINDEX], r_range(0, GW), 1, 1, 50);
	render();
	requestAnimationFrame(update);
}








// const SIM_DT_MS = 1000 / 120;
// const RENDER_DT_MS = 1000 / 60;
// const MAX_STEPS = 5;
// let accMS = 0;
// let lastTS = performance.now();
// let lastRenderTS = 0;
// function stepSimulation() {
// 	if (isInInputField) return;
// 	updateTime();
// 	updateInput();

// 	if (inPause) {
// 		flushDestroyedParticles();
// 		return;
// 	}

// 	FRAME++;
// 	for (let i = 0; i < particleEmitters.length; i++) particleEmitters[i].update();
// 	for (let i = 0; i < activeParticles.length; i++) activeParticles[i].update();

// 	flushDestroyedParticles();

// 	if (ISRAINING) {
// 		for (let i = 0; i < RAINPOW; i++)
// 			launchParticlesRect(particleKeys[TYPEINDEX], r_range(0, GW), 1, 1, 50);
// 	}
// }

// function gameLoop(ts = performance.now()) {
// 	const dt = ts - lastTS;
// 	lastTS = ts;
// 	accMS += dt;

// 	let steps = 0;
// 	while (accMS >= SIM_DT_MS && steps < MAX_STEPS) {
// 		stepSimulation();
// 		accMS -= SIM_DT_MS;
// 		steps++;
// 	}
// 	if (steps === MAX_STEPS) accMS = 0;

// 	if (ts - lastRenderTS >= RENDER_DT_MS) {
// 		ctx.clearRect(0, 0, canvas.width, canvas.height);
// 		if (gridMode) ctx.drawImage(gridLayer, 0, 0);
// 		for (let i = 0; i < activeParticles.length; i++) {
// 			const p = activeParticles[i];
// 			showParticle(p, p.x, p.y, 1);
// 		}
// 		renderBrush();
// 		if (SHOWHUD) updateHUD();
// 		lastRenderTS = ts;
// 	}
// 	requestAnimationFrame(gameLoop);
// }

// function start() { lastTS = performance.now(); lastRenderTS = 0; accMS = 0; requestAnimationFrame(gameLoop); }
