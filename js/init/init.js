
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
	return (yPos + height);
}

let pauseButton = null;
function initActionHeader(yPos, color = 'red', height = 40)
{
	let xMargin = 65;

	let actionHeader = addHeader(yPos, color, height, null);
	pauseButton = initButton("Pause", 5, 0, "rgba(45, 67, 124, 0.18)", switchPause, -1, actionHeader, false, 'Enter');
	initButton(">", 5 + xMargin, 0, "rgba(45, 67, 124, 0.18)", goToNextFrame, null, actionHeader, null, 'Space');
	initButton("Reset", 5 + xMargin * 2, 0, "rgba(45, 67, 124, 0.18)", resetParticles, PIXELSIZE, actionHeader, null, 'r');
	initButton("Fall", 5 + xMargin * 3, 0, "rgba(51, 94, 168, 0.58)", switchRain, null, actionHeader, false, 'f');
	initButton("Grid", 5 + xMargin * 4, 0, "rgba(51, 94, 168, 0.58)", switchGridMode, null, actionHeader, true, "g");
	initButton("Pick", 5 + xMargin * 5, 0, "rgba(51, 94, 168, 0.58)", switchPick, null, actionHeader, false, "p");
	initButton("Brush", 6 + xMargin * 6, 0, "rgba(51, 94, 168, 0.58)", setNewBrushType, null, actionHeader, true, 'b');
	initButton("Emitter", 6 + xMargin * 7, 0, "rgba(51, 94, 168, 0.58)", spawnEmitterAtMouse, null, actionHeader, null, 'l');

	let sldSpread = 300;
	let x = 5 + xMargin * 7 + 80;
	let y = yPos + 5;
	let sliders = [];
	sliders.push(createSlider("PARTICLE SIZE", x, y, 1, 14, 1, PIXELSIZE, setNewPixelSize));
	sliders.push(createSlider("GRAVITY", x + sldSpread, y, -1, 1, .1, GRAVITY, setNewGravity));
	sliders.push(createSlider("SPEED", x + sldSpread * 2, y, .2, 2, .2, SIMSPEED, setNewSpeed));
	sliders.forEach(slider => document.body.appendChild(slider));
	return (yPos + height);
}

function inituiPagesHeader(y, color = 'grey', height = 40)
{
	let header = addHeader(y, color, height, null);
	let buttonSpread = 65;
	let uiPAGENAMES = solidKeys;
	let uiPageColors = ['rgba(46, 113, 207, 1)', 'rgba(129, 127, 23, 1)', 'rgba(115, 144, 118, 1)', 'rgba(33, 169, 117, 1)', 'grey', 'black'];
	for (let i = 0; i < uiPAGENAMES.length + 1; i++)
	{
		let name = i >= uiPAGENAMES.length ? 'all': uiPAGENAMES[i];
		let yPos = y;
		let buttonHeight = 45;
		let pageButton = initButton(name, 5 + i * buttonSpread, yPos,uiPageColors[i],switchUiPage, i);
		pageButton.sliders = [];
		pageButton.buttons = [];
		pageButton.label = name;
		let curType = solidKeys[i];
		if (name == 'all') curType = 'all';
		let xp = 0;
		for (let v = 0; v < particleKeys.length; v++)
		{
			if (curType == 'all' || PARTICLE_PROPERTIES[particleKeys[v]].solType == curType)
			{
				let newBut = initButton(
				particleKeys[v], 5 + (xp++) * buttonSpread, yPos + buttonHeight,
				PARTICLE_PROPERTIES[PARTICLE_TYPES[particleKeys[v]]].color,
				setNewType, v);
				pageButton.buttons.push(newBut);
			}
		}
		uiPagesButtons.push(pageButton);
	}
}

function initUi()
{
	let y = initInfoHeader(CANVH, 'rgba(0, 0, 0, 1)', 25);
	y = initActionHeader(y, 'rgb(23, 14, 23)');
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