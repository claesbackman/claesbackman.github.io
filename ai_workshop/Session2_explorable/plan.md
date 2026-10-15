# Practical AI for Academics, the hands-on afternoon (Münster) — plan

Built from `../Munster_Session2.tex` (beamer, 45 frames plus appendix) as an explorable deck. It is the afternoon half of a one-day workshop; the morning half is `../Session1_explorable`, and this deck continues its characters, colours and theme. This is the second version, after five independent reviews (writing, slides, visuals, teaching, and a sceptical audience member) of the first.

## Frame
- **Audience.** The same room as the morning, now with laptops open: economists and social scientists at the University of Münster. Strogatz's *perplexed*, who installed VS Code at lunch and have never typed a slash command. The slide text is written for them; the naturals get the appendix rooms and the speaker notes.
- **Length.** A three-hour hands-on session (14:00–17:00) with a break after block 3. About 55–65 minutes of slides around three timed exercises (10, 15 and 10 minutes), a short adversary exercise, an optional one, debriefs, and a demo that runs in the background. 39 counted slides including eight dividers; everything a questioner might want, and the whole setup guide, sits in the appendix.
- **Venue.** Seminar room, projector, every participant on their own laptop with VS Code, the Claude Code extension, the skills installed, and a folder of their own materials (a draft, three or four PDFs of their writing, a week of lecture notes, a codebook if they have one). Network required for the exercises; the deck's stages run offline.

## The one big thing
This morning said that context is the lever and verification is the job. This afternoon every exercise is that one move made on your own materials: put the right files in the folder, type one command, and read what comes back as a draft to check, not an answer to accept.

## The chain
Check the folder, the panel and the skills; then type one command and eight reviewers read your draft while we talk (bet: what will it catch that you missed, what will it get wrong?).
→ The command is a skill, a markdown file the agent loads when you name it, THEREFORE the workflow is a text file you can read, fork and edit.
→ The skill hands the paper to eight subagents with fresh windows, THEREFORE eight narrow reviewers catch what one diffuse reader misses (BUT they share a model, so a different model is the independent check).
→ BUT the agent that wrote the report has its own answer in its window and will defend it, THEREFORE spawn an adversary with a fresh window: one sentence, five moments to say it.
→ The report is not all correct, THEREFORE the point is not to trust it but to make hard feedback cheap enough to ask for before the desk reject (the room runs the adversary and debriefs).
→ CLAUDE.md is permanent and a skill is on demand, THEREFORE keep the first short and put long workflows in the second.
→ Your draft can go into the window under your subscription's terms, BUT register data and server output never can, THEREFORE give the agent everything that explains the data and nothing that is the data: a codebook and a simulated dataset; the do-file crosses the wall by hand. BUT synthetic data tests that the code runs, not that it is right.
→ Writing: most research tasks are bounded, and most of the value is not in AI writing your text, THEREFORE edit your draft with AI rather than editing the AI's draft, with your own prose in the window as a voice file (exercise). The reader's discount matters more than the detector.
→ Does the code do what the paper says? A skill maps claims to scripts; a diff is the unit of review, THEREFORE the code needs a history: GitHub for the skills, Dropbox for the Overleaf coauthor, one per project.
→ Slides: ask for a deck from the paper and you get a stochastic Beamer parrot, the old thing faster, THEREFORE borrow from the people who explain things for a living and build an explorable deck instead. BUT Claude will always find some story in your paper, so the expertise, the editing and the practice matter more, not less.
→ A replication package is a README, a master script and portable paths; with register data the fresh-folder run happens on the server.
→ Teaching, from the morning: take-home grades stopped predicting, THEREFORE test weekly; build a quiz bank from your notes and verify every answer key (bet on the number of wrong keys, then the exercise).
→ Ending: the goal is to provide the right context, and the tools differ in how easily you can. Six times today: files in, one command, one check. Your turn.

## Characters and colours
Anna and Ben from the morning. Ben's colour is the main agent's; this afternoon everyone in the room is Ben, so Anna appears once, as the struck-out chat bubble on the secure-data stage.
- **Context** `--context`, brick #A63D2A: text you put in the agent's window. The CLAUDE.md and skill segments, the paper in both reviewers' windows, the files on the laptop side of the secure-data stage, the codebook and simulated-data panels, the claims in the paper–code map, the left column of the recap.
- **Check** `--check`, teal #2F7A66: verification. The eight review subagents and their returning summaries, the fresh subagent's window border, the "tests that the code runs" column, the matched links in the paper–code map, the optional-exercise rule, the right column of the recap.
- **Agent / Ben** `--agent`, slate blue #3E6690: the main agent. Its box in the fan-out, its window border and its own report in the second-opinion stage, the laptop on the secure-data stage, the agent path for slides.
- **Chat / Anna** `--chat`, ochre #9C6B2E: chat. Used once, the struck-out chat bubble on the secure-data stage.
- Everything else is parchment and ink. Inline code, the progress bar and link underlines are ink; the first version had them in Quarto's highlight blue and the morning's brick.

## Motif
The morning's motif was the context window filling. The afternoon's is the prompt line: every divider carries the command the block runs, in mono with a cursor, and the closing slide is an empty prompt. Exercise slides are cards with a time chip, numbered steps, a fallback if the skill is missing, and a debrief question, beside a live timer the presenter starts.

## Slide by slide (screenshot numbers; 01 is the title)

### Before the hook
02. **Before anything: the folder, the panel, the skills.** Three checks with links to the setup and install rooms; the two mechanics, `/name` and `@file`, defined once; the paid-plan line.
03. **You brought a draft. In ten minutes, eight reviewers will have read it.** Exercise 1 card: the command, *Allow*, the light version and the no-skill fallback prompt. The bet is on the slide. Timer.
04. **Seven blocks, three exercises, the same move every time.** Agenda strip with the command each block runs; the one sentence about the move; the break time; the resources URL.

### 1 · A referee report on your paper (`> /review-paper`)
06. **A skill is a markdown file the agent loads when you type its name.** The SKILL.md opening; two stats read from `L.DATA` (663 lines, 8 reviewers).
07. **Eight narrow reviewers beat one diffuse reader.** Stage `fan-out`; defines subagent on the slide; the same-model caveat on the slide.
08. **But the agent that wrote the report will defend it.** Stage `second-opinion`, static: the author's window (its own report in blue) and the fresh subagent's (paper and report in brick). The sentence that launches it; the exercise is on slide 10.
09. **One sentence spawns an adversary, and there are five moments to say it.** Five cards; trigger words; second look versus second opinion.
10. **The report is not all correct, and that is the point.** Exercise 1b (the adversary) and the debrief in one card, four questions including what the adversary found; the so-what; link to the other-tools room.
11. **Keep CLAUDE.md short; put long workflows in skills.** Stage `skill-load`: the first tenth of the window; toggle "type /review-paper" and the hatched skill segment arrives; CLAUDE.md stays. Links to the template and `/init`.

### 2 · Working with secure data (`> read @codebook.md …`)
13. **Your draft can go into the window; register data and server output cannot.** Two columns reconciling exercise 1 with the rule; the data setting; institutional policy.
14. **The agent never sees the data, but it sees everything that explains the data.** Stage `server-wall`, six steps; what crosses back is what you type, an error code or a request, never a result.
15. **Two files to keep local: a codebook in markdown and a simulated dataset.** Two panels in the context colour.
16. **But synthetic data tests that the code runs, not that it is right.** Two columns; the block's check named: read the real log yourself.

### 3 · Writing with agentic AI (`> /voice-extractor sample-papers`)
18. **Most research writing tasks are bounded, so the setup can be small.** Kazinnik's two posts; the second is the fragment and the turn.
19. **Use AI to edit your draft; do not edit the AI's draft.** Two panels; the personal line as the closing sentence.
20. **A voice file puts your prose in the window.** The instruction; what goes in, what stays out, the two placements (permanent via CLAUDE.md or on demand via `@voice.md`).
21. **Exercise 2: fifteen minutes puts your voice in the window.** Card with the no-skill fallback prompt and the no-CLAUDE.md route; timer.
22. **/prose-revision fixes the order of ideas before the choice of words.**
23. **Whether a detector catches you matters less than whether the reader does.** Pangram in the sub-line. Break.

### 4 · Does the code do what the paper says? (`> /review-paper-code`)
25. **/review-paper-code maps the paper's claims to the scripts that produce them.** Stage `paper-code-map`; optional exercise line for people with code on the laptop.
26. **A diff is the unit of review, so the code needs a history.** Repository, commit and diff defined once; `/explain-diff` as the block's check; the server-logs caveat.
27. **GitHub or Dropbox: the review skills want a history, the coauthor wants Overleaf.** Table with the reason in the title; link to the Overleaf rooms.

### 5 · Slides (`> /explorable-deck @paper.tex`)
29. **Ask for slides from the paper and you get a stochastic Beamer parrot.** Stage `parrot`, static: two miniature slides, the parrot and an explorable slide. A style file makes the parrot yours; it is still the old thing faster. After the Substack post "Beyond the stochastic Beamer parrot".
30. **AI should let us do new things, not only old things faster.** Two columns: Case, Victor and Strogatz written into a skill; what an explorable deck does. This deck and the morning's were built with it. Links to the two example decks and the skill.
31. **But Claude will always find some story in your paper, and it is on you that it is the right one.** Two panels: the paper must be good (brick); read every sentence, then practise (teal). The block's check: is it the right story, and can you tell it without the slides?

### 6 · A replication package (`> read Code/ and draft the README …`)
33. **A replication package is a README, a master script and portable paths.** The list; three prompts and one check; the register-data version of the check.

### 7 · Teaching, continued (`> from @notes/week3.md …`)
35. **This morning: take-home grades stopped predicting in-person grades.** Stage `serrano`, static; medians read from `L.DATA`; the three changes; links to the rules and build rooms.
36. **Exercise 3: students study when tested, so build a weekly quiz bank from your notes.** Card with the path aligned to the prompt, the fallback notes, the bet on wrong answer keys; timer.

### Ending
37. **The goal is to provide the right context, and the tools differ in how easily you can.** The key message in large type.
38. **Six times today: files in the folder, one command, one check.** Six rows, brick left, teal right.
39. **Your turn.** Dark closing slide: an empty prompt; the room's homework on the slide.

## Appendix rooms (uncounted, each with a one-line note)
Setup ← 02. Installing the skills (incl. `/voice-extractor`) ← 02, 06. Extensions ← setup. Every session ← setup. Permissions ← session. A session is a conversation ← session. Signs of drift ← conversation. Files that hold durable context ← 20. `/init` ← 11, 21. CLAUDE.md starter template ← 11. Skill library ← 06. File formats ← 03, 15. Overleaf, and the two routes click by click ← 27. Other referee-report tools ← 10. Bryan's eight rules ← 34. Three things to build ← 34. References.

## What the first version got wrong, for the record
Exercise 1 was launched before the check-in and before anyone had been told how to install the skill it needs; the confidentiality slide forbade what exercise 1 had just done, without reconciling the two; the adversary exercise was placed before most reports could be in and had no debrief question; `/voice-extractor` was missing from the library and the install room; the `@file` mechanic was used on four dividers and never defined; the teaching block re-taught three of the morning's slides; the CLAUDE.md-versus-skill slide interrupted the THEREFORE→BUT link; a fifth colour (Quarto's highlight blue on inline code) and the morning's brick progress bar had crept in; and the theme's CSS `fill` on chart labels silently overrode every coloured label in the stages, so the prompt bar on the secure-data stage was drawn ink on ink. All of these are fixed above.
