# -*- coding: utf-8 -*-
"""Update the anti-FOUC theme first-frame script block in every static HTML
page under source/ and nova-templates/ to time-only logic (no localStorage).
Run from the demo-mdsite (or Marlin-web) root:
    python scripts/update_first_frame_script.py
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_SCRIPT = """<!-- nova-theme-first-frame -->
<script>
  ;(function () {
    try {
      var hour = new Date().getHours()
      var dark = hour >= 18 || hour < 7
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    } catch (e) {}
  })()
</script>"""

BLOCK_RE = re.compile(r"\s*<!-- nova-theme-first-frame -->\s*<script>.*?</script>", re.IGNORECASE | re.DOTALL)


def html_files(root):
    for dirpath, _dirs, files in os.walk(root):
        if "node_modules" in dirpath or "public" in dirpath:
            continue
        for name in files:
            if name.endswith((".html", ".htm")):
                yield os.path.join(dirpath, name)


def main():
    changed = 0
    for base in ("source", "nova-templates"):
        for path in sorted(html_files(os.path.join(ROOT, base))):
            with io.open(path, "r", encoding="utf-8") as fh:
                text = fh.read()
            new_text, count = BLOCK_RE.subn("\n" + NEW_SCRIPT, text)
            if count:
                with io.open(path, "w", encoding="utf-8") as fh:
                    fh.write(new_text)
                changed += count
                print("UPDATED:", os.path.relpath(path, ROOT))
    print("done: updated=%d blocks" % changed)


if __name__ == "__main__":
    main()
