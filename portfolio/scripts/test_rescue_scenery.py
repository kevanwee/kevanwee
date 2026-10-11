import struct, tempfile, unittest
from pathlib import Path
from PIL import Image
from rescue_scenery import decode, palettes, export

class NativeSceneryTests(unittest.TestCase):
    def fixture(self):
        # Two chunks across; the second row uses XOR zero-run to repeat the first.
        tile=bytes([0x21,0x43,0x65,0x87]*8)
        bpc=struct.pack('<8H',2,2,2,0,0,0,0,2)+tile+struct.pack('<4H',1,1|1024|4096,1|2048,1|4096)
        bma=struct.pack('<6B3H',4,4,2,2,2,2,1,0,1)+bytes([192,1,16,0,0])
        return bpc,bma
    def test_chunk_xor_rows_and_tile_flip_palette(self):
        im=decode(*self.fixture());self.assertEqual(im.size,(32,32))
        self.assertEqual([im.getpixel((x,0)) for x in range(8)],list(range(1,9)))
        self.assertEqual([im.getpixel((x,0)) for x in range(8,16)],list(range(24,16,-1)))
        self.assertEqual(im.crop((0,0,32,16)).tobytes(),im.crop((0,16,32,32)).tobytes())
    def test_native_ticks_and_transparent_bank_overlay(self):
        red=bytes([255,0,0,0]*15);green=bytes([0,255,0,0]*15);blue=bytes([0,0,255,0]*15)
        bpl=struct.pack('<2H',2,1)+red+green+struct.pack('<4H',0,0,3,2)+green+blue
        _,cycles=palettes(bpl);self.assertEqual([(b,t,len(f)) for b,t,f in cycles],[(1,3,2)])
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);cache=root/'cache';cache.mkdir();bpc,bma=self.fixture()
            for suffix,data in [('.bpl',bpl),('c.bpc',bpc),('m.bma',bma)]: (cache/('H07P07'+suffix)).write_bytes(data)
            result=export('transformforest',root/'out',cache);layer=result['layers'][0]
            self.assertEqual(layer['durations'],[3,3]);self.assertEqual(len(result['sources']),3)
            base=Image.open(root/'out'/result['background']).convert('RGBA');strip=Image.open(root/'out'/layer['src'])
            first=base.copy();first.alpha_composite(strip.crop((0,0,layer['w'],layer['h'])),(layer['x'],layer['y']))
            self.assertEqual(first.tobytes(),base.tobytes(),'frame zero must not introduce seams')
            next_frame=base.copy();next_frame.alpha_composite(strip.crop((layer['w'],0,layer['w']*2,layer['h'])),(layer['x'],layer['y']))
            self.assertEqual(next_frame.getpixel((0,0)),(255,0,0,255),'nonanimated bank unchanged')
            self.assertEqual(next_frame.getpixel((8,0)),(0,0,255,255),'native second palette applied')
    def test_reject_unsupported_bpa_instead_of_silent_static(self):
        bpc,bma=self.fixture();bpc=bpc[:6]+struct.pack('<H',1)+bpc[8:]
        with self.assertRaises(ValueError):decode(bpc,bma)

if __name__=='__main__': unittest.main()
