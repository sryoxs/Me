#!/usr/bin/env python3
"""Música chiptune original v2 (120 BPM, La menor) + efectos sincronizados al tramo animado.

La toma real dura OFFSET segundos y conserva su audio al 100 %: la música NO suena encima,
solo un riser suave en sus últimos 0.5 s. En OFFSET entra el tramo: puente de Kusi (1 compás
de subida), "drop" en OFFSET + 2.0 (el ¡pop! del pixelado) y cortes en OFFSET + 4, 6, 8…
Uso: python3 music-v2.py salida.wav --offset 10.0 [--dur-tramo 21.3]
"""
import argparse
import wave
import numpy as np

SR = 44100
BEAT = 0.5
BAR = 2.0
B = 1.0  # puente de Kusi al inicio del tramo
CUTS = [c + B for c in (3, 5, 7, 9, 11, 13, 15, 17)]
TITLES = [(t + B, n) for t, n in ((1.05, 3), (3, 3), (5, 3), (7, 3), (9, 3), (11, 4), (13, 2), (15, 2))]


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.004, r=0.06):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, min(n, int(r * SR)))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def sq(f, d, duty=0.5, v=0.2, vib=0.0):
    t = np.arange(int(d * SR)) / SR
    ph = np.cumsum(f * (1 + vib * np.sin(2 * np.pi * 6 * t))) / SR
    return v * np.where(ph % 1 < duty, 1.0, -1.0) * env(len(t))


def tri(f, d, v=0.3):
    t = np.arange(int(d * SR)) / SR
    return v * (2 * np.abs(2 * ((t * f) % 1) - 1) - 1) * env(len(t), r=0.03)


def noise(d, v=0.1, decay=30.0, seed=0):
    n = int(d * SR)
    return v * np.random.default_rng(seed).uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * decay)


def kick(v=0.6):
    t = np.arange(int(0.22 * SR)) / SR
    f = 150 * np.exp(-t * 28) + 42
    return v * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)


def snare(v=0.3, seed=1):
    t = np.arange(int(0.2 * SR)) / SR
    return v * (0.7 * np.random.default_rng(seed).uniform(-1, 1, len(t)) * np.exp(-t * 22) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30))


def sweep(f0, f1, d, v=0.2, duty=0.25):
    n = int(d * SR)
    f = np.geomspace(max(f0, 1), max(f1, 1), n)
    return v * np.where((np.cumsum(f) / SR) % 1 < duty, 1.0, -1.0) * env(n, r=0.03)


def whoosh(d=0.35, v=0.22, seed=5):
    n = int(d * SR)
    x = np.random.default_rng(seed).uniform(-1, 1, n)
    k = 24  # suavizado móvil = paso bajo barato; la envolvente sube y cae
    x = np.convolve(x, np.ones(k) / k, mode='same')
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return v * 4 * x * e


def add(buf, sig, at):
    i = int(round(at * SR))
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i]


def build(off, tramo):
    dur = off + tramo
    buf = np.zeros(int((dur + 1) * SR))
    drop = off + 1.0 + B
    end_hit = off + 19.0 + B
    chords = [(57, (0, 3, 7)), (53, (0, 4, 7)), (48, (0, 4, 7)), (55, (0, 4, 7))]  # Am F C G
    mel = [12, 15, 19, 22, 19, 15, 17, 15, 12, 10, 12, 15, 14, 12, 10, 7]
    first = drop - BAR * np.ceil(drop / BAR)  # compases alineados al drop
    b = 0
    while True:
        t0 = first + b * BAR
        if t0 >= end_hit:
            break
        root, iv = chords[b % 4] if t0 >= drop else chords[(b + 2) % 4]
        full = t0 >= drop - 1e-6
        for s in range(16):
            ts = t0 + s * BEAT / 4
            if ts < off - 1e-6 or ts >= end_hit:
                continue
            pre = ts < drop
            # arpegio (suave antes del drop)
            n = root + 12 + iv[s % 3] + (12 if (s // 3) % 2 else 0)
            if pre:
                build_up = max(0.0, 1 - (drop - ts) / 2.5)
                add(buf, tri(hz(n), BEAT / 4 * 0.95, 0.05 + 0.07 * build_up), ts)
                if s % 4 == 0:
                    add(buf, tri(hz(root - 12), BEAT * 0.9, 0.12 + 0.1 * build_up), ts)
                if drop - ts < 2.0 and s % 2 == 0:  # redoble que acelera
                    add(buf, snare(0.05 + 0.12 * (1 - (drop - ts) / 2), seed=s), ts)
                if drop - ts < 1.0 and s % 2 == 1:
                    add(buf, snare(0.08, seed=s + 50), ts)
                continue
            add(buf, sq(hz(n), BEAT / 4 * 0.85, 0.25, 0.045), ts)
            if s % 2 == 0:  # bajo en corcheas con octava
                add(buf, tri(hz(root - 12 + (12 if s % 4 == 2 else 0)), BEAT / 2 * 0.9, 0.32), ts)
            add(buf, noise(0.04, 0.05 if s % 2 else 0.03, 70, seed=s), ts)  # hi-hats 16avos
            if s % 4 == 0:
                add(buf, kick(0.62), ts)
            if s % 8 == 4:
                add(buf, snare(0.32, seed=b), ts)
            if full and s % 2 == 0:  # melodía
                m = mel[((b % 2) * 8 + s // 2) % 16]
                add(buf, sq(hz(root + m), BEAT / 2 * 0.8, 0.5, 0.06, vib=0.004), ts)
        b += 1
    # golpe final y acorde que suena hasta el final
    ring = dur - end_hit + 0.3
    for n in (69, 72, 76, 81):
        add(buf, sq(hz(n), ring, 0.5, 0.05) * np.linspace(1, 0, int(ring * SR)), end_hit)
    add(buf, tri(hz(45), ring, 0.35) * np.linspace(1, 0, int(ring * SR)), end_hit)
    add(buf, kick(0.7), end_hit)
    add(buf, noise(1.2, 0.18, 3.5, seed=77), end_hit)

    # ---------- efectos ----------
    rn = int(0.5 * SR)                                             # riser suave al final de la toma
    add(buf, whoosh(0.5, 0.05, seed=11) * np.linspace(0.2, 1, rn), off - 0.5)
    add(buf, noise(0.3, 0.22, 12, seed=3), off)                    # impacto de entrada (flash)
    add(buf, sweep(220, 880, 0.3, 0.14), off + 0.05)               # Kusi salta (boing)
    add(buf, whoosh(0.6, 0.16, seed=12), off + 0.45)               # vuela hacia la cámara
    add(buf, noise(0.3, 0.2, 12, seed=4), off + B)                 # destello → foto del plato
    for k in range(1, 6):                                          # 5 pasos de pixelado
        add(buf, sweep(300 * 1.3 ** k, 900 * 1.3 ** k, 0.07, 0.16, 0.5), off + B + k * 0.125)
    add(buf, noise(1.0, 0.3, 4.5, seed=9), drop)                   # crash del drop
    add(buf, kick(0.9), drop)
    add(buf, sweep(1800, 180, 0.28, 0.17), drop)                   # ¡pop!
    add(buf, whoosh(0.4, 0.2), drop + 0.02)                        # sube el celular
    add(buf, sweep(1400, 500, 0.45, 0.07), drop + 0.95 - 0.45)     # caída del plato
    add(buf, sq(hz(88), 0.09, 0.5, 0.13), off + B + 1.5)           # ding (moneda)
    add(buf, sq(hz(95), 0.35, 0.5, 0.13) * np.linspace(1, 0, int(0.35 * SR)), off + B + 1.58)
    for c in CUTS:                                                 # whoosh en cada corte
        add(buf, whoosh(0.36, 0.2, seed=int(c)), off + c - 0.18)
        add(buf, noise(0.6, 0.1, 6, seed=int(c) + 20), off + c)
    for t0, n in TITLES:                                           # blips de palabras
        for k in range(n):
            add(buf, sweep(900 + 150 * k, 1300 + 150 * k, 0.05, 0.07), off + t0 + k * 0.125)
    for i in range(3):                                             # platos reconocidos
        add(buf, sweep(700, 1500, 0.1, 0.1), off + B + 3.5 + i * 0.5)
    add(buf, sq(1750, 0.12, 0.5, 0.1), off + B + 5.75)                 # beep del lector
    add(buf, sq(hz(84), 0.08, 0.5, 0.1), off + B + 6.0)
    add(buf, sq(hz(91), 0.2, 0.5, 0.1), off + B + 6.08)
    for k in range(8):                                             # tipeo de Kusi
        add(buf, noise(0.02, 0.05, 90, seed=k + 30), off + B + 9.8 + k * 0.08)
    for k in range(7):                                             # racha que sube
        add(buf, sweep(500 * 1.12 ** k, 800 * 1.12 ** k, 0.07, 0.1), off + B + 11.25 + k * 0.125)
    for i in range(4):                                             # likes
        add(buf, sweep(900, 1600, 0.06, 0.08), off + B + 13.5 + i * 0.25)
    for k in range(6):                                             # outfits
        add(buf, sweep(1000, 1700, 0.06, 0.07), off + B + 15 + k * 0.25)
    add(buf, whoosh(0.35, 0.16, seed=61), off + B + 16.0)              # tema oscuro
    for k in range(7):                                             # letras del logo
        add(buf, sweep(600 + 90 * k, 900 + 90 * k, 0.05, 0.07), off + B + 17 + k * 0.0625)
    add(buf, sweep(523, 1046, 0.22, 0.1), off + B + 18.0)
    add(buf, sweep(659, 1318, 0.22, 0.1), off + B + 18.25)

    buf = buf[: int(dur * SR)]
    buf[-int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))
    return np.tanh(buf * 1.2) * 0.9


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--offset', type=float, default=10.0)
    ap.add_argument('--dur-tramo', type=float, default=21.3)
    a = ap.parse_args()
    x = build(a.offset, a.dur_tramo)
    st = np.stack([x, np.roll(x, 120)], axis=1)
    with wave.open(a.out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())
    print('ok', a.out, f'{a.offset + a.dur_tramo:.2f}s')


if __name__ == '__main__':
    main()
