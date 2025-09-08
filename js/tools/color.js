function randomizeColor(color, range = 10) {
    const namedColors = {
        'yellow': '#FFFF00',
        'blue': '#0000FF',
        'brown': '#A52A2A',
    };
    if (color === 'rgba(0, 0, 0, 0)') return color;
    let r, g, b;
    const rgbaMatch = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)$/);
    if (rgbaMatch) {
        r = parseInt(rgbaMatch[1], 10);
        g = parseInt(rgbaMatch[2], 10);
        b = parseInt(rgbaMatch[3], 10);
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255)
            throw new Error('Invalid RGBA color values. RGB must be between 0 and 255.');
    } else {
        let hexColor = color;
        if (namedColors[color.toLowerCase()])
            hexColor = namedColors[color.toLowerCase()];
        else if (!color.startsWith('#'))
            throw new Error('Unsupported color format. Use hex (#RRGGBB), rgba(R, G, B, A), or supported named colors (yellow, blue, brown).');
        hexColor = hexColor.replace('#', '');
        if (hexColor.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hexColor))
            throw new Error('Invalid hex color format. Use #RRGGBB or supported named color.');
        r = parseInt(hexColor.substr(0, 2), 16);
        g = parseInt(hexColor.substr(2, 2), 16);
        b = parseInt(hexColor.substr(4, 2), 16);
    }
    r = Math.max(0, Math.min(255, r + Math.floor(Math.random() * (2 * range + 1)) - range));
    g = Math.max(0, Math.min(255, g + Math.floor(Math.random() * (2 * range + 1)) - range));
    b = Math.max(0, Math.min(255, b + Math.floor(Math.random() * (2 * range + 1)) - range));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}
function getR(hex) { return (parseInt(hex.substring(0, 2), 16));}
function getG(hex) { return (parseInt(hex.substring(2, 4), 16)); }
function getB(hex) { return (parseInt(hex.substring(4, 6), 16)); }
function getRGB(color) {
    color = color.trim();
    if (color.startsWith("#")) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return [r, g, b];
        }
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return [r, g, b];
        }

        throw new Error(`Invalid HEX color format: ${color}`);
    }
    const match = color.match(/^\s*rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*[\d.]+)?\)\s*$/i);
    if (match) {
        const rgb = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        if (rgb.some(v => v < 0 || v > 255)) {
            throw new Error(`RGB components must be between 0 and 255: ${color}`);
        }
        return rgb;
    }
    throw new Error(`Invalid color format: ${color}`);
}

function setAlpha(color, alpha) {
	let rgb = getRGB(color);
	return (`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha}`);
}


function addColor(originalColor, newColor, amount = 1) {
    const rgb0 = getRGB(originalColor);
    const rgb1 = getRGB(newColor);
    const newr = clamp(rgb0[0] * (1 - amount) + rgb1[0] * amount, 0, 255);
    const newg = clamp(rgb0[1] * (1 - amount) + rgb1[1] * amount, 0, 255);
    const newb = clamp(rgb0[2] * (1 - amount) + rgb1[2] * amount, 0, 255);
    return `rgba(${newr}, ${newg}, ${newb})`;
}

function randomizeColorAmount(color, randomAmount = 16) {
  let r = getR(color) | 0, g = getG(color) | 0, b = getB(color) | 0;
  const j = () => r_range(-randomAmount, randomAmount);
  r = clamp(r + j(), 0, 255) | 0;
  g = clamp(g + j(), 0, 255) | 0;
  b = clamp(b + j(), 0, 255) | 0;

  if (typeof getA === 'function') {
    const a = getA(color);
    if (a != null) return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  if (typeof color === 'string' && color[0] === '#') {
    const h = (n) => n.toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}


function getRainbowColor(time, speed = 0.002) {
    const r = Math.floor(127 * Math.sin(speed * time + 0) + 128);
    const g = Math.floor(127 * Math.sin(speed * time + 2) + 128);
    const b = Math.floor(127 * Math.sin(speed * time + 4) + 128);
    return `rgb(${r}, ${g}, ${b})`;
}

function getTimeColor() {
	let phase = 50;
	let t = time;
	let tr = t % 255;
	let tg = (t + phase) % 255;
	let tb = (t + phase * 2) % 255;
  	return `rgb(${tr}, ${tg}, ${tb})`;
}

function getMountainColor() {
	let phase = 50;
	let t = time;
	let tr = t % 255;
	let tg = (t + phase) % 255;
	let tb = (t + phase * 2) % 255;
  	return `rgb(${tr}, ${tg}, ${tb})`;
}


function getRandomColor() {
  	return `rgb(${r_range(0, 255)}, ${r_range(0, 255)}, ${r_range(0, 255)})`;
}



function recolorImage(imgPath, tintColor, callback) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgPath;
    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const rgb = tintColor.match(/\d+/g).map(Number);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // skip fully transparent pixels
                data[i] = rgb[0];
                data[i + 1] = rgb[1];
                data[i + 2] = rgb[2];
            }
        }
        ctx.putImageData(imageData, 0, 0);
        callback(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
        console.error("Failed to load image:", imgPath);
        callback(null);
    };
}