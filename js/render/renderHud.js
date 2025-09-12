let lastTop="", lastMouse="";
let hudEvery = 4, hudTick = 0;

function updateHUD(){
  if (++hudTick % hudEvery !== 0) return;

  const topNow = `x${MOUSEX},y${MOUSEY} gx${MOUSEGRIDX},gy${MOUSEGRIDY}  Pxls: ${activeParticles.length} Tm:${time} Fps:${fps}`;
  if (topNow !== lastTop) { infoText.textContent = topNow; lastTop = topNow; }

  if (PXATMOUSE && !isMobile) {
    const tm = (PXATMOUSE.timeAlive);
    const tmStr = Math.round(tm*10)/10;
    const parts = [
      `Elem: ${PXATMOUSE.type}`,
      `TM: ${tmStr}`
    ];
    if (PXATMOUSE.lt !== Infinity) parts.push(`Left: ${PXATMOUSE.lt - PXATMOUSE.timeAlive}`);
    if (PXATMOUSE.wet)            parts.push(`Wet: ${PXATMOUSE.wet}(${PXATMOUSE.wetType})`);
    if (PXATMOUSE.frozen)         parts.push(`Frozen: ${PXATMOUSE.frozen}`);
	if (PXATMOUSE.burning) parts.push(`Burn: ${PXATMOUSE.burning}`);
    if (PXATMOUSE.ground)        parts.push(`Ground: ${PXATMOUSE.ground.type}`);
    const x  = `${PXATMOUSE.x}`.padStart(3);
    const y  = `${PXATMOUSE.y}`.padStart(3);
    const vx = `${Math.round(PXATMOUSE.velX*100)/100}`.padStart(5);
    const vy = `${Math.round(PXATMOUSE.velY*100)/100}`.padStart(5);
    parts.push(`x${x} y${y} vx${vx} vy${vy}`);
    const mouseNow = parts.join("\n");
    if (mouseNow !== lastMouse) { infoMouse.textContent = mouseNow; lastMouse = mouseNow; }
  } else if (lastMouse !== "") { infoMouse.textContent = ""; lastMouse = ""; }
}
