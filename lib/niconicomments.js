/*!
  niconicomments.js v0.2.56
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

  let imageCache = {};
  const resetImageCache = () => {
    imageCache = {};
  };

  let nicoScripts = {
    reverse: [],
    default: [],
    replace: [],
    ban: [],
    seekDisable: [],
    jump: [],
  };
  const resetNicoScripts = () => {
    nicoScripts = {
      reverse: [],
      default: [],
      replace: [],
      ban: [],
      seekDisable: [],
      jump: [],
    };
  };

  let plugins = [];
  const setPlugins = (input) => {
    plugins = input;
  };

  var index$3 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get imageCache() {
      return imageCache;
    },
    get nicoScripts() {
      return nicoScripts;
    },
    get plugins() {
      return plugins;
    },
    resetImageCache: resetImageCache,
    resetNicoScripts: resetNicoScripts,
    setPlugins: setPlugins,
  });

  let defaultConfig;
  const updateConfig = (config) => {
    defaultConfig = config;
  };
  const defaultOptions = {
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
  let config;
  let options;
  const setConfig = (value) => {
    config = value;
  };
  const setOptions = (value) => {
    options = value;
  };

  var config$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get config() {
      return config;
    },
    get defaultConfig() {
      return defaultConfig;
    },
    defaultOptions: defaultOptions,
    get options() {
      return options;
    },
    setConfig: setConfig,
    setOptions: setOptions,
    updateConfig: updateConfig,
  });

  class CanvasRenderingContext2DError extends Error {
    constructor(options = {}) {
      super("CanvasRenderingContext2DError", options);
    }
  }
  CanvasRenderingContext2DError.prototype.name =
    "CanvasRenderingContext2DError";

  class InvalidFormatError extends Error {
    constructor(options = {}) {
      super("InvalidFormatError", options);
    }
  }
  InvalidFormatError.prototype.name = "InvalidFormatError";

  class InvalidOptionError extends Error {
    constructor(options = {}) {
      super(
        "Invalid option\nPlease check document: https://xpadev-net.github.io/niconicomments/#p_options",
        options
      );
    }
  }
  InvalidOptionError.prototype.name = "InvalidOptionError";

  class NotImplementedError extends Error {
    pluginName;
    methodName;
    constructor(pluginName, methodName, options = {}) {
      super("NotImplementedError", options);
      this.pluginName = pluginName;
      this.methodName = methodName;
    }
  }
  NotImplementedError.prototype.name = "NotImplementedError";

  var index$2 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    CanvasRenderingContext2DError: CanvasRenderingContext2DError,
    InvalidFormatError: InvalidFormatError,
    InvalidOptionError: InvalidOptionError,
    NotImplementedError: NotImplementedError,
  });

  const ArrayPush = (array, key, push) => {
    if (!array) {
      array = {};
    }
    if (!array[Number(key)]) {
      array[Number(key)] = [];
    }
    array[Number(key)]?.push(push);
  };
  const ArrayEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0, n = a.length; i < n; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const hex2rgb = (hex) => {
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
  const hex2rgba = (hex) => {
    if (hex.slice(0, 1) === "#") hex = hex.slice(1);
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
    ].map((str, index) => {
      if (index === 3) return parseInt(str, 16) / 256;
      return parseInt(str, 16);
    });
  };
  const getStrokeColor = (comment) => {
    if (comment.strokeColor) {
      const color = comment.strokeColor.slice(1);
      const length = color.length;
      if (length === 3 || length === 6) {
        return `rgba(${hex2rgb(color).join(",")},${
          config.contextStrokeOpacity
        })`;
      } else if (length === 4 || length === 8) {
        return `rgba(${hex2rgba(color).join(",")})`;
      }
    }
    return `rgba(${hex2rgb(
      comment.color === "#000000"
        ? config.contextStrokeInversionColor
        : config.contextStrokeColor
    ).join(",")},${config.contextStrokeOpacity})`;
  };

  const colors = {
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

  var colors$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    colors: colors,
  });

  const isBoolean = (i) => typeof i === "boolean";
  const isNumber = (i) => typeof i === "number";
  const isObject = (i) => typeof i === "object";
  const typeGuard = {
    formatted: {
      comment: (i) =>
        objectVerify(i, [
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
        ]),
      comments: (i) => {
        if (typeof i !== "object") return false;
        for (const item of i) {
          if (!typeGuard.formatted.comment(item)) return false;
        }
        return true;
      },
      legacyComment: (i) =>
        objectVerify(i, [
          "id",
          "vpos",
          "content",
          "date",
          "owner",
          "premium",
          "mail",
        ]),
      legacyComments: (i) => {
        if (typeof i !== "object") return false;
        for (const item of i) {
          if (!typeGuard.formatted.legacyComment(item)) return false;
        }
        return true;
      },
    },
    legacy: {
      rawApiResponses: (i) => {
        if (typeof i !== "object") return false;
        for (const itemWrapper of i) {
          for (const key of Object.keys(itemWrapper)) {
            const item = itemWrapper[key];
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
      apiChat: (i) =>
        typeof i === "object" &&
        objectVerify(i, ["content", "date", "no", "thread", "vpos"]),
      apiGlobalNumRes: (i) => objectVerify(i, ["num_res", "thread"]),
      apiLeaf: (i) => objectVerify(i, ["count", "thread"]),
      apiPing: (i) => objectVerify(i, ["content"]),
      apiThread: (i) =>
        objectVerify(i, [
          "resultcode",
          "revision",
          "server_time",
          "thread",
          "ticket",
        ]),
    },
    xmlDocument: (i) => {
      if (!i.documentElement || i.documentElement.nodeName !== "packet")
        return false;
      if (!i.documentElement.children) return false;
      for (const element of Array.from(i.documentElement.children)) {
        if (!element || element.nodeName !== "chat") continue;
        if (!typeAttributeVerify(element, ["vpos", "date"])) return false;
      }
      return true;
    },
    legacyOwner: {
      comments: (i) => {
        if (typeof i !== "string") return false;
        const lists = i.split("\n");
        for (const list of lists) {
          if (list.split(":").length < 3) {
            return false;
          }
        }
        return true;
      },
    },
    owner: {
      comment: (i) => objectVerify(i, ["time", "command", "comment"]),
      comments: (i) => {
        if (typeof i !== "object") return false;
        for (const item of i) {
          if (!typeGuard.owner.comment(item)) return false;
        }
        return true;
      },
    },
    v1: {
      comment: (i) =>
        objectVerify(i, [
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
        ]),
      thread: (i) => {
        if (!objectVerify(i, ["id", "fork", "commentCount", "comments"]))
          return false;
        for (const value of i.comments) {
          if (!typeGuard.v1.comment(value)) return false;
        }
        return true;
      },
      threads: (i) => {
        if (typeof i !== "object") return false;
        for (const item of i) {
          if (!typeGuard.v1.thread(item)) return false;
        }
        return true;
      },
    },
    nicoScript: {
      range: {
        target: (i) =>
          typeof i === "string" &&
          !!i.match(/^(?:\u6295?\u30b3\u30e1|\u5168)$/),
      },
      replace: {
        range: (i) => typeof i === "string" && !!i.match(/^[\u5358\u5168]$/),
        target: (i) =>
          typeof i === "string" &&
          !!i.match(
            /^(?:\u30b3\u30e1|\u6295\u30b3\u30e1|\u5168|\u542b\u3080|\u542b\u307e\u306a\u3044)$/
          ),
        condition: (i) =>
          typeof i === "string" &&
          !!i.match(/^(?:\u90e8\u5206\u4e00\u81f4|\u5b8c\u5168\u4e00\u81f4)$/),
      },
    },
    comment: {
      font: (i) =>
        typeof i === "string" && !!i.match(/^(?:gothic|mincho|defont)$/),
      loc: (i) => typeof i === "string" && !!i.match(/^(?:ue|naka|shita)$/),
      size: (i) => typeof i === "string" && !!i.match(/^(?:big|medium|small)$/),
      command: {
        key: (i) =>
          typeof i === "string" &&
          !!i.match(/^(?:full|ender|_live|invisible)$/),
      },
      color: (i) => typeof i === "string" && Object.keys(colors).includes(i),
      colorCode: (i) =>
        typeof i === "string" && !!i.match(/^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/),
      colorCodeAllowAlpha: (i) =>
        typeof i === "string" &&
        !!i.match(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/),
    },
    config: {
      initOptions: (item) => {
        if (typeof item !== "object" || !item) return false;
        const keys = {
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
          format: (i) =>
            typeof i === "string" &&
            !!i.match(
              /^(XMLDocument|niconicome|formatted|legacy|legacyOwner|owner|v1|default|empty)$/
            ),
          video: (i) => typeof i === "object" && i.nodeName === "VIDEO",
        };
        for (const key of Object.keys(keys)) {
          if (item[key] !== undefined && !keys[key](item[key])) {
            console.warn(
              `[Incorrect input] var: initOptions, key: ${key}, value: ${item[key]}`
            );
            return false;
          }
        }
        return true;
      },
    },
    internal: {
      CommentMeasuredContentItem: (i) =>
        objectVerify(i, ["content", "slicedContent", "width"]),
      CommentMeasuredContentItemArray: (i) =>
        Array.isArray(i) &&
        i.every(typeGuard.internal.CommentMeasuredContentItem),
      MultiConfigItem: (i) =>
        typeof i === "object" && objectVerify(i, ["html5", "flash"]),
      HTML5Fonts: (i) => i === "defont" || i === "mincho" || i === "gothic",
      MeasureInput: (i) =>
        objectVerify(i, [
          "font",
          "content",
          "lineHeight",
          "charSize",
          "lineCount",
        ]),
    },
  };
  const objectVerify = (item, keys) => {
    if (typeof item !== "object" || !item) return false;
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(item, key)) return false;
    }
    return true;
  };
  const typeAttributeVerify = (item, keys) => {
    if (typeof item !== "object" || !item) return false;
    for (const key of keys) {
      if (item.getAttribute(key) === null) return false;
    }
    return true;
  };

  var typeGuard$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    default: typeGuard,
  });

  const getConfig = (input, isFlash = false) => {
    if (typeGuard.internal.MultiConfigItem(input)) {
      return input[isFlash ? "flash" : "html5"];
    }
    return input;
  };

  const isLineBreakResize = (comment) => {
    return (
      !comment.resized &&
      !comment.ender &&
      comment.lineCount >= config.lineBreakCount[comment.size]
    );
  };
  const getDefaultCommand = (vpos) => {
    nicoScripts.default = nicoScripts.default.filter(
      (item) => !item.long || item.start + item.long >= vpos
    );
    let color = undefined,
      size = undefined,
      font = undefined,
      loc = undefined;
    for (const item of nicoScripts.default) {
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
    return { color, size, font, loc };
  };
  const nicoscriptReplaceIgnoreable = (comment, item) =>
    ((item.target === "\u30b3\u30e1" ||
      item.target === "\u542b\u307e\u306a\u3044") &&
      comment.owner) ||
    (item.target === "\u6295\u30b3\u30e1" && !comment.owner) ||
    (item.target === "\u542b\u307e\u306a\u3044" && comment.owner) ||
    (item.condition === "\u5b8c\u5168\u4e00\u81f4" &&
      comment.content !== item.keyword) ||
    (item.condition === "\u90e8\u5206\u4e00\u81f4" &&
      comment.content.indexOf(item.keyword) === -1);
  const applyNicoScriptReplace = (comment, commands) => {
    nicoScripts.replace = nicoScripts.replace.filter(
      (item) => !item.long || item.start + item.long >= comment.vpos
    );
    for (const item of nicoScripts.replace) {
      if (nicoscriptReplaceIgnoreable(comment, item)) continue;
      if (item.range === "\u5358") {
        comment.content = comment.content.replaceAll(
          item.keyword,
          item.replace
        );
      } else {
        comment.content = item.replace;
      }
      item.loc && (commands.loc = item.loc);
      item.color && (commands.color = item.color);
      item.size && (commands.size = item.size);
      item.font && (commands.font = item.font);
    }
  };
  const parseCommandAndNicoScript = (comment) => {
    const isFlash = isFlashComment(comment);
    const commands = parseCommands(comment);
    processNicoscript(comment, commands);
    const defaultCommand = getDefaultCommand(comment.vpos);
    applyNicoScriptReplace(comment, commands);
    const size = commands.size || defaultCommand.size || "medium";
    return {
      size: size,
      loc: commands.loc || defaultCommand.loc || "naka",
      color: commands.color || defaultCommand.color || "#FFFFFF",
      font: commands.font || defaultCommand.font || "defont",
      fontSize: getConfig(config.fontSize, isFlash)[size].default,
      long: commands.long ? Math.floor(Number(commands.long) * 100) : 300,
      flash: isFlash,
      full: commands.full,
      ender: commands.ender,
      _live: commands._live,
      invisible: commands.invisible,
      strokeColor: commands.strokeColor,
      wakuColor: commands.wakuColor,
      fillColor: commands.fillColor,
    };
  };
  const parseBrackets = (input) => {
    const content = input.split(""),
      result = [];
    let quote = "",
      last_i = "",
      string = "";
    for (const i of content) {
      if (i.match(/["'\u300c]/) && quote === "") {
        quote = i;
      } else if (i.match(/["']/) && quote === i && last_i !== "\\") {
        result.push(string.replaceAll("\\n", "\n"));
        quote = "";
        string = "";
      } else if (i.match(/\u300d/) && quote === "\u300c") {
        result.push(string);
        quote = "";
        string = "";
      } else if (quote === "" && i.match(/\s+/)) {
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
    return result;
  };
  const addNicoscriptReplace = (comment, commands) => {
    const result = parseBrackets(comment.content.slice(4));
    if (
      result[0] === undefined ||
      (result[2] !== undefined &&
        !typeGuard.nicoScript.replace.range(result[2])) ||
      (result[3] !== undefined &&
        !typeGuard.nicoScript.replace.target(result[3])) ||
      (result[4] !== undefined &&
        !typeGuard.nicoScript.replace.condition(result[4]))
    )
      return;
    nicoScripts.replace.unshift({
      start: comment.vpos,
      long:
        commands.long === undefined
          ? undefined
          : Math.floor(commands.long * 100),
      keyword: result[0],
      replace: result[1] || "",
      range: result[2] || "\u5358",
      target: result[3] || "\u30b3\u30e1",
      condition: result[4] || "\u90e8\u5206\u4e00\u81f4",
      color: commands.color,
      size: commands.size,
      font: commands.font,
      loc: commands.loc,
      no: comment.id,
    });
    sortNicoscriptReplace();
  };
  const sortNicoscriptReplace = () => {
    nicoScripts.replace.sort((a, b) => {
      if (a.start < b.start) return -1;
      if (a.start > b.start) return 1;
      if (a.no < b.no) return -1;
      if (a.no > b.no) return 1;
      return 0;
    });
  };
  const processNicoscript = (comment, commands) => {
    const nicoscript = comment.content.match(
      /^[@\uff20](\u30c7\u30d5\u30a9\u30eb\u30c8|\u7f6e\u63db|\u9006|\u30b3\u30e1\u30f3\u30c8\u7981\u6b62|\u30b7\u30fc\u30af\u7981\u6b62|\u30b8\u30e3\u30f3\u30d7|\u30dc\u30bf\u30f3)(?:\s(.+))?/
    );
    if (!nicoscript) return;
    if (nicoscript[1] === "\u30dc\u30bf\u30f3" && nicoscript[2]) {
      processAtButton(commands);
      return;
    }
    if (!comment.owner) return;
    commands.invisible = true;
    if (nicoscript[1] === "\u30c7\u30d5\u30a9\u30eb\u30c8") {
      processDefaultScript(comment, commands);
      return;
    }
    if (nicoscript[1] === "\u9006") {
      processReverseScript(comment, commands);
      return;
    }
    if (nicoscript[1] === "\u30b3\u30e1\u30f3\u30c8\u7981\u6b62") {
      processBanScript(comment, commands);
      return;
    }
    if (nicoscript[1] === "\u30b7\u30fc\u30af\u7981\u6b62") {
      processSeekDisableScript$1(comment, commands);
      return;
    }
    if (nicoscript[1] === "\u30b8\u30e3\u30f3\u30d7" && nicoscript[2]) {
      processJumpScript$1(comment, commands, nicoscript[2]);
      return;
    }
    if (nicoscript[1] === "\u7f6e\u63db") {
      addNicoscriptReplace(comment, commands);
    }
  };
  const processDefaultScript = (comment, commands) => {
    nicoScripts.default.unshift({
      start: comment.vpos,
      long:
        commands.long === undefined
          ? undefined
          : Math.floor(commands.long * 100),
      color: commands.color,
      size: commands.size,
      font: commands.font,
      loc: commands.loc,
    });
  };
  const processReverseScript = (comment, commands) => {
    const reverse = comment.content.match(
      /^[@\uff20]\u9006(?:\s+)?(\u5168|\u30b3\u30e1|\u6295\u30b3\u30e1)?/
    );
    if (
      !reverse ||
      !reverse[1] ||
      !typeGuard.nicoScript.range.target(reverse[1])
    )
      return;
    if (commands.long === undefined) {
      commands.long = 30;
    }
    nicoScripts.reverse.unshift({
      start: comment.vpos,
      end: comment.vpos + commands.long * 100,
      target: reverse[1],
    });
  };
  const processBanScript = (comment, commands) => {
    if (commands.long === undefined) {
      commands.long = 30;
    }
    nicoScripts.ban.unshift({
      start: comment.vpos,
      end: comment.vpos + commands.long * 100,
    });
  };
  const processSeekDisableScript$1 = (comment, commands) => {
    if (commands.long === undefined) {
      commands.long = 30;
    }
    nicoScripts.seekDisable.unshift({
      start: comment.vpos,
      end: comment.vpos + commands.long * 100,
    });
  };
  const processJumpScript$1 = (comment, commands, input) => {
    const options = input.match(
      /\s*((?:sm|so|nm|\uff53\uff4d|\uff53\uff4f|\uff4e\uff4d)?[1-9\uff11-\uff19][0-9\uff11-\uff19]*|#[0-9]+:[0-9]+(?:\.[0-9]+)?)\s+(.*)/
    );
    if (!options || !options[1]) return;
    nicoScripts.jump.unshift({
      start: comment.vpos,
      end: commands.long === undefined ? undefined : commands.long * 100,
      to: options[1],
      message: options[2],
    });
  };
  const processAtButton = (commands) => {
    commands.invisible = false;
    commands.button = true;
  };
  const parseCommands = (comment) => {
    const commands = comment.mail,
      isFlash = isFlashComment(comment);
    const result = {
      loc: undefined,
      size: undefined,
      fontSize: undefined,
      color: undefined,
      strokeColor: undefined,
      wakuColor: undefined,
      font: undefined,
      full: false,
      ender: false,
      _live: false,
      invisible: false,
      long: undefined,
      button: false,
    };
    for (const command of commands) {
      parseCommand(comment, command, result, isFlash);
    }
    if (comment.content.startsWith("/")) {
      result.invisible = true;
    }
    return result;
  };
  const parseCommand = (comment, _command, result, isFlash) => {
    const command = _command.toLowerCase();
    const long = command.match(/^[@\uff20]([0-9.]+)/);
    if (long) {
      result.long = Number(long[1]);
      return;
    }
    const strokeColor = getColor(command.match(/^nico:stroke:(.+)$/));
    if (strokeColor) {
      result.strokeColor ??= strokeColor;
      return;
    }
    const rectColor = getColor(command.match(/^nico:waku:(.+)$/));
    if (rectColor) {
      result.wakuColor ??= rectColor;
      return;
    }
    const fillColor = getColor(command.match(/^nico:fill:(.+)$/));
    if (fillColor) {
      result.fillColor ??= fillColor;
      return;
    }
    if (typeGuard.comment.loc(command)) {
      result.loc ??= command;
      return;
    }
    if (result.size === undefined && typeGuard.comment.size(command)) {
      result.size = command;
      result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
      return;
    }
    if (config.colors[command]) {
      result.color ??= config.colors[command];
      return;
    }
    const colorCode = command.match(/^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/);
    if (colorCode && comment.premium) {
      result.color ??= colorCode[0].toUpperCase();
      return;
    }
    if (typeGuard.comment.font(command)) {
      result.font ??= command;
      return;
    }
    if (typeGuard.comment.command.key(command)) {
      result[command] = true;
    }
  };
  const getColor = (match) => {
    if (!match) return;
    const value = match[1];
    if (typeGuard.comment.color(value)) {
      return colors[value];
    } else if (typeGuard.comment.colorCodeAllowAlpha(value)) {
      return value;
    }
    return;
  };
  const isFlashComment = (comment) =>
    options.mode === "flash" ||
    (options.mode === "default" &&
      !(
        comment.mail.includes("gothic") ||
        comment.mail.includes("defont") ||
        comment.mail.includes("mincho")
      ) &&
      (comment.date < config.flashThreshold ||
        comment.mail.includes("nico:flash")));
  const isReverseActive = (vpos, isOwner) => {
    for (const range of nicoScripts.reverse) {
      if (
        (range.target === "コメ" && isOwner) ||
        (range.target === "投コメ" && !isOwner)
      )
        continue;
      if (range.start < vpos && vpos < range.end) {
        return true;
      }
    }
    return false;
  };
  const isBanActive = (vpos) => {
    for (const range of nicoScripts.ban) {
      if (range.start < vpos && vpos < range.end) return true;
    }
    return false;
  };
  const processFixedComment = (comment, collision, timeline) => {
    let posY = 0,
      isChanged = true,
      count = 0;
    while (isChanged && count < 10) {
      isChanged = false;
      count++;
      for (let j = 0; j < comment.long; j++) {
        const result = getPosY(posY, comment, collision[comment.vpos + j]);
        posY = result.currentPos;
        isChanged = result.isChanged;
        if (result.isBreak) break;
      }
    }
    for (let j = 0; j < comment.long; j++) {
      const vpos = comment.vpos + j;
      ArrayPush(timeline, vpos, comment);
      if (j > comment.long - 20) continue;
      ArrayPush(collision, vpos, comment);
    }
    comment.posY = posY;
  };
  const processMovableComment = (comment, collision, timeline) => {
    const beforeVpos =
      Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) - 100;
    const posY = (() => {
      if (config.canvasHeight < comment.height) {
        return (comment.height - config.canvasHeight) / -2;
      }
      let posY = 0;
      let isChanged = true,
        count = 0;
      while (isChanged && count < 10) {
        isChanged = false;
        count++;
        for (let j = beforeVpos, n = comment.long + 125; j < n; j++) {
          const vpos = comment.vpos + j;
          const left_pos = getPosX(comment.comment, vpos);
          let isBreak = false;
          if (
            left_pos + comment.width >= config.collisionRange.right &&
            left_pos <= config.collisionRange.right
          ) {
            const result = getPosY(posY, comment, collision.right[vpos]);
            posY = result.currentPos;
            isChanged = result.isChanged;
            isBreak = result.isBreak;
          }
          if (
            left_pos + comment.width >= config.collisionRange.left &&
            left_pos <= config.collisionRange.left
          ) {
            const result = getPosY(posY, comment, collision.left[vpos]);
            posY = result.currentPos;
            isChanged = result.isChanged;
            isBreak = result.isBreak;
          }
          if (isBreak) return posY;
        }
      }
      return posY;
    })();
    for (let j = beforeVpos, n = comment.long + 125; j < n; j++) {
      const vpos = comment.vpos + j;
      const left_pos = getPosX(comment.comment, vpos);
      ArrayPush(timeline, vpos, comment);
      if (
        left_pos + comment.width >= config.collisionRange.right &&
        left_pos <= config.collisionRange.right
      ) {
        ArrayPush(collision.right, vpos, comment);
      }
      if (
        left_pos + comment.width >= config.collisionRange.left &&
        left_pos <= config.collisionRange.left
      ) {
        ArrayPush(collision.left, vpos, comment);
      }
    }
    comment.posY = posY;
  };
  const getPosY = (currentPos, targetComment, collision) => {
    let isChanged = false,
      isBreak = false;
    if (!collision) return { currentPos, isChanged, isBreak };
    for (const collisionItem of collision) {
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
    return { currentPos, isChanged, isBreak };
  };
  const getPosX = (comment, vpos, isReverse = false) => {
    if (comment.loc !== "naka") {
      return (config.canvasWidth - comment.width) / 2;
    }
    const speed =
      (config.commentDrawRange +
        comment.width * config.nakaCommentSpeedOffset) /
      (comment.long + 100);
    const vposLapsed = vpos - comment.vpos;
    const posX =
      config.commentDrawPadding +
      config.commentDrawRange -
      (vposLapsed + 100) * speed;
    if (isReverse) {
      return config.canvasWidth - comment.width - posX;
    }
    return posX;
  };
  const parseFont = (font, size) => {
    switch (font) {
      case "gulim":
      case "simsun":
        return config.font[font].replace("[size]", `${size}`);
      case "gothic":
      case "mincho":
        return `${config.fonts[font].weight} ${size}px ${config.fonts[font].font}`;
      default:
        return `${config.fonts.defont.weight} ${size}px ${config.fonts.defont.font}`;
    }
  };

  const changeCALayer = (rawData) => {
    const userScoreList = getUsersScore(rawData);
    const filteredComments = removeDuplicateCommentArt(rawData);
    const commentArts = filteredComments.filter(
      (comment) =>
        (userScoreList[comment.user_id] || 0) >= config.sameCAMinScore &&
        !comment.owner
    );
    const commentArtsGroupedByUser = groupCommentsByUser(commentArts);
    const commentArtsGroupedByTimes = groupCommentsByTime(
      commentArtsGroupedByUser
    );
    updateLayerId(commentArtsGroupedByTimes);
    return filteredComments;
  };
  const getUsersScore = (comments) => {
    const userScoreList = {};
    for (const comment of comments) {
      if (comment.user_id === undefined || comment.user_id === -1) continue;
      userScoreList[comment.user_id] ||= 0;
      if (
        comment.mail.includes("ca") ||
        comment.mail.includes("patissier") ||
        comment.mail.includes("ender") ||
        comment.mail.includes("full")
      ) {
        userScoreList[comment.user_id] += 5;
      }
      const lineCount = (comment.content.match(/\r\n|\n|\r/g) || []).length;
      if (lineCount > 2) {
        userScoreList[comment.user_id] += lineCount / 2;
      }
    }
    return userScoreList;
  };
  const removeDuplicateCommentArt = (comments) => {
    const index = {};
    return comments.filter((comment) => {
      const key = `${comment.content}@@${[...comment.mail]
          .sort()
          .filter((e) => !e.match(/@[\d.]+|184|device:.+|patissier|ca/))
          .join("")}`,
        lastComment = index[key];
      if (lastComment === undefined) {
        index[key] = comment;
        return true;
      }
      if (
        comment.vpos - lastComment.vpos > config.sameCAGap ||
        Math.abs(comment.date - lastComment.date) < config.sameCARange
      ) {
        index[key] = comment;
        return true;
      }
      return false;
    });
  };
  const updateLayerId = (filteredComments) => {
    let layerId = 0;
    for (const user of filteredComments) {
      for (const time of user.comments) {
        for (const comment of time.comments) {
          comment.layer = layerId;
        }
        layerId++;
      }
    }
  };
  const groupCommentsByUser = (comments) => {
    return comments.reduce((users, comment) => {
      const user = getUser(comment.user_id, users);
      user.comments.push(comment);
      return users;
    }, []);
  };
  const getUser = (userId, users) => {
    const user = users.find((user) => user.userId === userId);
    if (user) return user;
    const obj = {
      userId,
      comments: [],
    };
    users.push(obj);
    return obj;
  };
  const groupCommentsByTime = (comments) => {
    return comments.reduce((result, user) => {
      result.push({
        userId: user.userId,
        comments: user.comments.reduce((result, comment) => {
          const time = getTime(comment.date, result);
          time.comments.push(comment);
          time.range.start = Math.min(time.range.start, comment.date);
          time.range.end = Math.max(time.range.end, comment.date);
          return result;
        }, []),
      });
      return result;
    }, []);
  };
  const getTime = (time, times) => {
    const timeObj = times.find(
      (timeObj) =>
        timeObj.range.start - config.sameCATimestampRange <= time &&
        timeObj.range.end + config.sameCATimestampRange >= time
    );
    if (timeObj) return timeObj;
    const obj = {
      range: {
        start: time,
        end: time,
      },
      comments: [],
    };
    times.push(obj);
    return obj;
  };

  const nativeSort = (getter) => {
    return (a, b) => {
      if (getter(a) > getter(b)) {
        return 1;
      } else if (getter(a) < getter(b)) {
        return -1;
      } else {
        return 0;
      }
    };
  };

  const getFlashFontIndex = (part) => {
    const regex = {
      simsunStrong: new RegExp(config.flashChar.simsunStrong),
      simsunWeak: new RegExp(config.flashChar.simsunWeak),
      gulim: new RegExp(config.flashChar.gulim),
      gothic: new RegExp(config.flashChar.gothic),
    };
    const index = [];
    let match;
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
    return index;
  };
  const getFlashFontName = (font) => {
    if (font === "simsunStrong" || font === "simsunWeak") return "simsun";
    if (font === "gothic") return "defont";
    return font;
  };
  const parseContent = (content) => {
    const results = [];
    const lines = (content.match(/\n|[^\n]+/g) || []).map((val) =>
      Array.from(val.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) || [])
    );
    for (const line of lines) {
      const lineContent = parseLine(line);
      const firstContent = lineContent[0];
      if (firstContent && firstContent.font) {
        results.push(
          ...lineContent.map((val) => {
            if (!val.font) {
              val.font = firstContent.font;
            }
            return val;
          })
        );
      } else {
        results.push(...lineContent);
      }
    }
    return results;
  };
  const parseLine = (line) => {
    const lineContent = [];
    for (const part of line) {
      if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
        lineContent.push({ content: part, slicedContent: part.split("\n") });
        continue;
      }
      parseFullWidthPart(part, lineContent);
    }
    return lineContent;
  };
  const parseFullWidthPart = (part, lineContent) => {
    const index = getFlashFontIndex(part);
    if (index.length === 0) {
      lineContent.push({ content: part, slicedContent: part.split("\n") });
    } else if (index.length === 1 && index[0]) {
      lineContent.push({
        content: part,
        slicedContent: part.split("\n"),
        font: getFlashFontName(index[0].font),
      });
    } else {
      parseMultiFontFullWidthPart(part, index, lineContent);
    }
  };
  const parseMultiFontFullWidthPart = (part, index, lineContent) => {
    index.sort(nativeSort((val) => val.index));
    if (config.FlashMode === "xp") {
      let offset = 0;
      for (let i = 1, n = index.length; i < n; i++) {
        const currentVal = index[i],
          lastVal = index[i - 1];
        if (currentVal === undefined || lastVal === undefined) continue;
        const content = part.slice(offset, currentVal.index);
        lineContent.push({
          content: content,
          slicedContent: content.split("\n"),
          font: getFlashFontName(lastVal.font),
        });
        offset = currentVal.index;
      }
      const val = index[index.length - 1];
      if (val) {
        const content = part.slice(offset);
        lineContent.push({
          content: content,
          slicedContent: content.split("\n"),
          font: getFlashFontName(val.font),
        });
      }
      return;
    }
    const firstVal = index[0],
      secondVal = index[1];
    if (!firstVal || !secondVal) {
      lineContent.push({
        content: part,
        slicedContent: part.split("\n"),
      });
      return;
    }
    if (firstVal.font !== "gothic") {
      lineContent.push({
        content: part,
        slicedContent: part.split("\n"),
        font: getFlashFontName(firstVal.font),
      });
      return;
    }
    const firstContent = part.slice(0, secondVal.index);
    const secondContent = part.slice(secondVal.index);
    lineContent.push({
      content: firstContent,
      slicedContent: firstContent.split("\n"),
      font: getFlashFontName(firstVal.font),
    });
    lineContent.push({
      content: secondContent,
      slicedContent: secondContent.split("\n"),
      font: getFlashFontName(secondVal.font),
    });
  };

  class TypeGuardError extends Error {
    constructor(options = {}) {
      super(
        "Type Guard Error\nAn error occurred due to unexpected values\nPlease contact the developer on GitHub",
        options
      );
    }
  }
  TypeGuardError.prototype.name = "TypeGuardError";

  const getLineHeight = (fontSize, isFlash, resized = false) => {
    const lineCounts = getConfig(config.lineCounts, isFlash),
      CommentStageSize = getConfig(config.CommentStageSize, isFlash),
      lineHeight = CommentStageSize.height / lineCounts.doubleResized[fontSize],
      defaultLineCount = lineCounts.default[fontSize];
    if (resized) {
      const resizedLineCount = lineCounts.resized[fontSize];
      return (
        (CommentStageSize.height -
          lineHeight * (defaultLineCount / resizedLineCount)) /
        (resizedLineCount - 1)
      );
    }
    return (CommentStageSize.height - lineHeight) / (defaultLineCount - 1);
  };
  const getCharSize = (fontSize, isFlash) => {
    const lineCounts = getConfig(config.lineCounts, isFlash),
      CommentStageSize = getConfig(config.CommentStageSize, isFlash);
    return CommentStageSize.height / lineCounts.doubleResized[fontSize];
  };
  const measure = (comment, context) => {
    const width = measureWidth(comment, context);
    return {
      ...width,
      height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize,
    };
  };
  const measureWidth = (comment, context) => {
    const { fontSize, scale } = getFontSizeAndScale(comment.charSize),
      lineWidth = [],
      itemWidth = [];
    context.font = parseFont(comment.font, fontSize);
    let currentWidth = 0;
    for (const item of comment.content) {
      const lines = item.content.split("\n");
      context.font = parseFont(item.font || comment.font, fontSize);
      const width = [];
      for (let j = 0, n = lines.length; j < n; j++) {
        const line = lines[j];
        if (line === undefined) throw new TypeGuardError();
        const measure = context.measureText(line);
        currentWidth += measure.width;
        width.push(measure.width);
        if (j < lines.length - 1) {
          lineWidth.push(Math.ceil(currentWidth * scale));
          currentWidth = 0;
        }
      }
      itemWidth.push(width);
      lineWidth.push(Math.ceil(currentWidth * scale));
    }
    return {
      width: Math.max(...lineWidth),
      lineWidth,
      itemWidth,
    };
  };
  const getFontSizeAndScale = (charSize) => {
    charSize *= 0.8;
    if (charSize < config.minFontSize) {
      if (charSize >= 1) charSize = Math.floor(charSize);
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

  var index$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    ArrayEqual: ArrayEqual,
    ArrayPush: ArrayPush,
    changeCALayer: changeCALayer,
    getCharSize: getCharSize,
    getConfig: getConfig,
    getDefaultCommand: getDefaultCommand,
    getFlashFontIndex: getFlashFontIndex,
    getFlashFontName: getFlashFontName,
    getFontSizeAndScale: getFontSizeAndScale,
    getLineHeight: getLineHeight,
    getPosX: getPosX,
    getPosY: getPosY,
    getStrokeColor: getStrokeColor,
    hex2rgb: hex2rgb,
    hex2rgba: hex2rgba,
    isBanActive: isBanActive,
    isFlashComment: isFlashComment,
    isLineBreakResize: isLineBreakResize,
    isReverseActive: isReverseActive,
    measure: measure,
    nativeSort: nativeSort,
    parseCommandAndNicoScript: parseCommandAndNicoScript,
    parseContent: parseContent,
    parseFont: parseFont,
    processFixedComment: processFixedComment,
    processMovableComment: processMovableComment,
  });

  const generateCanvas = () => {
    return document.createElement("canvas");
  };
  const getContext = (canvas) => {
    const context = canvas.getContext("2d");
    if (!context) throw new CanvasRenderingContext2DError();
    return context;
  };
  const drawImage = (targetContext, sourceImage, x, y) => {
    targetContext.drawImage(sourceImage, x, y);
  };

  class BaseComment {
    context;
    cacheKey;
    comment;
    posY;
    pluginName = "BaseComment";
    image;
    constructor(comment, context) {
      this.context = context;
      this.posY = 0;
      comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
      this.comment = this.convertComment(comment);
      this.cacheKey =
        JSON.stringify(this.comment.content) +
        `@@${this.pluginName}@@` +
        [...this.comment.mail].sort().join(",");
    }
    get invisible() {
      return this.comment.invisible;
    }
    get loc() {
      return this.comment.loc;
    }
    get long() {
      return this.comment.long;
    }
    get vpos() {
      return this.comment.vpos;
    }
    get width() {
      return this.comment.width;
    }
    get height() {
      return this.comment.height;
    }
    get flash() {
      return false;
    }
    get layer() {
      return this.comment.layer;
    }
    get owner() {
      return this.comment.owner;
    }
    get mail() {
      return this.comment.mail;
    }
    get content() {
      throw new NotImplementedError(this.pluginName, "set: content");
    }
    set content(_) {
      throw new NotImplementedError(this.pluginName, "set: content");
    }
    getCommentSize(parsedData) {
      console.error("getCommentSize method is not implemented", parsedData);
      throw new NotImplementedError(this.pluginName, "getCommentSize");
    }
    parseCommandAndNicoscript(comment) {
      console.error(
        "parseCommandAndNicoscript method is not implemented",
        comment
      );
      throw new NotImplementedError(
        this.pluginName,
        "parseCommandAndNicoscript"
      );
    }
    parseContent(comment) {
      console.error("parseContent method is not implemented", comment);
      throw new NotImplementedError(this.pluginName, "parseContent");
    }
    measureText(comment) {
      console.error("measureText method is not implemented", comment);
      throw new NotImplementedError(this.pluginName, "measureText");
    }
    convertComment(comment) {
      console.error("convertComment method is not implemented", comment);
      throw new NotImplementedError(this.pluginName, "convertComment");
    }
    draw(vpos, showCollision, debug) {
      if (isBanActive(vpos)) return;
      const reverse = isReverseActive(vpos, this.comment.owner);
      const posX = getPosX(this.comment, vpos, reverse);
      const posY =
        this.comment.loc === "shita"
          ? config.canvasHeight - this.posY - this.comment.height
          : this.posY;
      this._drawBackgroundColor(posX, posY);
      this._draw(posX, posY);
      this._drawRectColor(posX, posY);
      this._drawCollision(posX, posY, showCollision);
      this._drawDebugInfo(posX, posY, debug);
    }
    _draw(posX, posY) {
      if (this.image === undefined) {
        this.image = this.getTextImage();
      }
      if (this.image) {
        this.context.save();
        if (this.comment._live) {
          this.context.globalAlpha = config.contextFillLiveOpacity;
        } else {
          this.context.globalAlpha = 1;
        }
        drawImage(this.context, this.image, posX, posY);
        this.context.restore();
      }
    }
    _drawRectColor(posX, posY) {
      if (this.comment.wakuColor) {
        this.context.save();
        this.context.strokeStyle = this.comment.wakuColor;
        this.context.strokeRect(
          posX,
          posY,
          this.comment.width,
          this.comment.height
        );
        this.context.restore();
      }
    }
    _drawBackgroundColor(posX, posY) {
      if (this.comment.fillColor) {
        this.context.save();
        this.context.fillStyle = this.comment.fillColor;
        this.context.fillRect(
          posX,
          posY,
          this.comment.width,
          this.comment.height
        );
        this.context.restore();
      }
    }
    _drawDebugInfo(posX, posY, debug) {
      if (debug) {
        this.context.save();
        const font = this.context.font;
        const fillStyle = this.context.fillStyle;
        this.context.font = parseFont("defont", 30);
        this.context.fillStyle = "#ff00ff";
        this.context.fillText(this.comment.mail.join(","), posX, posY + 30);
        this.context.font = font;
        this.context.fillStyle = fillStyle;
        this.context.restore();
      }
    }
    _drawCollision(posX, posY, showCollision) {
      console.error(
        "_drawCollision method is not implemented",
        posX,
        posY,
        showCollision
      );
      throw new NotImplementedError(this.pluginName, "_drawCollision");
    }
    getTextImage() {
      if (
        this.comment.invisible ||
        (this.comment.lineCount === 1 && this.comment.width === 0) ||
        this.comment.height -
          (this.comment.charSize - this.comment.lineHeight) <=
          0
      )
        return null;
      const cache = imageCache[this.cacheKey];
      if (cache) {
        this.image = cache.image;
        setTimeout(() => {
          delete this.image;
        }, this.comment.long * 10 + config.cacheAge);
        clearTimeout(cache.timeout);
        cache.timeout = setTimeout(() => {
          delete imageCache[this.cacheKey];
        }, this.comment.long * 10 + config.cacheAge);
        return cache.image;
      }
      if (this.image) return this.image;
      const image = this._generateTextImage();
      this._cacheImage(image);
      return image;
    }
    _generateTextImage() {
      console.error("_generateTextImage method is not implemented");
      throw new NotImplementedError(this.pluginName, "_generateTextImage");
    }
    _cacheImage(image) {
      this.image = image;
      setTimeout(() => {
        delete this.image;
      }, this.comment.long * 10 + config.cacheAge);
      imageCache[this.cacheKey] = {
        timeout: setTimeout(() => {
          delete imageCache[this.cacheKey];
        }, this.comment.long * 10 + config.cacheAge),
        image,
      };
    }
    createCanvas() {
      const image = generateCanvas();
      const context = getContext(image);
      return {
        image,
        context,
      };
    }
  }

  class FlashComment extends BaseComment {
    _globalScale;
    pluginName = "FlashComment";
    constructor(comment, context) {
      super(comment, context);
      this._globalScale ??= getConfig(config.commentScale, true);
    }
    get content() {
      return this.comment.rawContent;
    }
    set content(input) {
      const { content, lineCount, lineOffset } = this.parseContent(input);
      const comment = {
        ...this.comment,
        rawContent: input,
        content,
        lineCount,
        lineOffset,
      };
      const val = content[0];
      if (val && val.font) {
        comment.font = val.font;
      }
      this.comment = this.getCommentSize(comment);
      this.cacheKey =
        JSON.stringify(this.comment.content) +
        `@@${this.pluginName}@@` +
        [...this.comment.mail].sort().join(",");
      delete this.image;
    }
    convertComment(comment) {
      this._globalScale = getConfig(config.commentScale, true);
      return this.getCommentSize(this.parseCommandAndNicoscript(comment));
    }
    getCommentSize(parsedData) {
      if (parsedData.invisible) {
        return {
          ...parsedData,
          height: 0,
          width: 0,
          lineHeight: 0,
          fontSize: 0,
          resized: false,
          resizedX: false,
          resizedY: false,
          charSize: 0,
          scale: 1,
          scaleX: 1,
          content: [],
        };
      }
      this.context.save();
      this.context.font = parseFont(parsedData.font, parsedData.fontSize);
      const measure = this.measureText({ ...parsedData, scale: 1 });
      if (options.scale !== 1 && parsedData.layer === -1) {
        measure.height *= options.scale;
        measure.width *= options.scale;
      }
      this.context.restore();
      return {
        ...parsedData,
        height: measure.height * this._globalScale,
        width: measure.width * this._globalScale,
        lineHeight: measure.lineHeight,
        fontSize: measure.fontSize,
        resized: measure.resized,
        resizedX: measure.resizedX,
        resizedY: measure.resizedY,
        charSize: measure.charSize,
        scale: measure.scale,
        scaleX: measure.scaleX,
        content: measure.content,
      };
    }
    parseCommandAndNicoscript(comment) {
      const data = parseCommandAndNicoScript(comment);
      const { content, lineCount, lineOffset } = this.parseContent(
        comment.content
      );
      const val = content[0];
      if (val && val.font) {
        data.font = val.font;
      }
      return {
        ...comment,
        rawContent: comment.content,
        ...data,
        content,
        lineCount,
        lineOffset,
      };
    }
    parseContent(input) {
      const content = parseContent(input);
      const lineCount = content.reduce((pv, val) => {
        return pv + (val.content.match(/\n/g)?.length || 0);
      }, 1);
      const lineOffset =
        (input.match(new RegExp(config.FlashScriptChar.super, "g"))?.length ||
          0) *
          -1 *
          config.scriptCharOffset +
        (input.match(new RegExp(config.FlashScriptChar.sub, "g"))?.length ||
          0) *
          config.scriptCharOffset;
      return {
        content,
        lineCount,
        lineOffset,
      };
    }
    measureText(comment) {
      const configLineHeight = getConfig(config.lineHeight, true),
        configFontSize = getConfig(config.fontSize, true);
      const lineCount = comment.lineCount;
      comment.lineHeight ??= configLineHeight[comment.size].default;
      if (isLineBreakResize(comment)) {
        comment.fontSize = configFontSize[comment.size].resized;
        comment.lineHeight = configLineHeight[comment.size].resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(comment.font, comment.fontSize);
      }
      const { width_arr, spacedWidth_arr } = this._measureContent(comment);
      const leadLine = (function () {
        let max = 0,
          index = -1;
        spacedWidth_arr.forEach((val, i) => {
          if (max < val) {
            max = val;
            index = i;
          }
        });
        return { max, index };
      })();
      const width = leadLine.max;
      const scaleX = leadLine.max / (width_arr[leadLine.index] ?? 1);
      const width_max = width * comment.scale;
      const height =
        (comment.fontSize * comment.lineHeight * lineCount +
          config.commentYPaddingTop[comment.resizedY ? "resized" : "default"]) *
        comment.scale;
      if (comment.loc !== "naka") {
        const widthLimit = getConfig(config.CommentStageSize, true)[
          comment.full ? "fullWidth" : "width"
        ];
        if (width_max > widthLimit && !comment.resizedX) {
          comment.fontSize = configFontSize[comment.size].default;
          comment.lineHeight = configLineHeight[comment.size].default;
          comment.scale = widthLimit / width_max;
          comment.resizedX = true;
          comment.resized = true;
          return this.measureText(comment);
        }
      }
      if (
        !typeGuard.internal.CommentMeasuredContentItemArray(comment.content)
      ) {
        throw new TypeGuardError();
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
        scale: comment.scale,
        scaleX,
      };
    }
    _measureContent(comment) {
      const width_arr = [],
        spacedWidth_arr = [];
      let currentWidth = 0,
        spacedWidth = 0;
      for (const item of comment.content) {
        const lines = item.content.split("\n");
        const widths = [];
        this.context.font = parseFont(
          item.font || comment.font,
          comment.fontSize
        );
        for (let i = 0, n = lines.length; i < n; i++) {
          const value = lines[i];
          if (value === undefined) continue;
          const measure = this.context.measureText(value);
          currentWidth += measure.width;
          spacedWidth +=
            measure.width +
            Math.max(value.length - 1, 0) * config.letterSpacing;
          widths.push(measure.width);
          if (i < lines.length - 1) {
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
      return { width_arr, spacedWidth_arr };
    }
    _drawCollision(posX, posY, showCollision) {
      if (showCollision) {
        this.context.save();
        this.context.strokeStyle = "rgba(255,0,255,1)";
        this.context.strokeRect(
          posX,
          posY,
          this.comment.width,
          this.comment.height
        );
        for (let i = 0, n = this.comment.lineCount; i < n; i++) {
          const linePosY =
            ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) +
              config.commentYPaddingTop[
                this.comment.resizedY ? "resized" : "default"
              ]) *
            this.comment.scale;
          this.context.strokeStyle = `rgba(255,255,0,0.25)`;
          this.context.strokeRect(
            posX,
            posY + linePosY * this._globalScale,
            this.comment.width,
            this.comment.fontSize *
              this.comment.lineHeight *
              -1 *
              this._globalScale *
              this.comment.scale *
              (this.comment.layer === -1 ? options.scale : 1)
          );
        }
        this.context.restore();
      }
    }
    _generateTextImage() {
      const { image, context } = this.createCanvas();
      image.width = this.comment.width;
      image.height = this.comment.height;
      context.strokeStyle = getStrokeColor(this.comment);
      context.fillStyle = this.comment.color;
      context.textAlign = "start";
      context.textBaseline = "alphabetic";
      context.lineJoin = "bevel";
      context.lineWidth = 4;
      context.font = parseFont(this.comment.font, this.comment.fontSize);
      const scale =
        this._globalScale *
        this.comment.scale *
        (this.comment.layer === -1 ? options.scale : 1);
      context.scale(scale * this.comment.scaleX, scale);
      const lineOffset = this.comment.lineOffset;
      const offsetKey = this.comment.resizedY ? "resized" : "default";
      const offsetY =
        config.commentYPaddingTop[offsetKey] +
        this.comment.fontSize *
          this.comment.lineHeight *
          config.commentYOffset[this.comment.size][offsetKey];
      let lastFont = this.comment.font,
        leftOffset = 0,
        lineCount = 0;
      for (const item of this.comment.content) {
        const font = item.font || this.comment.font;
        if (lastFont !== font) {
          lastFont = font;
          context.font = parseFont(font, this.comment.fontSize);
        }
        const lines = item.slicedContent;
        for (let j = 0, n = lines.length; j < n; j++) {
          const line = lines[j];
          if (line === undefined) continue;
          const posY =
            (lineOffset + lineCount + 1) *
              (this.comment.fontSize * this.comment.lineHeight) +
            offsetY;
          context.strokeText(line, leftOffset, posY);
          context.fillText(line, leftOffset, posY);
          if (j < n - 1) {
            leftOffset = 0;
            lineCount += 1;
            continue;
          }
          leftOffset += item.width[j] || 0;
        }
      }
      return image;
    }
  }

  class HTML5Comment extends BaseComment {
    pluginName = "HTML5Comment";
    constructor(comment, context) {
      super(comment, context);
      this.posY = 0;
    }
    get content() {
      return this.comment.rawContent;
    }
    set content(input) {
      const { content, lineCount, lineOffset } = this.parseContent(input);
      const comment = {
        ...this.comment,
        rawContent: input,
        content,
        lineCount,
        lineOffset,
      };
      this.comment = this.getCommentSize(comment);
      this.cacheKey =
        JSON.stringify(this.comment.content) +
        `@@${this.pluginName}@@` +
        [...this.comment.mail].sort().join(",");
      delete this.image;
    }
    convertComment(comment) {
      return this.getCommentSize(this.parseCommandAndNicoscript(comment));
    }
    getCommentSize(parsedData) {
      if (parsedData.invisible) {
        this.context.restore();
        return {
          ...parsedData,
          height: 0,
          width: 0,
          lineHeight: 0,
          fontSize: 0,
          resized: false,
          resizedX: false,
          resizedY: false,
          charSize: 0,
          content: [],
          scaleX: 1,
          scale: 1,
        };
      }
      this.context.save();
      this.context.font = parseFont(parsedData.font, parsedData.fontSize);
      const measure = this.measureText({ ...parsedData, scale: 1 });
      if (options.scale !== 1 && parsedData.layer === -1) {
        measure.height *= options.scale;
        measure.width *= options.scale;
        measure.fontSize *= options.scale;
      }
      this.context.restore();
      return {
        ...parsedData,
        height: measure.height,
        width: measure.width,
        lineHeight: measure.lineHeight,
        fontSize: measure.fontSize,
        resized: measure.resized,
        resizedX: measure.resizedX,
        resizedY: measure.resizedY,
        charSize: measure.charSize,
        content: measure.content,
        scaleX: measure.scaleX,
        scale: measure.scale,
      };
    }
    parseCommandAndNicoscript(comment) {
      const data = parseCommandAndNicoScript(comment);
      const { content, lineCount, lineOffset } = this.parseContent(
        comment.content
      );
      return {
        ...comment,
        rawContent: comment.content,
        ...data,
        content,
        lineCount,
        lineOffset,
      };
    }
    parseContent(input) {
      const content = [];
      content.push({
        content: input,
        slicedContent: input.split("\n"),
      });
      const lineCount = content.reduce((pv, val) => {
        return pv + (val.content.match(/\n/g)?.length || 0);
      }, 1);
      const lineOffset = 0;
      return {
        content,
        lineCount,
        lineOffset,
      };
    }
    measureText(comment) {
      const scale = getConfig(config.commentScale, false);
      const configFontSize = getConfig(config.fontSize, false),
        lineHeight = getLineHeight(comment.size, false),
        charSize = getCharSize(comment.size, false);
      if (!comment.lineHeight) comment.lineHeight = lineHeight;
      if (!comment.charSize) comment.charSize = charSize;
      comment.fontSize = comment.charSize * 0.8;
      this.context.font = parseFont(comment.font, comment.fontSize);
      if (isLineBreakResize(comment)) {
        comment.fontSize = configFontSize[comment.size].resized;
        const lineHeight = getLineHeight(comment.size, false, true);
        comment.charSize = comment.charSize * (lineHeight / comment.lineHeight);
        comment.lineHeight = lineHeight;
        comment.resized = true;
        comment.resizedY = true;
      }
      const { width, height, itemWidth } = this._measureComment(comment);
      for (let i = 0, n = comment.content.length; i < n; i++) {
        const item = comment.content[i];
        if (!item || !itemWidth) continue;
        item.width = itemWidth[i];
      }
      comment.fontSize = (comment.charSize ?? 0) * 0.8;
      if (
        !typeGuard.internal.CommentMeasuredContentItemArray(comment.content)
      ) {
        throw new TypeGuardError();
      }
      return {
        width: width * scale,
        height: height * scale,
        resized: !!comment.resized,
        fontSize: comment.fontSize,
        lineHeight: comment.lineHeight ?? 0,
        content: comment.content,
        resizedX: !!comment.resizedX,
        resizedY: !!comment.resizedY,
        charSize: comment.charSize ?? 0,
        scaleX: 1,
        scale: 1,
      };
    }
    _measureComment(comment) {
      const widthLimit = getConfig(config.CommentStageSize, false)[
        comment.full ? "fullWidth" : "width"
      ];
      if (!typeGuard.internal.MeasureInput(comment)) throw new TypeGuardError();
      const measureResult = measure(comment, this.context);
      if (comment.loc !== "naka" && measureResult.width > widthLimit) {
        return this._processResizeX(comment, measureResult.width);
      }
      return measureResult;
    }
    _processResizeX(comment, width) {
      const widthLimit = getConfig(config.CommentStageSize, false)[
        comment.full ? "fullWidth" : "width"
      ];
      const lineHeight = getLineHeight(comment.size, false);
      const charSize = getCharSize(comment.size, false);
      const scale = widthLimit / width;
      comment.resizedX = true;
      let _comment = { ...comment };
      _comment.charSize = (_comment.charSize ?? 0) * scale;
      _comment.lineHeight = (_comment.lineHeight ?? 0) * scale;
      _comment.fontSize = _comment.charSize * 0.8;
      if (!typeGuard.internal.MeasureInput(_comment))
        throw new TypeGuardError();
      let result = measure(_comment, this.context);
      if (result.width > widthLimit) {
        while (result.width >= widthLimit) {
          const originalCharSize = _comment.charSize;
          _comment.charSize -= 1;
          _comment.lineHeight *= _comment.charSize / originalCharSize;
          _comment.fontSize = _comment.charSize * 0.8;
          result = measure(_comment, this.context);
        }
      } else {
        let lastComment = { ..._comment };
        while (result.width < widthLimit) {
          lastComment = { ..._comment };
          const originalCharSize = _comment.charSize;
          _comment.charSize += 1;
          _comment.lineHeight *= _comment.charSize / originalCharSize;
          _comment.fontSize = _comment.charSize * 0.8;
          result = measure(_comment, this.context);
        }
        _comment = lastComment;
      }
      if (comment.resizedY) {
        const scale = (_comment.charSize ?? 0) / (comment.charSize ?? 0);
        comment.charSize = scale * charSize;
        comment.lineHeight = scale * lineHeight;
      } else {
        comment.charSize = _comment.charSize;
        comment.lineHeight = _comment.lineHeight;
      }
      comment.fontSize = (comment.charSize ?? 0) * 0.8;
      if (!typeGuard.internal.MeasureInput(comment)) throw new TypeGuardError();
      return measure(comment, this.context);
    }
    _drawCollision(posX, posY, showCollision) {
      if (showCollision) {
        this.context.save();
        const scale = getConfig(config.commentScale, false);
        this.context.strokeStyle = "rgba(0,255,255,1)";
        this.context.strokeRect(
          posX,
          posY,
          this.comment.width,
          this.comment.height
        );
        for (let i = 0, n = this.comment.lineCount; i < n; i++) {
          if (!typeGuard.internal.HTML5Fonts(this.comment.font))
            throw new TypeGuardError();
          const linePosY =
            (this.comment.lineHeight * (i + 1) +
              (this.comment.charSize - this.comment.lineHeight) / 2 +
              this.comment.lineHeight * -0.16 +
              (config.fonts[this.comment.font]?.offset || 0)) *
            scale;
          this.context.strokeStyle = "rgba(255,255,0,0.5)";
          this.context.strokeRect(
            posX,
            posY + linePosY,
            this.comment.width,
            this.comment.fontSize * -1 * scale
          );
        }
        this.context.restore();
      }
    }
    _generateTextImage() {
      const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
      const paddingTop =
        (10 - scale * 10) *
        ((this.comment.lineCount + 1) / config.hiResCommentCorrection);
      const { image, context } = this.createCanvas();
      image.width = this.comment.width + 2 * 2 * this.comment.charSize;
      image.height =
        this.comment.height +
        ((paddingTop + 1) * this.comment.lineHeight) / scale;
      context.strokeStyle = getStrokeColor(this.comment);
      context.fillStyle = this.comment.color;
      context.textAlign = "start";
      context.textBaseline = "alphabetic";
      context.lineJoin = "bevel";
      context.lineWidth = config.contextLineWidth;
      context.font = parseFont(this.comment.font, fontSize);
      const drawScale =
        getConfig(config.commentScale, false) *
        scale *
        (this.comment.layer === -1 ? options.scale : 1);
      context.scale(drawScale, drawScale);
      let lineCount = 0;
      if (!typeGuard.internal.HTML5Fonts(this.comment.font))
        throw new TypeGuardError();
      const offsetY =
        (this.comment.charSize - this.comment.lineHeight) / 2 +
        this.comment.lineHeight * -0.16 +
        (config.fonts[this.comment.font]?.offset || 0);
      for (const item of this.comment.content) {
        const lines = item.slicedContent;
        for (let j = 0, n = lines.length; j < n; j++) {
          const line = lines[j];
          if (line === undefined) continue;
          const posY =
            (this.comment.lineHeight * (lineCount + 1 + paddingTop) + offsetY) /
            scale;
          context.strokeText(line, 0, posY);
          context.fillText(line, 0, posY);
          lineCount += 1;
        }
      }
      return image;
    }
  }

  var index = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    BaseComment: BaseComment,
    FlashComment: FlashComment,
    HTML5Comment: HTML5Comment,
  });

  const build = (fonts) => {
    return fonts.reduce(
      (pv, val, index) => {
        if (index === 0) {
          return { ...val };
        }
        pv.font += `, ${val.font}`;
        return pv;
      },
      { font: "", offset: 0, weight: 600 }
    );
  };
  const fontTemplates = {
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
  const fonts = {
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

  var fonts$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    fontTemplates: fontTemplates,
    fonts: fonts,
  });

  const initConfig = () => {
    const platform = (function (ua) {
      if (ua.match(/windows nt 6\.[12]/i)) return "win7";
      else if (ua.match(/windows nt (6\.3|10\.\d+)|win32/i)) return "win8_1";
      else if (ua.match(/windows nt/i)) return "win";
      else if (ua.match(/mac os x 10(.|_)(9|10)/i)) return "mac10_9";
      else if (ua.match(/mac os x 10(.|_)\d{2}|darwin/i)) return "mac10_11";
      else if (ua.match(/mac os x/i)) return "mac";
      return "other";
    })(
      typeof navigator !== "undefined" ? navigator.userAgent : process.platform
    );
    const defaultConfig = {
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
      CommentStageSize: {
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
      sameCATimestampRange: 300,
      plugins: [],
      flashThreshold: 1499871600,
      flashChar: {
        gulim:
          "[\u0126\u0127\u0132\u0133\u0138\u013f\u0140\u0149-\u014b\u0166\u0167\u02d0\u02da\u2074\u207f\u2081-\u2084\u2113\u2153\u2154\u215c-\u215e\u2194\u2195\u223c\u249c-\u24b5\u24d0-\u24e9\u25a3-\u25a9\u25b6\u25b7\u25c0\u25c1\u25c8\u25d0\u25d1\u260e\u260f\u261c\u261e\u2660\u2661\u2663-\u2665\u2667-\u2669\u266c\u3131-\u316e\u3200-\u321c\u3260-\u327b\u3380-\u3384\u3388-\u338d\u3390-\u339b\u339f\u33a0\u33a2-\u33ca\u33cf\u33d0\u33d3\u33d6\u33d8\u33db-\u33dd\uf900-\uf928\uf92a-\uf994\uf996\ufa0b\uffe6]",
        simsunStrong:
          "[\u01ce\u01d0\u01d2\u01d4\u01d6\u01d8\u01da\u01dc\u0251\u0261\u02ca\u02cb\u2016\u2035\u216a\u216b\u2223\u2236\u2237\u224c\u226e\u226f\u2295\u2483-\u249b\u2504-\u250b\u256d-\u2573\u2581-\u2583\u2585-\u2587\u2589-\u258b\u258d-\u258f\u2594\u2595\u25e2-\u25e5\u2609\u3016\u3017\u301e\u3021-\u3029\u3105-\u3129\u3220-\u3229\u32a3\u33ce\u33d1\u33d2\u33d5\ue758-\ue864\ufa0c\ufa0d\ufe30\ufe31\ufe33-\ufe44\ufe49-\ufe52\ufe54-\ufe57\ufe59-\ufe66\ufe68-\ufe6b]",
        simsunWeak:
          "[\u02c9\u2105\u2109\u2196-\u2199\u220f\u2215\u2248\u2264\u2265\u2299\u2474-\u2482\u250d\u250e\u2511\u2512\u2515\u2516\u2519\u251a\u251e\u251f\u2521\u2522\u2526\u2527\u2529\u252a\u252d\u252e\u2531\u2532\u2535\u2536\u2539\u253a\u253d\u253e\u2540\u2541\u2543-\u254a\u2550-\u256c\u2584\u2588\u258c\u2593]",
        gothic: "[\u03fb\uff9f]",
      },
      FlashMode: "vista",
      FlashScriptChar: {
        super:
          "[\u00aa\u00b2\u00b3\u00b9\u00ba\u02b0\u02b2\u02b3\u02b7\u02b8\u02e1-\u02e3\u0304\u1d2c-\u1d43\u1d45-\u1d61\u1d9b-\u1da1\u1da3-\u1dbf\u2070\u2071\u2074-\u207f\u2c7d]",
        sub: "[\u0320\u1d62-\u1d6a\u2080-\u208e\u2090-\u209c\u2c7c]",
      },
      font: {
        gulim:
          'normal 600 [size]px gulim, "Microsoft JhengHei UI", Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic',
        simsun:
          'normal 400 [size]px simsun, "游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium',
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
        big: { default: -0.2, resized: -0.2 },
      },
      letterSpacing: 1,
      scriptCharOffset: 0.12,
      commentLimit: undefined,
      hideCommentOrder: "asc",
      lineBreakCount: {
        big: 3,
        medium: 5,
        small: 7,
      },
      commentPlugins: [
        {
          class: FlashComment,
          condition: isFlashComment,
        },
      ],
      nakaCommentSpeedOffset: 0.95,
    };
    updateConfig(defaultConfig);
  };

  var initConfig$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    initConfig: initConfig,
  });

  let handlerList = [];
  const handlerCounts = {
    seekDisable: 0,
    seekEnable: 0,
    commentDisable: 0,
    commentEnable: 0,
    jump: 0,
  };
  const registerHandler = (eventName, handler) => {
    handlerList.push({ eventName, handler });
    updateEventHandlerCounts();
  };
  const removeHandler = (eventName, handler) => {
    handlerList = handlerList.filter(
      (item) => item.eventName !== eventName || item.handler !== handler
    );
    updateEventHandlerCounts();
  };
  const updateEventHandlerCounts = () => {
    for (const key_ of Object.keys(handlerCounts)) {
      const key = key_;
      handlerCounts[key] = handlerList.filter(
        (item) => item.eventName === key
      ).length;
    }
  };
  const triggerHandler = (vpos, lastVpos) => {
    processCommentDisableScript(vpos, lastVpos);
    processSeekDisableScript(vpos, lastVpos);
    processJumpScript(vpos, lastVpos);
  };
  const processCommentDisableScript = (vpos, lastVpos) => {
    if (handlerCounts.commentDisable < 1 && handlerCounts.commentEnable < 1)
      return;
    for (const range of nicoScripts.ban) {
      const vposInRange = range.start < vpos && vpos < range.end,
        lastVposInRange = range.start < lastVpos && lastVpos < range.end;
      if (vposInRange && !lastVposInRange) {
        executeEvents("commentDisable", {
          type: "commentDisable",
          timeStamp: new Date().getTime(),
          vpos: vpos,
        });
      } else if (!vposInRange && lastVposInRange) {
        executeEvents("commentEnable", {
          type: "commentEnable",
          timeStamp: new Date().getTime(),
          vpos: vpos,
        });
      }
    }
  };
  const processSeekDisableScript = (vpos, lastVpos) => {
    if (handlerCounts.seekDisable < 1 && handlerCounts.seekEnable < 1) return;
    for (const range of nicoScripts.seekDisable) {
      const vposInRange = range.start < vpos && vpos < range.end,
        lastVposInRange = range.start < lastVpos && lastVpos < range.end;
      if (vposInRange && !lastVposInRange) {
        executeEvents("seekDisable", {
          type: "seekDisable",
          timeStamp: new Date().getTime(),
          vpos: vpos,
        });
      } else if (!vposInRange && lastVposInRange) {
        executeEvents("seekEnable", {
          type: "seekEnable",
          timeStamp: new Date().getTime(),
          vpos: vpos,
        });
      }
    }
  };
  const processJumpScript = (vpos, lastVpos) => {
    if (handlerCounts.jump < 1) return;
    for (const range of nicoScripts.jump) {
      const vposInRange =
          range.start < vpos && (!range.end || vpos < range.end),
        lastVposInRange =
          range.start < lastVpos && (!range.end || lastVpos < range.end);
      if (vposInRange && !lastVposInRange) {
        executeEvents("jump", {
          type: "jump",
          timeStamp: new Date().getTime(),
          vpos: vpos,
          to: range.to,
          message: range.message,
        });
      }
    }
  };
  const executeEvents = (eventName, event) => {
    for (const item of handlerList) {
      if (eventName !== item.eventName) continue;
      item.handler(event);
    }
  };

  var eventHandler = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    registerHandler: registerHandler,
    removeHandler: removeHandler,
    triggerHandler: triggerHandler,
  });

  const convert2formattedComment = (data, type) => {
    let result = [];
    if (type === "empty" && data === undefined) {
      return [];
    } else if (
      (type === "XMLDocument" || type === "niconicome") &&
      typeGuard.xmlDocument(data)
    ) {
      result = fromXMLDocument(data);
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
      throw new InvalidFormatError();
    }
    return sort(result);
  };
  const fromXMLDocument = (data) => {
    const data_ = [],
      userList = [];
    let index = Array.from(data.documentElement.children).length;
    for (const item of Array.from(data.documentElement.children)) {
      if (item.nodeName !== "chat") continue;
      const tmpParam = {
        id: Number(item.getAttribute("no")) || index++,
        vpos: Number(item.getAttribute("vpos")),
        content: item.innerHTML,
        date: Number(item.getAttribute("date")) || 0,
        date_usec: Number(item.getAttribute("date_usec")) || 0,
        owner: !item.getAttribute("user_id"),
        premium: item.getAttribute("premium") === "1",
        mail: [],
        user_id: -1,
        layer: -1,
      };
      if (item.getAttribute("mail")) {
        tmpParam.mail = item.getAttribute("mail")?.split(/\s+/g) || [];
      }
      if (tmpParam.content.startsWith("/") && tmpParam.owner) {
        tmpParam.mail.push("invisible");
      }
      const userId = item.getAttribute("user_id") || "";
      const isUserExist = userList.indexOf(userId);
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
  const fromFormatted = (data) => {
    return data.map((comment) => {
      if (typeGuard.formatted.legacyComment(comment)) {
        return {
          ...comment,
          layer: -1,
          user_id: 0,
        };
      }
      return comment;
    });
  };
  const fromLegacy = (data) => {
    const data_ = [],
      userList = [];
    for (const val of data) {
      if (!typeGuard.legacy.apiChat(val.chat)) continue;
      const value = val.chat;
      if (value.deleted !== 1) {
        const tmpParam = {
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
        const isUserExist = userList.indexOf(value.user_id);
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
  const fromLegacyOwner = (data) => {
    const data_ = [],
      comments = data.split("\n");
    for (let i = 0, n = comments.length; i < n; i++) {
      const value = comments[i];
      if (!value) continue;
      const commentData = value.split(":");
      if (commentData.length < 3) {
        continue;
      } else if (commentData.length > 3) {
        for (let j = 3, n = commentData.length; j < n; j++) {
          commentData[2] += `:${commentData[j]}`;
        }
      }
      const tmpParam = {
        id: i,
        vpos: Number(commentData[0]) * 100,
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
  const fromOwner = (data) => {
    const data_ = [];
    for (let i = 0, n = data.length; i < n; i++) {
      const value = data[i];
      if (!value) continue;
      const tmpParam = {
        id: i,
        vpos: time2vpos(value.time),
        content: value.comment,
        date: i,
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
    }
    return data_;
  };
  const fromV1 = (data) => {
    const data_ = [],
      userList = [];
    for (const item of data) {
      const val = item.comments,
        forkName = item.fork;
      for (const value of val) {
        const tmpParam = {
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
        const isUserExist = userList.indexOf(value.userId);
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
  const sort = (data) => {
    data.sort((a, b) => {
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
  const time2vpos = (time_str) => {
    const time = time_str.match(
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
  const date2time = (date) => Math.floor(new Date(date).getTime() / 1000);

  var inputParser = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    default: convert2formattedComment,
  });

  const createCommentInstance = (comment, context) => {
    for (const plugin of config.commentPlugins) {
      if (plugin.condition(comment)) {
        return new plugin.class(comment, context);
      }
    }
    return new HTML5Comment(comment, context);
  };

  const definition = {
    colors: colors$1,
    config: config$1,
    fonts: fonts$1,
    initConfig: initConfig$1,
  };

  var internal = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    comments: index,
    contexts: index$3,
    definition: definition,
    errors: index$2,
    eventHandler: eventHandler,
    inputParser: inputParser,
    typeGuard: typeGuard$1,
    utils: index$1,
  });

  let isDebug = false;
  class NiconiComments {
    enableLegacyPiP;
    showCollision;
    showFPS;
    showCommentCount;
    video;
    lastVpos;
    canvas;
    collision;
    context;
    timeline;
    static typeGuard = typeGuard;
    static default = NiconiComments;
    static FlashComment = {
      condition: isFlashComment,
      class: FlashComment,
    };
    static internal = internal;
    constructor(canvas, data, initOptions = {}) {
      const constructorStart = performance.now();
      initConfig();
      if (!typeGuard.config.initOptions(initOptions))
        throw new InvalidOptionError();
      setOptions(Object.assign(defaultOptions, initOptions));
      setConfig(Object.assign(defaultConfig, options.config));
      isDebug = options.debug;
      resetImageCache();
      resetNicoScripts();
      this.canvas = canvas;
      this.context = getContext(canvas);
      this.context.textAlign = "start";
      this.context.textBaseline = "alphabetic";
      this.context.lineJoin = "bevel";
      this.context.lineWidth = config.contextLineWidth;
      let formatType = options.format;
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
      if (options.mode === "default" && options.useLegacy) {
        options.mode = "html5";
      }
      const parsedData = convert2formattedComment(data, formatType);
      this.video = options.video || undefined;
      this.showCollision = options.showCollision;
      this.showFPS = options.showFPS;
      this.showCommentCount = options.showCommentCount;
      this.enableLegacyPiP = options.enableLegacyPiP;
      this.timeline = {};
      this.collision = {
        ue: [],
        shita: [],
        left: [],
        right: [],
      };
      this.lastVpos = -1;
      this.preRendering(parsedData);
      logger(`constructor complete: ${performance.now() - constructorStart}ms`);
    }
    preRendering(rawData) {
      const preRenderingStart = performance.now();
      if (options.keepCA) {
        rawData = changeCALayer(rawData);
      }
      const instances = rawData.reduce((pv, val) => {
        pv.push(createCommentInstance(val, this.context));
        return pv;
      }, []);
      this.getCommentPos(instances);
      this.sortComment();
      const plugins = [];
      for (const plugin of config.plugins) {
        try {
          const canvas = generateCanvas();
          plugins.push({
            canvas,
            instance: new plugin(canvas, instances),
          });
        } catch (e) {
          console.error("Failed to init plugin");
        }
      }
      setPlugins(plugins);
      logger(
        `preRendering complete: ${performance.now() - preRenderingStart}ms`
      );
    }
    getCommentPos(data) {
      const getCommentPosStart = performance.now();
      for (const comment of data) {
        if (comment.invisible) continue;
        if (comment.loc === "naka") {
          processMovableComment(comment, this.collision, this.timeline);
        } else {
          processFixedComment(
            comment,
            this.collision[comment.loc],
            this.timeline
          );
        }
      }
      logger(
        `getCommentPos complete: ${performance.now() - getCommentPosStart}ms`
      );
    }
    sortComment() {
      const sortCommentStart = performance.now();
      for (const vpos of Object.keys(this.timeline)) {
        const item = this.timeline[Number(vpos)];
        if (!item) continue;
        const owner = [],
          user = [];
        for (const comment of item) {
          if (comment?.owner) {
            owner.push(comment);
          } else {
            user.push(comment);
          }
        }
        this.timeline[Number(vpos)] = user.concat(owner);
      }
      logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
    }
    addComments(...rawComments) {
      const comments = rawComments.reduce((pv, val) => {
        pv.push(createCommentInstance(val, this.context));
        return pv;
      }, []);
      for (const plugin of plugins) {
        try {
          plugin.instance.addComments(comments);
        } catch (e) {
          console.error("Failed to add comments");
        }
      }
      for (const comment of comments) {
        if (comment.invisible) continue;
        if (comment.loc === "naka") {
          processMovableComment(comment, this.collision, this.timeline);
        } else {
          processFixedComment(
            comment,
            this.collision[comment.loc],
            this.timeline
          );
        }
      }
    }
    drawCanvas(vpos, forceRendering = false) {
      const drawCanvasStart = performance.now();
      if (this.lastVpos === vpos && !forceRendering) return false;
      triggerHandler(vpos, this.lastVpos);
      const timelineRange = this.timeline[vpos];
      if (
        !forceRendering &&
        plugins.length === 0 &&
        timelineRange?.filter((item) => item.loc === "naka").length === 0 &&
        this.timeline[this.lastVpos]?.filter((item) => item.loc === "naka")
          ?.length === 0
      ) {
        const current = timelineRange.filter((item) => item.loc !== "naka"),
          last =
            this.timeline[this.lastVpos]?.filter(
              (item) => item.loc !== "naka"
            ) || [];
        if (ArrayEqual(current, last)) return false;
      }
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.lastVpos = vpos;
      this._drawVideo();
      this._drawCollision(vpos);
      this._drawComments(timelineRange, vpos);
      for (const plugin of plugins) {
        try {
          plugin.instance.draw(vpos);
          this.context.drawImage(plugin.canvas, 0, 0);
        } catch (e) {
          console.error(`Failed to draw comments`);
        }
      }
      this._drawFPS(drawCanvasStart);
      this._drawCommentCount(timelineRange?.length);
      logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
      return true;
    }
    _drawVideo() {
      if (this.video) {
        let scale;
        const height = this.canvas.height / this.video.videoHeight,
          width = this.canvas.width / this.video.videoWidth;
        if (this.enableLegacyPiP ? height > width : height < width) {
          scale = width;
        } else {
          scale = height;
        }
        const offsetX =
            (this.canvas.width - this.video.videoWidth * scale) * 0.5,
          offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
        this.context.drawImage(
          this.video,
          offsetX,
          offsetY,
          this.video.videoWidth * scale,
          this.video.videoHeight * scale
        );
      }
    }
    _drawComments(timelineRange, vpos) {
      if (timelineRange) {
        const targetComment = (() => {
          if (config.commentLimit === undefined) {
            return timelineRange;
          }
          if (config.hideCommentOrder === "asc") {
            return timelineRange.slice(-config.commentLimit);
          }
          return timelineRange.slice(0, config.commentLimit);
        })();
        for (const comment of targetComment) {
          if (comment.invisible) {
            continue;
          }
          comment.draw(vpos, this.showCollision, isDebug);
        }
      }
    }
    _drawCollision(vpos) {
      if (this.showCollision) {
        this.context.save();
        const leftCollision = this.collision.left[vpos],
          rightCollision = this.collision.right[vpos];
        this.context.fillStyle = "red";
        if (leftCollision) {
          for (const comment of leftCollision) {
            this.context.fillRect(
              config.collisionRange.left,
              comment.posY,
              config.contextLineWidth,
              comment.height
            );
          }
        }
        if (rightCollision) {
          for (const comment of rightCollision) {
            this.context.fillRect(
              config.collisionRange.right,
              comment.posY,
              config.contextLineWidth * -1,
              comment.height
            );
          }
        }
        this.context.restore();
      }
    }
    _drawFPS(drawCanvasStart) {
      if (this.showFPS) {
        this.context.save();
        this.context.font = parseFont("defont", 60);
        this.context.fillStyle = "#00FF00";
        this.context.strokeStyle = `rgba(${hex2rgb(
          config.contextStrokeColor
        ).join(",")},${config.contextStrokeOpacity})`;
        const drawTime = Math.floor(performance.now() - drawCanvasStart);
        const fps = Math.floor(1000 / (drawTime === 0 ? 1 : drawTime));
        this.context.strokeText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
        this.context.fillText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
        this.context.restore();
      }
    }
    _drawCommentCount(count) {
      if (this.showCommentCount) {
        this.context.save();
        this.context.font = parseFont("defont", 60);
        this.context.fillStyle = "#00FF00";
        this.context.strokeStyle = `rgba(${hex2rgb(
          config.contextStrokeColor
        ).join(",")},${config.contextStrokeOpacity})`;
        this.context.strokeText(`Count:${count || 0}`, 100, 200);
        this.context.fillText(`Count:${count || 0}`, 100, 200);
        this.context.restore();
      }
    }
    addEventListener(eventName, handler) {
      registerHandler(eventName, handler);
    }
    removeEventListener(eventName, handler) {
      removeHandler(eventName, handler);
    }
    clear() {
      this.context.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    }
  }
  const logger = (msg) => {
    if (isDebug) console.debug(msg);
  };

  return NiconiComments;
});
