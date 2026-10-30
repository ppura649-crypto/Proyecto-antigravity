#!/usr/bin/env python3
"""Render cuts.<variant>.json straight to a review MP4 (normal GOP, CRF 20).

No all-intra intermediate: variants exist to be watched and picked, not to feed
the caption stage. The chosen variant gets the real spine + master afterwards.

Usage: python3 render_variant.py <project_dir> <variant> [--crf 20]
"""
import json, subprocess, sys
from pathlib import Path

CHAIN = "highpass=f=70,afftdn=nr=8:nf=-58"

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode: sys.exit(f"ffmpeg failed:\n{r.stderr[-2500:]}")
    return r.stderr

def segments(doc):
    segs=[]
    for c in sorted([c for c in doc["clips"] if c["keep"]], key=lambda c:c["inMs"]):
        if c["outMs"]-c["inMs"]>=40: segs.append((c["inMs"],c["outMs"]))
    return segs

def main():
    P=Path(sys.argv[1]); name=sys.argv[2]
    crf=dict(zip(sys.argv[3::2],sys.argv[4::2])).get("--crf","20")
    doc=json.loads((P/f"cuts.{name}.json").read_text())
    src=(P/"source.txt").read_text().strip()
    segs=segments(doc)

    a=[f"[0:a]atrim=start={s/1000:.3f}:end={e/1000:.3f},asetpts=PTS-STARTPTS[a{i}];"
       for i,(s,e) in enumerate(segs)]
    ascript=P/f"filter-a-{name}.txt"
    ascript.write_text("".join(a)+"".join(f"[a{i}]" for i in range(len(segs)))
                       +f"concat=n={len(segs)}:v=0:a=1[ac];"
                       f"[ac]{CHAIN},loudnorm=I=-14:TP=-1:LRA=11:print_format=json[aout]")
    # loudness analysis on the audio only: no video decode, seconds not minutes
    err=run(["ffmpeg","-hide_banner","-i",str(P/"audio.wav"),"-/filter_complex",str(ascript),
             "-map","[aout]","-f","null","-"])
    j=json.loads(err[err.rindex("{"):err.rindex("}")+1])

    parts=[]
    for i,(s,e) in enumerate(segs):
        parts.append(f"[0:v]trim=start={s/1000:.3f}:end={e/1000:.3f},setpts=PTS-STARTPTS[v{i}];")
        parts.append(f"[0:a]atrim=start={s/1000:.3f}:end={e/1000:.3f},asetpts=PTS-STARTPTS[a{i}];")
    parts.append("".join(f"[v{i}][a{i}]" for i in range(len(segs)))
                 +f"concat=n={len(segs)}:v=1:a=1[vc][ac];")
    parts.append(f"[ac]{CHAIN},loudnorm=I=-14:TP=-1:LRA=11:measured_I={j['input_i']}:"
                 f"measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
                 f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,"
                 "alimiter=level_in=1:level_out=1:limit=0.841:attack=5:release=50:level=disabled[aout]")
    script=P/f"filter-{name}.txt"; script.write_text("".join(parts))
    out=P/f"cut-{name}.mp4"
    run(["ffmpeg","-y","-hide_banner","-loglevel","error","-i",src,
         "-/filter_complex",str(script),"-map","[vc]","-map","[aout]",
         "-c:v","libx264","-crf",crf,"-preset","medium","-pix_fmt","yuv420p",
         "-c:a","aac","-b:a","192k","-movflags","+faststart",str(out)])
    ms=sum(e-s for s,e in segs)
    print(f"{out}  {ms/1000:.2f}s  {len(segs)} clips  {out.stat().st_size/1e6:.1f} MB "
          f"(measured {j['input_i']} LUFS)")

if __name__=="__main__": main()
