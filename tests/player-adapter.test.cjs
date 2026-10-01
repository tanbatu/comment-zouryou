const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

test("retention requires the same connected Mint video and restores replaced comments", () => {
  const video = { isConnected: true };
  let comments = { style: { display: "block" } };
  const original = comments;
  const context = vm.createContext({
    location: { pathname: "/ranking" },
    document: {
      getElementById: (id) => id === "pmw-element-video" ? video : comments,
      querySelector: (selector) => selector === "#pmw-element-commentcanvas" ? comments : null,
    },
  });
  vm.runInContext(fs.readFileSync("scripts/state.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("scripts/player-adapter.js", "utf8"), context);
  context.targetVideo = video;
  vm.runInContext("videoElement = targetVideo; DRAW_ = true; CustomVideoContainer = { style: {} };", context);
  assert.equal(vm.runInContext("hasRetainedMintPlayer()", context), true);
  video.isConnected = false;
  assert.equal(vm.runInContext("hasRetainedMintPlayer()", context), false);
  video.isConnected = true;
  vm.runInContext("syncCommentVisibility()", context);
  assert.equal(original.style.display, "none");
  comments = { style: { display: "" } };
  vm.runInContext("syncCommentVisibility()", context);
  assert.equal(original.style.display, "block");
  assert.equal(comments.style.display, "none");
  vm.runInContext("DRAW_ = false; syncCommentVisibility()", context);
  assert.equal(comments.style.display, "");
});
