"""Offline rendering checks for every native Friend Area in the daily README job."""
import datetime as dt
import unittest
import xml.etree.ElementTree as ET
from gen_contribution_garden import render
from friend_areas import CATALOG

class GardenTests(unittest.TestCase):
    def test_all_areas_embed_native_layers_and_respect_reduced_motion(self):
        today=dt.date.today()
        data={'total':{'lastYear':30},'contributions':[{'date':(today-dt.timedelta(days=29-i)).isoformat(),'count':1,'level':1} for i in range(30)]}
        for area in ['transformforest']+[a['id'] for a in CATALOG['areas']]:
            with self.subTest(area=area):
                svg=render(data,'light',friend_area=area)
                ET.fromstring(svg)
                self.assertIn('prefers-reduced-motion:reduce',svg)
                if area=='transformforest':self.assertIn('stone 3.2s steps(32)',svg)
                else:
                    definition=next(a for a in CATALOG['areas'] if a['id']==area)
                    for i in range(len(definition['layers'])):self.assertIn('scenery'+area+str(i),svg)
                self.assertNotIn('href="http',svg,'README image must be self-contained')
                self.assertNotIn('<script',svg)
if __name__=='__main__':unittest.main()
