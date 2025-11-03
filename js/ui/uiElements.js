let settingSlider = null;
function createVerticalPressSlider(labelText, x, y, min, max, step, value, onChange, totalHeight = 180, width = paramBtnW) {
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
	label.style.fontFamily = "'MyPixelFont', monospace";
	label.style.paddingTop = '10px';
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
	if (isInverted) currentIndex = visualCount - currentIndex;
	let pointerActive = false;
	let startIndex = currentIndex;
	let startClientY = 0;

	const maxLabel = document.createElement("span");
	maxLabel.textContent = isInverted ? min : max;
	maxLabel.style.position = "absolute";
	maxLabel.style.top = "-2px";
	maxLabel.style.color = "#fff";
	maxLabel.style.fontFamily = "'MyPixelFont', monospace";
	maxLabel.style.fontSize = "12px";
	maxLabel.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";

	const minLabel = document.createElement("span");
	minLabel.textContent = isInverted ? max : min;
	minLabel.style.position = "absolute";
	minLabel.style.bottom = "0px";
	minLabel.style.color = "#fff";
	minLabel.style.fontFamily = "'MyPixelFont', monospace";
	minLabel.style.fontSize = "12px";
	minLabel.style.textShadow = "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000";

	const curLabel = document.createElement("span");
	curLabel.textContent = ((min + currentIndex * step)* (isInverted ? -1 : 1)).toFixed(1);
	curLabel.style.position = "absolute";
	curLabel.style.right = "-80px";
	curLabel.style.top = "50%";
	curLabel.style.transform = "translateY(-50%)";
	curLabel.style.color = "#fff";
	curLabel.style.zIndex = 99999;
	curLabel.style.fontFamily = "'MyPixelFont', monospace";
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
		let index = visualCount - 1 - vi;
		rects[index].style.backgroundColor = "rgba(255,255,255,.9)";
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
			let val = min + currentIndex * step;
			if (isInverted) { val *= -1; }
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
		settingSlider = container;
		if (e.cancelable) e.preventDefault();
		const cY = e.touches ? e.touches[0].clientY : e.clientY;
		const idx = clampIndex(indexFromClientYRelative(cY));
		applyIndex(idx);
		positionCurLabelFromIndex(idx);
	}
	function pointerUp() {
		settingBrushSize = false;
		settingSlider = null;
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

function initButton(label, x, y, w, h, color, onChange, value = null, parent = document.body, isSwitch = null, keyToggle = null, imgPath = null, mouseFollowImg = null, clrText = false, desc = null) {
	function formatKeyLabel(k){
		if(!k) return "";
		const map={
			"ArrowUp":"↑","ArrowDown":"↓","ArrowLeft":"←","ArrowRight":"→",
			"Space":"␣","Enter":"⏎","Escape":"Esc","Backspace":"⌫",
			"ShiftLeft":"shift","ShiftRight":"shift","ControlLeft":"Ctrl","ControlRight":"Ctrl",
			"AltLeft":"Alt","AltRight":"Alt","MetaLeft":"Meta","MetaRight":"Meta"
		};
		if(map[k]) return map[k];
		if(/^Key[A-Z]$/.test(k)) return k.slice(3);
		if(/^Digit[0-9]$/.test(k)) return k.slice(5);
		return k.length===1 ? k.toUpperCase() : k;
	}
	let div = document.createElement("div");
	div.className = "button";
	div.x = x;
	div.y = y;
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.width = w + 'px'; div.style.minWidth = w + 'px';
	div.style.height = h + 'px'; div.style.lineHeight = h + 'px';
	div.style.setProperty('--btn-bg', color);
	div.style.backgroundColor = color;
	div.baseClr = color;
	div.style.color = 'rgba(255, 255, 255, 1)';
	div.style.position = div.style.position || "absolute";
	div.style.boxSizing = "border-box";
	div.new = true;
	if (!imgPath) {
		div.style.display = "flex";
		div.style.alignItems = "center";
		div.style.justifyContent = "center";
		div.textContent = label.substring(0, 5);
		div.style.paddingTop = '5px';
		if (clrText) div.style.color = setBrightness(clrText);
		div.style.fontSize = 13 + "px";
	}
	div.label = label;
	div.value = value;
	div.active = isSwitch;
	div.addEventListener("mouseup", activate);
	div.setAttribute("tabindex", "0");

	if (keyToggle) {
		window.addEventListener("keydown", (e) => {
			if (inPrompt && !div.isPrompt) return;
 			if (e.code === keyToggle || e.key == keyToggle || e.key.toLowerCase() == keyToggle) {activate();}
		});
		if (!isMobile) {
			div.badge = initLabelDiv(x + w - 10, canvas.height + 5, formatKeyLabel(keyToggle), null, 'rgba(203, 185, 211, 1)');
			div.badge.style.fontSize = '12px';
			div.badge.style.pointerEvents = "none";
			div.style.paddingTop = '10px';
			div.style.zIndex = "0";
			uiContainer.appendChild(div.badge);

			if (desc) {
				let descDiv = initLabelDiv(x, canvas.height - 30, desc, null, "rgba(255, 255, 255, 1)", document.body);
				div.addEventListener("mouseenter", () => {
					if (!inPrompt || div.isPrompt)
						descDiv.style.display = "block";
				});
				div.addEventListener("mouseleave", () => {
					if (!inPrompt || div.isPrompt)
						descDiv.style.display = "none";
				});
				descDiv.style.display = "none";
			}
		}
	}

	if (imgPath) {
		setButtonImage(div, imgPath, color);
		if (mouseFollowImg) {
			div.cursorImg = initImageDiv(mouseFollowImg, CANVW / 2, CANVH / 2, "rgba(0,0,0,0)", document.body);
			div.cursorImg.style.display = "none";
			div.cursorImg.style.pointerEvents = "none";
			let rafId = null;
			const inside = () => MOUSE.x >= 0 && MOUSE.y >= 0 && MOUSE.x < CANVW && MOUSE.y < CANVH;
			const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = null; div.cursorImg.style.display = "none"; };
			const loop = () => {
				if (!div.active) return stop();
				if (!inside()) { div.cursorImg.style.display = "none"; rafId = requestAnimationFrame(loop); return; }
				let brRad = (BRUSHSIZE / 2) * PIXELSIZE;
				div.cursorImg.style.top = (MOUSE.y - brRad) + "px";
				div.cursorImg.style.left = (MOUSE.x + brRad) + "px";
				div.cursorImg.style.display = "block";
				rafId = requestAnimationFrame(loop);
			};
			window.addEventListener("mousedown", () => {
				if (inPrompt && !div.isPrompt) return;
				if (div.active && inside() && !rafId) loop();
			});
			if (keyToggle) {
				window.addEventListener("keydown", (e) => {
					if (inPrompt && !div.isPrompt) return;
					if (e.code === keyToggle || e.key == keyToggle || e.key.toLowerCase() == keyToggle) { loop(); }
				});
			}
		}
	}
	function activate() {
		if (inPrompt && !div.isPrompt) return;
		if (isDraggingheader) return;
		if (isSwitch != null) {
			div.active = !div.active;
			if (div.active) div.classList.add("activeButton");
			else div.classList.remove("activeButton");
			if (onChange) { onChange(div.value != null && div.active ? value : div.value != null ? null : div.active); }
		} else if (onChange) onChange(value);
		div.new = false;
		updateUi();
		au.playSound(au.clock, .1);
		div.classList.add("clicked");
		setTimeout(() => { div.classList.remove("clicked"); }, 100);
	}
	if (parent) parent.appendChild(div);
	return div;
}

function setButtonName(button, newName) {
	button.textContent = newName.substring(0, 5);
}

function setButtonImage(button, imgPath, color = "transparent") {
  button.style.background = "";
  button.style.backgroundColor = color;
  button.style.backgroundImage = `url("${imgPath}")`;
  button.style.backgroundRepeat = "no-repeat";
  button.style.backgroundPosition = "center";
  button.style.backgroundSize = "contain";
  button.textContent = "";
}

let isDraggingheader = false;

function addHeader(x, y, color, height, borderColor = null, dragWidth = 0) {
  const header = document.createElement("div");
  uiContainer.appendChild(header);
  header.style.top = y + "px";
  header.style.left = x + "px";
  header.className = "uiHeader";
  header.style.width = CANVW + "px";
  header.style.backgroundColor = color ? color : "rgba(255, 255, 255, 0)";
  header.style.height = height + "px";
  header.style.position = "absolute";
  header.style.userSelect = "none";
  if (borderColor) header.style.border = "1px solid " + borderColor;
  if (dragWidth <= 0 || !isMobile) return header;

  header.style.cursor = "grab";
  header.style.width = dragWidth + "px";

  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  let lastX = 0;
  let lastT = 0;
  let vx = 0;

  const getLeft = () => parseFloat(getComputedStyle(header).left) || 0;
  const bounds = () => {
    const w = parseFloat(header.style.width) || 0;
    return { min: Math.min(0, CANVW - w), max: 0 };
  };

  const step = btnW + uiXmargin;
  const snaps = () => {
    const b = bounds();
    const arr = [];
    for (let s = 0; s >= b.min; s -= step) arr.push(s);
    if (arr[arr.length - 1] !== b.min) arr.push(b.min);
    return arr;
  };

  const nearestSnapIdx = (v) => {
    const s = snaps();
    let idx = 0, d = Math.abs(v - s[0]);
    for (let i = 1; i < s.length; i++) {
      const di = Math.abs(v - s[i]);
      if (di < d) { d = di; idx = i; }
    }
    return idx;
  };

  const animateTo = (target) => {
    const b = bounds();
    header.style.transition = "left 220ms cubic-bezier(.22,.61,.36,1)";
    header.style.left = clamp(target, b.min, b.max) + "px";
    const done = () => { header.style.transition = ""; header.removeEventListener("transitionend", done); };
    header.addEventListener("transitionend", done);
  };

  const onMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const x = e.clientX ?? 0;
    const t = performance.now();
    const dx = x - startX;
    const b = bounds();
    header.style.left = clamp(startLeft + dx, b.min, b.max) + "px";
    isDraggingheader = Math.abs(dx) > 1;
    if (lastT) vx = (x - lastX) / (t - lastT);
    lastX = x; lastT = t;
  };

  const onUp = (e) => {
    if (!dragging) return;
	dragging = false;
	if (isDraggingheader) setTimeout(() => { isDraggingheader = false }, 50);
    header.style.cursor = "grab";
    header.releasePointerCapture(pointerId);

	
    const s = snaps();
    const cur = getLeft();
    const i = nearestSnapIdx(cur);
    const dir = Math.sign(vx) || Math.sign(cur - startLeft) || 0;
    const speed = Math.abs(vx);
	let targetIdx = i;
	if (isMobile) {
		if (e.clientX < 20) targetIdx = 0;
		if (e.clientX > CANVW - 20) targetIdx = s.length;
	}
   	else if (speed > 0.5 && dir !== 0) {
      targetIdx = clamp(i - (dir > 0 ? 1 : -1), 0, s.length - 1);
    }
    animateTo(s[targetIdx]);

    header.removeEventListener("pointermove", onMove);
    header.removeEventListener("pointerup", onUp);
    header.removeEventListener("pointercancel", onUp);
  };

  let pointerId = null;

  header.addEventListener("pointerdown", (e) => {
    if (settingSlider) return;
    dragging = true;
    header.style.cursor = "grabbing";
    pointerId = e.pointerId;
    header.setPointerCapture(pointerId);
    startX = e.clientX;
    startLeft = getLeft();
    lastX = startX;
    lastT = performance.now();
    vx = 0;
    header.addEventListener("pointermove", onMove, { passive: false });
    header.addEventListener("pointerup", onUp);
    header.addEventListener("pointercancel", onUp);
  });

  return header;
}


function fitHeaderDragWidth(header){
	let maxRight = 0;
	for (const el of header.children) {
		const r = el.offsetLeft + el.offsetWidth;
		if (r > maxRight) maxRight = r;
	}
	const contentW = Math.max(CANVW, Math.ceil(maxRight + 10));
	header.style.width = contentW + "px";
	const b = { min: Math.min(0, CANVW - contentW), max: 0 };
	const curLeft = parseFloat(getComputedStyle(header).left) || 0;
	header.style.left = clamp(curLeft, b.min, b.max) + "px";
}

function initLabelDiv(x, y, text = '', bgrColor = null, color = 'white', parent = document.body) {
	let div = document.createElement("label");
	div.className = "infoText";
	div.style.position = "fixed";
	if (bgrColor) {
		div.style.paddingTop = "3px";
		div.style.paddingLeft = "3px";
		div.style.backgroundColor = bgrColor;
	}
	div.style.top = y + "px";
	div.style.left = x + "px";
	div.style.whiteSpace = "pre";
	div.textContent = text;
	div.style.color = color;
	if (parent) parent.appendChild(div);
	return (div);
}


let inPrompt = false;
let promptDiv = null;
function promptUser(label, defaultValue = "") {
	switchPause(true);
	if (isMobile) {
		// 🟣 use native prompt on mobile
		inPrompt = true;
		return new Promise((resolve) => {
			const val = window.prompt(label, defaultValue);
			inPrompt = false;
			switchPause(false);
			resolve(val && val.trim() ? val.trim() : null);
		});
	}
	inPrompt = true;
	return new Promise((resolve) => {
		const overlay = document.createElement("div");
		Object.assign(overlay.style, {
			position: "fixed",
			top: 0,
			left: 0,
			width: "100vw",
			height: "100vh",
			background: "rgba(0,0,0,0.4)",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			zIndex: "9999",
		});
		const box = document.createElement("div");
		Object.assign(box.style, {
			background: "white",
			padding: "10px",
			borderRadius: "8px",
		});
		const labelEl = document.createElement("div");
		labelEl.className = "infoText";
		labelEl.textContent = label;
		const input = document.createElement("input");
		input.type = "text";
		input.value = defaultValue;
		const okBtn = document.createElement("button");
		okBtn.textContent = "OK";
		okBtn.className = "infoText";
		okBtn.onclick = () => cleanup(input.value.trim());
		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = "Cancel";
		cancelBtn.className = "infoText";
		cancelBtn.onclick = () => cleanup(null);
		const cleanup = (val) => {
			inPrompt = false;
			switchPause(false);
			window.removeEventListener("keydown", onKey);
			overlay.remove();
			resolve(val);
		};
		const onKey = (e) => {
			if (e.key === "Enter") cleanup(input.value.trim());
			else if (e.key === "Escape") cleanup(null);
		};
		window.addEventListener("keydown", onKey);
		box.append(labelEl, input, okBtn, cancelBtn);
		overlay.appendChild(box);
		document.body.appendChild(overlay);
		input.addEventListener("mousedown", () => input.focus(), { once: true });
		input.addEventListener("touchstart", () => input.focus(), { once: true });
		setTimeout(() => input.focus(), 0);
	});
}

let confirmDiv = null;
function confirmChoice(label, onEnd, color = "rgba(190, 104, 96, 1)") {
	if (confirmDiv) return;
	inPrompt = true;

	const w = label.length * 10, h = btnH * 2;
	const bw = 40, bh = 30;
	const x = (CANVW - w) / 2;
	const y = (CANVH - h) / 2;
	confirmDiv = document.createElement("div");
	confirmDiv.style.position = "absolute";
	confirmDiv.style.left = x + "px";
	confirmDiv.style.top = y + "px";
	confirmDiv.style.width = w + "px";
	confirmDiv.style.height = h + "px";
	confirmDiv.style.backgroundColor = color;
	confirmDiv.style.zIndex = "9999";
	confirmDiv.style.border = "10px solid " + color;
	confirmDiv.setAttribute("tabindex", "0");
	confirmDiv.focus();
	const onKey = (e) => {
	if (e.code === "Escape" || e.code === "Enter") {
		confirmDiv.remove();
		confirmDiv = null;
		inPrompt = false;
		window.removeEventListener("keydown", onKey);
		if (e.code === "Enter") onEnd(true);
	}
	};
	window.addEventListener("keydown", onKey);
	

	document.body.appendChild(confirmDiv);

	initLabelDiv(x + 20, y + 15, label, null, "rgba(250, 250, 250, 1)", confirmDiv);

	const yesBtn = initButton("Yes", 0, h - bh, bw, bh, "rgba(0, 0, 0, 0.13)", () => {
	confirmDiv.remove(); confirmDiv = null; inPrompt = false; if (onEnd) onEnd(true);
	}, null, confirmDiv);
	yesBtn.isPrompt = true;
	const noBtn = initButton("No", w - bw, h - bh, bw, bh, "rgba(0, 0, 0, 0.18)", () => {
	confirmDiv.remove(); confirmDiv = null; inPrompt = false;
	}, null, confirmDiv);
	noBtn.isPrompt = true;
}
