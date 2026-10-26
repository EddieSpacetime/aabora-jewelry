#!/usr/bin/env python3
"""Generates temporary product illustrations into assets/images/products/.
Replace them with real photos later (see README)."""
import math, pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "images" / "products"

DEFS = """<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="{b1}"/><stop offset="1" stop-color="{b2}"/></radialGradient>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E3A1"/><stop offset=".45" stop-color="#D2A12B"/><stop offset="1" stop-color="#8F6612"/></linearGradient>
<linearGradient id="gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7F975B"/><stop offset="1" stop-color="#46592C"/></linearGradient>
<radialGradient id="st" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#DCE6EE"/><stop offset="1" stop-color="#9FB2C0"/></radialGradient>
<radialGradient id="pl" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#F0EADD"/><stop offset="1" stop-color="#C9BFAA"/></radialGradient>
<filter id="bl" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>"""

def shadow(cx=200, cy=430, rx=120):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="12" fill="#2B2A1F" opacity=".22" filter="url(#bl)"/>'

def leaf(x, y, rot, s=1):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M0 0 C14 -16 38 -16 52 0 C38 16 14 16 0 0Z" fill="url(#gr)"/>'
            f'<path d="M2 0 L48 0" stroke="#F6E3A1" stroke-width="1.4" opacity=".8"/></g>')

def ring(cy=300, r=92):
    return (f'<circle cx="200" cy="{cy}" r="{r}" fill="none" stroke="url(#g)" stroke-width="26"/>'
            f'<path d="M{200-r+4} {cy-26} A{r} {r} 0 0 1 {200+r-30} {cy-r+16}" fill="none" stroke="#FFF3C4" stroke-width="3" opacity=".7" stroke-linecap="round"/>')

def pearls_on_curve(p0, p1, p2, n, r):
    s = ""
    for i in range(n):
        t = (i + .5) / n
        x = (1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0]
        y = (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1]
        s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#pl)"/>'
    return s

def drop(x):
    return (f'<circle cx="{x}" cy="108" r="9" fill="none" stroke="url(#g)" stroke-width="4"/><path d="M{x} 117 L{x} 142" stroke="url(#g)" stroke-width="4"/>'
            f'<path d="M{x} 150 C{x+8} 190 {x+36} 220 {x+36} 255 A36 36 0 0 1 {x-36} 255 C{x-36} 220 {x-8} 190 {x} 150Z" fill="url(#g)"/>'
            f'<path d="M{x} 192 C{x+4} 212 {x+17} 228 {x+17} 246 A17 17 0 0 1 {x-17} 246 C{x-17} 228 {x-4} 212 {x} 192Z" fill="url(#st)" stroke="#8F6612" stroke-width="2"/>')

def hoop(cx, cy=260, r=84):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="url(#g)" stroke-width="14"/>'
    for a in range(0, 360, 18):
        x = cx + r*math.cos(math.radians(a)); y = cy + r*math.sin(math.radians(a))
        s += f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="5" ry="2.4" transform="rotate({a+90} {x:.1f} {y:.1f})" fill="#FFF1BE" opacity=".55"/>'
    return s

def cuff():
    s = '<ellipse cx="200" cy="270" rx="125" ry="82" fill="none" stroke="url(#g)" stroke-width="28"/>'
    for a in range(0, 360, 10):
        x = 200 + 125*math.cos(math.radians(a)); y = 270 + 82*math.sin(math.radians(a))
        s += f'<path d="M{x-7:.1f} {y-9:.1f} L{x+7:.1f} {y+9:.1f}" stroke="#7A560C" stroke-width="2.6" opacity=".55" stroke-linecap="round"/>'
    return s

def knot():
    return ('<ellipse cx="200" cy="262" rx="118" ry="78" fill="none" stroke="url(#gr)" stroke-width="12"/>'
            '<ellipse cx="170" cy="342" rx="26" ry="13" fill="none" stroke="url(#gr)" stroke-width="9" transform="rotate(-18 170 342)"/>'
            '<ellipse cx="230" cy="342" rx="26" ry="13" fill="none" stroke="url(#gr)" stroke-width="9" transform="rotate(18 230 342)"/>'
            '<circle cx="200" cy="344" r="23" fill="url(#g)"/><ellipse cx="192" cy="335" rx="8" ry="5" fill="#FFF3C4" opacity=".7"/>')

ITEMS = {
 1: (("#FBF6EA", "#E8DDC3"), ring(300) + leaf(188, 205, -150, .8) + leaf(212, 205, -30, .8) + shadow(200, 405, 115)),
 2: (("#EEF1E4", "#C9D3B3"), ring(305) +
     '<ellipse cx="200" cy="205" rx="36" ry="32" fill="url(#g)"/><ellipse cx="200" cy="205" rx="27" ry="23" fill="url(#st)"/><ellipse cx="190" cy="197" rx="9" ry="5" fill="#fff" opacity=".85"/>' + shadow(200, 410, 115)),
 3: (("#F8EBE3", "#E4CBBD"),
     '<path d="M65 110 Q200 330 335 110" fill="none" stroke="url(#g)" stroke-width="5" stroke-dasharray="1 7" stroke-linecap="round"/>'
     '<circle cx="200" cy="224" r="7" fill="none" stroke="url(#g)" stroke-width="4"/><circle cx="200" cy="278" r="46" fill="url(#g)"/>'
     '<path d="M162 278 q9.5 -15 19 0 t19 0 t19 0 t19 0" fill="none" stroke="#7A560C" stroke-width="4" stroke-linecap="round" opacity=".75"/>'
     '<ellipse cx="184" cy="256" rx="14" ry="6" fill="#FFF3C4" opacity=".5"/>' + shadow(200, 420, 90)),
 4: (("#F3EEE4", "#DAD2C0"),
     '<path d="M60 120 Q200 400 340 120" fill="none" stroke="url(#g)" stroke-width="2"/>' + pearls_on_curve((60, 120), (200, 400), (340, 120), 17, 15) +
     '<circle cx="60" cy="118" r="8" fill="url(#g)"/><circle cx="340" cy="118" r="8" fill="url(#g)"/>' + shadow(200, 430, 100)),
 5: (("#EEF1E4", "#C9D3B3"), drop(130) + drop(270) + shadow(200, 405, 140)),
 6: (("#F8EBE3", "#E4CBBD"), hoop(160) + hoop(242) + shadow(200, 405, 140)),
 7: (("#FBF6EA", "#E8DDC3"), cuff() + shadow(200, 405, 140)),
 8: (("#EEF1E4", "#C9D3B3"), knot() + shadow(200, 405, 140)),
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for i, ((b1, b2), body) in ITEMS.items():
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">{DEFS.format(b1=b1, b2=b2)}'
               f'<rect width="400" height="500" fill="url(#bg)"/>{body}</svg>')
        (OUT / f"placeholder-{i}.svg").write_text(svg, encoding="utf-8")
    print("wrote", len(ITEMS), "placeholder images")
