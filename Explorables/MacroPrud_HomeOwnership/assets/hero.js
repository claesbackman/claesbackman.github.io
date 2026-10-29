/* Title page: the data behind the paper, and the size of the robustness grid. */
(function () {
  "use strict";
  const S = window.Site, C = window.Charts;
  const VARS = [["owner", "Homeownership rate"], ["owner_loan_young", "Young adult-only households owning with a mortgage"], ["owner_loan", "Owners with a mortgage"], ["rent_market", "Renters at market rates"], ["sum_mpp", "Macroprudential index (level)"]];
  Promise.all([S.data("panel"), S.data("mv_index")]).then(([panel, idx]) => {
    const ctl = document.getElementById("hero-controls");
    let v = "owner", highlight = "Ireland";
    const byC = d3.group(panel.rows, (r) => r.country);
    const events = {};
    panel.rows.forEach((r) => { if (r.dmpp && r.dmpp !== 0) (events[r.country] = events[r.country] || []).push({ x: r.year, value: r.dmpp }); });
    function draw() {
      const data = Array.from(byC, ([country, rows]) => ({ key: country, label: country, values: rows.map((r) => ({ x: r.year, y: r[v] })).sort((a, b) => a.x - b.x) }));
      const lab = VARS.find((x) => x[0] === v)[1];
      C.lines(document.getElementById("hero-chart"), { data, highlight, average: true, ytitle: lab + (v === "sum_mpp" ? "" : " (%)"), events, width: 760, height: 380, onHighlight: (k) => { highlight = k; } });
    }
    ctl.innerHTML = "";
    VARS.forEach(([k, l]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = l; b.setAttribute("aria-pressed", k === v ? "true" : "false");
      b.addEventListener("click", () => { v = k; ctl.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); draw(); });
      ctl.appendChild(b);
    });
    draw();
    const total = Object.values(idx.counts).reduce((a, c) => a + c.specs, 0);
    const rows = Object.values(idx.counts).reduce((a, c) => a + c.rows, 0);
    const loo = Object.values(idx.counts).reduce((a, c) => a + c.loo, 0);
    document.getElementById("hero-count").textContent = total.toLocaleString("en-GB");
    const tile = (label, value, sub) => `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;
    document.getElementById("hero-stats").innerHTML =
      tile("Outcomes", idx.outcomes.length, "tenure shares and first-stage variables") +
      tile("Specifications", total.toLocaleString("en-GB"), "distinct combinations of index, controls, fixed effects, sample, weights and dependent variable") +
      tile("Regressions", (rows + loo).toLocaleString("en-GB"), "including leave-one-out, all horizons") +
      tile("Countries · years", "28 · 2003–2017", "EU-SILC tenure data, MaPPED policy actions");
  }).catch((e) => console.error(e));
})();
