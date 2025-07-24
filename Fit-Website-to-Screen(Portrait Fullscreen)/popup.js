// 현재 탭의 도메인 가져오기
function getCurrentTabDomain(cb) {
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
      if (tabs.length === 0) return;
      const url = new URL(tabs[0].url);
      cb(url.hostname);
    });
  }
  
  // 차단/허용 사이트 목록 가져오기/설정
  function getBlockedSites(cb) {
    chrome.storage.local.get({blockedSites: []}, result => cb(result.blockedSites));
  }
  function setBlockedSites(list, cb) {
    chrome.storage.local.set({blockedSites: list}, cb);
  }
  
  // 차단 도메인 목록 표시
  function showBlockedList(domains, currentDomain) {
    const blockedListDiv = document.getElementById('blockedList');
    if (domains.length === 0) {
      blockedListDiv.innerHTML = "<i>차단된 사이트가 없습니다.</i>";
      return;
    }
    let html = "<b>확장 프로그램 사용 안 하는 사이트 목록:</b><ul>";
    domains.forEach(domain => {
      html += `<li${domain === currentDomain ? ' style="color:#0076B6;"' : ''}>${domain}</li>`;
    });
    html += "</ul>";
    blockedListDiv.innerHTML = html;
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const $site = document.getElementById('site');
    const $button = document.getElementById('toggleBlock');
    const $msg = document.getElementById('msg');
    let thisDomain = "";
  
    function refreshBlockedList(selectedDomain="") {
      getBlockedSites(list => {
        showBlockedList(list, selectedDomain || thisDomain);
        $button.textContent = list.includes(thisDomain)
          ? "이 사이트에서는 확장 프로그램 사용"
          : "이 사이트에서는 확장 프로그램 사용 안함";
      });
    }
  
    getCurrentTabDomain(domain => {
      thisDomain = domain;
      $site.textContent = thisDomain;
      refreshBlockedList(thisDomain);
    });
  
    $button.onclick = () => {
      getBlockedSites(list => {
        let changed;
        let doBlock;
        if (list.includes(thisDomain)) {
          // 차단 해제
          changed = list.filter(site => site !== thisDomain);
          doBlock = false;
          $msg.textContent = "이 사이트에서 확장이 다시 작동합니다.";
        } else {
          // 차단 추가
          changed = [...list, thisDomain];
          doBlock = true;
          $msg.textContent = "이 사이트에서 확장이 동작하지 않습니다.";
        }
        setBlockedSites(changed, () => {
          setTimeout(()=>{ $msg.textContent = ""; }, 1000);
          refreshBlockedList(thisDomain);
        });
      });
    };
  });
  