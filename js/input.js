canvas.addEventListener('mousedown', (e) => {
	MOUSEPRESSED = true;
	MOUSECLICKED = true;
	CLICKCOLOR = getRandomColor();
	setMousePos(e.clientX, e.clientY);
	setTimeout(() => { MOUSECLICKED = false }, 50);
	userInput();
	if (BRUSHACTION === 'GRAB') selectRadius('GRAB');
	if (BRUSHACTION === 'CONTROL') selectRadius('CONTROL');
});

window.addEventListener('mouseup', () => {
	MOUSEPRESSED = false;
	if (BRUSHACTION === 'GRAB') {
		resetSelectedType('GRAB');
		selParticles = [];
	}
	if (BRUSHACTION == 'PICK' && PXATMOUSE) setNewType(particleKeys.indexOf(PXATMOUSE.type));
	userInput();
});

function setMousePos(x, y) {
	MOUSEX = x;
	MOUSEY = y;
	let gridX = Math.floor(MOUSEX / PIXELSIZE);
	let gridY = Math.floor(MOUSEY / PIXELSIZE);
	MOUSEGRIDX = clamp(gridX, 0, GW - 1);
	MOUSEGRIDY = clamp(gridY, 0, GH - 1);
}

window.addEventListener('mousemove', (e) => {
	MOUSEDX = e.clientX - MOUSEX;
	MOUSEDY = e.clientY - MOUSEY;
	setTimeout(() => { MOUSEDX = 0; MOUSEDY = 0; }, 200);
	setMousePos(e.clientX, e.clientY);
});


window.addEventListener('keydown', (e) => {
	userInput();
	if (isInInputField) return;
	if (e.code == 'Tab') e.preventDefault();
	if (e.key == 't') { ISGAME = !ISGAME; updateUi(); }
	if (e.key == 'k') switchUiDisplay();
	KEYS[e.key] = true;
	INPXSCROLL = ((KEYS['a'] || KEYS['ArrowLeft']) ? -1 : 0) + ((KEYS['d'] || KEYS['ArrowRight']) ? 1 : 0);
	INPYSCROLL = ((KEYS['w'] || KEYS['ArrowUp']) ? -1 : 0) + ((KEYS['s'] || KEYS['ArrowDown']) ? 1 : 0);
	if (!INPYSCROLL && !INPXSCROLL) return;
	e.preventDefault();
	navigateUi(INPXSCROLL, INPYSCROLL);
	au.playSound(au.clock, .1);
	setTimeout(() => { INPXSCROLL = INPYSCROLL = 0; }, 50);
});

window.addEventListener('keyup', (e) => {
	KEYS[e.key] = false;
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
	if (!KEYS['Shift']) BRUSHSIZE = clamp(BRUSHSIZE - steps, 1, MAXBRUSHSIZE);
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