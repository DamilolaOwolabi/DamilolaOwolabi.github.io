# DamilolaOwolabi.github.io

The website source lives on the **`master`** branch; open it to edit the site (see `HOW-TO-EDIT.md` there).

This `main` branch only holds the scheduled ERCOT data job (`.github/workflows/ercot-snapshot.yml`), because GitHub runs scheduled jobs from the repository's default branch. The job checks out `master`, updates the grid data, and redeploys. If you switch the default branch to `master` in Settings → General, this branch is no longer needed.
