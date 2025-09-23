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

function drawSnowflake(prt, x, y, color, size) {
	ctx.fillStyle = color;
	let rx = x * PIXELSIZE;
	let ry = y * PIXELSIZE;
	switch (prt.variant) {
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
function showParticle(prt, x, y, alpha, size) {
	let color = prt.color;
	if (prt.type === 'SNOW') {
		drawSnowflake(prt, x, y, color, size);
		return;
	}
	if (prt.expl && !prt.frozen && prt.lt != Infinity) {
		let timeLeft = prt.lt - prt.timeAlive;
		color = addColor(PARTICLE_PROPERTIES[prt.type].color, 'rgb(255, 0, 0)', 1 - (timeLeft / prt.lt));
	}
	if (prt.isShroom && !prt.isLoop && prt.isHead) {
		let px = atI(ROWOFF[y - 1] + x, prt);
		if (px && px.type == prt.type) {
			ctx.fillStyle = prt.baseColor;
			ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, size, size);
			return;
		}
		showShroomHead(prt, x, y);
		return;
	}
	if ((prt.type === 'GLASS' || prt.type === 'ICE') && dice(50000)) color = 'rgba(255, 255, 255, 1)';
	if (prt.fin || prt.fout && Number.isFinite(prt.lt)) {
		const aIn  = prt.fin  ? Math.min(1, prt.timeAlive / prt.fin) : 1;
		const aOut = prt.fout && Number.isFinite(prt.lt) ? Math.max(0, Math.min(1, (prt.lt - prt.timeAlive) / prt.fout)) : 1;
		alpha = Math.min(aIn, aOut);
	}
	if (prt.type === 'CLOUD' || prt.type === 'SMOKE') {
		let fAlpha = Math.min(alpha, prt.alpha);
		let clr = setAlpha(prt.baseColor, fAlpha);
		drawParticleCircle(x * PIXELSIZE - prt.size, y * PIXELSIZE - prt.size, prt.size * 2, clr);
		return;
	}
	if (alpha != 1) color = `rgba(${prt.rgb}, ${alpha})`;
	else if (prt.isWater && !prt.frozen) color = waterShades[prt.y].color;
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
	for (let i = 0; i < activeParticles.length; i++) showParticle(activeParticles[i], activeParticles[i].x, activeParticles[i].y, 1, showSize);
	renderBrush();
	FRAME++;
	if (SHOWHUD) updateHUD();
}
