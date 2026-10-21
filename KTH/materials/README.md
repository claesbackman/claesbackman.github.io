# KTH workshop materials

Files for session 2's exercises. There is one example thesis: the one the agent writes in session 1's live demo, kept in `../Thesis_example`. An agent wrote it, so it is not student work and may go into an AI tool under KTH's rule.

| file | for | what it is |
|---|---|---|
| `../Thesis_example/Writing/paper.pdf` | participants | The morning's thesis, about 4,600 words, for exercises 1, 1b, 1c and 2. Upload it to the resources page as `paper.pdf`. |
| `rubric.md` | participants | A generic six-criterion rubric with four levels. Participants may use their own instead. |
| `thesis_example_code.zip` | participants | The morning's thesis without its data or text, for the replication exercise. That exercise is commented out in session 2, so this is only needed if it comes back. |

Still needed on the resources page, because the slides mention them: one week of example lecture notes (exercise 4), a Windows route for installing the skill library, and a fallback feedback report on `paper.pdf` for exercise 1, for when the network fails.

## The thesis code folder (replication exercise, currently cut)

Session 1's live demo produced `../Thesis_example`. The replication exercise gives participants its code without the data, so they can write the README the agent did not. Package it once the example is final, from `Universities/KTH`:

```sh
zip -r thesis_example_code.zip Thesis_example -x 'Thesis_example/Data/*' 'Thesis_example/Writing/*' '*.DS_Store'
```

The zip holds `Code/` (scripts, `run_all.sh`, logs), `Figures/`, `Tables/` and `AI_tools/research_plan.md`. Check before uploading that it has no `README.md`, since writing one is the exercise. The data are public and are downloaded by the scripts, so they are not redistributed.
