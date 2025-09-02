function buildGridLayer() {
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const g = off.getContext("2d");
    g.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let x = 0; x < GRIDW; x++) {
        for (let y = 0; y < GRIDH; y++) {
            g.fillRect(x * PIXELSIZE + 1, y * PIXELSIZE + 1, PIXELSIZE - 2, PIXELSIZE - 2);
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