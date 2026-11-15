/* The landing page's sign-up sheet maker: pick a template, fill in the
   details, and get a sheet that lives in a link (the host page), with an
   invite link for guests. Templates come from lib/templates.dart. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var form = $("maker");
  if (!form) return;
  var cfg = JSON.parse($("cfg").textContent), C = PLCodec;
  var pick = $("mtemplate");
  cfg.templates.forEach(function (t, i) {
    var o = document.createElement("option");
    o.value = i;
    o.textContent = t.name + (t.items.length ? " (" + t.items.length + " items)" : "");
    pick.appendChild(o);
  });
  pick.onchange = function () {
    var t = cfg.templates[pick.value], n = $("mname");
    if (!n.value || cfg.templates.some(function (x) { return x.title === n.value; })) n.value = t.title;
  };
  form.onsubmit = function (e) {
    e.preventDefault();
    var t = cfg.templates[pick.value], name = $("mname").value.trim(), host = $("mhost").value.trim();
    if (!name) { $("mmsg").textContent = "Give your potluck a name."; $("mname").focus(); return; }
    var p = {
      id: C.newId(10), name: name.slice(0, 80), when: C.localIso($("mdate").value, $("mtime").value),
      location: $("mplace").value.trim().slice(0, 120), note: $("mnote").value.trim().slice(0, 200), host: host.slice(0, 40),
      slots: t.items.map(function (x) { return { i: C.newId(), c: x[0], l: x[1], n: x[2] }; }),
      claims: [], guests: host ? [{ n: host, r: "yes", p: 1 }] : [], createdAt: new Date().toISOString()
    };
    $("mmsg").textContent = "Making your sheet…";
    C.hostCode(p).then(function (code) { location.href = cfg.site + "h/#" + code; });
  };
})();
