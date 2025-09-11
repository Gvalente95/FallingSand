
let paramheader = null;
let infoMouse = null;
function initInfoText() {
	infoText = initLabelDiv(5, 0);
	infoMouse = initLabelDiv(5, 20);
}

function initParamHeader(yPos, height)
{
	let spread = 95;
	let x = 5;
	let n = 0;

	let sliders = [];
	sliders.push(createVerticalPressSlider("Brush Sz", x + spread * n++, 0, 2, 100, 1, BRUSHSIZE, setNewBrushSize));
	sliders.push(createVerticalPressSlider("Px Size", x + spread * n++, 0, 2, 19, 1, PIXELSIZE, setNewPixelSize));
	sliders.push(createVerticalPressSlider("Gravity", x + spread * n++, 0, 1, -1, .1, GRAVITY, setNewGravity));
	sliders.push(createVerticalPressSlider("Speed", x + spread * n++, 0, .2, 2.2, .2, SIMSPEED, setNewSpeed));
	sliders.push(createVerticalPressSlider("Rain Pow", x + spread * n++, 0, 1, 100, 1, RAINPOW, setRAINPOW));
	let sldW = 30;
	paramheader = addHeader(yPos, null, height, null, sldW * n);
	sliders.forEach(slider => paramheader.appendChild(slider));
	fitHeaderDragWidth(paramheader);
}

let rewButton = null;
let pauseButton = null;

let brushActionButtons = [];
function initActionHeader(yPos, color = 'red')
{
	let xMargin = btnW + uiXmargin;
	let nn = 0;

	const wp = "ressources/img/WHITE/";
	const p = "ressources/img/WHITE/";

	let clr = "rgba(33, 23, 37, 1)"
	let hdr = addHeader(yPos, color, btnH, null, 1);
	hdr.style.left = "0px";

	pauseButton = initButton("Pause", 5 + xMargin * nn++, 0, clr, switchPause, -1, hdr, false, 'Space', p + "pause.png", null, false, clr);
	initButton("Next", 5 + xMargin * nn++, 0, clr, goToNextFrame, null, hdr, null, 'Tab', p + "next.png", null, false, clr);
	brushActionButtons.push(initButton("Cut", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'CUT', hdr, false, "c", p + "eraser.png", wp + "eraser.png", null, false, clr));
	initButton("Fill", 5 + xMargin * nn++, 0, clr, fillScreen, null, hdr, null, 'f', p + "fill.png", null, false, clr);
	brushActionButtons.push(initButton("Pick", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'PICK', hdr, false, "i", p + "eyedropper.png", wp + "eyedropper.png", null, false, clr));
	initButton("Clear", 5 + xMargin * nn++, 0, clr, resetParticles, PIXELSIZE, hdr, null, 'r', p + "broom.png", null, false, clr);
	brushActionButtons.push(initButton("Vibrate", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'VIBRATE', hdr, false, "v", p + "vibrate.png", wp + "vibrate.png", null, false, clr));
	brushActionButtons.push(initButton("Push", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'PUSH', hdr, false, "p", p + "push.png", wp + "push.png", null, false, clr));
	brushActionButtons.push(initButton("Explode", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'EXPLODE', hdr, false, "e", p + "explosion.png", wp + "explosion.png", null, false, clr));
	initButton("Rain", 5 + xMargin * nn++, 0, clr, switchRain, null, hdr, false, 'Enter', p + "drop.png", null, false, clr);
	initButton("Grid", 5 + xMargin * nn++, 0, clr, switchGridMode, null, hdr, true, "g", p + "grid.png", null, false, clr);
	initButton("Brush", 5 + xMargin * nn++, 0, clr, setNewBrushType, null, hdr, true, 'b', p + "disk.png", null, false, clr);
	initButton("Emitter", 5 + xMargin * nn++, 0, clr, spawnEmitterAtMouse, null, hdr, null, 'l', p + "emit.png", null, false, clr);
	initButton("Hud", 5 + xMargin * nn++, 0, clr, switchHud, null, hdr, true, 'u', p + "info.png", null, false, clr);

	fitHeaderDragWidth(hdr);
}

function initParticlePagesHeader(y) {
    const buttonSpread = btnW + uiXmargin;
    const particleTypes = TAGS.map(tag => tag.type);
    const tabsCount = particleTypes.length;
    const tabsContentW = tabsCount * buttonSpread + 10;
    const tabsDragW = Math.max(0, tabsContentW - CANVW);
	const pageHeader = addHeader(y, null, btnH, null, tabsDragW);
	const background = 'rgba(94, 73, 73, 0.16)';
    for (let i = 0; i < particleTypes.length; i++) {
        const name = particleTypes[i];
        const color = TAGS[i].color || getRandomColor();
        const famButton = initButton(name, 5 + i * buttonSpread, 0, background, switchUiPage, i, pageHeader, null, null, null, null, color);
        famButton.sliders = [];
        famButton.buttons = [];
        famButton.label = name;
        const elementsY = y + btnH + 5;
        const elementsHeader = addHeader(elementsY, null, btnH, null, 1);
        let xp = 0;
		for (let v = 0; v < particleKeys.length; v++) {
			const key = particleKeys[v];
			const prop = PARTICLE_PROPERTIES[key];
			if (!hasTag(key, name)) continue;
			let x = 5 + xp++ * buttonSpread;
			const btn = initButton(key, x, 0, background, setNewType, v, elementsHeader, null, null, null, null, prop.color);
			let newDiv = initLabelDiv(x, y + 30, 'new', 'rgba(0, 217, 255, 1)');
			newDiv.style.opacity = '0';
			btn.newDiv = newDiv;
			famButton.buttons.push(btn);
		}
        if (famButton.buttons.length > 6) {
            const rowContentW = Math.max(10, (xp - 6) * buttonSpread);
            const rowDragW = Math.max(0, rowContentW - CANVW);
            elementsHeader.style.width = rowContentW + "px";
            const curLeft = parseFloat(getComputedStyle(elementsHeader).left) || 0;
            const minLeft = -rowDragW;
            const maxLeft = 0;
            elementsHeader.style.left = Math.max(minLeft, Math.min(maxLeft, curLeft)) + "px";
        }
        fitHeaderDragWidth(elementsHeader);
        uiPagesButtons.push(famButton);
    }
    fitHeaderDragWidth(pageHeader);
}

function initUi()
{
	const paramHeight = 35;
	initActionHeader(CANVH, 'rgb(23, 14, 23)');
	initParamHeader(CANVH + btnH, paramHeight);
	initParticlePagesHeader(CANVH + btnH + paramHeight, 'rgb(23, 14, 23)');
	initInfoText();
	setNewType(0);
	setNewBrushType('DISC');
	switchUiPage(0);
	uiLayerIndex = 0;
	updateUi();
}

function initGrid() {
    grid = [];
    for (let x = 0; x < GRIDW; x++) {
        grid[x] = [];
        for (let y = 0; y < GRIDH; y++)
            grid[x][y] = null;
	}
	buildGridLayer();
}

let au = null;
function init()
{
	initCreationRules();
	au = new AudioManager();
	initUi();
	initGrid();
}

window.onload = () => {init();	update();};