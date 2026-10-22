/* DS 7333 machine learning lab: one small interactive app per course week.
 * Real results (Weeks 2, 3, 6, 7, 8) come from assets/data/ds7333/lab-data.json,
 * computed with scikit-learn and XGBoost on the same datasets as the course notebooks.
 * Everything else is simulated in the browser. Nothing is sent anywhere. */
(function () {
  "use strict";

  var root = document.getElementById("ml-lab");
  if (!root) return;
  var base = root.getAttribute("data-base") || "";
  var nav = root.querySelector(".lab-weeks");
  var stage = root.querySelector(".lab-stage");
  var single = +root.getAttribute("data-week") || 0;
  var DATA = null;
  var current = null; // { week, api }
  var dataReady = fetch(base + "/assets/data/ds7333/lab-data.json")
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      DATA = d;
    });

  /* ------------------------------------------------------------------ helpers */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs)
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") n.textContent = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else if (k === "class") n.className = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    (kids || []).forEach(function (c) {
      if (c) n.appendChild(c);
    });
    return n;
  }
  function add(p, c) {
    p.appendChild(c);
    return c;
  }
  var uid = 0;
  function nextId(p) {
    return (p || "lab") + "-" + ++uid;
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }
  function css(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  }
  function C() {
    var d = isDark();
    return {
      ink: css("--global-text-color", "#0f172a"),
      muted: css("--global-text-color-light", "#475569"),
      grid: css("--global-divider-color", "#e2e8f0"),
      bg: css("--global-card-bg-color", "#fff"),
      teal: d ? "#2dd4bf" : "#0d9488",
      amber: d ? "#fbbf24" : "#d97706",
      rose: d ? "#fb7185" : "#e11d48",
      violet: d ? "#c4b5fd" : "#7c3aed",
      lime: d ? "#a3e635" : "#65a30d",
      slate: d ? "#94a3b8" : "#64748b",
    };
  }
  function pal() {
    var c = C();
    return [c.teal, c.amber, c.rose, c.violet, c.lime, c.slate];
  }
  function alpha(hex, a) {
    var h = hex.replace("#", "");
    if (h.length === 3)
      h = h
        .split("")
        .map(function (x) {
          return x + x;
        })
        .join("");
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function rgb(hex) {
    var n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // seeded random numbers so every visitor sees the same starting data
  function rng(seed) {
    var a = seed >>> 0;
    var f = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.normal = function () {
      var u = 1 - f(),
        v = f();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return f;
  }
  function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function mean(a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return a.length ? s / a.length : 0;
  }
  function sd(a) {
    var m = mean(a),
      s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return a.length > 1 ? Math.sqrt(s / (a.length - 1)) : 0;
  }
  function corr(x, y) {
    var mx = mean(x),
      my = mean(y),
      a = 0,
      b = 0,
      c = 0;
    for (var i = 0; i < x.length; i++) {
      a += (x[i] - mx) * (y[i] - my);
      b += (x[i] - mx) * (x[i] - mx);
      c += (y[i] - my) * (y[i] - my);
    }
    return a / Math.sqrt(b * c);
  }
  function median(a) {
    var s = a.slice().sort(function (p, q) {
      return p - q;
    });
    var m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function pct(v, d) {
    return (100 * v).toFixed(d == null ? 1 : d) + "%";
  }
  function fx(v, d) {
    return Number(v).toFixed(d == null ? 2 : d);
  }

  /* --------------------------------------------------------------- UI pieces */
  function controls(parent) {
    return add(parent, el("div", { class: "lab-controls" }));
  }
  function slider(parent, o) {
    var id = nextId("s");
    var wrap = add(parent, el("div", { class: "field lab-field" }));
    var lab = add(wrap, el("label", { for: id }));
    lab.appendChild(document.createTextNode(o.label + " "));
    var out = add(lab, el("output", { class: "lab-val", for: id }));
    var inp = add(wrap, el("input", { type: "range", id: id, min: o.min, max: o.max, step: o.step || 1, value: o.value }));
    function show() {
      out.textContent = o.fmt ? o.fmt(+inp.value) : inp.value;
    }
    inp.addEventListener("input", function () {
      show();
      if (o.onInput) o.onInput(+inp.value);
    });
    show();
    return {
      el: wrap,
      get: function () {
        return +inp.value;
      },
      set: function (v) {
        inp.value = v;
        show();
      },
    };
  }
  function seg(parent, o) {
    var wrap = add(parent, el("div", { class: "field lab-field" }));
    add(wrap, el("span", { text: o.label }));
    var g = add(wrap, el("div", { class: "seg", role: "radiogroup", "aria-label": o.label }));
    var name = nextId("g");
    var value = o.value;
    o.options.forEach(function (op) {
      var l = add(g, el("label"));
      var r = add(l, el("input", { type: "radio", name: name, value: String(op[0]) }));
      if (String(op[0]) === String(o.value)) r.checked = true;
      add(l, el("span", { text: op[1] }));
      r.addEventListener("change", function () {
        value = op[0];
        if (o.onChange) o.onChange(op[0]);
      });
    });
    return {
      el: wrap,
      get: function () {
        return value;
      },
    };
  }
  function select(parent, o) {
    var id = nextId("sel");
    var wrap = add(parent, el("label", { class: "field lab-field", for: id }));
    add(wrap, el("span", { text: o.label }));
    var s = add(wrap, el("select", { id: id }));
    o.options.forEach(function (op) {
      var opt = add(s, el("option", { value: String(op[0]), text: op[1] }));
      if (String(op[0]) === String(o.value)) opt.selected = true;
    });
    s.addEventListener("change", function () {
      if (o.onChange) o.onChange(s.value);
    });
    return {
      el: wrap,
      get: function () {
        return s.value;
      },
      set: function (v) {
        s.value = v;
      },
    };
  }
  function check(parent, label, value, onChange) {
    var l = add(parent, el("label", { class: "check lab-check" }));
    var i = add(l, el("input", { type: "checkbox" }));
    i.checked = !!value;
    add(l, el("span", { text: label }));
    i.addEventListener("change", function () {
      onChange(i.checked);
    });
    return {
      get: function () {
        return i.checked;
      },
    };
  }
  function buttons(parent) {
    return add(parent, el("div", { class: "lab-buttons" }));
  }
  function button(parent, text, onClick, primary) {
    var b = add(parent, el("button", { type: "button", class: "lab-btn" + (primary ? " lab-btn-primary" : ""), text: text }));
    b.addEventListener("click", onClick);
    return b;
  }
  function kpis(parent, list) {
    var wrap = add(parent, el("div", { class: "dash-kpis lab-kpis", "aria-live": "polite" }));
    var set = {};
    list.forEach(function (k) {
      var d = add(wrap, el("div", { class: "dash-kpi" }));
      var v = add(d, el("span", { class: "stat-value", text: "–" }));
      add(d, el("span", { class: "stat-label", text: k[1] }));
      set[k[0]] = function (t) {
        v.textContent = t;
      };
    });
    return set;
  }
  function panel(parent, title, note) {
    var p = add(parent, el("section", { class: "dash-panel lab-panel" }));
    if (title) add(p, el("h3", { text: title }));
    if (note) add(p, el("p", { class: "dash-note", text: note }));
    return p;
  }

  // a canvas that keeps its CSS size and redraws crisply
  var canvases = [];
  function canvas(parent, opts) {
    opts = opts || {};
    var wrap = add(parent, el("div", { class: "lab-canvas" }));
    var cv = add(wrap, el("canvas", { role: "img", "aria-label": opts.label || "Chart" }));
    // keep every chart inside the visible screen height
    if (opts.height) {
      cv.style.height = "min(" + opts.height + "px, 72vh)";
      cv.style.height = "min(" + opts.height + "px, 72svh)";
      if (opts.maxWidth) wrap.style.maxWidth = opts.maxWidth + "px";
    } else {
      var asp = opts.aspect || "16 / 9",
        parts = asp.split("/"),
        ratio = (+parts[0] / +parts[1]).toFixed(4);
      cv.style.aspectRatio = asp;
      ["vh", "svh"].forEach(function (u) {
        var fit = "calc(" + ratio + " * 72" + u + ")";
        wrap.style.maxWidth = opts.maxWidth ? "min(" + opts.maxWidth + "px, " + fit + ")" : fit;
      });
    }
    canvases.push(cv);
    return cv;
  }
  function prep(cv) {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(10, Math.round(r.width)),
      h = Math.max(10, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr;
      cv.height = h * dpr;
    }
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    return { ctx: ctx, w: w, h: h };
  }
  function niceTicks(a, b, n) {
    var span = b - a;
    if (span <= 0) return [a];
    var step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = (n * step) / span;
    if (err <= 0.15) step *= 10;
    else if (err <= 0.35) step *= 5;
    else if (err <= 0.75) step *= 2;
    var t = [],
      v = Math.ceil(a / step - 1e-9) * step;
    for (; v <= b + 1e-9; v += step) t.push(Math.abs(v) < step * 1e-6 ? 0 : v);
    return t;
  }
  // set up axes; returns scale functions
  function frame(cv, o) {
    var P = prep(cv),
      c = C(),
      ctx = P.ctx;
    var L = o.l != null ? o.l : 46,
      R = o.r != null ? o.r : 14,
      T = o.t != null ? o.t : 12,
      B = o.b != null ? o.b : 34;
    var lx = function (v) {
      return o.xlog ? Math.log10(v) : v;
    };
    var x0 = lx(o.x0),
      x1 = lx(o.x1);
    var sx = function (v) {
      return L + ((lx(v) - x0) / (x1 - x0)) * (P.w - L - R);
    };
    var sy = function (v) {
      return P.h - B - ((v - o.y0) / (o.y1 - o.y0)) * (P.h - T - B);
    };
    var f = {
      ctx: ctx,
      w: P.w,
      h: P.h,
      sx: sx,
      sy: sy,
      L: L,
      R: R,
      T: T,
      B: B,
      ix: function (px) {
        var v = x0 + ((px - L) / (P.w - L - R)) * (x1 - x0);
        return o.xlog ? Math.pow(10, v) : v;
      },
      iy: function (py) {
        return o.y0 + ((P.h - B - py) / (P.h - T - B)) * (o.y1 - o.y0);
      },
    };
    if (o.axes === false) return f;
    ctx.lineWidth = 1;
    ctx.strokeStyle = c.grid;
    ctx.fillStyle = c.muted;
    ctx.textAlign = "right";
    (o.yticks || niceTicks(o.y0, o.y1, o.ny || 5)).forEach(function (t) {
      var y = Math.round(sy(t)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(L, y);
      ctx.lineTo(P.w - R, y);
      ctx.stroke();
      ctx.fillText(o.yfmt ? o.yfmt(t) : String(+t.toFixed(4)), L - 6, y);
    });
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    var xt = o.xticks || (o.xlog ? logTicks(o.x0, o.x1) : niceTicks(o.x0, o.x1, o.nx || 6));
    xt.forEach(function (t) {
      var x = sx(t);
      ctx.fillText(o.xfmt ? o.xfmt(t) : String(+t.toFixed(4)), x, P.h - B + 6);
    });
    ctx.strokeStyle = c.muted;
    ctx.beginPath();
    ctx.moveTo(L, P.h - B + 0.5);
    ctx.lineTo(P.w - R, P.h - B + 0.5);
    ctx.stroke();
    if (o.xlabel) {
      ctx.fillStyle = c.muted;
      ctx.fillText(o.xlabel, L + (P.w - L - R) / 2, P.h - 14);
    }
    if (o.ylabel) {
      ctx.save();
      ctx.translate(11, T + (P.h - T - B) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "middle";
      ctx.fillText(o.ylabel, 0, 0);
      ctx.restore();
    }
    ctx.textBaseline = "middle";
    return f;
  }
  function logTicks(a, b) {
    var t = [];
    for (var e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) {
      var v = Math.pow(10, e);
      if (v >= a * 0.999 && v <= b * 1.001) t.push(v);
    }
    return t;
  }
  function line(f, xs, ys, color, width, dash) {
    var ctx = f.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    for (var i = 0; i < xs.length; i++) {
      var X = f.sx(xs[i]),
        Y = f.sy(ys[i]);
      if (i) ctx.lineTo(X, Y);
      else ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function dot(ctx, x, y, r, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  function legend(parent, items) {
    var lg = add(parent, el("div", { class: "lab-legend" }));
    var spans = items.map(function (it) {
      var s = add(lg, el("span"));
      var sw = add(s, el("i"));
      s.appendChild(document.createTextNode(it[1]));
      return { sw: sw, key: it[0] };
    });
    return function () {
      var c = C();
      spans.forEach(function (s) {
        s.sw.style.background = c[s.key] || s.key;
      });
    };
  }
  // a heat field drawn into an offscreen image, then scaled up
  function heat(f, nx, ny, x0, x1, y0, y1, fn) {
    var off = document.createElement("canvas");
    off.width = nx;
    off.height = ny;
    var o = off.getContext("2d"),
      img = o.createImageData(nx, ny);
    for (var j = 0; j < ny; j++)
      for (var i = 0; i < nx; i++) {
        var x = x0 + ((i + 0.5) / nx) * (x1 - x0),
          y = y1 - ((j + 0.5) / ny) * (y1 - y0);
        var col = fn(x, y),
          k = 4 * (j * nx + i);
        img.data[k] = col[0];
        img.data[k + 1] = col[1];
        img.data[k + 2] = col[2];
        img.data[k + 3] = col[3];
      }
    o.putImageData(img, 0, 0);
    var X0 = f.sx(x0),
      X1 = f.sx(x1),
      Y0 = f.sy(y1),
      Y1 = f.sy(y0);
    f.ctx.imageSmoothingEnabled = true;
    f.ctx.drawImage(off, X0, Y0, X1 - X0, Y1 - Y0);
  }
  function animator(stepFn) {
    var raf = 0;
    function loop() {
      if (stepFn() === false) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    }
    return {
      start: function () {
        if (!raf) raf = requestAnimationFrame(loop);
      },
      stop: function () {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      running: function () {
        return !!raf;
      },
    };
  }
  // 2D toy datasets in [-1, 1]
  function toy(kind, n, seed) {
    var r = rng(seed),
      X = [],
      Y = [];
    for (var i = 0; i < n; i++) {
      var y = i % 2,
        a,
        b;
      if (kind === "blobs") {
        a = (y ? 0.4 : -0.4) + r.normal() * 0.22;
        b = (y ? 0.35 : -0.35) + r.normal() * 0.22;
      } else if (kind === "circles") {
        var ang = r() * 2 * Math.PI,
          rad = y ? 0.75 + r.normal() * 0.07 : 0.3 + r.normal() * 0.09;
        a = rad * Math.cos(ang);
        b = rad * Math.sin(ang);
      } else if (kind === "xor") {
        a = (r() * 2 - 1) * 0.9;
        b = (r() * 2 - 1) * 0.9;
        if (Math.abs(a) < 0.06) a += a < 0 ? -0.08 : 0.08;
        if (Math.abs(b) < 0.06) b += b < 0 ? -0.08 : 0.08;
        y = a * b > 0 ? 1 : 0;
      } else if (kind === "moons") {
        var t = r() * Math.PI;
        if (y) {
          a = 1 - Math.cos(t) - 0.5;
          b = 0.5 - Math.sin(t) - 0.25;
        } else {
          a = Math.cos(t) - 0.5;
          b = Math.sin(t) - 0.25;
        }
        a = a * 0.55 + r.normal() * 0.05;
        b = b * 0.75 + r.normal() * 0.05;
      } else {
        // spiral
        var k = Math.floor(i / 2),
          tt = (k / (n / 2)) * 3.2 + 0.3;
        var rr = (tt / 3.5) * 0.9;
        var ph = tt + (y ? Math.PI : 0);
        a = rr * Math.cos(ph) + r.normal() * 0.03;
        b = rr * Math.sin(ph) + r.normal() * 0.03;
      }
      X.push([clamp(a, -0.98, 0.98), clamp(b, -0.98, 0.98)]);
      Y.push(y);
    }
    return { X: X, Y: Y };
  }
  function header(parent, w) {
    var h = add(parent, el("header", { class: "lab-head" }));
    if (!single) {
      add(h, el("p", { class: "lab-kicker", text: "Week " + w.week + " · " + w.topic }));
      add(h, el("h2", { text: w.title }));
    }
    var q = add(h, el("blockquote", { class: "lab-question" }));
    add(q, el("span", { class: "lab-q-label", text: "My question that week" }));
    add(q, el("p", { text: w.question }));
    add(h, el("p", { class: "lab-try", html: "<strong>Try this:</strong> " + w.tryThis }));
  }
  function takeaway(parent, html) {
    var d = add(parent, el("div", { class: "lab-takeaway" }));
    add(d, el("h3", { text: "What it shows" }));
    add(d, el("div", { html: html }));
    return d;
  }

  /* ================================================================ WEEKS */
  var WEEKS = [];

  /* ---------------------------------------------------- Week 2: L1 vs L2 */
  WEEKS.push({
    week: 2,
    topic: "Regularization",
    short: "L1 vs L2",
    title: "L1 vs L2 on real data",
    question: "How do I determine which one works best for my model, L1 or L2?",
    tryThis:
      "Switch between L1 and L2, then drag the strength up. Watch L1 zero out whole features while L2 only shrinks them, and see what that costs in cross-validated accuracy.",
    needsData: true,
    build: function (el0) {
      var d = DATA.w2,
        n = d.C.length;
      var order = d.features
        .map(function (_, i) {
          return i;
        })
        .sort(function (a, b) {
          return Math.abs(d.l2.coef[n - 1][b]) - Math.abs(d.l2.coef[n - 1][a]);
        });
      var maxAbs = 0;
      ["l1", "l2"].forEach(function (p) {
        d[p].coef.forEach(function (row) {
          row.forEach(function (v) {
            maxAbs = Math.max(maxAbs, Math.abs(v));
          });
        });
      });
      maxAbs = Math.min(maxAbs, 8);
      var pen = "l1";
      var ctl = controls(el0);
      seg(ctl, {
        label: "Penalty",
        value: "l1",
        options: [
          ["l1", "L1 (Lasso)"],
          ["l2", "L2 (Ridge)"],
        ],
        onChange: function (v) {
          pen = v;
          draw();
        },
      });
      var s = slider(ctl, {
        label: "Strength λ = 1/C",
        min: 0,
        max: n - 1,
        value: 13,
        fmt: function (v) {
          return fx(1 / d.C[n - 1 - v], 3);
        },
        onInput: function () {
          draw();
        },
      });
      var k = kpis(el0, [
        ["nz", "Features kept (of 30)"],
        ["cv", "5-fold CV accuracy"],
        ["top", "Biggest weight"],
        ["other", "Other penalty, same λ"],
      ]);
      var p1 = panel(
        el0,
        "Coefficient for each feature",
        "Breast cancer data (569 tumors, 30 standardized features), logistic regression. Bars are sorted by the unregularized L2 weight."
      );
      var cv1 = canvas(p1, { height: 30 * 17 + 40, label: "Bar chart of 30 logistic regression coefficients" });
      var p2 = panel(p1.parentNode, "Accuracy as the penalty grows");
      var lg = legend(p2, [
        ["teal", "L1"],
        ["amber", "L2"],
      ]);
      var cv2 = canvas(p2, { aspect: "16 / 7", label: "Cross-validated accuracy against regularization strength" });
      function draw() {
        var idx = n - 1 - s.get(),
          c = C();
        var coef = d[pen].coef[idx];
        var nz = coef.filter(function (v) {
          return Math.abs(v) > 1e-6;
        }).length;
        var top = order.slice().sort(function (a, b) {
          return Math.abs(coef[b]) - Math.abs(coef[a]);
        })[0];
        var other = pen === "l1" ? "l2" : "l1";
        k.nz(String(nz));
        k.cv(pct(d[pen].cv[idx]));
        k.top(Math.abs(coef[top]) < 1e-6 ? "none" : d.features[top]);
        k.other(pct(d[other].cv[idx]) + " (" + other.toUpperCase() + ")");
        // bars
        var f = frame(cv1, { x0: -maxAbs, x1: maxAbs, y0: 0, y1: 30, l: 150, t: 6, b: 30, yticks: [], xlabel: "" });
        var ctx = f.ctx,
          bh = (f.sy(0) - f.sy(1)) * 0.7;
        ctx.font = Math.max(8, Math.min(12, Math.floor(f.sy(0) - f.sy(1)) - 2)) + "px Inter, ui-sans-serif, system-ui, sans-serif";
        ctx.strokeStyle = c.muted;
        ctx.beginPath();
        ctx.moveTo(f.sx(0) + 0.5, f.T);
        ctx.lineTo(f.sx(0) + 0.5, f.h - f.B);
        ctx.stroke();
        order.forEach(function (fi, r) {
          var v = clamp(coef[fi], -maxAbs, maxAbs),
            y = f.sy(30 - r - 0.5);
          var zero = Math.abs(coef[fi]) < 1e-6;
          ctx.fillStyle = zero ? c.muted : v > 0 ? c.teal : c.amber;
          ctx.textAlign = "right";
          ctx.globalAlpha = zero ? 0.55 : 1;
          ctx.fillText(d.features[fi], f.L - 8, y);
          ctx.globalAlpha = 1;
          if (!zero) ctx.fillRect(Math.min(f.sx(0), f.sx(v)), y - bh / 2, Math.abs(f.sx(v) - f.sx(0)), bh);
          else {
            ctx.fillStyle = c.muted;
            ctx.fillRect(f.sx(0) - 1, y - 1, 2, 2);
          }
        });
        // accuracy curves
        lg();
        var lam = d.C.map(function (x) {
          return 1 / x;
        });
        var all = d.l1.cv.concat(d.l2.cv);
        var g = frame(cv2, {
          x0: Math.min.apply(null, lam),
          x1: Math.max.apply(null, lam),
          xlog: true,
          y0: Math.floor(Math.min.apply(null, all) * 20) / 20,
          y1: 1,
          yfmt: function (t) {
            return Math.round(t * 100) + "%";
          },
          xfmt: function (t) {
            return String(+t.toPrecision(2));
          },
          xlabel: "λ (stronger penalty →)",
        });
        line(g, lam, d.l1.cv, c.teal, 2);
        line(g, lam, d.l2.cv, c.amber, 2);
        var X = g.sx(lam[idx]);
        g.ctx.strokeStyle = c.ink;
        g.ctx.setLineDash([4, 4]);
        g.ctx.beginPath();
        g.ctx.moveTo(X, g.T);
        g.ctx.lineTo(X, g.h - g.B);
        g.ctx.stroke();
        g.ctx.setLineDash([]);
        dot(g.ctx, X, g.sy(d[pen].cv[idx]), 5, pen === "l1" ? c.teal : c.amber, c.bg);
      }
      takeaway(
        el0,
        "<p>L1 is a feature selector: past a moderate λ it keeps only a handful of the 30 measurements and accuracy barely moves, which makes the model easier to explain. L2 keeps every feature with smaller weights, which suits data where many features each carry a little signal (and with few features, L2 is usually the safer default). The practical way to choose is the one used here: compare cross-validated scores across a grid of λ for both, then prefer the simpler model when the scores tie. Elastic net mixes the two when you want some of each.</p>"
      );
      return { draw: draw };
    },
  });

  /* ------------------------------------------- Week 3: logistic regression */
  WEEKS.push({
    week: 3,
    topic: "Logistic regression",
    short: "Thresholds",
    title: "Train a logistic model, then pick the threshold",
    question: "Are there any statistical techniques to determine threshold placements?",
    tryThis:
      "Press Train to watch gradient descent fit the sigmoid by minimizing log loss. Then move the threshold and watch the confusion matrix trade missed cancers for false alarms. Best balance jumps to the threshold with the highest Youden's J.",
    needsData: true,
    build: function (el0) {
      var d = DATA.w3,
        n = d.x.length;
      var mu = mean(d.x),
        s = sd(d.x);
      var z = d.x.map(function (v) {
        return (v - mu) / s;
      });
      var r = rng(3),
        jit = d.x.map(function () {
          return (r() - 0.5) * 0.12;
        });
      var w = 0,
        b = 0,
        epoch = 0,
        hist = [];
      function prob(i) {
        return sigmoid(w * z[i] + b);
      }
      function loss() {
        var L = 0;
        for (var i = 0; i < n; i++) {
          var p = clamp(prob(i), 1e-9, 1 - 1e-9);
          L -= d.y[i] ? Math.log(p) : Math.log(1 - p);
        }
        return L / n;
      }
      function step(lr) {
        var gw = 0,
          gb = 0;
        for (var i = 0; i < n; i++) {
          var e = prob(i) - d.y[i];
          gw += e * z[i];
          gb += e;
        }
        w -= (lr * gw) / n;
        b -= (lr * gb) / n;
        epoch++;
        hist.push(loss());
      }
      var ctl = controls(el0);
      var lr = slider(ctl, {
        label: "Learning rate",
        min: 0.01,
        max: 2,
        step: 0.01,
        value: 0.3,
        fmt: function (v) {
          return v.toFixed(2);
        },
      });
      var th = slider(ctl, {
        label: "Threshold",
        min: 0.02,
        max: 0.98,
        step: 0.01,
        value: 0.5,
        fmt: function (v) {
          return v.toFixed(2);
        },
        onInput: function () {
          draw();
        },
      });
      var bt = buttons(el0);
      var anim = animator(function () {
        step(lr.get());
        draw();
        if (epoch >= 400) {
          trainBtn.textContent = "Train";
          return false;
        }
      });
      var trainBtn = button(
        bt,
        "Train",
        function () {
          if (anim.running()) {
            anim.stop();
            trainBtn.textContent = "Train";
          } else {
            if (epoch >= 400) reset();
            anim.start();
            trainBtn.textContent = "Pause";
          }
        },
        true
      );
      button(bt, "One step", function () {
        step(lr.get());
        draw();
      });
      button(bt, "Best balance (Youden's J)", function () {
        var best = 0.5,
          bj = -1;
        for (var t = 0.02; t <= 0.98; t += 0.01) {
          var m = cm(t),
            j = m.tp / (m.tp + m.fn) - m.fp / (m.fp + m.tn);
          if (j > bj) {
            bj = j;
            best = t;
          }
        }
        th.set(best.toFixed(2));
        draw();
      });
      button(bt, "Reset", function () {
        reset();
      });
      function reset() {
        anim.stop();
        trainBtn.textContent = "Train";
        w = 0;
        b = 0;
        epoch = 0;
        hist = [];
        draw();
      }
      function cm(t) {
        var m = { tp: 0, fp: 0, tn: 0, fn: 0 };
        for (var i = 0; i < n; i++) {
          var p = prob(i) >= t;
          if (p && d.y[i]) m.tp++;
          else if (p) m.fp++;
          else if (d.y[i]) m.fn++;
          else m.tn++;
        }
        return m;
      }
      var k = kpis(el0, [
        ["ep", "Gradient steps"],
        ["ll", "Log loss"],
        ["rec", "Cancers caught (recall)"],
        ["prec", "Flags that are right"],
      ]);
      var grid = add(el0, el("div", { class: "lab-grid" }));
      var p1 = panel(grid, "Tumor size vs diagnosis", "Each dot is one tumor (worst radius, mm). Ringed dots are misclassified at this threshold.");
      var lg = legend(p1, [
        ["amber", "Malignant"],
        ["teal", "Benign"],
        ["ink", "Model probability"],
      ]);
      var cv1 = canvas(p1, { aspect: "4 / 3", label: "Scatter of tumor radius by diagnosis with fitted sigmoid" });
      var p2 = panel(grid, "Confusion matrix");
      var tbl = add(p2, el("table", { class: "lab-cm" }));
      var p3 = add(p2, el("div", { class: "lab-mini" }));
      add(p3, el("h4", { text: "Log loss by step" }));
      var cv2 = canvas(p3, { aspect: "16 / 8", label: "Log loss falling during training" });
      function draw() {
        var c = C(),
          t = th.get();
        lg();
        var f = frame(cv1, {
          x0: 5,
          x1: 38,
          y0: -0.15,
          y1: 1.15,
          yticks: [0, 0.5, 1],
          yfmt: function (v) {
            return v === 1 ? "1" : v === 0 ? "0" : "0.5";
          },
          xlabel: "Worst radius (mm)",
          ylabel: "P(malignant)",
        });
        var ctx = f.ctx;
        // threshold line in x space
        if (Math.abs(w) > 1e-6) {
          var xz = (Math.log(t / (1 - t)) - b) / w,
            xt = xz * s + mu;
          if (xt > 5 && xt < 38) {
            ctx.fillStyle = alpha(c.amber, 0.08);
            ctx.fillRect(w > 0 ? f.sx(xt) : f.L, f.T, w > 0 ? f.w - f.R - f.sx(xt) : f.sx(xt) - f.L, f.h - f.T - f.B);
            ctx.strokeStyle = c.muted;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(f.sx(xt), f.T);
            ctx.lineTo(f.sx(xt), f.h - f.B);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        for (var i = 0; i < n; i++) {
          var col = d.y[i] ? c.amber : c.teal,
            wrong = prob(i) >= t !== !!d.y[i];
          dot(ctx, f.sx(d.x[i]), f.sy(d.y[i] + jit[i]), 3, alpha(col, 0.75), wrong ? c.ink : null);
        }
        var xs = [],
          ys = [];
        for (var x = 5; x <= 38; x += 0.25) {
          xs.push(x);
          ys.push(sigmoid(w * ((x - mu) / s) + b));
        }
        line(f, xs, ys, c.ink, 2.5);
        ctx.strokeStyle = c.muted;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(f.L, f.sy(t));
        ctx.lineTo(f.w - f.R, f.sy(t));
        ctx.stroke();
        ctx.setLineDash([]);
        var m = cm(t);
        tbl.innerHTML =
          "<thead><tr><th></th><th>Predicted malignant</th><th>Predicted benign</th></tr></thead><tbody>" +
          "<tr><th>Malignant</th><td class='ok'>" +
          m.tp +
          "<small>caught</small></td><td class='bad'>" +
          m.fn +
          "<small>missed</small></td></tr>" +
          "<tr><th>Benign</th><td class='bad'>" +
          m.fp +
          "<small>false alarm</small></td><td class='ok'>" +
          m.tn +
          "<small>cleared</small></td></tr></tbody>";
        k.ep(String(epoch));
        k.ll(fx(hist.length ? hist[hist.length - 1] : loss(), 3));
        k.rec(m.tp + m.fn ? pct(m.tp / (m.tp + m.fn)) : "–");
        k.prec(m.tp + m.fp ? pct(m.tp / (m.tp + m.fp)) : "–");
        var h = hist.length ? hist : [loss()];
        var g = frame(cv2, { x0: 0, x1: Math.max(10, h.length), y0: 0, y1: 0.75, ny: 3, l: 36, b: 24 });
        line(
          g,
          h.map(function (_, i) {
            return i + 1;
          }),
          h,
          c.ink,
          2
        );
      }
      takeaway(
        el0,
        "<p>The update rule is plain gradient descent: the gradient of log loss for each weight is the average of (predicted probability minus label) times that feature, so confident wrong answers pull hardest. The threshold is a separate business decision made after training. Common statistical ways to place it are Youden's J on the ROC curve (maximize recall minus false-alarm rate), the point on the precision-recall curve that maximizes F1, or the threshold that minimizes expected cost when a missed cancer costs far more than a false alarm.</p>"
      );
      return { draw: draw, stop: anim.stop };
    },
  });

  /* -------------------------------------------------- Week 4: missing data */
  WEEKS.push({
    week: 4,
    topic: "Missing data",
    short: "Imputation",
    title: "Missing data: mechanisms and imputation",
    question: "What are the tests to identify missing data patterns like MCAR, MAR and MNAR? Is there a set ratio for deleting a feature?",
    tryThis:
      "Pick a mechanism and an imputation method, then raise the missing share. Under MCAR almost anything is unbiased; under MAR only regression on age fixes the mean; under MNAR nothing in the data can fully fix it.",
    build: function (el0) {
      var seed = 11,
        N = 400,
        data;
      var mech = "mar",
        meth = "mean",
        rate = 0.3,
        showTrue = true;
      function gen() {
        var r = rng(seed),
          age = [],
          inc = [];
        for (var i = 0; i < N; i++) {
          var a = 20 + r() * 50;
          age.push(a);
          inc.push(18 + 0.95 * a + r.normal() * 11);
        }
        data = { age: age, inc: inc, u: age.map(r) };
      }
      function missing() {
        var mi = mean(data.inc),
          si = sd(data.inc);
        var score = data.age.map(function (a, i) {
          if (mech === "mcar") return 0;
          if (mech === "mar") return -(a - 45) / 8;
          return (data.inc[i] - mi) / (si / 2);
        });
        // shift so the average missing probability equals the chosen rate
        var lo = -20,
          hi = 20;
        for (var it = 0; it < 50; it++) {
          var mid = (lo + hi) / 2,
            m = mean(
              score.map(function (s) {
                return sigmoid(s + mid);
              })
            );
          if (m > rate) hi = mid;
          else lo = mid;
        }
        return score.map(function (s, i) {
          return data.u[i] < sigmoid(s + lo);
        });
      }
      var ctl = controls(el0);
      seg(ctl, {
        label: "Why income goes missing",
        value: mech,
        options: [
          ["mcar", "MCAR"],
          ["mar", "MAR (by age)"],
          ["mnar", "MNAR (by income)"],
        ],
        onChange: function (v) {
          mech = v;
          draw();
        },
      });
      select(ctl, {
        label: "Fix",
        value: meth,
        options: [
          ["drop", "Drop incomplete rows"],
          ["mean", "Mean imputation"],
          ["median", "Median imputation"],
          ["reg", "Regression on age"],
          ["sreg", "Regression + noise"],
        ],
        onChange: function (v) {
          meth = v;
          draw();
        },
      });
      slider(ctl, {
        label: "Share missing",
        min: 0.05,
        max: 0.8,
        step: 0.05,
        value: rate,
        fmt: pct,
        onInput: function (v) {
          rate = v;
          draw();
        },
      });
      var bt = buttons(el0);
      check(bt, "Show the hidden true values", true, function (v) {
        showTrue = v;
        draw();
      });
      button(bt, "New sample", function () {
        seed++;
        gen();
        draw();
      });
      var k = kpis(el0, [
        ["bias", "Error in mean income"],
        ["sdv", "Spread kept (SD)"],
        ["cor", "Age-income correlation"],
        ["test", "MCAR check (age gap)"],
      ]);
      var p = panel(el0, "Age vs income ($k)", "Income is missing for some people. Gray dots are observed; amber dots are filled in.");
      var lg = legend(p, [
        ["slate", "Observed"],
        ["amber", "Imputed"],
        ["rose", "True hidden value"],
      ]);
      var cv = canvas(p, { aspect: "16 / 8", label: "Scatter of age and income with imputed values" });
      gen();
      function draw() {
        var c = C(),
          miss = missing();
        var obsA = [],
          obsI = [],
          misA = [];
        for (var i = 0; i < N; i++) {
          if (miss[i]) misA.push(data.age[i]);
          else {
            obsA.push(data.age[i]);
            obsI.push(data.inc[i]);
          }
        }
        // regression on observed rows
        var ma = mean(obsA),
          mI = mean(obsI),
          sxy = 0,
          sxx = 0;
        for (var j = 0; j < obsA.length; j++) {
          sxy += (obsA[j] - ma) * (obsI[j] - mI);
          sxx += (obsA[j] - ma) * (obsA[j] - ma);
        }
        var slope = sxy / sxx,
          icpt = mI - slope * ma,
          resid = 0;
        for (j = 0; j < obsA.length; j++) resid += Math.pow(obsI[j] - (icpt + slope * obsA[j]), 2);
        var rsd = Math.sqrt(resid / Math.max(1, obsA.length - 2));
        var rr = rng(seed * 7 + 1),
          fillA = [],
          fillI = [],
          impA = [],
          impI = [],
          mdn = median(obsI);
        for (i = 0; i < N; i++) {
          if (!miss[i]) {
            fillA.push(data.age[i]);
            fillI.push(data.inc[i]);
            continue;
          }
          if (meth === "drop") continue;
          var v =
            meth === "mean"
              ? mI
              : meth === "median"
                ? mdn
                : meth === "reg"
                  ? icpt + slope * data.age[i]
                  : icpt + slope * data.age[i] + rr.normal() * rsd;
          fillA.push(data.age[i]);
          fillI.push(v);
          impA.push(data.age[i]);
          impI.push(v);
        }
        var tm = mean(data.inc),
          em = mean(fillI);
        k.bias((em - tm >= 0 ? "+" : "−") + "$" + Math.abs(em - tm).toFixed(1) + "k");
        k.sdv(pct(sd(fillI) / sd(data.inc), 0));
        k.cor(fx(corr(fillA, fillI), 2) + " (true " + fx(corr(data.age, data.inc), 2) + ")");
        // Welch t-test: do people with missing income differ in age?
        var t = (mean(misA) - mean(obsA)) / Math.sqrt(Math.pow(sd(misA), 2) / misA.length + Math.pow(sd(obsA), 2) / obsA.length);
        k.test(misA.length > 2 ? "t = " + fx(t, 1) + (Math.abs(t) > 2 ? ", not MCAR" : ", no sign") : "–");
        lg();
        var f = frame(cv, { x0: 18, x1: 72, y0: 10, y1: 110, xlabel: "Age", ylabel: "Income ($k)" });
        var ctx = f.ctx;
        for (i = 0; i < N; i++) {
          if (miss[i]) {
            if (showTrue) dot(ctx, f.sx(data.age[i]), f.sy(data.inc[i]), 3, null, alpha(c.rose, 0.7));
          } else dot(ctx, f.sx(data.age[i]), f.sy(data.inc[i]), 2.6, alpha(c.slate, 0.55));
        }
        for (i = 0; i < impA.length; i++) dot(ctx, f.sx(impA[i]), f.sy(impI[i]), 3, c.amber);
        ctx.strokeStyle = c.ink;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(f.sx(18), f.sy(tm));
        ctx.lineTo(f.sx(72), f.sy(tm));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = c.ink;
        ctx.textAlign = "left";
        ctx.fillText("true mean", f.sx(18) + 4, f.sy(tm) - 9);
      }
      takeaway(
        el0,
        "<p>There is no universal cutoff like 70% or 90%. What matters is why values are missing: MCAR loses precision but not accuracy, MAR is fixable by modeling the missingness from other columns, and MNAR biases every method that only sees the data. You can't prove MCAR, but you can reject it: compare observed columns between rows with and without the missing value (the t-test above), fit a model that predicts missingness, or run Little's MCAR test. Mean imputation also shrinks the spread and weakens correlations, which is why regression with noise or multiple imputation is usually preferred.</p>"
      );
      return { draw: draw };
    },
  });

  /* -------------------------------------------- Week 5: TF-IDF + clustering */
  var STOP =
    "a an and are as at be but by for from has have he her his in is it its of on or our she so that the their them they this to was were will with we you your i me my not no do does did can could would should than then there these those been being into about over after before again more most very just also".split(
      " "
    );
  WEEKS.push({
    week: 5,
    topic: "Text and clustering",
    short: "TF-IDF, k-means",
    title: "Bag of words, TF-IDF and k-means",
    question: "How do stop words and punctuation affect count vectorization? When would I use Euclidean over Manhattan distance?",
    tryThis:
      "Turn stop-word removal off and watch 'the' and 'and' take over the counts, then switch to TF-IDF to see them fade. Below, run k-means with each distance and compare the cluster shapes.",
    build: function (el0) {
      var p1 = panel(el0, "Bag of words vs TF-IDF", "One document per line. Edit freely.");
      var ta = add(p1, el("textarea", { class: "lab-text", rows: "5", "aria-label": "Documents, one per line" }));
      ta.value = [
        "The grid operator raised prices during the heat wave, and demand kept climbing.",
        "Solar output dropped in the evening and the operator called for conservation.",
        "The heat wave pushed demand to a new record on the grid!",
        "Prices fell overnight as wind output rose and demand eased.",
      ].join("\n");
      var ctl = controls(p1);
      var weight = "count",
        stop = true,
        lower = true;
      seg(ctl, {
        label: "Weighting",
        value: "count",
        options: [
          ["count", "Counts"],
          ["tfidf", "TF-IDF"],
        ],
        onChange: function (v) {
          weight = v;
          drawText();
        },
      });
      var bt = buttons(p1);
      check(bt, "Remove stop words", true, function (v) {
        stop = v;
        drawText();
      });
      check(bt, "Lowercase and strip punctuation", true, function (v) {
        lower = v;
        drawText();
      });
      var vocabNote = add(p1, el("p", { class: "dash-note lab-vocab" }));
      var wrapT = add(p1, el("div", { class: "lab-table-wrap" }));
      var tbl = add(wrapT, el("table", { class: "lab-tfidf" }));
      ta.addEventListener("input", drawText);
      function tokens(s) {
        var t = lower ? s.toLowerCase().replace(/[^a-z0-9\s']/g, " ") : s;
        return t.split(/\s+/).filter(function (w) {
          return w && (!stop || STOP.indexOf(w.toLowerCase().replace(/[^a-z']/g, "")) < 0);
        });
      }
      function drawText() {
        var docs = ta.value
          .split("\n")
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean)
          .slice(0, 6);
        var toks = docs.map(tokens),
          vocab = {},
          df = {};
        toks.forEach(function (t) {
          var seen = {};
          t.forEach(function (w) {
            vocab[w] = 1;
            if (!seen[w]) {
              df[w] = (df[w] || 0) + 1;
              seen[w] = 1;
            }
          });
        });
        var words = Object.keys(vocab),
          N = docs.length;
        var M = toks.map(function (t) {
          var cnt = {};
          t.forEach(function (w) {
            cnt[w] = (cnt[w] || 0) + 1;
          });
          var row = {};
          words.forEach(function (w) {
            var tf = cnt[w] || 0;
            row[w] = weight === "count" ? tf : (tf / Math.max(1, t.length)) * (Math.log((1 + N) / (1 + df[w])) + 1);
          });
          return row;
        });
        var score = {};
        words.forEach(function (w) {
          score[w] = Math.max.apply(
            null,
            M.map(function (r) {
              return r[w];
            })
          );
        });
        var top = words
          .sort(function (a, b) {
            return score[b] - score[a] || df[a] - df[b];
          })
          .slice(0, 12);
        var mx = Math.max.apply(
          null,
          top
            .map(function (w) {
              return score[w];
            })
            .concat([1e-9])
        );
        vocabNote.textContent = words.length + " distinct terms across " + N + " documents. Showing the 12 with the highest weight.";
        var c = C(),
          h = "<thead><tr><th>Term</th>";
        docs.forEach(function (_, i) {
          h += "<th>Doc " + (i + 1) + "</th>";
        });
        h += "<th>In docs</th></tr></thead><tbody>";
        top.forEach(function (w) {
          h += "<tr><th>" + w.replace(/</g, "&lt;") + "</th>";
          M.forEach(function (r) {
            var v = r[w];
            h +=
              "<td style='background:" +
              alpha(c.teal, (0.75 * v) / mx) +
              "'>" +
              (v ? (weight === "count" ? v : v.toFixed(2)) : "<span class='zero'>0</span>") +
              "</td>";
          });
          h += "<td>" + df[w] + "</td></tr>";
        });
        tbl.innerHTML = h + "</tbody>";
      }

      // k-means
      var p2 = panel(
        el0,
        "k-means with two distances",
        "Euclidean measures straight-line distance and updates centers with the mean; Manhattan sums the axis gaps and updates with the median (k-medians). Outlines show each cluster's typical reach."
      );
      var ctl2 = controls(p2);
      var K = 3,
        metric = "euclid",
        seed = 5,
        P = [],
        cent = [],
        assign = [],
        iters = 0;
      slider(ctl2, {
        label: "k",
        min: 2,
        max: 6,
        value: 3,
        onInput: function (v) {
          K = v;
          initCent();
          drawK();
        },
      });
      seg(ctl2, {
        label: "Distance",
        value: "euclid",
        options: [
          ["euclid", "Euclidean"],
          ["manhattan", "Manhattan"],
        ],
        onChange: function (v) {
          metric = v;
          initCent();
          drawK();
        },
      });
      var bt2 = buttons(p2);
      button(
        bt2,
        "Step",
        function () {
          kstep();
          drawK();
        },
        true
      );
      button(bt2, "Run to convergence", function () {
        for (var i = 0; i < 50 && kstep(); i++);
        drawK();
      });
      button(bt2, "New centers", function () {
        seed += 13;
        initCent();
        drawK();
      });
      button(bt2, "New data", function () {
        seed += 7;
        genP();
        initCent();
        drawK();
      });
      var kk = kpis(p2, [
        ["it", "Iterations"],
        ["in", "Total distance to center"],
      ]);
      var cvk = canvas(p2, { aspect: "16 / 9", maxWidth: 760, label: "k-means clustering scatter" });
      function dist(a, b) {
        return metric === "euclid" ? Math.hypot(a[0] - b[0], a[1] - b[1]) : Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
      }
      function genP() {
        var r = rng(seed),
          centers = [
            [-0.5, 0.45],
            [0.5, 0.4],
            [0.05, -0.5],
            [0.65, -0.55],
          ];
        P = [];
        for (var i = 0; i < 160; i++) {
          var cc = centers[i % 4],
            sp = i % 4 === 3 ? 0.08 : 0.17;
          P.push([clamp(cc[0] + r.normal() * sp * 1.3, -0.98, 0.98), clamp(cc[1] + r.normal() * sp, -0.98, 0.98)]);
        }
        for (i = 0; i < 6; i++) P.push([r() * 1.9 - 0.95, r() * 1.9 - 0.95]);
      }
      function initCent() {
        var r = rng(seed * 3 + K);
        cent = [];
        for (var i = 0; i < K; i++) cent.push(P[Math.floor(r() * P.length)].slice());
        assign = P.map(function () {
          return -1;
        });
        iters = 0;
        doAssign();
      }
      function doAssign() {
        var changed = false;
        P.forEach(function (p, i) {
          var best = 0,
            bd = 1e9;
          cent.forEach(function (c, j) {
            var dd = dist(p, c);
            if (dd < bd) {
              bd = dd;
              best = j;
            }
          });
          if (assign[i] !== best) changed = true;
          assign[i] = best;
        });
        return changed;
      }
      function kstep() {
        cent = cent.map(function (c, j) {
          var xs = [],
            ys = [];
          P.forEach(function (p, i) {
            if (assign[i] === j) {
              xs.push(p[0]);
              ys.push(p[1]);
            }
          });
          if (!xs.length) return c;
          return metric === "euclid" ? [mean(xs), mean(ys)] : [median(xs), median(ys)];
        });
        iters++;
        return doAssign();
      }
      genP();
      initCent();
      function drawK() {
        var c = C(),
          pl = pal();
        var f = frame(cvk, { x0: -1, x1: 1, y0: -1, y1: 1, axes: false, l: 8, r: 8, t: 8, b: 8 });
        var ctx = f.ctx,
          tot = 0;
        var sc = Math.min(f.sx(1) - f.sx(0), f.sy(0) - f.sy(1));
        cent.forEach(function (ce, j) {
          var dd = [];
          P.forEach(function (p, i) {
            if (assign[i] === j) dd.push(dist(p, ce));
          });
          if (!dd.length) return;
          var rad = median(dd) * sc,
            X = f.sx(ce[0]),
            Y = f.sy(ce[1]);
          ctx.strokeStyle = alpha(pl[j], 0.7);
          ctx.fillStyle = alpha(pl[j], 0.07);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (metric === "euclid") ctx.arc(X, Y, rad, 0, 2 * Math.PI);
          else {
            ctx.moveTo(X, Y - rad);
            ctx.lineTo(X + rad, Y);
            ctx.lineTo(X, Y + rad);
            ctx.lineTo(X - rad, Y);
            ctx.closePath();
          }
          ctx.fill();
          ctx.stroke();
        });
        P.forEach(function (p, i) {
          tot += dist(p, cent[assign[i]]);
          dot(ctx, f.sx(p[0]), f.sy(p[1]), 3.4, pl[assign[i]]);
        });
        cent.forEach(function (ce, j) {
          var X = f.sx(ce[0]),
            Y = f.sy(ce[1]);
          ctx.strokeStyle = c.bg;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(X - 8, Y - 8);
          ctx.lineTo(X + 8, Y + 8);
          ctx.moveTo(X + 8, Y - 8);
          ctx.lineTo(X - 8, Y + 8);
          ctx.stroke();
          ctx.strokeStyle = c.ink;
          ctx.lineWidth = 3;
          ctx.stroke();
        });
        kk.it(String(iters));
        kk.in(fx(tot, 1));
      }
      drawText();
      takeaway(
        el0,
        "<p>Raw counts reward frequent words, so stop words and stray punctuation tokens dominate the vectors and make every document look alike. TF-IDF divides that out by down-weighting terms found in many documents, but it still treats 'raised' and 'climbing' as unrelated: synonyms and metaphors need embeddings, not counts. For clustering, Euclidean suits dense, comparable numeric features and round clusters; Manhattan is less sensitive to a single large gap and pairs naturally with medians, so it holds up better with outliers, grid-like movement or high-dimensional sparse data.</p>"
      );
      return {
        draw: function () {
          drawText();
          drawK();
        },
      };
    },
  });

  /* ---------------------------------------------------- Week 6: Naive Bayes */
  WEEKS.push({
    week: 6,
    topic: "Naive Bayes",
    short: "Bayes rule",
    title: "Bayes rule as a spam filter",
    question: "Why does the naive part of Naive Bayes assume all features are independent of each other?",
    tryThis:
      "Set how common spam is and how often the word 'free' shows up in spam and normal mail. Then add a second word and see the naive assumption multiply the evidence together.",
    needsData: true,
    build: function (el0) {
      var st = { prior: 0.2, a1: 0.6, b1: 0.05, two: false, a2: 0.4, b2: 0.1 };
      var ctl = controls(el0);
      function sl(key, label, min, max, step) {
        return slider(ctl, {
          label: label,
          min: min,
          max: max,
          step: step,
          value: st[key],
          fmt: function (v) {
            return pct(v, v < 0.1 ? 1 : 0);
          },
          onInput: function (v) {
            st[key] = v;
            draw();
          },
        });
      }
      sl("prior", "Emails that are spam", 0.01, 0.6, 0.01);
      sl("a1", "'free' appears in spam", 0.05, 0.99, 0.01);
      sl("b1", "'free' appears in normal mail", 0.005, 0.5, 0.005);
      var s2 = [];
      var bt = buttons(el0);
      check(bt, "Add a second word: 'winner'", false, function (v) {
        st.two = v;
        s2.forEach(function (s) {
          s.el.hidden = !v;
        });
        draw();
      });
      var ctl2 = controls(el0);
      s2.push(
        slider(ctl2, {
          label: "'winner' appears in spam",
          min: 0.05,
          max: 0.99,
          step: 0.01,
          value: st.a2,
          fmt: function (v) {
            return pct(v, 0);
          },
          onInput: function (v) {
            st.a2 = v;
            draw();
          },
        })
      );
      s2.push(
        slider(ctl2, {
          label: "'winner' appears in normal mail",
          min: 0.005,
          max: 0.5,
          step: 0.005,
          value: st.b2,
          fmt: function (v) {
            return pct(v, 1);
          },
          onInput: function (v) {
            st.b2 = v;
            draw();
          },
        })
      );
      s2.forEach(function (s) {
        s.el.hidden = true;
      });
      var k = kpis(el0, [
        ["post", "P(spam | words seen)"],
        ["lr", "Evidence multiplier"],
        ["tp", "Spam caught per 1,000"],
        ["fp", "Normal mail flagged per 1,000"],
      ]);
      var grid = add(el0, el("div", { class: "lab-grid" }));
      var p1 = panel(grid, "1,000 emails", "Every square is one email. The flagged ones are those containing the word(s).");
      var lg = legend(p1, [
        ["teal", "Spam, flagged"],
        ["amber", "Normal, flagged"],
        ["rose", "Spam, missed"],
        ["slate", "Normal, not flagged"],
      ]);
      var cv = canvas(p1, { aspect: "40 / 26", label: "Grid of 1,000 emails colored by outcome" });
      var p2 = panel(
        grid,
        "My notebook: digits, test accuracy",
        "load_digits, 25% test split (random_state 0), same models as my Week 6 class work."
      );
      var cv2 = canvas(p2, { height: 220, label: "Bar chart of Naive Bayes and logistic regression accuracy on digits" });
      function draw() {
        var c = C();
        lg();
        var ls = st.a1 * (st.two ? st.a2 : 1),
          ln = st.b1 * (st.two ? st.b2 : 1);
        var pS = st.prior * ls,
          pN = (1 - st.prior) * ln,
          post = pS / (pS + pN);
        k.post(pct(post));
        k.lr("×" + (ls / ln).toFixed(ls / ln < 10 ? 1 : 0));
        var tp = Math.round(1000 * pS),
          fp = Math.round(1000 * pN),
          spam = Math.round(1000 * st.prior);
        k.tp(tp + " of " + spam);
        k.fp(fp + " of " + (1000 - spam));
        var P = prep(cv),
          ctx = P.ctx,
          cols = 40,
          rows = 25,
          cw = P.w / cols,
          ch = P.h / rows;
        for (var i = 0; i < 1000; i++) {
          var col;
          if (i < tp) col = c.teal;
          else if (i < spam) col = c.rose;
          else if (i < spam + fp) col = c.amber;
          else col = alpha(c.slate, 0.25);
          var x = i % cols,
            y = Math.floor(i / cols);
          ctx.fillStyle = col;
          ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
        }
        var r = DATA.w6.slice().sort(function (a, b) {
          return b[1] - a[1];
        });
        var f = frame(cv2, {
          x0: 0.75,
          x1: 1,
          y0: 0,
          y1: r.length,
          l: 130,
          yticks: [],
          xfmt: function (t) {
            return Math.round(t * 100) + "%";
          },
          b: 26,
        });
        r.forEach(function (row, j) {
          var y = f.sy(r.length - j - 0.5),
            bh = (f.sy(0) - f.sy(1)) * 0.62;
          f.ctx.fillStyle = row[0] === "Logistic regression" ? c.ink : c.teal;
          f.ctx.fillRect(f.L, y - bh / 2, f.sx(row[1]) - f.L, bh);
          f.ctx.textAlign = "right";
          f.ctx.fillStyle = c.ink;
          f.ctx.fillText(row[0], f.L - 8, y);
          f.ctx.textAlign = "left";
          f.ctx.fillStyle = c.muted;
          var lbl = pct(row[1]);
          f.ctx.fillText(lbl, Math.min(f.sx(row[1]) + 6, f.w - 46), y);
        });
      }
      takeaway(
        el0,
        "<p>Bayes rule needs P(words | spam). With many words, estimating every combination would need astronomically more data, so Naive Bayes assumes the words are independent given the class and simply multiplies one probability per word. That is almost never true ('free' and 'winner' travel together), so it double-counts evidence and its probabilities come out overconfident, which is also why it doesn't minimize log loss the way logistic regression does: it fits each feature's distribution separately instead of optimizing predictions directly. The ranking it produces is still often good. On my digits run, logistic regression (the discriminative partner) beat every Naive Bayes variant, while Categorical and Multinomial NB came within about 4 points.</p>"
      );
      return { draw: draw };
    },
  });

  /* ------------------------------------------------- Week 7: trees, forests */
  WEEKS.push({
    week: 7,
    topic: "Trees and random forests",
    short: "Gini, entropy",
    title: "Choose a split, then grow a forest",
    question: "How does Gini impurity handle multi-class classification? Is there a rule of thumb for how many sub-models to use in bagging?",
    tryThis:
      "Slide the split line across a three-class dataset and watch Gini and entropy fall on each side. Find best split searches every threshold. Below, see how fast accuracy flattens as trees are added.",
    needsData: true,
    build: function (el0) {
      var r = rng(21),
        P = [],
        Y = [];
      var centers = [
        [-0.45, 0.35],
        [0.35, 0.45],
        [0.1, -0.45],
      ];
      for (var i = 0; i < 150; i++) {
        var y = i % 3;
        P.push([clamp(centers[y][0] + r.normal() * 0.28, -0.98, 0.98), clamp(centers[y][1] + r.normal() * 0.26, -0.98, 0.98)]);
        Y.push(y);
      }
      var axis = 0,
        crit = "gini";
      var ctl = controls(el0);
      var thS = slider(ctl, {
        label: "Split at",
        min: -0.95,
        max: 0.95,
        step: 0.01,
        value: 0,
        fmt: function (v) {
          return v.toFixed(2);
        },
        onInput: function () {
          draw();
        },
      });
      seg(ctl, {
        label: "Feature",
        value: 0,
        options: [
          [0, "x₁ (vertical line)"],
          [1, "x₂ (horizontal line)"],
        ],
        onChange: function (v) {
          axis = +v;
          draw();
        },
      });
      seg(ctl, {
        label: "Criterion",
        value: "gini",
        options: [
          ["gini", "Gini"],
          ["entropy", "Entropy"],
        ],
        onChange: function (v) {
          crit = v;
          draw();
        },
      });
      var bt = buttons(el0);
      button(
        bt,
        "Find best split",
        function () {
          var best = null;
          [0, 1].forEach(function (a) {
            for (var t = -0.95; t <= 0.95; t += 0.01) {
              var g = gain(a, t);
              if (!best || g > best.g) best = { a: a, t: t, g: g };
            }
          });
          axis = best.a;
          thS.set(best.t.toFixed(2));
          var radios = el0.querySelectorAll("input[type=radio]");
          radios[best.a].checked = true;
          draw();
        },
        true
      );
      function counts(idx) {
        var c = [0, 0, 0];
        idx.forEach(function (i) {
          c[Y[i]]++;
        });
        return c;
      }
      function gini(c) {
        var n = c[0] + c[1] + c[2];
        if (!n) return 0;
        return (
          1 -
          c.reduce(function (s, v) {
            return s + (v / n) * (v / n);
          }, 0)
        );
      }
      function ent(c) {
        var n = c[0] + c[1] + c[2];
        if (!n) return 0;
        return -c.reduce(function (s, v) {
          return v ? s + (v / n) * Math.log2(v / n) : s;
        }, 0);
      }
      function imp(c) {
        return crit === "gini" ? gini(c) : ent(c);
      }
      function sides(a, t) {
        var L = [],
          R = [];
        P.forEach(function (p, i) {
          (p[a] <= t ? L : R).push(i);
        });
        return [L, R];
      }
      function gain(a, t) {
        var s = sides(a, t),
          all = counts(
            P.map(function (_, i) {
              return i;
            })
          );
        var cl = counts(s[0]),
          cr = counts(s[1]),
          n = P.length;
        return imp(all) - (s[0].length / n) * imp(cl) - (s[1].length / n) * imp(cr);
      }
      var k = kpis(el0, [
        ["par", "Parent impurity"],
        ["left", "Left side"],
        ["right", "Right side"],
        ["gain", "Impurity drop (gain)"],
      ]);
      var grid = add(el0, el("div", { class: "lab-grid" }));
      var p1 = panel(grid, "Three classes, one split");
      var lg = legend(p1, [
        ["teal", "Class A"],
        ["amber", "Class B"],
        ["rose", "Class C"],
      ]);
      var cv = canvas(p1, { aspect: "1 / 1", maxWidth: 520, label: "Three-class scatter with a split line" });
      var cnt = add(p1, el("p", { class: "dash-note lab-counts" }));
      var p2 = panel(
        grid,
        "My notebook: digits, accuracy vs number of trees",
        "5-fold cross-validation on load_digits, the dataset from my Week 7 code."
      );
      var lg2 = legend(p2, [
        ["teal", "Random forest"],
        ["amber", "Bagged trees"],
      ]);
      var cv2 = canvas(p2, { aspect: "4 / 3", label: "Line chart of accuracy against number of trees" });
      var note2 = add(p2, el("p", { class: "dash-note" }));
      function draw() {
        var c = C(),
          pl = [c.teal, c.amber, c.rose],
          t = thS.get();
        lg();
        lg2();
        var f = frame(cv, { x0: -1, x1: 1, y0: -1, y1: 1, nx: 4, ny: 4, l: 34, b: 26, xfmt: fx1, yfmt: fx1 });
        function fx1(v) {
          return v.toFixed(1);
        }
        var ctx = f.ctx;
        ctx.fillStyle = alpha(c.slate, 0.08);
        if (axis === 0) ctx.fillRect(f.sx(-1), f.sy(1), f.sx(t) - f.sx(-1), f.sy(-1) - f.sy(1));
        else ctx.fillRect(f.sx(-1), f.sy(t), f.sx(1) - f.sx(-1), f.sy(-1) - f.sy(t));
        P.forEach(function (p, i) {
          dot(ctx, f.sx(p[0]), f.sy(p[1]), 4, pl[Y[i]]);
        });
        ctx.strokeStyle = c.ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (axis === 0) {
          ctx.moveTo(f.sx(t), f.sy(1));
          ctx.lineTo(f.sx(t), f.sy(-1));
        } else {
          ctx.moveTo(f.sx(-1), f.sy(t));
          ctx.lineTo(f.sx(1), f.sy(t));
        }
        ctx.stroke();
        var s = sides(axis, t),
          cl = counts(s[0]),
          cr = counts(s[1]),
          all = counts(
            P.map(function (_, i) {
              return i;
            })
          );
        k.par(fx(imp(all), 3) + (crit === "entropy" ? " bits" : ""));
        k.left(fx(imp(cl), 3) + " (n=" + s[0].length + ")");
        k.right(fx(imp(cr), 3) + " (n=" + s[1].length + ")");
        k.gain(fx(gain(axis, t), 3));
        cnt.textContent =
          (axis === 0 ? "Left" : "Below") +
          ": A " +
          cl[0] +
          ", B " +
          cl[1] +
          ", C " +
          cl[2] +
          ". " +
          (axis === 0 ? "Right" : "Above") +
          ": A " +
          cr[0] +
          ", B " +
          cr[1] +
          ", C " +
          cr[2] +
          ". With 3 classes Gini tops out at 0.667 and entropy at 1.585 bits (log₂3).";
        var d = DATA.w7,
          g = frame(cv2, {
            x0: 1,
            x1: 200,
            xlog: true,
            y0: 0.7,
            y1: 0.96,
            xticks: [1, 2, 5, 10, 20, 50, 100, 200],
            xfmt: String,
            yfmt: function (v) {
              return Math.round(v * 100) + "%";
            },
            xlabel: "Number of trees (log scale)",
          });
        line(g, d.n, d.rf, c.teal, 2.5);
        line(g, d.n, d.bag, c.amber, 2.5);
        d.n.forEach(function (n, i) {
          dot(g.ctx, g.sx(n), g.sy(d.rf[i]), 3, c.teal);
          dot(g.ctx, g.sx(n), g.sy(d.bag[i]), 3, c.amber);
        });
        var mx = Math.max.apply(null, d.rf),
          need =
            d.n[
              d.rf.findIndex(function (v) {
                return v >= mx - 0.005;
              })
            ];
        note2.textContent =
          "The forest reaches within half a point of its best (" +
          pct(mx) +
          ") by " +
          need +
          " trees. Bagging plateaus about 3 points lower because its trees are more alike.";
      }
      takeaway(
        el0,
        "<p>Gini handles many classes the same way it handles two: one minus the sum of squared class shares, so a pure node scores 0 and the maximum grows toward 1 as classes are added. Entropy uses log base 2 so the answer is in bits, the number of yes/no questions needed to identify the class; any base gives the same splits. A tree chooses boundaries greedily by trying every threshold on every feature, as the button does. For bagging there is no magic number, but the curve flattens fast: add trees until out-of-bag or cross-validated accuracy stops improving, often 50 to 200. Random forests beat plain bagging because random feature subsets make the trees disagree, and averaging works best on models that make different mistakes.</p>"
      );
      return { draw: draw };
    },
  });

  /* ----------------------------------------------------- Week 8: boosting */
  WEEKS.push({
    week: 8,
    topic: "Boosting and XGBoost",
    short: "XGBoost tuning",
    title: "Tune XGBoost on a budget",
    question: "How are hyperparameters tuned in industry settings where less time and fewer resources are prioritized over accuracy?",
    tryThis:
      "Pick a tree depth and learning rate (eta), or tap a cell in the grid. The curve shows accuracy after every boosting round, and the early-stopping marker shows how many rounds you could skip.",
    needsData: true,
    build: function (el0) {
      var G = DATA.w8,
        md = 2,
        eta = 0.3;
      var depths = [1, 2, 3, 4, 6],
        etas = [0.1, 0.3, 0.5, 1.0];
      var ctl = controls(el0);
      var sD = seg(ctl, {
        label: "Max depth",
        value: 2,
        options: depths.map(function (d) {
          return [d, String(d)];
        }),
        onChange: function (v) {
          md = +v;
          draw();
        },
      });
      var sE = seg(ctl, {
        label: "Learning rate (eta)",
        value: 0.3,
        options: etas.map(function (e) {
          return [e, String(e)];
        }),
        onChange: function (v) {
          eta = +v;
          draw();
        },
      });
      var k = kpis(el0, [
        ["fin", "Test accuracy, 60 rounds"],
        ["best", "Best round"],
        ["stop", "Early stop (within 0.5 pt)"],
        ["save", "Compute saved"],
      ]);
      var grid = add(el0, el("div", { class: "lab-grid" }));
      var p1 = panel(grid, "Accuracy by boosting round", "Digits, same split as my Week 8 live-session code, multi:softmax.");
      var lg = legend(p1, [
        ["teal", "Test"],
        ["slate", "Train"],
      ]);
      var cv = canvas(p1, { aspect: "4 / 3", label: "Train and test accuracy by boosting round" });
      var p2 = panel(grid, "Final test accuracy, every setting", "Tap a cell to load it.");
      var tbl = add(p2, el("table", { class: "lab-heat" }));
      function key(d, e) {
        return d + "_" + (e === 1 ? "1.0" : String(e));
      }
      function setRadio(segObj, v) {
        var ins = segObj.el.querySelectorAll("input");
        ins.forEach(function (i) {
          i.checked = +i.value === v;
        });
      }
      function draw() {
        var c = C(),
          g = G[key(md, eta)];
        lg();
        var best = Math.max.apply(null, g.test),
          bi = g.test.indexOf(best);
        var stop = g.test.findIndex(function (v) {
          return v >= best - 0.005;
        });
        k.fin(pct(g.test[g.test.length - 1]));
        k.best(String(bi + 1) + " (" + pct(best) + ")");
        k.stop("round " + (stop + 1));
        k.save(pct(1 - (stop + 1) / 60, 0));
        var xs = g.test.map(function (_, i) {
          return i + 1;
        });
        var f = frame(cv, {
          x0: 1,
          x1: 60,
          y0: 0.5,
          y1: 1,
          yfmt: function (v) {
            return Math.round(v * 100) + "%";
          },
          xlabel: "Boosting round",
        });
        line(f, xs, g.train, c.slate, 2, [5, 4]);
        line(f, xs, g.test, c.teal, 2.5);
        var X = f.sx(stop + 1);
        f.ctx.strokeStyle = c.ink;
        f.ctx.setLineDash([3, 4]);
        f.ctx.beginPath();
        f.ctx.moveTo(X, f.T);
        f.ctx.lineTo(X, f.h - f.B);
        f.ctx.stroke();
        f.ctx.setLineDash([]);
        f.ctx.fillStyle = c.ink;
        f.ctx.textAlign = X > f.w - 110 ? "right" : "left";
        f.ctx.fillText("stop here", X + (X > f.w - 110 ? -6 : 6), f.T + 10);
        // heat table
        var vals = [];
        depths.forEach(function (d) {
          etas.forEach(function (e) {
            var t = G[key(d, e)].test;
            vals.push(t[t.length - 1]);
          });
        });
        var lo = Math.min.apply(null, vals),
          hi = Math.max.apply(null, vals);
        var h = "<thead><tr><th>depth \\ eta</th>";
        etas.forEach(function (e) {
          h += "<th>" + e + "</th>";
        });
        h += "</tr></thead><tbody>";
        depths.forEach(function (d) {
          h += "<tr><th>" + d + "</th>";
          etas.forEach(function (e) {
            var t = G[key(d, e)].test,
              v = t[t.length - 1];
            var on = d === md && e === eta;
            h +=
              "<td><button type='button' data-d='" +
              d +
              "' data-e='" +
              e +
              "' aria-pressed='" +
              on +
              "' style='background:" +
              alpha(c.teal, 0.12 + (0.6 * (v - lo)) / (hi - lo || 1)) +
              "'>" +
              pct(v) +
              "</button></td>";
          });
          h += "</tr>";
        });
        tbl.innerHTML = h + "</tbody>";
        tbl.querySelectorAll("button").forEach(function (b) {
          b.addEventListener("click", function () {
            md = +b.getAttribute("data-d");
            eta = +b.getAttribute("data-e");
            setRadio(sD, md);
            setRadio(sE, eta);
            draw();
          });
        });
      }
      takeaway(
        el0,
        "<p>Boosting builds shallow trees one after another, each fixing the last one's errors, so it attacks bias; bagging averages deep independent trees, so it attacks variance. On a budget, teams rarely grid-search everything: they fix a sensible depth, use a moderate learning rate with early stopping (most settings here could stop well before 60 rounds), then run a small random or Bayesian search (Optuna, Hyperband) on a data sample. Note how depth 1 trees need many more rounds, while a high eta gets there fast but can overshoot.</p>"
      );
      return { draw: draw };
    },
  });

  /* --------------------------------------------------------- Week 9: SVM */
  WEEKS.push({
    week: 9,
    topic: "Support vector machines",
    short: "Kernels",
    title: "Kernel SVM playground",
    question: "How do I choose the right kernel function (linear, polynomial, RBF or sigmoid) for a given dataset?",
    tryThis:
      "Try a linear kernel on the circles data and watch it fail, then switch to RBF. Raise C to hug the training points; raise gamma to make the boundary wiggle. Tap the plot to add your own points.",
    build: function (el0) {
      var kind = "circles",
        kern = "rbf",
        Cval = 1,
        gamma = 2,
        addCls = 1,
        D,
        model = null;
      var ctl = controls(el0);
      select(ctl, {
        label: "Data",
        value: kind,
        options: [
          ["blobs", "Two blobs"],
          ["circles", "Circles"],
          ["xor", "XOR"],
          ["moons", "Moons"],
        ],
        onChange: function (v) {
          kind = v;
          D = toy(kind, 90, 9);
          train();
        },
      });
      select(ctl, {
        label: "Kernel",
        value: kern,
        options: [
          ["linear", "Linear"],
          ["poly", "Polynomial (degree 3)"],
          ["rbf", "RBF (Gaussian)"],
          ["sigmoid", "Sigmoid"],
        ],
        onChange: function (v) {
          kern = v;
          train();
        },
      });
      slider(ctl, {
        label: "C",
        min: -2,
        max: 2,
        step: 0.1,
        value: 0,
        fmt: function (v) {
          return String(+Math.pow(10, v).toPrecision(2));
        },
        onInput: function (v) {
          Cval = Math.pow(10, v);
          train();
        },
      });
      slider(ctl, {
        label: "gamma",
        min: -1,
        max: 1.3,
        step: 0.05,
        value: 0.3,
        fmt: function (v) {
          return String(+Math.pow(10, v).toPrecision(2));
        },
        onInput: function (v) {
          gamma = Math.pow(10, v);
          train();
        },
      });
      var bt = buttons(el0);
      seg(bt, {
        label: "Tap adds",
        value: 1,
        options: [
          [1, "Teal point"],
          [0, "Amber point"],
        ],
        onChange: function (v) {
          addCls = +v;
        },
      });
      button(bt, "Reset data", function () {
        D = toy(kind, 90, 9);
        train();
      });
      var k = kpis(el0, [
        ["acc", "Training accuracy"],
        ["sv", "Support vectors"],
        ["k", "Kernel evals per prediction"],
      ]);
      var grid = add(el0, el("div", { class: "lab-grid" }));
      var p1 = panel(
        grid,
        "Decision boundary",
        "Shading shows the side; the dark line is the boundary and dashed lines the margin. Ringed points are support vectors."
      );
      var cv = canvas(p1, { aspect: "1 / 1", maxWidth: 560, label: "SVM decision boundary on 2D data" });
      var p2 = panel(grid, "Hinge loss vs other losses", "Loss for one point as a function of its margin y·f(x). Positive means correct side.");
      var lg = legend(p2, [
        ["ink", "Hinge (SVM)"],
        ["teal", "Log loss (logistic)"],
        ["amber", "Squared error"],
        ["slate", "0-1 loss"],
      ]);
      var cv2 = canvas(p2, { aspect: "4 / 3", label: "Hinge, log, squared and zero-one loss curves" });
      cv.addEventListener("click", function (e) {
        var r = cv.getBoundingClientRect(),
          f = frame(cv, { x0: -1, x1: 1, y0: -1, y1: 1, axes: false, l: 8, r: 8, t: 8, b: 8 });
        var x = f.ix(e.clientX - r.left),
          y = f.iy(e.clientY - r.top);
        if (Math.abs(x) > 1 || Math.abs(y) > 1) return;
        D.X.push([x, y]);
        D.Y.push(addCls);
        train();
      });
      function K(a, b) {
        var dot2 = a[0] * b[0] + a[1] * b[1];
        if (kern === "linear") return dot2;
        if (kern === "poly") return Math.pow(gamma * dot2 + 1, 3);
        if (kern === "sigmoid") return Math.tanh(gamma * dot2 + 0.0);
        var dx = a[0] - b[0],
          dy = a[1] - b[1];
        return Math.exp(-gamma * (dx * dx + dy * dy));
      }
      // kernelized Pegasos (bias absorbed by adding 1 to the kernel)
      function train() {
        var n = D.X.length,
          lam = 1 / (Cval * n),
          T = 60 * n,
          al = new Float64Array(n),
          r = rng(42);
        var Km = [];
        for (var i = 0; i < n; i++) {
          Km.push(new Float64Array(n));
          for (var j = 0; j < n; j++) Km[i][j] = K(D.X[i], D.X[j]) + 1;
        }
        var y = D.Y.map(function (v) {
          return v ? 1 : -1;
        });
        for (var t = 1; t <= T; t++) {
          var it = Math.floor(r() * n),
            s = 0;
          for (j = 0; j < n; j++) if (al[j]) s += al[j] * y[j] * Km[it][j];
          if ((y[it] * s) / (lam * t) < 1) al[it]++;
        }
        model = { al: al, y: y, scale: 1 / (lam * T) };
        draw();
      }
      function F(p) {
        var s = 0;
        for (var j = 0; j < D.X.length; j++) if (model.al[j]) s += model.al[j] * model.y[j] * (K(D.X[j], p) + 1);
        return s * model.scale;
      }
      D = toy(kind, 90, 9);
      function draw() {
        if (!model) return train();
        var c = C(),
          tC = rgb(c.teal),
          aC = rgb(c.amber);
        var f = frame(cv, { x0: -1, x1: 1, y0: -1, y1: 1, axes: false, l: 8, r: 8, t: 8, b: 8 });
        var res = 56,
          vals = [];
        heat(f, res, res, -1, 1, -1, 1, function (x, y) {
          var v = F([x, y]);
          vals.push(v);
          var a = Math.min(0.42, 0.14 + Math.abs(v) * 0.2),
            col = v > 0 ? tC : aC;
          return [col[0], col[1], col[2], Math.round(a * 255)];
        });
        // boundary and margins by scanning the grid
        var ctx = f.ctx,
          step = 2 / 90;
        [0, 1, -1].forEach(function (lvl) {
          ctx.fillStyle = lvl ? alpha(c.ink, 0.45) : c.ink;
          for (var gx = -1; gx < 1; gx += step)
            for (var gy = -1; gy < 1; gy += step) {
              var v1 = F([gx, gy]) - lvl,
                v2 = F([gx + step, gy]) - lvl,
                v3 = F([gx, gy + step]) - lvl;
              if (v1 * v2 < 0 || v1 * v3 < 0) {
                if (lvl && Math.round((gx + gy) / step) % 3) continue;
                ctx.fillRect(f.sx(gx) - (lvl ? 0.8 : 1.2), f.sy(gy) - (lvl ? 0.8 : 1.2), lvl ? 1.6 : 2.4, lvl ? 1.6 : 2.4);
              }
            }
        });
        var right = 0,
          sv = 0;
        D.X.forEach(function (p, i) {
          var v = F(p),
            y = D.Y[i] ? 1 : -1,
            isSV = y * v <= 1.0001;
          if (v * y > 0) right++;
          if (isSV) sv++;
          dot(ctx, f.sx(p[0]), f.sy(p[1]), 4.2, D.Y[i] ? c.teal : c.amber, isSV ? c.ink : c.bg);
        });
        k.acc(pct(right / D.X.length));
        k.sv(sv + " of " + D.X.length);
        k.k(
          String(
            model.al.filter(function (a) {
              return a > 0;
            }).length
          )
        );
        lg();
        var g = frame(cv2, { x0: -2, x1: 3, y0: 0, y1: 4, xlabel: "Margin y·f(x)" });
        var xs = [],
          hi = [],
          lo = [],
          sq = [],
          z1 = [];
        for (var m = -2; m <= 3.0001; m += 0.02) {
          xs.push(m);
          hi.push(Math.max(0, 1 - m));
          lo.push(Math.log2(1 + Math.exp(-m)));
          sq.push(Math.min(4.5, (1 - m) * (1 - m)));
          z1.push(m < 0 ? 1 : 0);
        }
        line(g, xs, z1, c.slate, 2, [4, 4]);
        line(g, xs, sq, c.amber, 2);
        line(g, xs, lo, c.teal, 2);
        line(g, xs, hi, c.ink, 2.5);
      }
      takeaway(
        el0,
        "<p>Start linear when you have many features relative to rows (text, for example): it is fast and the data is often already separable. Switch to RBF as the default nonlinear choice, tuning C and gamma together with cross-validation. Polynomial suits interactions of a known degree, and the sigmoid kernel is rarely the best pick. Hinge loss is zero once a point is past the margin, so only the points near the boundary (support vectors) shape the model, while log loss keeps nudging every point and squared error even punishes being too right. The cost: training compares every pair of points, O(n²) kernel values, so 10× more data means about 100× more work.</p>"
      );
      return { draw: draw };
    },
  });

  /* ---------------------------------------------------------- Week 10: SGD */
  WEEKS.push({
    week: 10,
    topic: "Large data and SGD",
    short: "SGD, hashing",
    title: "Batch, mini-batch and stochastic gradient descent",
    question: "How can we reduce the variance generated from sampling the data into batches in SGD? What learning rate techniques are common?",
    tryThis:
      "Press Run and compare the three paths across the loss surface. Raise the batch size to calm the noisy path, or switch the schedule to a decay so SGD settles instead of bouncing. Below, see how the hashing trick fits any vocabulary into a fixed number of columns.",
    build: function (el0) {
      var r0 = rng(17),
        n = 200,
        X = [],
        Yv = [];
      for (var i = 0; i < n; i++) {
        var x = 2 + r0.normal();
        X.push(x);
        Yv.push(1.5 * x - 1 + r0.normal() * 0.8);
      }
      var Sx = mean(X),
        Sy = mean(Yv),
        Sxx = mean(
          X.map(function (v) {
            return v * v;
          })
        ),
        Syy = mean(
          Yv.map(function (v) {
            return v * v;
          })
        ),
        Sxy = mean(
          X.map(function (v, i) {
            return v * Yv[i];
          })
        );
      function L(w, b) {
        return Syy - 2 * w * Sxy - 2 * b * Sy + w * w * Sxx + 2 * w * b * Sx + b * b;
      }
      var lr0 = 0.05,
        bs = 16,
        sched = "const",
        steps = 0,
        paths,
        rr;
      var ctl = controls(el0);
      slider(ctl, {
        label: "Learning rate",
        min: 0.005,
        max: 0.2,
        step: 0.005,
        value: lr0,
        fmt: function (v) {
          return v.toFixed(3);
        },
        onInput: function (v) {
          lr0 = v;
          reset();
        },
      });
      slider(ctl, {
        label: "Mini-batch size",
        min: 2,
        max: 64,
        step: 1,
        value: bs,
        onInput: function (v) {
          bs = v;
          reset();
        },
      });
      select(ctl, {
        label: "Schedule",
        value: sched,
        options: [
          ["const", "Constant"],
          ["step", "Step decay (halve every 40)"],
          ["inv", "1/t decay"],
          ["exp", "Exponential decay"],
        ],
        onChange: function (v) {
          sched = v;
          reset();
        },
      });
      var bt = buttons(el0);
      var anim = animator(function () {
        for (var s = 0; s < 2; s++) stepAll();
        draw();
        if (steps >= 200) {
          runB.textContent = "Run";
          return false;
        }
      });
      var runB = button(
        bt,
        "Run",
        function () {
          if (anim.running()) {
            anim.stop();
            runB.textContent = "Run";
          } else {
            if (steps >= 200) reset();
            anim.start();
            runB.textContent = "Pause";
          }
        },
        true
      );
      button(bt, "Reset", function () {
        reset();
      });
      var k = kpis(el0, [
        ["st", "Steps"],
        ["b", "Full batch loss"],
        ["m", "Mini-batch loss"],
        ["s", "SGD (batch 1) loss"],
      ]);
      var p = panel(
        el0,
        "Loss surface for y = w·x + b",
        "Darker is lower loss. All three start at the same point and use the same learning rate; the cross marks the best fit."
      );
      var lg = legend(p, [
        ["ink", "Full batch (200 rows)"],
        ["amber", "Mini-batch"],
        ["rose", "SGD (1 row)"],
      ]);
      var cv = canvas(p, { aspect: "16 / 9", label: "Contour of the loss surface with three descent paths" });
      function lrAt(t) {
        if (sched === "step") return lr0 * Math.pow(0.5, Math.floor(t / 40));
        if (sched === "inv") return lr0 / (1 + t / 20);
        if (sched === "exp") return lr0 * Math.pow(0.98, t);
        return lr0;
      }
      function grad(w, b, idx) {
        var gw = 0,
          gb = 0;
        idx.forEach(function (i) {
          var e = w * X[i] + b - Yv[i];
          gw += 2 * e * X[i];
          gb += 2 * e;
        });
        return [gw / idx.length, gb / idx.length];
      }
      var all = X.map(function (_, i) {
        return i;
      });
      function sample(m) {
        var o = [];
        for (var j = 0; j < m; j++) o.push(Math.floor(rr() * n));
        return o;
      }
      function reset() {
        anim.stop();
        runB.textContent = "Run";
        steps = 0;
        rr = rng(5);
        paths = { b: [[-1, 4]], m: [[-1, 4]], s: [[-1, 4]] };
        draw();
      }
      function stepAll() {
        if (steps >= 200) return;
        var lr = lrAt(steps);
        [
          ["b", all],
          ["m", sample(bs)],
          ["s", sample(1)],
        ].forEach(function (q) {
          var pth = paths[q[0]],
            cur = pth[pth.length - 1],
            g = grad(cur[0], cur[1], q[1]);
          var nw = [clamp(cur[0] - lr * g[0], -3, 5), clamp(cur[1] - lr * g[1], -6, 6)];
          pth.push(nw);
        });
        steps++;
      }
      var opt = (function () {
        var w = (Sxy - Sx * Sy) / (Sxx - Sx * Sx);
        return [w, Sy - w * Sx];
      })();
      function draw() {
        var c = C();
        lg();
        var f = frame(cv, { x0: -1.5, x1: 3, y0: -4, y1: 5, xlabel: "w (slope)", ylabel: "b (intercept)" });
        var minL = L(opt[0], opt[1]),
          ink = rgb(c.teal);
        heat(f, 120, 80, -1.5, 3, -4, 5, function (w, b) {
          var v = Math.log(L(w, b) - minL + 0.05);
          var band = Math.floor(v * 2.2),
            t = clamp(1 - (v + 3) / 8, 0, 1);
          var a = (band % 2 ? 0.9 : 1) * (0.06 + 0.6 * t);
          return [ink[0], ink[1], ink[2], Math.round(a * 255)];
        });
        var ctx = f.ctx;
        [
          ["s", c.rose, 1.5],
          ["m", c.amber, 2],
          ["b", c.ink, 2.5],
        ].forEach(function (q) {
          var pth = paths[q[0]];
          ctx.strokeStyle = q[1];
          ctx.lineWidth = q[2];
          ctx.beginPath();
          pth.forEach(function (pt, i) {
            if (i) ctx.lineTo(f.sx(pt[0]), f.sy(pt[1]));
            else ctx.moveTo(f.sx(pt[0]), f.sy(pt[1]));
          });
          ctx.stroke();
          var last = pth[pth.length - 1];
          dot(ctx, f.sx(last[0]), f.sy(last[1]), 4.5, q[1], c.bg);
        });
        var X0 = f.sx(opt[0]),
          Y0 = f.sy(opt[1]);
        ctx.strokeStyle = c.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(X0 - 7, Y0);
        ctx.lineTo(X0 + 7, Y0);
        ctx.moveTo(X0, Y0 - 7);
        ctx.lineTo(X0, Y0 + 7);
        ctx.stroke();
        function lv(key) {
          var pth = paths[key],
            l = pth[pth.length - 1];
          return fx(L(l[0], l[1]), 3);
        }
        k.st(String(steps));
        k.b(lv("b"));
        k.m(lv("m"));
        k.s(lv("s"));
        drawHash();
      }

      // hashing trick
      var hp = panel(
        el0,
        "The hashing trick",
        "Words go into a fixed number of columns by their hash (FNV-1a, 32-bit). No vocabulary to store, at the price of collisions."
      );
      var hta = add(hp, el("textarea", { class: "lab-text", rows: "3", "aria-label": "Words to hash" }));
      hta.value =
        "outage feeder transformer breaker recloser substation load demand peak solar wind battery storage voltage frequency reserve price congestion";
      var hctl = controls(hp);
      var buckets = 16;
      slider(hctl, {
        label: "Columns (buckets)",
        min: 4,
        max: 64,
        step: 1,
        value: 16,
        onInput: function (v) {
          buckets = v;
          drawHash();
        },
      });
      var hk = kpis(hp, [
        ["w", "Distinct words"],
        ["col", "Words sharing a column"],
      ]);
      var hgrid = add(hp, el("div", { class: "lab-buckets" }));
      hta.addEventListener("input", drawHash);
      function fnv(s) {
        var h = 0x811c9dc5;
        for (var i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
      }
      function drawHash() {
        var words = hta.value
          .toLowerCase()
          .split(/[^a-z0-9']+/)
          .filter(Boolean);
        var uniq = words.filter(function (w, i) {
          return words.indexOf(w) === i;
        });
        var B = [];
        for (var i = 0; i < buckets; i++) B.push([]);
        uniq.forEach(function (w) {
          B[fnv(w) % buckets].push(w);
        });
        var coll = 0;
        B.forEach(function (b) {
          if (b.length > 1) coll += b.length;
        });
        hk.w(String(uniq.length));
        hk.col(String(coll));
        hgrid.innerHTML = B.map(function (b, i) {
          return (
            "<div class='" +
            (b.length > 1 ? "hit coll" : b.length ? "hit" : "") +
            "'><span>" +
            i +
            "</span>" +
            b
              .map(function (w) {
                return "<em>" + w.replace(/</g, "&lt;") + "</em>";
              })
              .join("") +
            "</div>"
          );
        }).join("");
      }
      reset();
      takeaway(
        el0,
        "<p>Each mini-batch gradient is a noisy estimate of the full one, and its noise shrinks with the square root of the batch size, so the simplest variance fix is a bigger batch. Others: a decaying learning rate so late steps are small, momentum or Adam to average gradients over time, shuffling each epoch, stratified batches, and variance-reduced methods like SVRG. Common schedules are step decay, exponential and 1/t decay, cosine annealing and warm restarts, and warmup followed by decay for large models. In practice, find the largest learning rate that doesn't diverge, then decay it. For hashing, MurmurHash3 (scikit-learn's HashingVectorizer) and FNV are fast and spread keys evenly; the trade-off is that collisions are permanent and features can't be mapped back to words.</p>"
      );
      return { draw: draw, stop: anim.stop };
    },
  });

  /* ------------------------------------------------ Week 11: neural network */
  WEEKS.push({
    week: 11,
    topic: "Neural networks",
    short: "Optimizers",
    title: "Train a small neural network in your browser",
    question: "Please provide more details of the optimizers, highlighting their strengths and weaknesses.",
    tryThis:
      "Pick the spiral, press Train, and compare SGD, Momentum and Adam at the same learning rate. Then try one hidden unit to see why a network needs width to bend its boundary.",
    build: function (el0) {
      var kind = "circles",
        h1 = 6,
        layers = 1,
        act = "tanh",
        optName = "adam",
        lr = 0.03,
        D,
        net,
        epoch = 0,
        hist = [];
      var ctl = controls(el0);
      select(ctl, {
        label: "Data",
        value: kind,
        options: [
          ["circles", "Circles"],
          ["xor", "XOR"],
          ["moons", "Moons"],
          ["spiral", "Spiral"],
        ],
        onChange: function (v) {
          kind = v;
          reset();
        },
      });
      select(ctl, {
        label: "Optimizer",
        value: optName,
        options: [
          ["sgd", "SGD"],
          ["momentum", "Momentum (0.9)"],
          ["rmsprop", "RMSprop"],
          ["adam", "Adam"],
        ],
        onChange: function (v) {
          optName = v;
          reset();
        },
      });
      select(ctl, {
        label: "Activation",
        value: act,
        options: [
          ["tanh", "tanh"],
          ["relu", "ReLU"],
          ["sigmoid", "Sigmoid"],
        ],
        onChange: function (v) {
          act = v;
          reset();
        },
      });
      slider(ctl, {
        label: "Units per hidden layer",
        min: 1,
        max: 12,
        value: h1,
        onInput: function (v) {
          h1 = v;
          reset();
        },
      });
      seg(ctl, {
        label: "Hidden layers",
        value: 1,
        options: [
          [1, "1"],
          [2, "2"],
        ],
        onChange: function (v) {
          layers = +v;
          reset();
        },
      });
      slider(ctl, {
        label: "Learning rate",
        min: -3,
        max: 0,
        step: 0.1,
        value: Math.log10(lr),
        fmt: function (v) {
          return String(+Math.pow(10, v).toPrecision(2));
        },
        onInput: function (v) {
          lr = Math.pow(10, v);
        },
      });
      var bt = buttons(el0);
      var anim = animator(function () {
        for (var s = 0; s < 8; s++) trainStep();
        draw();
        if (epoch >= 3000) {
          tB.textContent = "Train";
          return false;
        }
      });
      var tB = button(
        bt,
        "Train",
        function () {
          if (anim.running()) {
            anim.stop();
            tB.textContent = "Train";
          } else {
            anim.start();
            tB.textContent = "Pause";
          }
        },
        true
      );
      button(bt, "Reset weights", function () {
        reset();
      });
      var k = kpis(el0, [
        ["ep", "Epochs"],
        ["loss", "Loss (cross-entropy)"],
        ["acc", "Accuracy"],
        ["par", "Weights to learn"],
      ]);
      var grid = add(el0, el("div", { class: "lab-grid" }));
      var p1 = panel(grid, "Decision boundary");
      var cv = canvas(p1, { aspect: "1 / 1", maxWidth: 560, label: "Neural network decision boundary" });
      var p2 = panel(grid, "Loss by epoch", "Log scale. Full-batch training on 240 points.");
      var cv2 = canvas(p2, { aspect: "4 / 3", label: "Training loss curve" });
      function fA(z) {
        return act === "relu" ? (z > 0 ? z : 0) : act === "sigmoid" ? sigmoid(z) : Math.tanh(z);
      }
      function dA(a, z) {
        return act === "relu" ? (z > 0 ? 1 : 0) : act === "sigmoid" ? a * (1 - a) : 1 - a * a;
      }
      function reset() {
        anim.stop();
        tB.textContent = "Train";
        D = toy(kind, 240, 4);
        var sizes = [2, h1].concat(layers === 2 ? [h1] : []).concat([1]),
          r = rng(99);
        net = [];
        for (var l = 0; l < sizes.length - 1; l++) {
          var nin = sizes[l],
            nout = sizes[l + 1],
            sc = Math.sqrt((act === "relu" ? 2 : 1) / nin);
          var W = new Float64Array(nin * nout),
            b = new Float64Array(nout);
          for (var i = 0; i < W.length; i++) W[i] = r.normal() * sc;
          net.push({
            nin: nin,
            nout: nout,
            W: W,
            b: b,
            mW: new Float64Array(W.length),
            vW: new Float64Array(W.length),
            mb: new Float64Array(nout),
            vb: new Float64Array(nout),
          });
        }
        epoch = 0;
        hist = [];
        draw();
      }
      function forward(x) {
        var a = x,
          acts = [{ a: a, z: a }];
        net.forEach(function (L, li) {
          var z = new Float64Array(L.nout),
            out = new Float64Array(L.nout);
          for (var j = 0; j < L.nout; j++) {
            var s = L.b[j];
            for (var i = 0; i < L.nin; i++) s += L.W[i * L.nout + j] * a[i];
            z[j] = s;
            out[j] = li === net.length - 1 ? sigmoid(s) : fA(s);
          }
          acts.push({ a: out, z: z });
          a = out;
        });
        return acts;
      }
      function trainStep() {
        var gW = net.map(function (L) {
            return new Float64Array(L.W.length);
          }),
          gb = net.map(function (L) {
            return new Float64Array(L.nout);
          }),
          loss = 0,
          n = D.X.length;
        for (var s = 0; s < n; s++) {
          var acts = forward(D.X[s]),
            y = D.Y[s],
            p = clamp(acts[acts.length - 1].a[0], 1e-7, 1 - 1e-7);
          loss -= y ? Math.log(p) : Math.log(1 - p);
          var delta = new Float64Array([p - y]);
          for (var l = net.length - 1; l >= 0; l--) {
            var L = net[l],
              ain = acts[l].a;
            for (var i = 0; i < L.nin; i++) for (var j = 0; j < L.nout; j++) gW[l][i * L.nout + j] += ain[i] * delta[j];
            for (j = 0; j < L.nout; j++) gb[l][j] += delta[j];
            if (l > 0) {
              var nd = new Float64Array(L.nin);
              for (i = 0; i < L.nin; i++) {
                var sum = 0;
                for (j = 0; j < L.nout; j++) sum += L.W[i * L.nout + j] * delta[j];
                nd[i] = sum * dA(acts[l].a[i], acts[l].z[i]);
              }
              delta = nd;
            }
          }
        }
        epoch++;
        var t = epoch;
        net.forEach(function (L, l) {
          upd(L.W, gW[l], L.mW, L.vW, n, t);
          upd(L.b, gb[l], L.mb, L.vb, n, t);
        });
        hist.push(loss / n);
      }
      function upd(P, G, M, V, n, t) {
        for (var i = 0; i < P.length; i++) {
          var g = G[i] / n;
          if (optName === "sgd") P[i] -= lr * g;
          else if (optName === "momentum") {
            M[i] = 0.9 * M[i] + g;
            P[i] -= lr * M[i];
          } else if (optName === "rmsprop") {
            V[i] = 0.9 * V[i] + 0.1 * g * g;
            P[i] -= (lr * g) / (Math.sqrt(V[i]) + 1e-8);
          } else {
            M[i] = 0.9 * M[i] + 0.1 * g;
            V[i] = 0.999 * V[i] + 0.001 * g * g;
            var mh = M[i] / (1 - Math.pow(0.9, t)),
              vh = V[i] / (1 - Math.pow(0.999, t));
            P[i] -= (lr * mh) / (Math.sqrt(vh) + 1e-8);
          }
        }
      }
      function draw() {
        var c = C(),
          tC = rgb(c.teal),
          aC = rgb(c.amber);
        var f = frame(cv, { x0: -1, x1: 1, y0: -1, y1: 1, axes: false, l: 8, r: 8, t: 8, b: 8 });
        heat(f, 50, 50, -1, 1, -1, 1, function (x, y) {
          var p = forward([x, y]);
          p = p[p.length - 1].a[0];
          var col = p > 0.5 ? tC : aC;
          return [col[0], col[1], col[2], Math.round((0.08 + Math.abs(p - 0.5) * 0.7) * 255)];
        });
        var right = 0;
        D.X.forEach(function (pt, i) {
          var a = forward(pt);
          if (a[a.length - 1].a[0] > 0.5 === !!D.Y[i]) right++;
          dot(f.ctx, f.sx(pt[0]), f.sy(pt[1]), 3.3, D.Y[i] ? c.teal : c.amber, c.bg);
        });
        var npar = net.reduce(function (s, L) {
          return s + L.W.length + L.b.length;
        }, 0);
        k.ep(String(epoch));
        k.loss(hist.length ? fx(hist[hist.length - 1], 3) : "–");
        k.acc(pct(right / D.X.length));
        k.par(String(npar));
        var h = hist.length ? hist : [0.7];
        var g = frame(cv2, {
          x0: 0,
          x1: Math.max(100, h.length),
          y0: -3,
          y1: 0.2,
          yticks: [-3, -2, -1, 0],
          yfmt: function (v) {
            return v === 0 ? "1" : "1e" + v;
          },
          xlabel: "Epoch",
        });
        line(
          g,
          h.map(function (_, i) {
            return i;
          }),
          h.map(function (v) {
            return Math.max(-3, Math.log10(v));
          }),
          c.ink,
          2
        );
      }
      reset();
      takeaway(
        el0,
        "<p>Neurons don't have hand-set thresholds: each bias is learned along with the weights by backpropagation. Plain SGD is simple and often generalizes well, but it is slow in narrow valleys and sensitive to the learning rate. Momentum keeps a running velocity, so it speeds through flat stretches and damps zig-zags, at the cost of overshooting. RMSprop scales each weight's step by its recent gradient size, which helps when gradients differ wildly across weights. Adam combines both with bias correction and is the usual default because it works with little tuning, though well-tuned SGD with momentum sometimes ends at a slightly better solution.</p>"
      );
      return { draw: draw, stop: anim.stop };
    },
  });

  /* ------------------------------------------------- Week 12: convolution */
  WEEKS.push({
    week: 12,
    topic: "Convolutional networks",
    short: "Filters",
    title: "Convolution filter lab",
    question: "Are there any other types of filters apart from averaging and edge detection?",
    tryThis:
      "Draw on the left grid, then flip through the filters. Turn on ReLU and 2×2 max pooling to see the two steps a CNN layer adds after the convolution. Choose Custom to type your own kernel.",
    build: function (el0) {
      var S = 28,
        img = new Float64Array(S * S),
        kernName = "sobelx",
        relu = false,
        pool = false;
      var KERN = {
        identity: [0, 0, 0, 0, 1, 0, 0, 0, 0],
        box: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
        gauss: [1 / 16, 2 / 16, 1 / 16, 2 / 16, 4 / 16, 2 / 16, 1 / 16, 2 / 16, 1 / 16],
        sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        laplace: [0, 1, 0, 1, -4, 1, 0, 1, 0],
        sobelx: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
        sobely: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
        emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
        diag: [2, -1, -1, -1, 2, -1, -1, -1, 2],
        custom: [0, -1, 0, -1, 4, -1, 0, -1, 0],
      };
      var ctl = controls(el0);
      select(ctl, {
        label: "Filter",
        value: kernName,
        options: [
          ["box", "Box blur (averaging)"],
          ["gauss", "Gaussian blur"],
          ["sharpen", "Sharpen"],
          ["laplace", "Laplacian (all edges)"],
          ["sobelx", "Sobel x (vertical edges)"],
          ["sobely", "Sobel y (horizontal edges)"],
          ["emboss", "Emboss"],
          ["diag", "Diagonal line detector"],
          ["identity", "Identity"],
          ["custom", "Custom"],
        ],
        onChange: function (v) {
          kernName = v;
          showKernel();
          draw();
        },
      });
      select(ctl, {
        label: "Picture",
        value: "seven",
        options: [
          ["seven", "Handwritten 7"],
          ["shapes", "Square and circle"],
          ["checker", "Checkerboard"],
          ["gradient", "Gradient"],
          ["blank", "Blank (draw your own)"],
        ],
        onChange: function (v) {
          preset(v);
          draw();
        },
      });
      var bt = buttons(el0);
      check(bt, "ReLU (keep positives)", false, function (v) {
        relu = v;
        draw();
      });
      check(bt, "2×2 max pooling", false, function (v) {
        pool = v;
        draw();
      });
      var k = kpis(el0, [
        ["size", "Output size"],
        ["rng", "Output range"],
      ]);
      var grid = add(el0, el("div", { class: "lab-conv" }));
      var a = add(grid, el("div", { class: "lab-conv-cell" }));
      add(a, el("h4", { text: "Input (draw here)" }));
      var cvIn = canvas(a, { aspect: "1 / 1", label: "Input image you can draw on" });
      var m = add(grid, el("div", { class: "lab-conv-cell lab-conv-k" }));
      add(m, el("h4", { text: "3×3 kernel" }));
      var kg = add(m, el("div", { class: "lab-kernel" }));
      var kin = [];
      for (var i = 0; i < 9; i++) {
        var inp = add(kg, el("input", { type: "number", step: "0.1", "aria-label": "Kernel weight " + (i + 1) }));
        inp.addEventListener("input", function () {
          kernName = "custom";
          ctl.querySelector("select").value = "custom";
          KERN.custom = kin.map(function (x) {
            return +x.value || 0;
          });
          draw();
        });
        kin.push(inp);
      }
      var o = add(grid, el("div", { class: "lab-conv-cell" }));
      add(o, el("h4", { text: "Feature map" }));
      var cvOut = canvas(o, { aspect: "1 / 1", label: "Filtered output image" });
      function showKernel() {
        KERN[kernName].forEach(function (v, i) {
          kin[i].value = Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(3);
        });
      }
      function preset(name) {
        img.fill(0);
        for (var y = 0; y < S; y++)
          for (var x = 0; x < S; x++) {
            var v = 0;
            if (name === "checker") v = (Math.floor(x / 7) + Math.floor(y / 7)) % 2;
            else if (name === "gradient") v = x / (S - 1);
            else if (name === "shapes") {
              if (x >= 3 && x <= 12 && y >= 4 && y <= 13) v = 1;
              if (Math.hypot(x - 19, y - 19) < 6) v = 1;
            } else if (name === "seven") {
              if (y >= 5 && y <= 7 && x >= 6 && x <= 21) v = 1;
              var xl = 21 - (y - 6) * 0.45;
              if (y > 6 && y <= 24 && Math.abs(x - xl) < 1.6) v = 1;
              if (y >= 14 && y <= 15 && x >= 11 && x <= 19) v = 0.8;
            }
            img[y * S + x] = v;
          }
      }
      function paint(e) {
        var r = cvIn.getBoundingClientRect(),
          x = Math.floor(((e.clientX - r.left) / r.width) * S),
          y = Math.floor(((e.clientY - r.top) / r.height) * S);
        for (var dy = -1; dy <= 1; dy++)
          for (var dx = -1; dx <= 1; dx++) {
            var X = x + dx,
              Y = y + dy;
            if (X < 0 || Y < 0 || X >= S || Y >= S) continue;
            var val = dx === 0 && dy === 0 ? 1 : 0.55;
            img[Y * S + X] = Math.max(img[Y * S + X], val);
          }
        draw();
      }
      var down = false;
      cvIn.style.touchAction = "none";
      cvIn.addEventListener("pointerdown", function (e) {
        down = true;
        cvIn.setPointerCapture(e.pointerId);
        paint(e);
      });
      cvIn.addEventListener("pointermove", function (e) {
        if (down) paint(e);
      });
      cvIn.addEventListener("pointerup", function () {
        down = false;
      });
      function conv() {
        var kk = KERN[kernName],
          out = new Float64Array(S * S);
        for (var y = 0; y < S; y++)
          for (var x = 0; x < S; x++) {
            var s = 0;
            for (var j = -1; j <= 1; j++)
              for (var i2 = -1; i2 <= 1; i2++) {
                var X = x + i2,
                  Y = y + j;
                if (X >= 0 && Y >= 0 && X < S && Y < S) s += img[Y * S + X] * kk[(j + 1) * 3 + (i2 + 1)];
              }
            out[y * S + x] = relu ? Math.max(0, s) : s;
          }
        if (!pool) return { d: out, n: S };
        var h = S / 2,
          p = new Float64Array(h * h);
        for (y = 0; y < h; y++)
          for (x = 0; x < h; x++)
            p[y * h + x] = Math.max(
              out[2 * y * S + 2 * x],
              out[2 * y * S + 2 * x + 1],
              out[(2 * y + 1) * S + 2 * x],
              out[(2 * y + 1) * S + 2 * x + 1]
            );
        return { d: p, n: h };
      }
      function render(cvx, data, n, signed) {
        var P = prep(cvx),
          c = C(),
          ctx = P.ctx,
          cw = P.w / n;
        var lo = Infinity,
          hi = -Infinity;
        for (var i = 0; i < data.length; i++) {
          lo = Math.min(lo, data[i]);
          hi = Math.max(hi, data[i]);
        }
        var amax = Math.max(Math.abs(lo), Math.abs(hi), 1e-9);
        var pos = rgb(c.teal),
          neg = rgb(c.rose),
          bgc = isDark() ? [11, 18, 32] : [255, 255, 255],
          fg = isDark() ? [226, 232, 240] : [15, 23, 42];
        for (i = 0; i < data.length; i++) {
          var v = data[i],
            col;
          if (signed && lo < -1e-9) {
            var t = Math.min(1, Math.abs(v) / amax),
              tgt = v >= 0 ? pos : neg;
            col = [0, 1, 2].map(function (q) {
              return Math.round(bgc[q] + (tgt[q] - bgc[q]) * t);
            });
          } else {
            var u = hi - Math.min(0, lo) > 1e-9 ? (v - Math.min(0, lo)) / (hi - Math.min(0, lo)) : 0;
            col = [0, 1, 2].map(function (q) {
              return Math.round(bgc[q] + (fg[q] - bgc[q]) * u);
            });
          }
          ctx.fillStyle = "rgb(" + col.join(",") + ")";
          var x = i % n,
            y = Math.floor(i / n);
          ctx.fillRect(Math.floor(x * cw), Math.floor(y * cw), Math.ceil(cw), Math.ceil(cw));
        }
        ctx.strokeStyle = c.grid;
        ctx.strokeRect(0.5, 0.5, P.w - 1, P.h - 1);
        return [lo, hi];
      }
      function draw() {
        render(cvIn, img, S, false);
        var r = conv(),
          lr2 = render(cvOut, r.d, r.n, true);
        k.size(r.n + " × " + r.n);
        k.rng(fx(lr2[0], 1) + " to " + fx(lr2[1], 1));
      }
      preset("seven");
      showKernel();
      add(
        el0,
        el("p", {
          class: "dash-note",
          text: "Teal marks positive responses and rose negative ones; with ReLU on, only the positive (gray to dark) responses remain.",
        })
      );
      takeaway(
        el0,
        "<p>Yes, many: Gaussian blur (weighted averaging that smooths without boxy artifacts), sharpening (boost the center, subtract the neighbors), emboss and directional line detectors, and corner or texture filters like Gabor filters. In a CNN, though, nobody picks the kernel. The network learns thousands of them, and early layers tend to rediscover edge and color detectors on their own. Unlike human vision, a CNN sees fixed grids of numbers through small windows with no eye movement or context, which is why texture can fool it. In transfer learning the usual practice is to freeze the early, generic layers and fine-tune the later, task-specific ones, unfreezing more if you have more data.</p>"
      );
      return { draw: draw };
    },
  });

  /* ------------------------------------------- Week 13: NLP and sequences */
  WEEKS.push({
    week: 13,
    topic: "RNNs and NLP",
    short: "Cosine, padding",
    title: "Cosine similarity and variable-length sequences",
    question: "Why is cosine similarity preferred over Euclidean distance? What techniques handle variable-length sequences in RNNs?",
    tryThis:
      "Repeat document B a few times. Its meaning hasn't changed, but Euclidean distance grows while cosine similarity stays put. Below, change the maximum length and turn on bucketing to see how much padding a batch wastes.",
    build: function (el0) {
      var p1 = panel(el0, "Same meaning, different length");
      var c1 = controls(p1);
      var la = add(c1, el("label", { class: "field lab-field lab-wide" }));
      add(la, el("span", { text: "Document A" }));
      var A = add(la, el("input", { type: "text", class: "lab-input", value: "solar power cuts peak demand on the grid" }));
      var lb = add(c1, el("label", { class: "field lab-field lab-wide" }));
      add(lb, el("span", { text: "Document B" }));
      var B = add(lb, el("input", { type: "text", class: "lab-input", value: "rooftop solar power lowers peak grid demand" }));
      var rep = 1;
      slider(c1, {
        label: "Repeat B",
        min: 1,
        max: 6,
        value: 1,
        fmt: function (v) {
          return "×" + v;
        },
        onInput: function (v) {
          rep = v;
          draw();
        },
      });
      A.addEventListener("input", draw);
      B.addEventListener("input", draw);
      var k = kpis(p1, [
        ["cos", "Cosine similarity"],
        ["euc", "Euclidean distance"],
        ["shared", "Shared words"],
      ]);
      var lg = legend(p1, [
        ["teal", "Cosine similarity"],
        ["amber", "Euclidean distance (scaled)"],
      ]);
      var cv = canvas(p1, { aspect: "16 / 6", label: "Cosine similarity and Euclidean distance as document B is repeated" });
      function vec(s, times) {
        var v = {};
        s.toLowerCase()
          .split(/[^a-z0-9']+/)
          .filter(Boolean)
          .forEach(function (w) {
            v[w] = (v[w] || 0) + times;
          });
        return v;
      }
      function metrics(times) {
        var a = vec(A.value, 1),
          b = vec(B.value, times),
          keys = {};
        Object.keys(a)
          .concat(Object.keys(b))
          .forEach(function (w) {
            keys[w] = 1;
          });
        var dotp = 0,
          na = 0,
          nb = 0,
          e = 0,
          sh = 0;
        Object.keys(keys).forEach(function (w) {
          var x = a[w] || 0,
            y = b[w] || 0;
          dotp += x * y;
          na += x * x;
          nb += y * y;
          e += (x - y) * (x - y);
          if (x && y) sh++;
        });
        return { cos: na && nb ? dotp / Math.sqrt(na * nb) : 0, euc: Math.sqrt(e), sh: sh };
      }

      var p2 = panel(
        el0,
        "Padding, truncation and bucketing",
        "One sentence per line, batched in pairs. Gray cells are padding the network still processes unless it is masked."
      );
      var ta = add(p2, el("textarea", { class: "lab-text", rows: "6", "aria-label": "Sentences, one per line" }));
      ta.value = [
        "storm warning",
        "crews restored power to most homes overnight",
        "outage reported",
        "the utility expects full restoration by friday evening after the storm",
        "load is up",
        "transformer replaced at the substation",
      ].join("\n");
      var c2 = controls(p2);
      var maxLen = 10,
        padSide = "post",
        bucket = false;
      slider(c2, {
        label: "Max length",
        min: 3,
        max: 14,
        value: 10,
        onInput: function (v) {
          maxLen = v;
          drawPad();
        },
      });
      seg(c2, {
        label: "Pad and cut at",
        value: "post",
        options: [
          ["pre", "Start"],
          ["post", "End"],
        ],
        onChange: function (v) {
          padSide = v;
          drawPad();
        },
      });
      var b2 = buttons(p2);
      check(b2, "Sort into length buckets first", false, function (v) {
        bucket = v;
        drawPad();
      });
      var pk = kpis(p2, [
        ["pad", "Cells that are padding"],
        ["cut", "Words cut off"],
      ]);
      var out = add(p2, el("div", { class: "lab-seq" }));
      ta.addEventListener("input", drawPad);
      function drawPad() {
        var sents = ta.value
          .split("\n")
          .map(function (s) {
            return s.trim().split(/\s+/).filter(Boolean);
          })
          .filter(function (s) {
            return s.length;
          });
        if (bucket)
          sents = sents.slice().sort(function (a, b) {
            return a.length - b.length;
          });
        var html = "",
          padCells = 0,
          total = 0,
          cut = 0;
        for (var i = 0; i < sents.length; i += 2) {
          var batch = sents.slice(i, i + 2),
            L = Math.min(
              maxLen,
              Math.max.apply(
                null,
                batch.map(function (s) {
                  return s.length;
                })
              )
            );
          html += "<div class='lab-batch'><span class='lab-batch-label'>Batch " + (i / 2 + 1) + " · length " + L + "</span>";
          batch.forEach(function (s) {
            var toks = s;
            if (toks.length > L) {
              cut += toks.length - L;
              toks = padSide === "post" ? toks.slice(0, L) : toks.slice(toks.length - L);
            }
            var pads = L - toks.length;
            padCells += pads;
            total += L;
            var cells = toks.map(function (w) {
              return "<span class='tok'>" + w.replace(/</g, "&lt;") + "</span>";
            });
            var pc = [];
            for (var q = 0; q < pads; q++) pc.push("<span class='tok pad'>PAD</span>");
            cells = padSide === "post" ? cells.concat(pc) : pc.concat(cells);
            html += "<div class='lab-row'>" + cells.join("") + "</div>";
          });
          html += "</div>";
        }
        out.innerHTML = html;
        pk.pad(total ? pct(padCells / total, 0) + " (" + padCells + " of " + total + ")" : "–");
        pk.cut(String(cut));
      }
      function draw() {
        var c = C(),
          m = metrics(rep);
        k.cos(fx(m.cos, 3));
        k.euc(fx(m.euc, 2));
        k.shared(String(m.sh));
        lg();
        var xs = [1, 2, 3, 4, 5, 6],
          ms = xs.map(metrics),
          emax = Math.max.apply(
            null,
            ms.map(function (q) {
              return q.euc;
            })
          );
        var f = frame(cv, {
          x0: 1,
          x1: 6,
          y0: 0,
          y1: 1,
          ny: 2,
          xticks: xs,
          xfmt: function (t) {
            return "×" + t;
          },
          xlabel: "Times document B is repeated",
        });
        line(
          f,
          xs,
          ms.map(function (q) {
            return q.cos;
          }),
          c.teal,
          2.5
        );
        line(
          f,
          xs,
          ms.map(function (q) {
            return q.euc / (emax || 1);
          }),
          c.amber,
          2.5
        );
        dot(f.ctx, f.sx(rep), f.sy(m.cos), 5, c.teal, c.bg);
        dot(f.ctx, f.sx(rep), f.sy(m.euc / (emax || 1)), 5, c.amber, c.bg);
        drawPad();
      }
      takeaway(
        el0,
        "<p>Cosine similarity compares the direction of two word-count vectors and ignores their length, so a long report and a short summary on the same topic still match; Euclidean distance mostly measures how different the lengths are. For sequences, RNNs need same-length batches, so the toolkit is: pad short sequences and truncate long ones, mask the padding so it doesn't affect the hidden state or the loss, bucket sequences of similar length to waste less compute, and in PyTorch pack padded sequences so the RNN skips the padding entirely. Architecturally, a CNN shares weights across space and sees a fixed window, while an RNN shares weights across time and carries a hidden state forward from step to step.</p>"
      );
      return { draw: draw };
    },
  });

  /* ---------------------------------------------------- Week 14: ensembles */
  WEEKS.push({
    week: 14,
    topic: "Ensembles",
    short: "Voting",
    title: "How many models does an ensemble need?",
    question: "Are there any techniques or processes for making ensembling more computationally efficient?",
    tryThis:
      "Set how accurate each model is and how correlated their mistakes are. With independent models, majority voting climbs fast; with correlated ones, extra models cost compute and add almost nothing.",
    build: function (el0) {
      var p = 0.7,
        rho = 0.3,
        Nmax = 41;
      var ctl = controls(el0);
      slider(ctl, {
        label: "Accuracy of each model",
        min: 0.52,
        max: 0.9,
        step: 0.01,
        value: p,
        fmt: function (v) {
          return pct(v, 0);
        },
        onInput: function (v) {
          p = v;
          draw();
        },
      });
      slider(ctl, {
        label: "Correlation between models' errors",
        min: 0,
        max: 0.9,
        step: 0.05,
        value: rho,
        fmt: function (v) {
          return v.toFixed(2);
        },
        onInput: function (v) {
          rho = v;
          draw();
        },
      });
      var k = kpis(el0, [
        ["one", "One model"],
        ["eff", "Efficient size"],
        ["max", "With " + Nmax + " models"],
        ["cost", "Compute saved vs " + Nmax],
      ]);
      var pn = panel(el0, "Majority-vote accuracy by ensemble size", "Simulated: 3,000 test cases per size, models share a common error factor.");
      var lg = legend(pn, [
        ["teal", "Ensemble accuracy"],
        ["slate", "Independent models (ρ = 0)"],
      ]);
      var cv = canvas(pn, { aspect: "16 / 8", label: "Ensemble accuracy against number of models" });
      function invPhi(q) {
        var lo = -8,
          hi = 8;
        for (var i = 0; i < 60; i++) {
          var m = (lo + hi) / 2;
          if (0.5 * (1 + erf(m / Math.SQRT2)) < q) lo = m;
          else hi = m;
        }
        return (lo + hi) / 2;
      }
      function erf(x) {
        var s = x < 0 ? -1 : 1;
        x = Math.abs(x);
        var t = 1 / (1 + 0.3275911 * x);
        var y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
        return s * y;
      }
      function sim(r0) {
        var th = invPhi(p),
          r = rng(77),
          out = [],
          trials = 3000,
          a = Math.sqrt(r0),
          b = Math.sqrt(1 - r0);
        for (var N = 1; N <= Nmax; N += 2) {
          var good = 0;
          for (var t = 0; t < trials; t++) {
            var z = r.normal(),
              c = 0;
            for (var i = 0; i < N; i++) if (a * z + b * r.normal() < th) c++;
            if (c > N / 2) good++;
          }
          out.push(good / trials);
        }
        return out;
      }
      var cacheInd = {};
      function draw() {
        var c = C(),
          Ns = [];
        for (var N = 1; N <= Nmax; N += 2) Ns.push(N);
        var acc = sim(rho),
          ind = cacheInd[p] || (cacheInd[p] = sim(0));
        var mx = Math.max.apply(null, acc),
          ei = acc.findIndex(function (v) {
            return v >= mx - 0.005;
          });
        k.one(pct(acc[0]));
        k.eff(Ns[ei] + " models (" + pct(acc[ei]) + ")");
        k.max(pct(acc[acc.length - 1]));
        k.cost(pct(1 - Ns[ei] / Nmax, 0));
        lg();
        var f = frame(cv, {
          x0: 1,
          x1: Nmax,
          y0: Math.floor(Math.min(p, acc[0]) * 10) / 10 - 0.05,
          y1: 1,
          yfmt: function (v) {
            return Math.round(v * 100) + "%";
          },
          xticks: [1, 5, 11, 21, 31, 41],
          xfmt: String,
          xlabel: "Number of models voting",
        });
        line(f, Ns, ind, c.slate, 2, [5, 4]);
        line(f, Ns, acc, c.teal, 2.5);
        var X = f.sx(Ns[ei]);
        f.ctx.strokeStyle = c.ink;
        f.ctx.setLineDash([3, 4]);
        f.ctx.beginPath();
        f.ctx.moveTo(X, f.T);
        f.ctx.lineTo(X, f.h - f.B);
        f.ctx.stroke();
        f.ctx.setLineDash([]);
        dot(f.ctx, X, f.sy(acc[ei]), 5, c.teal, c.bg);
      }
      takeaway(
        el0,
        "<p>Voting only helps when models make different mistakes, so the cheapest gain is diversity, not size: once errors are correlated the curve flattens after a handful of models. Ways to make ensembles cheaper: stop adding members when validation accuracy plateaus, prune to the most diverse subset, train members in parallel (bagging and random forests are embarrassingly parallel), use snapshot ensembles that save several models from one training run with a cyclic learning rate, or distill the whole ensemble into one small model for serving. Stacking with a light meta-model can also beat a large vote.</p>"
      );
      return { draw: draw };
    },
  });

  /* ================================================================ router */
  var btns = {};
  WEEKS.forEach(function (w) {
    if (!nav || single) return;
    var b = add(
      nav,
      el("button", {
        type: "button",
        class: "lab-week",
        "aria-pressed": "false",
        "aria-controls": "lab-stage",
        html: "<span class='lab-week-n'>Wk " + w.week + "</span><span class='lab-week-t'>" + w.short + "</span>",
      })
    );
    b.addEventListener("click", function () {
      show(w.week, true);
    });
    btns[w.week] = b;
  });

  function show(week, push) {
    var w = WEEKS.filter(function (x) {
      return x.week === week;
    })[0];
    if (!w) w = WEEKS[0];
    if (current && current.api && current.api.stop) current.api.stop();
    Object.keys(btns).forEach(function (k) {
      btns[k].setAttribute("aria-pressed", String(+k === w.week));
    });
    stage.innerHTML = "";
    canvases = [];
    header(stage, w);
    var body = add(stage, el("div", { class: "lab-body" }));
    current = { week: w.week, api: null };
    var go = function () {
      if (current.week !== w.week) return;
      try {
        current.api = w.build(body);
        current.api.draw();
      } catch (err) {
        body.innerHTML = "<p class='dash-note'>This app couldn't start in your browser.</p>";
        if (window.console) console.error(err);
      }
    };
    if (w.needsData && !DATA) {
      body.innerHTML = "<p class='dash-note'>Loading results…</p>";
      dataReady.then(function () {
        body.innerHTML = "";
        go();
      });
    } else go();
    if (push && history.replaceState) history.replaceState(null, "", "#week-" + w.week);
    if (push) {
      var top = root.getBoundingClientRect().top + window.scrollY - 80;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
    }
  }

  var redrawT = 0;
  function redraw() {
    clearTimeout(redrawT);
    redrawT = setTimeout(function () {
      if (current && current.api) current.api.draw();
    }, 60);
  }
  if (window.ResizeObserver) {
    var lastW = 0;
    new ResizeObserver(function (e) {
      var wd = Math.round(e[0].contentRect.width);
      if (wd !== lastW) {
        lastW = wd;
        redraw();
      }
    }).observe(stage);
  } else window.addEventListener("resize", redraw);
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if (single) {
    root.classList.add("is-ready");
    show(single, false);
    return;
  }
  window.addEventListener("hashchange", function () {
    var h = /week-(\d+)/.exec(location.hash);
    if (h && (!current || +h[1] !== current.week)) show(+h[1], false);
  });
  var m = /week-(\d+)/.exec(location.hash);
  root.classList.add("is-ready");
  show(m ? +m[1] : 2, false);
})();
