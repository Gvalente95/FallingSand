p.updateBurn = function () {
  if (this.frozen) {
    this.frozen -= 50;
    this.burning = 0;
  }
  if (--this.burning <= 0) {
    if (this.ent) return;
    if (this.expl) {
      return (this.lt = r_range(1, 20));
    }
    if (this.type === "OIL") this.lt = 0;
    else if (this.type === "SAND" && dice(20)) this.setType("GLASS");
    else {
      this.setType("HOTCOAL");
      this.aliveTime = 0;
    }
    this.burning = 0;
  } else if (dice(3) && !cellAtI(ROWOFF[this.y - 1] + this.x)) {
    let newp = new Cell(this.x, this.y - 1, "FIRE");
  }
  let depth = 2;
  for (let x = -depth; x < depth; x++)
    for (let y = -depth; y < depth; y++) {
      if (x === 0 && y === 0) continue;
      if (isOutOfBorder(this.x + x, this.y + y)) continue;
      let cell = cellAtI(ROWOFF[this.y + y] + this.x + x, this);
      if (cell && !cell.burning && shouldBurnCell("FIRE", cell)) {
        cell.setToFire(this.burnType);
        break;
      }
      if (!cell && dice(30)) new Cell(this.x + x, this.y + y, r_range(0, 10) === 0 ? "DUST" : "SMOKE");
    }
};

p.stopFire = function () {
  // this.setColor();
  this.burning = 0;
};

p.setToFire = function (burnType = "FIRE", duration = 1000 - this.brn) {
  this.dead = true;
  if (burnType === "MAGMA" && this.type === "MAGMA") return;
  if (this.frozen) {
    this.unFreeze(50);
    return;
  }
  if (this.type === "ROCK") {
    return this.setType("MAGMA");
  }
  if (this.type === "ICE" || this.type === "SNOW") {
    return this.setType("WATER");
  }
  this.warm = 200;
  if (this.wet > 50 && this.wetType != "OIL") {
    this.wet -= 50;
    this.stopFire();
    return;
  }
  if (this.burning) return;
  if (this.type === "MAGMA") this.setType("LAVA");
  else {
    if (this.updT === "STATIC") this.updT = "DYNAMIC";
    this.burning = duration;
    this.burnType = burnType;
    // this.setColor(addColor(this.baseColor, CELL_PROPERTIES[burnType].color, .5));
  }
};

p.setWet = function (wetAmount = 100, type = "WATER") {
  if (this.physT != "SOLID") return 0;
  if (this.type === "FISH") return 0;
  if (this.brnpwr) {
    this.brnpwr = 0;
    return 0;
  }
  if (this.wet) {
    this.wet = wetAmount;
    this.wetType = type;
    return 1;
  }
  if (type != "OIL") this.burning = 0;
  this.wetStart = now;
  this.wetType = type;
  this.wet = wetAmount;
  this.setColor(addColor(this.baseColor, CELL_PROPERTIES[this.wetType].color, wetAmount / 10 / 100));
  return 1;
};

p.updateWet = function () {
  this.wetDur = now - this.wetStart;
  if (this.burning) {
    if (this.wetType === "OIL") this.wet = 0;
    else this.stopFire();
  }
  if (--this.wet <= 0) {
    let l = cellAtI(ROWOFF[this.y] + this.x - 1);
    if (l && l.physT === "LIQUID") this.wet = 200;
    else {
      l = cellAtI(ROWOFF[this.y] + this.x + 1);
      if (l && l.physT === "LIQUID") this.wet = 200;
    }
    if (this.wet <= 0) {
      this.setColor(this.baseColor);
      return;
    }
  }
  if (this.wet > 80) {
    let depth = r_range(2, 8);
    for (let x = -depth; x < depth; x++)
      for (let y = -depth; y < depth; y++) {
        if (x === 0 && y === 0) continue;
        if (isOutOfBorder(this.x + x, this.y + y)) continue;
        let cell = cellAtI(ROWOFF[this.y + y] + this.x + x, this);
        if (cell) cell.setWet(this.wet - 10, this.wetType);
      }
  }
  if (dice(500)) {
    let cellAb = cellAtI(ROWOFF[this.y - 1] + this.x);
    if (cellAb && cellAb.type === this.wetType) {
      cellAb = cellAb.replace("BUBBLE", this.wetType);
    }
  }
  if (this.isShroom && this.isGrower && dice(100)) {
    let cell = cellAtI(ROWOFF[this.y + 1] + this.x);
    if (cell && cell.physT === "LIQUID") {
      cell.setType("BUBBLE", cell.type);
    }
  }
  if (this.hasTouchedBorder && this.updT != "ALIVE" && this.wetDur > 5000) {
    if (this.type === "GRASS" && (!this.u || this.u.physT === "LIQUID")) {
      let shroomChance = 10000;
      if (dice(shroomChance)) {
        if (dice(2)) this.setType("SHROOM");
        else if (dice(2)) this.setType("FISH");
        else this.setType("TREE");
        this.isGrower = true;
      }
    } else if (this.type === "SAND" && dice(100)) {
      this.setType("GRASS");
    }
  }
};

FROSTMAX = 50;
p.setFrozen = function (freezeAmount) {
  if (this.burning || this.warm) return;
  if (this.frozen && freezeAmount < this.frozen) return;
  this.frostStart = now;
  this.frozen = freezeAmount;
  let freezeColor = addColor(this.baseColor, "rgb(95, 211, 211)", this.frozen / FROSTMAX);
  this.setColor(freezeColor);
  if (this.type === "SHROOM" && !this.parent && this.isGrower) this.headColor = freezeColor;
};

p.unFreeze = function (warmAmount = 5) {
  this.frozen = 0;
  this.warm = warmAmount;
  this.setColor(this.baseColor);
};

p.updateFreeze = function () {
  this.frostDur = now - this.frostStart;
  if (this.warm || this.burning) this.unFreeze();
  this.applyFrost("ICE");
};

p.updateState = function () {
  if (this.warm) this.warm--;
  if (this.frozen) this.updateFreeze();
  if (this.wet) this.updateWet();
  if (this.burning) this.updateBurn();
};
