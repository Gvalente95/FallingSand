
let paramheader = null;
function initInfoText() {
	infoText = initLabelDiv(10, 10);
	infoFps = initLabelDiv(CANVW - 80, 20);

	infoText.style.userSelect = 'block';
	infoText.style.cursor = 'pointer';
	infoText.style.paddingTop = '10px';
	infoText.style.paddingLeft = '10px';
	infoText.style.paddingRight = '10px';
	infoText.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
	infoText.addEventListener('mousedown', () => { switchHud(); });
}

function initParamHeader(yPos)
{
	let spread = paramBtnW + uiXmargin;
	let xm = 10;
	let n = 0;

	let sliders = [];
	sliders.push(createVerticalPressSlider("Brush Sz", spread * n++, 0, 2, 100, 1, BRUSHSIZE, setNewBrushSize));
	sliders.push(createVerticalPressSlider("Gravity", spread * n++, 0, 1, -1, .1, GRAVITY, setNewGravity));
	sliders.push(createVerticalPressSlider("Speed", spread * n++, 0, .2, 2.2, .2, SIMSPEED, setNewSpeed));
	sliders.push(createVerticalPressSlider("Px Size", spread * n++, 0, 2, 19, 1, PIXELSIZE, setNewPixelSize));
	sliders.push(createVerticalPressSlider("Rain Pow", spread * n++, 0, 1, 100, 1, RAINPOW, setRAINPOW));
	let sldW = 30;
	paramheader = addHeader(xm, yPos, null, paramH, null, sldW * n);
	sliders.forEach(slider => paramheader.appendChild(slider));
	fitHeaderDragWidth(paramheader);
}

let rewButton = null;
let pauseButton = null;

let brushActionButtons = [];
function initActionHeader(yPos)
{
	let nn = 0;
	let w = actionBtnW, h = actionBtnH;
	let xs = w + uiXmargin;
	let xm = 10;

	const wp = "ressources/img/WHITE/";
	const p = "ressources/img/WHITE/";

	let clr = "rgba(33, 23, 37, 1)"
	let hdr = addHeader(xm, yPos, null, actionBtnH, null, 1);
	hdr.style.left = "0px";

	pauseButton = initButton("Pause", xs * nn++, 0, w, h, clr, switchPause, -1, hdr, false, 'Space', p + "pause.png", null, false, clr);
	brushActionButtons.push(initButton("Cut", xs * nn++, 0, w, h, clr, switchBrushAction, 'CUT', hdr, false, "c", p + "eraser.png", wp + "eraser.png", null, false, clr));
	initButton("Fill", xs * nn++, 0, w, h, clr, fillScreen, null, hdr, null, 'f', p + "fill.png", null, false, clr);
	initButton("Clear", xs * nn++, 0, w, h, clr, resetParticles, PIXELSIZE, hdr, null, 'r', p + "broom.png", null, false, clr);
	brushActionButtons.push(initButton("Pick", xs * nn++, 0, w, h, clr, switchBrushAction, 'PICK', hdr, false, "i", p + "eyedropper.png", wp + "eyedropper.png", null, false, clr));
	brushActionButtons.push(initButton("Vibrate", xs * nn++, 0, w, h, clr, switchBrushAction, 'VIBRATE', hdr, false, "v", p + "vibrate.png", wp + "vibrate.png", null, false, clr));
	brushActionButtons.push(initButton("Grab", xs * nn++, 0, w, h, clr, switchBrushAction, 'GRAB', hdr, false, "p", p + "push.png", wp + "push.png", null, false, clr));
	brushActionButtons.push(initButton("LIQUID", xs * nn++, 0, w, h, clr, switchBrushAction, 'LIQUEFY', hdr, false, "o", p + "scissors.png", wp + "scissors.png", null, false, clr));
	brushActionButtons.push(initButton("Explode", xs * nn++, 0, w, h, clr, switchBrushAction, 'EXPLODE', hdr, false, "e", p + "explosion.png", wp + "explosion.png", null, false, clr));
	initButton("Rain", xs * nn++, 0, w, h, clr, switchRain, null, hdr, false, 'Enter', p + "drop.png", null, false, clr);
	initButton("Grid", xs * nn++, 0, w, h, clr, switchGridMode, null, hdr, false, "g", p + "grid.png", null, false, clr);
	initButton("Brush", xs * nn++, 0, w, h, clr, setNewBrushType, null, hdr, true, 'b', p + "disk.png", null, false, clr);
	initButton("Emitter", xs * nn++, 0, w, h, clr, spawnEmitterAtMouse, null, hdr, null, 'l', p + "emit.png", null, false, clr);
	initButton("Next", xs * nn++, 0, w, h, clr, goToNextFrame, null, hdr, null, 'Tab', p + "next.png", null, false, clr);
	fitHeaderDragWidth(hdr);
}

function initParticlePagesHeader(y) {
	const w = btnW, h = btnH;
    const buttonSpread = btnW + uiXmargin;
    const particleTypes = TAGS.map(tag => tag.type);
    const tabsCount = particleTypes.length;
    const tabsContentW = tabsCount * buttonSpread + 10;
    const tabsDragW = Math.max(0, tabsContentW - CANVW);
	const pageHeader = addHeader(10, y, null, btnH, null, tabsDragW);
	const background = 'rgba(73, 86, 94, 0.16)';
    for (let i = 0; i < particleTypes.length; i++) {
        const name = particleTypes[i];
        const color = TAGS[i].color;
        const famButton = initButton(name, i * buttonSpread, 0, w, h, color, switchUiPage, i, pageHeader, null, null, null, null, color);
        famButton.sliders = [];
        famButton.buttons = [];
        famButton.label = name;
        const elementsY = y + btnH + 5;
        const elementsHeader = addHeader(10, elementsY, null, btnH, null, 1);
        let xp = 0;
		for (let v = 0; v < particleKeys.length; v++) {
			const key = particleKeys[v];
			const prop = PARTICLE_PROPERTIES[key];
			if (!hasTag(key, name)) continue;
			let x = xp++ * buttonSpread;
			const btn = initButton(key, x, 0, w, h, background, setNewType, v, elementsHeader, null, null, null, null, prop.color);
			let newDiv = initLabelDiv(x, CANVH + y + 35, 'new', 'rgba(0, 217, 255, 1)');
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
	initActionHeader(0);
	initParamHeader(actionBtnH + uiYmargin);
	initParticlePagesHeader(actionBtnH + paramH + uiYmargin * 3, 'rgb(23, 14, 23)');
	initInfoText();
	setNewType(0);
	setNewBrushType('DISC');
	switchUiPage(0);
	switchHud(SHOWHUD);
	switchGridMode(gridMode);
	uiLayerIndex = 0;
	updateUi();
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