---
layout: page
title: Nintendo eShop Pricing and Sequel Analytics
description: "Scraped and cleaned 22,123 Nintendo eShop listings to study pricing and predict sequels. Try the live explorer and sequel model."
img: assets/img/projects/covers/nintendo-eshop.jpg
importance: 0
category: school
tools: [Python, Web scraping, scikit-learn, Machine learning, Data viz]
---

<dl class="case-glance">
  <div><dt>Context</dt><dd>SMU MS in Data Science, DS 7374</dd></div>
  <div><dt>Team</dt><dd>Two-person project</dd></div>
  <div><dt>Data</dt><dd>22,123 Nintendo eShop games scraped from DekuDeals</dd></div>
  <div><dt>Stack</dt><dd>Python, scikit-learn (random forest), Plotly, Streamlit</dd></div>
  <div><dt>Result</dt><dd>Sequel model AUC 0.76 on held-out games</dd></div>
</dl>

<div class="case-links">
<a class="hero-btn hero-btn-secondary" href="#explorer"><i class="fa-solid fa-sliders" aria-hidden="true"></i><span>Jump to the live explorer</span></a>
<a class="hero-btn hero-btn-secondary" href="#sequel-model"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>Try the sequel model</span></a>
</div>

## The problem

The Nintendo eShop lists tens of thousands of games, from 99-cent arcade ports to $70 first-party releases. We wanted to answer two practical questions a publisher would ask: **what do games in each segment actually sell for**, and **which listings look like franchise follow-ups** (sequels, deluxe editions and remasters) rather than original titles?

## Our approach

- **Data.** We scraped game listings from DekuDeals and cleaned them into one table of **22,123 games**: price (MSRP), platform, release year, genres, player counts, play modes, developer and publisher.
- **Features.** We grouped genre labels and publishers into usable categories, split player counts into minimum and maximum, flagged multiplayer games, and counted the platforms and genre tags on each listing.
- **Exploration.** We built an interactive dashboard (Plotly and Streamlit) with filters for genre, platform, year, price and multiplayer, plus pricing breakdowns by segment.
- **Model.** We trained a random forest with balanced class weights to predict whether a listing is a sequel from its price, platforms, player counts, play modes, genre tags and release year.

## Results

- **The eShop is cheap.** The median game costs **$9.99** and the average is **$14.26**. 525 games cost under $1, and only 614 cost $59.99 or more.
- **Follow-ups charge more.** Sequels make up **16.4%** of listings. Their median price is $11.99 against $9.99 for originals, and their average is **$19.80 against $13.17**.
- **Multiplayer earns a smaller premium.** 31.6% of games are multiplayer. The median price is the same $9.99, but the average is $16.19 against $13.36.
- **Genre sets the price band.** Action is the biggest genre (4,779 games). Sports ($20.38), Music ($18.97) and Role-Playing ($18.47) have the highest average prices, while Puzzle and Arcade have the lowest medians ($7.99 and $6.99).
- **Releases keep climbing.** New listings grew from 808 in 2017 to 3,996 in 2024.
- **Some publishers live on franchises.** Sequels and follow-ups are 56% of KOEI TECMO America's catalog, 49% of NIS America's and 48% of BANDAI NAMCO's.
- **The sequel model is useful but not magic.** On 4,425 held-out games it reaches an **AUC of 0.76** and catches **64% of real sequels**, but only about a third of the games it flags are actually sequels. Price is by far its strongest signal (41% of feature importance), followed by the number of platforms and release year. Because only 16% of games are sequels, a model that always says "original" would score 84% accuracy, so AUC and recall are the honest measures here.

## Live explorer {#explorer}

Filter all 22,123 games and the charts and numbers update instantly. Everything runs in your browser.

<div id="eshop-app" class="eshop" data-base="{{ site.baseurl }}">
  <p class="eshop-loading">Loading 22,123 games…</p>

  <form class="eshop-filters" autocomplete="off" onsubmit="return false">
    <label class="field"><span>Genre</span><select id="f-genre"><option value="-1">All genres</option></select></label>
    <label class="field"><span>Platform</span><select id="f-platform"><option value="-1">All platforms</option></select></label>
    <label class="field"><span>From</span><select id="f-from"></select></label>
    <label class="field"><span>To</span><select id="f-to"></select></label>
    <label class="field"><span>Max price</span>
      <select id="f-price">
        <option value="any">Any price</option>
        <option value="4.99">$4.99</option>
        <option value="9.99">$9.99</option>
        <option value="19.99">$19.99</option>
        <option value="39.99">$39.99</option>
        <option value="59.99">$59.99</option>
      </select>
    </label>
    <div class="field">
      <span>Players</span>
      <div class="seg" role="radiogroup" aria-label="Players">
        <label><input type="radio" name="f-multi" value="all" checked /> <span>All</span></label>
        <label><input type="radio" name="f-multi" value="no" /> <span>Single</span></label>
        <label><input type="radio" name="f-multi" value="yes" /> <span>Multi</span></label>
      </div>
    </div>
    <label class="field eshop-search"><span>Search titles</span><input type="search" id="f-search" placeholder="e.g. Mario, Zelda, deluxe" /></label>
    <button type="button" class="filter-chip" id="f-reset">Reset filters</button>
  </form>

  <p class="eshop-count" id="eshop-count" aria-live="polite"></p>

  <div class="dash-kpis">
    <div class="dash-kpi"><span class="stat-value" id="k-games">–</span><span class="stat-label">Games</span></div>
    <div class="dash-kpi"><span class="stat-value" id="k-median">–</span><span class="stat-label">Median price</span></div>
    <div class="dash-kpi"><span class="stat-value" id="k-sequel">–</span><span class="stat-label">Sequels and follow-ups</span></div>
    <div class="dash-kpi"><span class="stat-value" id="k-multi">–</span><span class="stat-label">Multiplayer</span></div>
  </div>

  <div class="eshop-grid">
    <section class="dash-panel">
      <h3>Price distribution</h3>
      <div class="dash-chart"><canvas id="c-price" role="img" aria-label="Bar chart of games by price range"></canvas></div>
    </section>
    <section class="dash-panel">
      <h3>Who charges more?</h3>
      <div class="dash-chart"><canvas id="c-compare" role="img" aria-label="Median and average price for originals, sequels, single-player and multiplayer games"></canvas></div>
    </section>
  </div>

  <section class="dash-panel">
    <h3>Price by genre</h3>
    <p class="dash-note">The 12 biggest genres in your selection. Averages sit above medians because a few premium titles pull them up.</p>
    <div class="dash-chart eshop-tall"><canvas id="c-genre" role="img" aria-label="Median and average price by genre"></canvas></div>
  </section>

  <section class="dash-panel">
    <h3>New releases per year</h3>
    <div class="dash-chart"><canvas id="c-year" role="img" aria-label="Stacked bar chart of originals and sequels released per year"></canvas></div>
  </section>

  <section class="dash-panel">
    <h3>Most expensive in your selection</h3>
    <div class="eshop-table-wrap">
      <table class="eshop-table" id="eshop-table">
        <thead><tr><th>Title</th><th>Genre</th><th>Year</th><th class="num">Price</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  </section>

  <section class="calc eshop-predict" id="sequel-model">
    <div class="calc-head">
      <h3>Sequel model: does this listing look like a follow-up?</h3>
      <p>Describe a game and the random forest estimates how likely it is to be a sequel, deluxe edition or remaster, based on 17,698 training games.</p>
    </div>
    <form id="predict-form" class="calc-form" autocomplete="off" onsubmit="return false">
      <fieldset>
        <legend>Listing</legend>
        <label class="field"><span>Price (MSRP)</span><span class="input-unit"><input type="number" name="price" value="19.99" min="0" max="200" step="0.01" inputmode="decimal" /><em>$</em></span></label>
        <label class="field"><span>Release year</span><span class="input-unit"><input type="number" name="year" value="2024" min="2014" max="2025" step="1" inputmode="numeric" /><em>yr</em></span></label>
        <label class="field"><span>Platforms listed</span><span class="input-unit"><input type="number" name="platforms" value="2" min="1" max="7" step="1" inputmode="numeric" /><em>#</em></span></label>
      </fieldset>
      <fieldset>
        <legend>Gameplay</legend>
        <label class="field"><span>Max players</span><span class="input-unit"><input type="number" name="max_players" value="1" min="1" max="16" step="1" inputmode="numeric" /><em>#</em></span></label>
        <label class="field"><span>Genre tags</span><span class="input-unit"><input type="number" name="genres" value="3" min="1" max="4" step="1" inputmode="numeric" /><em>#</em></span></label>
        <label class="check"><input type="checkbox" name="handheld" checked /> <span>Handheld mode</span></label>
        <label class="check"><input type="checkbox" name="tabletop" checked /> <span>Tabletop mode</span></label>
      </fieldset>
    </form>
    <div class="calc-results" id="predict-out" aria-live="polite">
      <div class="result-hero">
        <span class="result-big p-value">–</span>
        <span class="result-sub">chance it's a sequel or follow-up</span>
      </div>
      <div class="p-meter"><span class="p-fill"></span><span class="p-base" title="Share of sequels in the data"></span></div>
      <p class="p-verdict"></p>
      <dl class="p-metrics">
        <div><dt>AUC</dt><dd id="m-auc">–</dd></div>
        <div><dt>Sequels caught</dt><dd id="m-recall">–</dd></div>
        <div><dt>Flags that are right</dt><dd id="m-precision">–</dd></div>
        <div><dt>Sequels in data</dt><dd id="m-base">–</dd></div>
      </dl>
      <h4>What the model leans on</h4>
      <ul class="importance" id="importance"></ul>
      <p class="calc-disclaimer">Scores on 4,425 held-out games. The model only sees listing details, not the title, so treat it as a pattern finder, not a verdict.</p>
    </div>
  </section>
</div>

## What we'd do next

- Use the title text itself (numbers, "Deluxe", "DX", "Remastered") as features, which would likely improve precision.
- Track prices over time from DekuDeals to study discount depth and timing, not just list price.
- Separate true sequels from deluxe editions and remasters, which the current label groups together.

## Tools

Python · web scraping · scikit-learn · Plotly · Streamlit

<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" integrity="sha256-0q+JdOlScWOHcunpUk21uab1jW7C1deBQARHtKMcaB4=" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/nintendo-explorer.js' | relative_url | bust_file_cache }}"></script>
