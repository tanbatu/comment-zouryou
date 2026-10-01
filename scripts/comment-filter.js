// ????????????NG ???????????????
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
      // 不正なNG項目が残っていてもコメントの読み込みを続ける。
      if (typeof NG !== "string" || NG.trim() === "") return;
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
    NG_LIST_COMMENT.filter(
      (NG) => typeof NG === "string" && NG.trim() !== ""
    ).forEach(
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

