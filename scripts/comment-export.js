// ???????????? XML ???
function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}
function getXMLString(json) {
  var parser = new DOMParser();
  var xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += `<packet><thread thread="${apiData.comment.threads[0].id}" />
  <global_num_res thread="${apiData.comment.threads[0].id}" num_res="${json[0].commentCount}"/>
  <leaf thread="${apiData.comment.threads[0].id}" count="${json[0].commentCount}"/>`;
  for (const comments of json[0].comments) {
    xml += `<chat thread="${apiData.comment.threads[0].id}" no="${
      comments.no
    }" vpos="${Math.floor(comments.vposMs / 10)}" date="${Math.floor(
      new Date(comments.postedAt).getTime() / 1000
    )}" date_usec="00000" premium="${
      comments.isPremium ? "1" : "0"
    }" anonymity="1" user_id="${
      comments.userId
    }" mail="${comments.commands.join(" ")}">${escapeHtml(comments.body)}</chat>
`;
  }
  xml += "</packet>";
  var xmlDoc = parser.parseFromString(xml, "application/xml");
  return xml;
}
