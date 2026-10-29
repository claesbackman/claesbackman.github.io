(function () {
  "use strict";
  const S = window.Site, C = window.Charts;
  const VARS = [
    ["Tenure shares, percent of households", [
      ["owner", "Homeownership rate"], ["owner_loan", "Owners with a mortgage"], ["owner_full", "Outright owners"],
      ["rent", "Renters"], ["rent_market", "Renters at market rates"], ["rent_reduced", "Renters at reduced rates or rent-free"],
      ["owner_lowinc", "Homeownership rate, low income"], ["owner_loan_lowinc", "Owners with a mortgage, low income"], ["owner_full_lowinc", "Outright owners, low income"],
      ["owner_highinc", "Homeownership rate, high income"], ["owner_loan_highinc", "Owners with a mortgage, high income"], ["owner_full_highinc", "Outright owners, high income"]]],
    ["Young households and age groups, percent", [
      ["owner_young", "Adult-only households under 65: owners"], ["owner_loan_young", "Adult-only households under 65: owners with a mortgage"], ["owner_full_young", "Adult-only households under 65: outright owners"],
      ["rent_young", "Adult-only households under 65: renters"], ["rent_mkt_young", "Adult-only households under 65: market-rate renters"], ["rent_fr_young", "Adult-only households under 65: reduced-rate or free renters"],
      ["owner_old", "Adult-only households 65+: owners"], ["owner_18_54", "Individuals 18–54: owners"], ["owner_25_54", "Individuals 25–54: owners"], ["owner_55_64", "Individuals 55–64: owners"], ["owner_ge65", "Individuals 65+: owners"]]],
    ["Macroprudential policy indices", [
      ["sum_mpp", "MaPPED index, level (cumulative weighted actions)"], ["dmpp", "Δ MaPPED index (the shock)"], ["sum_mpp_lsr", "MaPPED lending standard restrictions, level"], ["dmpp_lsr", "Δ lending standard restrictions"],
      ["sum_unw", "MaPPED unweighted count, level"], ["dmpp_unw", "Δ unweighted count"], ["sum_allcc", "MaPPED incl. counter-cyclical actions, level"], ["dmpp_allcc", "Δ incl. counter-cyclical actions"],
      ["sum_impl", "MaPPED by in-force date, level"], ["dmpp_impl", "Δ by in-force date"], ["sum_macro", "MaPPED macroprudential-character actions, level"], ["dmpp_macro", "Δ macroprudential-character actions"],
      ["sum_cumul", "iMaPP cumulative net actions"], ["dimapp", "Δ iMaPP"], ["sum_hh_cumul", "iMaPP household instruments, cumulative"], ["dimapp_hh", "Δ iMaPP household instruments"]]],
    ["Macroeconomic variables", [
      ["hpi", "Real house price index (2010 = 100, Eurostat)"], ["hpi_bis", "Real house price index (BIS)"], ["privdebt_gdp", "Private sector debt, % of GDP (Eurostat)"], ["hhdebt_gdp", "Household debt, % of GDP (Eurostat)"],
      ["credit_nonfin_all_gdp1", "Credit to the private non-financial sector, % of GDP (BIS)"], ["mmrate3m", "3-month money market rate (%)"], ["cbrate", "Central bank policy rate (%, BIS)"],
      ["gdp_pc", "GDP per capita (PPS)"], ["hicp", "HICP (2015 = 100)"], ["totalpop", "Population"],
      ["dgdp_pc", "Δ log GDP per capita"], ["inflation", "Inflation (Δ log HICP)"], ["dhpi", "Real house price growth (Δ log)"], ["dprivdebt_gdp", "Growth in private debt to GDP (Δ log)"], ["dmmrate3m", "Δ 3-month money market rate (pp)"]]],
  ];
  const COLSETS = {
    tenure: ["owner", "owner_loan", "owner_full", "rent", "rent_market", "rent_reduced", "owner_lowinc", "owner_highinc"],
    young: ["owner_young", "owner_loan_young", "owner_full_young", "rent_mkt_young", "owner_old", "owner_18_54", "owner_25_54", "owner_55_64", "owner_ge65"],
    policy: ["sum_mpp", "dmpp", "sum_mpp_lsr", "dmpp_lsr", "dmpp_unw", "dmpp_allcc", "dmpp_impl", "dmpp_macro", "sum_cumul", "dimapp"],
    macro: ["hpi", "privdebt_gdp", "hhdebt_gdp", "credit_nonfin_all_gdp1", "mmrate3m", "cbrate", "gdp_pc", "hicp", "dgdp_pc", "inflation"],
  };
  const LABEL = {};
  VARS.forEach(([, vs]) => vs.forEach(([k, l]) => { LABEL[k] = l; }));

  S.data("panel").then((panel) => {
    const rows = panel.rows;
    const countries = Array.from(new Set(rows.map((r) => r.country))).sort();
    const sel = document.getElementById("var");
    VARS.forEach(([g, vs]) => { const og = document.createElement("optgroup"); og.label = g; vs.forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; og.appendChild(o); }); sel.appendChild(og); });
    const csel = document.getElementById("country"), tsel = document.getElementById("tcountry");
    countries.forEach((c) => { [csel, tsel].forEach((s) => { const o = document.createElement("option"); o.value = c; o.textContent = c; s.appendChild(o); }); });
    let v = S.qs("var") || "owner", highlight = "", chart = null;
    sel.value = v;
    const events = {};
    rows.forEach((r) => { if (r.dmpp && r.dmpp !== 0) (events[r.country] = events[r.country] || []).push({ x: r.year, value: r.dmpp }); });
    function draw() {
      const byC = d3.group(rows, (r) => r.country);
      const data = Array.from(byC, ([country, rs]) => ({ key: country, label: country, values: rs.map((r) => ({ x: r.year, y: r[v] })).sort((a, b) => a.x - b.x) }));
      chart = C.lines(document.getElementById("chart"), { data, highlight: highlight || null, average: true, ytitle: LABEL[v], events, width: 900, height: 420, onHighlight: (k) => { highlight = k || ""; csel.value = highlight; } });
      const vals = rows.map((r) => r[v]).filter((x) => x != null);
      document.getElementById("var-desc").textContent = `${LABEL[v]}: ${vals.length} country-years, mean ${S.fmt.n(d3.mean(vals), 2)}, s.d. ${S.fmt.n(d3.deviation(vals), 2)}, range ${S.fmt.n(d3.min(vals), 2)} to ${S.fmt.n(d3.max(vals), 2)}.`;
    }
    sel.addEventListener("change", () => { v = sel.value; draw(); });
    csel.addEventListener("change", () => { highlight = csel.value; if (chart) chart.setHighlight(highlight || null); });
    draw();
    // table
    const tcols = document.getElementById("tcols"), tbl = document.getElementById("table");
    function table() {
      const cols = COLSETS[tcols.value];
      const rs = rows.filter((r) => !tsel.value || r.country === tsel.value);
      let html = `<table class="data-table"><thead><tr><th>Country</th><th>Year</th>${cols.map((c) => `<th title="${S.esc(LABEL[c] || c)}">${S.esc(LABEL[c] || c)}</th>`).join("")}</tr></thead><tbody>`;
      rs.forEach((r) => { html += `<tr><th scope="row">${S.esc(r.country)}</th><td>${r.year}</td>${cols.map((c) => `<td>${r[c] == null ? "" : typeof r[c] === "number" ? (Math.abs(r[c]) >= 1000 ? S.fmt.int(r[c]) : S.fmt.n(r[c], Math.abs(r[c]) < 1 ? 3 : 2)) : S.esc(r[c])}</td>`).join("")}</tr>`; });
      tbl.innerHTML = html + "</tbody></table>";
    }
    tcols.addEventListener("change", table); tsel.addEventListener("change", table);
    table();
    document.getElementById("download").addEventListener("click", (e) => { e.preventDefault(); const cols = Object.keys(rows[0]); S.download("panel.csv", S.toCSV(rows, cols)); });
  });
})();
