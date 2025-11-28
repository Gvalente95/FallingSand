#!/usr/bin/env python3
import sys, os, re
from pathlib import Path
from PIL import Image

def parse_color(args):
    if len(args) >= 3 and all(re.fullmatch(r"-?\d+(\.\d+)?", a) for a in args[:3]):
        vals = [float(args[i]) for i in range(3)]
    else:
        s = " ".join(args)
        nums = re.findall(r"[-+]?\d*\.?\d+", s)
        if len(nums) < 3: raise SystemExit("Couleur invalide")
        vals = [float(nums[i]) for i in range(3)]
    if any(v<=1 for v in vals): vals = [max(0,min(1,v))*255 for v in vals]
    vals = [int(round(max(0,min(255,v)))) for v in vals]
    return tuple(vals[:3])

def process_image(p, rgb):
    try:
        with Image.open(p) as im:
            fmt = im.format
            if im.mode != "RGBA": im = im.convert("RGBA")
            px = im.load()
            w,h = im.size
            r,g,b = rgb
            for y in range(h):
                for x in range(w):
                    pr,pg,pb,pa = px[x,y]
                    if pa>0: px[x,y]=(r,g,b,pa)
            if fmt is None:
                ext = p.suffix.lower()
                if ext in [".jpg",".jpeg"]: fmt="JPEG"
                elif ext==".png": fmt="PNG"
                elif ext==".webp": fmt="WEBP"
                elif ext==".bmp": fmt="BMP"
                else: fmt="PNG"
            if fmt in ["JPEG","JPG"] and im.mode!="RGB": im=im.convert("RGB")
            im.save(p, format=fmt)
            return True
    except Exception:
        return False

def is_image(path):
    return path.suffix.lower() in {".png",".jpg",".jpeg",".webp",".bmp",".tif",".tiff",".gif"}

def main():
    if len(sys.argv)<3: raise SystemExit("Usage: recolor <dossier> <R G B|rgb(...)|(R,G,B[,A])>")
    root = Path(sys.argv[1])
    if not root.is_dir(): raise SystemExit("Dossier introuvable")
    rgb = parse_color(sys.argv[2:])
    ok=0; fail=0
    for p in root.rglob("*"):
        if p.is_file() and is_image(p):
            if process_image(p, rgb): ok+=1
            else: fail+=1
    print(f"OK:{ok} FAIL:{fail}")

if __name__ == "__main__":
    main()
