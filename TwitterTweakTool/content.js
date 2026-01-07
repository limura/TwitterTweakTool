function removeAllPromotionTweet() {
  let targets = document.evaluate(
	"//main//section//div[@data-testid='placementTracking' and not(child::div[@data-testid='videoPlayer'])]",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  var i = 0;
  while (true) {
    let element = targets.snapshotItem(i++);
    if (element == undefined) {
      break;
    }
    //element.style.display="none";
    element.style.opacity = 0.1;
  }
}

function guessPostTimelineSortType() {
	let targets = document.evaluate(
		"//article[@role='article' and @data-testid='tweet' and descendant::button[contains(@aria-label,'Grok')]]//a[contains(@href,'/status/') and @role='link']/time/@datetime",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
	);

	// 新しい順なら true
	let isNewestFirst = true;
	for (let i = 0; i < targets.snapshotLength - 1; i++) {
		// 現在の要素と次の要素の時刻を取得
		let currentTime = new Date(targets.snapshotItem(i).textContent).getTime();
		let nextTime = new Date(targets.snapshotItem(i + 1).textContent).getTime();

		// もし「現在の要素」が「次の要素」より古ければ、降順ではない
		if (currentTime < nextTime) {
			isNewestFirst = false;
			break;
		}
	}
	return isNewestFirst;
}

function checkTimelineSortTypeAndRecover() {
	let isNewestFirst = guessPostTimelineSortType();
	if(isNewestFirst) {
		return;
	}
	let followTabDropdown = document.evaluate("//div[@role='tab' and @aria-selected and @aria-haspopup='menu']//div[@dir='ltr']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
	if(followTabDropdown){
		followTabDropdown.click();
		setTimeout(()=> {
			let newestSelector = document.evaluate("//div[@role='menu']//div[@data-testid='Dropdown']/div[@role='menuitem'][2]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0)
			newestSelector?.click();
		}, 500);
	}
}

let currentUrl = "";
function forceNewestTweetApply() {
  let nowUrl = location.href;
  if (nowUrl == currentUrl) {
    return;
  }
  currentUrl = nowUrl;
  let homeUrlArray = [
    "https://twitter.com/home",
    "https://mobile.twitter.com/home",
    "https://x.com/home",
    "https://mobile.x.com/home",
  ];
  if (!homeUrlArray.includes(nowUrl)){
    return;
  }
  let tabElements = document.evaluate("//div[@role='tablist'][count(div[@role='presentation']/div[@role='tab' and @aria-selected]) >= 2 and count(div[@role='presentation']/div[@role='tab' and @aria-selected]) <= 5]/div[@role='presentation']/div[@role='tab' and @aria-selected]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  if(tabElements.snapshotLength <= 1) {
	return;
  }
  let ossumeTab = tabElements.snapshotItem(0);
  let ossumeTabSelected = ossumeTab.getAttribute('aria-selected') == 'true';
  console.log("ossumeTabSelected?", ossumeTabSelected);
  let followTab = tabElements.snapshotItem(1);
  // 「おすすめ」タブが選択されている場合には「フォロー中」タブを .click() する
  console.log("followTab", followTab);
  var delay = false;
  if (ossumeTabSelected && followTab) {
	followTab.click();
	delay = true;
  }
  // フォロー中をクリックしたなら少しまってから、並べ替えが「人気」なのか「最新」なのかを判断する
  setTimeout(checkTimelineSortTypeAndRecover, delay * 2000);
}

function ClickMorePostContent() {
  // この xpath はかなり怪しいので順次直さないと多分だめ。
  let targetElement = document.evaluate("//div[@data-testid='cellInnerDiv']//*[@role='button' and descendant::span[contains(text(),'ポストをさらに表示')]]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)?.snapshotItem(0);
  if (targetElement) {
    console.log("TwitterTweakTool: click element:", targetElement);
    targetElement.click();
  }
}

let observer = new MutationObserver((e) => {
  removeAllPromotionTweet();
  forceNewestTweetApply();
  ClickMorePostContent();
});

setTimeout(() => {
  observer.observe(document.body, { childList: true, subtree: true });
  removeAllPromotionTweet();
}, 2000);

// keydown でトリガーして keyup で遷移しないと遷移した直後に keydown が発生して1ページめくられてしまう(´・ω・`)
var NEXT_HREF = undefined;
document.body.addEventListener("keyup", (event) => {
  if (!NEXT_HREF) {
    return;
  }
  let tmpHref = NEXT_HREF;
  NEXT_HREF = undefined;
  if (event?.key == "ArrowRight") {
    tmpHref.scrollIntoView(true);
  }
  if (event?.key == "ArrowLeft") {
    tmpHref.scrollIntoView(false);
  }
  tmpHref.click();
});

function CheckAndSetNextPhotoHref() {
  // 次の画像が無くて(次の画像へのボタンが表示されていないという確認)
  if (
    document
      .evaluate(
        "//div[@aria-labelledby='modal-header']//div[@data-testid='Carousel-NavRight']",
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      )
      .snapshotItem(0)
  ) {
    return;
  }
  // 現在表示している画像のあるポストには「時間 - 年月日」みたいなリンクがある(他のにはない)ので、それを目標に前後のポストの画像を取り出します。
  let nextImagePhotoElement = document.evaluate("//div[@data-testid='cellInnerDiv' and preceding-sibling::div[descendant::a[@role='link' and @aria-describedby]]]//a[contains(@href,'/photo/1')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
  NEXT_HREF = nextImagePhotoElement;
}
function CheckAndSetPreviousPhotoHref() {
  // 前の画像が無くて
  if (
    document
      .evaluate(
        "//div[@aria-labelledby='modal-header']//div[@data-testid='Carousel-NavLeft']",
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      )
      .snapshotItem(0)
  ) {
    return;
  }
  // 現在表示している画像のあるポストには「時間 - 年月日」みたいなリンクがある(他のにはない)ので、それを目標に前後のポストの画像を取り出します。
  let prevImagePhotoElementTargets = document.evaluate("//div[@data-testid='cellInnerDiv' and following-sibling::div[descendant::a[@role='link' and @aria-describedby]]]//a[contains(@href,'/photo/')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  if (prevImagePhotoElementTargets && prevImagePhotoElementTargets.snapshotLength > 0) {
    let lastIndex = prevImagePhotoElementTargets.snapshotLength - 1;
    NEXT_HREF = prevImagePhotoElementTargets.snapshotItem(lastIndex);
  }else{
    NEXT_HREF = null;
  }
}

document.body.addEventListener("keydown", (event) => {
  // → キーか ← キーが押されて
  //console.log("keydown", event?.key);
  if (event?.key != "ArrowRight" && event?.key != "ArrowLeft") {
    return;
  }
  // 画像を開いているなら
  if (!location.href?.match(/\/status\/[0-9]+\/photo\//)) {
    return;
  }
  if (event?.key == "ArrowRight") {
    CheckAndSetNextPhotoHref();
  }
  if (event?.key == "ArrowLeft") {
    CheckAndSetPreviousPhotoHref();
  }
});
