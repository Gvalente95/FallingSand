let waterShades = [];
function	buildWaterShades() {
    waterShades = new Array(GH);

    for (let y = 0; y < GH; y++) {
        const ny = y / GH;
        const r = Math.round(10 + 20 * (1 - ny));
        const g = Math.round(120 + 100 * (1 - ny));
        const b = Math.round(180 + 60 * (1 - ny));
        waterShades[y] = {
            rgb: [r, g, b],
            color: `rgba(${r},${g},${b},1)`
        };
    }
}

function showShroomHead(prt, x, y) {
	let h = clamp(prt.heigth / 10, 2, 6);
	let w = Math.round(h * .75);

	let baseColor = prt.headColor;

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
	if (MOUSEX < 0 || MOUSEX > canvas.width || MOUSEY < 0 || MOUSEY > canvas.height) return;
	if (!settingBrushSize && BRUSHTYPE != 'PICK' && (MOUSEPRESSED || !SHOWBRUSH)) return;
	let px = settingBrushSize ? CANVW / 2 : MOUSEGRIDX * PIXELSIZE; py = settingBrushSize ? CANVH / 2 : MOUSEGRIDY * PIXELSIZE;
	let rad = BRUSHSIZE * PIXELSIZE;
	let color = BRUSHCOLOR ? setBrightness(BRUSHCOLOR) : "#ffffff39";
	if (BRUSHTYPE == BRUSHTYPES.DISC)
		drawCircle(px, py, rad / 4, 'rgba(0, 0, 0, 0.1)', color);
	else if (BRUSHTYPE == BRUSHTYPES.RECT)
		drawRect(px - rad, py - rad, rad * 2, rad * 2, null, color, 2);
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

function drawCircle(x, y, radius, color, strokeColor, lineWidth) {
	ctx.beginPath();
	ctx.arc(x, y, radius * 4, 0, 2 * Math.PI);
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lineWidth;
	if (color) { ctx.fillStyle = color; ctx.fill(); }
	ctx.stroke();
	ctx.closePath();
}

function showParticle(prt, x, y, alpha, size) {
	color = prt.color;
	if (prt.expl && !prt.frozen && prt.lt != Infinity) {
		let timeLeft = prt.lt - prt.timeAlive;
		color = addColor(PARTICLE_PROPERTIES[prt.type].color, 'rgba(255, 0, 0, 1)', 1 - (timeLeft / prt.lt));
	}
	if (prt.isShroom && prt.digType) color = PARTICLE_PROPERTIES[prt.digType].color;
	if (prt.isShroom && prt.isGrower && !prt.isLoop && !prt.parent && prt.hasTouchedBorder) {
		let px = atI(ROWOFF[y - 1] + x, prt);
		if (px && px.type == prt.type) {
			ctx.fillStyle = prt.digType ? color : prt.baseColor;
			ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
			return;
		}
		showShroomHead(prt, x, y);
		return;
	}
	if (prt.physT == 'GAS') alpha = Math.max(0, 1 - prt.timeAlive / prt.lt);
	if (alpha != 1) ctx.fillStyle = `rgba(${prt.rgb}, ${alpha})`;
	else if (prt.isWater && !prt.frozen) ctx.fillStyle = waterShades[prt.y].color;
	else ctx.fillStyle = color;
	ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
}

function render() {
	let showSize = PIXELSIZE;
	if (gridMode) showSize--;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < activeParticles.length; i++) showParticle(activeParticles[i], activeParticles[i].x, activeParticles[i].y, 1, showSize);
	if (KEYS['Shift']) { ctx.drawImage(gridLayer, 0, 0); }
	renderBrush();
	updateHUD();
}