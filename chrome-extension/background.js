chrome.runtime.onInstalled.addListener(function() {
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, function(tabs) {
    tabs.forEach(function(tab) {
      if (!tab.id) return;
      chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] }).catch(function() {});
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).catch(function() {});
    });
  });
});