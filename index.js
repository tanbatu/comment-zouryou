// サイト内遷移でも視聴ページのDOMが揃ってから一度だけ初期化する。
const index_html = chrome.runtime.getURL("files/setting.html");
const wave_image = chrome.runtime.getURL("lib/wave.png");
const logo_image = chrome.runtime.getURL("lib/logo2.png");
const load_image = chrome.runtime.getURL("lib/load.svg");
let setting_html;
let prepared = false;
let pagePath = location.pathname;
let activeWatchPath = isWatchPage() ? location.pathname : null;
let autoLoadTimer;
let pendingAutoLoad = false;

function resetWatchPage() {
  clearTimeout(autoLoadTimer);
  pendingAutoLoad = false;
  cancelCommentLoad();
  stopCommentPlayback();
  COMMENT = [];
  apiData = undefined;
  if (!prepared) return;
  CustomVideoContainer.style.display = "none";
  pipVideoElement.style.display = "none";
  const setting = zouryouSetting;
  setting.style.display = "none";
  const loaded = setting.querySelector("#loaded");
  loaded.style.zIndex = "0";
  loaded.style.visibility = "hidden";
  const buttons = setting.querySelector("#wrapper_buttons");
  buttons.style.height = "0px";
  buttons.style.opacity = "0";
  setting.querySelector(".scroll").style.height = "calc(100% - 171px)";
  setting.querySelector("#zenkomebutton").disabled = false;
  setting.querySelector("#reload_niconicomments").disabled = true;
  setting.querySelector(".loadbutton_text").innerText = "読み込み開始！";
  setting.querySelector("#progress_left").style.width = "100%";
  setting.querySelector("#loading").style.display = "none";
  restoreCommentVisibility();
}

function reconcileWatchPage() {
  if (pagePath !== location.pathname) {
    pagePath = location.pathname;
  }
  // 同じ動画を保持するミニプレイヤーへの移動と復帰では描画を継続する。
  const retained = prepared && hasRetainedMintPlayer();
  if (isWatchPage()) {
    if (activeWatchPath !== pagePath) {
      resetWatchPage();
      activeWatchPath = pagePath;
      pendingAutoLoad = prepared;
    }
  } else if (activeWatchPath && !retained) {
    resetWatchPage();
    activeWatchPath = null;
  }
  if (prepared) {
    syncZouryouPlayer();
    const player = getPlayerElements();
    if (
      pendingAutoLoad &&
      isWatchPage() &&
      player.video &&
      player.container &&
      player.settings &&
      player.buttonHost &&
      zouryouSetting.isConnected
    ) {
      pendingAutoLoad = false;
      const targetPath = pagePath;
      autoLoadTimer = setTimeout(() => {
        if (
          location.pathname !== targetPath ||
          !isWatchPage() ||
          !zouryouSetting.isConnected
        )
          return;
        if (zouryouSetting.querySelector("#isauto").checked) {
          zouryouSetting.style.display = "block";
          CommentLimit = zouryouSetting.querySelector("#auto_num").value;
          LOADCOMMENT("auto");
          zouryouSetting.querySelector("#zenkomebutton").disabled = true;
        }
      }, 1000);
    }
    return;
  }
  if (!isWatchPage() || !setting_html) return;
  const player = getPlayerElements();
  if (
    player.video &&
    player.container &&
    player.settings &&
    player.buttonHost
  ) {
    prepared = true;
    PREPARE();
  }
}

fetch(index_html)
  .then((response) => {
    if (!response.ok) throw new Error("設定画面の読み込みに失敗しました");
    return response.text();
  })
  .then((html) => {
    setting_html = html;
    reconcileWatchPage();
  })
  .catch(console.error);

// DOM変更のない履歴移動と遅れて生成されるプレイヤーにも対応する。
setInterval(reconcileWatchPage, 500);
window.addEventListener("popstate", reconcileWatchPage);
console.log("✨コメント増量 v8.0\nCopyright (c) 2022 tanbatu.");
