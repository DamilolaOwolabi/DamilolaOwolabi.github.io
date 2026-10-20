# How to edit your site

Everything on damilolaowolabi.github.io comes from files in this repository. When a change lands on the **`master`** branch, GitHub rebuilds and publishes the site automatically, usually within 3 to 5 minutes. You can watch progress in the repo's **Actions** tab.

There are three ways to edit, from easiest to most hands-on.

---

## Option 1: Pages CMS (recommended, no code)

Pages CMS gives you a web form for every project and for the home page. It saves your changes straight to GitHub. The forms are defined in `.pages.yml`.

### One-time setup

1. Make `master` the default branch (Pages CMS opens the default branch, and right now that's `main`, which only holds a README):
   GitHub → this repo → **Settings → General → Default branch** → click the switch icon → choose **master** → **Update**.
2. Go to **https://app.pagescms.org** and sign in with GitHub.
3. When asked, install the Pages CMS GitHub app and give it access to **DamilolaOwolabi.github.io** only.
4. Open the repository. You'll see **Projects**, **Home page**, and **Media** in the sidebar.

### Add a new project

1. **Projects → Add an entry.**
2. Fill in the form:
   | Field              | What to put                                                                  |
   | ------------------ | ---------------------------------------------------------------------------- |
   | Title              | The project name                                                             |
   | Short summary      | One or two sentences (about 150 characters show on the card)                 |
   | Thumbnail image    | Upload a landscape image (around 1600 × 1000)                                |
   | Category           | work, research, school, personal, or other                                   |
   | Tools and skills   | One per line: Python, SQL, Power BI… (these become the filter chips)         |
   | Feature at the top | Tick to show it in the Featured section (the top 3 by Sort order are shown)  |
   | Sort order         | Lower numbers appear first (0 = first)                                       |
   | External link      | Optional. Fill in only if the card should open another site or a GitHub repo |
   | Project write-up   | The full page. Use the headings below                                        |
3. Click **Save**. The site updates in a few minutes.

Suggested write-up structure (same as your featured case studies):

```
## The problem
What was wrong or unknown, and why it mattered.

## My approach
What you built and how: data, methods, tools.

## Results
What came out of it. Use real numbers when you have them.

## What I'd do next
Two or three next steps.

## Tools
Python · SQL · …
```

To add images inside the write-up, use the image button in the editor. Files go to `assets/img/projects/`.

### Edit the home page

**Home page** lets you change the tagline, buttons, quick facts, career timeline, skill groups, contact box, and About text.

- **New job?** Add it at the top of **Career timeline** and tick **Current role** (untick the old one), then update **Quick facts → Current role**.
- **New resume?** Use **Media → PDFs and documents → Upload**, then in **Home page → Hero → Buttons** change the "Download resume" link to `/assets/pdf/<your-file>.pdf`.

### Remove or hide a project

Open it in **Projects** and use **Delete**. To keep it but move it down, raise its **Sort order** or untick **Featured**.

---

## Option 2: Edit on github.com (no install)

1. Go to the repo, make sure the branch selector says **master**, and open the `_projects` folder.
2. Click **Add file → Create new file** and name it, for example, `My_New_Project.md`.
3. Paste this template and fill it in:

```markdown
---
layout: page
title: My New Project
description: One or two sentences shown on the project card.
img: /assets/img/projects/my-new-project.jpg
category: personal
tools: [Python, SQL]
featured: false
importance: 5
---

## The problem

## My approach

## Results

## What I'd do next
```

4. Upload the thumbnail: open `assets/img/projects`, click **Add file → Upload files**, and make sure the file name matches the `img:` line.
5. Click **Commit changes** (commit directly to `master`). The site rebuilds automatically.

---

## Option 3: On your computer (preview before publishing)

From PowerShell, in your `DamilolaOwolabi.github.io` folder:

```powershell
git checkout master
git pull
bundle exec jekyll serve --livereload --config _config.yml,_config.dev.yml
```

Open http://localhost:4000, edit files in `_projects/` (any text editor, e.g. VS Code), and the page refreshes as you save. When you're happy:

```powershell
git add -A
git commit -m "Add My New Project"
git push
```

---

## The AI assistant (chat bubble)

- **What it knows:** everything on the site (home page, CV, projects, publications), plus the extra facts in **Pages CMS → AI assistant** (`_data/chatbot.yml`). Update either one and the assistant catches up within about 10 minutes of the site redeploying.
- **Setup and settings:** see `chatbot-worker/README.md`. The bubble appears once `chatbot.endpoint` in `_config.yml` points to your Cloudflare Worker.
- **Teaser text, suggested questions, and delay:** the `chatbot:` section of `_config.yml`.
- **Turn it off:** set `enabled: false` under `chatbot:` in `_config.yml`.

## Where things live

| What                              | File                                           |
| --------------------------------- | ---------------------------------------------- |
| Projects                          | `_projects/*.md` (one file per project)        |
| AI assistant facts                | `_data/chatbot.yml`                            |
| Home page text, timeline, skills  | `_pages/about.md`                              |
| CV page                           | `assets/json/resume.json`                      |
| Publications                      | `_bibliography/papers.bib`                     |
| Resume and paper PDFs             | `assets/pdf/`                                  |
| Colors, fonts, spacing            | `_sass/_custom.scss`                           |
| ERCOT data (updates itself daily) | `_data/ercot.json`, `_data/ercot_history.json` |

## If something goes wrong

- **Site didn't update:** check the repo's **Actions** tab. A red ❌ on "Deploy site" means the build failed. Open it, and the last lines of the log usually name the file and line.
- **Project not showing:** check that the file is in `_projects/`, ends in `.md`, and starts and ends its settings block with `---` lines.
- **Image not showing:** the `img:` path must match the uploaded file name exactly, including capital letters and the extension (`.jpg` vs `.jpeg`).
- **Undo a change:** every save is a Git commit. On GitHub, open the file → **History** to see or restore an earlier version.
