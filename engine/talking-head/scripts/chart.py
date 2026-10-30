#!/usr/bin/env python3
"""Render a REAL matplotlib chart into a talking-head project's assets/ and register it in meta.json.

Usage:
  chart.py <project_dir> <name> --kind bar|hbar|line --x "a,b,c" --y "1,2,3"
           [--y2 "4,5,6" --labels "before,after"] [--title T] [--ylabel L] [--xlabel L]
           [--source "arXiv 2608.11095"] [--highlight 2] [--unit %] [--w 1560] [--h 1000]

Why the defaults are left alone: a chart that looks like a notebook figure (DejaVu Sans, the
#1f77b4 / #ff7f0e cycle, plain spines and ticks, white ground) reads as measured data, not as
a designed graphic. Only the type is scaled so it stays legible inside a 1080-wide frame.
Numbers must be real and the source named; a chart is a proof object, never decoration.
"""
import json, os, sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def nums(s):
    return [float(v) for v in s.split(",")] if s else None


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    proj, name = sys.argv[1], sys.argv[2]
    kind = arg("--kind", "bar"); x = arg("--x", "").split(","); y = nums(arg("--y")); y2 = nums(arg("--y2"))
    labels = (arg("--labels") or "").split(",") if arg("--labels") else None
    unit = arg("--unit", ""); hl = arg("--highlight"); hl = int(hl) if hl is not None else None
    w, h = int(arg("--w", 1560)), int(arg("--h", 1000)); dpi = 200

    plt.rcParams.update({"font.size": 15, "axes.titlesize": 19, "axes.titleweight": "bold",
                         "axes.labelsize": 15, "xtick.labelsize": 14, "ytick.labelsize": 14, "legend.fontsize": 14})
    fig, ax = plt.subplots(figsize=(w / dpi, h / dpi), dpi=dpi)
    c0, c1 = "#1f77b4", "#ff7f0e"
    fmt = (lambda v: f"{v:g}{unit}")

    if kind in ("bar", "hbar"):
        if y2 is not None:
            idx = range(len(x)); bw = 0.38
            draw = ax.barh if kind == "hbar" else ax.bar
            b1 = draw([i - bw / 2 for i in idx], y, bw, label=(labels or ["", ""])[0], color=c0)
            b2 = draw([i + bw / 2 for i in idx], y2, bw, label=(labels or ["", ""])[1], color=c1)
            (ax.set_yticks if kind == "hbar" else ax.set_xticks)(list(idx), x)
            ax.bar_label(b1, labels=[fmt(v) for v in y], padding=3); ax.bar_label(b2, labels=[fmt(v) for v in y2], padding=3)
            ax.legend(frameon=False)
        else:
            colors = [c1 if hl is not None and i == hl else c0 for i in range(len(x))]
            bars = (ax.barh if kind == "hbar" else ax.bar)(x, y, color=colors)
            ax.bar_label(bars, labels=[fmt(v) for v in y], padding=3)
        if kind == "hbar":
            ax.invert_yaxis()
    else:
        ax.plot(x, y, marker="o", color=c0, label=(labels or [None])[0])
        if y2 is not None:
            ax.plot(x, y2, marker="o", color=c1, label=(labels or [None, None])[1])
        if labels:
            ax.legend(frameon=False)
        ax.grid(True, alpha=0.3)

    if arg("--title"): ax.set_title(arg("--title"), loc="left")
    if arg("--ylabel"): ax.set_ylabel(arg("--ylabel"))
    if arg("--xlabel"): ax.set_xlabel(arg("--xlabel"))
    if arg("--source"):
        fig.text(0.99, 0.01, f"Source: {arg('--source')}", ha="right", va="bottom", fontsize=11, color="#666666")
    ax.margins(y=0.18 if kind == "bar" else 0.08)
    fig.tight_layout(rect=(0, 0.03, 1, 1))

    assets = os.path.join(proj, "assets"); os.makedirs(assets, exist_ok=True)
    out = os.path.join(assets, f"{name}.png"); fig.savefig(out, dpi=dpi, facecolor="white")
    meta_p = os.path.join(assets, "meta.json")
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    meta[name] = {"w": w, "h": h, "kind": "chart", "source": arg("--source", "")}
    json.dump(meta, open(meta_p, "w"), indent=1)
    print(out, f"{w}x{h}")


if __name__ == "__main__":
    main()
