"""Prepare local assets; does not install tools or modify public preview videos."""
from pathlib import Path
import argparse, shutil
parser = argparse.ArgumentParser()
parser.add_argument('--brag-skill', type=Path, required=True)
parser.add_argument('--gsap', type=Path, required=True, help='Path to gsap.min.js')
args = parser.parse_args()
root = Path(__file__).resolve().parent
repo = root.parents[1]
# Supply the already-published local font files used by this authoring package.
for slug in ['lq-plugins', 'bart', 'sal-citation']:
    assets = root / slug / 'assets'
    (assets / 'music').mkdir(parents=True, exist_ok=True)
    (assets / 'fonts').mkdir(exist_ok=True)
    shutil.copyfile(args.gsap, assets / 'gsap.min.js')
    for font in ['inter', 'playfair']:
        shutil.copyfile(root / 'fonts' / (font + '.woff2'), assets / 'fonts' / (font + '.woff2'))
    track = 'happy-beats-business-moves-vol-12-by-ende-dot-app.mp3'
    shutil.copyfile(args.brag_skill / 'assets/music' / track, assets / 'music' / track)
    shutil.copyfile(args.brag_skill / 'assets/sfx/ui/click1.ogg', assets / 'click.ogg')
    if slug == 'bart':
        for filename, original in [('bart-scan.png', 'image5.png'), ('bart-results.png', 'image3.png')]:
            shutil.copyfile(repo / 'portfolio/public/projects/bart' / original, assets / filename)
    if slug == 'sal-citation':
        shutil.copyfile(root / 'fixtures/sal-flow.mp4', assets / 'flow.mp4')
        shutil.copyfile(root / 'fixtures/sal-final.png', assets / 'sal-final.png')
print('Prepared three compositions. Install/run Hyperframes 0.8.186 with FFmpeg and FFprobe on PATH.')
