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
        var data = JSON.parse(xhr.responseText);
        callback(data);
      } catch (e) {
        alert("Erro ao processar dados");
      }
    }
  };

  xhr.send();
}
function CreateFileListItem(file) {
  var span = document.createElement("span");
  var actionSpan = document.createElement("span");
  var downloadBtn = document.createElement("a");
  var editBtn = document.createElement("label");
  var nameLabel = document.createElement("label");

  span.className = "file-list-item";
  actionSpan.className = "file-actions";
  downloadBtn.className = "btn download-icon";
  downloadBtn.href = "/download/" + file;
  editBtn.className = "btn edit-icon";
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
      var pasta = file.split("\\")[0];
      var nome = file.split("\\")[1];
      if (nome !== undefined) {
        var htmlPasta = document.getElementById(pasta);
        if (htmlPasta) {
          var span = CreateFileListItem(nome);
          var fileList = htmlPasta.querySelector(".file-list");
          fileList.appendChild(span);
        } else {
          var novaPasta = document.createElement("section");
          var title = document.createElement("h2");
          var fileList = document.createElement("div");
          fileList.className = "file-list";

          title.textContent = pasta;
          novaPasta.id = pasta;

          var span = CreateFileListItem(nome);

          novaPasta.appendChild(title);
          fileList.appendChild(span);
          novaPasta.appendChild(fileList);
          filePage.appendChild(novaPasta);
        }
      } else {
        var span = CreateFileListItem(file);
        filePage.appendChild(span);
      }
    });
  });
};
