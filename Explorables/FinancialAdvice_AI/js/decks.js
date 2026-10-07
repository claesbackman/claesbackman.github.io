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
            h("p", { class: "note", html: "This question, in this wording, at this age, was sent 13,650 times in July 2026 — one cell of a larger experiment pre-registered beforehand at <a href='" + K.osf + "'>OSF</a>." })
          ], [P.promptBox({ country: "USA" })], "narrow-first"));
        }
      },

      { title: "Place your bet",
        render: function (el) {
          el.appendChild(head("Before you look", "How different should the answer be?"));

          var tk = D.byKey.Turkey, us = D.byKey.USA;

          var left = [
            p("A Turkish saver and an American saver ask the identical question. Their circumstances are not identical."),
            p("Both would hold much the same global stock fund. But she will spend her money in lira, and measured in lira that fund has swung about <span class='num warranted-t'>" + tk.sigma + "%</span> a year against <span class='num warranted-t'>" + us.sigma + "%</span> for the American. The same fund is a rougher ride for her."),
            p("A rougher ride means a given slice of stocks buys more risk, so she should be recommended <em class='term'>less</em> equity. The question is how much less."),
            h("p", { class: "note", text: "Guess. Nothing rides on being right, and the guess is the point — you will see it twice more, once against what the models did and once against what the textbook says they should have done." })
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
                : p("Your guess is the dotted mark on the chart, and you were close. Most of the argument that follows is about why three points is a strange number to find here, not a reassuring one."),
            p("Advice is not literally identical across countries, and a formal test says so. But <em class='term'>nearly</em> uniform is the right description, and the rest of this is about why, and about whether it is a problem.")
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
    // The fork. Next always hands the reader whichever elimination is still
    // outstanding, so the forward arrow can never bounce between two decks
    // that are both already done.
    next: function () {
      if (!EX.done("warranted")) return "warranted";
      if (!EX.done("words")) return "words";
      return "levers";
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
              p("Each bar is one country against the United States, holding the model fixed. Advice is not literally identical everywhere, and a joint test rejects that it is. That was the study's first pre-registered prediction and it was supported."),
              p("But look at the direction. Thirteen contrasts clear the bar before you correct for testing twenty countries at once. <span class='advice-t'>Seven</span> survive that correction, and <em class='term'>every one of them is negative</em>."),
              p("The United States sits near the top of the range and nothing beats it by a meaningful margin. Brazil, eleven points down, is the largest country gap on this question. On a $50,000 stake that is $5,500 moved from stocks to bonds."),
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
          el.appendChild(head("A fork", "Is that a defect?"));
          el.appendChild(p("Before deciding that near-uniform advice is a problem, there are two innocent explanations to rule out. Either the right answer really is the same everywhere, or the models have no idea where the investor lives. They are independent, so take them in whichever order you like.", "lede"));

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
    next: function () { return EX.done("words") ? "levers" : "words"; },
    slides: [

      { title: "The only formula here",
        render: function (el) {
          el.appendChild(head("Suspect one", "Suppose uniform advice is right"));

          var left = [
            p("The argument for uniformity is serious. If world stock markets are open to everyone, every investor holds much the same global portfolio, and the only thing that should differ between two people is how much of it they want. A passport is a poor guide to that."),
            p("But one thing does differ between a Turkish and an American investor holding the identical global fund, and it is not a preference."),
            p("She will spend her money in lira. Measured in lira, that fund moves far more than it does in dollars. The ride really is rougher for her, and the textbook says a rougher ride calls for a smaller slice.", "lede"),
            p("That single channel is all this benchmark lets vary, and that restriction is deliberate.")
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
            h("p", { class: "frac-sym", text: "α  =  (μ − r)  /  (γ σ²)" }),
            h("p", { class: "note", style: "margin:0",
              html: "Robert Merton wrote this down in 1969 and it is still the reference point. The study holds the top line <em>identical for all twenty-one countries</em> at " + (K.premium * 100).toFixed(2) + "%, so nothing that follows comes from assuming one country's stock market beats another's. Only <span class='num warranted-t'>σ</span> varies — how much the world index swings once you convert it into the money you will spend." })
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
            p("At the setting the paper uses, the formula prescribes shares from <span class='num warranted-t'>21%</span> in Turkey to <span class='num warranted-t'>53%</span> in South Korea. A <span class='num warranted-t'>32-point</span> spread, where the advice spans <span class='num advice-t'>12</span>.", "lede"),
            p("Turning up risk aversion narrows the prescribed spread, because a bigger denominator squeezes everything toward zero together. Keep going and the spread eventually matches."),
            p("By then the formula is prescribing under <span class='num'>16%</span> equity everywhere and as little as <span class='num'>6%</span> in Turkey and Brazil. No answer in this cell went below 10%."),
            p("You cannot have both. The paper checks the whole grid of settings, and the one place the slope approaches full calibration is the same place the prescribed levels become impossible.", "kicker")
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
            p("That slope has a name in the paper, <span class='num advice-t'>κ</span>, and a value: <span class='num advice-t'>0.13</span>. A slope of 1 would mean advice moves point for point with fundamentals, and the data rule that out. A slope of 0 would mean the country never reaches the number at all, and the data cannot rule that out."),
            p("So κ sits near the bottom of its range, an eighth of the way to full calibration, and the honest reading is a ceiling rather than an estimate: whatever the advice transmits about where you live, it is small."),

            guess !== undefined
              ? h("div", { class: "stage-box", style: "padding:1rem 1.1rem" }, [
                  h("p", { class: "note", style: "margin:0 0 .6rem", text: "Your bet, one last time." }),
                  readout([
                    ["you guessed", guess.toFixed(0) + " pts", "less equity for Turkey", "sm"],
                    ["the formula says", Math.abs(tkPrescribed).toFixed(0) + " pts", "less equity for Turkey", "sm"],
                    ["the models gave", Math.abs(D.byKey.Turkey.fe).toFixed(1) + " pts", "and not reliably that", "sm"]
                  ])
                ])
              : null,
            h("p", { class: "note", text: "This slope was written down in advance but registered as descriptive, so it carries less weight than the country contrasts you saw earlier. Allowing for error in the benchmark itself pushes the upper end of the range as high as 0.97 — still under full calibration, and wide mostly because the advice barely moves, which leaves little for the slope to be fitted to." })
          ];

          el.appendChild(cols(left, [P.kappaScatter()], "narrow-first"));
        }
      },

      { title: "But preferences",
        render: function (el) {
          el.appendChild(head("The obvious objection", "Maybe risk appetite really does vary by country"));

          var left = [
            p("If people in some countries genuinely want more risk than the formula assumes, compressed advice might be landing in a defensible place for a different reason. It is worth asking whether the advice moves with measured national risk appetite at all."),
            p("The Global Preferences Survey asked eighty thousand people across seventy-six countries how willing they are to take risks. Plot the country effects against it."),
            p("The slope is <span class='num'>0.028</span> and the test does not clear zero (<span class='num'>p = 0.27</span>). A country a full standard deviation more risk-tolerant earns under three points more equity."),
            p("South Africa is by far the most risk-tolerant country in the panel and receives slightly <em class='term'>less</em> equity than the baseline. Financial literacy gives the same answer."),
            h("p", { class: "note", text: "This one cuts both ways, and the paper says so. The prompt describes one individual, not a national average, so an advisor who declines to infer her appetite for risk from her country's mean is arguably right to decline. Read the flat line as a description of what the advice does, not as a charge against it." })
          ];

          el.appendChild(cols(left, [P.gpsScatter()], "narrow-first"));
        }
      },

      { title: "The other benchmark",
        render: function (el) {
          el.appendChild(head("An honest complication", "There is a second benchmark, and it says something else"));

          var left = [
            p("Everything so far treats the $50,000 as if it were the investor's whole financial life. It is not. She has a pension, and she has decades of future earnings, and both of those are assets.", "lede"),
            p("Count them and the arithmetic changes completely. A pension is a large, bond-like claim, and somebody who already holds a big safe asset can afford to put the liquid part almost entirely into stocks. Run that version and it prescribes the maximum equity share in essentially every country."),
            p("Which is uniform. So under this second reading the models are not miscalibrated across countries at all. They are simply too cautious everywhere."),
            p("Neither reading can be dismissed by argument. But they make opposite predictions about something testable: whether the advice responds to what else is on the investor's balance sheet. That has an answer, and it is coming.", "kicker")
          ];

          var right = h("div", { class: "stage-box" }, [
            h("h3", { class: "sub", text: "Two benchmarks, two verdicts" }),
            h("table", { class: "data" }, [
              h("tbody", {}, [
                h("tr", {}, [
                  h("td", { html: "<strong>The stake on its own</strong><br><span style='color:var(--muted)'>ignore the pension</span>" }),
                  h("td", { html: "21% to 53%<br><span style='color:var(--muted)'>varies sharply by country</span>" })
                ]),
                h("tr", {}, [
                  h("td", { html: "<strong>The whole balance sheet</strong><br><span style='color:var(--muted)'>count the pension</span>" }),
                  h("td", { html: "at the 100% corner<br><span style='color:var(--muted)'>nearly everywhere</span>" })
                ]),
                h("tr", {}, [
                  h("td", { html: "<strong>What the models say</strong>" }),
                  h("td", { class: "advice-t", html: "46% to 58%" })
                ])
              ])
            ]),
            h("p", { class: "note", style: "margin:.9rem 0 0",
              text: "The advice sits between the two, which on its own is not damning. What separates the readings is whether the advice moves when the balance sheet does." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "Suspect one is out",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Verdict" }));
          el.appendChild(h("h2", { class: "head", text: "More uniform than the defence allows" }));

          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("Uniform advice is not wrong in principle, and that is worth saying plainly. If everyone holds the same world portfolio, sizing the risky share to preferences rather than to a passport is the more defensible choice, not the lazy one.", "lede"),
            p("But the one channel that survives that argument — how much the world index moves in the currency you actually spend — calls for a 32-point spread. The advice spans 12, and the slope connecting the two is about an eighth of full calibration. Letting risk aversion vary with measured national risk appetite does not close the gap either."),
            p("So the finding is not that uniformity is inherently a bias. It is that the advice is more uniform than even the world-index defence, taken on its own terms, would produce."),
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
