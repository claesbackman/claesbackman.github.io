/* ------------------------------------------------------------------------
   playables-rule.js — the playables for the second half of the argument.

   Adds to the same `P` namespace as playables.js. Split into its own file
   only to keep each file readable.

   The recurring motif here is the needle: a marker on a 0-100 track that the
   reader watches either move or fail to move. It appears in every component
   below, because "the number did not change" is the thing being shown.
   ------------------------------------------------------------------------ */

(function () {

  var h = CH.h, el = CH.el, svg = CH.svg, lin = CH.linear;

  function ctry(k) { return D.byKey[k]; }

  /* ---------- a reusable 0-100 advice track ----------------------------- */

  function track(parent, W, y, m, opts) {
    opts = opts || {};
    var x = lin(0, 1, m.l, W - m.r);
    CH.line(parent, x(0), y, x(1), y, "ax").setAttribute("stroke", "var(--rule-2)");
    [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
      CH.line(parent, x(t), y - 4, x(t), y + 4, "ax");
      if (!opts.noTicks) {
        CH.text(parent, x(t), y + 19, (t * 100).toFixed(0) + "%", "ax-t", "middle");
      }
    });
    return x;
  }

  /* ======================================================================
     A. A hundred explanations.
        The top half of the screen transforms as the reader changes country.
        The bottom half does not. That is the whole slide.
     ====================================================================== */

  P.localGrid = function (opts) {
    opts = opts || {};
    var sel = opts.country || "USA";
    var version = opts.version || "B";

    var wrap = h("div", { class: "stack" });

    /* the country slot, matching the prompt box from the opening deck */
    var slotWrap = h("span", { class: "slot-wrap" });
    var slot = h("span", { class: "slot" });
    var picker = h("select", { "aria-label": "Country" });
    D.countries.slice().sort(function (a, b) { return a.label.localeCompare(b.label); })
      .forEach(function (c) {
        var o = h("option", { value: c.key, text: c.label });
        if (c.key === sel) o.selected = true;
        picker.appendChild(o);
      });
    picker.onchange = function () { sel = picker.value; paint(); };
    slotWrap.appendChild(slot);
    slotWrap.appendChild(picker);

    var line = h("p", { class: "lede", style: "max-width:none;margin:0 0 .8rem" });
    line.appendChild(document.createTextNode("Explanations written for an investor in "));
    line.appendChild(slotWrap);

    var seg = h("div", { class: "seg" });
    [["B", "Generic instruments"], ["C", "Local instruments named"]].forEach(function (o) {
      var b = h("button", { text: o[1] });
      b.setAttribute("aria-pressed", o[0] === version ? "true" : "false");
      b.onclick = function () { version = o[0]; paint(); };
      seg.appendChild(b);
    });

    /* One figure, both halves. The reader has to be able to see the dots and
       the needle at the same time or the slide makes no argument. */
    var W = 560, H = 214;
    var box = h("div", { class: "stage-box", style: "padding:.9rem 1rem" });
    var s = svg(W, H, box, { label: "Local references in the explanation, and the share it recommends" });

    var gLabel = CH.text(s, W / 2, 16, "", "lbl", "middle");
    gLabel.setAttribute("font-weight", "600");
    gLabel.setAttribute("font-size", "12.5");

    var cols = 20, gap = 24, r = 5.4;
    var gx0 = (W - (cols - 1) * gap) / 2;
    var dots = [];
    for (var i = 0; i < 100; i++) {
      dots.push(el("circle", {
        cx: gx0 + (i % cols) * gap,
        cy: 42 + Math.floor(i / cols) * gap,
        r: r, stroke: "none"
      }, s));
    }

    CH.line(s, 24, 158, W - 24, 158, "gridline");

    var tm = { l: 40, r: 40 };
    var tx = track(s, W, 186, tm, { noTicks: true });
    [0, 0.5, 1].forEach(function (t) {
      CH.text(s, tx(t), 205, (t * 100).toFixed(0) + "%", "ax-t", "middle");
    });
    D.countries.forEach(function (c) {
      var l = CH.line(s, tx(P.exactMean(c.key)), 181, tx(P.exactMean(c.key)), 191, "");
      l.setAttribute("stroke", "var(--advice)");
      l.setAttribute("opacity", 0.2);
    });
    var needle = CH.needle(s, tx(0.5), 176, 196, "var(--advice)", 3);
    var nLabel = CH.text(s, tx(0.5), 170, "", "lbl mono", "middle");
    nLabel.setAttribute("font-weight", "600");
    nLabel.setAttribute("fill", "var(--advice)");
    var tLabel = CH.text(s, 24, 172, "and the share it recommends", "ax-t", "start");
    tLabel.setAttribute("font-size", "10.5");

    var caption = h("p", { class: "note", style: "min-height:3.4em;margin:.6rem 0 0" });

    function paint() {
      Array.prototype.forEach.call(seg.children, function (b, i) {
        b.setAttribute("aria-pressed", ["B", "C"][i] === version ? "true" : "false");
      });
      var c = ctry(sel);
      slot.textContent = c.label;

      var share = DT.local[sel][version === "C" ? 1 : 0];
      var lit = Math.round(share * 100);
      dots.forEach(function (d, i) {
        d.setAttribute("fill", i < lit ? "var(--ink-2)" : "var(--rule-2)");
        d.setAttribute("opacity", i < lit ? 0.95 : 0.5);
      });
      gLabel.textContent = lit + " of every 100 explanations name something local";

      var mean = P.exactMean(sel);
      var px = tx(mean);
      needle.setAttribute("x1", px); needle.setAttribute("x2", px);
      nLabel.setAttribute("x", px);
      nLabel.textContent = (mean * 100).toFixed(1) + "%";

      caption.innerHTML = version === "C"
        ? "Switch back to generic instruments, or change the country. The dots move a great deal. The needle does not."
        : "Change the country and watch the two halves separately. The dots swing from 18 lit to 96. The needle stays inside a twelve-point band.";

      if (opts.onChange) opts.onChange(sel, version);
    }

    wrap.appendChild(line);
    wrap.appendChild(h("div", { class: "chips", style: "margin-bottom:.1rem" }, [seg]));
    wrap.appendChild(box);
    wrap.appendChild(caption);
    paint();
    return wrap;
  };

  /* ======================================================================
     B. The three dials.
        One row per treatment. Each row carries the model's needle and,
        beside it, what portfolio theory says should happen.
     ====================================================================== */

  P.dials = function (opts) {
    opts = opts || {};
    var S = D.stated;
    var state = { risk: "averse", pension: "limited", horizon: "5" };
    var lastMove = null;

    var wrap = h("div", { class: "stack" });
    var W = 900, m = { l: 40, r: 182 };

    function panel(title, sub) {
      var box = h("div", { class: "stage-box", style: "padding:1rem 1.15rem" });
      box.appendChild(h("h3", { class: "sub", style: "margin-bottom:.15rem", text: title }));
      box.appendChild(h("p", { class: "note", style: "margin:0 0 .6rem", text: sub }));
      return box;
    }

    function ctlGroup(label, options, key) {
      var g = h("div", { style: "display:flex;flex-direction:column;gap:.3rem" });
      g.appendChild(h("span", {
        style: "font-family:var(--sans);font-size:.73rem;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)",
        text: label
      }));
      var segEl = h("div", { class: "seg" });
      options.forEach(function (o) {
        var b = h("button", { text: o[1] });
        b.onclick = function () { lastMove = key; state[key] = o[0]; paint(); };
        segEl.appendChild(b);
      });
      g.appendChild(segEl);
      g._seg = segEl; g._opts = options; g._key = key;
      return g;
    }

    /* ---- panel A: the two sentences the study crossed with each other ---- */

    var boxA = panel("The crossed arm \u2014 two sentences about the investor",
      "Four real cells, one needle. Flip each control and watch how far the advice moves.");
    var sA = svg(W, 88, boxA, { label: "Recommended equity share by stated risk tolerance and pension" });
    var xA = track(sA, W, 44, m);
    /* Where a plain prompt lands, drawn in both panels so the reader can see
       what each treatment moved away from. */
    var baseA = CH.needle(sA, xA(S.reference), 30, 58, "var(--rule-2)", 2);
    baseA.setAttribute("stroke-dasharray", "2 3");
    /* In the right margin, not under the track: at 54.9% this label sat on
       top of the 50% tick. */
    var baseAT = CH.text(sA, W - m.r + 12, 60, "plain prompt, " +
      (S.reference * 100).toFixed(0) + "%", "ax-t", "start");
    baseAT.setAttribute("font-size", "10.5");
    baseAT.setAttribute("fill", "var(--muted)");
    var arrowA = el("path", { stroke: "var(--warranted)", "stroke-width": 2, fill: "none",
      "stroke-dasharray": "4 3", opacity: 0 }, sA);
    var arrowAT = CH.text(sA, W - m.r + 12, 40, "", "ax-t", "start");
    arrowAT.setAttribute("fill", "var(--warranted)");
    arrowAT.setAttribute("font-size", "11");
    var ndA = CH.needle(sA, xA(0.5), 26, 62, "var(--advice)", 3.6);
    var ndAL = CH.text(sA, xA(0.5), 18, "", "lbl mono", "middle");
    ndAL.setAttribute("fill", "var(--advice)");
    ndAL.setAttribute("font-weight", "600");

    var gRisk = ctlGroup("How she feels about losses",
      [["averse", "uncomfortable"], ["tolerant", "comfortable"]], "risk");
    var gPens = ctlGroup("What pension she expects",
      [["limited", "a small one"], ["generous", "a generous one"]], "pension");
    boxA.appendChild(h("div", {
      style: "display:flex;gap:1.8rem;flex-wrap:wrap;margin-top:.2rem"
    }, [gRisk, gPens]));

    /* ---- panel B: the horizon, a separate arm of its own ---- */

    var boxB = panel("A separate arm \u2014 how long she will wait",
      "Its own cells, with nothing said about risk or pension. The dashed marker is where theory says the answer belongs.");
    var sB = svg(W, 88, boxB, { label: "Recommended equity share by stated horizon" });
    var xB = track(sB, W, 44, m);
    var theoryB = CH.needle(sB, xB(S.reference), 20, 68, "var(--warranted)", 2);
    theoryB.setAttribute("stroke-dasharray", "4 3");
    var theoryBT = CH.text(sB, W - m.r + 12, 40, "theory: here, at every horizon", "ax-t", "start");
    theoryBT.setAttribute("fill", "var(--warranted)");
    theoryBT.setAttribute("font-size", "11");
    var ndB = CH.needle(sB, xB(S.horizon["5"]), 26, 62, "var(--advice)", 3.6);
    var ndBL = CH.text(sB, xB(S.horizon["5"]), 18, "", "lbl mono", "middle");
    ndBL.setAttribute("fill", "var(--advice)");
    ndBL.setAttribute("font-weight", "600");

    boxB.appendChild(h("div", { style: "margin-top:.2rem" }, [
      ctlGroup("How long until she needs it",
        [["1", "one year"], ["5", "five years, the default"], ["20", "twenty years"]], "horizon")
    ]));
    var gHor = boxB.lastChild.firstChild;

    var say = h("p", { class: "kicker", style: "min-height:3em;max-width:58rem;margin-top:.9rem;font-size:1.06rem" });

    function paint() {
      [gRisk, gPens, gHor].forEach(function (g) {
        Array.prototype.forEach.call(g._seg.children, function (b, i) {
          b.setAttribute("aria-pressed", g._opts[i][0] === state[g._key] ? "true" : "false");
        });
      });

      var vA = S.risk[state.risk][state.pension];
      var pxA = xA(vA);
      ndA.setAttribute("x1", pxA); ndA.setAttribute("x2", pxA);
      ndAL.setAttribute("x", pxA);
      ndAL.textContent = (vA * 100).toFixed(0) + "%";

      if (lastMove === "pension" || lastMove === "risk") {
        arrowA.setAttribute("opacity", 1);
        arrowA.setAttribute("d",
          "M" + (pxA + 10) + ",44 L" + (pxA + 74) + ",44 " +
          "M" + (pxA + 66) + ",39 L" + (pxA + 74) + ",44 L" + (pxA + 66) + ",49");
        arrowAT.textContent = lastMove === "pension"
          ? "theory: substantially higher" : "theory: higher too";
      } else {
        arrowA.setAttribute("opacity", 0);
        arrowAT.textContent = "";
      }

      var vB = S.horizon[state.horizon];
      var pxB = xB(vB);
      ndB.setAttribute("x1", pxB); ndB.setAttribute("x2", pxB);
      ndBL.setAttribute("x", pxB);
      ndBL.textContent = (vB * 100).toFixed(0) + "%";

      if (lastMove === "risk") {
        say.textContent = "You changed how she feels about losses and the advice moved " +
          D.K.betaRisk.toFixed(0) + " points. Theory agrees it should. Risk aversion is the one thing " +
          "in the formula that this sentence is about.";
      } else if (lastMove === "pension") {
        var d = (S.risk[state.risk].generous - S.risk[state.risk].limited) * 100;
        say.textContent = "You told the model she has " +
          (state.pension === "generous" ? "a generous" : "only a small") + " pension and the advice moved " +
          Math.abs(d).toFixed(1) + " of a point" + (d < 0 ? ", in the wrong direction" : "") +
          ". Theory says a promised pension is a large bond-like claim that should push the rest of the " +
          "portfolio substantially toward stocks.";
      } else if (lastMove === "horizon") {
        say.textContent = "You changed the deadline and the advice moved " +
          Math.abs((vB - S.horizon["5"]) * 100).toFixed(0) + " points. Under the textbook assumptions the " +
          "horizon does not enter the formula at all. Theory says this should have moved nothing.";
      } else {
        say.textContent = "The grey tick in each panel is where a plain prompt lands, at " +
          (S.reference * 100).toFixed(0) + "%. The top panel already sits well below it, because " +
          "it opens on the investor who says she is uncomfortable with losses. Change one thing at a time.";
      }

      if (lastMove && opts.onChange) opts.onChange(lastMove);
    }

    var legend = h("div", { class: "legend" }, [
      h("span", {}, [h("span", {
        class: "swatch",
        style: "background:var(--advice);width:4px;height:15px;border-radius:2px"
      }), "what the models do"]),
      h("span", {}, [h("span", {
        class: "swatch",
        style: "background:var(--warranted);width:4px;height:15px;border-radius:2px;opacity:.7"
      }), "what portfolio theory says should happen"])
    ]);

    wrap.appendChild(boxA);
    wrap.appendChild(boxB);
    wrap.appendChild(legend);
    wrap.appendChild(say);
    paint();
    return wrap;
  };

  /* ======================================================================
     C. The line-up. Three candidate advisors, three predicted signatures.
     ====================================================================== */

  P.lineup = function (opts) {
    opts = opts || {};
    var picked = null;

    var observed = { risk: "up", horizon: "up", pension: "flat" };
    var obsText = {
      risk: "+" + D.K.betaRisk.toFixed(0) + " pts",
      horizon: "+" + D.K.betaHorizon.toFixed(0) + " pts",
      pension: D.K.betaPensText
    };

    function sigCell(kind, match) {
      var c = h("span", { class: "sig-cell" + (match === false ? " miss" : match === true ? " hit" : "") });
      var g = svg(44, 26, null, {});
      if (kind === "up") {
        CH.el("path", {
          d: "M8,20 L36,8 M29,7 L36,8 L35,15",
          stroke: "currentColor", "stroke-width": 2.4, fill: "none"
        }, g);
      } else {
        CH.el("path", { d: "M8,14 L36,14", stroke: "currentColor", "stroke-width": 2.4 }, g);
      }
      c.appendChild(g);
      return c;
    }

    var wrap = h("div", { class: "stack" });
    var grid = h("div", { class: "lineup" });

    D.suspects.forEach(function (sp) {
      var card = h("button", { class: "suspect" });
      card.setAttribute("aria-pressed", "false");
      var misses = ["risk", "horizon", "pension"].filter(function (k) {
        return sp.sig[k] !== observed[k];
      });

      card.appendChild(h("span", { class: "suspect-name", text: sp.name }));
      card.appendChild(h("p", { class: "suspect-blurb", text: sp.blurb }));

      var sig = h("div", { class: "sig" });
      [["risk", "risk tolerance"], ["horizon", "horizon"], ["pension", "pension"]].forEach(function (o) {
        sig.appendChild(h("div", { class: "sig-row" }, [
          h("span", { class: "sig-k", text: o[1] }),
          sigCell(sp.sig[o[0]])
        ]));
      });
      card.appendChild(sig);

      var verdict = h("p", { class: "suspect-verdict" });
      card.appendChild(verdict);

      card.onclick = function () {
        picked = picked === sp.id ? null : sp.id;
        paint();
      };
      card._sp = sp; card._misses = misses; card._verdict = verdict; card._sig = sig;
      grid.appendChild(card);
    });

    var obsBar = h("div", { class: "observed" }, [
      h("span", { class: "observed-k", text: "What the models actually did" }),
      h("div", { class: "sig sig-obs" }, [["risk", "risk tolerance"], ["horizon", "horizon"], ["pension", "pension"]].map(function (o) {
        return h("div", { class: "sig-row" }, [
          h("span", { class: "sig-k", text: o[1] }),
          sigCell(observed[o[0]]),
          h("span", { class: "sig-v", text: obsText[o[0]] })
        ]);
      }))
    ]);

    var prompt = h("p", { class: "note", text: "Click an advisor to hold its signature against the data." });

    function paint() {
      Array.prototype.forEach.call(grid.children, function (card) {
        var on = picked === card._sp.id;
        card.setAttribute("aria-pressed", on ? "true" : "false");
        card.classList.toggle("open", on);
        card.classList.toggle("dim", !!picked && !on);

        Array.prototype.forEach.call(card._sig.children, function (row, i) {
          var k = ["risk", "horizon", "pension"][i];
          var cell = row.querySelector(".sig-cell");
          cell.classList.remove("miss", "hit");
          if (on) cell.classList.add(card._sp.sig[k] === observed[k] ? "hit" : "miss");
        });

        card._verdict.textContent = on ? card._sp.verdict : "";
        card._verdict.className = "suspect-verdict" +
          (on ? (card._misses.length ? " out" : " in") : "");
      });

      if (picked) {
        var sp = D.suspects.filter(function (s) { return s.id === picked; })[0];
        prompt.textContent = sp.why;
        if (opts.onPick) opts.onPick(picked);
      } else {
        prompt.textContent = "Click an advisor to hold its signature against the data.";
      }
    }

    wrap.appendChild(grid);
    wrap.appendChild(obsBar);
    wrap.appendChild(prompt);
    paint();
    return wrap;
  };

  /* ======================================================================
     D. The balance-sheet probes. One statement at a time, then all of them.
     ====================================================================== */

  P.probeBoard = function (opts) {
    opts = opts || {};
    var base = D.stated.reference;
    var active = null;
    var tried = {};

    var wrap = h("div", { class: "stack" });

    var W = 620, H = 128, m = { l: 30, r: 30 };
    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "The recommended equity share after each statement" });
    var x = track(s, W, 78, m);

    var baseN = CH.needle(s, x(base), 62, 94, "var(--flat)", 2);
    baseN.setAttribute("stroke-dasharray", "4 3");
    var baseL = CH.text(s, x(base), 110, "no statement", "ax-t", "middle");

    var arrow = CH.el("path", { stroke: "var(--warranted)", "stroke-width": 2, fill: "none",
      "stroke-dasharray": "4 3", opacity: 0 }, s);
    var arrowL = CH.text(s, 0, 34, "", "ax-t", "middle");
    arrowL.setAttribute("fill", "var(--warranted)");

    var nd = CH.needle(s, x(base), 58, 98, "var(--advice)", 3.4);
    var ndL = CH.text(s, x(base), 50, "", "lbl mono", "middle");
    ndL.setAttribute("fill", "var(--advice)");
    ndL.setAttribute("font-weight", "600");

    var statement = h("p", { class: "kicker", style: "min-height:4.2em;max-width:36rem;margin-top:.9rem" });

    function group(side, title, sub) {
      var g = h("div", { class: "probe-group" }, [
        h("span", { class: "probe-title", text: title }),
        h("span", { class: "probe-sub", text: sub })
      ]);
      D.probes.filter(function (p) { return p.side === side; }).forEach(function (p) {
        var b = h("button", { class: "chip probe", text: p.statement });
        b.setAttribute("aria-pressed", "false");
        b.onclick = function () { active = active === p.id ? null : p.id; paint(); };
        b._p = p;
        g.appendChild(b);
      });
      return g;
    }

    var groups = h("div", { class: "probe-cols" }, [
      group("exposed", "Statements that make her more exposed",
        "Portfolio theory: cut the equity share."),
      group("safe", "Statements that make her safer",
        "Portfolio theory: raise it, with equal force.")
    ]);

    function paint() {
      var all = [];
      Array.prototype.forEach.call(groups.querySelectorAll(".probe"), function (b) {
        b.setAttribute("aria-pressed", b._p.id === active ? "true" : "false");
        all.push(b);
      });

      var p = D.probes.filter(function (q) { return q.id === active; })[0];
      var v = p ? base + p.est / 100 : base;
      var px = x(v);
      nd.setAttribute("x1", px); nd.setAttribute("x2", px);
      ndL.setAttribute("x", px);
      ndL.textContent = (v * 100).toFixed(1) + "%";

      if (p) {
        tried[p.id] = 1;
        var dir = p.theory === "up" ? 1 : -1;
        var from = x(base);
        arrow.setAttribute("opacity", 1);
        arrow.setAttribute("d",
          "M" + (from + dir * 8) + ",44 L" + (from + dir * 70) + ",44 " +
          "M" + (from + dir * 62) + ",39 L" + (from + dir * 70) + ",44 L" + (from + dir * 62) + ",49");
        arrowL.setAttribute("x", from + dir * 40);
        arrowL.textContent = "theory: this way";

        statement.innerHTML = "“" + p.statement + "”<br><span style='font-size:.92rem;color:var(--muted)'>" +
          "Theory says " + (p.theory === "up" ? "raise" : "cut") + " the equity share. The models move it " +
          "<strong class='advice-t'>" + CH.signed(p.est) + " points</strong> · " + CH.pval(p.p) +
          " · " + p.scope + "</span>";
      } else {
        arrow.setAttribute("opacity", 0);
        arrowL.textContent = "";
        statement.textContent = "Hand the model one extra sentence about the investor's balance sheet, and watch where the needle goes.";
      }

      if (Object.keys(tried).length >= 4 && opts.onExplored) opts.onExplored();
    }

    wrap.appendChild(box);
    wrap.appendChild(groups);
    wrap.appendChild(statement);
    paint();
    return wrap;
  };

  /* ---------- the same seven probes, all at once ------------------------ */

  P.probeSummary = function () {
    var W = 660, m = { t: 42, r: 28, b: 44, l: 262 };
    var list = D.probes.slice().sort(function (a, b) { return a.est - b.est; });
    var rowH = 30;
    var H = m.t + list.length * rowH + m.b;

    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Effect of each balance-sheet statement" });
    var x = lin(-26, 10, m.l, W - m.r);
    var ticks = [-25, -20, -15, -10, -5, 0, 5, 10];

    CH.gridX(s, x, m.t - 8, m.t + list.length * rowH, ticks, true);
    ticks.forEach(function (t) {
      CH.text(s, x(t), m.t - 16, (t > 0 ? "+" : "") + t, "ax-t", "middle");
    });
    var zl = CH.line(s, x(0), m.t - 8, x(0), m.t + list.length * rowH, "ax");
    zl.setAttribute("stroke", "var(--ink)");

    list.forEach(function (p, i) {
      var yy = m.t + i * rowH + rowH / 2;
      // Every mark here is a model estimate, so every mark is the advice
      // accent. Exposed vs. safe is carried by the marker shape, not by
      // borrowing the colour that means "what fundamentals prescribe".
      var col = "var(--advice)";

      var ci = CH.line(s, x(p.lo), yy, x(p.hi), yy, "");
      ci.setAttribute("stroke", col);
      ci.setAttribute("stroke-width", 2.2);
      ci.setAttribute("opacity", 0.42);
      ci.setAttribute("stroke-linecap", "round");

      if (p.side === "exposed") {
        CH.rect(s, x(p.est) - 4.4, yy - 4.4, 8.8, 8.8, "", { fill: col, rx: 1.5 });
      } else {
        var d = 5.2;
        el("path", {
          d: "M" + x(p.est) + "," + (yy - d) + "L" + (x(p.est) + d) + "," + yy +
             "L" + x(p.est) + "," + (yy + d) + "L" + (x(p.est) - d) + "," + yy + "Z",
          fill: col, stroke: "none"
        }, s);
      }

      var t = CH.text(s, m.l - 12, yy + 4, p.label, "ax-t", "end");
      t.setAttribute("font-size", "11");
    });

    CH.text(s, (m.l + W - m.r) / 2, H - 12,
      "change in the recommended equity share, percentage points", "ax-t", "middle");

    var legend = h("div", { class: "legend", style: "margin-top:.6rem" }, [
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--advice)" }), "raises her exposure — theory says cut"]),
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--advice);transform:rotate(45deg)" }), "makes her safer — theory says raise"])
    ]);

    return h("div", { class: "stack" }, [box, legend]);
  };

})();
