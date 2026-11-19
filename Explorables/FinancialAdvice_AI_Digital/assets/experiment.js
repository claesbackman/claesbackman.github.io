/* Run your own experiment: build stated-investor arms, preview the prompt,
   download a standalone OpenRouter script. Nothing is sent from the page. */
(function () {
  "use strict";
  const S = window.Site;
  const DEFAULT_MODELS = ["openai/gpt-5-mini", "anthropic/claude-haiku-4.5", "google/gemini-3-flash-preview"];
  const MAX_ARMS = 6;
  const $ = (id) => document.getElementById(id);

  S.data("experiment").then((X) => {
    const st = {
      countries: ["USA"],
      models: DEFAULT_MODELS.filter((m) => X.models.some((x) => x.key === m)),
      extra: [],
      reps: 10,
      age: 40,
      arms: [
        { name: "baseline", horizon: "5y", text: "" },
        { name: "future_income", horizon: "5y", text: "I expect my income to grow substantially over the next ten years." },
      ],
      pArm: 1,
      pCountry: "USA",
    };

    // ---------- helpers ----------
    const statements = (arm) => arm.text.split("\n").map((s) => s.trim()).filter(Boolean);
    function armKeys() {
      const seen = {};
      return st.arms.map((a, i) => {
        let k = a.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || `arm${i + 1}`;
        if (/^[0-9]/.test(k)) k = "arm_" + k;
        let u = k, n = 2;
        while (seen[u]) u = `${k}_${n++}`;
        seen[u] = true;
        return u;
      });
    }
    function block(country, arm) {
      const c = X.countries.find((x) => x.key === country);
      const head = X.head.replace("{age}", String(st.age)).replace("{stake}", c.stake)
        .replace("{horizon}", X.horizons[arm.horizon]).replace("{country}", c.display);
      return { head, extra: statements(arm).map((s) => " " + s).join(""), tail: X.tail };
    }
    const allModels = () => st.models.concat(st.extra.filter((m) => !st.models.includes(m)));
    const py = (s) => JSON.stringify(s);   // a JSON string literal is a valid Python string literal

    function config() {
      const keys = armKeys();
      const L = [];
      L.push("# Countries: any of " + X.countries.map((c) => c.key).sort().join(", "));
      L.push(`COUNTRIES = [${st.countries.map(py).join(", ")}]`);
      L.push("# OpenRouter model slugs (see openrouter.ai/models)");
      L.push("MODELS = [");
      allModels().forEach((m) => L.push(`    ${py(m)},`));
      L.push("]");
      L.push(`REPS = ${st.reps}                  # repetitions per arm x country x model (the paper uses 50)`);
      L.push(`AGE = ${st.age}                   # the paper uses 40`);
      L.push("");
      L.push("# Each arm adds sentences after \"I live in [country].\". horizon is one of");
      L.push("# \"1y\", \"5y\" (the paper's default) or \"20y\". Every arm is compared with BASELINE_ARM.");
      L.push(`BASELINE_ARM = ${py(keys[0])}`);
      L.push("ARMS = {");
      st.arms.forEach((a, i) => {
        L.push(`    ${py(keys[i])}: {`);
        L.push(`        "horizon": ${py(a.horizon)},`);
        const ss = statements(a);
        if (!ss.length) L.push(`        "statements": [],`);
        else {
          L.push(`        "statements": [`);
          ss.forEach((s) => L.push(`            ${py(s)},`));
          L.push(`        ],`);
        }
        L.push("    },");
      });
      L.push("}");
      L.push("");
      L.push("SEED = 42                  # order in which calls are sent");
      L.push(`OUTPUT_DIR = "experiment_results"`);
      return L.join("\n");
    }
    const script = () => X.script.replace("@@CONFIG@@", config());

    // ---------- section 1 ----------
    function pills(id, items, selected, onToggle) {
      const box = $(id);
      box.querySelectorAll(".pill").forEach((p) => p.remove());
      items.forEach(([k, l]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "pill"; b.textContent = l;
        b.setAttribute("aria-pressed", selected.includes(k) ? "true" : "false");
        b.addEventListener("click", () => { onToggle(k); });
        box.appendChild(b);
      });
    }
    const toggle = (arr, k) => { const i = arr.indexOf(k); if (i >= 0) arr.splice(i, 1); else arr.push(k); };
    function drawCountries() {
      const cs = X.countries.slice().sort((a, b) => a.name.localeCompare(b.name));
      pills("xp-countries", cs.map((c) => [c.key, c.name]), st.countries, (k) => {
        toggle(st.countries, k);
        st.countries.sort((a, b) => X.countries.findIndex((c) => c.key === a) - X.countries.findIndex((c) => c.key === b));
        if (!st.countries.includes(st.pCountry) && st.countries.length) st.pCountry = st.countries[0];
        drawCountries(); update();
      });
    }
    function drawModels() {
      const items = X.models.map((m) => [m.key, m.label]).concat(st.extra.map((m) => [m, m]));
      pills("xp-models", items, allModels(), (k) => {
        if (st.extra.includes(k)) st.extra.splice(st.extra.indexOf(k), 1); else toggle(st.models, k);
        drawModels(); update();
      });
    }
    $("xp-reps").addEventListener("input", (e) => { st.reps = Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1)); update(); });
    $("xp-age").addEventListener("input", (e) => { st.age = Math.max(18, Math.min(99, parseInt(e.target.value, 10) || 40)); update(); });
    function addSlug() {
      const v = $("xp-slug").value.trim();
      if (!/^[\w.\-]+\/[\w.:\-]+$/.test(v)) { $("xp-slug").setCustomValidity("Use the form vendor/model"); $("xp-slug").reportValidity(); return; }
      $("xp-slug").setCustomValidity("");
      if (X.models.some((m) => m.key === v)) { if (!st.models.includes(v)) st.models.push(v); }
      else if (!st.extra.includes(v)) st.extra.push(v);
      $("xp-slug").value = ""; drawModels(); update();
    }
    $("xp-slug-add").addEventListener("click", addSlug);
    $("xp-slug").addEventListener("keydown", (e) => { if (e.key === "Enter") addSlug(); });

    // ---------- section 2 ----------
    function drawArms() {
      const box = $("xp-arms");
      box.innerHTML = "";
      st.arms.forEach((a, i) => {
        const d = document.createElement("div");
        d.className = "xp-arm";
        const hz = Object.entries(X.horizons).map(([k, v]) => `<option value="${k}"${k === a.horizon ? " selected" : ""}>${v}${k === "5y" ? " (paper default)" : ""}</option>`).join("");
        const lib = X.groups.map((g) => `<optgroup label="${S.esc(g.label)}">${g.options.map((o) => `<option value="${S.esc(o.text)}">${S.esc(o.label)}</option>`).join("")}</optgroup>`).join("");
        d.innerHTML = `
          <div class="ctl">
            <span class="xp-tag">${i === 0 ? "Reference arm" : "Arm " + (i + 1)}</span>
            <label class="ctl-group"><span class="ctl-label">Name</span><input type="search" class="xp-name" value="${S.esc(a.name)}"></label>
            <label class="ctl-group"><span class="ctl-label">Horizon</span><select class="xp-hz">${hz}</select></label>
            <label class="ctl-group"><span class="ctl-label">Add a sentence from the paper</span><select class="xp-lib"><option value="">choose</option>${lib}</select></label>
            ${i > 0 ? '<button type="button" class="pill xp-rm">Remove</button>' : ""}
          </div>
          <textarea class="xp-text" rows="3" placeholder="${i === 0 ? "Empty: the paper's plain prompt" : "One sentence per line"}">${S.esc(a.text)}</textarea>`;
        d.querySelector(".xp-name").addEventListener("input", (e) => { a.name = e.target.value; update(); });
        d.querySelector(".xp-hz").addEventListener("change", (e) => { a.horizon = e.target.value; update(); });
        d.querySelector(".xp-text").addEventListener("input", (e) => { a.text = e.target.value; update(); });
        d.querySelector(".xp-lib").addEventListener("change", (e) => {
          if (!e.target.value) return;
          a.text = (a.text.trim() ? a.text.replace(/\s+$/, "") + "\n" : "") + e.target.value;
          drawArms(); update();
        });
        const rm = d.querySelector(".xp-rm");
        if (rm) rm.addEventListener("click", () => { st.arms.splice(i, 1); st.pArm = Math.min(st.pArm, st.arms.length - 1); drawArms(); update(); });
        box.appendChild(d);
      });
      $("xp-add-arm").disabled = st.arms.length >= MAX_ARMS;
    }
    $("xp-add-arm").addEventListener("click", () => {
      if (st.arms.length >= MAX_ARMS) return;
      st.arms.push({ name: `arm${st.arms.length + 1}`, horizon: "5y", text: "" });
      st.pArm = st.arms.length - 1; drawArms(); update();
    });

    // ---------- section 3 and 4 ----------
    function drawPreview() {
      const ctl = $("xp-preview-controls");
      ctl.innerHTML = "";
      const keys = armKeys();
      const mk = (label, opts, val, on) => {
        const w = document.createElement("label"); w.className = "ctl-group"; w.innerHTML = `<span class="ctl-label">${label}</span>`;
        const s = document.createElement("select");
        opts.forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; s.appendChild(o); });
        s.value = val; s.addEventListener("change", () => on(s.value)); w.appendChild(s); ctl.appendChild(w);
      };
      mk("Arm", st.arms.map((a, i) => [String(i), keys[i]]), String(st.pArm), (v) => { st.pArm = +v; drawPreview(); });
      const cs = st.countries.length ? st.countries : ["USA"];
      if (!cs.includes(st.pCountry)) st.pCountry = cs[0];
      mk("Country", cs.map((k) => [k, X.countries.find((c) => c.key === k).name]), st.pCountry, (v) => { st.pCountry = v; drawPreview(); });
      const b = block(st.pCountry, st.arms[st.pArm]);
      $("xp-preview").innerHTML = `<span class="instr">${S.esc(X.instructions)}</span>\n\n<span class="q">${S.esc(b.head)}${b.extra ? `<span class="hl">${S.esc(b.extra)}</span>` : ""}${S.esc(b.tail)}</span>`;
    }
    function update() {
      drawPreview();
      const n = st.arms.length * st.countries.length * allModels().length * st.reps;
      const keys = armKeys();
      const ref = st.arms[0];
      const dup = st.arms.slice(1).map((a, i) => (a.horizon === ref.horizon && statements(a).join("\n") === statements(ref).join("\n") ? keys[i + 1] : null)).filter(Boolean);
      let msg = `${st.arms.length} arms × ${st.countries.length} ${st.countries.length === 1 ? "country" : "countries"} × ${allModels().length} models × ${st.reps} repetitions = <b>${n.toLocaleString("en-US")} API calls</b>, billed to your OpenRouter key. Prices differ a lot between models, so check them on openrouter.ai before a large run. Reasoning models use more tokens per call.`;
      if (dup.length) msg += ` <br><span class="xp-warn">Arm ${dup.join(", ")} is identical to the reference arm.</span>`;
      if (!st.countries.length || !allModels().length) msg = `<span class="xp-warn">Pick at least one country and one model.</span>`;
      $("xp-count").innerHTML = msg;
      const ok = st.countries.length && allModels().length;
      $("xp-download").disabled = !ok; $("xp-copy").disabled = !ok;
      $("xp-script").textContent = ok ? script() : "";
    }
    $("xp-download").addEventListener("click", () => S.download("run_experiment.py", script(), "text/x-python"));
    $("xp-copy").addEventListener("click", () => {
      navigator.clipboard.writeText(script()).then(() => { $("xp-copied").textContent = "Copied."; setTimeout(() => { $("xp-copied").textContent = ""; }, 2000); });
    });

    drawCountries(); drawModels(); drawArms(); update();
  }).catch((e) => console.error(e));
})();
