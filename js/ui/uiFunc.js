function switchUiPage(newPageIndex) {uiPageIndex = newPageIndex;}
function setNewType(newIndex)
{
	let key = cellKeys[newIndex];
	if (key == 'MAKE') return (createNewType());
	if (ISGAME) {
		if (INPUT.keys['shift']) CELL_PROPERTIES[cellKeys[newIndex]].kn = !CELL_PROPERTIES[cellKeys[newIndex]].kn;
		if (!CELL_PROPERTIES[cellKeys[newIndex]].kn) return;
	}
	if (ISGAME && !CELL_PROPERTIES[cellKeys[newIndex]].kn) return;
	switchBrushAction(null);
	uiLayerIndex = 1;
	TYPEINDEX = newIndex;
	for (const b of uiPagesButtons[uiPageIndex].buttons) {
		if (b.label == cellKeys[newIndex]) {typeButton = b;
		b.new = false;}
	}
	BRUSHCOLOR = CELL_PROPERTIES[cellKeys[TYPEINDEX]].color;
}

let settingBrushSize = false;
function setNewBrushSize(newPercentile) { BRUSHSIZE = Math.floor(((Math.min(GW, GH) / 3) / 100) * newPercentile); settingBrushSize = true; }
function setNewBrushType(newType) { BRUSHTYPE = BRUSHTYPE == 'RECT' ? 'DISC' : 'RECT'; }
function setNewGravity(newGravity) { GRAVITY = newGravity;}
function setNewSpeed(newSpeed) { SIMSPEED = newSpeed; }
function switchGridMode(newGridMode) { gridMode = newGridMode; }
function setRAINPOW(newIntensity) { RAINPOW = (newIntensity / (PIXELSIZE));}
function goToNextFrame() { switchPause(true); updateParticules(); };
function deactivateSwitchButton(button) {button.active = false; button.classList.remove("activeButton");}
function switchRain(newActive) { ISRAINING = newActive; }
function switchBrushAction(newAction) {
	BRUSHACTION = newAction;
	for (const b of brushActionButtons) {
		if (b.value != newAction) deactivateSwitchButton(b);
	}
}

function tryPlaceAt(p, x, y){
	if (x < 0 || y < 0 || x >= GW || y >= GH) return false;
	const i = ROWOFF[y] + x;
	if (grid1[i]) return false;
	p.x = x; p.y = y; p.newX = x; p.newY = y; p.i = i;
	grid1[i] = p;
	return true;
}


let RINGS = null;
function buildRings(rMax){
  RINGS = new Array(rMax + 1);
  for (let r = 1; r <= rMax; r++){
    const ring = [];
    for (let oy = -r; oy <= r; oy++){
      for (let ox = -r; ox <= r; ox++){
        if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
        ring.push([ox, oy, Math.atan2(oy, ox)]);
      }
    }
    ring.sort((a,b)=>a[2]-b[2]);
    RINGS[r] = ring.map(v=>[v[0],v[1]]);
  }
}

function findEmptyNear(x0, y0, rMax){
  if (!RINGS || RINGS.length-1 < rMax) buildRings(rMax);
  const W = GW, H = GH;
  const base = ((x0*73856093) ^ (y0*19349663)) >>> 0;
  for (let r = 1; r <= rMax; r++){
    const ring = RINGS[r];
    const start = base % ring.length;
    const rev = ((x0 + y0) & 1) === 1;
    for (let k = 0; k < ring.length; k++){
      const idx = rev ? (start - k + ring.length) % ring.length : (start + k) % ring.length;
      const off = ring[idx];
      const x = x0 + off[0], y = y0 + off[1];
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = ROWOFF[y] + x;
      if (!grid1[i]) return [x, y];
    }
  }
  return null;
}

function replaceCells(scale){
	const s2 = scale * scale;
	const orig = activeCells.slice();
	activeCells = [];
	grid1.fill(null);

	const rBase = Math.max(2, Math.ceil(scale) + 2);

	for (let k=0; k<orig.length; k++){
		const p = orig[k];
		if (p.type === "PLAYER") { p.toRemove(); continue; }
		p.velX *= scale; p.velY *= scale;
		let nx = Math.floor(p.x * scale);
		let ny = Math.floor(p.y * scale);
		if (nx < 0) nx = 0; else if (nx >= GW) nx = GW - 1;
		if (ny < 0) ny = 0; else if (ny >= GH) ny = GH - 1;
		let placed = tryPlaceAt(p, nx, ny);
		if (!placed){
			if (s2 >= 1){
				const spot = findEmptyNear(nx, ny, rBase);
				if (spot) placed = tryPlaceAt(p, spot[0], spot[1]);
			} else {
				p.toRemove();
			}
		}
		if (placed) activeCells.push(p);
		if (s2 > 1){
			let extra = Math.floor(s2) - 1;
			const frac = s2 - Math.floor(s2);
			if (Math.random() < frac) extra++;

			for (let t=0; t<extra; t++){
				const spot = findEmptyNear(nx, ny, rBase);
				if (!spot) break;
				const q = new Cell(spot[0], spot[1], p.type);
				if (p.color) q.setColor(p.color);
				q.velX = p.velX; q.velY = p.velY;
			}
		}
	}
}


function setNewPixelSize(newPixelSize){
	if (newPixelSize <= 0 || newPixelSize === PIXELSIZE) return;

	const scale = PIXELSIZE / newPixelSize;
	PIXELSIZE = newPixelSize;
	PLAYER.x = Math.round(PLAYER.x * scale);
	PLAYER.y = Math.round(PLAYER.y * scale);
	BRUSHSIZE = clamp(Math.round(BRUSHSIZE * scale), 1, MAXBRUSHSIZE);
	GW = Math.max(1, (CANVW / PIXELSIZE) | 0);
	GH = Math.max(1, (CANVH / PIXELSIZE) | 0);
	initGrid();
	buildWaterShades();
	replaceCells(scale);
	PLAYER.initCells(PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h);
}

function switchHud(newActive = !SHOWHUD) {
	SHOWHUD = newActive;
	if (!newActive) {
		infoText.textContent = 'HUD';
	}
	infoText.style.width = newActive ? '200px' : '30px';
}

let pauseDuration = 0;
let pauseStart = 0;
function switchPause(newPause = !inPause) {
    if (newPause == -1) newPause = !inPause;
	inPause = newPause;
	
	if (inPause) pauseStart = nowSec;
	else {
		pauseDuration = nowSec - pauseStart;
		for (let i = 0; i < activeCells.length; i++)
		{
			let p = activeCells[i];
			p.startTime += pauseDuration;
		}
	}
}

function fillScreen() {
	initGrid();
	activeCells = [];
	let yStart = (INPUT.keys['shift'] ? 0 : Math.floor(GH / 2));
	for (let x = 0; x < GW; x++){
		for (let y = yStart; y < GH; y++){
			new Cell(x, y, cellKeys[TYPEINDEX]);
		}
	}
}

function discoverType(element, x = MOUSE.x - 100, y = MOUSE.y - 60) {
	if (!ISGAME) return;
	let type = element;
	if (element && typeof element === 'object') {
		type = element.type;
		x = element.x * PIXELSIZE;
		y = element.y * PIXELSIZE;
	}
	if (CELL_PROPERTIES[type].kn) return;
	let cellClr = setBrightness(CELL_PROPERTIES[type].color);
	let infobox = initLabelDiv(x, y, 'New Cell Discovered!');
	let colorBox = initLabelDiv(x, y + 20, type, null, cellClr);
	CELL_PROPERTIES[type].kn = 1;
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
		colorBox.style.color = setAlpha(cellClr, 1 - k);
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


function announce(msg, dur = 2000, bgr = "rgba(63,15,15,1)") {
	const infobox = initLabelDiv(CANVW/2 - msg.length*5, CANVH/2, msg, bgr, "rgba(255,255,255,1)", document.body);
	setTimeout(() => infobox.remove(), dur);
}