# Contributing

AI Claims is an accelerator-stage open-source experiment. Small, testable changes are welcome.

1. Open an issue describing the user-visible problem or evidence-method question.
2. Keep page detection, request lifecycle, analysis resolution, and scoring in separate modules.
3. Add deterministic tests for contract changes with `npm run test:extension`.
4. Run `npm run build` for site changes and `npm run package:extension` for extension changes.
5. Never add a real-world score, claim, transcript, speaker attribution, or source judgment without provenance and human-review state.

Method changes must say whether they are breaking and which published analyses require recomputation.
