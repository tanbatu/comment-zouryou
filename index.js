let CommentRenderer,
  zouryouCanvasElement,
  videoElement,
  pipVideoElement,
  VideoSymbolContainer,
  CommentLoadingScreen,
  CustomVideoContainer,
  DefaultVideoContainer,
  PlayerContainer,
  CommentLoadingScreenWrapper,
  OLD_DATE,
  OLD_TIME;
let COMMENT = [];
let CommentLimit = 40;

async function LOADCOMMENT() {
  let LoadedCommentCount = 0,
    FailCount = 0;
  const parser = new DOMParser();
  const req = await fetch(location.href);
  const apiData = JSON.parse(
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
  logger(CommentLimit + "回読み込みます。");

  async function GET_COMMENT(TIME) {
    const threads = apiData.comment.threads;

    let params = {
      thread: threads[1]["id"],
      version: "20090904",
      scores: "1",
      nicoru: "3",
      fork: 0,
      language: "0",
      when: TIME,
      res_from: "-1000",
    };
    let url = `${threads[1]["server"]}/api.json/thread?${joinObj(
      params,
      "=",
      "&"
    )}`;
    logger(
      `[${LoadedCommentCount}/${CommentLimit}]: ${url}を読み込んでいます...`
    );
    const req = await fetch(url, {
      method: "GET",
    });
    const res = await req.text();
    let GET_COMMENT_LIST;
    try {
      GET_COMMENT_LIST = JSON.parse(res);
      GET_COMMENT_LIST = GET_COMMENT_LIST.slice(2);
      console.log(GET_COMMENT_LIST);
      TIME = GET_COMMENT_LIST[0].chat.date;
    } catch (e) {
      TIME -= 100;
      FailCount++;
      if (FailCount > 10) {
        PLAYCOMMENT();
        throw new Error("fail to get comment");
      }
      logger(
        `[${LoadedCommentCount}/${CommentLimit}]: コメントの参照に失敗しました。お待ち下さい。`
      );
      GET_COMMENT(TIME);
      return;
    }
    CommentLoadingScreenWrapper.style.background = `linear-gradient(90deg,#0ff 0%,#0ff ${
      (LoadedCommentCount / CommentLimit) * 100
    }%,#999 ${(LoadedCommentCount / CommentLimit) * 100}%,#999 100%)`;
    logger(
      `[${LoadedCommentCount}/${CommentLimit}]: コメ番${GET_COMMENT_LIST[0].chat.no}まで読み込みました`
    );
    LoadedCommentCount++;

    COMMENT = COMMENT.concat(GET_COMMENT_LIST);

    FailCount = 0;
    if (
      GET_COMMENT_LIST[0].chat.no < 5 ||
      CommentLimit === LoadedCommentCount
    ) {
      console.log("完了");
      CommentLoadingScreenWrapper.style.background = `#0ff`;
      logger(`読み込みが終わりました。お待ち下さい。`);

      COMMENT = await COMMENT_NG();
      console.log(COMMENT);
      PLAYCOMMENT();
      return;
    }
    if (CommentLimit > 30) {
      await sleep(1000);
    }
    GET_COMMENT(TIME);
  }
  if (OLD_DATE.value == "") {
    GET_COMMENT(new Date().getTime() / 1000);
  } else {
    let LOAD_DATE = OLD_DATE.value + " " + OLD_TIME.value;
    GET_COMMENT(new Date(LOAD_DATE).getTime() / 1000);
    console.log(LOAD_DATE);
  }
}

function PLAYCOMMENT() {
  let niconiComments, draw;

  async function setup() {
    CustomVideoContainer.style.display = "block";
    DefaultVideoContainer.style.display = "none";
    niconiComments = new NiconiComments(zouryouCanvasElement, COMMENT, {
      video: videoElement,
      enableLegacyPiP: true,
      useLegacy: true,
    });
    draw = setInterval(
      () =>
        niconiComments.drawCanvas(Math.floor(videoElement.currentTime * 100)),
      10
    );
    pipVideoElement.srcObject = zouryouCanvasElement.captureStream(60);
    pipVideoElement.muted = true;
    pipVideoElement.play();
    CommentLoadingScreenWrapper.style.display = "none";
  }

  let href = location.href;
  let observer = new MutationObserver(function () {
    if (href !== location.href) {
      clearInterval(draw);
      CustomVideoContainer.style.display = "none";
      DefaultVideoContainer.style.display = "block";
      CommentLoadingScreen.innerHTML = "";
      document.getElementById("zenkomebutton").disabled = false;
      href = location.href;
      COMMENT = [];
    }
  });
  observer.observe(document, { childList: true, subtree: true });
  setTimeout(setup, 100);
}

const logger = (msg) => {
  const p = document.createElement("p");
  p.innerText = msg;
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

//NG機能(試験)

let NG_LIST_COMMAND = [];
let NG_LIST_COMMENT = [];
const COMMENT_NG = () => {
  let SETTING_NG_LIST_COMMENT = document
    .getElementById("ng_list")
    .getElementsByTagName("li");
  let SETTING_NG_LIST_COMMAND = document
    .getElementById("ng_command")
    .getElementsByTagName("li");
  for (let i = 0; i < SETTING_NG_LIST_COMMENT.length; i++) {
    NG_LIST_COMMENT.push(SETTING_NG_LIST_COMMENT[i].textContent);
  }
  for (let i = 0; i < SETTING_NG_LIST_COMMAND.length; i++) {
    NG_LIST_COMMAND.push(SETTING_NG_LIST_COMMAND[i].textContent);
  }
  console.log(NG_LIST_COMMENT);
  console.log(NG_LIST_COMMAND);
  console.log(COMMENT);
  return new Promise((resolve) => {
    COMMENT.forEach((COMMENT_, index) => {
      if (COMMENT_.chat.mail == undefined) {
        console.log(index);
        COMMENT_.chat.mail = "";
      }
    });
    NG_LIST_COMMAND.forEach(
      (NG) =>
        (COMMENT = COMMENT.filter(
          (COMMENT) => COMMENT.chat.mail.includes(NG) == false
        ))
    );
    NG_LIST_COMMENT.forEach(
      (NG) =>
        (COMMENT = COMMENT.filter(
          (COMMENT) => COMMENT.chat.content.includes(NG) == false
        ))
    );
    resolve(COMMENT);
  });
};

window.onload = function () {
  let index_html = chrome.runtime.getURL("files/index.html");
  let image = chrome.runtime.getURL("lib/V4PN8Mx.png");
  console.log(image);
  console.log(index_html);
  fetch(index_html)
    .then((r) => r.text())
    .then((html) => {
      document
        .getElementsByClassName("PlayerPanelContainer-tab")[0]
        .insertAdjacentHTML("beforeend", html);
    });
  setTimeout(function () {
    function ShowButton() {
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
          if (setting.style.display === "none") {
            setting.style.display = "block";
          } else {
            setting.style.display = "none";
          }
        },
        false
      );
      document.getElementsByClassName("CloseButton")[0].addEventListener(
        "click",
        () => {
          if (setting.style.display === "none") {
            setting.style.display = "block";
          } else {
            setting.style.display = "none";
          }
        },
        false
      );
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
          document.getElementById("AllCommentViewButton").addEventListener(
            "click",
            () => {
              if (setting.style.display === "none") {
                setting.style.display = "block";
              } else {
                setting.style.display = "none";
              }
            },
            false
          );
        },
        false
      ); //

    let customStyle = document.createElement("style");
    customStyle.innerHTML =
      ".CustomVideoContainer{width: 640px;height: 360px;}body.is-large:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}body.is-fullscreen .CustomVideoContainer {width: 100vw !important;height: 100vh !important;}@media screen and (min-width: 1286px) and (min-height: 590px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}@media screen and (min-width: 1392px) and (min-height: 650px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 960px;height: 540px;}} @media screen and (min-width: 1736px) and (min-height: 850px) {body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 1280px;height: 720px;}}}";
    document.body.appendChild(customStyle);
    CommentRenderer = document.getElementsByClassName("CommentRenderer")[0];
    videoElement = document.getElementById("MainVideoPlayer").children[0];
    VideoSymbolContainer = document.getElementsByClassName(
      "VideoSymbolContainer"
    )[0];
    PlayerContainer = document.getElementsByClassName("PlayerContainer")[0];
    DefaultVideoContainer = document.getElementsByClassName(
      "InView VideoContainer"
    )[0];
    CustomVideoContainer = document.createElement("div");
    CustomVideoContainer.innerHTML =
      '<div class="CommentRenderer"><canvas id="zouryouCanvasElement" width="1920" height="1080"></canvas><video id="pipVideoElement"></video></div>';
    CustomVideoContainer.classList.add("CustomVideoContainer", "InView");
    PlayerContainer.children[0].after(CustomVideoContainer);
    zouryouCanvasElement = document.getElementById("zouryouCanvasElement");
    pipVideoElement = document.getElementById("pipVideoElement");
    CommentLoadingScreenWrapper = document.createElement("div");
    CommentLoadingScreenWrapper.innerHTML =
      '<div id="CommentLoadingScreen"></div>';
    PlayerContainer.appendChild(CommentLoadingScreenWrapper);
    CommentLoadingScreen = document.getElementById("CommentLoadingScreen");
    CustomVideoContainer.style.display = "none";
    zouryouCanvasElement.style =
      "position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;display:none";
    pipVideoElement.style =
      "position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:all";
    pipVideoElement.onpause = () => {
      pipVideoElement.play();
    };
    zouryouCanvasElement.id = "zouryou_comment";
    OLD_DATE = document.getElementById("zenkome-date");
    OLD_TIME = document.getElementById("zenkome-time");
    const setting = document.getElementById("allcommentsetting");
    OLD_DATE.min = document
      .getElementsByClassName("VideoUploadDateMeta-dateTimeLabel")[0]
      .textContent.split(" ")[0]
      .replaceAll("/", "-");
    OLD_DATE.max = new Date().getFullYear() + "-12-31";
    console.log(OLD_DATE);

    document.getElementById("zenkomebutton").onclick = () => {
      let num = document.getElementById("load_num").value;
      setting.style.display = "none";
      CommentLimit = num !== "" ? Number(num) : 5;
      CommentLoadingScreenWrapper.style =
        "width: 100%;position: absolute;height: 100%;background-color: #999;z-index: 6;opacity: 0.8;font-size:20px;color:black;overflow: scroll;top:0;left:0";
      document.getElementById("zenkomebutton").disabled = true;
      setTimeout(LOADCOMMENT, 2000);
    };
  }, 1000);
};
