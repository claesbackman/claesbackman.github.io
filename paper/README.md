# Agentic AI for Empirical Research

Source for the PDF collection of the AI guides on the site.

The document is assembled from the HTML guides linked from
[`ai-guides.html`](../ai-guides.html). The split is deliberate:

- **Body (Sections 1–8)** — the argument, which is meant to outlast the tools it
  was written about. Verification as the binding constraint, the error class that
  survives an agent's own debugging, enforcing independence structurally, and the
  ex-ante loop.
- **Appendix B** — everything that decays: product names, file conventions, mode
  vocabulary, extension IDs. Stamped with the date the official docs were checked.
  When this conflicts with the web guides, the web guides are right.

Keeping those apart is what makes it possible to reissue the PDF without rewriting
the argument each time a vendor renames something.

## Building

Requires a TeX distribution with `tcolorbox`, `fvextra`, `titlesec`, `microtype`,
and `lmodern`. On Debian/Ubuntu:

```
apt-get install texlive-latex-recommended texlive-latex-extra \
                texlive-fonts-recommended lmodern
```

Then:

```
pdflatex agentic-ai-empirical-research.tex   # ×3, for the TOC and cross-references
```

Three passes are needed: the table of contents and the internal section references
(`\ref{sec:ladder}` and friends) only settle on the third.

The build should be silent. If it is not, the two things to check are overfull
boxes (`grep -c Overfull *.log`, expected `0`) and prompt blocks — `Verbatim` wraps
lines over ~74 characters with a continuation marker rather than reporting an
error, so keep the text inside `prompt` environments under that width.

## Updating

When a guide on the site changes materially, update the corresponding section here
and bump `\version` in the preamble. The version string appears on the title page
and in the footer, so a reader can tell which vintage they have.
