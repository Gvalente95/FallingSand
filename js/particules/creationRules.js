function splitList(n){
	if (!n) return [];
	if (Array.isArray(n)) return n.flatMap(s=>String(s).split(',')).map(s=>s.trim()).filter(Boolean);
	return String(n).split(',').map(s=>s.trim()).filter(Boolean);
}
function splitModes(m){ return splitList(m).map(s=>s.toUpperCase()); }

function compileModeCheck(mode, v){
	if (mode==='TIME'){ const min=v??0; return (x,y,self)=> !min || self.timeAlive>=min; }
	if (mode==='HEAT'){ const min=v||1; return (x,y,self)=> heatLevel(self)>=min; }
	if (mode==='PRESSURE'){ const min=v||8; return (x,y,self)=> pressureAt(x,y)>=min; }
	return ()=>true;
}

function compileRule(t, cr){
	const modes = splitModes(cr.mode || 'TIME');
	const need = splitList(cr.need);
	const result = cr.result ? (Array.isArray(cr.result)? cr.result[0] : cr.result) : t;
	const val = cr.value;
	const chance = cr.chance ?? 100;
	const prob = Math.max(0, Math.min(1, Number(chance)/100));
	const op = (cr.op || 'AND').toUpperCase()==='OR' ? 'OR' : 'AND';

	let values;
	if (val && typeof val==='object' && !Array.isArray(val)){
		values = m => val[m];
	} else if (Array.isArray(val)){
		values = (m,i)=> val[i];
	} else {
		values = ()=> val;
	}
	const checks = modes.map((m,i)=> compileModeCheck(m, values(m,i)));
	return { need, needSet:new Set(need), result, prob, op, checks };
}

function buildCreationRules(props){
	const out = {};
	for (const [t,p] of Object.entries(props)){
		if (!p.cr) continue;
		const arr = Array.isArray(p.cr) ? p.cr : [p.cr];
		for (const one of arr){
			if (!one || typeof one!=='object' || Array.isArray(one)) continue;
			(out[t]||(out[t]=[])).push(compileRule(t, one));
		}
	}
	return out;
}

function hasAllNeighborsSet(set,self){
	if (!set || !set.size) return true;
	const need = new Set(set);
	for (let i = 0; i < self.neigbors; i++){
		const q = self.neigbors[i];
		if (need.has(q.type)) need.delete(q.type);
		if (!need.size) return true;
	}
	return need.size===0;
}

function heatLevel(self){
	let n = 0;
	for (let i = 0; i < self.neigbors.length; i++){
		const q = self.neigbors[i];
		if (q.brnpwr) n++;
	}
	return n;
}

function pressureAt(x,y){
	let n=0;
	for (let yy=y-1; yy>=0; yy--){
		const q=pxAtI(ROWOFF[yy] + x);
		if (q && (q.physT==='SOLID')) n++; else break;
	}
	return n;
}

function applyCreationAt(x,y,target){
	const p=pxAtI(ROWOFF[y] + x);
	if (p){ if (p.type===target) return false; p.replace(target); return true; }
	new Particle(x, y, target);
	return true;
}

let CREATE_RULES = buildCreationRules(PARTICLE_PROPERTIES);
function rebuildCreationRules(){ CREATE_RULES = buildCreationRules(PARTICLE_PROPERTIES); }

function runCreationAt(x,y,self){
	for (const rules of Object.values(CREATE_RULES)){
		for (const rule of rules){
			if (!hasAllNeighborsSet(rule.needSet,self)) continue;
			let ok = rule.op==='OR'
				? rule.checks.some(fn=>fn(x,y,self))
				: rule.checks.every(fn=>fn(x,y,self));
			if (!ok) continue;
			if (Math.random() >= rule.prob) continue;
			if (applyCreationAt(x,y, rule.result)) return true;
		}
	}
	return false;
}

function addCreationRule(type, rule){
	const p = PARTICLE_PROPERTIES[type]; if(!p) return;
	if (!p.cr) p.cr = [];
	else if (!Array.isArray(p.cr)) p.cr = [p.cr];
	p.cr.push(rule);
	rebuildCreationRules();
}
