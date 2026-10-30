#!/usr/bin/env python3
"""
Mastering de Voz Viral de Alta Energía (-14 LUFS) + Mezcla de Efectos de Sonido de Estudio (Foley/SFX reales)
sincronizados al frame exacto de `words.json` para Episodio 2: `closing-apps-myth`.
"""
import json, subprocess, sys, tempfile, unicodedata, re
from pathlib import Path
import numpy as np

SR = 44100
KF = Path("/Users/rol.travel/.gemini/antigravity/scratch/keyframes")
SFX_TH_ASSETS = KF / "assets" / "talking-head" / "sfx"
SFX_TH_ENGINE = KF / "engine" / "talking-head" / "sfx"
SFX_CELF = SFX_TH_ENGINE / "celfstudies"

LIBRARY = {
    # Impactos pesados y slams (-9.5 a -10.5 dBFS)
    "impact_hit": (SFX_TH_ENGINE / "cinematic-impact-hit-352702.mp3", "onset", 2.2),
    "impact_boom": (SFX_TH_ENGINE / "impact-cinematic-boom-05-352465.mp3", "onset", 2.2),
    "metal_slam": (SFX_TH_ENGINE / "mixkit-metal-hit-woosh-1485.wav", "peak", 1.8),
    "landing": (SFX_TH_ASSETS / "landing.wav", "onset", 1.4),
    "thud": (SFX_TH_ASSETS / "thud.wav", "onset", 1.2),
    # Whooshes y risers (-13.5 a -14.5 dBFS, centrados en el pico del barrido)
    "whoosh_cine": (SFX_TH_ENGINE / "mixkit-cinematic-whoosh-fast-transition-1492.wav", "peak", 1.2),
    "whoosh_fast": (SFX_TH_ENGINE / "mixkit-fast-whoosh-transition-1490.wav", "peak", 1.2),
    "whoosh_flick": (SFX_CELF / "Whoosh_05_Fast_Flick.wav", "peak", 0.9),
    "whoosh_arrow": (SFX_TH_ENGINE / "mixkit-arrow-whoosh-1491.wav", "peak", 1.0),
    "riser": (SFX_TH_ENGINE / "popular-riser-metallic-sound-effect-trimmed.mp3", "peak", 1.6),
    # Alertas, chispas, UI, confirmaciones (-11.5 a -12.5 dBFS)
    "deny": (SFX_TH_ASSETS / "deny.wav", "onset", 1.2),
    "confirm": (SFX_TH_ASSETS / "confirm.wav", "onset", 1.2),
    "electric_pop": (SFX_TH_ENGINE / "mixkit-electric-pop-2365.wav", "onset", 1.0),
    "tech_select": (SFX_TH_ENGINE / "mixkit-modern-technology-select-3124.wav", "onset", 1.0),
    "hard_pop": (SFX_TH_ENGINE / "mixkit-hard-pop-click-2364.wav", "onset", 0.9),
    "snap": (SFX_TH_ASSETS / "snap.wav", "onset", 0.7),
    "pop": (SFX_TH_ASSETS / "pop.wav", "onset", 0.7),
    "level_up": (SFX_CELF / "Sparkle_02_Level_Up.wav", "onset", 1.6),
    "shutter": (SFX_CELF / "Camera_02_Shutter_Click.wav", "onset", 0.9),
    "tick": (SFX_TH_ASSETS / "tick.wav", "onset", 0.35),
    "tock": (SFX_TH_ASSETS / "tock.wav", "onset", 0.35),
    "typing": (SFX_CELF / "Typing_03_Short_Phrase.wav", "onset", 1.35),
    "mouse_click": (SFX_CELF / "Mouse_Click_01_Crisp.wav", "onset", 0.6),
    "msg_pop": (SFX_TH_ENGINE / "mixkit-message-pop-alert-2354.mp3", "onset", 1.0),
}

_CACHE = {}


def db_to_lin(db: float) -> float:
    return float(10.0 ** (db / 20.0))


def load_sfx(name: str):
    if name in _CACHE:
        return _CACHE[name]
    path, align_mode, max_dur = LIBRARY[name]
    if not path.exists():
        raise FileNotFoundError(f"Missing studio SFX file: {path}")
    raw = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-f",
            "f32le",
            "-acodec",
            "pcm_f32le",
            "-ac",
            "2",
            "-ar",
            str(SR),
            "-",
        ],
        capture_output=True,
        check=True,
    ).stdout
    arr = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    max_n = int(max_dur * SR)
    if len(arr) > max_n:
        arr = arr[:max_n]
        fade_n = min(int(0.08 * SR), len(arr) // 4)
        if fade_n > 0:
            arr[-fade_n:] *= np.linspace(1.0, 0.0, fade_n, dtype=np.float32)[:, None]

    env = np.max(np.abs(arr), axis=1)
    peak = float(np.max(env)) if len(env) else 1.0
    if peak > 1e-6:
        arr /= peak

    env = np.max(np.abs(arr), axis=1)
    if align_mode == "peak":
        win = max(1, int(0.015 * SR))
        smooth = np.convolve(env, np.ones(win) / win, mode="same")
        anchor = int(np.argmax(smooth))
    else:
        idx = np.where(env >= 0.12)[0]
        trim = max(0, int(idx[0]) - int(0.004 * SR)) if len(idx) else 0
        arr = arr[trim:]
        anchor = 0

    _CACHE[name] = (arr, anchor)
    return arr, anchor


def norm_tok(s: str) -> str:
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9$€%]", "", s)


def build_sfx_bed(words_json_path: Path):
    data = json.loads(words_json_path.read_text())
    dur = float(data["duration"])
    words = data["words"]
    scenes = data["scenes"]
    total_samples = int(np.ceil(dur * SR)) + SR // 2
    bed = np.zeros((total_samples, 2), dtype=np.float32)

    def place(name: str, t_sec: float, target_db: float, pan: float = 0.0):
        arr, anchor = load_sfx(name)
        gain = db_to_lin(target_db)
        l_gain = gain * min(1.0, 1.0 - pan * 0.35)
        r_gain = gain * min(1.0, 1.0 + pan * 0.35)
        start = int(round(t_sec * SR)) - anchor
        src_lo = 0
        if start < 0:
            src_lo = -start
            start = 0
        if src_lo >= len(arr) or start >= total_samples:
            return
        n = min(len(arr) - src_lo, total_samples - start)
        if n <= 0:
            return
        seg = arr[src_lo : src_lo + n]
        bed[start : start + n, 0] += seg[:, 0] * l_gain
        bed[start : start + n, 1] += seg[:, 1] * r_gain

    def cue_time(token: str, scene_id: str = None, nth: int = 1) -> float:
        key = norm_tok(token)
        lo, hi = 0, len(words) - 1
        if scene_id is not None:
            for idx, sc in enumerate(scenes):
                if sc["id"] == scene_id:
                    lo = sc["firstWord"]
                    hi = (scenes[idx + 1]["firstWord"] - 1) if idx + 1 < len(scenes) else len(words) - 1
                    break
        seen = 0
        for i in range(lo, hi + 1):
            if norm_tok(words[i]["w"]) == key:
                seen += 1
                if seen == nth:
                    return max(0.0, float(words[i]["t"]) - 0.03)
        raise KeyError(f"SFX cue {token!r} not found in scene {scene_id!r}")

    events = 0

    # 0. Arranque del Hook (0.06 s): swipe rápido + encendido de telemetría
    place("whoosh_flick", 0.06, -13.8)
    place("tech_select", 0.09, -12.4)
    events += 2

    # 1. Transiciones entre las 7 escenas (handovers en el punto medio del silencio)
    for i in range(1, len(scenes)):
        fw = scenes[i]["firstWord"]
        mid = 0.5 * (float(words[fw - 1]["e"]) + float(words[fw]["t"]))
        w_name = "whoosh_cine" if i % 2 == 1 else "whoosh_fast"
        place(w_name, mid, -13.5, pan=0.15 if i % 2 else -0.15)
        place("thud", mid + 0.05, -13.0)
        events += 2

    # 2. ESCENA 1 (hook): swipe en "todas", golpe MITO FALSO en "no", whip térmico en "desde" y chispa en "más"
    t_todas = cue_time("todas", "hook")
    place("whoosh_arrow", t_todas, -13.8)
    t_no = cue_time("no", "hook")
    place("impact_hit", t_no, -9.8)
    place("snap", t_no + 0.04, -12.0)
    t_desde = cue_time("desde", "hook")
    place("whoosh_flick", t_desde - 0.02, -13.2)
    place("impact_boom", t_desde, -9.6)
    place("hard_pop", t_desde + 0.07, -12.0, pan=-0.2)
    t_mas = cue_time("más", "hook")
    place("electric_pop", t_mas, -11.6, pan=0.2)
    events += 7

    # 3. ESCENA 2 (execs): tarjetas Apple y Android + split 50/50 en "deslizar" + sello MITO INÚTIL en "mito"
    t_apple = cue_time("Apple", "execs")
    place("tech_select", t_apple, -12.2, pan=-0.2)
    place("hard_pop", t_apple + 0.04, -12.5, pan=-0.2)
    t_android = cue_time("Android", "execs")
    place("tech_select", t_android, -12.2, pan=0.2)
    place("hard_pop", t_android + 0.04, -12.5, pan=0.2)
    t_desl = cue_time("deslizar", "execs")
    place("whoosh_arrow", t_desl - 0.02, -13.5)
    t_mito = cue_time("mito", "execs")
    place("impact_hit", t_mito, -10.0)
    place("deny", t_mito + 0.03, -11.5)
    events += 7

    # 4. ESCENA 3 (ram): cristalización en "congela", pulso "RAM", sello "pausa", caída metálica a "0%"
    t_cong = cue_time("congela", "ram")
    place("electric_pop", t_cong, -11.8)
    place("snap", t_cong + 0.04, -12.2)
    t_ram = cue_time("RAM", "ram")
    place("tech_select", t_ram, -12.2)
    t_pausa = cue_time("pausa", "ram")
    place("landing", t_pausa, -11.8)
    t_0 = cue_time("0%", "ram")
    place("whoosh_flick", t_0 - 0.02, -13.5)
    place("metal_slam", t_0, -10.2)
    place("confirm", t_0 + 0.05, -11.8)
    events += 7

    # 5. ESCENA 4 (coldboot): borrado en "borras", riser en "abrirla", explosión térmica en "pico", golpe en "cero"
    t_borras = cue_time("borras", "coldboot")
    place("impact_hit", t_borras, -10.2)
    t_abr = cue_time("abrirla", "coldboot")
    place("riser", t_abr + 0.06, -14.2)
    t_pico = cue_time("pico", "coldboot")
    place("whoosh_flick", t_pico - 0.02, -13.2)
    place("impact_boom", t_pico, -9.6)
    for k in range(3):
        place("tick", t_pico + 0.07 + k * 0.07, -14.0)
    t_cero = cue_time("cero", "coldboot")
    place("electric_pop", t_cero, -11.8)
    place("landing", t_cero + 0.03, -11.5)
    events += 9

    # 6. ESCENA 5 (culprits): alerta "2" permisos, tarjeta "actualización", radar "GPS" split, golpe "siempre"
    t_c2 = cue_time("2", "culprits")
    place("impact_hit", t_c2, -10.0)
    place("deny", t_c2 + 0.03, -11.5)
    t_act = cue_time("actualización", "culprits")
    place("hard_pop", t_act, -12.0, pan=-0.2)
    place("tock", t_act + 0.08, -14.0)
    place("tock", t_act + 0.16, -14.0)
    t_gps = cue_time("GPS", "culprits")
    place("whoosh_arrow", t_gps - 0.02, -13.4)
    place("electric_pop", t_gps, -11.8, pan=0.2)
    place("hard_pop", t_gps + 0.05, -12.0, pan=0.2)
    t_siem = cue_time("siempre", "culprits")
    place("impact_boom", t_siem, -10.2)
    events += 9

    # 7. ESCENA 6 (rule): captura "hoy", 3 checks progresivos ("congela", "actualizaciones", "ubicación") + victoria "usar"
    t_hoy = cue_time("hoy", "rule")
    place("shutter", t_hoy + 0.03, -12.0)
    t_r1 = cue_time("congela", "rule")
    place("hard_pop", t_r1, -12.0)
    t_r2 = cue_time("actualizaciones", "rule")
    place("snap", t_r2, -11.8)
    t_r3 = cue_time("ubicación", "rule")
    place("whoosh_flick", t_r3 - 0.03, -13.6)
    place("tech_select", t_r3, -12.0)
    t_usar = cue_time("usar", "rule")
    place("level_up", t_usar, -11.6)
    place("confirm", t_usar + 0.04, -11.5)
    events += 7

    # 8. ESCENA 7 (cta): "comentarios", teclado en "veces", split en "costumbre", boost en "video", click en "esto"
    t_com = cue_time("comentarios", "cta")
    place("tech_select", t_com, -12.0)
    t_vec = cue_time("veces", "cta")
    place("typing", t_vec, -12.5)
    t_cost = cue_time("costumbre", "cta")
    place("whoosh_arrow", t_cost - 0.03, -13.6)
    t_vid = cue_time("video", "cta")
    place("whoosh_flick", t_vid - 0.02, -13.8)
    place("pop", t_vid + 0.02, -12.2)
    t_esto = cue_time("esto", "cta")
    place("mouse_click", t_esto - 0.06, -11.5)
    place("msg_pop", t_esto + 0.02, -11.5)
    events += 7

    # Ganancia global del bus SFX +2.0 dB con limitador suave a -7.2 dBFS
    bed *= db_to_lin(2.0)
    sfx_peak = float(np.max(np.abs(bed)))
    cap = db_to_lin(-7.2)
    if sfx_peak > cap:
        bed = np.tanh(bed / cap) * cap

    return bed[: int(round(dur * SR))], events


def master_and_mux(reel_dir: Path, mp4_path: Path):
    words_json = reel_dir / "words.json"
    voice_mp3 = reel_dir / "voice.mp3"
    bed, n_events = build_sfx_bed(words_json)

    tmp_dir = Path(tempfile.mkdtemp())
    sfx_wav = tmp_dir / "sfx_bed.wav"
    voice_master_wav = tmp_dir / "voice_master.wav"
    mixed_aac = tmp_dir / "final_audio.m4a"
    out_mp4 = mp4_path.with_suffix(".mastered.mp4")

    pcm16 = np.clip(bed * 32767.0, -32768, 32767).astype(np.int16)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "s16le",
            "-ar",
            str(SR),
            "-ac",
            "2",
            "-i",
            "-",
            str(sfx_wav),
        ],
        input=pcm16.tobytes(),
        check=True,
    )

    # Cadena Broadcast de Presencia y Energía Vocal (-14 LUFS estándar TikTok/Reels/Shorts)
    vocal_chain = (
        "highpass=f=80,"
        "equalizer=f=135:t=q:w=1.2:g=2.0,"
        "equalizer=f=3400:t=q:w=1.1:g=3.2,"
        "equalizer=f=7500:t=q:w=1.4:g=1.8,"
        "acompressor=threshold=-20dB:ratio=3.0:attack=5:release=80:makeup=2.2,"
        "volume=4.2dB,"
        "alimiter=limit=0.89:level=0"
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(voice_mp3),
            "-af",
            vocal_chain,
            "-ar",
            str(SR),
            "-ac",
            "2",
            str(voice_master_wav),
        ],
        check=True,
    )

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(voice_master_wav),
            "-i",
            str(sfx_wav),
            "-filter_complex",
            "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.93:level=0[aout]",
            "-map",
            "[aout]",
            "-c:a",
            "aac",
            "-b:a",
            "256k",
            str(mixed_aac),
        ],
        check=True,
    )

    vd_sfx = subprocess.run(
        ["ffmpeg", "-i", str(sfx_wav), "-af", "volumedetect", "-f", "null", "-"],
        capture_output=True,
        text=True,
    ).stderr
    vd_mix = subprocess.run(
        ["ffmpeg", "-i", str(mixed_aac), "-af", "volumedetect", "-f", "null", "-"],
        capture_output=True,
        text=True,
    ).stderr

    sfx_max = next((l.strip() for l in vd_sfx.splitlines() if "max_volume" in l), "")
    mix_max = next((l.strip() for l in vd_mix.splitlines() if "max_volume" in l), "")
    mix_mean = next((l.strip() for l in vd_mix.splitlines() if "mean_volume" in l), "")

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(mp4_path),
            "-i",
            str(mixed_aac),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "copy",
            "-shortest",
            str(out_mp4),
        ],
        check=True,
    )
    out_mp4.replace(mp4_path)
    print(f"MASTERED AUDIO EP2 + {n_events} STUDIO SFX EVENTS -> {mp4_path}")
    print(f"  SFX bus: {sfx_max}")
    print(f"  Final mix: {mix_max} | {mix_mean}")


if __name__ == "__main__":
    if "--verify-library" in sys.argv:
        for k in LIBRARY:
            load_sfx(k)
        print(f"VERIFIED ALL {len(LIBRARY)} STUDIO SFX FILES IN LIBRARY!")
    elif "--dry-run" in sys.argv:
        reel = Path(sys.argv[1])
        bed, n_ev = build_sfx_bed(reel / "words.json")
        peak_db = 20 * np.log10(float(np.max(np.abs(bed))) + 1e-12)
        print(f"DRY RUN OK: loaded all {len(LIBRARY)} studio SFX files, placed {n_ev} synced cues, SFX peak = {peak_db:.2f} dBFS")
    else:
        master_and_mux(Path(sys.argv[1]), Path(sys.argv[2]))
