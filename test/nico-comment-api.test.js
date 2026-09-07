const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildThreadRequest,
  extractVideoId,
  getApiErrorCode,
  getThreadComments,
  hasPageProgress,
  indexThreadsByFork,
  mergeUniqueComments,
  findPlayerElements,
  findSettingsMount,
} = require("../lib/nico-comment-api.js");

test("extractVideoId accepts current watch URLs and ignores query strings", () => {
  assert.equal(
    extractVideoId("https://www.nicovideo.jp/watch/sm509233?from=0"),
    "sm509233"
  );
  assert.equal(
    extractVideoId("https://www.nicovideo.jp/watch/so123456#comment"),
    "so123456"
  );
  assert.equal(extractVideoId("https://www.nicovideo.jp/series/123"), null);
});

test("buildThreadRequest puts historical parameters at the API top level", () => {
  const nvComment = {
    server: "https://public.nvcomment.nicovideo.jp",
    threadKey: "thread-key",
    params: { language: "ja-jp" },
  };
  const target = { id: "1182691620", fork: "main" };

  assert.deepEqual(
    buildThreadRequest(nvComment, target, {
      res_from: -1000,
      when: 1655558820,
    }),
    {
      threadKey: "thread-key",
      params: {
        language: "ja-jp",
        targets: [target],
      },
      additionals: {
        res_from: -1000,
        when: 1655558820,
      },
    }
  );
});

test("indexThreadsByFork does not depend on response array order", () => {
  const threads = [
    { fork: "easy", comments: ["easy"] },
    { fork: "owner", comments: ["owner"] },
    { fork: "main", comments: ["main"] },
  ];

  assert.deepEqual(indexThreadsByFork(threads), {
    easy: threads[0],
    owner: threads[1],
    main: threads[2],
  });
});

test("hasPageProgress detects a page that moved toward older comments", () => {
  assert.equal(
    hasPageProgress([{ no: 36324 }], [{ no: 35324 }]),
    true
  );
  assert.equal(
    hasPageProgress([{ no: 36324 }], [{ no: 36324 }]),
    false
  );
  assert.equal(hasPageProgress([], [{ no: 1 }]), true);
  assert.equal(hasPageProgress([{ no: 1 }], []), true);
});

test("getThreadComments selects the requested fork by name", () => {
  const response = {
    data: {
      threads: [
        { fork: "easy", comments: [{ no: 2 }] },
        { fork: "main", comments: [{ no: 1 }] },
      ],
    },
  };

  assert.deepEqual(getThreadComments(response, "main"), [{ no: 1 }]);
  assert.deepEqual(getThreadComments(response, "owner"), []);
});

test("mergeUniqueComments removes duplicates by comment id and number", () => {
  const first = [{ id: "a", no: 1 }, { id: "b", no: 2 }];
  const second = [{ id: "a", no: 1 }, { id: "c", no: 2 }];

  assert.deepEqual(mergeUniqueComments(first, second), [
    { id: "a", no: 1 },
    { id: "b", no: 2 },
    { id: "c", no: 2 },
  ]);
});

test("getApiErrorCode exposes API errors and HTTP failures", () => {
  assert.equal(
    getApiErrorCode({ meta: { errorCode: "EXPIRED_TOKEN" } }, 400),
    "EXPIRED_TOKEN"
  );
  assert.equal(getApiErrorCode({ meta: { status: 200 } }, 200), null);
  assert.equal(getApiErrorCode({}, 429), "HTTP_429");
});

test("findPlayerElements uses stable data attributes instead of generated classes", () => {
  const content = { id: "content" };
  const video = { id: "video" };
  const stage = { id: "stage" };
  const documentLike = {
    querySelector(selector) {
      return {
        '[data-name="content"]': content,
        '[data-name="video-content"]': video,
        '[data-name="stage"]': stage,
      }[selector] || null;
    },
  };

  assert.deepEqual(findPlayerElements(documentLike), {
    content,
    video,
    stage,
    nativeVideo: video,
  });
});

test("findPlayerElements supports the current player markers during ads", () => {
  const content = { id: "content" };
  const stage = { id: "stage" };
  const documentLike = {
    querySelector(selector) {
      return {
        '[aria-label="nicovideo-content"]': content,
        '[data-styling-name="fullscreen-target"]': stage,
      }[selector] || null;
    },
  };

  assert.deepEqual(findPlayerElements(documentLike), {
    content,
    video: stage,
    stage,
    nativeVideo: null,
  });
});

test("findSettingsMount falls back to an aside when old sidebar classes disappear", () => {
  const aside = { id: "sidebar" };
  const documentLike = {
    body: { id: "body" },
    querySelector(selector) {
      return selector === "aside" ? aside : null;
    },
  };

  assert.equal(findSettingsMount(documentLike), aside);
});
