function buildGridLayer() {
	buildWaterShades();
	const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const g = off.getContext("2d");
	g.fillStyle = "rgba(75, 75, 75, 0.53)";
	let rows = GW, cols = GH, size = PIXELSIZE;
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
    gridCacheKey = `${canvas.width}x${canvas.height}:${GW}x${GH}:${PIXELSIZE}`;
}	

function ensureGridLayer() {
    const key = `${canvas.width}x${canvas.height}:${GW}x${GH}:${PIXELSIZE}`;
    if (!gridLayer || gridCacheKey !== key) buildGridLayer();
}

function invalidateGridLayer() {
    gridLayer = null;
    gridCacheKey = "";
}