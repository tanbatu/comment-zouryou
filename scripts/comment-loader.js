// 視聴情報とコメントを取得し、終了した取得処理の結果は破棄する。
let commentLoadController;
function cancelCommentLoad() {
  commentLoadController?.abort();
  commentLoadController = undefined;
}

async function LOADCOMMENT(mode) {
  cancelCommentLoad();
  const controller = new AbortController();
  commentLoadController = controller;
  const checkLoad = () => {
    if (controller.signal.aborted)
      throw new DOMException("コメント取得を中止しました", "AbortError");
  };
  // 通信と本文の読み込み後に中止を確認し、古い結果を反映させない。
  const fetch = async (...args) => {
    checkLoad();
    const response = await globalThis.fetch(args[0], {
      ...args[1],
      signal: controller.signal,
    });
    checkLoad();
    return {
      status: response.status,
      headers: response.headers,
      json: async () => {
        const data = await response.json();
        checkLoad();
        return data;
      },
      text: async () => {
        const data = await response.text();
        checkLoad();
        return data;
      },
    };
  };
  // APIの待機も終了時に即座に解除する。
  const sleep = (ms) =>
    new Promise((resolve, reject) => {
      checkLoad();
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("コメント取得を中止しました", "AbortError"));
      };
      const timer = setTimeout(() => {
        controller.signal.removeEventListener("abort", abort);
        resolve();
      }, ms);
      controller.signal.addEventListener("abort", abort, { once: true });
    });
  try {
    attachCommentOverlay();

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
      "https://www.nicovideo.jp/watch/" + match[1] + "?responseType=json",
    );
    const data = await req.json();
    const response = data?.data?.response;
    const currentData = response?.$watchV4?.data;
    apiData = {
      ...response,
      ...currentData,
      comment: currentData?.comment ?? response?.comment,
      video: currentData?.video ?? response?.video,
    };
    console.log(apiData);

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
      `${nvComment.params.targets.length}スレッドをそれぞれ${CommentLimit}回読み込みます。`,
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
        "https://flapi.nicovideo.jp/api/getthreadkey?thread=" +
        threads[2]["id"];
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
          const requestOptions = {
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
          };
          let req, res;
          // CORSで遮断された応答はステータスを読めないため、通信失敗も待機して再試行する。
          for (let retry = 0; ; retry++) {
            try {
              req = await fetch(
                `${nvComment.server}/v1/threads`,
                requestOptions,
              );
              if (req.status >= 500 && req.status <= 599) {
                throw new TypeError(
                  `コメントAPIの一時エラー: HTTP ${req.status}`,
                );
              }
              res =
                req.status === 429
                  ? { meta: { errorCode: "TOO_MANY_REQUESTS" } }
                  : await req.json();
              break;
            } catch (error) {
              checkLoad();
              if (error.name !== "TypeError" || retry >= 5) throw error;
              //60秒だと足りないため70秒を基準に指数関数的に増やす。最大280秒。
              const waitSeconds = Math.min(70 * 2 ** retry, 240);
              for (let remaining = waitSeconds; remaining > 0; remaining--) {
                logger(
                  `[${fetchedThreadCount + j}/${totalThreadCount}]: 通信に失敗しました。取得済みコメントを保持して再試行します（${retry + 1}/5）。あと${remaining}秒`,
                );
                await sleep(1000);
              }
            }
          }
          // HTTP 429では本文を解析しない。HTMLや空の応答でも待機できるようにする。
          if (res?.meta?.errorCode === "TOO_MANY_REQUESTS") {
            // 読み取れる場合はサーバーの待機指定を優先し、指定がなければ60秒待つ。
            const retryAfter = req.headers?.get("Retry-After");
            const retrySeconds =
              retryAfter && /^\d+$/.test(retryAfter)
                ? Number(retryAfter)
                : retryAfter
                  ? Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000)
                  : 60;
            const waitSeconds =
              Number.isFinite(retrySeconds) && retrySeconds > 0
                ? retrySeconds
                : 60;
            for (let i = 0; i < waitSeconds; i++) {
              logger(
                `[${
                  fetchedThreadCount + j
                }/${totalThreadCount}]: API呼び出しの回数制限を超えました。しばらくお待ち下さい。\n
              あと${waitSeconds - i}秒`,
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
              }/${totalThreadCount}]:threadKeyを新たに取得しています…`,
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
              },
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
              "【コメント増量】ログアウト状態です。ログインをして再度実行してください。",
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
            ...res.data.threads[0].comments,
          );
          if (
            res.data.threads[0].comments.length === 0 ||
            res.data.threads[0].comments[0].no < 5
          ) {
            logger(
              `[${
                fetchedThreadCount + j
              }/${totalThreadCount}]: スレッドの先頭まで読み込みました`,
            );
            break;
          }
          lastTime = Math.floor(
            new Date(res.data.threads[0].comments[0].postedAt).getTime() / 1000,
          );
          logger(
            `[${fetchedThreadCount + j}/${totalThreadCount}]: コメ番${
              res.data.threads[0].comments[0].no
            }まで読み込みました`,
          );
        } else {
          let url = `${threads[1]["server"]}/api.json/thread?${joinObj(
            { ...params, when: lastTime, res_from: "-1000" },
            "=",
            "&",
          )}`;
          logger(
            `[${LoadedCommentCount}/${CommentLimit}]: ${url}を読み込んでいます...`,
            false,
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
              `[${LoadedCommentCount}/${CommentLimit}]: コメントの参照に失敗しました。お待ち下さい。`,
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
              }/${totalThreadCount}]: スレッドの先頭まで読み込みました`,
            );
            break;
          }
          lastTime = comments_tmp[0].chat.date;
          logger(
            `[${fetchedThreadCount + j}/${totalThreadCount}]: コメ番${
              comments_tmp[0].chat.no
            }まで読み込みました`,
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

    const filteredComments = await COMMENT_CONTROL(comments);
    checkLoad();
    COMMENT = [
      {
        commentCount: comments.length,
        comments: filteredComments,
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
      const filteredComments = await COMMENT_CONTROL(comments);
      if (controller.signal.aborted || !DRAW_) return;
      COMMENT = [
        {
          commentCount: comments.length,
          comments: filteredComments,
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
  } catch (error) {
    if (controller.signal.aborted) return;
    console.error("コメント取得に失敗しました", error);
    logger("コメント取得に失敗しました。再度お試しください。");
    loading.style.display = "none";
    document.getElementById("zenkomebutton").disabled = false;
  }
}
