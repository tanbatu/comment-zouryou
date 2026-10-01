// プレイヤーごとの要素を取得し、既存プレイヤーとmintの違いを吸収する。
function getPlayerElements() {
  const mintVideo = document.getElementById("pmw-element-video");
  const isMint = !!mintVideo;
  const video = mintVideo || document.querySelector('[data-name="video-content"]');
  return {
    isMint,
    video,
    container: isMint ? video.parentElement : document.querySelector('[data-name="content"]'),
    settings: document.querySelector(isMint ? ".stacker-content" : ".grid-area_\\[sidebar\\]"),
    buttonHost: document.querySelector(isMint
      ? ".commentlist-title-container.global-flex.stacker-title"
      : "[aria-label='設定']"),
    comments: document.querySelector(isMint ? "#pmw-element-commentcanvas" : '[data-name="comment"]'),
    commentToggle: document.querySelector(isMint
      ? ".playercontroller-commenttoggle"
      : "[aria-label='コメントを非表示にする'], [aria-label='コメントを表示する']"),
  };
}

// 動画の差し替え時にも同じcanvasを動画の隣へ戻す。
function attachCommentOverlay() {
  const player = getPlayerElements();
  if (!player.video || !CustomVideoContainer) return;
  videoElement = player.video;
  PlayerContainer = player.container;
  if (player.isMint) {
    if (getComputedStyle(PlayerContainer).position === "static") {
      PlayerContainer.style.position = "relative";
    }
    CustomVideoContainer.classList.add("zouryou-mint-overlay");
  } else {
    CustomVideoContainer.classList.remove("zouryou-mint-overlay");
  }
  if (CustomVideoContainer.previousElementSibling !== videoElement) {
    videoElement.after(CustomVideoContainer);
  }
}

// mintでは標準コメントcanvasの上に増量コメントを描画する。
function syncCommentVisibility() {
  const player = getPlayerElements();
  if (!CustomVideoContainer) return;
  const hidden = /^コメントを表示/.test(player.commentToggle?.getAttribute("aria-label") || "");
  CustomVideoContainer.style.visibility = hidden ? "hidden" : "visible";
  if (DRAW_ && player.comments) player.comments.style.display = "none";
}
