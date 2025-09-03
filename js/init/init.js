
let infoHeader = null;
function initInfoHeader(yPos, color = 'black', height)
{
	infoHeader = addHeader(yPos, color, height, null);
	let infoText = document.createElement("label");
	infoText.className = "infoText";
	infoHeader.text = infoText;
	infoHeader.appendChild(infoText);

	let rInfo = document.createElement("label");
	rInfo.className = "infoText";
	rInfo.style.marginLeft = "100px";
	rInfo.style.textContent = "awf";
	infoHeader.appendChild(rInfo);
	infoHeader.rightText = rInfo;


	let sldSpread = 95;
	let x = 5;
	let y = yPos;
	let sliders = [];
	sliders.push(createVerticalPressSlider("Px Size", x, y, 1, 19, 1, PIXELSIZE, setNewPixelSize));
	sliders.push(createVerticalPressSlider("Gravity", x + sldSpread, y, -1, 1, .1, GRAVITY, setNewGravity));
	sliders.push(createVerticalPressSlider("Speed", x + sldSpread * 2, y, .2, 2.2, .2, SIMSPEED, setNewSpeed));
	sliders.push(createVerticalPressSlider("Brush Sz", x + sldSpread * 3, y, 1, MAXBRUSHSIZE, 1, BRUSHSIZE, setNewBrushSize));
	sliders.forEach(slider => document.body.appendChild(slider));
	return (yPos + height);
}

let pauseButton = null;
let pickButton = null;
let cutButton = null;
function initActionHeader(yPos, color = 'red', height = 40)
{
	let xMargin = 65;
	let nn = 1;

	let actionHeader = addHeader(yPos, color, height, null);
	pauseButton = initButton("Pause", 5, 0, "rgba(45, 67, 124, 0.18)", switchPause, -1, actionHeader, false, 'Enter');
	initButton(">", 5 + xMargin, 0, "rgba(45, 67, 124, 0.18)", goToNextFrame, null, actionHeader, null, 'Space');
	initButton("Clear", 5 + xMargin * ++nn, 0, "rgba(45, 67, 124, 0.18)", resetParticles, PIXELSIZE, actionHeader, null, 'r');
	initButton("Fall", 5 + xMargin * ++nn, 0, "rgba(51, 94, 168, 0.58)", switchRain, null, actionHeader, false, 'f');
	cutButton = initButton("Cut", 5 + xMargin * ++nn, 0, "rgba(51, 94, 168, 0.58)", switchCut, null, actionHeader, false, "c");
	pickButton = initButton("Pick", 5 + xMargin * ++nn, 0, "rgba(51, 94, 168, 0.58)", switchPick, null, actionHeader, false, "p");
	initButton("Grid", 5 + xMargin * ++nn, 0, "rgba(51, 94, 168, 0.58)", switchGridMode, null, actionHeader, true, "g");
	initButton("Brush", 5 + xMargin * ++nn, 0, "rgba(51, 94, 168, 0.58)", setNewBrushType, null, actionHeader, true, 'b');
	initButton("Emitter", 5 + xMargin * ++nn, 0, "rgba(51, 94, 168, 0.58)", spawnEmitterAtMouse, null, actionHeader, null, 'l');

	return (yPos + height);
}

function inituiPagesHeader(y, color = 'grey', height = 40)
{
	let header = addHeader(y, color, height, null);
	let buttonSpread = 65;
	let uiPAGENAMES = [];
	for (let i = 0; i < solidKeys.length; i++) uiPAGENAMES.push(solidKeys[i]);
	uiPAGENAMES.push("ALL");
	uiPAGENAMES.push("CUSTOM");
	let uiPageColors = ['rgba(115, 144, 118, 1)', 'rgba(46, 113, 207, 1)', 'rgba(129, 127, 23, 1)', 'rgba(33, 169, 117, 1)', 'grey', 'white', 'black'];
	for (let i = 0; i < uiPAGENAMES.length; i++)
	{
		let name = uiPAGENAMES[i];
		let yPos = y;
		let buttonHeight = 45;
		let pageButton = initButton(name, 5 + i * buttonSpread, yPos,uiPageColors[i], switchUiPage, i);
		let curType = solidKeys[i];
		let xp = 0;
		pageButton.sliders = [];
		pageButton.buttons = [];
		pageButton.label = name;
		if (name === 'ALL' || name === 'CUSTOM') curType = name;
		if (curType === 'CUSTOM') {
			pageButton.buttons.push(initButton(
				'MAKE', -(5 + i * buttonSpread) + (xp++) * buttonSpread, buttonHeight,
				'rgb(0,0,0)',
				createNewType, -1, pageButton));
		}
		for (let v = 0; v < particleKeys.length; v++)
		{
			if (curType === 'ALL' || PARTICLE_PROPERTIES[particleKeys[v]].solType == curType)
			{
				let newBut = initButton(
					particleKeys[v], -(i * buttonSpread) + (xp++) * buttonSpread, buttonHeight,
					PARTICLE_PROPERTIES[particleKeys[v]].color,
					setNewType, v, pageButton);
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
	y = inituiPagesHeader(y + 10, 'rgb(23, 14, 23)');

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