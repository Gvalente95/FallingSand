//	INPUT
KEYS = {};
ISREWINDING = false;
MOUSECLICKED = MOUSEPRESSED = false;
MOUSEX = MOUSEY = null;
MOUSEDX = MOUSEDY = 0;
MOUSEGRIDX = MOUSEGRIDY = 0;
MOUSEMOVED = false;
CLICKCOLOR = getRandomcolor();
PXATMOUSE = null;
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// PARAMS
PIXELSIZE = 4;
BRUSHSIZE = 8;
MAXPARTICLES = 100000;
MAXBRUSHSIZE = 40;
XDRAG = .1;
GRAVITY = .1;
SIMSPEED = 1;
TYPEINDEX = 0;
TRAILAMOUNT = 10;
RAINPOW = 50;
BRUSHCUT = false;
PICKACTIVE = false;
ISRAINING = false;
SHOULDCUT = false;
const BRUSHTYPES = Object.freeze({ DISC: 'DISC', RECT: 'RECT'})
BRUSHTYPE = BRUSHTYPES.RECT;
const BrushKeys = Object.keys(BRUSHTYPES);

//	CANVAS
CANVW = window.innerWidth;
CANVH = window.innerHeight - 165;
GRIDW = Math.floor(CANVW / PIXELSIZE);
GRIDH = Math.floor(CANVH / PIXELSIZE);

//	UI
const selButtonColor = '1px solid rgba(255, 255, 255, 1)';
let uiPagesButtons = [];
let uiPageContent = [];
let typeButton = null;
let gridLayer = null;
let inPause = false;
let gridMode = true;
let uiPageIndex = 0;
let uiLayerIndex = 0;
let gridCacheKey = "";
canvas = document.createElement('canvas');
canvas.style.backgroundColor = "black";
ctx = canvas.getContext('2d');
canvas.width = CANVW;
canvas.height = CANVH;
document.body.appendChild(canvas);

//	PARTICLES
let grid = [];
let destroyedParticles = [];
let activeParticles = [];
let particleEmitters = [];
const SOLID_TYPES = Object.freeze({ SOLID: 'SOLID', LIQUID: 'LIQUID', GAS: 'GAS', STATIC: 'STATIC' })
const solidKeys = Object.keys(SOLID_TYPES);
const UPDATE_TYPES = Object.freeze({ STATIC: 'STATIC', DYNAMIC: 'DYNAMIC', })
const TAGS = Object.freeze('BIO', 'HEAT', 'DOUSE', 'COLOR', 'ELECTRIC', 'EXPLOSIVE', 'SOLID', 'GAS', 'LIQUID', 'STATIC');

let PARTICLE_PROPERTIES = {
    ['SAND']: { color: 'rgba(255, 221, 0, 1)', lt: Infinity, brn: 10, brnpwr: 0, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 50, spread: 10},
	['GRASS']: { color: 'rgba(86, 223, 36, 1)', lt: Infinity, brn: 900, brnpwr: 0, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 4, spread: 10 },
	['GLASS']: { color: 'rgba(208, 226, 239, 1)', lt: Infinity, brn: 0, brnpwr: 0, douse: 0, physT: 'SOLID' , updT: 'DYNAMIC', dns: 50, spread: 10},
	['ROCK']: { color: 'rgba(76, 78, 1, 1)', lt: Infinity, brn: 0, brnpwr: 0, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 80, spread: 10 },
	['DIAMOND']: { color: 'rgba(102, 203, 221, 1)', lt: Infinity, brn: 0, brnpwr: 0, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 100, spread: 10 },
 	['TNT']: { color: 'rgba(37, 52, 57, 1)', lt: Infinity, brn: 999, brnpwr: 0, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 50, spread: 10},
	['COAL']: { color: 'rgba(68, 68, 68, 1)', lt: 20000, brn: 1, brnpwr: 0, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 20, spread: 2 },
	['RAINBOW']: { color: 'rgba(255, 0, 234, 1)', lt: Infinity, brn: 100, brnpwr: 0, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 100 , spread: 10},
	['MAGMA']: { color: 'rgba(198, 64, 2, 1)', lt: 12000, brn: 0, brnpwr: 1000, douse: 0, physT: 'SOLID', updT: 'DYNAMIC', dns: 100, spread: 10 },
	['OIL']: { color: 'rgba(50, 96, 84, 1)', lt: Infinity, brn: 1000, brnpwr: 0, douse: 1, physT: 'LIQUID', updT: 'DYNAMIC', dns: 1, spread: 20 },
	['ACID']: { color: 'rgba(131, 35, 163, 1)', lt: Infinity, brn: 10, brnpwr: 0, douse: 1, physT: 'LIQUID', updT: 'DYNAMIC', dns: 3, spread: 6 },
	['BUBBLE']: { color: 'rgba(255, 255, 255, 1)', lt: 1000, brn: 0, brnpwr: 0, douse: 1, physT: 'LIQUID', updT: 'DYNAMIC', dns: 1, spread: 10 },
    ['WATER']: { color: 'rgba(0, 72, 255, 1)', lt: Infinity, brn: 0, brnpwr: 0, douse: 1, physT: 'LIQUID', updT: 'DYNAMIC', dns: 2, spread: 15},
	['LAVA']: { color: 'rgba(255, 0, 0, 1)', lt: Infinity, brn: 0, brnpwr: 1000, douse: 0, physT: 'LIQUID', updT: 'DYNAMIC', dns: 4, spread: 5 },
	['LIGHTNING']: { color: 'rgba(212, 255, 0, 1)', lt: 400, brn: 0, brnpwr: 0, douse: 0, physT: 'GAS', updT: 'DYNAMIC', dns: 100, spread: 10 },
	['FIRE']: { color: 'rgba(214, 113, 40, 1)', lt: 400, brn: 0, brnpwr: 1000, douse: 0, physT: 'GAS', updT: 'DYNAMIC', dns: 1, spread: 10 },
	['SMOKE']: { color: 'rgba(106, 106, 106, 1)', lt: 600, brn: 0, brnpwr: 0, douse: 0, physT: 'GAS', updT: 'DYNAMIC', dns: 1 , spread: 10},
	['CLOUD']: { color: 'rgba(255, 255, 255, 1)', lt: 20000, brn: 0, brnpwr: 0, douse: 0, physT: 'GAS' , updT: 'DYNAMIC', dns: 20, spread: 2},
	['STEAM']: { color: 'rgba(237, 211, 211, 1)', lt: 6000, brn: 0, brnpwr: 0, douse: 0, physT: 'GAS', updT: 'DYNAMIC', dns: 1, spread: 10 },
	['PLANT']: { color: 'rgba(45, 119, 83, 1)', lt: Infinity, brn: 999, brnpwr: 0, douse: 0, physT: 'STATIC', updT: 'DYNAMIC', dns: 10, spread: 10 },
	['BLOB']: { color: 'rgba(143, 62, 172, 1)', lt: Infinity, brn: 999, brnpwr: 0, douse: 0, physT: 'LIQUID', updT: 'DYNAMIC', dns: 10, spread: 2},
	['TORCH']: { color: 'rgba(255, 0, 0, 1)', lt: Infinity, brn: 0, brnpwr: 1000, douse: 0, physT: 'STATIC', updT: 'STATIC', dns: 1, spread: 10 },
	['WOOD']: { color: 'rgba(74, 54, 10, 1)', lt: Infinity, brn: 950, brnpwr: 0, douse: 0, physT: 'STATIC', updT: 'STATIC', dns: 20, spread: 10 },
};
let particleKeys = Object.keys(PARTICLE_PROPERTIES);
