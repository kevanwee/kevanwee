"""Decode pinned Red Rescue Team map tiles and native palette cycles.
Format/playback reference: pret/pmd-red src/ground_bg.c (not a ROM extractor).
Artwork remains owned by its original rights holders.
"""
import hashlib, json, struct, urllib.request
from pathlib import Path
from PIL import Image
REV = '013475aa04f5be3191e5527c186d9bfceae7cae0'
BASE = f'https://raw.githubusercontent.com/pret/pmd-red/{REV}/data/map_bg/'
MAPS = {'transformforest':'H07P07','mushroomforest':'H07P05','mtmoonview':'H05P01','decrepitlab':'H15P01','seafloorcave':'H02P03','volcanicpit':'H26P01','thundermeadow':'H17P01','rainbowpeak':'H05P02','legendaryisland':'H29P01','healingforest':'H07P06','waterfalllake':'H10P02'}

def decode(bpc, bma):
    cw,ch,nt,*rest=struct.unpack_from('<8H',bpc)
    if any(rest[:4]): raise ValueError('BPA tiles need a separate decoder')
    nc=rest[4]; offset=16+(nt-1)*32
    tiles=[bytes(64)]
    for i in range(nt-1):
        raw=bpc[16+i*32:48+i*32]; tiles.append(bytes(v for b in raw for v in (b&15,b>>4)))
    chunks=[(0,)*(cw*ch)]+[struct.unpack_from('<'+'H'*(cw*ch),bpc,offset+i*cw*ch*2) for i in range(nc-1)]
    wt,ht,tw,th,wc,hc,nl,_,_=struct.unpack_from('<6B3H',bma)
    assert (tw,th)==(cw,ch) and nl==1, 'Unexpected layer layout'
    pos=12; rows=[]; previous=[0]*((wc+1)//2*2)
    for _ in range(hc):
        row=[]
        while len(row)<wc:
            cmd=bma[pos]; pos+=1
            if cmd>=192:
                count=cmd-191
                for _ in range(count):
                    v=int.from_bytes(bma[pos:pos+3],'little');pos+=3;row.extend((v&4095,v>>12))
            elif cmd>=128:
                v=int.from_bytes(bma[pos:pos+3],'little');pos+=3;row.extend((v&4095,v>>12)*(cmd-127))
            else: row.extend([0,0]*(cmd+1))
        row=[v^previous[i] for i,v in enumerate(row)]; rows.append(row[:wc]);previous=row
    pixels=Image.new('P',(wt*8,ht*8))
    for cy,row in enumerate(rows):
        for cx,chunk in enumerate(row):
            for t,entry in enumerate(chunks[chunk]):
                tile=Image.frombytes('P',(8,8),tiles[entry&1023])
                if entry&1024: tile=tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                if entry&2048: tile=tile.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
                bank=entry>>12
                tile=tile.point([v+bank*16 if v else 0 for v in range(256)])
                pixels.paste(tile,(cx*cw*8+t%cw*8,cy*ch*8+t//cw*8))
    return pixels

def palettes(bpl):
    count,animated=struct.unpack_from('<2H',bpl)
    def colors(offset):
        # GBA RGB555, expanded back to display RGB by bit replication.
        return [(0,0,0,255)]+[tuple(((v>>3)<<3)|((v>>3)>>2) for v in bpl[p:p+3])+(255,) for p in range(offset,offset+60,4)]
    base=[colors(4+i*60) for i in range(count)]; cycles=[];offset=4+count*60
    if animated:
        specs=[struct.unpack_from('<2H',bpl,offset+i*4) for i in range(count)];offset+=count*4
        for bank,(ticks,frames) in enumerate(specs):
            if frames:
                assert ticks>0
                cycles.append((bank,ticks,[colors(offset+i*60) for i in range(frames)]));offset+=frames*60
    assert offset==len(bpl), (offset,len(bpl))
    return base,cycles

def export(area, out, cache):
    out=Path(out);cache=Path(cache);out.mkdir(parents=True,exist_ok=True);cache.mkdir(parents=True,exist_ok=True)
    code=MAPS[area];data=[];sources=[]
    for suffix in ('.bpl','c.bpc','m.bma'):
        name=code+suffix;path=cache/name
        if not path.exists(): path.write_bytes(urllib.request.urlopen(BASE+name,timeout=60).read())
        raw=path.read_bytes();data.append(raw);sources.append(dict(url=BASE+name,sha256=hashlib.sha256(raw).hexdigest()))
    bpl,bpc,bma=data; indices=decode(bpc,bma);base,cycles=palettes(bpl)
    def render(pals):
        flat=[c for bank in pals for c in bank];return Image.frombytes('RGBA',indices.size,bytes(v for index in indices.tobytes() for v in flat[index]))
    # Native player loads the first palette frame on its first update.
    for bank,_,frames in cycles: base[bank]=frames[0]
    background=area+'.png';render(base).save(out/background)
    layers=[]
    for bank,ticks,frames in cycles:
        mask=Image.frombytes('L',indices.size,bytes(255 if i//16==bank and i%16 else 0 for i in indices.tobytes()));bbox=mask.getbbox()
        if not bbox or len(frames)<2: continue
        x,y,right,bottom=bbox;w=right-x;h=bottom-y
        strip=Image.new('RGBA',(w*len(frames),h))
        for frame,palette in enumerate(frames):
            pals=base.copy();pals[bank]=palette;im=render(pals).crop(bbox);im.putalpha(mask.crop(bbox));strip.paste(im,(frame*w,0))
        src=f'{area}-palette-{bank}.png';strip.save(out/src,optimize=True)
        layers.append(dict(src=src,x=x,y=y,w=w,h=h,frames=len(frames),durations=[ticks]*len(frames)))
    result=dict(background=background,size=list(indices.size),layers=layers,sourceRevision=REV,sources=sources,sceneryAnimation='Native BPL palette frames and durations at 60 ticks/second; no BPA tile animations in this map.' if cycles else 'Native map has no BPL palette or BPA tile animation.',collisionStatus='Conservative authored foot zones, not game collision data.')
    (out/(area+'-source.json')).write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return result

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--cache',required=True);args=parser.parse_args()
    for area in MAPS:
        result=export(area,args.output,args.cache);print(area,result['size'],[(l['frames'],l['durations'][0],l['w'],l['h']) for l in result['layers']],flush=True)
