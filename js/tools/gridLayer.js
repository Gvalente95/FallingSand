function buildGridLayer() {
	buildWaterShades();
	const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const g = off.getContext("2d");
<<<<<<< HEAD
	g.fillStyle = "rgba(75, 75, 75, 0.53)";
=======
	g.fillStyle = "rgba(0, 179, 255, 0.53)";
>>>>>>> 144abe00646466cee9cbd8d4100b4b68bdf074d5
	let rows = GRIDW, cols = GRIDH, size = PIXELSIZE;
	if (size < 4) {
		size = 4;
		rows = canvas.width / size;
		cols = canvas.height / size;
	}
    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < cols; y++) {
            g.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
        }
    }
    gridLayer = off;
    gridCacheKey = `${canvas.width}x${canvas.height}:${GRIDW}x${GRIDH}:${PIXELSIZE}`;
}	

function ensureGridLayer() {
    const key = `${canvas.width}x${canvas.height}:${GRIDW}x${GRIDH}:${PIXELSIZE}`;
    if (!gridLayer || gridCacheKey !== key) buildGridLayer();
}

function invalidateGridLayer() {
    gridLayer = null;
    gridCacheKey = "";
}