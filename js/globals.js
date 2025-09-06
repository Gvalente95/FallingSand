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

const PHYSTYPES = Object.freeze({ SOLID: 'SOLID', LIQUID: 'LIQUID', GAS: 'GAS', STATIC: 'STATIC' })
const physKeys = Object.keys(PHYSTYPES);
const UPDATE_TYPES = Object.freeze({ STATIC: 'STATIC', DYNAMIC: 'DYNAMIC', ALIVE: 'ALIVE', })
let PARTICLE_PROPERTIES = {
['SAND']:	{ color: 'rgba(255, 221, 0, 1)',	lt: Infinity,	brn: 10,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 50,	spread: 10,	},
['GRASS']:	{ color: 'rgba(86, 223, 36, 1)',	lt: Infinity,	brn: 900,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 15,	spread: 10,	},
['GLASS']:	{ color: 'rgba(208, 226, 239, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 90,	spread: 10,	},
['ROCK']:	{ color: 'rgba(76, 78, 1, 1)',		lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 95,	spread: 10,	},
['DIAMOND']:{ color: 'rgba(102, 203, 221, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 1000,	spread: 10,	},
['TNT']:	{ color: 'rgba(37, 52, 57, 1)',	lt: Infinity,	brn: 999,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 50,	spread: 10,	},
['COAL']:	{ color: 'rgba(68, 68, 68, 1)',	lt: 20000,		brn: 1,		brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 45,	spread: 2,	},
['RAINBOW']:{ color: 'rgba(255, 0, 234, 1)',	lt: Infinity,	brn: 100,	brnpwr: 0, 		douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 10,	spread: 10,	},
['MAGMA']:	{ color: 'rgba(198, 64, 2, 1)',	lt: 12000,		brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'SOLID',	updT: 'DYNAMIC', dns: 100,	spread: 10,	},
['OIL']:	{ color: 'rgba(50, 96, 84, 1)',	lt: Infinity,	brn: 1000,	brnpwr: 0,		douse: 1, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 1,	spread: 20,	},
['ACID']:	{ color: 'rgba(131, 35, 163, 1)',	lt: Infinity,	brn: 10,	brnpwr: 0,		douse: 1, cor: 1000, physT:'LIQUID',updT: 'DYNAMIC', dns: 1.9,	spread: 6,	},
['BUBBLE']:	{ color: 'rgba(255, 255, 255, 1)',	lt: 1000,		brn: 0,		brnpwr: 0,		douse: 1, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 1,	spread: 10,	},
['WATER']:	{ color: 'rgba(0, 72, 255, 1)',	lt: Infinity,	brn: 0,		brnpwr: 0,		douse: 1, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 2,	spread: 15,	},
['LAVA']:	{ color: 'rgba(255, 0, 0, 1)',		lt: Infinity,	brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'LIQUID',	updT: 'DYNAMIC', dns: 2.1,	spread: 5,	},
['BOLT']:	{ color: 'rgba(212, 255, 0, 1)',	lt: 400,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 100,	spread: 10,	},
['FIRE']:	{ color: 'rgba(214, 113, 40, 1)',	lt: 400,		brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 10,	},
['SMOKE']:	{ color: 'rgba(106, 106, 106, 1)',	lt: 600,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 10,	},
['CLOUD']:	{ color: 'rgba(255, 255, 255, 1)',	lt: 20000,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 2,	},
['STEAM']:	{ color: 'rgba(237, 211, 211, 1)',	lt: 6000,		brn: 0,		brnpwr: 0,		douse: 0, cor: 0, physT: 'GAS',		updT: 'DYNAMIC', dns: 1,	spread: 10,	},
['PLANT']:	{ color: 'rgba(45, 119, 83, 1)', 	lt: Infinity, 	brn: 999, 	brnpwr: 0, 		douse: 0, cor: 0, physT: 'STATIC', 	updT: 'DYNAMIC', dns: 4, 	spread: 10, },
['BLOB']: 	{ color: 'rgba(192, 144, 190, 1)', lt: Infinity, 	brn: 999, 	brnpwr: 0,		douse: 0, cor: 0, physT: 'STATIC', updT: 'DYNAMIC',  dns: 25, 	spread: 10, },
['ANT']:	{ color: 'rgba(99, 62, 62, 1)',	lt: 90000,		brn: 999,	brnpwr: 0,		douse: 0, cor: 0, physT: 'SOLID',	updT: 'ALIVE', 	 dns: 25,	spread: 10,	},
['FROST']:	{ color: 'rgba(126, 166, 205, 1)',	lt: Infinity,	brn: 999,	brnpwr: 0,		douse: 0, cor: 0, physT: 'STATIC',	updT: 'DYNAMIC', dns: 10,	spread: 2,	},
['TORCH']:	{ color: 'rgba(255, 0, 0, 1)',		lt: Infinity,	brn: 0,		brnpwr: 1000,	douse: 0, cor: 0, physT: 'STATIC',	updT: 'STATIC',  dns: 30,	spread: 10,	},
['WOOD']:	{ color: 'rgba(74, 54, 10, 1)',	lt: Infinity,	brn: 950,	brnpwr: 0,		douse: 0, cor: 0, physT: 'STATIC',	updT: 'STATIC',  dns: 40,	spread: 10,	},
};
let particleKeys = Object.keys(PARTICLE_PROPERTIES);


const tagMaskOf = tags => (tags||[]).reduce((m,t)=>{
  const idx = TAG_INDEX[t];
  return idx == null ? m : (m | (1 << idx));
}, 0);
function hasTag(type, tag){ const p=PARTICLE_PROPERTIES[type]; return !!(p.tagMask & (1<<TAG_INDEX[tag])); }
function anyTag(type, tags){ const m = tagMaskOf(tags); return (PARTICLE_PROPERTIES[type].tagMask & m) !== 0; }
function allTags(type, tags){ const m = tagMaskOf(tags); return (PARTICLE_PROPERTIES[type].tagMask & m) === m; }
function setTags(type, tags){ const p=PARTICLE_PROPERTIES[type]; p.tags=[...new Set(tags)]; p.tagMask=tagMaskOf(p.tags); }
function typesWithAny(tags){ const m=tagMaskOf(tags); return Object.keys(PARTICLE_PROPERTIES).filter(k=> (PARTICLE_PROPERTIES[k].tagMask & m)!==0); }
function typesWithAll(tags){ const m=tagMaskOf(tags); return Object.keys(PARTICLE_PROPERTIES).filter(k=> (PARTICLE_PROPERTIES[k].tagMask & m)===m); }

const TAGS = 		['SOLID',					 'LIQUID',					'GAS',						'STATIC', 					'ALIVE', 					'COMB',						'IGNITE', 				'ERODE', 				'WETTING', 					'COLOR', 					 'ELECTRIC', 				 'EXPLOSIVE',			  'CUSTOM',					'ALL'];
const TAGSCOLORS =	['rgba(115, 144, 118, 1)',	'rgba(46, 113, 207, 1)', 'rgba(129, 127, 23, 1)',  'rgba(33, 169, 117, 1)',  'rgba(33, 169, 117, 1)',  'rgba(33, 169, 58, 1)',   'rgba(212, 103, 24, 1)',  'rgba(166, 45, 179, 1)',  'rgba(33, 124, 169, 1)',  'rgba(214, 114, 219, 1)',  'rgba(192, 195, 39, 1)',  'rgba(57, 48, 37, 1)', 'rgba(255,255,255,1)',  'rgba(255,255,255,1)'];

const TAG_INDEX = Object.fromEntries(TAGS.map((t,i)=>[t,i]));
for (const k in PARTICLE_PROPERTIES) {
	const p = PARTICLE_PROPERTIES[k];
	const s = new Set(p.tags || []);
	if (p.brn > 100) s.add('COMB');
	if (p.brnpwr > 0) s.add('IGNITE');
	if (p.douse > 0) s.add('WETTING');
	if (p.physT) s.add(p.physT);
	if (p.cor) s.add('ERODE');
	if (k == 'PLANT' || k == 'BLOB' || k == 'ANT') s.add('ALIVE');
	s.add('ALL');
	p.tags = [...s];
	p.tagMask = tagMaskOf(p.tags);
}
