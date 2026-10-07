"""Script-free Friend Area SVG, sharing downloaded assets and safe seats with the web draft."""
import base64, io, json, random
from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).resolve().parents[2] / 'portfolio/public/friend-areas'
CATALOG = json.loads((ASSETS/'catalog.json').read_text(encoding='utf-8'))
SEATS = json.loads((ASSETS/'seats.json').read_text(encoding='utf-8'))

def choose(rng=None):
    return (rng or random.SystemRandom()).choice(['transformforest']+[a['id'] for a in CATALOG['areas']])

def uri(data):
    return 'data:image/png;base64,'+base64.b64encode(data).decode()

def panel(area_id, x=12, y=14, width=280, height=224):
    area = next(a for a in CATALOG['areas'] if a['id']==area_id)
    w,h = area['size']
    parts=[f'<svg x="{x}" y="{y}" width="{width}" height="{height}" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid meet">',
           f'<title>{area["name"]}</title><image width="{w}" height="{h}" href="{uri((ASSETS/area["background"]).read_bytes())}"/>']
    css=[]
    for resident in sorted(SEATS[area_id],key=lambda s:s['y']):
        sprite=CATALOG['sprites'][str(resident['id'])]
        a=sprite['animations']['Idle']; fw,fh=a['w'],a['h']; ox,oy=a['origins'][0]
        # Embed only the needed facing, with exact source frame timings.
        im=Image.open(ASSETS/a['src']); strip=im.crop((0,0,fw*len(a['durations']),fh)); buf=io.BytesIO();strip.save(buf,format='PNG')
        name=f'fa{resident["id"]}'; total=sum(a['durations']); elapsed=0; keys=[]
        for frame,duration in enumerate(a['durations']):
            keys.append(f'{elapsed/total*100:.6f}%{{transform:translateX(-{frame*fw}px)}}');elapsed+=duration
        keys.append('100%{transform:translateX(0)}')
        css.append(f'.{name}{{animation:{name} {total/60:.6f}s step-end infinite}}@keyframes {name}{{{"".join(keys)}}}')
        parts.append(f'<svg x="{resident["x"]-ox}" y="{resident["y"]-oy}" width="{fw}" height="{fh}" overflow="hidden"><g class="{name}"><image width="{strip.width}" height="{fh}" href="{uri(buf.getvalue())}"/></g></svg>')
    parts.append('</svg>')
    parts.append(f'<rect x="{x+8}" y="{y+8}" width="{len(area["name"])*5.8+18}" height="19" rx="9" fill="#101c29" opacity=".8"/><text x="{x+17}" y="{y+21}" font-size="10" fill="#fff">{area["name"]}</text>')
    return ''.join(parts),''.join(css)
