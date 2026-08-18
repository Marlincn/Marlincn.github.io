# -*- coding: utf-8 -*-
"""Insert the anti-FOUC theme script into every static HTML page under source/
(after the opening <html ...> tag). Idempotent: skips files that already carry
the marker comment. Run from the demo-mdsite (or Marlin-web) root:
    python scripts/insert_theme_script.py
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKER = "nova-theme-first-frame"

SCRIPT = (
    "<script>\n"
    "  ;(function () {\n"
    "    try {\n"
    "      var pref = null;\n"
    "      try { pref = window.localStorage.getItem('marlin-theme-pref') } catch (e) {}\n"
    "      var dark = false;\n"
    "      if (pref === 'dark' || pref === 'light') {\n"
    "        dark = pref === 'dark'\n"
    "      } else {\n"
    "        var hour = new Date().getHours()\n"
    "        dark = hour >= 18 || hour < 7\n"
    "      }\n"
    "      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')\n"
    "    } catch (e) {}\n"
    "  })()\n"
    "</script>"
)


def html_files(root):
    for dirpath, _dirs, files in os.walk(root):
        if "node_modules" in dirpath or "public" in dirpath:
            continue
        for name in files:
            if name.endswith((".html", ".htm")):
                yield os.path.join(dirpath, name)


def main():
    changed = 0
    skipped = 0
    for path in sorted(html_files(os.path.join(ROOT, "source"))):
        with io.open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        if MARKER in text:
            skipped += 1
            continue
        match = re.search(r"<html[^>]*>", text, re.IGNORECASE)
        if not match:
            print("SKIP (no html tag):", path)
            continue
        insert_at = match.end()
        block = "\n<!-- " + MARKER + " -->\n" + SCRIPT + "\n"
        text = text[:insert_at] + block + text[insert_at:]
        with io.open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        changed += 1
        print("INSERT:", os.path.relpath(path, ROOT))
    print("done: changed=%d skipped=%d" % (changed, skipped))


if __name__ == "__main__":
    main()
