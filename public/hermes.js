var chatPollingInterval = null;
var currentSessionId = null;
var speechRecognition = null;
var isRecording = false;

var ACTIVE_SESSION_KEY = "hermes_active_session";
var KOKORO_API_URL = ""; // Will be loaded from server config
var activeAudio = null;
var autoPlayEnabled = true; // Auto-play TTS after AI response
var lastMessageCount = 0;

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

// Load Kokoro API URL from server config
function loadKokoroConfig(callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/tts-config", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      try {
        var config = JSON.parse(xhr.responseText);
        KOKORO_API_URL = config.url || "";
        autoPlayEnabled = config.autoPlay !== false;
        console.log("[TTS] Kokoro API URL loaded:", KOKORO_API_URL);
      } catch (e) {
        console.warn("[TTS] Failed to parse TTS config:", e);
      }
    } else {
      console.warn("[TTS] Could not load TTS config, status:", xhr.status);
    }
    if (callback) callback();
  };
  xhr.send();
}

function speakText(text, lang) {
  if (!text || !text.trim()) return;
  if (!KOKORO_API_URL) {
    console.warn("[TTS] Kokoro API URL not configured");
    return;
  }

  stopSpeaking(); // cancel any ongoing

  var payload = {
    voice_aliases: {},
    model: "kokoro",
    input: text,
    voice: "pm_alex",
    response_format: "mp3",
    download_format: "mp3",
    speed: 1,
    stream: true,
    return_download_link: false,
    return_timing: false,
    lang_code: "p",
    volume_multiplier: 1,
    normalization_options: {
      normalize: true,
      unit_normalization: false,
      url_normalization: true,
      email_normalization: true,
      optional_pluralization_normalization: true,
      phone_normalization: true,
      caps_normalization: true,
      replace_remaining_symbols: true,
      remove_emoji: false
    },
    allow_voice_tags: false,
    ssml: false
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", KOKORO_API_URL+"/audio/speech", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("accept", "*/*");
  xhr.responseType = "blob";
  xhr.onload = function () {
    if (xhr.status === 200 && xhr.response) {
      var audioBlob = xhr.response;
      var audioUrl = URL.createObjectURL(audioBlob);
      var audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.onended = function () {
        URL.revokeObjectURL(audioUrl);
        activeAudio = null;
      };
      audio.onerror = function () {
        URL.revokeObjectURL(audioUrl);
        console.warn("[TTS] Audio playback error");
        activeAudio = null;
      };
      audio.play();
      activeAudio = audio;
    } else {
      console.warn("[TTS] Failed to generate audio, status:", xhr.status);
    }
  };
  xhr.onerror = function () {
    console.warn("[TTS] Network error calling Kokoro API");
  };
  xhr.send(JSON.stringify(payload));
}

function stopSpeaking() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
}

function playTTSForElement(btn) {
  var text = btn.getAttribute("data-tts-text");
  if (text) {
    speakText(text, "pt-BR");
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
        
        if (currentMessageCount > lastMessageCount && autoPlayEnabled && KOKORO_API_URL) {
          // New AI message detected, get the last one's text
          var lastAIMessage = aiMessages[aiMessages.length - 1];
          var outputText = lastAIMessage.querySelector(".ai-output p");
          if (outputText && outputText.textContent.trim()) {
            // Small delay to ensure DOM is updated
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

function sendAudioMessage(audioBlob) {
  var btnMic = document.getElementById("btnMic");
  if (btnMic) {
    btnMic.classList.add("processing");
    btnMic.title = "Transcrevendo...";
  }

  // Web Speech API SpeechRecognition doesn't support pre-recorded audio blobs
  // This function is kept for compatibility but will show a message
  console.warn("[STT] Web Speech API requires live microphone input");
  if (btnMic) {
    btnMic.classList.remove("processing");
    btnMic.title = "Gravar Áudio";
  }
  alert("Gravação de arquivo não suportada. Use o microfone em tempo real clicando no botão do microfone.");
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
  var btnMic = document.getElementById("btnMic");
  if (!btnMic) return;

  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btnMic.title = "SpeechRecognition não suportado";
    btnMic.disabled = true;
    return;
  }

  btnMic.addEventListener("click", function () {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

function startRecording() {
  var btnMic = document.getElementById("btnMic");
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("SpeechRecognition não suportado neste navegador");
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.lang = "pt-BR";
  speechRecognition.interimResults = true;
  speechRecognition.continuous = true;
  speechRecognition.maxAlternatives = 1;

  var finalTranscript = "";
  var interimTranscript = "";

  speechRecognition.onstart = function () {
    isRecording = true;
    if (btnMic) {
      btnMic.classList.add("recording");
      btnMic.title = "Parar gravação";
    }
    console.log("[STT] Started listening");
  };

  speechRecognition.onresult = function (event) {
    interimTranscript = "";
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }
    // Update input field with live transcription
    var inputField = document.getElementById("inputField");
    if (inputField) {
      inputField.value = (finalTranscript + interimTranscript).trim();
    }
  };

  speechRecognition.onerror = function (event) {
    console.error("[STT] Error:", event.error);
    if (event.error === "no-speech" || event.error === "audio-capture") {
      // Silently handle these common errors
      return;
    }
    if (btnMic) {
      btnMic.classList.remove("recording");
      btnMic.title = "Gravar Áudio";
    }
    isRecording = false;
    alert("Erro no reconhecimento de voz: " + event.error);
  };

  speechRecognition.onend = function () {
    console.log("[STT] Ended listening");
    if (isRecording) {
      // If still recording (user didn't click stop), restart
      if (speechRecognition) {
        try {
          speechRecognition.start();
        } catch (e) {
          // Ignore restart errors
        }
      }
    }
  };

  try {
    speechRecognition.start();
  } catch (e) {
    console.error("[STT] Failed to start:", e);
    if (btnMic) {
      btnMic.classList.remove("recording");
      btnMic.title = "Gravar Áudio";
    }
    isRecording = false;
    alert("Erro ao iniciar reconhecimento: " + e.message);
  }
}

function stopRecording() {
  isRecording = false;
  if (speechRecognition) {
    try {
      speechRecognition.stop();
    } catch (e) {
      console.warn("[STT] Error stopping:", e);
    }
    speechRecognition = null;
  }
  var btnMic = document.getElementById("btnMic");
  if (btnMic) {
    btnMic.classList.remove("recording");
    btnMic.title = "Gravar Áudio";
  }
  // Send the final transcript
  var inputField = document.getElementById("inputField");
  if (inputField && inputField.value.trim()) {
    sendTextMessage();
  }
}

function initChat() {
  var inputField = document.getElementById("inputField");
  var btnSend = document.getElementById("btnSend");
  var streamContent = document.getElementById("streamContent");

  if (!inputField || !btnSend || !streamContent) return;

  btnSend.addEventListener("click", sendTextMessage);
  inputField.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendTextMessage();
  });

  initRecording();

  streamContent.addEventListener("click", function (e) {
    var btn = e.target.closest(".reasoning-toggle");
    if (btn) {
      var icon = btn.querySelector(".reasoning-toggle-icon");
      var container = btn.nextElementSibling;
      if (container && container.classList.contains("reasoning-content")) {
        container.classList.toggle("collapsed");
        container.classList.toggle("expanded");
        icon.classList.toggle("expanded");
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
  var map = { "&": "&", "<": "<", ">": ">", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, function (c) { return map[c]; });
}

window.addEventListener("load", function () {
  if (window.initSidebar) initSidebar();
  loadKokoroConfig(function () {
    loadSessions();
    initChat();
  });
});