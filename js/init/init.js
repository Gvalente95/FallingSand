
let infoHeader = null;
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
function initInfoHeader(yPos, color = 'black', height)
{
	let spread = 95;
	let x = 5;
	let n = 0;

	let sliders = [];
	sliders.push(createVerticalPressSlider("Brush Sz", x + spread * n++, 0, 1, 100, 1, BRUSHSIZE, setNewBrushSize));
	sliders.push(createVerticalPressSlider("Px Size", x + spread * n++, 0, 1, 19, 1, PIXELSIZE, setNewPixelSize));
	sliders.push(createVerticalPressSlider("Speed", x + spread * n++, 0, .2, 2.2, .2, SIMSPEED, setNewSpeed));
	sliders.push(createVerticalPressSlider("Gravity", x + spread * n++, 0, 1, -1, .1, GRAVITY, setNewGravity));
	sliders.push(createVerticalPressSlider("Rain Pow", x + spread * n++, 0, 1, 100, 1, RAINPOW, setRAINPOW));
	let sldW = 19;
	infoHeader = addHeader(yPos, color, height, null, sldW * n);
	sliders.forEach(slider => infoHeader.appendChild(slider));
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
	rewButton = initButton("<", 5 + xMargin * nn++, 0, baseColor, goToPrevFrame, null, actionHeader, null, '1');
	pauseButton = initButton("Pause", 5 + xMargin * nn++, 0, baseColor, switchPause, -1, actionHeader, false, '2', p + "pause.png");
	initButton(">", 5 + xMargin * nn++, 0, baseColor, goToNextFrame, null, actionHeader, null, '3');
	initButton("Clear", 5 + xMargin * nn++, 0, baseColor, resetParticles, PIXELSIZE, actionHeader, null, 'r', p + "broom.png");
	initButton("Fall", 5 + xMargin * nn++, 0, baseColor, switchRain, null, actionHeader, false, 'f', p + "drop.png");
	cutButton = initButton("Cut", 5 + xMargin * nn++, 0, baseColor, switchCut, null, actionHeader, false, "c", p + "eraser.png", wp + "eraser.png");
	pickButton = initButton("Pick", 5 + xMargin * nn++, 0, baseColor, switchPick, null, actionHeader, false, "p", p + "eyedropper.png", wp + "eyedropper.png");
	initButton("Grid", 5 + xMargin * nn++, 0, baseColor, switchGridMode, null, actionHeader, true, "g", p + "grid.png");
	initButton("Brush", 5 + xMargin * nn++, 0, baseColor, setNewBrushType, null, actionHeader, true, 'b', p + "disk.png");
	initButton("Emitter", 5 + xMargin * nn++, 0, baseColor, spawnEmitterAtMouse, null, actionHeader, null, 'l', p + "emit.png");
	return (yPos + height);
}

function inituiPagesHeader(y)
{
	let buttonSpread = 65;
	let uiPAGENAMES = [];
	for (let i = 0; i < solidKeys.length; i++) uiPAGENAMES.push(solidKeys[i]);
	uiPAGENAMES.push("ALL");
	uiPAGENAMES.push("CUSTOM");
	let pageHeader = addHeader(y, "rgb(0,0,0,0)", 40, null, isMobile ? (uiPAGENAMES.length) : 0);
	let uiPageColors = ['rgba(115, 144, 118, 1)', 'rgba(46, 113, 207, 1)', 'rgba(129, 127, 23, 1)', 'rgba(33, 169, 117, 1)', 'grey', 'white', 'black'];
	for (let i = 0; i < uiPAGENAMES.length; i++)
	{
		let name = uiPAGENAMES[i];
		let yPos = y;
		let buttonHeight = 45;
		let pageButton = initButton(name, 5 + i * buttonSpread, 0, uiPageColors[i], switchUiPage, i, pageHeader);
		let curType = solidKeys[i];
		let xp = 0;
		let elementsHeader = addHeader(y, null, 40, null, isMobile ? CANVW * 3 : 0);
		pageButton.sliders = [];
		pageButton.buttons = [];
		pageButton.label = name;
		if (name === 'ALL' || name === 'CUSTOM') curType = name;
		if (curType === 'CUSTOM') {
			pageButton.buttons.push(initButton(
				'MAKE', -(5 + i * buttonSpread) + (xp++) * buttonSpread, buttonHeight,
				'rgb(0,0,0)',
				createNewType, -1, document.body));
		}
		for (let v = 0; v < particleKeys.length; v++)
		{
			if (curType === 'ALL' || PARTICLE_PROPERTIES[particleKeys[v]].solType == curType)
			{
				let newBut = initButton(
					particleKeys[v], -(i * buttonSpread) + (xp++) * buttonSpread, buttonHeight,
					PARTICLE_PROPERTIES[particleKeys[v]].color,
					setNewType, v, elementsHeader);
				pageButton.buttons.push(newBut);
			}
		}
		uiPagesButtons.push(pageButton);
	}
}

function initUi()
{
	let y = initInfoHeader(CANVH, 'rgba(0, 0, 0, 1)', 35);
	y = initActionHeader(y + 10, 'rgb(23, 14, 23)');
	y = inituiPagesHeader(y + 5, 'rgb(23, 14, 23)');
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
        for (let y = 0; y < GRIDH; y++) {
            grid[x][y] = null;
        }
	}
	buildGridLayer();
}

function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

let au = null;
function init()
{
	au = new AudioManager();
	initUi();
	initGrid();
}

window.onload = () => {init();	update();};