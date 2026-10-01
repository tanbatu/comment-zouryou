const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

test("playback shutdown releases timers, renderer, stream and download URL", () => {
  const calls = [];
  const context = vm.createContext({
    console,
    clearTimeout: (id) => calls.push(["timeout", id]),
    clearInterval: (id) => calls.push(["interval", id]),
    restoreCommentVisibility: () => calls.push(["restore"]),
    URL: { revokeObjectURL: (url) => calls.push(["revoke", url]) },
  });
  vm.runInContext(fs.readFileSync("scripts/state.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("scripts/comment-player.js", "utf8"), context);
  context.calls = calls;
  vm.runInContext(`
    DRAW_ = true;
    commentDrawTimer = 1; commentUiTimer = 2; list_interval = 3;
    niconiComments = { destroy: () => calls.push(["destroy"]) };
    pipVideoElement = {
      srcObject: { getTracks: () => [{ stop: () => calls.push(["track"]) }] },
      pause: () => calls.push(["pause"]),
    };
    link = { href: "blob:download", removeAttribute: () => calls.push(["unlink"]) };
    stopCommentPlayback();
  `, context);
  assert.equal(vm.runInContext("DRAW_", context), false);
  assert.equal(vm.runInContext("niconiComments", context), undefined);
  assert.equal(vm.runInContext("pipVideoElement.srcObject", context), null);
  for (const name of ["destroy", "track", "pause", "restore", "revoke", "unlink", "interval"]) {
    assert.ok(calls.some(([call]) => call === name), name);
  }
  assert.equal(calls.filter(([name]) => name === "timeout").length, 2);
});

test("cancelled fetch body cannot update watch data or start playback", async () => {
  let resolveBody;
  let plays = 0;
  const context = vm.createContext({
    console, AbortController, DOMException, setTimeout, clearTimeout,
    location: { href: "https://www.nicovideo.jp/watch/sm1" },
    attachCommentOverlay() {}, logger() {},
    loading: { style: {} },
    document: { getElementsByClassName: () => [{ innerText: "" }] },
    DOMParser: class {},
    fetch: async () => ({ json: () => new Promise((resolve) => { resolveBody = resolve; }) }),
    PLAYCOMMENT: () => plays++,
  });
  vm.runInContext(fs.readFileSync("scripts/state.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("scripts/comment-loader.js", "utf8"), context);
  vm.runInContext("loading = { style: {} };", context);
  const pending = vm.runInContext("LOADCOMMENT()", context);
  await new Promise((resolve) => setImmediate(resolve));
  vm.runInContext("cancelCommentLoad()", context);
  resolveBody({ data: { response: { video: { id: "sm1" } } } });
  await pending;
  assert.equal(vm.runInContext("apiData", context), undefined);
  assert.equal(plays, 0);
});
