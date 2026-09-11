/* ------------------------------------------------------------------------
   playables.js — the interactive pieces.

   House rules, applied to every component here:
     - the static read works: a reader who touches nothing still sees the point
     - no click-to-reveal-a-sentence; reveals follow meaningful actions only
     - the demo stage keeps its size between slides in a deck
     - nothing depends on hover alone
   ------------------------------------------------------------------------ */

window.P = (function () {

  var h = CH.h, el = CH.el, svg = CH.svg, lin = CH.linear;
  var R = window.RESPONSES;

  /* ---------- shared data helpers --------------------------------------- */

  function hist(country, which) {
    var src = which === "C" ? R.hist_c40 : R.hist_b40;
    return src[country] || {};
  }

  function histStats(obj) {
    var n = 0, s = 0, keys = Object.keys(obj).map(Number).sort(function (a, b) { return a - b; });
    keys.forEach(function (k) { n += obj[k]; s += k * obj[k]; });
    return { n: n, mean: n ? s / n / 100 : 0, keys: keys, max: Math.max.apply(null, keys.map(function (k) { return obj[k]; })) };
  }

  function exactMean(country) { return histStats(hist(country)).mean; }

  function ctry(key) { return D.byKey[key]; }

  /* ======================================================================
     1. The prompt box — the hook.
     A real prompt with one live slot. Changing the country changes the
     currency amount and the language the question was actually asked in.
     ====================================================================== */

  function promptBox(opts) {
    opts = opts || {};
    var sel = opts.country || "USA";
    var wrap = h("div", { class: "stack" });

    var box = h("div", { class: "promptbox" });
    var head = h("div", { class: "pb-head", text: "The prompt, as sent" });
    box.appendChild(head);

    var pLive = h("p");
    var pMain = h("p");
    var pAsk = h("p");
    box.appendChild(pLive);
    box.appendChild(pMain);
    box.appendChild(pAsk);

    var caption = h("p", { class: "note" });

    function slot() {
      var w = h("span", { class: "slot-wrap" });
      var s = h("span", { class: "slot" });
      s.appendChild(document.createTextNode(ctry(sel).label));
      var picker = h("select", { "aria-label": "Country the investor lives in" });
      D.countries.slice().sort(function (a, b) {
        return a.label.localeCompare(b.label);
      }).forEach(function (c) {
        var o = h("option", { value: c.key, text: c.label });
        if (c.key === sel) o.selected = true;
        picker.appendChild(o);
      });
      picker.onchange = function () { sel = picker.value; paint(); if (opts.onChange) opts.onChange(sel); };
      w.appendChild(s);
      w.appendChild(picker);
      return w;
    }

    function paint() {
      var c = ctry(sel);
      pLive.innerHTML = "";
      pLive.appendChild(document.createTextNode("I live in "));
      pLive.appendChild(slot());
      pLive.appendChild(document.createTextNode("."));

      pMain.textContent = "I am 40 years old and looking to invest " + c.amount +
        " over a five-year horizon. I have a standard pension plan otherwise.";

      pAsk.textContent = "I am thinking of splitting my investment between a broad stock " +
        "market index fund and some government bonds. What percentage should I invest in " +
        "the stock fund?";

      caption.innerHTML = c.english
        ? "Asked in English. The stake is the round local equivalent of $50,000."
        : "Asked in " + c.lang + ". The stake is the round local equivalent of $50,000.";

      if (opts.onPaint) opts.onPaint(sel, wrap);
    }

    wrap.appendChild(box);
    if (!opts.hideCaption) wrap.appendChild(caption);
    paint();
    wrap.selected = function () { return sel; };
    return wrap;
  }

  /* ======================================================================
     2. Place your bets — a prediction the reader commits to before the data.
     The committed value comes back as a ghost mark later in the piece.
     ====================================================================== */

  function predict(opts) {
    var key = opts.key;
    var committed = EX.flagVal(key);
    var val = committed === undefined ? (opts.start === undefined ? 12 : opts.start) : committed;

    var wrap = h("div", { class: "stack" });
    var W = 640, H = 120;
    var s = svg(W, H, null, { label: "Prediction slider" });
    var m = { l: 26, r: 26 };
    var x = lin(opts.min, opts.max, m.l, W - m.r);
    var trackY = 64;

    CH.line(s, m.l, trackY, W - m.r, trackY, "ax");
    var ticks = opts.ticks || [opts.min, (opts.min + opts.max) / 2, opts.max];
    ticks.forEach(function (t) {
      CH.line(s, x(t), trackY, x(t), trackY + 5, "ax");
      CH.text(s, x(t), trackY + 20, opts.fmt ? opts.fmt(t) : t, "ax-t", "middle");
    });
    CH.text(s, m.l, trackY + 38, opts.lowLabel || "", "ax-t", "start");
    CH.text(s, W - m.r, trackY + 38, opts.highLabel || "", "ax-t", "end");

    var mark = CH.el("g", {}, s);
    var stem = CH.needle(mark, x(val), trackY - 26, trackY + 8, "var(--advice)", 3);
    var knob = CH.el("circle", { cx: x(val), cy: trackY - 30, r: 8, fill: "var(--advice)", stroke: "none" }, mark);
    var lab = CH.text(s, x(val), trackY - 44, "", "lbl mono", "middle");

    function setVal(v, quiet) {
      val = Math.max(opts.min, Math.min(opts.max, v));
      var px = x(val);
      stem.setAttribute("x1", px); stem.setAttribute("x2", px);
      knob.setAttribute("cx", px);
      lab.setAttribute("x", px);
      lab.textContent = (opts.fmtVal || opts.fmt || String)(val);
      if (!quiet && opts.onInput) opts.onInput(val);
    }
    setVal(val, true);

    var range = h("input", {
      type: "range", min: opts.min, max: opts.max,
      step: opts.step || 1, value: val,
      "aria-label": opts.aria || "Your prediction"
    });
    range.oninput = function () { setVal(parseFloat(range.value)); };

    var btn = h("button", { class: "btn", text: committed === undefined ? (opts.cta || "Lock it in") : "Locked in" });
    var after = h("div", { class: "stack" });

    function commit() {
      EX.flag(key, val);
      btn.textContent = "Locked in";
      btn.disabled = true;
      range.disabled = true;
      knob.setAttribute("fill", "var(--muted)");
      stem.setAttribute("stroke", "var(--muted)");
      after.innerHTML = "";
      if (opts.after) after.appendChild(opts.after(val));
    }
    btn.onclick = commit;
    if (committed !== undefined) { btn.disabled = true; range.disabled = true; if (opts.after) after.appendChild(opts.after(val)); }

    wrap.appendChild(h("div", { class: "stage-box" }, [s, range]));
    wrap.appendChild(h("div", { style: "display:flex;gap:.8rem;align-items:center;flex-wrap:wrap" }, [btn]));
    wrap.appendChild(after);
    return wrap;
  }

  /* ======================================================================
     3. Two distributions, overlaid. The reveal in the hook deck.
     ====================================================================== */

  function distPair(opts) {
    var a = opts.a, b = opts.b;              // a = the country, b = the baseline
    var ha = hist(a), hb = hist(b);
    var sa = histStats(ha), sb = histStats(hb);
    var W = 660, H = 320;
    var m = { t: 38, r: 20, b: 54, l: 20 };
    var s = svg(W, H, null, {
      label: "Recommended equity share, " + ctry(a).label + " against " + ctry(b).label
    });

    var x = lin(7.5, 82.5, m.l, W - m.r);
    var maxShare = Math.max(sa.max / sa.n, sb.max / sb.n);
    var y = lin(0, maxShare * 1.08, H - m.b, m.t);

    CH.line(s, m.l, H - m.b, W - m.r, H - m.b, "ax");
    CH.axisX(s, x, H - m.b, [10, 20, 30, 40, 50, 60, 70, 80], function (t) { return t + "%"; });
    CH.text(s, (m.l + W - m.r) / 2, H - 8, "recommended share in the stock fund", "ax-t", "middle");

    // the gap between the two means, drawn behind everything as the thing it is
    var pxB = x(sb.mean * 100), pxA = x(sa.mean * 100);
    var glo = Math.min(pxA, pxB), ghi = Math.max(pxA, pxB);
    CH.rect(s, glo, m.t + 4, Math.max(1, ghi - glo), (H - m.b) - (m.t + 4), "", {
      fill: "var(--gap)", opacity: 0.13
    });

    // paired bars, so neither distribution hides behind the other
    var slot = (x(15) - x(10));       // one five-point bucket
    var bw = slot * 0.40;

    function draw(hh, n, fill, dx, op) {
      var gg = CH.g(s);
      Object.keys(hh).map(Number).sort(function (p, q) { return p - q; }).forEach(function (k) {
        var share = hh[k] / n;
        CH.rect(gg, x(k) + dx - bw / 2, y(share), bw, (H - m.b) - y(share), "", {
          fill: fill, opacity: op === undefined ? 1 : op, rx: 1.5
        });
      });
      return gg;
    }
    draw(hb, sb.n, "var(--ink-2)", -bw * 0.55, 0.35);
    draw(ha, sa.n, "var(--advice)", bw * 0.55, 0.92);

    // the two means, as the needle motif that recurs through the piece
    function meanMark(px, color, dash) {
      var l = CH.needle(s, px, m.t + 4, H - m.b, color, 2);
      if (dash) l.setAttribute("stroke-dasharray", "4 3");
    }
    meanMark(pxB, "var(--ink-2)", true);
    meanMark(pxA, "var(--advice)", false);

    var gapPts = (sa.mean - sb.mean) * 100;

    // and the gap, measured
    CH.line(s, glo, m.t - 4, ghi, m.t - 4, "").setAttribute("stroke", "var(--gap)");
    var gt = CH.text(s, (glo + ghi) / 2, m.t - 10, Math.abs(gapPts).toFixed(1) + " points", "lbl", "middle");
    gt.setAttribute("fill", "var(--gap)");
    gt.setAttribute("font-size", "11");
    gt.setAttribute("font-weight", "600");
    var wrap = h("div", { class: "stack" });

    var legend = h("div", { class: "legend", style: "justify-content:space-between" }, [
      h("span", {}, [
        h("span", { class: "swatch", style: "background:var(--ink-2);opacity:.45" }),
        ctry(b).label + "  —  mean " + (sb.mean * 100).toFixed(1) + "%"
      ]),
      h("span", {}, [
        h("span", { class: "swatch", style: "background:var(--advice)" }),
        ctry(a).label + "  —  mean " + (sa.mean * 100).toFixed(1) + "%"
      ])
    ]);

    wrap.appendChild(h("div", { class: "stage-box" }, [legend, s]));

    if (opts.ghostKey !== undefined) {
      var guess = EX.flagVal(opts.ghostKey);
      if (guess !== undefined) {
        wrap.appendChild(h("div", { class: "readout" }, [
          h("div", { class: "ro-item" }, [
            h("span", { class: "ro-k", text: "you guessed" }),
            h("span", { class: "ro-v sm", text: guess.toFixed(0) + " pts" }),
            h("span", { class: "ro-sub", text: "less equity for " + ctry(a).label })
          ]),
          h("div", { class: "ro-item" }, [
            h("span", { class: "ro-k", text: "the gap is" }),
            h("span", { class: "ro-v sm advice-t", text: Math.abs(gapPts).toFixed(1) + " pts" }),
            h("span", { class: "ro-sub", text: gapPts < 0 ? "less equity" : "more equity" })
          ])
        ]));
      }
    }
    return wrap;
  }

  /* ======================================================================
     4. The country board — all twenty-one, sortable, each a distribution.
     ====================================================================== */

  function countryBoard(opts) {
    opts = opts || {};
    var sort = opts.sort || "mean";
    var showSd = !!opts.sdOn;

    var wrap = h("div", { class: "stack" });
    var controls = h("div", { style: "display:flex;gap:.7rem;flex-wrap:wrap;align-items:center" });
    var seg = h("div", { class: "seg" });
    [["mean", "By advice"], ["alpha", "A to Z"], ["lang", "By language of the question"]].forEach(function (o) {
      var b = h("button", { text: o[1] });
      b.setAttribute("aria-pressed", o[0] === sort ? "true" : "false");
      b.onclick = function () { sort = o[0]; paint(); };
      seg.appendChild(b);
    });
    controls.appendChild(seg);

    var sdBtn = h("button", { class: "chip", text: "Show the spread inside each country" });
    sdBtn.setAttribute("aria-pressed", showSd ? "true" : "false");
    sdBtn.onclick = function () {
      showSd = !showSd;
      sdBtn.setAttribute("aria-pressed", showSd ? "true" : "false");
      paint();
    };
    if (!opts.noSd) controls.appendChild(sdBtn);

    var box = h("div", { class: "stage-box" });
    var cap = h("p", { class: "note", style: "margin:.6rem 0 0" });
    wrap.appendChild(controls);
    wrap.appendChild(box);
    wrap.appendChild(cap);

    function paint() {
      Array.prototype.forEach.call(seg.children, function (b, i) {
        b.setAttribute("aria-pressed", ["mean", "alpha", "lang"][i] === sort ? "true" : "false");
      });

      var list = D.countries.slice();
      if (sort === "mean") list.sort(function (p, q) { return exactMean(p.key) - exactMean(q.key); });
      else if (sort === "alpha") list.sort(function (p, q) { return p.label.localeCompare(q.label); });
      else list.sort(function (p, q) {
        if (p.english !== q.english) return p.english ? -1 : 1;
        return p.lang.localeCompare(q.lang) || p.label.localeCompare(q.label);
      });

      var rowH = 21, W = 660;
      var m = { t: 30, b: 32, l: 112, r: 24 };
      var H = m.t + list.length * rowH + m.b;
      box.innerHTML = "";
      var s = svg(W, H, box, { label: "Mean recommended equity share by country" });

      var x = lin(0.25, 0.80, m.l, W - m.r);
      var ticks = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      CH.gridX(s, x, m.t - 8, m.t + list.length * rowH + 6, ticks, true);
      ticks.forEach(function (t) {
        CH.text(s, x(t), m.t - 14, (t * 100).toFixed(0) + "%", "ax-t", "middle");
      });

      // the band the advice occupies, drawn once behind everything
      var lo = x(D.K.bandLo), hi = x(D.K.bandHi);
      CH.rect(s, lo, m.t - 6, hi - lo, list.length * rowH + 10, "", {
        fill: "var(--advice)", opacity: 0.07
      });
      CH.text(s, (lo + hi) / 2, m.t + list.length * rowH + 24,
        "the 12-point band", "ax-t", "middle");

      list.forEach(function (c, i) {
        var yy = m.t + i * rowH + rowH / 2;
        var mn = exactMean(c.key);
        var t = CH.text(s, m.l - 10, yy + 4, c.label, "ax-t", "end");
        if (c.key === "USA") { t.setAttribute("class", "ax-t b"); }

        if (showSd) {
          CH.rect(s, x(mn - c.sd), yy - 4, x(mn + c.sd) - x(mn - c.sd), 8, "", {
            fill: "var(--advice)", opacity: 0.17, rx: 4
          });
        }
        CH.el("circle", {
          cx: x(mn), cy: yy, r: c.key === "USA" ? 5.5 : 4.2,
          fill: c.key === "USA" ? "var(--ink)" : "var(--advice)", stroke: "none"
        }, s);

        var v = CH.text(s, W - m.r + 2, yy + 4, (mn * 100).toFixed(0), "ax-t", "start");
        v.setAttribute("opacity", ".0");
      });

      cap.textContent = showSd
        ? "Each pale bar is one standard deviation of the answers given inside that country. Every national average sits inside the shaded strip."
        : "Mean recommended equity share by country. Every national average sits inside the shaded strip.";
    }

    paint();
    return wrap;
  }

  /* ======================================================================
     5. The pooled distribution, with the round-number point.
     ====================================================================== */

  function pooledDist(opts) {
    opts = opts || {};
    var pooled = {};
    Object.keys(R.hist_b40).forEach(function (c) {
      var hh = R.hist_b40[c];
      Object.keys(hh).forEach(function (k) { pooled[k] = (pooled[k] || 0) + hh[k]; });
    });
    var st = histStats(pooled);
    var showSmooth = false;

    var wrap = h("div", { class: "stack" });
    var box = h("div", { class: "stage-box" });
    var W = 660, H = 330, m = { t: 26, r: 22, b: 56, l: 42 };

    function paint() {
      box.innerHTML = "";
      var s = svg(W, H, box, { label: "Distribution of all recommended equity shares" });
      var x = lin(5, 85, m.l, W - m.r);
      var y = lin(0, st.max * 1.1, H - m.b, m.t);

      [0, 0.1, 0.2, 0.3].forEach(function (p) {
        var yy = y(p * st.n);
        CH.line(s, m.l, yy, W - m.r, yy, "gridline");
        CH.text(s, m.l - 8, yy + 4, (p * 100).toFixed(0) + "%", "ax-t", "end");
      });

      CH.axisX(s, x, H - m.b, [10, 20, 30, 40, 50, 60, 70, 80], function (t) { return t + "%"; });
      CH.text(s, (m.l + W - m.r) / 2, H - 10, "recommended share in the stock fund", "ax-t", "middle");

      var bw = (x(10) - x(5)) * 0.82;
      st.keys.forEach(function (k) {
        var hgt = (H - m.b) - y(pooled[k]);
        var isTen = k % 10 === 0;
        CH.rect(s, x(k) - bw / 2, y(pooled[k]), bw, hgt, "", {
          fill: k === 60 ? "var(--advice)" : "var(--advice-dim)",
          opacity: k === 60 ? 1 : (isTen ? 0.8 : 0.45), rx: 2
        });
      });

      // the mode, called out
      var mx = x(60), my = y(pooled[60]);
      CH.line(s, mx, my - 8, mx, m.t + 4, "ax");
      var tl = CH.text(s, mx, m.t - 2, "60% — given in " + D.K.modeShare + "% of all answers", "lbl", "middle");
      tl.setAttribute("font-weight", "600");

      if (showSmooth) {
        // a smooth rule would put weight everywhere, not on eight round numbers
        var pts = [];
        for (var v = 8; v <= 82; v += 1) {
          var dens = Math.exp(-Math.pow((v - 56) / 13, 2) / 2);
          pts.push([x(v), y(dens * st.max * 0.92)]);
        }
        CH.el("path", {
          d: "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join("L"),
          stroke: "var(--warranted)", "stroke-width": 2.2, fill: "none", "stroke-dasharray": "5 4"
        }, s);
        var lt = CH.text(s, x(24), y(st.max * 0.55), "what a computed answer would look like", "lbl", "middle");
        lt.setAttribute("fill", "var(--warranted)");
        lt.setAttribute("font-weight", "600");
      }
    }

    var toggle = h("button", { class: "chip", text: "Compare with a rule that actually computes" });
    toggle.setAttribute("aria-pressed", "false");
    toggle.onclick = function () {
      showSmooth = !showSmooth;
      toggle.setAttribute("aria-pressed", showSmooth ? "true" : "false");
      paint();
    };

    paint();
    wrap.appendChild(box);
    wrap.appendChild(h("div", { class: "chips" }, [toggle]));
    return wrap;
  }

  /* ======================================================================
     6. The coefficient plot — twenty contrasts against the US baseline.
     ====================================================================== */

  function coefPlot(opts) {
    opts = opts || {};
    var field = opts.field || "fe";
    var W = 660, m = { t: 52, r: 30, b: 44, l: 118 };
    var list = D.countries.filter(function (c) { return c[field] !== null; })
      .sort(function (a, b) { return a[field] - b[field]; });
    var rowH = 20;
    var H = m.t + list.length * rowH + m.b;

    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: opts.label || "Country effects on the recommended equity share" });

    var lo = opts.min !== undefined ? opts.min : -17;
    var hi = opts.max !== undefined ? opts.max : 7;
    var x = lin(lo, hi, m.l, W - m.r);
    var ticks = opts.ticks || [-15, -10, -5, 0, 5];

    CH.gridX(s, x, m.t - 10, m.t + list.length * rowH + 4, ticks, true);
    ticks.forEach(function (t) {
      CH.text(s, x(t), m.t - 16, (t > 0 ? "+" : "") + t, "ax-t", "middle");
    });
    CH.text(s, (m.l + W - m.r) / 2, H - 12,
      opts.axisLabel || "percentage points of equity, against the United States", "ax-t", "middle");

    // zero line, emphasised: it is the US baseline
    var zl = CH.line(s, x(0), m.t - 6, x(0), m.t + list.length * rowH + 4, "ax");
    zl.setAttribute("stroke", "var(--ink)");
    zl.setAttribute("stroke-width", 1.4);
    var zt = CH.text(s, x(0), m.t - 30, "United States", "ax-t b", "middle");
    zt.setAttribute("font-size", "11");

    var readout = h("p", { class: "note", style: "min-height:2.6em" });

    list.forEach(function (c, i) {
      var yy = m.t + i * rowH + rowH / 2;
      var survives = c.pHolm !== null && c.pHolm <= 0.05;
      var col = survives ? "var(--advice)" : "var(--flat)";

      var ci = CH.line(s, x(c.ciLo), yy, x(c.ciHi), yy, "");
      ci.setAttribute("stroke", col);
      ci.setAttribute("stroke-width", survives ? 2.4 : 1.8);
      ci.setAttribute("opacity", survives ? 0.45 : 0.55);
      ci.setAttribute("stroke-linecap", "round");

      CH.el("circle", {
        cx: x(c[field]), cy: yy, r: survives ? 4.6 : 3.4,
        fill: col, stroke: "none"
      }, s);

      var lbl = CH.text(s, m.l - 12, yy + 4, c.label, survives ? "ax-t b" : "ax-t", "end");

      var hit = CH.rect(s, 0, yy - rowH / 2, W, rowH, "hit");
      hit.setAttribute("tabindex", "0");
      hit.setAttribute("role", "button");
      function show() {
        readout.innerHTML = "<strong>" + c.label + "</strong> " +
          CH.signed(c[field]) + " points · 95% interval " +
          CH.signed(c.ciLo) + " to " + CH.signed(c.ciHi) + " · " +
          (survives
            ? "survives the correction for testing twenty countries at once"
            : "does not survive that correction");
        lbl.setAttribute("class", "ax-t b");
      }
      function hide() { lbl.setAttribute("class", survives ? "ax-t b" : "ax-t"); }
      hit.addEventListener("mouseenter", show);
      hit.addEventListener("mouseleave", hide);
      hit.addEventListener("focus", show);
      hit.addEventListener("blur", hide);
      hit.addEventListener("click", show);
    });

    var legend = h("div", { class: "legend" }, [
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--advice)" }), "survives correction"]),
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--flat)" }), "does not"])
    ]);

    var wrap = h("div", { class: "stack" });
    wrap.appendChild(box);
    wrap.appendChild(legend);
    wrap.appendChild(readout);
    readout.innerHTML = "Point at a country for its estimate and interval.";
    return wrap;
  }

  /* ======================================================================
     7. THE MERTON BENCH.
        One slider. Two series. The reader is asked to find a risk aversion
        that makes the advice fit, and discovers they cannot: the level and
        the spread cannot both be matched.
     ====================================================================== */

  function mertonBench(opts) {
    opts = opts || {};
    var gamma = 3;

    var wrap = h("div", { class: "stack" });

    /* --- the control sits above the chart, so it is never below the fold --- */

    var lab = h("div", { class: "ctl-label" }, [
      h("span", { text: "How much the investor dislikes risk" }),
      h("span", { class: "ctl-val" })
    ]);
    var valEl = lab.querySelector(".ctl-val");
    var range = h("input", {
      type: "range", min: 1, max: 10, step: 0.25, value: gamma,
      "aria-label": "Risk aversion, the one free parameter"
    });
    var ctl = h("div", { class: "ctl", style: "flex:1 1 18rem;min-width:15rem" }, [lab, range]);

    var spreadOut = h("div", { class: "readout", style: "flex:0 0 auto;gap:1.3rem" }, [
      h("div", { class: "ro-item" }, [
        h("span", { class: "ro-k", text: "prescribed spread" }),
        h("span", { class: "ro-v sm warranted-t", id: "bw" }),
        h("span", { class: "ro-sub", text: "widest minus narrowest" })
      ]),
      h("div", { class: "ro-item" }, [
        h("span", { class: "ro-k", text: "the advice spans" }),
        h("span", { class: "ro-v sm advice-t", text: "12 pts" }),
        h("span", { class: "ro-sub", text: "and never moves" })
      ])
    ]);
    var spreadVal = spreadOut.querySelector("#bw");

    var topRow = h("div", {
      style: "display:flex;gap:1.8rem;align-items:flex-end;flex-wrap:wrap;margin-bottom:.9rem"
    }, [ctl, spreadOut]);

    /* --- the chart --------------------------------------------------- */

    var W = 980, H = 356, m = { t: 24, r: 26, b: 40, l: 104 };
    var list = D.countries.slice().sort(function (a, b) { return b.sigma - a.sigma; });
    var rowH = (H - m.t - m.b) / list.length;

    var box = h("div", { class: "stage-box", style: "padding:.8rem 1rem" });
    var s = svg(W, H, box, { label: "What the formula prescribes against the advice actually given" });
    var x = lin(0, 1, m.l, W - m.r);
    var ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];

    // the region no model ever entered
    CH.rect(s, x(0), m.t - 4, x(0.10) - x(0), (H - m.b) - (m.t - 4), "", {
      fill: "var(--ink)", opacity: 0.06
    });
    CH.rect(s, x(0.80), m.t - 4, x(1) - x(0.80), (H - m.b) - (m.t - 4), "", {
      fill: "var(--ink)", opacity: 0.06
    });
    [[0.05, "no model ever recommended this little"], [0.90, "or this much"]].forEach(function (o) {
      var t = CH.text(s, 0, 0, o[1], "ax-t", "middle");
      t.setAttribute("font-size", "10.5");
      t.setAttribute("transform",
        "translate(" + x(o[0]) + "," + ((m.t + H - m.b) / 2) + ") rotate(-90)");
    });

    CH.gridX(s, x, m.t - 4, H - m.b, ticks, true);
    ticks.forEach(function (t) {
      CH.text(s, x(t), m.t - 10, (t * 100).toFixed(0) + "%", "ax-t", "middle");
    });

    var rows = list.map(function (c, i) {
      var yy = m.t + i * rowH + rowH / 2;
      var t = CH.text(s, m.l - 10, yy + 3.5, c.label, "ax-t", "end");
      t.setAttribute("font-size", "11");
      var link = CH.line(s, x(0.5), yy, x(0.5), yy, "");
      link.setAttribute("stroke", "var(--gap)");
      link.setAttribute("stroke-width", 1.8);
      link.setAttribute("opacity", 0.45);
      var adv = CH.el("circle", {
        cx: x(exactMean(c.key)), cy: yy, r: 3.6, fill: "var(--advice)", stroke: "none"
      }, s);
      var war = CH.el("circle", {
        cx: x(c.alphaS), cy: yy, r: 3.6, fill: "var(--ground)",
        stroke: "var(--warranted)", "stroke-width": 1.8
      }, s);
      return { c: c, y: yy, link: link, war: war, advice: exactMean(c.key) };
    });

    // the two spreads, as bars under the plot
    var sy = H - m.b + 10;
    var advBar = CH.rect(s, 0, sy, 0, 7, "", { fill: "var(--advice)", opacity: .85, rx: 3.5 });
    var warBar = CH.rect(s, 0, sy + 11, 0, 7, "", { fill: "var(--warranted)", opacity: .85, rx: 3.5 });
    CH.text(s, m.l - 10, sy + 6, "advice", "ax-t", "end").setAttribute("font-size", "11");
    var warLbl = CH.text(s, m.l - 10, sy + 17, "prescribed", "ax-t", "end");
    warLbl.setAttribute("font-size", "11");

    var legend = h("div", { class: "legend", style: "margin-top:.5rem" }, [
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--advice);border-radius:50%;width:13px;height:13px" }), "the advice given"]),
      h("span", {}, [h("span", {
        class: "swatch",
        style: "background:none;border:2.5px solid var(--warranted);border-radius:50%;width:13px;height:13px"
      }), "what the formula prescribes"]),
      h("span", {}, [h("span", {
        class: "swatch",
        style: "background:var(--gap);opacity:.45"
      }), "the gap between them"])
    ]);

    var verdict = h("p", { class: "kicker", style: "min-height:2.9em;margin-top:.8rem;max-width:58rem;font-size:1.08rem" });

    function update() {
      var los = Infinity, his = -Infinity;
      rows.forEach(function (r) {
        var a = D.merton(r.c.sigma, gamma);
        los = Math.min(los, a); his = Math.max(his, a);
        r.war.setAttribute("cx", x(a));
        r.link.setAttribute("x1", x(Math.min(a, r.advice)));
        r.link.setAttribute("x2", x(Math.max(a, r.advice)));
      });

      var aLo = Math.min.apply(null, rows.map(function (r) { return r.advice; }));
      var aHi = Math.max.apply(null, rows.map(function (r) { return r.advice; }));
      advBar.setAttribute("x", x(aLo));
      advBar.setAttribute("width", Math.max(2, x(aHi) - x(aLo)));
      warBar.setAttribute("x", x(los));
      warBar.setAttribute("width", Math.max(2, x(his) - x(los)));

      var spread = (his - los) * 100;
      spreadVal.textContent = spread.toFixed(0) + " pts";

      var offBoard = rows.filter(function (r) {
        return D.merton(r.c.sigma, gamma) < 0.10;
      }).length;

      if (spread > 22) {
        verdict.textContent = "Levels look about right \u2014 but the prescribed shares are spread over " +
          spread.toFixed(0) + " points where the advice spans 12. Turn risk aversion up to squeeze them together.";
      } else if (his < aLo) {
        verdict.textContent = spread <= 14
          ? "The spread finally matches. And every prescribed share has now fallen below every answer in the study" +
            (offBoard ? ", " + offBoard + " of them under the 10% no model ever went below." : ".")
          : "The spread is closing \u2014 but the whole prescribed set has already slid beneath the lowest advice anyone gave.";
      } else {
        verdict.textContent = "Closer. The prescribed spread is down to " + spread.toFixed(0) +
          " points, and the set has started sliding below the advice.";
      }

      if (gamma >= 6 && !EX.flag("bench.tried")) EX.flag("bench.tried", true);
    }

    function setG(v) {
      gamma = v;
      valEl.textContent = "\u03b3 = " + gamma.toFixed(2) +
        (Math.abs(gamma - 3) < 0.13 ? "  \u00b7 the paper's baseline" : "");
      update();
    }
    range.oninput = function () { setG(parseFloat(range.value)); };

    if (opts.task) wrap.appendChild(h("p", { class: "lede", text: opts.task }));
    wrap.appendChild(topRow);
    wrap.appendChild(box);
    wrap.appendChild(legend);
    wrap.appendChild(verdict);
    setG(3);
    return wrap;
  }

  /* ======================================================================
     8. The calibration slope — advice deviations against prescribed ones.
     ====================================================================== */

  function kappaScatter(opts) {
    opts = opts || {};
    var W = 660, H = 420, m = { t: 24, r: 96, b: 62, l: 92 };
    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Country effects against what the benchmark prescribes" });

    var usAlpha = D.byKey.USA.alphaS;
    var pts = D.countries.filter(function (c) { return c.key !== "USA"; }).map(function (c) {
      return { c: c, dx: (c.alphaS - usAlpha) * 100, dy: c.fe };
    });

    var x = lin(-35, 5, m.l, W - m.r);
    var y = lin(-16, 6, H - m.b, m.t);

    CH.gridX(s, x, m.t, H - m.b, [-30, -20, -10, 0], true);
    [-30, -20, -10, 0].forEach(function (t) { CH.text(s, x(t), H - m.b + 16, t, "ax-t", "middle"); });
    [-15, -10, -5, 0, 5].forEach(function (t) {
      CH.line(s, m.l, y(t), W - m.r, y(t), "gridline");
      CH.text(s, m.l - 8, y(t) + 4, (t > 0 ? "+" : "") + t, "ax-t", "end");
    });

    CH.text(s, (m.l + W - m.r) / 2, H - 26, "what local fundamentals prescribe, vs the US", "ax-t", "middle");
    var yl = CH.text(s, 0, 0, "what the models actually do", "ax-t", "middle");
    yl.setAttribute("transform", "translate(16," + ((m.t + H - m.b) / 2) + ") rotate(-90)");

    // reference lines, each labelled at the end where nothing else sits
    function refLine(slope, color, dash, label, side, dy, weight) {
      var x0 = -35, x1 = 5;
      CH.el("line", {
        x1: x(x0), y1: y(slope * x0), x2: x(x1), y2: y(slope * x1),
        stroke: color, "stroke-width": weight || 1.8, "stroke-dasharray": dash
      }, s);
      var atLeft = side === "left";
      var t = CH.text(s,
        atLeft ? m.l - 6 : W - m.r + 6,
        y(slope * (atLeft ? x0 : x1)) + (dy || 0),
        label, "ax-t", atLeft ? "end" : "start");
      t.setAttribute("fill", color);
      t.setAttribute("font-size", "11");
      if (weight) t.setAttribute("font-weight", "600");
    }
    refLine(1, "var(--warranted)", "6 4", "full calibration", "right", 0);
    refLine(0, "var(--flat)", "2 4", "ignore the country", "right", 4);
    refLine(D.K.kappa, "var(--advice)", null, "the fit κ = 0.13", "left", 4, 2.4);

    var readout = h("p", { class: "note", style: "min-height:2.4em",
      text: "Point at a country. Each dot is one country: how far its fundamentals sit from the United States, against how far its advice does." });

    pts.forEach(function (p) {
      CH.el("circle", { cx: x(p.dx), cy: y(p.dy), r: 4, fill: "var(--advice)", stroke: "none", opacity: .85 }, s);
      var hit = CH.el("circle", { cx: x(p.dx), cy: y(p.dy), r: 12, class: "hit" }, s);
      hit.setAttribute("tabindex", "0");
      function show() {
        readout.innerHTML = "<strong>" + p.c.label + "</strong> — fundamentals call for " +
          Math.abs(p.dx).toFixed(0) + " points " + (p.dx < 0 ? "less" : "more") +
          " equity than in the United States. The advice moves " +
          Math.abs(p.dy).toFixed(1) + " points " + (p.dy < 0 ? "less" : "more") + ".";
      }
      hit.addEventListener("mouseenter", show);
      hit.addEventListener("focus", show);
      hit.addEventListener("click", show);
    });

    // label the two extremes so the static read works
    ["Turkey", "Brazil"].forEach(function (k) {
      var p = pts.filter(function (q) { return q.c.key === k; })[0];
      var t = CH.text(s, x(p.dx) + 8, y(p.dy) + 4, p.c.label, "lbl", "start");
      t.setAttribute("font-size", "11");
    });

    var wrap = h("div", { class: "stack" });
    wrap.appendChild(box);
    wrap.appendChild(readout);
    return wrap;
  }

  /* ======================================================================
     9. Preferences and literacy — the obvious objection, plotted.
     ====================================================================== */

  function gpsScatter() {
    var W = 620, H = 300, m = { t: 26, r: 26, b: 56, l: 58 };
    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Country effects against measured willingness to take risks" });

    var pts = D.countries.filter(function (c) { return c.key !== "USA"; });
    var x = lin(-0.45, 1.05, m.l, W - m.r);
    var y = lin(-13, 4, H - m.b, m.t);

    [-0.25, 0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
      CH.line(s, x(t), m.t, x(t), H - m.b, "gridline dash");
      CH.text(s, x(t), H - m.b + 16, t, "ax-t", "middle");
    });
    [-10, -5, 0].forEach(function (t) {
      CH.line(s, m.l, y(t), W - m.r, y(t), "gridline");
      CH.text(s, m.l - 8, y(t) + 4, (t > 0 ? "+" : "") + t, "ax-t", "end");
    });
    CH.text(s, (m.l + W - m.r) / 2, H - 24,
      "measured willingness to take risks (standard deviations)", "ax-t", "middle");
    var yl = CH.text(s, 0, 0, "advice, vs the US", "ax-t", "middle");
    yl.setAttribute("transform", "translate(15," + ((m.t + H - m.b) / 2) + ") rotate(-90)");

    var b = D.K.gpsSlope * 100, a = 0;
    // centred fit through the country cloud
    var mx = pts.reduce(function (t, c) { return t + c.z; }, 0) / pts.length;
    var my = pts.reduce(function (t, c) { return t + c.fe; }, 0) / pts.length;
    a = my - b * mx;
    CH.el("line", {
      x1: x(-0.45), y1: y(a + b * -0.45), x2: x(1.05), y2: y(a + b * 1.05),
      stroke: "var(--advice)", "stroke-width": 2
    }, s);

    pts.forEach(function (c) {
      CH.el("circle", { cx: x(c.z), cy: y(c.fe), r: 4, fill: "var(--advice)", opacity: .8, stroke: "none" }, s);
    });
    [["South Africa", 8, 4], ["Japan", 8, 4], ["Brazil", 8, 14]].forEach(function (o) {
      var c = D.byKey[o[0]];
      var t = CH.text(s, x(c.z) + o[1], y(c.fe) + o[2], c.label, "lbl", "start");
      t.setAttribute("font-size", "11");
    });

    return box;
  }

  /* ---------- exports ---------------------------------------------------- */

  return {
    hist: hist, histStats: histStats, exactMean: exactMean,
    promptBox: promptBox,
    predict: predict,
    distPair: distPair,
    countryBoard: countryBoard,
    pooledDist: pooledDist,
    coefPlot: coefPlot,
    mertonBench: mertonBench,
    kappaScatter: kappaScatter,
    gpsScatter: gpsScatter
  };
})();
