/**
 * Minified by jsDelivr using Terser v5.13.1.
 * Original file: /npm/@xpadev-net/niconicomments@0.2.8/dist/bundle.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
/*!
  niconicomments.js v0.2.8
  (c) 2021 xpadev-net https://xpadev.net
  Released under the MIT License.
*/
! function(t, e) { "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).NiconiComments = e() }(this, (function() {
    "use strict";
    /*! *****************************************************************************
        Copyright (c) Microsoft Corporation.

        Permission to use, copy, modify, and/or distribute this software for any
        purpose with or without fee is hereby granted.

        THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
        REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
        AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
        INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
        LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
        OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
        PERFORMANCE OF THIS SOFTWARE.
        ***************************************************************************** */
    var t = function() {
            return t = Object.assign || function(t) {
                for (var e, i = 1, o = arguments.length; i < o; i++)
                    for (var s in e = arguments[i]) Object.prototype.hasOwnProperty.call(e, s) && (t[s] = e[s]);
                return t
            }, t.apply(this, arguments)
        },
        e = function() {
            function e(t, e, i) {
                void 0 === i && (i = { useLegacy: !1, formatted: !1, video: null, showCollision: !1, showFPS: !1, showCommentCount: !1, drawAllImageOnLoad: !1 });
                var o = this;
                this.canvas = t, this.context = t.getContext("2d"), this.context.strokeStyle = "rgba(0,0,0,0.7)", this.context.textAlign = "start", this.context.textBaseline = "alphabetic", this.context.lineWidth = 4, this.commentYPaddingTop = .08, this.commentYMarginBottom = .24, this.fontSize = { small: { default: 47, resized: 26.1 }, medium: { default: 74, resized: 38.7 }, big: { default: 111, resized: 62 } }, this.doubleResizeMaxWidth = { full: { legacy: 3020, default: 3220 }, normal: { legacy: 2540, default: 2740 } };
                var s = i.formatted ? e : this.parseData(e);
                this.video = i.video ? i.video : null, this.showCollision = i.showCollision, this.showFPS = i.showFPS, this.showCommentCount = i.showCommentCount, this.timeline = {}, this.nicoScripts = { reverse: [], default: [], replace: [], ban: [] }, this.collision_right = {}, this.collision_left = {}, this.collision_ue = {}, this.collision_shita = {}, this.lastVpos = -1, this.useLegacy = i.useLegacy, this.preRendering(s, i.drawAllImageOnLoad), this.fpsCount = 0, this.fps = 0, this.fpsClock = window.setInterval((function() { o.fps = 2 * o.fpsCount, o.fpsCount = 0 }), 500)
            }
            return e.prototype.parseData = function(t) {
                for (var e = [], i = 0; i < t.length; i++)
                    for (var o in t[i]) {
                        var s = t[i][o];
                        if ("chat" === o && 1 !== s.deleted) {
                            var n = { id: s.no, vpos: s.vpos, content: s.content, date: s.date, date_usec: s.date_usec, owner: !s.user_id, premium: 1 === s.premium, mail: [] };
                            s.mail && (n.mail = s.mail.split(/[\s　]/g)), s.content.startsWith("/") && !s.user_id && n.mail.push("invisible"), e.push(n)
                        }
                    }
                return e.sort((function(t, e) { return t.vpos < e.vpos ? -1 : t.vpos > e.vpos ? 1 : t.date < e.date ? -1 : t.date > e.date ? 1 : t.date_usec < e.date_usec ? -1 : t.date_usec > e.date_usec ? 1 : 0 })), e
            }, e.prototype.preRendering = function(t, e) {
                var i = this.getCommentPos(this.getCommentSize(this.getFont(t)));
                if (this.data = this.sortComment(i), e)
                    for (var o in i) this.getTextImage(Number(o))
            }, e.prototype.getFont = function(t) { var e = []; for (var i in t) t[i].content = t[i].content.replace(/\t/g, "  "), e[i] = this.parseCommandAndNicoscript(t[i]); return e }, e.prototype.getCommentSize = function(t) {
                var e = i(t, "font", "fontSize"),
                    s = [];
                for (var n in e)
                    for (var a in e[n])
                        for (var r in this.context.font = o(n, a, this.useLegacy), e[n][a]) {
                            var l = e[n][a][r];
                            if (!l.invisible) {
                                var h = this.measureText(l);
                                s[l.index] = t[l.index], s[l.index].height = h.height, s[l.index].width = h.width, s[l.index].width_max = h.width_max, s[l.index].width_min = h.width_min, h.resized && (s[l.index].fontSize = h.fontSize, this.context.font = o(n, a, this.useLegacy))
                            }
                        }
                return s
            }, e.prototype.getCommentPos = function(t) {
                var e = t;
                for (var i in e) {
                    var o = e[i];
                    if (!o.invisible) {
                        for (var n = 0; n < 500; n++) this.timeline[o.vpos + n] || (this.timeline[o.vpos + n] = []), this.collision_right[o.vpos + n] || (this.collision_right[o.vpos + n] = []), this.collision_left[o.vpos + n] || (this.collision_left[o.vpos + n] = []), this.collision_ue[o.vpos + n] || (this.collision_ue[o.vpos + n] = []), this.collision_shita[o.vpos + n] || (this.collision_shita[o.vpos + n] = []);
                        if ("naka" === o.loc) {
                            o.vpos -= 70, t[i].vpos -= 70;
                            var a = 0,
                                r = !1,
                                l = !0,
                                h = 0;
                            if (1080 < o.height) a = (o.height - 1080) / -2;
                            else
                                for (; l && h < 10;) { l = !1, h++; for (n = 0; n < 500; n++) { var c = o.vpos + n; if ((u = 1920 - (1920 + o.width_max) * n / 500) + o.width_max >= 1880) { for (var f in this.collision_right[c]) { if (a < e[p = this.collision_right[c][f]].posY + e[p].height && a + o.height > e[p].posY && e[p].owner === o.owner && (e[p].posY + e[p].height > a && (a = e[p].posY + e[p].height, l = !0), a + o.height > 1080)) { a = 1080 < o.height ? (o.height - 1080) / -2 : Math.floor(Math.random() * (1080 - o.height)), r = !0; break } } if (r) break } if (u <= 40 && !1 === r) { for (var f in this.collision_left[c]) { if (a < e[p = this.collision_left[c][f]].posY + e[p].height && a + o.height > e[p].posY && e[p].owner === o.owner && (e[p].posY + e[p].height > a && (a = e[p].posY + e[p].height, l = !0), a + o.height > 1080)) { a = 1080 < o.height ? 0 : Math.random() * (1080 - o.height), r = !0; break } } if (r) break } if (r) break } }
                            for (n = 0; n < 500; n++) {
                                c = o.vpos + n;
                                var u = 1920 - (1920 + o.width_max) * n / 500;
                                s(this.timeline, c, i), u + o.width_max >= 1880 && s(this.collision_right, c, i), u <= 40 && s(this.collision_left, c, i)
                            }
                            t[i].posY = a
                        } else {
                            a = 0, r = !1, l = !0, h = 0;
                            var d = void 0;
                            for ("ue" === o.loc ? d = this.collision_ue : "shita" === o.loc && (d = this.collision_shita); l && h < 10;) { l = !1, h++; for (n = 0; n < 300; n++) { c = o.vpos + n; for (var f in d[c]) { var p; if (a < e[p = d[c][f]].posY + e[p].height && a + o.height > e[p].posY && e[p].owner === o.owner && (e[p].posY + e[p].height > a && (a = e[p].posY + e[p].height, l = !0), a + o.height > 1080)) { a = 1e3 <= o.height ? 0 : Math.floor(Math.random() * (1080 - o.height)), r = !0; break } } if (r) break } }
                            for (n = 0; n < o.long; n++) {
                                c = o.vpos + n;
                                s(this.timeline, c, i), "ue" === o.loc ? s(this.collision_ue, c, i) : s(this.collision_shita, c, i)
                            }
                            t[i].posY = a
                        }
                    }
                }
                return t
            }, e.prototype.sortComment = function(t) {
                for (var e in this.timeline) this.timeline[e].sort((function(e, i) {
                    var o = t[e],
                        s = t[i];
                    return !o.owner && s.owner ? -1 : o.owner && !s.owner ? 1 : 0
                }));
                return t
            }, e.prototype.measureText = function(t) {
                var e, i, s, n, a = [],
                    r = t.content.split("\n");
                t.resized || t.ender || ("big" === t.size && r.length > 2 ? (t.fontSize = this.fontSize.big.resized, t.resized = !0, t.tateresized = !0, this.context.font = o(t.font, t.fontSize, this.useLegacy)) : "medium" === t.size && r.length > 4 ? (t.fontSize = this.fontSize.medium.resized, t.resized = !0, t.tateresized = !0, this.context.font = o(t.font, t.fontSize, this.useLegacy)) : "small" === t.size && r.length > 6 && (t.fontSize = this.fontSize.small.resized, t.resized = !0, t.tateresized = !0, this.context.font = o(t.font, t.fontSize, this.useLegacy)));
                for (var l = 0; l < r.length; l++) {
                    var h = this.context.measureText(r[l]);
                    a.push(h.width)
                }
                if (e = a.reduce((function(t, e) { return t + e }), 0) / a.length, i = Math.max.apply(Math, a), s = Math.min.apply(Math, a), n = t.fontSize * (1 + this.commentYPaddingTop) * r.length + this.commentYMarginBottom * t.fontSize, "naka" === t.loc || t.tateresized) { if ("naka" !== t.loc && t.tateresized && (t.full && i > 1920 || !t.full && i > 1440) && !t.yokoResized) return t.fontSize = this.fontSize[t.size].default, t.resized = !0, t.yokoResized = !0, this.context.font = o(t.font, t.fontSize, this.useLegacy), this.measureText(t); if ("naka" !== t.loc && t.tateresized && t.yokoResized) { if (t.full && i > this.doubleResizeMaxWidth.full[this.useLegacy ? "legacy" : "default"]) return t.fontSize -= 1, this.context.font = o(t.font, t.fontSize, this.useLegacy), this.measureText(t); if (!t.full && i > this.doubleResizeMaxWidth.normal[this.useLegacy ? "legacy" : "default"]) return t.fontSize -= 1, this.context.font = o(t.font, t.fontSize, this.useLegacy), this.measureText(t) } } else { if (t.full && i > 1920) return t.fontSize -= 2, t.resized = !0, t.yokoResized = !0, this.context.font = o(t.font, t.fontSize, this.useLegacy), this.measureText(t); if (!t.full && i > 1440) return t.fontSize -= 1, t.resized = !0, t.yokoResized = !0, this.context.font = o(t.font, t.fontSize, this.useLegacy), this.measureText(t) }
                return { width: e, width_max: i, width_min: s, height: n, resized: t.resized, fontSize: t.fontSize }
            }, e.prototype.drawText = function(t, e) {
                var i = !1;
                for (var o in this.nicoScripts.reverse) {
                    if ("コメ" === (s = this.nicoScripts.reverse[o]).target && t.owner || "投コメ" === s.target && !t.owner) break;
                    s.start < e && e < s.end && (i = !0)
                }
                for (var o in this.nicoScripts.ban) { var s; if ((s = this.nicoScripts.ban[o]).start < e && e < s.end) return }
                var n = (1920 - t.width_max) / 2,
                    a = t.posY;
                "naka" === t.loc ? n = i ? (1920 + t.width_max) * (e - t.vpos) / 500 - t.width_max : 1920 - (1920 + t.width_max) * (e - t.vpos) / 500 : "shita" === t.loc && (a = 1080 - t.posY - t.height), this.context.drawImage(t.image, n, a)
            }, e.prototype.getTextImage = function(t) {
                var e = this.data[t];
                if (!e.invisible) {
                    var i = document.createElement("canvas");
                    i.width = e.width_max, i.height = e.height;
                    var s = i.getContext("2d");
                    if (s.strokeStyle = "rgba(0,0,0,0.4)", s.textAlign = "start", s.textBaseline = "alphabetic", s.lineWidth = 8, s.font = o(e.font, e.fontSize, this.useLegacy), e._live) {
                        var a = n(e.color);
                        s.fillStyle = "rgba(".concat(a[0], ",").concat(a[1], ",").concat(a[2], ",0.5)")
                    } else s.fillStyle = e.color;
                    "#000000" === e.color && (s.strokeStyle = "rgba(255,255,255,0.7)"), this.showCollision && (s.strokeStyle = "rgba(0,255,255,1)", s.strokeRect(0, 0, e.width_max, e.height), "#000000" === e.color ? s.strokeStyle = "rgba(255,255,255,0.7)" : s.strokeStyle = "rgba(0,0,0,0.7)");
                    var r = e.content.split("\n");
                    for (var l in r) {
                        var h, c = r[l];
                        h = (Number(l) + 1) * e.fontSize * (1 + this.commentYPaddingTop), s.strokeText(c, 0, h), s.fillText(c, 0, h), this.showCollision && (s.strokeStyle = "rgba(255,255,0,0.5)", s.strokeRect(0, h, e.width_max, -1 * e.fontSize), "#000000" === e.color ? s.strokeStyle = "rgba(255,255,255,0.7)" : s.strokeStyle = "rgba(0,0,0,0.7)")
                    }
                    this.data[t].image = i
                }
            }, e.prototype.parseCommand = function(t) {
                var e = t.mail,
                    i = null,
                    o = null,
                    s = null,
                    n = null,
                    a = null,
                    r = !1,
                    l = !1,
                    h = !1,
                    c = !1,
                    f = null;
                for (var u in e) {
                    var d = e[u].toLowerCase(),
                        p = d.match(/^@([0-9.]+)/);
                    if (p && (f = p[1]), null === i) switch (d) {
                        case "ue":
                            i = "ue";
                            break;
                        case "shita":
                            i = "shita"
                    }
                    if (null === o) switch (d) {
                        case "big":
                            o = "big", s = this.fontSize.big.default;
                            break;
                        case "small":
                            o = "small", s = this.fontSize.small.default
                    }
                    if (null === n) switch (d) {
                        case "white":
                            n = "#FFFFFF";
                            break;
                        case "red":
                            n = "#FF0000";
                            break;
                        case "pink":
                            n = "#FF8080";
                            break;
                        case "orange":
                            n = "#FFC000";
                            break;
                        case "yellow":
                            n = "#FFFF00";
                            break;
                        case "green":
                            n = "#00FF00";
                            break;
                        case "cyan":
                            n = "#00FFFF";
                            break;
                        case "blue":
                            n = "#0000FF";
                            break;
                        case "purple":
                            n = "#C000FF";
                            break;
                        case "black":
                            n = "#000000";
                            break;
                        case "white2":
                        case "niconicowhite":
                            n = "#CCCC99";
                            break;
                        case "red2":
                        case "truered":
                            n = "#CC0033";
                            break;
                        case "pink2":
                            n = "#FF33CC";
                            break;
                        case "orange2":
                        case "passionorange":
                            n = "#FF6600";
                            break;
                        case "yellow2":
                        case "madyellow":
                            n = "#999900";
                            break;
                        case "green2":
                        case "elementalgreen":
                            n = "#00CC66";
                            break;
                        case "cyan2":
                            n = "#00CCCC";
                            break;
                        case "blue2":
                        case "marineblue":
                            n = "#3399FF";
                            break;
                        case "purple2":
                        case "nobleviolet":
                            n = "#6633CC";
                            break;
                        case "black2":
                            n = "#666666";
                            break;
                        default:
                            var g = d.match(/#[0-9a-z]{3,6}/);
                            g && t.premium && (n = g[0].toUpperCase())
                    }
                    if (null === a) switch (d) {
                        case "gothic":
                            a = "gothic";
                            break;
                        case "mincho":
                            a = "mincho"
                    }
                    switch (d) {
                        case "full":
                            r = !0;
                            break;
                        case "ender":
                            l = !0;
                            break;
                        case "_live":
                            h = !0;
                            break;
                        case "invisible":
                            c = !0
                    }
                }
                return { loc: i, size: o, fontSize: s, color: n, font: a, full: r, ender: l, _live: h, invisible: c, long: f }
            }, e.prototype.parseCommandAndNicoscript = function(e) {
                var i = this.parseCommand(e),
                    o = e.content.match(/^@(デフォルト|置換|逆|コメント禁止|シーク禁止|ジャンプ)/);
                if (o) {
                    switch (o[1]) {
                        case "デフォルト":
                            this.nicoScripts.default.push({ start: e.vpos, long: null === i.long ? null : Math.floor(100 * i.long), color: i.color, size: i.size, font: i.font, loc: i.loc });
                            break;
                        case "逆":
                            var s = e.content.match(/^@逆 ?(全|コメ|投コメ)?/);
                            s[1] || (s[1] = "全"), null === i.long && (i.long = 30), this.nicoScripts.reverse.push({ start: e.vpos, end: e.vpos + 100 * i.long, target: s[1] });
                            break;
                        case "コメント禁止":
                            null === i.long && (i.long = 30), this.nicoScripts.reverse.push({ start: e.vpos, end: e.vpos + 100 * i.long });
                            break;
                        case "置換":
                            for (var n = "", r = "", l = "", h = [], c = 0, f = e.content.split("").slice(4); c < f.length; c++) {
                                (m = f[c]).match(/["'「]/) && "" === n ? n = m : m.match(/["']/) && n === m && "\\" !== r ? (h.push(a(l, "\\n", "\n")), n = "", l = "") : m.match(/」/) && "「" === n ? (h.push(l), n = "", l = "") : "" === n && m.match(/[\s　]/) ? l && (h.push(l), l = "") : l += m, r = m
                            }
                            h.push(l), this.nicoScripts.replace.push({ start: e.vpos, long: null === i.long ? null : Math.floor(100 * i.long), keyword: h[0], replace: h[1] || "", range: h[2] || "単", target: h[3] || "コメ", condition: h[4] || "部分一致", color: i.color, size: i.size, font: i.font, loc: i.loc })
                    }
                    i.invisible = !0
                }
                var u = "#FFFFFF",
                    d = "medium",
                    p = "defont",
                    g = "naka";
                for (var m in this.nicoScripts.default) null !== this.nicoScripts.default[m].long && this.nicoScripts.default[m].start + this.nicoScripts.default[m].long < e.vpos ? this.nicoScripts.default = this.nicoScripts.default.splice(Number(m), 1) : (this.nicoScripts.default[m].loc && (g = this.nicoScripts.default[m].loc), this.nicoScripts.default[m].color && (u = this.nicoScripts.default[m].color), this.nicoScripts.default[m].size && (d = this.nicoScripts.default[m].size), this.nicoScripts.default[m].font && (p = this.nicoScripts.default[m].font));
                for (var m in this.nicoScripts.replace)
                    if (null !== this.nicoScripts.replace[m].long && this.nicoScripts.replace[m].start + this.nicoScripts.replace[m].long < e.vpos) this.nicoScripts.default = this.nicoScripts.default.splice(Number(m), 1);
                    else { var v = this.nicoScripts.replace[m]; "コメ" === v.target && e.owner || "投コメ" === v.target && !e.owner || "含まない" === v.target && e.owner || ("完全一致" === v.condition && e.content === v.keyword || "部分一致" === v.condition && -1 !== e.content.indexOf(v.keyword)) && ("単" === v.range ? e.content = a(e.content, v.keyword, v.replace) : e.content = v.replace, v.loc && (g = v.loc), v.color && (u = v.color), v.size && (d = v.size), v.font && (p = v.font)) }
                return i.loc || (i.loc = g), i.color || (i.color = u), i.size || (i.size = d, i.fontSize = this.fontSize[i.size].default), i.font || (i.font = p), "naka" !== i.loc && (i.long ? i.long = Math.floor(100 * i.long) : i.long = 300), t(t({}, e), i)
            }, e.prototype.drawCanvas = function(t) {
                if (this.lastVpos !== t) {
                    if (this.lastVpos = t, this.fpsCount++, this.context.clearRect(0, 0, this.canvas.width, this.canvas.height), this.video) {
                        var e, i, s = void 0,
                            n = this.canvas.height / this.video.videoHeight,
                            a = this.canvas.width / this.video.videoWidth;
                        s = n > a ? a : n, e = .5 * (this.canvas.width - this.video.videoWidth * s), i = .5 * (this.canvas.height - this.video.videoHeight * s), this.context.drawImage(this.video, e, i, this.video.videoWidth * s, this.video.videoHeight * s)
                    }
                    if (this.timeline[t])
                        for (var r in this.timeline[t]) {
                            var l = this.data[this.timeline[t][r]];
                            l.invisible || (l.image || this.getTextImage(this.timeline[t][r]), this.drawText(l, t))
                        }
                    this.showFPS && (this.context.font = o("defont", 60, this.useLegacy), this.context.fillStyle = "#00FF00", this.context.strokeText("FPS:" + this.fps, 100, 100), this.context.fillText("FPS:" + this.fps, 100, 100)), this.showCommentCount && (this.context.font = o("defont", 60, this.useLegacy), this.context.fillStyle = "#00FF00", this.timeline[t] ? (this.context.strokeText("Count:" + this.timeline[t].length, 100, 200), this.context.fillText("Count:" + this.timeline[t].length, 100, 200)) : (this.context.strokeText("Count:0", 100, 200), this.context.fillText("Count:0", 100, 200)))
                }
            }, e.prototype.clear = function() { this.context.clearRect(0, 0, 1920, 1080) }, e
        }(),
        i = function(t, e, i) { var o = {}; for (var s in t) o[t[s][e]] || (o[t[s][e]] = {}), o[t[s][e]][t[s][i]] || (o[t[s][e]][t[s][i]] = []), t[s].index = s, o[t[s][e]][t[s][i]].push(t[s]); return o },
        o = function(t, e, i) {
            switch (t) {
                case "gothic":
                    return "normal 400 ".concat(e, 'px "游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium');
                case "mincho":
                    return "normal 400 ".concat(e, 'px "游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium');
                default:
                    return "normal 600 ".concat(e, i ? 'px Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic' : 'px sans-serif, Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic')
            }
        },
        s = function(t, e, i) { t || (t = {}), t[e] || (t[e] = []), t[e].push(i) },
        n = function(t) { return "#" === t.slice(0, 1) && (t = t.slice(1)), 3 === t.length && (t = t.slice(0, 1) + t.slice(0, 1) + t.slice(1, 2) + t.slice(1, 2) + t.slice(2, 3) + t.slice(2, 3)), [t.slice(0, 2), t.slice(2, 4), t.slice(4, 6)].map((function(t) { return parseInt(t, 16) })) },
        a = function(t, e, i) { for (var o = 0; - 1 !== t.indexOf(e) && o < 100;) t = t.replace(e, i), o++; return t };
    return e
}));
//# sourceMappingURL=/sm/3d7dbdecc430ff666204802b80dcd7fdd6bf4b91e2cd4cde846a1c728ebc5256.map