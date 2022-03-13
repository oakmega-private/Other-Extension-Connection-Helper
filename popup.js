let openDropdown = false
let reportErr = false
document.querySelector('.popup-navbar-ellipse').addEventListener('focus', function() {
  connectPort('switchDropdown', 'open')
  openDropdown = true
})
document.querySelector('.popup-navbar-ellipse').addEventListener('blur', function() {
  connectPort('switchDropdown', 'hidden')
  setTimeout(function() {
    openDropdown = false
  }, 1000)
})
document.querySelector('.popup-action-restart').addEventListener('click', function() {
  if (!openDropdown) return
  restart()
})
document.querySelector('.popup-action-feedback').addEventListener('click', function() {
  if (!openDropdown) return
  redirectUrl('mailto:service@oakmega.com')
})
document.querySelector('.popup-action-praise').addEventListener('click', function() {
  if (!openDropdown) return
  chrome.tabs.create({ url: 'https://chrome.google.com/webstore/detail/botfat-%E4%B8%B2%E6%8E%A5%E5%B0%8F%E5%B9%AB%E6%89%8B/hihiknibpkegoidpjnpieccidmckcfgm?hl=en&authuser=1' })
})
document.querySelector('.popup-close').addEventListener('click', function() {
  connectPort('switchVisibility', 'hidden')
})
chrome.browserAction.onClicked.addListener(setInit)
const instruction = {
  beforeStart: {
    title: '快速串接您的 LINE 官方帳號',
    desc:'OakMega Social CRM 一次幫你實現業務、行銷與客服的各種情境！'
  },
  security: {
    title:'OakMega 串接小幫手 隱私權保護政策',
    desc:'我們非常重視您的個人隱私，並請您詳細閱讀以下有關隱私權保護政策的更多內容。'
  },
  openAccount: {
    title: '準備開始串接你的 LINE 官方帳號（<span class="popup-instruct-title-step">2</span>/3）',
    desc: '在開始串接前，請先登入並開啓要串接的官方帳號'
  },
  setProvider: {
    title: '設定 Provider（<span class="popup-instruct-title-step">3</span>/3）',
    desc: ''
  },
  toBotFat: {
    title:  '登入 OakMega（<span class="popup-instruct-title-step">1</span>/3）',
    desc:''
  },
  complete: {
    title:  '🎉 串接成功！開始使用 OakMega 吧！',
    desc: ''
  },
  report: {
    title: '回報問題',
    desc:''
  },
  receive: {
    title: '已收到您的回報',
    desc: ''
  },
  duplicate: {
    title: '您已串接過官方帳號',
    desc: ''
  }
}
const stepContent = {
  account: "<div class='popup-step-item'><div class='popup-step-num'>1</div><div>開啟要串接的<span class='popup-step-green'>LINE 官方帳號</span></div></div><div class='popup-step-item'><div class='popup-step-num'>2</div><div>確認以下官方帳號是否正確</div></div>",
  provider: "<div class='popup-step-item'><div class='popup-step-num'>1</div><div>請設定<span class='popup-step-green'>Provider 名稱</span><br>（此官方帳號的提供者為個人還是公司）</div></div><div class='popup-step-item'><div class='popup-step-num'>2</div><div>填寫<span class='popup-step-green'>隱私權網址</span>與<span class='popup-step-green'>服務條款</span><br>（選填，之後可更改）</div></div>",
  BotFat:  "<div class='popup-step-item'><div class='popup-step-num'>1</div><div>使用 Google 帳號登入 OakMega 後台</div></div><div class='popup-step-item'><div class='popup-step-num'>2</div><div>確認登入的 Google 帳號正確無誤</div></div><div class='popup-step-item'><div class='popup-step-num'>3</div><div>確認已輸入過邀請碼並點擊確認</div></div>"
}

let nextBtn = document.querySelector('.popup-btn-control')

document.querySelector('#security').addEventListener('click', function() {
  nextBtn.classList.remove('disable')
})
document.querySelector('#security-label').addEventListener('click', function() {
  nextBtn.classList.remove('disable')
})
document.querySelector('.popup-btn-control').addEventListener('click', next)
document.querySelector('.popup-btn-goback').addEventListener('click', backToPrev)
function next() {
  if (nextBtn.classList.contains('disable')) return
  switch (nextBtn.getAttribute('id')) {
    case 'security':
      getCurrentTabId(tabId => {
        var port = chrome.tabs.connect(tabId, {name: 'detectAccount'});
        port.onMessage.addListener(function(res) {
          if (res.length > 1) {
            chrome.storage.local.set({name: res[0], line_id: res[1], stage: 'botfatLogin', badge: res[2], head: res[3]})
          } else {
            chrome.storage.local.set({stage: 'botfatLogin' })
          }
          gotoBotFat()
        })
      })
      break;
    case 'toLineOA':
      connectPort('verifyLogin', '')
      break;
    case 'toProvider':
      chrome.storage.local.set({stage: 'provider'})
      chrome.storage.local.get('line_id', function(info){
        showTopAlert('success', '帳號連結成功')
        setTimeout(function() {
          getCurrentTabId(tabId => {
            chrome.tabs.update(tabId, {url: `https://manager.line.biz/account/@${info.line_id}/setting/messaging-api`})
            })
        }, 1500)
      })
      break;
    case 'provider':
      getCurrentTabId(tabId => {
        var port = chrome.tabs.connect(tabId, {name: 'provider'});
        chrome.storage.local.get('line_id', function(item) {
          const url = `https://botfat-yidc23zsiq-de.a.run.app/?bot=${item.line_id}`
          port.postMessage(url)
        })
        port.onMessage.addListener(function(res) {
          if (res == 'empty') {
            showTopAlert('error', '帳號連結有誤，請再試一次')
          } else if (res) {
            chrome.storage.local.set({channel_id: res[0], line_secret: res[1], stage: 'response'}, function() {
              const url = res[2].replace('messaging-api','response')
              showTopAlert('success', '帳號連結成功')
              setTimeout(function(){
                redirectUrl(url)
              },1500)
            })
          } else {
            showTopAlert('error', '帳號連結失敗')
            showAlert('exclamation', '請確認已設定好此帳號的 Provider（服務提供者）再繼續下一步。')
          }
        })
      })
      break;
    case 'redirectToBotFat':
      redirectToBotFat()
      break;
    case 'sendInfoAndSend':
      sendInfoAndSend()
      break;
  }
}
function backToPrev() {
  switch(nextBtn.id) {
    case 'toLineOA':
      setSecurity()
      break;
    case 'account':
      chrome.storage.local.set({stage: 'botfatLogin'})
      connectPort('removeVideo', 'account')
      hideItem(['.popup-video-img-account']) 
      setInit() 
      break;
    case 'toProvider':
      chrome.storage.local.set({stage: 'botfatLogin', name:'', line_id: '', badge: '', head: ''}, function(){
        connectPort('removeVideo', 'account')
        hideItem(['.popup-video-img-account']) 
        setInit() 
      })
      break;
    case 'provider':
      chrome.storage.local.set({stage: 'account'}, function() {
        connectPort('removeVideo', 'provider')
        hideItem(['.popup-video-img-provider', '.popup-alert'])
        document.querySelector('#dot-3').classList.remove('done')
        document.querySelector('#dot-3').classList.remove('active')
        setInit()       
      })
      break;
  }
}
function setInit() {
  chrome.storage.local.get(['stage','line_token'], function(item) {
    if (!item.stage) {
      connectPort('switchHeight', 'short')
      document.querySelector('.popup').style.height = '270px'
    }
    connectPort('switchVisibility', 'show')
    switch (item.stage) {
      case 'security':
        setSecurity()
        break;
      case 'botfatLogin':
        gotoBotFat()
        break;    
      case 'account':
        chooseAccount()
        break;
      case 'provider':
        setProvider()
        connectPort('addVideo', 'provider')
        break;
      case 'response':
        setResponse();
        break;
      case 'getProviderList':
        getProviderList()
        break;
      case 'detectProvider':
        detectProvider()
        break;
      case 'channelToken':
        getChannelToken()
        break;
      case 'newLogin':
        createNewLogin()
        break;
      case 'linkedOA':
        setLinkedOA()
        break;
      case 'callbackURL':
        setCallback()
        break;
      case 'liff':
        setLiff()
        break;
      case 'liffId':
        getLiffId()
        break;
      case 'publish':
        setPublish()
        break;
      case 'goingToBotfat':
        sendInfoAndSend()
        break;
      case 'onboardSuccess':
        onboardSuccess()
        break;
      default:
        setEnterPage()
        break;
    }
  })  
}
function retryStep() {
  getCurrentTabId(tabId => {
    var port = chrome.tabs.connect(tabId, {name: 'getLocation'});
    port.onMessage.addListener(function(url) {
      chrome.storage.local.get(['stage','channel_id','provider_url_list','line_login_channel_id','provider_id'], function(info) {
        switch (info.stage) {
          case 'getProviderList':
            detectUrlAndRetry(url, 'https://developers.line.biz/console')
            break;
          case 'detectProvider':
            detectUrlAndRetry(url, info.provider_url_list[0])
            break;
          case 'channelToken':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/${info.channel_id}/messaging-api`)
            break;
          case 'newLogin':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/new?type=line-login&provider=${info.provider_id}`)
            break;
          case 'linkedOA':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/${info.line_login_channel_id}/basics`)
            break;
          case 'callbackURL':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/${info.line_login_channel_id}/line-login`)
            break;
          case 'liff':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/${info.line_login_channel_id}/liff/new`)
            break;
          case 'liffId':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/${info.line_login_channel_id}/liff`)
            break;
          case 'publish':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/${info.line_login_channel_id}/liff`)
            break;
          case 'send':
            detectUrlAndRetry(url, `https://developers.line.biz/console/channel/${info.line_login_channel_id}/liff`)
            break
          default:
            console.log("RESTART")
            restart()
            break
        }
      })          
    })
  })
}
function detectUrlAndRetry(url, target) {
  if (url == target) {
    setInit()
  } else {
    redirectUrl(target)
  }
}
function stopOnboard() {
  showSendErrPage()
  reportErr = true
  document.querySelector('.popup-send-err-report').addEventListener('click', function() {
    chrome.storage.local.get(['name','line_id','line_secret','line_token','line_login_channel_id','line_login_secret', 'line_login_liff_id','stage', 'uuid', 'email'], function(info) {
      fetch('https://asia-east2-botfat.cloudfunctions.net/k_onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboarding_uuid: info.uuid,
          gmail: info.email,
          function: 'error_log',
          error_data: {
            name: info.name || '',
            line_id:info.line_id || '',
            stage: info.stage || '',
            info: document.querySelector('.popup-send-err-input').value || '',
            data: [info.line_secret || '', info.line_token || '', info.line_login_secret || '', info.line_login_channel_id || '', info.line_login_liff_id || '']
          }
        })
      })
      .then(res => {
        reportErr = false
        hideItem(['.popup-send-err', '.popup-alert-gray', '.popup-send-err-btnwrap'])
        showItem([
          { selector: '.popup-alert-green', state: 'inline' },
          { selector: '.popup-send-err-btnwrap-back', state: 'flex' }
        ])
        document.querySelector('.popup-send-err-btnwrap-back', 'flex')
        document.querySelector('.popup-alert-desc').innerText = '已收到您的問題回報，我們將盡快更新小幫手，並安排專人與您聯繫。'
        showInstruct('receive')
        document.querySelector('.popup-send-err-restart').addEventListener('click', function() {
          restart()
        })
        document.querySelector('.popup-send-err-close').addEventListener('click', function() {
          connectPort('switchVisibility', 'hidden')
          chrome.storage.local.clear()
          hideItem(['.popup-alert', '.popup-send-err-btnwrap-back'])
          setEnterPage()
        })
      })
      .catch(err => {
        showTopAlert('error', '回報失敗，請稍後再試')
      })
    })
  })
  document.querySelector('.popup-send-err-back').addEventListener('click',function() {
    reportErr = false
    hideItem(['.popup-alert', '.popup-alert-gray', '.popup-send-err', '.popup-send-err-btnwray'])
    setInit()
  })
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (reportErr) return
  switch(request.msg) {
    case 'botfatLoginSuccess':
      chrome.storage.local.set({ uuid: request.uuid, email: request.gmail, stage: 'account' }, function(){
        showTopAlert('success', '連結成功')
        setTimeout(function() {
          redirectUrl('https://manager.line.biz/')
        }, 1500)
      })
      break;
    case 'inputInviteCode':
      showTopAlert('error', '請先輸入邀請碼')
      break;
    // case 'hasCreatedAccount':
    //   chrome.storage.local.clear()
    //   showDuplicate()
    //   break;
    case 'notLoginYet':
      showTopAlert('error', '連結失敗，請登入 OakMega 後再試')
      break;
    case 'grabAccountInfo':
      const data = request.data
      chrome.storage.local.set({name: data[0], line_id: data[1], stage: 'account', badge: data[2], head: data[3]})
      if (data[3]) document.querySelector('.popup-account-head').src = data[3]
      document.querySelector('.popup-account-name').innerText = data[0]
      if (data[2] == 'green') {
        showItem([{ selector: '.popup-badge-green' }])
        hideItem(['.popup-badge-gray'])
      } else if (data[2] == 'blue') {
        showItem([{ selector: '.popup-badge-blue' }])
        hideItem(['.popup-badge-gray'])
      }
      setBtnId('toProvider')
      nextBtn.classList.remove('disable')
      break;
    case 'responseComplete':
      showTopAlert('success','設定成功')
      setTimeout(function() {
        chrome.storage.local.set({stage: 'getProviderList'})
        redirectUrl('https://developers.line.biz/console')
      }, 1500)
      break;
    case 'providerUrlList':
      chrome.storage.local.set({provider_url_list: request.urlList, provider_url_list_length:request.urlList.length, stage: 'detectProvider', provider_list_viewtime: 0})
      redirectUrl(request.urlList[0])
      break;
    case 'viewProvider':
      if (request.result) {
        const provider_id = request.url.replace('https://developers.line.biz/console/provider/', '')
        chrome.storage.local.set({stage: 'channelToken', provider_id})
        chrome.storage.local.get('channel_id', function(info) {
          redirectUrl(`https://developers.line.biz/console/channel/${info.channel_id}/messaging-api`)
        })
      } else {
        chrome.storage.local.get(['provider_url_list', 'provider_list_viewtime'], function(info) {
          const index = info.provider_url_list.findIndex(url => url == request.url)
          const length = info.provider_url_list.length
          if (index == length - 1) {
            chrome.storage.local.set({provider_list_viewtime: info.provider_list_viewtime + 1})
            redirectUrl(info.provider_url_list[0])  
          } else {
            redirectUrl(info.provider_url_list[index + 1])  
          }
        })
      }
      break;
    case 'getChannelTokenComplete':
      chrome.storage.local.set({stage: 'newLogin', line_token: request.token})
      chrome.storage.local.get('provider_id', function(info) {
        redirectUrl(`https://developers.line.biz/console/channel/new?type=line-login&provider=${info.provider_id}`)
      })
      break;
    case 'newLoginComplete':
      chrome.storage.local.set({stage: 'linkedOA'})
      setLinkedOA()
      break;
    case 'linkedOAComplete':
      chrome.storage.local.set({line_login_channel_id: request.channel_id, line_login_secret:request.channel_secret, stage: 'callbackURL'}, function() {
        showTopAlert('success', 'LINE Login 連結成功')
        setTimeout(function() {
          redirectUrl(`https://developers.line.biz/console/channel/${request.channel_id}/line-login`)
        }, 1000)
      })
      break;
    case 'callbackComplete':
      chrome.storage.local.set({stage: 'liff'}, function() {
        showTopAlert('success', 'Callback 連結設定成功')
        setTimeout(function() {
          redirectUrl(`https://developers.line.biz/console/channel/${request.channel_id}/liff/new`)
        }, 1000)
      })
      break;
    case 'liffComplete':
      chrome.storage.local.set({stage: 'liffId'}, function() {
        showTopAlert('success', '開設 LIFF 成功')
        setTimeout(getLiffId, 1500)
      })
      break;
    case 'getLiffIdComplete':
      chrome.storage.local.set({stage: 'publish', line_login_liff_id: request.id}, function() {
        showTopAlert('success', '抓取 LIFF id 成功')
        setTimeout(setPublish, 1500)
      })
      break
    case 'publishComplete':
      chrome.storage.local.set({stage: 'goingToBotfat'}, function() {
        showTopAlert('success', 'Login 發布成功')
        setTimeout(function() {
          redirectUrl('https://botfat.com/home/onboarding/extension')
        }, 1500)
      })
      break;
    case 'connectBotFatUrlError':
      showTopAlert('error','邀請碼錯誤')
      // setTimeout(function() {
      //   redirectUrl('https://botfat.com/home/onboarding')
      // }, 1000)
      break;
    case 'createSuccess':
      showTopAlert('success', '串接成功')
      onboardSuccess()
      break;
    case 'postErrorMsg':
      chrome.storage.local.get(['name','line_id','line_secret','line_token','line_login_channel_id','line_login_secret', 'line_login_liff_id','stage', 'uuid', 'email'], function(info) {
        fetch('https://asia-east2-botfat.cloudfunctions.net/k_onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            onboarding_uuid: info.uuid,
            gmail: info.email,
            function: 'error_log',
            error_data: {
              name: info.name || '',
              line_id:info.line_id || '',
              stage: request.stage || info.stage || '',
              info: request.info || '',
              data: [info.line_secret || '', info.line_token || '', info.line_login_secret || '', info.line_login_channel_id || '', info.line_login_liff_id || '']
            }
          })
        })
      })
      break;
  }
})
setInit()

function setEnterPage() {
  connectPort('switchHeight', 'short')
  showInstruct('beforeStart')
  document.querySelector('.popup-instruct').classList.add('enter')
  showItem([
    { selector: '.popup-start-btn-box'},
    { selector: '.popup-navbar', state: 'flex' }
  ])
  hideItem(['.popup-navbar-ellipse', '.popup-navbar-moreaction', '.popup-step', '.popup-bottom-btnbar', '.popup-btn-control', '.popup-end-confetti', '.popup-end'])
  document.querySelector('.popup-activate-assistant').addEventListener('click', function() {
    connectPort('switchHeight', 'long')
    document.querySelector('.popup').style.height = '640px'
    chrome.storage.local.set({stage: 'security'}, function(){
      setInit()
      document.querySelector('.popup-navbar-ellipse').style.display = 'initial'
      document.querySelector('.popup-navbar-moreaction').style.display = 'initial'
      nextBtn.style.display = 'flex'
    })
  })
  document.querySelector('.popup-remove-assistant').addEventListener('click', function() {
    connectPort('switchVisibility', 'hidden')
    setTimeout(function() {
      chrome.management.uninstallSelf()
    }, 1000)
  })
}

function setSecurity() {
  hideItem(['.popup-start-btn-box', '.popup-step', '.popup-account-prev', '.popup-alert', '.popup-btn-goback', '.popup-navbar-ellipse', 'popup-send-err-btnwrap-back'])
  document.querySelector('.popup-bottom-dotbar').style.visibility = 'hidden'
  showItem([
    { selector: '.popup-security-check', state: 'flex' }, 
    { selector: '.popup-security-contract' }, 
    { selector: '.popup-bottom-btnbar', state:'flex' },
    { selector: '.popup-bottom-bar', state: 'flex'}
  ])
  showInstruct('security')
  document.querySelector('.popup-security-circle').checked = false
  nextBtn.classList.add('disable')
  setBtnId('security')
}
// function showDuplicate() {
//   hideItem(['.popup-mask', '.popup-bottom-bar', '.popup-alert-light'])
//   showItem([
//     { selector: '.popup-alert-exclamation', state: 'inline' },
//     { selector: '.popup-send-err-btnwrap-back', state: 'flex' }
//   ])
//   document.querySelector('.popup-send-err-btnwrap-back', 'flex')
//   document.querySelector('.popup-alert-desc').innerText = '一個 OakMega 帳號只能連接一個 LINE 官方帳號喔！'  
//   showInstruct('duplicate')
//   document.querySelector('.popup-send-err-restart').addEventListener('click', function() {
//     restart()
//   })
//   document.querySelector('.popup-send-err-close').addEventListener('click', function() {
//     connectPort('switchVisibility', 'hidden')
//     hideItem(['.popup-alert', '.popup-send-err-btnwrap-back'])
//     setEnterPage()
//   })
// }
function chooseAccount() {
  hideItem(['.popup-security-check', '.popup-security-contract', '.popup-mask'])
  showItem([
    { selector: '.popup-video-item' },
    { selector: '.popup-video-img-account' },
    { selector: '.popup-account-regrab', state: 'block' },
    { selector: '.popup-btn-goback', state: 'flex' }
  ])
  document.querySelector('.popup-account-regrab').addEventListener('click', detectAccountInfo)
  showInstruct('openAccount')
  setProgress(2)
  showStep('account')
  setBtnId('account')
  connectPort('addVideo', 'account')
  chrome.storage.local.get(['name', 'badge', 'head'], function(info) {
    if (info['name']) {
      if (info['head']) document.querySelector('.popup-account-head').src = info.head
      document.querySelector('.popup-account-name').innerText = info.name
      setBtnId('toProvider')
      if (info.badge == 'green') {
        showItem([{ selector:'.popup-badge-green' }])
        hideItem(['.popup-badge-gray'])
      } else if (info.badge == 'blue') {
        showItem([{ selector:'.popup-badge-blue' }])
        hideItem(['.popup-badge-gray'])
      }
    } else {
      detectAccountInfo()
    }
  })
  showItem([{ selector:'.popup-account-prev', state:'flex' }])
}

function detectAccountInfo() {
  getCurrentTabId(tabId => {
    let port = chrome.tabs.connect(tabId, {name: 'detectAccount'});
    port.onMessage.addListener(function(res) {
      if (res.length > 1) {
        chrome.storage.local.set({name: res[0], line_id: res[1], badge: res[2], head: res[3]})
        if (res[3]) {
          document.querySelector('.popup-account-head').src = res[3]
        }
        document.querySelector('.popup-account-name').innerText = res[0]
        if (res[2] == 'green') {
          showItem([{ selector: '.popup-badge-green' }])
          hideItem(['.popup-badge-gray', '.popup-badge-blue'])
        } else if (res[2] == 'blue') {
          showItem([{ selector: '.popup-badge-blue' }])
          hideItem(['.popup-badge-gray', '.popup-badge-green'])
        }      
        setBtnId('toProvider')
        nextBtn.classList.remove('disable')
      } else {
        nextBtn.classList.add('disable')
        setBtnId('account')      
      }
    })
  })
}

function setProvider() {
  showInstruct('setProvider')
  showStep('provider')
  showItem([
    { selector: '.popup-btn-goback', state:'flex' },
    { selector: '.popup-video-img-provider' },
    { selector: '.popup-video-item'}
  ])
  showAlert('light','已開啟過 Messaging API 請直接前往下一步')
  setBtnId('provider')
  setProgress(3)
}

function setResponse() {
  autoLoading()
  connectPort('response')
}

function getProviderList() {
  autoLoading('自動化串接中，網頁畫面會自動跳轉數次，請稍候(1/2)')
  connectPort('getProviderList')
}

function detectProvider() {
  autoLoading('自動化串接中，網頁畫面會自動跳轉數次，請稍候(2/2)')
  chrome.storage.local.get(['name'], function(info) {
    goIntoProvider(info.name)
  })
}

function goIntoProvider(name) {
  connectPort('viewProviderList', name)
}
function getChannelToken() {
  autoLoading()
  chrome.storage.local.get('name', function(item) {
    connectPort('channelToken', item.name)
  })
}
function createNewLogin() {
  autoLoading()
  chrome.storage.local.get('name', function(item) {
    connectPort('newLogin', item.name)
  })
}
function autoLoading(msg) {
  if (msg) {
    document.querySelector('.popup-loading-desc').innerText = msg
  } else {
    document.querySelector('.popup-loading-desc').innerText = "資料抓取中，請稍候..."
  }
  document.querySelector('.popup-mask').style.display = 'flex'
  document.querySelector('.popup-mask-retry').addEventListener('click', retryStep)
  document.querySelector('.popup-mask-stop').addEventListener('click', stopOnboard)
  document.querySelector('.popup-mask-close').addEventListener('click', function(){
    connectPort('switchVisibility', 'hidden')
  })
}
function setLinkedOA() {
  autoLoading()
  chrome.storage.local.get('line_id',function(item) {
    connectPort('linkedOA', item.line_id)
  })
}
function setCallback() {
  autoLoading()
  connectPort('callback')
}
function setLiff() {
  autoLoading()
  connectPort('newLiff')
}
function getLiffId() {
  autoLoading()
  connectPort('getLiffId')
}
function setPublish() {
  autoLoading()
  connectPort('publish')
}
function setBtnId(id) {
  nextBtn.setAttribute('id', id)
}
function setProgress(num) {
  for (let i = 1; i <= num; i++ ) {
    const node = document.querySelector(`#dot-${i}`)
    switch (i) {
      case num:
        node.classList.add('done')
        node.classList.add('active')
        break;
      case num - 1:
        node.classList.add('done')
        node.classList.remove('active')
        break;
      default:
        node.classList.add('done')
        break;
    }
  }
  document.querySelector('.popup-bottom-dotbar').style.visibility = 'visible'
}
function gotoBotFat() {
  hideItem(['.popup-security-check', '.popup-security-contract', '.popup-video', '.popup-mask', '.popup-alert-exclamation', '.popup-account-prev', '.popup-account-regrab'])
  showInstruct('toBotFat')
  setBtnId('toLineOA')
  showStep('BotFat')
  showAlert('light', '如已登入 OakMega ，請直接前往下一步')
  showItem([
    { selector: '.popup-btn-goback', state: 'flex' },
    { selector: '.popup-navbar-ellipse' }
  ])
  document.querySelector('.popup-alert').style.height = '48px'
  setProgress(1)
}
function sendInfoAndSend() {
  autoLoading('正在將資料傳送到 OakMega ......')
  chrome.storage.local.get(['name','line_id','line_secret','line_token','line_login_channel_id','line_login_secret','line_login_liff_id'], function(info) {
    const postdata = {
      name: info.name,
      line_id: info.line_id,
      line_secret: info.line_secret,
      line_token: info.line_token,
      line_login_secret: info.line_login_secret,
      line_login_channel_id: info.line_login_channel_id,
      line_login_liff_id: info.line_login_liff_id
    }
    connectPort('onboarding', JSON.stringify(postdata))
  })
}
function onboardSuccess() {
  hideItem(['.popup-step', '.popup-instruct', '.popup-alert', '.popup-bottom', '.popup-mask', '.popup-btn-control', '.popup-navbar'])
  showItem([
    { selector: '.popup-end', state: 'flex'},
    { selector: '.popup-end-confetti' }
  ])
  chrome.storage.local.get('head', function(info) {
    if (info.head !== 'https://static.line-scdn.net/biz-app/edge/manager/img/common/no-image-profile.png') {
      document.querySelector('.popup-end-userhead').src = info.head
    }
  })
  chrome.storage.local.clear()
  setTimeout(function() {
    setEnterPage()
  }, 3000)
  document.querySelector('.popup-end-close').addEventListener('click', function() {
    connectPort('switchVisibility', 'hidden')
    setEnterPage()
  })
}
function restart() {
  chrome.storage.local.clear()
  chrome.storage.local.set({stage: ''})
  hideItem(['.popup-alert', '.popup-video-img-provider', '.popup-video-img-account', '.popup-badge-blue', '.popup-badge-green', '.popup-btn-goback', '.popup-send-err-btnwrap-back'])
  showItem([
    { selector: '.popup-badge-gray' },
    { selector: '.popup-bottom', state: 'flex' },
    { selector: '.popup-instruct'},
    { selector: '.popup-btn-control', state: 'flex' }
  ])
  const id = document.querySelector('.popup-btn-control').id
  connectPort('removeVideo', 'account')
  connectPort('removeVideo', 'provider')
  document.querySelector('.popup-security-circle').checked = false
  document.querySelector('#dot-2').classList.remove('done')
  document.querySelector('#dot-2').classList.remove('active')
  document.querySelector('#dot-3').classList.remove('done')
  document.querySelector('#dot-3').classList.remove('active')
  document.querySelector('.popup-bottom-dotbar').style.visibility = 'hidden'
  setInit()
}
function showSendErrPage() {
  showInstruct('report')
  showItem([
    { selector: '.popup-alert', state: 'flex' },
    { selector: '.popup-alert-gray', state: 'inline' },
    { selector: '.popup-send-err' },
    { selector: '.popup-send-err-btnwrap', state: 'flex'}
  ])
  hideItem(['.popup-navbar-right', '.popup-alert-light', '.popup-mask', '.popup-step', '.popup-bottom', '.popup-video-item','.popup-security-check', ])
  document.querySelector('.popup-alert-desc').innerText = '由於 LINE 後台不時會做更動，可能導致串接功能的異常'
}
function showTopAlert(state, desc) {
  const type = state == 'success'
  const topAlert = document.querySelector(`.popup-topalert${type ? '.popup-success' : '.popup-fail'}`)
  document.querySelector(`.popup-${type ? 'success' : 'fail'}-word`).innerText = desc
  topAlert.style.display = 'flex'
  setTimeout(function() {
    topAlert.style.display = 'none'
  }, 1500)
}
function showAlert(icon, word) {
  document.querySelector('.popup-alert').style.display = 'flex'
  document.querySelector('.popup-alert').style['align-items'] = 'center'
  if (icon == 'light') {
    hideItem(['.popup-alert-exclamation', '.popup-alert-gray', '.popup-alert-green'])
    document.querySelector('.popup-alert-light').style.display = 'flex'
  } else if (icon == 'exclamation') {
    hideItem(['.popup-alert-light', '.popup-alert-gray', '.popup-alert-green'])
    document.querySelector('.popup-alert-exclamation').style.display = 'flex'
  }
  document.querySelector('.popup-alert-desc').innerText = word
}
function showInstruct(stage) {
  document.querySelector('.popup-instruct-title').innerHTML = instruction[stage].title
  document.querySelector('.popup-instruct-desc').innerHTML = instruction[stage].desc
  showItem([{ selector: '.popup-instruct' }])
}
function showStep(stage) {
  document.querySelector('.popup-step').innerHTML = stepContent[stage]
  document.querySelector('.popup-step').style.display = 'block'
  showItem([{ selector: '.popup-step' }])
}
function redirectUrl(url) {
  getCurrentTabId(tabId => {
    chrome.tabs.update(tabId, {url})
  })
}
function getCurrentTabId(callback){
  chrome.tabs.getCurrent(function(tab) {
    if (callback) callback(tab.id)
  })
}
function connectPort(portname, msg) {
  getCurrentTabId(tabId => {
    var port = chrome.tabs.connect(tabId, {name: portname})
    if (msg) port.postMessage(msg)
  })
}
function hideItem(selectorList) {
  selectorList.forEach(item => {
    if (document.querySelector(item)) document.querySelector(item).style.display = 'none'
  })
}
function showItem(selectorList) {
  selectorList.forEach(item => {
    document.querySelector(item.selector).style.display = item.state || 'block'
  })
}