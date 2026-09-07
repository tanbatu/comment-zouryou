let CommentRenderer,
  zouryouCanvasElement,
  SuperDanmakuCanvasElement,
  videoElement,
  pipVideoElement,
  VideoSymbolContainer,
  CommentLoadingScreen,
  CustomVideoContainer,
  DefaultVideoContainer,
  PlayerContainer,
  CommentLoadingScreenWrapper,
  loading,
  loading_text,
  link,
  OLD_DATE,
  OLD_TIME,
  DRAW_,
  net,
  firstaccess,
  aspect,
  apiData;
let COMMENT = [];
let CommentLimit = 40;

async function LOADCOMMENT_LEGACY(mode) {
  const commentRenderers = document.getElementsByClassName("CommentRenderer");
  if (commentRenderers.length === 0) {
    PlayerContainer = document.querySelector('[data-name="content"]');
    const CustomVideoContainer = document.createElement("div");
    CustomVideoContainer.classList.add("CustomVideoContainer", "InView");
    CustomVideoContainer.style.cssText =
      "display: none; z-index: 1; pointer-events: none;";
    CustomVideoContainer.innerHTML = `<div class="CommentRenderer">
      <canvas id="zouryou_comment" width="1920" height="1080" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; display: block; object-fit: contain;"></canvas>
      <canvas id="SuperDanmakuCanvasElement" width="640" height="360"></canvas>
      <video id="pipVideoElement"></video>
    </div>`;
    PlayerContainer.children[0].after(CustomVideoContainer);
  }

  logger("お待ち下さい");
  loading.style.display = "block";
  document.getElementsByClassName("loadbutton_text")[0].innerText =
    "読み込み中";
  let LoadedCommentCount = 1,
    FailCount = 0;
  const parser = new DOMParser();

  let match = location.href.match(/\/watch\/(sm\d+)/);
  if (match === null) {
    match = location.href.match(/\/watch\/(so\d+)/);
  }

  const req = await fetch(
    "https://www.nicovideo.jp/watch/" + match[1] + "?responseType=json"
  );
  apiData = (await req.json()).data.response;

  const joinObj = function (obj, fDelimiter, sDelimiter) {
    const tmpArr = [];
    if (typeof obj === "undefined") return "";
    if (typeof fDelimiter === "undefined") fDelimiter = "";
    if (typeof sDelimiter === "undefined") sDelimiter = "";
    for (let key in obj) {
      tmpArr.push(key + fDelimiter + obj[key]);
    }
    return tmpArr.join(sDelimiter);
  };
  //コメント取得
  const nvComment = apiData.comment.nvComment,
    threads = apiData.comment.threads;
  let totalThreadCount = nvComment.params.targets.length * CommentLimit;
  let fetchedThreadCount = 0;
  logger(
    `${nvComment.params.targets.length}スレッドをそれぞれ${CommentLimit}回読み込みます。`
  );

  const date =
    OLD_DATE.value === ""
      ? new Date()
      : new Date(OLD_DATE.value + " " + OLD_TIME.value);
  const ownerComments = [];
  const comments = [];
  let isLoggedIn = true,
    params = {
      version: "20090904",
      scores: "1",
      nicoru: "3",
      fork: 0,
      language: "0",
      thread: threads[2]["id"],
    };
  const prepareLegacy = async () => {
    let channel_URL =
      "https://flapi.nicovideo.jp/api/getthreadkey?thread=" + threads[2]["id"];
    const req = await fetch(channel_URL);
    const res = (await req.text()).split("&");
    if (res[0] !== "") {
      for (const item of res) {
        const param = item.split("=");
        params[param[0]] = param[1];
      }
    }
  };
  let threadKey = nvComment.threadKey;
  for (const i in nvComment.params.targets) {
    const thread = nvComment.params.targets[i];
    if (
      (document.getElementById("iseasy").checked || mode == "auto") &&
      thread.fork == "easy"
    ) {
      continue;
    }
    let baseData = {
      threadKey: threadKey,
      params: {
        language: nvComment.params.language,
        targets: [thread],
      },
    };
    let lastTime = Math.floor(date.getTime() / 1000);
    for (let j = 0; j < CommentLimit; j++) {
      //await sleep(1000);
      if (isLoggedIn) {
        const req = await fetch(`${nvComment.server}/v1/threads`, {
          method: "POST",
          headers: {
            "content-type": "text/plain;charset=UTF-8",
            "x-client-os-type": "others",
            "x-frontend-id": "6",
            "x-frontend-version": "0",
          },
          body: JSON.stringify({
            ...baseData,
            additionals: {
              res_from: -1000,
              when: lastTime,
            },
          }),
        });
        const res = await req.json();
        if (res?.meta?.errorCode === "TOO_MANY_REQUESTS") {
          for (let i = 0; i < 60; i++) {
            logger(
              `[${
                fetchedThreadCount + j
              }/${totalThreadCount}]: API呼び出しの回数制限を超えました。しばらくお待ち下さい。\n
              あと${60 - i}秒`
            );
            await sleep(1000);
          }
          j--;
          continue;
        }
        if (res?.meta?.errorCode === "EXPIRED_TOKEN") {
          logger(
            `[${
              fetchedThreadCount + j
            }/${totalThreadCount}]:threadKeyを新たに取得しています…`
          );
          await fetch(
            "https://nvapi.nicovideo.jp/v1/comment/keys/thread?videoId=" +
              apiData.video.id,
            {
              headers: {
                "X-Frontend-Id": "6",
                "X-Frontend-Version": "0",
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          )
            .then((r) => r.json())
            .then((j) => {
              console.log(j.data.threadKey);
              threadKey = j.data.threadKey;
              baseData.threadKey = j.data.threadKey;
            });
          j--;
          continue;
        }
        if (res?.meta?.errorCode === "INVALID_TOKEN") {
          logger("ログインしていません。");
          alert(
            "【コメント増量】ログアウト状態です。ログインをして再度実行してください。"
          );
          document.getElementById("loading").style.display = "none";
          document.getElementById("allcommentsetting").style.display = "none";
          isLoggedIn = false;
          j--;
          totalThreadCount /= 3;
          //await prepareLegacy();
          //continue;
        }
        (thread.fork === "owner" ? ownerComments : comments).push(
          ...res.data.threads[0].comments
        );
        if (
          res.data.threads[0].comments.length === 0 ||
          res.data.threads[0].comments[0].no < 5
        ) {
          logger(
            `[${
              fetchedThreadCount + j
            }/${totalThreadCount}]: スレッドの先頭まで読み込みました`
          );
          break;
        }
        lastTime = Math.floor(
          new Date(res.data.threads[0].comments[0].postedAt).getTime() / 1000
        );
        logger(
          `[${fetchedThreadCount + j}/${totalThreadCount}]: コメ番${
            res.data.threads[0].comments[0].no
          }まで読み込みました`
        );
      } else {
        let url = `${threads[1]["server"]}/api.json/thread?${joinObj(
          { ...params, when: lastTime, res_from: "-1000" },
          "=",
          "&"
        )}`;
        logger(
          `[${LoadedCommentCount}/${CommentLimit}]: ${url}を読み込んでいます...`,
          false
        );
        const req = await fetch(url);
        const res = await req.text();
        let comments_tmp;
        try {
          comments_tmp = JSON.parse(res).slice(2);
          lastTime = comments_tmp[0].chat.date;
        } catch (e) {
          lastTime -= 100;
          FailCount++;
          if (FailCount > 10) {
            logger(`コメントの取得に失敗しました`);
            break;
          }
          logger(
            `[${LoadedCommentCount}/${CommentLimit}]: コメントの参照に失敗しました。お待ち下さい。`
          );
          j--;
          await sleep(1000);
          continue;
        }
        for (const comment of comments_tmp) {
          //
          (!!comment.user_id ? comments : ownerComments).push({
            body: comment.chat.content,
            commands: comment.chat.mail?.split(/\s+/g),
            id: 0,
            isMyPost: false,
            isPremium: comment.chat.premium === 1,
            nicoruCount: 0,
            nicoruId: null,
            no: comment.chat.no,
            postedAt: `${comment.chat.date}`,
            score: 0,
            source: "",
            userId: comment.chat.user_id,
            vposMs: comment.chat.vpos * 10,
          });
        }
        if (comments_tmp.length === 0 || comments_tmp[0].chat.no < 5) {
          logger(
            `[${
              fetchedThreadCount + j
            }/${totalThreadCount}]: スレッドの先頭まで読み込みました`
          );
          break;
        }
        lastTime = comments_tmp[0].chat.date;
        logger(
          `[${fetchedThreadCount + j}/${totalThreadCount}]: コメ番${
            comments_tmp[0].chat.no
          }まで読み込みました`
        );
      }
      document.getElementById("progress_left").style.width =
        100 -
        ((fetchedThreadCount + j) / totalThreadCount) * 100 +
        "%"; /*.background = `linear-gradient(90deg,rgb(0, 145, 255,0.9) 0%,#0ff ${
        ((fetchedThreadCount + j) / totalThreadCount) * 100
      }%,rgba(0, 0, 0, .9) ${
        ((fetchedThreadCount + j) / totalThreadCount) * 100
      }%,rgba(0, 0, 0, .9) 100%)`;*/
      let LimitRate = 20;
      if (NG_LIST_COMMAND.includes("speedmode")) {
        LimitRate = 1000;
      }
      if (CommentLimit > LimitRate) {
        await sleep(1000);
      }
    }
    if (!isLoggedIn) break;
    fetchedThreadCount += CommentLimit;
  }
  CommentLoadingScreenWrapper.style.background = `rgba(0, 0, 0, .9)`;
  logger(comments.length + "件のコメントを読み込みました");
  logger(`NG設定を適用しています`);

  COMMENT = [
    {
      commentCount: comments.length,
      comments: await COMMENT_CONTROL(comments),
      fork: "comment-zouryou",
      id: 0,
    },
    {
      commentCount: ownerComments.length,
      comments: ownerComments, //投稿者コメントにフィルターを適用する?
      fork: "owner",
      id: 1,
    },
  ];
  document.getElementById("reload_niconicomments").onclick = async () => {
    COMMENT = [
      {
        commentCount: comments.length,
        comments: await COMMENT_CONTROL(comments),
        fork: "comment-zouryou",
        id: 0,
      },
      {
        commentCount: ownerComments.length,
        comments: ownerComments, //投稿者コメントにフィルターを適用する?
        fork: "owner",
        id: 1,
      },
    ];
    load_NiconiComments();
    clearInterval(list_interval);
    LIST_COMMENT();
  };

  logger(`描画準備中`);
  document.getElementById("progress_left").style.width = "0%";
  PLAYCOMMENT();
}

async function LOADCOMMENT(mode) {
  const zenkomeButton = document.getElementById("zenkomebutton");
  const pageLimit = Math.max(1, Number(CommentLimit) || 1);

  try {
    logger("お待ち下さい");
    loading.style.display = "block";
    document.getElementsByClassName("loadbutton_text")[0].innerText =
      "読み込み中";

    const videoId = NicoCommentApi.extractVideoId(location.href);
    if (!videoId) {
      throw new Error("動画 ID の取得に失敗しました");
    }

    const watchUrl = new URL(`/watch/${videoId}`, location.origin);
    watchUrl.searchParams.set("responseType", "json");
    const watchResponse = await fetch(watchUrl, { credentials: "include" });
    if (!watchResponse.ok) {
      throw new Error(`動画情報の取得に失敗しました (${watchResponse.status})`);
    }
    apiData = (await watchResponse.json())?.data?.response;

    const nvComment = apiData?.comment?.nvComment;
    const targets = nvComment?.params?.targets;
    if (!nvComment?.server || !Array.isArray(targets) || targets.length === 0) {
      throw new Error("現行コメント API の情報が見つかりません");
    }

    const date =
      OLD_DATE?.value === ""
        ? new Date()
        : new Date(`${OLD_DATE.value} ${OLD_TIME.value}`);
    const startCursor = Math.floor(date.getTime() / 1000);
    const ownerComments = [];
    const comments = [];
    const activeTargets = targets.filter(
      (target) =>
        !(
          (document.getElementById("iseasy")?.checked || mode === "auto") &&
          target.fork === "easy"
        )
    );
    const totalPages = Math.max(1, activeTargets.length * pageLimit);
    let completedPages = 0;

    const updateProgress = () => {
      const progress = document.getElementById("progress_left");
      if (progress) {
        progress.style.width = `${100 - (completedPages / totalPages) * 100}%`;
      }
    };

    const refreshThreadKey = async () => {
      const keyUrl = new URL(
        "https://nvapi.nicovideo.jp/v1/comment/keys/thread"
      );
      keyUrl.searchParams.set("videoId", apiData.video.id || videoId);
      keyUrl.searchParams.set("_frontendId", "6");
      const keyResponse = await fetch(keyUrl, {
        credentials: "include",
        headers: {
          "X-Frontend-Id": "6",
          "X-Frontend-Version": "0",
          "Content-Type": "application/json",
        },
      });
      if (!keyResponse.ok) {
        throw new Error(`thread key の取得に失敗しました (${keyResponse.status})`);
      }
      const key = (await keyResponse.json())?.data?.threadKey;
      if (!key) throw new Error("thread key がレスポンスにありません");
      nvComment.threadKey = key;
    };

    const requestThread = async (target, additionals) => {
      let refreshed = false;
      while (true) {
        const response = await fetch(`${nvComment.server}/v1/threads`, {
          method: "POST",
          headers: {
            "content-type": "text/plain;charset=UTF-8",
            "x-client-os-type": "others",
            "x-frontend-id": "6",
            "x-frontend-version": "0",
          },
          body: JSON.stringify(
            NicoCommentApi.buildThreadRequest(nvComment, target, additionals)
          ),
        });
        let payload;
        try {
          payload = await response.json();
        } catch (error) {
          const invalidResponse = new Error("コメント API の応答を解釈できません");
          invalidResponse.code = `HTTP_${response.status}`;
          throw invalidResponse;
        }

        const errorCode = NicoCommentApi.getApiErrorCode(
          payload,
          response.status
        );
        if (errorCode === "TOO_MANY_REQUESTS" || errorCode === "HTTP_429") {
          logger("コメント API の制限中です。60秒待ちます。");
          await sleep(60000);
          continue;
        }
        if (errorCode === "EXPIRED_TOKEN" && !refreshed) {
          logger("thread key を更新しています…");
          await refreshThreadKey();
          refreshed = true;
          continue;
        }
        if (errorCode || !payload?.data) {
          const apiError = new Error(
            `コメント API がエラーを返しました (${errorCode || "UNKNOWN"})`
          );
          apiError.code = errorCode || "UNKNOWN";
          throw apiError;
        }
        return payload;
      }
    };

    logger(
      `${activeTargets.length}スレッドをそれぞれ${pageLimit}回読み込みます。`
    );

    for (const target of activeTargets) {
      let cursor = startCursor;
      let historical = true;
      let previousPage = [];
      for (let page = 0; page < pageLimit; page++) {
        const additionals = historical
          ? { res_from: -1000, when: cursor }
          : {};
        let response;
        try {
          response = await requestThread(target, additionals);
        } catch (error) {
          if (
            historical &&
            (error.code === "INVALID_TOKEN" || error.code === "HTTP_400")
          ) {
            historical = false;
            previousPage = [];
            page--;
            logger("ログアウト状態のため、取得可能な最新コメントを読み込みます。");
            continue;
          }
          throw error;
        }

        const pageComments = NicoCommentApi.getThreadComments(
          response,
          target.fork
        );
        if (pageComments.length === 0) break;
        if (
          historical &&
          previousPage.length > 0 &&
          !NicoCommentApi.hasPageProgress(previousPage, pageComments)
        ) {
          break;
        }

        if (target.fork === "owner") {
          ownerComments.push(
            ...NicoCommentApi.mergeUniqueComments(ownerComments, pageComments).slice(
              ownerComments.length
            )
          );
        } else {
          comments.push(
            ...NicoCommentApi.mergeUniqueComments(comments, pageComments).slice(
              comments.length
            )
          );
        }

        completedPages++;
        updateProgress();
        logger(
          `[${completedPages}/${totalPages}]: コメ番${
            pageComments[0]?.no ?? "?"
          }まで読み込みました`
        );

        if (!historical || pageComments[0]?.no <= 1) break;
        const oldestAt = Date.parse(pageComments[0]?.postedAt);
        const nextCursor = Math.floor(oldestAt / 1000);
        if (!Number.isFinite(nextCursor) || nextCursor >= cursor) break;
        cursor = nextCursor;
        previousPage = pageComments;

        if (pageLimit > 20 && !NG_LIST_COMMAND.includes("speedmode")) {
          await sleep(1000);
        }
      }
    }

    CommentLoadingScreenWrapper.style.background = "rgba(0, 0, 0, .9)";
    logger(`${comments.length}件のコメントを読み込みました`);
    logger("NG設定を適用しています");

    COMMENT.length = 0;
    COMMENT.push(
      {
        commentCount: comments.length,
        comments: await COMMENT_CONTROL(comments),
        fork: "comment-zouryou",
        id: 0,
      },
      {
        commentCount: ownerComments.length,
        comments: ownerComments,
        fork: "owner",
        id: 1,
      }
    );
    document.getElementById("reload_niconicomments").onclick = async () => {
      COMMENT[0].comments = await COMMENT_CONTROL(comments);
      COMMENT[0].commentCount = comments.length;
      load_NiconiComments();
      clearInterval(list_interval);
      LIST_COMMENT();
    };

    logger("描画準備中");
    if (zenkomeButton) zenkomeButton.disabled = false;
    document.getElementById("progress_left").style.width = "0%";
    PLAYCOMMENT();
  } catch (error) {
    console.error("[コメント増量] コメント取得エラー", error);
    logger(`コメントの取得に失敗しました: ${error.message}`);
    if (loading) loading.style.display = "none";
    if (zenkomeButton) zenkomeButton.disabled = false;
  }
}

let niconiComments, comment_list_active;
let observer = new MutationObserver(function () {
  if (href.split("?")[0] !== location.href.split("?")[0]) {
    DRAW_ = false;
    clearInterval(list_interval);
    const loaded = document.getElementById("loaded");
    if (loaded) {
      loaded.style.zIndex = "0";
      loaded.style.visibility = "hidden";
    }
    const wrapperButtons = document.getElementById("wrapper_buttons");
    if (wrapperButtons) {
      wrapperButtons.style.height = "0px";
      wrapperButtons.style.opacity = "0";
    }
    const scroll = document.getElementsByClassName("scroll")[0];
    if (scroll) scroll.style.height = "calc(100% - 171px)";
    const nativeRenderer = document.getElementsByClassName("CommentRenderer")[0];
    if (nativeRenderer) nativeRenderer.style.display = "block";
    if (CustomVideoContainer) CustomVideoContainer.style.display = "none";
    if (link) link.style.visibility = "hidden";
    const button = document.getElementById("zenkomebutton");
    if (button) button.disabled = false;
    if (pipVideoElement) {
      pipVideoElement.pause();
      pipVideoElement.style.display = "none";
    }
    if (CustomVideoContainer) CustomVideoContainer.remove();
    document.getElementById("allcommentsetting")?.remove();
    CustomVideoContainer = null;
    CommentLoadingScreenWrapper = null;
    const reloadButton = document.getElementById("reload_niconicomments");
    if (reloadButton) reloadButton.disabled = true;
    const loadButtonText = document.getElementsByClassName("loadbutton_text")[0];
    if (loadButtonText) loadButtonText.innerText = "読み込み開始！";
    const progress = document.getElementById("progress_left");
    if (progress) progress.style.width = "100%";
    href = location.href;
    COMMENT = [];
    startPreparePolling();

    setTimeout(() => {
      const auto = document.getElementById("isauto");
      const setting = document.getElementById("allcommentsetting");
      if (auto?.checked === true && setting) {
        setting.style.display = "block";
        CommentLimit = document.getElementById("auto_num").value;
        //CommentLimit = CommentLimit > 5 ? 5 : CommentLimit;
        LOADCOMMENT("auto");
        if (button) button.disabled = true;
      }
    }, 1000);
  }
});
let href = location.href;
function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}
function getXMLString(json) {
  var parser = new DOMParser();
  var xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += `<packet><thread thread="${apiData.comment.threads[0].id}" />
  <global_num_res thread="${apiData.comment.threads[0].id}" num_res="${json[0].commentCount}"/>
  <leaf thread="${apiData.comment.threads[0].id}" count="${json[0].commentCount}"/>`;
  for (const comments of json[0].comments) {
    xml += `<chat thread="${apiData.comment.threads[0].id}" no="${
      comments.no
    }" vpos="${Math.floor(comments.vposMs / 10)}" date="${Math.floor(
      new Date(comments.postedAt).getTime() / 1000
    )}" date_usec="00000" premium="${
      comments.isPremium ? "1" : "0"
    }" anonymity="1" user_id="${
      comments.userId
    }" mail="${comments.commands.join(" ")}">${escapeHtml(comments.body)}</chat>
`;
  }
  xml += "</packet>";
  var xmlDoc = parser.parseFromString(xml, "application/xml");
  return xml;
}
let download_comment;
let blob;
observer.observe(document, { childList: true, subtree: true });

function load_NiconiComments() {
  console.log(COMMENT);
  niconiComments = new NiconiComments(zouryouCanvasElement, COMMENT, {
    video: document.getElementById("iscanvas").checked
      ? videoElement
      : undefined,
    enableLegacyPiP: true,
    scale: document.getElementById("bar_textsize").value * 0.01,
    keepCA: document.getElementById("checkbox4").checked,
    showCommentCount: document.getElementById("isdebug").checked,
    showFPS: document.getElementById("isdebug").checked,
    config: (Config = {
      contextStrokeOpacity: Number(document.getElementById("bar_stroke").value),
      contextLineWidth: 3.5,
    }),
    format: "v1",
  });
}
function ADDCOMMENT(val, pos, mail) {
  niconiComments.addComments({
    vpos: pos,
    content: val,
    owner: false,
    premium: true,
    mail: ["184", "nico:waku:#fff321"].concat(mail),
    layer: -1,
  });
}
function PLAYCOMMENT() {
  const customContainer = document.getElementsByClassName(
    "CustomVideoContainer"
  )[0];
  if (!customContainer) return;
  customContainer.style.display = "block";
  const commentRenderers = document.getElementsByClassName("CommentRenderer");
  if (commentRenderers.length === 0) {
    PlayerContainer = document.querySelector('[data-name="content"]');
    PlayerContainer.children[0].after(CustomVideoContainer);
  }

  zouryouCanvasElement = document.getElementById("zouryou_comment");

  let draw;
  console.log(COMMENT);
  async function setup() {
    //DefaultVideoContainer.style.display = "block";

    if (document.getElementById("isxml").checked) {
      download_comment = getXMLString(COMMENT);
      link.download = apiData.video.id + ".xml";
      document.getElementsByClassName("loadbutton_text")[0].innerText =
        "XMLをダウンロード";
    } else {
      download_comment = [JSON.stringify(COMMENT)];
      link.download = apiData.video.id + ".json";
      document.getElementsByClassName("loadbutton_text")[0].innerText =
        "JSONをダウンロード";
    }

    blob = new Blob([download_comment], { type: "text/plain" });

    link.style.visibility = "visible";
    link.href = URL.createObjectURL(blob);

    const currentPlayer = NicoCommentApi.findPlayerElements(document);
    videoElement =
      currentPlayer?.nativeVideo ||
      document.querySelector('video:not([title="Advertisement"])');
    const width = Number(videoElement?.videoWidth) ||
      Number(currentPlayer?.stage?.clientWidth);
    const height = Number(videoElement?.videoHeight) ||
      Number(currentPlayer?.stage?.clientHeight);
    aspect = width > 0 && height > 0 ? width / height : 16 / 9;
    console.log(aspect);

    zouryouCanvasElement.style.opacity =
      document.getElementById("bar_alpha").value * 0.01;

    load_NiconiComments();
    document.getElementById("reload_niconicomments").disabled = false;

    loading.style.display = "none";
    CustomVideoContainer.style.display = "block";
    console.log(niconiComments);

    DRAW_ = true;
    function draw() {
      if (
        !videoElement ||
        !videoElement.isConnected ||
        videoElement.title === "Advertisement"
      ) {
        videoElement =
          NicoCommentApi.findPlayerElements(document)?.nativeVideo ||
          document.querySelector('video:not([title="Advertisement"])');
        if (document.getElementById("iscanvas").checked) {
          niconiComments.video = videoElement || undefined;
        }
      }
      niconiComments.drawCanvas(
        Math.floor((videoElement?.currentTime || 0) * 100)
      );
      if (DRAW_ == false) return;

      setTimeout(draw, 1000 / document.getElementById("bar_fps").value);
    }
    draw();

    console.log(videoElement);
    const nativeComment = document.querySelector('[data-name="comment"]');
    if (nativeComment) nativeComment.style.display = "none";
    //document.getElementsByClassName("CommentRenderer")[0].style.display =
    //  "none";
    //
    pipVideoElement.srcObject = zouryouCanvasElement.captureStream(60);
    pipVideoElement.muted = true;
    pipVideoElement.volume = 0;
    pipVideoElement.play().catch(() => {});

    //void DANMAKU_SUPER();
    setTimeout(() => {
      document.getElementById("wrapper_buttons").style.height = "30px";
      document.getElementById("wrapper_buttons").style.opacity = "1";
      document.getElementsByClassName("scroll")[0].style.height =
        "calc(100% - 221px)";
    }, 200);
  }
  document.getElementById("loaded").style.zIndex = "2";
  const comment_list = document.getElementById("comment_list");
  document
    .getElementById("comment_list_open")
    .addEventListener("click", function () {
      comment_list.style.visibility = "visible";
      comment_list_active = true;
    });
  document
    .getElementById("comment_list_exit")
    .addEventListener("click", function () {
      comment_list.style.visibility = "hidden";
      comment_list_active = false;
    });
  LIST_COMMENT();
  let Comment_Show_Button = document.querySelector(
    "[aria-label='コメントを非表示にする']"
  );
  if (Comment_Show_Button == undefined) {
    Comment_Show_Button = document.querySelector(
      "[aria-label='コメントを表示する']"
    );
  }
  if (Comment_Show_Button) {
    let Comment_SH = new MutationObserver(function () {
      CustomVideoContainer.style.zIndex =
        Comment_Show_Button.getAttribute("aria-label") == "コメントを表示する"
          ? 0
          : 1;
    });
    Comment_SH.observe(Comment_Show_Button, { childList: true, subtree: true });
  }
  pipVideoElement.style.display = document.getElementById("iscanvas").checked
    ? "block"
    : "none";
  zouryouCanvasElement.style.display = document.getElementById("iscanvas")
    .checked
    ? "none"
    : "block";

  //document
  //  .getElementsByClassName("ActionButton CommentPostButton")[0]
  //  .addEventListener("click", () => {
  //    ADDCOMMENT(
  //      document.querySelector(".CommentInput > textarea").value,
  //      Math.floor(videoElement.currentTime * 100),
  //      document
  //        .getElementsByClassName("CommentCommandInput")[0]
  //        .value.split(" ")
  //    );
  //  });
  //
  //document
  //  .querySelector(".CommentInput > textarea")
  //  .addEventListener("keydown", (e) => {
  //    if (
  //      e.keyCode === 13 &&
  //      document.querySelector(".CommentInput > textarea").value != ""
  //    ) {
  //      ADDCOMMENT(
  //        document.querySelector(".CommentInput > textarea").value,
  //        Math.floor(videoElement.currentTime * 100),
  //        document
  //          .getElementsByClassName("CommentCommandInput")[0]
  //          .value.split(" ")
  //      );
  //    }
  //  });
  setTimeout(setup, 1000);
}
let lastCurrentTime = -1;
/*
async function DANMAKU_SUPER() {
  videoElement.setAttribute("width", 360 * aspect);
  videoElement.setAttribute("height", 360);
  let ismask = document.getElementById("ismask");
  let ctx = SuperDanmakuCanvasElement.getContext("2d");
  function mask(Imagedata) {
    zouryouCanvasElement.style.setProperty(
      "-webkit-mask-image",
      `url(${Imagedata})`
    );
    zouryouCanvasElement.style.setProperty(
      "-webkit-mask-size",
      `${videoElement.clientWidth}px ${videoElement.clientHeight}px `
    );
    zouryouCanvasElement.style.setProperty(
      "-webkit-mask-position-x",
      `${
        (videoElement.clientWidth - videoElement.clientHeight * aspect) / 2
      }px `
    );
  }
  function segmentPerson(img) {
    const option = {
      flipHorizontal: false,
      internalResolution: "high",
      segmentationThreshold: Number(
        document.getElementById("bar_segment").value
      ),
      maxDetections: 5,
      scoreThreshold: 0.3,
      nmsRadius: 20,
      minKeypointScore: 0.6,
      refineSteps: 10,
    };

    return net.segmentPerson(img, option);
  }

  async function drawCanvas() {
    if (!net || videoElement.currentTime === lastCurrentTime) return;
    lastCurrentTime = videoElement.currentTime;
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(360 * aspect, 0, 640 - 360 * aspect, 360);
    const segmentation = await segmentPerson(videoElement);
    const colorMask = bodyPix.toMask(segmentation, false);
    ctx.putImageData(colorMask, 0, 0);

    data = SuperDanmakuCanvasElement.toDataURL("image/png");
    mask(data);
  }
  if (net) return BodynetPix;
  net = await bodyPix.load();
  setInterval(() => {
    if (ismask.checked) {
      drawCanvas();
    }
  }, 100);
}*/
let list_interval;
function LIST_COMMENT() {
  COMMENT[0].comments.sort(function (a, b) {
    if (a.vposMs < b.vposMs) return -1;
    if (a.vposMs > b.vposMs) return 1;
    return 0;
  });

  let now_comment_pos = document.getElementById("now_comment_pos");
  list_interval = setInterval(() => {
    if (videoElement.currentTime === lastCurrentTime) return;
    lastCurrentTime = videoElement.currentTime;
    if (!comment_list_active) return;

    let passIndex = COMMENT[0].comments.findIndex(function (element) {
      return element.vposMs > Math.floor(videoElement.currentTime * 1000);
    });
    now_comment_pos.innerText = `現在のコメント位置${passIndex}/${COMMENT[0].comments.length}`;
    document.getElementById("comment_list_comments").innerHTML = "";
    for (let i = 0; i < 30; i++) {
      let body = COMMENT[0].comments[passIndex - i]?.body;
      let nicoru = COMMENT[0].comments[passIndex - i]?.nicoruCount || "";
      if (body == undefined) body = "";
      let commentElement = document.createElement("div");
      commentElement.className = "list_comment";
      if (body != "") {
        commentElement.innerHTML = `<div style="padding:0px 2px;display:flex;background-color:rgba(243, 186, 0, ${
          nicoru / 10
        })"><p style="width:95%;">${body}</p><p style="padding-top:4px;width:5%;">${nicoru}</p></div>`;
        document
          .getElementById("comment_list_comments")
          .prepend(commentElement);
      }
    }
  }, 50);
}

const logger = (msg, load) => {
  const p = document.createElement("p");
  p.innerText = msg;
  if (load != false) {
    loading_text.innerText = msg;
  }

  console.log(msg);
  CommentLoadingScreen.appendChild(p);
  CommentLoadingScreenWrapper.scrollBy(0, CommentLoadingScreen.clientHeight);
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

let NG_LIST_COMMAND = [];
let NG_LIST_COMMENT = [];
const COMMENT_CONTROL = (comments) => {
  return new Promise((resolve) => {
    let ng_score = document.getElementById("ng_score").value;
    let nicoru_limit = document.getElementById("nicoru_num");
    let premium_filter = document.getElementById("premium_filter");

    console.log(ng_score);
    for (const i in comments) {
      const comment = comments[i];
      if (comment.commands === undefined) {
        comment.commands = [];
      } else {
        comment.commands = comment.commands.map((value) => value.toLowerCase());
      }
    }
    NG_LIST_COMMAND.forEach((NG) => {
      let commands = NG.toLowerCase().split(" ");
      comments = comments.filter((comment) => {
        let ng_point = commands.length;
        commands.forEach((command) => {
          if (comment.commands.includes(command)) {
            ng_point -= 1;
          }
        });
        return ng_point > 0;
      });
    });
    NG_LIST_COMMENT.forEach(
      (NG) =>
        (comments = comments.filter(
          (comment) => comment.body.includes(NG) === false
        ))
    );
    comments = comments.filter((comment) => comment.score >= ng_score);
    comments = comments.filter(
      (comment) => comment.nicoruCount >= nicoru_limit.value
    );
    if (premium_filter.checked) {
      comments = comments.filter((comment) => comment.isPremium === true);
    }

    logger(comments.length + "件に減りました");
    resolve(comments);
  });
};

function PREPARE(observe) {
  if (document.getElementById("allcommentsetting")) return false;
  const playerElements = NicoCommentApi.findPlayerElements(document);
  const settingsMount = NicoCommentApi.findSettingsMount(document);
  if (!playerElements || !settingsMount || typeof setting_html !== "string") {
    return false;
  }
  settingsMount.insertAdjacentHTML("afterbegin", setting_html);
  let customStyle = document.createElement("style");
  customStyle.innerHTML =
    ".CustomVideoContainer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}[data-name=\"content\"],[data-styling-name=\"fullscreen-target\"]{position:relative;}";
  document.body.appendChild(customStyle);
  CommentRenderer = document.getElementsByClassName("CommentRenderer")[0];
  VideoSymbolContainer = document.getElementsByClassName(
    "VideoSymbolContainer"
  )[0];
  PlayerContainer = playerElements.content;
  //DefaultVideoContainer = document.getElementsByClassName(
  //  "InView VideoContainer"
  //)[0];
  CustomVideoContainer = document.createElement("div");
  CustomVideoContainer.id = "comment-zouryou-overlay";
  CustomVideoContainer.innerHTML = `<div class="CommentRenderer"><canvas id="zouryou_comment" width="1920" height="1080"></canvas><canvas id="SuperDanmakuCanvasElement" width="640" height="360"></canvas><video id="pipVideoElement"></video></div>`;
  CustomVideoContainer.classList.add("CustomVideoContainer", "InView");
  for (const wave of document.getElementsByClassName("wave")) {
    wave.style.background = `url(${wave_image})`;
    wave.style.backgroundSize = "1000px 50px";
  }
  const logo = document.getElementById("logo");
  if (logo) logo.src = logo_image;
  const loadingImage = document.getElementById("loading_image");
  if (loadingImage) loadingImage.src = load_image;

  playerElements.video.after(CustomVideoContainer);
  zouryouCanvasElement = document.getElementById("zouryou_comment");
  SuperDanmakuCanvasElement = document.getElementById(
    "SuperDanmakuCanvasElement"
  );
  videoElement =
    playerElements.nativeVideo ||
    document.querySelector('video:not([title="Advertisement"])');
  //let seekBar = document.getElementsByClassName("SeekBar")[0];
  //if (seekBar.classList.contains("is-disabled")) {
  //  seekBar.classList.remove("is-disabled");
  //}

  SuperDanmakuCanvasElement.width = 640;
  SuperDanmakuCanvasElement.height = 360;

  console.log(videoElement);
  pipVideoElement = document.getElementById("pipVideoElement");
  CommentLoadingScreenWrapper = document.createElement("div");
  CommentLoadingScreenWrapper.id = "CommentLoadingScreenWrapper";
  CommentLoadingScreenWrapper.innerHTML =
    '<div id="CommentLoadingScreen"></div>';
  document
    .getElementsByClassName("CustomVideoContainer InView")[0]
    .appendChild(CommentLoadingScreenWrapper);

  CommentLoadingScreen = document.getElementById("CommentLoadingScreen");
  link = document.getElementById("loaded");
  CustomVideoContainer.style.display = "none";
  CustomVideoContainer.style.zIndex = "1";
  CustomVideoContainer.style.pointerEvents = "none";
  zouryouCanvasElement.style = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;display:block;object-fit:contain;`;
  SuperDanmakuCanvasElement.style =
    "position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;display:block;opacity:0;";
  pipVideoElement.style =
    "position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:all;display:none";
  pipVideoElement.muted = true;
  pipVideoElement.volume = 0;
  pipVideoElement.onpause = () => {
    pipVideoElement.muted = true;
    pipVideoElement.volume = 0;
    pipVideoElement.play().catch(() => {});
  };

  OLD_DATE = document.getElementById("zenkome-date");
  OLD_TIME = document.getElementById("zenkome-time");
  const setting = document.getElementById("allcommentsetting");

  document.getElementsByClassName("ZenkomeCloseButton")[0].addEventListener(
    "click",
    () => {
      setting.style.display = "none";
    },
    false
  );
  OLD_DATE.min = "2007-03-03";
  OLD_DATE.max = new Date().getFullYear() + "-12-31";
  const val_stroke = document.getElementsByClassName("range_val");
  const bar_stroke = document.getElementsByClassName("range_bar");
  let get_zouryou_config = localStorage.getItem("zouryou_config");
  let zouryou_config;
  let comment_num,
    comment_size,
    stroke_opacity,
    comment_opacity,
    fps,
    pip,
    keepCA,
    auto,
    auto_num,
    xml,
    ngscore,
    nicoru_limit,
    premium_filter,
    version;
  function CONFIG() {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    const defaults = {
      num: 5,
      bar_textsize: 100,
      bar_stroke: 0.35,
      bar_alpha: 100,
      bar_fps: 30,
      keepCA: false,
      mode: "html5",
      pip: false,
      auto: false,
      auto_num: 2,
      xml: false,
      ngscore: "-Infinity",
      nicoru_limit: 0,
      premium_filter: false,
      version: "7.5",
    };
    let storedConfig = {};
    try {
      storedConfig =
        get_zouryou_config && get_zouryou_config !== "[null]"
          ? JSON.parse(get_zouryou_config)
          : {};
    } catch (error) {
      console.warn("[コメント増量] 設定を初期化します", error);
    }

    zouryou_config = { ...defaults, ...storedConfig };
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));

    comment_num = document.getElementById("load_num");
    comment_size = document.getElementById("bar_textsize");
    stroke_opacity = document.getElementById("bar_stroke");
    comment_opacity = document.getElementById("bar_alpha");
    fps = document.getElementById("bar_fps");
    pip = document.getElementById("iscanvas");
    keepCA = document.getElementById("checkbox4");
    auto = document.getElementById("isauto");
    auto_num = document.getElementById("auto_num");
    xml = document.getElementById("isxml");
    ngscore = document.getElementById("ng_score");
    nicoru_limit = document.getElementById("nicoru_num");
    premium_filter = document.getElementById("premium_filter");
    comment_num.value = zouryou_config.num;
    comment_size.value = zouryou_config.bar_textsize;
    stroke_opacity.value = zouryou_config.bar_stroke;
    comment_opacity.value = zouryou_config.bar_alpha;
    pip.checked = zouryou_config.pip;
    keepCA.checked = zouryou_config.keepCA;
    auto.checked = zouryou_config.auto;
    fps.value = zouryou_config.bar_fps;
    auto_num.value = zouryou_config.auto_num;
    xml.checked = zouryou_config.xml;
    nicoru_limit.value = zouryou_config.nicoru_limit || 0;
    premium_filter.checked = zouryou_config.premium_filter || false;
    ngscore.value = zouryou_config.ngscore || "-Infinity";
    for (let i = 0; i < Math.min(val_stroke.length, bar_stroke.length); i++) {
      val_stroke[i].innerText = bar_stroke[i].value;
    }

    let l = document.getElementById("load_num");
    if (l.value.length >= 4) {
      l.style.width = "60%";
    } else {
      l.style.width = "50%";
    }
  }

  let ng_storage = localStorage.getItem("ng_storage");
  let ngarray,
    SETTING_NG_LIST_COMMENT,
    SETTING_NG_LIST_COMMAND,
    SETTING_NG_LIST_ISEASY;

  function NG_DELETE(type, i) {
    ngarray[type].splice(i, 1);
    localStorage.setItem("ng_storage", JSON.stringify(ngarray));
    setTimeout(() => {
      ng_element();
    }, 100);
  }

  function ng_element() {
    ng_storage = localStorage.getItem("ng_storage");
    NG_LIST_COMMAND = [];
    NG_LIST_COMMENT = [];
    SETTING_NG_LIST_ISEASY = document.getElementById("iseasy");
    SETTING_NG_LIST_COMMENT = document.getElementById("ng_comment");
    SETTING_NG_LIST_COMMAND = document.getElementById("ng_command");
    loading_text = document.getElementById("loading_text");
    loading = document.getElementById("loading");
    SETTING_NG_LIST_COMMAND.innerHTML = "";
    SETTING_NG_LIST_COMMENT.innerHTML = "";

    if (ng_storage == null || ng_storage == "[null]") {
      localStorage.setItem(
        "ng_storage",
        JSON.stringify({ command: [], comment: [], easy: false })
      );
    } else {
      ngarray = JSON.parse(ng_storage);
      ngarray.command.forEach((command) => NG_LIST_COMMAND.push(command));
      ngarray.comment.forEach((comment) => NG_LIST_COMMENT.push(comment));

      SETTING_NG_LIST_COMMENT.innerHTML = "";
      SETTING_NG_LIST_COMMAND.innerHTML = "";
      for (let i = 0; i < NG_LIST_COMMENT.length; i++) {
        SETTING_NG_LIST_COMMENT.innerHTML += `<li>${NG_LIST_COMMENT[i]}
          <button id="del_e${i}" class="deletebutton" ></button></li>`;
      }
      for (let i = 0; i < NG_LIST_COMMENT.length; i++) {
        document.getElementById(`del_e${i}`).onclick = function (e) {
          NG_DELETE("comment", i);
        };
      }
      for (let i = 0; i < NG_LIST_COMMAND.length; i++) {
        SETTING_NG_LIST_COMMAND.innerHTML += `<li>${NG_LIST_COMMAND[i]}
          <button id="del_a${i}"  class="deletebutton" ></button></li>`;
      }
      for (let i = 0; i < NG_LIST_COMMAND.length; i++) {
        document.getElementById(`del_a${i}`).onclick = function (e) {
          NG_DELETE("command", i);
        };
      }
      SETTING_NG_LIST_ISEASY.checked = ngarray.easy;
    }
  }

  if (!observe) {
    ng_element();
    CONFIG();
  }
  document.getElementById("form_command").onclick = () => {
    ng_storage = localStorage.getItem("ng_storage");
    ngarray = JSON.parse(ng_storage);
    let ng_add = window.prompt("新たに追加するNGコマンドを入力してください。");
    ngarray.command.push(ng_add);
    localStorage.setItem("ng_storage", JSON.stringify(ngarray));

    setTimeout(() => {
      ng_element();
    }, 100);
  };
  document.getElementById("form_comment").onclick = () => {
    ng_storage = localStorage.getItem("ng_storage");
    ngarray = JSON.parse(ng_storage);
    let ng_add = window.prompt("新たに追加するNGコメントを入力してください。");
    ngarray.comment.push(ng_add);
    localStorage.setItem("ng_storage", JSON.stringify(ngarray));

    setTimeout(() => {
      ng_element();
    }, 100);
  };
  document.getElementById("iseasy").onclick = () => {
    ng_storage = localStorage.getItem("ng_storage");
    ngarray = JSON.parse(ng_storage);
    ngarray.easy = !ngarray.easy;
    localStorage.setItem("ng_storage", JSON.stringify(ngarray));
    setTimeout(() => {
      ng_element();
    }, 100);
  };
  document.getElementById("load_num").oninput = () => {
    let l = document.getElementById("load_num");
    if (l.value.length >= 4) {
      l.style.width = "60%";
    } else {
      l.style.width = "50%";
    }

    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.num = document.getElementById("load_num").value;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("checkbox4").onclick = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.keepCA = !zouryou_config.keepCA;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("iscanvas").onclick = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.pip = !zouryou_config.pip;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("isauto").onclick = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.auto = !zouryou_config.auto;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("isxml").onclick = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.xml = !zouryou_config.xml;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("auto_num").oninput = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.auto_num = document.getElementById("auto_num").value;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("nicoru_num").oninput = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.nicoru_limit = document.getElementById("nicoru_num").value;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("ng_score").onchange = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.ngscore = document.getElementById("ng_score").value;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };
  document.getElementById("premium_filter").onclick = () => {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    zouryou_config = JSON.parse(get_zouryou_config);
    zouryou_config.premium_filter = !zouryou_config.premium_filter;
    localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
  };

  for (let i = 0; i < val_stroke.length; i++) {
    bar_stroke[i].addEventListener(
      "input",
      function (e) {
        val_stroke[i].innerText = e.target.value;
        if (this.id == "bar_alpha") {
          zouryouCanvasElement.style.opacity = e.target.value * 0.01;
        }
        get_zouryou_config = localStorage.getItem("zouryou_config");
        zouryou_config = JSON.parse(get_zouryou_config);
        zouryou_config[bar_stroke[i].id] = e.target.value;
        localStorage.setItem("zouryou_config", JSON.stringify(zouryou_config));
      },
      false
    );
  }

  document.getElementById("islogger").addEventListener("change", function () {
    CommentLoadingScreenWrapper.style.display = this.checked ? "block" : "none";
  });
  document.getElementById("isxml").addEventListener("change", function () {
    if (document.getElementById("isxml").checked) {
      download_comment = getXMLString(COMMENT);
      link.download = apiData.video.id + ".xml";
      document.getElementsByClassName("loadbutton_text")[0].innerText =
        "XMLをダウンロード";
    } else {
      download_comment = [JSON.stringify(COMMENT)];
      link.download = apiData.video.id + ".json";
      document.getElementsByClassName("loadbutton_text")[0].innerText =
        "JSONをダウンロード";
    }

    blob = new Blob([download_comment], { type: "text/plain" });
    link.style.visibility = "visible";
    link.href = URL.createObjectURL(blob);
  });
  document.getElementById("ismask").addEventListener("change", function () {
    if (!this.checked) {
      setTimeout(() => {
        zouryouCanvasElement.style.setProperty("-webkit-mask-image", ``);
      }, 100);
    }
  });

  document.getElementById("iscanvas").addEventListener("change", function () {
    niconiComments.video = this.checked ? videoElement : null;
    pipVideoElement.style.display = this.checked ? "block" : "none";
    zouryouCanvasElement.style.display = this.checked ? "none" : "block";
  });

  document.getElementById("isdebug").addEventListener("change", function () {
    niconiComments.showCommentCount =
      document.getElementById("isdebug").checked;
  });
  if (document.getElementById("isauto").checked == true) {
    setting.style.display = "block";
    CommentLimit = document.getElementById("auto_num").value;
    CommentLimit = CommentLimit > 5 ? 5 : CommentLimit;
    LOADCOMMENT("auto");
    document.getElementById("zenkomebutton").disabled = true;
  }
  document.getElementById("zenkomebutton").onclick = () => {
    let num = document.getElementById("load_num").value;
    CommentLimit = num !== "" ? Number(num) : 5;
    document.getElementById("zenkomebutton").disabled = true;

    LOADCOMMENT();
  };

  ////
  let fullScreenButton = document.querySelector(
    "[aria-label='全画面表示する']"
  );
  if (fullScreenButton == undefined) {
    fullScreenButton = document.querySelector(
      "[aria-label='全画面表示を終了']"
    );
  }
  if (fullScreenButton) {
    let fullScreen = new MutationObserver(function () {
      const allCommentSetting = document.getElementById("allcommentsetting");
      if (!allCommentSetting) return;
      allCommentSetting.style.visibility =
        fullScreenButton.getAttribute("aria-label") == "全画面表示する"
          ? "visible"
          : "hidden";
    });
    fullScreen.observe(fullScreenButton, { childList: true, subtree: true });
  }

  setTimeout(function () {
    function ShowButton() {
      console.log(1);
      if (document.getElementById("AllCommentViewButton") != undefined) return;
      let settingButton = document.querySelector("[aria-label='設定']");
      if (settingButton != undefined) {
        document.querySelector("[aria-label='設定']").insertAdjacentHTML(
          "beforebegin",
          `
          <button aria-label="コメント増量" style="width:26px;color:white" data-scope="tooltip" data-part="trigger" id="AllCommentViewButton" dir="ltr" data-state="closed" class="cursor_pointer" type="button" tabindex="0" title="コメント増量">
          ALL
          </button> 
        `
        );
        document.getElementById("AllCommentViewButton").addEventListener(
          "click",
          () => {
            setting.style.display = "block";
          },
          false
        );
      }
    }

    ShowButton();
  }, 1000);
  return true;
}

let index_html = chrome.runtime.getURL("files/setting.html");
let wave_image = chrome.runtime.getURL("lib/wave.png");
let logo_image = chrome.runtime.getURL("lib/logo4.png");
let load_image = chrome.runtime.getURL("lib/load.svg");
let setting_html;
fetch(index_html)
  .then((r) => r.text())
  .then((html) => {
    setting_html = html;
  })
  .catch((error) => {
    console.error("[コメント増量] 設定画面の取得に失敗しました", error);
  });

function startPreparePolling() {
  const prepareTimer = setInterval(() => {
    if (
      NicoCommentApi.findPlayerElements(document) &&
      NicoCommentApi.findSettingsMount(document) &&
      typeof setting_html === "string" &&
      PREPARE()
    ) {
      clearInterval(prepareTimer);
    }
  }, 50);
  return prepareTimer;
}

startPreparePolling();
  console.log("✨コメント増量 v7.5\nCopyright (c) 2022 tanbatu.");
