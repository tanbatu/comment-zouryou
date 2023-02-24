/*!
  niconicomments.js v0.2.43
  (c) 2021 xpadev-net https://xpadev.net
  Released under the MIT License.
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.NiconiComments = factory());
})(this, (function () { 'use strict';

  var colors = {
    white: "#FFFFFF",
    red: "#FF0000",
    pink: "#FF8080",
    orange: "#FFC000",
    yellow: "#FFFF00",
    green: "#00FF00",
    cyan: "#00FFFF",
    blue: "#0000FF",
    purple: "#C000FF",
    black: "#000000",
    white2: "#CCCC99",
    niconicowhite: "#CCCC99",
    red2: "#CC0033",
    truered: "#CC0033",
    pink2: "#FF33CC",
    orange2: "#FF6600",
    passionorange: "#FF6600",
    yellow2: "#999900",
    madyellow: "#999900",
    green2: "#00CC66",
    elementalgreen: "#00CC66",
    cyan2: "#00CCCC",
    blue2: "#3399FF",
    marinblue: "#3399FF",
    purple2: "#6633CC",
    nobleviolet: "#6633CC",
    black2: "#666666",
  };

  var isBoolean = function (i) { return typeof i === "boolean"; };
  var isNumber = function (i) { return typeof i === "number"; };
  var isObject = function (i) { return typeof i === "object"; };
  var typeGuard = {
    formatted: {
      comment: function (i) {
        return objectVerify(i, [
          "id",
          "vpos",
          "content",
          "date",
          "date_usec",
          "owner",
          "premium",
          "mail",
          "user_id",
          "layer",
        ]);
      },
      comments: function (i) {
        if (typeof i !== "object")
          return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.formatted.comment(item))
            return false;
        }
        return true;
      },
      legacyComment: function (i) {
        return objectVerify(i, [
          "id",
          "vpos",
          "content",
          "date",
          "owner",
          "premium",
          "mail",
        ]);
      },
      legacyComments: function (i) {
        if (typeof i !== "object")
          return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.formatted.legacyComment(item))
            return false;
        }
        return true;
      },
    },
    legacy: {
      rawApiResponses: function (i) {
        if (typeof i !== "object")
          return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var itemWrapper = _a[_i];
          for (var _b = 0, _c = Object.keys(itemWrapper); _b < _c.length; _b++) {
            var key = _c[_b];
            var item = itemWrapper[key];
            if (!item)
              continue;
            if (!(typeGuard.legacy.apiChat(item) ||
              typeGuard.legacy.apiGlobalNumRes(item) ||
              typeGuard.legacy.apiLeaf(item) ||
              typeGuard.legacy.apiPing(item) ||
              typeGuard.legacy.apiThread(item))) {
              return false;
            }
          }
        }
        return true;
      },
      apiChat: function (i) {
        return typeof i === "object" &&
          objectVerify(i, ["content", "date", "no", "thread", "vpos"]);
      },
      apiGlobalNumRes: function (i) {
        return objectVerify(i, ["num_res", "thread"]);
      },
      apiLeaf: function (i) { return objectVerify(i, ["count", "thread"]); },
      apiPing: function (i) { return objectVerify(i, ["content"]); },
      apiThread: function (i) {
        return objectVerify(i, [
          "resultcode",
          "revision",
          "server_time",
          "thread",
          "ticket",
        ]);
      },
    },
    xmlDocument: function (i) {
      if (!i.documentElement ||
        i.documentElement.nodeName !== "packet")
        return false;
      if (!i.documentElement.children)
        return false;
      for (var index = 0; index < i.documentElement.children.length; index++) {
        var value = i.documentElement.children[index];
        if (!value)
          continue;
        if (value.nodeName === "chat" &&
          !typeAttributeVerify(value, ["no", "vpos", "date", "date_usec", "mail"]))
          return false;
      }
      return true;
    },
    legacyOwner: {
      comments: function (i) {
        if (typeof i !== "string")
          return false;
        var lists = i.split("\n");
        for (var _i = 0, lists_1 = lists; _i < lists_1.length; _i++) {
          var list = lists_1[_i];
          if (list.split(":").length < 3) {
            return false;
          }
        }
        return true;
      },
    },
    owner: {
      comment: function (i) {
        return objectVerify(i, ["time", "command", "comment"]);
      },
      comments: function (i) {
        if (typeof i !== "object")
          return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.owner.comment(item))
            return false;
        }
        return true;
      },
    },
    v1: {
      comment: function (i) {
        return objectVerify(i, [
          "id",
          "no",
          "vposMs",
          "body",
          "commands",
          "userId",
          "isPremium",
          "score",
          "postedAt",
          "nicoruCount",
          "nicoruId",
          "source",
          "isMyPost",
        ]);
      },
      thread: function (i) {
        if (!objectVerify(i, ["id", "fork", "commentCount", "comments"]))
          return false;
        for (var _i = 0, _a = Object.keys(i.comments); _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.v1.comment(i.comments[item]))
            return false;
        }
        return true;
      },
      threads: function (i) {
        if (typeof i !== "object")
          return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.v1.thread(item))
            return false;
        }
        return true;
      },
    },
    nicoScript: {
      range: {
        target: function (i) {
          return typeof i === "string" && !!i.match(/^(?:\u6295?\u30b3\u30e1|\u5168)$/);
        },
      },
      replace: {
        range: function (i) {
          return typeof i === "string" && !!i.match(/^(?:\u5358|\u5168)$/);
        },
        target: function (i) {
          return typeof i === "string" &&
            !!i.match(/^(?:\u30b3\u30e1|\u6295\u30b3\u30e1|\u5168|\u542b\u3080|\u542b\u307e\u306a\u3044)$/);
        },
        condition: function (i) {
          return typeof i === "string" &&
            !!i.match(/^(?:\u90e8\u5206\u4e00\u81f4|\u5b8c\u5168\u4e00\u81f4)$/);
        },
      },
    },
    comment: {
      font: function (i) {
        return typeof i === "string" && !!i.match(/^(?:gothic|mincho|defont)$/);
      },
      loc: function (i) {
        return typeof i === "string" && !!i.match(/^(?:ue|naka|shita)$/);
      },
      size: function (i) {
        return typeof i === "string" && !!i.match(/^(?:big|medium|small)$/);
      },
      command: {
        key: function (i) {
          return typeof i === "string" && !!i.match(/^(?:full|ender|_live|invisible)$/);
        },
      },
      color: function (i) {
        return typeof i === "string" && Object.keys(colors).includes(i);
      },
      colorCode: function (i) {
        return typeof i === "string" &&
          !!i.match(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
      },
    },
    config: {
      initOptions: function (item) {
        if (typeof item !== "object" || !item)
          return false;
        var keys = {
          useLegacy: isBoolean,
          formatted: isBoolean,
          showCollision: isBoolean,
          showFPS: isBoolean,
          showCommentCount: isBoolean,
          drawAllImageOnLoad: isBoolean,
          debug: isBoolean,
          enableLegacyPiP: isBoolean,
          keepCA: isBoolean,
          scale: isNumber,
          config: isObject,
          format: function (i) {
            return typeof i === "string" &&
              !!i.match(/^(niconicome|formatted|legacy|legacyOwner|owner|v1|default|empty)$/);
          },
          video: function (i) {
            return typeof i === "object" && i.nodeName === "VIDEO";
          },
        };
        for (var key in keys) {
          if (item[key] !== undefined &&
            !keys[key](item[key])) {
            console.warn("[Incorrect input] var: initOptions, key: ".concat(key, ", value: ").concat(item[key]));
            return false;
          }
        }
        return true;
      },
    },
  };
  var objectVerify = function (item, keys) {
    if (typeof item !== "object" || !item)
      return false;
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
      var key = keys_1[_i];
      if (!Object.prototype.hasOwnProperty.call(item, key))
        return false;
    }
    return true;
  };
  var typeAttributeVerify = function (item, keys) {
    if (typeof item !== "object" || !item)
      return false;
    for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
      var key = keys_2[_i];
      if (item.getAttribute(key) === null)
        return false;
    }
    return true;
  };

  var convert2formattedComment = function (data, type) {
    var result = [];
    if (type === "empty" && data === undefined) {
      return [];
    }
    else if ((type === "XMLDocument" || type === "niconicome") &&
      typeGuard.xmlDocument(data)) {
      result = fromXMLDocument(data);
    }
    else if (type === "formatted" && typeGuard.formatted.legacyComments(data)) {
      result = fromFormatted(data);
    }
    else if (type === "legacy" && typeGuard.legacy.rawApiResponses(data)) {
      result = fromLegacy(data);
    }
    else if (type === "legacyOwner" && typeGuard.legacyOwner.comments(data)) {
      result = fromLegacyOwner(data);
    }
    else if (type === "owner" && typeGuard.owner.comments(data)) {
      result = fromOwner(data);
    }
    else if (type === "v1" && typeGuard.v1.threads(data)) {
      result = fromV1(data);
    }
    else {
      throw new Error("unknown input format");
    }
    return sort(result);
  };
  var fromXMLDocument = function (data) {
    var _a;
    var data_ = [], userList = [];
    for (var _i = 0, _b = Array.from(data.documentElement.children); _i < _b.length; _i++) {
      var item = _b[_i];
      if (item.nodeName !== "chat")
        continue;
      var tmpParam = {
        id: Number(item.getAttribute("no")),
        vpos: Number(item.getAttribute("vpos")),
        content: item.innerHTML,
        date: Number(item.getAttribute("date")),
        date_usec: Number(item.getAttribute("date_usec")),
        owner: !item.getAttribute("user_id"),
        premium: item.getAttribute("premium") === "1",
        mail: [],
        user_id: -1,
        layer: -1,
      };
      if (item.getAttribute("mail")) {
        tmpParam.mail = ((_a = item.getAttribute("mail")) === null || _a === void 0 ? void 0 : _a.split(/\s+/g)) || [];
      }
      if (tmpParam.content.startsWith("/") && tmpParam.owner) {
        tmpParam.mail.push("invisible");
      }
      var userId = item.getAttribute("user_id") || "";
      var isUserExist = userList.indexOf(userId);
      if (isUserExist === -1) {
        tmpParam.user_id = userList.length;
        userList.push(userId);
      }
      else {
        tmpParam.user_id = isUserExist;
      }
      data_.push(tmpParam);
    }
    return data_;
  };
  var fromFormatted = function (data) {
    var tmpData = data;
    if (!typeGuard.formatted.comments(data)) {
      for (var _i = 0, tmpData_1 = tmpData; _i < tmpData_1.length; _i++) {
        var item = tmpData_1[_i];
        item.layer = -1;
        item.user_id = 0;
        if (!item.date_usec)
          item.date_usec = 0;
      }
    }
    return tmpData;
  };
  var fromLegacy = function (data) {
    var data_ = [], userList = [];
    for (var i = 0; i < data.length; i++) {
      var val = data[i];
      if (!val || !typeGuard.legacy.apiChat(val === null || val === void 0 ? void 0 : val.chat))
        continue;
      var value = val.chat;
      if (value.deleted !== 1) {
        var tmpParam = {
          id: value.no,
          vpos: value.vpos,
          content: value.content || "",
          date: value.date,
          date_usec: value.date_usec || 0,
          owner: !value.user_id,
          premium: value.premium === 1,
          mail: [],
          user_id: -1,
          layer: -1,
        };
        if (value.mail) {
          tmpParam.mail = value.mail.split(/\s+/g);
        }
        if (value.content.startsWith("/") && !value.user_id) {
          tmpParam.mail.push("invisible");
        }
        var isUserExist = userList.indexOf(value.user_id);
        if (isUserExist === -1) {
          tmpParam.user_id = userList.length;
          userList.push(value.user_id);
        }
        else {
          tmpParam.user_id = isUserExist;
        }
        data_.push(tmpParam);
      }
    }
    return data_;
  };
  var fromLegacyOwner = function (data) {
    var data_ = [], comments = data.split("\n");
    for (var i = 0; i < comments.length; i++) {
      var value = comments[i];
      if (!value)
        continue;
      var commentData = value.split(":");
      if (commentData.length < 3) {
        continue;
      }
      else if (commentData.length > 3) {
        for (var j = 3; j < commentData.length; j++) {
          commentData[2] += ":".concat(commentData[j]);
        }
      }
      var tmpParam = {
        id: i,
        vpos: Number(commentData[0]),
        content: commentData[2] || "",
        date: i,
        date_usec: 0,
        owner: true,
        premium: true,
        mail: [],
        user_id: -1,
        layer: -1,
      };
      if (commentData[1]) {
        tmpParam.mail = commentData[1].split(/[\s+]/g);
      }
      if (tmpParam.content.startsWith("/")) {
        tmpParam.mail.push("invisible");
      }
      data_.push(tmpParam);
    }
    return data_;
  };
  var fromOwner = function (data) {
    var data_ = [];
    data.forEach(function (value, index) {
      var tmpParam = {
        id: index,
        vpos: time2vpos(value.time),
        content: value.comment,
        date: index,
        date_usec: 0,
        owner: true,
        premium: true,
        mail: [],
        user_id: -1,
        layer: -1,
      };
      if (value.command) {
        tmpParam.mail = value.command.split(/\s+/g);
      }
      if (tmpParam.content.startsWith("/")) {
        tmpParam.mail.push("invisible");
      }
      data_.push(tmpParam);
    });
    return data_;
  };
  var fromV1 = function (data) {
    var data_ = [], userList = [];
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
      var item = data_1[_i];
      var val = item.comments, forkName = item.fork;
      for (var _a = 0, _b = Object.keys(val); _a < _b.length; _a++) {
        var key = _b[_a];
        var value = val[key];
        if (!value)
          continue;
        var tmpParam = {
          id: value.no,
          vpos: Math.floor(value.vposMs / 10),
          content: value.body,
          date: date2time(value.postedAt),
          date_usec: 0,
          owner: forkName === "owner",
          premium: value.isPremium,
          mail: value.commands,
          user_id: -1,
          layer: -1,
        };
        if (tmpParam.content.startsWith("/") && tmpParam.owner) {
          tmpParam.mail.push("invisible");
        }
        var isUserExist = userList.indexOf(value.userId);
        if (isUserExist === -1) {
          tmpParam.user_id = userList.length;
          userList.push(value.userId);
        }
        else {
          tmpParam.user_id = isUserExist;
        }
        data_.push(tmpParam);
      }
    }
    return data_;
  };
  var sort = function (data) {
    data.sort(function (a, b) {
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
    return data;
  };
  var time2vpos = function (time_str) {
    var time = time_str.match(/^(?:(\d+):(\d+)\.(\d+)|(\d+):(\d+)|(\d+)\.(\d+)|(\d+))$/);
    if (time) {
      if (time[1] !== undefined &&
        time[2] !== undefined &&
        time[3] !== undefined) {
        return ((Number(time[1]) * 60 + Number(time[2])) * 100 +
          Number(time[3]) / Math.pow(10, time[3].length - 2));
      }
      else if (time[4] !== undefined && time[5] !== undefined) {
        return (Number(time[4]) * 60 + Number(time[5])) * 100;
      }
      else if (time[6] !== undefined && time[7] !== undefined) {
        return (Number(time[6]) * 100 +
          Number(time[7]) / Math.pow(10, time[7].length - 2));
      }
      else if (time[8] !== undefined) {
        return Number(time[8]) * 100;
      }
    }
    return 0;
  };
  var date2time = function (date) {
    return Math.floor(new Date(date).getTime() / 1000);
  };

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
  function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  }

  var build = function (fonts) {
    return fonts.reduce(function (pv, val, index) {
      if (index === 0) {
        return _assign({}, val);
      }
      pv.font += ", ".concat(val.font);
      return pv;
    }, { font: "", offset: 0, weight: 600 });
  };
  var fontTemplates = {
    arial: {
      font: 'Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic',
      offset: 0.01,
      weight: 600,
    },
    gothic: {
      font: '"游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium',
      offset: -0.04,
      weight: 400,
    },
    gulim: {
      font: 'Gulim, "黑体", SimHei',
      offset: 0.03,
      weight: 400,
    },
    mincho: {
      font: '"游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium',
      offset: -0.01,
      weight: 400,
    },
    simsun: {
      font: '"宋体", SimSun',
      offset: 0.135,
      weight: 400,
    },
    macGothicPro6: {
      font: '"ヒラギノ角ゴ ProN W6", HiraKakuProN-W6, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
      offset: -0.05,
      weight: 600,
    },
    macGothicPro3: {
      font: '"ヒラギノ角ゴ ProN W3", HiraKakuProN-W3, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
      offset: -0.04,
      weight: 300,
    },
    macMincho: {
      font: '"ヒラギノ明朝 ProN W3", HiraMinProN-W3, "ヒラギノ明朝 ProN", HiraMinProN, "Hiragino Mincho ProN"',
      offset: -0.02,
      weight: 300,
    },
    macGothic1: {
      font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
      offset: -0.05,
      weight: 600,
    },
    macGothic2: {
      font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
      offset: -0.04,
      weight: 300,
    },
    sansSerif600: {
      font: "sans-serif",
      offset: 0,
      weight: 600,
    },
    sansSerif400: {
      font: "sans-serif",
      offset: 0,
      weight: 400,
    },
    serif: {
      font: "serif",
      offset: 0,
      weight: 400,
    },
  };
  var fonts = {
    win7: {
      defont: build([fontTemplates.arial]),
      gothic: build([
        fontTemplates.gothic,
        fontTemplates.gulim,
        fontTemplates.arial,
      ]),
      mincho: build([
        fontTemplates.mincho,
        fontTemplates.simsun,
        fontTemplates.arial,
      ]),
    },
    win8_1: {
      defont: build([fontTemplates.arial]),
      gothic: build([
        fontTemplates.gothic,
        fontTemplates.simsun,
        fontTemplates.arial,
      ]),
      mincho: build([
        fontTemplates.mincho,
        fontTemplates.simsun,
        fontTemplates.arial,
      ]),
    },
    win: {
      defont: build([fontTemplates.arial]),
      gothic: build([fontTemplates.gulim, fontTemplates.arial]),
      mincho: build([fontTemplates.simsun, fontTemplates.arial]),
    },
    mac10_9: {
      defont: build([fontTemplates.macGothicPro6]),
      gothic: build([fontTemplates.gothic, fontTemplates.macGothicPro3]),
      mincho: build([
        fontTemplates.mincho,
        fontTemplates.macMincho,
        fontTemplates.macGothicPro3,
      ]),
    },
    mac10_11: {
      defont: build([fontTemplates.macGothic1]),
      gothic: build([fontTemplates.gothic, fontTemplates.macGothic2]),
      mincho: build([
        fontTemplates.mincho,
        fontTemplates.macMincho,
        fontTemplates.macGothic2,
      ]),
    },
    mac: {
      defont: build([fontTemplates.macGothicPro6]),
      gothic: build([fontTemplates.macGothicPro3]),
      mincho: build([fontTemplates.macMincho]),
    },
    other: {
      defont: build([fontTemplates.sansSerif600]),
      gothic: build([fontTemplates.sansSerif400]),
      mincho: build([fontTemplates.serif]),
    },
  };

  var defaultConfig;
  var initConfig = function () {
    var platform = (function (ua) {
      if (ua.match(/windows nt 6\.[12]/i))
        return "win7";
      else if (ua.match(/windows nt (6\.3|10\.\d+)/i))
        return "win8_1";
      else if (ua.match(/windows nt/i))
        return "win";
      else if (ua.match(/mac os x 10(.|_)(9|10)/i))
        return "mac10_9";
      else if (ua.match(/mac os x 10(.|_)\d{2}/i))
        return "mac10_11";
      else if (ua.match(/mac os x/i))
        return "mac";
      return "other";
    })(navigator.userAgent);
    defaultConfig = {
      colors: colors,
      contextStrokeColor: "#000000",
      contextStrokeInversionColor: "#FFFFFF",
      contextStrokeOpacity: 0.4,
      contextFillLiveOpacity: 0.5,
      contextLineWidth: 2.8,
      commentScale: {
        html5: 1920 / 683,
        flash: 1920 / 683,
      },
      commentStageSize: {
        html5: {
          width: 512,
          fullWidth: 683,
          height: 384,
        },
        flash: {
          width: 512,
          fullWidth: 640,
          height: 385,
        },
      },
      fontSize: {
        html5: {
          small: {
            default: 18,
            resized: 10,
          },
          medium: {
            default: 27,
            resized: 14,
          },
          big: {
            default: 39,
            resized: 19.5,
          },
        },
        flash: {
          small: {
            default: 15,
            resized: 7.5,
          },
          medium: {
            default: 24,
            resized: 12,
          },
          big: {
            default: 39,
            resized: 19.5,
          },
        },
      },
      lineCounts: {
        default: {
          big: 8.4,
          medium: 13.1,
          small: 21,
        },
        resized: {
          big: 16,
          medium: 25.4,
          small: 38,
        },
        doubleResized: {
          big: 7.8,
          medium: 11.3,
          small: 16.6,
        },
      },
      hiResCommentCorrection: 20,
      minFontSize: 10,
      fonts: fonts[platform],
      fpsInterval: 500,
      cacheAge: 2000,
      canvasWidth: 1920,
      canvasHeight: 1080,
      commentDrawRange: 1530,
      commentDrawPadding: 195,
      collisionRange: {
        left: 235,
        right: 1685,
      },
      sameCARange: 3600,
      sameCAGap: 100,
      sameCAMinScore: 10,
      plugins: [],
      flashThreshold: 1499871600,
      flashChar: {
        gulim: "[\u0126\u0127\u0132\u0133\u0138\u013f\u0140\u0149-\u014b\u0166\u0167\u02d0\u02da\u2074\u207f\u2081-\u2084\u2113\u2153\u2154\u215c-\u215e\u2194\u2195\u223c\u249c-\u24b5\u24d0-\u24e9\u25a3-\u25a9\u25b6\u25b7\u25c0\u25c1\u25c8\u25d0\u25d1\u260e\u260f\u261c\u261e\u2660\u2661\u2663-\u2665\u2667-\u2669\u266c\u3131-\u316e\u3200-\u321c\u3260-\u327b\u3380-\u3384\u3388-\u338d\u3390-\u339b\u339f\u33a0\u33a2-\u33ca\u33cf\u33d0\u33d3\u33d6\u33d8\u33db-\u33dd\uf900-\uf928\uf92a-\uf994\uf996\ufa0b\uffe6]",
        simsunStrong: "[\u01ce\u01d0\u01d2\u01d4\u01d6\u01d8\u01da\u01dc\u0251\u0261\u02ca\u02cb\u2016\u2035\u216a\u216b\u2223\u2236\u2237\u224c\u226e\u226f\u2295\u2483-\u249b\u2504-\u250b\u256d-\u2573\u2581-\u2583\u2585-\u2587\u2589-\u258b\u258d-\u258f\u2594\u2595\u25e2-\u25e5\u2609\u3016\u3017\u301e\u3021-\u3029\u3105-\u3129\u3220-\u3229\u32a3\u33ce\u33d1\u33d2\u33d5\ue758-\ue864\ufa0c\ufa0d\ufe30\ufe31\ufe33-\ufe44\ufe49-\ufe52\ufe54-\ufe57\ufe59-\ufe66\ufe68-\ufe6b]",
        simsunWeak: "[\u02c9\u2105\u2109\u2196-\u2199\u220f\u2215\u2248\u2264\u2265\u2299\u2474-\u2482\u250d\u250e\u2511\u2512\u2515\u2516\u2519\u251a\u251e\u251f\u2521\u2522\u2526\u2527\u2529\u252a\u252d\u252e\u2531\u2532\u2535\u2536\u2539\u253a\u253d\u253e\u2540\u2541\u2543-\u254a\u2550-\u256c\u2584\u2588\u258c\u2593]",
        gothic: "[\u03fb\uff9f]",
      },
      flashMode: "vista",
      flashScriptChar: {
        super: "[\u00aa\u00b2\u00b3\u00b9\u00ba\u02b0\u02b2\u02b3\u02b7\u02b8\u02e1-\u02e3\u0304\u1d2c-\u1d43\u1d45-\u1d61\u1d9b-\u1da1\u1da3-\u1dbf\u2070\u2071\u2074-\u207f\u2c7d]",
        sub: "[\u0320\u1d62-\u1d6a\u2080-\u208e\u2090-\u209c\u2c7c]",
      },
      font: {
        gulim: 'normal 600 [size]px gulim, "Microsoft JhengHei UI", Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic',
        simsun: 'normal 400 [size]px simsun, "游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium',
      },
      lineHeight: {
        small: {
          default: 18 / 15,
          resized: 10 / 7.5,
        },
        medium: {
          default: 29 / 25,
          resized: 15 / 12,
        },
        big: {
          default: 45 / 39,
          resized: 24 / 19.5,
        },
      },
      doubleResizeMaxWidth: {
        full: 1200,
        normal: 960,
      },
      commentYPaddingTop: {
        default: 5,
        resized: 3,
      },
      commentYMarginBottom: {
        small: 0.24,
        medium: 0.28,
        big: 0.24,
      },
      commentYOffset: {
        small: { default: -0.2, resized: -0.2 },
        medium: { default: -0.2, resized: -0.2 },
        big: {
          default: -0.2,
          resized: -0.2,
        },
      },
      letterSpacing: 1,
      scriptCharOffset: 0.12,
    };
  };
  var defaultOptions = {
    config: {},
    debug: false,
    enableLegacyPiP: false,
    format: "default",
    formatted: false,
    keepCA: false,
    mode: "default",
    scale: 1,
    showCollision: false,
    showCommentCount: false,
    showFPS: false,
    useLegacy: false,
    video: undefined,
  };
  var config;
  var options;
  var setConfig = function (value) { return (config = value); };
  var setOptions = function (value) { return (options = value); };

  var nicoScripts = {
    reverse: [],
    default: [],
    replace: [],
    ban: [],
  };
  var resetNicoScripts = function () {
    nicoScripts = {
      reverse: [],
      default: [],
      replace: [],
      ban: [],
    };
  };

  var getPosY = function (currentPos, targetComment, collision) {
    var isChanged = false, isBreak = false;
    if (!collision)
      return { currentPos: currentPos, isChanged: isChanged, isBreak: isBreak };
    for (var _i = 0, collision_1 = collision; _i < collision_1.length; _i++) {
      var collisionItem = collision_1[_i];
      if (currentPos < collisionItem.posY + collisionItem.height &&
        currentPos + targetComment.height > collisionItem.posY &&
        collisionItem.owner === targetComment.owner &&
        collisionItem.layer === targetComment.layer) {
        if (collisionItem.posY + collisionItem.height > currentPos) {
          currentPos = collisionItem.posY + collisionItem.height;
          isChanged = true;
        }
        if (currentPos + targetComment.height > config.canvasHeight) {
          if (config.canvasHeight < targetComment.height) {
            if (targetComment.mail.includes("naka")) {
              currentPos = (targetComment.height - config.canvasHeight) / -2;
            }
            else {
              currentPos = 0;
            }
          }
          else {
            currentPos = Math.floor(Math.random() * (config.canvasHeight - targetComment.height));
          }
          isBreak = true;
          break;
        }
      }
    }
    return { currentPos: currentPos, isChanged: isChanged, isBreak: isBreak };
  };
  var getPosX = function (width, vpos, long) {
    var speed = (config.commentDrawRange + width) / (long + 100);
    return (config.commentDrawPadding + config.commentDrawRange - (vpos + 100) * speed);
  };
  var parseFont = function (font, size) {
    switch (font) {
      case "gulim":
      case "simsun":
        return config.font[font].replace("[size]", "".concat(size));
      case "gothic":
      case "mincho":
        return "".concat(config.fonts[font].weight, " ").concat(size, "px ").concat(config.fonts[font].font);
      default:
        return "".concat(config.fonts.defont.weight, " ").concat(size, "px ").concat(config.fonts.defont.font);
    }
  };
  var arrayPush = function (array, key, push) {
    var _a;
    if (!array) {
      array = {};
    }
    if (!array[Number(key)]) {
      array[Number(key)] = [];
    }
    (_a = array[Number(key)]) === null || _a === void 0 ? void 0 : _a.push(push);
  };
  var hex2rgb = function (hex) {
    if (hex.slice(0, 1) === "#")
      hex = hex.slice(1);
    if (hex.length === 3)
      hex =
        hex.slice(0, 1) +
        hex.slice(0, 1) +
        hex.slice(1, 2) +
        hex.slice(1, 2) +
        hex.slice(2, 3) +
        hex.slice(2, 3);
    return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (str) {
      return parseInt(str, 16);
    });
  };
  var hex2rgba = function (hex) {
    if (hex.slice(0, 1) === "#")
      hex = hex.slice(1);
    if (hex.length === 4)
      hex =
        hex.slice(0, 1) +
        hex.slice(0, 1) +
        hex.slice(1, 2) +
        hex.slice(1, 2) +
        hex.slice(2, 3) +
        hex.slice(2, 3) +
        hex.slice(3, 4) +
        hex.slice(3, 4);
    return [
      hex.slice(0, 2),
      hex.slice(2, 4),
      hex.slice(4, 6),
      hex.slice(4, 6),
    ].map(function (str, index) {
      if (index === 3)
        return parseInt(str, 16) / 256;
      return parseInt(str, 16);
    });
  };
  var changeCALayer = function (rawData) {
    var userList = {};
    var data = [], index = {};
    for (var _i = 0, rawData_1 = rawData; _i < rawData_1.length; _i++) {
      var value = rawData_1[_i];
      if (value.user_id === undefined || value.user_id === -1)
        continue;
      if (userList[value.user_id] === undefined)
        userList[value.user_id] = 0;
      if (value.mail.indexOf("ca") > -1 ||
        value.mail.indexOf("patissier") > -1 ||
        value.mail.indexOf("ender") > -1 ||
        value.mail.indexOf("full") > -1) {
        userList[value.user_id] += 5;
      }
      if ((value.content.match(/\r\n|\n|\r/g) || []).length > 2) {
        userList[value.user_id] +=
          (value.content.match(/\r\n|\n|\r/g) || []).length / 2;
      }
      var key = "".concat(value.content, "@@").concat(__spreadArray([], value.mail, true).sort()
        .filter(function (e) { return !e.match(/@[\d.]+|184|device:.+|patissier|ca/); })
        .join("")), lastComment = index[key];
      if (lastComment !== undefined) {
        if (value.vpos - lastComment.vpos > config.sameCAGap ||
          Math.abs(value.date - lastComment.date) < config.sameCARange) {
          data.push(value);
          index[key] = value;
        }
      }
      else {
        data.push(value);
        index[key] = value;
      }
    }
    for (var _a = 0, data_1 = data; _a < data_1.length; _a++) {
      var value = data_1[_a];
      if (userList[value.user_id] || 0 >= config.sameCAMinScore)
        value.layer = value.user_id;
    }
    return data;
  };
  var getConfig = function (input, isFlash) {
    if (isFlash === void 0) { isFlash = false; }
    if (Object.prototype.hasOwnProperty.call(input, "html5") &&
      Object.prototype.hasOwnProperty.call(input, "flash")) {
      return input[isFlash ? "flash" : "html5"];
    }
    else {
      return input;
    }
  };
  var isFlashComment = function (comment) {
    return options.mode === "flash" ||
      (options.mode === "default" &&
        !(comment.mail.includes("gothic") ||
          comment.mail.includes("defont") ||
          comment.mail.includes("mincho")) &&
        (comment.date < config.flashThreshold ||
          comment.mail.includes("nico:flash")));
  };
  var parseCommandAndNicoScript = function (comment) {
    var isFlash = isFlashComment(comment);
    var data = parseCommand(comment), string = comment.content, nicoscript = string.match(/^(?:@|\uff20)(\u30c7\u30d5\u30a9\u30eb\u30c8|\u7f6e\u63db|\u9006|\u30b3\u30e1\u30f3\u30c8\u7981\u6b62|\u30b7\u30fc\u30af\u7981\u6b62|\u30b8\u30e3\u30f3\u30d7)/);
    if (nicoscript && comment.owner) {
      var reverse = comment.content.match(/^(?:@|\uff20)\u9006(?:\s+)?(\u5168|\u30b3\u30e1|\u6295\u30b3\u30e1)?/);
      var content = comment.content.split(""), result = [];
      var quote = "", last_i = "", string_1 = "";
      if (nicoscript[1] === "\u30c7\u30d5\u30a9\u30eb\u30c8") {
        nicoScripts.default.unshift({
          start: comment.vpos,
          long: data.long === undefined ? undefined : Math.floor(data.long * 100),
          color: data.color,
          size: data.size,
          font: data.font,
          loc: data.loc,
        });
      }
      else if (nicoscript[1] === "\u9006" &&
        reverse &&
        reverse[1] &&
        typeGuard.nicoScript.range.target(reverse[1])) {
        if (data.long === undefined) {
          data.long = 30;
        }
        nicoScripts.reverse.unshift({
          start: comment.vpos,
          end: comment.vpos + data.long * 100,
          target: reverse[1],
        });
      }
      else if (nicoscript[1] === "\u30b3\u30e1\u30f3\u30c8\u7981\u6b62") {
        if (data.long === undefined) {
          data.long = 30;
        }
        nicoScripts.ban.unshift({
          start: comment.vpos,
          end: comment.vpos + data.long * 100,
        });
      }
      else if (nicoscript[1] === "\u7f6e\u63db") {
        for (var _i = 0, _a = content.slice(4); _i < _a.length; _i++) {
          var i = _a[_i];
          if (i.match(/["'\u300c]/) && quote === "") {
            quote = i;
          }
          else if (i.match(/["']/) && quote === i && last_i !== "\\") {
            result.push(string_1.replaceAll("\\n", "\n"));
            quote = "";
            string_1 = "";
          }
          else if (i.match(/\u300d/) && quote === "\u300c") {
            result.push(string_1);
            quote = "";
            string_1 = "";
          }
          else if (quote === "" && i.match(/\s+/)) {
            if (string_1) {
              result.push(string_1);
              string_1 = "";
            }
          }
          else {
            string_1 += i;
          }
          last_i = i;
        }
        result.push(string_1);
        if (!(result[0] === undefined ||
          (result[2] !== undefined &&
            !typeGuard.nicoScript.replace.range(result[2])) ||
          (result[3] !== undefined &&
            !typeGuard.nicoScript.replace.target(result[3])) ||
          (result[4] !== undefined &&
            !typeGuard.nicoScript.replace.condition(result[4])))) {
          nicoScripts.replace.unshift({
            start: comment.vpos,
            long: data.long === undefined ? undefined : Math.floor(data.long * 100),
            keyword: result[0],
            replace: result[1] || "",
            range: result[2] || "\u5358",
            target: result[3] || "\u30b3\u30e1",
            condition: result[4] || "\u90e8\u5206\u4e00\u81f4",
            color: data.color,
            size: data.size,
            font: data.font,
            loc: data.loc,
            no: comment.id,
          });
          nicoScripts.replace.sort(function (a, b) {
            if (a.start < b.start)
              return -1;
            if (a.start > b.start)
              return 1;
            if (a.no < b.no)
              return -1;
            if (a.no > b.no)
              return 1;
            return 0;
          });
        }
      }
      data.invisible = true;
    }
    var color = undefined, size = undefined, font = undefined, loc = undefined;
    for (var i = 0; i < nicoScripts.default.length; i++) {
      var item = nicoScripts.default[i];
      if (!item)
        continue;
      if (item.long !== undefined && item.start + item.long < comment.vpos) {
        nicoScripts.default = nicoScripts.default.splice(Number(i), 1);
        continue;
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
      if (loc && color && size && font)
        break;
    }
    for (var i = 0; i < nicoScripts.replace.length; i++) {
      var item = nicoScripts.replace[i];
      if (!item)
        continue;
      if (item.long !== undefined && item.start + item.long < comment.vpos) {
        nicoScripts.default = nicoScripts.default.splice(Number(i), 1);
        continue;
      }
      if ((item.target === "\u30b3\u30e1" && comment.owner) ||
        (item.target === "\u6295\u30b3\u30e1" && !comment.owner) ||
        (item.target === "\u542b\u307e\u306a\u3044" && comment.owner))
        continue;
      if ((item.condition === "\u5b8c\u5168\u4e00\u81f4" &&
          comment.content === item.keyword) ||
        (item.condition === "\u90e8\u5206\u4e00\u81f4" &&
          comment.content.indexOf(item.keyword) !== -1)) {
        if (item.range === "\u5358") {
          comment.content = comment.content.replaceAll(item.keyword, item.replace);
        }
        else {
          comment.content = item.replace;
        }
        if (item.loc) {
          data.loc = item.loc;
        }
        if (item.color) {
          data.color = item.color;
        }
        if (item.size) {
          data.size = item.size;
          data.fontSize = getConfig(config.fontSize, isFlash)[data.size].default;
        }
        if (item.font) {
          data.font = item.font;
        }
      }
    }
    if (!data.loc) {
      data.loc = loc || "naka";
    }
    if (!data.color) {
      data.color = color || "#FFFFFF";
    }
    if (!data.size) {
      data.size = size || "medium";
      data.fontSize = getConfig(config.fontSize, isFlash)[data.size].default;
    }
    if (!data.font) {
      data.font = font || "defont";
    }
    if (!data.long) {
      data.long = 300;
    }
    else {
      data.long = Math.floor(Number(data.long) * 100);
    }
    return _assign(_assign(_assign(_assign({}, comment), { content: [], lineCount: 0, lineOffset: 0 }), data), { flash: isFlash });
  };
  var parseCommand = function (comment) {
    var metadata = comment.mail, isFlash = isFlashComment(comment);
    var result = {
      loc: undefined,
      size: undefined,
      fontSize: undefined,
      color: undefined,
      strokeColor: undefined,
      font: undefined,
      full: false,
      ender: false,
      _live: false,
      invisible: false,
      long: undefined,
    };
    for (var _i = 0, metadata_1 = metadata; _i < metadata_1.length; _i++) {
      var command = metadata_1[_i];
      command = command.toLowerCase();
      var match = void 0;
      if ((match = command.match(/^(?:@|\uff20)([0-9.]+)/)) && match[1]) {
        result.long = Number(match[1]);
      }
      else if (result.strokeColor === undefined &&
        (match = command.match(/^nico:stroke:(.+)$/))) {
        if (typeGuard.comment.color(match[1])) {
          result.strokeColor = colors[match[1]];
        }
        else if (typeGuard.comment.colorCode(match[1])) {
          result.strokeColor = match[1].slice(1);
        }
      }
      else if (result.loc === undefined && typeGuard.comment.loc(command)) {
        result.loc = command;
      }
      else if (result.size === undefined && typeGuard.comment.size(command)) {
        result.size = command;
        result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
      }
      else {
        if (result.color === undefined) {
          var color = config.colors[command];
          if (color) {
            result.color = color;
            continue;
          }
          else {
            var match_1 = command.match(/#[0-9a-z]{3,6}/);
            if (match_1 && match_1[0] && comment.premium) {
              result.color = match_1[0].toUpperCase();
              continue;
            }
          }
        }
        if (result.font === undefined && typeGuard.comment.font(command)) {
          result.font = command;
        }
        else if (typeGuard.comment.command.key(command)) {
          result[command] = true;
        }
      }
    }
    if (comment.content.startsWith("/")) {
      result.invisible = true;
    }
    return result;
  };
  var getStrokeColor = function (comment) {
    if (comment.strokeColor) {
      var length_1 = comment.strokeColor.length;
      if (length_1 === 3 || length_1 === 6) {
        return "rgba(".concat(hex2rgb(comment.strokeColor).join(","), ",").concat(config.contextStrokeOpacity, ")");
      }
      else if (length_1 === 4 || length_1 === 8) {
        return "rgba(".concat(hex2rgba(comment.strokeColor).join(","), ")");
      }
    }
    return "rgba(".concat(hex2rgb(comment.color === "#000000"
      ? config.contextStrokeInversionColor
      : config.contextStrokeColor).join(","), ",").concat(config.contextStrokeOpacity, ")");
  };
  var ArrayEqual = function (a, b) {
    if (a.length !== b.length)
      return false;
    for (var i = 0, n = a.length; i < n; ++i) {
      if (a[i] !== b[i])
        return false;
    }
    return true;
  };

  var getLineHeight = function (fontSize, isFlash, resized) {
    if (resized === void 0) { resized = false; }
    var lineCounts = getConfig(config.lineCounts, isFlash), commentStageSize = getConfig(config.commentStageSize, isFlash), lineHeight = commentStageSize.height / lineCounts.doubleResized[fontSize], defaultLineCount = lineCounts.default[fontSize];
    if (resized) {
      var resizedLineCount = lineCounts.resized[fontSize];
      return ((commentStageSize.height -
          lineHeight * (defaultLineCount / resizedLineCount)) /
        (resizedLineCount - 1));
    }
    return (commentStageSize.height - lineHeight) / (defaultLineCount - 1);
  };
  var getCharSize = function (fontSize, isFlash) {
    var lineCounts = getConfig(config.lineCounts, isFlash), commentStageSize = getConfig(config.commentStageSize, isFlash);
    return commentStageSize.height / lineCounts.doubleResized[fontSize];
  };
  var measure = function (comment, context) {
    var width = measureWidth(comment, context);
    return _assign(_assign({}, width), { height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize });
  };
  var measureWidth = function (comment, context) {
    var _a = getFontSizeAndScale(comment.charSize), fontSize = _a.fontSize, scale = _a.scale, lineWidth = [], itemWidth = [];
    context.font = parseFont(comment.font, fontSize);
    var currentWidth = 0;
    for (var i = 0; i < comment.content.length; i++) {
      var item = comment.content[i];
      if (item === undefined)
        continue;
      var lines = item.content.split("\n");
      context.font = parseFont(item.font || comment.font, fontSize);
      var width = [];
      for (var j = 0; j < lines.length; j++) {
        var measure_1 = context.measureText(lines[j]);
        currentWidth += measure_1.width;
        width.push(measure_1.width);
        if (j < lines.length - 1) {
          lineWidth.push(Math.ceil(currentWidth * scale));
          currentWidth = 0;
        }
      }
      itemWidth.push(width);
      lineWidth.push(Math.ceil(currentWidth * scale));
    }
    return {
      width: Math.max.apply(Math, lineWidth),
      lineWidth: lineWidth,
      itemWidth: itemWidth,
    };
  };
  var getFontSizeAndScale = function (charSize) {
    charSize *= 0.8;
    if (charSize < config.minFontSize) {
      if (charSize >= 1)
        charSize = Math.floor(charSize);
      return {
        scale: charSize / config.minFontSize,
        fontSize: config.minFontSize,
      };
    }
    return {
      scale: 1,
      fontSize: Math.floor(charSize),
    };
  };

  var imageCache = {};
  var resetImageCache = function () {
    imageCache = {};
  };

  var HTML5Comment = (function () {
    function HTML5Comment(comment, context) {
      this.context = context;
      comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
      this.comment = this.getCommentSize(this.parseCommandAndNicoscript(comment));
      this.posY = 0;
    }
    Object.defineProperty(HTML5Comment.prototype, "invisible", {
      get: function () {
        return this.comment.invisible;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "loc", {
      get: function () {
        return this.comment.loc;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "long", {
      get: function () {
        return this.comment.long;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "vpos", {
      get: function () {
        return this.comment.vpos;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "width", {
      get: function () {
        return this.comment.width;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "height", {
      get: function () {
        return this.comment.height;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "flash", {
      get: function () {
        return false;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "layer", {
      get: function () {
        return this.comment.layer;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "owner", {
      get: function () {
        return this.comment.owner;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "mail", {
      get: function () {
        return this.comment.mail;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(HTML5Comment.prototype, "lineCount", {
      get: function () {
        return this.comment.lineCount;
      },
      enumerable: false,
      configurable: true
    });
    HTML5Comment.prototype.parseCommandAndNicoscript = function (comment) {
      var data = parseCommandAndNicoScript(comment);
      var content = [];
      content.push({ content: comment.content });
      var lineCount = content.reduce(function (pv, val) {
        var _a;
        return pv + (((_a = val.content.match(/\n/g)) === null || _a === void 0 ? void 0 : _a.length) || 0);
      }, 1);
      var lineOffset = 0;
      return _assign(_assign({}, data), { content: content, lineCount: lineCount, lineOffset: lineOffset });
    };
    HTML5Comment.prototype.measureText = function (comment) {
      var widthLimit = getConfig(config.commentStageSize, false)[comment.full ? "fullWidth" : "width"], scale = getConfig(config.commentScale, false);
      var configFontSize = getConfig(config.fontSize, false), lineHeight = getLineHeight(comment.size, false), charSize = getCharSize(comment.size, false);
      var lineCount = comment.lineCount;
      if (!comment.lineHeight)
        comment.lineHeight = lineHeight;
      if (!comment.charSize)
        comment.charSize = charSize;
      comment.fontSize = comment.charSize * 0.8;
      var width, height, itemWidth;
      this.context.font = parseFont(comment.font, comment.fontSize);
      if (!comment.resized &&
        !comment.ender &&
        ((comment.size === "big" && lineCount > 2) ||
          (comment.size === "medium" && lineCount > 4) ||
          (comment.size === "small" && lineCount > 6))) {
        comment.fontSize = configFontSize[comment.size].resized;
        var lineHeight_1 = getLineHeight(comment.size, false, true);
        comment.charSize = comment.charSize * (lineHeight_1 / comment.lineHeight);
        comment.lineHeight = lineHeight_1;
        comment.resized = true;
        comment.resizedY = true;
        var measureResult = measure(comment, this.context);
        height = measureResult.height;
        width = measureResult.width;
        itemWidth = measureResult.itemWidth;
      }
      else {
        var measureResult = measure(comment, this.context);
        height = measureResult.height;
        width = measureResult.width;
        itemWidth = measureResult.itemWidth;
      }
      if (comment.loc !== "naka" && width > widthLimit) {
        var scale_1 = widthLimit / width;
        comment.resizedX = true;
        var _comment = _assign({}, comment);
        _comment.charSize = (_comment.charSize || 0) * scale_1;
        _comment.lineHeight = (_comment.lineHeight || 0) * scale_1;
        _comment.fontSize = _comment.charSize * 0.8;
        var result = measure(_comment, this.context);
        if (result.width > widthLimit) {
          while (result.width >= widthLimit) {
            var originalCharSize = _comment.charSize;
            _comment.charSize -= 1;
            _comment.lineHeight *= _comment.charSize / originalCharSize;
            _comment.fontSize = _comment.charSize * 0.8;
            result = measure(_comment, this.context);
          }
        }
        else {
          var lastComment = _assign({}, _comment);
          while (result.width < widthLimit) {
            lastComment = _assign({}, _comment);
            var originalCharSize = _comment.charSize;
            _comment.charSize += 1;
            _comment.lineHeight *= _comment.charSize / originalCharSize;
            _comment.fontSize = _comment.charSize * 0.8;
            result = measure(_comment, this.context);
          }
          _comment = lastComment;
        }
        if (comment.resizedY) {
          var scale_2 = (_comment.charSize || 0) / comment.charSize;
          comment.charSize = scale_2 * charSize;
          comment.lineHeight = scale_2 * lineHeight;
        }
        else {
          comment.charSize = _comment.charSize;
          comment.lineHeight = _comment.lineHeight;
        }
        comment.fontSize = (comment.charSize || 0) * 0.8;
        result = measure(comment, this.context);
        width = result.width;
        height = result.height;
        itemWidth = result.itemWidth;
      }
      for (var i = 0; i < comment.content.length; i++) {
        var item = comment.content[i];
        if (!item || !itemWidth)
          continue;
        item.width = itemWidth[i];
      }
      comment.fontSize = (comment.charSize || 0) * 0.8;
      var charScale = getFontSizeAndScale(comment.charSize || 0);
      if (charScale.scale < 1)
        height *= 1.01;
      return {
        width: width * scale,
        height: height * scale,
        resized: !!comment.resized,
        fontSize: comment.fontSize,
        lineHeight: comment.lineHeight || 0,
        content: comment.content,
        resizedX: !!comment.resizedX,
        resizedY: !!comment.resizedY,
        charSize: comment.charSize || 0,
      };
    };
    HTML5Comment.prototype.getCommentSize = function (parsedData) {
      this.context.font = parseFont(parsedData.font, parsedData.fontSize);
      var size = parsedData;
      if (parsedData.invisible) {
        size.height = 0;
        size.width = 0;
        size.lineHeight = 0;
        size.fontSize = 0;
        size.content = [];
        size.resized = false;
        size.resizedX = false;
        size.resizedY = false;
        size.charSize = 0;
        return size;
      }
      var measure = this.measureText(parsedData);
      if (options.scale !== 1 && size.layer === -1) {
        measure.height *= options.scale;
        measure.width *= options.scale;
        measure.fontSize *= options.scale;
      }
      size.height = measure.height;
      size.width = measure.width;
      size.lineHeight = measure.lineHeight;
      size.fontSize = measure.fontSize;
      size.content = measure.content;
      size.resized = measure.resized;
      size.resizedX = measure.resizedX;
      size.resizedY = measure.resizedY;
      size.charSize = measure.charSize;
      return size;
    };
    HTML5Comment.prototype.draw = function (vpos, showCollision, debug) {
      var _a;
      var reverse = false;
      for (var _i = 0, _b = nicoScripts.reverse; _i < _b.length; _i++) {
        var range = _b[_i];
        if ((range.target === "コメ" && this.comment.owner) ||
          (range.target === "投コメ" && !this.comment.owner))
          break;
        if (range.start < vpos && vpos < range.end) {
          reverse = true;
        }
      }
      for (var _c = 0, _d = nicoScripts.ban; _c < _d.length; _c++) {
        var range = _d[_c];
        if (range.start < vpos && vpos < range.end)
          return;
      }
      var posX = (config.canvasWidth - this.comment.width) / 2, posY = this.posY;
      if (this.comment.loc === "naka") {
        if (reverse) {
          posX =
            config.canvasWidth +
            this.comment.width -
            getPosX(this.comment.width, vpos - this.comment.vpos, this.comment.long);
        }
        else {
          posX = getPosX(this.comment.width, vpos - this.comment.vpos, this.comment.long);
        }
        if (posX > config.canvasWidth || posX + this.comment.width < 0) {
          return;
        }
      }
      else if (this.comment.loc === "shita") {
        posY = config.canvasHeight - this.posY - this.comment.height;
      }
      if (this.image === undefined) {
        this.image = this.getTextImage();
      }
      if (this.image) {
        if (this.comment._live) {
          this.context.globalAlpha = config.contextFillLiveOpacity;
        }
        else {
          this.context.globalAlpha = 1;
        }
        this.context.drawImage(this.image, posX, posY);
      }
      if (showCollision) {
        var scale = getConfig(config.commentScale, false);
        this.context.strokeStyle = "rgba(0,255,255,1)";
        this.context.strokeRect(posX, posY, this.comment.width, this.comment.height);
        for (var i = 0; i < this.comment.lineCount; i++) {
          var linePosY = (this.comment.lineHeight * (i + 1) +
              (this.comment.charSize - this.comment.lineHeight) / 2 +
              this.comment.lineHeight * -0.16 +
              (((_a = config.fonts[this.comment.font]) === null || _a === void 0 ? void 0 : _a.offset) ||
                0)) *
            scale;
          this.context.strokeStyle = "rgba(255,255,0,0.5)";
          this.context.strokeRect(posX, posY + linePosY, this.comment.width, this.comment.fontSize * -1 * scale);
        }
      }
      if (debug) {
        var font = this.context.font;
        var fillStyle = this.context.fillStyle;
        this.context.font = parseFont("defont", 30);
        this.context.fillStyle = "#ff00ff";
        this.context.fillText(this.comment.mail.join(","), posX, posY + 30);
        this.context.font = font;
        this.context.fillStyle = fillStyle;
      }
    };
    HTML5Comment.prototype.getTextImage = function () {
      var _this = this;
      var _a;
      if (this.comment.invisible ||
        (this.comment.lineCount === 1 && this.comment.width === 0) ||
        this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
        0)
        return null;
      var cacheKey = JSON.stringify(this.comment.content) +
        "@@HTML5@@" +
        __spreadArray([], this.comment.mail, true).sort().join(","), cache = imageCache[cacheKey];
      if (cache) {
        this.image = cache.image;
        window.setTimeout(function () {
          delete _this.image;
        }, this.comment.long * 10 + config.cacheAge);
        clearTimeout(cache.timeout);
        cache.timeout = window.setTimeout(function () {
          delete imageCache[cacheKey];
        }, this.comment.long * 10 + config.cacheAge);
        return cache.image;
      }
      if (this.image)
        return this.image;
      var image = document.createElement("canvas");
      image.width = this.comment.width + 2 * 2 * this.comment.charSize;
      image.height =
        this.comment.height - (this.comment.charSize - this.comment.lineHeight);
      var context = image.getContext("2d");
      if (!context)
        throw new Error("Fail to get CanvasRenderingContext2D");
      context.strokeStyle = getStrokeColor(this.comment);
      context.textAlign = "start";
      context.textBaseline = "alphabetic";
      context.lineWidth = config.contextLineWidth;
      var _b = getFontSizeAndScale(this.comment.charSize), fontSize = _b.fontSize, scale = _b.scale;
      context.font = parseFont(this.comment.font, fontSize);
      context.lineJoin = "bevel";
      var drawScale = getConfig(config.commentScale, false) *
        scale *
        (this.comment.layer === -1 ? options.scale : 1);
      context.scale(drawScale, drawScale);
      context.fillStyle = this.comment.color;
      var leftOffset = 0, lineCount = 0;
      var paddingTop = (10 - scale * 10) *
        (this.comment.lineCount / config.hiResCommentCorrection);
      for (var i = 0; i < this.comment.content.length; i++) {
        var item = this.comment.content[i];
        if (!item)
          continue;
        var lines = item.content.split("\n");
        for (var j = 0; j < lines.length; j++) {
          var line = lines[j];
          if (line === undefined)
            continue;
          var posY = (this.comment.lineHeight * (lineCount + 1 + paddingTop) +
              (this.comment.charSize - this.comment.lineHeight) / 2 +
              this.comment.lineHeight * -0.16 +
              (((_a = config.fonts[this.comment.font]) === null || _a === void 0 ? void 0 : _a.offset) ||
                0)) /
            scale;
          context.strokeText(line, leftOffset, posY);
          context.fillText(line, leftOffset, posY);
          if (j < lines.length - 1) {
            leftOffset = 0;
            lineCount += 1;
          }
          else {
            leftOffset += item.width[j] || 0;
          }
        }
      }
      this.image = image;
      window.setTimeout(function () {
        delete _this.image;
      }, this.comment.long * 10 + config.cacheAge);
      imageCache[cacheKey] = {
        timeout: window.setTimeout(function () {
          delete imageCache[cacheKey];
        }, this.comment.long * 10 + config.cacheAge),
        image: image,
      };
      return image;
    };
    return HTML5Comment;
  }());

  var FlashComment = (function () {
    function FlashComment(comment, context) {
      this.context = context;
      this.scale = 1;
      this.scaleX = 1;
      this._globalScale = getConfig(config.commentScale, true);
      this.posY = 0;
      comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
      this.comment = this.getCommentSize(this.parseCommandAndNicoscript(comment));
    }
    Object.defineProperty(FlashComment.prototype, "invisible", {
      get: function () {
        return this.comment.invisible;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "loc", {
      get: function () {
        return this.comment.loc;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "long", {
      get: function () {
        return this.comment.long;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "vpos", {
      get: function () {
        return this.comment.vpos;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "width", {
      get: function () {
        return this.comment.width;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "height", {
      get: function () {
        return this.comment.height;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "flash", {
      get: function () {
        return false;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "layer", {
      get: function () {
        return this.comment.layer;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "owner", {
      get: function () {
        return this.comment.owner;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "mail", {
      get: function () {
        return this.comment.mail;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FlashComment.prototype, "lineCount", {
      get: function () {
        return this.comment.lineCount;
      },
      enumerable: false,
      configurable: true
    });
    FlashComment.prototype.parseCommand = function (comment) {
      var metadata = comment.mail;
      var result = {
        loc: undefined,
        size: undefined,
        fontSize: undefined,
        color: undefined,
        font: undefined,
        full: false,
        ender: false,
        _live: false,
        invisible: false,
        long: undefined,
      };
      for (var _i = 0, metadata_1 = metadata; _i < metadata_1.length; _i++) {
        var command = metadata_1[_i];
        command = command.toLowerCase();
        var match = command.match(/^@([0-9.]+)/);
        if (match && match[1]) {
          result.long = Number(match[1]);
        }
        else if (result.loc === undefined && typeGuard.comment.loc(command)) {
          result.loc = command;
        }
        else if (result.size === undefined && typeGuard.comment.size(command)) {
          result.size = command;
          result.fontSize = getConfig(config.fontSize, true)[command].default;
        }
        else {
          if (result.color === undefined) {
            var color = config.colors[command];
            if (color) {
              result.color = color;
              continue;
            }
            else {
              var match_1 = command.match(/#[0-9a-z]{3,6}/);
              if (match_1 && match_1[0] && comment.premium) {
                result.color = match_1[0].toUpperCase();
                continue;
              }
            }
          }
          if (result.font === undefined && typeGuard.comment.font(command)) {
            result.font = command;
          }
          else if (typeGuard.comment.command.key(command)) {
            result[command] = true;
          }
        }
      }
      return result;
    };
    FlashComment.prototype.parseCommandAndNicoscript = function (comment) {
      var _a, _b;
      var data = parseCommandAndNicoScript(comment);
      var content = [];
      var parts = (comment.content.match(/\n|[^\n]+/g) || []).map(function (val) {
        return Array.from(val.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) || []);
      });
      var regex = {
        simsunStrong: new RegExp(config.flashChar.simsunStrong),
        simsunWeak: new RegExp(config.flashChar.simsunWeak),
        gulim: new RegExp(config.flashChar.gulim),
        gothic: new RegExp(config.flashChar.gothic),
      };
      var getFontName = function (font) {
        return font.match("^simsun.+")
          ? "simsun"
          : font === "gothic"
            ? "defont"
            : font;
      };
      var _loop_1 = function (line) {
        var lineContent = [];
        for (var _c = 0, line_1 = line; _c < line_1.length; _c++) {
          var part = line_1[_c];
          if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
            lineContent.push({ content: part });
            continue;
          }
          var index = [];
          var match = void 0;
          if ((match = regex.simsunStrong.exec(part)) !== null) {
            index.push({ font: "simsunStrong", index: match.index });
          }
          if ((match = regex.simsunWeak.exec(part)) !== null) {
            index.push({ font: "simsunWeak", index: match.index });
          }
          if ((match = regex.gulim.exec(part)) !== null) {
            index.push({ font: "gulim", index: match.index });
          }
          if ((match = regex.gothic.exec(part)) !== null) {
            index.push({ font: "gothic", index: match.index });
          }
          if (index.length === 0) {
            lineContent.push({ content: part });
          }
          else if (index.length === 1 && index[0]) {
            lineContent.push({ content: part, font: getFontName(index[0].font) });
          }
          else {
            index.sort(function (a, b) {
              if (a.index > b.index) {
                return 1;
              }
              else if (a.index < b.index) {
                return -1;
              }
              else {
                return 0;
              }
            });
            if (config.flashMode === "xp") {
              var offset = 0;
              for (var i = 1; i < index.length; i++) {
                var currentVal = index[i], lastVal = index[i - 1];
                if (currentVal === undefined || lastVal === undefined)
                  continue;
                lineContent.push({
                  content: part.slice(offset, currentVal.index),
                  font: getFontName(lastVal.font),
                });
                offset = currentVal.index;
              }
              var val_1 = index[index.length - 1];
              if (val_1)
                lineContent.push({
                  content: part.slice(offset),
                  font: getFontName(val_1.font),
                });
            }
            else {
              var firstVal = index[0], secondVal = index[1];
              if (!firstVal || !secondVal) {
                lineContent.push({ content: part });
                continue;
              }
              if (firstVal.font !== "gothic") {
                lineContent.push({
                  content: part,
                  font: getFontName(firstVal.font),
                });
              }
              else {
                lineContent.push({
                  content: part.slice(0, secondVal.index),
                  font: getFontName(firstVal.font),
                });
                lineContent.push({
                  content: part.slice(secondVal.index),
                  font: getFontName(secondVal.font),
                });
              }
            }
          }
        }
        var firstContent = lineContent[0];
        if (firstContent && firstContent.font) {
          content.push.apply(content, lineContent.map(function (val) {
            if (!val.font) {
              val.font = firstContent.font;
            }
            return val;
          }));
        }
        else {
          content.push.apply(content, lineContent);
        }
      };
      for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var line = parts_1[_i];
        _loop_1(line);
      }
      var val = content[0];
      if (val && val.font) {
        data.font = val.font;
      }
      var lineCount = content.reduce(function (pv, val) {
        var _a;
        return pv + (((_a = val.content.match(/\n/g)) === null || _a === void 0 ? void 0 : _a.length) || 0);
      }, 1);
      var lineOffset = (((_a = comment.content.match(new RegExp(config.flashScriptChar.super, "g"))) === null || _a === void 0 ? void 0 : _a.length) || 0) *
        -1 *
        config.scriptCharOffset +
        (((_b = comment.content.match(new RegExp(config.flashScriptChar.sub, "g"))) === null || _b === void 0 ? void 0 : _b.length) || 0) *
        config.scriptCharOffset;
      return _assign(_assign({}, data), { content: content, lineCount: lineCount, lineOffset: lineOffset });
    };
    FlashComment.prototype.measureText = function (comment) {
      var configLineHeight = getConfig(config.lineHeight, true), configFontSize = getConfig(config.fontSize, true);
      var lineCount = comment.lineCount;
      if (!comment.lineHeight)
        comment.lineHeight = configLineHeight[comment.size].default;
      if (!comment.resized && !comment.ender) {
        if ((comment.size === "big" && lineCount > 2) ||
          (comment.size === "medium" && lineCount > 4) ||
          (comment.size === "small" && lineCount > 6)) {
          comment.fontSize = configFontSize[comment.size].resized;
          comment.lineHeight = configLineHeight[comment.size].resized;
          comment.resized = true;
          comment.resizedY = true;
          this.context.font = parseFont(comment.font, comment.fontSize);
        }
      }
      var width_arr = [], spacedWidth_arr = [];
      var currentWidth = 0, spacedWidth = 0;
      for (var i = 0; i < comment.content.length; i++) {
        var item = comment.content[i];
        if (item === undefined)
          continue;
        var lines = item.content.split("\n");
        var widths = [];
        this.context.font = parseFont(item.font || comment.font, comment.fontSize);
        for (var i_1 = 0; i_1 < lines.length; i_1++) {
          var value = lines[i_1];
          if (value === undefined)
            continue;
          var measure = this.context.measureText(value);
          currentWidth += measure.width;
          spacedWidth +=
            measure.width + Math.max(value.length - 1, 0) * config.letterSpacing;
          widths.push(measure.width);
          if (i_1 < lines.length - 1) {
            width_arr.push(currentWidth);
            spacedWidth_arr.push(spacedWidth);
            spacedWidth = 0;
            currentWidth = 0;
          }
        }
        width_arr.push(currentWidth);
        spacedWidth_arr.push(spacedWidth);
        item.width = widths;
      }
      var leadLine = (function () {
        var max = 0, index = -1;
        for (var i = 0, l = spacedWidth_arr.length; i < l; i++) {
          var val = spacedWidth_arr[i];
          if (val && max < val) {
            max = val;
            index = i;
          }
        }
        return { max: max, index: index };
      })();
      var width = leadLine.max;
      this.scaleX = leadLine.max / (width_arr[leadLine.index] || 1);
      var width_max = width * this.scale;
      var height = (comment.fontSize * comment.lineHeight * lineCount +
          config.commentYPaddingTop[comment.resizedY ? "resized" : "default"]) *
        this.scale;
      if (comment.loc !== "naka") {
        var widthLimit = getConfig(config.commentStageSize, true)[comment.full ? "fullWidth" : "width"];
        if (width_max > widthLimit && !comment.resizedX) {
          comment.fontSize = configFontSize[comment.size].default;
          comment.lineHeight = configLineHeight[comment.size].default;
          this.scale = widthLimit / width_max;
          comment.resizedX = true;
          comment.resized = true;
          return this.measureText(comment);
        }
      }
      return {
        width: width_max,
        charSize: 0,
        height: height,
        resized: !!comment.resized,
        fontSize: comment.fontSize,
        lineHeight: comment.lineHeight,
        content: comment.content,
        resizedX: !!comment.resizedX,
        resizedY: !!comment.resizedY,
      };
    };
    FlashComment.prototype.getCommentSize = function (parsedData) {
      this.context.font = parseFont(parsedData.font, parsedData.fontSize);
      var size = parsedData;
      if (parsedData.invisible) {
        size.height = 0;
        size.width = 0;
        size.lineHeight = 0;
        size.fontSize = 0;
        size.content = [];
        size.resized = false;
        size.resizedX = false;
        size.resizedY = false;
        size.charSize = 0;
        return size;
      }
      var measure = this.measureText(parsedData);
      if (options.scale !== 1 && size.layer === -1) {
        measure.height *= options.scale;
        measure.width *= options.scale;
      }
      size.height = measure.height * this._globalScale;
      size.width = measure.width * this._globalScale;
      size.lineHeight = measure.lineHeight;
      size.fontSize = measure.fontSize;
      size.content = measure.content;
      size.resized = measure.resized;
      size.resizedX = measure.resizedX;
      size.resizedY = measure.resizedY;
      size.charSize = measure.charSize;
      return size;
    };
    FlashComment.prototype.draw = function (vpos, showCollision, debug) {
      var reverse = false;
      for (var _i = 0, _a = nicoScripts.reverse; _i < _a.length; _i++) {
        var range = _a[_i];
        if ((range.target === "コメ" && this.comment.owner) ||
          (range.target === "投コメ" && !this.comment.owner))
          break;
        if (range.start < vpos && vpos < range.end) {
          reverse = true;
        }
      }
      for (var _b = 0, _c = nicoScripts.ban; _b < _c.length; _b++) {
        var range = _c[_b];
        if (range.start < vpos && vpos < range.end)
          return;
      }
      var posX = (config.canvasWidth - this.comment.width) / 2, posY = this.posY;
      if (this.comment.loc === "naka") {
        if (reverse) {
          posX =
            config.canvasWidth +
            this.comment.width -
            getPosX(this.comment.width, vpos - this.comment.vpos, this.comment.long);
        }
        else {
          posX = getPosX(this.comment.width, vpos - this.comment.vpos, this.comment.long);
        }
        if (posX > config.canvasWidth || posX + this.comment.width < 0) {
          return;
        }
      }
      else if (this.comment.loc === "shita") {
        posY = config.canvasHeight - this.posY - this.comment.height;
      }
      if (this.image === undefined) {
        this.image = this.getTextImage();
      }
      if (this.image) {
        if (this.comment._live) {
          this.context.globalAlpha = config.contextFillLiveOpacity;
        }
        else {
          this.context.globalAlpha = 1;
        }
        this.context.drawImage(this.image, posX, posY);
      }
      if (showCollision) {
        this.context.strokeStyle = "rgba(255,0,255,1)";
        this.context.strokeRect(posX, posY, this.comment.width, this.comment.height);
        for (var i = 0; i < this.comment.lineCount; i++) {
          var linePosY = ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) +
              config.commentYPaddingTop[this.comment.resizedY ? "resized" : "default"]) *
            this.scale;
          this.context.strokeStyle = "rgba(255,255,0,0.25)";
          this.context.strokeRect(posX, posY + linePosY * this._globalScale, this.comment.width, this.comment.fontSize *
            this.comment.lineHeight *
            -1 *
            this._globalScale *
            this.scale *
            (this.comment.layer === -1 ? options.scale : 1));
        }
      }
      if (debug) {
        var font = this.context.font;
        var fillStyle = this.context.fillStyle;
        this.context.font = parseFont("defont", 30);
        this.context.fillStyle = "#ff00ff";
        this.context.fillText(this.comment.mail.join(","), posX, posY + 30);
        this.context.font = font;
        this.context.fillStyle = fillStyle;
      }
    };
    FlashComment.prototype.getTextImage = function () {
      var _this = this;
      if (this.comment.invisible ||
        (this.comment.lineCount === 1 && this.comment.width === 0) ||
        this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
        0)
        return null;
      var cacheKey = JSON.stringify(this.comment.content) +
        "@@FLASH@@" +
        __spreadArray([], this.comment.mail, true).sort().join(","), cache = imageCache[cacheKey];
      if (cache) {
        this.image = cache.image;
        window.setTimeout(function () {
          delete _this.image;
        }, this.comment.long * 10 + config.cacheAge);
        clearTimeout(cache.timeout);
        cache.timeout = window.setTimeout(function () {
          delete imageCache[cacheKey];
        }, this.comment.long * 10 + config.cacheAge);
        return cache.image;
      }
      var image = document.createElement("canvas");
      image.width = this.comment.width;
      image.height = this.comment.height;
      var context = image.getContext("2d");
      if (!context)
        throw new Error("Fail to get CanvasRenderingContext2D");
      context.strokeStyle = getStrokeColor(this.comment);
      context.textAlign = "start";
      context.textBaseline = "alphabetic";
      context.lineWidth = 4;
      context.font = parseFont(this.comment.font, this.comment.fontSize);

      context.scale(this._globalScale *
        this.scale *
        (this.comment.layer === -1 ? options.scale : 1) *
        this.scaleX, this._globalScale *
        this.scale *
        (this.comment.layer === -1 ? options.scale : 1));
      context.fillStyle = this.comment.color;
      var lineOffset = this.comment.lineOffset;
      var lastFont = this.comment.font, leftOffset = 0, lineCount = 0;
      for (var i = 0; i < this.comment.content.length; i++) {
        var item = this.comment.content[i];
        if (!item)
          continue;
        if (lastFont !== (item.font || this.comment.font)) {
          lastFont = item.font || this.comment.font;
          context.font = parseFont(lastFont, this.comment.fontSize);
        }
        var lines = item.content.split("\n");
        for (var j = 0; j < lines.length; j++) {
          var line = lines[j];
          if (line === undefined)
            continue;
          var posY = (lineOffset + lineCount + 1) *
            (this.comment.fontSize * this.comment.lineHeight) +
            config.commentYPaddingTop[this.comment.resizedY ? "resized" : "default"] +
            this.comment.fontSize *
            this.comment.lineHeight *
            config.commentYOffset[this.comment.size][this.comment.resizedY ? "resized" : "default"];
          context.strokeText(line, leftOffset, posY);
          context.fillText(line, leftOffset, posY);
          if (j < lines.length - 1) {
            leftOffset = 0;
            lineCount += 1;
          }
          else {
            leftOffset += item.width[j] || 0;
          }
        }
      }
      this.image = image;
      window.setTimeout(function () {
        delete _this.image;
      }, this.comment.long * 10 + config.cacheAge);
      imageCache[cacheKey] = {
        timeout: window.setTimeout(function () {
          delete imageCache[cacheKey];
        }, this.comment.long * 10 + config.cacheAge),
        image: image,
      };
      return image;
    };
    return FlashComment;
  }());

  var plugins = [];
  var setPlugins = function (input) {
    plugins = input;
  };

  var isDebug = false;
  var NiconiComments = (function () {
    function NiconiComments(canvas, data, initOptions) {
      if (initOptions === void 0) { initOptions = {}; }
      var constructorStart = performance.now();
      initConfig();
      if (!typeGuard.config.initOptions(initOptions))
        throw new Error("Please see document: https://xpadev-net.github.io/niconicomments/#p_options");
      setOptions(Object.assign(defaultOptions, initOptions));
      setConfig(Object.assign(defaultConfig, options.config));
      isDebug = options.debug;
      resetImageCache();
      resetNicoScripts();
      this.canvas = canvas;
      var context = canvas.getContext("2d");
      if (!context)
        throw new Error("Fail to get CanvasRenderingContext2D");
      this.context = context;
      this.context.strokeStyle = "rgba(".concat(hex2rgb(config.contextStrokeColor).join(","), ",").concat(config.contextStrokeOpacity, ")");
      this.context.textAlign = "start";
      this.context.textBaseline = "alphabetic";
      this.context.lineWidth = config.contextLineWidth;
      var formatType = options.format;
      if (options.formatted) {
        console.warn("Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format");
      }
      if (formatType === "default") {
        formatType = options.formatted ? "formatted" : "legacy";
      }
      if (options.useLegacy) {
        console.warn("Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode");
      }
      if (options.mode === "default" && options.useLegacy) {
        options.mode = "html5";
      }
      var parsedData = convert2formattedComment(data, formatType);
      setPlugins(config.plugins.map(function (val) { return new val(canvas, parsedData); }));
      this.video = options.video || undefined;
      this.showCollision = options.showCollision;
      this.showFPS = options.showFPS;
      this.showCommentCount = options.showCommentCount;
      this.enableLegacyPiP = options.enableLegacyPiP;
      this.timeline = {};
      this.collision = ["ue", "shita", "right", "left"].reduce(function (pv, value) {
        pv[value] = [];
        return pv;
      }, {});
      this.lastVpos = -1;
      this.preRendering(parsedData);
      logger("constructor complete: ".concat(performance.now() - constructorStart, "ms"));
    }
    NiconiComments.prototype.preRendering = function (rawData) {
      var _this = this;
      var preRenderingStart = performance.now();
      if (options.keepCA) {
        rawData = changeCALayer(rawData);
      }
      this.getCommentPos(rawData.reduce(function (pv, val) {
        if (isFlashComment(val)) {
          pv.push(new FlashComment(val, _this.context));
        }
        else {
          pv.push(new HTML5Comment(val, _this.context));
        }
        return pv;
      }, []));
      this.sortComment();
      logger("preRendering complete: ".concat(performance.now() - preRenderingStart, "ms"));
    };
    NiconiComments.prototype.getCommentPos = function (data) {
      var _this = this;
      var getCommentPosStart = performance.now();
      data.forEach(function (comment) {
        if (comment.invisible)
          return;
        if (comment.loc === "naka") {
          var posY = 0;
          var beforeVpos = Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) -
            100;
          if (config.canvasHeight < comment.height) {
            posY = (comment.height - config.canvasHeight) / -2;
          }
          else {
            var isBreak = false, isChanged = true, count = 0;
            while (isChanged && count < 10) {
              isChanged = false;
              count++;
              for (var j = beforeVpos; j < comment.long + 125; j++) {
                var vpos = comment.vpos + j;
                var left_pos = getPosX(comment.width, j, comment.long);
                if (left_pos + comment.width >= config.collisionRange.right &&
                  left_pos <= config.collisionRange.right) {
                  var result = getPosY(posY, comment, _this.collision.right[vpos]);
                  posY = result.currentPos;
                  isChanged = result.isChanged;
                  isBreak = result.isBreak;
                  if (isBreak)
                    break;
                }
                if (left_pos + comment.width >= config.collisionRange.left &&
                  left_pos <= config.collisionRange.left) {
                  var result = getPosY(posY, comment, _this.collision.left[vpos]);
                  posY = result.currentPos;
                  isChanged = result.isChanged;
                  isBreak = result.isBreak;
                  if (isBreak)
                    break;
                }
              }
              if (isBreak) {
                break;
              }
            }
          }
          for (var j = beforeVpos; j < comment.long + 125; j++) {
            var vpos = comment.vpos + j;
            var left_pos = getPosX(comment.width, j, comment.long);
            arrayPush(_this.timeline, vpos, comment);
            if (left_pos + comment.width >= config.collisionRange.right &&
              left_pos <= config.collisionRange.right) {
              arrayPush(_this.collision.right, vpos, comment);
            }
            if (left_pos + comment.width >= config.collisionRange.left &&
              left_pos <= config.collisionRange.left) {
              arrayPush(_this.collision.left, vpos, comment);
            }
          }
          comment.posY = posY;
        }
        else {
          var posY = 0, isChanged = true, count = 0, collision = void 0;
          if (comment.loc === "ue") {
            collision = _this.collision.ue;
          }
          else {
            collision = _this.collision.shita;
          }
          while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (var j = 0; j < comment.long; j++) {
              var result = getPosY(posY, comment, collision[comment.vpos + j]);
              posY = result.currentPos;
              isChanged = result.isChanged;
              if (result.isBreak)
                break;
            }
          }
          for (var j = 0; j < comment.long; j++) {
            var vpos = comment.vpos + j;
            arrayPush(_this.timeline, vpos, comment);
            if (j > comment.long - 20)
              continue;
            if (comment.loc === "ue") {
              arrayPush(_this.collision.ue, vpos, comment);
            }
            else {
              arrayPush(_this.collision.shita, vpos, comment);
            }
          }
          comment.posY = posY;
        }
      });
      logger("getCommentPos complete: ".concat(performance.now() - getCommentPosStart, "ms"));
      return data;
    };
    NiconiComments.prototype.sortComment = function () {
      var sortCommentStart = performance.now();
      for (var _i = 0, _a = Object.keys(this.timeline); _i < _a.length; _i++) {
        var vpos = _a[_i];
        var item = this.timeline[Number(vpos)];
        if (!item)
          continue;
        var owner = [], user = [];
        for (var _b = 0, item_1 = item; _b < item_1.length; _b++) {
          var comment = item_1[_b];
          if (comment === null || comment === void 0 ? void 0 : comment.owner) {
            owner.push(comment);
          }
          else {
            user.push(comment);
          }
        }
        this.timeline[Number(vpos)] = user.concat(owner);
      }
      logger("parseData complete: ".concat(performance.now() - sortCommentStart, "ms"));
    };
    NiconiComments.prototype.addComments = function () {
      var _this = this;
      var _a, _b, _c;
      var rawComments = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        rawComments[_i] = arguments[_i];
      }
      plugins.forEach(function (val) { return val.addComments(rawComments); });
      var comments = rawComments.reduce(function (pv, val) {
        if (isFlashComment(val)) {
          pv.push(new FlashComment(val, _this.context));
        }
        else {
          pv.push(new HTML5Comment(val, _this.context));
        }
        return pv;
      }, []);
      var _loop_1 = function (comment) {
        if (comment.invisible)
          return "continue";
        if (comment.loc === "naka") {
          var posY = 0;
          var beforeVpos = Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) -
            100;
          if (config.canvasHeight < comment.height) {
            posY = (comment.height - config.canvasHeight) / -2;
          }
          else {
            var isBreak = false, isChanged = true, count = 0;
            while (isChanged && count < 10) {
              isChanged = false;
              count++;
              for (var j = beforeVpos; j < comment.long + 125; j++) {
                var vpos = comment.vpos + j;
                var left_pos = getPosX(comment.width, j, comment.long);
                if (left_pos + comment.width >= config.collisionRange.right &&
                  left_pos <= config.collisionRange.right) {
                  var collision = (_a = this_1.collision.right[vpos]) === null || _a === void 0 ? void 0 : _a.filter(function (val) { return val.vpos <= comment.vpos; });
                  var result = getPosY(posY, comment, collision);
                  posY = result.currentPos;
                  isChanged = result.isChanged;
                  isBreak = result.isBreak;
                  if (isBreak)
                    break;
                }
                if (left_pos + comment.width >= config.collisionRange.left &&
                  left_pos <= config.collisionRange.left) {
                  var collision = (_b = this_1.collision.left[vpos]) === null || _b === void 0 ? void 0 : _b.filter(function (val) { return val.vpos <= comment.vpos; });
                  var result = getPosY(posY, comment, collision);
                  posY = result.currentPos;
                  isChanged = result.isChanged;
                  isBreak = result.isBreak;
                  if (isBreak)
                    break;
                }
              }
              if (isBreak) {
                break;
              }
            }
          }
          for (var j = beforeVpos; j < comment.long + 125; j++) {
            var vpos = comment.vpos + j;
            var left_pos = getPosX(comment.width, j, comment.long);
            arrayPush(this_1.timeline, vpos, comment);
            if (left_pos + comment.width >= config.collisionRange.right &&
              left_pos <= config.collisionRange.right) {
              arrayPush(this_1.collision.right, vpos, comment);
            }
            if (left_pos + comment.width >= config.collisionRange.left &&
              left_pos <= config.collisionRange.left) {
              arrayPush(this_1.collision.left, vpos, comment);
            }
          }
          comment.posY = posY;
        }
        else {
          var posY = 0, isChanged = true, count = 0, collision = void 0;
          if (comment.loc === "ue") {
            collision = this_1.collision.ue;
          }
          else {
            collision = this_1.collision.shita;
          }
          while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (var j = 0; j < comment.long; j++) {
              var result = getPosY(posY, comment, (_c = collision[comment.vpos + j]) === null || _c === void 0 ? void 0 : _c.filter(function (val) { return val.vpos <= comment.vpos; }));
              posY = result.currentPos;
              isChanged = result.isChanged;
              if (result.isBreak)
                break;
            }
          }
          for (var j = 0; j < comment.long; j++) {
            var vpos = comment.vpos + j;
            arrayPush(this_1.timeline, vpos, comment);
            if (j > comment.long - 20)
              continue;
            if (comment.loc === "ue") {
              arrayPush(this_1.collision.ue, vpos, comment);
            }
            else {
              arrayPush(this_1.collision.shita, vpos, comment);
            }
          }
          comment.posY = posY;
        }
      };
      var this_1 = this;
      for (var _d = 0, comments_1 = comments; _d < comments_1.length; _d++) {
        var comment = comments_1[_d];
        _loop_1(comment);
      }
    };
    NiconiComments.prototype.drawCanvas = function (vpos, forceRendering) {
      var _a, _b, _c;
      if (forceRendering === void 0) { forceRendering = false; }
      var drawCanvasStart = performance.now();
      if (this.lastVpos === vpos && !forceRendering)
        return false;
      var timelineRange = this.timeline[vpos];
      if (!forceRendering &&
        (timelineRange === null || timelineRange === void 0 ? void 0 : timelineRange.filter(function (item) { return item.loc === "naka"; }).length) === 0 &&
        ((_b = (_a = this.timeline[this.lastVpos]) === null || _a === void 0 ? void 0 : _a.filter(function (item) { return item.loc === "naka"; })) === null || _b === void 0 ? void 0 : _b.length) === 0) {
        var current = timelineRange.filter(function (item) { return item.loc !== "naka"; }), last = ((_c = this.timeline[this.lastVpos]) === null || _c === void 0 ? void 0 : _c.filter(function (item) { return item.loc !== "naka"; })) ||
          [];
        if (ArrayEqual(current, last))
          return false;
      }
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.lastVpos = vpos;
      if (this.video) {
        var scale = void 0;
        var height = this.canvas.height / this.video.videoHeight, width = this.canvas.width / this.video.videoWidth;
        if (this.enableLegacyPiP ? height > width : height < width) {
          scale = width;
        }
        else {
          scale = height;
        }
        var offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5, offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
        this.context.drawImage(this.video, offsetX, offsetY, this.video.videoWidth * scale, this.video.videoHeight * scale);
      }
      if (this.showCollision) {
        var leftCollision = this.collision.left[vpos], rightCollision = this.collision.right[vpos];
        this.context.fillStyle = "red";
        if (leftCollision) {
          for (var _i = 0, leftCollision_1 = leftCollision; _i < leftCollision_1.length; _i++) {
            var comment = leftCollision_1[_i];
            this.context.fillRect(config.collisionRange.left, comment.posY, config.contextLineWidth, comment.height);
          }
        }
        if (rightCollision) {
          for (var _d = 0, rightCollision_1 = rightCollision; _d < rightCollision_1.length; _d++) {
            var comment = rightCollision_1[_d];
            this.context.fillRect(config.collisionRange.right, comment.posY, config.contextLineWidth * -1, comment.height);
          }
        }
      }
      if (timelineRange) {
        for (var _e = 0, timelineRange_1 = timelineRange; _e < timelineRange_1.length; _e++) {
          var comment = timelineRange_1[_e];
          if (comment.invisible) {
            continue;
          }
          comment.draw(vpos, this.showCollision, isDebug);
        }
      }
      plugins.forEach(function (val) { return val.draw(vpos); });
      if (this.showFPS) {
        this.context.font = parseFont("defont", 60);
        this.context.fillStyle = "#00FF00";
        this.context.strokeStyle = "rgba(".concat(hex2rgb(config.contextStrokeColor).join(","), ",").concat(config.contextStrokeOpacity, ")");
        var drawTime = Math.floor(performance.now() - drawCanvasStart);
        var fps = Math.floor(1000 / (drawTime === 0 ? 1 : drawTime));
        this.context.strokeText("FPS:".concat(fps, "(").concat(drawTime, "ms)"), 100, 100);
        this.context.fillText("FPS:".concat(fps, "(").concat(drawTime, "ms)"), 100, 100);
      }
      if (this.showCommentCount) {
        this.context.font = parseFont("defont", 60);
        this.context.fillStyle = "#00FF00";
        this.context.strokeStyle = "rgba(".concat(hex2rgb(config.contextStrokeColor).join(","), ",").concat(config.contextStrokeOpacity, ")");
        if (timelineRange) {
          this.context.strokeText("Count:".concat(timelineRange.length), 100, 200);
          this.context.fillText("Count:".concat(timelineRange.length), 100, 200);
        }
        else {
          this.context.strokeText("Count:0", 100, 200);
          this.context.fillText("Count:0", 100, 200);
        }
      }
      logger("drawCanvas complete: ".concat(performance.now() - drawCanvasStart, "ms"));
      return true;
    };
    NiconiComments.prototype.clear = function () {
      this.context.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    };
    NiconiComments.typeGuard = typeGuard;
    NiconiComments.default = NiconiComments;
    return NiconiComments;
  }());
  var logger = function (msg) {
    if (isDebug)
      console.debug(msg);
  };

  return NiconiComments;

}));
