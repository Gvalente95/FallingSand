function createVerticalPressSlider(labelText, x, y, min, max, step, value, onChange, totalHeight = 180, width = 90) {
	const sldWidth = "30px";
	const container = document.createElement("div");
	container.style.position = "absolute";
	container.style.left = x + "px";
	container.style.top = y + "px";
	container.style.display = "inline-flex";
	container.style.alignItems = "center";
	container.style.userSelect = "none";
	container.style.gap = "8px";
	container.style.zIndex = "9999";

	let isInverted = min > max;
	if (isInverted) {
		let tmp = min;
		min = max;
		max = tmp;
	}

	const hotzone = document.createElement("div");
	hotzone.style.display = "flex";
	hotzone.style.alignItems = "center";
	hotzone.style.justifyContent = "center";
	hotzone.style.width = width + "px";
	hotzone.style.height = "32px";
	hotzone.style.border = "2px solid #303030ff";
	hotzone.style.background = "linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0) 50%), rgba(0,0,0,.6)";
	hotzone.style.cursor = "ns-resize";

	const label = document.createElement("span");
	label.textContent = labelText;
	label.style.color = "white";
	label.style.fontFamily = "'Press Start 2P', monospace";
	label.style.fontSize = "12px";
	label.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";

	const popup = document.createElement("div");
	popup.style.position = "absolute";
	popup.style.left = "50%";
	popup.style.top = "50%";
	popup.style.transform = "translate(-50%, -50%)";
	popup.style.padding = "8px";
	popup.style.background = "rgba(0,0,0,.73)";
	popup.style.border = "2px solid #000";
	popup.style.borderRadius = "10px";
	popup.style.boxShadow = "0 3px 0 #5a0000, inset 0 0 0 2px rgba(255,255,255,.08), inset 0 -6px 10px rgba(0,0,0,.25)";
	popup.style.display = "none";
	popup.style.zIndex = "2000";

	const trackWrapper = document.createElement("div");
	trackWrapper.style.position = "relative";
	trackWrapper.style.display = "flex";
	trackWrapper.style.alignItems = "center";
	trackWrapper.style.justifyContent = "center";

	const track = document.createElement("div");
	track.style.position = "relative";
	track.style.height = totalHeight + "px";
	track.style.width = sldWidth;
	track.style.display = "flex";
	track.style.flexDirection = "column";
	track.style.alignItems = "center";
	track.style.justifyContent = "center";
	track.style.cursor = "ns-resize";
	track.style.padding = "6px 0";

	const steps = Math.floor((max - min) / step) + 1;
	const rects = [];
	const minRectH = 4;
	const rectM = 2;
	const usableHeight = totalHeight - 12;
	const maxRectsByHeight = Math.max(2, Math.floor(usableHeight / (minRectH + rectM * 2)));
	const visualCount = Math.min(steps, maxRectsByHeight);
	const rectH = Math.max(minRectH, Math.floor((usableHeight - rectM * 2 * visualCount) / visualCount));

	const centerValue = (min + max) / 2;
	const centerIndex = Math.round((centerValue - min) / step);
	let currentIndex = Math.max(0, Math.min(steps - 1, Math.round((value - min) / step)));
	let pointerActive = false;
	let startIndex = currentIndex;
	let startClientY = 0;

	const maxLabel = document.createElement("span");
	maxLabel.textContent = max;
	maxLabel.style.position = "absolute";
	maxLabel.style.top = "-2px";
	maxLabel.style.color = "#fff";
	maxLabel.style.fontFamily = "'Press Start 2P', monospace";
	maxLabel.style.fontSize = "12px";
	maxLabel.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";

	const minLabel = document.createElement("span");
	minLabel.textContent = min;
	minLabel.style.position = "absolute";
	minLabel.style.bottom = "0px";
	minLabel.style.color = "#fff";
	minLabel.style.fontFamily = "'Press Start 2P', monospace";
	minLabel.style.fontSize = "12px";
	minLabel.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";

	const curLabel = document.createElement("span");
	curLabel.textContent = (min + currentIndex * step).toFixed(1);
	curLabel.style.position = "absolute";
	curLabel.style.right = "-80px";
	curLabel.style.top = "50%";
	curLabel.style.transform = "translateY(-50%)";
	curLabel.style.color = "#fff";
	curLabel.style.zIndex = 99999;
	curLabel.style.fontFamily = "'Press Start 2P', monospace";
	curLabel.style.fontSize = "20px";
	curLabel.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";
	curLabel.style.display = "none";

	for (let i = visualCount - 1; i >= 0; i--) {
		const r = document.createElement("div");
		r.style.width = "10px";
		r.style.height = rectH + "px";
		r.style.margin = rectM + "px 0";
		r.style.backgroundColor = "rgba(255,255,255,.3)";
		r.style.boxShadow = "inset 0 0 0 1px #000";
		r.style.borderRadius = "2px";
		track.appendChild(r);
		rects.push(r);
	}

	function clampIndex(i) { return Math.max(0, Math.min(steps - 1, i)); }
	function indexToVisual(i) {
		if (visualCount <= 1 || steps <= 1) return 0;
		return Math.round((i / (steps - 1)) * (visualCount - 1));
	}
	function paintIndex(i) {
		const vi = indexToVisual(i);
		for (let k = 0; k < rects.length; k++) rects[k].style.backgroundColor = "rgba(255,255,255,.3)";
		rects[visualCount - 1 - vi].style.backgroundColor = "rgba(255,255,255,.9)";
	}
	function positionCurLabelFromIndex(i) {
		const r = track.getBoundingClientRect();
		const t = 1 - (i / (steps - 1));
		const ypx = t * r.height;
		curLabel.style.top = ypx + "px";
		curLabel.style.transform = "translateY(-50%)";
	}
	function applyIndex(i) {
		let prvIndex = currentIndex;
		currentIndex = clampIndex(i);
		if (prvIndex != currentIndex) {
			const val = min + currentIndex * step;
			curLabel.textContent = val.toFixed(1);
			paintIndex(currentIndex);
			if (onChange) onChange(val);
			au.playSound(au.click);
		}
	}
	function indexFromClientYRelative(clientY) {
		const r = track.getBoundingClientRect();
		const dy = clientY - startClientY;
		const stepsPerPx = (steps - 1) / r.height;
		return startIndex + Math.round(-dy * stepsPerPx);
	}
	function showPopup() { popup.style.display = "block"; }
	function hidePopup() { popup.style.display = "none"; }

	function pointerDown(e) {
		pointerActive = true;
		startIndex = currentIndex;
		startClientY = e.touches ? e.touches[0].clientY : e.clientY;
		showPopup();
		curLabel.style.display = "block";
		positionCurLabelFromIndex(currentIndex);
		window.addEventListener("mousemove", pointerMove, { passive: false });
		window.addEventListener("touchmove", pointerMove, { passive: false });
		window.addEventListener("mouseup", pointerUp, { once: true });
		window.addEventListener("touchend", pointerUp, { once: true });
	}
	function pointerMove(e) {
		if (!pointerActive) return;
		if (e.cancelable) e.preventDefault();
		const cY = e.touches ? e.touches[0].clientY : e.clientY;
		const idx = clampIndex(indexFromClientYRelative(cY));
		applyIndex(idx);
		positionCurLabelFromIndex(idx);
	}
	function pointerUp() {
		settingBrushSize = false;
		pointerActive = false;
		hidePopup();
		curLabel.style.display = "none";
		window.removeEventListener("mousemove", pointerMove);
		window.removeEventListener("touchmove", pointerMove);
	}
	function jumpToCenter() { applyIndex(centerIndex); positionCurLabelFromIndex(centerIndex); }

	hotzone.addEventListener("mousedown", pointerDown);
	hotzone.addEventListener("touchstart", pointerDown, { passive: true });
	hotzone.addEventListener("dblclick", jumpToCenter);

	hotzone.appendChild(label);
	trackWrapper.appendChild(track);
	trackWrapper.appendChild(maxLabel);
	trackWrapper.appendChild(minLabel);
	trackWrapper.appendChild(curLabel);

	container.appendChild(hotzone);
	popup.appendChild(trackWrapper);
	container.appendChild(popup);

	paintIndex(currentIndex);
	return container;
}

function createSlider(labelText, x, y, min, max, step, value, onChange, height = 16, width = 5) {
    const container = document.createElement("label");
    container.style.position = "absolute";
    container.style.left = x + "px";
    container.style.top = y + "px";
    container.style.display = "flex";
    container.style.alignItems = "center";
	container.style.padding = "5px";
	container.style.userSelect = "none";
	
    const labelSpan = document.createElement("span");
	labelSpan.textContent = labelText;
    labelSpan.style.color = "white";
    labelSpan.style.fontFamily = "'Press Start 2P', monospace";
	labelSpan.style.fontSize = "10px";
	labelSpan.style.userSelect = "none";
    labelSpan.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";
    labelSpan.style.marginRight = "10px";

    const sliderContainer = document.createElement("div");
    sliderContainer.style.display = "flex";
    sliderContainer.style.flexDirection = "row";
    sliderContainer.style.alignItems = "center";
    sliderContainer.style.height = height + "px";
    sliderContainer.style.backgroundColor = "rgba(0, 0, 0, 0.73)";
	sliderContainer.style.maxWidth = "150px";
    sliderContainer.style.overflowX = "auto";
    sliderContainer.style.overflowY = "hidden";
    sliderContainer.style.whiteSpace = "nowrap";
    sliderContainer.style.userSelect = "none";
    sliderContainer.style.cursor = "pointer";

	const steps = Math.floor((max - min) / step) + 1;
    const rects = [];
    let currentValue = value;
    let isDragging = false;

    for (let i = 0; i < steps; i++) {
    const stepValue = Number((min + i * step).toFixed(2));
    const rect = document.createElement("div");
    const rectWidth = steps > 20 ? 5 : 10;
    const rectMargin = steps > 20 ? 1 : 2;
    rect.style.width = rectWidth + "px";
    rect.style.height = height + "px";
    rect.style.backgroundColor = stepValue === value ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.3)";
    rect.style.margin = "0 " + rectMargin + "px";
    rect.style.boxShadow = "inset 0 0 0 1px rgb(0, 0, 0)";
    rect.style.display = "inline-block";
    rects.push(rect);
    sliderContainer.appendChild(rect);
}

    function selectRectAtPosition(clientX) {
  const r = sliderContainer.getBoundingClientRect();
  const rectWidth = steps > 20 ? 5 : 10;
  const rectMargin = steps > 20 ? 1 : 2;
  const unit = rectWidth + rectMargin * 2;
  const x = clientX - r.left + sliderContainer.scrollLeft - rectMargin;
  let index = Math.round(x / unit);
  index = Math.max(0, Math.min(steps - 1, index));
  const selectedRect = rects[index];
  if (selectedRect) {
    currentValue = min + index * step;
    valueDisplay.textContent = String(currentValue).slice(0, 5);
    rects.forEach(el => { el.style.backgroundColor = "rgba(255, 255, 255, 0.3)"; });
    selectedRect.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    if (onChange) onChange(currentValue);
    selectedRect.scrollIntoView({ inline: "center", behavior: "smooth" });
  }
}

    sliderContainer.addEventListener("mousedown", (e) => {isDragging = true; selectRectAtPosition(e.clientX);});
	sliderContainer.addEventListener("mousemove", (e) => {
		if (isDragging) {
            e.preventDefault();
            selectRectAtPosition(e.clientX);
        }
    });
	document.addEventListener("mouseup", () =>{isDragging = false;});

    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = String(value);
    valueDisplay.style.width = "40px";
    valueDisplay.style.color = "white";
    valueDisplay.style.fontFamily = "'Press Start 2P', monospace";
    valueDisplay.style.fontSize = "10px";
    valueDisplay.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";
    valueDisplay.style.marginLeft = "10px";

    container.appendChild(labelSpan);
    container.appendChild(sliderContainer);
    container.appendChild(valueDisplay);

    const initialRect = rects.find(r => r.style.backgroundColor === "rgba(255, 255, 255, 0.9)");
    if (initialRect) initialRect.scrollIntoView({ inline: "center", behavior: "auto" });
    return container;
}

function initImageDiv(imgPath, x, y, color, parent = document.body) {
	let div = document.createElement("div");
	div.style.position = "absolute";
	div.style.minWidth = "60px";
	div.style.height = "40px";
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.color = 'rgba(213, 213, 213, 1)';
	const img = new Image();
	img.onload = ()=>{ div.style.background = `${color} url("${imgPath}") calc(50% - 10px)center/contain no-repeat`; };
	img.onerror = ()=>{ div.style.setProperty('--btn-bg', color); div.style.backgroundColor = color; };
	img.src = imgPath;
	img.backgroundColor = "white";
	if (parent) parent.appendChild(div);
	return (div);
}

function initButton(label, x, y, color, onChange, value = null, parent = document.body, isSwitch = null, keyToggle = null, imgPath = null, mouseFollowImg = null, clrText = false) {
	function formatKeyLabel(k){
	if(!k) return "";
	const map={
		"ArrowUp":"↑","ArrowDown":"↓","ArrowLeft":"←","ArrowRight":"→",
		"Space":"␣","Enter":"⏎","Escape":"Esc","Backspace":"⌫",
		"ShiftLeft":"Shift","ShiftRight":"Shift","ControlLeft":"Ctrl","ControlRight":"Ctrl",
		"AltLeft":"Alt","AltRight":"Alt","MetaLeft":"Meta","MetaRight":"Meta"
	};
	if(map[k]) return map[k];
	if(/^Key[A-Z]$/.test(k)) return k.slice(3);
	if(/^Digit[0-9]$/.test(k)) return k.slice(5);
	return k.length===1 ? k.toUpperCase() : k;
	}

	let div = document.createElement("div");
	div.className = "button";
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.setProperty('--btn-bg', color);
	div.style.backgroundColor = color;
	div.style.color = 'rgba(213, 213, 213, 1)';
	div.style.position = div.style.position || "absolute";
	div.style.boxSizing = "border-box";
	if (isMobile || !imgPath) {
		div.style.display = "flex";
		div.style.alignItems = "center";
		div.style.justifyContent = "center";
		if (clrText) {
			div.style.color = color;
			div.style.backgroundColor = "black";	
		}
		const fontSize = clamp(60 / label.length, 6, 20);
		div.style.fontSize = fontSize + "px";
		const minWidth = Math.max(50, fontSize * (label.length * 0.7));
		div.style.minWidth = minWidth + "px";
		div.textContent = label;
		div.textContent = label;
	}
	div.label = label;
	div.value = value;
	div.active = isSwitch;
	if (div.active) div.classList.add("activeButton");
	div.addEventListener("mouseup", activate);
	div.setAttribute("tabindex", "0");

	// if (imgPath && 0) {
	// 	const img = new Image();
	// 	img.onload = ()=>{ div.style.background = `${color} url("${imgPath}") calc(50% - 10px) center/contain no-repeat`; };
	// 	img.onerror = ()=>{ div.style.setProperty('--btn-bg', color); div.style.backgroundColor = color; };
	// 	img.src = imgPath;
	// 	img.backgroundColor = "white";
	// 	if (mouseFollowImg) {
	// 		div.cursorImg = initImageDiv(mouseFollowImg, CANVW / 2, CANVH / 2, "rgba(0,0,0,0)", document.body);
	// 		div.cursorImg.style.display = "none";
	// 		div.cursorImg.style.pointerEvents = "none";
	// 		let rafId = null;
	// 		const inside = () => MOUSEX >= 0 && MOUSEY >= 0 && MOUSEX < CANVW && MOUSEY < CANVH;
	// 		const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = null; div.cursorImg.style.display = "none"; };
	// 		const loop = () => {
	// 			if (!MOUSEPRESSED || !div.active) return stop();
	// 			if (!inside()) { div.cursorImg.style.display = "none"; rafId = requestAnimationFrame(loop); return; }
	// 			div.cursorImg.style.top = (MOUSEY - 40) + "px";
	// 			div.cursorImg.style.left = MOUSEX + "px";
	// 			div.cursorImg.style.display = "block";
	// 			rafId = requestAnimationFrame(loop);
	// 		};
	// 		window.addEventListener("mousedown", () => { if (div.active && inside() && !rafId) loop(); });
	// 		window.addEventListener("mouseup", stop);
	// 		window.addEventListener("blur", stop);
	// 	}
	// }

	if (keyToggle) {
	window.addEventListener("keydown", (e) => {
		if (e.code === keyToggle || e.key == keyToggle) activate();
	});
		if (!isMobile) {
			const badge=document.createElement("span");
			badge.className = "buttonBadge";
			badge.textContent=formatKeyLabel(keyToggle);
			div.appendChild(badge); 
		}
	}

	if (parent) parent.appendChild(div);

	function activate() {
		if (isDraggingheader) return;
		if (isSwitch != null) {
			div.active = !div.active;
			if (div.active) div.classList.add("activeButton");
			else div.classList.remove("activeButton");
			if (onChange) { onChange(div.value != null ? value : div.active); }
		} else if (onChange) onChange(value);
		updateUi();
		au.playSound(au.tuk);
		div.classList.add("clicked");
		setTimeout(() => { div.classList.remove("clicked"); }, 100);
	}
	return div;
}

let isDraggingheader = false;
function addHeader(y, color, height, borderColor = null, dragWidth = 0) {
	let header = document.createElement("div");
	header.style.top = y + "px";
	header.style.left = "0px";
	header.className = "uiHeader";
	header.style.width = CANVW + "px";
	if (color) header.style.backgroundColor = color;
	else header.style.backgroundColor = "rgba(0, 0, 0, 0)";
	header.style.height = height + "px";
	header.style.position = "absolute";
	header.style.userSelect = "none";
	if (borderColor) header.style.border = "1px solid " + borderColor;
	document.body.appendChild(header);

	if (dragWidth <= 0 || !isMobile) return (header);
	header.style.cursor = "grab";
	header.style.width = dragWidth + "px";
	let dragging = false;
	let startX = 0;
	let startLeft = 0;
	function onMove(e){
		if (!dragging) return;
		const dx = e.clientX - startX;
		isDraggingheader = Math.abs(dx) > 1;
		const maxLeft = 0;
		const minLeft = -parseFloat(header.style.width);
		header.style.left = clamp(startLeft + dx, minLeft, maxLeft) + "px";}
	function onUp(){
		dragging = false;
		isDraggingheader = false;
		header.style.cursor = "grab";
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onUp);}
	header.addEventListener("mousedown", (e) => {
	dragging = true;
	header.style.cursor = "grabbing";
	startX = e.clientX;
	startLeft = parseFloat(getComputedStyle(header).left) || 0;
	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseup", onUp);
	});
	return header;
}

function updateUi()
{
	let openColor = uiLayerIndex == 0 ? selButtonColor : "none";
	for (let i = 0; i < uiPagesButtons.length; i++)
	{
		let buttons = uiPagesButtons[i];
		let isOpen = uiPageIndex == i;
		buttons.style.border = isOpen ? openColor : "1px solid rgba(0, 0, 0, 1)"
		buttons.style.opacity = isOpen ? "1" : '.6';
		for (const b of buttons.buttons) { if (b.isSwitch) continue; b.style.display = isOpen ? 'block' : 'none';}
		for (const s of buttons.sliders) s.style.display = isOpen ? 'block' : 'none';
	}
	openColor = uiLayerIndex == 1 ? selButtonColor : "2px solid rgba(255, 255, 255, 1)";
	let uiButtons = uiPagesButtons[uiPageIndex].buttons;
	for (let i = 0; i < uiButtons.length; i++)
	{
		let b = uiButtons[i];
		let isOpen = typeButton && b.label == typeButton.label;
		if (uiPagesButtons[uiPageIndex].label === 'BRUSH') isOpen = b.value == BRUSHTYPE;
		b.style.border = isOpen ? openColor : "1px solid rgba(0, 0, 0, 1)"
		b.style.opacity = isOpen ? "1" : '.6';
	}
}

function switchUiPage(newPageIndex) {uiPageIndex = newPageIndex;}
function setNewType(newIndex) { switchCut(false); TYPEINDEX = newIndex; for (const b of uiPagesButtons[uiPageIndex].buttons) if (b.label == particleKeys[newIndex]) typeButton = b; }
function getCurButtonTypeIndex()
{
	for (let i = 0; i < uiPagesButtons[uiPageIndex].buttons.length; i++)
	{
		let b = uiPagesButtons[uiPageIndex].buttons[i];
		if (b.label == particleKeys[TYPEINDEX]) return (i);
	}
	return (0);
}

function getCurTypeIndex(typeString) { return (particleKeys.indexOf(typeString)); }

let settingBrushSize = false;
function setNewBrushSize(newPercentile) { BRUSHSIZE = ((Math.min(GRIDW, GRIDH) / 3) / 100) * newPercentile; settingBrushSize = true; }
function setNewBrushType(newType) { BRUSHTYPE = BRUSHTYPE == 'RECT' ? 'DISC' : 'RECT'; }
function setNewGravity(newGravity) { GRAVITY = newGravity;}
function setNewSpeed(newSpeed) { SIMSPEED = newSpeed; }
function switchGridMode(newGridMode) { gridMode = newGridMode; }
function setRAINPOW(newIntensity) { RAINPOW = (newIntensity / (PIXELSIZE));}
function goToNextFrame() { switchPause(true); update(false); };
function switchRewinding(newRewind) {ISREWINDING = newRewind;}
function goToPrevFrame() {
	if (!ISREWINDING) switchPause(true);
	initGrid();
	let hasReachedEnd = false;
	for (const p of activeParticles) {
		if (!p.prvP.length) { hasReachedEnd++; continue; }
		let prvP = p.prvP.pop();
		p.updatePosition(prvP[0], prvP[1], false);
		p.velX = prvP[2];
		p.velY = prvP[3];
	}
	if (hasReachedEnd >= activeParticles.length) { switchRewinding(); switchPause(true); }
};

function deactivateSwitchButton(button) {
	button.active = false;
	button.classList.remove("activeButton");
}

function switchRain(newActive) { ISRAINING = newActive; }
function switchCut(newCut) {
	BRUSHCUT = newCut;
	if (!newCut) deactivateSwitchButton(cutButton);
	else switchPick(false);
}

function switchPick(newActive)
{
	PICKACTIVE = newActive;
	if (!newActive) deactivateSwitchButton(pickButton);
	else switchCut(false);
}

function setNewPixelSize(newPixelSize)
{
	BRUSHSIZE = clamp(Math.round(BRUSHSIZE * (PIXELSIZE / newPixelSize)), 1, MAXBRUSHSIZE);
	PIXELSIZE = newPixelSize;
	GRIDW = Math.floor(CANVW / PIXELSIZE);
	GRIDH = Math.floor(CANVH / PIXELSIZE);
	resetParticles();
}

function switchPause(newPause = !inPause) {
    if (newPause == -1) newPause = !inPause;
    inPause = newPause;
    if (inPause) pauseButton.classList.add("activeButton");
    else pauseButton.classList.remove("activeButton");
}