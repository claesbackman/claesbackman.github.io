/* ------------------------------------------------------------------------
   ruler.js — the standing ruler.

   Every chart in this piece is a 0-100 track. This promotes one of them to
   the page furniture: a hairline rule across the top bar carrying the band
   the advice occupies and one needle at the panel average.

   The point is that it never moves. A reader pages through forty-eight
   slides and the needle sits in the same place on every one of them, which
   is the only way a null result can be felt rather than read. On the three
   decks where the benchmark is the subject, the twenty-one shares the
   formula prescribes appear underneath it, spread across a third of the
   scale, so the comparison the whole paper rests on is always in view.

   Decorative in the accessibility sense only: it repeats what the slides
   already say, so it is aria-hidden.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var el = CH.el, svg = CH.svg, lin = CH.linear;

  // The average of the twenty-one national averages, computed from the
  // responses rather than read from a rounded column.
  var PANEL = (function () {
    var s = 0, n = 0;
    D.countries.forEach(function (c) { s += P.exactMean(c.key); n++; });
    return n ? (s / n) * 100 : 0;
  })();

  // The decks where the benchmark is the subject and the comparison belongs
  // on screen.
  var SHOW_PRESCRIBED = { warranted: 1, asym: 1, incidence: 1 };

  var bar = document.createElement("div");
  bar.id = "ruler";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  function draw(deckId) {
    bar.innerHTML = "";
    var W = window.innerWidth < 700 ? 420 : 1000, H = 15, mid = 8.5;
    var s = svg(W, H, bar, { preserve: "none" });
    var x = lin(0, 100, 34, W - 46);

    // the band the advice occupies, the same one the slides shade
    el("rect", {
      x: x(D.K.bandLo * 100), y: 1.5,
      width: x(D.K.bandHi * 100) - x(D.K.bandLo * 100),
      height: H - 3, class: "rl-band"
    }, s);

    el("line", { x1: x(0), y1: mid, x2: x(100), y2: mid, class: "rl-track" }, s);
    [0, 25, 50, 75, 100].forEach(function (t) {
      el("line", { x1: x(t), y1: mid - 2.5, x2: x(t), y2: mid + 2.5, class: "rl-tick" }, s);
    });

    if (SHOW_PRESCRIBED[deckId]) {
      D.countries.forEach(function (c) {
        if (c.sigma === null || c.sigma === undefined) return;
        var v = D.merton(c.sigma, 3, D.K.premium) * 100;
        el("line", { x1: x(v), y1: mid - 4, x2: x(v), y2: mid + 4, class: "rl-ghost" }, s);
      });
    }

    el("line", { x1: x(PANEL), y1: 1, x2: x(PANEL), y2: H - 1, class: "rl-needle" }, s);
    CH.text(s, x(0) - 5, mid + 3, "0", "rl-lab", "end");
    CH.text(s, x(100) + 5, mid + 3, "100", "rl-lab", "start");
    CH.text(s, x(PANEL) + 6, mid - 3.5, PANEL.toFixed(1) + " advised", "rl-lab", "start");
  }

  function deckFromHash() {
    return (location.hash || "").replace(/^#\/?/, "").split("/")[0] || "ask";
  }

  window.addEventListener("hashchange", function () { draw(deckFromHash()); });
  window.addEventListener("resize", function () { draw(deckFromHash()); });
  draw(deckFromHash());
})();
