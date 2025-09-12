canvas.addEventListener('mousedown', (e) => {
	MOUSEPRESSED = true;
	MOUSECLICKED = true;
	MOUSEX = e.clientX;
	MOUSEY = e.clientY;
	CLICKCOLOR = getRandomColor();
	if (BRUSHACTION == 'PICK' && PXATMOUSE) setNewType(getCurTypeIndex(PXATMOUSE.type));
	if (BRUSHACTION == 'CUT') { SHOULDCUT = true};
	setTimeout(() => { MOUSECLICKED = false }, 50);
});

window.addEventListener('mouseup', () => {
	MOUSEPRESSED = false;
	SHOULDCUT = false;
	for (let i = 0; i < selParticles.length; i++){
		let p = selParticles[i];
		p.updatePosition(p.x, p.y);
		p.isSel = false;
		p.velX = MOUSEDX / PIXELSIZE;
		p.velY = MOUSEDY / PIXELSIZE
	}
	selParticles = [];
});

window.addEventListener('mousemove', (e) => {
	MOUSEDX = e.clientX - MOUSEX;
	MOUSEDY = e.clientY - MOUSEY;
	setTimeout(() => { MOUSEDX = 0; MOUSEDY = 0; }, 200);

  	MOUSEX = e.clientX;
	MOUSEY = e.clientY;
	MOUSEMOVED = true;
	setTimeout(() => { MOUSEMOVED = false }, 50);
	let gridX = Math.floor(MOUSEX / PIXELSIZE);
	let gridY = Math.floor(MOUSEY / PIXELSIZE);
	MOUSEGRIDX = clamp(gridX, 0, GRIDW - 1);
	MOUSEGRIDY = clamp(gridY, 0, GRIDH - 1);
});

window.addEventListener('keydown', (e) => {
	if (isInInputField) return;
	if (e.code == 'Tab') e.preventDefault();
	if (e.key == 't') { ISGAME = !ISGAME; console.warn(ISGAME); updateUi(); }
	if (e.key == 'k') switchUiDisplay();
	KEYS[e.key] = true;
	let xScroll = ((KEYS['a'] || KEYS['ArrowLeft']) ? -1 : 0) + ((KEYS['d'] || KEYS['ArrowRight']) ? 1 : 0);
	let yScroll = ((KEYS['w'] || KEYS['ArrowUp']) ? -1 : 0) + ((KEYS['s'] || KEYS['ArrowDown']) ? 1 : 0);
	if (!xScroll && !yScroll) return;
	e.preventDefault();
	navigateUi(xScroll, yScroll);
});

window.addEventListener('keyup', (e) => {
	KEYS[e.key] = false;
});

window.addEventListener('resize', () => {
	CANVW = window.innerWidth; CANVH = window.innerHeight - 180;
	canvas.width = CANVW; canvas.height = CANVH;
	GRIDW = Math.floor(CANVW / PIXELSIZE); GRIDH = Math.floor(CANVH / PIXELSIZE);
	for (let i = 0; i < grid1.length; i++) if (grid1[i]) grid1[i].toRemove();
	grid1 = new Array(GRIDW * GRIDH);
	buildGridLayer();
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
	const delta = e.deltaY;
	if (KEYS['Shift']) setNewPixelSize(clamp(PIXELSIZE + delta * .1, 1, 19));
	else BRUSHSIZE = clamp(BRUSHSIZE - delta * 0.1, 1, MAXBRUSHSIZE);
	SHOWBRUSH = true;
});


function simulateMouseEvent(touchEvent, mouseEventType) {
    const touch = touchEvent.changedTouches[0];
    const simulatedEvent = new MouseEvent(mouseEventType, {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        button: 0
    });
    touch.target.dispatchEvent(simulatedEvent);
}

function simulateWheelEvent(target, deltaY) {
    const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: deltaY, // Positive for scroll down, negative for scroll up
        deltaMode: 0 // Pixel-based scrolling
    });
    target.dispatchEvent(wheelEvent);
}

let lastY = null;
let isTwoFingerTouch = false;
let lastTouchTime = 0;
let isDoubleTouch = false;
document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (e.touches.length === 1 && !isTwoFingerTouch) {
        if (now - lastTouchTime < 300) {
            isDoubleTouch = true;
            deleteParticulesAtMouse();
        }
        lastTouchTime = now;
        simulateMouseEvent(e, 'mousedown');
    } else if (e.touches.length === 2) {
        isTwoFingerTouch = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
		lastY = (touch1.clientY + touch2.clientY) / 2;
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && !isTwoFingerTouch) {
        simulateMouseEvent(e, 'mousemove');
    } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentY = (touch1.clientY + touch2.clientY) / 2;
        if (lastY !== null) {
            const deltaY = (currentY - lastY) * 2;
            // simulateWheelEvent(e.target, deltaY);
        }
        lastY = currentY;
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
        if (!isTwoFingerTouch)
            simulateMouseEvent(e, 'mouseup');
        isDoubleTouch = false;
        isTwoFingerTouch = false;
        lastY = null;
    } else if (e.touches.length === 1) {
        isTwoFingerTouch = false;
        lastY = null;
    }
}, { passive: false });