p.updateCloud = function(){
	this.velX += this.xDir * .1;
	let newX = this.x + this.velX;
	let newY = this.y;
	let px = pxAtP(newX, newY, this);
	if (px && px.type != this.type) { this.swap(px); return; }
	if (isOutOfBorder(newX, newY)) { this.toRemove(); return; }
	this.updatePosition(newX, newY, this);
}

p.updatePLANT = function(curX, curY){
	if (this.parent || (time % (this.growSpeed)) != 0) return;
	let inWater = false;
	const px = pxAtP(curX, curY, this);
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
  if (this.wet || this.physT == 'LIQUID'){
    return (this.updatePosition(curX, curY));
  }
  if (!this.hasTouchedSurface) {
    this.hasTouchedSurface = (this.y >= GRIDH - 1) || (this.ground && this.ground.type != this.type);
    if (!this.hasTouchedSurface) { this.updatePosition(curX, curY); return; }
    this.xDir = dice(2) == 0 ? -1 : 1;
    this.yDir = 0;
  }
if (dice(10)) return;

  curX = this.x;
  curY = this.y;

  if (dice(300)){
      if (dice(5)) new Particle(curX - this.xDir, curY - this.yDir, 'ANTEGG');
    this.xDir = this.yDir = 0;
  }
  if (!this.xDir && !this.yDir){
    if (curY == 0 || curX == GRIDH - 1){
          if (isValid(curX + 1, curY, 0, 0)) curX++;
      else if (isValid(curX - 1, curY, 0, 0)) curX--;
    }
  if (dice(20)) {
    this.xDir = dice(2) ? -1 : 1;
    }
  }

  function isAtCorner(x, y) {return((x == 0 && y == 0) || (x == GRIDW - 1 && y == 0) || (x == 0 && y == GRIDH - 1) || (x == GRIDW - 1 && y == GRIDH - 1))}
  function isValid(x, y, xd, yd) {return (!pxAtP(x + xd, y + yd, this) && !isOutOfBorder(x + xd, y + yd));}
  function isAtBorder(x, y) {return (x == 0 || x == GRIDW - 1 || y == 0 || y == GRIDH - 1);}

  if (curX <= 0 || curX >= GRIDW - 1){
    if (dice(4) && isAtCorner(curX, curY)) this.xDir *= -1;
    else{
          this.xDir = 0;
        if (curY == GRIDH - 1) this.yDir = -1;
        if (curY <= 0) {this.yDir = 0; this.xDir = curX <= 0 ? 1 : -1;}
    }
  }
  else if (curY <= 0 || curY >= GRIDH - 1){
    if (dice(4) && isAtCorner(curX, curY)) this.yDir *= -1;
    else{
          this.yDir = 0;
      if (curX == 0) this.xDir = -1;
      if (curX <= 0) this.xDir = 0;
    }
  }
  if ((!isAtBorder(curX, curY)) && !pxAtP(curX + this.xDir, curY + 1, this) && (!pxAtP(curX - 1, curY, this) && !pxAtP(curX + 1, curY, this))){
    curY++;
    if (this.yDir == -1) this.yDir = 0;
    this.xDir = 0;
  }
  let px = pxAtP(curX + this.xDir,  curY + this.yDir);
  if (!px && dice(10)){
    px = pxAtP(curX + this.xDir,  curY  - 1);
    if (px) this.yDir = -1;
  }
  if (px){
    if (px.physT == 'LIQUID' || px.wet) {this.physT = 'LIQUID'; return;}
    if (px.type == 'ANT' || px.type == 'ANTEGG'){
      this.swap(px);
      return;
    }
    if ((px.physT == 'SOLID' || px.physT == 'STATIC') && dice(px.dns)){
         for (let x = -2; x < 2; x++){
        for (let y = -2; y < 2; y++){
          let npx = pxAtP(px.x + x, px.y + y, this);
          if (npx) npx.physT = 'STATIC';
        }
      }
     
        px.toRemove();
        if (dice(2)) this.yDir = (dice(2) == 0 ? -1 : 1);
    }
  }
  if (isValid(curX, curY, this.xDir, this.yDir))
    this.updatePosition(curX + this.xDir, curY + this.yDir);
  else{
    let tr = 1;
    while (!isValid(curX, --curY, this.xDir, this.yDir) && curY > 0 && tr--){
      continue;
    }
    if (isValid(curX, curY, this.xDir, this.yDir))
        this.updatePosition(curX + this.xDir, curY + this.yDir);
      else{
        if (dice(10)) this.xDir *= -1;
        else if (dice(10)) this.yDir *= -1;
      }
  }
};

p.updateFish = function(curX, curY) {
    if (this.inWater) {
      this.velX = this.velY = 0;
        if (!this.xDir && dice(10)) this.xDir = 1;
        if (dice(50) || curX + this.xDir == 10 || curY + this.yDir == GRIDW - 10) this.xDir *= -1;
        curX = this.x + this.xDir;

        if (dice(10)) this.yDir = 0;
        else if (dice(20)) this.yDir = r_range(-1, 2);
        curY = this.y + this.yDir;
  
        let px = pxAtP(curX, curY, this);
        if (px && (px.physT == 'LIQUID' || px.type == this.type)) {
            this.swap(px);
        } else {
            this.inWater = false;
            this.updatePosition(this.x, this.y);
        }
    } else {
        let liquidPx = null;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                let px = pxAtP(curX + x, curY + y, this);
                if (px && px.physT == 'LIQUID') {
                    liquidPx = px;
                    this.xDir = x !== 0 ? x / Math.abs(x) : this.xDir;
                    break;
                }
            }
            if (liquidPx) break;
        }
        if (liquidPx) {
            this.inWater = true;
            this.swap(liquidPx);
        } else {
            if (curY < GRIDH - 1 && !pxAtP(curX, curY + 1, this))
                curY += SIMSPEED * dt;
            this.updatePosition(curX, curY);
        }
    }
};


p.updateType = function(){
	if (this.type === 'WOOD') return;
	if (this.type === 'CLOUD') return this.updateCloud();
	else if (this.type == 'STEAM' && this.y < 50 && dice(5))
		{ launchParticules('CLOUD', this.x * PIXELSIZE, this.y * PIXELSIZE, 10, true); this.toRemove(); }
	if (this.physT != 'STATIC' || this.type == 'PLANT') {
		this.ground = pxAtP(this.x, this.y + (this.physT == 'GAS' ? -1 : 1), this);
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
	else if (this.type == 'FISH') this.updateFish(this.newX, this.newY);
	else if (this.type == 'PLANT') this.updatePLANT(this.newX, this.newY);
	else if (this.physT != 'LIQUID') this.updatePosition(this.newX, this.newY);
}
