import json, sys
w = json.load(open(sys.argv[1], encoding="utf-8"))
line, out = -1, []
for x in w:
    if x["line"] != line:
        line = x["line"]; out.append(f"\nL{line}:")
    out.append(f'{x["w"]}@{x["t0"]:.2f}')
print(" ".join(out))
