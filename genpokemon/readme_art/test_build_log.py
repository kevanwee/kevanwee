import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET
import build_log as log

NOW = dt.datetime(2026, 10, 7, 15, 55, tzinfo=dt.timezone.utc)


def event(repo, when, kind='PushEvent', public=True, actor='kevanwee', **payload):
    return dict(type=kind, created_at=when, repo=dict(name=repo), public=public,
                actor=dict(login=actor), payload=payload)


class DialogueTests(unittest.TestCase):
    def test_other_repositories_appear_newest_first_even_when_input_is_unsorted(self):
        lines = log.lines_from([
            event('kevanwee/sample', '2026-10-07T09:00:00Z'),
            event('kevanwee/elsewhere', '2026-10-07T15:40:00Z'),
            event('kevanwee/sample', '2026-10-07T15:50:00Z'),
        ], NOW)
        self.assertEqual(lines[0]['when'].hour, 15)
        self.assertEqual(lines[0]['when'].minute, 50)
        self.assertIn(('place', 'sample'), lines[0]['parts'])
        self.assertEqual(lines[0]['n'], 2)

    def test_private_redaction_and_bot_filter_survive_frequent_refresh(self):
        lines = log.lines_from([
            event('kevanwee/secret-matter', '2026-10-07T15:50:00Z', 'PullRequestEvent',
                  public=False, action='merged', number=123, title='secret title'),
            event('kevanwee/kevanwee', '2026-10-07T15:51:00Z', actor='github-actions[bot]'),
            event('kevanwee/voracity', '2026-10-07T15:40:00Z', public=False),
        ], NOW)
        rendered = json.dumps(log.activity(lines, NOW)) + log.render(lines)
        self.assertEqual(len(lines), 2)
        for private in ['secret-matter', 'secret title', '#123', 'github-actions']:
            self.assertNotIn(private, rendered)
        self.assertIn('a hidden dungeon', rendered)
        self.assertIn('voracity', rendered)

    def test_publishing_changes_both_outputs_and_skips_unchanged_poll(self):
        events = [event('kevanwee/elsewhere', '2026-10-07T15:50:00Z')]
        with tempfile.TemporaryDirectory() as folder:
            out = Path(folder)
            self.assertTrue(log.publish(log.lines_from(events, NOW), NOW, out))
            original = (out / 'activity.json').read_bytes()
            later = NOW + dt.timedelta(minutes=5)
            self.assertFalse(log.publish(log.lines_from(events, later), later, out))
            self.assertEqual(original, (out / 'activity.json').read_bytes())
            events.append(event('kevanwee/new-work', '2026-10-07T15:59:00Z'))
            self.assertTrue(log.publish(log.lines_from(events, later), later, out))
            self.assertIn('new-work', (out / 'activity.json').read_text())
            self.assertIn('new-work', ET.parse(out / 'message-log.svg').getroot().attrib['aria-label'])


if __name__ == '__main__':
    unittest.main()
