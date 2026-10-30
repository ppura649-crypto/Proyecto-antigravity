#!/usr/bin/env python3
"""Face geometry for a talking-head frame where there is no macOS Vision (Windows, Linux).

The same contract as measure_face.swift, so measure_face.py reads either one:
  measure_face_cv.py <image.png> [...]  -> one JSON line per image, fractions of H/W, origin TOP-LEFT
    {"file":..., "w":.., "h":.., "face":{"top":..,"bottom":..,"left":..,"right":..},
     "eyes":y, "nose":y, "mouth":y, "chin":y, "confidence":..}

The detector is OpenCV's YuNet (75k parameters, MIT, the .onnx beside this file). It gives a box and
five points: two eyes, the nose tip, two mouth corners. The speaker is the largest face in the frame.
The chin is the bottom of the box and the nose is the tip. YuNet's box is tighter than Vision's:
measured on nine frames of three videos it starts 0.14 of its height higher and is 0.10 of its width
narrower on each side, so the box is moved to where Vision would put it and every later stage reads
the same numbers on either machine (eyes and chin then agree within 0.1% of the frame height).
"""
import json, sys
from pathlib import Path

import cv2

MODEL = Path(__file__).resolve().parent / "face_detection_yunet_2023mar.onnx"


def measure(path):
    img = cv2.imread(path)
    if img is None:
        return {"file": path, "error": "cannot read"}
    h, w = img.shape[:2]
    det = cv2.FaceDetectorYN.create(str(MODEL), "", (w, h), score_threshold=0.7)
    det.setInputSize((w, h))
    _, faces = det.detect(img)
    if faces is None or not len(faces):
        return {"file": path, "w": w, "h": h, "error": "no face"}
    f = max(faces, key=lambda r: r[2] * r[3])
    x, y, bw, bh = (float(v) for v in f[:4])
    eyes = (float(f[5]) + float(f[7])) / 2 / h
    tip = float(f[9]) / h
    mouth = (float(f[11]) + float(f[13])) / 2 / h
    r = lambda v: round(min(1.0, max(0.0, v)), 4)
    return {"file": path, "w": w, "h": h,
            "face": {"top": r((y + 0.14 * bh) / h), "bottom": r((y + bh) / h),
                     "left": r((x - 0.10 * bw) / w), "right": r((x + 1.10 * bw) / w)},
            "eyes": r(eyes), "nose": r(tip), "mouth": r(mouth), "chin": r((y + bh) / h),
            "confidence": round(float(f[14]), 3)}


for p in sys.argv[1:]:
    print(json.dumps(measure(p)))
