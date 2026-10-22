/* Nintendo eShop explorer + sequel-likelihood model.
 * Data: assets/data/nintendo-eshop/games.json (22k games scraped from DekuDeals, cleaned)
 * Model: assets/data/nintendo-eshop/model.json (random forest exported from scikit-learn)
 * Everything runs in the browser; nothing is sent anywhere. */
(function () {
  "use strict";

  var root = document.getElementById("eshop-app");
  if (!root) return;
  var base = root.getAttribute("data-base") || "";
  var INK = "#0f172a",
    TEAL = "#0d9488",
    AMBER = "#f59e0b",
    SLATE = "#64748b";

  function $(sel) {
    return root.querySelector(sel);
  }
  function cssVar(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  }
  function money(v) {
    return "$" + v.toFixed(2);
  }
  function pct(v) {
    return (100 * v).toFixed(1) + "%";
  }
  function median(arr) {
    if (!arr.length) return 0;
    var s = arr.slice().sort(function (a, b) {
      return a - b;
    });
    var m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var G = null,
    M = null,
    charts = {};

  Promise.all([
    fetch(base + "/assets/data/nintendo-eshop/games.json").then(function (r) {
      return r.json();
    }),
    fetch(base + "/assets/data/nintendo-eshop/model.json").then(function (r) {
      return r.json();
    }),
  ])
    .then(function (res) {
      G = res[0];
      M = res[1];
      setupFilters();
      setupPredictor();
      render();
      // Chart.js loads in parallel; draw the charts once it's ready if it wasn't yet.
      if (typeof Chart === "undefined") window.addEventListener("load", render);
      root.classList.add("is-ready");
    })
    .catch(function () {
      $(".eshop-loading").textContent = "Couldn't load the data. Please refresh the page.";
    });

  // ------------------------------------------------------------------ filters
  var state = { genre: -1, platform: -1, from: 0, to: 9999, maxPrice: Infinity, multi: "all", q: "" };

  function setupFilters() {
    var gSel = $("#f-genre"),
      pSel = $("#f-platform"),
      from = $("#f-from"),
      to = $("#f-to");
    G.genres.forEach(function (g, i) {
      gSel.add(new Option(g, i));
    });
    G.platforms.forEach(function (p, i) {
      pSel.add(new Option(p, i));
    });
    var years = Array.from(new Set(G.year)).sort();
    years.forEach(function (y) {
      from.add(new Option(y, y));
      to.add(new Option(y, y));
    });
    from.value = years[0];
    to.value = years[years.length - 1];
    state.from = +from.value;
    state.to = +to.value;

    gSel.addEventListener("change", function () {
      state.genre = +gSel.value;
      render();
    });
    pSel.addEventListener("change", function () {
      state.platform = +pSel.value;
      render();
    });
    from.addEventListener("change", function () {
      state.from = +from.value;
      render();
    });
    to.addEventListener("change", function () {
      state.to = +to.value;
      render();
    });
    $("#f-price").addEventListener("change", function (e) {
      state.maxPrice = e.target.value === "any" ? Infinity : +e.target.value;
      render();
    });
    root.querySelectorAll("[name=f-multi]").forEach(function (r) {
      r.addEventListener("change", function () {
        state.multi = r.value;
        render();
      });
    });
    var t;
    $("#f-search").addEventListener("input", function (e) {
      clearTimeout(t);
      t = setTimeout(function () {
        state.q = e.target.value.trim().toLowerCase();
        render();
      }, 150);
    });
    $("#f-reset").addEventListener("click", function () {
      gSel.value = -1;
      pSel.value = -1;
      from.value = years[0];
      to.value = years[years.length - 1];
      $("#f-price").value = "any";
      $("#f-search").value = "";
      root.querySelector("[name=f-multi][value=all]").checked = true;
      state = { genre: -1, platform: -1, from: +from.value, to: +to.value, maxPrice: Infinity, multi: "all", q: "" };
      render();
    });
  }

  function selected() {
    var out = [];
    for (var i = 0; i < G.n; i++) {
      if (state.genre >= 0 && G.genre[i] !== state.genre) continue;
      if (state.platform >= 0 && G.platform[i] !== state.platform) continue;
      if (G.year[i] < state.from || G.year[i] > state.to) continue;
      if (G.price[i] > state.maxPrice) continue;
      if (state.multi === "yes" && !G.multi[i]) continue;
      if (state.multi === "no" && G.multi[i]) continue;
      if (state.q && G.title[i].toLowerCase().indexOf(state.q) === -1) continue;
      out.push(i);
    }
    return out;
  }

  // ------------------------------------------------------------------ charts
  var BUCKETS = [
    [0, 1, "Under $1"],
    [1, 5, "$1–5"],
    [5, 10, "$5–10"],
    [10, 20, "$10–20"],
    [20, 30, "$20–30"],
    [30, 40, "$30–40"],
    [40, 60, "$40–60"],
    [60, 1e9, "$60+"],
  ];

  function chartDefaults() {
    Chart.defaults.font.family = cssVar("--font-body", "Inter, sans-serif");
    Chart.defaults.color = cssVar("--global-text-color-light", "#475569");
    Chart.defaults.borderColor = cssVar("--global-divider-color", "#e2e8f0");
  }

  function draw(id, config) {
    if (charts[id]) {
      charts[id].data = config.data;
      charts[id].update("none");
      return;
    }
    config.options = Object.assign(
      {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
      },
      config.options || {}
    );
    charts[id] = new Chart(document.getElementById(id), config);
  }

  function render() {
    var idx = selected();
    var n = idx.length;
    var prices = idx.map(function (i) {
      return G.price[i];
    });
    var seq = 0,
      multi = 0;
    idx.forEach(function (i) {
      seq += G.sequel[i];
      multi += G.multi[i];
    });

    $("#k-games").textContent = n.toLocaleString();
    $("#k-median").textContent = n ? money(median(prices)) : "–";
    $("#k-sequel").textContent = n ? pct(seq / n) : "–";
    $("#k-multi").textContent = n ? pct(multi / n) : "–";
    $("#eshop-count").textContent =
      n === G.n ? "All " + n.toLocaleString() + " games" : n.toLocaleString() + " of " + G.n.toLocaleString() + " games";

    if (typeof Chart === "undefined") return;
    chartDefaults();
    var ink = cssVar("--global-text-color", INK);

    // 1. Price distribution
    var counts = BUCKETS.map(function () {
      return 0;
    });
    prices.forEach(function (p) {
      for (var b = 0; b < BUCKETS.length; b++)
        if (p < BUCKETS[b][1]) {
          counts[b]++;
          break;
        }
    });
    draw("c-price", {
      type: "bar",
      data: {
        labels: BUCKETS.map(function (b) {
          return b[2];
        }),
        datasets: [{ label: "Games", data: counts, backgroundColor: TEAL, borderRadius: 4 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } },
    });

    // 2. Median price by genre (top 12 genres in the selection)
    var byGenre = {};
    idx.forEach(function (i) {
      (byGenre[G.genre[i]] = byGenre[G.genre[i]] || []).push(G.price[i]);
    });
    var top = Object.keys(byGenre)
      .sort(function (a, b) {
        return byGenre[b].length - byGenre[a].length;
      })
      .slice(0, 12);
    draw("c-genre", {
      type: "bar",
      data: {
        labels: top.map(function (g) {
          return G.genres[g];
        }),
        datasets: [
          {
            label: "Median price",
            data: top.map(function (g) {
              return +median(byGenre[g]).toFixed(2);
            }),
            backgroundColor: ink,
            borderRadius: 4,
          },
          {
            label: "Average price",
            data: top.map(function (g) {
              var a = byGenre[g];
              return +(
                a.reduce(function (s, v) {
                  return s + v;
                }, 0) / a.length
              ).toFixed(2);
            }),
            backgroundColor: AMBER,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: "y",
        scales: { x: { beginAtZero: true, ticks: { callback: (v) => "$" + v } }, y: { grid: { display: false } } },
        plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label + ": " + money(c.parsed.x) } } },
      },
    });

    // 3. Releases per year, sequels vs originals
    var years = [];
    for (var y = state.from; y <= state.to; y++) years.push(y);
    var orig = years.map(function () {
        return 0;
      }),
      seqs = years.map(function () {
        return 0;
      });
    idx.forEach(function (i) {
      var k = G.year[i] - state.from;
      if (G.sequel[i]) seqs[k]++;
      else orig[k]++;
    });
    draw("c-year", {
      type: "bar",
      data: {
        labels: years,
        datasets: [
          { label: "Originals", data: orig, backgroundColor: SLATE, borderRadius: 2 },
          { label: "Sequels and follow-ups", data: seqs, backgroundColor: AMBER, borderRadius: 2 },
        ],
      },
      options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } } },
    });

    // 4. Sequel vs original, multiplayer vs single: average and median price
    function stats(filterFn) {
      var a = idx.filter(filterFn).map(function (i) {
        return G.price[i];
      });
      return a.length
        ? [
            +median(a).toFixed(2),
            +(
              a.reduce(function (s, v) {
                return s + v;
              }, 0) / a.length
            ).toFixed(2),
          ]
        : [0, 0];
    }
    var so = stats(function (i) {
        return !G.sequel[i];
      }),
      ss = stats(function (i) {
        return G.sequel[i];
      }),
      sp = stats(function (i) {
        return !G.multi[i];
      }),
      mp = stats(function (i) {
        return G.multi[i];
      });
    draw("c-compare", {
      type: "bar",
      data: {
        labels: ["Originals", "Sequels", "Single-player", "Multiplayer"],
        datasets: [
          { label: "Median price", data: [so[0], ss[0], sp[0], mp[0]], backgroundColor: ink, borderRadius: 4 },
          { label: "Average price", data: [so[1], ss[1], sp[1], mp[1]], backgroundColor: AMBER, borderRadius: 4 },
        ],
      },
      options: {
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: (v) => "$" + v } } },
        plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label + ": " + money(c.parsed.y) } } },
      },
    });

    // 5. Table: most expensive games in the selection
    var rows = idx
      .slice()
      .sort(function (a, b) {
        return G.price[b] - G.price[a];
      })
      .slice(0, 8);
    $("#eshop-table tbody").innerHTML = rows.length
      ? rows
          .map(function (i) {
            return (
              "<tr><td>" +
              esc(G.title[i]) +
              "</td><td>" +
              esc(G.genres[G.genre[i]]) +
              "</td><td>" +
              G.year[i] +
              '</td><td class="num">' +
              money(G.price[i]) +
              "</td></tr>"
            );
          })
          .join("")
      : '<tr><td colspan="4">No games match these filters.</td></tr>';
  }

  // ------------------------------------------------------------------ predictor
  function predict(row) {
    var s = 0;
    for (var t = 0; t < M.trees.length; t++) {
      var tr = M.trees[t],
        n = 0;
      while (tr.l[n] !== -1) n = row[tr.f[n]] <= tr.t[n] ? tr.l[n] : tr.r[n];
      s += tr.p[n];
    }
    return s / M.trees.length;
  }

  function setupPredictor() {
    var form = $("#predict-form");
    var m = M.metrics;
    $("#m-auc").textContent = m.auc.toFixed(2);
    $("#m-recall").textContent = Math.round(m.recall * 100) + "%";
    $("#m-precision").textContent = Math.round(m.precision * 100) + "%";
    $("#m-base").textContent = Math.round(m.sequel_rate * 100) + "%";

    // Publisher and language choices, most common first
    var pub = $("#p-publisher"),
      lang = $("#p-language");
    M.publishers.forEach(function (v) {
      pub.add(new Option(v === "Other" ? "Other / independent" : v, v));
    });
    M.languages.forEach(function (v) {
      lang.add(new Option(v, v));
    });
    pub.value = "Other";
    lang.value = M.languages[0];

    // Genre tag toggles (up to 4, like the listings)
    var tags = $("#p-genres"),
      MAX_TAGS = 4;
    M.genre_tags.forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "filter-chip";
      b.textContent = g;
      b.setAttribute("data-tag", g);
      b.setAttribute("aria-pressed", g === "Action" || g === "Adventure" ? "true" : "false");
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        if (!on && picked().length >= MAX_TAGS) return;
        b.setAttribute("aria-pressed", on ? "false" : "true");
        run();
      });
      tags.appendChild(b);
    });
    function picked() {
      return Array.prototype.map.call(tags.querySelectorAll('[aria-pressed="true"]'), function (b) {
        return b.getAttribute("data-tag");
      });
    }

    var LABELS = {
      languages: "Languages listed",
      publisher_grouped: "Publisher",
      msrp: "Price",
      "genre tags": "Genre tags",
      developer_grouped: "Developer",
      genre_count: "Number of genres",
      platform_count: "Platforms listed",
      release_year: "Release year",
      game_age: "Game age",
      max_players: "Max players",
      is_multiplayer: "Multiplayer",
      mode_handheld: "Handheld mode",
      mode_tabletop: "Tabletop mode",
      min_players: "Min players",
    };
    var imp = $("#importance");
    Object.keys(M.importance)
      .filter(function (k) {
        return M.importance[k] >= 0.01;
      })
      .forEach(function (k) {
        var w = Math.round(M.importance[k] * 100);
        imp.insertAdjacentHTML(
          "beforeend",
          '<li><span class="imp-label">' +
            esc(LABELS[k] || k) +
            '</span><span class="imp-bar"><i style="width:' +
            Math.min(100, w * 3) +
            '%"></i></span><span class="imp-val">' +
            w +
            "%</span></li>"
        );
      });

    function run() {
      var f = new FormData(form);
      var year = +f.get("year");
      var age = M.age_by_year[String(year)];
      if (age === undefined) age = Math.max(0, 2024 - year);
      var maxP = Math.max(+f.get("max_players"), 1);
      var genres = picked();
      var row = {
        msrp: +f.get("price"),
        platform_count: +f.get("platforms"),
        min_players: 1,
        max_players: maxP,
        is_multiplayer: maxP > 1 ? 1 : 0,
        release_year: year,
        game_age: age,
        genre_count: genres.length,
        "genre_count.1": genres.length,
        mode_handheld: f.get("handheld") ? 1 : 0,
        mode_docked: 0,
        mode_tabletop: f.get("tabletop") ? 1 : 0,
      };
      genres.forEach(function (g) {
        row["genre_" + g] = 1;
      });
      row["developer_grouped_Other"] = 1;
      row["publisher_grouped_" + pub.value] = 1;
      row["languages_" + lang.value] = 1;
      var vec = M.features.map(function (k) {
        return row[k] || 0;
      });
      var p = predict(vec);
      var out = $("#predict-out");
      out.querySelector(".p-value").textContent = Math.round(p * 100) + "%";
      out.querySelector(".p-fill").style.width = Math.round(p * 100) + "%";
      out.querySelector(".p-verdict").textContent =
        p >= 0.65 ? "Looks a lot like a sequel" : p >= 0.4 ? "Could go either way" : "Looks like an original";
      $("#p-genre-count").textContent = genres.length + " of " + MAX_TAGS + " picked";
    }
    form.addEventListener("input", run);
    form.addEventListener("change", run);
    run();
  }

  // Re-color charts when the theme changes
  new MutationObserver(function () {
    if (!G || typeof Chart === "undefined") return;
    Object.keys(charts).forEach(function (k) {
      charts[k].destroy();
      delete charts[k];
    });
    render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
