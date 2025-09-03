function updateInput()
{
	pxAtMouse = getPxlAtPos(MOUSEGRIDX, MOUSEGRIDY);
	if (MOUSEPRESSED && !isTwoFingerTouch) {
		if (BRUSHCUT || KEYS['Shift']) deleteParticulesAtMouse();
		else launchParticules(particleKeys[TYPEINDEX]);
	}
	if (KEYS['u']) explodeRadius(MOUSEX, MOUSEY, BRUSHSIZE, PARTICLE_TYPES.TNT, 100);
	if (KEYS['Backspace']) deleteParticulesAtMouse();
	if (KEYS['x'])
	{
		let px = getPxlAtPos(MOUSEGRIDX, MOUSEGRIDY);
		if (px) deleteAllParticules(px.type);
	}
}

function flushDestroyedParticles()
{
	for (let particle of destroyedParticles) particle.onRemove();
	destroyedParticles = [];
}

let now = performance.now();
let prvNow = now;
let fps = 0;
let ticks = 0;
let time = 0;
let pxAtMouse = null;
function update(loop = !inPause) {
	if (isInInputField) return (requestAnimationFrame(update));
	now = performance.now();
	ticks++;
	if (now - prvNow > 1000)
	{
		prvNow = now;
		fps = ticks;
		ticks = 0;
	}
	// infoHeader.text.textContent = `x${MOUSEX},y${MOUSEY} ${'   '}	Pxls: ${activeParticles.length} Tm:${time} Fps:${fps}`;
	// infoHeader.rightText.textContent = pxAtMouse ?
	// 	`Elem: ${pxAtMouse.type} - 
	// 	TimeAlive: ${Number(pxAtMouse.timeAlive / 1000).toFixed(1)}` : '';
	updateInput();
	if (inPause && loop)
	{
		flushDestroyedParticles();	
		render();
		requestAnimationFrame(update);
		return;
	}
	time++;
	for (let particleEmitter of particleEmitters) particleEmitter.update();
	for (let particle of activeParticles) particle.update();
	flushDestroyedParticles();
	if (ISRAINING)
	{
		for (let i = 0; i < RAININTENSITY; i++)
		{
			let x = r_range(0, GRIDW);
			new Particle(x, 1, particleKeys[TYPEINDEX], 0, r_range(2, 4));
			new Particle(x, 3, particleKeys[TYPEINDEX], 0, r_range(2, 4));
		}
	}
	render();
	if (loop) requestAnimationFrame(update);
}
