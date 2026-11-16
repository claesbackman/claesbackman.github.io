/* Title page: mean recommended share by model and country (Version B, age 40). */
(function () {
  "use strict";
  const S = window.Site, F = window.ChartsFA;
  const QL = { Q1: "Q1 portfolio: equity share", Q2: "Q2 mortgage: share invested rather than prepaid", Q4: "Q3 inflation: share moved into investments" };
  Promise.all([S.data("cells"), S.data("index"), S.data("tables")]).then(([CELLS, I, T]) => {
    const ctl = document.getElementById("hero-controls");
    let q = "Q1", highlight = null, ch = null;
    const label = (m) => (I.models.find((x) => x.key === m) || { label: m }).label;
    const cname = (c) => (I.countries.find((x) => x.key === c) || { name: c }).name;
    function draw() {
      const rows = CELLS.rows.filter((r) => r.version === "B" && r.question === q && r.age === 40 && r.phrasing === "v1");
      const byModel = d3.group(rows, (r) => r.model);
      const data = Array.from(byModel, ([m, rs]) => ({ key: m, label: label(m), mean: d3.mean(rs, (r) => r.mean) * 100, points: rs.map((r) => ({ key: r.country, label: cname(r.country), x: r.mean * 100, n: r.n })) })).sort((a, b) => a.mean - b.mean);
      const all = data.flatMap((d) => d.points.map((p) => p.x));
      ch = F.strip(document.getElementById("hero-chart"), { rows: data, highlight, xdomain: [Math.max(0, Math.floor(d3.min(all) / 10) * 10 - 5), Math.min(100, Math.ceil(d3.max(all) / 10) * 10 + 5)], xtitle: QL[q] + " (percent, mean of fifty responses per dot)", onHighlight: (k) => { highlight = k; } });
      const old = document.querySelector("#hero .legend"); if (old) old.remove();
      ctl.insertAdjacentHTML("afterend", ch.legend());
    }
    ctl.innerHTML = "";
    [["Q1", "Q1 portfolio"], ["Q2", "Q2 mortgage"], ["Q4", "Q3 inflation"]].forEach(([k, l]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = l; b.setAttribute("aria-pressed", k === q ? "true" : "false");
      b.addEventListener("click", () => { q = k; ctl.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); draw(); });
      ctl.appendChild(b);
    });
    const sel = document.createElement("select");
    [["", "Highlight a country…"]].concat(I.countries.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => [c.key, c.name])).forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; sel.appendChild(o); });
    sel.addEventListener("change", () => { highlight = sel.value || null; ch.setHighlight(highlight); });
    const lab = document.createElement("label"); lab.className = "ctl-group"; lab.appendChild(sel); ctl.appendChild(lab);
    draw();
    const tbtn = document.createElement("button"); tbtn.type = "button"; tbtn.textContent = "Table view";
    const links = document.getElementById("hero-links");
    links.insertBefore(tbtn, links.firstChild);
    let table = null;
    tbtn.addEventListener("click", () => {
      const c = document.getElementById("hero-chart");
      if (!table) { table = document.createElement("div"); table.className = "fig-table"; table.innerHTML = ch.table(); c.insertAdjacentElement("afterend", table); c.hidden = true; tbtn.textContent = "Chart view"; }
      else { table.remove(); table = null; c.hidden = false; tbtn.textContent = "Table view"; }
    });
    const v = T.variance.find((r) => r.question === "Q1") || {}, v2 = T.variance.find((r) => r.question === "Q2") || {};
    const tile = (l, val, sub) => `<div class="stat"><div class="label">${l}</div><div class="value">${val}</div><div class="sub">${sub}</div></div>`;
    document.getElementById("hero-stats").innerHTML =
      tile("Countries · models", `${I.counts.countries} · ${I.counts.models}`, "fifteen local-language countries, thirteen models from six vendors") +
      tile("Responses analysed", I.counts.analysed_main_responses.toLocaleString("en-GB"), "main collection, July 2026, fifty repetitions per cell") +
      tile("Variance explained, portfolio question", `${Math.round(v.sh_model * 100)}% · ${Math.round(v.sh_country * 100)}%`, "model · country") +
      tile("Variance explained, mortgage question", `${Math.round(v2.sh_model * 100)}% · ${Math.round(v2.sh_country * 100)}%`, "model · country");
  }).catch((e) => console.error(e));
})();
