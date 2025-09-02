const audioPath = "ressources/audio/";
class AudioManager {
	constructor() {
		this.lastPlayTime = 0;
		this.canPlay = true;
		this.maxQueue = 200;
		this.active = true;
		this.playInterval = 0.05;
		this.audioQueue = [];
		this.buttonOk = new Audio(audioPath + "buttonOk.mp3");
		this.gameOn = new Audio(audioPath + "gameOn.mp3");
		this.soundMove = new Audio(audioPath + "Move.mp3");
		this.dig = new Audio(audioPath + "dig.mp3");
		this.tuk = new Audio(audioPath + "tuk.mp3");
		this.click = new Audio(audioPath + "click.mp3");
		this.clock = new Audio(audioPath + "clock.mp3");
		this.soundCapture = new Audio(audioPath + "Capture.mp3");
		this.soundDenied = new Audio(audioPath + "denied.mp3");
		this.trill = new Audio(audioPath + "trill.mp3");
		// this.initElementSounds("ressources/audio/Elements");
	}

	initElementSounds(basePath)
	{
		this.elementSounds = [];
		let i = 0;
		for (const str of particleKeys)
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
		if (!this.canPlay) return;
		let index = r_range(0, list.length - 1);
		const au = new Audio(list[index].src);
		au.volume = volume;
		this.lastPlayTime = now;
		au.play();
	}

	update() {
		this.canPlay = (
			this.active &&
			(now - this.lastPlayTime > this.playInterval)
		);
	}

	playSound(sound, volume = 1) {
		if (!this.canPlay) return;
		this.lastPlayTime = now;
		const newAu = new Audio(sound.src);
		newAu.volume = volume;
		newAu.play();
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
