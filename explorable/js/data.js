/* ------------------------------------------------------------------------
   data.js — every number in this explorable, in one place.

   Source: Bäckman, "One Advisor for the Whole World? Cross-Country Evidence
   on Financial Advice from Large Language Models" (Writing/1_AI_FinAdvice.tex).
   Each block names the table or section it was transcribed from, so a re-run
   of the Stata pipeline can be diffed against it.

   Raw response histograms and country-by-model cell means are NOT here — they
   are generated from the collection itself into responses.js by
   docs/explorable/extract_data.py.
   ------------------------------------------------------------------------ */

window.D = (function () {

  /* -- the prompt, exactly as sent (PROJECT_PLAN.md, Q1 block) ------------ */

  var PROMPT = {
    before: "I am 40 years old and looking to invest ",
    amount: "$50,000",
    mid: " over a five-year horizon. I have a standard pension plan otherwise.\n\nI am thinking of splitting my investment between a broad stock market index fund and some government bonds. What percentage should I invest in the stock fund?",
    liveLine: "I live in "
  };

  /* -- countries ---------------------------------------------------------
     mean, sd, p10, med, p90, n   <- tab_summary_primary_body.tex
     fe, ci, pWild, pHolm         <- tab_eq1_countryfe_body.tex
     sigma, z, rho                <- tab_benchmark_params_body.tex
     alphaS, gap, lossBp, loss5y  <- tab_benchmark_gaps_body.tex
     local, infl, pens            <- tab_h9_text_body.tex, converted from
                                     contrasts to levels using the US base
                                     rates given in that table's notes
                                     (18.0 local, 33.7 inflation, 97.5 pension)
     q2                           <- tab_q2_countryfe_body.tex
     q4equity, q4linker, q4gold,
     q4realestate                 <- tab_q4_instrument_body.tex
     ------------------------------------------------------------------- */

  var C = [
    // key            label               lang         amount              mean  sd    p10   med   p90   n    fe     ciLo   ciHi  pWild pHolm  sigma  z      rho    alphaS gap    lossBp loss5y local infl  pens  q2     premise q4eq  q4lnk q4gld q4re
    ["USA",          "United States",    "English",    "$50,000",          0.57, 0.13, 0.40, 0.60, 0.70, 650, null,  null,  null, null, null,  18.4,  0.12,  51.3,  0.52,  0.05,  1.2,   29,    18.0, 33.7, 97.5, null,  false,  96.8, 2.9,  0,    0   ],
    ["UK",           "United Kingdom",   "English",    "£40,000",          0.58, 0.13, 0.40, 0.60, 0.75, 650, 0.7,   -0.8,  2.2,  0.352, 1.000, 19.1,  0.05,  54.2,  0.49,  0.09,  4.5,   113,   89.8, 39.5, 89.0, -14.3, false,  98.0, 2.0,  0,    0   ],
    ["Sweden",       "Sweden",           "Swedish",    "500 000 kr",       0.57, 0.13, 0.40, 0.50, 0.75, 649, -0.2,  -3.7,  3.4,  0.931, 1.000, 19.2,  0.05,  66.3,  0.48,  0.09,  4.4,   110,   47.6, 14.3, 90.7, -10.0, false,  99.8, 0.2,  0,    0   ],
    ["Finland",      "Finland",          "Finnish",    "45.000 euroa",     0.55, 0.15, 0.35, 0.60, 0.75, 648, -2.4,  -5.0,  0.4,  0.086, 0.602, 18.5,  -0.28, 65.7,  0.52,  0.03,  0.4,   11,    57.4, 20.4, 89.5, -19.1, false,  100.0, 0,   0,    0   ],
    ["Germany",      "Germany",          "German",     "45.000 Euro",      0.53, 0.14, 0.30, 0.60, 0.70, 650, -4.0,  -7.7,  -0.4, 0.034, 0.335, 18.5,  -0.04, 53.3,  0.52,  0.01,  0.1,   2,     63.1, 21.2, 99.0, -21.1, false,  88.6, 0.2,  0,    11.2],
    ["France",       "France",           "French",     "45 000 euros",     0.51, 0.14, 0.30, 0.60, 0.70, 649, -5.4,  -7.5,  -3.4, 0.001, 0.001, 18.5,  -0.03, 70.0,  0.52,  0.00,  0.0,   0,     77.0, 18.9, 96.6, -15.7, false,  97.8, 2.2,  0,    0   ],
    ["Spain",        "Spain",            "Spanish",    "45.000 euros",     0.53, 0.12, 0.40, 0.60, 0.70, 648, -4.4,  -6.3,  -2.5, 0.001, 0.001, 18.5,  -0.16, 86.3,  0.52,  0.01,  0.0,   1,     79.1, 24.2, 99.4, -20.4, false,  96.4, 3.6,  0,    0   ],
    ["Japan",        "Japan",            "Japanese",   "750万円",           0.58, 0.14, 0.35, 0.60, 0.70, 650, 1.2,   -2.1,  4.8,  0.492, 1.000, 20.4,  -0.36, 42.4,  0.43,  0.15,  14.7,  368,   54.3, 24.3, 96.4, -28.6, false,  99.7, 0.2,  0,    0   ],
    ["Brazil",       "Brazil",           "Portuguese", "R$ 250.000",       0.46, 0.14, 0.30, 0.40, 0.70, 650, -11.0, -15.0, -6.9, 0.001, 0.002, 27.5,  -0.25, 97.5,  0.23,  0.23,  57.8,  1461,  93.8, 58.8, 97.2, -1.7,  true,   13.1, 86.7, 0,    0   ],
    ["Australia",    "Australia",        "English",    "AUD 75,000",       0.58, 0.12, 0.40, 0.60, 0.70, 650, 0.6,   -0.7,  1.9,  0.343, 1.000, 19.0,  0.14,  53.0,  0.49,  0.08,  3.9,   98,    86.2, 30.9, 94.9, -17.1, false,  98.3, 1.5,  0,    0   ],
    ["Canada",       "Canada",           "English",    "CAD 70,000",       0.56, 0.13, 0.40, 0.60, 0.70, 650, -1.1,  -2.1,  -0.1, 0.029, 0.317, 18.5,  0.18,  45.1,  0.52,  0.04,  0.8,   21,    77.4, 33.5, 99.8, -12.3, false,  97.2, 2.6,  0,    0   ],
    ["India",        "India",            "English",    "INR 4,000,000",    0.55, 0.12, 0.40, 0.60, 0.70, 650, -1.9,  -3.3,  -0.4, 0.015, 0.200, 19.6,  -0.28, 44.6,  0.46,  0.09,  4.3,   109,   88.3, 51.5, 97.3, -3.8,  true,   88.5, 7.8,  3.7,  0   ],
    ["South Africa", "South Africa",     "English",    "ZAR 900,000",      0.56, 0.12, 0.40, 0.60, 0.70, 648, -0.9,  -2.4,  0.5,  0.219, 1.000, 19.0,  0.97,  8.9,   0.49,  0.07,  2.5,   63,    96.2, 66.9, 97.5, -2.4,  true,   82.0, 16.3, 0,    0   ],
    ["Netherlands",  "Netherlands",      "Dutch",      "€ 45.000",         0.53, 0.14, 0.30, 0.60, 0.70, 649, -4.2,  -6.8,  -1.7, 0.004, 0.049, 18.5,  0.19,  96.0,  0.52,  0.01,  0.1,   1,     61.0, 29.0, 97.0, -16.0, false,  99.5, 0.3,  0,    0   ],
    ["Italy",        "Italy",            "Italian",    "45.000 euro",      0.48, 0.14, 0.30, 0.50, 0.70, 650, -8.6,  -11.9, -5.3, 0.001, 0.001, 18.5,  -0.09, 79.0,  0.52,  -0.03, 0.5,   14,    88.5, 24.9, 96.1, -19.5, false,  93.2, 6.8,  0,    0   ],
    ["Switzerland",  "Switzerland",      "German",     "CHF 45'000",       0.53, 0.14, 0.30, 0.60, 0.70, 649, -4.3,  -7.6,  -1.1, 0.016, 0.200, 18.7,  -0.02, 47.5,  0.51,  0.02,  0.2,   5,     84.5, 17.1, 94.3, -21.6, false,  95.2, 0.5,  0,    4.3 ],
    ["Poland",       "Poland",           "Polish",     "200 000 zł",       0.50, 0.14, 0.30, 0.50, 0.70, 650, -7.4,  -10.8, -3.9, 0.001, 0.011, 22.5,  -0.07, 40.6,  0.35,  0.15,  16.3,  408,   74.3, 65.1, 89.3, -16.2, false,  61.1, 38.6, 0,    0   ],
    ["South Korea",  "South Korea",      "Korean",     "7,000만원",         0.58, 0.11, 0.40, 0.60, 0.70, 650, 1.4,   -2.8,  5.7,  0.496, 1.000, 18.4,  -0.04, 38.9,  0.53,  0.06,  1.6,   40,    47.2, 33.9, 92.0, -17.3, false,  94.0, 6.0,  0,    0   ],
    ["China",        "China",            "Chinese",    "350,000元",         0.52, 0.10, 0.40, 0.50, 0.65, 649, -4.4,  -8.8,  -0.2, 0.041, 0.371, 19.1,  -0.02, 103.6, 0.48,  0.04,  0.9,   23,    50.9, 13.2, 94.9, -22.7, false,  96.3, 0.2,  0,    0   ],
    ["Mexico",       "Mexico",           "Spanish",    "MXN 1,000,000",    0.54, 0.14, 0.30, 0.60, 0.70, 650, -2.7,  -4.2,  -1.2, 0.001, 0.003, 21.7,  -0.14, 79.6,  0.38,  0.17,  19.5,  489,   95.2, 55.5, 94.1, -1.9,  true,   41.9, 58.1, 0,    0   ],
    ["Turkey",       "Turkey",           "Turkish",    "2.000.000 TL",     0.54, 0.11, 0.40, 0.60, 0.65, 650, -3.1,  -6.5,  -0.1, 0.044, 0.371, 29.1,  0.02,  96.4,  0.21,  0.33,  136.7, 3513,  88.6, 90.0, 98.1, -1.6,  true,   17.5, 66.0, 16.3, 0   ]
  ];

  var FIELDS = ["key", "label", "lang", "amount", "mean", "sd", "p10", "med", "p90", "n",
    "fe", "ciLo", "ciHi", "pWild", "pHolm", "sigma", "z", "rho", "alphaS", "gap",
    "lossBp", "loss5y", "local", "infl", "pens", "q2", "premise",
    "q4eq", "q4lnk", "q4gld", "q4re"];

  var countries = C.map(function (row) {
    var o = {};
    FIELDS.forEach(function (f, i) { o[f] = row[i]; });
    o.english = o.lang === "English";
    return o;
  });

  var byKey = {};
  countries.forEach(function (c) { byKey[c.key] = c; });

  /* -- models -------------------  tab_by_model_body.tex ------------------ */

  var models = [
    { name: "Gemini 3.1 Pro",     vendor: "Google",    mean: 0.37, sd: 0.08 },
    { name: "GPT-5-mini",         vendor: "OpenAI",    mean: 0.38, sd: 0.08 },
    { name: "GPT-5.5",            vendor: "OpenAI",    mean: 0.41, sd: 0.05 },
    { name: "DeepSeek V4 Flash",  vendor: "DeepSeek",  mean: 0.45, sd: 0.12 },
    { name: "DeepSeek V4 Pro",    vendor: "DeepSeek",  mean: 0.48, sd: 0.12 },
    { name: "Grok 4.3",           vendor: "xAI",       mean: 0.54, sd: 0.09 },
    { name: "Gemini 3 Flash",     vendor: "Google",    mean: 0.56, sd: 0.07 },
    { name: "Gemini 3.5 Flash",   vendor: "Google",    mean: 0.57, sd: 0.06 },
    { name: "Claude 4.8 Opus",    vendor: "Anthropic", mean: 0.58, sd: 0.04 },
    { name: "Claude 4.6 Sonnet",  vendor: "Anthropic", mean: 0.63, sd: 0.04 },
    { name: "Claude 4.6 Opus",    vendor: "Anthropic", mean: 0.65, sd: 0.07 },
    { name: "Mistral Medium 3.5", vendor: "Mistral",   mean: 0.70, sd: 0.04 },
    { name: "Claude 4.5 Haiku",   vendor: "Anthropic", mean: 0.71, sd: 0.04 }
  ];

  /* -- headline scalars --------------------------------------------------- */

  var K = {
    // design and collection            (sec:design, sec:data)
    nQueries: 267150,
    nPrimary: 13639,
    nModels: 13,
    nVendors: 6,
    nCountries: 21,
    reps: 50,
    temperature: 0.7,
    maxTokens: 4000,
    parseRate: 99.9,
    refusals: 0,
    preregDate: "2 July 2026",
    collectDates: "3–4 July 2026",
    osf: "https://osf.io/2ch5z",

    // descriptive                      (sec:descriptive)
    modeShare: 31,      // % of responses at exactly 60
    multiplesOfTen: 85, // % at multiples of ten
    supportLo: 10,
    supportHi: 80,
    bandLo: 0.46,
    bandHi: 0.58,
    withinSd: 0.13,

    // variance decomposition           (sec:descriptive)
    varModel: 69.5,
    varCountry: 5.7,
    varInteraction: 9.5,
    varWithin: 15.3,
    modelRange: 34,
    countryRange: 12,

    // H1                               (sec:main-countryfe)
    jointF: 20.56,
    jointDf: "20,12",
    jointP: 0.006,
    holmSurvivors: 7,
    uncorrectedSurvivors: 13,
    mdeSingle: 4,

    // H4 / H5                          (sec:main-decomposition)
    lambda: -1.3, lambdaP: 0.007, lambdaLo: -2.3, lambdaHi: -0.4,
    phi: -0.7, phiP: 0.069, phiLo: -1.5, phiHi: 0.1,

    // benchmark                        (sec:benchmark-results)
    premium: 0.0532,   // common equity premium, mu - r
    gammaBase: 3,
    kappa: 0.130, kappaSe: 0.112,
    kappaCiLo: -0.145, kappaCiHi: 0.328,
    kappaVsOneP: 0.001,   // p < 0.001 against kappa = 1
    kappaVsZeroP: 0.317,
    kappaGridLo: 0.07, kappaGridHi: 0.43,
    prescribedSpread: 32,
    frischLo: 0.13, frischHi: 0.97,

    // preferences and literacy         (sec:calibration)
    gpsSlope: 0.028, gpsSe: 0.021, gpsP: 0.272,

    // welfare                          (sec:benchmark-welfare)
    medianLossBp: 1.6, medianLoss5y: 40, underFiveBp: 16,

    // explanation text                 (sec:text)
    usLocal: 18.0, usInfl: 33.7, usPens: 97.5,
    localMin: 30, localMax: 78,
    localHolmSurvivors: 19,
    phiText: 23.3, phiTextP: 0.001, phiTextLo: 14.3, phiTextHi: 32.9,
    judge: "Claude Opus 4.7",
    explainWordLimit: 200,

    // stated-investor arm              (sec:stated, tab_bgrt_coef_body.tex)
    betaRisk: 46.3, betaRiskLo: 41.1, betaRiskHi: 51.4,
    betaPens: -1.0, betaPensLo: -2.3, betaPensHi: 0.2, betaPensP: 0.107,
    betaRiskPens: 3.6, betaRiskPensLo: 2.0, betaRiskPensHi: 5.2,
    betaHorizon: 39.9, betaHorizonLo: 25.7, betaHorizonHi: 53.4,
    riskSpanCountries: 3,     // pp band of the risk response across 21 countries
    horizonSpanCountries: 11.9,
    impliedGammaTolerant: 2, impliedGammaAverse: 5, impliedGammaBase: 3,

    // age                              (sec:main-age)
    age30: 6.24, age55: -11.13,
    psi: -0.0002, psiP: 0.96,
    ruleSlope: -0.70, ruleSlopeExact: -1.00,
    ruleSlopeEnglish: -0.65, ruleSlopeOther: -0.72,
    citeUS: 14.8, citeIndia: 17.1, citeNonEnglish: 0.03,

    // robustness                       (sec:robustness)
    usdShift: -0.1, usdShiftP: 0.84, usdShiftLo: -1.6, usdShiftHi: 1.4,
    japanNumeral: 2.8, japanNumeralP: 0.01,
    tempShift: 0.3,
    brazilByTemp: [-10.0, -11.0, -11.4],
    sdByTemp: [0.035, null, 0.041],

    // language provenance footnote     (intro footnote)
    glidvagShare: 0.3, glidvagCount: 17, glidvagOneVendor: 13,
    generationsfond: 0, corpusLines: "5 million"
  };

  /* -- stated-investor cells ---------------------------------------------
     Cell means computed from the collection itself (see responses.js
     window.RESPONSES.bgrt). Reproduced here as labelled constants because
     the deck reads them by name. Every difference below reconciles exactly
     with tab_bgrt_coef_body.tex.
     ------------------------------------------------------------------- */

  var stated = {
    reference: 0.57,                 // no statement, five-year horizon
    risk: {
      averse:   { limited: 0.3045, generous: 0.2944 },
      tolerant: { limited: 0.7674, generous: 0.7931 }
    },
    horizon: { "1": 0.3581, "5": 0.57, "20": 0.7569 }
  };

  /* -- exploratory balance-sheet probes -- tab_upgrade_coef_body.tex ------ */

  var probes = [
    { id: "equityPension", side: "exposed",
      statement: "My pension is invested almost entirely in stocks.",
      theory: "down", est: -16.9, lo: -21.8, hi: -12.1, p: 0.001, scope: "21 countries" },
    { id: "allWealth", side: "exposed",
      statement: "This $50,000 is all of my liquid wealth.",
      theory: "down", est: -23.3, lo: -30.4, hi: -16.1, p: 0.001, scope: "United States" },
    { id: "unhedged", side: "exposed",
      statement: "The stock fund is not currency-hedged.",
      theory: "down", est: -1.3, lo: -3.2, hi: 0.4, p: 0.149, scope: "21 countries" },
    { id: "annuity", side: "safe",
      statement: "My pension is a guaranteed inflation-linked annuity.",
      theory: "up", est: 4.8, lo: 0.1, hi: 9.6, p: 0.042, scope: "21 countries" },
    { id: "halfWealth", side: "safe",
      statement: "This $50,000 is half of my liquid wealth.",
      theory: "up", est: 1.4, lo: -0.4, hi: 3.3, p: 0.109, scope: "United States" },
    { id: "thirdWealth", side: "safe",
      statement: "This $50,000 is a third of my liquid wealth.",
      theory: "up", est: 2.5, lo: -0.1, hi: 4.9, p: 0.057, scope: "United States" },
    { id: "hedged", side: "safe",
      statement: "The stock fund is currency-hedged.",
      theory: "up", est: 0.4, lo: -1.5, hi: 2.2, p: 0.659, scope: "21 countries" }
  ];

  /* -- the three candidate advisors ------------  sec:stated -------------- */

  var suspects = [
    {
      id: "merton",
      name: "The Merton planner",
      blurb: "Solves the textbook portfolio problem: expected return over risk aversion times variance. Nothing else enters.",
      sig: { risk: "up", horizon: "flat", pension: "flat" },
      why: "Under constant relative risk aversion with returns that are independent year to year, the optimal share is exactly the same at one year and at twenty. Horizon does not appear in the formula.",
      verdict: "Ruled out by the horizon response. Forty points where theory says zero."
    },
    {
      id: "lifecycle",
      name: "The lifecycle planner",
      blurb: "Sizes the liquid portfolio against everything else on the household's balance sheet, pension wealth and future earnings included.",
      sig: { risk: "up", horizon: "flat", pension: "up" },
      why: "A generous pension is a large bond-like claim. Holding it crowds equity into the liquid portfolio, not out of it. The effect should be large.",
      verdict: "Ruled out by the pension null. One percentage point where theory needs an order of magnitude more."
    },
    {
      id: "questionnaire",
      name: "The retail risk questionnaire",
      blurb: "The two-question intake form of the advice industry. How do you feel about losses, and when do you need the money?",
      sig: { risk: "up", horizon: "up", pension: "flat" },
      why: "It asks about tolerance and horizon because those are the two boxes on the form. The balance sheet is not on the form.",
      verdict: "Fits. Both cues move the number, the balance sheet does not."
    }
  ];

  /* -- helpers ------------------------------------------------------------ */

  // Merton share at a given risk aversion, from the country's local-currency
  // volatility. Reproduces the paper's benchmark column at gamma = 3.
  function merton(sigmaPct, gamma, premium) {
    var s = sigmaPct / 100;
    var a = (premium === undefined ? K.premium : premium) / (gamma * s * s);
    return Math.max(0, Math.min(1, a));
  }

  // Certainty-equivalent loss from holding `advice` when `optimal` is right,
  // as a fraction of the stake per year.  0.5 * gamma * sigma^2 * gap^2
  function ceLoss(sigmaPct, gamma, advice, optimal) {
    var s = sigmaPct / 100, d = advice - optimal;
    return 0.5 * gamma * s * s * d * d;
  }

  // Compounded cost over the prompt's five-year horizon on a $50,000 stake.
  function loss5y(annual, stake) {
    return (stake === undefined ? 50000 : stake) * (Math.pow(1 + annual, 5) - 1);
  }

  // Risk aversion allowed to vary with measured national risk-taking:
  // gamma_c = gammaBar * (1 - eta * z_c).  eta = 0 is the common-preference case.
  function gammaFor(gammaBar, eta, z) {
    return Math.max(0.5, gammaBar * (1 - eta * z));
  }

  return {
    PROMPT: PROMPT,
    countries: countries,
    byKey: byKey,
    models: models,
    K: K,
    stated: stated,
    probes: probes,
    suspects: suspects,
    merton: merton,
    ceLoss: ceLoss,
    loss5y: loss5y,
    gammaFor: gammaFor
  };
})();
