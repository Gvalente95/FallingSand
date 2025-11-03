class InputManager
{
	constructor(){
		this.keys = {};
		this.x = 0;
		this.y = 0;
		this.lastKey = null;
		this.shift = false;
		this.selBox = null;
	}

	update() {
		if (inPrompt || LD.active) return;
		this.shift = this.keys["shift"];
		let keyX = (this.keys['a'] ? -1 : 0) + (this.keys['d'] ? 1 : 0);
		let keyY = (this.keys['w'] ? -1 : 0) + (this.keys['s'] ? 1 : 0);
		this.x = keyX;
		this.y = keyY;
		setTimeout(() => { this.x = this.y = 0; }, 200);
		if (ticks % 3 !== 0)
			return;
		let arrowX = (INPUT.lastKey == 'ArrowLeft' ? -1 : 0) + (INPUT.lastKey == 'ArrowRight' ? 1 : 0);
		let arrowY = (INPUT.lastKey == 'ArrowUp' ? -1 : 0) + (INPUT.lastKey == 'ArrowDown' ? 1 : 0);
		if ((PLAYER && !arrowX && !arrowY) || (!arrowX && !arrowY && !keyX && !keyY))
			return;
		navigateUi(arrowX || (PLAYER ? 0 : keyX), arrowY || (PLAYER ? 0 : keyY));
		au.playSound(au.clock, .1);
	}
}

class Mouse{
	constructor() {
		this.x = 0;
		this.y = 0;
		this.dx = 0;
		this.dy = 0;
		this.gridX = 0;
		this.gridY = 0;
		this.clicked = false;
		this.pressed = false;
		this.cell = null;
		this.clickedOnPlayer = false;
		this.clickColor = getRandomColor();
	}

	setPos(x, y) {
		this.x = x;
		this.y = y;
		let gridX = Math.floor(x / PIXELSIZE);
		let gridY = Math.floor(y / PIXELSIZE);
		this.gridX = clamp(gridX, 0, GW - 1);
		this.gridY = clamp(gridY, 0, GH - 1);
	}

	mousemove(x, y) {
		const dx = x - this.x;
		const dy = y - this.y;
		this.dx = dx;
		this.dy = dy;
		this.setPos(x, y);
	}

	mousedown(x, y) {
		if (PLAYER && isMobile) {
			for (const c of PLAYER.cells) {
				if (c.x === Math.floor(x / PIXELSIZE) && c.y === Math.floor(y / PIXELSIZE)) {
					this.clickedOnPlayer = true;
					break;
				}
			}
		}
		this.clicked = true;
		this.pressed = true;
		this.clickColor = getRandomColor();
		this.setPos(x, y);
		setTimeout(() => { this.clicked = false }, 50);
	}

	mouseup(e) {
		this.clickedOnPlayer = false;
		this.pressed = false;
		if (SELENT)
			SELENT = null;
	}
}

window.addEventListener('mousedown', (e) => {
	if (LD.active && LD.container.style.display == "none") {
		LD.closeMenu();
	}
});

canvas.addEventListener('mousedown', (e) => {
	MOUSE.mousedown(e.clientX, e.clientY);
	userInput();
	if (BRUSHACTION === 'GRAB') selectRadius('GRAB');
	if (BRUSHACTION === 'CONTROL') selectRadius('CONTROL');
});

window.addEventListener('mouseup', () => {
	MOUSE.mouseup();
	if (BRUSHACTION === 'GRAB') {
		resetSelectedType('GRAB');
		selCells = [];
	}
	if (BRUSHACTION == 'PICK' && MOUSE.cell) setNewType(cellKeys.indexOf(MOUSE.cell.type));
	userInput();
});

window.addEventListener('mousemove', (e) => {
	MOUSE.mousemove(e.clientX, e.clientY);
});

window.addEventListener('keydown', (e) => {
	if (inPrompt) return;
	userInput();
	if (e.code === 'Tab') e.preventDefault();
	else if (e.key === 't') { ISGAME = !ISGAME; updateUi(); }
	else if (e.key === 'k') switchUiDisplay();
	else if (e.code === "Escape") {
		if (LD.active)
			LD.closeMenu();
	}
	else if (e.key === 'h') PLAYER.death();
	else if (e.key === 'z' && !INPUT.selBox) {
		INPUT.selBox = [MOUSE.gridX, MOUSE.gridY];
	}
	INPUT.lastKey = e.key.toLowerCase();
	INPUT.keys[INPUT.lastKey] = true;
});

window.addEventListener('keyup', (e) => {
	if (inPrompt) return;
	if (e.key === 'z') {
		const gx0 = Math.min(INPUT.selBox[0], MOUSE.gridX);
		const gy0 = Math.min(INPUT.selBox[1], MOUSE.gridY);
		const gw  = Math.abs(INPUT.selBox[0] - MOUSE.gridX) + 1;
		const gh  = Math.abs(INPUT.selBox[1] - MOUSE.gridY) + 1;
		const cx  = (gx0 + gw / 2) * PIXELSIZE;
		const cy  = (gy0 + gh / 2) * PIXELSIZE;
		const rx  = Math.floor(gw / 2);
		const ry  = Math.floor(gh / 2);
		launchCells(cellKeys[TYPEINDEX], cx, cy, rx, ry, false, false);
		INPUT.selBox = null;
	}
	INPUT.keys[e.key.toLowerCase()] = false;
	if (isWheeling && e.key === 'Shift') isWheeling = false;
});

window.addEventListener('resize', () => {
	CANVW = window.innerWidth; CANVH = window.innerHeight - 180;
	canvas.width = CANVW; canvas.height = CANVH;
	GW = Math.floor(CANVW / PIXELSIZE); GH = Math.floor(CANVH / PIXELSIZE);
	for (let i = 0; i < grid1.length; i++) if (grid1[i]) grid1[i].toRemove();
	grid1 = new Array(GW * GH);
	buildGridLayer();
});

let wheelAcc = 0;
let isWheeling = false;
const WHEEL_SPEED = 5;
canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	const modeScale = e.deltaMode === 1 ? 100 : (e.deltaMode === 2 ? window.innerHeight : 1);
	wheelAcc += e.deltaY / (modeScale * WHEEL_SPEED);
	let steps = 0;
	while (Math.abs(wheelAcc) >= 1) {
	steps += Math.sign(wheelAcc);
	wheelAcc -= Math.sign(wheelAcc);}
	if (!steps) return;
	if (!INPUT.keys['shift']) BRUSHSIZE = clamp(BRUSHSIZE - steps, 1, MAXBRUSHSIZE);
	else {
		setNewPixelSize(clamp(PIXELSIZE + steps, 2, 19));
		setMousePos(e.clientX, e.clientY);
		SHOWBRUSH = true;
		isWheeling = true;
	}
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
            delCellsAtPos();
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
		switchBrushAction('CUT');
        lastY = null;
    }
}, { passive: false });



let inputTimeout = null;
let hasInput = false;
function userInput() {
    if (inputTimeout) {
        clearTimeout(inputTimeout);
    }
    inputTimeout = setTimeout(() => {
        inputTimeout = null;
        hasInput = false;
    }, 100);
    hasInput = true;
}