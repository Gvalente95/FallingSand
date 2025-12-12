function getWaterColor(y) {
  if (!y || y === undefined) return waterShades[0].color;
  return waterShades[clamp(Math.round(y), 0, GH - 1)].color;
}

function buildWaterShades() {
  waterShades = new Array(GH);

  for (let y = 0; y < GH; y++) {
    const ny = y / GH;
    const r = Math.round(5 + 40 * (1 - ny));
    const g = Math.round(60 + 200 * (1 - ny));
    const b = Math.round(90 + 120 * (1 - ny));
    waterShades[y] = {
      rgb: [r, g, b],
      color: `rgba(${r},${g},${b},1)`,
    };
  }
}

function showShroomHead(cell, x, y) {
  let h = clamp(cell.heigth / 10, 1, 3);
  let w = Math.round(h * 2.5);
  let baseColor = cell.headColor;
  let startY = y - h + 1;
  let startX = x - w / 2;
  let curW = w;
  for (let yy = 0; yy < h; yy++) {
    const scr = toScrn([startX * PIXELSIZE, startY * PIXELSIZE]);
    let drawX = scr[0];
    let drawY = scr[1];
    ctx.fillStyle = baseColor;
    ctx.fillRect(drawX, drawY, curW * PIXELSIZE, PIXELSIZE);
    startX--;
    startY++;
    curW += 2;
  }
}

function renderBrush() {
  if (inPrompt) return;
  if (!settingBrushSize) {
    if (isMobile) {
      if (!MOUSE.pressed && !BRUSHACTION) return;
    } else if (MOUSE.pressed || !SHOWBRUSH) {
      return;
    }
    if (MOUSE.x < 0 || MOUSE.x > canvas.width || MOUSE.y < 0 || MOUSE.y > canvas.height) return;
  }
  let px = settingBrushSize ? CANVW / 2 : MOUSE.gx * PIXELSIZE;
  py = settingBrushSize ? CANVH / 2 : MOUSE.gy * PIXELSIZE;
  let rad = BRUSHSIZE * PIXELSIZE;
  let color = BRUSHACTION ? "#ffffff39" : setAlpha(BRUSHCOLOR, 0.2);
  let fillColor = BRUSHACTION ? "rgba(71, 67, 67, 0.31)" : "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 2;
  if (BRUSHTYPE == BRUSHTYPES.DISC) drawRing(ctx, px, py, rad, 2, [color]);
  else if (BRUSHTYPE == BRUSHTYPES.RECT) drawRect(px - rad, py - rad, rad * 2, rad * 2, fillColor, color, 2);
}

function drawSnowflake(cell, x, y, color, size) {
  ctx.fillStyle = color;
  let rx = x * PIXELSIZE;
  let ry = y * PIXELSIZE;
  const scr = toScrn([rx, ry]);
  rx = scr[0];
  ry = scr[1];
  switch (cell.variant) {
    case 1:
      ctx.fillRect(rx - size, ry, size * 3, size);
      ctx.fillRect(rx, ry - size, size, size * 3);
      break;
    case 2:
      ctx.fillRect(rx - size, ry - size, size, size);
      ctx.fillRect(rx + size, ry + size, size, size);
      ctx.fillRect(rx + size, ry - size, size, size);
      ctx.fillRect(rx - size, ry + size, size, size);
      ctx.fillRect(rx, ry, size, size);
      break;
    case 3:
      ctx.fillRect(rx, ry - size * 2, size, size * 5);
      ctx.fillRect(rx - size, ry, size * 3, size);
      break;
    default:
      ctx.fillRect(rx - size, ry, size * 3, size);
      ctx.fillRect(rx, ry - size, size, size * 3);
      break;
  }
}

function showCell(cell, x, y, alpha, size) {
  let color = cell.color;
  if (cell.burning) {
    color = addColor(color, "rgba(229, 109, 23, 1)", clamp((50 - cell.burning) / 50, 0.1, 1));
  }
  if (cell.inWater) {
    ctx.fillStyle = color;
    {
      const scr = toScrn([x * PIXELSIZE, y * PIXELSIZE]);
      ctx.fillRect(scr[0], scr[1], size, size);
    }
    x += Math.cos(FRAME * 0.1 + x * 0.3) * 1;
  }
  if (cell.isProjectile) {
    const back = [cell.x - cell.velX * 1, cell.y - cell.velY * 1];
    const p1 = toScrn([back[0] * PIXELSIZE, back[1] * PIXELSIZE]);
    const p2 = toScrn([cell.x * PIXELSIZE, cell.y * PIXELSIZE]);
    drawLine(ctx, p1, p2, color, 2);
    return;
  }
  if (cell.type === "SNOW") {
    drawSnowflake(cell, x, y, color, size);
    return;
  }
  if (cell.expl && !cell.frozen && cell.lt != Infinity) {
    let timeLeft = cell.lt - cell.timeAlive;
    color = addColor(CELL_PROPERTIES[cell.type].color, "rgb(255, 0, 0)", 1 - timeLeft / cell.lt);
  }
  if (cell.isShroom && !cell.isLoop && cell.isHead) {
    let px = atI(ROWOFF[y - 1] + x, cell);
    if (px && px.type == cell.type) {
      ctx.fillStyle = cell.baseColor;
      ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
      return;
    }
    showShroomHead(cell, x, y);
    return;
  }
  if ((cell.type === "GLASS" || cell.type === "ICE") && dice(50000)) color = "rgba(255, 255, 255, 1)";
  if (cell.fin || (cell.fout && Number.isFinite(cell.lt))) {
    const aIn = cell.fin ? Math.min(1, cell.timeAlive / cell.fin) : 1;
    const aOut = cell.fout && Number.isFinite(cell.lt) ? Math.max(0, Math.min(1, (cell.lt - cell.timeAlive) / cell.fout)) : 1;
    alpha = Math.min(aIn, aOut);
  }
  if (cell.type === "CLOUD" || cell.type === "SMOKE") {
    let fAlpha = Math.min(alpha, cell.alpha);
    let clr = setAlpha(cell.baseColor, fAlpha);
    {
      const scr = toScrn([x * PIXELSIZE - cell.size, y * PIXELSIZE - cell.size]);
      drawCellCircle(scr[0], scr[1], cell.size * 2, clr);
    }
    return;
  }
  //   if (alpha != 1) color = `rgba(${cell.rgb}, ${alpha})`;
  if (cell.isWater && !cell.frozen) {
    color = getWaterColor(y);
  }
  if (alpha != 1) color = setAlpha(color, alpha);
  if (cell.isAsleep && DEBUG) color = "red";
  if (prevCtx != color) {
    ctx.fillStyle = color;
    prevCtx = color;
  }
  {
    const scr = toScrn([x * PIXELSIZE, y * PIXELSIZE]);
    ctx.fillRect(scr[0], scr[1], size, size);
  }
}

function applyVignette() {
  if (!lightSources.length || OBSCURITY <= 0) return;

  vignetteCanvas.width = canvas.width;
  vignetteCanvas.height = canvas.height;
  vignetteCtx.clearRect(0, 0, vignetteCanvas.width, vignetteCanvas.height);

  var vignColor = "rgba(0,0,0,1)";
  vignetteCtx.fillStyle = setAlpha(vignColor, OBSCURITY);
  vignetteCtx.fillRect(0, 0, vignetteCanvas.width, vignetteCanvas.height);
  vignetteCtx.globalCompositeOperation = "destination-out";

  for (let i = 0; i < lightSources.length; i++) {
    const l = lightSources[i];
    const rOuter = l.r * 1.8;
    const rInner = rOuter * 0.1;
    const rMid1 = rOuter * 0.4;
    const rMid2 = rOuter * 0.85;
    const scr = toScrn([l.x, l.y]);
    const g = vignetteCtx.createRadialGradient(scr[0], scr[1], 0, scr[0], scr[1], rOuter);
    g.addColorStop(0, vignColor); // fully opaque at center (will be removed by destination-out)
    g.addColorStop(rInner / rOuter, setAlpha(vignColor, 0.85));
    g.addColorStop(rMid1 / rOuter, setAlpha(vignColor, 0.7));
    g.addColorStop(rMid2 / rOuter, setAlpha(vignColor, 0.3));
    g.addColorStop(1, "rgba(0,0,0,0)"); // fully transparent at edge
    vignetteCtx.fillStyle = g;
    vignetteCtx.beginPath();
    vignetteCtx.arc(scr[0], scr[1], rOuter, 0, Math.PI * 2);
    vignetteCtx.fill();
  }
  vignetteCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(vignetteCanvas, 0, 0);
}

function drawFx(fx) {
  render._tmp ||= document.createElement("canvas");
  const t = render._tmp;
  t.width = canvas.width;
  t.height = canvas.height;
  const k = t.getContext("2d");
  k.clearRect(0, 0, t.width, t.height);
  k.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = fx;
  ctx.drawImage(t, 0, 0);
  ctx.filter = "none";
}

const bgrClr = "rgba(94, 127, 154, 1)";
var groundLevel;
function render(fx = null) {
  const offY = -CAM.scroll[1];
  groundLevel = canvas.height + offY;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  const groundStop = clamp(groundLevel / canvas.height, 0, 1);
  gradient.addColorStop(Math.max(0, groundStop - 0.001), bgrClr);
  gradient.addColorStop(Math.min(1, groundStop + 0.001), "rgba(85, 71, 32, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const showSize = PIXELSIZE;
  const isGridding = gridMode || isWheeling;
  if (isGridding) {
    const scr = toScrn([0, 0]);
    ctx.drawImage(gridLayer, scr[0], scr[1]);
  }
  lightSources.length = 0;
  for (let i = 0; i < activeCells.length; i++) {
    const px = activeCells[i];
    if (!px.ent) showCell(px, px.x, px.y, 1, showSize);
    if (OBSCURITY <= 0) continue;
    if ((px.ent && px.ent.type === "Collectible") || (hasTag(px.type, "HEAT") && px.neighborCount <= 6)) {
      lightSources.push({
        x: px.x * PIXELSIZE + PIXELSIZE * 0.5 || 1,
        y: px.y * PIXELSIZE + PIXELSIZE * 0.5 || 1,
        r: 8,
      });
    }
  }
  for (let i = 0; i < entities.length; i++) entities[i].render(showSize);
  if (PLAYER) {
    const PLR_CENTER = [(PLAYER.x + PLAYER.w / 2) * PIXELSIZE, (PLAYER.y + PLAYER.h / 2) * PIXELSIZE];
    CAM.center(PLR_CENTER, 0.2);
    PLAYER.render(showSize);
    if (OBSCURITY > 0) {
      lightSources.push({
        x: PLR_CENTER[0] + PIXELSIZE * 0.5,
        y: PLR_CENTER[1] + PIXELSIZE * 0.5,
        r: 100,
      });
    }
  }
  applyVignette();

  // Re-render flashlight on top of vignette
  if (PLAYER && OBSCURITY > 0) {
    PLAYER.drawFlashRays();
  }

  if (INPUT.selBox) {
    ctx.fillStyle = setAlpha(CELL_PROPERTIES[cellKeys[TYPEINDEX]].color, 0.8);
    let x = Math.min(INPUT.selBox[0], MOUSE.gx) * PIXELSIZE;
    let y = Math.min(INPUT.selBox[1], MOUSE.gy) * PIXELSIZE;
    const w = Math.abs(INPUT.selBox[0] - MOUSE.gx) * PIXELSIZE;
    const h = Math.abs(INPUT.selBox[1] - MOUSE.gy) * PIXELSIZE;
    const scr = toScrn([x, y]);
    x = scr[0];
    y = scr[1];
    ctx.fillRect(x, y, w, h);
  }
  if (SEL_LINE_START) {
    const p1 = toScrn(SEL_LINE_START);
    const p2 = [MOUSE.x, MOUSE.y]; // already screen coords
    drawLine(ctx, p1, p2, BRUSHCOLOR, PIXELSIZE * BRUSHSIZE * 2);
  }
  renderBrush();
  FRAME++;
  if (SHOWHUD) updateHUD();
  if (RADMENU_POS) drawRadMenu();

  if (fx) drawFx(fx);
  const auPos = [20, 50];
  var auSize = 20;
  if (pointInRect([MOUSE.x, MOUSE.y], auPos, [20, 20])) {
    if (MOUSE.clicked) au.active = !au.active;
    auSize *= 1.4;
    auPos[0] -= auSize * 0.1;
    auPos[1] -= auSize * 0.2;
  }
  drawRect(MOUSE.x - 6, MOUSE.y - 1, 13, 3, "rgba(141, 141, 141, 0.34)");
  drawRect(MOUSE.x - 1, MOUSE.y - 6, 3, 13, "rgba(141, 141, 141, 0.34)");

  ctx.drawImage(au.active ? auImg : muteImg, auPos[0], auPos[1], auSize, auSize);
}

function captureScreenshot() {
  const color = "rgba(43, 39, 39, 0.85)";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const showSize = PIXELSIZE;
  for (let i = 0; i < activeCells.length; i++) {
    const px = activeCells[i];
    if (px.type !== "ENTITY") showCell(px, px.x, px.y, 1, showSize);
  }
  if (PLAYER) PLAYER.render(showSize);
  for (let i = 0; i < entities.length; i++) entities[i].render(showSize);
}
