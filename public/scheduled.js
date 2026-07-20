window.onerror = function (msg, url, line) {
  safeLog("JS ERROR: " + msg + " at line " + line);
  return true;
};

// Console polyfill for Android 4 stock browser
if (typeof console === "undefined") {
  window.console = { log: function(){}, error: function(){}, warn: function(){} };
}

function safeLog(msg) {
  try { console.log(msg); } catch (e) {}
  // Avoid alert() on old Android - it can crash the browser
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
      try {
        if (url.indexOf(".html") !== -1) {
          callback(xhr.responseText);
          return;
        }
        var data = JSON.parse(xhr.responseText);
        callback(data);
      } catch (e) {
        safeLog("Error: " + e);
        safeLog("Erro ao processar dados");
      }
    } else {
      safeLog("HTTP Error: " + xhr.status + " for " + url);
      safeLog("Erro de rede: " + xhr.status);
    }
  };

  xhr.onerror = function() {
    safeLog("Network error for " + url);
    safeLog("Erro de conexão");
  };

  xhr.send();
}

function toDate(date) {
  if (!date) return null;
  return parseISO(date);
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

function isThisWeek(dateStr) {
  try{
  if (!dateStr) return false;

  var d = toDate(dateStr);
  var now = new Date();

  var start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  var end = new Date(start);
  end.setDate(start.getDate() + 7);

  return d >= start && d < end;
  }catch(e){
    console.log("Erro is week: ", e, dateStr)
    return false
  }
}

function isThisMonth(dateStr) {
  try{
  if (!dateStr) return false;

  var d = parseISO(dateStr);
  if (!d) return false;

  var now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }catch(e){
    console.log("Erro month: ", e, dateStr)
    return false
  }
}

function viewHoje(task) {
  try {
    return (
      isToday(task.scheduled) ||
      isToday(task.due) ||
      (task.recurring && isToday(task.scheduled)) ||
      isToday(task.doneDate)
    );
  } catch (e) {
    safeLog("Erro viewHoje: " + e.message);
    return false;
  }
}

function viewSemanal(task) {
  try {
    var tags = task.tags || [];
    if (tags.indexOf("daily") !== -1) return false;

    return (
      isThisWeek(task.due) ||
      isThisWeek(task.scheduled) ||
      isThisWeek(task.doneDate) ||
      (task.recurring && isThisWeek(task.scheduled))
    );
  } catch (e) {
    safeLog("Erro viewSemanal: " + e.message);
    return false;
  }
}

function viewMensal(task) {
  try {
    return isThisMonth(task.scheduled) || isThisMonth(task.due) || isThisMonth(task.doneDate);
  } catch (e) {
    safeLog("Erro viewMensal: " + e.message);
    return false;
  }
}

function viewIndefinido(task) {
  try {
    if (task.done) return false;
    var tags = task.tags || [];
    if (tags.indexOf("goal") !== -1) return false;
    if (tags.indexOf("subgoal") !== -1) return false;
    if (task.due) return false;
    if (task.scheduled) return false;
    if (task.recurring) return false;

    return true;
  } catch (e) {
    safeLog("Erro viewIndefinido: " + e.message);
    return false;
  }
}

function renderTasks(tasks, filterFn, ulId) {
  var ul = document.getElementById(ulId);
  if (!ul) return;
  ul.innerHTML = "";
  var tasksFiltered = tasks.filter(filterFn);
  tasksFiltered.forEach(function (task) {
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
    taskText.className = "task-text"
    taskText.appendChild(document.createTextNode(" " + task.text));

    taskCard.appendChild(checkbox);
    taskCard.appendChild(fakebox);
    taskCard.appendChild(taskText);

    taskItem.appendChild(taskCard);

    ul.appendChild(taskItem);
  });

  var sectionId = ulId.replace("tasks-", "section-");
  var countEl = document.querySelector("#" + sectionId + " .task-count");
  if (countEl) {
    countEl.textContent = tasksFiltered.length + " tarefa" + (tasksFiltered.length !== 1 ? "s" : "");
  }
}

function loadTasks() {
  httpGet("/api/tasks?vault=" + localStorage.getItem("selectedVault"), function(tasks) {
    if (!Array.isArray(tasks)) {
      safeLog("Resposta inválida do servidor: " + JSON.stringify(tasks));
      return;
    }
    try {
      renderTasks(tasks, viewHoje, "tasks-hoje");
      renderTasks(tasks, viewSemanal, "tasks-semanal");
      renderTasks(tasks, viewMensal, "tasks-mes");
      renderTasks(tasks, viewIndefinido, "tasks-indefinido");
    } catch (e) {
      safeLog("Erro ao renderizar: " + e.message);
    }
    return true
  })
}

function toggleTask(task) {
  var vaultIndex = localStorage.getItem("selectedVault");
  var data = { file: task.file, line: task.line, vaultIndex: vaultIndex };
  if (task.done !== undefined) data.done = task.done;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/tasks/toggle", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(data));
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) loadTasks();
  };
}

window.onload = function () {
  loadTasks();
  setInterval(loadTasks, 30000);

  httpGet("header.html", function (data) {
    document.querySelector(".header-placeholder").innerHTML = data;
  });
  httpGet("sidebar.html", function (data) {
    document.querySelector("#sidebar-placeholder").innerHTML = data;
    loadScript("sidebar.js", function () {
      if (window.initSidebar) {
        window.initSidebar();
      }
    });
  });
};

function loadScript(src, callback) {
  var script = document.createElement("script");
  script.src = src;
  script.onload = callback;
  document.head.appendChild(script);
}

