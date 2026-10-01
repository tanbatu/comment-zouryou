// ?????????????????
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
  document.getElementsByClassName("CustomVideoContainer")[0].style.display =
    "block";
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

    videoElement = document.querySelector('[data-name="video-content"]');
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
    function draw() {
      niconiComments.drawCanvas(Math.floor(videoElement.currentTime * 100));
      if (DRAW_ == false) return;

      setTimeout(draw, 1000 / document.getElementById("bar_fps").value);
    }
    draw();

    console.log(videoElement);
    document.querySelector('[data-name="comment"]').style.display = "none";
    //document.getElementsByClassName("CommentRenderer")[0].style.display =
    //  "none";
    //
    pipVideoElement.srcObject = zouryouCanvasElement.captureStream(60);
    pipVideoElement.muted = true;
    pipVideoElement.play();

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
  let Comment_SH = new MutationObserver(function () {
    console.log(Comment_Show_Button.getAttribute("data-state"));
    CustomVideoContainer.style.zIndex =
      Comment_Show_Button.getAttribute("aria-label") == "コメントを表示する"
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

