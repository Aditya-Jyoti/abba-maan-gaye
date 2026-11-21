"""Builds src/data/districts.json: the borders between districts, per state, in map canvas coordinates.

Usage:
    curl -L -o india.geojson https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson
    python3 scripts/build-districts.py india.geojson

Only borders shared by two districts are kept, so a state's outline isn't drawn twice.
The projection is the Mercator fit of the design's map (src/data/india-map.json): fitting
every state's bounding box gives these constants with under half a pixel of error.
"""

import collections
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AX, BX = 22.29507262, -1495.12411251
AY, BY = -1277.50189118, 921.21400235
# Canvas px. The state view zooms up to about 3x, so this stays below a pixel on screen.
TOLERANCE = 0.06
# States whose data has no real internal borders (duplicate or single features).
SKIP = {"chandigarh", "lakshadweep"}


def project(lon, lat):
    return AX * lon + BX, AY * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) + BY


def rings(geom):
    if geom["type"] == "Polygon":
        return geom["coordinates"]
    return [ring for poly in geom["coordinates"] for ring in poly]


def simplify(pts, tol):
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    length = math.hypot(dx, dy)
    best, index = -1.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * (px - ax) - dx * (py - ay)) / length if length > 1e-9 else math.hypot(px - ax, py - ay)
        if d > best:
            best, index = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[: index + 1], tol)[:-1] + simplify(pts[index:], tol)


def shared_lines(features):
    """Chains the segments that belong to two or more districts into polylines."""
    owners = collections.defaultdict(set)
    for i, f in features:
        for ring in rings(f["geometry"]):
            q = [(round(x, 5), round(y, 5)) for x, y in ring]
            for a, b in zip(q, q[1:]):
                if a != b:
                    owners[(min(a, b), max(a, b))].add(i)
    shared = [seg for seg, o in owners.items() if len(o) >= 2]
    adj = collections.defaultdict(list)
    for a, b in shared:
        adj[a].append(b)
        adj[b].append(a)
    used = set()

    def walk(start, nxt):
        line = [start, nxt]
        used.add((min(start, nxt), max(start, nxt)))
        prev, cur = start, nxt
        while len(adj[cur]) == 2:
            n = adj[cur][0] if adj[cur][0] != prev else adj[cur][1]
            key = (min(cur, n), max(cur, n))
            if key in used:
                break
            used.add(key)
            line.append(n)
            prev, cur = cur, n
        return line

    lines = []
    for node in list(adj):
        if len(adj[node]) != 2:
            for n in adj[node]:
                if (min(node, n), max(node, n)) not in used:
                    lines.append(walk(node, n))
    for a, b in shared:  # closed loops
        if (min(a, b), max(a, b)) not in used:
            lines.append(walk(a, b))
    return lines


def fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s == "-0" else s


def main(src):
    geo = json.loads(Path(src).read_text())
    states = json.loads((ROOT / "src/data/india-map.json").read_text())["states"]
    id_of = {s["name"]: s["id"] for s in states}
    by_state = collections.defaultdict(list)
    for i, f in enumerate(geo["features"]):
        if "district" in f["properties"]:  # skip whole-state outlines
            by_state[id_of[f["properties"]["st_nm"]]].append((i, f))

    out = {}
    for state_id in sorted(by_state):
        if state_id in SKIP:
            continue
        paths = []
        for line in shared_lines(by_state[state_id]):
            pts = simplify([project(*p) for p in line], TOLERANCE)
            paths.append("M" + "L".join(f"{fmt(x)},{fmt(y)}" for x, y in pts))
        if paths:
            out[state_id] = "".join(paths)

    dest = ROOT / "src/data/districts.json"
    dest.write_text(json.dumps(out, separators=(",", ":")))
    print(f"Wrote {len(out)} states to {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
