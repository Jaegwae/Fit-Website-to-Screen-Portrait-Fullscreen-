chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_FULLSCREEN') {
      chrome.windows.getCurrent({}, (window) => {
        const isFullOrMax = window && (window.state === 'fullscreen' || window.state === 'maximized');
        sendResponse({ isFullscreen: isFullOrMax });
      });
      return true; // 비동기 응답임을 알려줌
    }
  });
  