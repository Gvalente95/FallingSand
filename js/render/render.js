let waterShades = [];
function	buildWaterShades() {
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

function showShroomHead(prt, x, y) {
	let h = clamp(prt.heigth / 10, 1, 3);
	let w = Math.round(h * 2.5);

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
	if (!settingBrushSize) {
		if (isMobile) { if (!MOUSEPRESSED && !BRUSHACTION) return;}
		else if (MOUSEPRESSED || !SHOWBRUSH) { return; }
		if (MOUSEX < 0 || MOUSEX > canvas.width || MOUSEY < 0 || MOUSEY > canvas.height) return;
	}
	let px = settingBrushSize ? CANVW / 2 : MOUSEGRIDX * PIXELSIZE; py = settingBrushSize ? CANVH / 2 : MOUSEGRIDY * PIXELSIZE;
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

function drawParticleCircle(x, y, radius, color = 'rgba(255,255,255,1)') {
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

function showParticle(prt, x, y, alpha, size) {
	color = prt.color;
	if (prt.expl && !prt.frozen && prt.lt != Infinity) {
		let timeLeft = prt.lt - prt.timeAlive;
		color = addColor(PARTICLE_PROPERTIES[prt.type].color, 'rgba(255, 0, 0, 1)', 1 - (timeLeft / prt.lt));
	}
	if (prt.isShroom && prt.digType) color = PARTICLE_PROPERTIES[prt.digType].color;
	if (prt.isShroom && !prt.isLoop && prt.isHead) {
		let px = atI(ROWOFF[y - 1] + x, prt);
		if (px && px.type == prt.type) {
			ctx.fillStyle = prt.digType ? color : prt.baseColor;
			ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
			return;
		}
		showShroomHead(prt, x, y);
		return;
	}
	const aIn  = prt.fin  ? Math.min(1, prt.timeAlive / prt.fin) : 1;
	const aOut = prt.fout && Number.isFinite(prt.lt) ? Math.max(0, Math.min(1, (prt.lt - prt.timeAlive) / prt.fout)) : 1;
	alpha = Math.min(aIn, aOut);

	if (prt.type === 'CLOUD') {
		let fAlpha = Math.min(alpha, prt.alpha);
		let clr = setAlpha(prt.baseColor, fAlpha);
		drawParticleCircle(x * PIXELSIZE - prt.size, y * PIXELSIZE - prt.size, prt.size * 2, clr);
		return;
	}
	if (alpha != 1) ctx.fillStyle = `rgba(${prt.rgb}, ${alpha})`;
	else if (prt.isWater && !prt.frozen) ctx.fillStyle = waterShades[prt.y].color;
	else ctx.fillStyle = color;
	ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
}

function render() {
	let showSize = PIXELSIZE;
	let isGridding = (gridMode || isWheeling);
	if (isGridding) showSize--;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (isGridding) { ctx.drawImage(gridLayer, 0, 0); }
	for (let i = 0; i < activeParticles.length; i++) showParticle(activeParticles[i], activeParticles[i].x, activeParticles[i].y, 1, showSize);
	renderBrush();
	if (SHOWHUD) updateHUD();
}