# -*- coding: utf-8 -*-
"""Update the anti-FOUC theme first-frame script block in every static HTML
page under source/ and nova-templates/ to the final period-aware version:
legacy string prefs are IGNORED (no period info -> fall back to time rule).
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
      var raw = null;
      try { raw = window.localStorage.getItem('marlin-theme-pref') } catch (e) {}
      var now = new Date()
      var hour = now.getHours()
      var dark = hour >= 18 || hour < 7
      var mode = null
      if (raw && raw !== 'dark' && raw !== 'light') {
        try {
          var parsed = JSON.parse(raw)
          if (parsed && (parsed.mode === 'dark' || parsed.mode === 'light')) {
            var period = Number(parsed.period)
            if (period) {
              var anchor = new Date(now)
              if (hour < 7) {
                anchor.setDate(anchor.getDate() - 1)
                anchor.setHours(18, 0, 0, 0)
              } else if (hour < 18) {
                anchor.setHours(7, 0, 0, 0)
              } else {
                anchor.setHours(18, 0, 0, 0)
              }
              if (period === anchor.getTime()) mode = parsed.mode
            }
          }
        } catch (e2) {}
      }
      if (mode === 'dark' || mode === 'light') dark = mode === 'dark'
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
