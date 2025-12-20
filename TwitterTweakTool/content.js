function removeAllPromotionTweet() {
  let targets = document.evaluate(
    "//article[child::div//*[name()='svg']/*[name()='g']/*[contains(@d, 'M19.498')]]",
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

let currentUrl = "";
function forceNewestTweetApply() {
  let nowUrl = location.href;
  if (nowUrl == currentUrl) {
    return;
  }
  let homeUrlArray = [
    "https://twitter.com/home",
    "https://mobile.twitter.com/home",
    "https://x.com/home",
    "https://mobile.x.com/home",
  ];
  if (!homeUrlArray.includes(nowUrl)){
    currentUrl = nowUrl;
    return;
  }
  let ossumeTabSelected = document.evaluate("//div[@role='tab' and @aria-selected='true' and descendant::span[text()='おすすめ']]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
  let followTab = document.evaluate("//div[@role='tab' and @aria-selected and descendant::span[text()='フォロー中']]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
  // 「おすすめ」タブが選択されている場合には「フォロー中」タブを .click() する
  if (ossumeTabSelected && followTab) {
  console.log("TTT: フォロー中を選択します。")
	followTab.click();
	currentUrl = nowUrl;
  }
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
