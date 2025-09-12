
let paramheader = null;
let infoMouse = null;
function initInfoText() {
	infoText = initLabelDiv(5, 0);
	infoMouse = initLabelDiv(5, 20);
}

function initParamHeader(yPos)
{
	let spread = paramBtnW + uiXmargin;
	let xm = 10;
	let n = 0;

	let sliders = [];
	sliders.push(createVerticalPressSlider("Brush Sz", spread * n++, 0, 2, 100, 1, BRUSHSIZE, setNewBrushSize));
	sliders.push(createVerticalPressSlider("Px Size", spread * n++, 0, 2, 19, 1, PIXELSIZE, setNewPixelSize));
	sliders.push(createVerticalPressSlider("Gravity", spread * n++, 0, 1, -1, .1, GRAVITY, setNewGravity));
	sliders.push(createVerticalPressSlider("Speed", spread * n++, 0, .2, 2.2, .2, SIMSPEED, setNewSpeed));
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
	brushActionButtons.push(initButton("Push", xs * nn++, 0, w, h, clr, switchBrushAction, 'PUSH', hdr, false, "p", p + "push.png", wp + "push.png", null, false, clr));
	brushActionButtons.push(initButton("Explode", xs * nn++, 0, w, h, clr, switchBrushAction, 'EXPLODE', hdr, false, "e", p + "explosion.png", wp + "explosion.png", null, false, clr));
	initButton("Next", xs * nn++, 0, w, h, clr, goToNextFrame, null, hdr, null, 'Tab', p + "next.png", null, false, clr);
	initButton("Rain", xs * nn++, 0, w, h, clr, switchRain, null, hdr, false, 'Enter', p + "drop.png", null, false, clr);
	initButton("Grid", xs * nn++, 0, w, h, clr, switchGridMode, null, hdr, true, "g", p + "grid.png", null, false, clr);
	initButton("Brush", xs * nn++, 0, w, h, clr, setNewBrushType, null, hdr, true, 'b', p + "disk.png", null, false, clr);
	initButton("Emitter", xs * nn++, 0, w, h, clr, spawnEmitterAtMouse, null, hdr, null, 'l', p + "emit.png", null, false, clr);
	initButton("Hud", xs * nn++, 0, w, h, clr, switchHud, null, hdr, true, 'u', p + "info.png", null, false, clr);

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
	const background = 'rgba(94, 73, 73, 0.16)';
    for (let i = 0; i < particleTypes.length; i++) {
        const name = particleTypes[i];
        const color = TAGS[i].color || getRandomColor();
        const famButton = initButton(name, i * buttonSpread, 0, w, h, background, switchUiPage, i, pageHeader, null, null, null, null, color);
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
	initActionHeader(0);
	initParamHeader(actionBtnH + uiYmargin);
	initParticlePagesHeader(actionBtnH + paramH + uiYmargin * 3, 'rgb(23, 14, 23)');
	initInfoText();
	setNewType(0);
	setNewBrushType('DISC');
	switchUiPage(0);
	uiLayerIndex = 0;
	updateUi();
}


grid1 = null;
N4 = null;
function buildNeighbors4(){
	let i = 0;
	let H = GRIDH, W = GRIDW;
  for (let y=0;y<H;y++){
    for (let x=0;x<W;x++,i++){
      N4[i*4+0] = (y>0    ) ? i-W : -1;
      N4[i*4+1] = (y<H-1  ) ? i+W : -1;
      N4[i*4+2] = (x>0    ) ? i-1 : -1;
      N4[i*4+3] = (x<W-1  ) ? i+1 : -1;
    }
  }
}
function idx(x,y){ return (x) + (y) * GRIDW; }
function atI(i,self){ const p = grid1[i]; return (p && p!==self && p.active) ? p : null; }
function upI(i){ const j=N4[i*4+0]; return j>=0? j : -1; }
function dnI(i){ const j=N4[i*4+1]; return j>=0? j : -1; }
function lfI(i){ const j=N4[i*4+2]; return j>=0? j : -1; }
function rtI(i){ const j=N4[i*4+3]; return j>=0? j : -1; }
function initGrid() {
	const W = GRIDW, H = GRIDH, N = W*H;
	grid1 = new Array(N);
	N4 = new Int32Array(N*4);
	buildNeighbors4();
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