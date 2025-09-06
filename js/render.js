function showGradial()
{
	let relY = 1 - (particle.y / CANVH);
	if (!showNoe) { console.warn(relY); showNoe = true; }
	let color = addColor(particle.color, "rgba(255, 255, 255, 1)", relY - .9);
	ctx.fillStyle = color;
}

function showParticle(particle, x, y, alpha) {
	if (particle.physT == 'GAS')
		alpha = Math.max(0, 1 - particle.timeAlive / particle.lt);
	ctx.fillStyle = ((particle.type == 'WATER' && !particle.frozen) ? waterShades[particle.y].color : particle.color);
	if (alpha != 1) ctx.fillStyle = `rgba(${particle.rgb}, ${alpha})`;
	ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, PIXELSIZE, PIXELSIZE);
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of activeParticles) showParticle(p, p.x, p.y, 1);
	if (((settingBrushSize) || (!isMobile && !MOUSEPRESSED) || (isMobile && MOUSEPRESSED))) {
		let px = settingBrushSize ? CANVW / 2 : MOUSEX; py = settingBrushSize ? CANVH / 2 : MOUSEY;
		let rad = BRUSHSIZE * PIXELSIZE;
		if (BRUSHTYPE == BRUSHTYPES.DISC)
			drawCircle(px, py, rad / 4, null, "#575757b0", 2);
		else if (BRUSHTYPE == BRUSHTYPES.RECT)
			drawRect(px - rad, py - rad, rad * 2, rad * 2, null, "#575757b0", 2);
	}
	if (gridMode) { ctx.drawImage(gridLayer, 0, 0); }

	if(PXATMOUSE) infoMouse.style.color = PXATMOUSE.color;
	infoText.textContent = `x${MOUSEX},y${MOUSEY} ${'   '}	Pxls: ${activeParticles.length} Tm:${time} Fps:${fps}`;
	infoMouse.textContent = PXATMOUSE ?
		`Elem: ${PXATMOUSE.type} - 
		TimeAlive: ${Number(PXATMOUSE.timeAlive / 1000).toFixed(1)}` : '';
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

function drawCircle(x, y, radius, color, strokeColor, lineWidth)
{
	ctx.beginPath();
	ctx.arc(x, y, radius * 4, 0, 2 * Math.PI);
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lineWidth;
	if (color){ ctx.color = color; ctx.fill();}
	ctx.stroke();
	ctx.closePath();
}

let waterShades = [];

function	buildWaterShades() {
    waterShades = new Array(GRIDH);

    for (let y = 0; y < GRIDH; y++) {
        const ny = y / GRIDH;
        const r = Math.round(10 + 20 * (1 - ny));
        const g = Math.round(120 + 100 * (1 - ny));
        const b = Math.round(180 + 60 * (1 - ny));
        waterShades[y] = {
            rgb: [r, g, b],
            color: `rgba(${r},${g},${b},1)`
        };
    }
}
