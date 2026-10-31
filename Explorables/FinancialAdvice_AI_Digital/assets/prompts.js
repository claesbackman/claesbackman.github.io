/* Prompt explorer: the exact prompt per country / version / question / age. */
(function () {
  "use strict";
  const S = window.Site;
  const VL = { B: "Version B: local language, generic instruments", "B-cross": "Version B-cross: English, country named", C: "Version C: local language, local instruments named", Bgrt: "Stated-investor arm (English, Q1 only)" };
  const QL = { Q1: "Q1 portfolio", Q2: "Q2 mortgage", Q4: "Q3 inflation" };
  Promise.all([S.data("prompts"), S.data("index")]).then(([P, I]) => {
    const ctl = document.getElementById("prompt-controls");
    const st = { country: S.qs("country") || "Sweden", version: S.qs("version") || "B", question: S.qs("q") || "Q1", age: "40", phrasing: "averse_limited" };
    function sel(label, options, value, onChange) {
      const wrap = document.createElement("label"); wrap.className = "ctl-group"; wrap.innerHTML = `<span class="ctl-label">${label}</span>`;
      const s = document.createElement("select");
      options.forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; s.appendChild(o); });
      s.value = value; s.addEventListener("change", () => onChange(s.value)); wrap.appendChild(s); ctl.appendChild(wrap);
      return s;
    }
    function build() {
      ctl.innerHTML = "";
      const countries = I.countries.slice().sort((a, b) => a.name.localeCompare(b.name));
      sel("Country", countries.map((c) => [c.key, `${c.name} (${c.language})`]), st.country, (v) => { st.country = v; if (!P[v][st.version]) st.version = "B"; build(); });
      const versions = Object.keys(P[st.country]).filter((v) => VL[v]);
      sel("Version", versions.map((v) => [v, VL[v]]), st.version, (v) => { st.version = v; if (v === "Bgrt") st.question = "Q1"; if (!P[st.country][v][st.question]) st.question = "Q1"; build(); });
      if (st.version === "Bgrt") {
        sel("Investor statement", Object.entries(I.phrasings).filter(([k]) => k !== "v1").map(([k, l]) => [k, l]), st.phrasing, (v) => { st.phrasing = v; build(); });
      } else {
        const qs = Object.keys(P[st.country][st.version]);
        sel("Question", qs.map((q) => [q, QL[q]]), st.question, (v) => { st.question = v; st.age = "40"; build(); });
        const ages = Object.keys(P[st.country][st.version][st.question]);
        if (ages.length > 1) sel("Age", ages.map((a) => [a, a]), st.age, (v) => { st.age = v; build(); });
        else st.age = ages[0];
      }
      render();
    }
    function render() {
      const node = st.version === "Bgrt" ? P[st.country].Bgrt.Q1[st.phrasing] : P[st.country][st.version][st.question][st.age];
      const c = I.countries.find((x) => x.key === st.country);
      const box = document.getElementById("prompt-box");
      const text = node.prompt;
      const cut = text.indexOf("\n\n");
      const instr = cut > 0 ? text.slice(0, cut) : "", rest = cut > 0 ? text.slice(cut + 2) : text;
      // the Instructions block ends at the closing brace of the JSON schema
      const m = text.match(/^Instructions:[\s\S]*?\n\}\n/);
      const ib = m ? m[0] : instr, qb = m ? text.slice(m[0].length).replace(/^\n+/, "") : rest;
      box.innerHTML = `<span class="instr">${S.esc(ib)}</span>\n<span class="q">${S.esc(qb)}</span>`;
      document.getElementById("prompt-meta").innerHTML = `<b>${S.esc(c.name)}</b> · ${S.esc(VL[st.version])} · ${S.esc(st.version === "Bgrt" ? I.phrasings[st.phrasing] : QL[st.question] + ", age " + st.age)}<span class="lang-tag">${S.esc(node.language || "English")}</span><br>The grey Instructions block is identical in every cell and always in English; the Question block is what varies.`;
      const btp = document.getElementById("bt-panel");
      if (node.back_translation) {
        btp.hidden = false;
        document.getElementById("src-box").textContent = node.source_en || "";
        document.getElementById("bt-box").textContent = node.back_translation;
      } else btp.hidden = true;
      const url = new URL(location.href); url.searchParams.set("country", st.country); url.searchParams.set("version", st.version); url.searchParams.set("q", st.question); history.replaceState(null, "", url);
      window._promptText = text;
    }
    document.getElementById("copy").addEventListener("click", () => {
      navigator.clipboard.writeText(window._promptText || "").then(() => { document.getElementById("copied").textContent = "Copied."; setTimeout(() => { document.getElementById("copied").textContent = ""; }, 2000); });
    });
    build();
  }).catch((e) => console.error(e));
})();
