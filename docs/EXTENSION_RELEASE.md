# Extension release checklist

## Build

- [ ] Bump `manifest.json` version and document method-contract changes.
- [ ] Run `npm run test:extension` and `npm run build`.
- [ ] Run `npm run package:extension -- extension-release.zip` from a clean commit.
- [ ] Inspect the ZIP: no source maps, tests, secrets, remote code, or unrelated files.
- [ ] Load the unpacked directory and packaged ZIP in a fresh Chrome profile.

## Product checks

- [ ] YouTube watch, short, embed, live, and short-link URLs resolve to one video identity.
- [ ] Goodreads edition slugs resolve to one numeric book identity.
- [ ] Generic pages discard fragments and tracking parameters without collapsing meaningful query parameters.
- [ ] Missing, partial, and blocked analyses never display a number.
- [ ] Published scores show denominator, coverage, method version, review date, and evidence link.
- [ ] Duplicate analysis requests reuse one canonical request record.

## Trust and store listing

- [ ] Permission copy matches the actual manifest and [`PRIVACY.md`](./PRIVACY.md).
- [ ] Screenshots and listing text label the product as an accelerator-stage rough draft.
- [ ] All bundled code is local; Content Security Policy and Web Store checks pass.
- [ ] Confirm the public repository commit and tag match the uploaded ZIP checksum.
- [ ] Record reviewer, release date, ZIP SHA-256, and rollback version.
