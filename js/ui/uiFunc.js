function switchUiPage(newPageIndex) {uiPageIndex = newPageIndex;}
function setNewType(newIndex)
{
	let key = particleKeys[newIndex];
	if (key == 'MAKE') return (createNewType());
	if (ISGAME) {
		if (KEYS['Shift']) PARTICLE_PROPERTIES[particleKeys[newIndex]].kn = !PARTICLE_PROPERTIES[particleKeys[newIndex]].kn;
		if (!PARTICLE_PROPERTIES[particleKeys[newIndex]].kn) return;
	}
	if (ISGAME && !PARTICLE_PROPERTIES[particleKeys[newIndex]].kn) return;
	switchBrushAction(null);
	uiLayerIndex = 1;
	TYPEINDEX = newIndex;
	for (const b of uiPagesButtons[uiPageIndex].buttons) {
		if (b.label == particleKeys[newIndex]) {typeButton = b;
		b.new = false;}
	}
	BRUSHCOLOR = PARTICLE_PROPERTIES[particleKeys[TYPEINDEX]].color;
}

let settingBrushSize = false;
function setNewBrushSize(newPercentile) { BRUSHSIZE = ((Math.min(GRIDW, GRIDH) / 3) / 100) * newPercentile; settingBrushSize = true; }
function setNewBrushType(newType) { BRUSHTYPE = BRUSHTYPE == 'RECT' ? 'DISC' : 'RECT'; }
function setNewGravity(newGravity) { GRAVITY = newGravity;}
function setNewSpeed(newSpeed) { SIMSPEED = newSpeed; }
function switchGridMode(newGridMode) { gridMode = newGridMode; }
function setRAINPOW(newIntensity) { RAINPOW = (newIntensity / (PIXELSIZE));}
function goToNextFrame() { switchPause(true); update(false); };
function deactivateSwitchButton(button) {
	button.active = false;
	button.classList.remove("activeButton");
}
function switchRain(newActive) { ISRAINING = newActive; }
function switchBrushAction(newAction) {
	BRUSHACTION = newAction;
	for (const b of brushActionButtons) {
		if (b.value != newAction) deactivateSwitchButton(b);
	}
}
function setNewPixelSize(newPixelSize){
	if (newPixelSize <= 0 || newPixelSize === PIXELSIZE) return;
	BRUSHSIZE = clamp(Math.round(BRUSHSIZE * (PIXELSIZE / newPixelSize)), 1, MAXBRUSHSIZE);
	const scale = PIXELSIZE / newPixelSize;
	PIXELSIZE = newPixelSize;
	const newGRIDW = Math.max(1, Math.floor(CANVW / PIXELSIZE));
	const newGRIDH = Math.max(1, Math.floor(CANVH / PIXELSIZE));
	const newGrid = new Array(newGRIDW);
	for (let x = 0; x < newGRIDW; x++) newGrid[x] = new Array(newGRIDH);
	for (let i = 0; i < activeParticles.length; i++){
		const p = activeParticles[i];
		let nx = Math.round(p.x * scale);
		let ny = Math.round(p.y * scale);
		nx = clamp(nx, 0, newGRIDW - 1);
		ny = clamp(ny, 0, newGRIDH - 1);

		if (!newGrid[nx][ny]) {
			p.x = nx; p.y = ny; p.newX = nx; p.newY = ny;
			p.velX *= scale; p.velY *= scale;
			newGrid[nx][ny] = p;
			continue;
		}
		let placed = false;
		const maxR = 8;
		for (let r = 1; r <= maxR && !placed; r++){
			for (let oy = -r; oy <= r && !placed; oy++){
				for (let ox = -r; ox <= r && !placed; ox++){
					const tx = nx + ox, ty = ny + oy;
					if (tx < 0 || ty < 0 || tx >= newGRIDW || ty >= newGRIDH) continue;
					if (!newGrid[tx][ty]){
						p.x = tx; p.y = ty; p.newX = tx; p.newY = ty;
						p.velX *= scale; p.velY *= scale;
						newGrid[tx][ty] = p;
						placed = true;
					}
				}
			}
		}
		if (!placed){
			p.active = false;
			destroyedParticles.push(p);
		}
	}
	GRIDW = newGRIDW;
	GRIDH = newGRIDH;
	grid = newGrid;
	buildGridLayer();
	buildWaterShades();
}
function switchHud(newActive) {
	SHOWHUD = newActive;
	infoMouse.style.display = SHOWHUD ? 'block' : 'none';
	infoText.style.display = SHOWHUD ? 'block' : 'none';
}
function switchPause(newPause = !inPause) {
    if (newPause == -1) newPause = !inPause;
    inPause = newPause;
    if (inPause) pauseButton.classList.add("activeButton");
    else pauseButton.classList.remove("activeButton");
}
function fillScreen() {
	initGrid();
	activeParticles = [];
	let yStart = (KEYS['Shift'] ? 0 : GRIDH / 2);
	for (let x = 0; x < GRIDW; x++){
		for (let y = yStart; y < GRIDH; y++){
			new Particle(x, y, particleKeys[TYPEINDEX]);
		}
	}
}

function discoverType(element, x = MOUSEX - 100, y = MOUSEY - 60) {
	if (!ISGAME) return;
	let type = element;
	if (element && typeof element === 'object') {
		type = element.type;
		x = element.x * PIXELSIZE;
		y = element.y * PIXELSIZE;
	}
	if (PARTICLE_PROPERTIES[type].kn) return;
	let prtClr = setBrightness(PARTICLE_PROPERTIES[type].color);
	let infobox = initLabelDiv(x, y, 'New Particle Discovered!');
	let colorBox = initLabelDiv(x, y + 20, type, prtClr);
	PARTICLE_PROPERTIES[type].kn = 1;
	updateUi();

	const start = performance.now();
	const duration = 3000;
	const speed = 50;
	let lastX = x, lastY = y;

	function frame(t){
		const elapsed = t - start;
		const k = Math.min(1, elapsed / duration);
		const dy = -(speed * (elapsed / 1000));
		const curX = lastX;
		const curY = lastY + dy;
		infobox.style.left = `${curX}px`;
		infobox.style.top  = `${curY}px`;
		colorBox.style.left = `${curX}px`;
		colorBox.style.top  = `${curY + 20}px`;
		infobox.style.color = setAlpha('rgba(255,255,255,1)', 1 - k);
		colorBox.style.color = setAlpha(prtClr, 1 - k);
		if (elapsed < duration) requestAnimationFrame(frame);
		else {
			infobox.remove();
			colorBox.remove();
		}
	}
	requestAnimationFrame(frame);
}
