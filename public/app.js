function httpGet(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(JSON.parse(xhr.responseText));
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}

function loadTasks() {
  httpGet("/api/tasks", function (tasks) {
    var ul = document.getElementById("tasks");
    ul.innerHTML = "";

    for (var i = 0; i < tasks.length; i++) {
      (function (task) {
        var li = document.createElement("li");

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;

        checkbox.onclick = function (e) {
          e = e || window.event;
          e.cancelBubble = true;
          httpPost("/api/tasks/toggle", task, loadTasks);
        };

        var label = document.createElement("span");
        label.appendChild(document.createTextNode(" " + task.text));

        li.appendChild(checkbox);
        li.appendChild(label);

        ul.appendChild(li);
      })(tasks[i]);
    }
  });
}

function toggleTask(task) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/tasks/toggle", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(task));
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) loadTasks();
  };
}

loadTasks();
setInterval(loadTasks, 30000);
