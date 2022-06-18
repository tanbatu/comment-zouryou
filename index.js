let CommentRenderer, zouryouCanvasElement, videoElement, pipVideoElement, VideoSymbolContainer,
	CommentLoadingScreen, CustomVideoContainer, DefaultVideoContainer, PlayerContainer, CommentLoadingScreenWrapper;
let COMMENT = [];
let CommentLimit = 40;

async function LOADCOMMENT() {
	let LoadedCommentCount = 0, FailCount = 0;
	const parser = new DOMParser();
	const req = await fetch(location.href);
	const apiData = JSON.parse(parser.parseFromString(await req.text(), "text/html").getElementById("js-initial-watch-data").getAttribute("data-api-data"));
	const joinObj = function (obj, fDelimiter, sDelimiter) {
		const tmpArr = [];
		if (typeof obj === 'undefined') return '';
		if (typeof fDelimiter === 'undefined') fDelimiter = '';
		if (typeof sDelimiter === 'undefined') sDelimiter = '';
		for (let key in obj) {
			tmpArr.push(key + fDelimiter + obj[key]);
		}
		return tmpArr.join(sDelimiter);
	};
	//コメント取得
	logger(CommentLimit + '回読み込みます。');

	async function GET_COMMENT(TIME) {
		const threads = apiData.comment.threads;

		let params = {
			'thread': threads[1]['id'],
			'version': '20090904',
			'scores': '1',
			'nicoru': '3',
			'fork': 0,
			'language': '0',
			'when': TIME,
			'res_from': '-1000',
		};
		let url = `${threads[1]['server']}/api.json/thread?${joinObj(params, '=', '&')}`;
		logger(`[${LoadedCommentCount}/${CommentLimit}]: ${url}を読み込んでいます...`);
		const req = await fetch(url, {
			method: 'GET',
		});
		const res = await req.text();
		let GET_COMMENT_LIST;
		try {
			GET_COMMENT_LIST = JSON.parse(res);
			GET_COMMENT_LIST = GET_COMMENT_LIST.slice(2);
			TIME = GET_COMMENT_LIST[0].chat.date;
		} catch (e) {
			TIME -= 100;
			FailCount++;
			if (FailCount > 10) throw new Error("fail to get comment");
			logger(`[${LoadedCommentCount}/${CommentLimit}]: コメントの参照に失敗しました。お待ち下さい。`);
			GET_COMMENT(TIME);
			return;
		}
		CommentLoadingScreenWrapper.style.background = `linear-gradient(90deg,#0ff 0%,#0ff ${LoadedCommentCount / CommentLimit * 100}%,#999 ${LoadedCommentCount / CommentLimit * 100}%,#999 100%)`;
		logger(`[${LoadedCommentCount}/${CommentLimit}]: コメ番${GET_COMMENT_LIST[0].chat.no}まで読み込みました`);
		LoadedCommentCount++;
		COMMENT = COMMENT.concat(GET_COMMENT_LIST);
		console.log(COMMENT);
		FailCount = 0;
		if (GET_COMMENT_LIST[0].chat.no < 5 || CommentLimit === LoadedCommentCount) {
			console.log('完了');
			CommentLoadingScreenWrapper.style.background = `#0ff`;
			logger(`読み込みが終わりました。お待ち下さい。`);
			PLAYCOMMENT();
			return;
		}
		if (CommentLimit > 30) {
			await sleep(1000);
		}
		GET_COMMENT(TIME);
	}

	GET_COMMENT(new Date().getTime() / 1000);
}


function PLAYCOMMENT() {
	let niconiComments, draw;

	async function setup() {
		CustomVideoContainer.style.display = 'block';
		DefaultVideoContainer.style.display = 'none';
		console.log(COMMENT);
		niconiComments = new NiconiComments(zouryouCanvasElement, COMMENT, {
			video: videoElement, enableLegacyPiP: true
		});
		//video.ontimeupdateを使用すると、呼び出し回数の関係でコメントカクつく
		draw = setInterval(() => niconiComments.drawCanvas(Math.floor(videoElement.currentTime * 100)), 10);
		pipVideoElement.srcObject = zouryouCanvasElement.captureStream(60);
		pipVideoElement.muted = true;
		pipVideoElement.play();
		CommentLoadingScreenWrapper.style.display = 'none';
	}

	let href = location.href;
	let observer = new MutationObserver(function () {
		if (href !== location.href) {
			clearInterval(draw);
			CustomVideoContainer.style.display = 'none';
			DefaultVideoContainer.style.display = 'block';
			CommentLoadingScreen.innerHTML = '';
			document.getElementById('zenkomebutton').disabled = false;
			href = location.href;
			COMMENT = [];
		}
	});
	observer.observe(document, { childList: true, subtree: true });
	setTimeout(setup, 100);
}


const logger = (msg) => {
	const p = document.createElement('p');
	p.innerText = msg;
	CommentLoadingScreen.appendChild(p);
	CommentLoadingScreenWrapper.scrollBy(0, CommentLoadingScreen.clientHeight);
}

const sleep = (time) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, time);
	})
}

window.onload = function () {
	setTimeout(function () {
		document.getElementsByClassName('VideoOverlayContainer')[0].insertAdjacentHTML('beforeend', `
        <div id='allcommentsetting' style='display: none;background-color:rgb(0,0,0,0.8);width:200px;height:100px;padding:2px;position:absolute;right:40px;bottom:0;'>
            <p style='color:white;margin:0'>コメントを倍増</p>
            <small style='font-size:10px;color:whitesmoke'>最大30程度が推奨です。それ以上呼び出すとPCがフリーズする可能性があります。</small>
             <input id='load_num' type='number' min='1' step='1' autocomplete='off' placeholder='20'>
            <button id='zenkomebutton'>読み込み開始！</button>
        </div>
        `);
		(document.getElementsByClassName('PlayerRepeatOnButton')[0] || document.getElementsByClassName('PlayerRepeatOffButton')[0]).insertAdjacentHTML('beforebegin', `
        <button data-title='全コメ表示' type='button' class='ActionButton ControllerButton' id='AllCommentViewButton' style='margin: 0 -4px;'>
            <div class='ControllerButton-inner' style='transform: scale(100%,87%);'>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 20' width='48px' height='48px'>
                    <text font-weight='bold' transform='matrix(0.588408 0 0 1 0.588408 0)' stroke='null' xml:space='preserve' text-anchor='start' font-family='Signika' font-size='24' stroke-width='0' id='svg_4' y='19.76873' x='-0'>ALL</text>
                </svg>
            </div>
        </button>
        `);

		let customStyle = document.createElement('style');
		customStyle.innerHTML = '.CustomVideoContainer{width: 640px;height: 360px;}body.is-large:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}body.is-fullscreen .CustomVideoContainer {width: 100vw !important;height: 100vh !important;}@media screen and (min-width: 1286px) and (min-height: 590px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 854px;height: 480px;}@media screen and (min-width: 1392px) and (min-height: 650px){body.is-autoResize:not(.is-fullscreen) .CustomVideoContainer {width: 960px;height: 540px;}}';
		document.body.appendChild(customStyle);
		CommentRenderer = document.getElementsByClassName('CommentRenderer')[0];
		videoElement = document.getElementById('MainVideoPlayer').children[0];
		VideoSymbolContainer = document.getElementsByClassName('VideoSymbolContainer')[0];
		PlayerContainer = document.getElementsByClassName('PlayerContainer')[0];
		DefaultVideoContainer = document.getElementsByClassName('InView VideoContainer')[0];
		CustomVideoContainer = document.createElement('div');
		CustomVideoContainer.innerHTML = '<div class="CommentRenderer"><canvas id="zouryouCanvasElement" width="1920" height="1080"></canvas><video id="pipVideoElement"></video></div>';
		CustomVideoContainer.classList.add('CustomVideoContainer', 'InView');
		PlayerContainer.children[0].after(CustomVideoContainer);
		zouryouCanvasElement = document.getElementById('zouryouCanvasElement');
		pipVideoElement = document.getElementById('pipVideoElement');
		CommentLoadingScreenWrapper = document.createElement('div');
		CommentLoadingScreenWrapper.innerHTML = '<div id="CommentLoadingScreen"></div>';
		PlayerContainer.appendChild(CommentLoadingScreenWrapper);
		CommentLoadingScreen = document.getElementById('CommentLoadingScreen');
		CustomVideoContainer.style.display = 'none';
		zouryouCanvasElement.style = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;display:none';
		pipVideoElement.style = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:all';
		pipVideoElement.onpause = () => {
			pipVideoElement.play();
		};
		zouryouCanvasElement.id = 'zouryou_comment';

		const setting = document.getElementById('allcommentsetting');
		document.getElementById('AllCommentViewButton').addEventListener('click', () => {
			if (setting.style.display === 'none') {
				setting.style.display = 'block';
			} else {
				setting.style.display = 'none';
			}
		}, false);
		document.getElementById('zenkomebutton').onclick = () => {
			let num = document.getElementById('load_num').value;
			setting.style.display = 'none';
			CommentLimit = (num !== '') ? Number(num) : 20;
			CommentLoadingScreenWrapper.style = 'width: 100%;position: absolute;height: 100%;background-color: #999;z-index: 6;opacity: 0.8;font-size:20px;color:black;overflow: scroll;top:0;left:0';
			document.getElementById('zenkomebutton').disabled = true;
			setTimeout(LOADCOMMENT, 2000);
		};
	}, 1000);
};
