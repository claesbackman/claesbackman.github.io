/* ------------------------------------------------------------------------
   engine.js — deck registry, hash routing, progress, gates, map, keyboard.

   A deck is a short run of slides about one idea. A slide is one viewport.
   Decks declare where they sit in the tree (`spine` or a `parent` deck) so
   the map can draw the tree without a separate description of it.
   ------------------------------------------------------------------------ */

window.EX = (function () {

  var decks = {};       // id -> deck
  var order = [];       // registration order
  var cur = { deck: null, i: 0 };
  var STORE = "oafw.progress.v1";

  /* ---------- progress (degrades to in-memory if storage is blocked) ---- */

  var mem = { seen: {}, furthest: {}, flags: {} };

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var p = JSON.parse(raw);
        mem.seen = p.seen || {};
        mem.furthest = p.furthest || {};
        mem.flags = p.flags || {};
      }
    } catch (e) { /* private window, cleared storage, blocked cookies */ }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(mem)); } catch (e) {}
  }

  function markSeen(deckId, i) {
    var k = deckId + ":" + i;
    if (!mem.seen[k]) { mem.seen[k] = 1; }
    if ((mem.furthest[deckId] || 0) < i) { mem.furthest[deckId] = i; }
    if (mem.furthest[deckId] === undefined) { mem.furthest[deckId] = i; }
    save();
  }

  function seen(deckId, i) { return !!mem.seen[deckId + ":" + i]; }
  function reached(deckId) { return mem.furthest[deckId] !== undefined; }
  function furthest(deckId) { return mem.furthest[deckId] === undefined ? -1 : mem.furthest[deckId]; }
  function done(deckId) {
    var d = decks[deckId];
    return d ? furthest(deckId) >= d.slides.length - 1 : false;
  }
  function flag(k, v) {
    if (v === undefined) return !!mem.flags[k];
    mem.flags[k] = v; save(); return v;
  }
  function flagVal(k) { return mem.flags[k]; }

  /* ---------- registration ---------------------------------------------- */

  function deck(id, spec) {
    spec.id = id;
    spec.slides = spec.slides || [];
    decks[id] = spec;
    order.push(id);
    return spec;
  }

  /* ---------- routing ---------------------------------------------------- */

  function parseHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return null;
    var bits = h.split("/");
    var id = bits[0];
    var i = parseInt(bits[1], 10);
    if (!decks[id]) return null;
    return { deck: id, i: isNaN(i) ? 0 : Math.max(0, Math.min(i, decks[id].slides.length - 1)) };
  }

  function go(deckId, i, opts) {
    opts = opts || {};
    if (!decks[deckId]) return;
    i = Math.max(0, Math.min(i || 0, decks[deckId].slides.length - 1));
    var target = "#/" + deckId + "/" + i;
    if (location.hash === target) { render(); return; }
    if (opts.replace) location.replace(target); else location.hash = target;
  }

  // Open a deck the way a reader expects: a finished deck resumes at its last
  // slide, an unfinished one at the furthest slide reached, a new one at 0.
  function open(deckId) {
    var f = furthest(deckId);
    go(deckId, f < 0 ? 0 : f);
  }

  function next() {
    var d = decks[cur.deck];
    if (!d) return;
    if (cur.i < d.slides.length - 1) { go(cur.deck, cur.i + 1); return; }
    var nx = typeof d.next === "function" ? d.next() : d.next;
    if (nx && decks[nx]) open(nx);
  }

  function prev() {
    if (cur.i > 0) { go(cur.deck, cur.i - 1); return; }
    var d = decks[cur.deck];
    var back = typeof d.back === "function" ? d.back() : (d.back || d.parent);
    if (back && decks[back]) {
      go(back, Math.max(0, furthest(back)));
    }
  }

  /* ---------- render ----------------------------------------------------- */

  var stage, dotsEl, prevBtn, nextBtn, deckLabel;
  var cleanups = [];

  function onCleanup(fn) { cleanups.push(fn); }

  function render() {
    var r = parseHash();
    if (!r) { go(order[0], 0, { replace: true }); return; }

    cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
    cleanups = [];

    cur = r;
    var d = decks[r.deck];
    var s = d.slides[r.i];

    markSeen(r.deck, r.i);

    deckLabel.textContent = d.title || "";
    document.title = (s.title ? s.title + " — " : "") + "One Advisor for the Whole World?";

    stage.innerHTML = "";
    var el = document.createElement("section");
    el.className = "slide" + (s.top ? " top" : "");
    el.setAttribute("aria-label", s.title || d.title || "");
    stage.appendChild(el);

    var api = {
      deck: d, index: r.i, slide: s,
      go: go, open: open, next: next, prev: prev,
      flag: flag, flagVal: flagVal, seen: seen, done: done, reached: reached,
      onCleanup: onCleanup, toast: toast,
      door: door, doors: doors, inlineDoor: inlineDoor
    };

    try {
      s.render(el, api);
    } catch (err) {
      el.innerHTML = '<p class="note">Something went wrong rendering this slide.</p>';
      if (window.console) console.error(err);
    }

    drawDots();
    window.scrollTo(0, 0);
    stage.focus({ preventScroll: true });
    checkMore();
  }

  // The rail is fixed, so on a short window it reads as the bottom of the page
  // and a reader can miss a door sitting just under it. Mark the body while
  // there is more below, and clear the mark once they have scrolled.
  function checkMore() {
    var more = (document.body.scrollHeight - window.innerHeight) > 24 &&
               (window.scrollY + window.innerHeight) < (document.body.scrollHeight - 24);
    document.body.classList.toggle("has-more", more);
  }

  window.addEventListener("scroll", function () { checkMore(); }, { passive: true });
  window.addEventListener("resize", function () { checkMore(); });

  function drawDots() {
    var d = decks[cur.deck];
    dotsEl.innerHTML = "";
    var f = furthest(cur.deck);
    d.slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.className = "dot" + (i <= f && i !== cur.i ? " seen" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === cur.i ? "true" : "false");
      b.title = (s.title || ("Slide " + (i + 1))) + (i > f ? " (not reached yet)" : "");
      b.setAttribute("aria-label", "Slide " + (i + 1) + ": " + (s.title || ""));
      // Progress dots are buttons, not decoration — but they never skip a gate.
      b.disabled = i > f;
      b.onclick = function () { go(cur.deck, i); };
      dotsEl.appendChild(b);
    });
    prevBtn.disabled = cur.i === 0 && !(decks[cur.deck].back || decks[cur.deck].parent);
    var nx = typeof d.next === "function" ? d.next() : d.next;
    var hasNext = cur.i < d.slides.length - 1 || !!(nx && decks[nx]);
    nextBtn.disabled = !hasNext;
  }

  /* ---------- doors ------------------------------------------------------ */

  function door(target, question, blurb, goLabel) {
    var b = document.createElement("button");
    b.className = "door" + (reached(target) ? " seen" : "");
    b.innerHTML =
      '<span class="door-q"></span><p class="door-b"></p><span class="door-go"></span>';
    b.querySelector(".door-q").textContent = question;
    b.querySelector(".door-b").textContent = blurb || "";
    b.querySelector(".door-go").textContent =
      goLabel || (decks[target] ? decks[target].title : "Go");
    b.onclick = function () { open(target); };
    return b;
  }

  function doors(list, two) {
    var live = list.filter(function (d) { return !!decks[d[0]]; });
    var wrap = document.createElement("div");
    wrap.className = "doors" + (two && live.length > 1 ? " two" : "");
    live.forEach(function (d) { wrap.appendChild(door(d[0], d[1], d[2], d[3])); });
    return wrap;
  }

  // A door that lives inside a sentence, on the phrase that creates the curiosity.
  // If the target deck is not registered, the phrase renders as plain text.
  function inlineDoor(target, text) {
    if (!decks[target]) return document.createTextNode(text);
    var b = document.createElement("button");
    b.className = "aside-door";
    b.textContent = text;
    b.onclick = function () { open(target); };
    return b;
  }

  /* ---------- map -------------------------------------------------------- */

  var overlay, mapBody, mapProgress;

  var mapOpener = null;

  function openMap() {
    drawMap();
    mapOpener = document.activeElement;
    overlay.hidden = false;
    // The rest of the page must not be reachable while the dialog is up.
    document.getElementById("stage").inert = true;
    var bar = document.querySelector(".topbar");
    if (bar) bar.inert = true;
    var first = overlay.querySelector(".map-node:not(:disabled)");
    if (first) first.focus();
  }
  function closeMap() {
    overlay.hidden = true;
    document.getElementById("stage").inert = false;
    var bar = document.querySelector(".topbar");
    if (bar) bar.inert = false;
    // Send focus back where it came from rather than dropping it on <body>.
    if (mapOpener && document.contains(mapOpener)) mapOpener.focus();
    mapOpener = null;
  }

  // Keep Tab inside the dialog for browsers without inert.
  function trapTab(e) {
    if (overlay.hidden || e.key !== "Tab") return;
    var f = overlay.querySelectorAll("button:not(:disabled), [href], input, select, textarea");
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function mapNode(id, n) {
    var d = decks[id];
    var row = document.createElement("div");
    row.className = "map-row" + (d.parent ? " branch" : "");

    if (d.parent) {
      var j = document.createElement("span");
      j.className = "map-join";
      row.appendChild(j);
    }

    var b = document.createElement("button");
    b.className = "map-node";
    var locked = !reached(id) && !d.alwaysOpen && !unlocked(id);
    b.disabled = locked;
    if (id === cur.deck) b.setAttribute("data-here", "1");

    var ticks = '<span class="map-bar">' + d.slides.map(function (_, i) {
      return '<span class="map-tick' + (seen(id, i) ? " on" : "") + '"></span>';
    }).join("") + "</span>";

    var miss = locked && !d.parent ? missingFor(id) : [];
    var meta = miss.length ? "after " + miss.join(" and ")
      : locked ? "not open yet"
      : done(id) ? "done"
      : reached(id) ? (furthest(id) + 1) + " of " + d.slides.length
      : "open";

    b.innerHTML =
      '<span class="map-n">' + (n || "") + "</span>" +
      '<span class="map-t"></span>' +
      ticks +
      '<span class="map-meta">' + meta + "</span>";
    b.querySelector(".map-t").textContent = d.title;
    b.onclick = function () { closeMap(); open(id); };
    row.appendChild(b);
    return row;
  }

  // A side door is reachable once the slide that offers it has been seen, so
  // the map does not spoil the tree. A spine deck is reachable once the decks
  // it argues from are finished: the map lists them all, but the ones whose
  // premises the reader has not met yet are shown dimmed rather than opened.
  // This is the diamond -- `levers` needs both eliminations, in either order.
  var REQUIRES = {
    same:      ["ask"],
    warranted: ["same"],
    words:     ["same"],
    levers:    ["warranted", "words"],
    lineup:    ["levers"],
    asym:      ["lineup"],
    incidence: ["asym"]
  };

  function unlocked(id) {
    var d = decks[id];
    if (d.opensAfter) return seen(d.opensAfter[0], d.opensAfter[1]);
    if (d.parent) return false;
    var req = REQUIRES[id];
    if (!req) return true;
    for (var i = 0; i < req.length; i++) {
      if (decks[req[i]] && !done(req[i])) return false;
    }
    return true;
  }

  // What the reader still has to finish before a locked spine deck opens.
  function missingFor(id) {
    var req = REQUIRES[id] || [];
    return req.filter(function (r) { return decks[r] && !done(r); })
              .map(function (r) { return decks[r].title; });
  }

  function drawMap() {
    mapBody.innerHTML = "";

    var spine = order.filter(function (id) { return !decks[id].parent; });
    var g1 = document.createElement("div");
    g1.className = "map-group";
    g1.textContent = "The argument";
    mapBody.appendChild(g1);

    var wrap = document.createElement("div");
    wrap.className = "map-spine";
    spine.forEach(function (id, n) {
      wrap.appendChild(mapNode(id, n + 1));
      order.forEach(function (cid) {
        if (decks[cid].parent === id && (reached(cid) || unlocked(cid))) {
          wrap.appendChild(mapNode(cid, ""));
        }
      });
    });
    mapBody.appendChild(wrap);

    var hiddenCount = order.filter(function (id) {
      return decks[id].parent && !reached(id) && !unlocked(id);
    }).length;
    if (hiddenCount) {
      var p = document.createElement("p");
      p.className = "note";
      p.style.marginTop = "1rem";
      p.textContent = hiddenCount === 1
        ? "One side path has not been offered yet. It appears here once you reach the slide that opens it."
        : hiddenCount + " side paths have not been offered yet. Each appears here once you reach the slide that opens it.";
      mapBody.appendChild(p);
    }

    var total = 0, got = 0;
    order.forEach(function (id) {
      decks[id].slides.forEach(function (_, i) { total++; if (seen(id, i)) got++; });
    });
    mapProgress.textContent = got + " of " + total + " slides seen";
  }

  /* ---------- toast ------------------------------------------------------ */

  var toastEl, toastTimer;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, ms || 2600);
  }

  /* ---------- boot ------------------------------------------------------- */

  function start() {
    stage = document.getElementById("stage");
    dotsEl = document.getElementById("dots");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    deckLabel = document.getElementById("deckLabel");
    overlay = document.getElementById("mapOverlay");
    mapBody = document.getElementById("mapBody");
    mapProgress = document.getElementById("mapProgress");
    toastEl = document.getElementById("toast");

    load();

    prevBtn.onclick = prev;
    nextBtn.onclick = next;
    document.getElementById("mapBtn").onclick = openMap;
    document.getElementById("homeBtn").onclick = function () { go(order[0], 0); };
    overlay.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) closeMap();
    });
    // Two clicks, because one click used to throw away the whole read.
    var resetBtn = document.getElementById("resetBtn");
    var resetArmed = false, resetTimer;
    resetBtn.onclick = function () {
      if (!resetArmed) {
        resetArmed = true;
        resetBtn.textContent = "Clear everything? Click again";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          resetArmed = false;
          resetBtn.textContent = "Start over";
        }, 4000);
        return;
      }
      clearTimeout(resetTimer);
      resetArmed = false;
      resetBtn.textContent = "Start over";
      mem = { seen: {}, furthest: {}, flags: {} };
      save();
      closeMap();
      go(order[0], 0);
      toast("Progress cleared.");
    };

    window.addEventListener("hashchange", render);

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      var typing = t && (t.tagName === "INPUT" || t.tagName === "SELECT" ||
        t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape") { closeMap(); return; }
      trapTab(e);
      if (!overlay.hidden) return;          // the dialog owns the keyboard
      if (typing) return;
      if (e.key === "ArrowRight") { next(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { prev(); e.preventDefault(); }
      else if (e.key === "m" || e.key === "M") {
        overlay.hidden ? openMap() : closeMap();
        e.preventDefault();
      }
    });

    render();
  }

  return {
    deck: deck, start: start, go: go, open: open, next: next, prev: prev,
    decks: decks, flag: flag, flagVal: flagVal, seen: seen, done: done,
    reached: reached, furthest: furthest, toast: toast, door: door, doors: doors
  };
})();
