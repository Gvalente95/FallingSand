const audioPath = "ressources/audio/";
class AudioManager {
	constructor() {
		this.lastPlayTime = 0;
		this.maxQueue = 200;
		this.active = false;
		this.playInterval = 0.05;
		this.audioQueue = [];
		this.buttonOk = new Audio(audioPath + "ui/buttonOk.mp3");
		this.gameOn = new Audio(audioPath + "ui/gameOn.mp3");
		this.dig = new Audio(audioPath + "ui/dig.mp3");
		this.tuk = new Audio(audioPath + "ui/tuk.mp3");
		this.click = new Audio(audioPath + "ui/click.mp3");
		this.clock = new Audio(audioPath + "ui/clock.mp3");
		this.soundCapture = new Audio(audioPath + "ui/Capture.mp3");
		this.soundDenied = new Audio(audioPath + "ui/denied.mp3");
		this.trill = new Audio(audioPath + "ui/trill.mp3");

		this.musBgr = new Audio(audioPath + "mus/FluorescentCaves.wav");
		this.footsteps = new Audio(audioPath + "Footsteps/Grass.wav");
		this.inWater = new Audio(audioPath + "amb/inWater.wav");
		this.splash = new Audio(audioPath + "Jumps/splash.wav");

	}

	initElementSounds(basePath)
	{
		this.elementSounds = [];
		let i = 0;
		for (const str of cellKeys)
		{
			const fpath = basePath + "/" + str + "/" + "0.wav";
			this.elementSounds[i++] = new Audio(fpath);
		}
	}

	initSounds(basePath, amount, extension = ".mp3") {
		const sounds = [];
		for (let i = 0; i < amount; i++)
			sounds[i] = new Audio(basePath + i + extension);
		return sounds;
	}

	playSoundAtIndex(list, index, volume = 1)
	{
		const au = new Audio(list[index].src);
		au.volume = volume;
		this.lastPlayTime = now;
		au.play();
	}

	playRandomSound(list, volume = 1) {
		if (!this.active) return;
		let index = r_range(0, list.length - 1);
		const au = new Audio(list[index].src);
		au.volume = volume;
		this.lastPlayTime = now;
		au.play();
	}

	update() {
		this.active = (this.active);
	}

	playSound(sound, volume = 1) {
		if (!this.active) return;
		this.lastPlayTime = now;
		const newAu = new Audio(sound.src);
		newAu.volume = volume;
		newAu.play();
		console.warn("AUDIO PLAYED - " + sound.src);
	}

	
	playLoop(sound, volume, conditionFn) {
		if (!sound) return;
		sound.volume = volume;
		if (!sound._loopController) {
			sound._loopController = setInterval(() => {
				const cond = conditionFn();
				if (!cond) {
					if (!sound.paused) {
						sound.pause(); sound.currentTime = 0;
					}
					return;
				}
				if (!this.active) return;
				if (sound.paused) {
					sound.currentTime = 0; sound.play();
				}
				if (sound.ended) {
					sound.currentTime = 0; sound.play();
				}
			}, 30);
		}
	}

	playInQueue(original, volume) {
		if (!original)
			return;
		const au = new Audio(original.src);
		au.volume = volume;
		this.audioQueue.push(au);
		au.onended = () => {
			const idx = this.audioQueue.indexOf(au);
			if (idx !== -1) this.audioQueue.splice(idx, 1);
		};
		this.lastPlayTime = now;
		au.play();
	}
}
