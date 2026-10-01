// ????????????????????????? manifest.json ????????
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
observer.observe(document, { childList: true, subtree: true });

let index_html = chrome.runtime.getURL("files/setting.html");
let wave_image = chrome.runtime.getURL("lib/wave.png");
let logo_image = chrome.runtime.getURL("lib/logo4.png");
let load_image = chrome.runtime.getURL("lib/load.svg");
let setting_html;
fetch(index_html)
  .then((r) => r.text())
  .then((html) => {
    setting_html = html;
  });
const start = setInterval(() => {
  if (document.getElementsByClassName("d_flex gap_base")[5] != undefined) {
    PREPARE();
    clearInterval(start);
  }
}, 50);
console.log("✨コメント増量 v7.4\nCopyright (c) 2022 tanbatu.");
