function delCellsAtPos(x = MOUSE.wx - BRUSHSIZE / 2 + PIXELSIZE, y = MOUSE.wy - BRUSHSIZE / 2 + PIXELSIZE, radius = BRUSHSIZE, type = null, isDisc = "DISC") {
  const radiusSquared = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (!isDisc || dx * dx + dy * dy <= radiusSquared) {
        let px = x + dx * PIXELSIZE;
        let py = y + dy * PIXELSIZE;
        let gx = Math.floor(px / PIXELSIZE);
        let gy = Math.floor(py / PIXELSIZE);
        const p = cellAtI(ROWOFF[gy] + gx);
        if (p && (!type || p.type == type)) p.toRemove(true);
      }
    }
  }
}

function delEmitterAtPos(x = MOUSE.x, y = MOUSE.y, radius = 10) {
  const ce = getEmitterAtPos(x, y, radius);
  if (ce) ce.onRemove();
}

function delEntsAtPos(x = MOUSE.gx, y = MOUSE.gy, radius = BRUSHSIZE) {
  const e = getEntityAtPos(x, y, radius);
  if (e) e.onRemove();
}

function delAllAtMouse() {
  delCellsAtPos();
  delEntsAtPos();
  delEmitterAtPos();
}

function delAllCells(type = null) {
  for (let i = 0; i < activeCells.length; i++) {
    let p = activeCells[i];
    if (!type || p.type == type) destroyedCells.push(p);
  }
}

function flushDestroyedCells() {
  for (let i = 0; i < destroyedCells.length; i++) destroyedCells[i].onRemove();
  destroyedCells = [];
}

function resetAll() {
  for (let i = 0; i < cellEmitters.length; i++) cellEmitters[i].onRemove();
  cellEmitters = [];
  delAllCells();
  activeCells = [];
  for (let i = 0; i < entities.length; i++) entities[i].onRemove();
  entities = [];
  initGrid();
}

function delOldestCells(num) {
  activeCells.splice(0, num);
}
