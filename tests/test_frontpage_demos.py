import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"


class FrontpageDemoTests(unittest.TestCase):
    def test_new_demo_cards_precede_existing_demo_card(self):
        html = HTML.read_text(encoding="utf-8")
        game_section = html.split("Game &amp; Level Design", 1)[1].split("Urban Research", 1)[0]
        self.assertLess(game_section.index('data-project="p12"'), game_section.index('data-project="p13"'))
        self.assertLess(game_section.index('data-project="p13"'), game_section.index('data-project="p11"'))

    def test_new_demos_have_playable_modal_videos_and_posters(self):
        html = HTML.read_text(encoding="utf-8")
        for project, video, poster in (
            ("p12", "temple-of-thunder-demo.mp4", "temple-of-thunder-demo-poster.jpg"),
            ("p13", "mote-demo.mp4", "mote-demo-poster.jpg"),
        ):
            with self.subTest(project=project):
                self.assertIn(f'data-project="{project}"', html)
                modal = html.split(f"{project}: `", 1)[1].split("`,", 1)[0]
                self.assertRegex(modal, r'<video[^>]*controls[^>]*playsinline[^>]*preload="metadata"')
                self.assertIn(f'./videos/{video}', modal)
                self.assertIn(f'./images/{poster}', modal)
                self.assertTrue((ROOT / "videos" / video).is_file())
                self.assertTrue((ROOT / "images" / poster).is_file())
                self.assertLess((ROOT / "videos" / video).stat().st_size, 100_000_000)


if __name__ == "__main__":
    unittest.main()
