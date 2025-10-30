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

async function  saveMap() {
	const newName = await promptUser("Select map name:", "");
	if (!newName)
		return;
	saveMapAs(newName, _serializeCurrent());
	let infobox = initLabelDiv(CANVW / 2 - 100, CANVH / 2, 'Map Saved as' + newName);
	setTimeout(() => {
		infobox.remove();
	}, 500);
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
