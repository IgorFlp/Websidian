var chatPollingInterval = null;
var currentSessionId = null;

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
  xhr.send(JSON.stringify(data));
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

function initChat() {
  var inputField = document.getElementById("inputField");
  var btnSend = document.getElementById("btnSend");
  var streamContent = document.getElementById("streamContent");
  var btnMic = document.getElementById("btnMic");

  if (!inputField || !btnSend || !streamContent) return;

  function sendMessage() {
    var text = inputField.value.trim();
    if (!text) return;

    var userMsgHtml = '<div class="message-block user-message" data-timestamp="' + Date.now() + '" data-is-ai="false">' +
      '<div class="message-header"><span class="agent-indicator">● User</span></div>' +
      '<div class="message-body">' + escapeHtml(text) + '</div>' +
      '</div>';
    streamContent.innerHTML += userMsgHtml;
    streamContent.scrollTop = streamContent.scrollHeight;

    inputField.value = "";

    httpPost("/chat", { input: text }, function (resp) {
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

  btnSend.addEventListener("click", sendMessage);
  inputField.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });

  if (btnMic) {
    btnMic.addEventListener("click", function () {
      if (!webkitSpeechRecognition && !window.SpeechRecognition) {
        alert("Voice input not supported");
        return;
      }
      var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
      var recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.interimResults = false;
      recognition.start();
      recognition.onresult = function (event) {
        inputField.value = event.results[0][0].transcript;
        sendMessage();
      };
      recognition.onerror = function () {
        alert("Voice recognition error");
      };
    });
  }

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
  initChat();
});