// コメント描画と映像合成の開始・終了を管理する。
function load_NiconiComments() {
  console.log(COMMENT);
  niconiComments?.destroy();
  niconiComments = undefined;
  niconiComments = new NiconiComments(zouryouCanvasElement, COMMENT, {
    video: document.getElementById("iscanvas").checked
      ? videoElement
      : undefined,
    enableLegacyPiP: true,
    scale: document.getElementById("bar_textsize").value * 0.01,
    keepCA: document.getElementById("checkbox4").checked,
    showCommentCount: document.getElementById("isdebug").checked,
    showFPS: document.getElementById("isdebug").checked,
    config: {
      contextStrokeOpacity: Number(document.getElementById("bar_stroke").value),
      contextLineWidth: 3.5,
    },
    format: "v1",
  });
}
function ADDCOMMENT(val, pos, mail) {
  if (!niconiComments) return;
  niconiComments.addComments({
    vpos: pos,
    content: val,
    owner: false,
    premium: true,
    mail: ["184", "nico:waku:#fff321"].concat(mail),
    layer: -1,
  });
}
let commentDrawTimer;
let commentUiTimer;
let playbackGeneration = 0;

// 終了時は描画、一覧更新、映像ストリーム、画像キャッシュをまとめて解放する。
function stopCommentPlayback() {
  playbackGeneration++;
  DRAW_ = false;
  clearTimeout(commentDrawTimer);
  clearTimeout(commentUiTimer);
  clearInterval(list_interval);
  comment_list_active = false;
  if (pipVideoElement) {
    const stream = pipVideoElement.srcObject;
    pipVideoElement.srcObject = null;
    pipVideoElement.pause();
    stream?.getTracks().forEach((track) => track.stop());
  }
  niconiComments?.destroy();
  niconiComments = undefined;
  if (link?.href?.startsWith("blob:")) URL.revokeObjectURL(link.href);
  if (zouryouCanvasElement) {
    const context = zouryouCanvasElement.getContext("2d");
    context?.clearRect(0, 0, zouryouCanvasElement.width, zouryouCanvasElement.height);
  }
  if (link) link.removeAttribute("href");
  restoreCommentVisibility();
}

// 映像合成が必要な場合だけストリームを生成し、不要になったら停止する。
function syncCanvasVideo() {
  const enabled = zouryouSetting.querySelector("#iscanvas").checked;
  if (niconiComments) niconiComments.video = enabled ? videoElement : undefined;
  pipVideoElement.style.display = enabled ? "block" : "none";
  zouryouCanvasElement.style.display = enabled ? "none" : "block";
  if (DRAW_ && enabled) {
    if (!pipVideoElement.srcObject) pipVideoElement.srcObject = zouryouCanvasElement.captureStream(60);
    pipVideoElement.muted = true;
    pipVideoElement.play().catch(console.error);
  } else {
    const stream = pipVideoElement.srcObject;
    pipVideoElement.srcObject = null;
    pipVideoElement.pause();
    stream?.getTracks().forEach((track) => track.stop());
  }
}
function PLAYCOMMENT() {
  stopCommentPlayback();
  const generation = playbackGeneration;
  attachCommentOverlay();
  CustomVideoContainer.style.display = "block";

  zouryouCanvasElement = document.getElementById("zouryou_comment");

  console.log(COMMENT);
  function setup() {
    if (generation !== playbackGeneration) return;
    try {
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
    if (link.href.startsWith("blob:")) URL.revokeObjectURL(link.href);
    link.href = URL.createObjectURL(blob);

    attachCommentOverlay();
    aspect = Number(videoElement.videoWidth) / Number(videoElement.videoHeight);
    console.log(aspect);

    zouryouCanvasElement.style.opacity =
      document.getElementById("bar_alpha").value * 0.01;

    load_NiconiComments();
    document.getElementById("reload_niconicomments").disabled = false;

    loading.style.display = "none";
    CustomVideoContainer.style.display = "block";
    console.log(niconiComments);

    DRAW_ = true;
    const fpsInput = document.getElementById("bar_fps");
    function draw() {
      if (!DRAW_ || generation !== playbackGeneration) return;
      const startedAt = performance.now();
      if (videoElement?.isConnected && niconiComments) {
        niconiComments.drawCanvas(Math.floor(videoElement.currentTime * 100));
      }
      const fps = Number(fpsInput.value);
      const frameInterval = 1000 / (Number.isFinite(fps) && fps > 0 ? Math.min(fps, 120) : 30);
      // 背景やPiPでの再生中も描画を続け、描画時間を待機時間に含める。
      commentDrawTimer = setTimeout(
        draw,
        Math.max(0, frameInterval - (performance.now() - startedAt))
      );
    }
    draw();

    console.log(videoElement);
    syncCommentVisibility();
    //document.getElementsByClassName("CommentRenderer")[0].style.display =
    //  "none";
    //
    syncCanvasVideo();

    //void DANMAKU_SUPER();
    commentUiTimer = setTimeout(() => {
      if (generation !== playbackGeneration) return;
      document.getElementById("wrapper_buttons").style.height = "30px";
      document.getElementById("wrapper_buttons").style.opacity = "1";
      document.getElementsByClassName("scroll")[0].style.height =
        "calc(100% - 221px)";
    }, 200);
    } catch (error) {
      stopCommentPlayback();
      CustomVideoContainer.style.display = "none";
      loading.style.display = "none";
      document.getElementById("zenkomebutton").disabled = false;
      console.error("コメント描画の初期化に失敗しました", error);
    }
  }
  document.getElementById("loaded").style.zIndex = "2";
  const comment_list = document.getElementById("comment_list");
  document
    .getElementById("comment_list_open")
    .onclick = function () {
      comment_list.style.visibility = "visible";
      comment_list_active = true;
    };
  document
    .getElementById("comment_list_exit")
    .onclick = function () {
      comment_list.style.visibility = "hidden";
      comment_list_active = false;
    };
  LIST_COMMENT();
  syncCommentVisibility();
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
  commentDrawTimer = setTimeout(setup, 1000);
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
  clearInterval(list_interval);
  const comments = [...(COMMENT[0]?.comments || [])];
  comments.sort((a, b) => a.vposMs - b.vposMs);

  const nowCommentPos = document.getElementById("now_comment_pos");
  const commentList = document.getElementById("comment_list_comments");
  let lastPassIndex = -1;
  list_interval = setInterval(() => {
    if (!DRAW_ || !videoElement || !comment_list_active) return;

    const currentTimeMs = Math.floor(videoElement.currentTime * 1000);
    // 二分探索でシーク、同時刻のコメント、一覧の末尾を扱う。
    let low = 0;
    let high = comments.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (comments[middle].vposMs <= currentTimeMs) low = middle + 1;
      else high = middle;
    }
    const passIndex = low;
    if (passIndex === lastPassIndex) return;
    lastPassIndex = passIndex;

    nowCommentPos.textContent = "現在のコメント位置" + passIndex + '/' + comments.length;
    const fragment = document.createDocumentFragment();
    // 表示済みの最新30件を古い順に並べる。
    for (let i = Math.max(0, passIndex - 30); i < passIndex; i++) {
      const { body, nicoruCount } = comments[i];
      if (!body) continue;
      const nicoru = nicoruCount || "";
      const commentElement = document.createElement("div");
      commentElement.className = "list_comment";
      const row = document.createElement("div");
      row.style.cssText = "padding:0px 2px;display:flex";
      row.style.backgroundColor = 'rgba(var(--zouryou-nicoru-color, 243, 186, 0), ' + Number(nicoru) / 10 + ')';
      const bodyElement = document.createElement("p");
      bodyElement.style.width = "95%";
      bodyElement.textContent = body;
      const nicoruElement = document.createElement("p");
      nicoruElement.style.cssText = "padding-top:4px;width:5%";
      nicoruElement.textContent = nicoru;
      row.append(bodyElement, nicoruElement);
      commentElement.append(row);
      fragment.append(commentElement);
    }
    commentList.replaceChildren(fragment);
  }, 50);
}
