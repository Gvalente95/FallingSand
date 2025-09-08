function clamp(value, min, max) { return (value < min ? min : value > max ? max : value); }
function r_range(min, max){return (min + Math.floor(Math.random() * (max - min)));}
function f_range(min, max){return (min + Math.random() * (max - min));}
function lerp(a, b, t) {return a + (b - a) * t;}
function dice(max) { if (max <= 0) return (1); return (r_range(0, max) == 0); }
function rdir() { return (dice(2) == 0 ? -1 : 1); }
function getSin(t, freq, amp, phase) {return (Math.sin(t * freq + phase) * amp);}
