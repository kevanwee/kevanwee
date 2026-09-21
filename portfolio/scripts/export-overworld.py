"""Import supplied packs (optional) and derive runtime metadata from PMD XML/PNG.

python scripts/export-overworld.py --import-downloads
python scripts/export-overworld.py  # regenerate from the checked-in originals
Requires Pillow; no image modifications or external downloads.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
DEST = PUBLIC / 'overworld'
SPECIES = ['armarouge', 'beautifly', 'breloom', 'corviknight', 'fidough',
           'flareon', 'goomy', 'noivern', 'pawmi', 'rowlet', 'talonflame', 'tyrunt', 'yveltal',
           # Second intake. Keys are slugs; FOLDERS maps the ones whose pack is named differently.
           'appletun', 'arcanine', 'charcadet', 'corphish', 'dragonair', 'dragonite', 'dratini',
           'eevee', 'gible', 'giratina', 'growlithe', 'hisuian-zorua', 'jolteon', 'mega-gallade',
           'mega-gardevoir', 'mega-rayquaza', 'mega-skarmory', 'mega-zeraora', 'naganadel',
           'primal-kyogre', 'shadow-mewtwo', 'shiny-dratini', 'skitty', 'squirtle', 'sylveon',
           'umbreon', 'vaporeon', 'zapdos', 'zorua']
FOLDERS = {'hisuian-zorua': 'h zorua', 'mega-gallade': 'm gallade', 'mega-gardevoir': 'm gardevoir',
           'mega-rayquaza': 'm rayquaza', 'mega-skarmory': 'm skarmory', 'mega-zeraora': 'm zeraora',
           'primal-kyogre': 'p kyogre', 'shadow-mewtwo': 'shadow mewtwo', 'shiny-dratini': 'dratini shiny'}
FORMS = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire',
         'flying', 'ghost', 'grass', 'ground', 'ice', 'poison', 'psychic',
         'rock', 'steel', 'water']
FLYERS = {'beautifly', 'corviknight', 'noivern', 'talonflame', 'yveltal',
          'mega-rayquaza', 'mega-skarmory',
          'naganadel', 'primal-kyogre', 'shadow-mewtwo', 'zapdos'}
# Target rendered heights, so every sprite is normalised to a consistent apparent
# size and relative bulk reads true (see tasks/lessons.md, lesson 1).
HEIGHTS = {'silvally': 58, 'armarouge': 43, 'ceruledge': 43, 'breloom': 36,
           'fidough': 25, 'flareon': 32, 'goomy': 24, 'pawmi': 26, 'tyrunt': 32,
           'rowlet': 22, 'beautifly': 30, 'corviknight': 42, 'noivern': 40, 'talonflame': 36, 'yveltal': 54,
           'skitty': 24, 'zorua': 24, 'hisuian-zorua': 24, 'squirtle': 26, 'eevee': 26,
           'corphish': 26, 'gible': 26, 'charcadet': 28, 'dratini': 28, 'shiny-dratini': 28,
           'growlithe': 28, 'appletun': 30, 'jolteon': 30, 'vaporeon': 30, 'umbreon': 30,
           'sylveon': 32, 'mega-zeraora': 34, 'mega-gardevoir': 38, 'mega-gallade': 40,
           'dragonair': 40, 'naganadel': 28, 'mega-skarmory': 42, 'arcanine': 44,
           'shadow-mewtwo': 46, 'zapdos': 48, 'dragonite': 50, 'primal-kyogre': 54, 'mega-rayquaza': 58}
FLIGHT_TEMPO = {'beautifly': 1.1, 'corviknight': 1.35, 'noivern': 1.4, 'talonflame': 1.7, 'yveltal': 1.3,
                'giratina': 1.25, 'mega-rayquaza': 1.3,
                'mega-skarmory': 1.5, 'naganadel': 1.4, 'primal-kyogre': 1.15,
                'shadow-mewtwo': 1.2, 'zapdos': 1.45}


def export(import_downloads=False, only=None):
    packs = {name: FOLDERS.get(name, name) for name in SPECIES}
    packs.update({f'silvally-{form}': f'silvally {form}' for form in FORMS})
    receipts = []
    for key, folder in packs.items():
        target = DEST / key
        if import_downloads and (only is None or key in only):
            source = Path.home() / 'Downloads' / folder
            assert source.is_dir(), source
            target.mkdir(parents=True, exist_ok=True)
            for file in source.iterdir():
                assert file.is_file() and file.suffix.lower() in {'.xml', '.png', '.txt'}, file
                shutil.copy2(file, target / file.name)
        files = sorted(target.iterdir())
        assert files, target
        receipts.append({'id': key, 'suppliedFolder': folder, 'files': [
            {'name': f.name, 'sha256': hashlib.sha256(f.read_bytes()).hexdigest()}
            for f in files]})

    manifest = {}
    for key in [*packs, 'ceruledge']:
        folder = DEST / key if key != 'ceruledge' else PUBLIC / key
        animations = {a.findtext('Name'): a for a in ET.parse(folder / 'AnimData.xml').findall('.//Anim')}
        configs = {}
        for requested in ['Walk', 'Idle', 'Sleep', 'Hop', 'Hover', 'RearUp', 'Double', 'Attack', 'Strike', 'Shoot', 'Hurt', 'Special0', 'Special2']:
            if requested not in animations:
                continue
            name = requested
            visited = set()
            while animations[name].findtext('CopyOf'):
                assert name not in visited, (key, name)
                visited.add(name)
                name = animations[name].findtext('CopyOf')
            anim = animations[name]
            w, h = int(anim.findtext('FrameWidth')), int(anim.findtext('FrameHeight'))
            durations = [int(d.text) for d in anim.findall('./Durations/Duration')]
            path = folder / f'{name}-Anim.png'
            with Image.open(path) as im:
                assert im.width == w * len(durations) and im.height % h == 0, path
                assert all(d > 0 for d in durations), path
                rows = im.height // h
                bounds = []
                for row in range(rows):
                    boxes = [im.crop((f*w, row*h, (f+1)*w, (row+1)*h)).getbbox() for f in range(len(durations))]
                    boxes = [box for box in boxes if box]
                    bounds.append([min(b[0] for b in boxes), min(b[1] for b in boxes),
                                   max(b[2] for b in boxes), max(b[3] for b in boxes)])
            configs[requested] = {'src': '/' + path.relative_to(PUBLIC).as_posix(),
                                 'w': w, 'h': h, 'rows': rows, 'durations': durations, 'bounds': bounds}
        flying = key in FLYERS
        # Hover is a trick/spin in several supplied packs. Contact-sheet reviewed
        # Walk rows contain steady directional wingbeats for every flying species.
        base = configs['Walk']
        height = max(base['bounds'][r][3] - base['bounds'][r][1] for r in [2, 6])
        species = 'silvally' if key.startswith('silvally-') else key
        manifest[key] = {'flying': flying, 'flightTempo': FLIGHT_TEMPO.get(key, 1),
                         'scale': round(HEIGHTS.get(species, 38) / height, 4),
                         'feet': [b[3] - base['h']/2 for b in base['bounds']], 'animations': configs}

    output = ROOT / 'src' / 'data' / 'overworld-sprites.json'
    output.write_text(json.dumps(manifest, separators=(',', ':')) + '\n', encoding='utf-8')
    (DEST / 'sources.json').write_text(json.dumps({'source': 'User-supplied PMD sprite packs, imported 2026-09-21',
        'attribution': 'PMD SpriteCollab (site Credits); Pokemon / Nintendo',
        'existingCeruledge': '/ceruledge/AnimData.xml', 'packs': receipts}, indent=2) + '\n', encoding='utf-8')
    print(f'Validated {len(manifest)} sprite variants; {sum(len(p["files"]) for p in receipts)} supplied files.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--import-downloads', action='store_true')
    parser.add_argument('--only', nargs='*', default=None,
                        help='copy just these keys out of Downloads; the rest regenerate in place')
    args = parser.parse_args()
    export(args.import_downloads, args.only)
