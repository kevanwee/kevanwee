"""Reproducible native scenery and attributed resident sprites. Run explicitly; builds never fetch third-party assets."""
import concurrent.futures, hashlib, json, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image
from rescue_scenery import export

ROOT = Path(__file__).resolve().parents[1] / 'public/friend-areas'
REV = '6cec0a7f7ed48390a2d22d9e11fd96079e6f406e'
RAW = f'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/{REV}/sprite/'
AREAS = [
    dict(id='mushroomforest', name='Mushroom Forest', size=[456,336],
         roster=[(46,'Paras'),(47,'Parasect'),(273,'Seedot'),(274,'Nuzleaf'),(275,'Shiftry'),(285,'Shroomish'),(286,'Breloom')],
         zones=[[[100,160],[160,157],[287,158],[351,157],[371,191],[354,248],[301,274],[232,282],[160,268],[102,239],[81,203]]],
         obstacles=[[[182,181],[277,181],[277,232],[182,232]]],
         description='A sheltered clearing beneath giant mushrooms.'),
    dict(id='mtmoonview', name='Mt. Moonview', size=[480,336],
         roster=[(35,'Clefairy'),(36,'Clefable'),(173,'Cleffa'),(337,'Lunatone'),(338,'Solrock'),(385,'Jirachi')],
         zones=[[[77,115],[177,115],[204,131],[185,150],[77,150]],
                [[90,141],[176,141],[176,197],[90,197]],
                [[89,185],[177,179],[207,196],[216,218],[174,236],[127,231],[89,211]],
                [[177,218],[216,218],[240,242],[256,270],[229,287],[209,278],[198,251],[180,237]],
                [[232,260],[272,250],[310,238],[356,243],[372,274],[335,302],[273,309],[221,321],[216,295]]],
         obstacles=[[[196,155],[241,155],[270,177],[277,215],[261,250],[247,249],[239,211],[225,191],[202,180],[192,171]]],
         description='Moonlit terraces linked by walkable stairs, beside a quiet pond.'),
    dict(id='decrepitlab', name='Decrepit Lab', size=[480,312],
         roster=[(63,'Abra'),(64,'Kadabra'),(65,'Alakazam'),(122,'Mr. Mime'),(132,'Ditto'),(137,'Porygon'),(233,'Porygon2')],
         zones=[[[48,122],[176,120],[193,133],[292,133],[312,120],[429,122],[449,149],[449,255],[417,259],[417,312],[65,312],[65,258],[32,258],[32,156]]],
         obstacles=[[[155,137],[320,137],[320,259],[155,259]]],
         description='An abandoned laboratory with mysterious machinery.'),
    dict(id='seafloorcave', name='Seafloor Cave', size=[360,336], roster=[(382,'Kyogre')],
         zones=[[[119,103],[242,103],[270,159],[248,231],[260,336],[97,336],[114,238],[89,161]]],
         obstacles=[], footRadius=18, separation=60, guestLimit=1,
         description='Kyogre\'s crystal-lined sanctuary beneath the sea.'),
    dict(id='volcanicpit', name='Volcanic Pit', size=[480,312], roster=[(383,'Groudon')],
         zones=[[[217,116],[261,113],[284,133],[296,164],[284,191],[259,209],[223,211],[198,191],[184,166],[191,139]]],
         obstacles=[], footRadius=12, separation=48, guestLimit=1,
         description='Groudon\'s stone refuge, surrounded by flowing magma.'),
]

# Canonical habitat membership: pinned pret/pmd-red data/monster/monster_data.json.
# Thunder Meadow uses eight of its eleven native species to keep the small panel legible.
AREAS += [
 dict(id='thundermeadow',name='Thunder Meadow',size=[456,336],roster=[(179,'Mareep'),(180,'Flaaffy'),(181,'Ampharos'),(309,'Electrike'),(310,'Manectric'),(311,'Plusle'),(312,'Minun'),(351,'Castform')],
      zones=[[[85,163],[135,143],[190,154],[213,142],[253,143],[291,157],[344,153],[365,174],[354,203],[385,226],[407,255],[335,260],[294,310],[163,310],[124,260],[48,255],[60,230],[90,198]]],
      obstacles=[[[194,190],[242,183],[267,207],[247,229],[250,274],[208,279],[202,246],[215,225]]],description='An electric meadow beneath rolling storm clouds.'),
 dict(id='rainbowpeak',name='Rainbow Peak',size=[456,312],roster=[(250,'Ho-Oh')],
      zones=[[[194,105],[261,105],[262,128],[245,140],[213,140],[194,128]],[[217,130],[239,130],[239,204],[217,204]]],obstacles=[],description='Ho-Oh rests above a sea of clouds and rainbows.'),
 dict(id='legendaryisland',name='Legendary Island',size=[480,264],roster=[(144,'Articuno'),(145,'Zapdos'),(146,'Moltres')],
      zones=[[[147,120],[279,120],[294,161],[260,173],[193,173],[163,157]],[[221,158],[258,158],[258,264],[221,264]],[[99,195],[382,195],[382,222],[99,222]],[[339,166],[365,143],[421,143],[451,159],[459,189],[442,210],[381,207],[350,190]]],
      obstacles=[[[401,149],[437,149],[437,170],[401,170]]],description='Three legendary birds share an island of ice, fire and lightning.'),
 dict(id='healingforest',name='Healing Forest',size=[480,336],roster=[(251,'Celebi')],
      zones=[[[170,152],[197,163],[223,171],[253,166],[285,151],[316,177],[302,216],[279,248],[259,285],[220,285],[201,250],[167,224],[151,185]]],obstacles=[],description='Celebi shelters in a luminous ancient forest.'),
 dict(id='waterfalllake',name='Waterfall Lake',size=[456,312],roster=[(129,'Magikarp'),(130,'Gyarados'),(349,'Feebas'),(350,'Milotic')],
      zones=[[[105,95],[168,95],[192,104],[272,105],[297,99],[347,110],[379,149],[362,191],[332,216],[321,257],[296,281],[183,289],[144,256],[123,218],[101,194],[105,160]]],
      obstacles=[[[201,163],[236,163],[251,184],[237,201],[202,201],[189,183]]],footRadius=10,separation=44,description='Water-dwelling residents circle the island beneath a flowing waterfall.'),
]

# Explorers of Sky areas: scenery decoded from pret/pmd-sky by scripts/sky_scenery.py (re-exporting needs
# skytemple-files on Python 3.10-3.13; the committed export is reused otherwise). Residents are curated.
SKY_AREAS = [
 dict(id='crystalcrossing',name='Crystal Crossing',map='d17p11a',size=[600,480],
      roster=[(719,'Diancie'),(703,'Carbink'),(703,'Carbink'),(703,'Carbink')],
      zones=[[[128,242],[200,236],[200,284],[400,284],[400,236],[472,242],[472,300],[440,352],[402,382],[370,396],[370,470],[230,470],[230,396],[198,382],[160,352],[128,300]]],
      obstacles=[[[146,302],[178,302],[178,350],[146,350]],[[422,302],[454,302],[454,350],[422,350]]],
      footRadius=8,guestLimit=0,
      description='Diancie and its Carbink keep the giant crystal at the heart of Crystal Cave.'),
]

def sky_scenery(area):
    source = ROOT / f"{area['id']}-source.json"
    if source.exists(): return json.loads(source.read_text(encoding='utf-8'))
    from sky_scenery import export
    return export(area['map'], area['id'], ROOT)

# Explicit curation, not canonical Red/Blue assignments or a type-only classifier.
GUESTS = {
 'mushroomforest': [(590,'Foongus','Fungal body; follows Paras and Shroomish.'),(755,'Morelull','Forest mushroom ecology; follows the existing fungal residents.')],
 'mtmoonview': [(605,'Elgyem','Extraterrestrial theme follows Lunatone and Solrock.'),(606,'Beheeyem','Elgyem evolution; the same celestial association.'),(517,'Munna','Dream theme suits a permanently moonlit sanctuary.'),(518,'Musharna','Munna evolution; retains the dream association.')],
 'decrepitlab': [(474,'Porygon-Z','Porygon evolution; also assigned here in Rescue Team DX.'),(577,'Solosis','Cellular design and Psychic typing suit the laboratory.'),(578,'Duosion','Solosis evolution; retains the cellular theme.'),(579,'Reuniclus','Solosis evolution; retains the cellular theme.')],
 'seafloorcave': [(489,'Phione','Ocean-dwelling mythical visitor; follows the underwater habitat.'),(490,'Manaphy','Ocean mythical visitor; fits Kyogre\'s marine sanctuary.')],
 'volcanicpit': [(485,'Heatran','Magma-associated legendary; fits the volcanic habitat.'),(721,'Volcanion','Fire/steam mythical visitor; a thematic volcanic match, not a canonical assignment.')],
}

def fetch(url, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        req = urllib.request.Request(url, headers={'User-Agent':'FriendAreaDraft/1.0'})
        with urllib.request.urlopen(req, timeout=40) as response:
            path.write_bytes(response.read())
    return hashlib.sha256(path.read_bytes()).hexdigest()

def species(item):
    dex, name = item
    folder = ROOT / 'sprites' / str(dex)
    base = RAW + f'{dex:04d}/'
    fetch(base+'AnimData.xml', folder/'AnimData.xml')
    fetch(base+'credits.txt', folder/'credits.txt')
    anims = {a.findtext('Name'):a for a in ET.parse(folder/'AnimData.xml').findall('.//Anim')}
    result = dict(id=dex, name=name, animations={})
    for requested in ['Idle','Walk','Sleep']:
        actual = requested if requested in anims else 'Idle'
        seen = set()
        while anims[actual].findtext('CopyOf'):
            if actual in seen: raise ValueError('Animation alias cycle')
            seen.add(actual)
            actual = anims[actual].findtext('CopyOf')
        node = anims[actual]
        filename = actual+'-Anim.png'
        digest = fetch(base+filename, folder/filename)
        w,h = int(node.findtext('FrameWidth')),int(node.findtext('FrameHeight'))
        durations = [int(d.text) for d in node.findall('./Durations/Duration')]
        im = Image.open(folder/filename).convert('RGBA')
        rows = im.height//h
        # One shared origin per facing, across all frames; no bobbing from recentering each frame.
        origins=[]
        for row in range(rows):
            bounds=[im.crop((col*w,row*h,(col+1)*w,(row+1)*h)).getbbox() for col in range(len(durations))]
            bounds=[b for b in bounds if b]
            origins.append([(min(b[0] for b in bounds)+max(b[2] for b in bounds))/2,max(b[3] for b in bounds)])
        result['animations'][requested]=dict(src=f'sprites/{dex}/{filename}', w=w,h=h,rows=rows,durations=durations,origins=origins,sha256=digest,sourceAnimation=actual)
    return result

def add_sky_areas():
    """Merge only the Explorers areas into the existing catalog, leaving the Rescue Team areas untouched."""
    catalog = json.loads((ROOT/'catalog.json').read_text(encoding='utf-8'))
    items = sorted({item for area in SKY_AREAS for item in area['roster']})
    for sprite in map(species, items): catalog['sprites'][str(sprite['id'])] = sprite
    for area in SKY_AREAS:
        entry = {k: v for k, v in area.items() if k != 'map'} | sky_scenery(area)
        entry['roster'] = [dex for dex, _ in area['roster']]; entry.setdefault('guests', [])
        entry['collisionStatus'] = 'Conservative authored foot zones, not game collision data.'
        catalog['areas'] = [a for a in catalog['areas'] if a['id'] != area['id']] + [entry]
    (ROOT/'catalog.json').write_text(json.dumps(catalog, indent=2)+'\n', encoding='utf-8')
    print(f'Merged {len(SKY_AREAS)} Explorers area(s) and {len(items)} species.')

def available(item):
    """species(), or None when SpriteCollab has no usable Idle sheet at the pinned revision."""
    try: return species(item)
    except Exception as error:
        print('  skipped', item, type(error).__name__); return None

def expand():
    """Add every remaining Rescue Team area, the Explorers shortlist and later-generation visitors.
    Existing areas keep their scenery, zones and natives; they only gain visitors."""
    import re
    from friend_area_data import RESCUE, SKY, SKY_ZONES, VISITORS
    from rescue_maps import export as rescue_export
    from rescue_scenery import palettes  # noqa: F401 (rescue_maps depends on it)
    entries = json.loads((ROOT.parent/'pokemon-pc/catalog.json').read_text(encoding='utf-8'))['entries']
    norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower().replace('é', 'e'))
    dex = {}
    for e in entries:
        if e['form'] == 'Normal': dex.setdefault(norm(e['name']), (e['dex'], e['name']))
    natives = json.loads(urllib.request.urlopen(
        'https://raw.githubusercontent.com/pret/pmd-red/013475aa04f5be3191e5527c186d9bfceae7cae0/data/monster/monster_data.json', timeout=60).read())
    catalog = json.loads((ROOT/'catalog.json').read_text(encoding='utf-8'))
    known = {a['id'] for a in catalog['areas']}
    cache = ROOT.parent.parent/'artifacts/scenery-sources'
    names = {'MT_DEEPGREEN': 'Mt. Deepgreen', 'MT_CLEFT': 'Mt. Cleft', 'MT_DISCIPLINE': 'Mt. Discipline', 'RUB_A_DUB_RIVER': 'Rub-a-Dub River',
             'MIST_RISE_FOREST': 'Mist-Rise Forest', 'AGED_CHAMBER_AN': 'Aged Chamber A-N', 'AGED_CHAMBER_O_EXCLAIM': 'Aged Chamber O-?'}
    added = []
    for key, description in RESCUE.items():
        area = key.lower().replace('_', '')
        if area in known: continue
        seen, roster = set(), []
        for monster in natives:
            if monster.get('friendArea') == 'FRIEND_AREA_' + key:
                name = monster['name'].removeprefix('MonsterName')
                hit = dex.get(norm({'Farfetch': "Farfetch'd", 'HoOh': 'Ho-Oh', 'MrMime': 'Mr. Mime', 'Nidoran_F': 'Nidoran♀', 'Nidoran_M': 'Nidoran♂'}.get(name, name)))                       or dex.get(norm(name.replace('_F', 'f').replace('_M', 'm')))
                if hit and hit[0] not in seen: seen.add(hit[0]); roster.append(hit)
        if key.startswith('AGED_CHAMBER'): roster = roster * 4  # Unown fills its chambers.
        scenery = rescue_export(key, area, ROOT, cache)
        added.append(dict(id=area, name=names.get(key, key.replace('_', ' ').title()), size=scenery['size'], description=description,
                          native=roster, scenery=scenery))
        print(area, len(roster), 'natives', len(scenery['layers']), 'layers', len(scenery['zones']), 'zones', flush=True)
    for code, area, title, mons, description in SKY:
        if area in known: continue
        from sky_scenery import export as sky_export
        source = ROOT/f'{area}-source.json'
        scenery = json.loads(source.read_text(encoding='utf-8')) if source.exists() else sky_export(code, area, ROOT)
        added.append(dict(id=area, name=title, size=scenery['size'], description=description,
                          native=[dex[norm(n)] for n in mons], scenery=scenery, sky=True))
        print(area, len(mons), 'curated', len(scenery['layers']), 'layers', len(scenery['zones'] or []), 'zones', flush=True)
    wanted = {}
    for entry in added:
        for item in entry['native']: wanted[item[0]] = item
    for groups in VISITORS.values():
        for group, _ in groups:
            for n in group: wanted[dex[norm(n)][0]] = dex[norm(n)]
    missing = [item for item in wanted.values() if str(item[0]) not in catalog['sprites']]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for sprite in pool.map(available, missing):
            if sprite: catalog['sprites'][str(sprite['id'])] = sprite
    have = lambda d: str(d) in catalog['sprites']
    def visitors(area, existing):
        out = []
        for group, reason in VISITORS.get(area, []):
            for n in group:
                d = dex[norm(n)][0]
                if have(d) and d not in existing and d not in [g['id'] for g in out]: out.append(dict(id=d, reason=reason, basis='Curated habitat inference'))
        return out
    for area in catalog['areas']:
        extra = visitors(area['id'], set(area['roster']) | {g['id'] for g in area.get('guests', [])})
        if extra:
            area['guests'] = area.get('guests', []) + extra
            # At most eight residents per visit keeps the panel legible; each draw leaves a visitor out so visits vary.
            if area['id'] != 'crystalcrossing':
                area['guestLimit'] = max(area.get('guestLimit', 0), min(2, len(area['guests']) - 1, 8 - len(area['roster'])))
    for entry in added:
        native = [d for d, _ in entry['native'] if have(d)]
        scenery = entry['scenery']
        # Five natives stay on the map; the rest rotate into three more places with the visitors (eight per visit).
        roster, rotating = native[:5], list(dict.fromkeys(native[5:]))
        guests = [dict(id=d, reason='Native resident in Red Rescue Team.', basis='pret/pmd-red monster_data.json') for d in rotating if d not in roster]
        guests += visitors(entry['id'], set(roster) | set(rotating))
        catalog['areas'].append(dict(id=entry['id'], name=entry['name'], size=scenery['size'], background=scenery['background'],
            layers=scenery['layers'], description=entry['description'], roster=roster, guests=guests,
            guestLimit=max(0, min(3, len(guests) - 1, 8 - len(roster))), zones=scenery['zones'] or SKY_ZONES[entry['id']], obstacles=[],
            sourceRevision=scenery['sourceRevision'], sources=scenery['sources'], sceneryAnimation=scenery.get('sceneryAnimation'),
            collisionStatus='Walk zones from the native collision layer (largest open region).' if scenery['zones'] else 'Conservative authored foot zones; this map has no collision layer.',
            **({'map': scenery['map'], 'credit': scenery.get('credit')} if entry.get('sky') else {})))
    (ROOT/'catalog.json').write_text(json.dumps(catalog, indent=2)+'\n', encoding='utf-8')
    print(f"Catalog: {len(catalog['areas'])} areas, {len(catalog['sprites'])} species.")

if __name__ == '__main__':
    import sys
    if '--sky-only' in sys.argv:
        add_sky_areas(); raise SystemExit
    if '--expand' in sys.argv:
        expand(); raise SystemExit
    ROOT.mkdir(parents=True, exist_ok=True)
    for area in AREAS:
        area.update(export(area['id'], ROOT, ROOT.parent.parent / 'artifacts/scenery-sources'))
    export('transformforest', ROOT, ROOT.parent.parent / 'artifacts/scenery-sources')
    items = [item for area in AREAS for item in area['roster']] + [(dex,name) for guests in GUESTS.values() for dex,name,_ in guests]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        sprites = list(pool.map(species, items))
    for area in AREAS:
        area['roster']=[dex for dex,_ in area['roster']]
        area['guests']=[dict(id=dex,reason=reason,basis='Rescue Team DX' if dex==474 else 'Curated habitat inference') for dex,_,reason in GUESTS.get(area['id'], [])]
        area.setdefault('guestLimit', min(2, len(area['guests']), 8-len(area['roster'])))
    for area in SKY_AREAS:
        entry = {k: v for k, v in area.items() if k != 'map'} | sky_scenery(area)
        entry['roster'] = [dex for dex, _ in area['roster']]; entry.setdefault('guests', [])
        AREAS.append(entry); sprites += [species(item) for item in sorted(set(area['roster']))]
    data=dict(version=3, spriteRevision=REV, areas=AREAS, sprites={str(s['id']):s for s in sprites})
    (ROOT/'catalog.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
    print(f'Downloaded {len(sprites)} species across {len(AREAS)} areas.')
