function updateUi()
{
	for (let i = 0; i < uiPagesButtons.length; i++) {
		let cb = uiPagesButtons[i];
		let isOpen = uiPageIndex == i;
		cb.style.backgroundColor = setAlpha(cb.baseClr, isOpen ? uiLayerIndex == 0 ? 1 : .6 : 0.3);
		for (const b of cb.buttons) { b.newDiv.style.opacity = '0'; if (b.isSwitch) continue; b.style.display = isOpen ? 'block' : 'none'; }
		for (const s of cb.sliders) s.style.display = isOpen ? 'block' : 'none';
	}
	let notKnColor = 'rgba(0,0,0,1)';
	let uiButtons = uiPagesButtons[uiPageIndex].buttons;
	for (let i = 0; i < uiButtons.length; i++) {
		let b = uiButtons[i];
		let isOpen = typeButton && b.label == typeButton.label;
		if (ISGAME) {
			let isKnown = PARTICLE_PROPERTIES[b.label].kn;
			if (!isKnown) {
				b.style.backgroundColor = notKnColor;
				b.textContent = '';
				b.style.background = `url("ressources/img/WHITE/lock.png") center/contain no-repeat`;
				continue;
			}
		}
		if (b.newDiv) b.newDiv.style.opacity = (b.new && ISGAME ? '1' : '0');
		b.style.background = `${b.style.backgroundColor}`;
		b.textContent = b.label.substring(0, 5);
		b.style.backgroundColor = setAlpha(b.baseClr, isOpen ? uiLayerIndex == 1 ? 1 : .6 : 0.3);
	}
}

function getCurButtonTypeIndex()
{
	let found = -1;
	for (let i = 0; i < uiPagesButtons[uiPageIndex].buttons.length; i++)
	{
		let b = uiPagesButtons[uiPageIndex].buttons[i];
		if (b.label == 'MAKE') { return (i);}
		if (ISGAME && !PARTICLE_PROPERTIES[b.label].kn) continue;
		if (found == -1) found = i;
		if (b.label == particleKeys[TYPEINDEX]) return (i);
	}
	return (found);
}


function getScrollTypeIndex(curI, scrollDir) {
	let lastFound = -1;
	let firstFound = -1;

	for (let i = 0; i < uiPagesButtons[uiPageIndex].buttons.length; i++)
	{
		let b = uiPagesButtons[uiPageIndex].buttons[i];
		if (ISGAME && !PARTICLE_PROPERTIES[b.label].kn) continue;
		if (b.label == 'MAKE' || (i > curI && scrollDir > 0)) { return (i); }
		if (i == curI && scrollDir < 0 && lastFound != -1) return (lastFound);
		if (i != curI) lastFound = i;
		if (firstFound == -1) firstFound = i;
	}
	if (scrollDir > 0) return (firstFound);
	return (lastFound);
}

function navigateUi(xScroll, yScroll) {
	if (yScroll) {
		uiLayerIndex = yScroll > 0 ? 1 : 0;
		let curIndex = uiLayerIndex == 0 ? uiPageIndex : getCurButtonTypeIndex();
		if (curIndex == -1) { uiLayerIndex = 0; return; }
		if (uiLayerIndex == 0) switchUiPage(curIndex);
		else { setNewType(uiPagesButtons[uiPageIndex].buttons[curIndex].value); }
	}
	else if (xScroll) {
		let buttons = uiLayerIndex == 0 ? uiPagesButtons : uiPagesButtons[uiPageIndex].buttons;
		let max = buttons.length;
		let curIndex = uiLayerIndex == 0 ? uiPageIndex : getCurButtonTypeIndex();
		let newIndex = uiLayerIndex == 0 ? ((curIndex + xScroll) % max) : getScrollTypeIndex(curIndex, xScroll);
		if (newIndex < 0) newIndex = max - 1;
		if (uiLayerIndex == 0) switchUiPage(newIndex);
		else
			setNewType(uiPagesButtons[uiPageIndex].buttons[newIndex].value);
	}
	updateUi();	
}
