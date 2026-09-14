# Seminar deck, academic register — Housing Capital Gains across the Income Distribution

The academic-register sibling of `../2026_4_Explorable/`. Same title and
theme, but the slides carry the paper's own figures wherever the paper has
one, and the prose is written for a seminar audience: shorter, in the paper's
terms, with a source line on every slide. Only two conceptual points keep a
stylised drawing, the composition houses and the floor-and-ceiling diagram. Chart captions
are switched off on `.terse` stages and replaced by a one-line source in the
prose.

```
index.qmd                 the deck
theme/, js/, figs/        copies of the same folders in ../2026_4_Explorable/
figs/convert_extra.sh     converts the extra paper figures this deck uses (pdftocairo), then recolours
5_references.bib          copy of the root bibliography
shoot_chrome.py, shoot.py screenshot every slide (Chrome / playwright)
```

Render with `quarto render index.qmd`, check with `python shoot_chrome.py`.
The two decks share nothing on disk, so a change to the theme or the charts
has to be copied across, or made in `Explorable_HousingReturns/` and pulled in
with `js/sync_from_explorable.sh` in both folders. Everything else about the
build, the charts and the conventions is documented in
`../2026_4_Explorable/README.md`.
