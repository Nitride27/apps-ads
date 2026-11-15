/* The app's codes in the browser. Must read and write exactly what
   lib/codec.dart does: JSON -> zlib -> base64url without padding, behind
   "PL1-" (a sheet) or "PR1-" (a guest's reply). Browsers have zlib built in
   as CompressionStream("deflate"), so no library is needed. mergeReplies
   follows lib/models.dart line for line; check_web_codec.mjs keeps them equal. */
(function (root) {
  "use strict";
  var enc = new TextEncoder(), dec = new TextDecoder();

  function b64(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unb64(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function pipe(bytes, stream) {
    return new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function pack(prefix, obj) {
    return pipe(enc.encode(JSON.stringify(obj)), new CompressionStream("deflate")).then(function (z) { return prefix + b64(z); });
  }
  function unpack(code) {
    try {
      return pipe(unb64(code), new DecompressionStream("deflate"))
        .then(function (raw) { return JSON.parse(dec.decode(raw)); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  var INVITE = /PL1-([A-Za-z0-9_-]+)/, REPLY = /PR1-([A-Za-z0-9_-]+)/g;
  var NEEDS = ["oven", "fridge", "plug", "spoon"];
  function link(u) {
    u = typeof u === "string" ? u.trim() : "";
    try { var x = new URL(u); return (x.protocol === "https:" || x.protocol === "http:") && x.hostname ? u : ""; }
    catch (e) { return ""; }
  }

  // Same shape as Potluck.fromJson: missing fields get the app's defaults.
  function sheet(j) {
    if (!j || typeof j.id !== "string" || typeof j.name !== "string") return null;
    return {
      id: j.id, name: j.name, when: j.when || null, location: j.location || "", note: j.note || "",
      host: j.host || "", slots: (j.slots || []).map(function (s) { return { i: s.i, c: s.c, l: s.l, n: s.n || 1 }; }),
      claims: (j.claims || []).map(claim), guests: (j.guests || []).map(guest),
      createdAt: j.createdAt || new Date().toISOString()
    };
  }
  function claim(c) {
    var o = { i: c.i, g: c.g, d: c.d };
    if (c.s != null) o.s = c.s;
    o.c = c.c || "Other";
    if (c.t && c.t.length) o.t = c.t.slice();
    // Optional fields, written only when set (Claim.toJson). Links other
    // than http(s) are dropped, as in safeLink.
    var v = Math.min(999, Math.max(0, Math.floor(+c.v || 0)));
    if (v > 0) o.v = v;
    var k = (c.k || []).filter(function (x) { return NEEDS.indexOf(x) >= 0; });
    if (k.length) o.k = k;
    var u = link(c.u);
    if (u) o.u = u;
    return o;
  }
  function guest(g) {
    var o = { n: g.n, r: ["yes", "maybe", "no"].indexOf(g.r) >= 0 ? g.r : "yes", p: g.p || 1 };
    if (g.o) o.o = g.o;
    return o;
  }
  // Key order matches Potluck.toJson, so a sheet made here reads the same in the app.
  function sheetJson(p, withGuests) {
    var o = { id: p.id, name: p.name, when: p.when, location: p.location, note: p.note, host: p.host,
      slots: p.slots, claims: p.claims.map(claim) };
    if (withGuests) o.guests = p.guests.map(guest);
    o.createdAt = p.createdAt;
    return o;
  }

  function newId(len) {
    var a = new Uint8Array(len || 8), s = "";
    crypto.getRandomValues(a);
    for (var i = 0; i < a.length; i++) s += (a[i] % 36).toString(36);
    return s;
  }
  // DateTime.toIso8601String for a local time: "2026-11-26T17:30:00.000".
  function localIso(date, time) {
    if (!date) return null;
    return date + "T" + (time || "00:00") + ":00.000";
  }

  var api = {
    invite: function (p) { return pack("PL1-", sheetJson(p, false)); },
    // The host's own copy for the web host page keeps guests too.
    hostCode: function (p) { return pack("PL1-", sheetJson(p, true)); },
    reply: function (r) {
      return pack("PR1-", { p: r.p, g: guest(r.g), c: r.c.map(claim) });
    },
    decodeInvite: function (text) {
      var m = INVITE.exec(text || "");
      return m ? unpack(m[1]).then(sheet) : Promise.resolve(null);
    },
    decodeReplies: function (text) {
      var ms = (text || "").match(REPLY) || [];
      return Promise.all(ms.map(function (m) { return unpack(m.slice(4)); })).then(function (js) {
        return js.filter(function (j) { return j && typeof j.p === "string" && j.g && typeof j.g.n === "string"; })
          .map(function (j) { return { p: j.p, g: guest(j.g), c: (j.c || []).map(claim) }; });
      });
    },
    toJson: sheetJson,
    link: link,
    newId: newId,
    localIso: localIso,
    claimsFor: function (p, s) { return p.claims.filter(function (c) { return c.s === s.i; }); },
    isFull: function (p, s) { return api.claimsFor(p, s).length >= s.n; },
    // Same as mergeReplies in lib/models.dart.
    merge: function (p, replies) {
      var res = { guests: 0, dishes: 0, wrongPotluck: 0, doubleBooked: [] };
      replies.forEach(function (r) {
        if (r.p !== p.id) { res.wrongPotluck++; return; }
        var name = r.g.n.trim(), low = name.toLowerCase();
        var ex = p.guests.filter(function (g) { return g.n.toLowerCase() === low; })[0];
        if (!ex) { r.g.n = name; p.guests.push(r.g); }
        else { ex.r = r.g.r; ex.p = r.g.p; if (r.g.o) ex.o = r.g.o; else delete ex.o; }
        res.guests++;
        p.claims = p.claims.filter(function (c) { return c.g.toLowerCase() !== low; });
        r.c.forEach(function (c) {
          var slot = p.slots.filter(function (s) { return s.i === c.s; })[0];
          if (slot && api.isFull(p, slot)) res.doubleBooked.push(c.g + ": " + slot.l);
          c.g = name;
          p.claims.push(c);
          res.dishes++;
        });
      });
      return res;
    }
  };
  root.PLCodec = api;
})(typeof window !== "undefined" ? window : globalThis);
