canvas.addEventListener('mousedown', (e) => {
	MOUSEPRESSED = true;
	MOUSECLICKED = true;
	MOUSEX = e.clientX;
	MOUSEY = e.clientY;
	if (PICKACTIVE && pxAtMouse) setNewType(getCurTypeIndex(pxAtMouse.type));
	setTimeout(() => { MOUSECLICKED = false }, 50);
});

canvas.addEventListener('mouseup', () => {
	MOUSEPRESSED = false;
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
	pxAtMouse = getPxlAtPos(MOUSEGRIDX, MOUSEGRIDY);
});

window.addEventListener('keydown', (e) => {
	KEYS[e.key] = true;
	let xScroll = ((KEYS['a'] || KEYS['ArrowLeft']) ? -1 : 0) + ((KEYS['d'] || KEYS['ArrowRight']) ? 1 : 0);
	let yScroll = ((KEYS['w'] || KEYS['ArrowUp']) ? -1 : 0) + ((KEYS['s'] || KEYS['ArrowDown']) ? 1 : 0);
	if (!xScroll && !yScroll) return;
	if (yScroll){ uiLayerIndex = !uiLayerIndex; }
	e.preventDefault();
	let max = uiLayerIndex == 0 ? uiPagesButtons.length : uiPagesButtons[uiPageIndex].buttons.length;
	let curIndex = uiLayerIndex == 0 ? uiPageIndex : getCurButtonTypeIndex();
	let newIndex = ((curIndex + xScroll) % max);
	if (newIndex < 0) newIndex = max - 1;
	if (uiLayerIndex == 0) switchUiPage(newIndex);
	else if (uiLayerIndex == 1) { setNewType(uiPagesButtons[uiPageIndex].buttons[newIndex].value); }
	updateUi();
});

window.addEventListener('keyup', (e) => {
	KEYS[e.key] = false;
});

window.addEventListener('resize', () => {
	const oldW = GRIDW, oldH = GRIDH;
	CANVW = window.innerWidth; CANVH = window.innerHeight - 180;
	canvas.width = CANVW; canvas.height = CANVH;
	GRIDW = Math.floor(CANVW / PIXELSIZE); GRIDH = Math.floor(CANVH / PIXELSIZE);
	for (let x = 0; x < oldW; x++) {
		const col = grid[x];
		if (!col) continue;
		for (let y = 0; y < oldH; y++) {
			if (x >= GRIDW || y >= GRIDH) {
				const cell = col[y];
				if (cell && cell.toRemove) cell.toRemove();
			}
		}
	}
	grid.length = GRIDW;
	for (let x = 0; x < GRIDW; x++) {
		if (!grid[x]) grid[x] = [];
		grid[x].length = GRIDH;
	}
	buildGridLayer();
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    BRUSHSIZE = clamp(BRUSHSIZE - delta * 0.1, 1, 80);
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


function simulateMouseEvent(touchEvent, mouseType) {
	const touch = touchEvent.changedTouches[0];
	const simulatedEvent = new MouseEvent(mouseType, {
		bubbles: true,
		cancelable: true,
		clientX: touch.clientX,
		clientY: touch.clientY,
		button: 0
	});
	touch.target.dispatchEvent(simulatedEvent);
}

let lastTouchTime = 0;
let isDoubleTouch = false;
document.addEventListener("touchstart", e => {
	const now = Date.now();
	if (now - lastTouchTime < 300) {
		isDoubleTouch = true;
		removeAtPos(mouseX, mouseY);
		console.log("Double touch!");}
	lastTouchTime = now;
	simulateMouseEvent(e, "mousedown");
}, { passive: false });

document.addEventListener("touchmove", e => {
	e.preventDefault();
	simulateMouseEvent(e, "mousemove");
}, { passive: false });

document.addEventListener("touchend", e => {
	simulateMouseEvent(e, "mouseup");
	isDoubleTouch = false;
}, { passive: false });
