//	INPUT
KEYS = {};
MOUSECLICKED = MOUSEPRESSED = false;
MOUSEX = MOUSEY = null;
MOUSEDX = MOUSEDY = 0;
MOUSEGRIDX = MOUSEGRIDY = 0;
MOUSEMOVED = false;
const isMobile = isMobileDevice();

SHOULCUT = false;
// PARAMS
PIXELSIZE = 4;
BRUSHSIZE = 8;
MAXBRUSHSIZE = 40;
BRUSHCUT = false;
PICKACTIVE = false;
XDRAG = .1;
GRAVITY = .1;
SIMSPEED = 1;
TYPEINDEX = 0;
ISRAINING = false;
RAININTENSITY = 100;
const BRUSHTYPES = Object.freeze({ DISC: 'DISC', RECT: 'RECT', LOSANGE: 'LOSANGE', RAND: 'RAND', })
BRUSHTYPE = BRUSHTYPES.RECT;
const BrushKeys = Object.keys(BRUSHTYPES);

//	CANVAS
CANVW = window.innerWidth;
CANVH = window.innerHeight - 180;
GRIDW = Math.floor(CANVW / PIXELSIZE);
GRIDH = Math.floor(CANVH / PIXELSIZE);

//	UI
const selButtonColor = '4px solid rgba(255, 255, 255, 1)';
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
const SOLID_TYPES = Object.freeze({ SOLID: 'SOLID', LIQUID: 'LIQUID', GAS: 'GAS', LIVING: 'LIVING', STATIC: 'STATIC' })
const solidKeys = Object.keys(SOLID_TYPES);
const UPDATE_TYPES = Object.freeze({STATIC: 'STATIC', DYNAMIC: 'DYNAMIC',})
let PARTICLE_TYPES = Object.freeze({
	SAND: 'SAND', TNT: 'TNT', WATER: 'WATER', WOOD: 'WOOD', TORCH: 'TORCH', FIRE: 'FIRE', GLASS: 'GLASS', BLOB: 'BLOB',
	OIL: 'OIL', DIAMOND: 'DIAMOND', GRASS: 'GRASS', ACID: 'ACID', ROCK: 'ROCK', LAVA: 'LAVA', CLOUD: 'CLOUD', LIGHTNING: 'LIGHTNING',
	SMOKE: 'SMOKE', MAGMA: 'MAGMA', COAL: 'COAL', BUBBLE: 'BUBBLE', STEAM: 'STEAM',})
let particleKeys = Object.keys(PARTICLE_TYPES);
let PARTICLE_PROPERTIES = {
    [PARTICLE_TYPES.SAND]: { color: 'rgba(255, 221, 0, 1)', lifeTime: Infinity, flammability: 10, burner: 0, douse: 0, solType: SOLID_TYPES.SOLID, updType: UPDATE_TYPES.DYNAMIC, density: 50, spread: 10},
    [PARTICLE_TYPES.WATER]: { color: 'rgba(0, 72, 255, 1)', lifeTime: Infinity, flammability: 0, burner: 0, douse: 1, solType: SOLID_TYPES.LIQUID, updType: UPDATE_TYPES.DYNAMIC, density: 2, spread: 15},
	[PARTICLE_TYPES.GRASS]: { color: 'rgba(86, 223, 36, 1)', lifeTime: Infinity, flammability: 900, burner: 0, douse: 0, solType: SOLID_TYPES.SOLID, updType: UPDATE_TYPES.DYNAMIC, density: 4, spread: 10 },
	[PARTICLE_TYPES.GLASS]: { color: 'rgba(208, 226, 239, 1)', lifeTime: Infinity, flammability: 0, burner: 0, douse: 0, solType: SOLID_TYPES.SOLID , updType: UPDATE_TYPES.DYNAMIC, density: 50, spread: 10},
	[PARTICLE_TYPES.ROCK]: { color: 'rgba(76, 78, 1, 1)', lifeTime: Infinity, flammability: 0, burner: 0, douse: 0, solType: SOLID_TYPES.SOLID, updType: UPDATE_TYPES.DYNAMIC, density: 80, spread: 10 },
	[PARTICLE_TYPES.DIAMOND]: { color: 'rgba(102, 203, 221, 1)', lifeTime: Infinity, flammability: 0, burner: 0, douse: 0, solType: SOLID_TYPES.SOLID, updType: UPDATE_TYPES.DYNAMIC, density: 100, spread: 10 },
	[PARTICLE_TYPES.LIGHTNING]: { color: 'rgba(212, 255, 0, 1)', lifeTime: 400, flammability: 0, burner: 0, douse: 0, solType: SOLID_TYPES.GAS, updType: UPDATE_TYPES.DYNAMIC, density: 100 , spread: 10},
	[PARTICLE_TYPES.MAGMA]: { color: 'rgba(198, 64, 2, 1)', lifeTime: 12000, flammability: 0, burner: 1000, douse: 0, solType: SOLID_TYPES.SOLID, updType: UPDATE_TYPES.DYNAMIC, density: 100, spread: 10 },
    [PARTICLE_TYPES.TNT]: { color: 'rgba(37, 52, 57, 1)', lifeTime: Infinity, flammability: 999, burner: 0, douse: 0, solType: SOLID_TYPES.SOLID, updType: UPDATE_TYPES.DYNAMIC, density: 50, spread: 10},
	[PARTICLE_TYPES.COAL]: { color: 'rgba(68, 68, 68, 1)', lifeTime: 20000, flammability: 1, burner: 0, douse: 0, solType: SOLID_TYPES.SOLID, updType: UPDATE_TYPES.DYNAMIC, density: 20, spread: 2 },
	[PARTICLE_TYPES.BLOB]: { color: 'rgba(45, 119, 83, 1)', lifeTime: Infinity, flammability: 999, burner: 0, douse: 0, solType: SOLID_TYPES.LIVING, updType: UPDATE_TYPES.DYNAMIC, density: 10, spread: 10},
	[PARTICLE_TYPES.TORCH]: { color: 'rgba(255, 0, 0, 1)', lifeTime: Infinity, flammability: 0, burner: 1000, douse: 0, solType: SOLID_TYPES.STATIC, updType: UPDATE_TYPES.STATIC, density: 1, spread: 10 },
	[PARTICLE_TYPES.WOOD]: { color: 'rgba(74, 54, 10, 1)', lifeTime: Infinity, flammability: 950, burner: 0, douse: 0, solType: SOLID_TYPES.STATIC, updType: UPDATE_TYPES.STATIC, density: 20, spread: 10 },
	[PARTICLE_TYPES.OIL]: { color: 'rgba(50, 96, 84, 1)', lifeTime: Infinity, flammability: 1000, burner: 0, douse: 1, solType: SOLID_TYPES.LIQUID, updType: UPDATE_TYPES.DYNAMIC, density: 1, spread: 20 },
	[PARTICLE_TYPES.ACID]: { color: 'rgba(131, 35, 163, 1)', lifeTime: Infinity, flammability: 10, burner: 0, douse: 1, solType: SOLID_TYPES.LIQUID, updType: UPDATE_TYPES.DYNAMIC, density: 3, spread: 6 },
	[PARTICLE_TYPES.BUBBLE]: { color: 'rgba(255, 255, 255, 1)', lifeTime: 1000, flammability: 0, burner: 0, douse: 1, solType: SOLID_TYPES.LIQUID, updType: UPDATE_TYPES.DYNAMIC, density: 1, spread: 10 },
	[PARTICLE_TYPES.LAVA]: { color: 'rgba(255, 0, 0, 1)', lifeTime: Infinity, flammability: 0, burner: 1000, douse: 0, solType: SOLID_TYPES.LIQUID, updType: UPDATE_TYPES.DYNAMIC, density: 4, spread: 5 },
	[PARTICLE_TYPES.FIRE]: { color: 'rgba(214, 113, 40, 1)', lifeTime: 400, flammability: 0, burner: 1000, douse: 0, solType: SOLID_TYPES.GAS, updType: UPDATE_TYPES.DYNAMIC, density: 1, spread: 10 },
	[PARTICLE_TYPES.SMOKE]: { color: 'rgba(106, 106, 106, 1)', lifeTime: 600, flammability: 0, burner: 0, douse: 0, solType: SOLID_TYPES.GAS, updType: UPDATE_TYPES.DYNAMIC, density: 1 , spread: 10},
	[PARTICLE_TYPES.CLOUD]: { color: 'rgba(255, 255, 255, 1)', lifeTime: 20000, flammability: 0, burner: 0, douse: 0, solType: SOLID_TYPES.GAS , updType: UPDATE_TYPES.DYNAMIC, density: 20, spread: 2},
	[PARTICLE_TYPES.STEAM]: { color: 'rgba(237, 211, 211, 1)', lifeTime: 6000, flammability: 0, burner: 0, douse: 0, solType: SOLID_TYPES.GAS, updType: UPDATE_TYPES.DYNAMIC, density: 1, spread: 10 },
};
