// ? content script ?????????????
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
// 引用元は保存せず、現在の視聴ページだけで保持する。
let videoCitations = [];
let localCommentFiles = [];
let CommentLimit = 40;

let niconiComments, comment_list_active;
let download_comment;
let blob;
