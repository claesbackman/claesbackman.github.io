/* ------------------------------------------------------------------------
   playables-side.js — the playables for the side paths and for the `local`
   deck on the spine.

   models   the 273 cell means, regrouped
   local    the same design on the mortgage and inflation questions
   age      the glide path against the rule of thumb
   method   the thirteen observations the study actually has
   ------------------------------------------------------------------------ */

(function () {

  var h = CH.h, el = CH.el, svg = CH.svg, lin = CH.linear;

  /* ======================================================================
     The regrouping. 273 country-by-model cells, one dot each, laid out
     either by model or by country. Same dots both times.
     ====================================================================== */

  P.regroup = function (opts) {
    opts = opts || {};
    var mode = "model";

    var models = RESPONSES.models.slice().sort(function (a, b) {
      return meanOf("model", a) - meanOf("model", b);
    });
    var countries = D.countries.slice().sort(function (a, b) {
      return P.exactMean(a.key) - P.exactMean(b.key);
    }).map(function (c) { return c.key; });

    function meanOf(kind, key) {
      if (kind === "model") {
        var s = 0, n = 0;
        D.countries.forEach(function (c) {
          var v = RESPONSES.grid[c.key][key];
          if (v !== null && v !== undefined) { s += v; n++; }
        });
        return n ? s / n : 0;
      }
      return P.exactMean(key);
    }

    var cells = [];
    D.countries.forEach(function (c) {
      RESPONSES.models.forEach(function (m) {
        var v = RESPONSES.grid[c.key][m];
        if (v === null || v === undefined) return;
        cells.push({ country: c.key, label: c.label, model: m, v: v });
      });
    });

    var W = 700, H = 470, m = { t: 26, r: 26, b: 46, l: 138 };
    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Every country-by-model average, grouped two ways" });
    var x = lin(0.25, 0.85, m.l, W - m.r);

    [0.3, 0.4, 0.5, 0.6, 0.7, 0.8].forEach(function (t) {
      CH.line(s, x(t), m.t - 6, x(t), H - m.b, "gridline dash");
      CH.text(s, x(t), H - m.b + 16, (t * 100).toFixed(0) + "%", "ax-t", "middle");
    });
    CH.text(s, (m.l + W - m.r) / 2, H - 10,
      "average equity share recommended in that country by that model", "ax-t", "middle");

    var labelG = CH.g(s, "rowlabels");
    var dotG = CH.g(s, "dots");

    var dots = cells.map(function (c) {
      return el("circle", {
        cx: x(c.v), cy: H / 2, r: 3.2,
        fill: "var(--advice)", opacity: 0.55, stroke: "none"
      }, dotG);
    });

    var summary = h("p", { class: "kicker", style: "min-height:3em;max-width:44rem" });

    function layout(animate) {
      var rows = mode === "model" ? models : countries;
      var rowH = (H - m.t - m.b - 10) / rows.length;
      var index = {};
      rows.forEach(function (r, i) { index[r] = m.t + i * rowH + rowH / 2; });

      labelG.innerHTML = "";
      rows.forEach(function (r) {
        var t = CH.text(labelG, m.l - 10, index[r] + 3.5,
          mode === "model" ? r : D.byKey[r].label, "ax-t", "end");
        t.setAttribute("font-size", "10.5");
      });

      var targets = cells.map(function (c) {
        return index[mode === "model" ? c.model : c.country];
      });

      if (!animate) {
        dots.forEach(function (d, i) { d.setAttribute("cy", targets[i]); });
      } else {
        var from = dots.map(function (d) { return parseFloat(d.getAttribute("cy")); });
        CH.tween(520, function (u) {
          dots.forEach(function (d, i) {
            d.setAttribute("cy", from[i] + (targets[i] - from[i]) * u);
          });
        });
      }

      summary.innerHTML = mode === "model"
        ? "Grouped by <strong>which model was asked</strong>, the rows separate. Each model has its own level and holds it. Model identity accounts for <strong class='advice-t'>" + D.K.varModel + "%</strong> of all the variation here."
        : "Grouped by <strong>which country was asked about</strong>, every row looks like every other row. Country accounts for <strong class='flat-t'>" + D.K.varCountry + "%</strong>.";

      if (opts.onChange) opts.onChange(mode);
    }

    var seg = h("div", { class: "seg" });
    [["model", "Group by model"], ["country", "Group by country"]].forEach(function (o) {
      var b = h("button", { text: o[1] });
      b.onclick = function () {
        if (mode === o[0]) return;
        mode = o[0];
        Array.prototype.forEach.call(seg.children, function (bb, i) {
          bb.setAttribute("aria-pressed", ["model", "country"][i] === mode ? "true" : "false");
        });
        layout(true);
      };
      b.setAttribute("aria-pressed", o[0] === mode ? "true" : "false");
      seg.appendChild(b);
    });

    var wrap = h("div", { class: "stack" }, [
      h("div", { class: "chips" }, [seg]),
      box,
      summary,
      h("p", { class: "note", text: "Each dot is one country asked of one model, fifty answers averaged. The same 273 dots in both views — only the rows they are sorted into change." })
    ]);
    layout(false);
    return wrap;
  };

  /* ======================================================================
     The mortgage question, at the same scale as the allocation question.
     ====================================================================== */

  P.q2Plot = function () {
    var W = 680, m = { t: 52, r: 30, b: 46, l: 126 };
    var list = D.countries.filter(function (c) { return c.q2 !== null; })
      .sort(function (a, b) { return a.q2 - b.q2; });
    var rowH = 20;
    var H = m.t + list.length * rowH + m.b;

    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Country effects on the mortgage question, against the allocation question" });
    var x = lin(-31, 6, m.l, W - m.r);
    var ticks = [-30, -20, -10, 0];

    CH.gridX(s, x, m.t - 6, m.t + list.length * rowH + 4, ticks, true);
    ticks.forEach(function (t) {
      CH.text(s, x(t), m.t - 16, t, "ax-t", "middle");
    });
    var zl = CH.line(s, x(0), m.t - 6, x(0), m.t + list.length * rowH + 4, "ax");
    zl.setAttribute("stroke", "var(--ink)");
    var zt = CH.text(s, x(0), m.t - 34, "United States", "ax-t b", "middle");
    zt.setAttribute("font-size", "11");

    list.forEach(function (c, i) {
      var yy = m.t + i * rowH + rowH / 2;
      var t = CH.text(s, m.l - 12, yy + 4, c.label, "ax-t", "end");
      t.setAttribute("font-size", "11");

      // the allocation-question estimate, ghosted behind
      el("circle", {
        cx: x(c.fe), cy: yy, r: 3.4, fill: "none",
        stroke: "var(--flat)", "stroke-width": 1.4, opacity: 0.85
      }, s);

      var col = c.premise ? "var(--advice-dim)" : "var(--advice)";
      CH.line(s, x(c.fe), yy, x(c.q2), yy, "").setAttribute("stroke", "var(--rule-2)");
      el("circle", { cx: x(c.q2), cy: yy, r: 4.4, fill: col, stroke: "none" }, s);
    });

    CH.text(s, (m.l + W - m.r) / 2, H - 12,
      "percentage points against the United States", "ax-t", "middle");

    var legend = h("div", { class: "legend", style: "margin-top:.6rem" }, [
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--advice);border-radius:50%" }), "the mortgage question"]),
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--advice-dim);border-radius:50%" }), "mortgage, premise-acceptance group"]),
      h("span", {}, [h("span", { class: "swatch", style: "background:none;border:1.5px solid var(--flat);border-radius:50%" }), "the same country on the allocation question"])
    ]);

    return h("div", { class: "stack" }, [box, legend]);
  };

  /* ======================================================================
     The mortgage question with the rate taken out. One row per country,
     sorted by the prevailing mortgage rate: the gap to the United States
     with the 4% rate stated (hollow) and with no rate stated (filled).
     ====================================================================== */

  P.nonumPlot = function () {
    var W = 700, m = { t: 56, r: 26, b: 46, l: 196 };
    var list = D.nonum.rows.filter(function (r) { return r.key !== "USA"; });
    var rowH = 19;
    var H = m.t + list.length * rowH + m.b;

    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Gap to the United States on the mortgage question, with the 4% rate stated and with no rate stated", interactive: true });
    var x = lin(-32, 8, m.l, W - m.r);
    var ticks = [-30, -20, -10, 0];
    var bottom = m.t + list.length * rowH + 4;

    CH.gridX(s, x, m.t - 6, bottom, ticks, true);
    ticks.forEach(function (t) { CH.text(s, x(t), m.t - 16, t, "ax-t", "middle"); });
    var zl = CH.line(s, x(0), m.t - 6, x(0), bottom, "ax");
    zl.setAttribute("stroke", "var(--ink)");
    var zt = CH.text(s, x(0), m.t - 36, "United States", "ax-t b", "middle");
    zt.setAttribute("font-size", "11");
    var rh = CH.text(s, m.l - 12, m.t - 16, "local rate → rate assumed", "ax-t", "end");
    rh.setAttribute("font-size", "10");
    rh.setAttribute("fill", "var(--muted)");

    var readout = h("p", { class: "note", style: "min-height:3.2em", "aria-live": "polite",
      text: "Point at a country. Rows run from the lowest prevailing mortgage rate at the top to the highest at the bottom. Below the dashed line, mortgages cost more than the 4% in the prompt." });

    var marked = false;
    list.forEach(function (r, i) {
      var yy = m.t + i * rowH + rowH / 2;

      // the divider between rates below and above the prompt's 4%
      if (!marked && r.rate > 4) {
        marked = true;
        var dy = m.t + i * rowH;
        var dl = CH.line(s, 8, dy, W - m.r, dy, "gridline dash");
        dl.setAttribute("stroke", "var(--muted)");
      }

      var t = CH.text(s, m.l - 96, yy + 4, r.label, "ax-t", "end");
      t.setAttribute("font-size", "11");
      var rt = CH.text(s, m.l - 12, yy + 4, r.rate.toFixed(1) + " → " + r.assumed.toFixed(1), "ax-t mono", "end");
      rt.setAttribute("font-size", "10");
      rt.setAttribute("fill", "var(--muted)");

      var link = CH.line(s, x(r.gap4), yy, x(r.gap0), yy, "");
      link.setAttribute("stroke", "var(--rule-2)");
      link.setAttribute("stroke-width", 1.6);
      el("circle", {
        cx: x(r.gap4), cy: yy, r: 3.6, fill: "var(--ground)",
        stroke: "var(--flat)", "stroke-width": 1.5
      }, s);
      el("circle", { cx: x(r.gap0), cy: yy, r: 4.4, fill: "var(--advice)", stroke: "none" }, s);

      var hit = el("rect", { x: 0, y: yy - rowH / 2, width: W, height: rowH, class: "hit" }, s);
      hit.setAttribute("tabindex", "0");
      hit.setAttribute("role", "button");
      hit.setAttribute("aria-label", r.label);
      function fmt(v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1); }
      function show() {
        readout.innerHTML = "<strong>" + r.label + "</strong>: mortgages cost about " + r.rate.toFixed(1) +
          "% there, and the models assume " + r.assumed.toFixed(1) + "%. With 4% stated the advice sits " +
          fmt(r.gap4) + " points from the United States. With no rate stated it sits " + fmt(r.gap0) + ".";
      }
      hit.addEventListener("mouseenter", show);
      hit.addEventListener("focus", show);
      hit.addEventListener("click", show);
    });

    CH.text(s, (m.l + W - m.r) / 2, H - 12,
      "recommended share to invest, percentage points against the United States", "ax-t", "middle");

    var legend = h("div", { class: "legend", style: "margin-top:.6rem" }, [
      h("span", {}, [h("span", { class: "swatch", style: "background:none;border:1.5px solid var(--flat);border-radius:50%" }), "with the 4% rate stated"]),
      h("span", {}, [h("span", { class: "swatch", style: "background:var(--advice);border-radius:50%" }), "with no rate stated"])
    ]);

    return h("div", { class: "stack" }, [box, legend, readout]);
  };

  /* ======================================================================
     What the models ask before advising: share of responses that ask about
     each topic, as plain bars.
     ====================================================================== */

  P.askList = function () {
    var W = 620, rowH = 34, m = { t: 8, r: 56, b: 8, l: 250 };
    var list = D.elicit.topics;
    var H = m.t + list.length * rowH + m.b;
    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Share of responses that ask about each topic before advising" });
    var x = lin(0, 100, m.l, W - m.r);

    list.forEach(function (tp, i) {
      var yy = m.t + i * rowH;
      var t = CH.text(s, m.l - 12, yy + rowH / 2 + 4, tp[0], "ax-t", "end");
      t.setAttribute("font-size", "12");
      CH.rect(s, x(0), yy + 8, x(100) - x(0), rowH - 16, "", { fill: "var(--void)", stroke: "none", rx: 3 });
      CH.rect(s, x(0), yy + 8, x(tp[1]) - x(0), rowH - 16, "", { fill: "var(--advice)", stroke: "none", opacity: .9, rx: 3 });
      var n = CH.text(s, x(100) + 8, yy + rowH / 2 + 4, tp[1] + "%", "lbl mono", "start");
      n.setAttribute("font-size", "12");
      n.setAttribute("font-weight", "600");
    });

    return box;
  };

  /* ---------- what they recommend against inflation ---------------------- */

  P.q4Instruments = function () {
    var W = 660, m = { t: 34, r: 24, b: 40, l: 112 };
    var list = D.countries.slice().sort(function (a, b) { return a.q4eq - b.q4eq; });
    var rowH = 18;
    var H = m.t + list.length * rowH + m.b;

    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Primary instrument recommended against inflation, by country" });
    var x = lin(0, 100, m.l, W - m.r);

    var SEGS = [
      ["q4eq", "var(--advice)", "equities"],
      ["q4lnk", "var(--ink-2)", "inflation-linked bonds"],
      ["q4gld", "var(--muted)", "gold"],
      ["q4re", "var(--rule-2)", "real estate"]
    ];

    list.forEach(function (c, i) {
      var yy = m.t + i * rowH;
      var t = CH.text(s, m.l - 10, yy + rowH / 2 + 3.5, c.label, "ax-t", "end");
      t.setAttribute("font-size", "10.5");
      var acc = 0;
      SEGS.forEach(function (sg) {
        var v = c[sg[0]] || 0;
        if (v <= 0) return;
        CH.rect(s, x(acc), yy + 3, x(v) - x(0), rowH - 6, "", { fill: sg[1], opacity: 0.85 });
        acc += v;
      });
    });

    CH.text(s, m.l, m.t - 12, "share of answers naming each instrument first", "ax-t", "start");

    var legend = h("div", { class: "legend", style: "margin-top:.6rem" },
      SEGS.map(function (sg) {
        return h("span", {}, [h("span", { class: "swatch", style: "background:" + sg[1] }), sg[2]]);
      }));

    return h("div", { class: "stack" }, [box, legend]);
  };

  /* ======================================================================
     The glide path against the hundred-minus-age rule.
     ====================================================================== */

  P.ageRule = function () {
    var age = "40";
    var RULE = { "30": 70, "40": 60, "55": 45 };

    var W = 640, H = 300, m = { t: 48, r: 24, b: 56, l: 48 };
    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Recommended equity share at each prompted age" });
    var x = lin(5, 85, m.l, W - m.r);

    var maxShare = 0;
    ["30", "40", "55"].forEach(function (a) {
      var hh = RESPONSES.hist_by_age[a];
      var n = Object.keys(hh).reduce(function (t, k) { return t + hh[k]; }, 0);
      Object.keys(hh).forEach(function (k) { maxShare = Math.max(maxShare, hh[k] / n); });
    });
    var y = lin(0, maxShare * 1.08, H - m.b, m.t);

    [0, 0.1, 0.2, 0.3].forEach(function (t) {
      CH.line(s, m.l, y(t), W - m.r, y(t), "gridline");
      CH.text(s, m.l - 8, y(t) + 4, (t * 100).toFixed(0) + "%", "ax-t", "end");
    });
    CH.axisX(s, x, H - m.b, [10, 20, 30, 40, 50, 60, 70, 80], function (t) { return t + "%"; });
    CH.text(s, (m.l + W - m.r) / 2, H - 12, "recommended share in the stock fund", "ax-t", "middle");

    var barsG = CH.g(s, "bars");
    var ruleLine = CH.needle(s, x(60), m.t - 10, H - m.b, "var(--warranted)", 2);
    ruleLine.setAttribute("stroke-dasharray", "5 4");
    var ruleLbl = CH.text(s, x(60), m.t - 16, "", "lbl", "middle");
    ruleLbl.setAttribute("fill", "var(--warranted)");
    ruleLbl.setAttribute("font-weight", "600");
    ruleLbl.setAttribute("font-size", "11.5");

    var modeLbl = CH.text(s, 0, 0, "", "lbl mono", "middle");
    modeLbl.setAttribute("fill", "var(--advice)");
    modeLbl.setAttribute("font-weight", "600");
    modeLbl.setAttribute("font-size", "11.5");

    var caption = h("p", { class: "kicker", style: "min-height:3em;max-width:40rem" });

    function paint() {
      var hh = RESPONSES.hist_by_age[age];
      var n = Object.keys(hh).reduce(function (t, k) { return t + hh[k]; }, 0);
      var keys = Object.keys(hh).map(Number).sort(function (a, b) { return a - b; });
      var mode = keys.reduce(function (best, k) { return hh[k] > hh[best] ? k : best; }, keys[0]);

      barsG.innerHTML = "";
      var bw = (x(15) - x(10)) * 0.8;
      keys.forEach(function (k) {
        var share = hh[k] / n;
        CH.rect(barsG, x(k) - bw / 2, y(share), bw, (H - m.b) - y(share), "", {
          fill: k === mode ? "var(--advice)" : "var(--advice-dim)",
          opacity: k === mode ? 1 : 0.55, rx: 2
        });
      });

      var r = RULE[age];
      ruleLine.setAttribute("x1", x(r)); ruleLine.setAttribute("x2", x(r));
      ruleLbl.setAttribute("x", x(r));
      ruleLbl.textContent = "the rule says " + r + "%";

      modeLbl.setAttribute("x", x(mode));
      modeLbl.setAttribute("y", y(hh[mode] / n) - 8);
      modeLbl.textContent = "most common: " + mode + "%";

      caption.textContent = age === "40"
        ? "At forty the rule and the advice agree exactly. Sixty is both the most common answer and what the rule prescribes."
        : age === "30"
        ? "At thirty the rule says seventy. The most common answer is still sixty — the models did not move as far as the rule does."
        : "At fifty-five the rule says forty-five. The most common answer is forty, the nearest round number. Forty-five is given in under a tenth of answers.";
    }

    var seg = h("div", { class: "seg" });
    [["30", "age 30"], ["40", "age 40"], ["55", "age 55"]].forEach(function (o) {
      var b = h("button", { text: o[1] });
      b.onclick = function () {
        age = o[0];
        Array.prototype.forEach.call(seg.children, function (bb, i) {
          bb.setAttribute("aria-pressed", ["30", "40", "55"][i] === age ? "true" : "false");
        });
        paint();
      };
      b.setAttribute("aria-pressed", o[0] === age ? "true" : "false");
      seg.appendChild(b);
    });

    paint();
    return h("div", { class: "stack" }, [h("div", { class: "chips" }, [seg]), box, caption]);
  };

  /* ======================================================================
     The thirteen observations. Why the sample is models, not answers.
     ====================================================================== */

  P.byModelStrip = function (opts) {
    opts = opts || {};
    var sel = opts.country || "Brazil";

    var W = 660, H = 300, m = { t: 54, r: 28, b: 56, l: 150 };
    var box = h("div", { class: "stage-box" });
    var s = svg(W, H, box, { label: "Each model's own estimate of the country gap" });
    var x = lin(-25, 12, m.l, W - m.r);
    var ticks = [-20, -10, 0, 10];

    CH.gridX(s, x, m.t - 6, H - m.b, ticks, true);
    ticks.forEach(function (t) {
      CH.text(s, x(t), H - m.b + 18, (t > 0 ? "+" : "") + t, "ax-t", "middle");
    });
    CH.text(s, (m.l + W - m.r) / 2, H - 12,
      "that model's own estimate, percentage points against the US", "ax-t", "middle");
    var zl = CH.line(s, x(0), m.t - 6, x(0), H - m.b, "ax");
    zl.setAttribute("stroke", "var(--ink)");

    var rowsG = CH.g(s, "rows");
    var pooled = CH.needle(s, x(0), m.t - 10, H - m.b, "var(--advice)", 2.5);
    var pooledLbl = CH.text(s, x(0), m.t - 18, "", "lbl mono", "middle");
    pooledLbl.setAttribute("fill", "var(--advice)");
    pooledLbl.setAttribute("font-weight", "600");

    var slotWrap = h("span", { class: "slot-wrap" });
    var slot = h("span", { class: "slot" });
    var picker = h("select", { "aria-label": "Country" });
    Object.keys(BYMODEL.byCountry).sort(function (a, b) {
      return D.byKey[a].label.localeCompare(D.byKey[b].label);
    }).forEach(function (k) {
      var o = h("option", { value: k, text: D.byKey[k].label });
      if (k === sel) o.selected = true;
      picker.appendChild(o);
    });
    picker.onchange = function () { sel = picker.value; paint(); };
    slotWrap.appendChild(slot);
    slotWrap.appendChild(picker);

    var line = h("p", { class: "lede", style: "max-width:none;margin:0 0 .9rem" });
    line.appendChild(document.createTextNode("Each model's own answer for "));
    line.appendChild(slotWrap);

    var caption = h("p", { class: "kicker", style: "min-height:3em;max-width:42rem" });

    function paint() {
      var d = BYMODEL.byCountry[sel];
      slot.textContent = D.byKey[sel].label;

      var models = BYMODEL.models.slice().sort(function (a, b) {
        return d.byModel[a] - d.byModel[b];
      });
      var rowH = (H - m.t - m.b) / models.length;

      rowsG.innerHTML = "";
      models.forEach(function (mm, i) {
        var yy = m.t + i * rowH + rowH / 2;
        var v = d.byModel[mm];
        var t = CH.text(rowsG, m.l - 12, yy + 3.5, mm, "ax-t", "end");
        t.setAttribute("font-size", "10.5");
        CH.line(rowsG, x(0), yy, x(v), yy, "").setAttribute("stroke", "var(--rule-2)");
        el("circle", {
          cx: x(v), cy: yy, r: 3.8,
          fill: v < 0 ? "var(--advice)" : "var(--flat)", stroke: "none"
        }, rowsG);
      });

      pooled.setAttribute("x1", x(d.pooled)); pooled.setAttribute("x2", x(d.pooled));
      pooledLbl.setAttribute("x", x(d.pooled));
      pooledLbl.textContent = "pooled: " + CH.signed(d.pooled);

      var nNeg = Math.round(d.shareNegative * BYMODEL.models.length);
      caption.innerHTML = "<strong>" + nNeg + " of " + BYMODEL.models.length +
        "</strong> models put " + D.byKey[sel].label + " below the United States on their own. " +
        (nNeg >= 11
          ? "That is the kind of agreement the pooled estimate is built on, and it is why the study counts models rather than answers."
          : nNeg <= 8
          ? "The models disagree here, which is exactly why this contrast does not survive the correction."
          : "Mixed. The pooled number sits on genuine disagreement between models.");
    }

    paint();
    return h("div", { class: "stack" }, [line, box, caption]);
  };

})();
