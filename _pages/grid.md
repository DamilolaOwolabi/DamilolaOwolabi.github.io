---
layout: page
title: grid
permalink: /grid/
description: Texas (ERCOT) fuel mix and peak generation, day by day. Updated automatically every morning.
nav: true
nav_order: 3
---

{% assign hist = site.data.ercot_history %}
{% assign first = hist | first %}
{% assign last = hist | last %}

<div class="grid-dash" data-reveal>
  <div class="dash-toolbar">
    <p class="dash-range-label">
      {% if first %}{{ first.date | date: "%b %-d, %Y" }} to {{ last.date | date: "%b %-d, %Y" }} · {{ hist.size }} days{% endif %}
    </p>
    <div class="dash-ranges" role="group" aria-label="Date range">
      <button type="button" class="filter-chip" data-range="30" aria-pressed="false">30 days</button>
      <button type="button" class="filter-chip" data-range="90" aria-pressed="false">90 days</button>
      <button type="button" class="filter-chip" data-range="all" aria-pressed="true">All</button>
    </div>
  </div>

  <p class="dash-gap-note" id="dash-gap-note" hidden></p>

  <div class="dash-kpis">
    <div class="dash-kpi"><span class="stat-value" id="kpi-renew">–</span><span class="stat-label">Wind + solar share</span></div>
    <div class="dash-kpi"><span class="stat-value" id="kpi-gas">–</span><span class="stat-label">Natural gas share</span></div>
    <div class="dash-kpi"><span class="stat-value" id="kpi-wind">–</span><span class="stat-label" id="kpi-wind-label">Windiest day</span></div>
    <div class="dash-kpi"><span class="stat-value" id="kpi-peak">–</span><span class="stat-label" id="kpi-peak-label">Highest peak</span></div>
  </div>

  <section class="dash-panel">
    <h2>Fuel mix, 7-day average</h2>
    <p class="dash-note">Share of each day's generation, smoothed over the previous 7 days.</p>
    <div class="dash-chart"><canvas id="chart-share" aria-label="Line chart of fuel shares over time" role="img"></canvas></div>
  </section>

  <section class="dash-panel">
    <h2>Monthly fuel mix</h2>
    <p class="dash-note">Energy-weighted share of each fuel by month.</p>
    <div class="dash-chart"><canvas id="chart-month" aria-label="Stacked bar chart of monthly fuel mix" role="img"></canvas></div>
  </section>

  <section class="dash-panel">
    <h2>Daily peak generation</h2>
    <p class="dash-note">Highest generation each day, in gigawatts, with a 7-day average.</p>
    <div class="dash-chart"><canvas id="chart-peak" aria-label="Line chart of daily peak generation" role="img"></canvas></div>
  </section>

  <section class="dash-panel dash-insights">
    <h2>What stands out</h2>
    <ul id="dash-insights"><li>Loading…</li></ul>
  </section>

  <section class="dash-method">
    <h2>How this works</h2>
    <p>
      Days through the end of ERCOT's latest monthly release come from ERCOT's
      <a href="https://www.ercot.com/gridinfo/generation" target="_blank" rel="noopener">Fuel Mix Report</a> (15-minute settlement data). More
      recent days come from ERCOT's public <a href="https://www.ercot.com/gridmktinfo/dashboards/fuelmix" target="_blank" rel="noopener">fuel
      mix dashboard</a> (5-minute data). When the report catches up, it replaces the dashboard numbers for those days.
    </p>
    <p>
      Shares exclude energy storage, which both charges and discharges, so the mix reflects generating sources. "Other" covers biomass and
      remaining sources; the dashboard reports less detail for it than the settlement report. Peaks are the highest 15-minute (report) or
      5-minute (dashboard) total.
    </p>
    <p>
      A Python job I wrote (<a href="https://github.com/DamilolaOwolabi/DamilolaOwolabi.github.io/blob/master/bin/ercot_history.py" target="_blank" rel="noopener">source</a>)
      runs every morning on GitHub Actions, updates the data, and republishes this page.
    </p>
  </section>
</div>

<script type="application/json" id="grid-data">{{ hist | jsonify }}</script>
<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" integrity="sha256-0q+JdOlScWOHcunpUk21uab1jW7C1deBQARHtKMcaB4=" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/grid-dashboard.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/site.js' | relative_url | bust_file_cache }}"></script>
