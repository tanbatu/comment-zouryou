(function (root, factory) {
  const api = factory();
  root.NicoCommentApi = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis === "undefined" ? this : globalThis, function () {
  function extractVideoId(value) {
    if (typeof value !== "string") return null;
    const match = value.match(/(?:^|\/)watch\/([A-Za-z0-9_-]+)(?:[/?#]|$)/);
    return match ? match[1] : null;
  }

  function buildThreadRequest(nvComment, target, additionals) {
    const params = {
      ...(nvComment.params || {}),
      targets: [{ ...target }],
    };
    delete params.additionals;

    return {
      threadKey: nvComment.threadKey,
      params,
      additionals: { ...(additionals || {}) },
    };
  }

  function indexThreadsByFork(threads) {
    return (threads || []).reduce((index, thread) => {
      if (thread && typeof thread.fork === "string") {
        index[thread.fork] = thread;
      }
      return index;
    }, {});
  }

  function getCommentPosition(comment) {
    if (!comment || typeof comment !== "object") return null;
    if (Number.isFinite(comment.no)) return comment.no;
    const postedAt = Date.parse(comment.postedAt);
    return Number.isFinite(postedAt) ? postedAt : null;
  }

  function hasPageProgress(previous, next) {
    if (!Array.isArray(previous) || !Array.isArray(next)) return false;
    if (previous.length === 0 || next.length === 0) return true;

    const previousPosition = getCommentPosition(previous[0]);
    const nextPosition = getCommentPosition(next[0]);
    if (previousPosition === null || nextPosition === null) return false;
    return nextPosition < previousPosition;
  }

  function getThreadComments(response, fork) {
    const thread = indexThreadsByFork(response?.data?.threads)[fork];
    return Array.isArray(thread?.comments) ? thread.comments : [];
  }

  function commentKey(comment) {
    if (comment && comment.id !== undefined && comment.id !== null) {
      return `id:${comment.id}`;
    }
    if (comment && comment.no !== undefined && comment.no !== null) {
      return `no:${comment.no}`;
    }
    return null;
  }

  function mergeUniqueComments(existing, additions) {
    const result = Array.isArray(existing) ? [...existing] : [];
    const seen = new Set(result.map(commentKey).filter(Boolean));
    for (const comment of Array.isArray(additions) ? additions : []) {
      const key = commentKey(comment);
      if (key === null || !seen.has(key)) {
        result.push(comment);
        if (key !== null) seen.add(key);
      }
    }
    return result;
  }

  function getApiErrorCode(response, status) {
    const code = response?.meta?.errorCode;
    if (typeof code === "string" && code !== "") return code;
    if (Number.isFinite(status) && status >= 400) return `HTTP_${status}`;
    return null;
  }

  function findPlayerElements(documentLike) {
    const content =
      documentLike?.querySelector?.('[data-name="content"]') ||
      documentLike?.querySelector?.('[aria-label="nicovideo-content"]');
    if (!content) return null;

    const nativeVideo =
      documentLike?.querySelector?.('[data-name="video-content"]') ||
      documentLike?.querySelector?.('video:not([title="Advertisement"])');
    const stage =
      documentLike?.querySelector?.('[data-name="stage"]') ||
      documentLike?.querySelector?.('[data-styling-name="fullscreen-target"]') ||
      content;
    return {
      content,
      video: nativeVideo || stage,
      stage,
      nativeVideo,
    };
  }

  function findSettingsMount(documentLike) {
    const selectors = [
      '[data-name="sidebar"]',
      '[data-styling-name="sidebar"]',
      '[class*="grid-area_[sidebar]"]',
      "aside",
      '[class*="sidebar"]',
      '[class*="Sidebar"]',
    ];
    for (const selector of selectors) {
      const element = documentLike?.querySelector?.(selector);
      if (element) return element;
    }
    return documentLike?.body || null;
  }

  return {
    buildThreadRequest,
    extractVideoId,
    getApiErrorCode,
    getThreadComments,
    hasPageProgress,
    indexThreadsByFork,
    mergeUniqueComments,
    findPlayerElements,
    findSettingsMount,
  };
});
