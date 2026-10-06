"""Download the owner's picks from PMDCollab SpriteCollab (Walk, Idle, Sleep) into sprites/<name>/
and write sprites/extra.json with each sheet's frame size and durations (CopyOf resolved)."""
import json, re, struct, urllib.request
from pathlib import Path

RAW = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/"
PICKS = {
    "spearow": "0021", "shiny-mega-gengar": "0094/0001/0001", "shiny-treecko": "0252/0000/0001", "shiny-turtwig": "0387/0000/0001",
    "shiny-mudkip": "0258/0000/0001", "shiny-trapinch": "0328/0000/0001", "solgaleo": "0791", "miraidon": "1008/0001",
    "shiny-meowstic-f": "0678/0000/0001/0002", "buizel": "0418", "infernape": "0392", "piplup": "0393", "swellow": "0277",
    "shedinja": "0292", "entei": "0244", "quilava": "0156", "shiny-ponyta": "0077/0000/0001", "charmander": "0004",
    "pikachu": "0025", "sandshrew": "0027", "alolan-sandshrew": "0027/0001", "dachsbun": "0927", "kleavor": "0900",
    "crobat": "0169", "electrike": "0309", "mega-absol": "0359/0001", "shieldon": "0410", "shiny-ditto": "0132/0000/0001",
    "shiny-cranidos": "0408/0000/0001", "shiny-kingambit": "0983/0000/0001", "tatsugiri-stretchy": "0978/0001", "tandemaus": "0924",
    "totodile": "0158", "shiny-poochyena": "0261/0000/0001", "mightyena": "0262", "kricketune": "0402", "magby": "0240",
    "shiny-emboar": "0500/0000/0001", "oshawott": "0501", "shiny-toxtricity": "0849/0000/0001", "dragapult": "0887",
    "zacian-crowned": "0888/0001", "shiny-cyclizar": "0967/0000/0001", "shiny-goodra": "0706/0000/0001",
}
OUT = Path("sprites")


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()


def anims(xml):
    out = {}
    for block in re.findall(r"<Anim>(.*?)</Anim>", xml, re.S):
        name = re.search(r"<Name>(.*?)</Name>", block).group(1)
        copy = re.search(r"<CopyOf>(.*?)</CopyOf>", block)
        if copy:
            out[name] = {"copy": copy.group(1)}
            continue
        out[name] = {"w": int(re.search(r"<FrameWidth>(\d+)", block).group(1)), "h": int(re.search(r"<FrameHeight>(\d+)", block).group(1)),
                     "durations": [int(d) for d in re.findall(r"<Duration>(\d+)</Duration>", block)]}
    for name, a in out.items():
        if "copy" in a: out[name] = dict(out[a["copy"]], file=a["copy"])
    return out


if __name__ == "__main__":
    meta = json.loads((OUT / "extra.json").read_text(encoding="utf-8")) if (OUT / "extra.json").exists() else {}
    for name, path in PICKS.items():
        if name in meta: continue
        d = OUT / name; d.mkdir(parents=True, exist_ok=True)
        xml = get(RAW + path + "/AnimData.xml").decode("utf-8")
        a = anims(xml)
        meta[name] = {}
        for anim in ["Walk", "Idle", "Sleep"]:
            if anim not in a: continue
            file = a[anim].get("file", anim)
            png = get(f"{RAW}{path}/{file}-Anim.png")
            (d / f"{anim}-Anim.png").write_bytes(png)
            w, h = struct.unpack(">II", png[16:24])
            info = a[anim]
            assert w == info["w"] * len(info["durations"]), (name, anim, w, info)
            meta[name][anim] = {"src": (d / f"{anim}-Anim.png").as_posix(), "w": info["w"], "h": info["h"], "durations": info["durations"], "rows": h // info["h"]}
        print(name, path, sorted(meta[name]))
    (OUT / "extra.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
