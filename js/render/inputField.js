
function createNewType() {
	initInputParticleValuesContainer();
}

function hsvaToRgba(h,s,v,a){
	const f=(n,k=(n+h/60)%6)=>v-v*s*Math.max(Math.min(k,4-k,1),0);
	const r=Math.round(f(5)*255),g=Math.round(f(3)*255),b=Math.round(f(1)*255);
	return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
function rgbaToHsva(rgba){
	const m=/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([.\d]+))?\s*\)/i.exec(rgba)||[];
	let r=+m[1]||255,g=+m[2]||255,b=+m[3]||255,a=m[4]==null?1:parseFloat(m[4]);
	r/=255;g/=255;b/=255;
	const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
	let h=0; if(d){ if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0) h+=360; }
	const s=mx===0?0:d/mx, v=mx;
	return {h,s,v,a};
}
function createRadialColorPicker(target, initial, onChange){
	const wrap=document.createElement('div');
	const top=document.createElement('div');
	const canvas=document.createElement('canvas');
	const right=document.createElement('div');
	const vLab=document.createElement('div');
	const vRange=document.createElement('input');
	const aLab=document.createElement('div');
	const aRange=document.createElement('input');
	const preview = document.createElement('div');
	aLab.style.color = "white";
	aRange.style.color = "white";
	vLab.style.color = "white";
	wrap.style.display='grid';
	wrap.style.gridTemplateColumns='1fr 180px';
	wrap.style.gap='12px';
	top.style.display='contents';
	canvas.width=240; canvas.height=240;
	right.style.display='grid';
	right.style.gridTemplateRows='auto auto auto';
	right.style.gap='8px';
	vLab.textContent='Valeur';
	vRange.type='range'; vRange.min='0'; vRange.max='1'; vRange.step='0.001';
	aLab.textContent='Alpha';
	aRange.type='range'; aRange.min='0'; aRange.max='1'; aRange.step='0.001';
	preview.style.height='40px'; preview.style.borderRadius='10px'; preview.style.border='1px solid #ddd';
	const st=rgbaToHsva(initial);
	let state={h:st.h,s:st.s,v:st.v,a:st.a};
	vRange.value=String(state.v);
	aRange.value=String(state.a);
	function drawWheel(){
		const ctx=canvas.getContext('2d',{willReadFrequently:true});
		const w=canvas.width,h=canvas.height, cx=w/2, cy=h/2, r=Math.min(cx,cy)-2;
		const img=ctx.createImageData(w,h);
		for(let y=0;y<h;y++){
			for(let x=0;x<w;x++){
				const dx=x-cx, dy=y-cy;
				const rr=Math.sqrt(dx*dx+dy*dy);
				if(rr>r){ const o=(y*w+x)*4; img.data[o+3]=0; continue; }
				let ang=Math.atan2(dy,dx);
				let hue=(ang*180/Math.PI+360)%360;
				let sat=Math.min(1, rr/r);
				const rgba=hsvaToRgba(hue,sat,parseFloat(vRange.value), parseFloat(aRange.value));
				const m=/rgba\((\d+),(\d+),(\d+),([.\d]+)\)/.exec(rgba);
				const o=(y*w+x)*4;
				img.data[o]=+m[1]; img.data[o+1]=+m[2]; img.data[o+2]=+m[3]; img.data[o+3]=Math.round(parseFloat(m[4])*255);
			}
		}
		ctx.putImageData(img,0,0);
		const ctx2=ctx;
		const pxX=cx+state.s*(r)*Math.cos(state.h*Math.PI/180);
		const pxY=cy+state.s*(r)*Math.sin(state.h*Math.PI/180);
		ctx2.beginPath(); ctx2.arc(pxX,pxY,6,0,Math.PI*2); ctx2.strokeStyle='#000'; ctx2.lineWidth=2; ctx2.stroke();
		ctx2.beginPath(); ctx2.arc(pxX,pxY,4,0,Math.PI*2); ctx2.strokeStyle='#fff'; ctx2.lineWidth=2; ctx2.stroke();
	}
	function emit(){
		const rgba=hsvaToRgba(state.h,state.s,state.v,state.a);
		preview.style.background=rgba;
		onChange(rgba);
	}
	function pick(e){
		const rect=canvas.getBoundingClientRect();
		const x=e.clientX-rect.left, y=e.clientY-rect.top;
		const cx=canvas.width/2, cy=canvas.height/2, r=Math.min(cx,cy)-2;
		const dx=x-cx, dy=y-cy;
		const rr=Math.sqrt(dx*dx+dy*dy);
		if(rr>r) return;
		state.s=Math.min(1, rr/r);
		let ang=Math.atan2(dy,dx); ang=(ang*180/Math.PI+360)%360;
		state.h=ang;
		drawWheel(); emit();
	}
	canvas.addEventListener('mousedown',e=>{
		pick(e);
		const mm=(ev)=>pick(ev);
		const up=()=>{window.removeEventListener('mousemove',mm);window.removeEventListener('mouseup',up);};
		window.addEventListener('mousemove',mm); window.addEventListener('mouseup',up);
	});
	vRange.addEventListener('input',e=>{ state.v=parseFloat(e.target.value); drawWheel(); emit(); });
	aRange.addEventListener('input',e=>{ state.a=parseFloat(e.target.value); drawWheel(); emit(); });
	drawWheel(); emit();
	wrap.appendChild(canvas);
	right.appendChild(vLab); right.appendChild(vRange); right.appendChild(aLab); right.appendChild(aRange); right.appendChild(preview);
	wrap.appendChild(right);
	target.appendChild(wrap);
	return {get rgba(){return hsvaToRgba(state.h,state.s,state.v,state.a)}};
}

let isInInputField = false;
let defaultName = 0;
function initInputParticleValuesContainer() {
	isInInputField = true;
	const overlay = document.createElement('div');
	const mod = document.createElement('div');
	const form = document.createElement('div');
	const title = document.createElement('div');
	const actions = document.createElement('div');

	overlay.style.position = 'fixed';
	overlay.style.inset = '0';
	overlay.style.background = 'rgba(0,0,0,0.4)';
	overlay.style.zIndex = '9998';

	mod.style.position = 'fixed';
	mod.style.left = '50%';
	mod.style.top = '50%';
	mod.style.transform = 'translate(-50%, -50%)';
	mod.style.width = Math.min(560, Math.max(360, window.innerWidth * 0.6)) + 'px';
	mod.style.maxWidth = '90vw';
	mod.style.maxHeight = '80vh';
	mod.style.overflow = 'auto';
	mod.style.background = 'white';
	mod.style.borderRadius = '16px';
	mod.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
	mod.style.padding = '18px';
	mod.style.zIndex = '9999';
	mod.style.fontFamily = 'Press Start 2P, monospace';
	mod.style.backgroundColor = "rgba(41, 16, 48, 1)";

	form.style.display = 'grid';
	form.style.gridTemplateColumns = '1fr 1fr';
	form.style.gap = '12px';

	actions.style.display = 'flex';
	actions.style.justifyContent = 'flex-end';
	actions.style.gap = '8px';
	actions.style.marginTop = '14px';

	const props = {
		name: 'Cust_' + defaultName,
		color: 'rgba(220,220,255,0.6)',
		lt: 'Infinity',
		brn: 0,
		brnpwr: 0,
		douse: 0,
		physT: PHYSTYPES.SOLID,
		updT: UPDATE_TYPES.DYNAMIC,
		dns: 10,
		spread: 10
	};

	function field(label, inputEl) {
		const wrap = document.createElement('label');
		const l = document.createElement('div');
		l.textContent = label;
		l.style.color = "white";
		l.style.fontSize = '12px';
		l.style.opacity = '0.8';
		l.style.marginBottom = '6px';
		const box = document.createElement('div');
		box.style.display = 'flex';
		box.appendChild(inputEl);
		wrap.style.display = 'flex';
		wrap.style.flexDirection = 'column';
		wrap.appendChild(l);
		wrap.appendChild(box);
		return wrap;
	}
	function textInput(v) {
		const i = document.createElement('input');
		i.type = 'text';
		i.value = v;
		i.style.width = '100%';
		i.style.padding = '10px';
		i.style.border = '1px solid #ddd';
		i.style.borderRadius = '10px';
		return i;
	}
	function numberInput(v, step='1') {
		const i = document.createElement('input');
		i.type = 'number';
		i.value = v;
		i.step = step;
		i.style.width = '100%';
		i.style.padding = '10px';
		i.style.border = '1px solid #ddd';
		i.style.borderRadius = '10px';
		return i;
	}
	function selectInput(optionsObj, current) {
		const s = document.createElement('select');
		s.style.width = '100%';
		s.style.padding = '10px';
		s.style.border = '1px solid #ddd';
		s.style.borderRadius = '10px';
		Object.values(optionsObj).forEach(v => {
			const o = document.createElement('option');
			o.value = v;
			o.textContent = v;
			if (v === current) o.selected = true;
			s.appendChild(o);
		});
		return s;
	}

	const nameI = textInput(props.name);
	const lifeI = textInput(String(props.lt));
	const flamI = numberInput(props.brn);
	const burnI = numberInput(props.brnpwr);
	const douseI = numberInput(props.douse);
	const densI = numberInput(props.dns);
	const spreadI = numberInput(props.spread);
	const solI = selectInput(PHYSTYPES, props.physT);
	const updI = selectInput(UPDATE_TYPES, props.updT);

	const colorHidden = textInput(props.color);
	colorHidden.style.display='none';
	const colorWrap = document.createElement('div');
	const colorBox = document.createElement('div');
	const picker = createRadialColorPicker(colorBox, props.color, (rgba) => { colorHidden.value = rgba; });

	const colorGroup=document.createElement('div');
	colorGroup.style.display='flex';
	colorGroup.style.flexDirection='column';
	colorGroup.appendChild(colorBox);

	form.appendChild(field('Nom', nameI));
	form.appendChild(colorGroup);
	form.appendChild(field('Durée de vie', lifeI));
	form.appendChild(field('Inflammabilité', flamI));
	form.appendChild(field('Brûleur', burnI));
	form.appendChild(field('Extinction', douseI));
	form.appendChild(field('Densité', densI));
	form.appendChild(field('Spread', spreadI));
	form.appendChild(field('physT', solI));
	form.appendChild(field('UpdateType', updI));

	const cancelB = document.createElement('button');
	cancelB.textContent = 'Annuler';
	cancelB.style.padding = '10px 14px';
	cancelB.style.border = '1px solid #ddd';
	cancelB.style.borderRadius = '10px';
	cancelB.style.background = 'white';
	cancelB.style.cursor = 'pointer';

	const createB = document.createElement('button');
	createB.textContent = 'Créer';
	createB.style.padding = '10px 14px';
	createB.style.border = '0';
	createB.style.borderRadius = '10px';
	createB.style.background = '#111';
	createB.style.color = 'white';
	createB.style.cursor = 'pointer';

	function close() {
		defaultName++;
		isInInputField = false;
		document.body.removeChild(mod);
		document.body.removeChild(overlay);
	}

	cancelB.addEventListener('click', close);

	createB.addEventListener('click', () => {
		const lifeRaw = lifeI.value.trim();
		const life = lifeRaw.toLowerCase() === 'infinity' || lifeRaw === '' || lifeRaw === '∞' ? Infinity : Number(lifeRaw);
		const p = {
			name: nameI.value.trim() || 'Custom',
			color: colorHidden.value.trim() || 'rgba(255,255,255,1)',
			lt: life,
			brn: Number(flamI.value),
			brnpwr: Number(burnI.value),
			douse: Number(douseI.value),
			physT: solI.value,
			updT: updI.value,
			dns: Number(densI.value),
			spread: Number(spreadI.value)
		};
		addParticleType(p);
		close();
	});

	document.addEventListener('keydown', escClose);
	function escClose(e) {
		if (e.key === 'Escape') {
			document.removeEventListener('keydown', escClose);
			close();
		}
	}

	actions.appendChild(cancelB);
	actions.appendChild(createB);

	mod.appendChild(title);
	mod.appendChild(form);
	mod.appendChild(actions);

	document.body.appendChild(overlay);
	document.body.appendChild(mod);
}


function addParticleType(props = {}) {
	const defaults = {
		name: 'Ola',
		color: 'rgba(255,255,255,1)',
		lt: Infinity,
		brn: 0,
		brnpwr: 0,
		douse: 0,
		physT: PHYSTYPES.SOLID,
		updT: UPDATE_TYPES.DYNAMIC,
		dns: 10,
		spread: 10
	};
	const key = props.name.toUpperCase().replace(/\s+/g, '_');

	if (props.physT && !Object.values(PHYSTYPES).includes(props.physT)) throw new Error('invalid physT');
	if (props.updT && !Object.values(UPDATE_TYPES).includes(props.updT)) throw new Error('invalid updT');

	particleKeys = Object.keys(PARTICLE_PROPERTIES);
	PARTICLE_PROPERTIES[key] = { ...defaults, ...props };

	const customIdx = uiPagesButtons.findIndex(p => p.label === 'CUSTOM');
	if (customIdx === -1) return key;
	const page = uiPagesButtons[customIdx];
	const buttons = page.buttons || (page.buttons = []);
	const buttonSpread = 65;
	const buttonHeight = 45;
	const x = -(5 + customIdx * buttonSpread) + buttons.length * buttonSpread;
	const y = buttonHeight;
	const idxInKeys = particleKeys.indexOf(key);
	const newBut = initButton(key, x, y, PARTICLE_PROPERTIES[key].color, setNewType, idxInKeys, page);
	buttons.push(newBut);
	return key;
}