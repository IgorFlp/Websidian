var chatPollingInterval = null;
var currentSessionId = null;
var mediaRecorder = null;
var recordedChunks = [];
var isRecording = false;

var ACTIVE_SESSION_KEY = "hermes_active_session";
var activeAudio = null;
var autoPlayEnabled = true; // Auto-play TTS after AI response
var lastMessageCount = 0;
var debugLogs = [];

// Capture console.log for mobile debugging
var originalLog = console.log;
var originalError = console.error;
var originalWarn = console.warn;

console.log = function () {
  var args = Array.prototype.slice.call(arguments);
  var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : a; }).join(' ');
  debugLogs.push({ type: 'log', msg: msg, time: new Date().toLocaleTimeString() });
  if (debugLogs.length > 50) debugLogs.shift();
  originalLog.apply(console, arguments);
  renderDebugPanel();
};

console.error = function () {
  var args = Array.prototype.slice.call(arguments);
  var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : a; }).join(' ');
  debugLogs.push({ type: 'error', msg: msg, time: new Date().toLocaleTimeString() });
  if (debugLogs.length > 50) debugLogs.shift();
  originalError.apply(console, arguments);
  renderDebugPanel();
};

console.warn = function () {
  var args = Array.prototype.slice.call(arguments);
  var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : a; }).join(' ');
  debugLogs.push({ type: 'warn', msg: msg, time: new Date().toLocaleTimeString() });
  if (debugLogs.length > 50) debugLogs.shift();
  originalWarn.apply(console, arguments);
  renderDebugPanel();
};

function renderDebugPanel() {
  var panel = document.getElementById('debugPanel');
  if (!panel) return;
  panel.innerHTML = debugLogs.map(function(l) {
    return '<div style="color:' + (l.type === 'error' ? '#f44' : l.type === 'warn' ? '#fa0' : '#8f8') + '">[' + l.time + '] ' + escapeHtml(l.msg) + '</div>';
  }).join('');
}

function toggleDebugPanel() {
  var panel = document.getElementById('debugPanel');
  var btn = document.getElementById('debugToggle');
  if (!panel || !btn) return;
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    btn.textContent = '🐛 Hide Debug';
  } else {
    panel.style.display = 'none';
    btn.textContent = '🐛 Show Debug';
  }
}

function clearDebugPanel() {
  debugLogs = [];
  renderDebugPanel();
}

function getActiveSessionId() {
  if (currentSessionId) return currentSessionId;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

function setActiveSessionId(sessionId) {
  currentSessionId = sessionId;
  if (sessionId) localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
  else localStorage.removeItem(ACTIVE_SESSION_KEY);
}

// Polyfill for Element.closest() - Android 4 compatibility
if (!Element.prototype.closest) {
  Element.prototype.closest = function (selector) {
    var el = this;
    while (el) {
      if (el.matches ? el.matches(selector) : el.msMatchesSelector(selector)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };
}

// Polyfill for Element.matches() - Android 4 compatibility
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// Polyfill for classList - older Android
if (!("classList" in document.documentElement)) {
  Object.defineProperty(HTMLElement.prototype, "classList", {
    get: function () {
      var self = this;
      function update(fn) {
        return function (value) {
          var classes = self.className.split(/\s+/);
          var index = classes.indexOf(value);
          fn(classes, index, value);
          self.className = classes.join(" ");
        };
      }
      return {
        add: update(function (classes, index, value) {
          if (index === -1) classes.push(value);
        }),
        remove: update(function (classes, index) {
          if (index !== -1) classes.splice(index, 1);
        }),
        toggle: update(function (classes, index, value) {
          if (index === -1) classes.push(value);
          else classes.splice(index, 1);
        }),
        contains: function (value) {
          return self.className.split(/\s+/).indexOf(value) !== -1;
        },
      };
    },
  });
}

function speakText(text, lang) {
  if (!text || !text.trim()) return;

  stopSpeaking(); // cancel any ongoing

  // Try backend TTS first
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/tts", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      try {
        var resp = JSON.parse(xhr.responseText);
        if (resp.url) {
          var audio = new Audio(resp.url);
          audio.volume = 1.0;
          audio.onended = function () {
            activeAudio = null;
          };
          audio.onerror = function () {
            console.warn("[TTS] Audio playback error, falling back to Web Speech");
            fallbackToWebSpeech(text, lang);
          };
          audio.play();
          activeAudio = audio;
        } else {
          console.warn("[TTS] No audio URL in response:", resp);
          fallbackToWebSpeech(text, lang);
        }
      } catch (e) {
        console.warn("[TTS] Failed to parse response:", e);
        fallbackToWebSpeech(text, lang);
      }
    } else {
      console.warn("[TTS] Backend TTS failed (status:", xhr.status, "), falling back to Web Speech");
      fallbackToWebSpeech(text, lang);
    }
  };
  xhr.onerror = function () {
    console.warn("[TTS] Network error calling backend TTS, falling back to Web Speech");
    fallbackToWebSpeech(text, lang);
  };
  xhr.send(JSON.stringify({ text: text, voice: "pm_alex", speed: 1 }));
}

function fallbackToWebSpeech(text, lang) {
  if (!window.speechSynthesis) {
    console.warn("[TTS] Web Speech API not available");
    return;
  }
  try {
    if (activeAudio) {
      window.speechSynthesis.cancel();
    }
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onend = function () { activeAudio = null; };
    utterance.onerror = function () { activeAudio = null; };
    activeAudio = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("[TTS] Web Speech fallback error:", e);
  }
}

function stopSpeaking() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
}

function playVoiceMessage(btn) {
  var audioId = btn.getAttribute("data-audio-id");
  if (!audioId) return;
  var audio = new Audio("/audio/" + audioId);
  audio.volume = 1.0;
  audio.play().catch(function () { console.warn("[voice] Playback blocked"); });
}

function playTTSForElement(btn) {
  var text = btn.getAttribute("data-tts-text");
  if (text) {
    speakText(text, "pt-BR");
  }
}

function playTTSFromOutput(btn) {
  var msg = btn.closest(".ai-message");
  if (!msg) return;
  var output = msg.querySelector(".ai-output");
  if (!output) return;
  
  // Clone to avoid mutating original
  var clone = output.cloneNode(true);
  
  // Remove code blocks with programming languages
  var codeBlocks = clone.querySelectorAll("pre.code-containers code[class*='language-']");
  for (var i = 0; i < codeBlocks.length; i++) {
    var pre = codeBlocks[i].closest("pre");
    if (pre) pre.remove();
  }
  
  // Also remove any remaining pre.code-containers (fallback)
  var allCodeBlocks = clone.querySelectorAll("pre.code-containers");
  for (var j = 0; j < allCodeBlocks.length; j++) {
    allCodeBlocks[j].remove();
  }
  
  // Get clean text
  var cleanText = clone.textContent || clone.innerText || "";
  cleanText = cleanText.trim();
  
  if (cleanText) {
    speakText(cleanText, "pt-BR");
  }
}

function ensureSessionId(callback) {
  var existing = getActiveSessionId();
  if (existing) {
    callback(existing);
    return;
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/sessions", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 401) { window.location.href = "/login"; return; }
    if (xhr.status === 201) {
      try {
        var resp = JSON.parse(xhr.responseText);
        if (resp && resp.sessionId) {
          setActiveSessionId(resp.sessionId);
          callback(resp.sessionId);
        }
      } catch (e) { alert("Erro ao criar sessão"); }
    } else {
      alert("Erro ao criar sessão: " + xhr.status);
    }
  };
  xhr.send(JSON.stringify({ title: "Chat " + new Date().toLocaleString() }));
}

function httpPost(url, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (xhr.status === 200) {
      try {
        var resp = JSON.parse(xhr.responseText);
        callback(resp);
      } catch (e) {
        alert("Erro ao processar resposta");
      }
    } else {
      alert("Erro no servidor: " + xhr.status);
    }
  };
  xhr.send(data);
}

function httpGet(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (xhr.status === 200) {
      callback(xhr.responseText);
    } else {
      console.error("[hermes] HTTP GET error:", xhr.status, xhr.statusText, url);
      // Silently fail for polling, but could show error for initial load
    }
  };
  xhr.onerror = function () {
    console.error("[hermes] Network error on GET:", url);
  };
  xhr.send();
}

function loadSessions() {
  httpGet("/sessions", function (html) {
    var sessionsList = document.getElementById("sessionsList");
    if (sessionsList) {
      sessionsList.innerHTML = html;
      console.log("[hermes] Sessions loaded, items:", sessionsList.querySelectorAll(".session-item").length);
      attachSessionClickHandlers();
    }
    var countEl = document.getElementById("sessionsCount");
    if (countEl) {
      var match = html.match(/session-item/g);
      countEl.textContent = match ? match.length : 0;
    }
  });
}

function attachSessionClickHandlers() {
  var sessionsList = document.getElementById("sessionsList");
  if (!sessionsList) return;
  
  // Remove old listeners if exists
  if (sessionsList._sessionClickHandler) {
    sessionsList.removeEventListener("click", sessionsList._sessionClickHandler);
  }
  if (sessionsList._sessionTouchHandler) {
    sessionsList.removeEventListener("touchend", sessionsList._sessionTouchHandler);
  }
  
  // Shared handler for both click and touchend
  var handleSessionSelect = function (e) {
    var item = e.target.closest(".session-item");
    if (!item) return;
    
    var sessionId = item.getAttribute("data-session-id");
    if (sessionId) {
      console.log("[hermes] Session selected:", sessionId);
      // Atualiza classe active nos cards
      var allItems = document.querySelectorAll(".session-item");
      for (var i = 0; i < allItems.length; i++) {
        var card = allItems[i].querySelector(".session-card");
        if (card) card.classList.remove("active");
      }
      var card = item.querySelector(".session-card");
      if (card) card.classList.add("active");
      openSession(sessionId);
    }
  };
  
  // Event delegation on the container - click for desktop
  sessionsList._sessionClickHandler = handleSessionSelect;
  sessionsList.addEventListener("click", sessionsList._sessionClickHandler);
  
  // Touchend for mobile/tablet (fires before click, prevents 300ms delay)
  sessionsList._sessionTouchHandler = function (e) {
    // Prevent click from also firing
    e.preventDefault();
    handleSessionSelect(e);
  };
  sessionsList.addEventListener("touchend", sessionsList._sessionTouchHandler, { passive: false });
}

function openSession(sessionId) {
  console.log("[hermes] Opening session:", sessionId);
  setActiveSessionId(sessionId);
  stopPolling();
  var streamContent = document.getElementById("streamContent");
  if (streamContent) {
    streamContent.innerHTML = "";
  }
  httpGet("/messages/" + sessionId, function (html) {
    console.log("[hermes] Messages loaded for session:", sessionId, "length:", html ? html.length : 0);
    if (streamContent && html) {
      streamContent.innerHTML = html;
      streamContent.scrollTop = streamContent.scrollHeight;
      // Initialize lastMessageCount with current AI messages
      var tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      lastMessageCount = tempDiv.querySelectorAll(".ai-message").length;
    } else {
      lastMessageCount = 0;
    }
    startPolling(sessionId);
  });
}

function startPolling(sessionId) {
  stopPolling();
  chatPollingInterval = setInterval(function () {
    httpGet("/messages/" + sessionId, function (html) {
      var streamContent = document.getElementById("streamContent");
        if (streamContent && html) {
        // Check for new AI messages before updating HTML
        var tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        var aiMessages = tempDiv.querySelectorAll(".ai-message");
        var currentMessageCount = aiMessages.length;
        
        if (currentMessageCount > lastMessageCount && autoPlayEnabled) {
          var lastAIMessage = aiMessages[aiMessages.length - 1];
          var outputText = lastAIMessage ? lastAIMessage.querySelector(".ai-output p") : null;
          // Apply slide-in animation to newest AI message (task 5.3)
          setTimeout(function () {
            var streamContentEl = document.getElementById("streamContent");
            if (!streamContentEl) return;
            var allAIMessages = streamContentEl.querySelectorAll(".ai-message");
            if (allAIMessages.length > 0) {
              var newest = allAIMessages[allAIMessages.length - 1];
              newest.classList.add("animate-slide-in");
              newest.addEventListener("animationend", function () {
                newest.classList.remove("animate-slide-in");
              }, { once: true });
            }
          }, 50);
          if (outputText && outputText.textContent.trim()) {
            setTimeout(function () {
              speakText(outputText.textContent.trim(), "pt-BR");
            }, 100);
          }
        }
        lastMessageCount = currentMessageCount;
        
        streamContent.innerHTML = html;
        streamContent.scrollTop = streamContent.scrollHeight;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", "/messages/" + sessionId, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          var streaming = xhr.getResponseHeader("X-Streaming");
          if (streaming !== "true") {
            stopPolling();
          }
        }
      };
      xhr.send();
    });
  }, 500);
}

function stopPolling() {
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
}

function sendTextMessage() {
  var inputField = document.getElementById("inputField");
  var text = inputField.value.trim();
  if (!text) return;
  sendTextMessageDirect(text);
}

function sendTextMessageDirect(text) {
  var inputField = document.getElementById("inputField");
  if (!text) return;

  var userMsgHtml = '<div class="message-block user-message" data-timestamp="' + Date.now() + '" data-is-ai="false">' +
    '<div class="message-header"><span class="agent-indicator">● User</span></div>' +
    '<div class="message-body">' + escapeHtml(text) + '</div>' +
    '</div>';
  var streamContent = document.getElementById("streamContent");
  if (streamContent) {
    streamContent.innerHTML += userMsgHtml;
    streamContent.scrollTop = streamContent.scrollHeight;
  }
  if (inputField) inputField.value = "";

  ensureSessionId(function (sessionId) {
    httpPost("/chat", JSON.stringify({ input: text, sessionId: sessionId }), function (resp) {
      if (resp && resp.sessionId) {
        setActiveSessionId(resp.sessionId);
        startPolling(resp.sessionId);
      }
    });
  });
}

function initRecording() {
console.log('[Front] initRecording called');
  var btnMic = document.getElementById("btnMic");
  var micIcon = document.getElementById("micIcon");
  var micDuration = document.getElementById("micDuration");
  console.log('[Front] btnMic found:', !!btnMic, 'micIcon:', !!micIcon, 'micDuration:', !!micDuration);
  if (!btnMic || !micIcon || !micDuration) return;

// Cross-browser getUserMedia support - prefer webkit on Android
  var isAndroid = /android/i.test(navigator.userAgent);
  var getUserMedia;
  
  if (isAndroid) {
    // On Android WebView, webkitGetUserMedia is often the working one
    getUserMedia = navigator.webkitGetUserMedia 
      || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      || navigator.getUserMedia 
      || navigator.mozGetUserMedia;
  } else {
    getUserMedia = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      || navigator.getUserMedia
      || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia;
  }
  
  console.log('[Front] getUserMedia selected:', getUserMedia ? getUserMedia.name : 'none');
  
  if (!getUserMedia) {
    btnMic.title = "Gravação não suportada";
    btnMic.disabled = true;
    console.log('[Front] getUserMedia not available');
    return;
  }

  // Bind to navigator for use in startRecording
  navigator.getUserMedia = getUserMedia.bind(navigator);
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = getUserMedia.bind(navigator.mediaDevices);
  }

  // Touch event handling for mobile - use passive: false to allow preventDefault
  var touchStartX = 0;
  var touchStartY = 0;
  var touchCancelled = false;

  console.log('[Front] Adding touchstart listener');
  btnMic.addEventListener('touchstart', function(e) {
    console.log('[Front] touchstart fired');
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCancelled = false;
    e.preventDefault(); // prevent scroll
  }, false);

  console.log('[Front] Adding touchmove listener');
  btnMic.addEventListener('touchmove', function(e) {
    if (touchCancelled) return;
    var dx = e.touches[0].clientX - touchStartX;
    var dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      console.log('[Front] touchmove cancel dx=' + dx + ' dy=' + dy);
      touchCancelled = true;
    }
  }, false);

  console.log('[Front] Adding touchend listener');
  btnMic.addEventListener('touchend', function(e) {
    console.log('[Front] touchend fired touchCancelled=' + touchCancelled + ' isRecording=' + isRecording);
    if (!touchCancelled) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Front] calling micClick from touchend');
      if (window.micClick) window.micClick();
    } else {
      console.log('[Front] touchend ignored - touchCancelled=true');
    }
  }, false);

  console.log('[Front] Adding click listener');
  btnMic.addEventListener('click', function(e) {
    console.log('[Front] click event fired isRecording=' + isRecording);
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) {
      console.log('[Front] click -> stopRecording');
      stopRecording();
    } else {
      console.log('[Front] click -> startRecording');
      startRecording();
    }
  }, false);

  // Global click handler for inline touch/click
  window.micClick = function () {
    console.log('[Front] micClick called, isRecording=', isRecording);
    try {
      if (isRecording) {
        console.log('[Front] calling stopRecording from micClick');
        stopRecording();
        console.log('[Front] stopRecording returned from micClick');
      } else {
        console.log('[Front] calling startRecording from micClick');
        startRecording();
        console.log('[Front] startRecording returned from micClick');
      }
    } catch (e) {
      console.log('[Front] micClick error:', e.message, e.stack);
    }
  };
}

function setRecordingUI(recording) {
    var btnMic = document.getElementById("btnMic");
    var micIcon = document.getElementById("micIcon");
    var micDuration = document.getElementById("micDuration");
    if (!btnMic || !micIcon || !micDuration) return;
    
    if (recording) {
      btnMic.style.background = "rgba(244, 67, 54, 0.2)";
      btnMic.style.borderColor = "#f44336";
      btnMic.style.color = "#f44336";
      btnMic.title = "Parar gravação";
      micIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'; // pause icon
      micDuration.style.display = "inline-block";
      window._recordingStartTime = Date.now();
      micDuration.textContent = "00:00";
      if (window._durationInterval) clearInterval(window._durationInterval);
      window._durationInterval = setInterval(function() {
        var elapsed = Math.floor((Date.now() - window._recordingStartTime) / 1000);
        var mins = Math.floor(elapsed / 60);
        var secs = elapsed % 60;
        var minsStr = mins < 10 ? "0" + mins : String(mins);
        var secsStr = secs < 10 ? "0" + secs : String(secs);
        micDuration.textContent = minsStr + ":" + secsStr;
      }, 500);
    } else {
      btnMic.style.background = "rgba(208,188,255,0.15)";
      btnMic.style.borderColor = "rgba(208,188,255,0.4)";
      btnMic.style.color = "#d0bcff";
      btnMic.title = "Gravar Áudio";
      micIcon.innerHTML = '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>'; // mic icon
      if (window._durationInterval) {
        clearInterval(window._durationInterval);
        window._durationInterval = null;
      }
      micDuration.style.display = "none";
      micDuration.textContent = "00:00";
    }
  }
function togglerRecording(){
  console.log("[togglerRecording] isRecording=", isRecording);
}
function startRecording() {
  console.log('[Front] startRecording called');
  var btnMic = document.getElementById("btnMic");
  var durationEl = document.getElementById("micDuration");
  
  // Use the already-bound getUserMedia from initRecording
  var getUserMedia = navigator.getUserMedia;
  console.log('[Front] navigator.getUserMedia:', getUserMedia);
  console.log('[Front] navigator.webkitGetUserMedia:', navigator.webkitGetUserMedia);
  console.log('[Front] navigator.mediaDevices.getUserMedia:', navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  
  if (!getUserMedia) {
    console.log('[Front] getUserMedia not available');
    alert("Gravação não suportada neste navegador");
    return;
  }
  
  // Check permission state if Permissions API available
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'microphone' }).then(function(perm) {
      console.log('[Front] Microphone permission state:', perm.state);
      if (perm.state === 'denied') {
        console.log('[Front] Permission denied, user must enable in settings');
        alert("Permissão de microfone negada. Ative nas configurações do navegador/app e tente novamente.");
        return;
      }
      // Continue with getUserMedia
      callGetUserMedia();
    }).catch(function(err) {
      console.log('[Front] Permissions query failed:', err);
      callGetUserMedia(); // Try anyway
    });
  } else {
    callGetUserMedia();
  }
  
  function callGetUserMedia() {
    console.log('[Front] Calling getUserMedia...');
    var successCalled = false;
    var errorCalled = false;
    
    getUserMedia({ audio: true }, 
      function(stream) {
        successCalled = true;
        console.log('[Front] getUserMedia SUCCESS callback fired, stream:', stream);
        onStreamReceived(stream);
      },
      function(err) {
        errorCalled = true;
        console.log('[Front] getUserMedia ERROR callback fired:', err.name, err.message);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert("Permissão de microfone negada. Ative nas configurações do navegador/app e tente novamente.");
        } else {
          alert("Erro ao acessar microfone: " + err.message);
        }
      }
    );
    
    // Safety timeout
    setTimeout(function() {
      if (!successCalled && !errorCalled) {
        console.log('[Front] TIMEOUT: getUserMedia callbacks never fired!');
        alert("Timeout: navegador não respondeu. Tente tocar no botão novamente.");
      }
    }, 5000);
  }
}

function onStreamReceived(stream) {
  console.log('[Front] onStreamReceived');
  
  // Check MediaRecorder support
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    console.log('[Front] MediaRecorder not supported, using Web Audio fallback');
    startRecordingWebAudio(stream);
    return;
  }
  
  // Use a widely supported MIME type
  var mimeType = "audio/webm";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "audio/mp4";
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "audio/3gpp";
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "audio/amr";
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = ""; // Let browser decide
  }
  
  console.log('[Front] Selected mimeType:', mimeType);

  mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType: mimeType } : undefined);
  recordedChunks = [];

  mediaRecorder.ondataavailable = function (e) {
    console.log('[Front] ondataavailable, size:', e.data && e.data.size);
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = function () {
    console.log('[Front] MediaRecorder onstop fired');
    var blob = new Blob(recordedChunks, { type: mimeType || "audio/webm" });
    console.log("[STT] Recording complete:", {
      blobSize: blob.size,
      blobType: blob.type,
      mimeType: mimeType,
      chunks: recordedChunks.length
    });
    uploadAudioForSTT(blob, mimeType || blob.type);
    stream.getTracks().forEach(function (track) { track.stop(); });
  };

  mediaRecorder.onerror = function(e) {
    console.log('[Front] MediaRecorder error:', e.error);
  };

  mediaRecorder.start(100); // Collect data every 100ms
  isRecording = true;
  if (btnMic) {
    btnMic.classList.add("recording");
    btnMic.title = "Parar gravação";
  }
  // Update UI (icon, timer)
  if (typeof setRecordingUI === 'function') setRecordingUI(true);
  console.log("[STT] Started recording with mimeType:", mimeType);
}

// Web Audio API fallback for old Android WebView (no MediaRecorder)
// Uses ScriptProcessorNode (deprecated but works in old WebViews)
var audioContext = null;
var scriptProcessor = null;
var audioChunks = [];

function startRecordingWebAudio(stream) {
  console.log('[Front] startRecordingWebAudio');
  
  try {
    // Create AudioContext (webkit prefix for old Safari/Android)
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.log('[Front] AudioContext not supported');
      alert("Gravação não suportada: AudioContext indisponível");
      stream.getTracks().forEach(function(track) { track.stop(); });
      return;
    }
    
    audioContext = new AudioContext();
    var source = audioContext.createMediaStreamSource(stream);
    
    // ScriptProcessorNode - deprecated but works in old WebViews
    // bufferSize=4096 for lower latency
    var bufferSize = 4096;
    scriptProcessor = audioContext.createScriptProcessor 
      ? audioContext.createScriptProcessor(bufferSize, 1, 1)
      : audioContext.createJavaScriptNode(bufferSize, 1, 1); // very old
    
    audioChunks = []; // Store Float32Array chunks
    
    scriptProcessor.onaudioprocess = function(e) {
      console.log('[Front] onaudioprocess fired, chunks:', audioChunks.length);
      if (!isRecording) {
        console.log('[Front] onaudioprocess: not recording, skipping');
        return;
      }
      var inputData = e.inputBuffer.getChannelData(0); // Float32Array
      // Copy the data (it's reused by the browser)
      audioChunks.push(new Float32Array(inputData));
    };
    
    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination); // Required for processing to work
    
    isRecording = true;
    var btnMic = document.getElementById("btnMic");
    if (btnMic) {
      btnMic.classList.add("recording");
      btnMic.title = "Parar gravação";
    }
    if (typeof setRecordingUI === 'function') setRecordingUI(true);
    console.log('[Front] Web Audio recording started, isRecording=', isRecording);
    
  } catch (err) {
    console.log('[Front] Web Audio error:', err);
    alert("Erro ao iniciar gravação Web Audio: " + err.message);
    stream.getTracks().forEach(function(track) { track.stop(); });
  }
}

function stopRecordingWebAudio() {
  console.log('[Front] stopRecordingWebAudio called, isRecording=', isRecording);
  console.trace('[Front] stopRecordingWebAudio stack');
  
  try {
    // Save sampleRate BEFORE closing audioContext
    var sampleRate = (audioContext && audioContext.sampleRate) ? audioContext.sampleRate : 44100;
    console.log('[Front] sampleRate saved:', sampleRate);
    
    if (scriptProcessor) {
      console.log('[Front] disconnecting scriptProcessor');
      scriptProcessor.disconnect();
      scriptProcessor = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      console.log('[Front] closing audioContext');
      if (typeof audioContext.close === 'function') {
        audioContext.close();
      }
      audioContext = null;
    }
    
    isRecording = false;
    var btnMic = document.getElementById("btnMic");
    if (btnMic) {
      btnMic.classList.remove("recording");
      btnMic.title = "Gravar Áudio";
    }
    if (typeof setRecordingUI === 'function') setRecordingUI(false);
    
    // Convert captured Float32Array chunks to WAV blob
    if (audioChunks.length > 0) {
      console.log('[Front] Converting', audioChunks.length, 'chunks to WAV');
      var wavBlob = createWavBlob(audioChunks, sampleRate);
      console.log('[Front] WAV blob created:', wavBlob.size, 'bytes');
      uploadAudioForSTT(wavBlob, 'audio/wav');
    } else {
      console.log('[Front] No audio chunks recorded');
    }
    audioChunks = [];
    console.log('[Front] stopRecordingWebAudio completed');
  } catch (err) {
    console.log('[Front] stopRecordingWebAudio ERROR:', err.message, err.stack);
  }
}

// Create WAV file from Float32Array chunks
function createWavBlob(chunks, sampleRate) {
  // Calculate total length
  var totalLength = 0;
  for (var i = 0; i < chunks.length; i++) {
    totalLength += chunks[i].length;
  }
  
  // Create Float32Array with all data
  var float32 = new Float32Array(totalLength);
  var offset = 0;
  for (var i = 0; i < chunks.length; i++) {
    float32.set(chunks[i], offset);
    offset += chunks[i].length;
  }
  
  // Convert to 16-bit PCM
  var pcm16 = new Int16Array(totalLength);
  for (var i = 0; i < totalLength; i++) {
    var s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Create WAV header
  var buffer = new ArrayBuffer(44 + pcm16.length * 2);
  var view = new DataView(buffer);
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm16.length * 2, true); // file size - 8
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, 1, true); // num channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcm16.length * 2, true); // data size
  
  // Write PCM data
  for (var i = 0; i < pcm16.length; i++) {
    view.setInt16(44 + i * 2, pcm16[i], true);
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function stopRecording() {
  console.log('[Front] stopRecording called, isRecording=', isRecording);
  console.trace('[Front] stopRecording stack');
  
  // Handle Web Audio fallback
  if (audioContext || scriptProcessor) {
    stopRecordingWebAudio();
    return;
  }
  
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  isRecording = false;
  var btnMic = document.getElementById("btnMic");
  if (btnMic) {
    btnMic.classList.remove("recording");
    btnMic.title = "Gravar Áudio";
  }
  // Update UI (icon, timer)
  if (typeof setRecordingUI === 'function') setRecordingUI(false);
}

function uploadAudioForSTT(audioBlob, recordedMimeType) {
  var btnMic = document.getElementById("btnMic");
  if (btnMic) {
    btnMic.classList.add("processing");
    btnMic.title = "Enviando áudio...";
  }

  console.log("[UPLOAD] Sending audio:", {
    blobSize: audioBlob.size,
    blobType: audioBlob.type,
    recordedMimeType: recordedMimeType
  });

  var formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/upload-audio", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (btnMic) {
      btnMic.classList.remove("processing");
      btnMic.title = "Gravar Áudio";
    }
    if (xhr.status === 200) {
      try {
        var resp = JSON.parse(xhr.responseText);
        if (resp.audioPath) {
          sendAudioMessageToChat(resp.audioPath, resp.fileName, resp.transcript || "");
        } else {
          console.error("[UPLOAD] No audioPath in response:", resp);
          alert("Erro: caminho do áudio não retornado");
        }
      } catch (e) {
        console.error("[UPLOAD] Failed to parse response:", e);
      }
    } else {
      console.error("[UPLOAD] Upload failed:", xhr.status, xhr.responseText);
      alert("Erro no envio do áudio: " + xhr.status);
    }
  };
  xhr.onerror = function () {
    if (btnMic) {
      btnMic.classList.remove("processing");
      btnMic.title = "Gravar Áudio";
    }
    console.error("[UPLOAD] Network error");
    alert("Erro de rede ao enviar áudio");
  };
  xhr.send(formData);
}

function sendAudioMessageToChat(audioPath, fileName, transcript) {
  // Just send to backend - don't add to DOM yet, let backend handle it
  // Use transcript as the message if available, otherwise use the label
  var messageText = transcript && transcript.trim() ? transcript : "🎵 Áudio gravado: " + fileName;
  
  ensureSessionId(function (sessionId) {
    httpPost("/chat", JSON.stringify({ 
      input: messageText,
      sessionId: sessionId,
      audioPath: audioPath,
      audioFileName: fileName,
      audioTranscript: transcript
    }), function (resp) {
      if (resp && resp.sessionId) {
        setActiveSessionId(resp.sessionId);
        startPolling(resp.sessionId);
      }
    });
  });
}

function initChat() {
  var inputField = document.getElementById("inputField");
  var btnSend = document.getElementById("btnSend");
  var streamContent = document.getElementById("streamContent");
  var sidebar = document.getElementById("sidebar");
  var btnSidebarToggle = document.getElementById("btnSidebarToggle");

  if (!inputField || !btnSend || !streamContent) return;

  // Sidebar toggle
  if (btnSidebarToggle && sidebar) {
    btnSidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
      var isCollapsed = sidebar.classList.contains("collapsed");
      btnSidebarToggle.setAttribute("title", isCollapsed ? "Mostrar Sessões" : "Ocultar Sessões");
      btnSidebarToggle.setAttribute("aria-label", isCollapsed ? "Show Sessions" : "Hide Sessions");
    });
  }

  // Add debug panel toggle button
  var debugBtn = document.createElement('button');
  debugBtn.id = 'debugToggle';
  debugBtn.textContent = '🐛 Show Debug';
  debugBtn.style.cssText = 'position:fixed;top:70px;right:10px;z-index:9999;padding:8px 12px;background:#333;color:#fff;border:none;border-radius:4px;font-size:12px;';
  debugBtn.onclick = toggleDebugPanel;
  document.body.appendChild(debugBtn);

  // Add debug panel
  var debugPanel = document.createElement('div');
  debugPanel.id = 'debugPanel';
  debugPanel.style.cssText = 'position:fixed;top:105px;right:10px;width:350px;max-height:300px;overflow-y:auto;background:#111;color:#0f0;border:1px solid #333;border-radius:4px;padding:10px;font-family:monospace;font-size:11px;z-index:9998;display:none;';
  debugPanel.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Debug Log</span><button onclick="clearDebugPanel()" style="background:none;border:none;color:#f44;cursor:pointer;">Clear</button></div>';
 
  document.body.appendChild(debugPanel);

  btnSend.addEventListener("click", sendTextMessage);
  inputField.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendTextMessage();
  });

  var btnNewSession = document.getElementById("btnNewSession");
  if (btnNewSession) {
    btnNewSession.addEventListener("click", function () {
      currentSessionId = null;
      localStorage.setItem(ACTIVE_SESSION_KEY, "");
      var streamContent = document.getElementById("streamContent");
      if (streamContent) streamContent.innerHTML = "";
      lastMessageCount = 0;
      loadSessions();
    });
  }

  initRecording();

  streamContent.addEventListener("click", function (e) {
    var btn = e.target.closest(".reasoning-toggle");
    if (btn) {
      var msg = btn.closest(".ai-message");
      if (msg) {
        var container = msg.querySelector(".reasoning-content");
        if (container) {
          container.classList.toggle("collapsed");
          container.classList.toggle("expanded");
        }
        var icon = msg.querySelector(".icon");
        if (icon) icon.classList.toggle("expanded");
      }
      return;
    }
    var ttsBtn = e.target.closest(".tts-play-btn");
    if (ttsBtn) {
      playTTSForElement(ttsBtn);
      return;
    }
    var stopBtn = e.target.closest(".tts-stop-btn");
    if (stopBtn) {
      stopSpeaking();
      return;
    }
  });
}

function escapeHtml(text) {
  if (!text) return "";
  var map = { "&": "&", "<": "<", ">": ">", '"': "", "'": "&#039;" };
  return text.replace(/[&<>"']/g, function (c) { return map[c]; });
}

var deleteModalOpen = false;
var sessionToDelete = null;

function deleteSession(sessionId) {
  sessionToDelete = sessionId;
  var modal = document.getElementById("deleteModal");
  if (modal) { modal.classList.remove("hidden"); modal.classList.add("flex"); }
  deleteModalOpen = true;
}

function closeDeleteModal() {
  var modal = document.getElementById("deleteModal");
  if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); }
  deleteModalOpen = false;
  sessionToDelete = null;
}

function confirmDeleteSession() {
  if (!sessionToDelete) return;
  var xhr = new XMLHttpRequest();
  xhr.open("DELETE", "/sessions/" + sessionToDelete, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200 || xhr.status === 204) {
      loadSessions();
      if (currentSessionId === sessionToDelete) {
        currentSessionId = null;
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        var streamContent = document.getElementById("streamContent");
        if (streamContent) streamContent.innerHTML = "";
      }
    } else {
      console.error("[delete] Failed:", xhr.status);
    }
    closeDeleteModal();
  };
  xhr.send();
}

window.addEventListener("load", function () {
  if (window.initSidebar) initSidebar();
  loadSessions();
  initChat();

  // Modal handlers (task 4.3, 4.7)
  var confirmBtn = document.getElementById("deleteConfirmBtn");
  var cancelBtn = document.getElementById("deleteCancelBtn");
  if (confirmBtn) confirmBtn.addEventListener("click", confirmDeleteSession);
  if (cancelBtn) cancelBtn.addEventListener("click", closeDeleteModal);

  document.addEventListener("keydown", function (e) {
    if (deleteModalOpen) {
      if (e.key === "Escape") { e.preventDefault(); closeDeleteModal(); }
      if (e.key === "Enter") { e.preventDefault(); confirmDeleteSession(); }
    }
  });
});