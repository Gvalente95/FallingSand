class LoadData{
	constructor() {
		this.container = null;
		this.menuButtons = null;
		this.curMapName = null;
		this.active = false;
		this.init();
	}
	init() {
		let w = CANVW * .75, h = CANVH * .75
		let x = CANVW / 2 - w / 2, y = CANVH / 2 - h / 2;
		this.container = initButton("", x, y, w, h, "rgba(255, 255, 255, 1)", loadMapFromButton, "", document.body, null, null);
		this.container.style.border = "2px solid rgba(255, 255, 255, 0.96)";
		this.container.renameBtn = null;
		this.container.delBtn = null;
	}

	reloadLevel() {
		if (!PLAYER)
			PLAYER = new Player(50, GH - 14, getEntOfType('PLAYER'));
		if (this.curMapName)
			loadMapName(this.curMapName);
	}

	closeMenu() {
		if (this.menuButtons) {
			for (let i = 0; i < this.menuButtons.length; i++)
				this.menuButtons[i].remove();
			this.menuButtons = null;
		}
		showMapScreenshot(false);
		this.active = false;
	}

	toggleMenu(active = !this.active) {
		this.active = active;
		if (!active) {
			this.closeMenu();
			return;
		}
		render("blur(5px)");
		const names = _getIndex();
		const x = CANVW - btnW * 2;
		const y = CANVH - btnH * 2;
		const w = btnW;
		const h = btnH;
		this.menuButtons = [];
		showMapScreenshot(false);
		const clr = "rgba(118, 128, 170, 1)";
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			let button = initButton(name, x, y - (i * (h + 2)), w, h, clr, loadMapFromButton, name, this.container.div, true, null, null, null, "white", "Load \"" + name + "\"");
			button.addEventListener("mouseenter", () => { if (inPrompt) return; setMapScreenshot(LD.container.x, LD.container.y, name); });
			this.menuButtons.push(button);
		}
	}
}

async function loadMapName(name) {
	const data = await getMapDataAsync(name);
	if (!data) return null;
	localStorage.setItem(LAST_KEY, name);
	applyMapData(data);
	LD.curMapName = name;
	return data;
}

function loadMapAtIndex(index){
	const names = _getIndex();
	const name = names[index];
	if (!name) return null;
	return loadMapName(name);
}

function loadMapFromButton() {
	if (isMobile) {
		loadMapName(LD.container.value);
		LD.closeMenu();
		return;
	}
  confirmChoice("Load " + LD.container.value + "?", async () => {
    await loadMapName(LD.container.value);
	  LD.closeMenu();
	  au.playLoop(au.musBgr, .3);
  }, "rgba(97, 151, 143, 1)");
}

function deleteMapFromButton(name) {
	confirmChoice("Delete" + name + "?", () => {
		deleteMap(name);
		let hasDel = false;
		let delIndex = -1;
		for (let i = 0; i < LD.menuButtons.length; i++) {
			const b = LD.menuButtons[i];
			if (hasDel) {
				let newY = b.y + btnH;
				LD.menuButtons[i].style.top = newY + "px";
				b.y = newY;
			}
			else if (b.label === name) {
				hasDel = true;
				delIndex = i;
			}
		}
		LD.menuButtons[delIndex].remove();
		LD.menuButtons.splice(LD.menuButtons.indexOf(delIndex, 1));
		showMapScreenshot(false);
	});
}

async function setMapScreenshot(x, y, name) {
	if (!LD.container) return;
	LD.container.value = name;

	const data = await getMapDataAsync(name);
	if (!data) return null;
	if (data.screenshot) {
		const url = typeof data.screenshot === "string" && data.screenshot.startsWith("data:")
		? data.screenshot
		: toDataURL(data.screenshot);

		setButtonImage(LD.container, url);
		if (LD.container.renameBtn) LD.container.renameBtn.remove();
		const rw = Math.max(80, name.length * 10);
		LD.container.renameBtn = initButton(
			name, x, y - btnH, rw, btnH, "rgba(117,117,117,1)",
			async () => {
				const newName = await promptUser("Select new name for " + name + ":", name);
				if (newName && newName !== name) {
				if (renameMap(name, newName)) {
					LD.container.value = newName;
					setMapScreenshot(x, y, newName);
				}
				}
			},
			name, document.body
			);
	}
	

	if (LD.container.delBtn) LD.container.delBtn.remove();
	const bw = parseFloat(LD.container.style.width) || LD.container.offsetWidth || 120;
	LD.container.delBtn = initButton("Erase", x + bw - btnW,y - btnH,btnW,btnH,"rgba(165, 34, 34, 1)", deleteMapFromButton,name,document.body);
	showMapScreenshot(true);
}

function showMapScreenshot(show = false) {
	if (!LD.container)
		return;
	let display = show ? "block" : "none";
	LD.container.style.display = display;
	if (LD.container.delBtn)
		LD.container.delBtn.style.display = display;
	if (LD.container.renameBtn)
		LD.container.renameBtn.style.display = display;
}

function selectMap() {
	LD.container.style.border = "4px solid rgba(185, 78, 78, 0.96)";
	if (LD.menuButtons){
		for (let i = 0; i < LD.menuButtons.length; i++)
		LD.menuButtons[i].remove();
		LD.menuButtons = null;
	}
}
