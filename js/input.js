class InputManager {
  constructor() {
    this.keys = {};
    this.x = 0;
    this.y = 0;
    this.lastKey = null;
    this.shift = false;
    this.selBox = null;
  }

  update() {
    if (inPrompt || LD.active) return;
    this.shift = this.keys["shift"];
    let keyX = (this.keys["a"] ? -1 : 0) + (this.keys["d"] ? 1 : 0);
    let keyY = (this.keys["w"] ? -1 : 0) + (this.keys["s"] ? 1 : 0);
    this.x = keyX;
    this.y = keyY;
    setTimeout(() => {
      this.x = this.y = 0;
    }, 200);
    if (ticks % 3 !== 0) return;
    let arrowX = (this.lastKey == "arrowleft" ? -1 : 0) + (this.lastKey == "arrowright" ? 1 : 0);
    let arrowY = (this.lastKey == "arrowup" ? -1 : 0) + (this.lastKey == "arrowdown" ? 1 : 0);
    if ((PLAYER && !arrowX && !arrowY) || (!arrowX && !arrowY && !keyX && !keyY)) return;
    navigateUi(arrowX || (PLAYER ? 0 : keyX), arrowY || (PLAYER ? 0 : keyY));
    au.playSound(au.clock, 0.1);
    this.lastKey = null;
  }
}

class Mouse {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.wx = 0;
    this.wy = 0;
    this.sx = 0;
    this.sy = 0;
    this.dx = 0;
    this.dy = 0;
    this.gx = 0;
    this.gy = 0;
    this.wgx = 0;
    this.wgy = 0;
    this.clicked = false;
    this.pressed = false;
    this.cell = null;
    this.clickedOnPlayer = false;
    this.clickColor = getRandomColor();
  }

  setPos(x, y) {
    this.x = x;
    this.y = y;
    this.sx = sx(this.x);
    this.sy = sy(this.y);
    this.wx = wx(this.x);
    this.wy = wy(this.y);
    let gx = Math.floor(x / PIXELSIZE);
    let gy = Math.floor(y / PIXELSIZE);
    this.gx = clamp(gx, 0, GW - 1);
    this.gy = clamp(gy, 0, GH - 1);
    this.wgx = clamp(Math.floor(this.wx / PIXELSIZE), 0, GW - 1);
    this.wgy = clamp(Math.floor(this.wy / PIXELSIZE), 0, GH - 1);
  }

  mousemove(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    this.dx = dx;
    this.dy = dy;
    this.setPos(x, y);
  }

  mousedown(x, y) {
    if (PLAYER && isMobile && !this.clickedOnPlayer) {
      let rad = BRUSHSIZE;
      for (const c of PLAYER.cells) {
        if (Math.abs(c.x - Math.floor(x / PIXELSIZE)) < rad && Math.abs(c.y - Math.floor(y / PIXELSIZE)) < rad) {
          this.clickedOnPlayer = true;
          break;
        }
      }
    }
    this.clicked = true;
    this.pressed = true;
    this.clickColor = getRandomColor();
    this.dx = x - this.x;
    this.dy = y - this.y;
    this.setPos(x, y);
  }

  mouseup(e) {
    this.clickedOnPlayer = false;
    this.pressed = false;
    if (SELENT) SELENT = null;
  }

  reset() {
    this.dx = this.dy = 0;
  }
}

window.addEventListener("mousedown", (e) => {
  if (LD.active && LD.container.style.display == "none") {
    LD.closeMenu();
  }
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  RADMENU_POS = [e.clientX, e.clientY];
});

canvas.addEventListener("mouseenter", () => {
  document.body.style.cursor = "none";
});
canvas.addEventListener("mouseleave", () => {
  document.body.style.cursor = "default";
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) return;
  MOUSE.mousedown(e.clientX, e.clientY);
  userInput();
  if (BRUSHACTION === "GRAB") selectRadius("GRAB");
  if (BRUSHACTION === "CONTROL") selectRadius("CONTROL");
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 2) return;
  MOUSE.mouseup();
  if (BRUSHACTION === "GRAB") {
    resetSelectedType("GRAB");
    selCells = [];
  }
  if (BRUSHACTION == "PICK" && MOUSE.cell) setNewType(cellKeys.indexOf(MOUSE.cell.type));
  userInput();
});

window.addEventListener("mousemove", (e) => {
  MOUSE.mousemove(e.clientX, e.clientY);
});

window.addEventListener("keydown", (e) => {
  if (inPrompt) return;
  userInput();
  const k = e.key.toLowerCase();
  if (e.code === "Tab") e.preventDefault();
  else if (e.code === "Escape") {
    if (LD.active) LD.closeMenu();
  } else if (k === "t") {
    ISGAME = !ISGAME;
    updateUi();
  } else if (k === "k") switchUiDisplay();
  else if (k === "alt") SEL_LINE_START = [MOUSE.x, MOUSE.y];
  else if (k === "control") DEBUG = !DEBUG;
  else if (k === "m") au.active = !au.active;
  else if (k === "h") PLAYER.death();
  else if ((k === "z" || k === "meta") && !INPUT.selBox) {
    INPUT.selBox = [MOUSE.gx, MOUSE.gy];
  }
  INPUT.lastKey = k;
  INPUT.keys[INPUT.lastKey] = true;
});

window.addEventListener("keyup", (e) => {
  if (inPrompt) return;
  const k = e.key.toLowerCase();
  if ((k === "z" || k === "meta") && INPUT.selBox) {
    const gx0 = Math.min(INPUT.selBox[0], MOUSE.gx);
    const gy0 = Math.min(INPUT.selBox[1], MOUSE.gy);
    const gw = Math.abs(INPUT.selBox[0] - MOUSE.gx) + 1;
    const gh = Math.abs(INPUT.selBox[1] - MOUSE.gy) + 1;
    const cx = (gx0 + gw / 2) * PIXELSIZE;
    const cy = (gy0 + gh / 2) * PIXELSIZE;
    const rx = Math.floor(gw / 2);
    const ry = Math.floor(gh / 2);
    launchCells(cellKeys[TYPEINDEX], cx, cy, rx, ry, false);
    INPUT.selBox = null;
  }
  if (k === "alt" && SEL_LINE_START) {
    const x0 = SEL_LINE_START[0];
    const y0 = SEL_LINE_START[1];
    const x1 = MOUSE.x;
    const y1 = MOUSE.y;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    const stepSize = PIXELSIZE;
    const steps = Math.floor(len / stepSize);
    let curX = x0;
    let curY = y0;
    const isV = Math.abs(dx) < Math.abs(dy);
    for (let s = 0; s <= steps; s++) {
      curX = x0 + dirX * s * stepSize;
      curY = y0 + dirY * s * stepSize;
      launchCells(cellKeys[TYPEINDEX], curX, curY);
    }
    SEL_LINE_START = null;
  }
  INPUT.keys[k] = false;
  if (isWheeling && e.key === "Shift") isWheeling = false;
});

window.addEventListener("resize", () => {
  CANVW = window.innerWidth;
  CANVH = window.innerHeight - 180;
  canvas.width = CANVW;
  canvas.height = CANVH;
  GW = Math.floor(CANVW / PIXELSIZE);
  GH = Math.floor(CANVH / PIXELSIZE);
  for (let i = 0; i < grid1.length; i++) if (grid1[i]) grid1[i].toRemove();
  grid1 = new Array(GW * GH);
  buildGridLayer();
});

let wheelAcc = 0;
let isWheeling = false;
const WHEEL_SPEED = 5;
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const modeScale = e.deltaMode === 1 ? 100 : e.deltaMode === 2 ? window.innerHeight : 1;
  wheelAcc += e.deltaY / (modeScale * WHEEL_SPEED);
  let steps = 0;
  while (Math.abs(wheelAcc) >= 1) {
    steps += Math.sign(wheelAcc);
    wheelAcc -= Math.sign(wheelAcc);
  }
  if (!steps) return;
  if (!INPUT.keys["shift"]) BRUSHSIZE = clamp(BRUSHSIZE - steps, 1, MAXBRUSHSIZE);
  else {
    setNewPixelSize(clamp(PIXELSIZE + steps, 2, 19));
    setMousePos(e.clientX, e.clientY);
    SHOWBRUSH = true;
    isWheeling = true;
  }
});

function simulateMouseEvent(touchEvent, mouseEventType) {
  const touch = touchEvent.changedTouches[0];
  const simulatedEvent = new MouseEvent(mouseEventType, {
    bubbles: true,
    cancelable: true,
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
    button: 0,
  });
  touch.target.dispatchEvent(simulatedEvent);
}

function simulateWheelEvent(target, deltaY) {
  const wheelEvent = new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    deltaY: deltaY, // Positive for scroll down, negative for scroll up
    deltaMode: 0, // Pixel-based scrolling
  });
  target.dispatchEvent(wheelEvent);
}

let lastY = null;
let isTwoFingerTouch = false;
let lastTouchTime = 0;
let isDoubleTouch = false;
document.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    const now = Date.now();
    if (e.touches.length === 1 && !isTwoFingerTouch) {
      if (now - lastTouchTime < 300) {
        isDoubleTouch = true;
        delCellsAtPos();
      }
      lastTouchTime = now;
      simulateMouseEvent(e, "mousedown");
    } else if (e.touches.length === 2) {
      isTwoFingerTouch = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastY = (touch1.clientY + touch2.clientY) / 2;
    }
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && !isTwoFingerTouch) {
      simulateMouseEvent(e, "mousemove");
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentY = (touch1.clientY + touch2.clientY) / 2;
      if (lastY !== null) {
        const deltaY = (currentY - lastY) * 2;
        // simulateWheelEvent(e.target, deltaY);
      }
      lastY = currentY;
    }
  },
  { passive: false }
);

document.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      if (!isTwoFingerTouch) simulateMouseEvent(e, "mouseup");
      isDoubleTouch = false;
      isTwoFingerTouch = false;
      lastY = null;
    } else if (e.touches.length === 1) {
      isTwoFingerTouch = false;
      switchBrushAction("CUT");
      lastY = null;
    }
  },
  { passive: false }
);

let inputTimeout = null;
let hasInput = false;
function userInput() {
  if (inputTimeout) {
    clearTimeout(inputTimeout);
  }
  inputTimeout = setTimeout(() => {
    inputTimeout = null;
    hasInput = false;
  }, 100);
  hasInput = true;
}
