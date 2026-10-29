(function () {
  "use strict";
  const S = window.Site;
  const $ = (s) => document.querySelector(s);
  S.data("policy_actions").then((d) => {
    const rows = d.rows;
    const uniq = (k) => Array.from(new Set(rows.map((r) => r[k]).filter(Boolean))).sort();
    uniq("country").forEach((c) => { const o = document.createElement("option"); o.value = c; o.textContent = c; $("#fcountry").appendChild(o); });
    uniq("category").forEach((c) => { const o = document.createElement("option"); o.value = c; o.textContent = c; $("#fcat").appendChild(o); });
    if (S.qs("country")) $("#fcountry").value = S.qs("country");
    const PER = 50;
    let page = 0, filtered = rows;
    function apply() {
      const c = $("#fcountry").value, cat = $("#fcat").value, dir = $("#fdir").value, idx = $("#fidx").value, q = $("#fsearch").value.trim().toLowerCase();
      filtered = rows.filter((r) => (!c || r.country === c) && (!cat || r.category === cat) && (!dir || r.direction === dir) && (idx === "" || String(r.in_index) === idx) &&
        (!q || [r.description, r.subcategory, r.category, r.action_type].join(" ").toLowerCase().includes(q)));
      page = 0; render();
    }
    function render() {
      const n = filtered.length, pages = Math.max(1, Math.ceil(n / PER));
      page = Math.min(page, pages - 1);
      const sl = filtered.slice(page * PER, (page + 1) * PER);
      const tight = filtered.filter((r) => r.direction === "Policy tightening").length, loose = filtered.filter((r) => r.direction === "Policy loosening").length, excl = filtered.filter((r) => !r.in_index).length;
      $("#count").textContent = `${n} actions: ${tight} tightenings, ${loose} loosenings, ${n - tight - loose} ambiguous; ${excl} excluded from the index as counter-cyclical. Net weighted index contribution of the listed actions: ${S.fmt.n(d3.sum(filtered.filter((r) => r.in_index), (r) => r.index_weight), 2)}.`;
      let html = `<table class="data-table"><thead><tr><th>Country</th><th>Year</th><th>Q</th><th>Category</th><th>Action</th><th>Direction</th><th>Weight</th><th>In index</th><th></th></tr></thead><tbody>`;
      sl.forEach((r, i) => {
        const badge = r.direction === "Policy tightening" ? "t" : r.direction === "Policy loosening" ? "l" : "z";
        html += `<tr><th scope="row">${S.esc(r.country)}</th><td>${r.year}</td><td>${r.quarter || ""}</td><td style="text-align:left">${S.esc(r.category)}<br><span class="muted">${S.esc(r.subcategory || "")}</span></td><td style="text-align:left">${S.esc(r.action_type)}</td><td style="text-align:left"><span class="badge ${badge}">${S.esc(r.direction.replace("Policy ", "").replace("Other and with ambiguous impact", "ambiguous"))}</span></td><td>${r.in_index ? S.fmt.signed(r.index_weight, 2) : "(" + S.fmt.n(r.weight, 2) + ")"}</td><td>${r.in_index ? "Yes" : "No, counter-cyclical"}</td><td><button type="button" class="expand" data-i="${i}">▸ Show</button></td></tr>`;
        html += `<tr class="row-detail" id="det-${i}" hidden><td colspan="9"><strong>${S.esc(r.action_id || "")}</strong> · ${S.esc(r.character || "")}<br>${S.esc(r.description || "No description in the database.")}</td></tr>`;
      });
      $("#table").innerHTML = html + "</tbody></table>";
      $("#table").querySelectorAll(".expand").forEach((b) => b.addEventListener("click", () => { const det = document.getElementById("det-" + b.dataset.i); det.hidden = !det.hidden; b.textContent = det.hidden ? "▸ Show" : "▾ Hide"; }));
      const pager = (el) => {
        el.innerHTML = `<button type="button" ${page === 0 ? "disabled" : ""} data-go="first">«</button><button type="button" ${page === 0 ? "disabled" : ""} data-go="prev">‹</button><span>Page ${page + 1} of ${pages} · rows ${n ? page * PER + 1 : 0}–${Math.min(n, (page + 1) * PER)} of ${n}</span><button type="button" ${page >= pages - 1 ? "disabled" : ""} data-go="next">›</button><button type="button" ${page >= pages - 1 ? "disabled" : ""} data-go="last">»</button>`;
        el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const g = b.dataset.go; page = g === "first" ? 0 : g === "prev" ? page - 1 : g === "next" ? page + 1 : pages - 1; render(); window.scrollTo({ top: $("#table").getBoundingClientRect().top + window.scrollY - 120 }); }));
      };
      pager($("#pager")); pager($("#pager-top"));
    }
    ["#fcountry", "#fcat", "#fdir", "#fidx"].forEach((s) => $(s).addEventListener("change", apply));
    $("#fsearch").addEventListener("input", apply);
    $("#download").addEventListener("click", (e) => { e.preventDefault(); S.download("policy_actions.csv", S.toCSV(filtered, Object.keys(rows[0]))); });
    apply();
  });
})();
