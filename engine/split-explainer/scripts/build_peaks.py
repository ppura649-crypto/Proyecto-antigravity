#!/usr/bin/env python3
"""Stage 0: levels.txt -> peaks.json, the waveform the review cards draw.

One peak per 20 ms bucket of the SOURCE audio, because the editor indexes cards by source ms.
Listed as a stage-0 output in the skill; this is it.

Usage: python3 build_peaks.py <project_dir> [--bucket 20]
"""
import json, sys
from pathlib import Path


def main():
    P = Path(sys.argv[1])
    bucket = int(dict(zip(sys.argv[2::2], sys.argv[3::2])).get("--bucket", 20))
    lev = [float(l) for l in open(P / "levels.txt") if l.strip() and not l.startswith("@")]
    peaks = [round(max(lev[i:i + bucket]), 4) for i in range(0, len(lev), bucket)]
    (P / "peaks.json").write_text(json.dumps(
        {"durationMs": len(lev), "bucketMs": bucket, "peaks": peaks}))
    print(f"peaks.json: {len(peaks)} buckets of {bucket} ms ({len(lev)/1000:.1f}s)")


if __name__ == "__main__":
    main()
