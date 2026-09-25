#!/usr/bin/env python3
"""Pista chiptune original (sin copyright) + efectos, sincronizada con el video.

Todo se sintetiza aquí con numpy (ondas cuadradas, triangular y ruido).
Uso:
  python3 music.py salida.wav --dur 37.5 --a-dur 11 --xfade 0.5 [--sin-sfx-a]
  --a-dur  duración del tramo inicial (11 s la animación; o la de tu toma real)
  --xfade  solape de la transición entre tramo inicial y tramo B
"""
import argparse
import wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
# Tiempos del tramo B en tiempo "animación" (deben coincidir con src/config.js)
A_END = 11.0
T = dict(pop=13.6, land=14.7, barcode=16.0, plan=18.6, coach=21.2, racha=23.8,
         comunidad=26.2, mikusi=29.2, cierre=32.2)


def note(n):  # número MIDI → Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.005, r=0.08):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def square(f, d, duty=0.5, vol=0.2):
    t = np.arange(int(d * SR)) / SR
    return vol * np.where((t * f) % 1 < duty, 1.0, -1.0) * env(len(t))


def tri(f, d, vol=0.3):
    t = np.arange(int(d * SR)) / SR
    return vol * (2 * np.abs(2 * ((t * f) % 1) - 1) - 1) * env(len(t), r=0.03)


def noise(d, vol=0.1, decay=30, seed=0):
    n = int(d * SR)
    rng = np.random.default_rng(seed)
    return vol * rng.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * decay)


def kick(vol=0.5):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f = 140 * np.exp(-t * 25) + 45
    return vol * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def blip(f0, f1, d=0.12, vol=0.22, duty=0.25):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return vol * np.where((np.cumsum(f) / SR) % 1 < duty, 1.0, -1.0) * env(n, r=0.04)


def build(dur, a_dur, xfade, sfx_a=True):
    buf = np.zeros(int((dur + 0.5) * SR))
    shift = (a_dur - xfade) - A_END          # desplazamiento de los tiempos del tramo B
    drop = T['pop'] + shift                   # el tema "explota" con el ¡pop!
    # progresión Am – F – C – G, un compás (4 tiempos) cada acorde
    chords = [(57, [0, 3, 7]), (53, [0, 4, 7]), (60, [0, 4, 7]), (55, [0, 4, 7])]
    melody = [12, 15, 19, 17, 15, 12, 10, 12, 16, 19, 16, 14, 12, 14, 16, 19]
    bars = int(dur / (4 * BEAT)) + 1
    for b in range(bars):
        root, iv = chords[b % 4]
        t0 = b * 4 * BEAT
        full = t0 >= drop - 0.01
        intro = t0 < 3
        for s in range(16):  # semicorcheas
            ts = t0 + s * BEAT / 4
            if ts >= dur - 1.2:
                break
            # arpegio
            n = root + 12 + iv[s % 3] + (12 if s % 6 >= 3 else 0)
            add(buf, square(note(n), BEAT / 4 * 0.9, 0.25, 0.05 if not full else 0.065), ts)
            # bajo en corcheas
            if s % 2 == 0 and not intro:
                add(buf, tri(note(root - 12 + (7 if s % 8 == 6 else 0)), BEAT / 2 * 0.9, 0.28), ts)
            # hi-hat
            if s % 2 == 1:
                add(buf, noise(0.05, 0.035 if not full else 0.05, 60, seed=s), ts)
            if not intro and s % 8 == 0:
                add(buf, kick(0.45), ts)
            if full and s % 8 == 4:
                add(buf, noise(0.14, 0.13, 22, seed=99), ts)
            # melodía después del drop
            if full and s % 2 == 0:
                m = melody[(b * 8 + s // 2) % 16]
                add(buf, square(note(root + m), BEAT / 2 * 0.85, 0.5, 0.075), ts)
    # acorde final
    end = dur - 1.2
    for iv in (0, 4, 7, 12):
        add(buf, square(note(57 + 12 + iv), 1.1, 0.5, 0.05) * np.linspace(1, 0, int(1.1 * SR)), end)
    add(buf, tri(note(45), 1.1, 0.3), end)

    # ---- efectos ----
    if sfx_a:
        add(buf, blip(500, 1400, 0.25, 0.12), 3.0)                       # celular sube
        add(buf, blip(900, 900, 0.06, 0.18), 4.9)                        # tap
        for i in range(3):                                               # etiquetas
            add(buf, blip(880 * (1 + i * 0.25), 1320 * (1 + i * 0.25), 0.1, 0.18), 6.9 + i * 0.5)
        add(buf, blip(660, 1760, 0.3, 0.16), 8.5)                        # total
    for i in range(9):                                                  # bloques del pixelado
        add(buf, blip(300 + i * 90, 300 + i * 90, 0.05, 0.12, 0.5), T['pop'] - 1.6 + i * 1.45 / 8 + shift)
    add(buf, noise(0.5, 0.35, 9, seed=7), T['pop'] + shift)              # ¡pop!
    add(buf, blip(1600, 200, 0.3, 0.2), T['pop'] + shift)
    add(buf, blip(700, 1400, 0.08, 0.2), T['land'] + shift)             # aterriza (moneda)
    add(buf, blip(1400, 2100, 0.18, 0.2), T['land'] + 0.08 + shift)
    for k in ('barcode', 'plan', 'coach', 'racha', 'comunidad', 'mikusi', 'cierre'):
        add(buf, noise(0.25, 0.12, 14, seed=3) * np.linspace(0.2, 1, int(0.25 * SR)), T[k] - 0.2 + shift)
    add(buf, blip(1800, 1800, 0.08, 0.14), T['barcode'] + 1.3 + shift)    # beep del lector
    for i in range(7):                                                  # racha
        add(buf, blip(700 + i * 110, 1000 + i * 110, 0.08, 0.14), T['racha'] + 0.4 + i * 1.2 / 7 + shift)
    for i in range(6):                                                  # cambios de outfit
        add(buf, blip(1200, 1800, 0.07, 0.1), T['mikusi'] + 0.2 + i * 0.45 + shift)
    add(buf, blip(523, 1046, 0.35, 0.18), T['cierre'] + 0.1 + shift)

    buf = buf[: int(dur * SR)]
    fade = int(0.6 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)
    buf = np.tanh(buf * 1.4) * 0.85
    return buf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--dur', type=float, default=37.5)
    ap.add_argument('--a-dur', type=float, default=11.0)
    ap.add_argument('--xfade', type=float, default=0.5)
    ap.add_argument('--sin-sfx-a', action='store_true')
    a = ap.parse_args()
    x = build(a.dur, a.a_dur, a.xfade, not a.sin_sfx_a)
    st = np.stack([x, np.roll(x, 90)], axis=1)                          # estéreo leve
    pcm = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(a.out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('ok', a.out, f'{a.dur:.2f}s')


if __name__ == '__main__':
    main()
