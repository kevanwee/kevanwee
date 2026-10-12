"""The lost shiny Psyduck in the 404 page's Crystal Crossing scene (components/LostCave.tsx). Run explicitly; builds never fetch.
Sheets come from the same pinned SpriteCollab revision as the Friend Areas; the scene is the Crystal Crossing Friend Area's (public/friend-areas)."""
import hashlib, json, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public/lost-cave'
REV = '6cec0a7f7ed48390a2d22d9e11fd96079e6f406e'
RAW = f'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/{REV}/'
# key: (SpriteCollab path, display name, animations)
# Only the lost Psyduck lives here; Diancie and Carbink belong to the Crystal Crossing Friend Area.
SPECIES = {
    'shiny-psyduck': ('0054/0000/0001', 'Shiny Psyduck', ['Idle', 'Walk']),
}

def fetch(rel, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        req = urllib.request.Request(RAW + rel, headers={'User-Agent': 'LostCave/1.0'})
        with urllib.request.urlopen(req, timeout=40) as response: path.write_bytes(response.read())
    return hashlib.sha256(path.read_bytes()).hexdigest()

def artists(credits, names):
    out = []
    for line in credits.splitlines():
        fields = line.split('\t')
        if len(fields) < 2: continue
        match = next((n.split('\t')[0] for n in names.splitlines() if fields[1] in n), fields[1])
        if match not in out: out.append(match)
    return out

def species(key, path, name, wanted, names):
    folder = ROOT / 'sprites' / key
    fetch(f'sprite/{path}/AnimData.xml', folder / 'AnimData.xml')
    fetch(f'sprite/{path}/credits.txt', folder / 'credits.txt')
    anims = {a.findtext('Name'): a for a in ET.parse(folder / 'AnimData.xml').findall('.//Anim')}
    result = dict(name=name, source=RAW + f'sprite/{path}/', credits=artists((folder / 'credits.txt').read_text(encoding='utf-8'), names), animations={})
    for requested in wanted:
        actual, seen = requested, set()
        while anims[actual].findtext('CopyOf'):
            if actual in seen: raise ValueError('Animation alias cycle')
            seen.add(actual); actual = anims[actual].findtext('CopyOf')
        node = anims[actual]; filename = actual + '-Anim.png'
        digest = fetch(f'sprite/{path}/{filename}', folder / filename)
        w, h = int(node.findtext('FrameWidth')), int(node.findtext('FrameHeight'))
        durations = [int(d.text) for d in node.findall('./Durations/Duration')]
        im = Image.open(folder / filename).convert('RGBA'); rows = im.height // h
        # One shared origin per facing across all frames, so the art never bobs from per-frame recentring.
        origins = []
        for row in range(rows):
            boxes = [b for b in (im.crop((c * w, row * h, (c + 1) * w, (row + 1) * h)).getbbox() for c in range(len(durations))) if b]
            origins.append([(min(b[0] for b in boxes) + max(b[2] for b in boxes)) / 2, max(b[3] for b in boxes)])
        result['animations'][requested] = dict(src=f'sprites/{key}/{filename}', w=w, h=h, rows=rows, durations=durations, origins=origins, sha256=digest)
    return result

if __name__ == '__main__':
    names = urllib.request.urlopen(RAW + 'spritebot_credits.txt', timeout=40).read().decode('utf-8')
    sprites = {key: species(key, *spec, names) for key, spec in SPECIES.items()}
    # The scene is the Crystal Crossing Friend Area's own export (scripts/sky_scenery.py), shared rather than copied.
    scene = json.loads((ROOT.parent / 'friend-areas' / 'crystalcrossing-source.json').read_text(encoding='utf-8'))
    catalog = dict(version=1, spriteRevision=REV, scene=scene, sprites=sprites)
    (ROOT / 'catalog.json').write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')
    print({k: (v['credits'], list(v['animations'])) for k, v in sprites.items()})
