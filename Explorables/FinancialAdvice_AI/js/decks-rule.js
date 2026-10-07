/* ------------------------------------------------------------------------
   decks-rule.js — the second half of the spine.

   words -> levers -> lineup -> asym -> incidence

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
    next: function () { return EX.done("warranted") ? "levers" : "warranted"; },
    slides: [

      { title: "The second suspect",
        render: function (el) {
          el.appendChild(head("Suspect two", "Suppose it cannot tell the countries apart"));
          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("These models learned overwhelmingly from American English. If Ankara and Amsterdam are not really distinct places to them, then uniform advice is a gap in what they know rather than a flaw in how they advise. Those are very different problems with very different fixes.", "lede"),
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
            p("The allocation moves <span class='num advice-t'>" + Math.abs(K.phi) + " of a point</span>, and not significantly. This was a pre-registered primary prediction, and it is the one the data did not support.", "kicker")
          ];

          // Both side doors sit inline, next to the sentence that raises them,
          // rather than as cards below the fold.
          var objection = h("p", { class: "note" }, [
            document.createTextNode("Maybe the experiment is simply too blunt to pick up country differences anywhere. "),
            api.inlineDoor("mortgage", "Can this design detect localization at all"),
            document.createTextNode(" ")
          ]);
          var flavour = h("p", { class: "note" }, [
            document.createTextNode("The models also invent local vocabulary when none exists. "),
            api.inlineDoor("glidvag", "One Swedish word, which is not a Swedish word"),
            document.createTextNode(" ")
          ]);
          left.push(objection, flavour);

          var right = h("div", { class: "stack" }, [
            P.localGrid({ country: "Sweden", version: "C" })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));

        }
      },

      { title: "Suspect two is out",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "Verdict" }));
          el.appendChild(h("h2", { class: "head", text: "They know. It just does not reach the number." }));

          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("Local financial context appears in three quarters of non-US explanations without anyone asking for it, and in almost all of them once the prompt supplies it.", "lede"),
            p("Run the same regression, on the same answers, with the same statistics, but on a different outcome. Ask not what share it recommended but whether the explanation named anything local, and South Africa comes out <span class='num'>78 points</span> above the United States — 78 out of a possible 100 explanations. On the equity share the same machinery finds nothing. The design can resolve country differences wherever the output contains them, so the near-zero allocation effect is a property of the advice, not a limit of the test."),
            p("This also matters for anyone reading the advice. The localisation is real, and it is all in the prose. A reader who sees their own pension system named has every reason to think the recommendation was built for them, and no way to tell from the answer that it was not.")
          ]));

          var nextUp = EX.done("warranted")
            ? [["levers", "Both suspects are gone. So what does move the number?",
                "Stop asking why the answer does not change and start asking what makes it change. A separate arm of the experiment inserted one sentence about the investor into the same prompt.",
                "Continue"]]
            : [["warranted", "Now the other one: maybe uniform advice is correct.",
                "Under standard portfolio theory every investor holds the same world stock index, so an advisor who ignores your passport might be right. There is a way to check, and it has a number attached.",
                "Work out what the answer should have been"]];

          el.appendChild(h("div", { style: "margin-top:1.6rem" }, [api.doors(nextUp)]));
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
    back: function () { return EX.done("words") ? "words" : "warranted"; },
    slides: [

      { title: "Turn it around",
        render: function (el) {
          el.appendChild(head("Both suspects gone", "So stop asking why it does not move"));
          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("So stop asking why the answer does not change, and ask what does change it.", "lede"),
            p("<em class='term'>What does move the number?</em>"),
            p("A separate arm of the experiment kept the prompt identical and inserted one sentence about the investor herself. Not about where she lives — about her. Each sentence targets something portfolio theory has a sharp and specific opinion about, so the pattern of responses is diagnostic rather than merely interesting."),
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
            text: "Two mistakes, in opposite directions" }));
          el.appendChild(h("p", { class: "note", style: "max-width:46rem;margin-bottom:1.2rem",
            text: "Each panel shows the recommended equity share. The orange needle is what the models said, the grey tick is where a plain prompt with no extra sentence lands, and the teal marker is what portfolio theory says the sentence should have done. Move one control at a time." }));
          el.appendChild(P.dials());
        }
      },

      { title: "The damning one",
        render: function (el) {
          el.appendChild(head("The middle one is odd. The last one is damning.", "Nothing had to be retrieved"));

          var left = [
            p("The horizon result is strange but arguable. Textbook theory says a twenty-year horizon and a one-year horizon call for the same equity share, and the models move forty points. You can rescue that if you believe stock returns mean-revert, which some economists do."),
            p("The pension result has no such escape.", "lede"),
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
              text: "Both are named in essentially every explanation. Only one reaches the recommendation. This is also the answer the second benchmark was waiting for: it called the models too cautious everywhere for ignoring the pension, and here they ignore it." })
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
            p("Here are three candidates. Two of them are what finance textbooks describe. One is what the advice industry actually does at the front desk."),
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
            p("The rule that fits is not a portfolio model. It is the intake form — the two or three questions a retail adviser asks before recommending a fund. How do you feel about losing money, and when do you need it back.", "lede"),
            p("Economists have documented the gap between what finance textbooks prescribe and what the advice industry recommends for decades. The pattern here matches the industry."),
            p("It would also account for the compression: a questionnaire has no box for the country you live in. Matching three responses against three candidate rules identifies a pattern of behaviour, not the machinery producing it.")
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

          el.appendChild(h("div", { style: "margin-top:1.6rem" }, [
            api.doors([["asym", "One more thing about the balance sheet.",
              "The pension sentence was one of several. After the pre-registered results were in, more statements were tried, and they revealed something sharper than simple neglect.",
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
    next: "incidence",
    back: "lineup",
    slides: [

      { title: "Seven more sentences",
        render: function (el) {
          el.appendChild(head("Exploratory", "Not neglect. Something more specific."));
          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("“A generous pension” is a blunt instrument. Once the pre-registered results were in, the study went back and tried seven sharper sentences, each one a fact about the investor's balance sheet.", "lede"),
            p("Three of them mean she is <em class='term'>more</em> exposed to stock-market risk than the default prompt implies. Four mean she is <em class='term'>safer</em>."),
            p("Portfolio theory treats these symmetrically and it is not a close call. Risky wealth outside the portfolio should push the portfolio toward bonds. Safe wealth outside the portfolio should push it toward stocks, by the same logic and with the same force."),
            h("p", { class: "note", html: "Everything in this deck is <strong>exploratory</strong>. These statements were added after the pre-registered results were seen, are recorded as dated deviations, and sit in no correction family. Treat them as a lead, not a finding." })
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
              p("Currency hedging does not register at all, at <span class='num flat-t'>+0.4 points</span> with a p-value of 0.66."),
              p("The models read the balance sheet only as a source of hazard. Safety, which in portfolio theory has exactly the same standing and the opposite sign, buys the investor almost nothing.", "kicker"),
              h("p", { class: "note", text: "The direction is right on every cue and the ladder is monotone. It is the magnitudes that are one-sided, by roughly an order of magnitude." })
            ]),
            P.probeSummary()
          ]));
        }
      },

      { title: "Why that matters",
        render: function (el) {
          el.appendChild(head("One-sided prudence", "The neglected half is the regulated half"));
          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("Cutting risk whenever a client says something worrying is not, on its own, a scandal. It is defensible behaviour for something that cannot verify who it is talking to.", "lede"),
            p("But the half it ignores is the half that rules exist to protect. Suitability and best-interest obligations require a human adviser to weigh the client's whole financial position, and the point of weighing it is that it cuts both ways. A client with a guaranteed pension and a cash cushion can afford more risk, and an adviser who never lets her take it is not being careful. They are giving her a worse portfolio."),
            p("The models do the cautious half and skip the other half. And they do it outside the perimeter where anyone is obliged to do either.")
          ]));
        }
      }
    ]
  });

  /* ======================================================================
     INCIDENCE — who pays (Act 3)
     ====================================================================== */

  EX.deck("incidence", {
    title: "Who pays",
    back: "asym",
    slides: [

      { title: "It is cheap", top: true,
        render: function (el) {
          el.appendChild(head("The bill", "For almost everybody, this costs nothing"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Being somewhat wrong about a portfolio is cheap, and this is not a rhetorical concession. The cost of holding the wrong equity share grows with the <em class='term'>square</em> of how wrong you are, so a moderate gap is very nearly free."),
              p("The median country in this study pays <span class='num'>" + K.medianLossBp + " basis points</span> a year — a basis point is a hundredth of a percentage point. About <span class='num'>$" + K.medianLoss5y + "</span> over the five years the prompt asks about, on a $50,000 stake. Sixteen of the twenty-one pay under five basis points."),
              p("So a one-size-fits-all advisor is a perfectly good default for most of this panel, and the honest summary of the compression finding, taken by itself, is that it is individually cheap.", "lede"),
              h("p", { class: "note", text: "The squares of small numbers are very small numbers. This is why the finding is about incidence rather than about magnitude." })
            ]),
            P.squareCost()
          ]));
        }
      },

      { title: "Except where it is not",
        render: function (el) {
          el.appendChild(head("Who is out on the tail", "Turkey pays seven percent of the stake"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
            p("<span class='num advice-t'>137 basis points a year</span>. About <span class='num advice-t'>$3,513</span> over five years on a $50,000 stake. Brazil pays 58 basis points, Mexico 19, Poland 16, Japan 15. No western European country pays more than five.", "lede"),
            p("That ordering follows from the arithmetic. One rule anchored near the United States leaves an error that grows with the distance between local circumstances and that anchor. The cost grows with the square of the error. So the bill lands, mechanically, on the households whose situations least resemble the place the rule was formed."),
            p("And it lands on all of them at once. Advice drawn from a handful of models trained on overlapping corpora produces a common error rather than an idiosyncratic one, and common errors do not average away across the people holding them. The study does not measure human advisers, so the comparison is a conjecture. What it does measure is that the thirteen models agree with each other far more than they differ by country.")
            ]),
            P.lossBars()
          ]));
        }
      },

      { title: "The sandbox", top: true,
        render: function (el) {
          el.appendChild(h("p", { class: "eyebrow", text: "Your turn, for your own questions" }));
          el.appendChild(h("h2", { class: "head", style: "max-width:34ch;margin-bottom:.5rem",
            text: "Everything the argument rests on" }));
          el.appendChild(h("p", { class: "note", style: "max-width:46rem;margin-bottom:1.3rem",
            text: "Every assumption behind the numbers you have been reading, exposed and editable. Push on them. If the conclusion only survives one setting, it deserves to be doubted." }));
          el.appendChild(P.sandbox());
        }
      },

      { title: "What this market is",
        render: function (el, api) {
          el.appendChild(h("p", { class: "eyebrow", text: "The end, and a question" }));
          el.appendChild(h("h1", { class: "big", style: "max-width:24ch",
            text: "One advisor for the whole world" }));

          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("Financial advice used to be a national business, held there by regulation, by language, and by the fact that you have to trust someone before you take their advice about money.", "lede"),
            p("All three of those have weakened. The same handful of models answer the question in every language at almost no cost, and they answer it with one policy — or rather with thirteen, which is still not many."),
            p("The advice weighs your feelings and your deadline. It does not weigh your balance sheet, except when your balance sheet looks alarming. That neglected margin is exactly what suitability rules oblige a human adviser to consider, and these models sit outside those rules entirely."),
            p("And the uniformity is hard to see from the inside, because the part of the answer that visibly adapts to your country is the paragraph, not the number."),
            h("p", { class: "kicker", style: "margin-top:1.6rem;font-size:1.25rem",
              html: "Human advisers are inside a perimeter that requires them to weigh the thing these models skip. Should the perimeter move?" })
          ]));

          var unseen = ["models", "mortgage", "age", "glidvag", "method"]
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
              text: "You have taken every path. The paper is at osf.io/2ch5z." }));
          }
        }
      }
    ]
  });

})();
