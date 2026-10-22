/*
 * Site interactions (Dammy Owolabi)
 *  1. Live power-grid animation behind the home hero
 *  2. Scroll reveal for sections marked [data-reveal]
 *  3. Filter projects by tool on the projects page
 *
 * Everything is progressive enhancement: without JavaScript the pages render
 * fully, and visitors who prefer reduced motion get static versions.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  /* ---------------------------------------------------------------------
   * 1. Grid animation: nodes (substations) linked by lines (feeders),
   *    with small pulses of "current" travelling along the lines.
   * ------------------------------------------------------------------- */
  function initGrid(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0,
      h = 0,
      nodes = [],
      edges = [],
      pulses = [],
      running = false,
      visible = true,
      rafId = null,
      last = 0;

    // Seeded random so the layout is stable between resizes.
    var seed = 20250901;
    function rand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    function build() {
      var rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      seed = 20250901;
      nodes = [];
      edges = [];
      pulses = [];
      var count = Math.max(14, Math.min(34, Math.round((w * h) / 16000)));
      for (var i = 0; i < count; i++) {
        nodes.push({ x: rand() * w, y: rand() * h, r: 1.6 + rand() * 1.6, hub: rand() < 0.18 });
      }
      // Connect each node to its two nearest neighbours.
      var seen = {};
      nodes.forEach(function (a, ia) {
        var near = nodes
          .map(function (b, ib) {
            return { ib: ib, d: (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) };
          })
          .filter(function (o) {
            return o.ib !== ia;
          })
          .sort(function (p, q) {
            return p.d - q.d;
          })
          .slice(0, 2);
        near.forEach(function (o) {
          var key = Math.min(ia, o.ib) + "-" + Math.max(ia, o.ib);
          if (!seen[key]) {
            seen[key] = true;
            edges.push([ia, o.ib]);
          }
        });
      });
      for (var p = 0; p < Math.round(edges.length * 0.45); p++) spawnPulse(true);
    }

    function spawnPulse(randomStart) {
      if (!edges.length) return;
      var e = edges[Math.floor(rand() * edges.length)];
      var forward = rand() < 0.5;
      pulses.push({
        from: forward ? e[0] : e[1],
        to: forward ? e[1] : e[0],
        t: randomStart ? rand() : 0,
        speed: 0.12 + rand() * 0.18,
      });
    }

    function draw(dt) {
      var line = cssVar("--grid-line", "rgba(29,78,216,0.16)");
      var node = cssVar("--grid-node", "rgba(29,78,216,0.45)");
      var glow = cssVar("--grid-pulse", "rgba(37,99,235,0.9)");
      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 1;
      ctx.strokeStyle = line;
      ctx.beginPath();
      edges.forEach(function (e) {
        var a = nodes[e[0]],
          b = nodes[e[1]];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      });
      ctx.stroke();

      ctx.fillStyle = node;
      nodes.forEach(function (n) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.hub ? n.r + 1.4 : n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!dt) return; // static frame
      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += p.speed * dt;
        if (p.t >= 1) {
          // Hand the pulse on to a neighbouring line, like current through a bus.
          var next = edges.filter(function (e) {
            return (e[0] === p.to || e[1] === p.to) && !(e[0] === p.from || e[1] === p.from);
          });
          if (next.length && rand() < 0.75) {
            var e = next[Math.floor(rand() * next.length)];
            p.from = p.to;
            p.to = e[0] === p.to ? e[1] : e[0];
            p.t = 0;
          } else {
            pulses.splice(i, 1);
            spawnPulse(false);
            continue;
          }
        }
        var a = nodes[p.from],
          b = nodes[p.to];
        var x = a.x + (b.x - a.x) * p.t,
          y = a.y + (b.y - a.y) * p.t;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, glow);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      draw(dt);
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true;
      last = 0;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    build();
    draw(0);
    start();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        build();
        draw(0);
      }, 150);
    });
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(canvas);
    }
    // Redraw on theme switch so colours follow light/dark mode.
    new MutationObserver(function () {
      draw(0);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  /* ---------------------------------------------------------------------
   * 2. Scroll reveal
   * ------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length || reduceMotion || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("reveal-ready");
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
   * 3. Project filter
   * ------------------------------------------------------------------- */
  function initProjectFilter(bar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tools]"));
    if (!cards.length) return;

    // Count each tool once per project (featured cards repeat projects from the grid).
    var counts = {},
      counted = {};
    cards.forEach(function (c) {
      var name = c.getAttribute("data-name") || "";
      c.getAttribute("data-tools")
        .split("|")
        .filter(Boolean)
        .forEach(function (t) {
          var key = name + "::" + t;
          if (!counted[key]) {
            counted[key] = true;
            counts[t] = (counts[t] || 0) + 1;
          }
        });
    });
    // Tools used by two or more projects show first; the rest sit behind "More tools".
    var tools = Object.keys(counts)
      .filter(function (t) {
        return counts[t] >= 2;
      })
      .sort(function (a, b) {
        return counts[b] - counts[a] || a.localeCompare(b);
      });
    var extra = Object.keys(counts)
      .filter(function (t) {
        return counts[t] < 2;
      })
      .sort(function (a, b) {
        return a.localeCompare(b);
      });
    if (!tools.length && !extra.length) return;

    var status = document.createElement("p");
    status.className = "project-filter-status";
    status.setAttribute("aria-live", "polite");

    var list = document.createElement("div");
    list.className = "project-filter-chips";
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Filter projects by tool");

    function makeChip(label, value, parent) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "filter-chip";
      b.textContent = label;
      b.setAttribute("data-value", value);
      b.setAttribute("aria-pressed", value === "" ? "true" : "false");
      b.addEventListener("click", function () {
        apply(value);
      });
      (parent || list).appendChild(b);
    }
    makeChip("All", "");
    tools.forEach(function (t) {
      makeChip(t, t);
    });
    if (extra.length) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "filter-chip filter-chip-more";
      more.setAttribute("aria-expanded", "false");
      more.textContent = "More tools (" + extra.length + ")";
      list.appendChild(more);
      var extraBox = document.createElement("div");
      extraBox.className = "project-filter-chips project-filter-extra";
      extraBox.setAttribute("role", "group");
      extraBox.setAttribute("aria-label", "More tools");
      extraBox.hidden = true;
      more.setAttribute("aria-controls", "project-filter-extra");
      extraBox.id = "project-filter-extra";
      extra.forEach(function (t) {
        makeChip(t, t, extraBox);
      });
      more.addEventListener("click", function () {
        var open = extraBox.hidden;
        extraBox.hidden = !open;
        more.setAttribute("aria-expanded", String(open));
        more.textContent = open ? "Fewer tools" : "More tools (" + extra.length + ")";
      });
    }

    function apply(value) {
      bar.querySelectorAll(".filter-chip[data-value]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-value") === value ? "true" : "false");
      });
      var shown = 0,
        seenNames = {};
      cards.forEach(function (c) {
        var match = !value || c.getAttribute("data-tools").split("|").indexOf(value) !== -1;
        c.hidden = !match;
        var name = c.getAttribute("data-name");
        if (match && name && !seenNames[name]) {
          seenNames[name] = true;
          shown++;
        }
      });
      // Hide sections and category headings that end up empty.
      document.querySelectorAll(".projects .row, .featured-projects").forEach(function (group) {
        var any = group.querySelector("[data-tools]:not([hidden])");
        group.hidden = !any;
        var prev = group.previousElementSibling;
        if (prev && prev.matches("a[id]") && prev.querySelector("h2.category")) prev.hidden = !any;
      });
      var allLabel = document.querySelector(".all-projects-label");
      if (allLabel) allLabel.hidden = !!value && !document.querySelector(".projects .row [data-tools]:not([hidden])");
      status.textContent = value ? "Showing " + shown + " project" + (shown === 1 ? "" : "s") + " using " + value : "";
    }

    bar.appendChild(list);
    if (extraBox) bar.appendChild(extraBox);
    bar.appendChild(status);
    bar.hidden = false;
  }

  /* ---------------------------------------------------------------------
   * 4. Copy email button (shown only where the Clipboard API exists)
   * ------------------------------------------------------------------- */
  function initCopyEmail() {
    if (!navigator.clipboard) return;
    document.querySelectorAll(".copy-email").forEach(function (btn) {
      var label = btn.querySelector("span");
      btn.hidden = false;
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(btn.getAttribute("data-email")).then(
          function () {
            label.textContent = "Copied!";
            setTimeout(function () {
              label.textContent = "Copy email";
            }, 1800);
          },
          function () {
            label.textContent = btn.getAttribute("data-email");
          }
        );
      });
    });
  }

  function init() {
    initCopyEmail();
    var canvas = document.querySelector(".hero-grid");
    if (canvas) initGrid(canvas);
    var bar = document.querySelector(".project-filter");
    if (bar) initProjectFilter(bar);
    initReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
