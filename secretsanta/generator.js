/* The web name draw on the landing page. Same rules as lib/draw.dart: nobody
   draws themselves, "can't draw" pairs work both ways, and with 4+ people it
   avoids two people drawing each other when it can. Matches are never shown:
   each person gets a private link to /r/, and nothing leaves this browser
   until the organizer sends a link. */
(function (root) {
  "use strict";

  // Backtracking, always filling the giver with the fewest options left (MRV),
  // in a random order so every valid draw can come out.
  function solve(n, ok, noMutual) {
    var to = new Array(n).fill(-1), taken = new Array(n).fill(false);
    var shuffled = function (a) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), k = a[i]; a[i] = a[j]; a[j] = k; }
      return a;
    };
    var options = function (g) {
      var o = [];
      for (var r = 0; r < n; r++) if (!taken[r] && ok(g, r) && !(noMutual && to[r] === g)) o.push(r);
      return o;
    };
    var steps = 0;
    function go(left) {
      if (!left) return true;
      if (++steps > 200000) return false;
      var best = -1, bestOpts = null;
      for (var g = 0; g < n; g++) {
        if (to[g] !== -1) continue;
        var o = options(g);
        if (!o.length) return false;
        if (!bestOpts || o.length < bestOpts.length) { best = g; bestOpts = o; }
      }
      var opts = shuffled(bestOpts);
      for (var i = 0; i < opts.length; i++) {
        to[best] = opts[i]; taken[opts[i]] = true;
        if (go(left - 1)) return true;
        to[best] = -1; taken[opts[i]] = false;
      }
      return false;
    }
    return go(n) ? to : null;
  }

  // names: strings; pairs: [[a, b]] by name. Returns {to: [index], mutualOk}
  // or null when no draw fits.
  function draw(names, pairs) {
    var n = names.length, key = function (s) { return s.trim().toLowerCase(); };
    var idx = {};
    names.forEach(function (s, i) { idx[key(s)] = i; });
    var bad = {};
    (pairs || []).forEach(function (p) {
      var a = idx[key(p[0])], b = idx[key(p[1])];
      if (a != null && b != null) { bad[a + "," + b] = bad[b + "," + a] = true; }
    });
    var ok = function (g, r) { return g !== r && !bad[g + "," + r]; };
    var to = n >= 4 ? solve(n, ok, true) : null;
    if (to) return { to: to, mutual: false };
    to = solve(n, ok, false);
    return to ? { to: to, mutual: n >= 4 } : null;
  }

  root.SSDraw = { draw: draw };
  if (typeof document === "undefined") return;

  var $ = function (id) { return document.getElementById(id); };
  var form = $("gen");
  if (!form) return;
  var cfg = JSON.parse($("cfg").textContent), list = $("sends"), msg = $("msg");
  var unsent = 0;

  function lines(v) {
    return v.split(/[\n,;]+/).map(function (s) { return s.trim().slice(0, 40); }).filter(Boolean);
  }
  // "Ana & Ben" per line; a one-name line is kept so it can be flagged.
  function pairsOf(v) {
    return v.split("\n").map(function (l) {
      return l.split(/\s*(?:&|\+|\/|,|\band\b|\by\b|\bund\b|\bet\b|\be\b)\s*/i).map(function (s) { return s.trim(); }).filter(Boolean);
    }).filter(function (p) { return p.length; });
  }
  function message(g, link) {
    return "🎅 Hi " + g + "! Names have been drawn for “" + cfg.event + "”.\n\n" +
      "Tap to privately see who you are buying for:\n" + link + "\n\n" +
      "Works on any phone. Plan your gift with the free " + cfg.app + " app: " + cfg.store;
  }

  form.onsubmit = function (e) {
    e.preventDefault();
    var names = lines($("gnames").value), seen = {}, dupes = [];
    names.forEach(function (s) { var k = s.toLowerCase(); if (seen[k]) dupes.push(s); seen[k] = 1; });
    if (dupes.length) { msg.textContent = dupes[0] + " is on the list twice. Add a surname or initial so each name is different."; return; }
    if (names.length < 3) { msg.textContent = "Add at least 3 names, one per line."; return; }
    if (names.length > 100) { msg.textContent = "That's over 100 people. Split them into smaller groups."; return; }
    var pairs = pairsOf($("gpairs").value);
    var lone = pairs.filter(function (p) { return p.length < 2; })[0];
    if (lone) { msg.textContent = "“" + lone[0] + "” needs a partner: each rule is two or more names with & between them, like “Ben & Cara”."; return; }
    var unknown = [];
    pairs.forEach(function (p) { p.forEach(function (s) { if (!seen[s.toLowerCase()]) unknown.push(s); }); });
    if (unknown.length) { msg.textContent = "“" + unknown[0] + "” in the rules isn't on the names list. Check the spelling."; return; }
    // Households: "Ana & Ben & Cal" keeps all three apart.
    var flat = [];
    pairs.forEach(function (p) { for (var i = 0; i < p.length; i++) for (var j = i + 1; j < p.length; j++) flat.push([p[i], p[j]]); });
    var res = SSDraw.draw(names, flat);
    if (!res) {
      list.innerHTML = "";
      msg.textContent = "No draw fits these rules: someone has nobody left they're allowed to draw. Remove a rule or add a person.";
      return;
    }
    var ev = $("gevent").value.trim().slice(0, 60) || "Secret Santa";
    cfg.event = ev;
    var budget = $("gbudget").value.trim().slice(0, 30), date = $("gdate").value, note = $("gnote").value.trim().slice(0, 200);
    list.innerHTML = "";
    unsent = names.length;
    names.forEach(function (g, i) {
      // Same keys, order and omissions as RevealData.toJson.
      var d = { e: ev, g: g, r: names[res.to[i]] };
      if (budget) d.b = budget;
      if (date) d.d = date;
      if (note) d.n = note;
      var link = cfg.reveal + SSCodec.reveal(d), text = message(g, link);
      var li = document.createElement("li");
      var b = document.createElement("b");
      b.textContent = g;
      li.appendChild(b);
      var row = document.createElement("span");
      row.className = "via";
      [["WhatsApp", "https://wa.me/?text=" + encodeURIComponent(text)],
       ["Text", "sms:?&body=" + encodeURIComponent(text)],
       ["Email", "mailto:?subject=" + encodeURIComponent("Your Secret Santa match for " + ev) + "&body=" + encodeURIComponent(text)],
       ["Copy", null]].forEach(function (v) {
        var a = document.createElement(v[1] ? "a" : "button");
        a.textContent = v[0];
        a.setAttribute("aria-label", v[0] + ": send " + g + " their link");
        if (v[1]) { a.href = v[1]; a.target = "_blank"; a.rel = "noopener"; }
        else {
          a.type = "button";
          a.onclick = function () {
            if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { msg.textContent = "Copied " + g + "'s message. Send it to " + g + " only."; });
          };
        }
        a.addEventListener("click", function () {
          if (!li.classList.contains("sent")) { li.classList.add("sent"); unsent--; }
          msg.textContent = unsent ? unsent + " still to send." : "Everyone has their link. You can close this page.";
        });
        row.appendChild(a);
      });
      li.appendChild(row);
      list.appendChild(li);
    });
    msg.textContent = "Drawn. Send each person their own link, privately. Nothing is saved, so keep this page open until everyone has theirs." +
      (res.mutual ? " (Two people had to draw each other to fit the rules.)" : "");
    list.focus();
  };
  addEventListener("beforeunload", function (e) { if (unsent > 0) { e.preventDefault(); e.returnValue = ""; } });
})(typeof window !== "undefined" ? window : globalThis);
