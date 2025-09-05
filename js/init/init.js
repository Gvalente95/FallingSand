
let paramheader = null;
let infoMouse = null;
function initInfoText() {
	infoText = document.createElement("label");
	infoText.className = "infoText";
	infoText.style.top = "0px";
	infoText.style.left = "5px";
	infoText.style.position = "fixed";
	document.body.appendChild(infoText);
	infoMouse = document.createElement("label");
	infoMouse.className = "infoText";
	infoMouse.style.textContent = "";
	infoMouse.style.left = "5px";
	infoMouse.style.position = "fixed";
	infoMouse.style.top = "20px";
	document.body.appendChild(infoMouse);
}
function initParamHeader(yPos, height)
{
	let spread = 95;
	let x = 5;
	let n = 0;

	let sliders = [];
	sliders.push(createVerticalPressSlider("Brush Sz", x + spread * n++, 0, 1, 100, 1, BRUSHSIZE, setNewBrushSize));
	sliders.push(createVerticalPressSlider("Px Size", x + spread * n++, 0, 2, 19, 1, PIXELSIZE, setNewPixelSize));
	sliders.push(createVerticalPressSlider("Speed", x + spread * n++, 0, .2, 2.2, .2, SIMSPEED, setNewSpeed));
	sliders.push(createVerticalPressSlider("Gravity", x + spread * n++, 0, 1, -1, .1, GRAVITY, setNewGravity));
	sliders.push(createVerticalPressSlider("Rain Pow", x + spread * n++, 0, 1, 100, 1, RAINPOW, setRAINPOW));
	let sldW = 19;
	paramheader = addHeader(yPos, null, height, null, sldW * n);
	sliders.forEach(slider => paramheader.appendChild(slider));
	return (yPos + height);
}

let pauseButton = null;
let pickButton = null;
let rewButton = null;
let cutButton = null;
function initActionHeader(yPos, color = 'red', height = 40)
{
	let xMargin = 65;
	let nn = 0;

	const wp = "ressources/img/white/";
	const p = "ressources/img/white/";

	let baseColor = "rgba(33, 23, 37, 1)"
	let butLen = 10;
	let butW = 27;
	let actionHeader = addHeader(yPos, color, height, null, butLen * butW);
	actionHeader.style.left = "0px";
	rewButton = initButton("Prev", 5 + xMargin * nn++, 0, baseColor, goToPrevFrame, null, actionHeader, null, '1', p + "prev.png");
	pauseButton = initButton("Pause", 5 + xMargin * nn++, 0, baseColor, switchPause, -1, actionHeader, false, '2', p + "pause.png");
	initButton("Next", 5 + xMargin * nn++, 0, baseColor, goToNextFrame, null, actionHeader, null, '3', p + "next.png");
	initButton("Fall", 5 + xMargin * nn++, 0, baseColor, switchRain, null, actionHeader, false, 'f', p + "drop.png");
	cutButton = initButton("Cut", 5 + xMargin * nn++, 0, baseColor, switchCut, null, actionHeader, false, "c", p + "eraser.png", wp + "eraser.png");
	initButton("Clear", 5 + xMargin * nn++, 0, baseColor, resetParticles, PIXELSIZE, actionHeader, null, 'r', p + "broom.png");
	pickButton = initButton("Pick", 5 + xMargin * nn++, 0, baseColor, switchPick, null, actionHeader, false, "p", p + "eyedropper.png", wp + "eyedropper.png");
	initButton("Grid", 5 + xMargin * nn++, 0, baseColor, switchGridMode, null, actionHeader, true, "g", p + "grid.png");
	initButton("Brush", 5 + xMargin * nn++, 0, baseColor, setNewBrushType, null, actionHeader, true, 'b', p + "disk.png");
	initButton("Emitter", 5 + xMargin * nn++, 0, baseColor, spawnEmitterAtMouse, null, actionHeader, null, 'l', p + "emit.png");
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

		const famButton = initButton(name, 5 + i * buttonSpread, 0, color, switchUiPage, i, pageHeader, null, null, null, null);
		famButton.sliders = [];
		famButton.buttons = [];
		famButton.label = name;

		const elementsY = y + 45;
		const elementsHeader = addHeader(elementsY, null, 40, null, 0);

		let xp = 0;
		if (name === "CUSTOM") {
			const makeBtn = initButton( "MAKE", 5 + xp++ * buttonSpread,0, "rgb(0,0,0)",createNewType,-1,elementsHeader);
			famButton.buttons.push(makeBtn);
		} else {
			for (let v = 0; v < particleKeys.length; v++) {
				const key = particleKeys[v];
				const prop = PARTICLE_PROPERTIES[key];
				if (!hasTag(key, name)) continue;
				const btn = initButton( key, 5 + xp++ * buttonSpread, 0, prop.color, setNewType, v, elementsHeader);
				famButton.buttons.push(btn);
			}
		}
		const rowContentW = Math.max(10, xp * buttonSpread + 10);
		const rowDragW = Math.max(0, rowContentW - CANVW);
		elementsHeader.style.width = rowContentW + "px";
		const curLeft = parseFloat(getComputedStyle(elementsHeader).left) || 0;
		const minLeft = -rowDragW;
		const maxLeft = 0;
		elementsHeader.style.left = Math.max(minLeft, Math.min(maxLeft, curLeft)) + "px";
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