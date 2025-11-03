const baseStats = {
	hp: 1000,
	jumpFreq: .1,
	moveFreq: 1,
	dirFreq: 1,
	moveSpeed: .2,
	moveDrag: .1,
	projType: null,
	projFreq: 5,
	projForce: 5,
	collision: true,
	swim: true,
	flight: false,
}

function getPlayerData() {
	return {
		image: [
			"....aaaa...",
			"....ahhh....",
			"....ahhh....",
			".....tt.....",
			"....ttttd.....",
			"..gtttttd.....",
			"..gtttttd.....",
			"..gtttttd.....",
			"..gttttt....",
			"...ttttt....",
			"...lllrr....",
			"...lllrr....",
			"...lllrr....",
			"...lllrr....",
			"...lllrr...."
		],
		colors: {
			a: "rgba(78, 54, 50, 1)",
			h: "rgba(177, 136, 136, 1)",
			t: "rgba(69, 67, 52, 1)",
			g: "rgba(177, 136, 136, 1)",
			d: "rgba(177, 136, 136, 1)",
			l: "rgba(64, 114, 121, 1)",
			r: "rgba(83, 96, 139, 1)"
		},
		stats: {
			hp: baseStats.hp,
			jumpFreq: baseStats.jumpFreq,
			moveFreq: baseStats.moveFreq,
			moveSpeed: baseStats.moveSpeed,
			moveDrag: .1,
			projFreq: baseStats.atkFreq,
			projType: 'PROJ',
			projForce: 20,
			swim: baseStats.swim,
			flight: baseStats.flight,
		}
	};
}

function getSpiderForm() {
	return {
		image: [
			".......vvvvv......",
			"......vhihhhv.....",
			".....vhhhhhihv....",
			".....vhhhhhhhv....",
			"....vvvvvvvvv.....",
			"....l..r.l.r..l...",
			"...l..r..l..r..l..",
			"..l..r...l...r..l.",
			"..l..r...l...r..l.",
		],
		colors: {
			h: "rgba(150, 76, 182, 1)",
			v: "rgba(146, 120, 158, 1)",
			l: "rgba(69, 24, 83, 1)",
			r: "rgba(82, 52, 88, 1)",
			i: "rgba(0, 0, 0, 1)",
		},
		stats: {
			moveSpeed: 4,
			moveDrag: .01,
			projType: "ACID",
		}
	};	
}

function getSpider2Form() {
	return {
		image: [
			".......hhhhh......",
			".....hhhhhhhhh....",
			"......hhhhhhh.....",
			".....l.r.l.r..l...",
			"....l..r..l.r..l..",
			"....l..r..l.r..l..",
			"....l.r...l..r.l..",
			"....l.r...l..r.l..	",
		],
		colors: {
			h: "rgba(177, 136, 136, 1)",
			l: "rgba(64, 114, 121, 1)",
			r: "rgba(83, 96, 139, 1)"
		},
		stats: {
			moveSpeed: 4,
			moveDrag: .01,
		}
	};
}

function longBoyForm() {
	return {
		image: [
			"........hhh.......",
			".......hhhhh......",
			"........hh........",
			"......tttttt......",
			".....g.tttt.d.....",
			".....g.llrr.d.....",
			".......llr........",
			".......llr........",
			".......llr........",
			".......llr........",
			".......llr........	",
		],
		colors: {
			h: "rgba(136, 161, 177, 1)",
			t: "rgba(52, 58, 69, 1)",
			g: "rgba(166, 190, 183, 1)",
			d: "rgba(177, 204, 187, 1)",
			l: "rgba(184, 213, 204, 1)",
			r: "rgba(95, 112, 114, 1)"
		},
		stats: {
			moveSpeed: 5,
			moveDrag: .01,
		}
	};
}

function getDoorForm() {
	return {
		image: [
			"tttttttttttt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"trrrrrrrrrrt",
			"tttttttttttt",
		],
		colors: {
			t: "rgba(177, 136, 136, 1)",
			r: "rgba(186, 186, 44, 1)",
		},
		stats: {
			moveSpeed: 0,
			projType: null,
			dirFreq: 0,
		}
	};
}

function getEntFormsButtonData() {
	return [
		{ key: "PLAYER", color: "rgba(170, 0, 255, 0.7)" },
		{ key: "SPIDER", color: "rgba(103, 100, 192, 0.7)" },
		{ key: "SPIDER2", color: "rgba(103, 100, 192, 0.7)" },
		{ key: "LONGBOY", color: "rgba(103, 100, 192, 0.7)" },
		{ key: "DOOR", color: "rgba(83, 96, 139, 0.7)" }
	];
}

function getMobData() {
	let formF = [longBoyForm, getSpiderForm, getSpider2Form];
	let f = formF[r_range(0, formF.length)];
	form = f();
	return (form);
}

function getEntOfIndex(index) {
	let formF = [getPlayerData, getSpiderForm, getSpider2Form, longBoyForm, getDoorForm];
	let f = formF[clamp(index, 0, formF.length - 1)];
	return (f());
}
