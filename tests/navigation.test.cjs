const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

function setup(pathname) {
  const elements = new Map();
  const setting = {
    style: {}, isConnected: true,
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { style: {}, checked: false, value: 2 });
      return elements.get(selector);
    },
  };
  let player = {};
  let prepares = 0;
  let loads = 0;
  let syncs = 0;
  let stops = 0;
  let retained = false;
  let poll;
  const timers = new Map();
  const context = vm.createContext({
    location: { pathname }, console,
    chrome: { runtime: { getURL: (path) => path } },
    fetch: async () => ({ ok: true, text: async () => "settings" }),
    setInterval: (callback) => { poll = callback; },
    setTimeout: (callback) => { const id = timers.size + 1; timers.set(id, callback); return id; },
    clearTimeout: (id) => timers.delete(id),
    window: { addEventListener() {} },
    getPlayerElements: () => player,
    isWatchPage: () => /^\/watch\/[^/]+\/?$/.test(context.location.pathname),
    PREPARE: () => prepares++,
    syncZouryouPlayer: () => syncs++,
    LOADCOMMENT: () => loads++,
    hasRetainedMintPlayer: () => retained,
    cancelCommentLoad() {},
    stopCommentPlayback: () => stops++,
    restoreCommentVisibility() {},
    zouryouSetting: setting,
    CustomVideoContainer: { style: {} }, pipVideoElement: { style: {} },
  });
  vm.runInContext(fs.readFileSync("index.js", "utf8"), context);
  vm.runInContext('setting_html = "settings";', context);
  return {
    context, setting, timers, poll: () => poll(),
    ready: () => { player = { video: {}, container: {}, settings: {}, buttonHost: {}, comments: { style: {} } }; },
    unready: () => { player = {}; },
    retain: (value) => { retained = value; },
    counts: () => ({ prepares, loads, syncs, stops }),
  };
}

test("non-watch entry waits for watch DOM and prepares only once", () => {
  const app = setup("/ranking");
  app.ready(); app.poll();
  assert.equal(app.counts().prepares, 0);
  app.context.location.pathname = "/watch/sm1";
  app.unready(); app.poll();
  assert.equal(app.counts().prepares, 0);
  app.ready(); app.poll(); app.poll();
  assert.equal(app.counts().prepares, 1);
  app.context.location.pathname = "/ranking"; app.poll();
  app.context.location.pathname = "/watch/sm2"; app.poll();
  assert.equal(app.counts().prepares, 1);
  assert.ok(app.counts().syncs >= 3);
});

test("Mint mini player retains comments across navigation and return, but resets for another video", () => {
  const app = setup("/watch/sm1");
  app.ready(); app.poll(); app.retain(true);
  app.context.location.pathname = "/ranking"; app.poll();
  assert.equal(app.counts().stops, 0);
  app.context.location.pathname = "/watch/sm1"; app.poll();
  assert.equal(app.counts().stops, 0);
  app.context.location.pathname = "/watch/sm2"; app.poll();
  assert.equal(app.counts().stops, 1);
});

test("closing Mint mini player releases playback even without a URL change", () => {
  const app = setup("/watch/sm1");
  app.ready(); app.poll(); app.retain(true);
  app.context.location.pathname = "/ranking"; app.poll();
  app.retain(false); app.poll(); app.poll();
  assert.equal(app.counts().stops, 1);
});

test("auto-load waits for player readiness and is cancelled on departure", () => {
  const app = setup("/watch/sm1");
  app.ready(); app.poll();
  app.setting.querySelector("#isauto").checked = true;
  app.context.location.pathname = "/watch/sm2";
  app.unready(); app.poll();
  assert.equal(app.timers.size, 0);
  app.ready(); app.poll();
  assert.equal(app.timers.size, 1);
  const staleCallback = [...app.timers.values()][0];
  app.context.location.pathname = "/ranking"; app.poll();
  assert.equal(app.timers.size, 0);
  staleCallback();
  assert.equal(app.counts().loads, 0);
  app.context.location.pathname = "/watch/sm3"; app.poll();
  [...app.timers.values()][0]();
  assert.equal(app.counts().loads, 1);
});

test("manifest injects on non-watch pages for site navigation", () => {
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  assert.deepEqual(manifest.content_scripts[0].matches, [
    "https://www.nicovideo.jp/*", "https://nicovideo.jp/*",
  ]);
});
