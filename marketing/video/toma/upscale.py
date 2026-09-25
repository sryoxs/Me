"""Reescala cuadros con Real-ESRGAN (realesr-general-x4v3, SRVGGNetCompact) en CPU.
Uso: python3 upscale.py pesos.pth carpeta_entrada carpeta_salida [ancho alto]"""
import sys, os, glob
import numpy as np, torch, torch.nn as nn
from PIL import Image

class SRVGGNetCompact(nn.Module):
    def __init__(self, nf=64, nc=32, up=4):
        super().__init__()
        self.up = up
        body = [nn.Conv2d(3, nf, 3, 1, 1), nn.PReLU(num_parameters=nf)]
        for _ in range(nc):
            body += [nn.Conv2d(nf, nf, 3, 1, 1), nn.PReLU(num_parameters=nf)]
        body += [nn.Conv2d(nf, 3 * up * up, 3, 1, 1)]
        self.body = nn.ModuleList(body)
        self.shuf = nn.PixelShuffle(up)

    def forward(self, x):
        out = x
        for m in self.body:
            out = m(out)
        out = self.shuf(out)
        return out + nn.functional.interpolate(x, scale_factor=self.up, mode='nearest')

def main():
    pesos, src, dst = sys.argv[1:4]
    size = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else None
    os.makedirs(dst, exist_ok=True)
    net = SRVGGNetCompact()
    sd = torch.load(pesos, map_location='cpu')
    net.load_state_dict(sd.get('params', sd)); net.eval()
    torch.set_num_threads(os.cpu_count())
    for f in sorted(glob.glob(os.path.join(src, '*.png'))):
        out_path = os.path.join(dst, os.path.basename(f))
        if os.path.exists(out_path):
            continue
        a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32) / 255.0
        with torch.no_grad():
            y = net(torch.from_numpy(a).permute(2, 0, 1)[None]).clamp(0, 1)[0]
        im = Image.fromarray((y.permute(1, 2, 0).numpy() * 255).round().astype(np.uint8))
        if size:
            im = im.resize(size, Image.LANCZOS)
        im.save(out_path)
        print(os.path.basename(f), flush=True)

if __name__ == '__main__':
    main()
