"""Screenshot every slide of the explorable and report any console errors.

Usage:
    python docs/explorable/shoot.py                 # every slide, desktop
    python docs/explorable/shoot.py ask same        # only these decks
    python docs/explorable/shoot.py --phone         # 400px wide
    python docs/explorable/shoot.py --full          # full page, not one viewport

Writes PNGs to docs/explorable/_shots/ (gitignored) and prints a summary of
console errors, page errors, and any slide whose content overflows the
viewport by more than a little.
"""

import os
import sys
import shutil
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = "file:///" + os.path.join(HERE, "index.html").replace("\\", "/")
OUT = os.path.join(HERE, "_shots")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    phone = "--phone" in sys.argv
    full = "--full" in sys.argv
    keep = "--keep" in sys.argv

    if os.path.isdir(OUT) and not keep:
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    width, height = (400, 860) if phone else (1440, 900)
    problems = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height},
                                device_scale_factor=2)

        errors = []
        page.on("console", lambda m: errors.append(("console." + m.type, m.text))
                if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: errors.append(("pageerror", str(e))))

        page.goto(INDEX)
        page.wait_for_timeout(400)

        decks = page.evaluate("Object.keys(EX.decks)")
        if args:
            decks = [d for d in decks if d in args]

        # walk every slide by visiting it directly, unlocking progress first so
        # gates and dots render the way a reader who got there would see them
        page.evaluate("""() => {
            var mem = {seen:{}, furthest:{}, flags:{}};
            Object.keys(EX.decks).forEach(function(id){
                var d = EX.decks[id];
                mem.furthest[id] = d.slides.length - 1;
                d.slides.forEach(function(_, i){ mem.seen[id+':'+i] = 1; });
            });
            try { localStorage.setItem('oafw.progress.v1', JSON.stringify(mem)); } catch(e) {}
        }""")

        # The hash navigations below are same-document, so EX never re-reads
        # storage and its stale in-memory copy would overwrite what we just
        # wrote. Reload once so the unlocked progress is the live state.
        page.reload()
        page.wait_for_timeout(200)

        shots = 0
        for deck in decks:
            n = page.evaluate("EX.decks['%s'].slides.length" % deck)
            for i in range(n):
                before = len(errors)
                page.goto(INDEX + "#/%s/%d" % (deck, i))
                page.wait_for_timeout(260)
                page.evaluate("window.scrollTo(0,0)")

                title = page.evaluate(
                    "EX.decks['%s'].slides[%d].title || ''" % (deck, i))

                # does the slide fit one viewport?
                overflow = page.evaluate("""() => {
                    var s = document.querySelector('.slide');
                    if (!s) return 0;
                    return Math.max(0, document.body.scrollHeight - window.innerHeight);
                }""")
                wide = page.evaluate(
                    "document.body.scrollWidth - document.documentElement.clientWidth")

                name = "%s-%d.png" % (deck, i)
                page.screenshot(path=os.path.join(OUT, name), full_page=full)
                shots += 1

                new_errs = errors[before:]
                tag = []
                if new_errs:
                    tag.append("ERRORS:%d" % len(new_errs))
                    for kind, msg in new_errs[:3]:
                        problems.append("%s/%d  %s  %s" % (deck, i, kind, msg[:160]))
                if overflow > 120:
                    tag.append("overflows %dpx" % overflow)
                    problems.append("%s/%d  overflows viewport by %dpx" % (deck, i, overflow))
                if wide > 2:
                    tag.append("H-SCROLL %dpx" % wide)
                    problems.append("%s/%d  horizontal scroll of %dpx" % (deck, i, wide))

                print("  %-22s %-34s %s" % (name, title[:34], " ".join(tag)))

        browser.close()

    print("\n%d shots -> %s" % (shots, OUT))
    if problems:
        print("\n%d problems:" % len(problems))
        for p in problems:
            print("  " + p)
    else:
        print("no console errors, no overflow, no horizontal scroll.")


if __name__ == "__main__":
    main()
