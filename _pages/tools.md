---
layout: page
title: Tools
permalink: /tools/
description: Small engineering calculators from my day-to-day distribution design work.
nav: true
nav_order: 5
---

<section class="calc" id="xfmr-calc" data-reveal>
  <div class="calc-head">
    <h2>Transformer sizing &amp; available fault current</h2>
    <p>
      Size a distribution transformer for a load, pick the next standard rating, and estimate the secondary full-load current and the
      maximum available fault current at its terminals.
    </p>
  </div>

  <form class="calc-form" autocomplete="off" onsubmit="return false">
    <fieldset>
      <legend>System</legend>
      <div class="seg" role="radiogroup" aria-label="Phase">
        <label><input type="radio" name="phase" value="1" checked /> <span>Single-phase</span></label>
        <label><input type="radio" name="phase" value="3" /> <span>Three-phase</span></label>
      </div>
      <label class="field">
        <span>Secondary voltage</span>
        <select name="voltage"></select>
      </label>
    </fieldset>

    <fieldset>
      <legend>Load</legend>
      <label class="field">
        <span>Connected load</span>
        <span class="input-unit"><input type="number" name="kw" value="60" min="0" step="any" inputmode="decimal" /><em>kW</em></span>
      </label>
      <label class="field">
        <span>Power factor</span>
        <span class="input-unit"><input type="number" name="pf" value="0.9" min="0.1" max="1" step="0.01" inputmode="decimal" /><em>pf</em></span>
      </label>
      <label class="field">
        <span>Spare capacity / growth</span>
        <span class="input-unit"><input type="number" name="margin" value="25" min="0" max="200" step="1" inputmode="decimal" /><em>%</em></span>
      </label>
    </fieldset>

    <fieldset>
      <legend>Transformer</legend>
      <label class="field">
        <span>Impedance (nameplate %Z)</span>
        <span class="input-unit"><input type="number" name="z" value="2.0" min="0.5" max="15" step="0.05" inputmode="decimal" /><em>%Z</em></span>
      </label>
      <p class="field-hint" id="z-hint"></p>
    </fieldset>

  </form>

  <div class="calc-results" aria-live="polite">
    <div class="result-hero">
      <span class="result-label">Recommended standard size</span>
      <span class="result-big" id="r-size">–</span>
      <span class="result-sub" id="r-loading"></span>
    </div>
    <dl class="result-grid">
      <div><dt>Load (apparent power)</dt><dd id="r-kva">–</dd></div>
      <div><dt>Required with spare capacity</dt><dd id="r-req">–</dd></div>
      <div><dt>Load current</dt><dd id="r-iload">–</dd></div>
      <div><dt>Transformer full-load current</dt><dd id="r-fla">–</dd></div>
      <div class="result-wide"><dt>Max available fault current at secondary</dt><dd id="r-isc">–</dd></div>
    </dl>
    <p class="calc-warn" id="r-warn" hidden></p>
  </div>

  <details class="calc-formulas">
    <summary>Formulas and assumptions</summary>
    <ul>
      <li>Load kVA = kW ÷ power factor. Required kVA = load kVA × (1 + spare capacity).</li>
      <li>Standard ratings follow common ANSI/IEEE distribution sizes: single-phase 10 to 500 kVA, three-phase 45 to 2,500 kVA.</li>
      <li>Full-load current: I = kVA × 1000 ÷ V (single-phase, line-to-line V) or I = kVA × 1000 ÷ (√3 × V) (three-phase).</li>
      <li>Available fault current (bolted, at the secondary terminals) = full-load current ÷ (%Z ÷ 100), assuming an infinite utility source. Real values are lower once source and conductor impedance are included, so treat this as an upper bound.</li>
    </ul>
    <p class="calc-disclaimer">For learning and quick checks only, not a substitute for a stamped design or your utility's standards.</p>
  </details>
</section>

<script defer src="{{ '/assets/js/transformer-calc.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/site.js' | relative_url | bust_file_cache }}"></script>
