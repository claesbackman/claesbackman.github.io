/* ------------------------------------------------------------------------
   charts.js — small hand-rolled SVG helpers.

   Every chart in this piece is bespoke, so there is no chart library. These
   are the dozen primitives the playables share: element creation, linear
   scales, axes, and a few shapes that recur.
   ------------------------------------------------------------------------ */

window.CH = (function () {

  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] === null || attrs[k] === undefined) continue;
      n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  function svg(w, h, parent, opts) {
    opts = opts || {};
    var s = el("svg", {
      viewBox: "0 0 " + w + " " + h,
      preserveAspectRatio: opts.preserve || "xMidYMid meet",
      role: "img"
    }, parent);
    s.style.display = "block";
    s.style.width = "100%";
    s.style.height = opts.height || "auto";
    if (opts.maxHeight) s.style.maxHeight = opts.maxHeight;
    if (opts.label) {
      var t = el("title", {}, s);
      t.textContent = opts.label;
    }
    return s;
  }

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n[k.toLowerCase()] = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  function linear(d0, d1, r0, r1) {
    var f = function (v) {
      if (d1 === d0) return r0;
      return r0 + (v - d0) / (d1 - d0) * (r1 - r0);
    };
    f.invert = function (p) {
      if (r1 === r0) return d0;
      return d0 + (p - r0) / (r1 - r0) * (d1 - d0);
    };
    f.domain = [d0, d1];
    f.range = [r0, r1];
    return f;
  }

  function text(parent, x, y, str, cls, anchor, extra) {
    var a = { x: x, y: y, class: cls || "ax-t", "text-anchor": anchor || "start" };
    if (extra) for (var k in extra) a[k] = extra[k];
    var t = el("text", a, parent);
    t.textContent = str;
    return t;
  }

  function line(parent, x1, y1, x2, y2, cls) {
    return el("line", { x1: x1, y1: y1, x2: x2, y2: y2, class: cls || "ax" }, parent);
  }

  function rect(parent, x, y, w, hh, cls, extra) {
    var a = { x: x, y: y, width: Math.max(0, w), height: Math.max(0, hh), class: cls };
    if (extra) for (var k in extra) a[k] = extra[k];
    return el("rect", a, parent);
  }

  function g(parent, cls, transform) {
    return el("g", { class: cls, transform: transform }, parent);
  }

  // Horizontal axis of percentages along the bottom of a plot.
  function axisX(parent, sc, y, ticks, fmt, cls) {
    var gg = g(parent, "axis-x");
    ticks.forEach(function (t) {
      var x = sc(t);
      line(gg, x, y, x, y + 4, cls || "ax");
      text(gg, x, y + 16, fmt ? fmt(t) : t, "ax-t", "middle");
    });
    return gg;
  }

  function axisY(parent, sc, x, ticks, fmt) {
    var gg = g(parent, "axis-y");
    ticks.forEach(function (t) {
      var y = sc(t);
      text(gg, x - 7, y + 4, fmt ? fmt(t) : t, "ax-t", "end");
    });
    return gg;
  }

  function gridX(parent, sc, y0, y1, ticks, dash) {
    var gg = g(parent, "grid");
    ticks.forEach(function (t) {
      var x = sc(t);
      line(gg, x, y0, x, y1, "gridline" + (dash ? " dash" : ""));
    });
    return gg;
  }

  /* -- shapes that recur ------------------------------------------------- */

  // A dot in the margin marking a value the reader chose earlier.
  function ghostTick(parent, x, y0, y1, label) {
    var gg = g(parent, "ghost");
    el("line", {
      x1: x, y1: y0, x2: x, y2: y1,
      stroke: "var(--muted)", "stroke-width": 1.5, "stroke-dasharray": "3 3"
    }, gg);
    if (label) text(gg, x, y0 - 6, label, "ax-t", "middle");
    return gg;
  }

  // The needle motif: a vertical marker on a 0-100 track. Used wherever the
  // point is that the number did or did not move.
  function needle(parent, x, y0, y1, color, w) {
    return el("line", {
      x1: x, y1: y0, x2: x, y2: y1,
      stroke: color, "stroke-width": w || 3, "stroke-linecap": "round"
    }, parent);
  }

  function pill(parent, x, y, w, hh, cls, r) {
    return rect(parent, x, y, w, hh, cls, { rx: r === undefined ? Math.min(3, hh / 2) : r });
  }

  /* -- formatting -------------------------------------------------------- */

  function pct(v, dp) { return (v * 100).toFixed(dp === undefined ? 0 : dp) + "%"; }
  function pp(v, dp) {
    var d = dp === undefined ? 1 : dp;
    return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d);
  }
  function signed(v, dp) {
    var d = dp === undefined ? 1 : dp;
    return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(d);
  }
  function money(v, cur) {
    return (cur || "$") + Math.round(v).toLocaleString("en-US");
  }
  function pval(p) {
    if (p === null || p === undefined) return "";
    return p <= 0.001 ? "p < 0.001" : "p = " + p.toFixed(3).replace(/0$/, "");
  }

  /* -- animation --------------------------------------------------------- */

  // A tiny tween used only for showing that something did not change.
  function tween(ms, step, done) {
    var t0 = null, raf;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { step(1); if (done) done(); return function () {}; }
    function frame(t) {
      if (t0 === null) t0 = t;
      var u = Math.min(1, (t - t0) / ms);
      step(u < 1 ? 1 - Math.pow(1 - u, 3) : 1);
      if (u < 1) raf = requestAnimationFrame(frame);
      else if (done) done();
    }
    raf = requestAnimationFrame(frame);
    return function () { cancelAnimationFrame(raf); };
  }

  return {
    NS: NS, el: el, svg: svg, h: h, linear: linear,
    text: text, line: line, rect: rect, g: g,
    axisX: axisX, axisY: axisY, gridX: gridX,
    ghostTick: ghostTick, needle: needle, pill: pill,
    pct: pct, pp: pp, signed: signed, money: money, pval: pval,
    tween: tween
  };
})();
