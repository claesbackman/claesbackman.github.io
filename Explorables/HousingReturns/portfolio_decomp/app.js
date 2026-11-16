const state = {
  data: null,
  returnExplorer: { decile: 10, horizon: 10 },
  portfolio: { source: "danish", decile: 10 },
  lab: { source: "danish", returnSpec: "passive", horizon: 1 },
};

const SOURCE_LABELS = {
  danish: "Danish shares",
  scf: "SCF shares",
};

const RETURN_SPEC_LABELS = {
  passive: "Passive",
  fagereng: "Fagereng et al.",
  bach: "Bach et al.",
};

const ASSET_LABELS = {
  housing: "Housing",
  financial: "Financial",
  pension: "Pension",
  total: "Total",
};

const COMPONENT_COLORS = {
  composition: "composition",
  within: "within",
  interaction: "interaction",
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    state.data = await loadData();
    wireControls();
    hydrateStaticContent();
    renderAll();
  } catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div style="margin:1rem auto;max-width:900px;padding:1rem 1.2rem;border-radius:18px;border:1px solid rgba(23,35,41,.12);background:rgba(255,248,240,.95);font-family:'Avenir Next','Segoe UI',sans-serif;">
        <strong>Site data could not be loaded.</strong>
        <p style="margin:.5rem 0 0;color:#5f6769;line-height:1.6;">Run <code>python3 IFN/Demos/Website_materials/site/scripts/build_site_data.py</code> to rebuild the browser data files, then reload this page.</p>
      </div>`,
    );
  }
});

async function loadData() {
  if (window.__SITE_DATA__) {
    return window.__SITE_DATA__;
  }

  const response = await fetch("./data/site-data.json");
  if (!response.ok) {
    throw new Error(`Failed to load site data: ${response.status}`);
  }
  return response.json();
}

function hydrateStaticContent() {
  const { paperHeadlines, siteCalibrationNotes, passiveWindow, generatedAtUtc } = state.data.meta;

  text("#hero-paper-gap", formatPp(paperHeadlines.annualGapP90P10Pp));
  text("#hero-ten-year-gap", formatPercentNumber(paperHeadlines.tenYearGapPct));
  text("#hero-decile-gap", formatPp(siteCalibrationNotes.housingDecileGapPp));
  text("#hero-decile-note", siteCalibrationNotes.housingDecileGapDescription);
  text(
    "#footer-note",
    `Generated from ExternalData/FinalData. Passive calibration window: ${passiveWindow.startYear}-${passiveWindow.endYear}. Last export: ${formatDate(generatedAtUtc)}.`,
  );
}

function wireControls() {
  bindRange("#return-decile", (value) => {
    state.returnExplorer.decile = Number(value);
    text("#return-decile-output", String(value));
    renderReturnExplorer();
  });

  bindRange("#return-horizon", (value) => {
    state.returnExplorer.horizon = Number(value);
    text("#return-horizon-output", formatYearLabel(Number(value)));
    renderReturnExplorer();
  });

  bindRange("#portfolio-decile", (value) => {
    state.portfolio.decile = Number(value);
    text("#portfolio-decile-output", String(value));
    renderPortfolioSection();
  });

  bindRange("#lab-horizon", (value) => {
    state.lab.horizon = Number(value);
    text("#lab-horizon-output", formatYearLabel(Number(value)));
    renderLabSection();
  });

  bindSegmented("#portfolio-source-control", "data-source", (value) => {
    state.portfolio.source = value;
    renderPortfolioSection();
  });

  bindSegmented("#lab-source-control", "data-source", (value) => {
    state.lab.source = value;
    renderLabSection();
  });

  bindSegmented("#lab-return-control", "data-return-spec", (value) => {
    state.lab.returnSpec = value;
    renderLabSection();
  });

  text("#return-decile-output", String(state.returnExplorer.decile));
  text("#return-horizon-output", formatYearLabel(state.returnExplorer.horizon));
  text("#portfolio-decile-output", String(state.portfolio.decile));
  text("#lab-horizon-output", formatYearLabel(state.lab.horizon));
}

function renderAll() {
  renderReturnExplorer();
  renderPortfolioSection();
  renderLabSection();
}

function renderReturnExplorer() {
  const series = state.data.series.housingReturns;
  const selected = getByDecile(series, state.returnExplorer.decile);
  const base = getByDecile(series, 1);
  const horizon = state.returnExplorer.horizon;
  const selectedCompounded = compound(selected.annualizedReturn, horizon);
  const baseCompounded = compound(base.annualizedReturn, horizon);
  const medianCompounded = compound(getByDecile(series, 5).annualizedReturn, horizon);

  renderReturnLineChart(series, selected.decile);
  renderGrowthChart(series, horizon, selected.decile);

  renderMetricStrip("#returns-metrics", [
    {
      label: `Decile ${selected.decile} annualized return`,
      value: formatRate(selected.annualizedReturn),
      note: "Real capital gain implied by the decile midpoint calibration.",
    },
    {
      label: `${formatYearLabel(horizon)} compounded gain`,
      value: formatRate(selectedCompounded),
      note: `Buy-and-hold growth for decile ${selected.decile}.`,
    },
    {
      label: `Gap versus decile 1`,
      value: formatPp((selectedCompounded - baseCompounded) * 100),
      note: `${formatYearLabel(horizon)} difference in compounded gains.`,
    },
    {
      label: "Gap versus decile 5",
      value: formatPp((selectedCompounded - medianCompounded) * 100),
      note: "Compounded spread relative to the middle of the distribution.",
    },
  ]);
}

function renderPortfolioSection() {
  const profile = state.data.series.shareProfiles[state.portfolio.source];
  const selected = getByDecile(profile, state.portfolio.decile);

  renderPortfolioChart(profile, selected.decile);
  text("#portfolio-detail-title", `Decile ${selected.decile} snapshot`);
  text("#portfolio-detail-subtitle", `Current source: ${SOURCE_LABELS[state.portfolio.source]}`);

  const preview = document.querySelector("#portfolio-preview");
  preview.innerHTML = `
    <div class="share-chip housing" style="width:${selected.housing * 100}%"></div>
    <div class="share-chip financial" style="width:${selected.financial * 100}%"></div>
    <div class="share-chip pension" style="width:${selected.pension * 100}%"></div>
  `;

  renderMetricStrip(
    "#portfolio-metrics",
    [
      {
        label: "Housing share",
        value: formatRate(selected.housing),
        note: "Gross-asset portfolio weight.",
      },
      {
        label: "Financial share",
        value: formatRate(selected.financial),
        note: "Gross-asset portfolio weight.",
      },
      {
        label: "Pension share",
        value: formatRate(selected.pension),
        note: "Gross-asset portfolio weight.",
      },
      {
        label: "Risky share in financial wealth",
        value: formatRate(selected.riskyShare),
        note: "Used in the Passive return calibration.",
      },
    ],
    "compact",
  );
}

function renderLabSection() {
  const decomposition = computeDecomposition(
    state.data,
    state.lab.source,
    state.lab.returnSpec,
    state.lab.horizon,
  );
  const total = decomposition.contributions.find((row) => row.asset === "total");
  const housing = decomposition.contributions.find((row) => row.asset === "housing");
  const financial = decomposition.contributions.find((row) => row.asset === "financial");
  const pension = decomposition.contributions.find((row) => row.asset === "pension");
  const housingShare = total.contribution !== 0 ? housing.contribution / total.contribution : 0;

  renderContributionChart(decomposition.contributions);
  renderDecompositionChart(decomposition.parts);

  renderMetricStrip("#lab-metrics", [
    {
      label: "Total P90-P10 gap",
      value: formatPp(total.contribution),
      note: `${SOURCE_LABELS[state.lab.source]} with ${RETURN_SPEC_LABELS[state.lab.returnSpec]}.`,
    },
    {
      label: "Housing contribution",
      value: formatPp(housing.contribution),
      note: `Share of total gap: ${formatPercentNumber(housingShare * 100)}.`,
    },
    {
      label: "Financial contribution",
      value: formatPp(financial.contribution),
      note: "Sensitive to both share source and return calibration.",
    },
    {
      label: "Pension contribution",
      value: formatPp(pension.contribution),
      note: "Flat pension returns make this mostly a composition term.",
    },
  ]);

  text("#lab-note", buildLabNote());
}

function renderReturnLineChart(series, selectedDecile) {
  const svg = document.querySelector("#returns-line-chart");
  const width = 720;
  const height = 360;
  const padding = { top: 30, right: 24, bottom: 54, left: 62 };
  const x = scaleLinear(1, 10, padding.left, width - padding.right);
  const min = Math.min(...series.map((row) => row.annualizedReturn)) - 0.002;
  const max = Math.max(...series.map((row) => row.annualizedReturn)) + 0.002;
  const y = scaleLinear(min, max, height - padding.bottom, padding.top);

  const path = series
    .map((row, index) => `${index === 0 ? "M" : "L"} ${x(row.decile)} ${y(row.annualizedReturn)}`)
    .join(" ");
  const areaPath = `${path} L ${x(series[series.length - 1].decile)} ${height - padding.bottom} L ${x(series[0].decile)} ${height - padding.bottom} Z`;
  const selected = getByDecile(series, selectedDecile);

  svg.innerHTML = buildChartFrame(width, height)
    + buildHorizontalGrid(y, width, padding, tickValues(min, max, 5), (tick) => formatRate(tick))
    + buildBottomTicks(x, height, padding, series.map((row) => row.decile), (tick) => `D${tick}`)
    + `<path class="series-fill" d="${areaPath}"></path>`
    + `<path class="series-line" d="${path}"></path>`
    + series
      .map(
        (row) => `
          <circle
            class="series-point ${row.decile === selectedDecile ? "is-active" : ""}"
            cx="${x(row.decile)}"
            cy="${y(row.annualizedReturn)}"
            r="${row.decile === selectedDecile ? 6 : 4.6}"
          ></circle>
        `,
      )
      .join("")
    + `<text class="axis-label" x="${width / 2}" y="${height - 14}" text-anchor="middle">Income decile</text>`
    + `<text class="axis-label" x="18" y="${padding.top - 6}">Annualized return</text>`
    + `<text class="chart-value" x="${x(selected.decile)}" y="${y(selected.annualizedReturn) - 14}" text-anchor="middle">${formatRate(selected.annualizedReturn)}</text>`;

  svg.setAttribute(
    "aria-label",
    `Annualized housing capital gains by income decile. Selected decile ${selected.decile} has return ${formatRate(selected.annualizedReturn)}.`,
  );
}

function renderGrowthChart(series, horizon, selectedDecile) {
  const svg = document.querySelector("#returns-growth-chart");
  const width = 720;
  const height = 360;
  const padding = { top: 30, right: 24, bottom: 54, left: 62 };
  const values = series.map((row) => ({ decile: row.decile, value: compound(row.annualizedReturn, horizon) }));
  const max = Math.max(...values.map((row) => row.value));
  const x = scaleLinear(1, 10, padding.left + 8, width - padding.right - 8);
  const y = scaleLinear(0, max * 1.15, height - padding.bottom, padding.top);
  const barWidth = 42;

  svg.innerHTML = buildChartFrame(width, height)
    + buildHorizontalGrid(y, width, padding, tickValues(0, max * 1.15, 5), (tick) => formatRate(tick))
    + buildBottomTicks(x, height, padding, values.map((row) => row.decile), (tick) => `D${tick}`)
    + values
      .map((row) => {
        const left = x(row.decile) - barWidth / 2;
        const top = y(row.value);
        const barHeight = height - padding.bottom - top;
        return `
          <rect
            class="growth-bar ${row.decile === selectedDecile ? "is-active" : ""}"
            x="${left}"
            y="${top}"
            width="${barWidth}"
            height="${barHeight}"
            rx="12"
          ></rect>
        `;
      })
      .join("")
    + `<text class="axis-label" x="${width / 2}" y="${height - 14}" text-anchor="middle">Income decile</text>`
    + `<text class="axis-label" x="18" y="${padding.top - 6}">${formatYearLabel(horizon)} gain</text>`;

  svg.setAttribute(
    "aria-label",
    `${formatYearLabel(horizon)} compounded housing gains by income decile.`,
  );
}

function renderPortfolioChart(profile, selectedDecile) {
  const svg = document.querySelector("#portfolio-chart");
  const width = 720;
  const height = 420;
  const padding = { top: 30, right: 74, bottom: 58, left: 62 };
  const x = scaleLinear(1, 10, padding.left + 10, width - padding.right - 10);
  const y = scaleLinear(0, 1, height - padding.bottom, padding.top);
  const riskyMax = Math.max(0.35, ...profile.map((row) => row.riskyShare + 0.03));
  const yRisky = scaleLinear(0, riskyMax, height - padding.bottom, padding.top);
  const barWidth = 42;

  const barGroups = profile
    .map((row) => {
      const left = x(row.decile) - barWidth / 2;
      const housingTop = y(row.housing);
      const financialTop = y(row.housing + row.financial);
      const pensionTop = y(1);
      return `
        <g class="stack-bar" data-decile="${row.decile}">
          <rect class="housing-fill" x="${left}" y="${housingTop}" width="${barWidth}" height="${height - padding.bottom - housingTop}" rx="12"></rect>
          <rect class="financial-fill" x="${left}" y="${financialTop}" width="${barWidth}" height="${housingTop - financialTop}"></rect>
          <rect class="pension-fill" x="${left}" y="${pensionTop}" width="${barWidth}" height="${financialTop - pensionTop}"></rect>
          ${
            row.decile === selectedDecile
              ? `<rect class="stack-bar-outline" x="${left - 4}" y="${padding.top - 4}" width="${barWidth + 8}" height="${height - padding.top - padding.bottom + 8}" rx="16"></rect>`
              : ""
          }
        </g>
      `;
    })
    .join("");

  const riskyPath = profile
    .map((row, index) => `${index === 0 ? "M" : "L"} ${x(row.decile)} ${yRisky(row.riskyShare)}`)
    .join(" ");

  svg.innerHTML = buildChartFrame(width, height)
    + buildHorizontalGrid(y, width, padding, [0, 0.25, 0.5, 0.75, 1], (tick) => formatRate(tick))
    + buildBottomTicks(x, height, padding, profile.map((row) => row.decile), (tick) => `D${tick}`)
    + buildRightTicks(yRisky, width, padding, tickValues(0, riskyMax, 5), (tick) => formatRate(tick))
    + barGroups
    + `<path class="risky-line" d="${riskyPath}"></path>`
    + profile
      .map(
        (row) => `<circle class="risky-point" cx="${x(row.decile)}" cy="${yRisky(row.riskyShare)}" r="4.4"></circle>`,
      )
      .join("")
    + `<text class="axis-label" x="${width / 2}" y="${height - 14}" text-anchor="middle">Income decile</text>`
    + `<text class="axis-label" x="18" y="${padding.top - 6}">Portfolio share</text>`
    + `<text class="axis-label" x="${width - 60}" y="${padding.top - 6}" text-anchor="middle">Risky share</text>`;

  svg.setAttribute("aria-label", "Stacked portfolio shares by decile with risky-financial-share overlay.");

  svg.querySelectorAll(".stack-bar").forEach((group) => {
    group.addEventListener("click", () => {
      state.portfolio.decile = Number(group.dataset.decile);
      document.querySelector("#portfolio-decile").value = String(state.portfolio.decile);
      text("#portfolio-decile-output", String(state.portfolio.decile));
      renderPortfolioSection();
    });
  });
}

function renderContributionChart(contributions) {
  const svg = document.querySelector("#contribution-chart");
  const width = 720;
  const height = 380;
  const padding = { top: 26, right: 72, bottom: 30, left: 132 };
  const values = contributions.map((row) => row.contribution);
  const min = Math.min(0, ...values) * 1.18;
  const max = Math.max(0, ...values) * 1.18;
  const x = scaleLinear(min, max, padding.left, width - padding.right);
  const rowHeight = 62;
  const zeroX = x(0);

  const rows = contributions
    .map((row, index) => {
      const centerY = padding.top + index * rowHeight + 24;
      const barStart = Math.min(zeroX, x(row.contribution));
      const barWidth = Math.abs(x(row.contribution) - zeroX);
      return `
        <text class="chart-value" x="${padding.left - 16}" y="${centerY + 5}" text-anchor="end">${ASSET_LABELS[row.asset]}</text>
        <rect
          class="contribution-bar ${row.asset}"
          x="${barStart}"
          y="${centerY - 14}"
          width="${Math.max(barWidth, 2)}"
          height="28"
          rx="14"
        ></rect>
        <text class="chart-value" x="${x(row.contribution) + (row.contribution >= 0 ? 12 : -12)}" y="${centerY + 5}" text-anchor="${row.contribution >= 0 ? "start" : "end"}">${formatPp(row.contribution)}</text>
      `;
    })
    .join("");

  svg.innerHTML = buildChartFrame(width, height)
    + buildVerticalGrid(x, height, padding, tickValues(min, max, 5), (tick) => formatPp(tick))
    + `<line class="axis-line" x1="${zeroX}" x2="${zeroX}" y1="${padding.top - 4}" y2="${height - 32}"></line>`
    + rows
    + `<text class="axis-label" x="${width / 2}" y="${height - 10}" text-anchor="middle">Contribution to the P90-P10 gap</text>`;

  svg.setAttribute("aria-label", "Horizontal bars for asset contributions to the P90-P10 wealth-return gap.");
}

function renderDecompositionChart(parts) {
  const svg = document.querySelector("#decomposition-chart");
  const width = 720;
  const height = 420;
  const padding = { top: 52, right: 24, bottom: 58, left: 72 };
  const x = scaleLinear(1, parts.length, padding.left + 50, width - padding.right - 50);
  const values = parts.flatMap((row) => [row.composition, row.within, row.interaction, row.total]);
  const min = Math.min(0, ...values) * 1.22;
  const max = Math.max(0, ...values) * 1.22;
  const y = scaleLinear(min, max, height - padding.bottom, padding.top);
  const zeroY = y(0);
  const barWidth = 74;

  const legend = `
    <g class="component-legend">
      ${buildLegendChip(110, 24, "composition", "Composition")}
      ${buildLegendChip(300, 24, "within", "Within")}
      ${buildLegendChip(450, 24, "interaction", "Interaction")}
    </g>
  `;

  const bars = parts
    .map((row, index) => {
      const xCenter = x(index + 1);
      let pos = 0;
      let neg = 0;
      const segments = ["composition", "within", "interaction"]
        .map((key) => {
          const value = row[key];
          const isPositive = value >= 0;
          const start = isPositive ? pos : neg;
          const end = start + value;
          const rectY = isPositive ? y(end) : y(start);
          const rectHeight = Math.abs(y(end) - y(start));
          if (isPositive) {
            pos = end;
          } else {
            neg = end;
          }
          return `<rect class="component-bar ${COMPONENT_COLORS[key]}" x="${xCenter - barWidth / 2}" y="${rectY}" width="${barWidth}" height="${Math.max(rectHeight, 2)}" rx="14"></rect>`;
        })
        .join("");

      return `
        ${segments}
        <text class="chart-value" x="${xCenter}" y="${height - 20}" text-anchor="middle">${ASSET_LABELS[row.asset]}</text>
        <text class="chart-value" x="${xCenter}" y="${row.total >= 0 ? y(row.total) - 12 : y(row.total) + 24}" text-anchor="middle">${formatPp(row.total)}</text>
      `;
    })
    .join("");

  svg.innerHTML = buildChartFrame(width, height)
    + buildHorizontalGrid(y, width, padding, tickValues(min, max, 6), (tick) => formatPp(tick))
    + `<line class="axis-line" x1="${padding.left - 4}" x2="${width - padding.right + 4}" y1="${zeroY}" y2="${zeroY}"></line>`
    + legend
    + bars
    + `<text class="axis-label" x="18" y="${padding.top - 16}">Contribution</text>`
    + `<text class="axis-label" x="${width / 2}" y="${height - 10}" text-anchor="middle">Asset class</text>`;

  svg.setAttribute("aria-label", "Stacked composition, within, and interaction bars for each asset class.");
}

function computeDecomposition(data, source, returnSpec, horizon) {
  const shares = data.series.shareProfiles[source];
  const housing = data.series.housingReturns;
  const pensionRate = data.series.financialReturns.pensionFlatAnnualizedReturn;
  let financial;

  if (returnSpec === "passive") {
    financial = getPassiveReturnSeries(data.series.financialReturns.passive, source);
  } else {
    financial = data.series.financialReturns[returnSpec];
  }

  const shareMap = new Map(shares.map((row) => [row.decile, row]));
  const housingMap = new Map(housing.map((row) => [row.decile, row.annualizedReturn]));
  const financialMap = new Map(financial.map((row) => [row.decile, row.annualizedReturn]));

  const assets = ["housing", "financial", "pension"];
  const contributions = [];
  const parts = [];
  let totalGap = 0;

  for (const asset of assets) {
    const p10Share = shareMap.get(1)[asset];
    const p90Share = shareMap.get(10)[asset];
    const p10Return = compoundedReturn(asset, housingMap, financialMap, pensionRate, 1, horizon);
    const p90Return = compoundedReturn(asset, housingMap, financialMap, pensionRate, 10, horizon);

    const composition = (p90Share - p10Share) * p10Return * 100;
    const within = p10Share * (p90Return - p10Return) * 100;
    const interaction = (p90Share - p10Share) * (p90Return - p10Return) * 100;
    const total = (p90Share * p90Return - p10Share * p10Return) * 100;

    totalGap += total;
    contributions.push({ asset, contribution: total });
    parts.push({ asset, composition, within, interaction, total });
  }

  contributions.push({ asset: "total", contribution: totalGap });

  return {
    contributions,
    parts,
  };
}

function getPassiveReturnSeries(passiveReturns, source) {
  if (source === "danish") {
    return passiveReturns.danish || passiveReturns.denmark;
  }
  return passiveReturns[source];
}

function compoundedReturn(asset, housingMap, financialMap, pensionRate, decile, horizon) {
  if (asset === "housing") {
    return compound(housingMap.get(decile), horizon);
  }
  if (asset === "financial") {
    return compound(financialMap.get(decile), horizon);
  }
  return compound(pensionRate, horizon);
}

function buildLabNote() {
  if (state.lab.returnSpec !== "passive") {
    return `${RETURN_SPEC_LABELS[state.lab.returnSpec]} applies an external financial-return gradient. Housing still comes from the Danish housing-gains calibration, while pension remains flat across deciles.`;
  }

  const passiveInputs = state.data.series.financialReturns.passive.inputs.find((row) =>
    state.lab.source === "danish" ? row.country === "Denmark" : row.country === "United States",
  );

  return `${RETURN_SPEC_LABELS.passive} for ${
    SOURCE_LABELS[state.lab.source]
  } uses a risky-share mix of stock and safe returns. In the current export, the stock leg is ${formatRate(
    passiveInputs.stockRealMean,
  )} and the safe leg is ${formatRate(passiveInputs.safeRealMean)}.`;
}

function renderMetricStrip(selector, items, density = "full") {
  const container = document.querySelector(selector);
  container.classList.toggle("metric-strip-compact", density === "compact");
  container.innerHTML = items
    .map(
      (item) => `
        <article class="mini-metric">
          <span class="metric-label">${item.label}</span>
          <strong class="metric-value">${item.value}</strong>
          <p class="metric-note">${item.note}</p>
        </article>
      `,
    )
    .join("");
}

function bindRange(selector, onChange) {
  const input = document.querySelector(selector);
  input.addEventListener("input", (event) => onChange(event.target.value));
}

function bindSegmented(selector, attributeName, onChange) {
  const container = document.querySelector(selector);
  const buttons = [...container.querySelectorAll("button")];
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
      onChange(button.getAttribute(attributeName) || button.dataset[camelCase(attributeName)]);
    });
  });
}

function camelCase(attributeName) {
  return attributeName
    .replace(/^data-/, "")
    .split("-")
    .map((chunk, index) => (index === 0 ? chunk : chunk[0].toUpperCase() + chunk.slice(1)))
    .join("");
}

function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  const domainSpan = domainMax - domainMin || 1;
  const rangeSpan = rangeMax - rangeMin;
  return (value) => rangeMin + ((value - domainMin) / domainSpan) * rangeSpan;
}

function tickValues(min, max, count) {
  if (count <= 1) {
    return [min];
  }
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
}

function buildChartFrame(width, height) {
  return `<rect class="chart-frame" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="26"></rect>`;
}

function buildHorizontalGrid(scale, width, padding, ticks, formatter) {
  return ticks
    .map((tick) => {
      const y = scale(tick);
      return `
        <line class="grid-line" x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}"></line>
        <text class="tick-label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${formatter(tick)}</text>
      `;
    })
    .join("");
}

function buildVerticalGrid(scale, height, padding, ticks, formatter) {
  return ticks
    .map((tick) => {
      const x = scale(tick);
      return `
        <line class="grid-line" x1="${x}" x2="${x}" y1="${padding.top}" y2="${height - padding.bottom}"></line>
        <text class="tick-label" x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle">${formatter(tick)}</text>
      `;
    })
    .join("");
}

function buildBottomTicks(scale, height, padding, ticks, formatter) {
  return ticks
    .map((tick) => {
      const x = scale(tick);
      return `<text class="tick-label" x="${x}" y="${height - padding.bottom + 22}" text-anchor="middle">${formatter(tick)}</text>`;
    })
    .join("");
}

function buildRightTicks(scale, width, padding, ticks, formatter) {
  return ticks
    .map((tick) => {
      const y = scale(tick);
      return `<text class="tick-label" x="${width - padding.right + 10}" y="${y + 4}" text-anchor="start">${formatter(tick)}</text>`;
    })
    .join("");
}

function buildLegendChip(x, y, className, label) {
  return `
    <rect class="component-bar ${className}" x="${x}" y="${y - 10}" width="24" height="14" rx="7"></rect>
    <text x="${x + 34}" y="${y + 1}">${label}</text>
  `;
}

function getByDecile(rows, decile) {
  return rows.find((row) => row.decile === decile);
}

function compound(rate, years) {
  return (1 + rate) ** years - 1;
}

function formatRate(rate) {
  return `${(rate * 100).toFixed(2)}%`;
}

function formatPp(value) {
  return `${value.toFixed(2)} pp`;
}

function formatPercentNumber(value) {
  return `${value.toFixed(1)}%`;
}

function formatYearLabel(years) {
  return years === 1 ? "1 year" : `${years} years`;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function text(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}
