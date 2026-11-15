/* The web wishlist (secretsanta/w/#WI1-…): a guest without the app fills in
   what they'd love and sends back the same WR1- reply the app makes. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var cfg = JSON.parse($("cfg").textContent);
  var inv = SSCodec.readInvite(decodeURIComponent(location.hash));
  if (!inv) {
    $("bad").hidden = false;
    return;
  }
  $("form").hidden = false;
  $("event").textContent = inv.e;
  if (inv.b) $("budget").textContent = "Budget: " + inv.b + ".";
  document.title = "Your wishlist · " + inv.e;

  document.querySelectorAll("[data-idea]").forEach(function (b) {
    b.onclick = function () {
      var w = $("wishes"), cur = w.value.trim(), idea = b.dataset.idea;
      if (cur.toLowerCase().indexOf(idea.toLowerCase()) >= 0) return;
      var next = cur ? cur + ", " + idea : idea;
      if (next.length <= 300) w.value = next;
    };
  });

  $("form").onsubmit = function (e) {
    e.preventDefault();
    var name = $("name").value.trim();
    if (!name) {
      $("err").textContent = "Add your name so the organizer knows who this is.";
      $("name").focus();
      return;
    }
    // Same keys, order and omissions as WishlistReply.toJson.
    var r = { i: inv.i, n: name };
    var w = $("wishes").value.trim(), s = $("sizes").value.trim(), x = $("dislikes").value.trim();
    if (w) r.w = w;
    if (s) r.s = s;
    if (x) r.x = x;
    var text = "My wishlist for “" + inv.e + "” 🎁\n\n" +
      "Organizer: share this message to the Secret Santa app, or paste it under “Add wishlist replies”.\n\n" +
      SSCodec.reply(r);
    $("form").hidden = true;
    $("done").hidden = false;
    $("out").value = text;
    $("wa").href = "https://wa.me/?text=" + encodeURIComponent(text);
    $("sms").href = "sms:?&body=" + encodeURIComponent(text);
    if (navigator.share) {
      $("share").hidden = false;
      $("share").onclick = function () { navigator.share({ text: text }).catch(function () {}); };
    }
  };
  $("copy").onclick = function () {
    var t = $("out");
    (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(
      function () { $("copied").textContent = "Copied. Paste it in a message to the organizer."; },
      function () { t.select(); document.execCommand("copy"); $("copied").textContent = "Copied."; });
  };
  $("store").href = cfg.store;
})();
