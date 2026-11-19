/* ------------------------------------------------------------------------
   decks-rule.js — the second half of the spine.

   words -> local -> levers -> lineup -> asym -> world

   Registered after decks.js, so the map's spine order follows the argument.
   ------------------------------------------------------------------------ */

(function () {

  var h = CH.h;
  var K = D.K;

  function head(eyebrow, title) {
    var f = document.createDocumentFragment();
    if (eyebrow) f.appendChild(h("p", { class: "eyebrow", text: eyebrow }));
    if (title) f.appendChild(h("h2", { class: "head", text: title }));
    return f;
  }
  function p(text, cls) { return h("p", { class: cls || "", html: text }); }
  function cols(left, right, mod) {
    return h("div", { class: "cols " + (mod || "") }, [
      h("div", { class: "stack" }, left),
      h("div", {}, right)
    ]);
  }

  /* ======================================================================
     WORDS — they know exactly where you live
     ====================================================================== */

  EX.deck("words", {
    title: "They know where you live",
    back: "same",
    next: function () { return EX.done("warranted") ? "local" : "warranted"; },
    slides: [

      { title: "The second explanation",
        render: function (el) {
          el.appendChild(head("The second explanation", "Suppose it cannot tell the countries apart"));
          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("These models learned overwhelmingly from American English. If Ankara and Amsterdam are not distinct places to them, then uniform advice is a gap in what they know, and a more capable model would fix it.", "lede"),
            p("There is a way to check, and it was built into the experiment. Every one of the " + K.nQueries.toLocaleString("en-US") + " answers arrived with a written explanation attached, capped at " + K.explainWordLimit + " words."),
            p("A separate model, from a different company and not among the thirteen under study, then read every one of those explanations and marked whether it named anything local. It was shown the explanation and nothing else. Not the country, not the model, not the number.")
          ]));
          el.appendChild(h("p", { class: "note", style: "margin-top:1.4rem;max-width:38rem",
            text: "Four judge models from independent vendors were checked against each other and against hand-coding before any of this was estimated. The local-context category cleared both agreement thresholds, though it was the hardest of the four to code." }));
        }
      },

      { title: "A hundred explanations", top: true,
        render: function (el) {
          el.appendChild(head("The check", "The top half moves. The bottom half does not."));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Each dot is one explanation in a hundred. It lights up when the model names something specific to the investor's country — a pension scheme, a tax, a local index fund, a government bond."),
              p("In the United States, <span class='num'>18</span> light up. In South Africa, <span class='num'>96</span>."),
              p("The needle underneath is the equity share those same explanations were attached to. The faint marks behind it are the other twenty countries."),
              p("Change the country a few times and watch the two halves separately.", "kicker")
            ]),
            P.localGrid({ country: "USA" })
          ]));
        }
      },

      { title: "Hand it to them",
        render: function (el, api) {
          el.appendChild(head("The strongest cue in the design", "Now name the instruments outright"));

          var left = [
            p("Version C of the prompt drops the generic vocabulary and names the actual local products. Not “a broad stock market index fund” but <em class='term'>eMAXIS Slim All-Country Equity</em>. Not “a standard pension plan” but <em class='term'>tjänstepension</em>, or <em class='term'>bAV</em>, or <em class='term'>iDeCo</em>."),
            p("This is the most local context the experiment can supply. It is handed over in the question itself, so no retrieval is required."),
            p("Local references in the prose rise by <span class='num'>+" + K.phiText + " points</span>, and sixteen of the twenty-one countries end up naming something local almost every time."),
            p("The allocation moves <span class='num advice-t'>" + Math.abs(K.phi) + " of a point</span>, and not significantly. This was a pre-registered primary prediction, and it is the one the data did not support. Asking in the local language instead of English moves it by " + Math.abs(K.lambda) + " points.", "kicker")
          ];

          var flavour = h("p", { class: "note" }, [
            document.createTextNode("The words of the answer can also give away where the concept came from. "),
            api.inlineDoor("glidvag", "One Swedish word, which is not a Swedish word"),
            document.createTextNode(" ")
          ]);
          left.push(flavour);

          var right = h("div", { class: "stack" }, [
            P.localGrid({ country: "Sweden", version: "C" })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));

        }
      },

      { title: "They know",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Verdict" }));
          el.appendChild(h("h2", { class: "head", text: "They know. It does not reach the number." }));

          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("Local financial context appears in three quarters of non-US explanations without anyone asking for it, and in almost all of them once the prompt supplies it.", "lede"),
            p("Run the same regression, on the same answers, with the same statistics, on a different outcome. Ask whether the explanation named anything local, and South Africa comes out <span class='num'>78 points</span> above the United States. On the equity share the same machinery finds nothing for South Africa. The design can detect country differences where the output contains them."),
            p("This fits what interpretability research finds inside multilingual models: the task is solved in a shared, English-leaning representation, and the language is handled near the input and the output. Translating the question changes the words of the answer and not the rule behind it."),
            p("It also matters for anyone reading the advice. A reader who sees their own pension system named has every reason to think the recommendation was built for them, and cannot tell from the answer that the number would have been much the same elsewhere.")
          ]));

          var nextUp = EX.done("warranted")
            ? [["local", "Both paths taken. Does the country ever reach the number?",
                "On the allocation question the country shows up in the prose and barely in the advice. The same models were asked two other questions, about a mortgage and about inflation.",
                "Continue"]]
            : [["warranted", "Now the other one: maybe the same answer is right.",
                "Under standard portfolio theory every investor holds the same world stock index, so an advisor who ignores your passport might be right. There is a benchmark to check this against.",
                "Work out what the answer should be"]];

          el.appendChild(h("div", { style: "margin-top:1.6rem" }, [api.doors(nextUp)]));
        }
      }
    ]
  });

  /* ======================================================================
     LOCAL — the questions where the advice does localize
     ====================================================================== */

  EX.deck("local", {
    title: "Where the advice does localize",
    next: "levers",
    back: function () { return EX.done("words") ? "words" : "warranted"; },
    slides: [

      { title: "A different question",
        render: function (el) {
          el.appendChild(head("The same design, pointed elsewhere", "Does the country ever reach the number?"));
          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("If a design finds little, the first thing to ask is whether it could have found anything.", "lede"),
            p("So here is the same design on a second question. Same thirteen models, same twenty-one countries, same statistics."),
            h("div", { class: "promptbox", style: "max-width:38rem" }, [
              h("div", { class: "pb-head", text: "Question 2, as sent" }),
              h("p", { class: "pb-p", text: "I am 40 years old with $50,000 in savings. I have a mortgage on my home with a 4% annual interest rate and 20 years remaining. I am thinking about whether to use some or all of this money to pay down the mortgage, or to invest it in a broad stock market index fund instead." }),
              h("p", { class: "pb-p", text: "What fraction of the $50,000 would you recommend I invest in the stock fund?" })
            ]),
            h("p", { class: "note", text: "Paying down a mortgage is a risk-free investment that returns the contract rate, so whether 4% is cheap or expensive depends on local interest rates and inflation." })
          ]));
        }
      },

      { title: "It finds plenty", top: true,
        render: function (el) {
          el.appendChild(head("The answer", "Ten to twenty-nine points"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("In fifteen countries the models recommend investing <span class='num advice-t'>10 to 29 points</span> less than in the United States, and all fifteen differences survive the correction. Japan at −28.6. China at −22.7. Switzerland at −21.6. Germany at −21.1."),
              p("The hollow rings are the same countries on the allocation question. Japan's gap alone is more than twice the largest gap there.", "lede"),
              p("The split of the variation reverses too. On this question the country accounts for <span class='num advice-t'>" + K.varCountryQ2 + "%</span> of it and the model for <span class='num'>" + K.varModelQ2 + "%</span>. On the allocation question it was 6% against 70%."),
              p("The five pale dots are countries where mortgage rates were more than double the prompt's 4% when it was written. They were flagged in advance, to see whether the models would object to an unrealistic rate. None refused. They took the 4% as given and advised much as they do in the United States.")
            ]),
            P.q2Plot()
          ]));
        }
      },

      { title: "Take the rate away", top: true,
        render: function (el) {
          var N = D.nonum;
          el.appendChild(head("A follow-up", "Without the 4%, the models supply the local rate"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("In November 2026 the same question was asked again with the rate removed, and each model was asked which mortgage rate it had assumed. The assumed rates follow the real ones, from 2.0% for Switzerland to 26.6% for Turkey (correlation <span class='num'>" + N.corrAssumedPrevailing + "</span> in logs)."),
              p("And the advice follows the assumed rate. In the eleven countries where mortgages cost less than 4%, the average gap to the United States narrows from <span class='num'>" + N.lowRateGap[0] + "</span> to <span class='num advice-t'>" + N.lowRateGap[1].toFixed(1) + " points</span>. Japan moves from 26.9 points below the United States to 3.0 above. In the five high-rate countries the gap widens from <span class='num'>" + N.premiseGap[0] + "</span> to <span class='num advice-t'>" + N.premiseGap[1] + " points</span>, toward paying the mortgage down.", "lede"),
              p("So the large gaps on the previous slide were the models pricing a 4% loan in economies where 4% is expensive."),
              h("p", { class: "note", text: "Exploratory, collected after the pre-registered results. Turkey moves little: the models assume 40.6% inflation there, which makes the real cost of the mortgage negative." })
            ]),
            P.nonumPlot()
          ]));
        }
      },

      { title: "And inflation too", top: true,
        render: function (el) {
          el.appendChild(head("The third question", "The instrument changes with the country"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Asked how to protect savings from three percent inflation, the models say equities nearly everywhere. Equities come first in 93% or more of answers in fourteen countries."),
              p("In Brazil they switch to inflation-linked bonds (<span class='num'>86.7%</span>). In Turkey to inflation-linked bonds and gold (<span class='num'>82.3%</span> combined). Mexico tilts the same way.", "lede"),
              p("The tilt appears inside the English-prompting group too, with India and South Africa at 11.5% and 16.3% against under 3% in the United States, United Kingdom, Canada and Australia. So it follows the country and not the language."),
              p("Here too the country accounts for more of the variation than the model, " + K.varCountryQ3 + "% against " + K.varModelQ3 + "%."),
              h("p", { class: "note", text: "Japan is the sharpest case: indistinguishable from the United States on the allocation question, and the largest gap in the study on both of the others." })
            ]),
            P.q4Instruments()
          ]));
        }
      },

      { title: "Selective localization",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Verdict" }));
          el.appendChild(h("h2", { class: "head", text: "The models localize when the question depends on the local economy" }));

          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("On the mortgage and inflation questions the country effects follow local interest rates. A one-standard-deviation higher mortgage rate goes with <span class='num'>" + K.q2PerSdMortgageRate + " points</span> more investment, and the mortgage rate alone accounts for two thirds of the differences between countries.", "lede"),
            p("On the allocation question no country characteristic does anything comparable. The two sets of country effects are also unrelated to each other: the countries that get less equity are not the countries told to prepay (correlation " + K.corrQ1Q2.toFixed(2) + "), while the mortgage and inflation effects move together (" + K.corrQ2Q3.toFixed(2) + ")."),
            p("Localizing is not the same as being right. Against a benchmark for the mortgage decision, the models recommend investing more than it prescribes in every country, by 28 points on average."),
            p("So the models hold local economic knowledge and use it where the question calls for a local interest rate. On the allocation question the country barely enters.")
          ]));

          el.appendChild(h("div", { style: "margin-top:1.6rem" }, [
            api.doors([["levers", "Then what does move the allocation?",
              "A separate arm of the experiment kept the country fixed and changed one sentence about the investor herself.",
              "Continue"]])
          ]));
        }
      }
    ]
  });

  /* ======================================================================
     LEVERS — what does move the number
     ====================================================================== */

  EX.deck("levers", {
    title: "What does move it",
    next: "lineup",
    back: "local",
    slides: [

      { title: "Turn it around",
        render: function (el) {
          el.appendChild(head("Back to the allocation", "What does move the number?"));
          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("The country barely moves the recommended equity share. So ask what does.", "lede"),
            p("A separate arm of the experiment kept the prompt in English, kept the country, and inserted one sentence about the investor herself. Each sentence targets something portfolio theory has a specific prediction about, so the pattern of responses says which rule the advice follows."),
            p("Three sentences. Three predictions. Watch which ones the models act on.")
          ]));
          el.appendChild(h("p", { class: "note", style: "margin-top:1.4rem;max-width:38rem",
            text: "All three of these were pre-registered before collection, as secondary confirmatory tests with the same statistics as the main results." }));
        }
      },

      { title: "The three sentences", top: true,
        render: function (el) {
          el.appendChild(h("p", { class: "eyebrow", text: "Your turn" }));
          el.appendChild(h("h2", { class: "head", style: "max-width:40ch;margin-bottom:.5rem",
            text: "Two departures from theory, in opposite directions" }));
          el.appendChild(h("p", { class: "note", style: "max-width:46rem;margin-bottom:1.2rem",
            text: "Each panel shows the recommended equity share. The orange needle is what the models said, the grey tick is where a plain prompt with no extra sentence lands, and the teal marker is what portfolio theory says the sentence should have done. Move one control at a time." }));
          el.appendChild(P.dials());
        }
      },

      { title: "Mentioned, not used",
        render: function (el) {
          el.appendChild(head("The pension", "Nothing had to be retrieved"));

          var left = [
            p("The horizon result departs from the textbook, where a twenty-year horizon and a one-year horizon call for the same equity share. The models move forty points. Mean reversion in stock returns could justify some of that."),
            p("The pension result is harder to justify.", "lede"),
            p("“I will receive a substantial pension when I retire, projected to replace most of my pre-retirement income.” That sentence is in the prompt, in plain English. Acting on it requires knowing nothing about Dutch or Japanese or Brazilian pensions. It is stated."),
            p("The models mention the pension in <span class='num'>" + K.usPens + "%</span> of their explanations. They do not size the portfolio to it."),
            p("Mentioning a thing and using it are different, and only the second one reaches the number.", "kicker")
          ];

          var right = h("div", { class: "stage-box" }, [
            h("table", { class: "data" }, [
              h("thead", {}, [h("tr", {}, [
                h("th", { text: "rationale" }),
                h("th", { text: "named in" }),
                h("th", { text: "moves the number by" })
              ])]),
              h("tbody", {}, [
                h("tr", {}, [
                  h("td", { text: "investment horizon" }),
                  h("td", { class: "n", text: "100%" }),
                  h("td", { class: "n advice-t", text: "+" + K.betaHorizon.toFixed(0) + " pts" })
                ]),
                h("tr", {}, [
                  h("td", { text: "the existing pension" }),
                  h("td", { class: "n", text: K.usPens + "%" }),
                  h("td", { class: "n flat-t", text: K.betaPensText })
                ])
              ])
            ]),
            h("p", { class: "note", style: "margin:.9rem 0 0",
              text: "Both are named in essentially every explanation. Only one reaches the recommendation. This is the test the balance-sheet benchmark set up: it prescribes far more equity because of the pension, and the advice does not respond to the pension. The response is the same in every country, within 1.4 points." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      }
    ]
  });

  /* ======================================================================
     LINEUP — which advisor is this?
     ====================================================================== */

  EX.deck("lineup", {
    title: "Which advisor is this?",
    next: "asym",
    back: "levers",
    slides: [

      { title: "Three candidates",
        render: function (el) {
          el.appendChild(head("The identification", "An advisor is known by what moves it"));
          el.appendChild(h("div", { class: "stack", style: "max-width:40rem" }, [
            p("Any advisor — human, software, or model — can be identified by which of those three sentences changes its answer and which it ignores. Three responses is enough to tell several familiar rules apart.", "lede"),
            p("Here are three candidates. Two of them are what finance textbooks describe. One is the risk questionnaire of popular financial advice."),
            p("Each predicts a different pattern across the three sentences. Only one of them can produce what you just saw.")
          ]));
        }
      },

      { title: "Match the signature", top: true,
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "The line-up" }));
          el.appendChild(h("h2", { class: "head", style: "max-width:36ch;margin-bottom:1.1rem",
            text: "Only one of these fits" }));
          el.appendChild(P.lineup({ onPick: function (id) { api.flag("lineup.picked." + id, true); } }));
        }
      },

      { title: "Name it",
        render: function (el, api) {
          el.appendChild(head("The answer", "It is a risk questionnaire"));

          var left = [
            p("The rule that fits is not a portfolio model. It is the intake form, the two or three questions a retail adviser asks before recommending a fund. How do you feel about losing money, and when do you need it back.", "lede"),
            p("Economists have documented the gap between what finance textbooks prescribe and what popular financial advice recommends for decades. The pattern here matches popular advice."),
            p("It would also account for the similarity across countries, since a questionnaire has no box for the country you live in. The response to stated risk tolerance is the same in all twenty-one countries, within a band of three points."),
            p("Matching responses against candidate rules identifies a pattern of behaviour, not the machinery producing it.")
          ];

          var right = h("div", { class: "stack" }, [
            h("div", { class: "stage-box" }, [
              h("h3", { class: "sub", text: "What the form asks" }),
              h("p", { style: "margin:0 0 .8rem",
                html: "✓ &nbsp;How do you feel about losses? &nbsp;<span class='num advice-t'>+" + K.betaRisk.toFixed(0) + " pts</span>" }),
              h("p", { style: "margin:0 0 1.2rem",
                html: "✓ &nbsp;When do you need the money? &nbsp;<span class='num advice-t'>+" + K.betaHorizon.toFixed(0) + " pts</span>" }),
              h("h3", { class: "sub", text: "What it does not ask" }),
              h("p", { style: "margin:0",
                html: "✗ &nbsp;What else is on your balance sheet? &nbsp;<span class='num flat-t'>" + K.betaPensText + "</span>" })
            ]),
            h("p", { class: "note",
              text: "The levels are not absurd — invert the textbook formula and the implied risk aversion comes out around 2 for the risk-tolerant answers, 5 for the risk-averse ones, 3 for the default. All ordinary. It is the pattern of responses, not the levels, that identifies the rule." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));

        }
      },

      { title: "Ask them what they would ask", top: true,
        render: function (el, api) {
          var E = D.elicit;
          el.appendChild(head("A direct check", "Given the chance, they ask the questionnaire's questions"));

          var left = [
            p("A human advisor would ask questions before answering. So a follow-up asked each model to list up to five questions it would want answered first."),
            p("In every country the models ask the same four things. Every response but one asks about tolerance for losses, and <span class='num advice-t'>" + E.allFour + "%</span> ask all four.", "lede"),
            p("The country enters in narrow ways. Questions about exposure to the home currency appear in " + E.currency + "% of responses, from none in the United States to " + E.currencyMexico + "% in Mexico. The provisional recommendations are about six points lower everywhere, and the country averages correlate at " + E.corrCountryMeans + " with the main results.")
          ];

          el.appendChild(cols(left, [h("div", { class: "stack" }, [
            P.askList(),
            h("p", { class: "note", text: "Share of responses that ask about each topic. Exploratory, collected in October 2026 in English for all twenty-one countries. A separate judge model coded the " + E.nQuestions.toLocaleString("en-US") + " questions." })
          ])], "top narrow-first"));

          el.appendChild(h("div", { style: "margin-top:1.6rem" }, [
            api.doors([["asym", "One more thing about the balance sheet.",
              "The pension sentence was one of several. After the pre-registered results were in, more statements were tried, and they show something more specific than neglect.",
              "Continue"]])
          ]));
        }
      }
    ]
  });

  /* ======================================================================
     ASYM — one-sided prudence
     ====================================================================== */

  EX.deck("asym", {
    title: "One-sided prudence",
    next: "world",
    back: "lineup",
    slides: [

      { title: "Seven more sentences",
        render: function (el) {
          el.appendChild(head("Exploratory", "Not neglect. Something more specific."));
          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("“A generous pension” is a blunt statement. Once the pre-registered results were in, the study tried seven more specific sentences in three groups: what the pension is invested in, whether the fund is currency-hedged, and how much of her liquid wealth the stake is.", "lede"),
            p("Three of them mean she is <em class='term'>more</em> exposed to stock-market risk than the default prompt implies. Four mean she is <em class='term'>safer</em>."),
            p("Portfolio theory treats these symmetrically and it is not a close call. Risky wealth outside the portfolio should push the portfolio toward bonds. Safe wealth outside the portfolio should push it toward stocks, by the same logic and with the same force."),
            h("p", { class: "note", html: "Everything in this deck is <strong>exploratory</strong>. These statements were added after the pre-registered results were seen, are recorded as dated deviations, and sit in no correction family." })
          ]));
        }
      },

      { title: "Hand her one sentence", top: true,
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Your turn" }));
          el.appendChild(h("h2", { class: "head", style: "max-width:36ch;margin-bottom:1rem",
            text: "Try the exposure ones. Then try the safe ones." }));
          el.appendChild(P.probeBoard({
            onExplored: function () { api.flag("asym.explored", true); }
          }));
        }
      },

      { title: "All seven", top: true,
        render: function (el) {
          el.appendChild(head("Both sides at once", "It de-risks hard and re-risks barely"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("An advisor that read the balance sheet would put the squares well to the left of zero and the diamonds just as far to the right. Symmetric problem, symmetric response."),
              p("Instead the squares land at <span class='num advice-t'>−17</span> and <span class='num advice-t'>−23</span>, and the diamonds sit within a few points of nothing. Telling the model that the stake is her entire liquid wealth cuts the recommendation by twenty-three points. Telling it that the stake is only a third of her wealth — the mirror image — raises it by two and a half."),
              p("Currency hedging barely registers, at <span class='num flat-t'>+0.4 points</span> with a p-value of 0.66. The gap between the hedged and the unhedged statement does not grow with currency volatility, and it is negative in Turkey, where the hedge matters most."),
              p("The models read the balance sheet as a source of hazard. Safety, which in portfolio theory has the same standing and the opposite sign, moves the advice very little.", "kicker")
            ]),
            P.probeSummary()
          ]));
        }
      },

      { title: "A screen, not a balance sheet",
        render: function (el) {
          el.appendChild(head("One-sided prudence", "This is what a capacity-for-loss screen does"));
          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("Neither textbook advisor produces this pattern. One that ignores outside wealth would respond in neither direction. One that reads the whole balance sheet would respond in both.", "lede"),
            p("A questionnaire does produce it. Retail suitability rules require an adviser to ask whether the client can afford to lose the money. United Kingdom guidance calls this capacity for loss, and the European rules treat the ability to bear losses as separate from risk tolerance."),
            p("The recommendation has to pass both tests, willingness and ability. A screen of that kind can lower the recommended risk. It cannot raise it."),
            p("So the balance sheet enters the advice as a check on whether the investor can bear a loss, and not as the two-sided input of portfolio theory.")
          ]));
        }
      }
    ]
  });

  /* ======================================================================
     WORLD — what it adds up to
     ====================================================================== */

  EX.deck("world", {
    title: "One advisor, selectively local",
    back: "asym",
    slides: [

      { title: "The scorecard", top: true,
        render: function (el) {
          el.appendChild(head("Everything on one page", "Stable where it should be, and unresponsive where it should respond"));

          function row(label, val, cls) {
            return h("tr", {}, [h("td", { text: label }), h("td", { class: "n " + (cls || ""), text: val })]);
          }
          var invariance = h("div", { class: "stage-box stack" }, [
            h("h3", { class: "sub", text: "Should leave the advice unchanged" }),
            h("table", { class: "data" }, [h("tbody", {}, [
              row("Asking in the local language", "−1.3 pts", "flat-t"),
              row("Naming local funds and pensions", "−0.7 pts", "flat-t"),
              row("United Kingdom instead of United States", "+0.7 pts", "flat-t"),
              row("A 20-year instead of a 1-year horizon", "+" + K.betaHorizon.toFixed(0) + " pts", "advice-t")
            ])]),
            h("p", { class: "note", style: "margin:0", text: "The models pass these tests, with the horizon as the exception." })
          ]);
          var responsive = h("div", { class: "stage-box stack" }, [
            h("h3", { class: "sub", text: "Should move the advice" }),
            h("table", { class: "data" }, [h("tbody", {}, [
              row("Stated risk tolerance", "+" + K.betaRisk.toFixed(0) + " pts", "advice-t"),
              row("A pension invested in stocks", "−16.9 pts", "advice-t"),
              row("The stake is all her liquid wealth", "−23.3 pts", "advice-t"),
              row("A generous pension", K.betaPensText, "flat-t"),
              row("A guaranteed annuity", "+4.8 pts", "flat-t"),
              row("A cash cushion twice the stake", "+2.5 pts", "flat-t"),
              row("A currency hedge", "+0.4 pts", "flat-t"),
              row("Currency risk across countries", "slope " + K.kappa.toFixed(2) + ", not 1", "flat-t")
            ])]),
            h("p", { class: "note", style: "margin:0", text: "The models respond to stated risk tolerance and to cues that raise exposure. They respond little to the rest." })
          ]);

          el.appendChild(h("div", { class: "cols even top" }, [invariance, responsive]));
          el.appendChild(h("p", { class: "note", style: "margin-top:1.2rem;max-width:46rem",
            text: "Of the three candidate advisors, the questionnaire fits the most rows: the horizon response, the age gradient, the missing pension response and the similarity across countries. None of the three predicts that the country differences are all negative." }));
        }
      },

      { title: "Will newer models change this?",
        render: function (el) {
          var T = D.tracking;
          el.appendChild(head("A fair worry", "Will newer models change this?"));

          var left = [
            p("Results from AI models can go out of date quickly. The paper argues that the level of the advice may move and the structure will not, for two reasons.", "lede"),
            p("First, the allocation question has no verifiable answer. Model development improves performance where an answer can be checked. What the models learn here is the body of written financial advice, which changes slowly."),
            p("Second, the results do not come from missing knowledge. The models assume the local mortgage rate, switch to inflation-linked bonds where inflation is high, and cite the local pension system. They have the local information and do not use it on the allocation question."),
            p("The evidence so far agrees. In September 2026 a panel of " + T.nModels + " models, " + T.nNew + " of them new, answered an English slice of the main question.")
          ];

          var right = h("div", { class: "stage-box" }, [
            h("table", { class: "data" }, [
              h("thead", {}, [h("tr", {}, [
                h("th", { text: "" }), h("th", { text: "July" }), h("th", { text: "September" })
              ])]),
              h("tbody", {}, [
                h("tr", {}, [h("td", { text: "Models" }), h("td", { class: "n", text: "13" }), h("td", { class: "n", text: "" + T.nModels })]),
                h("tr", {}, [h("td", { text: "Variation due to the model" }), h("td", { class: "n", text: T.varModel[0] + "%" }), h("td", { class: "n advice-t", text: T.varModel[1] + "%" })]),
                h("tr", {}, [h("td", { text: "Variation due to the country" }), h("td", { class: "n", text: T.varCountry[0] + "%" }), h("td", { class: "n flat-t", text: T.varCountry[1] + "%" })]),
                h("tr", {}, [h("td", { text: "Country cells below the model's own US answer" }), h("td", { class: "n", text: T.belowUS[0] + "%" }), h("td", { class: "n", text: T.belowUS[1] + "%" })])
              ])
            ]),
            h("p", { class: "note", style: "margin:.9rem 0 0",
              html: "Both columns use the same English slice of the question. The " + T.nNew + " new models give the country a larger role, " + T.newVarCountry + "% against " + T.newVarModel + "% for the model, but not in the direction of the benchmark: Turkey, where the unhedged benchmark prescribes the least equity, receives the most. The <a href='https://claesbackman.com/Explorables/FinancialAdvice_AI_Digital/tracking.html'>model tracker</a> follows this over time." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "What this market is",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "The end, and a question" }));
          el.appendChild(h("h1", { class: "big", style: "max-width:24ch",
            text: "One advisor for the whole world" }));

          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("Financial advice used to be a national business, held there by regulation, by relationships and by language.", "lede"),
            p("A handful of models now answer the question in every country and every language. They ask the same questions and respond to the same things about the investor wherever she lives: her tolerance for losses and her horizon, and her balance sheet only when it signals that she cannot bear a loss."),
            p("The recommendations adapt to the country selectively. They follow local interest rates on a mortgage and local inflation on how to protect savings, and they barely move on how much to hold in stocks."),
            p("The explanations adapt most of all, so the investor cannot tell from the answer whether the advice reflects her circumstances. And when a few models supply the advice, their recommendations are correlated across households and countries, and so are their mistakes."),
            h("p", { class: "kicker", style: "margin-top:1.6rem;font-size:1.25rem",
              html: "When is the same advice everywhere warranted, and when is it standardization that ignores what matters locally?" }),
            h("p", { class: "note", html: "The full paper, every table and the prompts in all twenty-one countries are in the <a href='https://claesbackman.com/Explorables/FinancialAdvice_AI_Digital/'>digital edition</a>. The pre-registration is at <a href='" + K.osf + "'>OSF</a>." })
          ]));

          var unseen = ["models", "age", "glidvag", "method"]
            .filter(function (id) { return EX.decks[id] && !EX.reached(id); });

          if (unseen.length) {
            el.appendChild(h("p", { class: "note", style: "margin-top:2rem",
              text: unseen.length === 1
                ? "One path you have not taken:"
                : unseen.length + " paths you have not taken:" }));
            el.appendChild(h("div", { class: "chips", style: "margin-top:.5rem" },
              unseen.map(function (id) {
                var b = h("button", { class: "chip", text: EX.decks[id].title });
                b.onclick = function () { api.open(id); };
                return b;
              })));
          } else {
            el.appendChild(h("p", { class: "note", style: "margin-top:2rem",
              text: "You have taken every path." }));
          }
        }
      }
    ]
  });

})();
