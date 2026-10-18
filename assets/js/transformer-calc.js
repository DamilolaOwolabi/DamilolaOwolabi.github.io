/*
 * Transformer sizing & available fault current calculator (/tools/).
 */
(function () {
  "use strict";

  var SIZES = {
    1: [10, 15, 25, 37.5, 50, 75, 100, 167, 250, 333, 500],
    3: [45, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500],
  };
  var VOLTAGES = {
    1: [{ v: 240, label: "120/240 V" }],
    3: [
      { v: 208, label: "208Y/120 V" },
      { v: 480, label: "480Y/277 V" },
    ],
  };
  var Z_HINT = {
    1: "Small single-phase units are often around 1.5 to 3%. Use the nameplate value when you have it.",
    3: "Three-phase pad-mounts commonly range from about 2% (small units) to 5.75% (500 kVA and up). Use the nameplate value when you have it.",
  };

  function fmt(n, d) {
    return n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  }

  function init() {
    var root = document.getElementById("xfmr-calc");
    if (!root) return;
    var form = root.querySelector("form");
    var voltSel = form.elements.voltage;
    var lastPhase = null;

    function phase() {
      return form.querySelector('input[name="phase"]:checked').value;
    }

    function setVoltages(ph) {
      voltSel.innerHTML = "";
      VOLTAGES[ph].forEach(function (o) {
        var opt = document.createElement("option");
        opt.value = o.v;
        opt.textContent = o.label;
        voltSel.appendChild(opt);
      });
      document.getElementById("z-hint").textContent = Z_HINT[ph];
    }

    function num(name) {
      var v = parseFloat(form.elements[name].value);
      return isFinite(v) ? v : NaN;
    }

    function calc() {
      var ph = phase();
      if (ph !== lastPhase) {
        setVoltages(ph);
        // Sensible default %Z per phase, unless the user has typed their own.
        if (!form.elements.z.dataset.touched) form.elements.z.value = ph === "1" ? "2.0" : "5.75";
        lastPhase = ph;
      }
      var V = parseFloat(voltSel.value);
      var kw = num("kw"),
        pf = num("pf"),
        margin = num("margin"),
        z = num("z");
      var warn = document.getElementById("r-warn");
      warn.hidden = true;

      if (!(kw > 0) || !(pf > 0 && pf <= 1) || !(margin >= 0) || !(z > 0)) {
        ["r-size", "r-kva", "r-req", "r-iload", "r-fla", "r-isc"].forEach(function (id) {
          document.getElementById(id).textContent = "–";
        });
        document.getElementById("r-loading").textContent = "Enter a load above zero and a power factor between 0 and 1.";
        return;
      }

      var kva = kw / pf;
      var req = kva * (1 + margin / 100);
      var sizes = SIZES[ph];
      var size = sizes.find(function (s) {
        return s >= req - 1e-9;
      });
      var denom = ph === "3" ? Math.sqrt(3) * V : V;
      var iLoad = (kva * 1000) / denom;

      document.getElementById("r-kva").textContent = fmt(kva, 1) + " kVA";
      document.getElementById("r-req").textContent = fmt(req, 1) + " kVA";
      document.getElementById("r-iload").textContent = fmt(iLoad, 0) + " A";

      if (!size) {
        document.getElementById("r-size").textContent = "Over " + fmt(sizes[sizes.length - 1], 0) + " kVA";
        document.getElementById("r-loading").textContent = "Larger than the standard range here. Consider multiple units or a higher voltage.";
        document.getElementById("r-fla").textContent = "–";
        document.getElementById("r-isc").textContent = "–";
        return;
      }

      var fla = (size * 1000) / denom;
      var isc = fla / (z / 100);
      var loading = (kva / size) * 100;

      document.getElementById("r-size").textContent = fmt(size, size % 1 ? 1 : 0) + " kVA";
      document.getElementById("r-loading").textContent =
        "Load is " +
        fmt(loading, 0) +
        "% of nameplate (" +
        (ph === "3" ? "three-phase, " : "single-phase, ") +
        voltSel.options[voltSel.selectedIndex].text +
        ")";
      document.getElementById("r-fla").textContent = fmt(fla, 0) + " A";
      document.getElementById("r-isc").textContent = fmt(isc / 1000, 1) + " kA (" + fmt(isc, 0) + " A)";

      if (V <= 240 && isc > 10000) {
        warn.textContent = "Above 10 kA: many residential panels and breakers are rated 10 kA, so check equipment short-circuit ratings.";
        warn.hidden = false;
      } else if (isc > 65000) {
        warn.textContent = "Above 65 kA: high available fault current; confirm equipment interrupting and withstand ratings.";
        warn.hidden = false;
      }
    }

    form.addEventListener("input", function (e) {
      if (e.target.name === "z") e.target.dataset.touched = "1";
      calc();
    });
    form.addEventListener("change", calc);
    calc();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
