
function loadMapName(name) {
	const data = getMapData(name);
	if (!data) return null;
	localStorage.setItem(LAST_KEY, name);
	applyMapData(data);
}

function loadMapAtIndex(index){
  const names = _getIndex();
  const name = names[index];
  if (!name) return null;
  return loadMapName(name);
}

function loadMapFromButton() {
	confirmChoice("Load " + sSContainer.value + "?", () => {
		loadMapName(sSContainer.value);
		exitLoadMenu();
	}, "rgba(97, 151, 143, 1)")
}

function exitLoadMenu() {
	if (selectMapButtons) {
		for (let i = 0; i < selectMapButtons.buttons.length; i++)
		selectMapButtons.buttons[i].remove();
		selectMapButtons.buttons = [];
		selectMapButtons = null;
	}
	showMapScreenshot(false);
	inLoadMenu = false;
}

function deleteMapFromButton(name) {
	confirmChoice("Delete" + name + "?", () => {deleteMap(name);
	exitLoadMenu()})
}

function setMapScreenshot(x, y, name) {
	if (!sSContainer) return;
	sSContainer.value = name;

	const data = getMapData(name);
	if (!data || !data.screenshot) return;

	const url = typeof data.screenshot === "string" && data.screenshot.startsWith("data:")
	? data.screenshot
	: toDataURL(data.screenshot);

	setButtonImage(sSContainer, url);
	if (sSContainer.renameBtn) sSContainer.renameBtn.remove();
	const rw = Math.max(80, name.length * 10);
	sSContainer.renameBtn = initButton(
		name, x, y - btnH, rw, btnH,
		"rgba(117, 117, 117, 1)",
		async () => {
		const newName = await promptUser("Select new name for " + name + ":", name);
		if (newName && newName !== name) {
			if (renameMap(name, newName)) {
			sSContainer.value = newName;
			setMapScreenshot(x, y, newName);
			}}},name,document.body);

	if (sSContainer.delBtn) sSContainer.delBtn.remove();
	const bw = parseFloat(sSContainer.style.width) || sSContainer.offsetWidth || 120;
	sSContainer.delBtn = initButton("Erase", x + bw - btnW,y - btnH,btnW,btnH,"rgba(165, 34, 34, 1)", deleteMapFromButton,name,document.body);
	showMapScreenshot(true);
}

function showMapScreenshot(show = false) {
	if (!sSContainer)
		return;
	let display = show ? "block" : "none";
	sSContainer.style.display = display;
	if (sSContainer.delBtn)
		sSContainer.delBtn.style.display = display;
	if (sSContainer.renameBtn)
		sSContainer.renameBtn.style.display = display;
}

function init_sSContainer(w, h) {
	let x = CANVW / 2 - w / 2, y = CANVH / 2 - h / 2;
	sSContainer = initButton("", x, y, w, h, "rgba(255, 255, 255, 1)", loadMapFromButton, "", document.body, null, null);
	sSContainer.style.border = "2px solid rgba(255, 255, 255, 0.96)";
	sSContainer.renameBtn = null;
	sSContainer.delBtn = null;
}

function selectMap() {
	sSContainer.style.border = "4px solid rgba(185, 78, 78, 0.96)";
	selectMapButtons.style.display = "none";
}

sSContainer = null;
selectedMap = null;
selectMapButtons = null;
inLoadMenu = false;
function loadMap() {
	if (selectMapButtons) {
		exitLoadMenu();
		return;
	}
	inLoadMenu = true;
	selectMapButtons = document.createElement("div");
	selectMapButtons.buttons = []
	const names = _getIndex();
	const x = CANVW - btnW * 2;
	const y = CANVH - btnH * 2;
	const w = btnW;
	const h = btnH;
	if (!sSContainer)
		init_sSContainer(CANVW * .75, CANVH * .75);
	showMapScreenshot(false);
	const clr = "rgba(118, 128, 170, 1)";
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		let button = initButton(name, x, y - (i * (h + 2)), w, h, clr, loadMapFromButton, name, selectMapButtons.div, true, null, null, null, "white", "Load \"" + name + "\"");
		button.addEventListener("mouseenter", () => { if (inPrompt) return; setMapScreenshot(sSContainer.x, sSContainer.y, name); });
		selectMapButtons.buttons.push(button);
	}
}
