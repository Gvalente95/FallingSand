let waterShades = [];

function buildWaterShades() {
    waterShades = new Array(GH);

    for (let y = 0; y < GH; y++) {
        const ny = y / GH;
        const r = Math.round(5 + 40 * (1 - ny));
        const g = Math.round(60 + 200 * (1 - ny));
        const b = Math.round(90 + 120 * (1 - ny));
        waterShades[y] = {
            rgb: [r, g, b],
            color: `rgba(${r},${g},${b},1)`
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
	for (let yy = 0; yy < h; yy++){
		let drawX = startX * PIXELSIZE;
		let drawY = startY * PIXELSIZE;
		ctx.fillStyle = baseColor;
		ctx.fillRect(drawX, drawY, curW * PIXELSIZE, PIXELSIZE);
		startX--;
		startY++;
		curW += 2;
	}
}

function renderBrush() {
	if (!settingBrushSize) {
		if (isMobile) { if (!MOUSE.pressed && !BRUSHACTION) return;}
		else if (MOUSE.pressed || !SHOWBRUSH) { return; }
		if (MOUSE.x < 0 || MOUSE.x > canvas.width || MOUSE.y < 0 || MOUSE.y > canvas.height) return;
	}
	let px = settingBrushSize ? CANVW / 2 : MOUSE.gridX * PIXELSIZE; py = settingBrushSize ? CANVH / 2 : MOUSE.gridY * PIXELSIZE;
	let rad = BRUSHSIZE * PIXELSIZE;
	let color = BRUSHACTION ? "#ffffff39" : setBrightness(BRUSHCOLOR);
	let fillColor = BRUSHACTION ? 'rgba(71, 67, 67, 0.31)' : 'rgba(0, 0, 0, 0.1)';
	if (BRUSHTYPE == BRUSHTYPES.DISC)
		drawCircle(px, py, rad / 4, fillColor, color);
	else if (BRUSHTYPE == BRUSHTYPES.RECT)
		drawRect(px - rad, py - rad, rad * 2, rad * 2, fillColor, color, 2);
}

function drawRect(x, y, width, height, color, strokeColor, lineWidth) {
    ctx.lineWidth = lineWidth || 1;

    if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.strokeRect(x, y, width, height);
        }
    } else if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(x, y, width, height);
    }
}

function drawCellCircle(x, y, radius, color = 'rgba(255,255,255,1)') {
	const grad = ctx.createRadialGradient(x, y, radius * 0.6, x, y, radius);
	grad.addColorStop(0, color);
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, 2 * Math.PI);
	ctx.fillStyle = grad;
	ctx.fill();
}

function drawCircle(x, y, radius, color, strokeColor, lineWidth) {
	ctx.beginPath();
	ctx.arc(x, y, radius * 4, 0, 2 * Math.PI);
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lineWidth;
	if (color) { ctx.fillStyle = color; ctx.fill(); }
	ctx.stroke();
	ctx.closePath();
}

function drawSnowflake(cell, x, y, color, size) {
	ctx.fillStyle = color;
	let rx = x * PIXELSIZE;
	let ry = y * PIXELSIZE;
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

var prevCtx = null;
function showCell(cell, x, y, alpha, size) {
	let color = cell.color;
	if (cell.type === 'SNOW') {
		drawSnowflake(cell, x, y, color, size);
		return;
	}
	if (cell.expl && !cell.frozen && cell.lt != Infinity) {
		let timeLeft = cell.lt - cell.timeAlive;
		color = addColor(CELL_PROPERTIES[cell.type].color, 'rgb(255, 0, 0)', 1 - (timeLeft / cell.lt));
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
	if ((cell.type === 'GLASS' || cell.type === 'ICE') && dice(50000)) color = 'rgba(255, 255, 255, 1)';
	if (cell.fin || cell.fout && Number.isFinite(cell.lt)) {
		const aIn  = cell.fin  ? Math.min(1, cell.timeAlive / cell.fin) : 1;
		const aOut = cell.fout && Number.isFinite(cell.lt) ? Math.max(0, Math.min(1, (cell.lt - cell.timeAlive) / cell.fout)) : 1;
		alpha = Math.min(aIn, aOut);
	}
	if (cell.type === 'CLOUD' || cell.type === 'SMOKE') {
		let fAlpha = Math.min(alpha, cell.alpha);
		let clr = setAlpha(cell.baseColor, fAlpha);
		drawCellCircle(x * PIXELSIZE - cell.size, y * PIXELSIZE - cell.size, cell.size * 2, clr);
		return;
	}
	if (alpha != 1) color = `rgba(${cell.rgb}, ${alpha})`;
	else if (cell.isWater && !cell.frozen) color = waterShades[cell.y].color;
	if (prevCtx != color) {
		ctx.fillStyle = color;
		prevCtx = color;
	}
	ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
}

function render() {
	prevCtx = null;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let showSize = PIXELSIZE;
	let isGridding = (gridMode || isWheeling);
	if (isGridding) {
		showSize--;
		ctx.drawImage(gridLayer, 0, 0);
	}
	for (let i = 0; i < activeCells.length; i++) {
		let px = activeCells[i];
		if (px.type !== "PLAYER")
			showCell(px, px.x, px.y, 1, showSize);
	}
	if (PLAYER)
		PLAYER.render(showSize);
	renderBrush();
	FRAME++;
	if (SHOWHUD) updateHUD();
}

function captureScreenshot() {
  const color = "rgba(0, 0, 0, 0.51)";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const showSize = PIXELSIZE;
  for (let i = 0; i < activeCells.length; i++) {
    const px = activeCells[i];
    if (px.type !== "PLAYER")
      showCell(px, px.x, px.y, 1, showSize);
  }
  if (PLAYER)
    PLAYER.render(showSize);
}