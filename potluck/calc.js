/* The food calculator from lib/food_calc.dart, for the "how much food" page.
   Same numbers as the app; check_web_codec.mjs compares them. */
(function (root) {
  "use strict";
  function half(x) { var v = Math.ceil(x * 2) / 2; return v === Math.round(v) ? String(Math.round(v)) : String(v); }
  function plan(guests, hours, leftovers, metric) {
    var g = Math.max(1, guests), h = Math.max(1, hours), extra = leftovers ? 1.3 : 1;
    var turkeyLb = Math.ceil(g * 1.25 * extra), thaw = Math.ceil(turkeyLb / 4);
    var lb = function (x) { return metric ? half(x * 0.4536) + " kg" : Math.ceil(x) + " lb"; };
    var cups = function (x) { return metric ? half(x * 0.24) + " L" : Math.ceil(x) + " cups"; };
    return [
      ["Whole turkey", lb(turkeyLb) + "  (thaw " + thaw + " day" + (thaw === 1 ? "" : "s") + " in the fridge)"],
      ["Bone-in ham", lb(g * 0.75 * extra)],
      ["Mashed potatoes", lb(g * 0.5 * extra) + " potatoes"],
      ["Stuffing", cups(g * 0.75 * extra)],
      ["Gravy", cups(g * 0.33 * extra)],
      ["Each veggie side", cups(g * 0.5)],
      ["Rolls", Math.ceil(g * 1.5) + " rolls"],
      ["Pies (8 slices each)", Math.ceil(g / 6) + " pies"],
      ["Appetizer bites", g * (h >= 3 ? 8 : 5) + " pieces"],
      ["Drinks", g * (h + 1) + " servings  (2 the first hour, then 1 an hour)"],
      ["Wine (5 glasses a bottle)", Math.ceil(g * h * 0.5 / 5) + " bottles"],
      ["Ice", lb(g * 1.0)],
      ["Plates", Math.ceil(g * 2) + "  (dinner and dessert)"],
      ["Cups", String(Math.ceil(g * 3))]
    ];
  }
  root.PLCalc = { plan: plan };
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var form = $("calc");
  if (!form) return;
  var region = (navigator.language || "en-US").split("-")[1];
  $("cmetric").checked = ["US", "LR", "MM"].indexOf(region) < 0;
  function show() {
    var rows = plan(+$("cguests").value || 1, +$("chours").value || 1, $("cleft").checked, $("cmetric").checked);
    $("cguestsv").textContent = $("cguests").value;
    $("choursv").textContent = $("chours").value;
    $("cout").innerHTML = "";
    rows.forEach(function (r) {
      var tr = document.createElement("tr"), a = document.createElement("th"), b = document.createElement("td");
      a.scope = "row"; a.textContent = r[0]; b.textContent = r[1];
      tr.appendChild(a); tr.appendChild(b); $("cout").appendChild(tr);
    });
  }
  form.oninput = show;
  form.onsubmit = function (e) { e.preventDefault(); };
  show();
})(typeof window !== "undefined" ? window : globalThis);
