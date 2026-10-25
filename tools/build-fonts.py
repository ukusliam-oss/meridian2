"""Fixed instances of the variable display fonts, subset to the Latin the site uses, as woff2 in assets/fonts/.

Inputs (OFL 1.1, from github.com/google/fonts, kept in tools/.cache/font-eval/, gitignored):
  NotoSerifDisplay[wdth,wght].ttf, NotoSerifDisplay-Italic[wdth,wght].ttf  (saved as NotoSerifDisplay*.ttf)
  Archivo[wdth,wght].ttf                                                   (saved as Archivo.ttf)
Needs fontTools and brotli:  python3 -m pip install fonttools brotli
Run from the repo root:      python3 tools/build-fonts.py

Why these: the plan's §9.1 measured Cartier's title face against nine open fonts; Noto Serif Display at 62.5% width
is within 2% of its width and 1–4% of its ink density. Phase 0 compares weights 330, 350 and 400 on screen.
"""
import os, shutil
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

SRC = 'tools/.cache/font-eval'
OUT = 'assets/fonts'
# Basic Latin, Latin-1, Œ œ, dashes, curly quotes, ellipsis, middle dot, prime marks, the minus sign
UNI = [*range(0x20, 0x7F), *range(0xA0, 0x100), 0x152, 0x153, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D,
       0x2026, 0x2032, 0x2033, 0x2212]
JOBS = [
  # (source, axes, output)
  *[(f'NotoSerifDisplay{it}.ttf', {'wght': w, 'wdth': 62.5}, f'noto-serif-display-{w}{it.lower()}.woff2')
    for w in (330, 350, 400) for it in ('', '-Italic')],
  ('Archivo.ttf', {'wght': 500, 'wdth': 125}, 'archivo-expanded-500.woff2'),
]

def build(src, axes, out):
  font = TTFont(os.path.join(SRC, src))
  inst = instantiateVariableFont(font, axes)
  opts = subset.Options()
  opts.flavor = 'woff2'
  opts.layout_features = ['kern', 'liga', 'lnum', 'case', 'mark', 'mkmk']
  opts.name_IDs = ['*']
  sub = subset.Subsetter(options=opts)
  sub.populate(unicodes=UNI)
  sub.subset(inst)
  path = os.path.join(OUT, out)
  inst.flavor = 'woff2'
  inst.save(path)
  print(f'{out:40} {os.path.getsize(path) / 1024:.1f} KB')

for job in JOBS:
  build(*job)
for lic, out in [('OFL-notoserifdisplay.txt', 'NOTO-SERIF-DISPLAY-LICENSE.txt'), ('OFL-archivo.txt', 'ARCHIVO-LICENSE.txt')]:
  shutil.copy(os.path.join(SRC, lic), os.path.join(OUT, out))
