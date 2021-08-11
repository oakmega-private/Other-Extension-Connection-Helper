
chrome.runtime.onInstalled.addListener(function(obj) {
  if (obj.reason == 'install') {
    chrome.tabs.create({url: "https://botfat.com/login/?next=/home/onboarding/"})
    chrome.storage.local.clear()
  }
})
