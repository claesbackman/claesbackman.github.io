/* ------------------------------------------------------------------------
   decks-side.js — the four side paths.

   Each declares its `parent` (where it hangs on the map) and `opensAfter`
   (the deck and slide that offers it, so the map does not spoil the tree).
   Each ends by returning the reader to where they came from.
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
  function backTo(api, deck, slide, label) {
    var b = h("button", { class: "btn ghost", text: label || "Back to the argument" });
    b.onclick = function () { api.go(deck, slide); };
    return h("div", { style: "margin-top:1.6rem" }, [b]);
  }

  /* ======================================================================
     MODELS — thirteen advisors, not one
     ====================================================================== */

  EX.deck("models", {
    title: "Thirteen advisors, not one",
    parent: "same",
    opensAfter: ["same", 1],
    back: "same",
    slides: [

      { title: "Who is disagreeing", top: true,
        render: function (el) {
          el.appendChild(head("The side path", "The same dots, sorted two ways"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Every dot on the right is one country asked of one model, fifty answers averaged. There are 273 of them, and they are the same 273 in both views."),
              p("Sort them by which model was asked and they fall into bands. Sort them by which country was asked about and the bands vanish.", "lede"),
              p("That is the variance decomposition, without the arithmetic. Flip the switch a few times.")
            ]),
            P.regroup()
          ]));
        }
      },

      { title: "The numbers behind it",
        render: function (el) {
          el.appendChild(head("The spread across models", "Thirty-four points against twelve"));

          var left = [
            p("Mean advice by model runs from <span class='num advice-t'>0.37</span> for Gemini 3.1 Pro to <span class='num advice-t'>0.71</span> for Claude 4.5 Haiku. Thirty-four percentage points, against twelve across the countries."),
            p("The decomposition puts model identity at <span class='num advice-t'>" + K.varModel + "%</span> of all the variation in this cell, country at <span class='num flat-t'>" + K.varCountry + "%</span>, their interaction at " + K.varInteraction + "%, and sampling noise at " + K.varWithin + "%."),
            p("And the ordering follows neither company nor size. The four Anthropic models sit between 0.58 and 0.71. Google spans nearly the whole panel, with its flagship reasoning model the single most conservative advisor here and its two smaller Flash models twenty points above it."),
            h("p", { class: "note", text: "These shares describe this particular set of thirteen models weighted equally. They are not the spread a real household faces, which would depend on which models people actually use." })
          ];

          var right = h("div", { class: "stage-box scroll-x" }, [
            h("table", { class: "data" }, [
              h("thead", {}, [h("tr", {}, [
                h("th", { text: "model" }), h("th", { text: "company" }),
                h("th", { text: "mean" })
              ])]),
              h("tbody", {}, D.models.map(function (m) {
                return h("tr", {}, [
                  h("td", { text: m.name }),
                  h("td", { text: m.vendor }),
                  h("td", { class: "n", text: m.mean.toFixed(2) })
                ]);
              }))
            ])
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "Not one advisor",
        render: function (el, api) {
          el.appendChild(head("What that means", "The market delivered thirteen"));
          el.appendChild(h("div", { class: "stack", style: "max-width:38rem" }, [
            p("Each of these models applies a near-uniform policy across every country. So the new market is not one advisor for the whole world. It is thirteen, each of them acting like one advisor for the whole world.", "lede"),
            p("Across these thirteen, weighted equally, the spread between models is more than three times the spread between countries. That is a fact about this panel rather than about any household's exposure, but it does mean the choice of model is doing more work than the choice of country, and nobody is told which model they are talking to."),
            p("It also explains why this study clusters its statistics by model rather than by answer. Fifty answers from one model are not fifty independent opinions. They are one opinion, sampled fifty times.")
          ]));
          el.appendChild(backTo(api, "same", 1));
        }
      }
    ]
  });

  /* ======================================================================
     AGE — one hundred minus age
     ====================================================================== */

  EX.deck("age", {
    title: "One hundred minus age",
    parent: "same",
    opensAfter: ["same", 2],
    back: "same",
    slides: [

      { title: "The oldest rule", top: true,
        render: function (el) {
          el.appendChild(head("The side path", "Put a hundred minus your age in stocks"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("It is the oldest rule of thumb in retail investing and it fits on a napkin. At forty it says sixty percent stocks."),
              p("The study varied the investor's age across thirty, forty and fifty-five. If the models are running the rule, the answers should track it."),
              p("They almost do, and where they miss is the interesting part.", "lede")
            ]),
            P.ageRule()
          ]));
        }
      },

      { title: "Not quite the rule",
        render: function (el) {
          el.appendChild(head("The slope", "Seven tenths of a point per year"));

          var left = [
            p("The rule falls by exactly one percentage point per year of age. The pooled advice falls by <span class='num advice-t'>0.70</span>, nearly identically in the English-prompting countries (<span class='num'>0.65</span>) and everywhere else (<span class='num'>0.72</span>)."),
            p("All thirteen models tilt downward with age, and ten of the thirteen are flatter than the rule. So it is not literal compliance. It is an anchor at sixty with a gentler slope through it."),
            p("The misses also point the same way. The rule is known to be defensible in mid-career and wrong at both ends, where the right answer sits <em class='term'>above</em> it. The models anchor where the rule works and deviate toward caution at both ends — the opposite side from the life-cycle optimum."),
            h("p", { class: "note", text: "This comparison is exploratory and was not pre-registered. The age gradient itself was." })
          ];

          var right = h("div", { class: "stage-box" }, [
            h("table", { class: "data" }, [
              h("thead", {}, [h("tr", {}, [
                h("th", { text: "age" }), h("th", { text: "the rule" }), h("th", { text: "most common answer" })
              ])]),
              h("tbody", {}, [
                h("tr", {}, [h("td", { text: "30" }), h("td", { class: "n", text: "70%" }), h("td", { class: "n", text: "60%" })]),
                h("tr", {}, [h("td", { text: "40" }), h("td", { class: "n", text: "60%" }), h("td", { class: "n advice-t", text: "60%" })]),
                h("tr", {}, [h("td", { text: "55" }), h("td", { class: "n", text: "45%" }), h("td", { class: "n", text: "40%" })])
              ])
            ]),
            h("p", { class: "note", style: "margin:.9rem 0 0",
              text: "At 55 the rule's own number, 45, is given in under a tenth of answers. The models round to the nearest familiar figure instead." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "Named out loud",
        render: function (el, api) {
          el.appendChild(head("One more thing", "Only the English answers say where it came from"));
          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("The models sometimes name the heuristic out loud — “a rule of thumb,” “the 100-minus-age rule.”", "lede"),
            p("Those phrases appear in <span class='num advice-t'>" + K.citeUS + "%</span> of explanations for the United States and <span class='num advice-t'>" + K.citeIndia + "%</span> for India. Outside the English-prompting countries they appear in <span class='num flat-t'>" + K.citeNonEnglish + "%</span>."),
            p("Three hundredths of one percent. And yet the allocations bunch the same way everywhere, and the age profile is nearly the same in all twenty-one countries."),
            p("The study also tested whether the age profile is flatter where the national pension replaces more income, as a life-cycle advisor would make it. It is not. The models apply the same tilt whatever the pension system.", "kicker")
          ]));
          el.appendChild(backTo(api, "same", 2));
        }
      }
    ]
  });

  /* ======================================================================
     METHOD — how would you know?
     ====================================================================== */

  EX.deck("method", {
    title: "How would you know?",
    parent: "same",
    opensAfter: ["same", 3],
    back: "same",
    slides: [

      { title: "Thirteen is the sample", top: true,
        render: function (el) {
          el.appendChild(head("The side path", "The sample is thirteen, not a quarter of a million"));
          el.appendChild(h("div", { class: "cols top narrow-first" }, [
            h("div", { class: "stack" }, [
              p("Asking one model the same question fifty times does not give you fifty opinions. It gives you one opinion with sampling noise around it."),
              p("So the real sample here is thirteen models, and every country contrast has to be believable as agreement <em class='term'>between</em> those thirteen."),
              p("Pick a country and look at what each model says on its own.")
            ]),
            P.byModelStrip({ country: "Brazil" })
          ]));
        }
      },

      { title: "Thirteen is awkward",
        render: function (el) {
          el.appendChild(head("The statistics", "Small samples break the usual formulas"));
          el.appendChild(h("div", { class: "stack", style: "max-width:39rem" }, [
            p("Thirteen is enough to see agreement and too few for the standard error formula, which over-rejects badly at that size. It would tell you things are significant when they are not.", "lede"),
            p("So every p-value in this study comes from a bootstrap built for exactly this problem, run ten thousand times, and the twenty country contrasts are then corrected together as a single family, because testing twenty things and reporting the best one is how false findings get published."),
            p("That correction is why seven contrasts survive rather than thirteen. It is a deliberately conservative choice, and it was written down before the data existed.")
          ]));
        }
      },

      { title: "Written down first",
        render: function (el) {
          el.appendChild(head("The order of events", "The predictions were filed before the answers arrived"));

          var left = [
            p("An exploratory pilot ran in late June 2026. The design, the specifications, the hypotheses and the inference rules were registered publicly on <strong>" + K.preregDate + "</strong>. The main collection ran on <strong>" + K.collectDates + "</strong>.", "lede"),
            p("That order is what makes the failures worth reporting, and it is why they are reported here too."),
            p("One primary prediction did not survive: naming local instruments in the prompt was supposed to move the allocation, and it moved it by seven tenths of a point, which is not significant. You will meet that result later if you have not already."),
            p("Several parts of this explorable were added after the filing and are exploratory: the balance-sheet probes, the mortgage question without a rate, the questions the models ask, and the later model panel.")
          ];

          var right = h("div", { class: "stage-box" }, [
            h("h3", { class: "sub", text: "What rests on what" }),
            h("table", { class: "data" }, [
              h("tbody", {}, [
                h("tr", {}, [h("td", { text: "Countries differ" }), h("td", { text: "primary · supported" })]),
                h("tr", {}, [h("td", { text: "The UK matches the US" }), h("td", { text: "primary · supported" })]),
                h("tr", {}, [h("td", { text: "Language moves advice" }), h("td", { text: "primary · supported" })]),
                h("tr", {}, [h("td", { text: "Local instruments move advice" }), h("td", { class: "flat-t", text: "primary · not supported" })]),
                h("tr", {}, [h("td", { text: "Stated risk tolerance moves it" }), h("td", { text: "secondary · supported" })]),
                h("tr", {}, [h("td", { text: "Stated pension moves it" }), h("td", { class: "flat-t", text: "secondary · not supported" })]),
                h("tr", {}, [h("td", { text: "The calibration slope κ" }), h("td", { text: "descriptive" })]),
                h("tr", {}, [h("td", { text: "The balance-sheet probes" }), h("td", { text: "exploratory, added later" })]),
                h("tr", {}, [h("td", { text: "The mortgage question with no rate" }), h("td", { text: "exploratory, added later" })]),
                h("tr", {}, [h("td", { text: "The questions the models ask" }), h("td", { text: "exploratory, added later" })])
              ])
            ]),
            h("p", { class: "note", style: "margin:.9rem 0 0",
              text: "Not everything in this explorable carries the same weight, and the rows are ordered by how much." })
          ]);

          el.appendChild(cols(left, [right], "narrow-first"));
        }
      },

      { title: "The obvious confounds",
        render: function (el, api) {
          el.appendChild(head("Two things that could have produced it", "Both were re-collected and checked"));

          el.appendChild(h("div", { class: "cols even top" }, [
            h("div", { class: "stage-box stack" }, [
              h("h3", { class: "sub", text: "The size of the number" }),
              p("Japan's prompt says 7,500,000 yen where the American prompt says 50,000 dollars. A model anchoring on the <em class='term'>numeral</em> rather than the economics would manufacture country differences out of nothing."),
              p("Sweden, Japan and Germany were re-collected with the stake stated in dollars. The pooled shift was <span class='num'>−0.1 points</span> (<span class='num'>p = 0.84</span>). Japan alone moved 2.8 points, and its contrast stays small either way."),
              h("p", { class: "note", text: "Numeral size cannot manufacture an eleven-point Brazil gap." })
            ]),
            h("div", { class: "stage-box stack" }, [
              h("h3", { class: "sub", text: "The randomness setting" }),
              p("Everything was collected at a temperature of 0.7. A result that only held at one setting would not be worth much."),
              p("Five countries were re-collected at 0 and at 1.0. Among the ten models that accept the setting, the pooled mean moved <span class='num'>" + K.tempShift + " points</span>. Brazil's contrast was <span class='num'>" + K.brazilByTemp[0].toFixed(1).replace("-", "−") + "</span>, <span class='num'>" + K.brazilByTemp[1].toFixed(1).replace("-", "−") + "</span> and <span class='num'>" + K.brazilByTemp[2].toFixed(1).replace("-", "−") + "</span> across the three."),
              h("p", { class: "note", text: "Temperature changes the scatter around the answer, not the answer." })
            ])
          ]));

          el.appendChild(h("p", { class: "note", style: "margin-top:1.4rem;max-width:46rem",
            text: "The collection produced no refusals in 267,150 responses and recovered a usable number from 99.9 percent of them, so the usual worry about who dropped out has nothing to work with here." }));
        }
      },

      { title: "Four later checks",
        render: function (el, api) {
          el.appendChild(head("Objections raised afterwards", "Four more things that could have produced it"));

          function card(title, body, note) {
            return h("div", { class: "stage-box stack" }, [
              h("h3", { class: "sub", text: title }), p(body), h("p", { class: "note", text: note })
            ]);
          }

          el.appendChild(h("div", { class: "cols even top" }, [
            h("div", { class: "stack" }, [
              card("Where the question was sent from",
                "Every query was sent from Germany. Routing a sample through a United States connection instead moved the recommended share by <span class='num'>" + K.vpnShift + " points</span>.",
                "The interfaces do not pass the caller's location to the model."),
              card("The English instructions",
                "Every prompt wraps the translated question in English instructions, which might pull the answer toward an English default. With the instructions translated as well, the country differences correlate at <span class='num'>" + K.trinstrCorr + "</span> with the main ones and span " + K.trinstrRange + " points against 12.",
                "Two models respond by about four points. The other eleven move by less than 1.5.")
            ]),
            h("div", { class: "stack" }, [
              card("What the stake buys",
                "$50,000 at market exchange rates buys twice as much in Brazil or Poland as in the United States. Restating the stake at purchasing power raises the share by <span class='num'>" + K.pppShift.toFixed(1) + " point</span> on average. Brazil's gap goes from " + K.pppBrazil[0].toFixed(1).replace("-", "−") + " to " + K.pppBrazil[1].toFixed(1).replace("-", "−") + ".",
                "The size of the stake accounts for a sixth to a third of the largest gaps."),
              card("No chance to ask questions",
                "Letting the models list questions first lowers the provisional share by about six points in every country. The country averages correlate at <span class='num'>" + D.elicit.corrCountryMeans + "</span> with the main results.",
                "The similarity across countries is not a shared lack of information.")
            ])
          ]));

          el.appendChild(h("p", { class: "note", style: "margin-top:1.2rem;max-width:46rem",
            text: "All four were collected in October 2026, after the pre-registered results, and are exploratory." }));

          el.appendChild(backTo(api, "same", 3));
        }
      }
    ]
  });

  /* ======================================================================
     GLIDVAG — one Swedish word
     ====================================================================== */

  EX.deck("glidvag", {
    title: "One Swedish word",
    parent: "words",
    opensAfter: ["words", 2],
    back: "words",
    slides: [

      { title: "Glidväg",
        render: function (el) {
          el.appendChild(h("p", { class: "eyebrow", text: "The side path" }));
          el.appendChild(h("div", { class: "center", style: "margin:0 auto;max-width:44rem" }, [
            h("p", { style: "font-size:clamp(2.6rem,8vw,4.6rem);line-height:1;letter-spacing:-.03em;font-weight:600;margin:0 0 1.4rem",
              text: "glidväg" }),
            h("p", { class: "lede", style: "margin:0 auto 1rem",
              text: "A Swedish response to the portfolio question recommends one of these." }),
            h("p", { style: "margin:0 auto",
              text: "There is no such Swedish word. It is a morpheme-for-morpheme calque of the English industry term “glide path” — glid, glide, plus väg, path — assembled on the spot." })
          ]));
        }
      },

      { title: "What is missing",
        render: function (el, api) {
          el.appendChild(head("The word that is not there", "A Swedish saver would say something else"));

          var left = [
            p("A Swede planning a pension would say <em class='term'>generationsfond</em>, or would just name AP7, the state default fund almost everyone is in. That is the vocabulary. It exists, it is ordinary, and it is what the concept is called."),
            p("Across roughly five million lines of response text, <em class='term'>generationsfond</em> appears <span class='num'>zero</span> times.", "lede"),
            p("<em class='term'>Glidväg</em> appears in <span class='num'>0.3%</span> of Swedish responses — seventeen occurrences, thirteen of them from a single company's model."),
            p("It is a tiny thing. But it is the one place in this study where you can hear what the statistics describe: an English concept crossing into Swedish words, rather than Swedish knowledge being retrieved.", "kicker"),
          ];

          var caveat = h("p", { class: "note", style: "margin:.9rem 0 0", text: "One case study, not a result. It is not pre-registered, it appears in the paper as a footnote, and it was found by looking. Seventeen occurrences prove nothing on their own — it is offered as an illustration of a mechanism the allocation numbers already pointed at." });

          var right = h("div", { class: "stage-box" }, [
            h("h3", { class: "sub", text: "Across the Swedish responses" }),
            h("table", { class: "data" }, [
              h("thead", {}, [h("tr", {}, [h("th", { text: "term" }), h("th", { text: "appearances" })])]),
              h("tbody", {}, [
                h("tr", {}, [
                  h("td", { html: "<em>generationsfond</em><br><span style='color:var(--muted)'>the Swedish word for it</span>" }),
                  h("td", { class: "n", text: "0" })
                ]),
                h("tr", {}, [
                  h("td", { html: "<em>glidväg</em><br><span style='color:var(--muted)'>a word invented on the spot</span>" }),
                  h("td", { class: "n advice-t", text: "17" })
                ])
              ])
            ])
          ]);

          el.appendChild(cols(left, [right, caveat], "narrow-first"));
          el.appendChild(backTo(api, "words", 2));
        }
      }
    ]
  });

})();
