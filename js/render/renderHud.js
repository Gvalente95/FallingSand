let lastTop = "",
  lastMouse = "";
let hudEvery = 4,
  hudTick = 0;

//     this.grounded = false;
//     this.startX = x;
//     this.startY = y;
//     this.splashing = false;
//     this.inWater = false;
//     this.type = type;
//     this.action = "idle";
//     this.dir = "right";
//     this.vel = [0, 0];
//     this.mv = [0, 0];
//     this.groundType = null;
//     this.isAttacking = false;
//     this.alive = true;
//     this.showSide = "left";
//     this.projectiles = [];
//     this.baseHp = 100;
//     this.hp = this.baseHp;
//     this.hurt = 30;
//     this.timeAlive = 0;
//     this.jetCur = 0;
// this.jetMax = 100;

function updateHUD() {
  if (++hudTick % hudEvery !== 0) return;
  let topNow = `x${MOUSE.x},y${MOUSE.y}  gx${MOUSE.gridX},gy${MOUSE.gridY}\nBrush Size: ${BRUSHSIZE}\nPx Size: ${PIXELSIZE}\nPxls: ${activeCells.length}\nFrm: ${FRAME} Dt: ${Number(dt).toFixed(2)}s`;
  if (PLAYER) {
    const e = PLAYER;
    var dpx = [];
    dpx.push(`\n\nPLAYER - '${e.type}'`);
    dpx.push(`hp: ${e.hp}/${e.baseHp}`);
    dpx.push(`x ${e.x} y${e.y}`);
    dpx.push(`mv ${Number(e.mv[0]).toFixed(3)} y${Number(e.mv[1].toFixed(3))}`);
    dpx.push(`wtr ${e.inWater} grd ${e.grounded}`);
    dpx.push(" ");
    topNow += dpx.join("\n");
  }
  if (MOUSE.cell && !isMobile) {
    var parts = [];
    parts.push("\n");
    if (MOUSE.cell.ent) {
      const e = MOUSE.cell.ent;
      parts.push(`Ent - '${e.type}'`);
      parts.push(`hp: ${e.hp}/${e.baseHp}`);
      parts.push(`x ${e.x} y${e.y}`);
      parts.push(`mv ${Number(e.mv[0]).toFixed(3)} y${Number(e.mv[1].toFixed(3))}`);
      parts.push(`wtr ${e.inWater} grd ${e.grounded}`);
      parts.push(" ");
    }
    const x = `${MOUSE.cell.x}`;
    const y = `${MOUSE.cell.y}`;
    const vx = `${Math.round(MOUSE.cell.velX * 100) / 100}`;
    const vy = `${Math.round(MOUSE.cell.velY * 100) / 100}`;
    let dpx = `x${x} y${y}\nvx${vx} vy${vy}`;
    const tm = MOUSE.cell.timeAlive;
    const tmStr = Math.round(tm * 10) / 10;
    parts.push(`Cell - '${MOUSE.cell.type}\n${dpx}\nTM: ${tmStr}'`);
    if (MOUSE.cell.lt !== Infinity) parts.push(`Left: ${Number(MOUSE.cell.lt - tm).toFixed(1)}s`);
    parts.push(`hp: ${MOUSE.cell.hp}/${MOUSE.cell.baseHp}`);
    if (MOUSE.cell.wet) parts.push(`Wet: ${MOUSE.cell.wet}(${MOUSE.cell.wetType})`);
    if (MOUSE.cell.inWater) parts.push(`is in Water`);
    if (MOUSE.cell.frozen) parts.push(`Frozen: ${MOUSE.cell.frozen}`);
    if (MOUSE.cell.burning) parts.push(`Burn: ${MOUSE.cell.burning}`);
    if (MOUSE.cell.selType) parts.push(`Sel: ${MOUSE.cell.selType}`);
    if (MOUSE.cell.ground) parts.push(`Ground: ${MOUSE.cell.ground.type}`);
    topNow += parts.join("\n");
  }
  if (topNow !== lastTop) {
    infoText.textContent = topNow;
    lastTop = topNow;
  }
}

function getHoveredSegment(x, y, radius, thickness, n, mx, my) {
  const dx = mx - x;
  const dy = my - y;
  const dist = Math.hypot(dx, dy);
  const inner = radius - thickness * 0.5;
  const outer = radius + thickness * 0.5;
  if (dist < inner || dist > outer) return -1;

  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI * 2;

  const step = (Math.PI * 2) / n;
  const i = Math.floor(angle / step);
  return i;
}

function drawMenuRing(ctx, x, y, radius, thickness, colors, labels) {
  const n = colors.length;
  const step = (Math.PI * 2) / n;
  const hovered = getHoveredSegment(x, y, radius, thickness, n, MOUSE.x, MOUSE.y);

  ctx.lineWidth = thickness;
  for (let i = 0; i < n; i++) {
    const a0 = i * step;
    const a1 = a0 + step;
    const mid = a0 + step * 0.5;
    ctx.beginPath();
    ctx.strokeStyle = i === hovered ? setAlpha(colors[i], 1) : setAlpha(colors[i], 0.5);
    ctx.arc(x, y, radius, a0, a1);
    ctx.stroke();
    const offset = radius + thickness * 0.25;
    const tx = x + Math.cos(mid) * offset;
    const ty = y + Math.sin(mid) * offset;
    ctx.save();
    ctx.translate(tx, ty);
    if (i < n / 2) ctx.rotate(mid - Math.PI / 2);
    else ctx.rotate(mid + Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText(labels[i].substr(0, 6), 0, 0);
    ctx.restore();
  }
  return hovered;
}

function drawRadMenu() {
  var colors = TAGS.map((t) => t.color);
  var labels = TAGS.map((t) => t.type);
  labels.splice(labels.indexOf("ALL", 1));
  colors.splice(labels.indexOf("ALL", 1));
  const rad = 60;
  const width = 100;
  const hoverIndex = drawMenuRing(ctx, RADMENU_POS[0], RADMENU_POS[1], rad, width, colors, labels);
  if (hoverIndex != -1) RADMENU_HOV_I = hoverIndex;
  var curLb = null;
  if (RADMENU_HOV_I != -1) {
    const tagType = TAGS[RADMENU_HOV_I].type;
    const lbs = [];
    const clrs = [];

    for (const key of cellKeys) {
      if (hasTag(key, tagType)) {
        lbs.push(key);
        clrs.push(CELL_PROPERTIES[key].color);
      }
    }
    if (tagType === "ENT") {
      const data = getEntFormsButtonData();
      for (const n of data) {
        lbs.push(n.key);
        clrs.push(n.color);
      }
    }
    RADMENU_SUBHOV_I = -1;
    if (lbs.length) {
      var ww = 40;
      const outerRadius = rad + width * 0.5 + ww * 0.5;
      RADMENU_SUBHOV_I = drawMenuRing(ctx, RADMENU_POS[0], RADMENU_POS[1], outerRadius, ww, clrs, lbs);
      if (RADMENU_SUBHOV_I !== -1) {
        curLb = lbs[RADMENU_SUBHOV_I];
      }
    }
  }
  if (MOUSE.clicked) {
    if (curLb) {
      if (!setNewType(curLb)) ENTINDEX = RADMENU_SUBHOV_I;
    }
    setTimeout(() => {
      RADMENU_POS = null;
    }, 100);
  }
}

function drawRing(ctx, x, y, radius, thickness, colors) {
  const n = colors.length;
  const step = (Math.PI * 2) / n;
  ctx.lineWidth = thickness;
  for (let i = 0; i < n; i++) {
    const a0 = i * step;
    const a1 = a0 + step;
    ctx.beginPath();
    ctx.strokeStyle = colors[i];
    ctx.arc(x, y, radius, a0, a1);
    ctx.stroke();
  }
}
