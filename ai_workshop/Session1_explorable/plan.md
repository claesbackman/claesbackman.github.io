# Practical AI for Academics, Day 1 — plan

Built from `../Lugano_Session1.tex` (beamer, 55 frames) as an explorable deck. This is the second version, after five independent reviews (writing, slides, visuals, teaching, and a sceptical audience member) of the first.

## Frame
- **Audience.** Economists and social scientists at a two-day workshop in Lugano. Strogatz's *perplexed*: most tried ChatGPT in 2023, found it fluent and useless, and stopped. A few *naturals* who already use Claude Code. The slide text is written for the perplexed; the naturals get the appendix rooms and the speaker notes.
- **Length.** A half-day workshop session, not a conference talk, so the deck does not use the 20-minute default. 70 counted slides including nine dividers, about 60 content slides, roughly 75–90 minutes of lecture around a live demo, a bet or two, and a break. Everything a questioner might want sits in the appendix.
- **Venue.** Seminar room, projector, presenter's laptop, network probably available. Live stages run offline; the one network-dependent element is the live Claude Code demo, which has its own check-in slide and a fallback note.

## The one big thing
An AI agent is a prediction machine, so its output is only as good as the context you give it and the checks you run on what comes back. The model matters less than the workflow around it.

## The chain
Two economists get the same paper and the same request: *build a website for this paper*. Anna uploads the PDF to a chatbot and gets HTML in a chat window; Ben opens the folder in an agent, which reads, writes, runs and fixes.
→ Both tools sit on a model that predicts the next token, THEREFORE it is a prediction machine, not a lookup machine, and asked about a paper it has not been given it invents a plausible one.
→ BUT the same predictor with the paper in the conversation is specific and checkable, THEREFORE context is the lever (stated once, here, after it has been shown).
→ Tools moved from chat to reasoning to agents in four years, THEREFORE the agent can gather its own context; coding success rises from 74 to 96 percent when the agent runs its own code.
→ BUT the frontier is jagged, and (bet, then reveal) only one in five social scientists uses an agent, THEREFORE most of the room is Anna.
→ The agent is a loop around the model, THEREFORE the value is in the harness: context window, standing instructions, tools. Context is a budget with habits that protect it.
→ Chat and agent tools are converging on context (projects) but not on the loop, THEREFORE choose by how easily each supplies context.
→ BUT Ben is responsible for every line, and the errors that matter do not crash, THEREFORE four checks that each buy a different kind of independence from the agent that wrote the code, each answering a weakness of the one before.
→ In teaching: take-home marks stopped predicting in-person marks (bet on what AI does to homework and exams), homework got better and faster BUT exams fell, homework was already a weak signal, THEREFORE protect what must be learned without AI, then teach more with it.
→ Ending: publishing gets noisier while research can get better; the room's question is how to evaluate research when competent-looking writing is free. Tomorrow you are Ben.

## Characters and colours
- **Anna** (chat): uploads the PDF to a chatbot, gets text back. `--chat`, ochre #9C6B2E. Used only for Anna's tool.
- **Ben** (agent): points an agent at the paper's folder with a `CLAUDE.md`. `--agent`, slate blue #3E6690. Used only for Ben's tool: the agent panels, the CV example, both agent products.
- **Context** (the quantity the talk is about): `--context`, brick #A63D2A. Used only for the files segment of the context window and its over-limit hatch.
- **Check** (verification): `--check`, teal #2F7A66. Used only in section 7: the check panels and the four dots on the cost axis.
- Everything else is parchment and ink, after the source deck's "Parchment & Ink" theme. Accents that used to be brick (numerals, links, progress bar, active arrows, slider thumb) are ink.

## Slide by slide (screenshot numbers; 01 is the title)

### Hook
02. **Two economists, one paper. Who has a website by lunch?** Anna and Ben glyphs; bet on the slide. Note: start the live demo now.
03. **The tools changed, the workflow is the value, and judging the output is the new job.** The map, named as such.
04. **Eight steps today, hands-on tomorrow.** Agenda strip and the resources link.

### 1 · An LLM predicts the next token
06. **An LLM predicts the next token, over and over, very well.** Stage `next-token`; defines token. Six presses.
07. **So it is a prediction machine, not a lookup machine.** Three neutral panels; the invented-citation sentence.
08. **Treat it as a well-read colleague who never admits to not knowing.** Single assertion.
09. **But give it the paper, and the same predictor becomes specific.** Two columns, one concrete question asked without and with the PDF. First BUT.
10. **The message in one sentence.** Context, now that it has been shown.

### 2 · The landscape moved from chat to agents
12. **Three generations in four years.** Stage `generations`; defines subagent in the note.
13. **GPQA: from guessing to above expert level.** Epoch AI figure, full width.
14. **One paper in three hours, a thousand in a project.** Novosad first; the opposite-result twist is on the slide.
15. **Agents raise econometric coding success from 74 to 96 percent.** Galiani et al.; Cherny's quote in the note.
16. **But the frontier is jagged.** Stage `frontier` redrawn with axes and a "good enough" line; two tasks of similar difficulty on opposite sides.
17. **Who in the room uses an agent?** Bet slide: hands, then a guessed number.
18. **Most social scientists use AI, few use an agent.** Stage `adoption-field` builds in; the numbers arrive on a fragment after the chart. Reveal.
19. **Adoption falls with seniority.** Two readings named.
20. **Agent users do more of everything, especially drafting.** Selection caveat on the slide.

### 3 · Where the time goes
22. **Three jobs for an agent.** Neutral panels; new-ways-of-working in the note.
23. **Admin is the undervalued one.** The CV panel in Ben's colour.
24. **AI rewards expertise, because it does not supply the question.** Two columns, one slide.
25. **Check-in: Ben's website.** Switch to the browser.

### 4 · The agent is the harness around the model
27. **The agent is a loop.** Stage `harness-loop`: nine steps, log as a list, defines CLAUDE.md in prose.
28. **The harness adds six things the model cannot do alone.** Table, MCP explained.
29. **Context is a budget.** Stage `context-budget` starts at six long PDFs; the move fills it.
30. **Four habits keep the window for what matters.** Command rows.
31. **Five prompting rules.** Five cards.
32. **Text formats are free; binaries cost a conversion.** Four rows; `.dta` read through code.
33. **Converting is one sentence to the agent.** With the spot-check.

### 5 · Choosing a tool
35. Providers trade places; 36. Pro is enough to start; 37. the default model is enough; 38. effort spends the same budget; 39. **Chat runs in a sandbox; an agent runs on your computer** (Anna and Ben named); 40. **But the two are converging** (context yes, loop no; reconciles the hook); 41. surfaces; 42. Claude Code vs Codex (both in Ben's colour, Fable listed, skill defined); 43. **The difference between tools is how easily you supply context.**

### 6 · In practice
45. **A good prompt shows its plan, documents its work, and hands you something to check.** The ECB prompt.
46. **Six things to try this week.** Six small panels.

### 7 · Verification is the new bottleneck
48. **Ben's website took twenty minutes. Ben is responsible for every line of it.** The silent-error BUT, with Ben's abstract and Ben's table.
49. **First principle: you read whatever goes into the paper.**
50. **A diff is a smaller thing to read than a codebase.** Defines diff.
51. **Each check buys independence from the agent that wrote the code.** Stage `checks-cost`.
52. Check 1, with its weakness (same model) → 53. Check 2, with its weakness (same paper) → 54. Check 3 → 55. Check 4, with the independence caveat.

### 8 · Teaching in times of AI
57. **When Serrano moved the final in-person, take-home midterms stopped predicting it.** Stage `serrano`, a scatter of all 59 students; bet on the slide.
58. **With AI, homework got better and faster.** Pair of charts, two stats.
59. **But exam scores fell.** One chart, one stat.
60. **Homework was already a weak signal.** Two stats.
61. Three things AI changes; 62. protect learning; 63. teach more; 64. weekly quiz; 65. three things to build.

### Ending
67. **Friction drops, the bottleneck moves, verification becomes the edge.**
68. **Four habits for text output.** Named as the prose counterpart of section 7's code checks.
69. **Disclosure and data norms are still in flux.** Before the open question, so the deck ends on it.
70. **Publishing gets noisier; research can get better.** The room's question.
71. **End of Day 1: tomorrow you are Ben.**

## Appendix rooms
- **CLAUDE.md starter template** ← linked from 27 (harness) and 30 (habits).
- **Skill library** ← linked from 54 (check 3).
- **Signs of session drift** ← linked from 30 (habits).
- **Four checks, the full table** ← linked from 51.
- **What the ECB prompt is testing for** ← linked from 45.
- **References.**

## What the first version got wrong, for the record
The thesis was stated four times before anything earned it; the adoption bet was printed next to its answer; Anna and Ben vanished after section 5; brick was used as a general accent so it could not also mean context; token, CLAUDE.md, diff, subagent and skill were used before they were defined; the loop and budget stages were too small or started in an uninteresting state; the Serrano figure was an illegible crop. All of these are fixed above.
