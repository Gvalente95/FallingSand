import sys
import os
from PIL import Image

if len(sys.argv) < 2:
    print("usage: <file.png> [res width] [res height]")
    sys.exit(1)

file = sys.argv[1]
name, ext = os.path.splitext(file)
if ext != ".png":
    print("Wrong file format provided: " + ext)
    sys.exit(1)

img = Image.open(file).convert("RGBA")
w, h = img.size

resW = int(sys.argv[2]) if len(sys.argv) > 2 else w
resH = int(sys.argv[3]) if len(sys.argv) > 3 else h

pixels = img.load()

colors = {}
color_keys = {}
charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
charIndex = 0
MAX_DIST2 = 20 * 20

def color_dist2(c1, c2):
    dr = c1[0] - c2[0]
    dg = c1[1] - c2[1]
    db = c1[2] - c2[2]
    return dr * dr + dg * dg + db * db

def find_closest_char(color, colors_dict, max_d2):
    best_ch = None
    best_d2 = max_d2 + 1
    for ch, rgb in colors_dict.items():
        d2 = color_dist2(color, rgb)
        if d2 < best_d2:
            best_d2 = d2
            best_ch = ch
    return best_ch

filename = "pngToAscii_" + name + ".txt"
with open(filename, "w", encoding="utf-8") as f:
    f.write(name + ": {\n\tlabel: \"" + name + "\",\n\tctor: Mob,\n\timage: [\n")
    for y in range(resH):
        sy = int(y * h / resH)
        if sy >= h:
            sy = h - 1
        f.write("\t\t\"")
        for x in range(resW):
            sx = int(x * w / resW)
            if sx >= w:
                sx = w - 1

            r, g, b, a = pixels[sx, sy]
            if a <= 0:
                f.write(".")
                continue

            color = (r, g, b)

            if color in color_keys:
                ch = color_keys[color]
            else:
                ch = find_closest_char(color, colors, MAX_DIST2)
                if ch is None:
                    if charIndex < len(charSet):
                        ch = charSet[charIndex]
                        charIndex += 1
                        colors[ch] = [r, g, b]
                    else:
                        ch = find_closest_char(color, colors, float("inf"))
                color_keys[color] = ch

            f.write(ch)
        f.write("\",\n")
    f.write("\t],\n\tcolors: {\n")
    for ch, rgb in colors.items():
        f.write(f"\t\t{ch}: \"rgba({rgb[0]}, {rgb[1]}, {rgb[2]}, 1)\",\n")
    f.write("\t},\n\tstats: {\n\n\t},\n},")
