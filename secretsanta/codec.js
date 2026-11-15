/* Secret Santa codes, byte for byte the same as lib/codec.dart, so a link made
   on the web opens in the app and a link from the app opens on the web.
   GD1- (a match) is light obfuscation, not encryption. Runs in browsers and in
   Node (tool/check_web_codec.mjs checks it against codes the app made). */
(function (root) {
  "use strict";
  var enc = new TextEncoder(), dec = new TextDecoder("utf-8", { fatal: true });
  var KEY = enc.encode("jingle-all-the-way-2026");

  function b64u(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unb64u(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var b = atob(s), out = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }
  function xor(bytes) {
    var o = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) o[i] = bytes[i] ^ KEY[i % KEY.length];
    return o;
  }
  // Finds a code anywhere in pasted text, like the app does.
  function find(prefix, text) {
    var m = new RegExp(prefix + "([A-Za-z0-9_-]+)").exec(text || "");
    return m && m[1];
  }
  function read(prefix, text, scrambled, valid) {
    var c = find(prefix, text);
    if (!c) return null;
    try {
      var bytes = unb64u(c);
      var j = JSON.parse(dec.decode(scrambled ? xor(bytes) : bytes));
      return j && typeof j === "object" && valid(j) ? j : null;
    } catch (e) {
      return null;
    }
  }
  var str = function (v) { return typeof v === "string"; };

  root.SSCodec = {
    // Keys and their order match RevealData.toJson: e, g, r, h, b, d, n.
    reveal: function (o) { return "GD1-" + b64u(xor(enc.encode(JSON.stringify(o)))); },
    readReveal: function (t) {
      return read("GD1-", t, true, function (j) { return str(j.e) && str(j.g) && str(j.r); });
    },
    invite: function (o) { return "WI1-" + b64u(enc.encode(JSON.stringify(o))); },
    readInvite: function (t) {
      return read("WI1-", t, false, function (j) { return str(j.i) && str(j.e); });
    },
    reply: function (o) { return "WR1-" + b64u(enc.encode(JSON.stringify(o))); },
    readReply: function (t) {
      return read("WR1-", t, false, function (j) { return str(j.i) && str(j.n); });
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
