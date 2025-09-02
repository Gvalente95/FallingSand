function showGradial()
{
	let relY = 1 - (particle.y / CANVH);
	if (!showNoe) { console.warn(relY); showNoe = true; }
	let color = addColor(particle.color, "rgba(255, 255, 255, 1)", relY - .9);
	ctx.fillStyle = color;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let particle of activeParticles) {
		if (particle.solType == SOLID_TYPES.GAS) {
			let alpha = Math.max(0, 1 - particle.timeAlive / particle.lifeTime);
			ctx.fillStyle = `rgba(${particle.rgb}, ${alpha})`;
		}
		else if (0 && particle.solType == SOLID_TYPES.LIQUID)
			showGradial();
		else ctx.fillStyle = particle.color;
		ctx.fillRect(particle.x * PIXELSIZE, particle.y * PIXELSIZE, PIXELSIZE, PIXELSIZE);
	}
	if (!MOUSEPRESSED && MOUSEX && MOUSEY) {
		let rad = BRUSHSIZE * PIXELSIZE;
		if (BRUSHTYPE == BRUSHTYPES.DISC)
			drawCircle(MOUSEX, MOUSEY, rad / 4, null, "#575757b0", 2);
		else if (BRUSHTYPE == BRUSHTYPES.RECT)
			drawRect(MOUSEX - rad, MOUSEY - rad, rad * 2, rad * 2, null, "#575757b0",2);
	}
	if (gridMode) {ctx.drawImage(gridLayer, 0, 0);}
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
	if (color)
	{
		ctx.color = color;
		ctx.fill();
	}
	ctx.stroke();
	ctx.closePath();
}