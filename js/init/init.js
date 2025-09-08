
let paramheader = null;
let infoMouse = null;
function initInfoText() {
  infoText = document.createElement("label");
  infoText.className = "infoText";
  infoText.style.position = "fixed";
  infoText.style.top = "0px";
  infoText.style.left = "5px";
  infoText.style.whiteSpace = "pre";
  infoText.style.fontFamily = "monospace";
  document.body.appendChild(infoText);

  infoMouse = document.createElement("label");
  infoMouse.className = "infoText";
  infoMouse.style.position = "fixed";
  infoMouse.style.top = "20px";
  infoMouse.style.left = "5px";
  infoMouse.style.whiteSpace = "pre";
  infoMouse.style.fontFamily = "monospace";
  infoMouse.textContent = "";
  document.body.appendChild(infoMouse);
}

function initParamHeader(yPos, height)
{
	let spread = 95;
	let x = 5;
	let n = 0;

	let sliders = [];
	sliders.push(createVerticalPressSlider("Brush Sz", x + spread * n++, 0, 2, 100, 1, BRUSHSIZE, setNewBrushSize));
	sliders.push(createVerticalPressSlider("Px Size", x + spread * n++, 0, 2, 19, .1, PIXELSIZE, setNewPixelSize));
	sliders.push(createVerticalPressSlider("Speed", x + spread * n++, 0, .2, 2.2, .2, SIMSPEED, setNewSpeed));
	sliders.push(createVerticalPressSlider("Gravity", x + spread * n++, 0, 1, -1, .1, GRAVITY, setNewGravity));
	sliders.push(createVerticalPressSlider("Rain Pow", x + spread * n++, 0, 1, 100, 1, RAINPOW, setRAINPOW));
	let sldW = 19;
	paramheader = addHeader(yPos, null, height, null, sldW * n);
	sliders.forEach(slider => paramheader.appendChild(slider));
	return (yPos + height);
}

let rewButton = null;
let pauseButton = null;

let brushActionButtons = [];
function initActionHeader(yPos, color = 'red', height = 40)
{
	let xMargin = 65;
	let nn = 0;

	const wp = "ressources/img/WHITE/";
	const p = "ressources/img/WHITE/";

	let clr = "rgba(33, 23, 37, 1)"
	let butLen = 13;
	let butW = 35;
	let hdr = addHeader(yPos, color, height, null, butLen * butW);
	hdr.style.left = "0px";
	rewButton = initButton("Prev", 5 + xMargin * nn++, 0, clr, goToPrevFrame, null, hdr, null, '1', p + "prev.png", null, false, clr);
	pauseButton = initButton("Pause", 5 + xMargin * nn++, 0, clr, switchPause, -1, hdr, false, '2', p + "pause.png", null, false, clr);
	initButton("Next", 5 + xMargin * nn++, 0, clr, goToNextFrame, null, hdr, null, '3', p + "next.png", null, false, clr);
	brushActionButtons.push(initButton("Cut", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'CUT', hdr, false, "c", p + "eraser.png", wp + "eraser.png", null, false, clr));
	brushActionButtons.push(initButton("Pick", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'PICK', hdr, false, "i", p + "eyedropper.png", wp + "eyedropper.png", null, false, clr));
	initButton("Clear", 5 + xMargin * nn++, 0, clr, resetParticles, PIXELSIZE, hdr, null, 'r', p + "broom.png", null, false, clr);
	brushActionButtons.push(initButton("Vibrate", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'VIBRATE', hdr, false, "v", p + "vibrate.png", wp + "vibrate.png", null, false, clr));
	brushActionButtons.push(initButton("Push", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'PUSH', hdr, false, "p", p + "push.png", wp + "push.png", null, false, clr));
	brushActionButtons.push(initButton("Explode", 5 + xMargin * nn++, 0, clr, switchBrushAction, 'EXPLODE', hdr, false, "e", p + "explosion.png", wp + "explosion.png", null, false, clr));
	initButton("Rain", 5 + xMargin * nn++, 0, clr, switchRain, null, hdr, false, 'Enter', p + "drop.png", null, false, clr);
	initButton("Grid", 5 + xMargin * nn++, 0, clr, switchGridMode, null, hdr, true, "g", p + "grid.png", null, false, clr);
	initButton("Brush", 5 + xMargin * nn++, 0, clr, setNewBrushType, null, hdr, true, 'b', p + "disk.png", null, false, clr);
	initButton("Emitter", 5 + xMargin * nn++, 0, clr, spawnEmitterAtMouse, null, hdr, null, 'l', p + "emit.png", null, false, clr);
	initButton("Fill", 5 + xMargin * nn++, 0, clr, fillScreen, null, hdr, false, 'f', p + "fill.png", null, false, clr);
	return (yPos + height);
}

function initParticlePagesHeader(y) {
	const buttonSpread = 65;
	const particleTypes = [...TAGS];

	const tabsCount = particleTypes.length;
	const tabsContentW = tabsCount * buttonSpread + 10;
	const tabsDragW = Math.max(0, tabsContentW - CANVW);

	const pageHeader = addHeader(y, null, 40, null, tabsDragW);

	for (let i = 0; i < particleTypes.length; i++) {
		const name = particleTypes[i];
		const color = TAGSCOLORS[i % TAGSCOLORS.length] || "rgba(80,80,80,1)";

		const famButton = initButton(name, 5 + i * buttonSpread, 0, color, switchUiPage, i, pageHeader);
		famButton.sliders = [];
		famButton.buttons = [];
		famButton.label = name;

		const elementsY = y + 45;
		const elementsHeader = addHeader(elementsY, null, 40, null, 1);

		let xp = 0;
		if (name === "CUSTOM") {
			const makeBtn = initButton( "MAKE", 5 + xp++ * buttonSpread,0, "rgb(0,0,0)",createNewType,-1,elementsHeader);
			famButton.buttons.push(makeBtn);
		} else {
			for (let v = 0; v < particleKeys.length; v++) {
				const key = particleKeys[v];
				const prop = PARTICLE_PROPERTIES[key];
				if (!hasTag(key, name)) continue;
				const btn = initButton(key, 5 + xp++ * buttonSpread, 0, prop.color, setNewType, v, elementsHeader);
				famButton.buttons.push(btn);
			}
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
		uiPagesButtons.push(famButton);
	}
	const curLeftTabs = parseFloat(getComputedStyle(pageHeader).left) || 0;
	pageHeader.style.left = Math.max(-tabsDragW, Math.min(0, curLeftTabs)) + "px";
	return y + 80;
}



function initUi()
{
	let y = initActionHeader(CANVH, 'rgb(23, 14, 23)');
	y = initParamHeader(y + 2 , 35);
	y = initParticlePagesHeader(y + 2, 'rgb(23, 14, 23)');
	initInfoText();
	switchUiPage(0);
	setNewType(0);
	setNewBrushType('DISC');
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
	au = new AudioManager();
	initUi();
	initGrid();
}

window.onload = () => {init();	update();};