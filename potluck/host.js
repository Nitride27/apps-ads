/* The web host page (/potluck/h/#PL1-…): for hosts without the app. The
   whole sheet, guests included, lives in the link itself, so the link is the
   sheet: replies merged here rewrite it. Nothing is saved on any server; this
   browser only remembers the link (localStorage) so a tapped reply link can
   find it. Message wording follows lib/app_scope.dart. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var cfg = JSON.parse($("cfg").textContent), C = PLCodec, p = null;
  var KEY = "potluck_sheets_v1";

  function saved() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function remember(link) {
    try { var s = saved(); s[p.id] = { name: p.name, link: link }; localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function li(text, cls) { var e = document.createElement("li"); e.textContent = text; if (cls) e.className = cls; return e; }
  var NEED = { oven: "oven", fridge: "fridge", plug: "plug", spoon: "serving spoon" };
  // Same as dishNotes in lib/app_scope.dart.
  function notes(c) {
    var n = [];
    if (c.v > 0) n.push("serves " + c.v);
    if (c.k && c.k.length) n.push("needs " + c.k.map(function (k) { return NEED[k]; }).join(", "));
    return n.length ? " · " + n.join(" · ") : "";
  }
  function suffix(t) { return t && t.length ? " (" + t.map(function (x) { return cfg.short[x] || x; }).join(", ") + ")" : ""; }
  function open() { return p.slots.filter(function (s) { return !C.isFull(p, s); }); }
  function openLines() {
    return open().map(function (s) { var left = s.n - C.claimsFor(p, s).length; return left > 1 ? s.l + " ×" + left : s.l; });
  }

  function save() {
    return Promise.all([C.hostCode(p), C.invite(p)]).then(function (codes) {
      var link = cfg.site + "h/#" + codes[0];
      history.replaceState(null, "", "#" + codes[0]);
      $("bookmark").href = link;
      remember(link);
      var shown = openLines().slice(0, 12), more = openLines().length - shown.length;
      var invite = "🍽️ You're invited to " + p.name + "!\n" +
        (shown.length ? "\nStill needed:\n" + shown.map(function (s) { return "• " + s; }).join("\n") + (more > 0 ? "\n…and " + more + " more" : "") + "\n" : "") +
        "\nTap to pick your dish (no app or account needed):\n" + cfg.site + "j/#" + codes[1];
      $("wa").href = "https://wa.me/?text=" + encodeURIComponent(invite);
      $("sms").href = "sms:?&body=" + encodeURIComponent(invite);
      $("copy").onclick = function () { copy(invite, "Invite copied. Paste it into your group chat."); };
      $("sum").onclick = function () { copy(summary(), "List copied. Paste it into your group chat."); };
      render();
    });
  }
  function copy(text, ok) {
    if (navigator.share && matchMedia("(pointer:coarse)").matches) { navigator.share({ text: text }).catch(function () {}); return; }
    navigator.clipboard && navigator.clipboard.writeText(text).then(function () { $("status").textContent = ok; });
  }
  function summary() {
    var out = ["🍽️ " + p.name + " – who's bringing what"];
    cfg.cats.forEach(function (cat) {
      var lines = p.claims.filter(function (c) { return c.c === cat; }).map(function (c) {
        return "• " + c.g + ": " + c.d + suffix(c.t) + (c.v > 0 ? ", serves " + c.v : "") + (c.u ? " (recipe: " + c.u + ")" : "");
      });
      if (lines.length) out.push("\n" + cat + "\n" + lines.join("\n"));
    });
    if (open().length) out.push("\n❓ Still needed: " + openLines().join(", "));
    return out.join("\n");
  }
  function render() {
    $("title").textContent = p.name;
    var coming = p.guests.filter(function (g) { return g.r === "yes"; }).reduce(function (a, g) { return a + g.p; }, 0);
    var covered = p.slots.length - open().length;
    // Servings per course against the headcount, as servingsByCourse.
    var food = ["Mains", "Sides", "Appetizers", "Desserts"].map(function (cat) {
      var cs = p.claims.filter(function (c) { return c.c === cat; });
      if (!cs.some(function (c) { return c.v > 0; })) return "";
      return cat + " serve " + cs.reduce(function (a, c) { return a + (c.v || 0); }, 0) + (coming ? " of " + coming : "");
    }).filter(Boolean);
    $("count").textContent = covered + " of " + p.slots.length + " covered · " + coming + " coming" + (food.length ? " · " + food.join(" · ") : "");
    var list = $("sheet");
    list.innerHTML = "";
    cfg.cats.forEach(function (cat) {
      var ul = document.createElement("ul");
      p.slots.filter(function (s) { return s.c === cat; }).forEach(function (s) {
        var cs = C.claimsFor(p, s);
        ul.appendChild(li(s.l + ": " + (cs.length ? cs.map(function (c) { return c.g + " (" + c.d + suffix(c.t) + notes(c) + ")"; }).join(", ") : "open"),
          cs.length > s.n ? "over" : cs.length >= s.n ? "done" : ""));
      });
      p.claims.filter(function (c) { return c.c === cat && !p.slots.some(function (s) { return s.i === c.s; }); }).forEach(function (c) {
        ul.appendChild(li(c.d + suffix(c.t) + ": " + c.g + " (extra" + notes(c) + ")", "done"));
      });
      if (!ul.children.length) return;
      var h = document.createElement("h2");
      h.textContent = cat;
      list.appendChild(h);
      list.appendChild(ul);
    });
    var g = $("guests");
    g.innerHTML = "";
    p.guests.forEach(function (x) {
      g.appendChild(li(x.n + (x.p > 1 ? " +" + (x.p - 1) : "") + " · " + { yes: "going", maybe: "maybe", no: "can't come" }[x.r] + (x.o ? " · “" + x.o + "”" : "")));
    });
    $("app").hidden = false;
  }
  function add(text) {
    return C.decodeReplies(text).then(function (rs) {
      if (!rs.length) { $("status").textContent = "No replies found. Paste the whole message a guest sent."; return; }
      var r = C.merge(p, rs);
      $("status").textContent = r.wrongPotluck === rs.length ? "Those replies are for a different potluck." :
        "Added " + r.guests + " repl" + (r.guests === 1 ? "y" : "ies") + "." +
        (r.doubleBooked.length ? " Doubled up: " + r.doubleBooked.join("; ") + "." : "") +
        " The link changed: bookmark it again.";
      return save();
    });
  }

  $("paste").onsubmit = function (e) { e.preventDefault(); add($("replies").value).then(function () { $("replies").value = ""; }); };
  $("store").href = cfg.store;
  var parts = location.hash.split("~");
  C.decodeInvite(parts[0]).then(function (x) {
    if (!x) { $("bad").hidden = false; return; }
    p = x;
    return parts.length > 1 ? add(parts.slice(1).join(" ")) : save();
  });
})();
