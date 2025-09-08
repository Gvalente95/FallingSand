function showGradial()
{
	let relY = 1 - (particle.y / CANVH);
	if (!showNoe) { console.warn(relY); showNoe = true; }
	let color = addColor(particle.color, "rgba(255, 255, 255, 1)", relY - .9);
	ctx.fillStyle = color;
}

function showShroomHead(prt, x, y) {
	prt.isLoop = 1;
	showParticle(prt, x - 1, y, 1, 'rgba(159, 47, 47, 1)');
	showParticle(prt, x + 1, y, 1, 'rgba(150, 39, 39, 0.99)');
	showParticle(prt, x, y - 1, 1, 'rgba(143, 46, 46, 1)');
	prt.isLoop = 0;
}

function showParticle(prt, x, y, alpha, color = prt.color) {
	if (p.frozen) color = addColor(color, 'rgba(146, 195, 205, 1)', .4);
	if (prt.type == 'SHROOM' && prt.digType) color = addColor(PARTICLE_PROPERTIES[prt.digType].color, 'rgba(0,0,0,1)', .1);
	if (prt.type == 'SHROOM' && prt.isGrower && !prt.isLoop && !prt.parent && prt.hasTouchedBorder) {
		let px = pxAtP(x, y - 1, prt);
		if (px && px.type == prt.type) {
			ctx.fillStyle = prt.digType ? color : 'rgba(33, 132, 64, 1)';
			ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, PIXELSIZE, PIXELSIZE);
			return;
		}
		showShroomHead(prt, x, y);
	}
	// else if (prt.type == 'PLANT' && !prt.isLoop && !prt.parent) showShroomHead(prt, x, y);
	if (prt.physT == 'GAS') alpha = Math.max(0, 1 - prt.timeAlive / prt.lt);
	ctx.fillStyle = ((prt.type == 'WATER' && !prt.frozen) ? waterShades[prt.y].color : color);
	if (alpha != 1) ctx.fillStyle = `rgba(${prt.rgb}, ${alpha})`;
	ctx.fillRect(x * PIXELSIZE, y * PIXELSIZE, PIXELSIZE, PIXELSIZE);
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of activeParticles) showParticle(p, p.x, p.y, 1);
	if (((settingBrushSize) || (!isMobile && !MOUSEPRESSED) || (isMobile && MOUSEPRESSED))) {
		let px = settingBrushSize ? CANVW / 2 : MOUSEGRIDX * PIXELSIZE; py = settingBrushSize ? CANVH / 2 : MOUSEGRIDY * PIXELSIZE;
		let rad = BRUSHSIZE * PIXELSIZE;
		let color = BRUSHCOLOR ? setAlpha(BRUSHCOLOR, .5) : null;
		if (BRUSHTYPE == BRUSHTYPES.DISC)
			drawCircle(px, py, rad / 4, color, "#575757b0", 2);
		else if (BRUSHTYPE == BRUSHTYPES.RECT)
			drawRect(px - rad, py - rad, rad * 2, rad * 2, color, "#575757b0", 2);
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

function drawCircle(x, y, radius, color, strokeColor, lineWidth) {
	ctx.beginPath();
	ctx.arc(x, y, radius * 4, 0, 2 * Math.PI);
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lineWidth;
	if (color) { ctx.fillStyle = color; ctx.fill(); }
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
