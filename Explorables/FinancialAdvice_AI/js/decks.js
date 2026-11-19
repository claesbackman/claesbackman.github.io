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
          el.appendChild(h("h1", { class: "big", text: "One advisor for the whole world?" }));

          el.appendChild(cols([
            p("Somebody is asking a chatbot what to do with their savings. Here is the question they might ask, put to <span class='num'>13</span> frontier models from six companies, fifty times each, in twenty-one countries.", "lede"),
            p("Change the country in the box. The amount changes into local currency, the country name changes, and for fifteen of the twenty-one the whole question is asked in another language."),
            p("Everything else stays the same. The investor is forty, saving for five years, and wants to know how much to put in stocks.", "kicker"),
h("p", { class: "note", html: "This question, in this wording, at this age, was sent 13,650 times in July 2026. It is one cell of a larger experiment with three questions, pre-registered beforehand at <a href='" + K.osf + "'>OSF</a>." })
          ], [P.promptBox({ country: "USA" })], "narrow-first"));
        }
      },

      { title: "Place your bet",
        render: function (el) {
          el.appendChild(head("Before you look", "How different will the answer be?"));

          var tk = D.byKey.Turkey, us = D.byKey.USA;

          var left = [
            p("A Turkish saver and an American saver ask the identical question. Their circumstances are not identical."),
            p("Both would hold much the same global stock fund. But she will spend her money in lira, and measured in lira that fund has swung about <span class='num warranted-t'>" + tk.sigma + "%</span> a year against <span class='num warranted-t'>" + us.sigma + "%</span> for the American. Inflation, interest rates and the pension system differ too."),
            p("One view says a rougher ride calls for <em class='term'>less</em> equity in Turkey. Another says that with the currency hedged it is the same fund, and the answer should be the same. The models had to pick something."),
            h("p", { class: "note", text: "Guess how many points less equity the models recommend in Turkey than in the United States. You will see the guess twice more, once against what the models did and once against what a textbook formula prescribes." })
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
          var guess = api.flagVal("guess.turkey");

          el.appendChild(head("Thirteen hundred answers", "Three points."));

          var left = [
            p("Every answer the models gave, for Turkey and for the United States. The two distributions sit almost on top of each other."),
            p("The estimated gap is <span class='num advice-t'>" + D.byKey.Turkey.fe.toFixed(1) + " points</span>. It clears the usual bar on its own, but not once you correct for testing twenty countries at once.",
              "lede"),
            guess === undefined
              ? p("The dotted mark on the chart is where a reader's guess would sit. Go back one slide and place one, and it will be drawn against the answer.")
              : guess >= 8
                ? p("Your guess is the dotted mark on the chart. You put Turkey " + guess.toFixed(0) + " points below the United States. The models put it three.")
                : p("Your guess is the dotted mark on the chart, and you were close."),
            p("Advice is not identical across countries, and the formal tests say so. But <em class='term'>nearly</em> uniform is the right description for this question. The rest of this is about why, and about the questions where the models do adapt to the country.")
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
    // The fork. Next always hands the reader whichever branch is still
    // outstanding, so the forward arrow can never bounce between two decks
    // that are both already done.
    next: function () {
      if (!EX.done("warranted")) return "warranted";
      if (!EX.done("words")) return "words";
      return "local";
    },
    back: "ask",
    slides: [

      { title: "Twenty-one countries", top: true,
        render: function (el) {
          el.appendChild(head("All of them", "Twelve points, end to end"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Twenty-one countries with pension systems, inflation histories and stock markets that have almost nothing in common. Brazil's mandatory pension replaces nearly all of an average wage. South Africa's replaces under a tenth."),
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
              p("Ask the same question in one country fifty times across thirteen models and the answers scatter with a standard deviation of about <span class='num'>13 points</span>. The entire range of national averages is narrower than that."),
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
              p("The question has a continuous answer: any share between nothing and everything. Every single one of the " + K.nPrimary.toLocaleString("en-US") + " usable answers is a multiple of five, and " + K.multiplesOfTen + "% are multiples of ten."),
              h("p", { class: "note", style: "margin:.2rem 0 .6rem", text: "Usable means the eleven refusals and cut-off answers are set aside, which is why this is 13,639 and not the 13,650 that were sent." }),
              p("Nothing below <span class='num'>10%</span>, nothing above <span class='num'>80%</span>. One number, <span class='num advice-t'>60</span>, accounts for nearly a third of them."),
              p("Sixty is not arbitrary. It is the most common target share in retail portfolio advice, and it is also exactly what the oldest rule of thumb in the business prescribes for a forty-year-old."),
              (function () {
                var q = h("p", {});
                q.appendChild(api.inlineDoor("age", "Which of those is it"));
                q.appendChild(document.createTextNode("?"));
                return q;
              })(),
              h("p", { class: "note", text: "Both figures describe this one cell — at other ages the mode moves. The button overlays the shares the textbook formula actually prescribes for these twenty-one countries, which land wherever the arithmetic puts them rather than on eight round numbers." })
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
              p("Each bar is one country against the United States, holding the model fixed. Advice is not identical everywhere. That was the study's first pre-registered prediction and it was supported."),
              p("But look at the direction. Thirteen contrasts clear the bar before you correct for testing twenty countries at once. <span class='advice-t'>Seven</span> survive that correction, and <em class='term'>every one of them is negative</em>."),
              p("The United States sits near the top of the range and nothing beats it by a meaningful margin. Brazil, eleven points down, is the largest country gap on this question. On a $50,000 stake that is $5,500 moved from stocks to bonds. The seven average about six points, several times the gender gap found on a similar question."),
              h("p", { class: "note", text: "The contrasts that fail the correction rule out large gaps, not gaps of a point or two. The design could only reliably detect about four points." }),
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
          el.appendChild(head("A fork", "Why so similar?"));
          el.appendChild(p("There are two simple explanations for near-uniform advice. Either the right answer really is much the same everywhere, or the models cannot tell the countries apart. They are independent, so take them in whichever order you like.", "lede"));

          el.appendChild(api.doors([
            ["warranted",
              "Maybe the same answer is right.",
              "Under standard portfolio theory every investor on earth holds the same world stock index. An advisor who does not guess your risk tolerance from your passport may be making the defensible choice. There is a benchmark to check this against.",
              "Work out what the answer should be"],
            ["words",
              "Or maybe it does not know where you live.",
              "These models learned mostly from American English. Perhaps Ankara and Amsterdam are not distinct places to them, and the uniformity is a gap in what they know.",
              "Read what the models said about your country"]
          ], true));

          el.appendChild(h("p", { class: "note", style: "margin-top:1.4rem",
            text: "Both paths come back here. The argument continues once you have taken both." }));
        }
      }
    ]
  });

  /* ======================================================================
     WARRANTED — what should move the advice
     ====================================================================== */

  EX.deck("warranted", {
    title: "What should it be?",
    back: "same",
    next: function () { return EX.done("words") ? "local" : "words"; },
    slides: [

      { title: "The only formula here",
        render: function (el) {
          el.appendChild(head("The first explanation", "Suppose the same answer is right"));

          var left = [
            p("The argument for uniformity is serious. If world stock markets are open to everyone, every investor holds much the same global portfolio, and the only thing that should differ between two people is how much of it they want. A passport is a poor guide to that."),
            p("The textbook rule for how much has three inputs. The study holds the first one, the reward for taking risk, identical for all twenty-one countries, and starts with one risk aversion for everybody."),
            p("That leaves how much the fund swings, and here one detail the prompt does not state decides everything: whether the world fund is hedged into the investor's own currency.", "lede"),
            p("Hedged, the fund swings the same for everyone, and the rule prescribes one share everywhere. Unhedged, a Turkish investor also carries the lira, the ride is rougher, and the rule prescribes less.")
          ];

          var card = h("div", { class: "stage-box", style: "padding:1.7rem 1.6rem" }, [
            h("div", { class: "frac" }, [
              h("span", { class: "frac-lhs", text: "share in stocks" }),
              h("span", { class: "frac-eq", text: "=" }),
              h("span", { class: "frac-stack" }, [
                h("span", { class: "frac-num", text: "what you earn for taking the risk" }),
                h("span", { class: "frac-den" }, [
                  h("span", { class: "warranted-t", text: "how much you hate risk" }),
                  h("span", { text: " × " }),
                  h("span", { class: "warranted-t", text: "how much it swings, squared" })
                ])
              ])
            ]),
            h("p", { class: "frac-sym", text: "θ  =  (μ − r)  /  (γ σ²)" }),
            h("p", { class: "note", style: "margin:0",
              html: "This is the rule of Merton and Samuelson from 1969, and it is still the reference point. The top line is held <em>identical for all twenty-one countries</em> at " + (K.premium * 100).toFixed(2) + "%, so nothing that follows comes from assuming one country's stock market beats another's. Only <span class='num warranted-t'>σ</span> can vary, and only if the fund is unhedged." })
          ]);

          el.appendChild(cols(left, [card], "narrow-first"));
        }
      },

      { title: "Find a fit", top: true,
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Your turn" }));
          el.appendChild(h("h2", { class: "head", style: "max-width:34ch;margin-bottom:.5rem",
            text: "Two versions of the fund. Try to make either fit." }));
          el.appendChild(h("p", { class: "note", style: "max-width:46rem;margin-bottom:1.3rem",
            text: "Start with the hedged fund, then switch. The slider is how much the investor dislikes risk, the same for every country. Hollow rings are what the formula prescribes, filled dots are what the models said." }));

          el.appendChild(P.mertonBench({
            onSolved: function () { api.toast("There it is."); }
          }));
        }
      },

      { title: "The level fits, the gaps do not",
        render: function (el) {
          el.appendChild(head("What just happened", "One version fits the level. Neither explains the gaps."));

          var left = [
            p("Hedged, the formula prescribes <span class='num warranted-t'>" + (K.hedgedShare * 100).toFixed(0) + "%</span> in every country, and every national average is within about <span class='num'>" + K.hedgedMaxGap + " points</span> of it. Near-uniform advice at this level is defensible.", "lede"),
            p("But one share for everybody predicts no country differences at all, and seven countries get significantly less than the United States."),
            p("Unhedged, the formula does prescribe differences: from <span class='num warranted-t'>21%</span> in Turkey to <span class='num warranted-t'>53%</span> in South Korea, a <span class='num warranted-t'>32-point</span> spread where the advice spans <span class='num advice-t'>12</span>. Turning up risk aversion narrows the spread, but by the time it matches, the formula prescribes under 16% everywhere, and no answer in this cell went below 10%."),
            p("So the question becomes whether the differences that do exist follow the unhedged prescription.", "kicker")
          ];

          var right = h("div", { class: "stage-box" }, [
            h("h3", { class: "sub", text: "The unhedged fund, by risk aversion" }),
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
              html: "For comparison, the advice spans <strong>12 points</strong> and its lowest national average is <strong>46%</strong>. The hedged fund prescribes a spread of zero at every setting." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "One number for it", top: true,
        render: function (el, api) {
          el.appendChild(head("The summary statistic", "An eighth of the currency risk passes through"));

          var guess = api.flagVal("guess.turkey");
          var tkPrescribed = (D.byKey.Turkey.alphaS - D.byKey.USA.alphaS) * 100;

          var left = [
            p("Put each country's prescribed deviation from the United States under the unhedged benchmark on one axis and what the models did on the other. If the advice passed currency risk through in full, the points would sit on the 45-degree line. If every country got the United States answer, they would sit flat."),
            p("That slope is called <span class='num advice-t'>κ</span> in the paper, and its value is <span class='num advice-t'>0.13</span>. The data reject a slope of 1. They do not reject a slope of 0."),
            p("The estimate also leans on two countries. Without Brazil it is <span class='num'>" + K.kappaNoBrazil.toFixed(2) + "</span>, without Turkey <span class='num'>" + K.kappaNoTurkey.toFixed(2) + "</span>, and dropping any other country leaves it between 0.11 and 0.15."),

            guess !== undefined
              ? h("div", { class: "stage-box", style: "padding:1rem 1.1rem" }, [
                  h("p", { class: "note", style: "margin:0 0 .6rem", text: "Your guess, one last time." }),
                  readout([
                    ["you guessed", guess.toFixed(0) + " pts", "less equity for Turkey", "sm"],
                    ["unhedged formula", Math.abs(tkPrescribed).toFixed(0) + " pts", "less equity for Turkey", "sm"],
                    ["hedged formula", "0 pts", "the same share everywhere", "sm"],
                    ["the models gave", Math.abs(D.byKey.Turkey.fe).toFixed(1) + " pts", "less, and not reliably", "sm"]
                  ])
                ])
              : null,
            h("p", { class: "note", text: "This slope was written down in advance and registered as descriptive, so it carries less weight than the country contrasts you saw earlier." })
          ];

          el.appendChild(cols(left, [P.kappaScatter()], "narrow-first"));
        }
      },

      { title: "But preferences",
        render: function (el) {
          el.appendChild(head("The obvious objection", "Maybe the gaps follow something else about the country"));

          var left = [
            p("Currency risk is one candidate. Risk appetite is another. The Global Preferences Survey asked eighty thousand people across seventy-six countries how willing they are to take risks. Plot the country effects against it."),
            p("The line is flat (<span class='num'>p = 0.27</span>). A country one standard deviation more risk-tolerant than another gets <span class='num'>" + K.gpsPerSd + " points</span> more equity. South Africa is by far the most risk-tolerant country in the panel and receives slightly <em class='term'>less</em> equity than the baseline. Financial literacy gives the same answer."),
            p("The paper runs the same regression on " + K.nCorrelates + " country characteristics, including income, volatility, interest rates, inflation and pension replacement rates. On this question none survives the correction for multiple testing.", "kicker"),
            h("p", { class: "note", text: "The prompt describes one individual, not a national average. These regressions describe what the advice does, not what it should do." })
          ];

          el.appendChild(cols(left, [P.gpsScatter()], "narrow-first"));
        }
      },

      { title: "The other benchmark",
        render: function (el) {
          el.appendChild(head("A complication", "There is a second benchmark, and it says something else"));

          var left = [
            p("Everything so far treats the $50,000 as if it were the investor's whole financial life. It is not. She has a pension and decades of future earnings, and both are assets.", "lede"),
            p("Count them and the arithmetic changes. A pension is a large, bond-like claim, and somebody who already holds a big safe asset can afford to put the liquid part almost entirely into stocks. Run that version and it prescribes the maximum equity share in every country."),
            p("That benchmark is also uniform across countries, at a much higher level."),
            p("The two benchmarks make opposite predictions about something testable: whether the advice responds to what else is on the investor's balance sheet. A later part of the experiment tests exactly that.", "kicker")
          ];

          var right = h("div", { class: "stage-box" }, [
            h("h3", { class: "sub", text: "Three benchmarks and the advice" }),
            h("table", { class: "data" }, [
              h("tbody", {}, [
                h("tr", {}, [
                  h("td", { html: "<strong>The stake on its own, hedged</strong>" }),
                  h("td", { html: "52%<br><span style='color:var(--muted)'>everywhere</span>" })
                ]),
                h("tr", {}, [
                  h("td", { html: "<strong>The stake on its own, unhedged</strong>" }),
                  h("td", { html: "21% to 53%<br><span style='color:var(--muted)'>varies with currency risk</span>" })
                ]),
                h("tr", {}, [
                  h("td", { html: "<strong>The whole balance sheet</strong><br><span style='color:var(--muted)'>count the pension</span>" }),
                  h("td", { html: "100%<br><span style='color:var(--muted)'>everywhere</span>" })
                ]),
                h("tr", {}, [
                  h("td", { html: "<strong>What the models say</strong>" }),
                  h("td", { class: "advice-t", html: "46% to 58%" })
                ])
              ])
            ])
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "Where that leaves it",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Verdict" }));
          el.appendChild(h("h2", { class: "head", text: "Uniform advice is defensible. The gaps follow nothing." }));

          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("Giving much the same answer everywhere is not a mistake in itself. With a hedged world fund the textbook prescribes 52% in every country, and the advice is within about six points of that everywhere.", "lede"),
            p("What the benchmark cannot explain is the differences that do exist. Every significant one is negative. They pass through about an eighth of the currency risk an unhedged investor would carry, and they are unrelated to measured risk appetite, financial literacy, or any of the other country characteristics the paper tries."),
            p("So the first explanation holds for the level and says nothing about the rule that produces it. That comes later.")
          ]));

          var nextUp = EX.done("words")
            ? [["local", "Both paths taken. Does the country ever reach the number?",
                "On the allocation question the country barely moves the advice. The same models were asked two other questions, about a mortgage and about inflation.",
                "Continue"]]
            : [["words", "Now the other one: maybe it does not know where you live.",
                "Uniform advice could be a gap in knowledge. Every one of these answers arrived with an explanation attached, and there is a way to check.",
                "Read what the models said"]];

          el.appendChild(h("div", { style: "margin-top:1.6rem" }, [api.doors(nextUp)]));
        }
      }
    ]
  });

})();
