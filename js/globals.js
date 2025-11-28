//	INPUT
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
INPUT = null;
MOUSE = null;

// PARAMS
SWIMSPEED = 2;
SHOWHUD = false;
PIXELSIZE = 3;
BRUSHSIZE = 8;
SHOWBRUSH = !isMobile;
BRUSHCOLOR = null;
MAXCells = 200000;
MAXBRUSHSIZE = 40;
XDRAG = .1;
GRAVITY = .5;
SIMSPEED = .7;
TYPEINDEX = 0;
ENTINDEX = -1;
MAXREWIND = 30;
RAINPOW = 50;
GRIDPX = true;
DEBUG = false;

SELENT = null;
//	UI
let btnClr = 'rgba(174, 108, 108, 1)';
let uiDisplayed = true;
let uiPagesButtons = [];
let uiPageContent = [];
let typeButton = null;
let gridLayer = null;
let inPause = false;
let gridMode = false;
let showBgrGrid = false;
let uiPageIndex = 0;
let uiLayerIndex = 0;
let uiXmargin = 5;
let uiYmargin = 5;
let gridCacheKey = "";
let paramH = 32;

let ratio = isMobile ? 4 : 20;
let actionBtnW = isMobile ? window.innerWidth / ratio : 80;
if (isMobile) actionBtnW = window.innerWidth / 4 - uiXmargin - 2;
let paramBtnW = actionBtnW;
let actionBtnH = actionBtnW * .4;
let btnW = actionBtnW;
let btnH = isMobile ? btnW * .6 : 30;

BRUSHACTION = null;
ISRAINING = false;
const BRUSHTYPES = Object.freeze({ DISC: 'DISC', RECT: 'RECT'})
BRUSHTYPE = BRUSHTYPES.RECT;
const BrushKeys = Object.keys(BRUSHTYPES);
const FLOCK = { r: 10, sep: 1.2, ali: 0.8, coh: 0.35, maxSpd: 1.8, maxAcc: 0.15 };

//	CANVAS
CANVW = window.innerWidth;
CANVH = window.innerHeight - (actionBtnH + paramH + ((btnH * 2)) + (uiYmargin * 6));
GW = Math.floor(CANVW / PIXELSIZE);
GH = Math.floor(CANVH / PIXELSIZE);
GSIZE = GW * GH;
grid1 = null;
N4 = null;
canvas = document.createElement('canvas');
canvas.style.backgroundColor = "black";
ctx = canvas.getContext('2d');
canvas.width = CANVW;
canvas.height = CANVH;
document.body.appendChild(canvas);

let uiContainer = document.createElement("div");
document.body.appendChild(uiContainer);
uiContainer.style.backgroundColor = 'rgba(38, 40, 52, 1)';
uiContainer.style.position = 'fixed';
uiContainer.style.top = CANVH + "px";
uiContainer.style.border = '5px solid rgba(123, 123, 123, 0.09)';
uiContainer.style.height = parseFloat(window.innerHeight) - (CANVH + 10) + "px";
uiContainer.style.width = (parseFloat(window.innerWidth) - 10) + "px";

//	Cells
let destroyedCells = [];
let activeCells = [];
let cellEmitters = [];
let selCells = [];
let au = null;
let levels = [];

//	ENTITIES
let entities = [];
PLAYER = null;

const PHYSTYPES = Object.freeze({ SOLID: 'SOLID', LIQUID: 'LIQUID', GAS: 'GAS', STATIC: 'STATIC' });
const physKeys = Object.keys(PHYSTYPES);
const UPDATE_TYPES = Object.freeze({ STATIC: 'STATIC', DYNAMIC: 'DYNAMIC', ALIVE: 'ALIVE', GEL: 'GEL'});

let CELL_PROPERTIES = {
['GRASS']:	{ color: 'rgb(86, 223, 36)',	lt: Infinity,	brn: 950,	brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 15,	spread: 0,	expl: 0, kn: 1, rclr: 5, fin: 0, fout: 0},
['SAND']:	{ color: 'rgb(255, 221, 0)',	lt: Infinity,	brn: 10,	brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 50,	spread: 0,	expl: 0, kn: 0, rclr: 5, fin: 0, fout: 0},
['GLASS']:	{ color: 'rgb(208, 226, 239)',	lt: Infinity,	brn: 1,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 90,	spread: 0,	expl: 0, kn: 0, rclr: 5, fin: 0, fout: 0},
['ROCK']:	{ color: 'rgba(45, 46, 37, 1)',		lt: Infinity,	brn: 1,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 95,	spread: 0,	expl: 0, kn: 1, rclr: 5, fin: 0, fout: 0},
['DIAMOND']:{ color: 'rgb(102, 203, 221)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 1000,	spread: 0,	expl: 0, kn: 0, rclr: 5, fin: 0, fout: 0},
['COAL']:	{ color: 'rgb(68, 68, 68)',	lt: 10,			brn: 1,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 45,	spread: 2,	expl: 0, kn: 0, rclr: 5, fin: 0, fout: 0},
['HOTCOAL']:{ color: 'rgba(87, 62, 62, 1)',	lt: 10,		brn: 1,		brnpwr: 1,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 45,	spread: 2,	expl: 0, kn: 0, rclr: 5, fin: 0, fout: 0},
['GBLADE']:	{ color: 'rgba(61, 128, 37, 1)',	lt: Infinity,	brn: 990,	brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 15,	spread: 0,	expl: 0, kn: 1, rclr: 0, fin: 0, fout: 0},
['RAINBOW']:{ color: 'rgb(255, 0, 234)',	lt: Infinity,	brn: 950,	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 10,	spread: 0,	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['MAGMA']:	{ color: 'rgb(198, 64, 2)',	lt: 12,			brn: 0,		brnpwr: 1000,	douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 100,	spread: 0,	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['SNOW']:	{ color: 'rgba(255, 255, 255, 1)',	lt: Infinity,			brn: 1000,		brnpwr: 0,	douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 2,	spread: 0,	expl: 0, kn: 0, rclr: 5, fin: 0, fout: 0},
['ICE']:	{ color: 'rgba(66, 180, 205, 1)',	lt: Infinity,	brn: 400,	brnpwr: 0,		douse: 0, freeze: 1, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 10,	spread: 2,	expl: 0, kn: 0, rclr: 0, fin: .4, fout: .2},
['STATICWATER']: { color: 'rgba(47, 93, 134, 1)', lt: Infinity, brn: 0, brnpwr: 0, douse: 1, freeze: 0, cor: 0, physT: 'LIQUID', updT: 'STATIC', dns: 2, spread: 20, expl: 0, kn: 0, rclr: 0, fin: 0, fout: 0 },

['TNT']: 	{ color: 'rgb(74,104,115)', 	lt: Infinity, 	brn: 999, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'DYNAMIC', dns: 50, 	spread: 0, 	expl: 5, kn: 0, rclr: 5, fin: 0, fout: 0},
['DYNAMITE']: { color: 'rgb(115, 99, 74)', lt: 5, brn: 999, brnpwr: 0, douse: 0, freeze: 0, cor: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 50, spread: 0, expl: 5, kn: 0, rclr: 5, fin: 0, fout: 0 },
['PROJ']:	{color: 'rgba(179, 213, 29, 1)',	lt: 5,			brn: 999,	brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 50,	spread: 0,	expl: 5, kn: 0, rclr: 5, fin: 0, fout: 0},

['WATER']: { color: 'rgb(0,91, 255)', lt: Infinity, brn: 0, brnpwr: 0, douse: 1, freeze: 0, cor: 0, physT: 'LIQUID', updT: 'DYNAMIC', dns: 2, spread: 20, expl: 0, kn: 1, rclr: 0, fin: 0, fout: 0 },
['OIL']:	{ color: 'rgb(50, 96, 84)',	lt: Infinity,	brn: 980,	brnpwr: 0,		douse: 1, freeze: 0, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 1,	spread: 20,	expl: 0, kn: 0, rclr: 0, fin: 0, fout: 0},
['ACID']:	{ color: 'rgba(84, 26, 96, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 1, freeze: 0, cor: 800, physT:'LIQUID',updT: 'DYNAMIC', dns: 1.8,	spread: 6,	expl: 0, kn: 0, rclr: 0, fin: 0, fout: 0},
['CHEMX']:	{ color: 'rgb(16, 96, 28)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 1, freeze: 0, cor: 1500, physT:'LIQUID',updT: 'DYNAMIC', dns: 1.9,	spread: 6,	expl: 0, kn: 0, rclr: 0, fin: 0, fout: 0},
['BUBBLE']:	{ color: 'rgb(255, 255, 255)',	lt: 1,			brn: 0,		brnpwr: 0,		douse: 1, freeze: 0, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 1,	spread: 20,	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['HYDROGEL']:{ color:'rgb(97,60,81)',	lt: Infinity, 	brn: 0,		brnpwr: 0, 		douse: 1, freeze: 0, cor: 0, physT: 'LIQUID', 	updT: 'DYNAMIC', dns: 2, 	spread: 1,	expl: 0, kn: 1, rclr: 0, fin: 0, fout: 0},
['LAVA']:	{ color: 'rgb(255, 0, 0)',		lt: Infinity,	brn: 0,		brnpwr: 1000,	douse: 0, freeze: 0, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 2.1,	spread: 5,	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},

['FIRE']: { color: 'rgb(214, 113, 40)', lt: .3, brn: 0, brnpwr: 1000, douse: 0, freeze: 0, cor: 0, physT: 'GAS', updT: 'DYNAMIC', dns: 1, spread: 0, expl: 0, kn: 1, rclr: 10, fin: .05, fout: .4 },
['HESTIA']:	{ color: 'rgba(199, 56, 199, 1)',	lt: .3,			brn: 0,		brnpwr: 1000,	douse: 0, freeze: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 0,	expl: 0, kn: 1, rclr: 10, fin: .05, fout: .4},
['DUST']:	{ color: 'rgb(171, 171, 171)',	lt: 1.2,		brn: 0,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 0,	expl: 0, kn: 0, rclr: 0, fin: 2, fout: 2},
['SMOKE']:	{ color: 'rgba(48, 48, 48, 1)',	lt: 1.5,		brn: 0,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 0,	expl: 0, kn: 0, rclr: 0, fin: 1, fout: 1},
['BOLT']:	{ color: 'rgb(212, 255, 0)',	lt: .1,			brn: 0,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 100,	spread: 0,	expl: 0, kn: 0, rclr: 10, fin: .2, fout: .1},
['CLOUD']:	{ color: 'rgb(255, 255, 255)',	lt: 20,			brn: 0,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 2,	expl: 0, kn: 0, rclr: 0, fin: 20, fout: 20},
['PYROGEL']:{ color: 'rgb(39, 218, 200)',	lt: .4,			brn: 0,		brnpwr: 0,		douse: 0, freeze: 1, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 10,	spread: 2,	expl: 0, kn: 0, rclr: 0, fin: .4, fout: .5},
['STEAM']:	{ color: 'rgba(210, 218, 227, 1)',	lt: 4,			brn: 0,		brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 0,	expl: 0, kn: 0, rclr: 0, fin: 0, fout: .2},

['SHROOM']: { color: 'rgba(39, 192, 44, 1)', lt: Infinity, brn: 985, brnpwr: 0, douse: 0, freeze: 0, cor: 0, physT: 'SOLID', updT: 'ALIVE', dns: 4, spread: 0, expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0 },
['MUSHX']:	{ color: 'rgba(126, 60, 212, 1)',  lt: Infinity, 	brn: 985, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 2000, physT: 'SOLID',updT: 'ALIVE', 	 dns: 4, 	spread: 0, 	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['TREE']: 	{ color: 'rgb(61, 41, 37)', 	lt: Infinity, 	brn: 900, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE', 	 dns: 4, 	spread: 0, 	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['LEAF']: 	{ color: 'rgba(74, 207, 94, 1)', 	lt: Infinity, 	brn: 990, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE',  dns: 4, 	spread: 0, 	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['BEE']:	{ color: 'rgb(87, 76, 56)',	lt: Infinity,	brn: 970,	brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'ALIVE', 	 dns: 2,	spread: 0,	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['ANT']: 	{ color: 'rgba(92, 42, 34, 1)', lt: Infinity,	brn: 970, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE', 	 dns: 25, 	spread: 0, 	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['FIREANT']: { color: 'rgba(78, 36, 108, 1)', lt: Infinity,	brn: 0, 	brnpwr: 1000,	douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE', 	 dns: 25, 	spread: 0, 	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['ANTEGG']: { color: 'rgb(226, 224, 206)', lt: 5, 			brn: 970, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'ALIVE', 	 dns: 25, 	spread: 0, 	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['FISH']:	{ color: 'rgb(27, 80,33)',	lt: Infinity,	brn: 970,	brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'ALIVE', 	 dns: 25,	spread: 0,	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['ALIEN']:	{ color: 'rgb(45,19, 83)', 	lt: Infinity, 	brn: 980, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'STATIC', 	updT: 'ALIVE', 	 dns: 4, 	spread: 0, 	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},
['HONEY']:	{ color: 'rgb(199,60, 33)',	lt: Infinity,	brn: 800,	brnpwr: 0,		douse: 0, freeze: 0, cor: 0, physT: 'SOLID',	updT: 'FOOD',  	 dns: 2,	spread: 0,	expl: 0, kn: 0, rclr: 10, fin: 0, fout: 0},

['TORCH']: { color: 'rgb(214, 113, 40)', lt: Infinity, brn: 0, brnpwr: 1000, douse: 0, freeze: 0, cor: 0, physT: 'SOLID', updT: 'STATIC', dns: 30, spread: 0, expl: 0, kn: 0, rclr: 10, fin: .5, fout: .5 },
['WOOD']: 	{ color: 'rgb(61, 41, 37)',	lt: Infinity, 	brn: 950, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'STATIC',  dns: 40, 	spread: 0,  expl: 0, kn: 0, rclr: 0, fin: 0, fout: 0},
['METAL']: 	{ color: 'rgb(72, 79, 94)',	lt: Infinity,	brn: 0, 	brnpwr: 0, 		douse: 0, freeze: 0, cor: 0, physT: 'SOLID', 	updT: 'STATIC',  dns: 800, 	spread: 0, 	expl: 0, kn: 0, rclr: 0, fin: 0, fout: 0},
['XPLOSIVE']: { color: 'rgba(60, 83, 36, 1)', lt: Infinity, brn: 999, brnpwr: 0, douse: 0, freeze: 0, cor: 0, physT: 'SOLID', updT: 'STATIC', dns: 800, spread: 0, expl: 5, kn: 0, rclr: 0, fin: 0, fout: 0 },
['???']:	{ color: 'rgba(109, 42, 96, 1)',	lt: 10,	brn: 10, 	brnpwr: 10, 		douse: 1, freeze: 1, cor: 1, physT: 'SOLID', 	updT: 'DYNAMIC',  dns: 2, 	spread: 20, expl: 2, kn: 0, rclr: 5, fin: 1, fout: 1},

['ENTITY']: { color: 'rgba(177, 136, 136, 1)', lt: Infinity, brn: 985, brnpwr: 0, douse: 0, freeze: 0, cor: 0, physT: 'SOLID', updT: 'STATIC', dns: 1, spread: 0, expl: 0, kn: 0, rclr: 0, fin: 0, fout: 0 },
}; let cellKeys = Object.keys(CELL_PROPERTIES);

const TAGS = [
    { type: 'SOLID', color: setBrightness('rgba(115, 144, 118, 1)', 150) },
    { type: 'LIQUID', color: setBrightness('rgba(46, 113, 207, 1)', 150) },
    { type: 'GAS', color: setBrightness('rgba(129, 127, 23, 1)', 150) },
    { type: 'STATIC', color: setBrightness('rgba(33, 169, 117, 1)', 150) },
	{ type: 'ALIVE', color: setBrightness('rgba(33, 169, 117, 1)', 150) },
    { type: 'ENT', color: setBrightness('rgba(131, 33, 169, 1)', 150) },
    { type: 'HEAT', color: setBrightness('rgba(212, 103, 24, 1)', 150) },
    { type: 'ACIDS', color: setBrightness('rgba(166, 45, 179, 1)', 150) },
	{ type: 'DOUSE', color: setBrightness('rgba(33, 124, 169, 1)', 150) },
	{ type: 'EXPLOSIVE', color: setBrightness('rgba(57, 48, 37, 1)', 150) },
    { type: 'CUSTOM', color: setBrightness('rgba(255, 255, 255, 1)', 150) },
    { type: 'ALL', color: setBrightness('rgba(255, 255, 255, 1)', 150) }
];

const TAG_INDEX = TAGS.reduce((acc, tag, i) => ({ ...acc, [tag.type]: i }), {});
function tagMaskOf(tags) {return tags.reduce((mask, tag) => {const index = TAG_INDEX[tag];return index !== undefined ? mask | (1 << index) : mask;}, 0);}
function addTag(type, color = setBrightness[CELL_PROPERTIES[cellKeys[type]].color]) {const brightColor = setBrightness(color, 150);TAGS.push({ type, color: brightColor });TAG_INDEX[type] = TAGS.length - 1;}
function hasTag(type, tag) {const p = CELL_PROPERTIES[type];return !!(p.tagMask & (1 << TAG_INDEX[tag]));}
function anyTag(type, tags) {const m = tagMaskOf(tags);return (CELL_PROPERTIES[type].tagMask & m) !== 0;}
function allTags(type, tags) {const m = tagMaskOf(tags);return (CELL_PROPERTIES[type].tagMask & m) === m;}
function setTags(type, tags) {const p = CELL_PROPERTIES[type];p.tags = [...new Set(tags)];p.tagMask = tagMaskOf(p.tags);}
function typesWithAny(tags) {const m = tagMaskOf(tags);return Object.keys(CELL_PROPERTIES).filter(k => (CELL_PROPERTIES[k].tagMask & m) !== 0);}
function typesWithAll(tags) {const m = tagMaskOf(tags);return Object.keys(CELL_PROPERTIES).filter(k => (CELL_PROPERTIES[k].tagMask & m) === m);}

for (const k in CELL_PROPERTIES) {
	const p = CELL_PROPERTIES[k];
	const s = new Set(p.tags || []);
	if (k === 'ENTITY') continue;
	s.add('ALL');
	if (p.brn > 100) s.add('COMB');
	if (p.brnpwr > 0) s.add('HEAT');
	if (p.douse > 0) s.add('DOUSE');
	if (p.cor) s.add('ACIDS');
	if (p.updT == 'ALIVE') s.add('ALIVE');
	if (p.expl) s.add('EXPLOSIVE');
	if (p.updT) s.add(p.updT);
	if (p.physT && p.updT == 'DYNAMIC') s.add(p.physT);
	p.tags = [...s];
	p.tagMask = tagMaskOf(p.tags);
}

ISGAME = false;
if (!ISGAME) discoverAll();

function discoverAll() {
	for (let i = 0; i < cellKeys.length; i++){
		CELL_PROPERTIES[cellKeys[i]].kn = 1;
	}
}
