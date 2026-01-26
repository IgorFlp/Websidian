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
        if (url.indexOf(".html") !== -1) {
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
function createEditIcon() {
  var span = document.createElement("span");
  span.innerHTML =
    '<svg viewBox="0 0 16 16" width="24" height="24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>' +
    '<path d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>' +
    "</svg>";

  return span.firstChild;
}
function createDownloadIcon() {
  var span = document.createElement("span");
  span.innerHTML =
    '<svg viewBox="0 0 16 16" width="24" height="24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>' +
    '<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>' +
    "</svg>";

  return span.firstChild;
}
function CreateFileListItem(relPath, file) {
  var span = document.createElement("span");
  var actionSpan = document.createElement("span");
  var downloadBtn = document.createElement("a");
  var editBtn = document.createElement("label");
  var nameLabel = document.createElement("label");

  span.className = "file-list-item";
  actionSpan.className = "file-actions";

  downloadBtn.className = "btn icon download-icon";
  downloadBtn.href = "/download/" + file;

  downloadIcon = createDownloadIcon();
  downloadBtn.appendChild(downloadIcon);

  editBtn.className = "btn icon";
  editBtn.appendChild(createEditIcon());
  editBtn.id = "edit-" + relPath;
  editBtn.onclick = function () {
    window.location.href = "/editor.html?path=" + encodeURIComponent(relPath);
  };
  nameLabel.className = "file-name-label";

  nameLabel.textContent = file;
  actionSpan.appendChild(downloadBtn);
  actionSpan.appendChild(editBtn);

  span.appendChild(nameLabel);
  span.appendChild(actionSpan);
  return span;
}
window.onload = function () {
  httpGet("/api/files", function (files) {
    var filePage = document.querySelector(".file-list");
    files = files.files;
    files.forEach(function (file) {
      var li = document.createElement("li");
      var normalized = file.replace(/\\/g, "/"); // converte \ em /
      var parts = normalized.split("/");

      var pasta = parts.length > 1 ? parts[0] : null;
      var nome = parts.length > 1 ? parts.slice(1).join("/") : parts[0];
      if (nome !== undefined) {
        var htmlPasta = document.getElementById(pasta);
        if (htmlPasta) {
          var span = CreateFileListItem(file, nome);
          var fileList = htmlPasta.querySelector(".file-list");
          fileList.appendChild(span);
        } else {
          var novaPasta = document.createElement("section");
          var title = document.createElement("h2");
          var fileList = document.createElement("div");
          fileList.className = "file-list";

          title.textContent = pasta;
          novaPasta.id = pasta;

          var span = CreateFileListItem(file, nome);

          novaPasta.appendChild(title);
          fileList.appendChild(span);
          novaPasta.appendChild(fileList);
          filePage.appendChild(novaPasta);
        }
      } else {
        var span = CreateFileListItem(file, nome);
        filePage.appendChild(span);
      }
    });
  });
  httpGet("header.html", function (data) {
    document.querySelector(".header-placeholder").innerHTML = data;
  });
};
