"""Stylised supply-and-demand diagrams for the credit-expansion slide.

Two panels, same axes: quantity of homes bought (x) against price (y).
Demand shifts out from D to D' after a credit expansion. With elastic supply the
quantity adjusts (who owns changes); with inelastic supply the price adjusts (what
it costs changes). Colours follow the deck: the moving margin is coloured, the
rest is ink. Fonts fall back to the theme's system stack inside an <img>.
"""
import math

W, H = 460, 340
M = dict(l=54, r=44, t=42, b=52)
PW, PH = W - M['l'] - M['r'], H - M['t'] - M['b']
QMAX, PMAX = 1.0, 9.0

INK, INK2, INK3, LINE = '#1C2224', '#4B5457', '#667074', '#C9CEC6'
GAIN, YIELD, PAPER = '#C4452A', '#128F78', '#FFFFFF'
FD = "'Bricolage Grotesque','Helvetica Neue',Arial,sans-serif"
FB = "'Newsreader',Georgia,serif"

def X(q): return M['l'] + q / QMAX * PW
def Y(p): return M['t'] + PH - p / PMAX * PH

def demand_path(k):
    pts = []
    n = 80
    for i in range(n + 1):
        q = 0.06 + (QMAX - 0.06) * i / n
        p = k / q
        if p > PMAX: continue
        pts.append(f"{X(q):.1f},{Y(p):.1f}")
    return 'M ' + ' L '.join(pts)

def label(x, y, s, fill=INK, size=17, w=700, anchor='start', font=FD, italic=False):
    st = f"font-family:{font};font-size:{size}px;font-weight:{w};fill:{fill}"
    if italic: st += ';font-style:italic'
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" style="{st}">{s}</text>'

def dot(q, p, fill=PAPER, stroke=INK):
    return f'<circle cx="{X(q):.1f}" cy="{Y(p):.1f}" r="6" fill="{fill}" stroke="{stroke}" stroke-width="2.5"/>'

def arrow(x1, y1, x2, y2, color):
    # shortened so the head sits before the end point
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy); ux, uy = dx / L, dy / L
    hx, hy = x2 - ux * 9, y2 - uy * 9
    px, py = -uy, ux
    head = f"{x2:.1f},{y2:.1f} {hx + px*6:.1f},{hy + py*6:.1f} {hx - px*6:.1f},{hy - py*6:.1f}"
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{hx:.1f}" y2="{hy:.1f}" stroke="{color}" stroke-width="3.5" stroke-linecap="round"/>'
            f'<polygon points="{head}" fill="{color}"/>')

def frame(title, xlab, ylab):
    x0, y0, x1, y1 = M['l'], M['t'], M['l'] + PW, M['t'] + PH
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
        f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
        label(M['l'], 24, title, INK, 19, 800),
        f'<line x1="{x0}" y1="{y1}" x2="{x1}" y2="{y1}" stroke="{INK2}" stroke-width="1.5"/>',
        f'<line x1="{x0}" y1="{y0}" x2="{x0}" y2="{y1}" stroke="{INK2}" stroke-width="1.5"/>',
        label(x1, y1 + 30, xlab, INK3, 13, 400, 'end', FB, True),
        f'<text transform="translate({x0 - 14},{y0}) rotate(-90)" text-anchor="end" style="font-family:{FB};font-size:13px;font-style:italic;fill:{INK3}">{ylab}</text>',
    ]

def demands():
    return [
        f'<path d="{demand_path(1.0)}" fill="none" stroke="{INK3}" stroke-width="2.5"/>',
        f'<path d="{demand_path(2.0)}" fill="none" stroke="{INK}" stroke-width="2.5"/>',
        label(X(QMAX) + 8, Y(1.0) + 6, 'D', INK3, 16, 700),
        label(X(QMAX) + 8, Y(2.0) + 6, "D′", INK, 16, 700),
    ]

def write(name, body):
    with open(name, 'w') as f:
        f.write('\n'.join(body) + '\n</svg>\n')
    print('  ' + name)

# --- elastic supply: horizontal at p = 5, quantity moves 0.2 -> 0.4 -----------
P0 = 5.0
s = frame('Elastic supply', 'homes bought', 'price')
s += demands()
s += [f'<line x1="{X(0)}" y1="{Y(P0)}" x2="{X(QMAX)}" y2="{Y(P0)}" stroke="{INK}" stroke-width="2.5"/>',
      label(X(QMAX) - 4, Y(P0) - 10, 'S', INK, 16, 700, 'end'),
      arrow(X(0.2), Y(P0) + 26, X(0.4), Y(P0) + 26, GAIN),
      dot(0.2, P0), dot(0.4, P0, GAIN, GAIN),
      label(X(0.30), Y(P0) + 50, 'more buyers, same price', GAIN, 15, 700, 'middle')]
write('supply_elastic.svg', s)

# --- inelastic supply: vertical at q = 0.4, price moves 2.5 -> 5 ---------------
Q0 = 0.4
s = frame('Inelastic supply', 'homes bought', 'price')
s += demands()
s += [f'<line x1="{X(Q0)}" y1="{Y(0)}" x2="{X(Q0)}" y2="{Y(PMAX)}" stroke="{INK}" stroke-width="2.5"/>',
      label(X(Q0) + 8, Y(PMAX) + 16, 'S', INK, 16, 700),
      arrow(X(Q0) + 26, Y(2.5), X(Q0) + 26, Y(5.0), YIELD),
      dot(Q0, 2.5), dot(Q0, 5.0, YIELD, YIELD),
      label(X(Q0) + 46, Y(3.75) + 5, 'same buyers, higher price', YIELD, 15, 700)]
write('supply_inelastic.svg', s)
