/*
 * /grid/ dashboard: charts ERCOT daily fuel mix from _data/ercot_history.json
 * (embedded in the page as #grid-data). Uses Chart.js.
 */
(function () {
  "use strict";

  var FUELS = [
    { key: "gas", label: "Natural gas", color: "#64748b" },
    { key: "wind", label: "Wind", color: "#2563eb" },
    { key: "solar", label: "Solar", color: "#f59e0b" },
    { key: "nuclear", label: "Nuclear", color: "#8b5cf6" },
    { key: "coal", label: "Coal", color: "#78716c" },
  ];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function fmtDate(iso, withYear) {
    var p = iso.split("-");
    return MONTHS[+p[1] - 1] + " " + +p[2] + (withYear ? ", " + p[0] : "");
  }

  function pct(v) {
    return v.toFixed(1) + "%";
  }

  // Energy-weighted share of a fuel over a set of days.
  function weightedShare(days, key) {
    var num = 0,
      den = 0;
    days.forEach(function (d) {
      num += (d.share[key] || 0) * d.total_gwh;
      den += d.total_gwh;
    });
    return den ? num / den : 0;
  }

  function rolling(values, n) {
    return values.map(function (_, i) {
      var start = Math.max(0, i - n + 1),
        slice = values.slice(start, i + 1);
      return (
        slice.reduce(function (a, b) {
          return a + b;
        }, 0) / slice.length
      );
    });
  }

  function init() {
    var el = document.getElementById("grid-data");
    if (!el || typeof Chart === "undefined") return;
    var all = JSON.parse(el.textContent || "[]");
    if (!all.length) return;

    var charts = {};

    function themeDefaults() {
      Chart.defaults.font.family = cssVar("--font-body", "Inter, sans-serif");
      Chart.defaults.color = cssVar("--global-text-color-light", "#475569");
      Chart.defaults.borderColor = cssVar("--global-divider-color", "#e2e8f0");
    }

    // Calendar days from the first to last record, with null where data is missing,
    // so charts show gaps honestly instead of drawing lines across them.
    function calendar(days) {
      var byDate = {};
      days.forEach(function (d) {
        byDate[d.date] = d;
      });
      var out = [],
        t = new Date(days[0].date + "T12:00:00Z"),
        end = new Date(days[days.length - 1].date + "T12:00:00Z");
      while (t <= end) {
        var iso = t.toISOString().slice(0, 10);
        out.push(byDate[iso] || { date: iso, missing: true });
        t.setUTCDate(t.getUTCDate() + 1);
      }
      return out;
    }

    function rollingNullable(values, n) {
      return values.map(function (v, i) {
        if (v === null) return null;
        var slice = values.slice(Math.max(0, i - n + 1), i + 1).filter(function (x) {
          return x !== null;
        });
        return (
          slice.reduce(function (a, b) {
            return a + b;
          }, 0) / slice.length
        );
      });
    }

    function render(range) {
      var lastDate = new Date(all[all.length - 1].date + "T12:00:00Z");
      var days =
        range === "all"
          ? all
          : all.filter(function (d) {
              return (lastDate - new Date(d.date + "T12:00:00Z")) / 86400000 < Number(range);
            });
      var cal = calendar(days);
      var labels = cal.map(function (d) {
        return d.date;
      });

      // KPIs
      var renew = weightedShare(days, "wind") + weightedShare(days, "solar");
      var windiest = days.reduce(function (a, b) {
        return b.share.wind > a.share.wind ? b : a;
      });
      var peak = days.reduce(function (a, b) {
        return b.peak_gw > a.peak_gw ? b : a;
      });
      document.getElementById("kpi-renew").textContent = pct(renew);
      document.getElementById("kpi-gas").textContent = pct(weightedShare(days, "gas"));
      document.getElementById("kpi-wind").textContent = pct(windiest.share.wind);
      document.getElementById("kpi-wind-label").textContent = "Windiest day · " + fmtDate(windiest.date);
      document.getElementById("kpi-peak").textContent = peak.peak_gw.toFixed(1) + " GW";
      document.getElementById("kpi-peak-label").textContent = "Highest peak · " + fmtDate(peak.date);

      Object.keys(charts).forEach(function (k) {
        charts[k].destroy();
      });
      themeDefaults();

      var dateTicks = {
        maxTicksLimit: 8,
        callback: function (v) {
          return fmtDate(labels[v]);
        },
      };
      var common = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 400 },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } },
          tooltip: {
            callbacks: {
              title: function (items) {
                return fmtDate(labels[items[0].dataIndex], true);
              },
            },
          },
        },
      };

      // 1. Rolling 7-day shares
      charts.share = new Chart(document.getElementById("chart-share"), {
        type: "line",
        data: {
          labels: labels,
          datasets: FUELS.map(function (f) {
            return {
              label: f.label,
              data: rollingNullable(
                cal.map(function (d) {
                  return d.missing ? null : d.share[f.key] || 0;
                }),
                7
              ),
              spanGaps: false,
              borderColor: f.color,
              backgroundColor: f.color,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
            };
          }),
        },
        options: Object.assign({}, common, {
          scales: {
            x: { ticks: dateTicks, grid: { display: false } },
            y: { ticks: { callback: (v) => v + "%" }, beginAtZero: true },
          },
          plugins: Object.assign({}, common.plugins, {
            tooltip: Object.assign({}, common.plugins.tooltip, {
              callbacks: Object.assign({}, common.plugins.tooltip.callbacks, {
                label: function (c) {
                  return c.dataset.label + ": " + pct(c.parsed.y);
                },
              }),
            }),
          }),
        }),
      });

      // 2. Monthly stacked mix
      var byMonth = {};
      days.forEach(function (d) {
        var m = d.date.slice(0, 7);
        (byMonth[m] = byMonth[m] || []).push(d);
      });
      // Leave out months with under a week of data (e.g. the current month before ERCOT's report catches up).
      var monthKeys = Object.keys(byMonth)
        .sort()
        .filter(function (m) {
          return byMonth[m].length >= 7;
        });
      var stackFuels = FUELS.concat([{ key: "other", label: "Other + hydro", color: "#a8a29e" }]);
      charts.month = new Chart(document.getElementById("chart-month"), {
        type: "bar",
        data: {
          labels: monthKeys.map(function (m) {
            return MONTHS[+m.slice(5) - 1] + " " + m.slice(2, 4);
          }),
          datasets: stackFuels.map(function (f) {
            return {
              label: f.label,
              data: monthKeys.map(function (m) {
                var v = weightedShare(byMonth[m], f.key);
                if (f.key === "other") v += weightedShare(byMonth[m], "hydro");
                return +v.toFixed(2);
              }),
              backgroundColor: f.color,
              borderWidth: 0,
              borderRadius: 2,
            };
          }),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: common.animation,
          plugins: {
            legend: common.plugins.legend,
            tooltip: {
              callbacks: {
                label: function (c) {
                  return c.dataset.label + ": " + pct(c.parsed.y);
                },
              },
            },
          },
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, max: 100, ticks: { callback: (v) => v + "%" } },
          },
        },
      });

      // 3. Peak generation
      var peaks = cal.map(function (d) {
        return d.missing ? null : d.peak_gw;
      });
      var theme = cssVar("--global-theme-color", "#1d4ed8");
      charts.peak = new Chart(document.getElementById("chart-peak"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Daily peak",
              data: peaks,
              borderColor: theme,
              backgroundColor: theme,
              borderWidth: 1,
              pointRadius: 0,
              tension: 0.2,
              fill: false,
              spanGaps: false,
            },
            {
              label: "7-day average",
              data: rollingNullable(peaks, 7),
              borderColor: "#f59e0b",
              backgroundColor: "#f59e0b",
              borderWidth: 2.5,
              pointRadius: 0,
              tension: 0.3,
            },
          ],
        },
        options: Object.assign({}, common, {
          scales: {
            x: { ticks: dateTicks, grid: { display: false } },
            y: { ticks: { callback: (v) => v + " GW" } },
          },
          plugins: Object.assign({}, common.plugins, {
            tooltip: Object.assign({}, common.plugins.tooltip, {
              callbacks: Object.assign({}, common.plugins.tooltip.callbacks, {
                label: function (c) {
                  return c.dataset.label + ": " + c.parsed.y.toFixed(1) + " GW";
                },
              }),
            }),
          }),
        }),
      });

      var gap = cal.filter(function (d) {
        return d.missing;
      }).length;
      var gapNote = document.getElementById("dash-gap-note");
      if (gapNote) {
        gapNote.hidden = !gap;
        gapNote.textContent = gap
          ? gap +
            " day" +
            (gap === 1 ? "" : "s") +
            " in this range are waiting on ERCOT's next monthly report; the charts leave them blank rather than guess."
          : "";
      }

      // Insights, computed from the data so they stay true as it updates
      var list = document.getElementById("dash-insights");
      var items = [];
      var monthRenew = monthKeys
        .filter(function (m) {
          return byMonth[m].length >= 20;
        })
        .map(function (m) {
          return {
            m: m,
            v: weightedShare(byMonth[m], "wind") + weightedShare(byMonth[m], "solar"),
            solar: weightedShare(byMonth[m], "solar"),
            wind: weightedShare(byMonth[m], "wind"),
          };
        });
      function monthName(m) {
        return MONTHS[+m.slice(5) - 1] + " " + m.slice(0, 4);
      }
      if (monthRenew.length >= 2) {
        var best = monthRenew.reduce(function (a, b) {
          return b.v > a.v ? b : a;
        });
        var worst = monthRenew.reduce(function (a, b) {
          return b.v < a.v ? b : a;
        });
        items.push(
          "Wind and solar together peaked at " +
            pct(best.v) +
            " of generation in " +
            monthName(best.m) +
            ", versus " +
            pct(worst.v) +
            " in " +
            monthName(worst.m) +
            "."
        );
        var solarBest = monthRenew.reduce(function (a, b) {
          return b.solar > a.solar ? b : a;
        });
        var windBest = monthRenew.reduce(function (a, b) {
          return b.wind > a.wind ? b : a;
        });
        items.push(
          solarBest.m !== windBest.m
            ? "Solar's best month was " +
                monthName(solarBest.m) +
                " (" +
                pct(solarBest.solar) +
                ") and wind's was " +
                monthName(windBest.m) +
                " (" +
                pct(windBest.wind) +
                "): they peak at different times of year."
            : "Both wind and solar had their best month in " +
                monthName(windBest.m) +
                " (wind " +
                pct(windBest.wind) +
                ", solar " +
                pct(solarBest.solar) +
                ")."
        );
      }
      items.push("The highest daily peak in this range was " + peak.peak_gw.toFixed(1) + " GW on " + fmtDate(peak.date, true) + ".");
      var gasHigh = days.reduce(function (a, b) {
        return b.share.gas > a.share.gas ? b : a;
      });
      items.push("Natural gas carried the most on " + fmtDate(gasHigh.date, true) + ", at " + pct(gasHigh.share.gas) + " of the day's generation.");
      list.innerHTML = "";
      items.forEach(function (t) {
        var li = document.createElement("li");
        li.textContent = t;
        list.appendChild(li);
      });
    }

    var current = "all";
    document.querySelectorAll(".dash-ranges .filter-chip").forEach(function (b) {
      b.addEventListener("click", function () {
        current = b.getAttribute("data-range");
        document.querySelectorAll(".dash-ranges .filter-chip").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        render(current);
      });
    });
    render(current);

    // Re-render when the visitor switches light/dark so chart colours follow.
    new MutationObserver(function () {
      render(current);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
