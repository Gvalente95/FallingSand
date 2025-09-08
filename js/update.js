function updateInput()
{
	PXATMOUSE = pxAtP(MOUSEGRIDX, MOUSEGRIDY);
	if (MOUSEPRESSED && !isTwoFingerTouch) {
		if ((BRUSHACTION == 'CUT' && SHOULDCUT) || KEYS['Shift']) deleteParticulesAtMouse();
		else if (BRUSHACTION == 'PUSH') pushRadius();
		else if (BRUSHACTION == 'VIBRATE') vibrateRadius();
		else if (BRUSHACTION == 'EXPLODE') explodeRadius();
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
let last = now;
let prvNow = now;
let fps = '?';
let ticks = 0;
let time = 0;
function updateTime() {
	now = performance.now();
	dt = (now - last) / (1000 / 30);
	last = now;
	if (dt > 3) dt = 3;
	ticks++;
	if (now - prvNow > 1000)
	{
		prvNow = now;
		fps = ticks;
		ticks = 0;
	}
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
	time++;
	if (ISREWINDING) { goToPrevFrame(); }
	else {
		for (let i = 0; i < particleEmitters.length; i++) particleEmitters[i].update();
		for (let i = 0; i < activeParticles.length; i++) activeParticles[i].update();
	}
	flushDestroyedParticles();
	if (ISRAINING)
		for (let i = 0; i < RAINPOW; i++)
			launchParticlesRect(particleKeys[TYPEINDEX], r_range(0, GRIDW), 1, 1, 50);
	render();
	if (loop) requestAnimationFrame(update);
}
