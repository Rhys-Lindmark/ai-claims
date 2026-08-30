# Goodreads page and book-source decision

Last verified: 2026-08-30

## Decision

AI Claims may recognize a Goodreads `/book/show/{id}` URL as a stable page key. It will not scrape the page, collect Goodreads book listings or descriptions, copy community reviews, automate a signed-in account, or depend on the retired public developer API.

A Goodreads page can resolve to a book analysis through one of these routes:

1. an existing reviewed registry mapping from Goodreads page ID to an AI Claims book entity;
2. a user-supplied ISBN or edition identifier;
3. permitted publisher, author, library, DOI, or bibliographic metadata; or
4. an editor-created mapping backed by the book's own bibliographic page and recorded provenance.

Goodreads ratings and reviews are not evidence for whether a book's factual claims are true.

## Why

- Goodreads' official developer group states that Goodreads stopped issuing new public API developer keys on December 8, 2020 and planned to retire those tools. [Goodreads Developers group](https://www.goodreads.com/group/show/8095-goodreads-developers)
- Goodreads' current terms grant personal, non-commercial access and exclude collection/use of book listings, descriptions, reviews, derivative use, and data-mining or similar extraction tools. [Goodreads Terms of Use](https://www.goodreads.com/about/terms)

## Product implications

- The extension canonicalizes only the numeric Goodreads page ID; it does not read title, author, cover, rating, reviews, or hidden page data.
- A missing mapping produces **Book identity unresolved**, not guessed metadata.
- An ISBN supplied by a user is stored with its source and edition status; hardcover, paperback, ebook, translation, and revised editions must not be silently collapsed.
- Book claims come from a rights-aware editorial reading process. Citations should point to page/location references and permitted supporting sources, not Goodreads community text.
- Public analysis pages should identify the analyzed edition and keep Goodreads attribution limited to the originating link.

This memo is a conservative product decision based on current published platform rules, not legal advice.
