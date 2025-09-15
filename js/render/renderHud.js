let lastTop="", lastMouse="";
let hudEvery = 4, hudTick = 0;

function updateHUD(){
	if (++hudTick % hudEvery !== 0) return;
	const topNow = `x${MOUSEX},y${MOUSEY}  gx${MOUSEGRIDX},gy${MOUSEGRIDY}\nBrush Size: ${BRUSHSIZE}\nPxls: ${activeParticles.length}\nFrm: ${FRAME} Dt: ${Number(dt).toFixed(2)}s`;
	if (topNow !== lastTop) { infoText.textContent = topNow; lastTop = topNow; }

	if (PXATMOUSE && !isMobile) {
	const x  = `${PXATMOUSE.x}`;
	const y  = `${PXATMOUSE.y}`;
	const vx = `${Math.round(PXATMOUSE.velX * 100) / 100}`;
	const vy = `${Math.round(PXATMOUSE.velY * 100) / 100}`;
	let dpx = `x${x} y${y}\nvx${vx} vy${vy}`;
	const tm = (PXATMOUSE.timeAlive);
	const tmStr = Math.round(tm*10)/10;
	const parts = [`${PXATMOUSE.type}\n${dpx}\nTM: ${tmStr}`];
	if (PXATMOUSE.lt !== Infinity) parts.push(`Left: ${Number(PXATMOUSE.lt - tm).toFixed(1)}s`);
	if (PXATMOUSE.wet)            parts.push(`Wet: ${PXATMOUSE.wet}(${PXATMOUSE.wetType})`);
	if (PXATMOUSE.frozen)         parts.push(`Frozen: ${PXATMOUSE.frozen}`);
	if (PXATMOUSE.burning) parts.push(`Burn: ${PXATMOUSE.burning}`);
	if (PXATMOUSE.selType)        parts.push(`Sel: ${PXATMOUSE.selType}`);
	if (PXATMOUSE.ground) parts.push(`Ground: ${PXATMOUSE.ground.type}`);
	const mouseNow = parts.join("\n");
	if (mouseNow !== lastMouse) { infoMouse.textContent = mouseNow; lastMouse = mouseNow; }
	} else if (lastMouse !== "") { infoMouse.textContent = ""; lastMouse = ""; }
}
