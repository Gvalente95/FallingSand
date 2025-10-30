const MAP_INDEX_KEY = "maps:index:v2";
const MAP_PREFIX    = "maps:v2:";
const LAST_KEY      = "maps:last:v2";

function _getIndex(){
  const raw = localStorage.getItem(MAP_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

function _setIndex(arr){
	localStorage.setItem(MAP_INDEX_KEY, JSON.stringify([...new Set(arr)]));
}

function _serializeCurrent() {
	captureScreenshot();
	return {
		GW, GH, PIXELSIZE,
		player: { x: PLAYER.x, y: PLAYER.y, w: PLAYER.w, h: PLAYER.h },
		cells: activeCells.map(c => ({ type: c.type, x: c.x, y: c.y })),
		cellEmitters: cellEmitters.map(c => ({ type: c.type, x: c.x, y: c.y, radius: c.radius })),
		screenshot: canvas.toDataURL("image/png")
	};
}

function saveMapAs(name, data){
  localStorage.setItem(MAP_PREFIX + name, JSON.stringify(data));
  const idx = _getIndex();
  if (!idx.includes(name)) { idx.push(name); _setIndex(idx); }
  localStorage.setItem(LAST_KEY, name);
  return name;
}

function saveMap(){
  const name = (prompt("Nom de la carte :", "nouvelle_carte")||"").trim();
  if (!name) return false;
  return saveMapAs(name, _serializeCurrent());
}

function getMapData(name){
  const raw = localStorage.getItem(MAP_PREFIX + name);
  return raw ? JSON.parse(raw) : null;
}

function loadLastOrFirst(){
  const last = localStorage.getItem(LAST_KEY);
  const idx = _getIndex();
  const name = last && idx.includes(last) ? last : idx[0];
  return name ? getMapData(name) : null;
}

function listMaps() {
	let dataMaps = _getIndex();
	for (const dm of dataMaps)
		console.log(dm);
}

function deleteMap(name){
  localStorage.removeItem(MAP_PREFIX + name);
  _setIndex(_getIndex().filter(n => n !== name));
  const last = localStorage.getItem(LAST_KEY);
  if (last === name) localStorage.removeItem(LAST_KEY);
}

function renameMap(oldName, newName){
  if (!newName || oldName === newName) return false;
  const data = getMapData(oldName); if (!data) return false;
  saveMapAs(newName, data);
  deleteMap(oldName);
  return true;
}

function applyMapData(data){
	PIXELSIZE = data.PIXELSIZE;
	GW = data.GW;
	GH = data.GH;
	initGrid();
	activeCells.length = 0;
	PLAYER = new Player(data.player.x, data.player.y, data.player.w, data.player.h);
	for (let i = 0; i < data.cells.length; i++){
		const c = data.cells[i];
		new Cell(c.x, c.y, c.type);
	}
	for (let i = 0; i < data.cellEmitters.length; i++){
		const ce = data.cellEmitters[i];
		cellEmitters.push(new CellEmitter(ce.x, ce.y, ce.type));
	}
	if (typeof buildWaterShades === "function") buildWaterShades();
}

function loadMapName(name) {
	const data = getMapData(name);
	if (!data) return null;
	localStorage.setItem(LAST_KEY, name);
	applyMapData(data);
}

function loadMapAtIndex(index){
  const names = _getIndex();
  const name = names[index];
  if (!name) return null;
  return loadMapName(name);
}

function loadMapFromButton(name) {
	loadMapName(name);
	hideSelectMapButtons();
}

function hideSelectMapButtons() {
	if (!selectMapButtons)
		return;
	for (let i = 0; i < selectMapButtons.buttons.length; i++){
		const b = selectMapButtons.buttons[i];
		b.del.remove();
		b.remove();
	}
	selectMapButtons.buttons = [];
	selectMapButtons = null;
	hideMapScreenshot();
}

function deleteMapFromButton(name) {
	let deleted = false;
	let prevY = null;
	for (const b of selectMapButtons.buttons) {
		if (!deleted && b.label === name) {
			prevY = parseFloat(b.style.top);
			b.del.remove();
			b.remove();
			deleteMap(b.label);
			deleted = true;
		}
		else if (deleted) {
			const y = parseFloat(b.style.top);
			b.style.top = prevY + "px";
			b.del.style.top = prevY + "px";
			prevY = y;
		}
	}
}

SCREENSHOT = null; SCREENSHOTCTX = null;
function showMapScreenshot(url, x, y, w, h){
	if (!SCREENSHOT){
		SCREENSHOT = document.createElement("canvas");
		SCREENSHOT.style.position = "absolute";
		SCREENSHOT.style.pointerEvents = "none";
		document.body.appendChild(SCREENSHOT);
		SCREENSHOT_CTX = SCREENSHOT.getContext("2d");
	}
	SCREENSHOT.style.border = "2px solid rgba(255,255,255,0.5)";
	SCREENSHOT.style.boxShadow = "0 0 10px rgba(255,255,255,0.3)";
	SCREENSHOT.width = w;
	SCREENSHOT.height = h;
	SCREENSHOT.style.left = x + "px";
	SCREENSHOT.style.top = y + "px";
	const img = new Image();
	img.onload = () => {
	SCREENSHOT_CTX.clearRect(0,0,w,h);
	SCREENSHOT_CTX.drawImage(img, 0, 0, w, h);
	SCREENSHOT.style.display = "block";
	};
	img.src = url;
}

function hideMapScreenshot(){
  if (SCREENSHOT) SCREENSHOT.style.display = "none";
}

selectMapButtons = null;
function selectMap() {
	if (selectMapButtons) {
		hideSelectMapButtons();
		return;
	}
	selectMapButtons = document.createElement("div");
	selectMapButtons.buttons = []
	const names = _getIndex();
	const x = CANVW - btnW * 2;
	const y = CANVH - btnH * 2;
	const w = btnW;
	const h = btnH;
	const clr = "rgba(255, 255, 255, 1)";
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		let data = getMapData(name);
		let button = initButton(name, x, y - (i * (h + 2)), w, h, clr, loadMapFromButton, name, selectMapButtons.div, null, null, null, null, clr, "Load \"" + name + "\"");
		button.addEventListener("mouseenter", () => {
		if (data && data.screenshot)
			showMapScreenshot(data.screenshot, x - (w * 10), y - (i * (h + 2)) - h * 10, w*10, h*10);
		});
		button.addEventListener("mouseleave", hideMapScreenshot);
		selectMapButtons.buttons.push(button);

		selectMapButtons.buttons.push(button);
		let delCur = initButton("X", x + w + 1, y - (i * (h + 2)), 20, h, "rgba(165, 34, 34, 1)", deleteMapFromButton, name, selectMapButtons.div, null, null, null, null, clr, "Delete \"" + name + "\"");
		button.del = delCur;
	}
}