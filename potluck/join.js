/* The guest page (/potluck/j/#PL1-…): see the sheet, pick a dish, send the
   reply back. Nothing is uploaded: the sheet arrives inside the link and the
   reply leaves only through the chat app the guest picks. Wording follows
   replyMessage in lib/app_scope.dart. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var cfg = JSON.parse($("cfg").textContent), C = PLCodec, p = null;
  var TAGS = cfg.tags, SHORT = cfg.short, CATS = cfg.cats;

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e[k] = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function suffix(t) { return t.length ? " (" + t.map(function (x) { return SHORT[x] || x; }).join(", ") + ")" : ""; }
  function when(iso) {
    if (!iso) return "";
    var d = new Date(iso), timed = d.getHours() || d.getMinutes();
    var o = { weekday: "short", month: "short", day: "numeric" };
    if (d.getFullYear() !== new Date().getFullYear()) o.year = "numeric";
    if (timed) { o.hour = "numeric"; o.minute = "2-digit"; }
    return d.toLocaleString(undefined, o);
  }
  function tagBoxes(name) {
    return el("div", { class: "tags" }, TAGS.map(function (t) {
      return el("label", {}, [el("input", { type: "checkbox", name: name, value: t }), document.createTextNode(" " + t)]);
    }));
  }
  var NEEDS = [["oven", "Oven"], ["fridge", "Fridge"], ["plug", "Plug"], ["spoon", "Serving spoon"]];
  // Serves, kitchen needs and a recipe link: the optional details of a dish.
  function extrasFor(id) {
    return el("div", { class: "f" }, [
      el("label", { for: id + "_v", text: "Serves about (optional)" }),
      el("input", { id: id + "_v", type: "number", min: "1", max: "999", inputmode: "numeric" }),
      el("span", { text: "Needs at the party" }),
      el("div", { class: "tags" }, NEEDS.map(function (n) {
        return el("label", {}, [el("input", { type: "checkbox", name: id + "_k", value: n[0] }), document.createTextNode(" " + n[1])]);
      })),
      el("label", { for: id + "_u", text: "Recipe link (optional)" }),
      el("input", { id: id + "_u", type: "url", placeholder: "https://…" })
    ]);
  }
  // Adds the optional details to claim [c], as codec.js writes them.
  function withDetails(c, scope, id) {
    c.v = +$(id + "_v").value || 0;
    c.k = checked(scope, id + "_k");
    c.u = C.link($(id + "_u").value);
    return c;
  }
  function checked(scope, name) {
    return Array.prototype.map.call(scope.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }

  function render() {
    $("title").textContent = p.name;
    var meta = $("meta");
    meta.textContent = [when(p.when), p.host && "Hosted by " + p.host].filter(Boolean).join(" · ");
    if (p.location) {
      if (meta.textContent) meta.appendChild(document.createTextNode(" · "));
      meta.appendChild(el("a", { href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.location),
        target: "_blank", rel: "noopener", text: p.location + " ↗" }));
    }
    $("note").textContent = p.note;
    $("note").hidden = !p.note;
    var list = $("slots");
    list.innerHTML = "";
    CATS.forEach(function (cat) {
      var slots = p.slots.filter(function (s) { return s.c === cat; });
      var extras = p.claims.filter(function (c) { return c.c === cat && !p.slots.some(function (s) { return s.i === c.s; }); });
      if (!slots.length && !extras.length) return;
      var ul = el("ul", { class: "items" });
      slots.forEach(function (s) {
        var taken = C.claimsFor(p, s), full = taken.length >= s.n, id = "s_" + s.i;
        var who = taken.map(function (c) { return c.g; }).join(", ");
        var status = full ? "Taken by " + who : taken.length ? (s.n - taken.length) + " more needed · " + who + " signed up" : s.n > 1 ? s.n + " needed" : "Open";
        var detail = el("div", { class: "detail", hidden: "" }, [
          el("label", { for: id + "_d", text: "Your dish" }),
          el("input", { id: id + "_d", maxlength: "60", value: s.l }),
          tagBoxes(id + "_t"),
          extrasFor(id)
        ]);
        var box = el("input", { type: "checkbox", id: id, "data-slot": s.i });
        if (full) box.disabled = true;
        box.onchange = function () { detail.hidden = !box.checked; li.classList.toggle("mine", box.checked); };
        var li = el("li", { class: full ? "full" : "" }, [
          el("label", { for: id, class: "pick" }, [box, el("span", {}, [el("b", { text: s.l }), el("small", { text: status })])]),
          detail
        ]);
        ul.appendChild(li);
      });
      extras.forEach(function (c) {
        ul.appendChild(el("li", { class: "full" }, [el("span", { class: "pick" }, [el("span", {}, [el("b", { text: c.d + suffix(c.t || []) }), el("small", { text: "Brought by " + c.g })])])]));
      });
      list.appendChild(el("section", { class: "cat" }, [el("h2", { text: cat }), ul]));
    });
    $("form").hidden = false;
  }

  function addExtra() {
    var n = $("extras").children.length, id = "x" + n;
    var sel = el("select", { id: id + "_c", "aria-label": "Category" }, CATS.map(function (c) { return el("option", { value: c, text: c }); }));
    sel.value = "Other";
    var row = el("li", {}, [
      el("input", { id: id + "_d", maxlength: "60", placeholder: "e.g. Grandma's mac and cheese", "aria-label": "Dish" }),
      sel, tagBoxes(id + "_t"), extrasFor(id),
      el("button", { type: "button", class: "x", text: "Remove", onclick: function () { row.remove(); } })
    ]);
    $("extras").appendChild(row);
    row.querySelector("input").focus();
  }

  function message(r, link) {
    var g = r.g;
    var status = g.r === "yes" ? "is coming" + (g.p > 1 ? " (party of " + g.p + ")" : "") + " for" : g.r === "maybe" ? "is a maybe for" : "can't make it to";
    var dishes = r.c.map(function (c) { return c.d + suffix(c.t || []); }).join(", ");
    return (p.host ? "Hi " + p.host + "!" : "Hi!") + " " + g.n + " " + status + " " + p.name +
      (dishes ? " and bringing: " + dishes + "." : ".") + (g.o ? "\nNote: " + g.o : "") +
      "\n\nTap to add this to your sign-up sheet:\n" + link;
  }

  function ics() {
    if (!p.when) return null;
    var d = p.when.replace(/[-:]/g, "").slice(0, 15), allDay = /T0000/.test(d);
    var start = allDay ? "DTSTART;VALUE=DATE:" + d.slice(0, 8) : "DTSTART:" + d;
    var body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Potluck Planner//EN", "BEGIN:VEVENT",
      "UID:" + p.id + "@potluck", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      start, "SUMMARY:" + p.name.replace(/[,;\\]/g, " "), p.location ? "LOCATION:" + p.location.replace(/[,;\\]/g, " ") : "",
      // A reminder the day before, like the app's.
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + p.name.replace(/[,;\\]/g, " ") + " is tomorrow", "TRIGGER:-P1D", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    return URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  }

  function send(e) {
    e.preventDefault();
    var name = $("name").value.trim(), err = $("err");
    if (!name) { err.textContent = "Enter your name first."; $("name").focus(); return; }
    var rsvp = (document.querySelector('input[name="rsvp"]:checked') || {}).value || "yes";
    var claims = [];
    if (rsvp !== "no") {
      document.querySelectorAll("input[data-slot]:checked").forEach(function (b) {
        var s = p.slots.filter(function (x) { return x.i === b.dataset.slot; })[0];
        var dish = $(b.id + "_d").value.trim() || s.l;
        claims.push(withDetails({ i: C.newId(), g: name, d: dish, s: s.i, c: s.c, t: checked(document, b.id + "_t") }, document, b.id));
      });
      Array.prototype.forEach.call($("extras").children, function (li) {
        var id = li.querySelector("input").id.replace("_d", ""), dish = $(id + "_d").value.trim();
        if (dish) claims.push(withDetails({ i: C.newId(), g: name, d: dish, c: $(id + "_c").value, t: checked(li, id + "_t") }, li, id));
      });
    }
    var r = { p: p.id, g: { n: name, r: rsvp, p: Math.max(1, Math.min(20, +$("party").value || 1)), o: $("gnote").value.trim() }, c: claims };
    err.textContent = "";
    C.reply(r).then(function (code) {
      var text = message(r, cfg.site + "a/#" + code);
      $("out").value = text;
      $("wa").href = "https://wa.me/?text=" + encodeURIComponent(text);
      $("sms").href = "sms:?&body=" + encodeURIComponent(text);
      if (navigator.share) { $("share").hidden = false; $("share").onclick = function () { navigator.share({ text: text }).catch(function () {}); }; }
      $("copy").onclick = function () { navigator.clipboard && navigator.clipboard.writeText(text).then(function () { $("copied").textContent = "Copied. Paste it to " + (p.host || "the host") + "."; }); };
      var cal = ics();
      if (cal) { $("cal").href = cal; $("cal").download = "potluck.ics"; $("cal").hidden = false; }
      $("form").hidden = true;
      $("done").hidden = false;
      $("done").focus();
    });
  }

  $("store").href = cfg.store;
  $("more").onclick = addExtra;
  $("form").onsubmit = send;
  $("edit").onclick = function () { $("done").hidden = true; $("form").hidden = false; };
  document.querySelectorAll('input[name="rsvp"]').forEach(function (r) {
    r.onchange = function () { $("bring").hidden = r.value === "no" && r.checked; };
  });
  $("paste").onsubmit = function (e) {
    e.preventDefault();
    C.decodeInvite($("pasted").value).then(function (x) {
      if (!x) { $("perr").textContent = "No invite in that text. Paste the whole message from the host."; return; }
      p = x; $("ask").hidden = true; render();
    });
  };
  C.decodeInvite(location.hash).then(function (x) {
    if (!x) { $("ask").hidden = false; return; }
    p = x;
    render();
  });
})();
