/* ------------------------------------------------------------------------
   decks.js — the content.

   Registration order sets the order of the spine on the map. Decks with a
   `parent` are side paths and appear under their parent once the slide that
   offers them has been seen.
   ------------------------------------------------------------------------ */

(function () {

  var h = CH.h;
  var K = D.K;

  /* helpers used across decks -------------------------------------------- */

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

  function readout(items) {
    return h("div", { class: "readout" }, items.map(function (it) {
      return h("div", { class: "ro-item" }, [
        h("span", { class: "ro-k", text: it[0] }),
        h("span", { class: "ro-v" + (it[3] ? " " + it[3] : ""), text: it[1] }),
        it[2] ? h("span", { class: "ro-sub", text: it[2] }) : null
      ]);
    }));
  }

  /* ======================================================================
     ASK — the hook
     ====================================================================== */

  EX.deck("ask", {
    title: "The question",
    next: "same",
    slides: [

      { title: "The prompt",
        render: function (el) {
          el.appendChild(h("p", { class: "eyebrow", text: "An explorable explanation" }));
          el.appendChild(h("h1", { class: "big", text: "One advisor for the whole world?" }));

          var box = P.promptBox({ country: "USA" });

          el.appendChild(cols([
            p("Somebody, somewhere, is asking a chatbot what to do with their savings. Over half of American adults say they have already done it.", "lede"),
            p("Here is that question. It is the one this study put to <span class='num'>13</span> frontier models from six companies, fifty times each, in twenty-one countries, in fifteen languages."),
            p("The only thing that changes between countries is the sentence at the top and the currency. Change it and see."),
            h("p", { class: "note", html: "Sent " + K.nQueries.toLocaleString("en-US") + " times in July 2026. Pre-registered beforehand at <a href='" + K.osf + "'>OSF</a>." })
          ], [box], "narrow-first"));
        }
      },

      { title: "Place your bet",
        render: function (el) {
          el.appendChild(head("Before you look", "How different should the answer be?"));

          var tk = D.byKey.Turkey, us = D.byKey.USA;

          var left = [
            p("A Turkish saver and an American saver ask the identical question. Their circumstances are not identical."),
            p("Measured in the money she will actually spend, the Turkish investor's world stock portfolio has swung about <span class='num warranted-t'>" + tk.sigma + "%</span> a year. The American's has swung about <span class='num warranted-t'>" + us.sigma + "%</span>. More volatility means a given slice of stocks buys more risk."),
            p("So the models should recommend Turkey <em class='term'>less</em> equity. The question is how much less."),
            h("p", { class: "note", text: "Guess. There is no penalty for being wrong, and the guess is the point: you will see it again twice, once against what the models did and once against what theory says they should have done." })
          ];

          var pred = P.predict({
            key: "guess.turkey",
            min: 0, max: 40, step: 1, start: 12,
            ticks: [0, 10, 20, 30, 40],
            fmt: function (v) { return v + ""; },
            fmtVal: function (v) { return v.toFixed(0) + " points less"; },
            lowLabel: "no difference at all",
            highLabel: "40 points less equity",
            aria: "How many percentage points less equity you think Turkey is recommended",
            cta: "Lock in my guess",
            after: function () {
              return h("p", { class: "note", text: "Locked in. Next slide." });
            }
          });

          el.appendChild(cols(left, [pred], "narrow-first"));
        }
      },

      { title: "The answer",
        render: function (el, api) {
          var gap = (P.exactMean("Turkey") - P.exactMean("USA")) * 100;
          var guess = api.flagVal("guess.turkey");

          el.appendChild(head("Thirteen hundred answers", "Three points."));

          var left = [
            p("Every answer the models gave, for Turkey and for the United States. The two distributions sit almost on top of each other."),
            p("The estimated gap is <span class='num advice-t'>" + D.byKey.Turkey.fe.toFixed(1) + " points</span>, and once you account for testing twenty countries at once it is not distinguishable from zero.",
              "lede"),
            guess !== undefined && guess >= 8
              ? p("You guessed " + guess.toFixed(0) + ". So did most people. The models did not.")
              : p("Hold on to that number. It comes back."),
            p("That is the finding. The rest of this is about why, and about whether it is a problem.")
          ];

          el.appendChild(cols(left, [P.distPair({ a: "Turkey", b: "USA", ghostKey: "guess.turkey" })], "narrow-first"));
        }
      }
    ]
  });

  /* ======================================================================
     SAME — the compression
     ====================================================================== */

  EX.deck("same", {
    title: "The same answer everywhere",
    next: "warranted",
    back: "ask",
    slides: [

      { title: "Twenty-one countries", top: true,
        render: function (el) {
          el.appendChild(head("All of them", "Twelve points, end to end"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Twenty-one countries with pension systems, inflation histories, and stock markets that have almost nothing in common. Brazil's mandatory pension replaces nearly all of an average wage. South Africa's replaces under a tenth."),
              p("Every national average sits between <span class='num advice-t'>46%</span> and <span class='num advice-t'>58%</span> equity."),
              h("p", { class: "note", text: "Mean recommended equity share, pooled across the thirteen models, fifty answers per model per country. Question 1, the translated prompt, age 40." })
            ]),
            P.countryBoard()
          ]));
        }
      },

      { title: "Narrower than the noise", top: true,
        render: function (el, api) {
          el.appendChild(head("The comparison that matters", "Narrower than the disagreement inside one country"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Twelve points sounds like something. Set it against how much the answers vary <em class='term'>within</em> a single country and it stops sounding like anything."),
              p("Ask the same question in Germany fifty times across thirteen models and the answers scatter with a standard deviation of <span class='num'>0.13</span>. The entire range of national averages is narrower than that."),
              p("So the twenty-one distributions overlap almost completely. Knowing which country a person lives in tells you very little about the answer they will get."),
              (function () {
                var q = h("p", {});
                q.appendChild(document.createTextNode("Which raises a question: if the answers vary that much, "));
                q.appendChild(api.inlineDoor("models", "somebody in there is disagreeing"));
                q.appendChild(document.createTextNode("."));
                return q;
              })()
            ]),
            P.countryBoard({ sdOn: true })
          ]));
        }
      },

      { title: "Round numbers",
        render: function (el, api) {
          el.appendChild(head("Look at the shape", "It answers with a round number"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("A continuous problem with a continuous answer. Every single one of the " + K.nPrimary.toLocaleString("en-US") + " answers is a multiple of five, and " + K.multiplesOfTen + "% are multiples of ten."),
              p("Nothing below <span class='num'>10%</span>. Nothing above <span class='num'>80%</span>. One number, <span class='num advice-t'>60</span>, accounts for nearly a third of everything the models said."),
              p("Sixty is not an arbitrary number. It is the default of the retail advice industry, and it is also exactly what the oldest rule of thumb in the business prescribes for a forty-year-old."),
              (function () {
                var q = h("p", {});
                q.appendChild(api.inlineDoor("age", "Which of those is it"));
                q.appendChild(document.createTextNode("?"));
                return q;
              })(),
              h("p", { class: "note", text: "The button overlays a sketch of what a computed answer would look like, spread across the whole range instead of piled on eight round numbers. The sketch is not data." })
            ]),
            P.pooledDist()
          ]));
        }
      },

      { title: "Seven of twenty", top: true,
        render: function (el, api) {
          el.appendChild(head("The estimates", "The differences are real, small, and one-sided"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Each bar is one country against the United States, holding the model fixed. Advice is not literally identical everywhere, and a joint test rejects that it is."),
              p("But look at the direction. Thirteen contrasts clear the bar before you correct for testing twenty countries at once. <span class='advice-t'>Seven</span> survive that correction, and <em class='term'>every one of them is negative</em>."),
              p("The United States sits at the top of the range and nothing beats it by a meaningful margin. Brazil, eleven points down, is the largest gap in the study. On a $50,000 stake that is $5,500 moved from stocks to bonds."),
              (function () {
                var q = h("p", { class: "note" });
                q.appendChild(document.createTextNode("Thirteen models is a small sample and this is a lot of tests. "));
                q.appendChild(api.inlineDoor("method", "How would you know any of this is real"));
                q.appendChild(document.createTextNode("?"));
                return q;
              })()
            ]),
            P.coefPlot()
          ]));
        }
      },

      { title: "Two readings",
        render: function (el, api) {
          el.appendChild(head("A fork", "Is that a defect?"));
          el.appendChild(p("You now know the thing this whole study is about: ask the same money question in twenty-one countries and you get nearly the same answer. Before deciding what is wrong with that, there are two innocent explanations to get out of the way. They are independent, so take them in whichever order you like.", "lede"));

          el.appendChild(api.doors([
            ["warranted",
              "Wait — maybe uniform advice is correct.",
              "Under standard portfolio theory every investor on earth holds the same world stock index. An advisor who refuses to guess your risk tolerance from your passport might be making the defensible choice, not the lazy one. There is a way to check this, and it has a number attached.",
              "Work out what the answer should have been"],
            ["words",
              "Or maybe it just does not know where you live.",
              "These models learned mostly from American English. Perhaps Ankara and Amsterdam are simply not distinct places to them, and the uniformity is a gap in what they know rather than a flaw in how they advise.",
              "Read what the models said about your country"]
          ], true));

          el.appendChild(h("p", { class: "note", style: "margin-top:1.4rem",
            text: "Both paths come back here. The argument does not continue until you have taken both, because ruling out one explanation is not the same as ruling out the other." }));
        }
      }
    ]
  });

  /* ======================================================================
     WARRANTED — the normative benchmark
     ====================================================================== */

  EX.deck("warranted", {
    title: "What should it be?",
    back: "same",
    next: function () { return EX.done("words") ? "levers" : "same"; },
    slides: [

      { title: "The only formula here",
        render: function (el) {
          el.appendChild(head("Suspect one", "Suppose uniform advice is right"));

          var left = [
            p("The argument for uniformity is serious. If world stock markets are open to everyone, every investor holds the same global portfolio, and the only thing that should differ between two people is how much of it they want. A passport is a poor guide to that."),
            p("But that argument does not say every country gets the same number. It says the <em class='term'>preferences</em> should not vary by country. Three things still should."),
            p("How safe the local safe asset really is. How much the world stock market moves when you measure it in the money you will actually spend. And how much of your retirement is already promised to you by someone else."),
            p("There is a formula for this, and it is the only one in this piece.")
          ];

          var card = h("div", { class: "stage-box", style: "padding:1.7rem 1.6rem" }, [
            h("div", { class: "frac" }, [
              h("span", { class: "frac-lhs", text: "share in stocks" }),
              h("span", { class: "frac-eq", text: "=" }),
              h("span", { class: "frac-stack" }, [
                h("span", { class: "frac-num warranted-t", text: "what you earn for taking the risk" }),
                h("span", { class: "frac-den" }, [
                  h("span", { class: "advice-t", text: "how much you hate risk" }),
                  h("span", { text: " × " }),
                  h("span", { class: "warranted-t", text: "how wild the ride is" })
                ])
              ])
            ]),
            h("p", { class: "frac-sym", text: "α  =  (μ − r)  /  (γ σ²)" }),
            h("p", { class: "note", style: "margin:0",
              html: "Robert Merton wrote this down in 1969 and it is still the reference point. The study holds the top line <em>common across all twenty-one countries</em> at " + (K.premium * 100).toFixed(2) + "%, so nothing that follows comes from assuming one country's stock market beats another's. Only <span class='num'>σ</span> varies — how much the world index swings once you convert it into the money you will spend." })
          ]);

          el.appendChild(cols(left, [card], "narrow-first"));
        }
      },

      { title: "Find a fit", top: true,
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Your turn" }));
          el.appendChild(h("h2", { class: "head", style: "max-width:34ch;margin-bottom:.5rem",
            text: "One free parameter. Try to make it fit." }));
          el.appendChild(h("p", { class: "note", style: "max-width:46rem;margin-bottom:1.3rem",
            text: "One number is free: how much the investor dislikes risk. It is the same for every country, because the uniformity argument says preferences should not vary by country. Hollow rings are what the formula prescribes, filled dots are what the models said." }));

          el.appendChild(P.mertonBench({
            onSolved: function () { api.toast("There it is."); }
          }));
        }
      },

      { title: "Why it cannot fit",
        render: function (el) {
          el.appendChild(head("What just happened", "The level and the spread pull against each other"));

          var left = [
            p("At the setting the paper uses, the formula prescribes shares from <span class='num warranted-t'>21%</span> in Turkey to <span class='num warranted-t'>53%</span> in South Korea. That is a <span class='num warranted-t'>32-point</span> spread. The advice spans <span class='num advice-t'>12</span>.", "lede"),
            p("Turning up risk aversion narrows the prescribed spread, because a bigger denominator squeezes everything toward zero together. Keep going and the spread finally matches the advice."),
            p("By then the formula is prescribing under <span class='num'>16%</span> equity in every country and as little as <span class='num'>6%</span> in Turkey and Brazil. No model in " + K.nQueries.toLocaleString("en-US") + " answers ever recommended less than 10%."),
            p("You cannot have both. That is not an artifact of one setting: across the whole grid of plausible values the transmission never comes close to full.", "kicker")
          ];

          var right = h("div", { class: "stage-box" }, [
            h("table", { class: "data" }, [
              h("thead", {}, [h("tr", {}, [
                h("th", { text: "risk aversion" }),
                h("th", { text: "prescribed spread" }),
                h("th", { text: "lowest prescribed share" })
              ])]),
              h("tbody", {}, [2, 3, 5, 10].map(function (g) {
                var vals = D.countries.map(function (c) { return D.merton(c.sigma, g); });
                var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
                return h("tr", {}, [
                  h("td", { text: "γ = " + g + (g === 3 ? "  (baseline)" : "") }),
                  h("td", { class: "n", text: ((hi - lo) * 100).toFixed(0) + " pts" }),
                  h("td", { class: "n", text: (lo * 100).toFixed(0) + "%" })
                ]);
              }))
            ]),
            h("p", { class: "note", style: "margin:.9rem 0 0",
              html: "For comparison, the advice spans <strong>12 points</strong> and its lowest national average is <strong>46%</strong>." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "One number for it", top: true,
        render: function (el, api) {
          el.appendChild(head("The summary statistic", "It transmits about an eighth"));

          var guess = api.flagVal("guess.turkey");
          var tkPrescribed = (D.byKey.Turkey.alphaS - D.byKey.USA.alphaS) * 100;

          var left = [
            p("Put each country's prescribed deviation from the United States on one axis and what the models actually did on the other. If advice tracked fundamentals the points would sit on the 45-degree line. If it ignored the country entirely they would sit flat."),
            p("The fitted slope is <span class='num advice-t'>κ = 0.13</span>. Full calibration is rejected decisively. A flat line is not rejected at all."),
            guess !== undefined
              ? h("div", { class: "stage-box", style: "padding:1rem 1.1rem" }, [
                  h("p", { class: "note", style: "margin:0 0 .6rem", text: "Your bet, one last time." }),
                  readout([
                    ["you guessed", guess.toFixed(0) + " pts", "less equity for Turkey", "sm"],
                    ["theory says", Math.abs(tkPrescribed).toFixed(0) + " pts", "less equity for Turkey", "sm"],
                    ["the models gave", Math.abs(D.byKey.Turkey.fe).toFixed(1) + " pts", "and not reliably that", "sm"]
                  ])
                ])
              : null,
            h("p", { class: "note", text: "Bootstrapped over the twenty countries. Treating the benchmark itself as measured with error widens the bracket to at most 0.97, still below the 1.0 of full calibration." })
          ];

          el.appendChild(cols(left, [P.kappaScatter()], "narrow-first"));
        }
      },

      { title: "But preferences",
        render: function (el) {
          el.appendChild(head("The obvious objection", "Maybe risk appetite really does vary by country"));

          var left = [
            p("Then the models would be right to compress, because they would be offsetting a real difference in what people want with a real difference in what they need."),
            p("There is a measure of this. The Global Preferences Survey asked eighty thousand people in seventy-six countries how willing they are to take risks. Plot the country effects against it."),
            p("The slope is <span class='num'>0.028</span> and it does not clear zero (<span class='num'>p = 0.27</span>). A country a full standard deviation more risk-tolerant earns under three points more equity."),
            p("South Africa is the most risk-tolerant country in the panel by a wide margin. It receives slightly <em class='term'>less</em> equity than the baseline, not more. Financial literacy gives the same answer.")
          ];

          el.appendChild(cols(left, [P.gpsScatter()], "narrow-first"));
        }
      },

      { title: "Suspect one is out",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Verdict" }));
          el.appendChild(h("h2", { class: "head", text: "Uniform advice is not the defensible kind" }));

          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("The channels that the world-index argument agrees should still speak — local safe rates, currency risk, pension systems — prescribe a 32-point spread. The advice spans 12, and the slope connecting the two is a thirteenth of what full calibration would be.", "lede"),
            p("Letting risk aversion itself vary by country does not rescue it. The advice is more uniform than even a culturally agnostic, world-index advisor would be."),
            p("One explanation down.")
          ]));

          var nextUp = EX.done("words")
            ? [["levers", "Both suspects are gone. So what does move the number?",
                "Stop asking why the answer does not change and start asking what makes it change. A separate arm of the experiment inserted one sentence about the investor into the same prompt.",
                "Continue"]]
            : [["words", "Now the other one: maybe it does not know where you live.",
                "Uniform advice would be a knowledge failure rather than an advice failure. Every one of these answers arrived with an explanation attached, and there is a way to check.",
                "Read what the models said"]];

          el.appendChild(h("div", { style: "margin-top:1.6rem" }, [api.doors(nextUp)]));
        }
      }
    ]
  });

})();
