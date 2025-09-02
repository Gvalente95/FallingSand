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

    // rect.addEventListener("click", (e) => {
    //     e.stopPropagation(); // Prevent triggering container drag
    //     currentValue = Math.max(0.01, Number(stepValue.toFixed(2))); // Ensure min 0.01 and 2 decimals
    //     valueDisplay.textContent = currentValue.toFixed(2); // Limit to 2 decimal places
    //     rects.forEach(r => r.style.backgroundColor = "rgba(255, 255, 255, 0.3)");
    //     rect.style.backgroundColor = "rgba(255, 255, 255, 0.9)"; // Highlight selected
    //     if (onChange) onChange(currentValue);
    //     rect.scrollIntoView({ inline: "center", behavior: "smooth" });
    // });

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

    sliderContainer.addEventListener("mousedown", (e) => {
        isDragging = true;
        selectRectAtPosition(e.clientX);
        e.preventDefault();
    });

    sliderContainer.addEventListener("mousemove", (e) => {
        if (isDragging) {
            selectRectAtPosition(e.clientX);
            e.preventDefault();
        }
    });

    document.addEventListener("mouseup", () => {isDragging = false;});

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

function initButton(label, x, y, color, onChange, value = null, parent = document.body, isSwitch = null, keyToggle = null) {
    let div = document.createElement("div");
    div.className = "button";
    div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.setProperty('--btn-bg', color);
    div.style.backgroundColor = color;
    div.style.color = 'rgba(213, 213, 213, 1)';
    div.textContent = label.slice(0, 5);
    div.label = label;
	div.value = value;
    div.active = isSwitch;
    if (div.active) div.classList.add("activeButton");
    div.addEventListener("mousedown", activate);
    div.setAttribute("tabindex", "0");

	if (keyToggle) {window.addEventListener("keydown", (e) => { if (e.code === keyToggle || e.key == keyToggle) activate(); });}
    parent.appendChild(div);

    function activate() {
		if (isSwitch != null) {
            div.active = !div.active;
            if (div.active) div.classList.add("activeButton");
            else div.classList.remove("activeButton");
            if (onChange) { onChange(div.value != null ? value : div.active); }
        } else if (onChange) onChange(value);
		updateUi();
		div.classList.add("clicked");
		setTimeout(() => { div.classList.remove("clicked"); }, 100);
    }
    return div;
}

function addHeader(y, color, height, borderColor = null)
{
	let uiContainer = document.createElement("div");
	uiContainer.style.top = y + "px";
	uiContainer.className = "uiHeader";
	uiContainer.style.backgroundColor = color;
	uiContainer.style.height = height + "px";
	if (borderColor) uiContainer.style.border = "1px solid " + borderColor;
	document.body.appendChild(uiContainer);
	return uiContainer;
}

function updateUi()
{
	let openColor = uiLayerIndex == 0 ? selButtonColor : "none";
	for (let i = 0; i < uiPagesButtons.length; i++)
	{
		let buttons = uiPagesButtons[i];
		let isOpen = uiPageIndex == i;
		buttons.style.border = isOpen ? openColor : "1px solid rgba(0, 0, 0, 1)"
		buttons.style.color = isOpen ? 'rgba(255, 255, 255, 1)' : 'rgba(213, 213, 213, 1)';
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
		b.style.color = isOpen ? 'rgba(255, 255, 255, 1)' : 'rgba(213, 213, 213, 1)';
	}
}

function switchUiPage(newPageIndex){ uiPageIndex = newPageIndex;}
function setNewType(newIndex) { TYPEINDEX = newIndex; for (const b of uiPagesButtons[uiPageIndex].buttons) if (b.label == particleKeys[newIndex]) typeButton = b; }
function getCurButtonTypeIndex()
{
	for (let i = 0; i < uiPagesButtons[uiPageIndex].buttons.length; i++)
	{
		let b = uiPagesButtons[uiPageIndex].buttons[i];
		if (uiPagesButtons[uiPageIndex].label === 'BRUSH' && b.value == BRUSHTYPE) return (i);
		else if (b.label == particleKeys[TYPEINDEX]) return (i);
	}
	return (0);
}

function getCurTypeIndex(typeString) { return (particleKeys.indexOf(typeString)); }

function setNewBrushSize(newBrushSize) { BRUSHSIZE = newBrushSize; }
function setNewBrushType(newType) { BRUSHTYPE = BRUSHTYPE == 'RECT' ? 'DISC' : 'RECT'; }
function setNewGravity(newGravity) { GRAVITY = newGravity;}
function setNewSpeed(newSpeed) { SIMSPEED = newSpeed; }
function switchGridMode(newGridMode) { gridMode = newGridMode;}
function setRainIntensity(newIntensity) { RAININTENSITY = (newIntensity / (PIXELSIZE));}
function goToNextFrame() { switchPause(true); update(false); };
function switchRain(newActive) { ISRAINING = newActive; }
function switchPick(newActive) { if (pxAtMouse) setNewType(getCurTypeIndex(pxAtMouse.type)); else PICKACTIVE = newActive; }

function setNewPixelSize(newPixelSize)
{
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