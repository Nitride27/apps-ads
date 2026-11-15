/* A guest's reply link (/potluck/a/#PR1-…) opened in a browser. On the
   host's Android phone the app catches it instead. Here it shows what the
   guest said and, if this browser holds the host's web sheet, adds it there. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var cfg = JSON.parse($("cfg").textContent);
  $("store").href = cfg.store;
  PLCodec.decodeReplies(location.hash).then(function (rs) {
    if (!rs.length) { $("bad").hidden = false; return; }
    var r = rs[0], ul = $("said");
    ul.innerHTML = "";
    var line = r.g.n + ({ yes: " is coming", maybe: " is a maybe", no: " can't make it" }[r.g.r]) + (r.g.p > 1 ? " (party of " + r.g.p + ")" : "");
    [line].concat(r.c.map(function (c) { return "Bringing " + c.d; }), r.g.o ? ["Note: " + r.g.o] : []).forEach(function (t) {
      var li = document.createElement("li"); li.textContent = t; ul.appendChild(li);
    });
    var sheets = {};
    try { sheets = JSON.parse(localStorage.getItem("potluck_sheets_v1")) || {}; } catch (e) {}
    var mine = sheets[r.p];
    if (mine) {
      $("add").href = mine.link + "~" + location.hash.slice(1);
      $("add").textContent = "Add to " + mine.name;
      $("web").hidden = false;
    } else {
      $("nosheet").hidden = false;
    }
    $("ok").hidden = false;
  });
})();
