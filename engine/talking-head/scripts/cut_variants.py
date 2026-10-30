#!/usr/bin/env python3
"""Build pacing variants of an approved take selection.

Every in/out point is derived from MEASURED speech energy, not from ASR bounds:
  onset = first ms where 18 of the next 40 ms sit above (room tone + 8 dB)
  end   = last  ms where 18 of the prev 40 ms sit above the same threshold
so a variant can only change how much AIR surrounds a word, never the word.

  in  = onset - lead      out = end + tail
  in-sentence pauses (quiet runs >= minRun) are removed, keeping keepHead ms
  of decay on the outgoing piece and keepTail ms of air before the next word.

Usage: python3 cut_variants.py <project_dir> <variant>   (writes cuts.<variant>.json)
       python3 cut_variants.py <project_dir> --list
"""
import json, math, sys
from pathlib import Path

VARIANTS = {
  # name        lead tail  minRun keepHead keepTail   (None minRun = keep every pause)
  "a-loose":   dict(lead=110, tail=260, minRun=None, keepHead=0,  keepTail=0),
  "b-balanced":dict(lead= 45, tail=130, minRun=240, keepHead=55, keepTail=70),
  "c-tight":   dict(lead= 25, tail= 75, minRun=170, keepHead=35, keepTail=45),
  "d-hard":    dict(lead= 12, tail= 40, minRun=120, keepHead=20, keepTail=25),
}

def db(x): return 20*math.log10(max(x,1e-9))

def load(P):
    lev=[float(l) for l in open(P/"levels.txt") if l.strip() and not l.startswith("@")]
    d=json.loads((P/"cuts.pre-tighten.json").read_text())   # take selection, untightened
    return lev,d

def room_tone(lev, kept):
    """p75 of the levels in the gaps BETWEEN kept takes = the real room floor."""
    vals=[]
    for a,b in zip(kept,kept[1:]):
        g=lev[a["outMs"]+400:b["inMs"]-400]
        if len(g)>400: vals+=g
    s=sorted(vals)
    return db(s[int(len(s)*0.75)]) if vals else -50.0

def sustained(lev, t, th, n=40, need=18):
    w=lev[max(0,t):t+n]
    return sum(1 for v in w if v>=th)>=need

def main():
    P=Path(sys.argv[1])
    if sys.argv[2]=="--list":
        for k,v in VARIANTS.items(): print(k,v)
        return
    name=sys.argv[2]; V=VARIANTS[name]
    lev,d=load(P)
    kept=[c for c in d["clips"] if c["keep"]]
    rt=room_tone(lev,kept); th=10**((rt+8)/20)

    # Search windows are bounded by the NEIGHBOUR's ASR span. Consecutive sentences
    # can sit 60 ms apart, and an unbounded search then locks onto the next clip's
    # speech and reports an end far past the real one (reference edit B clips 8/9).
    # The neighbour that bounds the search is the nearest clip in SOURCE time, kept or
    # dropped: a dropped retake fragment 60 ms after a kept sentence is still speech, and
    # an unbounded end search locks onto it (edit-c-qa 2026-09-05: "business failures."
    # ran 500 ms into the dropped "The evaluator must rep..." and check 1 failed at -9 dB).
    allc=sorted(d["clips"], key=lambda c: c["wordStart"])
    for k,c in enumerate(kept):
        ws,we=c["wordStart"],c["wordEnd"]
        j=allc.index(c)
        prv=allc[j-1] if j else None
        nxt=allc[j+1] if j+1<len(allc) else None
        lo = max(0, ws-350)
        if prv and ws-prv["wordEnd"] < 1200: lo=max(lo, prv["wordEnd"])
        hi = min(we+500, len(lev)-1)
        if nxt and nxt["wordStart"]-we < 1200: hi=min(hi, nxt["wordStart"])
        onset=None
        for t in range(lo, min(ws+900, hi)):
            if sustained(lev,t,th): onset=t; break
        if onset is None: onset=ws
        end=None
        for t in range(hi, max(lo, we-700), -1):
            if sustained(lev,max(0,t-40),th): end=t; break
        if end is None or end<onset: end=max(we,onset+50)
        c["onsetMs"],c["endMs"]=onset,end
        c["inMs"]=max(0,onset-V["lead"]); c["outMs"]=min(len(lev),end+V["tail"])

    # The last clip is not a clip like the others: nothing follows it to mask a shaved
    # tail, and it is the ask of the reel. Its out-point is the transcript's word end plus
    # air, never the energy gate (01b check 6; reference edit A / reference edit B / reference edit E all shipped
    # with the CTA's final word clipped before this was a number).
    last=kept[-1]
    last["outMs"]=max(last["outMs"], min(len(lev), last["wordEnd"]+180))

    for a,b in zip(kept,kept[1:]):          # contiguous takes: cut at the quietest ms between them
        if a["outMs"]>b["inMs"]:
            lo,hi=a["endMs"],max(a["endMs"]+1,b["onsetMs"])
            q=min(range(lo,hi), key=lambda t: lev[t]) if hi>lo else lo
            a["outMs"]=min(a["outMs"],q); b["inMs"]=max(b["inMs"],q)

    # in-sentence pauses -> real splits
    words=[json.loads(l) for l in open(P/"words.json") if l.strip()]
    out=[]; nid=max(c["id"] for c in d["clips"])+1; made=0; removed=0
    for c in d["clips"]:
        if not c["keep"] or V["minRun"] is None:
            out.append(c); continue
        seg=lev[c["inMs"]:c["outMs"]]
        runs=[]; st=None
        for i,v in enumerate(seg):
            if v<th and st is None: st=i
            elif v>=th and st is not None:
                if i-st>=V["minRun"]: runs.append((st,i))
                st=None
        spans=[]; cur=c["inMs"]
        for a,b in runs:
            frm=c["inMs"]+a+V["keepHead"]; to=c["inMs"]+b-V["keepTail"]
            if to-frm<80: continue
            if frm-cur>=250:
                spans.append((cur,frm)); removed+=to-frm; cur=to
        spans.append((cur,c["outMs"]))
        spans=[(a,b) for a,b in spans if b-a>=250]
        # a word belongs to the span holding the LARGEST share of it, never to every
        # span it merely touches: an any-overlap test duplicates the straddling word
        # into both cards (see 01-cut-and-review.md counterexamples).
        def share(w,a,b): return max(0, min(w["end"],b)-max(w["start"],a))
        for k,(a,b) in enumerate(spans):
            pc=dict(c) if k==0 else {**c,"id":nid}
            if k: nid+=1; made+=1
            pc["inMs"],pc["outMs"]=a,b
            pw=[w for w in words if share(w,a,b)>0
                and share(w,a,b)>=max(share(w,x,y) for x,y in spans)]
            if pw: pc["text"]=" ".join(w["text"] for w in pw)
            out.append(pc)
    d["clips"]=out
    kept=[c for c in d["clips"] if c["keep"]]
    total=sum(c["outMs"]-c["inMs"] for c in kept)
    d["variant"]=name; d["variantParams"]=V
    d["stats"]["keptMs"]=total
    (P/f"cuts.{name}.json").write_text(json.dumps(d,indent=1))
    print(f"{name}: {len(kept)} clips, {total/1000:.2f}s, "
          f"{made} in-sentence splits, {removed/1000:.1f}s of pauses removed "
          f"(room tone {rt:.1f} dB)")

if __name__=="__main__": main()
