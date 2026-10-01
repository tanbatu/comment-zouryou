const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

function setup(cancelDuringWait, retryAfter = null, replies = null) {
  const requests = [];
  const logs = [];
  let waits = 0;
  let plays = 0;
  const errors = [];
  const element = { style: {}, checked: false };
  const context = vm.createContext({
    console: { log() {}, error: (...args) => errors.push(args) },
    AbortController, DOMException, Date,
    location: { href: "https://www.nicovideo.jp/watch/sm1" },
    document: { getElementsByClassName: () => [element], getElementById: () => element },
    DOMParser: class {},
    attachCommentOverlay() {}, logger: (message) => logs.push(message),
    NG_LIST_COMMAND: [], COMMENT_CONTROL: async (comments) => comments,
    PLAYCOMMENT: () => plays++,
    clearTimeout: clearImmediate,
    setTimeout: (callback) => {
      waits++;
      return setImmediate(() => {
        if (cancelDuringWait) vm.runInContext("cancelCommentLoad()", context);
        else callback();
      });
    },
    fetch: async (url, options) => {
      if (url.includes("responseType=json")) return {
        status: 200,
        json: async () => ({ data: { response: {
          video: { id: "sm1" },
          comment: {
            threads: [{}, {}, { id: "1" }],
            nvComment: { server: "https://public.nvcomment.nicovideo.jp", threadKey: "key",
              params: { language: "ja-jp", targets: [{ id: "1", fork: "main" }] } },
          },
        } } }),
      };
      requests.push(options.body);
      if (replies) return replies(requests.length);
      if (requests.length === 1) return {
        status: 429, headers: { get: () => retryAfter },
        json: async () => { throw new Error("429 body must not be parsed"); },
      };
      return { status: 200, json: async () => ({ data: { threads: [{ comments: [] }] } }) };
    },
  });
  vm.runInContext(fs.readFileSync("scripts/state.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("scripts/comment-loader.js", "utf8"), context);
  vm.runInContext(`loading = { style: {} }; OLD_DATE = { value: "" }; OLD_TIME = { value: "" };
    CommentLoadingScreenWrapper = { style: {} }; CommentLimit = 1;`, context);
  return { context, requests, logs, errors, counts: () => ({ waits, plays }) };
}

test("non-JSON HTTP 429 waits 60 seconds and retries the identical request", async () => {
  const app = setup(false);
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.counts().waits, 60);
  assert.equal(app.requests.length, 2);
  assert.equal(app.requests[0], app.requests[1]);
  assert.equal(app.counts().plays, 1);
});

test("HTTP 429 respects an exposed Retry-After header", async () => {
  const app = setup(false, "90");
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.counts().waits, 90);
  assert.equal(app.counts().plays, 1);
});

test("cancelling HTTP 429 wait prevents retries and playback", async () => {
  const app = setup(true);
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.requests.length, 1);
  assert.equal(app.counts().plays, 0);
});

const successfulResponse = (comments = []) => ({
  status: 200,
  json: async () => ({ data: { threads: [{ comments }] } }),
});

test("CORS/network failure resumes at the same cursor without losing comments", async () => {
  const comment = { no: 100, postedAt: "2026-01-01T00:00:00Z" };
  const app = setup(false, null, (attempt) => {
    if (attempt === 1) return successfulResponse([comment]);
    if (attempt === 2) throw new TypeError("Failed to fetch");
    return successfulResponse();
  });
  vm.runInContext("CommentLimit = 2", app.context);
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.requests.length, 3);
  assert.equal(app.requests[1], app.requests[2]);
  assert.equal(JSON.parse(app.requests[2]).additionals.when, Date.parse(comment.postedAt) / 1000);
  assert.equal(vm.runInContext("COMMENT[0].comments.length", app.context), 1);
  assert.equal(app.counts().waits, 60);
  assert.equal(app.counts().plays, 1);
  assert.equal(app.errors.length, 0);
});

test("HTTP 503 waits without parsing its HTML body", async () => {
  const app = setup(false, null, (attempt) => attempt === 1 ? {
    status: 503,
    json: async () => { throw new Error("503 body must not be parsed"); },
  } : successfulResponse());
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.counts().waits, 60);
  assert.equal(app.counts().plays, 1);
  assert.equal(app.errors.length, 0);
});

test("persistent network failures have bounded exponential backoff", async () => {
  const app = setup(false, null, () => { throw new TypeError("Failed to fetch"); });
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.requests.length, 6);
  assert.equal(app.counts().waits, 60 + 120 + 240 + 240 + 240);
  assert.equal(app.counts().plays, 0);
  assert.equal(app.errors.length, 1);
});

test("cancelling network backoff prevents retries and playback", async () => {
  const app = setup(true, null, () => { throw new TypeError("Failed to fetch"); });
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.requests.length, 1);
  assert.equal(app.counts().plays, 0);
  assert.equal(app.errors.length, 0);
});

test("network failure while reading the response body retries the same request", async () => {
  const app = setup(false, null, (attempt) => attempt === 1 ? {
    status: 200,
    json: async () => { throw new TypeError("Failed to fetch"); },
  } : successfulResponse());
  await vm.runInContext("LOADCOMMENT()", app.context);
  assert.equal(app.requests[0], app.requests[1]);
  assert.equal(app.counts().plays, 1);
  assert.equal(app.errors.length, 0);
});
