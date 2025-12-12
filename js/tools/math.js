function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
function r_range(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}
function dice(max) {
  if (max <= 0) return 1;
  return r_range(0, max) == 0;
}
function fdice(value) {
  return Math.random() * 100 < value;
}
function f_range(min, max) {
  return min + Math.random() * (max - min);
}
function rdir() {
  return dice(2) == 0 ? -1 : 1;
}
function getSin(t, freq, amp, phase) {
  return Math.sin(t * freq + phase) * amp;
}
const lerp = (a, b, t) => a + (b - a) * t;

function pointInRect(point, pos, size) {
  return point[0] >= pos[0] && point[0] <= pos[0] + size[0] && point[1] >= pos[1] && point[1] <= pos[1] + size[1];
}

function canvToWindow(canvX, canvY) {
  return [canvX * PIXELSIZE, canvY * PIXELSIZE];
}

function windowToCanv(x, y) {
  return [Math.round(x / PIXELSIZE), Math.round(y / PIXELSIZE)];
}

function toWorld(cPos) {
  return [cPos[0] * PIXELSIZE, cPos[1] * PIXELSIZE];
}


function toCanv(wPos) {
  return [wPos[0] / PIXELSIZE, wPos[1] / PIXELSIZE];
}
