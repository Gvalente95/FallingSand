function getEntityAtPos(x, y, radius) {
  for (const e of entities) {
    let xy = [e.x + e.w / 2, e.y + e.h / 2];
    if (Math.abs(x - xy[0]) < radius && Math.abs(y - xy[1]) < radius) return e;
  }
  return null;
}

function isCollision(cell, ent) {
  if (!cell) return false;
  if (cell.ent === ent) return false;
  if (cell.physT !== "SOLID" && !cell.frozen) return false;
  if (cell.type === "LEAF") return false;
  if (cell.type === "TREE" && cell.parent && cell.isGrower) return false;
  if (cell.isShroom && cell.parent && cell.isGrower) return false;
  return true;
}

function addTmpPannel(ent, info, color = "red", size, dur = 450) {
  var x = (ent.x + ent.w / 2 + r_range(-5, 5)) * PIXELSIZE;
  var y = (ent.y - 10) * PIXELSIZE;
  const div = initLabelDiv(sx(x), sy(y), info, null, color);
  div.style.fontSize = size + "px";
  div.classList.add("dmgPannel");
  div.getBoundingClientRect();
  requestAnimationFrame(() => {
    div.style.transform = "translateY(-30px)";
    div.style.opacity = "0";
  });
  setTimeout(() => {
    div.remove();
  }, dur);
}

class Entity {
  constructor(x, y, data, type) {
    this.grounded = false;
    this.startX = x;
    this.startY = y;
    this.splashing = false;
    this.inWater = false;
    this.rotZ = 0;
    this.type = type;
    this.action = "idle";
    this.dir = "right";
    this.vel = [0, 0];
    this.mv = [0, 0];
    this.groundType = null;
    this.isAttacking = false;
    this.alive = true;
    this.showSide = "left";
    this.projectiles = [];
    this.pushable = false;
    this.hurt = 30;
    this.timeAlive = 0;
    this.jetCur = 100;
    this.jetMax = 100;
    this.initData(data);
    this.initCells(x, y);
  }

  hit(dmg = r_range(5, 10), projCell, critChance = 25) {
    const isCrit = fdice(critChance);
    if (isCrit) dmg *= 2;
    this.hp -= dmg;
    this.hurt = 5;
    this.action = "idle";
    this.vel[0] = this.vel[1] = 0;
    this.mv[0] = 0;
    if (projCell) {
      const dir = projCell.x < this.x + this.w / 2 ? 1 : -1;
      this.place(this.x + dir * 5, this.y);
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.death();
    }
    addTmpPannel(this, `${dmg}`, "red", isCrit ? 12 : 8, 450);
  }

  initData(data) {
    if (!data) {
      console.warn(`NO data found for entity ${this.type}, using fallback`);
      data = getEntOfType("PLAYER");
    } else {
      const fallback = getEntOfType("PLAYER");
      data.image = data.image || fallback.image;
      data.colors = data.colors || fallback.colors;
      data.stats = data.stats || fallback.stats;
    }
    this.data = data;
    data.stats = { ...baseStats, ...data.stats };
    this.image = data.image;
    this.colors = data.colors;
    this.stats = data.stats;
    this.baseHp = this.stats.hp || 100;
    this.hp = this.baseHp;
    this.baseSpeed = this.stats.moveSpeed || 0.2;
    this.speed = this.baseSpeed;
  }

  debug() {
    console.warn("T=" + FRAME + " [ENTITY]", this.type, "stats:", this.data.stats);
  }

  scaleMask(mask) {
    const h = mask.length,
      w = mask[0].length;
    const out = Array.from({ length: H }, () => Array(W).fill("."));
    for (let y = 0; y < H; y++) {
      const sy = Math.floor((y * h) / H);
      for (let x = 0; x < W; x++) {
        const sx = Math.floor((x * w) / W);
        out[y][x] = mask[sy][sx];
      }
    }
    return out;
  }

  seesTarget(start, targetEnt) {
    const rayStart = [start[0] * PIXELSIZE, start[1] * PIXELSIZE];
    const rayEnd = [targetEnt.x * PIXELSIZE, targetEnt.y * PIXELSIZE];
    const dx = rayEnd[0] - rayStart[0];
    const dy = rayEnd[1] - rayStart[1];
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return 0;
    const stepWorld = PIXELSIZE;
    const steps = Math.ceil(dist / stepWorld);
    const stepX = (dx / dist) * stepWorld;
    const stepY = (dy / dist) * stepWorld;
    let x = rayStart[0];
    let y = rayStart[1];
    for (let i = 0; i <= steps; i++) {
      if (x < 0 || x >= CANVW || y < 0 || y >= CANVH) break;
      const px = Cell.getW(x, y);
      if (px && px.ent !== this && px.ent !== targetEnt && (px.physT === "SOLID" || px.physT === "STATIC")) {
        return 0;
      }
      //   ctx.fillStyle = "red";
      //   ctx.fillRect(x, y, 1, 1);
      x += stepX;
      y += stepY;
    }
    return 1;
  }

  initCells(x, y) {
    const h = this.image.length,
      w = this.image[0].length;
    this.w = w;
    this.h = h;
    const mask = this.image;
    this.x = clamp(x, 0, GW - 1 - this.w);
    this.y = clamp(y, 0, GH - 1 - this.h);
    const limbs = { a: "hat", h: "head", t: "torso", g: "leftArm", d: "rightArm", l: "leftLeg", r: "rightLeg", b: "foot", i: "leftEye", I: "rightEye" };
    this.cells = [];
    for (let yy = 0; yy < this.h; yy++) {
      for (let xx = 0; xx < this.w; xx++) {
        let ch = mask[yy][xx];
        if (ch === "." || ch === " ") continue;
        let color = this.colors[ch];
        const cell = new Cell(this.x + xx, this.y + yy, "ENTITY", 0, 0, Infinity);
        cell.setColor(color);
        cell.baseColor = color;
        cell.baseHp = r_range(60, 120);
        cell.hp = cell.baseHp;
        cell.relX = xx;
        cell.relY = yy;
        cell.ent = this;
        cell.startRelX = xx;
        cell.startRelY = yy;
        if ("ahtgdlriI".includes(ch)) cell.limb = limbs[ch];
        else cell.limb = "none";
        this.cells.push(cell);
        activeCells.push(cell);
      }
    }
    this.cellsAtStart = this.cells.length;
  }

  groundCheck() {
    this.groundType = null;
    this.inWater = false;
    let waistLevel = this.y + Math.round(this.h * 0.4);
    let ll = cellAtI(ROWOFF[waistLevel] + this.x - 1, null);
    let rr = cellAtI(ROWOFF[waistLevel] + this.x + this.w + 1, null);
    if ((ll && !ll.frozen && ll.physT === "LIQUID") || (rr && !rr.frozen && rr.physT === "LIQUID")) {
      this.inWater = true;
      return false;
    }
    if (this.y + this.h >= GH - 1) return true;
    for (let x = 0; x < this.w; x++) {
      let lc = cellAtI(ROWOFF[this.y + this.h + 1] + this.x + x, null);
      if (lc && isCollision(lc, this)) {
        this.groundType = lc.type;
        return true;
      }
    }
    return false;
  }

  death() {
    for (let i = 0; i < this.cells.length; i++) {
      let cell = this.cells[i];
      cell.updT = "DYNAMIC";
    }
    this.alive = false;
    return this.alive;
  }

  splash() {
    this.splashing = false;
    if (!this.inWater && (this.mv[0] || this.mv[1])) {
      let px = cellAtI(ROWOFF[this.y + this.h] + this.x - 1);
      if (px && px.physT === "LIQUID") {
        explodeRadius(Math.round(this.x + this.w / 2) * PIXELSIZE, (this.y + this.h + 1) * PIXELSIZE, 5, 2, null, "ENTITY");
        this.splashing = true;
      }
    }
  }

  onRemove(deleteCells = true) {
    for (const c of this.cells) {
      if (deleteCells) c.onRemove();
      else c.ent = null;
    }
    const i = entities.indexOf(this);
    if (i != -1) entities.splice(i, 1);
  }

  throwProj(from, target, type = this.stats.projType, force = this.stats.projForce) {
    let mv = [0, 0];

    // target[1] -= 20;
    // force = Math.hypot(from[0] - target[0], from[1] - target[1]) / 10;
    if (fps !== undefined && fps !== "?" && fps <= 45) force *= fps / 45;
    if (CELL_PROPERTIES[type].physT === "GAS") {
      mv[1] = -1;
    } else {
      const dx = target[0] - from[0];
      const dy = target[1] - from[1];
      const d = Math.hypot(dx, dy);
      if (d > 0) {
        let vx = (dx / d) * force;
        let vy = (dy / d) * force;
        if (vx === 0 && dx !== 0) vx = Math.sign(dx);
        if (vy === 0 && dy !== 0) vy = Math.sign(dy);
        mv = [vx, vy];
      }
    }
    const proj = new Cell(from[0], from[1], type, mv[0], mv[1]);
    proj.user = this;
    proj.isProjectile = true;
    proj.ownGravity = GRAVITY * 0.1;
    this.isAttacking = 5;
    launchCells("SMOKE", from[0] * PIXELSIZE, from[1] * PIXELSIZE, 5, 5);
  }

  updateCells() {
    for (let i = this.cells.length - 1; i >= 0; i--) {
      let cell = this.cells[i];

      if (cell.burning) {
        if (cell.hp-- <= 0) {
          this.hp--;
          addTmpPannel(this, "1", "red", 6);
          cell.hp = cell.baseHp;
        }
      }

      const cx = this.w / 2;
      const cy = this.h / 2;
      const vx = cell.relX - cx;
      const vy = cell.relY - cy;
      const c = Math.cos(this.rotZ);
      const s = Math.sin(this.rotZ);
      const rx = vx * c - vy * s;
      const ry = vx * s + vy * c;
      const x = Math.round(this.x + cx + rx);
      const y = Math.round(this.y + cy + ry);
      cell.newX = clamp(x, 0, GW - 1);
      cell.newY = clamp(y, 0, GH - 1);
      cell.di = ROWOFF[cell.newY] + cell.newX;
      let other = cellAtI(cell.di, cell);
      if (!other || other.updT !== "ALIVE") cell.updatePosition(cell.di);
      cell.rotX = cell.x - this.x;
      cell.rotY = cell.y - this.y;
    }
    if (this.cells.length <= 5 || this.hp <= 0) this.death();
  }

  place(x, y) {
    this.x = clamp(x, 0, GW - this.w);
    this.y = clamp(y, 0, GH - this.h);
  }

  jump() {
    if (this.inWater && cellAtI(ROWOFF[this.y - 1] + this.x)) return;
    if (this.action === "jet") return;
    this.action = "jump";
    this.mv[1] = -10;
    this.y--;
    if (this.groundType) impactCells += 50;
    this.grounded = false;
  }

  jet() {
    if (this.grounded || this.inWater) {
      if (this.action === "jet") this.action = "idle";
      if (this.jetCur < this.jetMax) this.jetCur += 2;
      return;
    }
    if (this.action === "jump") return;
    if (this.vel[1] >= 0) return;
    if (this.jetCur <= 0) {
      this.action = "fall";
      return;
    }
    this.jetCur--;
    this.action = "jet";
    this.mv[1] = cellAtI(ROWOFF[this.y - 1] + this.x + this.w / 2, this) ? 0 : -5;
    launchCells("JET", (this.x + this.w / 2) * PIXELSIZE, (this.y + this.h + 2) * PIXELSIZE, 2, 1, true, [r_range(-10, 10)]);
  }

  updateState() {
    if (this.hurt) this.hurt--;
    if (this.isAttacking) this.isAttacking--;
    this.grounded = this.groundCheck();
    if (this.grounded || this.inWater) this.jetEnd = null;
    if (this.inWater) {
      this.grounded = false;
    }
    if (this.action === "jump" && this.mv[1] > 0) this.action = this.grounded ? "fall" : "idle";
    else if (this.grounded || this.inWater) {
      if (this.vel[1] < 0) this.jump();
      else if (this.grounded) {
        this.action = "idle";
        this.mv[1] = 0;
      }
    }
    this.jet();
    if (this.inWater && this.action !== "jump") {
      if (this === PLAYER) {
        this.mv[0] *= 0.7;
        this.mv[1] *= 0.8;
      } else {
        this.mv[0] *= 0.95;
        this.mv[1] *= 0.95;
      }
    } else {
      this.vel[1] = this.grounded ? 0 : Math.sign(GRAVITY) * 0.7;
    }
  }

  push(velX = this.vel[0], velY = this.vel[1]) {
    if (this.wasPushed) return;
    this.wasPushed = true;
    this.vel = [velX, velY];
    this.rotate(this.vel[0] * 0.02);
    return this.updateMovement();
  }

  tryMove() {
    if (!this.isAttacking && this.mv[0]) this.dir = this.mv[0] > 0 ? "right" : "left";
    if (FRAME % (INPUT.shift ? 5 : 10) === 0) this.showSide = this.showSide === "left" ? "right" : "left";
    if (this.grounded) this.action = "walk";
    let li = ROWOFF[this.newY + this.h - 1] + this.newX;
    let ri = li + this.w;
    let i = this.mv[0] < 0 ? li : ri;
    for (let x = 0; x < this.w; x++) {
      const c = cellAtI(ROWOFF[this.y - 1] + this.x + x, this);
      if (c && isCollision(c, this)) {
        if (c.ent && c.ent !== this && c.ent.pushable && c.ent.push(c.ent.vel[0], -3)) continue;
        else {
          this.mv[1] = 2;
          this.newY = this.y + 1;
        }
        break;
      }
    }
    let wallNum = 0;
    for (let y = 0; y < this.h; y++) {
      let idx = i - GW * y;
      let px = cellAtI(idx);
      if (isCollision(px, this)) {
        if (px.ent && px.ent !== this && px.ent.pushable && px.ent.push(this.vel[0] * 2)) continue;
        wallNum++;
      }
    }
    if (wallNum > Math.round(this.h / 2)) {
      this.mv[0] = 0;
      this.newX = this.x;
    }
    let cell = cellAtI(i);
    if (!cell) return;
    let iter = 0;
    let maxIter = Math.trunc(this.mv[0]);
    while (isCollision(cell, this)) {
      this.newY--;
      ++iter;
      if (this.newY <= 0 || iter > maxIter) break;
      cell = cellAtI(i - GW * iter);
    }
  }

  updateMovement() {
    this.timeAlive++;
    this.mv[0] = (this.mv[0] + this.vel[0]) * (1 - this.stats.moveDrag);
    this.mv[1] = (this.mv[1] + this.vel[1]) * (1 - (this.grounded ? this.stats.moveDrag : 0));
    if (this.mv[1] < 0) {
      const up = cellAtI(ROWOFF[this.y - 1] + this.x + Math.round(this.w / 2));
      if (isCollision(up, this)) this.mv[1] = 0;
    }
    if (Math.abs(this.mv[0]) < 0.5) this.mv[0] = 0;
    if (Math.abs(this.mv[1]) < 0.5) this.mv[1] = 0;
    if (!this.mv[0] && !this.mv[1]) {
      if (this.action === "walk") this.action = "idle";
      return;
    }
    this.newX = Math.round(clamp(this.x + Math.trunc(this.mv[0]) * this.speed, 0, GW - 1 - this.w));
    this.newY = Math.round(clamp(this.y + Math.trunc(this.mv[1]) * this.speed, 0, GH - 1 - this.h));
    this.tryMove();
    if (this.newX === this.x && this.newY === this.y) return false;
    this.place(this.newX, this.newY);
    return true;
  }

  wander() {
    if (fdice(this.stats.dirFreq) || (this.x <= 0 && this.vel[0] < 0) || (this.x >= GW - 1 && this.vel[0] > 0)) {
      this.mv[0] *= -1;
      this.dir = this.dir === "left" ? "right" : "left";
    } else if (fdice(this.stats.moveFreq)) this.vel[0] = this.dir === "left" ? -3 : 3;
    if (fdice(this.stats.jumpFreq)) this.vel[1] = -5;
    this.action = Math.abs(this.mv[0]) >= 0.2 ? "walk" : "idle";
  }

  rotate(amount) {
    this.rotZ = (this.rotZ + amount) % (Math.PI * 2);
    if (this.rotZ < 0) this.rotZ = Math.PI * 2;
  }

  update() {
    if (this.hp <= 0) this.death();
    if (!this.alive) return;
    this.splash();
    this.updateState();
    this.updateMovement();
    if (this.action === "walk" && this.grounded && this.groundType) impactCells += Math.round(Math.abs(this.mv[0]));
    this.updateCells();
  }

  static renderBar(pos, curValue, maxValue, fillColor = "green", label = null) {
    const w = 50;
    const h = 6;
    const perc = curValue / maxValue; // 0 to 1
    var clr = addColor("red", "green", perc);
    const filledW = Math.round(perc * w);
    ctx.fillStyle = fillColor;
    ctx.fillRect(pos[0], pos[1], w, h);
    if (curValue) {
      ctx.fillStyle = clr;
      ctx.fillRect(pos[0], pos[1], filledW, h);
    }
    if (label) {
      drawText(ctx, [pos[0] - 10, pos[1] - 6], label, "white", null, 7);
    }
  }

  renderHpBar() {
    if (!this.alive) return;
    if (this.hp !== this.baseHp) Entity.renderBar(toScrn(canvToWindow(this.x, this.y - 4)), this.hp, this.baseHp, "green");
    if (this.jetCur < this.jetMax) {
      const clr = "purple";
      var pos;
      if (this === PLAYER) pos = [CANVW - 100, 100];
      else pos = toScrn(canvToWindow(this.x, this.y - 6));
      Entity.renderBar(pos, this.jetCur, this.jetMax, clr);
    }
  }

  render(size, borderColor = null) {
    if (this === PLAYER && !this.inWater) this.dir = MOUSE.wgx < this.x ? "left" : "right";

    const OFF = 1;

    const posed = [];
    const occ = new Set();
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      if (!this.alive) {
        posed.push({ cell, x: cell.x, y: cell.y });
        occ.add(`${cell.x},${cell.y}`);
        continue;
      }
      let relX = cell.rotX;
      let relY = cell.rotY;
      if (this.inWater) {
        const cx = this.w / 2;
        const cy = this.h / 2;
        const dx = relX - cx;
        const dy = relY - cy;
        let angleDeg = this.mv[1] < 0 ? 60 : this.mv[1] > 0 ? 125 : 90;
        if (!this.mv[0]) {
          angleDeg = this.mv[1] > 0 ? 180 : 0;
        }
        const angle = (angleDeg * Math.PI) / 180;
        const rx = dx * Math.cos(angle) + dy * Math.sin(angle);
        const ry = -dx * Math.sin(angle) + dy * Math.cos(angle);
        relX = cx + rx;
        relY = cy + ry;
        if (this.dir === "right") relX = this.w - relX;
      } else if (this.dir === "left") relX = this.w - relX;
      let x = this.x + relX;
      let y = this.y + relY;

      if (this.action === "walk" && cell.limb.includes("Leg")) {
        if (cell.limb.includes(this.showSide)) x -= 1;
        else x += 1;
      }
      if (this.showSide === "left" && cell.limb !== "leftLeg" && cell.limb !== "rightLeg") y++;
      if (this.isAttacking && cell.limb.includes("Arm") && cell.limb.includes("right")) y -= this.isAttacking;
      else if ((this.action === "jump" || this.action === "fall" || this.action === "jet") && cell.limb.includes("Arm")) y -= 4;
      if ((this.inWater || this.action === "fall" || this.action === "jump") && cell.limb.includes("Leg") && cell.limb.includes(this.showSide)) y -= 2;
      if (this.hurt) {
        const displ = this.hurt / 10;
        x += r_range(-displ, displ);
        y += r_range(-displ, displ);
      }

      posed.push({ cell, x, y });
      occ.add(`${x},${y}`);
    }

    for (let i = 0; i < posed.length; i++) {
      let { cell, x, y } = posed[i];
      let di = ROWOFF[y] + x;
      cell.updatePosition(di);
      if (this.inWater) {
        ctx.fillColor = getWaterColor(y);
        ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
        x += Math.round(Math.cos(FRAME * 0.1 + x * 0.3) * 1);
      }
      showCell(cell, x, y, 1, size);
    }
    this.renderHpBar();
    this.vel[0] = this.vel[1] = 0;

    if (!borderColor) return;

    ctx.fillStyle = borderColor;
    for (let i = 0; i < posed.length; i++) {
      const { x, y } = posed[i];
      const leftEmpty = !occ.has(`${x - 1},${y}`);
      const rightEmpty = !occ.has(`${x + 1},${y}`);
      const upEmpty = !occ.has(`${x},${y - 1}`);
      const downEmpty = !occ.has(`${x},${y + 1}`);

      let dx = 0,
        dy = 0;
      if (leftEmpty) dx = -OFF;
      else if (rightEmpty) dx = OFF;
      else if (upEmpty) dy = -OFF;
      else if (downEmpty) dy = OFF;
      else continue;

      const fx = (x + dx) * PIXELSIZE;
      const fy = (y + dy) * PIXELSIZE;
      ctx.fillRect(fx, fy, size, size);
    }
  }
}

class Mob extends Entity {
  constructor(x, y, data, type) {
    super(x, y, data, type);
    this.handP = [x, y];
    this.seesPlayer = false;
  }

  update() {
    if (!this.alive) {
      this.onRemove(false);
      return;
    }
    super.wander();
    if (PLAYER && this.stats.projType && fdice(this.stats.projFreq)) {
      this.seesPlayer = this.seesTarget(this.handP, PLAYER);
      if (this.seesPlayer) this.throwProj(this.handP, [PLAYER.x, PLAYER.y]);
    }
    super.update();
  }

  renderHands(tx = PLAYER.x * PIXELSIZE, ty = PLAYER.y * PIXELSIZE) {
    let px = (this.x + this.w / 2) * PIXELSIZE;
    let py = (this.y + this.h / 2) * PIXELSIZE;

    const angle = Math.atan2(ty - py, tx - px);
    const dx0 = Math.cos(angle);
    const dy0 = Math.sin(angle);
    const baseH = [px + dx0 * 20, py + dy0 * 20];
    const endH = [px + dx0 * 30, py + dy0 * 30];
    {
      const sBase = toScrn(baseH);
      const sEnd = toScrn(endH);
      drawStripedLine(sBase, sEnd, "rgba(26, 126, 78, 1)", "white");
    }
    var lh = [(this.x + 4) * PIXELSIZE, (this.y + 6) * PIXELSIZE];
    var rh = [(this.x + this.w - 4) * PIXELSIZE, (this.y + 7) * PIXELSIZE];
    if (this.dir === "left") {
      var tmp = lh;
      lh = rh;
      rh = tmp;
    }
    {
      const sRH = toScrn(rh);
      const sRH2 = toScrn([rh[0], rh[1] + 3]);
      const sBase = toScrn(baseH);
      drawTriangle(ctx, sRH, sRH2, sBase, "rgba(128, 30, 30, 1)", 2);
    }
    {
      const sLH = toScrn(lh);
      const sLH2 = toScrn([lh[0], lh[1] + 5]);
      const sBase = toScrn(baseH);
      drawTriangle(ctx, sLH, sLH2, sBase, "rgba(71, 30, 128, 1)", 2);
    }
    this.handP = [baseH[0] / PIXELSIZE, baseH[1] / PIXELSIZE];
  }

  render(size) {
    if (this.alive && PLAYER && this.stats.projType && this.seesPlayer) this.renderHands();
    super.render(size);
  }
}

class Player extends Entity {
  constructor(x, y, data) {
    super(x, y, data, "PLAYER");
    this.flashPoints = [];
    this.endH = null;
    // au.playLoop(au.footsteps, 0.1, () => this.action === "walk");
    au.playLoop(au.inWater, 0.5, () => this.inWater, 1);
    au.playLoop(au.splash, 0.5, () => this.splashing);
  }

  updateHealth() {
    if (!this.alive)
      setTimeout(() => {
        PLAYER = null;
        confirmChoice("Try Again?", () => {
          LD.reloadLevel();
        });
      }, 500);
  }

  drawFlashRays() {
    ctx.fillStyle = setAlpha("rgba(204, 194, 149, 1)", OBSCURITY / 4);
    ctx.beginPath();
    const sEnd = toScrn(this.endH);
    ctx.moveTo(sEnd[0], sEnd[1]);
    for (let i = 0; i < this.flashPoints.length; i++) {
      const sp = toScrn(this.flashPoints[i]);
      ctx.lineTo(sp[0], sp[1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  renderFlashlight() {
    let px = (this.x + this.w / 2) * PIXELSIZE;
    let py = (this.y + this.h / 2) * PIXELSIZE;

    const tx = wx(MOUSE.x);
    const ty = wy(MOUSE.y);
    const angle = Math.atan2(ty - py, tx - px);
    const ww = 40;
    const step = Math.PI / 360;
    const dx0 = Math.cos(angle);
    const dy0 = Math.sin(angle);
    const baseH = [px + dx0 * 20, py + dy0 * 20];
    const endH = [px + dx0 * 30, py + dy0 * 30];
    {
      const sBase = toScrn(baseH);
      const sEnd = toScrn(endH);
      drawStripedLine(sBase, sEnd, "rgba(26, 126, 78, 1)", "white");
    }

    if (INPUT.keys[" "] && !this.isAttacking) this.throwProj([endH[0] / PIXELSIZE, endH[1] / PIXELSIZE], [MOUSE.wgx, MOUSE.wgy]);
    if (this !== PLAYER) return;
    var lh = [(this.x + 4) * PIXELSIZE, (this.y + 6) * PIXELSIZE];
    var rh = [(this.x + this.w - 4) * PIXELSIZE, (this.y + 7) * PIXELSIZE];
    if (this.dir === "left") {
      var tmp = lh;
      lh = rh;
      rh = tmp;
    }
    {
      const sRH = toScrn(rh);
      const sRH2 = toScrn([rh[0], rh[1] + 3]);
      const sBase = toScrn(baseH);
      drawTriangle(ctx, sRH, sRH2, sBase, "rgba(128, 30, 30, 1)", 2);
    }
    {
      const sLH = toScrn(lh);
      const sLH2 = toScrn([lh[0], lh[1] + 5]);
      const sBase = toScrn(baseH);
      drawTriangle(ctx, sLH, sLH2, sBase, "rgba(71, 30, 128, 1)", 2);
    }

    if (this.inWater) return;
    const points = [];

    for (let i = -ww; i <= ww; i++) {
      const angle2 = angle + i * step;
      const dx = Math.cos(angle2);
      const dy = Math.sin(angle2);
      let curX = endH[0];
      let curY = endH[1];
      let enc = 0;
      let maxEnc = (ww - Math.abs(i)) * 2;
      let lastX = curX;
      let lastY = curY;
      var steps = 0;
      while (true) {
        const cx = Math.floor(curX / PIXELSIZE);
        const cy = Math.floor(curY / PIXELSIZE);
        if (cx < 0 || cx >= GW || cy < 0 || cy >= GH) break;

        const cell = cellAtI(ROWOFF[cy] + cx);
        if (cell) {
          if (cell.physT === "GAS") enc += 0.2;
          else enc++;
          if (cell.physT === "LIQUID") {
            if (enc > 20) break;
          }
          if (enc >= maxEnc || (enc > 8 && steps < 50)) break;
          if (cell.physT !== "GAS" && cell.type !== "JET")
            lightSources.push({
              x: cell.x * PIXELSIZE + PIXELSIZE * 0.5,
              y: cell.y * PIXELSIZE + PIXELSIZE * 0.5,
              r: 4,
            });
        } else {
          if (enc > 80) break;
          enc = 0;
        }
        lastX = curX;
        lastY = curY;
        curX += dx;
        curY += dy;
        if (curX < 0 || curX >= CANVW - 1 || curY < 0 || curY > CANVH - 1) {
          lightSources.push({
            x: curX,
            y: curY,
            r: 6,
          });
          break;
        }
        steps++;
      }
      points.push([lastX, lastY]);
    }
    this.flashPoints = points;
    this.endH = endH;
  }

  update() {
    this.updateHealth();
    if (!this.alive) return;
    this.speed = this.baseSpeed * (INPUT.shift || this.inWater ? 2 : 1);
    this.vel = [INPUT.x, INPUT.y * 0.5];
    if (isMobile && MOUSE.clickedOnPlayer) {
      this.vel[0] = MOUSE.gx < this.x ? -1 : 1;
      if (this.inWater) this.vel[1] = Math.sign(MOUSE.gy - this.y);
      else if (MOUSE.dy < -20 && this.grounded) this.jump();
    }
    super.update();
  }

  render(size) {
    super.render(size);
    this.renderFlashlight();
  }
}

class Door extends Entity {
  constructor(x, y, data) {
    super(x, y, data, "Door");
    this.pushable = true;
    this.hurt = 0;
    // this.rotate(0.5);
  }

  update() {
    this.wasPushed = false;
    if (this.rotZ != 0) this.rotate(this.rotZ > 0 ? -0.01 : 0.01);
    super.update();
  }

  render(size) {
    super.render(size);
  }
}

class Collectible extends Entity {
  constructor(x, y, data) {
    super(x, y, data, "Collectible");
    this.label = data.label;
  }

  update() {
    super.update();
  }

  render(size) {
    super.render(size);
    if (PLAYER && Math.hypot(this.x - PLAYER.x, this.y - PLAYER.y) < PIXELSIZE * 20) {
      let x = (this.x + this.w / 2) * PIXELSIZE;
      let y = (this.y - 10) * PIXELSIZE;
      const scr = toScrn([x, y]);
      x = scr[0];
      y = scr[1];
      drawText(ctx, [x, y], `${this.label}`, "white", null, 10);
    }
  }
}
