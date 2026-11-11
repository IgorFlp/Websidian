window.onerror = function (msg, url, line) {
  alert("JS ERROR:\n" + msg + "\nline: " + line);
};

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
      try {
        if (url.indexOf(".html") !== -1 || url.indexOf(".css") !== -1) {
          callback(xhr.responseText);
          return;
        }
        var data = JSON.parse(xhr.responseText);
        callback(data);
      } catch (e) {
        alert("Erro ao processar dados");
      }
    }
  };

  xhr.send();
}

window.onload = function () {
  var sidebarPlaceholder = document.getElementById("sidebar-placeholder");
  var headerLoaded = false;
  var sidebarLoaded = false;

  function tryInitFullscreen() {
    if (headerLoaded && sidebarLoaded && window.initFullscreenButtons) {
      window.initFullscreenButtons();
    }
  }

  if (sidebarPlaceholder) {
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "sidebar.css";
    document.head.appendChild(style);

    httpGet("sidebar.html", function (html) {
      sidebarPlaceholder.innerHTML = html;
      loadScript("sidebar.js", function () {
        if (window.initSidebar) {
          window.initSidebar();
        }
        sidebarLoaded = true;
        tryInitFullscreen();
      });
    });
  }

  httpGet("header.html", function (data) {
    document.querySelector(".header-placeholder").innerHTML = data;
    headerLoaded = true;
    tryInitFullscreen();
  });
};

function loadScript(src, callback) {
  var script = document.createElement("script");
  script.src = src;
  script.onload = callback;
  document.head.appendChild(script);
}