/*!
  niconicomments.js v0.2.27
  (c) 2021 xpadev-net https://xpadev.net
  Released under the MIT License.
*/
(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : ((global =
        typeof globalThis !== "undefined" ? globalThis : global || self),
      (global.NiconiComments = factory()));
})(this, function () {
  "use strict";

  var _assign = function __assign() {
    _assign =
      Object.assign ||
      function __assign(t) {
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
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  }

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
        if (typeof i !== "object") return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.formatted.comment(item)) return false;
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
        if (typeof i !== "object") return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.formatted.legacyComment(item)) return false;
        }
        return true;
      },
    },
    legacy: {
      rawApiResponses: function (i) {
        if (typeof i !== "object") return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var itemWrapper = _a[_i];
          for (
            var _b = 0, _c = Object.keys(itemWrapper);
            _b < _c.length;
            _b++
          ) {
            var key = _c[_b];
            var item = itemWrapper[key];
            if (!item) continue;
            if (
              !(
                typeGuard.legacy.apiChat(item) ||
                typeGuard.legacy.apiGlobalNumRes(item) ||
                typeGuard.legacy.apiLeaf(item) ||
                typeGuard.legacy.apiPing(item) ||
                typeGuard.legacy.apiThread(item)
              )
            ) {
              return false;
            }
          }
        }
        return true;
      },
      apiChat: function (i) {
        return (
          typeof i === "object" &&
          objectVerify(i, ["content", "date", "no", "thread", "vpos"])
        );
      },
      apiGlobalNumRes: function (i) {
        return objectVerify(i, ["num_res", "thread"]);
      },
      apiLeaf: function (i) {
        return objectVerify(i, ["count", "thread"]);
      },
      apiPing: function (i) {
        return objectVerify(i, ["content"]);
      },
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
    niconicome: {
      xmlDocument: function (i) {
        if (!i.documentElement || i.documentElement.nodeName !== "packet")
          return false;
        if (!i.documentElement.children) return false;
        for (
          var index = 0;
          index < i.documentElement.children.length;
          index++
        ) {
          var value = i.documentElement.children[index];
          if (!value) continue;
          if (index === 0) {
            if (
              value.nodeName !== "thread" ||
              !typeAttributeVerify(value, [
                "resultcode",
                "thread",
                "server_time",
                "last_res",
                "revision",
              ])
            )
              return false;
          } else {
            if (
              value.nodeName !== "chat" ||
              !typeAttributeVerify(value, [
                "thread",
                "no",
                "vpos",
                "date",
                "date_usec",
                "anonymity",
                "user_id",
                "mail",
                "leaf",
                "premium",
                "score",
              ])
            )
              return false;
          }
        }
        return true;
      },
    },
    legacyOwner: {
      comments: function (i) {
        if (typeof i !== "string") return false;
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
        if (typeof i !== "object") return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.owner.comment(item)) return false;
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
          if (!typeGuard.v1.comment(i.comments[item])) return false;
        }
        return true;
      },
      threads: function (i) {
        if (typeof i !== "object") return false;
        for (var _i = 0, _a = i; _i < _a.length; _i++) {
          var item = _a[_i];
          if (!typeGuard.v1.thread(item)) return false;
        }
        return true;
      },
    },
    nicoScript: {
      range: {
        target: function (i) {
          return typeof i === "string" && !!i.match(/^(?:コメ|投コメ|全)$/);
        },
      },
      replace: {
        range: function (i) {
          return typeof i === "string" && !!i.match(/^(?:単|全)$/);
        },
        target: function (i) {
          return (
            typeof i === "string" &&
            !!i.match(/^(?:コメ|投コメ|全|含む|含まない)$/)
          );
        },
        condition: function (i) {
          return typeof i === "string" && !!i.match(/^(?:部分一致|完全一致)$/);
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
          return (
            typeof i === "string" &&
            !!i.match(/^(?:full|ender|_live|invisible)$/)
          );
        },
      },
    },
    config: {
      initOptions: function (item) {
        if (typeof item !== "object" || !item) return false;
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
          config: typeGuard.config.config,
          format: function (i) {
            return (
              typeof i === "string" &&
              !!i.match(
                /^(niconicome|formatted|legacy|legacyOwner|owner|v1|default)$/
              )
            );
          },
          video: function (i) {
            return typeof i === "object"; // 初期設定でnullを指定するとここで引っかかる && i.nodeName === "VIDEO";
          },
        };
        for (var key in keys) {
          if (item[key] !== undefined && !keys[key](item[key])) {
            console.warn(
              "[Incorrect input] var: initOptions, key: "
                .concat(key, ", value: ")
                .concat(item[key])
            );
            return false;
          }
        }
        return true;
      },
      config: function (item) {
        if (!isStringKeyObject(item)) return false;
        var isFontSize = function (i) {
          if (!isStringKeyObject(i)) return false;
          return (
            Object.keys(i).reduce(function (pv, cv) {
              var _a, _b;
              return (
                pv +
                Number(
                  !cv.match(/^(ue|shita|naka)$/) ||
                    typeof i[cv] !== "object" ||
                    !((_a = i[cv]) === null || _a === void 0
                      ? void 0
                      : _a.default) ||
                    !((_b = i[cv]) === null || _b === void 0
                      ? void 0
                      : _b.resized)
                )
              );
            }, 0) === 0
          );
        };
        var isDoubleResizeMaxWidth = function (i) {
          if (!isStringKeyObject(i)) return false;
          return (
            typeof i === "object" &&
            Object.keys(i).reduce(function (pv, cv) {
              var _a, _b, _c;
              return (
                pv +
                Number(
                  !cv.match(/^(full|normal)$/) ||
                    typeof i[cv] !== "object" ||
                    !((_a = i[cv]) === null || _a === void 0
                      ? void 0
                      : _a.default) ||
                    !((_b = i[cv]) === null || _b === void 0
                      ? void 0
                      : _b.html5) ||
                    !((_c = i[cv]) === null || _c === void 0
                      ? void 0
                      : _c.flash)
                )
              );
            }, 0) === 0
          );
        };
        var keys = {
          commentYPaddingTop: isNumber,
          commentYMarginBottom: isNumber,
          fpsInterval: isNumber,
          cacheAge: isNumber,
          canvasWidth: isNumber,
          canvasHeight: isNumber,
          commentDrawRange: isNumber,
          commentDrawPadding: isNumber,
          collisionWidth: isNumber,
          sameCARange: isNumber,
          sameCAGap: isNumber,
          sameCAMinScore: isNumber,
          contextStrokeOpacity: isNumber,
          contextFillLiveOpacity: isNumber,
          contextLineWidth: isNumber,
          contextStrokeColor: isString,
          contextStrokeInversionColor: isString,
          colors: function (i) {
            return (
              typeof i === "object" &&
              Object.keys(i).reduce(function (pv, cv) {
                return pv + Number(typeof i[cv] !== "string");
              }, 0) === 0
            );
          },
          fontSize: isFontSize,
          lineHeight: isFontSize,
          doubleResizeMaxWidth: isDoubleResizeMaxWidth,
          collisionRange: function (i) {
            return (
              typeof i === "object" &&
              Object.keys(i).reduce(function (pv, cv) {
                return (
                  pv +
                  Number(
                    !cv.match(/^(left|right)$/) || typeof i[cv] !== "number"
                  )
                );
              }, 0) === 0
            );
          },
        };
        for (var key in item) {
          if (item[key] !== undefined && !keys[key](item[key])) {
            console.warn(
              "[Incorrect input] var: initOptions, key: "
                .concat(key, ", value: ")
                .concat(item[key])
            );
            return false;
          }
        }
        return true;
      },
      configKey: function (item) {
        return (
          typeof item === "string" &&
          !!item.match(
            /^(colors|commentYPaddingTop|commentYMarginBottom|fontSize|lineHeight|doubleResizeMaxWidth|fpsInterval|cacheAge|canvasWidth|canvasHeight|commentDrawRange|commentDrawPadding|collisionWidth|collisionRange|sameCARange|sameCAGap|sameCAMinScore)$/
          )
        );
      },
    },
  };
  var isBoolean = function (i) {
    return typeof i === "boolean";
  };
  var isNumber = function (i) {
    return typeof i === "number";
  };
  var isString = function (i) {
    return typeof i === "string";
  };
  var isStringKeyObject = function (i) {
    return typeof i === "object";
  };
  var objectVerify = function (item, keys) {
    if (typeof item !== "object" || !item) return false;
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
      var key = keys_1[_i];
      if (!Object.prototype.hasOwnProperty.call(item, key)) return false;
    }
    return true;
  };
  var typeAttributeVerify = function (item, keys) {
    if (typeof item !== "object" || !item) return false;
    for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
      var key = keys_2[_i];
      if (item.getAttribute(key) === null) return false;
    }
    return true;
  };

  var convert2formattedComment = function (data, type) {
    var result = [];
    if (type === "niconicome" && typeGuard.niconicome.xmlDocument(data)) {
      result = fromNiconicome(data);
    } else if (
      type === "formatted" &&
      typeGuard.formatted.legacyComments(data)
    ) {
      result = fromFormatted(data);
    } else if (type === "legacy" && typeGuard.legacy.rawApiResponses(data)) {
      result = fromLegacy(data);
    } else if (type === "legacyOwner" && typeGuard.legacyOwner.comments(data)) {
      result = fromLegacyOwner(data);
    } else if (type === "owner" && typeGuard.owner.comments(data)) {
      result = fromOwner(data);
    } else if (type === "v1" && typeGuard.v1.threads(data)) {
      result = fromV1(data);
    } else {
      throw new Error("unknown input format");
    }
    return sort(result);
  };
  var fromNiconicome = function (data) {
    var _a;
    var data_ = [],
      userList = [];
    for (
      var _i = 0, _b = Array.from(data.documentElement.children);
      _i < _b.length;
      _i++
    ) {
      var item = _b[_i];
      if (item.nodeName !== "chat") continue;
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
        tmpParam.mail =
          ((_a = item.getAttribute("mail")) === null || _a === void 0
            ? void 0
            : _a.split(/\s+/g)) || [];
      }
      if (tmpParam.content.startsWith("/") && tmpParam.owner) {
        tmpParam.mail.push("invisible");
      }
      var userId = item.getAttribute("user_id") || "";
      var isUserExist = userList.indexOf(userId);
      if (isUserExist === -1) {
        tmpParam.user_id = userList.length;
        userList.push(userId);
      } else {
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
        if (!item.date_usec) item.date_usec = 0;
      }
    }
    return tmpData;
  };
  var fromLegacy = function (data) {
    var data_ = [],
      userList = [];
    for (var i = 0; i < data.length; i++) {
      var val = data[i];
      if (
        !val ||
        !typeGuard.legacy.apiChat(
          val === null || val === void 0 ? void 0 : val.chat
        )
      )
        continue;
      var value = val.chat;
      if (value.deleted !== 1) {
        var tmpParam = {
          id: value.no,
          vpos: value.vpos,
          content: value.content,
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
        var isUserExist = userList.indexOf(value.mail);
        if (isUserExist === -1) {
          tmpParam.user_id = userList.length;
          userList.push(value.user_id);
        } else {
          tmpParam.user_id = isUserExist;
        }
        data_.push(tmpParam);
      }
    }
    return data_;
  };
  var fromLegacyOwner = function (data) {
    var data_ = [],
      comments = data.split("\n");
    for (var i = 0; i < comments.length; i++) {
      var value = comments[i];
      if (!value) continue;
      var commentData = value.split(":");
      if (commentData.length < 3) {
        continue;
      } else if (commentData.length > 3) {
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
    var data_ = [],
      userList = [];
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
      var item = data_1[_i];
      var val = item.comments,
        forkName = item.fork;
      for (var _a = 0, _b = Object.keys(val); _a < _b.length; _a++) {
        var key = _b[_a];
        var value = val[key];
        if (!value) continue;
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
        } else {
          tmpParam.user_id = isUserExist;
        }
        data_.push(tmpParam);
      }
    }
    return data_;
  };
  var sort = function (data) {
    data.sort(function (a, b) {
      if (a.vpos < b.vpos) return -1;
      if (a.vpos > b.vpos) return 1;
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      if (a.date_usec < b.date_usec) return -1;
      if (a.date_usec > b.date_usec) return 1;
      return 0;
    });
    return data;
  };
  var time2vpos = function (time_str) {
    var time = time_str.match(
      /^(?:(\d+):(\d+)\.(\d+)|(\d+):(\d+)|(\d+)\.(\d+)|(\d+))$/
    );
    if (time) {
      if (
        time[1] !== undefined &&
        time[2] !== undefined &&
        time[3] !== undefined
      ) {
        return (
          (Number(time[1]) * 60 + Number(time[2])) * 100 +
          Number(time[3]) / Math.pow(10, time[3].length - 2)
        );
      } else if (time[4] !== undefined && time[5] !== undefined) {
        return (Number(time[4]) * 60 + Number(time[5])) * 100;
      } else if (time[6] !== undefined && time[7] !== undefined) {
        return (
          Number(time[6]) * 100 +
          Number(time[7]) / Math.pow(10, time[7].length - 2)
        );
      } else if (time[8] !== undefined) {
        return Number(time[8]) * 100;
      }
    }
    return 0;
  };
  var date2time = function (date) {
    return Math.floor(new Date(date).getTime() / 1000);
  };

  var defaultConfig = {
    colors: {
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
    },
    commentYPaddingTop: 0.08,
    commentYMarginBottom: 0.24,
    fontSize: {
      small: {
        default: 47,
        resized: 26.1,
      },
      medium: {
        default: 74,
        resized: 38.7,
      },
      big: {
        default: 110,
        resized: 61,
      },
    },
    lineHeight: {
      small: {
        default: 1,
        resized: 1,
      },
      medium: {
        default: 1,
        resized: 1,
      },
      big: {
        default: 1.03,
        resized: 1.01,
      },
    },
    doubleResizeMaxWidth: {
      full: {
        html5: 3020,
        default: 3550,
        flash: 3550,
      },
      normal: {
        html5: 2540,
        default: 2650,
        flash: 2650,
      },
    },
    contextStrokeColor: "#000000",
    contextStrokeInversionColor: "#FFFFFF",
    contextStrokeOpacity: 0.7,
    contextFillLiveOpacity: 0.5,
    contextLineWidth: 4,
    fpsInterval: 500,
    cacheAge: 2000,
    canvasWidth: 1920,
    canvasHeight: 1080,
    commentDrawRange: 1450,
    commentDrawPadding: 235,
    collisionWidth: 40,
    collisionRange: {
      left: 40,
      right: 1880,
    },
    sameCARange: 3600,
    sameCAGap: 100,
    sameCAMinScore: 10,
  };
  var defaultOptions = {
    config: {},
    debug: false,
    drawAllImageOnLoad: false,
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
  var setConfig = function (value) {
    return (config = value);
  };
  var setOptions = function (value) {
    return (options = value);
  };

  var groupBy = function (array) {
    var data = ["defont", "gothic", "mincho"].reduce(function (pv, font) {
      pv[font] = {};
      return pv;
    }, {});
    array.forEach(function (item, index) {
      var value = data[item.font][item.fontSize] || [];
      value.push(_assign(_assign({}, item), { index: index }));
      if (value.length === 1) {
        data[item.font][item.fontSize] = value;
      }
    });
    return data;
  };
  var getPosY = function (currentPos, targetComment, collision, data) {
    var isChanged = false,
      isBreak = false;
    if (!collision)
      return { currentPos: currentPos, isChanged: isChanged, isBreak: isBreak };
    for (var _i = 0, collision_1 = collision; _i < collision_1.length; _i++) {
      var index = collision_1[_i];
      var collisionItem = data[index];
      if (!collisionItem) continue;
      if (
        currentPos < collisionItem.posY + collisionItem.height &&
        currentPos + targetComment.height > collisionItem.posY &&
        collisionItem.owner === targetComment.owner &&
        collisionItem.layer === targetComment.layer
      ) {
        if (collisionItem.posY + collisionItem.height > currentPos) {
          currentPos = collisionItem.posY + collisionItem.height;
          isChanged = true;
        }
        if (currentPos + targetComment.height > config.canvasHeight) {
          if (config.canvasHeight < targetComment.height) {
            if (targetComment.mail.includes("naka")) {
              currentPos = (targetComment.height - config.canvasHeight) / -2;
            } else {
              currentPos = 0;
            }
          } else {
            currentPos = Math.floor(
              Math.random() * (config.canvasHeight - targetComment.height)
            );
          }
          isBreak = true;
          break;
        }
      }
    }
    return { currentPos: currentPos, isChanged: isChanged, isBreak: isBreak };
  };
  var getPosX = function (width, vpos, long) {
    return (
      config.commentDrawRange -
      ((((width + config.commentDrawRange) * ((vpos + 100) / 100)) / 4) * 300) /
        long +
      config.commentDrawPadding
    );
  };
  var parseFont = function (font, size, mode) {
    if (mode === void 0) {
      mode = "default";
    }
    switch (font) {
      case "gothic":
        return "normal 400 ".concat(
          size,
          'px "\u6E38\u30B4\u30B7\u30C3\u30AF\u4F53", "\u6E38\u30B4\u30B7\u30C3\u30AF", "Yu Gothic", YuGothic, yugothic, YuGo-Medium'
        );
      case "mincho":
        return "normal 400 ".concat(
          size,
          'px "\u6E38\u660E\u671D\u4F53", "\u6E38\u660E\u671D", "Yu Mincho", YuMincho, yumincho, YuMin-Medium'
        );
      default:
        if (mode === "html5") {
          return "normal 600 ".concat(
            size,
            'px Arial, "\uFF2D\uFF33 \uFF30\u30B4\u30B7\u30C3\u30AF", "MS PGothic", MSPGothic, MS-PGothic'
          );
        } else {
          return "normal 600 ".concat(
            size,
            'px sans-serif, Arial, "\uFF2D\uFF33 \uFF30\u30B4\u30B7\u30C3\u30AF", "MS PGothic", MSPGothic, MS-PGothic'
          );
        }
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
    (_a = array[Number(key)]) === null || _a === void 0
      ? void 0
      : _a.push(push);
  };
  var hex2rgb = function (hex) {
    if (hex.slice(0, 1) === "#") hex = hex.slice(1);
    if (hex.length === 3)
      hex =
        hex.slice(0, 1) +
        hex.slice(0, 1) +
        hex.slice(1, 2) +
        hex.slice(1, 2) +
        hex.slice(2, 3) +
        hex.slice(2, 3);
    return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (
      str
    ) {
      return parseInt(str, 16);
    });
  };
  var replaceAll = function (string, target, replace) {
    while (string.indexOf(target) !== -1) {
      string = string.replace(target, replace);
    }
    return string;
  };
  var changeCALayer = function (rawData) {
    var userList = {};
    var data = [],
      index = {};
    for (var _i = 0, rawData_1 = rawData; _i < rawData_1.length; _i++) {
      var value = rawData_1[_i];
      if (value.user_id === undefined || value.user_id === -1) continue;
      if (userList[value.user_id] === undefined) userList[value.user_id] = 0;
      if (
        value.mail.indexOf("ca") > -1 ||
        value.mail.indexOf("patissier") > -1 ||
        value.mail.indexOf("ender") > -1 ||
        value.mail.indexOf("full") > -1
      ) {
        userList[value.user_id] += 5;
      }
      if ((value.content.match(/\r\n|\n|\r/g) || []).length > 2) {
        userList[value.user_id] +=
          (value.content.match(/\r\n|\n|\r/g) || []).length / 2;
      }
      var key = "".concat(value.content, "@@").concat(
          Array.from(new Set(__spreadArray([], value.mail, true).sort()))
            .filter(function (e) {
              return !e.match(/@[\d.]+|184|device:.+|patissier|ca/);
            })
            .join("")
        ),
        lastComment = index[key];
      if (lastComment !== undefined) {
        if (
          value.vpos - lastComment.vpos > config.sameCAGap ||
          Math.abs(value.date - lastComment.date) < config.sameCARange
        ) {
          data.push(value);
          index[key] = value;
        }
      } else {
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

  var isDebug = false;
  var NiconiComments = (function () {
    function NiconiComments(canvas, data, initOptions) {
      if (initOptions === void 0) {
        initOptions = {};
      }
      var _this = this;
      var constructorStart = performance.now();
      if (!typeGuard.config.initOptions(initOptions))
        throw new Error(
          "Please see document: https://xpadev-net.github.io/niconicomments/#p_options"
        );
      setOptions(Object.assign(defaultOptions, initOptions));
      if (!typeGuard.config.config(options.config)) {
        console.warn(options.config);
        throw new Error(
          "Please see document: https://xpadev-net.github.io/niconicomments/#p_config"
        );
      }
      setConfig(Object.assign(defaultConfig, options.config));
      isDebug = options.debug;
      this.canvas = canvas;
      var context = canvas.getContext("2d");
      if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
      this.context = context;
      this.context.strokeStyle = "rgba("
        .concat(hex2rgb(config.contextStrokeColor).join(","), ",")
        .concat(config.contextStrokeOpacity, ")");
      this.context.textAlign = "start";
      this.context.textBaseline = "alphabetic";
      this.context.lineWidth = config.contextLineWidth;

      var formatType = options.format,
        mode = options.mode;
      if (options.formatted) {
        console.warn(
          "Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format"
        );
      }
      if (formatType === "default") {
        formatType = options.formatted ? "formatted" : "legacy";
      }
      if (options.useLegacy) {
        console.warn(
          "Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode"
        );
      }
      if (mode === "default" && options.useLegacy) {
        mode = "html5";
      }
      var parsedData = convert2formattedComment(data, formatType);
      this.video = options.video || undefined;
      this.showCollision = options.showCollision;
      this.showFPS = options.showFPS;
      this.showCommentCount = options.showCommentCount;
      this.enableLegacyPiP = options.enableLegacyPiP;
      this.cacheIndex = {};
      this.timeline = {};
      this.nicoScripts = { reverse: [], default: [], replace: [], ban: [] };
      this.collision = ["ue", "shita", "right", "left"].reduce(function (
        pv,
        value
      ) {
        pv[value] = [];
        return pv;
      },
      {});
      this.data = [];
      this.lastVpos = -1;
      this.mode = mode;
      this.preRendering(parsedData, options.drawAllImageOnLoad);
      this.fpsCount = 0;
      this.fps = 0;
      window.setInterval(function () {
        _this.fps = _this.fpsCount * (1000 / config.fpsInterval);
        _this.fpsCount = 0;
      }, config.fpsInterval);
      logger(
        "constructor complete: ".concat(
          performance.now() - constructorStart,
          "ms"
        )
      );
    }
    NiconiComments.prototype.preRendering = function (rawData, drawAll) {
      var _this = this;
      var preRenderingStart = performance.now();
      if (options.keepCA) {
        rawData = changeCALayer(rawData);
      }
      var parsedData = this.getCommentPos(
        this.getCommentSize(this.getFont(rawData))
      );
      this.data = this.sortComment(parsedData);
      if (drawAll) {
        parsedData.forEach(function (_, key) {
          return _this.getTextImage(Number(key), true);
        });
      }
      logger(
        "preRendering complete: ".concat(
          performance.now() - preRenderingStart,
          "ms"
        )
      );
    };
    NiconiComments.prototype.getFont = function (parsedData) {
      var getFontStart = performance.now();
      var result = [];
      for (
        var _i = 0, parsedData_1 = parsedData;
        _i < parsedData_1.length;
        _i++
      ) {
        var value = parsedData_1[_i];
        value.content = value.content.replace(/\t/g, "\u2003\u2003");
        result.push(this.parseCommandAndNicoscript(value));
      }
      logger(
        "getFont complete: ".concat(performance.now() - getFontStart, "ms")
      );
      return result;
    };
    NiconiComments.prototype.getCommentSize = function (parsedData) {
      var getCommentSizeStart = performance.now();
      var groupedData = groupBy(parsedData);
      var result = [];
      for (var _i = 0, _a = Object.keys(groupedData); _i < _a.length; _i++) {
        var font = _a[_i];
        for (
          var _b = 0, _c = Object.keys(groupedData[font]);
          _b < _c.length;
          _b++
        ) {
          var fontSize = _c[_b];
          var value = groupedData[font][fontSize];
          if (!value) continue;
          this.context.font = parseFont(font, fontSize, this.mode);
          for (var _d = 0, value_1 = value; _d < value_1.length; _d++) {
            var comment = value_1[_d];
            if (comment.invisible) {
              continue;
            }
            var measure = this.measureText(comment);
            var size = parsedData[comment.index];
            if (options.scale !== 1 && size.layer === -1) {
              measure.height *= options.scale;
              measure.width *= options.scale;
              measure.width_max *= options.scale;
              measure.width_min *= options.scale;
              measure.fontSize *= options.scale;
            }
            size.height = measure.height;
            size.width = measure.width;
            size.width_max = measure.width_max;
            size.width_min = measure.width_min;
            size.lineHeight = measure.lineHeight;
            size.fontSize = measure.fontSize;
            if (measure.resized) {
              this.context.font = parseFont(font, fontSize, this.mode);
            }
            result[comment.index] = size;
          }
        }
      }
      logger(
        "getCommentSize complete: ".concat(
          performance.now() - getCommentSizeStart,
          "ms"
        )
      );
      return result;
    };
    NiconiComments.prototype.getCommentPos = function (data) {
      var _this = this;
      var getCommentPosStart = performance.now();
      data.forEach(function (comment, index) {
        if (comment.invisible) return;
        if (comment.loc === "naka") {
          var posY = 0;
          var beforeVpos =
            Math.round(
              -288 / ((1632 + comment.width_max) / (comment.long + 125))
            ) - 100;
          if (config.canvasHeight < comment.height) {
            posY = (comment.height - config.canvasHeight) / -2;
          } else {
            var isBreak = false,
              isChanged = true,
              count = 0;
            while (isChanged && count < 10) {
              isChanged = false;
              count++;
              for (var j = beforeVpos; j < comment.long + 125; j++) {
                var vpos = comment.vpos + j;
                var left_pos = getPosX(comment.width_max, j, comment.long);
                if (
                  left_pos + comment.width_max >= config.collisionRange.right &&
                  left_pos <= config.collisionRange.right
                ) {
                  var result = getPosY(
                    posY,
                    comment,
                    _this.collision.right[vpos],
                    data
                  );
                  posY = result.currentPos;
                  isChanged = result.isChanged;
                  isBreak = result.isBreak;
                  if (isBreak) break;
                }
                if (
                  left_pos + comment.width_max >= config.collisionRange.left &&
                  left_pos <= config.collisionRange.left
                ) {
                  var result = getPosY(
                    posY,
                    comment,
                    _this.collision.left[vpos],
                    data
                  );
                  posY = result.currentPos;
                  isChanged = result.isChanged;
                  isBreak = result.isBreak;
                  if (isBreak) break;
                }
              }
              if (isBreak) {
                break;
              }
            }
          }
          for (var j = beforeVpos; j < comment.long + 125; j++) {
            var vpos = comment.vpos + j;
            var left_pos = getPosX(comment.width_max, j, comment.long);
            arrayPush(_this.timeline, vpos, index);
            if (left_pos + comment.width_max >= config.collisionRange.right) {
              arrayPush(_this.collision.right, vpos, index);
            }
            if (left_pos <= config.collisionRange.left) {
              arrayPush(_this.collision.left, vpos, index);
            }
          }
          comment.posY = posY;
        } else {
          var posY = 0,
            isChanged = true,
            count = 0,
            collision = void 0;
          if (comment.loc === "ue") {
            collision = _this.collision.ue;
          } else {
            collision = _this.collision.shita;
          }
          while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (var j = 0; j < comment.long; j++) {
              var result = getPosY(
                posY,
                comment,
                collision[comment.vpos + j],
                data
              );
              posY = result.currentPos;
              isChanged = result.isChanged;
              if (result.isBreak) break;
            }
          }
          for (var j = 0; j < comment.long; j++) {
            var vpos = comment.vpos + j;
            arrayPush(_this.timeline, vpos, index);
            if (j > comment.long - 20) continue;
            if (comment.loc === "ue") {
              arrayPush(_this.collision.ue, vpos, index);
            } else {
              arrayPush(_this.collision.shita, vpos, index);
            }
          }
          comment.posY = posY;
        }
      });
      logger(
        "getCommentPos complete: ".concat(
          performance.now() - getCommentPosStart,
          "ms"
        )
      );
      return data;
    };
    NiconiComments.prototype.sortComment = function (parsedData) {
      var _a;
      var sortCommentStart = performance.now();
      for (var _i = 0, _b = Object.keys(this.timeline); _i < _b.length; _i++) {
        var vpos = _b[_i];
        var item = this.timeline[Number(vpos)];
        if (!item) continue;
        var owner = [],
          user = [];
        for (var _c = 0, item_1 = item; _c < item_1.length; _c++) {
          var index = item_1[_c];
          if (
            (_a = parsedData[index]) === null || _a === void 0
              ? void 0
              : _a.owner
          ) {
            owner.push(index);
          } else {
            user.push(index);
          }
        }
        this.timeline[Number(vpos)] = owner.concat(user);
      }
      logger(
        "parseData complete: ".concat(
          performance.now() - sortCommentStart,
          "ms"
        )
      );
      return parsedData;
    };
    NiconiComments.prototype.measureText = function (comment) {
      var width_arr = [],
        lines = comment.content.split("\n");
      if (!comment.lineHeight)
        comment.lineHeight = config.lineHeight[comment.size].default;
      if (!comment.resized && !comment.ender) {
        if (comment.size === "big" && lines.length > 2) {
          comment.fontSize = config.fontSize.big.resized;
          comment.lineHeight = config.lineHeight.big.resized;
          comment.resized = true;
          comment.resizedY = true;
          this.context.font = parseFont(
            comment.font,
            comment.fontSize,
            this.mode
          );
        } else if (comment.size === "medium" && lines.length > 4) {
          comment.fontSize = config.fontSize.medium.resized;
          comment.lineHeight = config.lineHeight.medium.resized;
          comment.resized = true;
          comment.resizedY = true;
          this.context.font = parseFont(
            comment.font,
            comment.fontSize,
            this.mode
          );
        } else if (comment.size === "small" && lines.length > 6) {
          comment.fontSize = config.fontSize.small.resized;
          comment.lineHeight = config.lineHeight.small.resized;
          comment.resized = true;
          comment.resizedY = true;
          this.context.font = parseFont(
            comment.font,
            comment.fontSize,
            this.mode
          );
        }
      }
      for (var i = 0; i < lines.length; i++) {
        var measure = this.context.measureText(lines[i]);
        width_arr.push(measure.width);
      }
      var width =
        width_arr.reduce(function (p, c) {
          return p + c;
        }, 0) / width_arr.length;
      var width_max = Math.max.apply(Math, width_arr);
      var width_min = Math.min.apply(Math, width_arr),
        height =
          comment.fontSize *
            comment.lineHeight *
            (1 + config.commentYPaddingTop) *
            lines.length +
          config.commentYMarginBottom * comment.fontSize;
      if (comment.loc !== "naka" && !comment.resizedY) {
        if (
          (comment.full && width_max > 1930) ||
          (!comment.full && width_max > 1440)
        ) {
          while (width_max > (comment.full ? 1930 : 1440)) {
            width_max /= 1.1;
            width_max /= 1.1;
            comment.fontSize -= 2;
          }
          comment.resized = true;
          comment.resizedX = true;
          this.context.font = parseFont(
            comment.font,
            comment.fontSize,
            this.mode
          );
          return this.measureText(comment);
        }
      } else if (
        comment.loc !== "naka" &&
        comment.resizedY &&
        ((comment.full && width_max > 2120) ||
          (!comment.full && width_max > 1440)) &&
        !comment.resizedX
      ) {
        comment.fontSize = config.fontSize[comment.size].default;
        comment.lineHeight = config.lineHeight[comment.size].default * 1.05;
        comment.resized = true;
        comment.resizedX = true;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.mode
        );
        return this.measureText(comment);
      } else if (
        comment.loc !== "naka" &&
        comment.resizedY &&
        comment.resizedX
      ) {
        if (
          comment.full &&
          width_max > config.doubleResizeMaxWidth.full[this.mode]
        ) {
          while (width_max > config.doubleResizeMaxWidth.full[this.mode]) {
            width_max /= 1.1;
            comment.fontSize -= 1;
          }
          this.context.font = parseFont(
            comment.font,
            comment.fontSize,
            this.mode
          );
          return this.measureText(comment);
        } else if (
          !comment.full &&
          width_max > config.doubleResizeMaxWidth.normal[this.mode]
        ) {
          while (width_max > config.doubleResizeMaxWidth.normal[this.mode]) {
            width_max /= 1.1;
            comment.fontSize -= 1;
          }
          this.context.font = parseFont(
            comment.font,
            comment.fontSize,
            this.mode
          );
          return this.measureText(comment);
        }
      }
      return {
        width: width,
        width_max: width_max,
        width_min: width_min,
        height: height,
        resized: !!comment.resized,
        fontSize: comment.fontSize,
        lineHeight: comment.lineHeight,
      };
    };
    NiconiComments.prototype.drawText = function (comment, vpos) {
      var _this = this;
      var reverse = false;
      for (var _i = 0, _a = this.nicoScripts.reverse; _i < _a.length; _i++) {
        var range = _a[_i];
        if (
          (range.target === "コメ" && comment.owner) ||
          (range.target === "投コメ" && !comment.owner)
        )
          break;
        if (range.start < vpos && vpos < range.end) {
          reverse = true;
        }
      }
      for (var _b = 0, _c = this.nicoScripts.ban; _b < _c.length; _b++) {
        var range = _c[_b];
        if (range.start < vpos && vpos < range.end) return;
      }
      var posX = (config.canvasWidth - comment.width_max) / 2,
        posY = comment.posY;
      if (comment.loc === "naka") {
        if (reverse) {
          posX =
            config.canvasWidth +
            comment.width_max -
            getPosX(comment.width_max, vpos - comment.vpos, comment.long);
        } else {
          posX = getPosX(comment.width_max, vpos - comment.vpos, comment.long);
        }
        if (posX > config.canvasWidth || posX + comment.width_max < 0) {
          return;
        }
      } else if (comment.loc === "shita") {
        posY = config.canvasHeight - comment.posY - comment.height;
      }
      if (comment.image && comment.image !== true) {
        this.context.drawImage(comment.image, posX, posY);
      }
      if (this.showCollision) {
        this.context.strokeStyle = "rgba(0,255,255,1)";
        this.context.strokeRect(posX, posY, comment.width_max, comment.height);
        var lines = comment.content.split("\n");
        lines.forEach(function (_, index) {
          var linePosY =
            (Number(index) + 1) *
            (comment.fontSize * comment.lineHeight) *
            (1 + config.commentYPaddingTop);
          _this.context.strokeStyle = "rgba(255,255,0,0.5)";
          _this.context.strokeRect(
            posX,
            posY + linePosY,
            comment.width_max,
            comment.fontSize * comment.lineHeight * -1
          );
        });
      }
      if (isDebug) {
        var font = this.context.font;
        var fillStyle = this.context.fillStyle;
        this.context.font = parseFont("defont", 30);
        this.context.fillStyle = "#ff00ff";
        this.context.fillText(comment.mail.join(","), posX, posY + 30);
        this.context.font = font;
        this.context.fillStyle = fillStyle;
      }
    };
    NiconiComments.prototype.getTextImage = function (i, preRendering) {
      var _this = this;
      var _a;
      if (preRendering === void 0) {
        preRendering = false;
      }
      var value = this.data[i];
      if (!value || value.invisible) return;
      var cacheKey =
          value.content +
          "@@@" +
          __spreadArray([], value.mail, true).sort().join(","),
        cache = this.cacheIndex[cacheKey];
      if (cache) {
        var image_1 =
          (_a = this.data[cache]) === null || _a === void 0 ? void 0 : _a.image;
        if (image_1) {
          this.cacheIndex[cacheKey] = i;
          value.image = image_1;
          setTimeout(function () {
            if (value.image) {
              delete value.image;
            }
            if (_this.cacheIndex[cacheKey] === i) {
              delete _this.cacheIndex[cacheKey];
            }
          }, value.long * 10 + config.cacheAge);
          return;
        }
      }
      var image = document.createElement("canvas");
      image.width = value.width_max;
      image.height = value.height;
      var context = image.getContext("2d");
      if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
      context.strokeStyle = "rgba("
        .concat(
          hex2rgb(
            value.color === "#000000"
              ? config.contextStrokeInversionColor
              : config.contextStrokeColor
          ).join(","),
          ","
        )
        .concat(config.contextStrokeOpacity, ")");
      context.textAlign = "start";
      context.textBaseline = "alphabetic";
      context.lineWidth = config.contextLineWidth;
      context.lineJoin = "bevel";
      context.font = parseFont(value.font, value.fontSize, this.mode);
      if (value._live) {
        context.fillStyle = "rgba("
          .concat(hex2rgb(value.color).join(","), ",")
          .concat(config.contextFillLiveOpacity, ")");
      } else {
        context.fillStyle = value.color;
      }
      var lines = value.content.split("\n");
      lines.forEach(function (line, index) {
        var posY =
          (index + 1) *
          (value.fontSize * value.lineHeight) *
          (1 + config.commentYPaddingTop);
        context.strokeText(line, 0, posY);
        context.fillText(line, 0, posY);
      });
      value.image = image;
      this.cacheIndex[cacheKey] = i;
      if (preRendering) return;
      setTimeout(function () {
        if (value.image) {
          delete value.image;
        }
        if (_this.cacheIndex[cacheKey] === i) {
          delete _this.cacheIndex[cacheKey];
        }
      }, value.long * 10 + config.cacheAge);
    };
    NiconiComments.prototype.parseCommand = function (comment) {
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
        } else if (result.loc === undefined && typeGuard.comment.loc(command)) {
          result.loc = command;
        } else if (
          result.size === undefined &&
          typeGuard.comment.size(command)
        ) {
          result.size = command;
          result.fontSize = config.fontSize[command].default;
        } else {
          if (result.color === undefined) {
            var color = config.colors[command];
            if (color) {
              result.color = color;
              continue;
            } else {
              var match_1 = command.match(/#[0-9a-z]{3,6}/);
              if (match_1 && match_1[0] && comment.premium) {
                result.color = match_1[0].toUpperCase();
                continue;
              }
            }
          }
          if (result.font === undefined && typeGuard.comment.font(command)) {
            result.font = command;
          } else if (typeGuard.comment.command.key(command)) {
            result[command] = true;
          }
        }
      }
      return result;
    };
    NiconiComments.prototype.parseCommandAndNicoscript = function (comment) {
      var data = this.parseCommand(comment),
        string = comment.content,
        nicoscript = string.match(
          /^(?:@|＠)(デフォルト|置換|逆|コメント禁止|シーク禁止|ジャンプ)/
        );
      if (nicoscript) {
        var reverse = comment.content.match(/^@逆 ?(全|コメ|投コメ)?/);
        var content = comment.content.split(""),
          result = [];
        var quote = "",
          last_i = "",
          string_1 = "";
        switch (nicoscript[1]) {
          case "デフォルト":
            this.nicoScripts.default.unshift({
              start: comment.vpos,
              long:
                data.long === undefined
                  ? undefined
                  : Math.floor(data.long * 100),
              color: data.color,
              size: data.size,
              font: data.font,
              loc: data.loc,
            });
            break;
          case "逆":
            if (
              !reverse ||
              !reverse[1] ||
              !typeGuard.nicoScript.range.target(reverse[1])
            )
              break;
            if (data.long === undefined) {
              data.long = 30;
            }
            this.nicoScripts.reverse.unshift({
              start: comment.vpos,
              end: comment.vpos + data.long * 100,
              target: reverse[1],
            });
            break;
          case "コメント禁止":
            if (data.long === undefined) {
              data.long = 30;
            }
            this.nicoScripts.ban.unshift({
              start: comment.vpos,
              end: comment.vpos + data.long * 100,
            });
            break;
          case "置換":
            for (var _i = 0, _a = content.slice(4); _i < _a.length; _i++) {
              var i = _a[_i];
              if (i.match(/["'「]/) && quote === "") {
                quote = i;
              } else if (i.match(/["']/) && quote === i && last_i !== "\\") {
                result.push(replaceAll(string_1, "\\n", "\n"));
                quote = "";
                string_1 = "";
              } else if (i.match(/」/) && quote === "「") {
                result.push(string_1);
                quote = "";
                string_1 = "";
              } else if (quote === "" && i.match(/\s+/)) {
                if (string_1) {
                  result.push(string_1);
                  string_1 = "";
                }
              } else {
                string_1 += i;
              }
              last_i = i;
            }
            result.push(string_1);
            if (
              result[0] === undefined ||
              result[1] === undefined ||
              (result[2] !== undefined &&
                !typeGuard.nicoScript.replace.range(result[2])) ||
              (result[3] !== undefined &&
                !typeGuard.nicoScript.replace.target(result[3])) ||
              (result[4] !== undefined &&
                !typeGuard.nicoScript.replace.condition(result[4]))
            )
              break;
            this.nicoScripts.replace.unshift({
              start: comment.vpos,
              long:
                data.long === undefined
                  ? undefined
                  : Math.floor(data.long * 100),
              keyword: result[0],
              replace: result[1] || "",
              range: result[2] || "単",
              target: result[3] || "コメ",
              condition: result[4] || "部分一致",
              color: data.color,
              size: data.size,
              font: data.font,
              loc: data.loc,
              no: comment.id,
            });
            this.nicoScripts.replace.sort(function (a, b) {
              if (a.start < b.start) return -1;
              if (a.start > b.start) return 1;
              if (a.no < b.no) return -1;
              if (a.no > b.no) return 1;
              return 0;
            });
            break;
        }
        data.invisible = true;
      }
      var color = undefined,
        size = undefined,
        font = undefined,
        loc = undefined;
      for (var i = 0; i < this.nicoScripts.default.length; i++) {
        var item = this.nicoScripts.default[i];
        if (!item) continue;
        if (item.long !== undefined && item.start + item.long < comment.vpos) {
          this.nicoScripts.default = this.nicoScripts.default.splice(
            Number(i),
            1
          );
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
        if (loc && color && size && font) break;
      }
      for (var i = 0; i < this.nicoScripts.replace.length; i++) {
        var item = this.nicoScripts.replace[i];
        if (!item) continue;
        if (item.long !== undefined && item.start + item.long < comment.vpos) {
          this.nicoScripts.default = this.nicoScripts.default.splice(
            Number(i),
            1
          );
          continue;
        }
        if (
          (item.target === "コメ" && comment.owner) ||
          (item.target === "投コメ" && !comment.owner) ||
          (item.target === "含まない" && comment.owner)
        )
          continue;
        if (
          (item.condition === "完全一致" && comment.content === item.keyword) ||
          (item.condition === "部分一致" &&
            comment.content.indexOf(item.keyword) !== -1)
        ) {
          if (item.range === "単") {
            comment.content = replaceAll(
              comment.content,
              item.keyword,
              item.replace
            );
          } else {
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
        data.fontSize = config.fontSize[data.size].default;
      }
      if (!data.font) {
        data.font = font || "defont";
      }
      if (!data.long) {
        data.long = 300;
      } else {
        data.long = Math.floor(Number(data.long) * 100);
      }
      return _assign(_assign({}, comment), data);
    };
    NiconiComments.prototype.drawCanvas = function (vpos, forceRendering) {
      if (forceRendering === void 0) {
        forceRendering = false;
      }
      var drawCanvasStart = performance.now();
      if (this.lastVpos === vpos && !forceRendering) return;
      this.lastVpos = vpos;
      this.fpsCount++;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.video) {
        var scale = void 0;
        var height = this.canvas.height / this.video.videoHeight,
          width = this.canvas.width / this.video.videoWidth;
        if (this.enableLegacyPiP ? height > width : height < width) {
          scale = width;
        } else {
          scale = height;
        }
        var offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5,
          offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
        this.context.drawImage(
          this.video,
          offsetX,
          offsetY,
          this.video.videoWidth * scale,
          this.video.videoHeight * scale
        );
      }
      var timelineRange = this.timeline[vpos];
      if (timelineRange) {
        for (
          var _i = 0, timelineRange_1 = timelineRange;
          _i < timelineRange_1.length;
          _i++
        ) {
          var index = timelineRange_1[_i];
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
        this.context.font = parseFont("defont", 60);
        this.context.fillStyle = "#00FF00";
        this.context.strokeStyle = "rgba("
          .concat(hex2rgb(config.contextStrokeColor).join(","), ",")
          .concat(config.contextStrokeOpacity, ")");
        this.context.strokeText("FPS:".concat(this.fps), 100, 100);
        this.context.fillText("FPS:".concat(this.fps), 100, 100);
      }
      if (this.showCommentCount) {
        this.context.font = parseFont("defont", 60);
        this.context.fillStyle = "#00FF00";
        this.context.strokeStyle = "rgba("
          .concat(hex2rgb(config.contextStrokeColor).join(","), ",")
          .concat(config.contextStrokeOpacity, ")");
        if (timelineRange) {
          this.context.strokeText(
            "Count:".concat(timelineRange.length),
            100,
            200
          );
          this.context.fillText(
            "Count:".concat(timelineRange.length),
            100,
            200
          );
        } else {
          this.context.strokeText("Count:0", 100, 200);
          this.context.fillText("Count:0", 100, 200);
        }
      }
      logger(
        "drawCanvas complete: ".concat(
          performance.now() - drawCanvasStart,
          "ms"
        )
      );
    };
    NiconiComments.prototype.clear = function () {
      this.context.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    };
    return NiconiComments;
  })();
  var logger = function (msg) {
    if (isDebug) console.debug(msg);
  };

  return NiconiComments;
});
