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

async function LOADCOMMENT(mode) {
  logger("お待ち下さい");
  loading.style.display = "block";
  document.getElementsByClassName("loadbutton_text")[0].innerText =
    "読み込み中";
  let LoadedCommentCount = 1,
    FailCount = 0;
  const parser = new DOMParser();
  const req = await fetch(location.href);
  apiData = JSON.parse(
    parser
      .parseFromString(await req.text(), "text/html")
      .getElementById("js-initial-watch-data")
      .getAttribute("data-api-data")
  );
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
    ];
    load_NiconiComments();
    clearInterval(list_interval);
    LIST_COMMENT();
  };

  logger(`描画準備中`);
  document.getElementById("progress_left").style.width = "0%";
  PLAYCOMMENT();
}

let niconiComments, comment_list_active;
let observer = new MutationObserver(function () {
  if (href.split("?")[0] !== location.href.split("?")[0]) {
    document.getElementById("loaded").style.zIndex = "0";
    document.getElementById("wrapper_buttons").style.height = "0px";
    document.getElementById("wrapper_buttons").style.opacity = "0";
    document.getElementsByClassName("scroll")[0].style.height =
      "calc(100% - 171px)";
    DRAW_ = false;
    document.getElementsByClassName("CommentRenderer")[0].style.display =
      "block";
    CustomVideoContainer.style.display = "none";
    //DefaultVideoContainer.style.display = "block";
    LoadedCommentCount = 1;
    link.style.visibility = "hidden";
    //CommentLoadingScreen.innerHTML = "";
    document.getElementById("loaded").style.visibility = "hidden";
    document.getElementById("zenkomebutton").disabled = false;
    pipVideoElement.style.display = "none";
    document.getElementById("reload_niconicomments").disabled = true;
    document.getElementsByClassName("loadbutton_text")[0].innerText =
      "読み込み開始！";
    document.getElementById("progress_left").style.width = "100%";
    href = location.href;
    COMMENT = [];
    setTimeout(() => {
      if (document.getElementById("isauto").checked == true) {
        document.getElementById("allcommentsetting").style.display = "block";
        CommentLimit = document.getElementById("auto_num").value;
        //CommentLimit = CommentLimit > 5 ? 5 : CommentLimit;
        LOADCOMMENT("auto");
        document.getElementById("zenkomebutton").disabled = true;
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

    videoElement = document.querySelector("#MainVideoPlayer > video");
    aspect = Number(videoElement.videoWidth) / Number(videoElement.videoHeight);
    console.log(aspect);

    load_NiconiComments();
    document.getElementById("reload_niconicomments").disabled = false;

    loading.style.display = "none";
    CustomVideoContainer.style.display = "block";
    console.log(niconiComments);

    DRAW_ = true;
    function draw() {
      niconiComments.drawCanvas(Math.floor(videoElement.currentTime * 100));
      if (draw == false) return;

      setTimeout(draw, 1000 / document.getElementById("bar_fps").value);
    }
    draw();

    console.log(videoElement);
    document.getElementsByClassName("CommentRenderer")[0].style.display =
      "none";

    pipVideoElement.srcObject = zouryouCanvasElement.captureStream(60);
    pipVideoElement.muted = true;
    pipVideoElement.play();

    void DANMAKU_SUPER();
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

  let Comment_Show_Button = document.getElementsByClassName(
    "ActionButton ControllerButton CommentOnOffButton"
  )[0];

  let Comment_SH = new MutationObserver(function () {
    CustomVideoContainer.style.zIndex =
      document.getElementsByClassName(
        "ActionButton ControllerButton CommentOnOffButton"
      )[0].children[0].children[0].className.baseVal ==
      "CommentOnOffButton-iconShow"
        ? 0
        : 1;
  });
  Comment_SH.observe(Comment_Show_Button, { childList: true, subtree: true });
  pipVideoElement.style.display = document.getElementById("iscanvas").checked
    ? "block"
    : "none";
  zouryouCanvasElement.style.display = document.getElementById("iscanvas")
    .checked
    ? "none"
    : "block";

  document
    .getElementsByClassName("ActionButton CommentPostButton")[0]
    .addEventListener("click", () => {
      ADDCOMMENT(
        document.querySelector(".CommentInput > textarea").value,
        Math.floor(videoElement.currentTime * 100),
        document
          .getElementsByClassName("CommentCommandInput")[0]
          .value.split(" ")
      );
    });

  document
    .querySelector(".CommentInput > textarea")
    .addEventListener("keydown", (e) => {
      if (
        e.keyCode === 13 &&
        document.querySelector(".CommentInput > textarea").value != ""
      ) {
        ADDCOMMENT(
          document.querySelector(".CommentInput > textarea").value,
          Math.floor(videoElement.currentTime * 100),
          document
            .getElementsByClassName("CommentCommandInput")[0]
            .value.split(" ")
        );
      }
    });
  setTimeout(setup, 1000);
}
let lastCurrentTime = -1;
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
}
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
      let nicoru = COMMENT[0].comments[passIndex - i]?.nicoruCount;
      if (body == undefined) body = "";
      let commentElement = document.createElement("div");
      commentElement.className = "list_comment";
      commentElement.innerHTML = `<div style="padding:0px 2px;display:flex;background-color:rgba(243, 186, 0, ${
        nicoru / 10
      })"><p style="width:95%;">${body}</p><p style="padding-top:4px;width:5%;">${nicoru}</p></div>`;
      document.getElementById("comment_list_comments").prepend(commentElement);
    }
  }, 30);
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
  document
    .getElementsByClassName("PlayerPanelContainer-tab")[0]
    .insertAdjacentHTML("beforeend", setting_html);
  let customStyle = document.createElement("style");
  customStyle.innerHTML =
    ".CustomVideoContainer{width: 640px;height: 360px;position: absolute;top: 0;left: 0;}body.is-large:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}body.is-fullscreen .CustomVideoContainer {width: 100vw !important;height: 100vh !important;}@media screen and (min-width: 1286px) and (min-height: 590px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}@media screen and (min-width: 1392px) and (min-height: 650px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 960px;height: 540px;}} @media screen and (min-width: 1736px) and (min-height: 850px) {body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 1280px;height: 720px;}}}";
  document.body.appendChild(customStyle);
  CommentRenderer = document.getElementsByClassName("CommentRenderer")[0];
  VideoSymbolContainer = document.getElementsByClassName(
    "VideoSymbolContainer"
  )[0];
  PlayerContainer = document.getElementsByClassName("PlayerContainer")[0];
  DefaultVideoContainer = document.getElementsByClassName(
    "InView VideoContainer"
  )[0];
  CustomVideoContainer = document.createElement("div");
  CustomVideoContainer.innerHTML = `<div class="CommentRenderer"><canvas id="zouryouCanvasElement" width="1920" height="1080"></canvas><canvas id="SuperDanmakuCanvasElement" width="640" height="360"></canvas><video id="pipVideoElement"></video></div>`;
  CustomVideoContainer.classList.add("CustomVideoContainer", "InView");
  for (let i = 0; i < 2; i++) {
    document.getElementsByClassName("wave")[
      i
    ].style = `background:url(${wave_image});
      background-size: 1000px 50px;`;
  }
  document.getElementById("logo").src = logo_image;
  document.getElementById("loading_image").src = load_image;
  PlayerContainer.children[0].after(CustomVideoContainer);
  zouryouCanvasElement = document.getElementById("zouryouCanvasElement");
  SuperDanmakuCanvasElement = document.getElementById(
    "SuperDanmakuCanvasElement"
  );
  videoElement = document.querySelector("#MainVideoPlayer > video");

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
  pipVideoElement.onpause = () => {
    pipVideoElement.play();
  };
  zouryouCanvasElement.id = "zouryou_comment";
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
    xml,
    ngscore,
    nicoru_limit,
    premium_filter;
  function CONFIG() {
    get_zouryou_config = localStorage.getItem("zouryou_config");
    if (get_zouryou_config == null || get_zouryou_config == "[null]") {
      localStorage.setItem(
        "zouryou_config",
        JSON.stringify({
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
        })
      );
    } else {
      zouryou_config = JSON.parse(get_zouryou_config);
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
      for (let i = 0; i < val_stroke.length; i++) {
        val_stroke[i].innerText = bar_stroke[i].value;
      }
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
    //CommentLimit = CommentLimit > 5 ? 5 : CommentLimit;
    LOADCOMMENT("auto");
    document.getElementById("zenkomebutton").disabled = true;
  }
  document.getElementById("zenkomebutton").onclick = () => {
    let num = document.getElementById("load_num").value;
    CommentLimit = num !== "" ? Number(num) : 5;
    document.getElementById("zenkomebutton").disabled = true;

    LOADCOMMENT();
  };
  setTimeout(function () {
    function ShowButton() {
      if (document.getElementById("AllCommentViewButton") != undefined) return;
      let DropDownMenu = document.getElementsByClassName("DropDownMenu")[0];
      if (DropDownMenu != undefined) {
        document.getElementsByClassName("DropDownMenu")[0].insertAdjacentHTML(
          "afterend",
          `
       <div class="ClickInterceptor LoginRequirer is-inline" style="padding-left:-4px">
        <button data-title="コメントを倍増する" type="button" id="AllCommentViewButton" class="ActionButton ToggleShowOnlyMyCommentsButton">
          <svg viewBox="2 2 20 19.99" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com">
            <defs>
              <style bx:fonts="Candal">@import url(https://fonts.googleapis.com/css2?family=Candal%3Aital%2Cwght%400%2C400&amp;display=swap);</style>
            </defs>
            <path d="M6.8 18H3.6c-.9 0-1.6-.7-1.6-1.6V3.6C2 2.7 2.7 2 3.6 2h16.8c.9 0 1.6.7 1.6 1.6v12.8c0 .9-.7 1.6-1.6 1.6h-7.9l-4.2 3.8a1 1 0 01-1 .1.8.8 0 01-.5-.7V18z"/>
            <text style="fill: rgb(255, 255, 255); font-family: Candal; font-size: 16px; text-transform: capitalize; white-space: pre;" transform="matrix(0.555965, 0, 0, 0.638972, 1.691508, 2.727544)" x="4.192" y="16.413">ALL</text>
          </svg>
        </button>
       </div>
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

    document
      .getElementsByClassName("PlayerPanelContainer-tabItem")[0]
      .addEventListener(
        "click",
        () => {
          if (document.getElementById("AllCommentViewButton") == null) {
            setTimeout(() => {
              ShowButton();
            }, 100);
          }
        },
        false
      );
  }, 1000);
}

let index_html = chrome.runtime.getURL("files/setting.html");
let wave_image = chrome.runtime.getURL("lib/wave.png");
let logo_image = chrome.runtime.getURL("lib/logo2.png");
let load_image = chrome.runtime.getURL("lib/load.svg");
let setting_html;
fetch(index_html)
  .then((r) => r.text())
  .then((html) => {
    setting_html = html;
  });
const start = setInterval(() => {
  if (document.getElementsByClassName("DropDownMenu")[0] != undefined) {
    PREPARE();
    clearInterval(start);
  }
}, 50);
console.log("✨コメント増量 v6.2\nCopyright (c) 2022 tanbatu.");
