# Prompts: AI Exposure and House Prices in Denmark

The prompts written in the Claude Code session of 20 October 2026 that produced the research plan, the data pipeline and the paper draft in this folder. They are reproduced verbatim, typos included. The short notes in italics give context and are not part of the prompts.

## 1. Initial request

> I want to write a paper on AI exposure and house prices in Denmark. My hypothesis is that areas with greater AI exposure has faster house price growth. You can download data using the DST API document here: https://www.dst.dk/en/Statistik/hjaelp-til-statistikbanken/api I first want you to make a plan for how you would do this, including how to get the data and how to analyze it, and then we will iterate on the plan

*Result: `AI_tools/research_plan.md` (v1).*

## 2. Data source for municipality prices

> There is a municipality square meter price dataset available from Finans Danmark

*Sent while the first plan was being written. Result: Finans Danmark BM010 became the main outcome.*

## 3. Decisions on the open questions

> 1. No, not for this project. 2. let's do a shock in late 2022. 3. Do the ILO index. 4. where the residents live

*Answers to the plan's four open decisions: no register access, a generative AI shock in late 2022, the ILO exposure index, and exposure measured where residents live. Result: research plan v2.*

## 4. Start Phase 1

> ok do that

*Result: data downloads, the exposure measure, and the Phase 1 figures and tables.*

## 5. Resume after an interrupted response

> try again

*Sent after a response was cut off mid-stream.*

## 6. Paper draft

> Cna you write up a draft of the paper?

*Result: the event study, plus `Writing/paper.tex`, `Writing/references.bib` and `Writing/paper.pdf`.*

## 7. This document

> Collect all the prompts that I wrote in this conversation in a markdown document and save it
