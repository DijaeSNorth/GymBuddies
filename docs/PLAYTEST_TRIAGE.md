# Alpha Playtest Triage

## Opening reports

Run the development server:

```text
cd client
npm run dev
```

Open:

```text
http://localhost:5173/?debug=playtest-reports
```

The Playtest Report Viewer is development-only. Open one exported JSON file at a time. It validates format, size, counts, categories, and required summaries before display.

## Privacy intake

Before copying any note into GitHub:

1. Confirm the file is an alpha report, not a save.
2. Remove accidental names, emails, locations, account identifiers, or unrelated personal content.
3. Do not publish raw reports.
4. Do not attach full saves unless a separate, consented debugging process requires one.
5. Store reports only as long as needed for the alpha decision.

## Triage order

1. S0 privacy, security, or valid-save-loss concerns.
2. S1 crashes, blocked progression, unusable controls, or impossible required encounters.
3. Repeated S2 confusion, unfairness, mobile obstruction, fatigue frustration, or performance issues.
4. Positive moments worth preserving.
5. S3 polish and isolated preferences.

Use the severity definitions in `ALPHA_PLAYTEST_PLAN.md`.

## Evidence standard

For each candidate issue record:

- number of affected sessions;
- affected cohort/device families;
- reproduction confidence;
- build IDs;
- gameplay location and milestone;
- progression impact;
- workaround;
- whether automation already covers the path.

One opinion is an observation. A defect requires reproducible evidence. A balance change requires either an impossible completion path or repeated cross-session evidence, not a single disliked roll.

## Duplicate grouping

The viewer groups entries by category and a normalized note prefix. Review those groups manually; similar words do not prove the same root cause.

Merge issues only when they share:

- the same player-visible failure;
- compatible reproduction steps;
- the same likely subsystem;
- the same severity and progression impact.

Keep mobile-only, accessibility-only, save-recovery, and performance variants separate when their fixes or verification differ.

## Funnel review

Compare completion and confusion at:

1. trainer creation;
2. first workout;
3. first route;
4. first encounter;
5. first capture result;
6. first boss;
7. 20-minute checkpoint;
8. session end.

A drop is actionable when multiple testers stop or require coaching at the same point. Pair funnel counts with notes and timeline context.

## Converting reports into work

Use **Export Markdown issue summary** as a draft, then:

1. redact personal text;
2. verify steps locally;
3. assign severity;
4. link the affected subsystem and automated coverage;
5. state acceptance criteria;
6. identify desktop/mobile/accessibility verification;
7. preserve positive feedback as a non-regression constraint.

Do not begin fixing subjective feedback during collection. Batch verified issues after the scheduled triage round so changes do not invalidate the cohort comparison.
