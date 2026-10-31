/* Shared behaviour: navigation drawer, inline notes, math rendering, tooltip
   helper and small formatting utilities used by the chart scripts. */
(function () {
  "use strict";

  // Navigation drawer (small screens)
  const toggle = document.getElementById("nav-toggle");
  const sidebar = document.getElementById("sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      const open = sidebar.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }
  // keep the active nav item in view
  const active = document.querySelector(".nav-list li.active");
  if (active && sidebar) {
    const r = active.getBoundingClientRect();
    const s = sidebar.getBoundingClientRect();
    if (r.bottom > s.bottom || r.top < s.top) active.scrollIntoView({ block: "center" });
  }

  // Inline notes (footnotes)
  document.querySelectorAll(".fn-ref").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (body) body.hidden = open;
    });
  });

  // Math
  function renderMath() {
    if (typeof renderMathInElement !== "function") return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
    // pandoc's --katex output wraps math in spans with class math; KaTeX
    // auto-render handles the delimiters inside them.
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderMath);
  else renderMath();

  // Open the note a URL fragment points to
  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el && el.classList.contains("fn-body")) {
      el.hidden = false;
      const b = document.querySelector(`[aria-controls="${el.id}"]`);
      if (b) b.setAttribute("aria-expanded", "true");
    }
  }
})();

/* ---- shared utilities for charts ---- */
window.Site = (function () {
  "use strict";
  const fmt = {
    n: (x, d = 2) => (x == null || isNaN(x) ? "–" : (+x).toFixed(d)),
    n3: (x) => (x == null || isNaN(x) ? "–" : (+x).toFixed(3)),
    p: (x) => (x == null || isNaN(x) ? "–" : x < 0.001 ? "<0.001" : (+x).toFixed(3)),
    int: (x) => (x == null || isNaN(x) ? "–" : Math.round(x).toLocaleString("en-GB")),
    signed: (x, d = 2) => (x == null || isNaN(x) ? "–" : (x > 0 ? "+" : "") + (+x).toFixed(d)),
  };

  let tipEl = null;
  function tip() {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "tip";
      tipEl.style.display = "none";
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  function showTip(html, ev) {
    const t = tip();
    t.innerHTML = html;
    t.style.display = "block";
    moveTip(ev);
  }
  function moveTip(ev) {
    const t = tip();
    const pad = 14;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    const r = t.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - pad;
    t.style.left = x + "px";
    t.style.top = y + "px";
  }
  function hideTip() { if (tipEl) tipEl.style.display = "none"; }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Load data/<name>.js, which calls Site._deliver(name, object). A script
  // tag works both over HTTP and when the page is opened from disk, where
  // browsers refuse fetch() on file:// URLs. Results are cached per page.
  const cache = {}, pending = {};
  function _deliver(name, obj) {
    if (pending[name]) { pending[name].resolve(obj); delete pending[name]; }
    else cache[name] = Promise.resolve(obj);
  }
  function data(name) {
    if (!cache[name]) {
      cache[name] = new Promise((resolve, reject) => {
        pending[name] = { resolve };
        const s = document.createElement("script");
        s.src = "data/" + name + ".js";
        s.async = true;
        s.onerror = () => { delete pending[name]; delete cache[name]; reject(new Error("missing " + name)); };
        document.head.appendChild(s);
      });
    }
    return cache[name];
  }

  // t-distribution critical value (two-sided), small-df accurate enough via
  // Cornish-Fisher expansion; df >= 10 in every use here.
  function tcrit(df, alpha) {
    const z = alpha === 0.1 ? 1.6448536 : alpha === 0.05 ? 1.959964 : alpha === 0.01 ? 2.5758293 : 1.959964;
    const g1 = (z ** 3 + z) / 4, g2 = (5 * z ** 5 + 16 * z ** 3 + 3 * z) / 96,
      g3 = (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / 384,
      g4 = (79 * z ** 9 + 776 * z ** 7 + 1482 * z ** 5 - 1920 * z ** 3 - 945 * z) / 92160;
    return z + g1 / df + g2 / df ** 2 + g3 / df ** 3 + g4 / df ** 4;
  }
  // upper tail of t distribution via regularized incomplete beta
  function tTail(t, df) {
    const x = df / (df + t * t);
    const ib = incBeta(x, df / 2, 0.5);
    return 0.5 * ib;
  }
  function incBeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
    // Lentz continued fraction
    let f = 1, c = 1, d = 0;
    for (let i = 0; i <= 200; i++) {
      const m = i >> 1;
      let num;
      if (i === 0) num = 1;
      else if (i % 2 === 0) num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      else num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
      c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      const cd = c * d; f *= cd;
      if (Math.abs(1 - cd) < 1e-10) break;
    }
    const res = front * (f - 1);
    return x < (a + 1) / (a + b + 2) ? res : 1 - incBetaSwap(x, a, b);
  }
  function incBetaSwap(x, a, b) {
    // compute 1 - I_x(a,b) = I_{1-x}(b,a) directly (avoid recursion loop)
    const xx = 1 - x, aa = b, bb = a;
    const lbeta = lgamma(aa) + lgamma(bb) - lgamma(aa + bb);
    const front = Math.exp(Math.log(xx) * aa + Math.log(1 - xx) * bb - lbeta) / aa;
    let f = 1, c = 1, d = 0;
    for (let i = 0; i <= 200; i++) {
      const m = i >> 1;
      let num;
      if (i === 0) num = 1;
      else if (i % 2 === 0) num = (m * (bb - m) * xx) / ((aa + 2 * m - 1) * (aa + 2 * m));
      else num = -((aa + m) * (aa + bb + m) * xx) / ((aa + 2 * m) * (aa + 2 * m + 1));
      d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
      c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      const cd = c * d; f *= cd;
      if (Math.abs(1 - cd) < 1e-10) break;
    }
    return front * (f - 1);
  }
  function lgamma(z) {
    const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  // two-sided p-value, TOST p-value at margin delta, minimum detectable effect
  function pval(b, se, df) { return 2 * tTail(Math.abs(b / se), df); }
  function tost(b, se, df, delta) {
    const p1 = tTail((b + delta) / se, df), p2 = tTail((delta - b) / se, df);
    return Math.max(p1, p2);
  }
  const mde = (se) => (1.959964 + 0.8416212) * se;

  function download(filename, text, type = "text/csv") {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function toCSV(rows, cols) {
    const q = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
    return [cols.join(",")].concat(rows.map((r) => cols.map((c) => q(r[c])).join(","))).join("\n");
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }

  return { fmt, showTip, moveTip, hideTip, esc, data, _deliver, tcrit, tTail, pval, tost, mde, download, toCSV, qs };
})();
