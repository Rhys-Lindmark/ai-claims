# Truth score method 0.1.0

## The number

The displayed 0–100 score is the mean truth credit across **eligible canonical claims**, rounded to the nearest whole number:

| Reviewed summary verdict | Credit |
| --- | ---: |
| Accurate | 1.00 |
| Mostly accurate | 0.75 |
| Mixed | 0.50 |
| Mostly inaccurate | 0.25 |
| Inaccurate | 0.00 |

Each eligible canonical claim gets exactly one unit of weight. Repetition, speaker, confidence, virality, and consequence do not change that weight. An analysis may show separate consequence or speaker views, but they cannot silently alter the headline score.

## Denominator

Eligibility is an editorial decision made before aggregation. Factual, causal, and quantitative assertions can be eligible. Opinions, rhetorical questions, personal anecdotes, unresolved predictions, and duplicate occurrences can be excluded only with an explicit reviewed reason. Paraphrases grouped under one canonical claim count once.

The score must be accompanied by:

- eligible and reviewed claim counts;
- the five-verdict distribution;
- methodology ID and version;
- last-reviewed date;
- a link to claim-level findings and evidence.

## Publication gate

No number is shown unless:

1. every candidate claim has an eligibility decision;
2. every eligible canonical claim is editor-reviewed;
3. every eligible claim has one resolved verdict in the table above;
4. every eligible claim passes publication gates;
5. every eligible claim has complete evidence provenance; and
6. at least one eligible claim exists.

Failure produces **Score pending** with claim-specific blockers—not a provisional number.

## What 84 means

It means the reviewed eligible claims earned 84% of the maximum truth credit under this exact method. It does not mean that every sentence is 84% true, that omitted claims are correct, that an argument is 84% persuasive, or that another methodology would produce the same result.

## Versioning

Changing eligibility rules, credit values, rounding, or weighting is a breaking methodology change. Published analyses keep their original method version and must be recomputed before comparison under a newer version.
