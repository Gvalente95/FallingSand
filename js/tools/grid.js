function buildNeighbors4(W,H){
  N4 = new Int32Array(GSIZE*4);
  for (let y=0,i=0; y<H; y++){
    for (let x=0; x<W; x++,i++){
      N4[i*4+0] = y>0    ? i-W : -1;
      N4[i*4+1] = y<H-1  ? i+W : -1;
      N4[i*4+2] = x>0    ? i-1 : -1;
      N4[i*4+3] = x<W-1  ? i+1 : -1;
    }
  }
}
function initGrid() {
	GSIZE = GW * GH;
	grid1 = new Array(GSIZE);
	N4 = new Int32Array(GSIZE * 4);
	ROWOFF = new Int32Array(GH);
	for (let y = 0; y < GH; y++) ROWOFF[y] = y * GW;
	buildNeighbors4();
	buildGridLayer();
}
function getPxlsInRadius(x = MOUSE.x, y = MOUSE.y, radius = BRUSHSIZE, type = null)
{
	let pxs = [];
	let radSquared = radius * radius;
	for (let posX = -radius; posX < radius; posX++)
		for (let posY = radius; posY < radSquared; posY++)
		{
			if (posX * posX + posY * posY > radSquared) continue;
			let px = cellAtI(ROWOFF[y + posY] + x + posX);
			if (px && (!type || px.type === type)) pxs.push(px);
		}
	return (pxs);
}
function getPxlsInRect(x = MOUSE.x, y = MOUSE.y, width = 20 , height = 20, type = null)
{
	let pxs = [];
	for (let posX = 0; posX < width; posX++)
		for (let posY = 0; posY < height; posY++)
		{
			let px = cellAtI(ROWOFF[y + posY] + x + posX);
			if (px && (!type || px.type === type)) pxs.push(px);
		}
	return (pxs);
}
function cellAtI(i, self){
	if ((i >>> 0) >= grid1.length) return null;
	const p = grid1[i];
	return (p && p !== self && p.active) ? p : null;
}
function idx(x, y){ return ROWOFF[y] + x; }
function atI(i,self){ const p = grid1[i]; return (p && p!==self && p.active) ? p : null; }
function upI(i){ const j=N4[i*4+0]; return j>=0? j : -1; }
function dnI(i){ const j=N4[i*4+1]; return j>=0? j : -1; }
function lfI(i){ const j=N4[i*4+2]; return j>=0? j : -1; }
function rtI(i) { const j = N4[i * 4 + 3]; return j >= 0 ? j : -1; }
function isOutOfBorder(x, y) { return (x < 0 || x > GW - 1 || y < 0 || y > GH - 1) };
function atCorner(x, y) { return ((x == 0 && y == 0) || (x == 0 && y == GH - 1) || (x == GW - 1 && y == 0) || (x == GW - 1 && y == GH - 1)) };
function atBorder(x, y) { return (x == 0 || y == 0 || x == GW - 1 || y == GH - 1) };

function squareOutOfBorder(x, y, size) {
	return (x < 0 || y < 0 || x > GW - 1 - size || y > GH - 1 - size);
}
function rectOutOfBorder(x, y, w, h) {
	return (x < 0 || y < 0 || x > GW - 1 - w || y > GH - 1 - h);
}