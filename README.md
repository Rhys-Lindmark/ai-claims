# AI Claims

An open-source, page-aware truth layer from Rhys Lindmark's Website Accelerator, published at <https://ai.rhyslindmark.com/claims>.

The north star is a Chrome extension that recognizes YouTube videos, Goodreads books, and ordinary web pages; resolves each page to a shared reviewed analysis; and shows a 0–100 truth score with its denominator, coverage, methodology version, and sources. A score stays hidden until every eligible claim is reviewed and the publication and provenance gates pass.

The current site contains synthetic fixtures that test the review machinery without presenting unreviewed examples as real facts. The first installable extension prototype lives in [`extension/`](./extension/README.md).

## Validate

```bash
npm run test:extension
npm run build
```

## License

MIT. See [`LICENSE`](./LICENSE).
