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

function getQueryParam(name) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (decodeURIComponent(pair[0]) === name) {
      return decodeURIComponent(pair[1] || "");
    }
  }
  return null;
}

function GetFileContent(filePath, callback) {
  httpGet(
    "/api/file-content?path=" + encodeURIComponent(filePath),
    function (content) {
      document.querySelector("#content").innerHTML = marked(content.content);
    }
  );
}

window.onload = function () {
  var filePath = getQueryParam("path");
  if (filePath) {
    GetFileContent(filePath);
  }

  var sidebarPlaceholder = document.getElementById("sidebar-placeholder");
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
      });
    });
  }

  httpGet("header.html", function (data) {
    document.querySelector(".header-placeholder").innerHTML = data;
  });
};

function loadScript(src, callback) {
  var script = document.createElement("script");
  script.src = src;
  script.onload = callback;
  document.head.appendChild(script);
}