let Zouryou_Renderer
let CommentRenderer
let Zouryou_Renderer_Elem
let COMMENT = []
let page_document;
let seigen = 40;

function START_SCRIPT() {
    LOADCOMMENT()
    GET_HTML()
}


function LOADCOMMENT() {
    let url
    let LOADED_COMMENT_NUM = 0
    var joinObj = function(obj, fDelimiter, sDelimiter) {
        var tmpArr = [];
        if (typeof obj === 'undefined') return '';
        if (typeof fDelimiter === 'undefined') fDelimiter = '';
        if (typeof sDelimiter === 'undefined') sDelimiter = '';
        for (var key in obj) {
            tmpArr.push(key + fDelimiter + obj[key]);
        }
        return tmpArr.join(sDelimiter);
    };
    let kakolog_time
        //コメント取得
    document.getElementById('CommentLoad').innerText = seigen + "回読み込みます。\n";

    function GET_COMMENT(TIME) {
        (function() {
            const API_DATA = page_document.getElementById("js-initial-watch-data")
            const JSON_DATA = API_DATA.getAttribute("data-api-data");
            const JSON_DATA_PARSE = JSON.parse(JSON_DATA);
            const threads = JSON_DATA_PARSE.comment.threads

            let GET_COMMENT_LIST = []

            let params = {
                "thread": threads[1]["id"],
                "version": "20090904",
                "scores": "1",
                "nicoru": "3",
                "fork": 0,
                "language": "0",
                "when": TIME,
                "res_from": "-1000",
            }
            var params_text = joinObj(params, '=', '&');
            url = threads[1]["server"] + "/api.json/thread?" + params_text;
            console.log(url)
            fetch(url, {
                    method: "GET",
                }).then(response => response.text())
                .then(text => {
                    GET_COMMENT_LIST = JSON.parse(text);
                    GET_COMMENT_LIST = GET_COMMENT_LIST.slice(2)
                    try {
                        kakolog_time = GET_COMMENT_LIST[0].chat.date;
                    } catch (e) {
                        kakolog_time -= 100;
                        document.getElementById('CommentLoad').innerText += "コメントの参照に失敗しました。お待ち下さい。"
                        return;
                    }
                    document.getElementById('CommentLoad').innerText = `コメ番${GET_COMMENT_LIST[0].chat.no}まで読み込みました...\n`;
                    LOADED_COMMENT_NUM++
                    if (GET_COMMENT_LIST[0].chat.no < 5 || seigen == LOADED_COMMENT_NUM) {
                        clearInterval(LOAD_COMMENT)
                        console.log('完了')
                        document.getElementById('CommentLoad').innerText += `読み込みが終わりました。お待ち下さい。`;
                        PLAYCOMMENT()
                    }
                    COMMENT = COMMENT.concat(GET_COMMENT_LIST).sort(function(first, second) {
                        if (first.chat.date > second.chat.date) {
                            return 1;
                        } else if (first.chat.date < second.chat.date) {
                            return -1;
                        } else {
                            return 0;
                        }
                    })
                    console.log(COMMENT)
                });
            return
        }());
    }
    var NOW_DATE = new Date();
    var DATE_GETTIME = NOW_DATE.getTime() / 1000;
    kakolog_time = DATE_GETTIME
    const LOAD_COMMENT = setInterval(() => {
        GET_COMMENT(kakolog_time)
    }, 1000);
}


function PLAYCOMMENT() {
    let niconiComments
    let draw
    document.getElementById("zouryou_comment").style.display = "block";
    async function foo() {
        document.getElementsByClassName('CommentRenderer')[0].style.display = "none"
        Zouryou_Renderer.width = 1920;
        Zouryou_Renderer.height = 1080;
        const canvas = document.getElementById("zouryou_comment");
        const video = document.getElementById("MainVideoPlayer").children[0];
        niconiComments = new NiconiComments(canvas, COMMENT, {
            useLegacy: true,
        });
        //video.ontimeupdateを使用すると、呼び出し回数の関係でコメントカクつく
        draw = setInterval(() => niconiComments.drawCanvas(Math.floor(video.currentTime * 100)), 10);
        document.getElementById('CommentLoad').style.display = "none"
    }

    let href = location.href;
    let observer = new MutationObserver(function(mutations) {
        if (href !== location.href) {
            clearInterval(draw)
            document.getElementById("zouryou_comment").style.display = "none";
            document.getElementsByClassName('CommentRenderer')[0].style.display = "block"
            document.getElementById('zenkomebutton').disabled = false;
            href = location.href;
            COMMENT = []
            GET_HTML()
            return
        }
    });

    observer.observe(document, { childList: true, subtree: true });

    setTimeout(foo, 100)
}

async function GET_HTML() {
    const result = await fetch(location.href, {
        method: "GET"
    }).then(function(response) {
        return response.text();
    }).then(function(data) {
        const parser = new DOMParser();
        page_document = parser.parseFromString(data, "text/html");
    });
}

window.onload = function() {

    setTimeout(function() {
        document.getElementsByClassName('VideoOverlayContainer')[0].insertAdjacentHTML('beforeend', `
        <div id="allcommentsetting" style="display: none;background-color:rgb(0,0,0,0.8);width:200px;height:100px;padding:2px;position:absolute;right:40px;bottom:0px;">
            <p style="color:white;margin:0px">コメントを倍増</p>
            <small style="font-size:10px;color:whitesmoke">最大30程度が推奨です。それ以上呼び出すとPCがフリーズする可能性があります。</small>
             <input id="load_num" type="number" min="1" step="1" autocomplete="off" placeholder="20"></input>
            <button id="zenkomebutton">読み込み開始！</button>
        </div>
        `)
        document.getElementsByClassName('PlayerRepeatOnButton')[0].insertAdjacentHTML('beforebegin', `
        <button data-title="全コメ表示" type="button" class="ActionButton ControllerButton AllCommentViewButton" style="margin: 0px -4px;">
            <div class="ControllerButton-inner" style="transform: scale(100%,87%);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px">
                    <text font-weight="bold" transform="matrix(0.588408 0 0 1 0.588408 0)" stroke="null" xml:space="preserve" text-anchor="start" font-family="'Signika'" font-size="24" stroke-width="0" id="svg_4" y="19.76873" x="-0">ALL</text>
                </svg>
            </div>
        </button>
        `)

        CommentRenderer = document.getElementsByClassName('CommentRenderer')[0]
        Zouryou_Renderer_Elem = CommentRenderer.cloneNode(true);
        CommentRenderer.after(Zouryou_Renderer_Elem);
        Zouryou_Renderer = Zouryou_Renderer_Elem.children[0]
        Zouryou_Renderer.id = "zouryou_comment";
        const setting = document.getElementById('allcommentsetting')
        document.getElementsByClassName('AllCommentViewButton')[0].addEventListener('click', () => {
            if (setting.style.display == 'none') {
                setting.style.display = 'block'
            } else {
                setting.style.display = 'none'
            }
        }, false)
        document.getElementById('zenkomebutton').onclick = () => {
            let num = document.getElementById('load_num').value
            setting.style.display = 'none'
            seigen = (num != '') ? Number(num) : 20;
            document.getElementsByClassName('InView VideoContainer')[0].insertAdjacentHTML('afterbegin', '<div id="CommentLoad"></div>')
            document.getElementById('CommentLoad').style = "width: 100%;position: absolute;height: 100%;background-color: black;z-index: 6;opacity: 0.8;font-size:20px;"
            document.getElementById('zenkomebutton').disabled = true;
            setTimeout(START_SCRIPT(), 2000)
        }
    }, 1000)



}