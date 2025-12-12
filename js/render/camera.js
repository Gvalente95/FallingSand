class Camera {
  constructor() {
    this.scroll = [0, 0];
    let limit = [canvas.width * 2, canvas.height * 2];
    this.minX = -limit[0];
    this.maxX = limit[0];
    this.minY = -limit[1];
    this.maxY = limit[1];
  }

  center(pos, speed = 1) {
    const targetX = pos[0] - canvas.width / 2;
    const targetY = pos[1] - canvas.height / 2;
    const currentX = this.scroll[0];
    const currentY = this.scroll[1];
    this.scroll[0] = clamp(currentX + (targetX - currentX) * speed, this.minX, this.maxX);
    this.scroll[1] = clamp(currentY + (targetY - currentY) * speed, this.minY, this.maxY);
  }

  clearPosition() {
    this.scroll = [0, 0];
  }

  move(dx, dy) {
    this.scroll[0] = clamp(this.scroll[0] - dx, this.minX, this.maxX);
    this.scroll[1] = clamp(this.scroll[1] - dy, this.minY, this.maxY);
  }
}

function toScrn(pos) {
  let scrolledPos = [sx(pos[0]), sy(pos[1])];
  return scrolledPos;
}

function toWorld(pos) {
  let scrolledPos = [wx(pos[0]), wy(pos[1])];
  return scrolledPos;
}

function sx(x) {
  return x - CAM.scroll[0];
}
function sy(y) {
  return y - CAM.scroll[1];
}

function wx(x) {
  return x + CAM.scroll[0];
}
function wy(y) {
  return y + CAM.scroll[1];
}
