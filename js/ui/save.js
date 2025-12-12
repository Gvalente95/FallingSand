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
		player: { x: PLAYER.x, y: PLAYER.y, data: PLAYER.data },
		entities: entities.map(e => ({ x: e.x, y: e.y, data: e.data, type: e.type })),
		cells: activeCells.map(c => ({ type: c.type, x: c.x, y: c.y, clr: c.color })),
		cellEmitters: cellEmitters.map(ce => ({ type: ce.type, x: ce.x, y: ce.y, radius: ce.radius, capacity: ce.capacity })),
		screenshot: canvas.toDataURL("image/png")
	};
}

async function saveMapAs(name, data) {
  const key = MAP_PREFIX + name;
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(key, json);
  } catch (err) {
    await idbPut(key, json);
  }
  const idx = _getIndex();
  if (!idx.includes(name)) { idx.push(name); _setIndex(idx); }
  localStorage.setItem(LAST_KEY, name);
  return name;
}

function getMapDataLS(name){
  const raw = localStorage.getItem(MAP_PREFIX + name);
  return raw ? JSON.parse(raw) : null;
}

async function getMapDataAsync(name){
  const fromLS = getMapDataLS(name);
  if (fromLS) return fromLS;
  const raw = await idbGet(MAP_PREFIX + name);
  return raw ? JSON.parse(raw) : null;
}


async function saveMap() {
  const newName = await promptUser("Select map name:", "");
	if (!newName) {
		announce("invalid name");
		return;
	}
  let dur = 500;
  let msg = newName + " was saved";
  try { await saveMapAs(newName, _serializeCurrent()); }
  catch (err) { msg = "Error: " + err; dur = 4000; }
	announce(msg, dur);
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

async function deleteMap(name){
  const key = MAP_PREFIX + name;
  localStorage.removeItem(key);
  await idbDel(key).catch(()=>{});
	_setIndex(_getIndex().filter(n => n !== name));
	if (localStorage.getItem(LAST_KEY) === name) {
		localStorage.removeItem(LAST_KEY);
	  	announce(name + " deleted");
  }
}

async function renameMap(oldName, newName){
	if (!newName || oldName === newName) return false;
	const data = await getMapDataAsync(oldName);
	if (!data) return false;
	await saveMapAs(newName, data);
	await deleteMap(oldName);
	announce(oldName + " ranamed to " + newName);
	return true;
}

function applyMapData(data) {
	cellEmitters = [];
	entities = [];
	PIXELSIZE = data.PIXELSIZE;
	GW = data.GW;
	GH = data.GH;
	initGrid();
	activeCells.length = 0;
	PLAYER = new Player(data.player.x, data.player.y, data.player.data ? data.player.data : getEntOfType('PLAYER'));
	if (data.entities) {
		for (let i = 0; i < data.entities.length; i++){
			let e = data.entities[i];
			let ent = new Mob(e.x, e.y, e.data ? e.data : getMobData(), e.type);
			entities.push(ent);
		}
	}
	for (let i = 0; i < data.cellEmitters.length; i++){
		const ce = data.cellEmitters[i];
		cellEmitters.push(new CellEmitter(ce.x, ce.y, ce.type, ce.capacity));
	}
	for (let i = 0; i < data.cells.length; i++){
		const c = data.cells[i];
		if (c.type === 'PLAYER') c.type = 'ENTITY';
		let newC = new Cell(c.x, c.y, c.type);
		if (c.clr)
			newC.setColor(c.clr);
	}
	for (let i = 0; i < data.cellEmitters.length; i++){
		const ce = data.cellEmitters[i];
		cellEmitters.push(new CellEmitter(ce.x, ce.y, ce.type, ce.capacity));
	}
	buildWaterShades();
}

const IDB_DB = "WebGameMaps";
const IDB_STORE = "maps";

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}
async function idbDel(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
