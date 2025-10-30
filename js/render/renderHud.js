let lastTop="", lastMouse="";
let hudEvery = 4, hudTick = 0;

function updateHUD(){
	if (++hudTick % hudEvery !== 0) return;
	let topNow = `x${MOUSE.x},y${MOUSE.y}  gx${MOUSE.gridX},gy${MOUSE.gridY}\nBrush Size: ${BRUSHSIZE}\nPx Size: ${PIXELSIZE}\nPxls: ${activeCells.length}\nFrm: ${FRAME} Dt: ${Number(dt).toFixed(2)}s`;
	if (MOUSE.cell && !isMobile) {
		const x = `${MOUSE.cell.x}`;
		const y = `${MOUSE.cell.y}`;
		const vx = `${Math.round(MOUSE.cell.velX * 100) / 100}`;
		const vy = `${Math.round(MOUSE.cell.velY * 100) / 100}`;
		let dpx = `x${x} y${y}\nvx${vx} vy${vy}`;
		const tm = (MOUSE.cell.timeAlive);
		const tmStr = Math.round(tm * 10) / 10;
		const parts = [`\n\n${MOUSE.cell.type}\n${dpx}\nTM: ${tmStr}`];
		if (MOUSE.cell.lt !== Infinity) parts.push(`Left: ${Number(MOUSE.cell.lt - tm).toFixed(1)}s`);
		if (MOUSE.cell.wet) parts.push(`Wet: ${MOUSE.cell.wet}(${MOUSE.cell.wetType})`);
		if (MOUSE.cell.frozen) parts.push(`Frozen: ${MOUSE.cell.frozen}`);
		if (MOUSE.cell.burning) parts.push(`Burn: ${MOUSE.cell.burning}`);
		if (MOUSE.cell.selType) parts.push(`Sel: ${MOUSE.cell.selType}`);
		if (MOUSE.cell.ground) parts.push(`Ground: ${MOUSE.cell.ground.type}`);
		topNow += parts.join('\n');
	}
	if (topNow !== lastTop) { infoText.textContent = topNow; lastTop = topNow; }
}
