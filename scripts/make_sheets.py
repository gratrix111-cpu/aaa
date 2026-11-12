"""Contact sheets from a folder of rendered frames (element-<frame>.jpeg).
usage: python3 scripts/make_sheets.py <framesDir> <outPrefix> [cols=6] [rows=2] [tileW=300]"""
import os, re, sys
from PIL import Image, ImageDraw

src, prefix = sys.argv[1], sys.argv[2]
cols, rows, tw = (int(sys.argv[i]) if len(sys.argv) > i else d for i, d in ((3, 6), (4, 2), (5, 300)))
files = sorted((int(re.search(r"(\d+)", f).group(1)), f) for f in os.listdir(src) if f.lower().endswith((".jpeg", ".jpg", ".png")))
per = cols * rows
for s in range(0, len(files), per):
    batch = files[s:s + per]
    im0 = Image.open(os.path.join(src, batch[0][1]))
    th = round(tw * im0.height / im0.width)
    sheet = Image.new("RGB", (cols * tw, rows * th), "#202020")
    d = ImageDraw.Draw(sheet)
    for i, (n, f) in enumerate(batch):
        im = Image.open(os.path.join(src, f)).convert("RGB").resize((tw, th), Image.LANCZOS)
        x, y = (i % cols) * tw, (i // cols) * th
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 78, y + 16], fill="#000000")
        d.text((x + 3, y + 2), f"{n} {n / 30:.1f}s", fill="#ffff00")
    out = f"{prefix}{s // per:02d}.jpg"
    sheet.save(out, quality=88)
    print(out, len(batch))
