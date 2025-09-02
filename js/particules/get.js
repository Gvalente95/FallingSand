function getPxlAtPos(x, y, self = null) {
    x = x | 0;
    y = y | 0;
    if (x < 0 || x >= GRIDW || y < 0 || y >= GRIDH) return null;
    const col = grid[x];
    const px = col[y];
	if (self && px === self) return null;
	if (px && !px.active) return null;
    return px ?? null;
}

function getPxlsInRadius(x = MOUSEX, y = MOUSEY, radius = BRUSHSIZE, type = null)
{
	let pxs = [];
	let radSquared = radius * radius;
	for (let posX = -radius; posX < radius; posX++)
		for (let posY = radius; posY < radSquared; posY++)
		{
			if (posX * posX + posY * posY > radSquared) continue;
			let px = getPxlAtPos(x + posX, y + posY);
			if (px && (!type || px.type == type)) pxs.push(px);
		}
	return (pxs);
}

function getPxlsInRect(x = MOUSEX, y = MOUSEY, width = 20 , height = 20, type = null)
{
	let pxs = [];
	for (let posX = 0; posX < width; posX++)
		for (let posY = 0; posY < height; posY++)
		{
			let px = getPxlAtPos(x + posX, y + posY);
			if (px && (!type || px.type == type)) pxs.push(px);
		}
	return (pxs);
}