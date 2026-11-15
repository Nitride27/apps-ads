/* The web reveal (secretsanta/r/#GD1-…): the same envelope as the app, for
   anyone without it (iPhone, a laptop). The code stays in the URL fragment,
   which browsers never send to a server, and this page loads nothing else. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cfg = JSON.parse($("cfg").textContent);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // Wishlist text with its links made tappable, built without innerHTML.
  function linkify(parent, text) {
    text.split(/(https?:\/\/[^\s]+)/g).forEach(function (part, i) {
      if (i % 2) {
        var a = el("a", null, part.replace(/^https?:\/\//, "").slice(0, 60));
        a.href = part;
        a.rel = "noopener nofollow noreferrer";
        a.target = "_blank";
        parent.appendChild(a);
      } else if (part) {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }
  function dateOf(s) {
    var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function daysTo(d) {
    var t = new Date();
    t = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.round((d - t) / 864e5);
  }
  function ics(d) {
    var day = d.e ? d.e : "Secret Santa", ymd = d.d.replace(/-/g, "");
    var next = dateOf(d.d);
    next.setDate(next.getDate() + 1);
    var end = next.getFullYear() + String(next.getMonth() + 1).padStart(2, "0") + String(next.getDate()).padStart(2, "0");
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Secret Santa//EN", "BEGIN:VEVENT",
      "UID:" + ymd + "-" + Math.random().toString(36).slice(2) + "@secretsanta",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART;VALUE=DATE:" + ymd, "DTEND;VALUE=DATE:" + end,
      "SUMMARY:" + day.replace(/[,;\\]/g, " ") + " (gift exchange)",
      // The match stays out of the calendar, which may sync and be shared.
      "DESCRIPTION:Bring your Secret Santa gift." + (d.b ? " Budget " + d.b.replace(/[,;\\]/g, " ") + "." : ""),
      "END:VEVENT", "END:VCALENDAR"];
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
  }

  function show(d) {
    $("ask").hidden = true;
    var env = $("env"), card = $("card");
    $("for").textContent = "For " + d.g;
    $("event").textContent = d.e;
    $("name").textContent = d.r;
    env.hidden = false;
    var open = function () {
      if (env.classList.contains("open")) return;
      env.classList.add("open");
      env.setAttribute("aria-label", "You are Secret Santa for " + d.r);
      setTimeout(function () { card.hidden = false; card.focus({ preventScroll: true }); }, still ? 0 : 900);
      if (navigator.vibrate) navigator.vibrate(30);
    };
    env.onclick = open;

    var facts = $("facts");
    if (d.b) facts.appendChild(el("li", null, "Budget " + d.b));
    var date = dateOf(d.d);
    if (date) {
      var n = daysTo(date);
      facts.appendChild(el("li", null, date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
        (n > 1 ? " · " + n + " days to go" : n === 1 ? " · tomorrow" : n === 0 ? " · today" : "")));
      var cal = $("cal");
      cal.href = ics(d);
      cal.download = "secret-santa.ics";
      cal.hidden = false;
    }
    if (d.h) {
      var wish = $("wish");
      wish.hidden = false;
      d.h.split("\n").forEach(function (line) {
        var p = el("p");
        linkify(p, line);
        wish.appendChild(p);
      });
    }
    if (d.n) {
      $("note").hidden = false;
      $("note").textContent = "“" + d.n + "”";
    }
    var android = /Android/i.test(navigator.userAgent);
    $("app").textContent = android ? "Plan your gift in the app" : "Get the app (Android)";
    $("app").href = cfg.store;
    document.title = "Your Secret Santa match · " + d.e;
  }

  function fromText(t) {
    var d = SSCodec.readReveal(t);
    if (d) {
      // Keep the code in the address so a reload still works; drop pasted text.
      history.replaceState(null, "", "#" + /GD1-[A-Za-z0-9_-]+/.exec(t)[0]);
      show(d);
      return true;
    }
    return false;
  }

  $("paste").onsubmit = function (e) {
    e.preventDefault();
    if (!fromText($("msg").value)) {
      $("err").textContent = SSCodec.readInvite($("msg").value)
        ? "That’s a wishlist invite. Open it from the link in that message."
        : "No match found in that. Paste the whole message you were sent.";
    }
  };
  if (!fromText(decodeURIComponent(location.hash))) $("ask").hidden = false;
})();
