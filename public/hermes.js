var chatPollingInterval = null;
var currentSessionId = null;
var mediaRecorder = null;
var recordedChunks = [];
var isRecording = false;

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
    }
  };
  xhr.send();
}

function loadSessions() {
  httpGet("/sessions", function (html) {
    var sessionsList = document.getElementById("sessionsList");
    if (sessionsList) {
      sessionsList.innerHTML = html;
    }
    var countEl = document.getElementById("sessionsCount");
    if (countEl) {
      var match = html.match(/session-item/g);
      countEl.textContent = match ? match.length : 0;
    }
  });
}

function startPolling(sessionId) {
  stopPolling();
  chatPollingInterval = setInterval(function () {
    httpGet("/messages/" + sessionId, function (html) {
      var streamContent = document.getElementById("streamContent");
      if (streamContent && html) {
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

  var userMsgHtml = '<div class="message-block user-message" data-timestamp="' + Date.now() + '" data-is-ai="false">' +
    '<div class="message-header"><span class="agent-indicator">● User</span></div>' +
    '<div class="message-body">' + escapeHtml(text) + '</div>' +
    '</div>';
  var streamContent = document.getElementById("streamContent");
  if (streamContent) {
    streamContent.innerHTML += userMsgHtml;
    streamContent.scrollTop = streamContent.scrollHeight;
  }
  inputField.value = "";

  httpPost("/chat", JSON.stringify({ input: text }), function (resp) {
    if (resp && resp.sessionId) {
      currentSessionId = resp.sessionId;
      startPolling(currentSessionId);
    }
    if (resp && resp.audio && resp.audio.length > 0) {
      var audio = resp.audio[0];
      var audioEl = document.getElementById("audio-" + audio.id);
      if (audioEl) audioEl.play();
    }
  });
}

function blobToBase64(blob) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onloadend = function () { resolve(reader.result.split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function sendAudioMessage(audioBlob) {
  blobToBase64(audioBlob).then(function (base64) {
    httpPost("/chat", JSON.stringify({ audio: base64 }), function (resp) {
      if (resp && resp.sessionId) {
        currentSessionId = resp.sessionId;
        startPolling(currentSessionId);
      }
      if (resp && resp.audio && resp.audio.length > 0) {
        var audio = resp.audio[0];
        var audioEl = document.getElementById("audio-" + audio.id);
        if (audioEl) audioEl.play();
      }
    });
  }).catch(function () {
    alert("Erro ao converter áudio");
  });
}

function initRecording() {
  var btnMic = document.getElementById("btnMic");
  if (!btnMic) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    btnMic.title = "Gravação não suportada";
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
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];

      mediaRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = function () {
        var blob = new Blob(recordedChunks, { type: "audio/webm" });
        sendAudioMessage(blob);
        stream.getTracks().forEach(function (track) { track.stop(); });
      };

      mediaRecorder.start();
      isRecording = true;
      var btnMic = document.getElementById("btnMic");
      if (btnMic) {
        btnMic.classList.add("recording");
        btnMic.title = "Parar gravação";
      }
    })
    .catch(function () {
      alert("Erro ao acessar microfone");
    });
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  isRecording = false;
  var btnMic = document.getElementById("btnMic");
  if (btnMic) {
    btnMic.classList.remove("recording");
    btnMic.title = "Gravar Áudio";
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
      var path = ttsBtn.getAttribute("data-tts-path");
      if (path) {
        var audio = new Audio(path);
        audio.play();
      }
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
  loadSessions();
  initChat();
});