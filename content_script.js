chrome.runtime.onConnect.addListener(function(port) {
  switch (port.name) {
    case 'verifyLogin':
      verifyBotfatLogin()
      break;
    case 'detectAccount':
      if (window.location.href.includes('manager.line.biz/account/')){
        const name = document.querySelector('.lead').innerText
        const line_id = window.location.href.split('/').filter(item => item.includes('@'))[0].split('@')[1]
        const icon = document.querySelector('.lead i').classList
        const badge = icon.contains('text-success') ? 'blue' : icon.contains('text-primary') ? 'green' : 'gray'
        const head = document.querySelector('.w-100.h-100').style.background.split('"')[1]
        port.postMessage([name, line_id, badge, head])
      } else {
        document.querySelector('body div').addEventListener('DOMSubtreeModified', autoDetectAccount)
        port.postMessage(false)
      }
      break;
    case 'provider':
      port.onMessage.addListener(function(url) {
        if (document.querySelectorAll('.btn-outline-primary').length){
          const info = document.querySelectorAll('.flex-1')
          const arr = [info[0].innerText, info[1].innerText, window.location.href]
          if (!info[0].innerText || !info[1].innerText) {
            port.postMessage('empty')
            return
          }
          const inputBox = document.querySelector('input[name=webhookEndpoint]')
          inputBox.value = url
          inputBox.dispatchEvent(new Event('input'))
          document.querySelector('.btn-primary').click()
          port.postMessage(arr)
        } else {
          port.postMessage(false)
        }
      })
      break;  
    case 'response':
      addBgMask()
      setResponse()
      break;
    case 'getProviderList':
      addBgMask()
      confirmLang()
      getProviderList()
      break;
    case 'viewProviderList':
      addBgMask()
      port.onMessage.addListener(function(msg) {
        setTimeout(function() {
          findOutChannel(msg)
        }, 2000)
      })
      break;
    case 'channelToken':
      addBgMask()
      getChannelToken()
      break;
    case 'newLogin':
      addBgMask()
      port.onMessage.addListener(function(name) {
        setNewLogin(name)
      })
      break;
    case 'linkedOA':
      addBgMask()
      port.onMessage.addListener(function(id) {
        setLinkedOA(`@${id}`, 'new')
      })
      break;
    case 'callback':
      addBgMask()
      setCallback()
      break;
    case 'newLiff':
      addBgMask()
      setLiff()
      break;
    case 'getLiffId':
      addBgMask()
      getLiffId()
      break;
    case 'publish':
      setPublish()
      break;
    case 'publishChannel':
      if (document.querySelector('.dc-channel-status').innerText.trim() == 'Developing') {
        document.querySelector('.dc-channel-status').click()
        port.postMessage('isPublishing')  
      } else {
        port.postMessage('hasPublish')
      }
      
    case 'switchVisibility':
      port.onMessage.addListener(function(state) {
        if (state == 'show') {
          document.querySelector('#popup-container').style.visibility = 'unset'
        } else {
          const bgmask = document.querySelector('#popup-bgmask')
          if (bgmask) document.body.removeChild(bgmask)
          document.querySelector('#popup-container').style.visibility = 'hidden'
          removeVideo('account')
          removeVideo('provider')
        }
      })
      break;
    case 'switchDropdown':
      port.onMessage.addListener(function(msg) {
        switchDropdown(msg)
      })
      break;
    case 'switchHeight':
      port.onMessage.addListener(function(msg) {
        setBoxHeight(msg)
      })
      break;
    case 'removeBg':
      document.querySelectorAll('#popup-bgmask').forEach(item => item.style.display = 'none')
      break;
    case 'getLocation':
      port.postMessage(window.location.href)
      break;
    case 'addVideo':
      port.onMessage.addListener(function(msg) {
        if (msg == 'account' &&  !document.querySelector('#popup-video-account')) {
          addVideo('account')
        } else if (msg == 'provider' && !document.querySelector('#popup-video-provider')) {
          addVideo('provider') 
        }
      })
      break;
    case 'removeVideo':
      port.onMessage.addListener(function(type) {
        removeVideo(type)
      })
      break;
    case 'onboarding':
      port.onMessage.addListener(function(data) {
        toConnection(data)
      })
      break;
  }
})

let detectAccountLock = false

function autoDetectAccount() {
  if (detectAccountLock) return
  detectAccountLock = true
  setTimeout(grabAccountDetail, 1000)
}
function grabAccountDetail() {
  if (window.location.href.includes('manager.line.biz/account/')){
    const name = document.querySelector('.lead').innerText
    const line_id = window.location.href.split('/').filter(item => item.includes('@'))[0].split('@')[1]
    const icon = document.querySelector('.lead i').classList
    const badge = icon.contains('text-success') ? 'blue' : icon.contains('text-primary') ? 'green' : 'gray'
    const head = document.querySelector('.w-100.h-100').style.background.split('"')[1]
    chrome.runtime.sendMessage({msg:'grabAccountInfo', data: [name, line_id, badge, head]})
    document.querySelector('body div').removeEventListener('DOMSubtreeModified', autoDetectAccount)
  } else {
    detectAccountLock = false
  }    
}
function setResponse() {
  if (document.querySelectorAll('input').length > 1 && document.querySelectorAll('.custom-control-label').length > 1) {
    setTimeout(setResType, 1000)
  } else {
    setTimeout(setResponse, 1000)
  }
}
function setResType() {
  if (!document.querySelectorAll('input')[0].checked) {
    document.querySelectorAll('.custom-control-label')[0].click()
    setTimeout(confirmType, 1500)
  } else {
    return setOther()
  }
}
function confirmType() {
  if (document.querySelector('.btn-primary')) {
    document.querySelector('.btn-primary').click()
    setTimeout(setOther, 1500)
  } else {
    setTimeout(confirmType, 1000)
  }
}
function setOther() {
  label = document.querySelectorAll('.custom-control-label')
  if (document.querySelectorAll('.form-group').length == 4) {
    label[3].click()
    label[5].click()
    label[6].click()
    chrome.runtime.sendMessage({msg: 'responseComplete'})
  } else {
    setTimeout(setOther, 1000)
  }
}
function getProviderList() {
  if (document.readyState == 'complete' && document.querySelectorAll('.drawer.providers ul li a').length) {
    const list = document.querySelectorAll('.drawer.providers ul li a')
    const urlList = []
    list.forEach(item => {
      urlList.push(item.href)
    })
    sendProviderUrlList(urlList)
  } else {
    setTimeout(getProviderList, 1000)
  }
}
function sendProviderUrlList(urlList) {
  if (urlList.length) {
    chrome.runtime.sendMessage({msg: 'providerUrlList', urlList})
  } else {
    setTimeout(function() {
      getProviderList(urlList)
    }, 1000)
    chrome.runtime.sendMessage({
      msg: 'postErrorMsg',
      stage: 'setCallback',
      info: "[auto] get empty provider list and try again"            
    })
  }
}
function findOutChannel(name) {
  if (document.querySelectorAll('.channel-item').length || document.querySelectorAll('.empty-provider').length) {
    if (document.querySelectorAll('.empty-provider').length) {
      chrome.runtime.sendMessage({msg: 'viewProvider', result:false, url: window.location.href})  
    } else {
      const channelList = document.querySelectorAll('a.channel-item')
      const url = window.location.href
      for (let i = 0; i < channelList.length; i++) {
        const item = channelList[i]
        if (item.querySelector('.title').innerText.trim() == name) {
          chrome.runtime.sendMessage({msg: 'viewProvider', result: true, url})    
          break;
        }
        if (i == channelList.length - 1) {
          chrome.runtime.sendMessage({msg: 'viewProvider', result: false, url})    
        }
      }
    }
  } else {
    setTimeout(function() {
      findOutChannel(name)
    }, 1500)
  }
}
function getChannelToken() {
  if (document.readyState == 'complete' && document.querySelector('.token-row')) {
    if (document.querySelector('.token-row span').innerText) {
      chrome.runtime.sendMessage({msg: 'getChannelTokenComplete', token:document.querySelector('.token-row span').innerText })
    } else {
      createNewToken()
    }
  } else {
    setTimeout(getChannelToken, 1000)
  }
}
function createNewToken() {
  const btns = document.querySelectorAll('button')
  for (let i = 0; i < btns.length; i++) {
    const item = btns[i]
    if (item.innerText.trim() == 'Issue') {
      item.click()
      setTimeout(getNewToken, 1500)
      break
    } else if(item.innerText.trim() == 'Reissue') {
      chrome.runtime.sendMessage({msg: 'getChannelTokenComplete', token:document.querySelector('.token-row span').innerText })
      break;
    } else if (i == btns.length - 1) {
      createNewToken()
      chrome.runtime.sendMessage({
        msg: 'postErrorMsg',
        stage: 'newToken',
        info: "[auto] issue new token failed"            
      })
    }
  }
}
function getNewToken() {
  if (document.querySelector('.token-row span').innerText) {
    chrome.runtime.sendMessage({msg: 'getChannelTokenComplete', token: document.querySelector('.token-row span').innerText})    
  } else {
    setTimeout(getNewToken, 1000)
  }
}
function setNewLogin(name) {
  if (document.querySelectorAll('textarea').length && document.querySelectorAll('label.label').length) {
    const blocks = document.querySelectorAll('.kv-field')
    const blocksNum = blocks.length - 1
    for (let i = 0; i <= blocksNum; i++) {
      const block = blocks[i]
      const title = block.querySelector('label').innerText.trim()
      if (i !== blocksNum) {
        switch (title) {
          case 'Region':
            const choices = block.querySelectorAll('section label.label')
            choices.forEach(item => {
              if (item.innerText.trim() == 'Taiwan') item.click()
            })
            break;
          case 'Channel name':
            block.querySelector('textarea').value = `${name} Login`.slice(0,20)
            block.querySelector('textarea').dispatchEvent(new Event('input'))
            break;
          case 'Channel description':
            block.querySelector('textarea').value = `${name} 的 LINE Login Channel`
            block.querySelector('textarea').dispatchEvent(new Event('input'))
            break;
          case 'App types':
            const label = block.querySelectorAll('label.label')
            label[0].click()
            label[1].click()
            break;
        }
      } else {
        block.querySelector('label').click()
        setTimeout(function() {
          chrome.runtime.sendMessage({msg: 'newLoginComplete'})
          document.querySelector('button[type=submit]').click()
        }, 1000)
      }
    }
  } else {
    setTimeout(function() {
      setNewLogin(name)
    }, 1500)
  }
}
function setLinkedOA(id) {
  if (document.readyState == 'complete' && document.querySelectorAll('.kv-button.outline').length) {
    const field = document.querySelectorAll('.kv-field')
    for (let i = 0; i < field.length; i ++) {
      const block = field[i]
      if (block.querySelector('label').innerText.trim() == 'Linked OA') {
        block.querySelector('button').click()
        findOptionIndex(id);
        break
      } else if (i == field.length - 1) {
        setTimeout(function(){
          setLinkedOA(id)
        }, 1500)
      }
    }
  } else {
    setTimeout(function(){
      setLinkedOA(id)
    }, 1500)
  }
}
function findOptionIndex(id) {
  if (document.querySelectorAll('select').length) {
    const options = document.querySelectorAll('select')[1].querySelectorAll('option')
    for (let i = 0; i < options.length; i++) {
      const item = options[i]
      if (item.value == id) {
        selectOption(i)
        break
      } else if (i == options.length - 1) {
        setTimeout(function() {
          findOptionIndex(id), 1000
        })
      }
    }
  } else {
    setTimeout(function() {
      findOptionIndex(id), 1000
    })
  }
}
function selectOption(index) {
  document.querySelectorAll('select')[1].selectedIndex = index
  document.querySelectorAll('select')[1].dispatchEvent(new Event('change'))
  storeLinkedOASelect()
}
function storeLinkedOASelect() {
  if (document.querySelectorAll('.kv-button.kv-primary').length) {
    document.querySelectorAll('.kv-button.kv-primary')[0].click()
    getLoginDetail()
  } else {
    setTimeout(storeLinkedOASelect, 1000)
  }
}
function getLoginDetail() {
  const field = document.querySelectorAll('.kv-field')
  let channel_id = 0
  let channel_secret = ''
  for (let i = 0; i < field.length; i++) {
    let block = field[i]
    if (block.querySelector('label').innerText.trim() == 'Channel ID') {
      channel_id = block.querySelector('section p').innerText.trim()
    } else if (block.querySelector('label').innerText.trim() == 'Channel secret'){ 
      channel_secret = block.querySelector('section p').innerText.trim()
    } else if (i == field.length - 1) {
      if (channel_secret && channel_id) {
        chrome.runtime.sendMessage({msg: 'linkedOAComplete', channel_id, channel_secret })    
      } else if (channel_secret) {
        chrome.runtime.sendMessage({
          msg: 'postErrorMsg',
          stage: 'getLoginDetail',
          info: "[auto] can't grab channel_id"
        })
        getLoginDetail()
      } else if (channel_id) {
        chrome.runtime.sendMessage({
          msg: 'postErrorMsg',
          stage: 'getLoginDetail',
          info: "[auto] can't grab channel_secret"            
        })
        getLoginDetail()
      } else {
        chrome.runtime.sendMessage({
          msg: 'postErrorMsg',
          stage: 'getLoginDetail',
          info: "[auto] can't grab channel_id and channel_secret"            
        })
        getLoginDetail()        
      }
    }
  }
}
function setCallback() {
  if (document.querySelectorAll('.kv-button.outline').length && document.querySelectorAll('.kv-collapse')) {
    const field = document.querySelectorAll('.kv-collapse')
    for (let i = 0; i < field.length; i++) {
      const block = field[i]
      if (block.querySelector('label') && block.querySelector('label').innerText.trim() == 'Callback URL') {
        block.querySelector('button').click()
        setCallbackInput()
        break;
      } else if (i == field.length - 1) {
        chrome.runtime.sendMessage({
          msg: 'postErrorMsg',
          stage: 'setCallback',
          info: "[auto] can't grab callback region"            
        })
        setTimeout(setCallback, 1000)
      }
    }
  } else {
    setTimeout(setCallback, 1000)
  }
}
function setCallbackInput() {
  const input = document.querySelector('textarea')
  if (input) {
    input.value = 'https://urli.ai/auth_line'
    input.dispatchEvent(new Event('input'))
    setTimeout(storeCallbackInput, 1500)
  } else {
    setTimeout(setCallbackInput, 1000)
  }
}
function storeCallbackInput() {
  document.querySelector('button.kv-primary').click()
  chrome.runtime.sendMessage({msg: 'callbackComplete', channel_id: window.location.href.split('/')[5]})
}
function setLiff() {
  if (document.querySelectorAll('textarea').length && document.querySelectorAll('label.label').length) {
    const field = document.querySelectorAll('.kv-field')
    for (let i = 0; i < field.length; i++) {
      const block = field[i]
      switch (block.querySelector('label').innerText.trim()) {
        case 'LIFF app name':
          const input = block.querySelector('textarea')
          input.value = 'liff'
          input.dispatchEvent(new Event('input'))
          break;
        case 'Size':
          const option = block.querySelectorAll('section label.label')
          for (let i = 0; i < option.length; i++) {
            if (option[i].innerText.trim() == 'Full') {
              option[i].click()
              break;
            } else if (i == option.length - 1 && option[i].innerText.trim() !== 'Full') {
              chrome.runtime.sendMessage({
                msg: 'postErrorMsg',
                stage: 'setNewLiff',
                info: "[auto] can't set size(not found Full option)"            
              })
            }
          }
          break;
        case 'Endpoint URL':
          const input2 = block.querySelector('textarea')
          input2.value = 'https://urli.ai/liff'
          input2.dispatchEvent(new Event('input'))
          break;
        case 'Scopes':
          const option2 = block.querySelectorAll('section label.label')
          option2[0].click()
          option2[1].click()
          break;
        case 'Bot link feature':
          const option3 = block.querySelectorAll('section label.label')
          for (let i = 0; i < option3.length; i++) {
            if (option3[i].innerText.trim() == 'Off') {
              option3[i].click()
              break;
            } else if (i == option3.length - 1 && option3[i].innerText.trim() !== 'Off') {
              chrome.runtime.sendMessage({
                msg: 'postErrorMsg',
                stage: 'setCallback',
                info: "[auto] can't set Bot link feature"            
              })
           }
          }
          break;
      }
      if (i == field.length - 1) {
        setTimeout(setLiffMode, 1000)    
      }
    }
  } else {
    setTimeout(setLiff, 1000)
  }
}
function setLiffMode() {
  const field = document.querySelectorAll('.kv-field')
  for (let i = 0; i < field.length; i++) {
    if (field[i].querySelector('label') && field[i].querySelector('label').innerText.trim() == 'Module mode') {
      field[i].querySelector('.switch-row label').click()
      setTimeout(function() {
        document.querySelector('.kv-button.kv-primary').click()
        chrome.runtime.sendMessage({msg: 'liffComplete'})    
      }, 2000)
      break;
    } else if (i == field.length - 1 && field[i].querySelector('label') && field[i].querySelector('label').innerText.trim() !== 'Module mode'){
      chrome.runtime.sendMessage({
        msg: 'postErrorMsg',
        stage: 'setCallback',
        info: "[auto] not found Module mode"            
      })
      setTimeout(setLiffMode, 1000)
    }
  }
}
function getLiffId() {
  if (document.querySelector('.liff-list a')) {
    const id = document.querySelector('.liff-list a .id').innerText
    chrome.runtime.sendMessage({msg: 'getLiffIdComplete', id})
  } else {
    setTimeout(getLiffId, 1000)
  }
}
function setPublish() {
  if (document.querySelector('.dc-channel-status')) {
    if (document.querySelector('.dc-channel-status').innerText.trim() == 'Developing') {
      document.querySelector('.dc-channel-status').click()
      setTimeout(checkSwitchStatus, 1500)
    } else {
      chrome.runtime.sendMessage({msg: 'publishComplete'})
    }
  } else {
    setTimeout(setPublish, 1000)
  }
}
function verifyBotfatLogin() {
  if (document.readyState == 'complete') {
    if (window.location.href.includes('https://botfat.com/home/onboarding')) {
      const uuid = localStorage.getItem('onboarding_uuid')
      const gmail = localStorage.getItem('login_user_email')
      chrome.runtime.sendMessage({ 
        msg: 'botfatLoginSuccess',
        uuid,
        gmail
      })
    } else if (window.location.href.includes('https://botfat.com/home/')) {
      chrome.runtime.sendMessage({
        msg: 'hasCreatedAccount'
      })
    } else {
      chrome.runtime.sendMessage({
        msg: 'notLoginYet'
      })
    }
  } else {
    setTimeout(verifyBotfatLogin(), 1500)    
  }
}
function toConnection(data) {
  if (document.readyState == 'complete') {
    if (window.location.href == 'https://botfat.com/home/onboarding/extension' || window.location.href == 'https://botfat.com/home/onboarding/extension/') {
      const info = JSON.parse(data)
      enterValue('#name input', info.name)
      enterValue('#line-id input', `@${info.line_id}`)
      enterValue('#channel-secret input', info.line_secret)
      enterValue('#channel-token textarea', info.line_token)
      enterValue('#login-channel-id input', info.line_login_channel_id)
      enterValue('#login-secret input',info.line_login_secret)
      enterValue('#login-liff input', info.line_login_liff_id)

      setTimeout(function() {
        document.querySelector('.connect-add').click()
      }, 1000)
      document.querySelector('.connect-has-created').addEventListener('DOMSubtreeModified', function() {
        chrome.runtime.sendMessage({msg: 'createSuccess'})
      })
    } else if (window.location.href.includes('https://accounts.google.com/o/oauth2/auth') || window.location.href.includes('https://botfat.com/login/?next=/home/connecting/') || window.location.href.includes('https://botfat.com/login/?next=/home/connecting')) {
      return
    } else {
      chrome.runtime.sendMessage({msg: 'connectBotFatUrlError'})
    }
  } else {
    setTimeout(function() {
      toConnection(data)
    }, 1500)
  }
}
function enterValue(selector, info) {
  document.querySelector(selector).value = info
  document.querySelector(selector).dispatchEvent(new Event('input'))
}
function checkSwitchStatus() {
  if (document.querySelector('.kv-button.kv-primary.stretch')) {
    document.querySelector('.kv-button.kv-primary.stretch').click()
    chrome.runtime.sendMessage({msg: 'publishComplete'})
  } else {
    setTimeout(checkSwitchStatus, 1000)
  }
}


var popup = document.createElement('iframe')
popup.src = chrome.runtime.getURL('popup.html')
popup.id = 'popup-container'

popup.style.cssText = `
height:640px;
width:368px;
position: fixed;
top: 10px;
right: 10px;
border: none;
border-radius:10px;
z-index:100;
background: white;
box-shadow:  rgba(0, 0, 0, 0.15) 0px 10px 20px, rgba(3, 0, 0, 0.1) 0px 3px 6px;
z-index:1991;
visibility:hidden
`
document.body.appendChild(popup)

function setBoxHeight(size) {
  if (document.querySelector('iframe')) {
    const height = size == 'short' ? '270px' : '640px'
    document.querySelector('iframe').style.height = height
  } else {
    setTimeout(function() {
      setBoxHeight(size)
    }, 1000)
  }
}
function addBgMask() {
  var mask = document.createElement('div')
  mask.id = 'popup-bgmask'
  mask.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1990;
  width: 100%;
  height: 100%;
  background: white;
  opacity: 0.5;
  `
  document.body.appendChild(mask)  
}
function confirmLang() {
  if (document.readyState == 'complete' && document.querySelectorAll('select').length) {
    const selects = document.querySelectorAll('select')
    const length = selects.length - 1
    if (selects[length].value !== 'en') {
      selects[length].value = 'en'
      selects[length].dispatchEvent(new Event('change'))
    }  
  } else {
    setTimeout(confirmLang, 1500)
  }
}
function addVideo(type) {
  var video = document.createElement('video')
  video.classList.add('popup-video-instruct')
  video.style.cssText = `
    width:320px;
    right:34px;
    height:unset;
    position: fixed;
    z-index: 1992;
    border-radius:10px;
  `
  if (type == 'account') {
    video.innerHTML = `
      <source src="https://storage.googleapis.com/botfat-private/google_extension/chooseAccount.mp4" type="video/mp4" />
      <source src="https://storage.googleapis.com/botfat-private/google_extension/account.ogg" type="video/ogg" />
      <source src="https://storage.googleapis.com/botfat-private/google_extension/account.webm" type="video/webm" />
    `
    video.id = 'popup-video-account'
    video.style.top = '126px'
  } else {
    video.innerHTML = `
      <source src="https://storage.googleapis.com/botfat-private/google_extension/selectProvider.mp4" type="video/mp4" />
      <source src="https://storage.googleapis.com/botfat-private/google_extension/provider.ogg" type="video/ogg" />
      <source src="https://storage.googleapis.com/botfat-private/google_extension/provider.webm" type="video/webm" />
    `
    video.id = 'popup-video-provider'
    video.style.top = '208px'
  }
  video.setAttribute('controls','')
  video.setAttribute('autoplay','')
  video.setAttribute('muted','')
  video.setAttribute('preload','')
  video.addEventListener('mouseover', function() {
    video.style.width = '640px'
  })
  video.addEventListener('mouseout', function() {
    video.style.width = '320px'
  })
  document.body.appendChild(video)
}
function removeVideo(type) {
  if (type == 'account' && document.querySelector('#popup-video-account')) {
    const item = document.querySelector('#popup-video-account')
    document.body.removeChild(item)
  } else if (type == 'provider' && document.querySelector('#popup-video-provider')){
    const item = document.querySelector('#popup-video-provider')
    document.body.removeChild(item)
  }
}
function switchDropdown(type) {
  if (type == 'open') {
    if (document.querySelector('.popup-video-instruct')) {
      document.querySelector('.popup-video-instruct').style['z-index'] = 1990
    }
  } else {
    if (document.querySelector('.popup-video-instruct')) {
      document.querySelector('.popup-video-instruct').style['z-index'] = 1992
    }
  }
}