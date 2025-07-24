// storage에서 차단 사이트 리스트를 가져와 차단여부를 비동기 체크
function isBlockedSite() {
    return new Promise((resolve) => {
      const hostname = window.location.hostname.toLowerCase();
      chrome.storage.local.get({ blockedSites: [] }, (result) => {
        const blockedSites = result.blockedSites;
        const blocked = blockedSites.some(
          domain => hostname === domain || hostname.endsWith("." + domain)
        );
        resolve(blocked);
      });
    });
  }
  
  // background script에 전체화면/최대화 상태 요청
  function isRealFullscreen() {
    console.log("isRealFullscreen 호출");
    return new Promise((resolve) => {
      if (document.fullscreenElement) {
        console.log("표준 전체화면 API 감지됨");
        resolve(true);
        return;
      }
      chrome.runtime.sendMessage({ type: 'CHECK_FULLSCREEN' }, (response) => {
        if (response && response.isFullscreen) {
          console.log("background에서 전체화면 상태 true 반환");
          resolve(true);
        } else {
          const fallback =
            Math.abs(window.outerHeight - window.innerHeight) < 10 &&
            Math.abs(window.outerWidth - window.innerWidth) < 10;
          console.log(`fallback 전체화면 체크 결과: ${fallback}`);
          resolve(fallback);
        }
      });
    });
  }
  
  // 페이지 전체 크기 계산
  function getPageSize() {
    const body = document.body;
    const html = document.documentElement;
    const pageWidth = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );
    const pageHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    return { width: pageWidth, height: pageHeight };
  }
  
  // 가로 스크롤 존재 여부 확인
  function hasHorizontalScroll() {
    const html = document.documentElement;
    return (html.scrollLeft + html.clientWidth) < html.scrollWidth;
  }
  
  // 가로 스크롤 없어질 때까지 축소 반복
  function reduceUntilNoScroll(minScale = 0.1, step = 0.02) {
    console.log("reduceUntilNoScroll 호출");
    const body = document.body;
    const html = document.documentElement;
    let scale = 1;
  
    function tryReduce() {
      console.log(`tryReduce 호출 - 현재 scale: ${scale.toFixed(3)}`);
      if (!hasHorizontalScroll()) {
        console.log("가로 스크롤 없어짐, 축소 중단");
        return;
      }
      if (scale <= minScale) {
        console.log("최소 배율 도달, 축소 중단");
        return;
      }
      scale -= step;
      if (scale < minScale) scale = minScale;
  
      body.style.transformOrigin = "top left";
      body.style.transform = `scale(${scale})`;
      html.style.overflowX = "hidden";
      body.style.overflowX = "hidden";
  
      const pageSize = getPageSize();
      body.style.width = pageSize.width + "px";
      body.style.height = pageSize.height + "px";
  
      setTimeout(tryReduce, 40);
    }
  
    tryReduce();
  }
  
  // 스타일 원복
  function resetStyles() {
    console.log("resetStyles 호출 - 스타일 초기화");
    const body = document.body;
    const html = document.documentElement;
    body.style.transform = "";
    body.style.transformOrigin = "";
    html.style.overflow = "";
    body.style.overflow = "";
    body.style.width = "";
    body.style.height = "";
  }
  
  // 전체 동작 함수
  async function adjustScalePortraitFullscreen() {
    console.log("adjustScalePortraitFullscreen 호출");
    // 1. 사용자가 차단한 사이트인지 storage에서 확인
    const blocked = await isBlockedSite();
    if (blocked) {
      console.log("차단된 사이트이므로 동작하지 않음");
      resetStyles();
      return;
    }
  
    const isFullscreen = await isRealFullscreen();
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    console.log(`전체화면 여부: ${isFullscreen}, 세로 모드 여부: ${isPortrait}`);
  
    if (isFullscreen && isPortrait) {
      reduceUntilNoScroll();
    } else {
      resetStyles();
    }
  }
  
  // 실행 및 이벤트 핸들러 등록
  adjustScalePortraitFullscreen();
  
  window.addEventListener("resize", () => {
    console.log("window resize 이벤트 감지");
    adjustScalePortraitFullscreen();
  });
  
  document.addEventListener("fullscreenchange", () => {
    console.log("fullscreenchange 이벤트 감지");
    adjustScalePortraitFullscreen();
  });
  
  window.matchMedia("(orientation: portrait)").addEventListener("change", (e) => {
    console.log(`orientation change 이벤트 감지 - now portrait: ${e.matches}`);
    adjustScalePortraitFullscreen();
  });
  