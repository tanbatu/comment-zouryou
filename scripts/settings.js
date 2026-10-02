// 設定画面とプレイヤーの接続を管理する。
let zouryouSetting;
let syncZouryouPlayer;

function PREPARE(observe) {
  const player = getPlayerElements();
  // ページ側のp要素の文字サイズと色を、設定画面の挿入前に取得する。
  const fontSample = document.createElement("p");
  fontSample.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;";
  player.settings.appendChild(fontSample);
  const sampleStyle = getComputedStyle(fontSample);
  const baseFontSize = "14px";
  const baseTextColor = sampleStyle.color;
  fontSample.remove();
  player.settings.insertAdjacentHTML("afterbegin", setting_html);
  document
    .getElementById("allcommentsetting")
    .style.setProperty("--zouryou-base-font-size", baseFontSize);
  document
    .getElementById("allcommentsetting")
    .style.setProperty("--zouryou-base-text-color", baseTextColor);
  document
    .getElementById("allcommentsetting")
    .classList.toggle("zouryou-mint-settings", player.isMint);
  if (
    player.isMint &&
    getComputedStyle(player.settings).position === "static"
  ) {
    player.settings.style.position = "relative";
  }
  let customStyle = document.createElement("style");
  customStyle.innerHTML =
    ".CustomVideoContainer{width: 100%;height:100%;position: absolute;top: 0;left: 0;}body.is-large:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}body.is-fullscreen .CustomVideoContainer {width: 100vw !important;height: 100vh !important;}@media screen and (min-width: 1286px) and (min-height: 590px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}@media screen and (min-width: 1392px) and (min-height: 650px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 960px;height: 540px;}} @media screen and (min-width: 1736px) and (min-height: 850px) {body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 1280px;height: 720px;}}}";
  customStyle.textContent += `
    .CustomVideoContainer.zouryou-mint-overlay {width:100% !important;height:100% !important;}
    .stacker-content > #allcommentsetting {position:absolute !important;inset:0;width:100%;height:100% !important;margin:0;z-index:50;}
  `;
  document.body.appendChild(customStyle);
  CommentRenderer = document.getElementsByClassName("CommentRenderer")[0];
  VideoSymbolContainer = document.getElementsByClassName(
    "VideoSymbolContainer",
  )[0];
  PlayerContainer = player.container;
  //DefaultVideoContainer = document.getElementsByClassName(
  //  "InView VideoContainer"
  //)[0];
  CustomVideoContainer = document.createElement("div");
  CustomVideoContainer.innerHTML = `<div class="CommentRenderer"><canvas id="zouryou_comment" width="1920" height="1080"></canvas><canvas id="SuperDanmakuCanvasElement" width="640" height="360"></canvas><video id="pipVideoElement"></video></div>`;
  CustomVideoContainer.classList.add("CustomVideoContainer", "InView");
  for (let i = 0; i < 2; i++) {
    document.getElementsByClassName("wave")[i].style =
      `background:url(${wave_image});
      background-size: 1000px 50px;`;
  }
  document.getElementById("logo").src = logo_image;
  document.getElementById("loading_image").src = load_image;

  attachCommentOverlay();
  zouryouCanvasElement = document.getElementById("zouryou_comment");
  SuperDanmakuCanvasElement = document.getElementById(
    "SuperDanmakuCanvasElement",
  );
  videoElement = player.video;
  let estimateVideo;
  function updateEstimatedCommentCount() {
    const currentVideo = getPlayerElements().video;
    if (estimateVideo !== currentVideo) {
      estimateVideo?.removeEventListener("durationchange", updateEstimatedCommentCount);
      estimateVideo = currentVideo;
      estimateVideo?.addEventListener("durationchange", updateEstimatedCommentCount);
    }
    const duration = estimateVideo?.duration;
    const multiplierInput = document.getElementById("load_num");
    const multiplier = Number(multiplierInput.value || multiplierInput.placeholder);
    const limit = duration < 60 ? 100 : duration < 300 ? 250 : duration < 600 ? 500 : 1000;
    const count = Number.isFinite(duration) && duration > 0 && Number.isFinite(multiplier)
      ? limit * multiplier
      : "—";
    const label = document.getElementById("estimated_comment_count");
    const text = `最大読み込みコメント数:${count}件`;
    if (label.textContent !== text) label.textContent = text;
  }
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
  pipVideoElement.onpause = () => {
    if (DRAW_ && pipVideoElement.srcObject) pipVideoElement.play().catch(console.error);
  };

  OLD_DATE = document.getElementById("zenkome-date");
  OLD_TIME = document.getElementById("zenkome-time");
  const setting = document.getElementById("allcommentsetting");
  zouryouSetting = setting;
  function syncSettingTheme() {
    let dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    // プレイヤー側の背景色を優先し、サイトのテーマ切り替えにも追従する。
    for (let element = setting.parentElement; element; element = element.parentElement) {
      const style = getComputedStyle(element);
      const channels = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3 || (channels.length === 4 && channels[3] < 0.5)) continue;
      const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      dark = luminance < 128;
      break;
    }
    setting.classList.toggle("zouryou-dark", dark);
  }
  syncSettingTheme();

  document.getElementsByClassName("ZenkomeCloseButton")[0].addEventListener(
    "click",
    () => {
      setting.style.display = "none";
    },
    false,
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
    premium_filter,
    version;
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
          comment_font: "default",
          mode: "html5",
          pip: false,
          auto: false,
          auto_num: 2,
          xml: false,
          ngscore: "-Infinity",
          nicoru_limit: 0,
          premium_filter: false,
          version: "7.3.3",
        }),
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
      document.getElementById("comment_font").value =
        zouryou_config.comment_font === "meiryo" ? "meiryo" : "default";
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
    updateEstimatedCommentCount();
    if (l.value.length >= 4) {
      l.style.width = "60%";
    } else {
      l.style.width = "50%";
    }
  }

  const citationList = document.getElementById("video_citation_list");
  function saveVideoCitations() {
    videoCitations = Array.from(citationList.children, (row) => ({
      videoId: row.querySelector(".video-citation-id").value,
      multiplier: row.querySelector(".video-citation-multiplier").value,
    }));
  }
  function addVideoCitation(citation = {}) {
    const row = document.createElement("div");
    row.className = "video-citation-row";
    row.innerHTML = `<input type="text" class="video-citation-id" placeholder="sm12345678" aria-label="引用する動画のsm番号" pattern="sm[0-9]+">
      <input type="number" class="video-citation-multiplier" min="1" step="1" aria-label="引用する動画の倍数"><span>倍</span>
      <button type="button" class="video-citation-button" aria-label="この動画引用を削除">削除</button>`;
    row.querySelector(".video-citation-id").value = citation.videoId || "";
    row.querySelector(".video-citation-multiplier").value = citation.multiplier ?? 1;
    row.addEventListener("input", saveVideoCitations);
    row.querySelector("button").onclick = () => {
      row.remove();
      saveVideoCitations();
    };
    citationList.appendChild(row);
  }
  document.getElementById("add_video_citation").onclick = () => {
    addVideoCitation();
    saveVideoCitations();
    citationList.lastElementChild.querySelector("input").focus();
  };

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
        JSON.stringify({ command: [], comment: [], easy: false }),
      );
    } else {
      ngarray = JSON.parse(ng_storage);
      // 保存済みのnullや空の項目を除去し、削除ボタンの位置も合わせる。
      for (const type of ["command", "comment"]) {
        ngarray[type] = (
          Array.isArray(ngarray[type]) ? ngarray[type] : []
        ).filter((value) => typeof value === "string" && value.trim() !== "");
      }
      localStorage.setItem("ng_storage", JSON.stringify(ngarray));
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
  videoCitations = [];
  localCommentFiles = [];
  const localFileInput = document.getElementById("local_comment_files");
  document.getElementById("add_local_comment_files").onclick = () => localFileInput.click();
  const localFileList = document.getElementById("local_comment_list");
  function renderLocalFiles() {
    localFileList.replaceChildren();
    localCommentFiles.forEach((file, index) => {
      const row = document.createElement("div");
      row.className = "video-citation-row";
      const name = document.createElement("span");
      name.style.cssText = "flex:1;min-width:0;overflow-wrap:anywhere";
      name.textContent = file.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "video-citation-button";
      remove.textContent = "削除";
      remove.onclick = () => {
        localCommentFiles.splice(index, 1);
        renderLocalFiles();
      };
      row.append(name, remove);
      localFileList.appendChild(row);
    });
  }
  localFileInput.onchange = () => {
    localCommentFiles.push(...localFileInput.files);
    localFileInput.value = "";
    renderLocalFiles();
  };
  document.getElementById("reset_local_storage").onclick = () => {
    if (
      !window.confirm(
        "コメント増量の設定とNGリストを初期化し、ページを再読み込みします。よろしいですか？",
      )
    )
      return;
    // この拡張機能が使うキーだけを削除し、初期設定で読み込み直す。
    localStorage.removeItem("zouryou_config");
    localStorage.removeItem("ng_storage");
    window.location.reload();
  };
  document.getElementById("form_command").onclick = () => {
    ng_storage = localStorage.getItem("ng_storage");
    ngarray = JSON.parse(ng_storage);
    let ng_add = window.prompt("新たに追加するNGコマンドを入力してください。");
    // Escやキャンセル、空欄の場合はNGリストに追加しない。
    if (ng_add === null || ng_add.trim() === "") return;
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
    // Escやキャンセル、空欄の場合はNGリストに追加しない。
    if (ng_add === null || ng_add.trim() === "") return;
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
    updateEstimatedCommentCount();
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

  document.getElementById("comment_font").onchange = () => {
    const config = JSON.parse(localStorage.getItem("zouryou_config") || "{}");
    config.comment_font = document.getElementById("comment_font").value;
    localStorage.setItem("zouryou_config", JSON.stringify(config));
    if (niconiComments) load_NiconiComments();
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
      false,
    );
  }

  document.getElementById("islogger").addEventListener("change", function () {
    CommentLoadingScreenWrapper.style.display = this.checked ? "block" : "none";
  });
  document.getElementById("isxml").addEventListener("change", function () {
    if (!apiData || !COMMENT.length) return;
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

    if (link.href.startsWith("blob:")) URL.revokeObjectURL(link.href);
    blob = new Blob([download_comment], { type: "text/plain" });
    link.style.visibility = "visible";
    link.href = URL.createObjectURL(blob);
  });
  document.getElementById("iscanvas").addEventListener("change", function () {
    syncCanvasVideo();
  });

  document.getElementById("isdebug").addEventListener("change", function () {
    if (!niconiComments) return;
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
    "[aria-label='全画面表示する']",
  );
  if (fullScreenButton == undefined) {
    fullScreenButton = document.querySelector(
      "[aria-label='全画面表示を終了']",
    );
  }
  let fullScreen = new MutationObserver(function () {
    console.log(fullScreenButton.getAttribute("data-state"));
    document.getElementById("allcommentsetting").style.visibility =
      fullScreenButton.getAttribute("aria-label") == "全画面表示する"
        ? "visible"
        : "hidden";
  });
  if (fullScreenButton) {
    fullScreen.observe(fullScreenButton, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }
  document.addEventListener("fullscreenchange", () => {
    setting.style.visibility = document.fullscreenElement
      ? "hidden"
      : "visible";
  });

  // タブ切り替えでタイトルが作り直された場合もボタンを設置する。
  let allButton;
  let buttonWrapper;
  function ShowButton() {
    const currentPlayer = getPlayerElements();
    if (!currentPlayer.buttonHost) {
      (buttonWrapper || allButton)?.remove();
      return;
    }
    if (allButton) {
      const anchor = buttonWrapper || allButton;
      if (anchor.nextElementSibling === currentPlayer.buttonHost) return;
      anchor.remove();
    }
    const button = document.createElement("button");
    button.id = "AllCommentViewButton";
    button.type = "button";
    button.textContent = "ALL";
    button.title = "コメント増量";
    button.setAttribute("aria-label", "コメント増量");
    button.style.cssText =
      "width:32px;color:inherit;cursor:pointer;flex-shrink:0;";
    button.addEventListener("click", () => {
      if (!isWatchPage()) return;
      setting.style.visibility = document.fullscreenElement ? "hidden" : "visible";
      setting.style.display = "block";
    });
    allButton = button;
    buttonWrapper = null;
    if (currentPlayer.isMint) {
      const wrapper = document.createElement("div");
      wrapper.className = "tooltip-wrapper";
      buttonWrapper = wrapper;
      wrapper.appendChild(button);
      currentPlayer.buttonHost.insertAdjacentElement("beforebegin", wrapper);
    } else {
      button.style.color = "white";
      currentPlayer.buttonHost.before(button);
      return;
    }
    // 透明な背景は親要素までたどり、白背景では黒文字にする。
    for (let element = button; element; element = element.parentElement) {
      const background = getComputedStyle(element).backgroundColor;
      const channels = background.match(/[\d.]+/g)?.map(Number);
      if (!channels || (channels.length === 4 && channels[3] === 0)) continue;
      if (channels.slice(0, 3).every((channel) => channel === 255)) {
        button.style.color = "black";
      }
      break;
    }
  }
  ShowButton();
  syncZouryouPlayer = () => {
    syncSettingTheme();
    if (!isWatchPage() && !hasRetainedMintPlayer()) {
      (buttonWrapper || allButton)?.remove();
      setting.remove();
      CustomVideoContainer.remove();
      return;
    }
    if (!isWatchPage()) {
      (buttonWrapper || allButton)?.remove();
      // 取得中の設定参照を維持し、サイドバーが消えても処理を継続する。
      setting.style.display = "none";
      if (!setting.isConnected) document.body.appendChild(setting);
      attachCommentOverlay();
      syncCommentVisibility();
      return;
    }
    const currentPlayer = getPlayerElements();
    if (!currentPlayer.video || !currentPlayer.container) return;
    setting.classList.toggle("zouryou-mint-settings", currentPlayer.isMint);
    // サイドバーが差し替えられても、設定と入力値を保持する。
    if (
      currentPlayer.settings &&
      setting.parentElement !== currentPlayer.settings
    ) {
      if (
        currentPlayer.isMint &&
        getComputedStyle(currentPlayer.settings).position === "static"
      ) {
        currentPlayer.settings.style.position = "relative";
      }
      currentPlayer.settings.prepend(setting);
    }
    ShowButton();
    attachCommentOverlay();
    updateEstimatedCommentCount();
    syncCommentVisibility();
  };
  const playerObserver = new MutationObserver(syncZouryouPlayer);
  playerObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-label"],
  });
}
