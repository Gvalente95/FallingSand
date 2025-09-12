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




function rebuildNeighbors4(W,H){
  const N = W*H;
  N4 = new Int32Array(N*4);
  for (let y=0,i=0; y<H; y++){
    for (let x=0; x<W; x++,i++){
      N4[i*4+0] = y>0    ? i-W : -1;
      N4[i*4+1] = y<H-1  ? i+W : -1;
      N4[i*4+2] = x>0    ? i-1 : -1;
      N4[i*4+3] = x<W-1  ? i+1 : -1;
    }
  }
}

function ringOffsets(W,maxR){
  const out=[];
  for (let r=1;r<=maxR;r++){
    for (let oy=-r;oy<=r;oy++){
      for (let ox=-r;ox<=r;ox++){
        if (!ox && !oy) continue;
        if (Math.max(Math.abs(ox),Math.abs(oy))!==r) continue;
        out.push(ox + oy*W);
      }
    }
  }
  return out;
}
function setNewPixelSize(newPixelSize){
	if (newPixelSize <= 0 || newPixelSize === PIXELSIZE) return;

	const scale = PIXELSIZE / newPixelSize;
	PIXELSIZE = newPixelSize;

	BRUSHSIZE = clamp(Math.round(BRUSHSIZE * scale), 1, MAXBRUSHSIZE);

	const newW = Math.max(1, (CANVW / PIXELSIZE) | 0);
	const newH = Math.max(1, (CANVH / PIXELSIZE) | 0);
	const newN = newW * newH;

	const newGrid1 = new Array(newN);
	const buckets = new Map();

	for (let i = 0; i < activeParticles.length; i++){
	const p = activeParticles[i];
	let nx = Math.round(p.x * scale);
	let ny = Math.round(p.y * scale);
	if (nx < 0) nx = 0; else if (nx >= newW) nx = newW - 1;
	if (ny < 0) ny = 0; else if (ny >= newH) ny = newH - 1;
	const ni = idx(nx,ny,newW);
	p._ni = ni;
	p._nx = nx;
	p._ny = ny;
	p.velX *= scale;
	p.velY *= scale;
	const arr = buckets.get(ni);
	if (arr) arr.push(p); else buckets.set(ni,[p]);
	}

	const offs = ringOffsets(newW, 16);

	for (const [ni, arr] of buckets){
	let placedCenter = false;
	for (let j=0; j<arr.length; j++){
		const p = arr[j];
		let ti = ni;

		if (!placedCenter && !newGrid1[ti]) {
		placedCenter = true;
		} else {
		let found = false;
		for (let k=0; k<offs.length; k++){
			const oi = ti + offs[k];
			if (oi < 0 || oi >= newN) continue;
			const x = oi % newW;
			const y = (oi / newW) | 0;
			if (x < 0 || x >= newW || y < 0 || y >= newH) continue;
			if (!newGrid1[oi]) { ti = oi; found = true; break; }
		}
		if (!found) {
			p.active = false;
			destroyedParticles.push(p);
			continue;
		}
		}

		const tx = ti % newW;
		const ty = (ti / newW) | 0;
		p.x = tx; p.y = ty; p.newX = tx; p.newY = ty; p.i = ti;
		newGrid1[ti] = p;
	}
  }

  GRIDW = newW;
  GRIDH = newH;
  grid1 = newGrid1;
  rebuildNeighbors4(GRIDW, GRIDH);

  if (typeof buildGridLayer === 'function') buildGridLayer();
  if (typeof buildWaterShades === 'function') buildWaterShades();

  if (typeof RowCache !== 'undefined' && RowCache) {
    RowCache.vacL.length = RowCache.vacR.length = RowCache.dropL.length = RowCache.dropR.length =
    RowCache.barL.length = RowCache.barR.length = RowCache.dirty.length = 0;
    for (let y = 0; y < GRIDH; y++) RowCache.dirty[y] = 1;
  }
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


function switchUiDisplay(newActive = !uiDisplayed) {
	uiDisplayed = newActive;
	uiContainer.style.display = (uiDisplayed === true ? 'block' : 'none');
}