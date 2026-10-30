#!/usr/bin/env python3
"""Review the contents of a cut, then apply source-time removals to audio AND picture.

scan <project> [--audio] writes cleanup.json. It flags possible hesitations, repetitions,
and audible stretches outside transcript words. Flags never delete anything by themselves.
The agent reads every kept sentence, its words and waveform, checks questionable audio,
and writes keep/remove decisions with evidence. apply edits cuts.json; check verifies that
the reviewed cut is still current. All times are milliseconds on the original recording.
"""
import copy
import hashlib
import json
import math
import re
import subprocess
import sys
import wave
from pathlib import Path


HESITATIONS = {'um', 'uh', 'uhm', 'erm', 'er', 'hm', 'hmm'}
FPS = 30


def read(p):
    return json.loads(p.read_text())


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def save(p, data):
    tmp = p.with_suffix(p.suffix + '.tmp')
    tmp.write_text(json.dumps(data, indent=2) + '\n')
    tmp.replace(p)


def load(p):
    cuts = read(p / 'cuts.json')
    raw = (p / 'words.json').read_text().strip()
    try:
        words = json.loads(raw)
        if isinstance(words, dict):
            words = words.get('words', [words])
    except ValueError:
        words = [json.loads(l) for l in raw.splitlines() if l.strip()]
    if not words or any(not isinstance(w.get('start'), (int, float)) or
                        not isinstance(w.get('end'), (int, float)) or
                        not math.isfinite(w['start']) or not math.isfinite(w['end']) or
                        not 0 <= w['start'] < w['end'] or not w.get('text') for w in words):
        raise ValueError('Cleanup needs real word timestamps. Transcribe the source first.')
    levels = [float(l) for l in (p / 'levels.txt').read_text().splitlines() if l.strip() and not l.startswith('@')]
    if not levels or any(not math.isfinite(v) or v < 0 for v in levels):
        raise ValueError('The source levels are missing or invalid.')
    clips = [c for c in cuts['clips'] if c['keep']]
    if not clips:
        raise ValueError('There are no kept clips to review.')
    if any(c.get('innerCuts') for c in clips):
        raise ValueError('Expand innerCuts into real clips before cleanup.')
    if any(not 0 <= c['inMs'] < c['outMs'] <= len(levels) for c in clips):
        raise ValueError('A cut lies outside the measured recording.')
    src = Path((p / 'source.txt').read_text().strip()).resolve()
    stat = src.stat()
    basis = {n: sha(p / n) for n in ['cuts.json', 'words.json', 'levels.txt']}
    basis['audio-events.json'] = sha(p/'audio-events.json') if (p/'audio-events.json').is_file() else None
    basis['source'] = {'path': str(src), 'size': stat.st_size, 'mtimeNs': stat.st_mtime_ns}
    return cuts, words, levels, basis


def threshold(levels):
    s = sorted(levels)
    return max(s[int(len(s)*.1)] * 10**(.6), s[int(len(s)*.95)] * 10**(-1.25), 1e-6)


def overlap(a, b, x, y):
    return max(0, min(b, y) - max(a, x))


def audio_runs(levels, gate, a, b):
    runs, start = [], None
    for t in range(a, b + 1):
        hot = t < b and levels[t] >= gate
        if hot and start is None:
            start = t
        elif not hot and start is not None:
            if runs and start - runs[-1][1] <= 20:
                runs[-1][1] = t
            else:
                runs.append([start, t])
            start = None
    return [(x, y) for x, y in runs if y-x >= 40]


def previous_actions(p, basis, cuts, words):
    receipt = read(p/'cleanup-applied.json') if (p/'cleanup-applied.json').is_file() else {}
    verified = p/'cleanup-reviewed.json'
    prior = {'removedRanges': [], 'removedWords': []}
    if not verified.is_file() or sha(verified) != receipt.get('reviewHash'):
        return prior
    if any(v != receipt.get('basis', {}).get(k) for k,v in basis.items() if k != 'cuts.json'):
        return prior
    clips = [c for c in cuts['clips'] if c['keep']]
    # Carry forward only deletions that are still wholly excluded by the current cut.
    # A reintroduced moment must receive a fresh decision, never inherit an old exclusion.
    prior['removedRanges'] = [r for r in receipt.get('removedRanges', [])
                              if not any(overlap(*r,c['inMs'],c['outMs']) for c in clips)]
    prior['removedWords'] = [i for i in receipt.get('removedWords', []) if i < len(words)
                             and not any(overlap(words[i]['start'],words[i]['end'],c['inMs'],c['outMs']) for c in clips)]
    return prior


def scan(p):
    cuts, words, levels, basis = load(p)
    gate = threshold(levels)
    events, clips = [], []
    annotations = read(p/'audio-events.json').get('events', []) if (p/'audio-events.json').is_file() else []
    for c in cuts['clips']:
        if not c['keep']:
            continue
        a, b = c['inMs'], c['outMs']
        wi = [i for i, w in enumerate(words) if overlap(a, b, w['start'], w['end']) > 0]
        clips.append({'clipId': c['id'], 'fromMs': a, 'toMs': b,
                      'text': ' '.join(words[i]['text'] for i in wi), 'wordIndices': wi,
                      'reviewed': False, 'evidence': ''})
        def add(kind, x, y, indices):
            if y <= x:
                return
            events.append({'id': f"{c['id']}:{kind}:{x}:{y}", 'clipId': c['id'],
                           'kind': kind, 'fromMs': x, 'toMs': y, 'wordIndices': indices,
                           'decision': 'pending', 'reason': ''})
        for pos, i in enumerate(wi):
            w = words[i]
            norm = re.sub(r'[^\w]', '', w['text']).lower()
            if norm in HESITATIONS:
                add('hesitation', max(a, w['start']), min(b, w['end']), [i])
            elif re.fullmatch(r'\[.*\]', w['text']):
                add('annotation', max(a, w['start']), min(b, w['end']), [i])
            elif pos + 1 < len(wi):
                nxt = words[wi[pos+1]]
                if norm and norm == re.sub(r'[^\w]', '', nxt['text']).lower() and nxt['start']-w['end'] < 450:
                    add('repetition', max(a, w['start']), min(b, w['end']), [i])
        for event in annotations:
            if overlap(a,b,event['start'],event['end']):
                add('annotation', max(a,event['start']), min(b,event['end']), [])
                events[-1]['annotation'] = event['text']
        # A short sound near a word must not disappear inside the coverage check's 150 ms pad.
        # Leave 40 ms for word-boundary uncertainty; the full clip review handles the edges.
        gaps, at = [], a
        for w in sorted(words, key=lambda w: w['start']):
            x, y = max(a, int(w['start'])-40), min(b, int(w['end'])+40)
            if y <= a or x >= b:
                continue
            if x > at:
                gaps.append((at, x))
            at = max(at, y)
        if at < b:
            gaps.append((at, b))
        for x, y in gaps:
            for st, en in audio_runs(levels, gate, int(x), int(y)):
                if not any(e['clipId'] == c['id'] and e['fromMs'] <= st and en <= e['toMs'] for e in events):
                    add('untranscribed-audio', st, en, [])
    return {'version': 1, 'basis': basis, 'clips': clips, 'events': events, 'removals': [],
            'prior': previous_actions(p, basis, cuts, words)}


def require_review(p, review):
    expected = scan(p)
    if review.get('basis') != expected['basis']:
        raise ValueError('The cut, source, words or levels changed. Scan and review the current cut.')
    if review.get('prior') != expected['prior']:
        raise ValueError('The previous cleanup evidence changed. Scan the current cut again.')
    actual = review.get('clips', [])
    if len(actual) != len(expected['clips']):
        raise ValueError('Every kept clip needs a cleanup review.')
    for c, ref in zip(actual, expected['clips']):
        for k in ['clipId', 'fromMs', 'toMs', 'text', 'wordIndices']:
            if c.get(k) != ref[k]:
                raise ValueError('The clip review no longer describes this cut.')
        if c.get('reviewed') is not True or len(str(c.get('evidence', '')).split()) < 5:
            raise ValueError(f"Clip {c['clipId']} needs a contextual cleanup review with evidence.")
    actual = review.get('events', [])
    if len(actual) != len(expected['events']):
        raise ValueError('Review all detected events; do not delete candidates from the file.')
    for event, ref in zip(actual, expected['events']):
        for k in ['id', 'clipId', 'kind', 'fromMs', 'toMs', 'wordIndices', 'annotation']:
            if event.get(k) != ref.get(k):
                raise ValueError('The detected events changed. Use remove bounds to refine a cut.')
        if event.get('decision') not in ('keep', 'remove') or len(str(event.get('reason', '')).split()) < 3:
            raise ValueError(f"Review event {event['id']} in context and say why it stays or goes.")


def apply_review(p, review):
    if (p/'locks.json').exists() and 'cut' in read(p/'locks.json'):
        raise ValueError('The cut is locked. Unlock it for the requested revision first.')
    if (p/'cleanup-applied.json').exists() and (p/'cleanup.json').exists() and read(p/'cleanup.json') == review:
        try:
            check_review(p)
            return  # resuming a completed cleanup must not apply its deletions twice
        except ValueError:
            pass
    require_review(p, review)
    cuts, words, levels, _ = load(p)
    edits = []
    for e in review['events']:
        if e['decision'] == 'remove':
            bounds = e.get('remove', {})
            if set(bounds) - {'fromMs', 'toMs'}:
                raise ValueError('Only removal bounds may refine a detected event.')
            edit = {**e, **bounds}
            if edit['fromMs'] > e['fromMs'] or edit['toMs'] < e['toMs']:
                raise ValueError('The removal must cover the entire event it says it removes.')
            edits.append(edit)
    edits += review.get('removals', [])
    by_clip = {c['id']: [] for c in cuts['clips'] if c['keep']}
    allowed = set()
    for e in edits:
        cid = e.get('clipId')
        if cid not in by_clip or len(str(e.get('reason', '')).split()) < 3:
            raise ValueError('Each removal needs its kept clip and a contextual reason.')
        c = next(c for c in cuts['clips'] if c['id'] == cid)
        a, b = e.get('fromMs'), e.get('toMs')
        if not isinstance(a, (int, float)) or not isinstance(b, (int, float)) or not c['inMs'] <= a < b <= c['outMs']:
            raise ValueError('A removal must be inside its reviewed clip.')
        # Outward frame rounding is what actually removes all of a sound in render_spine.py.
        a = max(c['inMs'], round(math.floor(a*FPS/1000)*1000/FPS))
        b = min(c['outMs'], round(math.ceil(b*FPS/1000)*1000/FPS))
        selected = e.get('wordIndices', [])
        if not isinstance(selected, list) or any(type(i) is not int or not 0 <= i < len(words) for i in selected):
            raise ValueError('Name valid source word indices for words deliberately removed.')
        for i, w in enumerate(words):
            if overlap(a, b, w['start'], w['end']) and i not in selected:
                raise ValueError(f"Removal touches unapproved word {i} ({w['text']}). Refine its bounds.")
        if any(not overlap(a, b, words[i]['start'], words[i]['end']) for i in selected):
            raise ValueError('An approved word is outside its removal.')
        allowed.update(selected)
        by_clip[cid].append((a, b))
    for e in review['events']:
        if e['decision'] == 'keep' and any(overlap(a,b,e['fromMs'],e['toMs']) for a,b in by_clip[e['clipId']]):
            raise ValueError('A removal conflicts with an event marked keep. Resolve the intent first.')
    result = copy.deepcopy(cuts)
    out = []
    nid = max(c['id'] for c in cuts['clips']) + 1
    for c in cuts['clips']:
        ranges = sorted(by_clip.get(c['id'], []))
        if not ranges:
            out.append(copy.deepcopy(c))
            continue
        spans, at = [], c['inMs']
        for a, b in ranges:
            if a > at:
                spans.append((at, a))
            at = max(at, b)
        if at < c['outMs']:
            spans.append((at, c['outMs']))
        pieces = []
        for a, b in spans:
            held = [i for i, w in enumerate(words) if i not in allowed and overlap(a, b, w['start'], w['end'])]
            if not held and max(levels[int(a):int(b)], default=0) < threshold(levels):
                continue  # silence detached by the edit, never an unreviewed audible event
            if b-a < 40:
                raise ValueError('The removal leaves a tiny audible fragment. Refine the edit.')
            pc = {**c, 'inMs': a, 'outMs': b}
            if pieces:
                pc['id'] = nid
                nid += 1
            pc['text'] = ' '.join(words[i]['text'] for i in held)
            if held:
                pc['wordStart'], pc['wordEnd'] = words[held[0]]['start'], words[held[-1]]['end']
            pieces.append(pc)
        out += pieces or [{**c, 'keep': False}]
    if not any(c['keep'] for c in out):
        raise ValueError('Cleanup would remove the entire video.')
    for i in allowed:
        if any(c['keep'] and overlap(c['inMs'],c['outMs'],words[i]['start'],words[i]['end']) for c in out):
            raise ValueError(f"Removal leaves part of selected word {i}. Remove the complete unwanted word.")
    result['clips'] = out
    result.setdefault('stats', {})['keptMs'] = sum(c['outMs']-c['inMs'] for c in out if c['keep'])
    save(p/'cleanup-before.json', cuts)
    save(p/'cleanup.json', review)
    save(p/'cleanup-reviewed.json', review)
    if edits:
        save(p/'cuts.json', result)
    save(p/'cleanup-applied.json', {'version': 1, 'basis': load(p)[3], 'reviewHash': sha(p/'cleanup.json'),
                                  'removedRanges': review['prior']['removedRanges'] + [[a,b] for ranges in by_clip.values() for a,b in ranges],
                                  'removedWords': sorted(allowed | set(review['prior']['removedWords'])),
                                  'reviewedClips': [c['id'] for c in out if c['keep']]})


def check_review(p, rendered=False):
    if not (p/'cleanup-applied.json').exists():
        raise ValueError('Review and apply cleanup before locking the cut: cleanup.py scan, then apply.')
    receipt = read(p/'cleanup-applied.json')
    if receipt.get('basis') != load(p)[3] or receipt.get('reviewHash') != sha(p/'cleanup.json'):
        raise ValueError('The cut or cleanup review changed. Scan and review the current cut before locking it.')
    if rendered:
        if not (p/'master.mp4').is_file() or not (p/'spine-map.json').is_file():
            raise ValueError('Render and verify this reviewed cut before locking it.')
        actual = read(p/'spine-map.json')
        expected = [(c['id'], round(c['inMs']*FPS/1000), round(c['outMs']*FPS/1000))
                    for c in read(p/'cuts.json')['clips'] if c['keep']]
        mapped = [(c['id'], c['srcInFrame'], c['srcOutFrame']) for c in actual['segments']]
        if actual.get('fps') != FPS or expected != mapped:
            raise ValueError('The rendered cut map does not match the cleanup edits. Render this cut again.')


def snippets(p, review):
    src = review['basis']['source']['path']
    # Decode only audio. A five minute source is about 10 MB in memory, with no video copy.
    pcm = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'])
    folder = p/'checks/cleanup'
    folder.mkdir(parents=True, exist_ok=True)
    for c in review['clips']:
        a, b = max(0, c['fromMs']-400), min(len(pcm)//32, c['toMs']+400)
        path = folder/f"clip-{c['clipId']}.wav"
        with wave.open(str(path), 'wb') as wav:
            wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(16000)
            wav.writeframes(pcm[int(a)*32:int(b)*32])
        c['audio'] = {'path': str(path.relative_to(p)), 'sourceFromMs': a, 'sourceToMs': b}


def main():
    command, p = sys.argv[1], Path(sys.argv[2]).resolve()
    if command == 'scan':
        if (p/'cleanup-applied.json').exists():
            try:
                check_review(p)
                print('cleanup already applied to this cut; continue with its verification')
                return
            except ValueError:
                pass
        review = scan(p)
        old = read(p/'cleanup.json') if (p/'cleanup.json').exists() else None
        if old and old.get('basis') == review['basis']:
            review = old  # repeating scan must not erase decisions
        elif old:
            save(p/'cleanup-previous.json', old)
        if '--audio' in sys.argv:
            snippets(p, review)
        save(p/'cleanup.json', review)
        print(f"cleanup: {len(review['clips'])} clips to read, {len(review['events'])} possible edits; nothing removed")
    elif command == 'apply':
        apply_review(p, read(p/'cleanup.json'))
        print('cleanup applied to the source cut; inspect the edited sentences before locking')
    elif command == 'check':
        check_review(p)
        print('cleanup review matches this cut')
    else:
        raise ValueError('usage: cleanup.py scan|apply|check <project> [--audio]')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError) as error:
        sys.exit(str(error))
