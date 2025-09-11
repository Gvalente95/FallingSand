//	INPUT
KEYS = {};
MOUSECLICKED = MOUSEPRESSED = false;
MOUSEX = MOUSEY = 0;
MOUSEDX = MOUSEDY = 0;
MOUSEGRIDX = MOUSEGRIDY = 0;
MOUSEMOVED = false;
CLICKCOLOR = getRandomColor();
PXATMOUSE = null;
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// PARAMS
SWIMSPEED = 2;
SHOWHUD = true;
PIXELSIZE = 4;
BRUSHSIZE = 8;
SHOWBRUSH = true;
BRUSHCOLOR = null;
MAXPARTICLES = 200000;
MAXBRUSHSIZE = 40;
XDRAG = .1;
GRAVITY = .5;
SIMSPEED = .5;
TYPEINDEX = 0;
MAXREWIND = 30;
RAINPOW = 50;
GRIDPX = true;

//	UI
let uiDisplayed = true;
let uiPagesButtons = [];
let uiPageContent = [];
let typeButton = null;
let gridLayer = null;
let inPause = false;
let gridMode = true;
let uiPageIndex = 0;
let uiLayerIndex = 0;
let uiXmargin = 5;
let uiYmargin = 5;
let gridCacheKey = "";
let paramH = 32;

let ratio = isMobile ? 4 : 20;
let actionBtnW = window.innerWidth / ratio;
if (isMobile) actionBtnW = window.innerWidth / 4 - uiXmargin - 2;
let paramBtnW = actionBtnW;
let actionBtnH = actionBtnW * .6;
let btnW = actionBtnW;
let btnH = isMobile ? btnW * .6 : 30;

BRUSHACTION = null;
ISRAINING = false;
SHOULDCUT = false;
const BRUSHTYPES = Object.freeze({ DISC: 'DISC', RECT: 'RECT'})
BRUSHTYPE = BRUSHTYPES.RECT;
const BrushKeys = Object.keys(BRUSHTYPES);
const FLOCK = { r: 10, sep: 1.2, ali: 0.8, coh: 0.35, maxSpd: 1.8, maxAcc: 0.15 };

//	CANVAS
CANVW = window.innerWidth;
CANVH = window.innerHeight - (actionBtnH + paramH + ((btnH * 2)) + (uiYmargin * 6));
GRIDW = Math.floor(CANVW / PIXELSIZE);
GRIDH = Math.floor(CANVH / PIXELSIZE);
canvas = document.createElement('canvas');
canvas.style.backgroundColor = "black";
ctx = canvas.getContext('2d');
canvas.width = CANVW;
canvas.height = CANVH;
document.body.appendChild(canvas);

let uiContainer = document.createElement("div");
document.body.appendChild(uiContainer);
uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 1)';
uiContainer.style.position = 'fixed';
uiContainer.style.top = CANVH + "px";
uiContainer.style.border = '5px solid rgba(123, 123, 123, 0.09)';
uiContainer.style.height = parseFloat(window.innerHeight) - (CANVH + 10) + "px";
uiContainer.style.width = (parseFloat(window.innerWidth) - 10) + "px";


//	PARTICLES
let grid = [];
let destroyedParticles = [];
let activeParticles = [];
let particleEmitters = [];
let selParticles = [];

const PHYSTYPES = Object.freeze({ SOLID: 'SOLID', LIQUID: 'LIQUID', GAS: 'GAS', STATIC: 'STATIC' });
const physKeys = Object.keys(PHYSTYPES);
const UPDATE_TYPES = Object.freeze({ STATIC: 'STATIC', DYNAMIC: 'DYNAMIC', ALIVE: 'ALIVE', GEL: 'GEL'});

let PARTICLE_PROPERTIES = {
['GRASS']:	{ color: 'rgba(86, 223, 36, 1)',	lt: Infinity,	brn: 900,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 15,	spread: 0,	expl: 0, kn: 1},
['SAND']:	{ color: 'rgba(255, 221, 0, 1)',	lt: Infinity,	brn: 10,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 50,	spread: 0,	expl: 0, kn: 0},
['GLASS']:	{ color: 'rgba(208, 226, 239, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 90,	spread: 0,	expl: 0, kn: 0},
['ROCK']:	{ color: 'rgba(76, 78, 1, 1)',		lt: Infinity,	brn: 1,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 95,	spread: 0,	expl: 0, kn: 1},
['DIAMOND']:{ color: 'rgba(102, 203, 221, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 1000,	spread: 0,	expl: 0, kn: 0},
['TNT']: 	{ color: 'rgba(74, 104, 115, 1)', lt: Infinity, brn: 999, brnpwr: 0, douse: 0, cor: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 50, spread: 0, expl: 5, kn: 0 },
['DYNAMITE']:{ color: 'rgba(115, 99, 74, 1)',	lt: 5,		brn: 999,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 50,	spread: 0,	expl: 5, kn: 0},
['COAL']:	{ color: 'rgba(68, 68, 68, 1)',	lt: 10,		brn: 1,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 45,	spread: 2,	expl: 0, kn: 0},
['RAINBOW']:{ color: 'rgba(255, 0, 234, 1)',	lt: Infinity,	brn: 100,	brnpwr: 0, 		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 10,	spread: 0,	expl: 0, kn: 0},
['MAGMA']:	{ color: 'rgba(198, 64, 2, 1)',	lt: 12,		brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 100,	spread: 0,	expl: 0, kn: 0},
['WATER']: { color: 'rgba(0, 191, 255, 1)', lt: Infinity, brn: 0, brnpwr: 0, douse: 1, cor: 0, physT: 'LIQUID', updT: 'DYNAMIC', dns: 2, spread: 20, expl: 0, kn: 1 },
['OIL']:	{ color: 'rgba(50, 96, 84, 1)',	lt: Infinity,	brn: 1000,	brnpwr: 0,		douse: 1, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 1,	spread: 20,	expl: 0, kn: 0},
['ACID']:	{ color: 'rgba(131, 35, 163, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 1, cor: 1000, physT:'LIQUID',updT: 'DYNAMIC', dns: 1.8,	spread: 6,	expl: 0, kn: 0},
['CHEMX']:	{ color: 'rgba(16, 96, 28, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 1, cor: 1500, physT:'LIQUID',updT: 'DYNAMIC', dns: 1.9,	spread: 6,	expl: 0, kn: 0},
['BUBBLE']:	{ color: 'rgba(255, 255, 255, 1)',	lt: 1,		brn: 0,		brnpwr: 0,		douse: 1, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 1,	spread: 20,	expl: 0, kn: 0},
['BLOB']:	{ color: 'rgba(0, 191, 255, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'GEL', dns: 2,	spread: 10,	expl: 0, kn: 0},
['LAVA']:	{ color: 'rgba(255, 0, 0, 1)',		lt: Infinity,	brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 2.1,	spread: 5,	expl: 0, kn: 0},
['BOLT']:	{ color: 'rgba(212, 255, 0, 1)',	lt: .4,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 100,	spread: 0,	expl: 0, kn: 0},
['FIRE']:	{ color: 'rgba(214, 113, 40, 1)',	lt: .4,		brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 0,	expl: 0, kn: 1},
['SMOKE']:	{ color: 'rgba(106, 106, 106, 1)',	lt: .6,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 0,	expl: 0, kn: 0},
['CLOUD']:	{ color: 'rgba(255, 255, 255, 1)',	lt: 20,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 2,	expl: 0, kn: 0},
['STEAM']:	{ color: 'rgba(237, 211, 211, 1)',	lt: 6,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 0,	expl: 0, kn: 0},
['PLANT']:	{ color: 'rgba(45, 119, 83, 1)', 	lt: Infinity, 	brn: 960, 	brnpwr: 0, 		douse: 0, cor: 0, physT: 'STATIC', 	updT: 'ALIVE', 	 dns: 4, 	spread: 0, expl: 0, kn: 0},
['SHROOM']: { color: 'rgba(218, 41, 31, 1)', 	lt: Infinity, 	brn: 999, 	brnpwr: 0, 		douse: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE', 	 dns: 4, 	spread: 0, expl: 0, kn: 0},
['SHROOMX']:{ color: 'rgba(209, 31, 218, 1)',  lt: Infinity, 	brn: 999, 	brnpwr: 0, 		douse: 0, cor: 2000, physT: 'SOLID',updT: 'ALIVE', 	 dns: 4, 	spread: 0, expl: 0, kn: 0},
['ANT']: 	{ color: 'rgba(185, 115, 115, 1)', lt: Infinity,	brn: 970, 	brnpwr: 0, 		douse: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE', 	 dns: 25, 	spread: 0, expl: 0, kn: 0 },
['ANTEGG']: { color: 'rgba(226, 224, 206, 1)', lt: 5, 		brn: 970, 	brnpwr: 0, 		douse: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE', dns: 25, spread: 0, expl: 0, kn: 0 },
['HONEY']:	{ color: 'rgba(199, 160, 33, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'FOOD',  	 dns: 2,	spread: 0,	expl: 0, kn: 0},
['FISH']:	{ color: 'rgba(27, 80, 133, 1)',	lt: Infinity,	brn: 970,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'ALIVE', 	 dns: 25,	spread: 0,	expl: 0, kn: 0},
['ICE']:	{ color: 'rgba(126, 166, 205, 1)',	lt: Infinity,	brn: 400,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 10,	spread: 2,	expl: 0, kn: 0},
['TORCH']:	{ color: 'rgba(255, 0, 0, 1)',		lt: Infinity,	brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'SOLID',	updT: 'STATIC',  dns: 30,	spread: 0,	expl: 0, kn: 0},
['WOOD']: 	{ color: 'rgba(68, 60, 44, 1)', 	lt: Infinity,	brn: 950, 	brnpwr: 0, 		douse: 0, cor: 0, physT: 'SOLID', 	updT: 'STATIC',  dns: 40, 	spread: 0, expl: 0 , kn: 0},
}; let particleKeys = Object.keys(PARTICLE_PROPERTIES);

const CREATIONMODE = Object.freeze({ HEAT: 'HEAT', COLD: 'COLD', PRESSURE: 'PRESSURE', TIME: 'TIME', CHARGE: 'CHARGE'})
function initCreationRules() {
	for (let i = 0; i < particleKeys.length; i++) PARTICLE_PROPERTIES[particleKeys[i]].cr = null;
	// addCreationRule('SAND', { mode: 'TIME', need: 'ROCK, WATER', value: 1, chance: .1, result: 'GRASS' });
	// addCreationRule('SAND', { mode: 'TIME', need: 'WATER', chance: .1, result: 'GRASS' });
	// addCreationRule('SAND', {mode:'HEAT', need:'LAVA', chance:.1, result:'GLASS'});
	// addCreationRule('ROCK', { mode: 'TIME', need: 'WATER', value: 10, chance: .1, result: 'SAND'});
	// addCreationRule('COAL', { mode: 'PRESSURE, HEAT', chance: .1, value: 20, result: 'DIAMOND' });
	// addCreationRule('OIL', { mode: 'PRESSURE', need: 'CHEMX, WOOD', chance: 100, result: 'TNT' });
	// addCreationRule('RAINBOW', { mode: 'TIME', need: 'CLOUD', chance: .1, result: 'RAINBOW' });
	// addCreationRule('ROCK', { mode: 'PRESSURE, HEAT', value: 1000, chance: .1, result: 'MAGMA' });
	// addCreationRule('WOOD', { mode: 'PRESSURE, TIME', value: 50, result: 'OIL' });
	// addCreationRule('GRASS', { mode: 'TIME', need: 'WATER', value: 5, chance: .1, result: 'PLANT' });
	// addCreationRule('ROCK', { mode: 'HEAT', value: 100, chance: 100, result: 'LAVA' });
	rebuildCreationRules();
}

const TAGS = [
    { type: 'ALIVE', color: setBrightness('rgba(33, 169, 117, 1)', 150) },
	{ type: 'GEL', color: setBrightness('rgba(134, 74, 184, 1)', 150) },
    { type: 'FOOD', color: setBrightness('rgba(165, 169, 33, 1)', 150) },
    { type: 'HEAT', color: setBrightness('rgba(212, 103, 24, 1)', 150) },
    { type: 'ACIDS', color: setBrightness('rgba(166, 45, 179, 1)', 150) },
    { type: 'DOUSE', color: setBrightness('rgba(33, 124, 169, 1)', 150) },
	{ type: 'EXPLOSIVE', color: setBrightness('rgba(57, 48, 37, 1)', 150) },
    { type: 'SOLID', color: setBrightness('rgba(115, 144, 118, 1)', 150) },
    { type: 'LIQUID', color: setBrightness('rgba(46, 113, 207, 1)', 150) },
    { type: 'GAS', color: setBrightness('rgba(129, 127, 23, 1)', 150) },
    { type: 'STATIC', color: setBrightness('rgba(33, 169, 117, 1)', 150) },
    { type: 'CUSTOM', color: setBrightness('rgba(255, 255, 255, 1)', 150) },
    { type: 'ALL', color: setBrightness('rgba(255, 255, 255, 1)', 150) }
];
const TAG_INDEX = TAGS.reduce((acc, tag, i) => ({ ...acc, [tag.type]: i }), {});
function tagMaskOf(tags) {return tags.reduce((mask, tag) => {const index = TAG_INDEX[tag];return index !== undefined ? mask | (1 << index) : mask;}, 0);}
function addTag(type, color = setBrightness[PARTICLE_PROPERTIES[particleKeys[type]].color]) {const brightColor = setBrightness(color, 150);TAGS.push({ type, color: brightColor });TAG_INDEX[type] = TAGS.length - 1;}
function hasTag(type, tag) {const p = PARTICLE_PROPERTIES[type];return !!(p.tagMask & (1 << TAG_INDEX[tag]));}
function anyTag(type, tags) {const m = tagMaskOf(tags);return (PARTICLE_PROPERTIES[type].tagMask & m) !== 0;}
function allTags(type, tags) {const m = tagMaskOf(tags);return (PARTICLE_PROPERTIES[type].tagMask & m) === m;}
function setTags(type, tags) {const p = PARTICLE_PROPERTIES[type];p.tags = [...new Set(tags)];p.tagMask = tagMaskOf(p.tags);}
function typesWithAny(tags) {const m = tagMaskOf(tags);return Object.keys(PARTICLE_PROPERTIES).filter(k => (PARTICLE_PROPERTIES[k].tagMask & m) !== 0);}
function typesWithAll(tags) {const m = tagMaskOf(tags);return Object.keys(PARTICLE_PROPERTIES).filter(k => (PARTICLE_PROPERTIES[k].tagMask & m) === m);}

for (const k in PARTICLE_PROPERTIES) {
	const p = PARTICLE_PROPERTIES[k];
	const s = new Set(p.tags || []);
	s.add('ALL');
	if (p.brn > 100) s.add('COMB');
	if (p.brnpwr > 0) s.add('HEAT');
	if (p.douse > 0) s.add('DOUSE');
	if (p.cor) s.add('ACIDS');
	if (p.updT == 'ALIVE') s.add('ALIVE');
	if (p.expl) s.add('EXPLOSIVE');
	if (p.updT) s.add(p.updT);
	if (p.physT) s.add(p.physT);
	if (p.type) s.add(p.physT);
	p.tags = [...s];
	p.tagMask = tagMaskOf(p.tags);
}

ISGAME = false;
if (!ISGAME) discoverAll();

function discoverAll() {
	for (let i = 0; i < particleKeys.length; i++){
		PARTICLE_PROPERTIES[particleKeys[i]].kn = 1;
	}
}

PROF.wrapProto(Particle, [
  'updatePosition','updateVelocity','updateMovement',
	'update', 'render', 'pxAtp'
]);