"""Export existing portfolio map art/rosters and navigation for the live playground.

Run from any directory: python portfolio/scripts/export_worlds.py [--items]
Requires Pillow for lossless sprite/palette decoding and static preview composition.
Never runs the legacy generator main() or requires its sibling sprite checkout.
"""
from pathlib import Path
import ast
import base64
import hashlib
import importlib.util
import io
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "portfolio/public"
OUT = PUBLIC / "worlds"
REV = "5eff78649e7170a877b961ef0b3da13b81a16038"
NS = {"s": "http://www.w3.org/2000/svg"}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")


def terrain(module, scene):
    d = module.DATA_DIR
    pri = module.load_metatiles(d / "primary/general/metatiles.bin")
    sec = module.load_metatiles(d / "secondary/mauville/metatiles.bin")
    pa = module.load_attributes(d / "primary/general/metatile_attributes.bin")
    sa = module.load_attributes(d / "secondary/mauville/metatile_attributes.bin")
    w, h = module.MAP_W, module.MAP_H
    if scene == "rt111":
        entries = module.load_map_data(d / "map/Route111/map.bin", w, h)
    else:
        left = module.load_map_data(d / "map/Route117/map.bin", 60, 20)
        mid = module.load_map_data(d / "map/MauvilleCity/map.bin", 40, 20)
        right = module.load_map_data(d / "map/Route118/map.bin", 80, 20)
        entries = [left[y * 60 + 40 + x] if x < 20 else mid[y * 40 + x - 20]
                   if x < 60 else right[y * 80 + x - 60] for y in range(h) for x in range(w)]
    entries = list(entries)
    for i, entry in enumerate(entries):
        refs, _ = module.lookup_metatile(entry & 0x3FF, pri, sec, pa, sa)
        if ((entry >> 10) & 3) and refs and any(module.tile_is_water(r & 0x3FF) for r in refs):
            entries[i] = 0x1170
    blocked = module.build_collision_grid(entries, w, h)
    water, covered = module.build_terrain_masks(entries, w, h, pri, sec, pa, sa)
    # Route 111's pond uses static tile art outside the legacy animated-water ranges.
    # Include puddles/shallow water too: keep land residents on visibly dry terrain.
    for y in range(h):
        for x in range(w):
            _, attr = module.lookup_metatile(entries[y*w+x] & 0x3FF, pri, sec, pa, sa)
            water[y][x] = water[y][x] or (attr & 0xFF) in range(0x10, 0x18)
    rooftops = {304, 426, 427, 428, 256, 257, 258, 272, 273, 274} if scene == "mauville" else set()
    solid = [[bool((entries[y*w+x] >> 10) & 3) or (entries[y*w+x] & 0x3FF) in rooftops for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            blocked[y][x] = blocked[y][x] or covered[y][x] or (entries[y*w+x] & 0x3FF) in rooftops
    override = ROOT / "debug_tiles" / f"walkable_edit_{scene}.png"
    if override.exists():
        edit = Image.open(override).convert("RGB")
        for y in range(h):
            for x in range(w):
                if x*32+16 >= edit.width or y*32+16 >= edit.height:
                    continue
                r, g, b = edit.getpixel((x*32+16, y*32+16))
                if g > max(r, b)*1.25 and g > 100:
                    blocked[y][x] = solid[y][x]
                elif r > max(g, b)*1.25 and r > 100:
                    blocked[y][x] = True
    # Water retains its terrain class: land overrides must never turn water into a path.
    return (["".join("1" if not blocked[y][x] and not water[y][x] else "0" for x in range(w)) for y in range(h)],
            ["".join("1" if water[y][x] else "0" for x in range(w)) for y in range(h)],
            ["".join(format(entries[y*w+x] >> 12, "x") for x in range(w)) for y in range(h)],
            ["".join("1" if solid[y][x] else "0" for x in range(w)) for y in range(h)])


def export(scene):
    source = ROOT / "genpokemon" / ("gen_pokemon_roam.py" if scene == "rt111" else "gen_pokemon_roam_mauville.py")
    spec = importlib.util.spec_from_file_location("legacy_" + scene, source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    tree = ast.parse(source.read_text(encoding="utf-8-sig"))
    roster = next(n.value for n in ast.walk(tree) if isinstance(n, ast.Assign)
                  and any(isinstance(t, ast.Name) and t.id == "pokemon" for t in n.targets))
    # This is trusted, checked-in configuration, evaluated without builtins.
    config = eval(compile(ast.Expression(roster), str(source), "eval"), {"__builtins__": {}, "dict": dict, **vars(module)})
    original = PUBLIC / f"pokemon-roam-{scene}.svg"
    root = ET.parse(original).getroot()
    folder = OUT / scene
    folder.mkdir(parents=True, exist_ok=True)
    sprite_folder = OUT / "sprites"
    sprite_folder.mkdir(exist_ok=True)
    width, height = module.MAP_W*16, module.MAP_H*16
    poster = Image.new("RGBA", (width, height))
    layers, overlays, foreground, actors = [], [], [], []
    layer_index = 0
    for node in root:
        if node.tag.endswith("image"):
            data = base64.b64decode(node.attrib["href"].split(",", 1)[1])
            filename = f"layer-{layer_index}.png"
            (folder / filename).write_bytes(data)
            url = f"/worlds/{scene}/{filename}"
            (layers if layer_index == 0 else foreground).append(url)
            poster.alpha_composite(Image.open(io.BytesIO(data)).convert("RGBA"))
            layer_index += 1
        elif node.tag.endswith("g"):
            motion = next((e for e in node if e.tag.endswith("animateTransform") and e.attrib.get("calcMode") == "linear"), None)
            if motion is None:
                image = node.find("s:image", NS)
                visibility = node.find("s:animate", NS)
                if image is not None and visibility is not None:
                    filename = f"water-{len(overlays)}.png"
                    (folder / filename).write_bytes(base64.b64decode(image.attrib["href"].split(",", 1)[1]))
                    overlays.append({"src": f"/worlds/{scene}/{filename}", "steps": [i for i, v in enumerate(visibility.attrib["values"].split(";")) if v.strip() == "visible"]})
                continue
            sprite_node = next(e for e in node if "clip-path" in e.attrib)
            pid = int(re.search(r"pk(\d+)clip", sprite_node.attrib["clip-path"]).group(1))
            pk = config[pid]
            image = node.find(".//s:image", NS)
            data = base64.b64decode(image.attrib["href"].split(",", 1)[1])
            variant = pk["key"] + ("-shiny" if pk["is_shiny"] else "")
            (sprite_folder / f"{variant}.png").write_bytes(data)
            sheet = Image.open(io.BytesIO(data)).convert("RGBA")
            x, y = map(float, motion.attrib["values"].split(";")[0].split(","))
            actor = {"id": pk["key"], "name": pk["label"], "sprite": f"/worlds/sprites/{variant}.png",
                     "size": pk["dp"], "frameSize": pk["frame_w"], "shiny": pk["is_shiny"],
                     "habitat": pk["water_mode"], "home": {"x": x, "y": y}, "bounds": pk.get("bounds")}
            actors.append(actor)
            frame = sheet.crop((0, 0, pk["frame_w"], pk["frame_w"])).resize((pk["dp"], pk["dp"]), Image.Resampling.NEAREST)
            poster.alpha_composite(frame, (round(x-pk["dp"]/2), round(y-pk["dp"])))
    land, water, elevation, solid = terrain(module, scene)
    # The legacy foreground includes cliff/roof caps. They are not a global overlay:
    # a Pokemon south of a structure must render in front of its upper tiles.
    # Keep walkable floor tiles entirely behind residents; depth-sort the remaining
    # opaque metatile spans with feet positions. Each span retains its map elevation.
    structures = Image.new("RGBA", (width, height))
    for src in foreground:
        structures.alpha_composite(Image.open(PUBLIC / src.lstrip("/")).convert("RGBA"))
    occlusion = []
    for y in range(height // 16):
        for x in range(width // 16):
            if land[y][x] == "1" or water[y][x] == "1":
                continue
            if not structures.crop((x*16, y*16, x*16+16, y*16+16)).getbbox():
                continue
            level = int(elevation[y][x], 16)
            if occlusion and occlusion[-1]["y"] == y*16 and occlusion[-1]["x"] + occlusion[-1]["width"] == x*16 and occlusion[-1]["elevation"] == level:
                occlusion[-1]["width"] += 16
            else:
                occlusion.append({"x": x*16, "y": y*16, "width": 16, "height": 16, "elevation": level})
    structures.save(folder / "structures.png")
    assert len(actors) == (32 if scene == "rt111" else 12)
    poster.convert("RGB").save(folder / "poster.webp", lossless=True)
    write_json(folder / "map.json", {"id": scene, "title": "Route 111" if scene == "rt111" else "Mauville City",
        "width": width, "height": height, "tileSize": 16, "land": land, "water": water,
        "elevation": elevation, "solid": solid, "occlusion": occlusion, "structures": f"/worlds/{scene}/structures.png",
        "layers": layers, "foreground": foreground, "overlays": overlays, "actors": actors,
        "sourceSha256": hashlib.sha256(original.read_bytes()).hexdigest()})
    print(scene, len(actors), "residents;", sum(row.count("1") for row in land), "land tiles;", sum(row.count("1") for row in water), "water tiles")


def items():
    folder = OUT / "items"
    folder.mkdir(parents=True, exist_ok=True)
    base = f"https://raw.githubusercontent.com/pret/pokeemerald/{REV}/"
    header = urllib.request.urlopen(base + "src/data/graphics/items.h").read().decode()
    records = []
    for name in ["oran_berry", "poke_ball", "great_ball", "ultra_ball", "master_ball", "luxury_ball", "premier_ball"]:
        icon_path = f"graphics/items/icons/{name}.png"
        data = urllib.request.urlopen(base + icon_path).read()
        image = Image.open(io.BytesIO(data))
        # Indexed source art uses a separate game palette; preserve the original indices.
        symbol = "LuxuryBall" if name == "premier_ball" else "".join(part.title() for part in name.split("_"))
        match = re.search(r"gItemIconPalette_" + symbol + r'\[\].*?"([^"]+)"', header)
        palette_path = match.group(1) if match else f"graphics/items/icon_palettes/{name}.pal"
        palette = urllib.request.urlopen(base + palette_path).read()
        colors = [int(v) for line in palette.decode().splitlines()[3:] for v in line.split()]
        image.putpalette(colors + [0]*(768-len(colors)))
        image.info["transparency"] = 0
        image.convert("RGBA").save(folder / f"{name}.png")
        records.append({"name": name, "icon": base+icon_path, "palette": base+palette_path,
            "iconSha256": hashlib.sha256(data).hexdigest(), "paletteSha256": hashlib.sha256(palette).hexdigest(),
            "outputSha256": hashlib.sha256((folder / f"{name}.png").read_bytes()).hexdigest()})
    write_json(folder / "sources.json", {"repository": "https://github.com/pret/pokeemerald", "revision": REV,
        "description": "Authentic Pokémon Emerald item graphics, preserved by pret; original artwork belongs to its respective owners. Indexed pixels rendered with the game's palettes and transparent index 0.", "assets": records})
    print("Exported", len(records), "authentic Gen III item icons")


def reactions():
    folder = OUT / "reactions"
    folder.mkdir(parents=True, exist_ok=True)
    base = f"https://raw.githubusercontent.com/pret/pokeemerald/{REV}/"
    records = []
    for name in ["exclamation", "heart"]:
        path = f"graphics/field_effects/pics/emotion_{name}.png"
        data = urllib.request.urlopen(base + path).read()
        image = Image.open(io.BytesIO(data))
        assert image.size == (16, 16) and image.mode == "P"
        # Preserve the indexed PNG's embedded game colors. White/black are indices
        # 14/15; the heart uses index 5 in the original object-event palette.
        # trainer_see.c selects object palette slot 2 for the heart at runtime.
        image.info["transparency"] = 0
        image.convert("RGBA").save(folder / f"{name}.png")
        records.append({"name": name, "source": base+path, "sourceSha256": hashlib.sha256(data).hexdigest(),
                        "outputSha256": hashlib.sha256((folder / f"{name}.png").read_bytes()).hexdigest()})
    write_json(folder / "sources.json", {"revision": REV, "implementation": base+"src/trainer_see.c",
        "palette": "Embedded indexed game palette; transparent index 0", "assets": records})
    print("Exported original Emerald exclamation and heart reactions")


if __name__ == "__main__":
    for scene in ["rt111", "mauville"]:
        export(scene)
    Image.open(PUBLIC / "charc.gif").convert("RGBA").save(PUBLIC / "worlds/charcadet-still.png")
    if "--items" in sys.argv:
        items()
    if "--reactions" in sys.argv:
        reactions()
