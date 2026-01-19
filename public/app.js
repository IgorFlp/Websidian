window.onerror = function (msg, url, line) {
  alert("JS ERROR:\n" + msg + "\nline: " + line);
};
/*
function httpGet(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(JSON.parse(xhr.responseText));
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}*/
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
function toDate(date) {
  if (!date) return null;
  return new Date(date + "T00:00:00");
}

function parseISO(dateStr) {
  if (!dateStr) return null;
  var p = dateStr.split("-");
  return new Date(p[0], p[1] - 1, p[2]);
}

function isToday(dateStr) {
  var d = parseISO(dateStr);
  if (!d) return false;

  var t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function isThisWeek(date) {
  if (!date) return false;

  var d = toDate(date);
  var now = new Date();

  var start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  var end = new Date(start);
  end.setDate(start.getDate() + 7);

  return d >= start && d < end;
}

function viewHoje(task) {
  return (
    isToday(task.scheduled) ||
    isToday(task.due) ||
    (task.recurring && isToday(task.scheduled)) ||
    isToday(task.doneDate)
  );
}

function viewSemanal(task) {
  if (task.tags.indexOf("daily") !== -1) return false;

  return (
    isThisWeek(task.due) ||
    isThisWeek(task.scheduled) ||
    (task.recurring && isThisWeek(task.scheduled))
  );
}

function viewIndefinido(task) {
  if (task.done) return false;
  if (task.tags.indexOf("goal") !== -1) return false;
  if (task.tags.indexOf("subgoal") !== -1) return false;
  if (task.due) return false;
  if (task.scheduled) return false;
  if (task.recurring) return false;

  return true;
}

function renderTasks(tasks, filterFn, ulId) {
  var ul = document.getElementById(ulId);
  ul.innerHTML = "";
  //console.log("Tentando renderizar", tasks, filterFn, ulId);
  var tasksFiltered = tasks.filter(filterFn);
  tasksFiltered.forEach(function (task) {
    /*
    <li class="task-item">
      <label class="task-card">
        <input type="checkbox">
        <span class="task-text">
          Estudar como criar um postgres portátil 📅 2026-01-19
        </span>
      </label>
    */
    var taskItem = document.createElement("li");
    taskItem.className = "task-item";

    var taskCard = document.createElement("label");
    taskCard.className = "task-card";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    checkbox.onclick = function (e) {
      e.stopPropagation();
      toggleTask(task);
    };

    var fakebox = document.createElement("span");
    fakebox.className = "obsidian-checkbox";
    fakebox.for = checkbox;

    var taskText = document.createElement("span");
    taskText.appendChild(document.createTextNode(" " + task.text));

    taskCard.appendChild(checkbox);
    taskCard.appendChild(fakebox);
    taskCard.appendChild(taskText);

    taskItem.appendChild(taskCard);

    ul.appendChild(taskItem);
  });
}

function loadTasks() {
  httpGet("/api/tasks", function (tasks) {
    renderTasks(tasks, viewHoje, "tasks-hoje");
    renderTasks(tasks, viewSemanal, "tasks-semanal");
    renderTasks(tasks, viewIndefinido, "tasks-indefinido");
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
