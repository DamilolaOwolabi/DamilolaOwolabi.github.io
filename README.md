# DamilolaOwolabi.github.io

Personal site of **Oluwadamilola (Dammy) Owolabi**: electrical engineer and data scientist in Houston, TX, focused on energy and grid analytics.

Live at **https://damilolaowolabi.github.io**

**Editing the site:** see [HOW-TO-EDIT.md](HOW-TO-EDIT.md). The easiest way is the Pages CMS web editor (`.pages.yml`).

## What's here

- `_pages/about.md`: home page text, hero, quick facts, skills, and contact block
- `_projects/`: one Markdown file per project (`tools:` sets the chips on each card, `featured:` in `_pages/projects.md` picks the top three)
- `assets/json/resume.json`: CV data (JSON Resume format) shown on `/cv/`
- `_bibliography/papers.bib`: publications
- `_sass/_custom.scss`: the site's design system (colors, fonts, spacing)
- `assets/js/site.js`: hero grid animation, scroll reveals, and the projects filter
- `_data/ercot.json`: Texas grid snapshot, refreshed daily by `bin/fetch_ercot_snapshot.py` via `.github/workflows/ercot-snapshot.yml`

## Run locally

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000
```

Built with [Jekyll](https://jekyllrb.com/) and [al-folio](https://github.com/alshedivat/al-folio) v1. Pushing to `master` deploys to GitHub Pages.
