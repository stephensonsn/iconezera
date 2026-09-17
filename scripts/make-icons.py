"""Gera os PNGs do ícone do add-in (lupa branca em quadrado azul arredondado) sem dependências externas."""
import math, struct, zlib, os

BG = (15, 108, 189)  # azul da marca no Fluent 2
FG = (255, 255, 255)
SS = 4  # supersampling

def coverage(x, y):
    """(alpha_fundo, alpha_lupa) para o ponto normalizado (0..1)."""
    r = 0.22
    dx = max(abs(x - 0.5) - (0.5 - r), 0); dy = max(abs(y - 0.5) - (0.5 - r), 0)
    inside = math.hypot(dx, dy) <= r
    d = math.hypot(x - 0.44, y - 0.44)
    ring = 0.17 <= d <= 0.25
    # cabo: segmento de (0.61,0.61) a (0.78,0.78)
    t = max(0, min(1, ((x - 0.61) + (y - 0.61)) / (2 * 0.17)))
    handle = math.hypot(x - (0.61 + 0.17 * t), y - (0.61 + 0.17 * t)) <= 0.045
    return inside, inside and (ring or handle)

def png(size):
    rows = bytearray()
    for py in range(size):
        rows.append(0)
        for px in range(size):
            a = w = 0
            for sy in range(SS):
                for sx in range(SS):
                    i, g = coverage((px + (sx + .5) / SS) / size, (py + (sy + .5) / SS) / size)
                    a += i; w += g
            n = SS * SS
            mix = w / a if a else 0
            rows += bytes(round(c + (f - c) * mix) for c, f in zip(BG, FG)) + bytes([round(255 * a / n)])
    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b""))

out = os.path.join(os.path.dirname(__file__), "..", "apps", "powerpoint", "public", "assets")
os.makedirs(out, exist_ok=True)
for size in (16, 32, 64, 80, 128, 300):
    open(os.path.join(out, f"icon-{size}.png"), "wb").write(png(size))
print("ok")
