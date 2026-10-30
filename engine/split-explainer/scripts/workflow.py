"""Format adapter. The copied cut algorithms remain unchanged."""
import json
import subprocess
import sys
from pathlib import Path

def steps(project, before=None):
    here=Path(__file__).resolve()
    candidates=[here.parents[2]/'scripts/steps.mjs',here.parents[3]/'scripts/split-explainer/steps.mjs']
    script=next((p for p in candidates if p.is_file()),None)
    if script is None: raise SystemExit('Split Explainer steps are missing.')
    args=['node',str(script),str(project),'--quiet']
    if before: args+=['--before',before]
    subprocess.run(args,check=True)


def selected_last_word(project, segments, air_ms=150, removed_words=()):
    """Protect the selected phrase's tail without looking into an unrelated next take.

    Overlapping words include a word severed by either boundary. The selected clip's
    declared wordEnd also catches a final word omitted completely by an early out-point.
    No transcription bounds or cut data are changed to make this check pass.
    """
    words = [json.loads(line) for line in (project / 'words.json').read_text().splitlines() if line.strip()]
    last = segments[-1]
    declared_end = last['srcOutMs']
    cuts = project / 'cuts.json'
    if cuts.is_file():
        selected = next((clip for clip in json.loads(cuts.read_text())['clips']
                         if clip['id'] == last['id'] and clip.get('keep')), None)
        if selected is not None and selected.get('wordEnd') is not None:
            declared_end = max(declared_end, selected['wordEnd'])
    inside = [word for index, word in enumerate(words)
              if index not in removed_words and word['end'] > last['srcInMs']
              and word['start'] < declared_end]
    if not inside:
        return None, None, None
    word = max(inside, key=lambda item: item['end'])
    return word['text'], word['end'], last['srcOutMs'] - word['end']


def verify_selected_cut(project):
    import verify_cut
    original_check, original_args = verify_cut.check_last_word, sys.argv
    try:
        verify_cut.check_last_word = selected_last_word
        sys.argv = [str(Path(verify_cut.__file__)), str(project)]
        return verify_cut.main()
    finally:
        verify_cut.check_last_word, sys.argv = original_check, original_args


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] != 'verify-cut':
        sys.exit('usage: workflow.py verify-cut <project>')
    sys.exit(verify_selected_cut(Path(sys.argv[2])))
