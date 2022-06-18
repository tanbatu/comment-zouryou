/*!
  niconicomments.js v0.2.16
  (c) 2021 xpadev-net https://xpadev.net
  Released under the MIT License.
*/
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.NiconiComments = factory());
})(this, (function() {
    'use strict';

    var _assign = function __assign() {
        _assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];

                for (var p in s) {
                    if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
            }

            return t;
        };

        return _assign.apply(this, arguments);
    };

    var isDebug = false;
    var NiconiComments = (function() {
        function NiconiComments(canvas, data, options) {
            if (options === void 0) {
                options = {
                    useLegacy: false,
                    formatted: false,
                    video: null,
                    showCollision: false,
                    showFPS: false,
                    showCommentCount: false,
                    drawAllImageOnLoad: false,
                    debug: false,
                    enableLegacyPiP: false
                };
            }
            var _this = this;
            isDebug = options.debug;
            var constructorStart = performance.now();
            this.canvas = canvas;
            var context = canvas.getContext("2d");
            if (!context)
                throw new Error("Fail to get CanvasRenderingContext2D");
            this.context = context;
            this.context.strokeStyle = "rgba(0,0,0,0.3)";
            this.context.textAlign = "start";
            this.context.textBaseline = "alphabetic";
            this.context.lineWidth = 8;
            this.commentYPaddingTop = 0.08;
            this.commentYMarginBottom = 0.24;
            this.fontSize = {
                "small": {
                    "default": 47,
                    "resized": 26.1
                },
                "medium": {
                    "default": 74,
                    "resized": 38.7
                },
                "big": {
                    "default": 110,
                    "resized": 61
                }
            };
            this.lineHeight = {
                "small": {
                    "default": 1,
                    "resized": 1
                },
                "medium": {
                    "default": 1,
                    "resized": 1
                },
                "big": {
                    "default": 1.03,
                    "resized": 1.01
                }
            };
            this.doubleResizeMaxWidth = {
                full: {
                    legacy: 3020,
                    default: 3220
                },
                normal: {
                    legacy: 2540,
                    default: 2740
                }
            };
            var parsedData = options.formatted ? data : this.parseData(data);
            this.video = options.video ? options.video : null;
            this.showCollision = options.showCollision;
            this.showFPS = options.showFPS;
            this.showCommentCount = options.showCommentCount;
            this.enableLegacyPiP = options.enableLegacyPiP;
            this.timeline = {};
            this.nicoScripts = { reverse: [], default: [], replace: [], ban: [] };
            this.collision_right = {};
            this.collision_left = {};
            this.collision_ue = {};
            this.collision_shita = {};
            this.data = [];
            this.lastVpos = -1;
            this.useLegacy = options.useLegacy;
            this.preRendering(parsedData, options.drawAllImageOnLoad);
            this.fpsCount = 0;
            this.fps = 0;
            window.setInterval(function() {
                _this.fps = _this.fpsCount * 2;
                _this.fpsCount = 0;
            }, 500);
            logger("constructor complete: ".concat(performance.now() - constructorStart, "ms"));
        }
        NiconiComments.prototype.parseData = function(data) {
            var parseDataStart = performance.now();
            var data_ = [];
            for (var i = 0; i < data.length; i++) {
                var val = data[i];
                if (!val)
                    continue;
                for (var key in val) {
                    var value = val[key];
                    if (isApiChat(value) && value["deleted"] !== 1) {
                        var tmpParam = {
                            "id": value["no"],
                            "vpos": value["vpos"],
                            "content": value["content"],
                            "date": value["date"],
                            "date_usec": value["date_usec"],
                            "owner": !value["user_id"],
                            "premium": value["premium"] === 1,
                            "mail": []
                        };
                        if (value["mail"]) {
                            tmpParam["mail"] = value["mail"].split(/[\s　]/g);
                        }
                        if (value["content"].startsWith("/") && !value["user_id"]) {
                            tmpParam["mail"].push("invisible");
                        }
                        data_.push(tmpParam);
                    }
                }
            }
            data_.sort(function(a, b) {
                if (a.vpos < b.vpos)
                    return -1;
                if (a.vpos > b.vpos)
                    return 1;
                if (a.date < b.date)
                    return -1;
                if (a.date > b.date)
                    return 1;
                if (a.date_usec < b.date_usec)
                    return -1;
                if (a.date_usec > b.date_usec)
                    return 1;
                return 0;
            });
            logger("parseData complete: ".concat(performance.now() - parseDataStart, "ms"));
            return data_;
        };
        NiconiComments.prototype.preRendering = function(rawData, drawAll) {
            var preRenderingStart = performance.now();
            var parsedData = this.getCommentPos(this.getCommentSize(this.getFont(rawData)));
            this.data = this.sortComment(parsedData);
            if (drawAll) {
                for (var i in parsedData) {
                    this.getTextImage(Number(i));
                }
            }
            logger("preRendering complete: ".concat(performance.now() - preRenderingStart, "ms"));
        };
        NiconiComments.prototype.getFont = function(parsedData) {
            var getFontStart = performance.now();
            var result = [];
            for (var i in parsedData) {
                var value = parsedData[i];
                if (!value)
                    continue;
                value.content = value.content.replace(/\t/g, "\u2003\u2003");
                result[i] = this.parseCommandAndNicoscript(value);
            }
            logger("getFont complete: ".concat(performance.now() - getFontStart, "ms"));
            return result;
        };
        NiconiComments.prototype.getCommentSize = function(parsedData) {
            var getCommentSizeStart = performance.now();
            var tmpData = groupBy(parsedData, "font", "fontSize");
            var result = [];
            for (var i in tmpData) {
                for (var j in tmpData[i]) {
                    this.context.font = parseFont(i, j, this.useLegacy);
                    for (var k in tmpData[i][j]) {
                        var comment = tmpData[i][j][k];
                        if (comment.invisible) {
                            continue;
                        }
                        var measure = this.measureText(comment);
                        var size = parsedData[comment.index];
                        size.height = measure.height;
                        size.width = measure.width;
                        size.width_max = measure.width_max;
                        size.width_min = measure.width_min;
                        size.lineHeight = measure.lineHeight;
                        if (measure.resized) {
                            size.fontSize = measure.fontSize;
                            this.context.font = parseFont(i, j, this.useLegacy);
                        }
                        result[comment.index] = size;
                    }
                }
            }
            logger("getCommentSize complete: ".concat(performance.now() - getCommentSizeStart, "ms"));
            return result;
        };
        NiconiComments.prototype.getCommentPos = function(parsedData) {
            var getCommentPosStart = performance.now();
            var data = parsedData;
            for (var i in data) {
                var comment = data[i];
                if (!comment || comment.invisible) {
                    continue;
                }
                for (var j = 0; j < 500; j++) {
                    if (!this.timeline[comment.vpos + j]) {
                        this.timeline[comment.vpos + j] = [];
                    }
                    if (!this.collision_right[comment.vpos + j]) {
                        this.collision_right[comment.vpos + j] = [];
                    }
                    if (!this.collision_left[comment.vpos + j]) {
                        this.collision_left[comment.vpos + j] = [];
                    }
                    if (!this.collision_ue[comment.vpos + j]) {
                        this.collision_ue[comment.vpos + j] = [];
                    }
                    if (!this.collision_shita[comment.vpos + j]) {
                        this.collision_shita[comment.vpos + j] = [];
                    }
                }
                if (comment.loc === "naka") {
                    comment.vpos -= 70;
                    parsedData[i].vpos -= 70;
                    var posY = 0,
                        is_break = false,
                        is_change = true,
                        count = 0;
                    if (1080 < comment.height) {
                        posY = (comment.height - 1080) / -2;
                    } else {
                        while (is_change && count < 10) {
                            is_change = false;
                            count++;
                            for (var j = 0; j < 500; j++) {
                                var vpos = comment.vpos + j;
                                var left_pos = 1920 - ((1920 + comment.width_max) * j / 500);
                                if (left_pos + comment.width_max >= 1880) {
                                    for (var k in this.collision_right[vpos]) {
                                        var l = this.collision_right[vpos][k];
                                        if ((posY < data[l].posY + data[l].height && posY + comment.height > data[l].posY) && data[l].owner === comment.owner) {
                                            if (data[l].posY + data[l].height > posY) {
                                                posY = data[l].posY + data[l].height;
                                                is_change = true;
                                            }
                                            if (posY + comment.height > 1080) {
                                                if (1080 < comment.height) {
                                                    posY = (comment.height - 1080) / -2;
                                                } else {
                                                    posY = Math.floor(Math.random() * (1080 - comment.height));
                                                }
                                                is_break = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (is_break) {
                                        break;
                                    }
                                }
                                if (left_pos <= 40) {
                                    for (var k in this.collision_left[vpos]) {
                                        var l = this.collision_left[vpos][k];
                                        if ((posY < data[l].posY + data[l].height && posY + comment.height > data[l].posY) && data[l].owner === comment.owner) {
                                            if (data[l].posY + data[l].height > posY) {
                                                posY = data[l].posY + data[l].height;
                                                is_change = true;
                                            }
                                            if (posY + comment.height > 1080) {
                                                if (1080 < comment.height) {
                                                    posY = 0;
                                                } else {
                                                    posY = Math.random() * (1080 - comment.height);
                                                }
                                                is_break = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (is_break) {
                                        break;
                                    }
                                }
                            }
                            if (is_break) {
                                break;
                            }
                        }
                    }
                    for (var j = 0; j < 500; j++) {
                        var vpos = comment.vpos + j;
                        var left_pos = 1920 - ((1920 + comment.width_max) * j / 500);
                        arrayPush(this.timeline, vpos, i);
                        if (left_pos + comment.width_max >= 1880) {
                            arrayPush(this.collision_right, vpos, i);
                        }
                        if (left_pos <= 40) {
                            arrayPush(this.collision_left, vpos, i);
                        }
                    }
                    parsedData[i].posY = posY;
                } else {
                    var posY = 0,
                        is_break = false,
                        is_change = true,
                        count = 0,
                        collision = void 0;
                    if (comment.loc === "ue") {
                        collision = this.collision_ue;
                    } else if (comment.loc === "shita") {
                        collision = this.collision_shita;
                    }
                    while (is_change && count < 10) {
                        is_change = false;
                        count++;
                        for (var j = 0; j < 300; j++) {
                            var vpos = comment.vpos + j;
                            for (var k in collision[vpos]) {
                                var l = collision[vpos][k];
                                if ((posY < data[l].posY + data[l].height && posY + comment.height > data[l].posY) && data[l].owner === comment.owner) {
                                    if (data[l].posY + data[l].height > posY) {
                                        posY = data[l].posY + data[l].height;
                                        is_change = true;
                                    }
                                    if (posY + comment.height > 1080) {
                                        if (1000 <= comment.height) {
                                            posY = 0;
                                        } else {
                                            posY = Math.floor(Math.random() * (1080 - comment.height));
                                        }
                                        is_break = true;
                                        break;
                                    }
                                }
                            }
                            if (is_break) {
                                break;
                            }
                        }
                    }
                    for (var j = 0; j < comment.long; j++) {
                        var vpos = comment.vpos + j;
                        arrayPush(this.timeline, vpos, i);
                        if (comment.loc === "ue") {
                            arrayPush(this.collision_ue, vpos, i);
                        } else {
                            arrayPush(this.collision_shita, vpos, i);
                        }
                    }
                    parsedData[i].posY = posY;
                }
            }
            logger("getCommentPos complete: ".concat(performance.now() - getCommentPosStart, "ms"));
            return parsedData;
        };
        NiconiComments.prototype.sortComment = function(parsedData) {
            var sortCommentStart = performance.now();
            for (var vpos in this.timeline) {
                if (!this.timeline[vpos])
                    continue;
                var owner = [],
                    user = [];
                for (var _i = 0, _a = this.timeline[vpos]; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (parsedData[i].owner) {
                        owner.push(i);
                    } else {
                        user.push(i);
                    }
                }
                this.timeline[vpos] = owner.concat(user);
            }
            logger("parseData complete: ".concat(performance.now() - sortCommentStart, "ms"));
            return parsedData;
        };
        NiconiComments.prototype.measureText = function(comment) {
            var width, width_max, width_min, height, width_arr = [],
                lines = comment.content.split("\n");
            if (!comment.lineHeight)
                comment.lineHeight = this.lineHeight[comment.size].default;
            if (!comment.resized && !comment.ender) {
                if (comment.size === "big" && lines.length > 2) {
                    comment.fontSize = this.fontSize.big.resized;
                    comment.lineHeight = this.lineHeight.big.resized;
                    comment.resized = true;
                    comment.tateresized = true;
                    this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                } else if (comment.size === "medium" && lines.length > 4) {
                    comment.fontSize = this.fontSize.medium.resized;
                    comment.lineHeight = this.lineHeight.medium.resized;
                    comment.resized = true;
                    comment.tateresized = true;
                    this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                } else if (comment.size === "small" && lines.length > 6) {
                    comment.fontSize = this.fontSize.small.resized;
                    comment.lineHeight = this.lineHeight.small.resized;
                    comment.resized = true;
                    comment.tateresized = true;
                    this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                }
            }
            for (var i = 0; i < lines.length; i++) {
                var measure = this.context.measureText(lines[i]);
                width_arr.push(measure.width);
            }
            width = width_arr.reduce(function(p, c) { return p + c; }, 0) / width_arr.length;
            width_max = Math.max.apply(Math, width_arr);
            width_min = Math.min.apply(Math, width_arr);
            height = (comment.fontSize * comment.lineHeight * (1 + this.commentYPaddingTop) * lines.length) + (this.commentYMarginBottom * comment.fontSize);
            if (comment.loc !== "naka" && !comment.tateresized) {
                if (comment.full && width_max > 1930) {
                    comment.fontSize -= 2;
                    comment.resized = true;
                    comment.yokoResized = true;
                    this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                    return this.measureText(comment);
                } else if (!comment.full && width_max > 1440) {
                    comment.fontSize -= 1;
                    comment.resized = true;
                    comment.yokoResized = true;
                    this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                    return this.measureText(comment);
                }
            } else if (comment.loc !== "naka" && comment.tateresized && (comment.full && width_max > 2120 || !comment.full && width_max > 1440) && !comment.yokoResized) {
                comment.fontSize = this.fontSize[comment.size].default;
                comment.resized = true;
                comment.yokoResized = true;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                return this.measureText(comment);
            } else if (comment.loc !== "naka" && comment.tateresized && comment.yokoResized) {
                if (comment.full && width_max > this.doubleResizeMaxWidth.full[this.useLegacy ? "legacy" : "default"]) {
                    comment.fontSize -= 1;
                    this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                    return this.measureText(comment);
                } else if (!comment.full && width_max > this.doubleResizeMaxWidth.normal[this.useLegacy ? "legacy" : "default"]) {
                    comment.fontSize -= 1;
                    this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                    return this.measureText(comment);
                }
            }
            return {
                "width": width,
                "width_max": width_max,
                "width_min": width_min,
                "height": height,
                "resized": comment.resized,
                "fontSize": comment.fontSize,
                "lineHeight": comment.lineHeight
            };
        };
        NiconiComments.prototype.drawText = function(comment, vpos) {
            var reverse = false;
            for (var i in this.nicoScripts.reverse) {
                var range = this.nicoScripts.reverse[i];
                if ((range.target === "コメ" && comment.owner) || (range.target === "投コメ" && !comment.owner)) {
                    break;
                }
                if (range.start < vpos && vpos < range.end) {
                    reverse = true;
                }
            }
            for (var i in this.nicoScripts.ban) {
                var range = this.nicoScripts.ban[i];
                if (range.start < vpos && vpos < range.end) {
                    return;
                }
            }
            var posX = (1920 - comment.width_max) / 2,
                posY = comment.posY;
            if (comment.loc === "naka") {
                if (reverse) {
                    posX = ((1920 + comment.width_max) * (vpos - comment.vpos) / 500) - comment.width_max;
                } else {
                    posX = 1920 - ((1920 + comment.width_max) * (vpos - comment.vpos) / 500);
                }
            } else if (comment.loc === "shita") {
                posY = 1080 - comment.posY - comment.height;
            }
            if (comment.image && comment.image !== true) {
                this.context.drawImage(comment.image, posX, posY);
            }
            if (this.showCollision) {
                this.context.strokeStyle = "rgba(0,255,255,1)";
                this.context.strokeRect(posX, posY, comment.width_max, comment.height);
                var lines = comment.content.split("\n");
                for (var i in lines) {
                    var linePosY = (Number(i) + 1) * (comment.fontSize * comment.lineHeight) * (1 + this.commentYPaddingTop);
                    this.context.strokeStyle = "rgba(255,255,0,0.5)";
                    this.context.strokeRect(posX, posY + linePosY, comment.width_max, comment.fontSize * comment.lineHeight * -1);
                }
            }
        };
        NiconiComments.prototype.getTextImage = function(i) {
            var _this = this;
            var value = this.data[i];
            if (!value || value.invisible)
                return;
            var image = document.createElement("canvas");
            image.width = value.width_max;
            image.height = value.height;
            var context = image.getContext("2d");
            if (!context)
                throw new Error("Fail to get CanvasRenderingContext2D");
            context.strokeStyle = "rgba(0,0,0,0.35)";
            context.textAlign = "start";
            context.textBaseline = "alphabetic";
            context.lineWidth = 8;
            context.font = parseFont(value.font, value.fontSize, this.useLegacy);
            if (value._live) {
                var rgb = hex2rgb(value.color);
                context.fillStyle = "rgba(".concat(rgb[0], ",").concat(rgb[1], ",").concat(rgb[2], ",0.5)");
            } else {
                context.fillStyle = value.color;
            }
            if (value.color === "#000000") {
                context.strokeStyle = "rgba(255,255,255,0.7)";
            }
            var lines = value.content.split("\n");
            for (var i_1 in lines) {
                var line = lines[i_1],
                    posY = void 0;
                posY = (Number(i_1) + 1) * (value.fontSize * value.lineHeight) * (1 + this.commentYPaddingTop);
                context.strokeText(line, 0, posY);
                context.fillText(line, 0, posY);
            }
            this.data[i].image = image;
            setTimeout(function() {
                if (_this.data[i].image)
                    delete _this.data[i].image;
            }, 5000);
        };
        NiconiComments.prototype.parseCommand = function(comment) {
            var metadata = comment.mail,
                loc = null,
                size = null,
                fontSize = null,
                color = null,
                font = null,
                full = false,
                ender = false,
                _live = false,
                invisible = false,
                long = null;
            for (var i in metadata) {
                var command = metadata[i].toLowerCase();
                var match = command.match(/^@([0-9.]+)/);
                if (match) {
                    long = match[1];
                }
                if (loc === null) {
                    switch (command) {
                        case "ue":
                            loc = "ue";
                            break;
                        case "shita":
                            loc = "shita";
                            break;
                    }
                }
                if (size === null) {
                    switch (command) {
                        case "big":
                            size = "big";
                            fontSize = this.fontSize.big.default;
                            break;
                        case "small":
                            size = "small";
                            fontSize = this.fontSize.small.default;
                            break;
                    }
                }
                if (color === null) {
                    switch (command) {
                        case "white":
                            color = "#FFFFFF";
                            break;
                        case "red":
                            color = "#FF0000";
                            break;
                        case "pink":
                            color = "#FF8080";
                            break;
                        case "orange":
                            color = "#FFC000";
                            break;
                        case "yellow":
                            color = "#FFFF00";
                            break;
                        case "green":
                            color = "#00FF00";
                            break;
                        case "cyan":
                            color = "#00FFFF";
                            break;
                        case "blue":
                            color = "#0000FF";
                            break;
                        case "purple":
                            color = "#C000FF";
                            break;
                        case "black":
                            color = "#000000";
                            break;
                        case "white2":
                        case "niconicowhite":
                            color = "#CCCC99";
                            break;
                        case "red2":
                        case "truered":
                            color = "#CC0033";
                            break;
                        case "pink2":
                            color = "#FF33CC";
                            break;
                        case "orange2":
                        case "passionorange":
                            color = "#FF6600";
                            break;
                        case "yellow2":
                        case "madyellow":
                            color = "#999900";
                            break;
                        case "green2":
                        case "elementalgreen":
                            color = "#00CC66";
                            break;
                        case "cyan2":
                            color = "#00CCCC";
                            break;
                        case "blue2":
                        case "marineblue":
                            color = "#3399FF";
                            break;
                        case "purple2":
                        case "nobleviolet":
                            color = "#6633CC";
                            break;
                        case "black2":
                            color = "#666666";
                            break;
                        default:
                            var match_1 = command.match(/#[0-9a-z]{3,6}/);
                            if (match_1 && comment.premium) {
                                color = match_1[0].toUpperCase();
                            }
                            break;
                    }
                }
                if (font === null) {
                    switch (command) {
                        case "gothic":
                            font = "gothic";
                            break;
                        case "mincho":
                            font = "mincho";
                            break;
                    }
                }
                switch (command) {
                    case "full":
                        full = true;
                        break;
                    case "ender":
                        ender = true;
                        break;
                    case "_live":
                        _live = true;
                        break;
                    case "invisible":
                        invisible = true;
                        break;
                }
            }
            return { loc: loc, size: size, fontSize: fontSize, color: color, font: font, full: full, ender: ender, _live: _live, invisible: invisible, long: long };
        };
        NiconiComments.prototype.parseCommandAndNicoscript = function(comment) {
            var data = this.parseCommand(comment),
                nicoscript = comment.content.match(/^@(デフォルト|置換|逆|コメント禁止|シーク禁止|ジャンプ)/);
            if (nicoscript) {
                switch (nicoscript[1]) {
                    case "デフォルト":
                        this.nicoScripts.default.push({
                            start: comment.vpos,
                            long: data.long === null ? null : Math.floor(data.long * 100),
                            color: data.color,
                            size: data.size,
                            font: data.font,
                            loc: data.loc
                        });
                        break;
                    case "逆":
                        var reverse = comment.content.match(/^@逆 ?(全|コメ|投コメ)?/);
                        if (!reverse)
                            reverse = [];
                        if (!reverse[1]) {
                            reverse[1] = "全";
                        }
                        if (data.long === null) {
                            data.long = 30;
                        }
                        this.nicoScripts.reverse.push({
                            start: comment.vpos,
                            end: comment.vpos + (data.long * 100),
                            target: reverse[1]
                        });
                        break;
                    case "コメント禁止":
                        if (data.long === null) {
                            data.long = 30;
                        }
                        this.nicoScripts.reverse.push({
                            start: comment.vpos,
                            end: comment.vpos + (data.long * 100),
                        });
                        break;
                    case "置換":
                        var content = comment.content.split(""),
                            quote = "",
                            last_i = "",
                            string = "",
                            result = [];
                        for (var _i = 0, _a = content.slice(4); _i < _a.length; _i++) {
                            var i = _a[_i];
                            if (i.match(/["'「]/) && quote === "") {
                                quote = i;
                            } else if (i.match(/["']/) && quote === i && last_i !== "\\") {
                                result.push(replaceAll(string, "\\n", "\n"));
                                quote = "";
                                string = "";
                            } else if (i.match(/」/) && quote === "「") {
                                result.push(string);
                                quote = "";
                                string = "";
                            } else if (quote === "" && i.match(/[\s　]/)) {
                                if (string) {
                                    result.push(string);
                                    string = "";
                                }
                            } else {
                                string += i;
                            }
                            last_i = i;
                        }
                        result.push(string);
                        this.nicoScripts.replace.push({
                            start: comment.vpos,
                            long: data.long === null ? null : Math.floor(data.long * 100),
                            keyword: result[0],
                            replace: result[1] || "",
                            range: result[2] || "単",
                            target: result[3] || "コメ",
                            condition: result[4] || "部分一致",
                            color: data.color,
                            size: data.size,
                            font: data.font,
                            loc: data.loc
                        });
                        break;
                }
                data.invisible = true;
            }
            var color = "#FFFFFF",
                size = "medium",
                font = "defont",
                loc = "naka";
            for (var i in this.nicoScripts.default) {
                if (this.nicoScripts.default[i].long !== null && this.nicoScripts.default[i].start + this.nicoScripts.default[i].long < comment.vpos) {
                    this.nicoScripts.default = this.nicoScripts.default.splice(Number(i), 1);
                    continue;
                }
                if (this.nicoScripts.default[i].loc) {
                    loc = this.nicoScripts.default[i].loc;
                }
                if (this.nicoScripts.default[i].color) {
                    color = this.nicoScripts.default[i].color;
                }
                if (this.nicoScripts.default[i].size) {
                    size = this.nicoScripts.default[i].size;
                }
                if (this.nicoScripts.default[i].font) {
                    font = this.nicoScripts.default[i].font;
                }
            }
            for (var i in this.nicoScripts.replace) {
                if (this.nicoScripts.replace[i].long !== null && this.nicoScripts.replace[i].start + this.nicoScripts.replace[i].long < comment.vpos) {
                    this.nicoScripts.default = this.nicoScripts.default.splice(Number(i), 1);
                    continue;
                }
                var item = this.nicoScripts.replace[i];
                if ((item.target === "コメ" && comment.owner) || (item.target === "投コメ" && !comment.owner) || (item.target === "含まない" && comment.owner))
                    continue;
                if ((item.condition === "完全一致" && comment.content === item.keyword) || (item.condition === "部分一致" && comment.content.indexOf(item.keyword) !== -1)) {
                    if (item.range === "単") {
                        comment.content = replaceAll(comment.content, item.keyword, item.replace);
                    } else {
                        comment.content = item.replace;
                    }
                    if (item.loc) {
                        loc = item.loc;
                    }
                    if (item.color) {
                        color = item.color;
                    }
                    if (item.size) {
                        size = item.size;
                    }
                    if (item.font) {
                        font = item.font;
                    }
                }
            }
            if (!data.loc) {
                data.loc = loc;
            }
            if (!data.color) {
                data.color = color;
            }
            if (!data.size) {
                data.size = size;
                data.fontSize = this.fontSize[data.size].default;
            }
            if (!data.font) {
                data.font = font;
            }
            if (data.loc !== "naka") {
                if (!data.long) {
                    data.long = 300;
                } else {
                    data.long = Math.floor(data.long * 100);
                }
            }
            return _assign(_assign({}, comment), data);
        };
        NiconiComments.prototype.drawCanvas = function(vpos) {
            var drawCanvasStart = performance.now();
            if (this.lastVpos === vpos)
                return;
            this.lastVpos = vpos;
            this.fpsCount++;
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.video) {
                var offsetX = void 0,
                    offsetY = void 0,
                    scale = void 0,
                    height = this.canvas.height / this.video.videoHeight,
                    width = this.canvas.width / this.video.videoWidth;
                if (this.enableLegacyPiP ? height > width : height < width) {
                    scale = width;
                } else {
                    scale = height;
                }
                offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5;
                offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
                this.context.drawImage(this.video, offsetX, offsetY, this.video.videoWidth * scale, this.video.videoHeight * scale);
            }
            if (this.timeline[vpos]) {
                for (var i in this.timeline[vpos]) {
                    var index = this.timeline[vpos][Number(i)];
                    var comment = this.data[index];
                    if (!comment || comment.invisible) {
                        continue;
                    }
                    if (comment.image === undefined) {
                        this.getTextImage(index);
                    }
                    try {
                        this.drawText(comment, vpos);
                    } catch (e) {
                        comment.image = false;
                    }
                }
            }
            if (this.showFPS) {
                this.context.font = parseFont("defont", 60, this.useLegacy);
                this.context.fillStyle = "#00FF00";
                this.context.strokeStyle = "rgba(0,0,0,0.7)";
                this.context.strokeText("FPS:" + this.fps, 100, 100);
                this.context.fillText("FPS:" + this.fps, 100, 100);
            }
            if (this.showCommentCount) {
                this.context.font = parseFont("defont", 60, this.useLegacy);
                this.context.fillStyle = "#00FF00";
                this.context.strokeStyle = "rgba(0,0,0,0.7)";
                if (this.timeline[vpos]) {
                    this.context.strokeText("Count:" + this.timeline[vpos].length, 100, 200);
                    this.context.fillText("Count:" + this.timeline[vpos].length, 100, 200);
                } else {
                    this.context.strokeText("Count:0", 100, 200);
                    this.context.fillText("Count:0", 100, 200);
                }
            }
            logger("drawCanvas complete: ".concat(performance.now() - drawCanvasStart, "ms"));
        };
        NiconiComments.prototype.clear = function() {
            this.context.clearRect(0, 0, 1920, 1080);
        };
        return NiconiComments;
    }());
    var groupBy = function(array, key, key2) {
        var data = {};
        for (var i in array) {
            if (!data[array[i][key]]) {
                data[array[i][key]] = {};
            }
            if (!data[array[i][key]][array[i][key2]]) {
                data[array[i][key]][array[i][key2]] = [];
            }
            array[i].index = i;
            data[array[i][key]][array[i][key2]].push(array[i]);
        }
        return data;
    };
    var parseFont = function(font, size, useLegacy) {
        switch (font) {
            case "gothic":
                return "normal 400 ".concat(size, "px \"\u6E38\u30B4\u30B7\u30C3\u30AF\u4F53\", \"\u6E38\u30B4\u30B7\u30C3\u30AF\", \"Yu Gothic\", YuGothic, yugothic, YuGo-Medium");
            case "mincho":
                return "normal 400 ".concat(size, "px \"\u6E38\u660E\u671D\u4F53\", \"\u6E38\u660E\u671D\", \"Yu Mincho\", YuMincho, yumincho, YuMin-Medium");
            default:
                if (useLegacy) {
                    return "normal 600 ".concat(size, "px Arial, \"\uFF2D\uFF33 \uFF30\u30B4\u30B7\u30C3\u30AF\", \"MS PGothic\", MSPGothic, MS-PGothic");
                } else {
                    return "normal 600 ".concat(size, "px sans-serif, Arial, \"\uFF2D\uFF33 \uFF30\u30B4\u30B7\u30C3\u30AF\", \"MS PGothic\", MSPGothic, MS-PGothic");
                }
        }
    };
    var arrayPush = function(array, key, push) {
        if (!array) {
            array = {};
        }
        if (!array[key]) {
            array[key] = [];
        }
        array[key].push(push);
    };
    var hex2rgb = function(hex) {
        if (hex.slice(0, 1) === "#")
            hex = hex.slice(1);
        if (hex.length === 3)
            hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);
        return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function(str) {
            return parseInt(str, 16);
        });
    };
    var replaceAll = function(string, target, replace) {
        var count = 0;
        while (string.indexOf(target) !== -1 && count < 100) {
            string = string.replace(target, replace);
            count++;
        }
        return string;
    };
    var isApiChat = function(item) {
        return item.no && item.vpos && item.content;
    };
    var logger = function(msg) {
        if (isDebug)
            console.debug(msg);
    };

    return NiconiComments;

}));