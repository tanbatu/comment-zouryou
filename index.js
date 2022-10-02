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
  loading,
  loading_text,
  link,
  OLD_DATE,
  OLD_TIME;
let COMMENT = [];
let CommentLimit = 40;

async function LOADCOMMENT() {
  logger("お待ち下さい");
  loading.style.display = "block";
  //document.getElementById("loaded").style.visibility = "visible";
  document.getElementsByClassName("loadbutton_text")[0].innerText =
    "読み込み中";
  let LoadedCommentCount = 1,
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
  const nvComment = apiData.comment.nvComment,
      threads = apiData.comment.threads;
  let totalThreadCount = nvComment.params.targets.length * CommentLimit;
  let fetchedThreadCount = 0;
  logger(`${nvComment.params.targets.length}スレッドをそれぞれ${CommentLimit}回読み込みます。`);

  const date = OLD_DATE.value === "" ? new Date() : new Date(OLD_DATE.value + " " + OLD_TIME.value);
  const comments = [];
  let isLoggedIn = true, params = {
    version: "20090904",
    scores: "1",
    nicoru: "3",
    fork: 0,
    language: "0",
    thread:threads[2]["id"]
  };
  const prepareLegacy = async() => {
    let channel_URL =
        "https://flapi.nicovideo.jp/api/getthreadkey?thread=" + threads[2]["id"];
    const req = await fetch(channel_URL);
    const res = (await req.text()).split("&");
    if (res[0] !== "") {
      for (const item of res){
        const param = item.split("=");
        params[param[0]] = param[1];
      }
    }
  }
  for (const i in nvComment.params.targets) {
    const thread = nvComment.params.targets[i];
    const baseData = {
      threadKey: nvComment.threadKey,
      params: {
        language: nvComment.params.language,
        targets: [thread]
      }
    }
    let lastTime = Math.floor(date.getTime() / 1000);
    for (let j = 0; j < CommentLimit; j++) {
      await sleep(1000);
      if (isLoggedIn){

        const req = await fetch(`${nvComment.server}/v1/threads`, {
          method: "POST",
          headers: {
            "content-type": "text/plain;charset=UTF-8",
            "x-client-os-type": "others",
            "x-frontend-id": "6",
            "x-frontend-version": "0",
          },
          body: JSON.stringify({
            ...baseData, additionals: {
              res_from: -1000,
              when: lastTime,
            }
          })
        });
        const res = await req.json();
        if (res?.meta?.errorCode === "INVALID_TOKEN"){
          logger("旧コメントAPIに切り替えています...");
          isLoggedIn=false;
          j--;
          totalThreadCount /= 3;
          await prepareLegacy();
          continue;
        }
        comments.push(...res.data.threads[0].comments);
        if (res.data.threads[0].comments.length === 0 || res.data.threads[0].comments[0].no < 5) {
          logger(
              `[${fetchedThreadCount + j}/${totalThreadCount}]: スレッドの先頭まで読み込みました`
          );
          break;
        }
        lastTime = Math.floor(new Date(res.data.threads[0].comments[0].postedAt).getTime() / 1000);
        logger(
            `[${fetchedThreadCount + j}/${totalThreadCount}]: コメ番${res.data.threads[0].comments[0].no}まで読み込みました`
        );
      }else{
        let url = `${threads[1]["server"]}/api.json/thread?${joinObj(
            {...params,when: lastTime, res_from: "-1000"},
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
          j--
          await sleep(1000);
          continue;
        }
        for (const comment of comments_tmp){
          comments.push({
            body: comment.chat.content,
            commands: comment.chat.mail.split(/\s+/g),
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
            vposMs: comment.chat.vpos*10
          })
        }
        if (comments_tmp.length === 0 || comments_tmp[0].chat.no < 5) {
          logger(
              `[${fetchedThreadCount + j}/${totalThreadCount}]: スレッドの先頭まで読み込みました`
          );
          break;
        }
        lastTime = comments_tmp[0].chat.date;
        logger(
            `[${fetchedThreadCount + j}/${totalThreadCount}]: コメ番${comments_tmp[0].chat.no}まで読み込みました`
        );
      }
      document.getElementById(
          "progress_bar"
      ).style.background = `linear-gradient(90deg,rgb(0, 145, 255,0.9) 0%,#0ff ${
          ((fetchedThreadCount + j) / totalThreadCount) * 100
      }%,rgba(0, 0, 0, .9) ${
          ((fetchedThreadCount + j) / totalThreadCount) * 100
      }%,rgba(0, 0, 0, .9) 100%)`;
      if (CommentLimit > 2) {
        await sleep(1000);
      }
    }
    if (!isLoggedIn)break;
    fetchedThreadCount += CommentLimit;
  }
  CommentLoadingScreenWrapper.style.background = `rgba(0, 0, 0, .9)`;
  logger(comments.length + "件のコメントを読み込みました");
  logger(`NG設定を適用しています`);

  logger(comments.length + "件に減りました");
  COMMENT = [{commentCount: comments.length, comments: await COMMENT_NG(comments), fork: "comment-zouryou", id: 0}];
  logger(`描画準備中`);
  document.getElementById(
    "progress_bar"
  ).style.background = `linear-gradient(90deg,rgb(0, 145, 255,0.9) 0%,#0ff 100%`;
  PLAYCOMMENT();
}

let niconiComments;

function PLAYCOMMENT() {
  let draw;
  console.log(COMMENT);
  const apiData = JSON.parse(
    document
      .getElementById("js-initial-watch-data")
      .getAttribute("data-api-data")
  );

  async function setup() {
    DefaultVideoContainer.style.display = "block";
    document.getElementsByClassName("loadbutton_text")[0].innerText =
      "JSONをダウンロード";

    const blob = new Blob([JSON.stringify(COMMENT)], {type: "text/plain"});

    link.style.visibility = "visible";
    link.href = URL.createObjectURL(blob); // URLを作成
    link.download = apiData.video.id + ".json"; // ファイル名

    videoElement = document.getElementById("MainVideoPlayer").children[0];

    niconiComments = new NiconiComments(zouryouCanvasElement, COMMENT, {
      video: document.getElementById("iscanvas").checked ? videoElement : null,
      enableLegacyPiP: true,
      scale: document.getElementById("bar_textsize").value * 0.01,
      keepCA: document.getElementById("checkbox4").checked,
      showCommentCount: document.getElementById("isdebug").checked,
      showFPS: document.getElementById("isdebug").checked,
      config: (Config = {
        contextStrokeOpacity: Number(
          document.getElementById("bar_stroke").value
        ),

        contextLineWidth: 8,
      }),
      format: "v1",
      useLegacy: document.getElementById("checkbox3").checked == false,
    });
    loading.style.display = "none";
    CustomVideoContainer.style.display = "block";
    console.log(niconiComments);
    draw = setInterval(() => {
        niconiComments.drawCanvas(Math.floor(videoElement.currentTime * 100));
      }
    );
    console.log(videoElement);
    document.getElementsByClassName("CommentRenderer")[0].style.display =
      "none";
    pipVideoElement.style.display = "block";
    pipVideoElement.srcObject = zouryouCanvasElement.captureStream(60);
    pipVideoElement.muted = true;
    pipVideoElement.play();
  }

  document
    .getElementsByClassName(
      "ActionButton ControllerButton CommentOnOffButton"
    )[0]
    .addEventListener("click", function () {
      CustomVideoContainer.style.zIndex =
        document.getElementsByClassName(
          "ActionButton ControllerButton CommentOnOffButton"
        )[0].children[0].children[0].className.baseVal ==
        "CommentOnOffButton-iconShow"
          ? 1
          : 0;
    });
  let href = location.href;
  let observer = new MutationObserver(function () {
    if (href !== location.href) {
      clearInterval(draw);
      document.getElementsByClassName("CommentRenderer")[0].style.display =
        "block";
      CustomVideoContainer.style.display = "none";
      DefaultVideoContainer.style.display = "block";
      LoadedCommentCount = 1;
      link.style.visibility = "hidden";
      //CommentLoadingScreen.innerHTML = "";
      document.getElementById("loaded").style.visibility = "hidden";
      document.getElementById("zenkomebutton").disabled = false;
      pipVideoElement.style.display = "none";
      document.getElementsByClassName("loadbutton_text")[0].innerText =
        "読み込み開始！";
      href = location.href;
      COMMENT = [];
    }
  });
  observer.observe(document, {childList: true, subtree: true});
  setTimeout(setup, 1000);
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

//NG機能(試験)

let NG_LIST_COMMAND = [];
let NG_LIST_COMMENT = [];
const COMMENT_NG = (comments) => {
  return new Promise((resolve) => {
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
        let ng_point = command.length;
        commands.forEach((command) => {
          if (comment.commands.includes(command)) {
            ng_point -= 1;
          }
        });
        return ng_point > 0;
      });
    });
    NG_LIST_COMMENT.forEach((NG) =>
      (comments = comments.filter(
        (comment) => comment.body.includes(NG) === false
      ))
    );
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
  CustomVideoContainer.innerHTML =
    '<div class="CommentRenderer"><canvas id="zouryouCanvasElement" width="1920" height="1080"></canvas><video id="pipVideoElement"></video></div>';
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

  document.getElementsByClassName("CloseButton")[0].addEventListener(
    "click",
    () => {
      setting.style.display = "none";
    },
    false
  );
  OLD_DATE.min = "2007-03-03";
  OLD_DATE.max = new Date().getFullYear() + "-12-31";

  //NG取得とか
  let ng_storage = localStorage.getItem("ng_storage");
  let ngarray, SETTING_NG_LIST_COMMENT, SETTING_NG_LIST_COMMAND;

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
    SETTING_NG_LIST_COMMENT = document.getElementById("ng_comment");
    SETTING_NG_LIST_COMMAND = document.getElementById("ng_command");
    loading_text = document.getElementById("loading_text");
    loading = document.getElementById("loading");
    SETTING_NG_LIST_COMMAND.innerHTML = "";
    SETTING_NG_LIST_COMMENT.innerHTML = "";

    if (ng_storage == null || ng_storage == "[null]") {
      localStorage.setItem(
        "ng_storage",
        JSON.stringify({command: [], comment: []})
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
    }
  }

  if (!observe) ng_element();
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

  const val_stroke = document.getElementsByClassName("range_val");
  const bar_stroke = document.getElementsByClassName("range_bar");
  for (let i = 0; i < val_stroke.length; i++) {
    bar_stroke[i].addEventListener(
      "input",
      function (e) {
        val_stroke[i].innerText = e.target.value;

        if (this.id == "bar_alpha") {
          pipVideoElement.style.opacity = e.target.value * 0.01;
        }
      },
      false
    );
  }

  document.getElementById("islogger").addEventListener("change", function () {
    console.log(this.checked);
    CommentLoadingScreenWrapper.style.display = this.checked ? "block" : "none";
  });
  document.getElementById("iscanvas").addEventListener("change", function () {
    niconiComments.video = this.checked ? videoElement : null;
  });
  document.getElementById("isdebug").addEventListener("change", function () {
    niconiComments.showCommentCount =
      document.getElementById("isdebug").checked;
    niconiComments.showFPS = document.getElementById("isdebug").checked;
  });
  document.getElementById("zenkomebutton").onclick = () => {
    let num = document.getElementById("load_num").value;
    CommentLimit = num !== "" ? Number(num) : 5;
    //CommentLoadingScreenWrapper.style.display = "block";
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
