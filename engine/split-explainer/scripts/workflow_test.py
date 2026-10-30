import json
import tempfile
import unittest
from pathlib import Path

from workflow import selected_last_word


class FinalSelectedWordTest(unittest.TestCase):
    def check_tail(self, words, start, end, intended_end=None, removed=()):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            (project / 'words.json').write_text(''.join(json.dumps(w) + '\n' for w in words))
            clip = {'id': 82, 'keep': True}
            if intended_end is not None:
                clip['wordEnd'] = intended_end
            (project / 'cuts.json').write_text(json.dumps({'clips': [clip]}))
            return selected_last_word(project, [{'id': 82, 'srcInMs': start, 'srcOutMs': end}], removed_words=removed)

    def test_following_discarded_take_does_not_replace_complete_final_word(self):
        words = [{'start': 666626, 'end': 667286, 'text': 'process.'},
                 {'start': 667926, 'end': 668466, 'text': 'Comment'}]
        self.assertEqual(self.check_tail(words, 664360, 667467, 667286), ('process.', 667286, 181))

    def test_word_crossing_out_point_still_fails(self):
        words = [{'start': 900, 'end': 1250, 'text': 'process.'}]
        self.assertEqual(self.check_tail(words, 800, 1050, 1250), ('process.', 1250, -200))

    def test_wholly_omitted_declared_final_word_still_fails(self):
        words = [{'start': 700, 'end': 850, 'text': 'exact'},
                 {'start': 1300, 'end': 1600, 'text': 'process.'}]
        self.assertEqual(self.check_tail(words, 650, 1000, 1600), ('process.', 1600, -600))

    def test_reviewed_word_removal_is_respected(self):
        words = [{'start': 700, 'end': 900, 'text': 'done.'},
                 {'start': 1100, 'end': 1300, 'text': 'um'}]
        self.assertEqual(self.check_tail(words, 650, 1400, 1300, (1,)), ('done.', 900, 500))

    def test_overlap_detection_does_not_require_cut_metadata(self):
        words = [{'start': 700, 'end': 1250, 'text': 'process.'},
                 {'start': 1350, 'end': 1600, 'text': 'Comment'}]
        self.assertEqual(self.check_tail(words, 800, 1100), ('process.', 1250, -150))


if __name__ == '__main__':
    unittest.main()
