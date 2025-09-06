p.updateCloud = function(){
	this.velX += this.xDir * .1;
	let newX = this.x + this.velX;
	let newY = this.y;
	let px = getPxlAtPos(newX, newY, this);
	if (px && px.type != this.type) { this.swap(px); return; }
	if (isOutOfBorder(newX, newY)) { this.toRemove(); return; }
	this.updatePosition(newX, newY, this);
}

p.updatePLANT = function(curX, curY){
	if (this.parent || (time % (this.growSpeed)) != 0) return;
	let inWater = false;
	const px = getPxlAtPos(curX, curY, this);
	if (px) {
		if (px.type == 'WATER' || px.type == 'PLANT') { inWater = true; px.toRemove();}
		else return (this.setColor());
	}
	if (dice(30)) this.dirAng += f_range(-0.2, 0.2);
	const t = now * this.oscSpeed + this.oscPhase;
	const ang = this.dirAng + this.oscAmp * Math.sin(t);
	const speed = inWater ? .2 : 1;
	this.velX = Math.cos(ang) * speed;
	this.velY = Math.sin(ang) * speed;
	const ox = this.x, oy = this.y;
	this.updatePosition(curX, curY);
	const clone = new Particle(ox, oy, this.type);
	clone.parent = this;
	if (dice(10))this.dirAng += f_range(-0.3, 0.3);
	if (this.timeAlive < 2000) {
		let rpx = getPxlsInRect(this.x, this.y, 3, 3, this.type);
		let isStuck = (rpx.length > 4);
		if (isStuck) {return (this.setColor());}
		else if (this.color != "rgba(133, 190, 154, 1)") {
			this.setColor("rgba(133, 190, 154, 1)");
			if (this.timeAlive > 6000) this.toRemove();
		}
	}
}

p.updateFrost = function(curX, curY){
	if (this.timeAlive < 200 * this.fseed)
		this.setColor(addColor(this.properties.color, 'rgba(92, 145, 198, 1)', this.timeAlive / 200 * this.fseed));
	this.applyFrost('FROST', 1000);
	// this.updatePosition(curX, curY);
}

p.updateAnt = function (curX, curY) {
  if (this.burning) return;

  if (!this.hasTouchedSurface) {
    this.hasTouchedSurface = (this.y >= GRIDH - 1) || (getPxlAtPos(this.x, this.y + 1, this) && getPxlAtPos(this.x, this.y + 1, this).hasTouchedSurface);
    if (!this.hasTouchedSurface) { this.updatePosition(curX, curY); return; }
    this.xDir = (dice(2)?1:-1); this.yDir = 0;
    this.antTrace = [];
    this.antBackCD = 0;
  }

  const empty = (x,y)=> x>=0 && x<GRIDW && y>=0 && y<GRIDH && !getPxlAtPos(x,y,this);
  const solid = (x,y)=> x>=0 && x<GRIDW && y>=0 && y<GRIDH && !!getPxlAtPos(x,y,this);
  const leftOf = (dx,dy)=>[-dy,dx];
  const rightOf = (dx,dy)=>[dy,-dx];
  const seen = (x,y)=> this.antTrace && this.antTrace.some(t=> t[0]===x && t[1]===y);

  let dx = this.xDir|0, dy = this.yDir|0;
  if (!dx && !dy) { dx = 1; dy = 0; }

  const supportOK = (nx,ny,ndx,ndy)=>{
    const L = leftOf(ndx,ndy);
    const lx = nx + L[0], ly = ny + L[1];
    return solid(lx,ly) || nx===0 || nx===GRIDW-1 || ny===0 || ny===GRIDH-1;
  };
  const canDiagPass = (ndx,ndy)=>{
    if ((ndx&1) && (ndy&1)) return empty(this.x+ndx, this.y) || empty(this.x, this.y+ndy);
    return true;
  };

  const tryStep = (ndx,ndy)=>{
    const nx = this.x + ndx, ny = this.y + ndy;
    if (!empty(nx,ny)) return false;
    if (!canDiagPass(ndx,ndy)) return false;
    if (!supportOK(nx,ny,ndx,ndy)) return false;
    if (this.antBackCD > 0 && ndx === -dx && ndy === -dy) return false;
    this.xDir = ndx; this.yDir = ndy;
    this.updatePosition(nx,ny);
    if (!this.antTrace) this.antTrace = [];
    this.antTrace.push([nx,ny]);
    if (this.antTrace.length > 12) this.antTrace.shift();
    this.antBackCD = Math.max(0, this.antBackCD - 1);
    return true;
  };

  const L = leftOf(dx,dy), R = rightOf(dx,dy);
  const LD = [Math.max(-1,Math.min(1,dx+L[0])), Math.max(-1,Math.min(1,dy+L[1]))];
  const RD = [Math.max(-1,Math.min(1,dx+R[0])), Math.max(-1,Math.min(1,dy+R[1]))];

  let cand = [
    [L[0],L[1]],
    [dx,dy],
    [R[0],R[1]],
    LD, RD
  ];
  if (dy===0) cand.push([dx,-1],[dx,1]); else if (dx===0) cand.push([-1,dy],[1,dy]); else cand.push([dx,0],[0,dy]);

  const good = [];
  const ok = [];
  for (let i=0;i<cand.length;i++){
    const ndx=cand[i][0], ndy=cand[i][1];
    const nx=this.x+ndx, ny=this.y+ndy;
    if (!empty(nx,ny)) continue;
    if (!canDiagPass(ndx,ndy)) continue;
    if (!supportOK(nx,ny,ndx,ndy)) continue;
    if (this.antBackCD > 0 && ndx === -dx && ndy === -dy) continue;
    if (!seen(nx,ny)) good.push([ndx,ndy]); else ok.push([ndx,ndy]);
  }

  if (good.length && tryStep(good[0][0], good[0][1])) return;
  if (ok.length && tryStep(ok[0][0], ok[0][1])) return;

  this.antBackCD = 3;
  const back = [-dx,-dy];
  if (tryStep(back[0], back[1])) return;

  if (dice(150)) {
    const r = dice(2) ? [1,0] : [0,1];
    const s = dice(2)?1:-1;
    tryStep(r[0]*s, r[1]*s);
  }
};



p.updateType = function(){
	if (this.type === 'WOOD') return;
	if (this.type === 'CLOUD') return this.updateCloud();
	else if (this.type == 'STEAM' && this.y < 50 && dice(5))
		{ launchParticules('CLOUD', this.x * PIXELSIZE, this.y * PIXELSIZE, 10, true); this.toRemove(); }
	if (this.physT != 'STATIC' || this.type == 'PLANT') {
		this.ground = getPxlAtPos(this.x, this.y + (this.physT == 'GAS' ? -1 : 1), this);
		this.updateVelocity();
		if (this.velX || this.velY) this.updateMovement();
		if (this.physT == 'LIQUID') this.updateLiquid(this.newX, this.newY);
	}
	if (this.type == 'TORCH' && dice(10))
		new Particle(this.x, this.y - 1, 'FIRE');
	if (this.type == 'FROST') this.updateFrost(this.newX, this.newY);
	else if (this.type == 'ANT') this.updateAnt(this.newX, this.newY);
	else if (this.type == 'FIRE' || this.type === 'TORCH') this.FireEffect(this.newX, this.newY);
	else if (this.type == 'MAGMA') this.MagmaEffect(this.newX, this.newY);
	else if (this.type == 'LAVA') this.LavaEffect(this.newX, this.newY);
	else if (this.type == 'PLANT') this.updatePLANT(this.newX, this.newY);
	else if (this.physT != 'LIQUID') this.updatePosition(this.newX, this.newY);
}
