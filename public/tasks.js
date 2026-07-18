window.onerror = function (msg, url, line) {
  alert("JS ERROR:\n" + msg + "\nline: " + line);
};

if (typeof console === "undefined") {
  window.console = { log: function(){}, error: function(){}, warn: function(){} };
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    do {
      if (el.matches && el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) throw new TypeError('Array.prototype.find called on null or undefined');
    if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

if (!Array.prototype.filter) {
  Array.prototype.filter = function(predicate) {
    if (this === null) throw new TypeError('Array.prototype.filter called on null or undefined');
    if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var res = [];

    for (var i = 0; i < length; i++) {
      if (i in list) {
        var value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          res.push(value);
        }
      }
    }
    return res;
  };
}

if (!Array.from) {
  Array.from = function(iterable) {
    var result = [];
    if (iterable && typeof iterable.forEach === 'function') {
      iterable.forEach(function(value) {
        result.push(value);
      });
    } else if (iterable && typeof iterable.length === 'number') {
      for (var i = 0; i < iterable.length; i++) {
        result.push(iterable[i]);
      }
    }
    return result;
  };
}

if (!NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
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
        if (url.indexOf(".html") !== -1 || url.indexOf(".css") !== -1) {
          callback(xhr.responseText);
          return;
        }
        var data = JSON.parse(xhr.responseText);
        callback(data);
      } catch (e) {
        console.log("Error: ", e);
        alert("Erro ao processar dados");
      }
    } else {
      console.log("HTTP Error: " + xhr.status + " for " + url);
      alert("Erro de rede: " + xhr.status);
    }
  };

  xhr.onerror = function() {
    console.log("Network error for " + url);
    alert("Erro de conexão");
  };

  xhr.send();
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

    if (xhr.status === 200 || xhr.status === 201) {
      try {
        var response = JSON.parse(xhr.responseText);
        callback(null, response);
      } catch (e) {
        console.log("Error: ", e);
        callback(e);
      }
    } else {
      console.log("HTTP Error: " + xhr.status + " for " + url);
      callback(new Error("Erro: " + xhr.status));
    }
  };

  xhr.onerror = function() {
    console.log("Network error for " + url);
    callback(new Error("Erro de conexão"));
  };

  xhr.send(JSON.stringify(data));
}

function httpDelete(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("DELETE", url, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;

    if (xhr.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (xhr.status === 200) {
      try {
        var response = JSON.parse(xhr.responseText);
        callback(null, response);
      } catch (e) {
        console.log("Error: ", e);
        callback(e);
      }
    } else {
      console.log("HTTP Error: " + xhr.status + " for " + url);
      callback(new Error("Erro: " + xhr.status));
    }
  };

  xhr.onerror = function() {
    console.log("Network error for " + url);
    callback(new Error("Erro de conexão"));
  };

  xhr.send();
}

function parseISO(dateStr) {
  if (!dateStr) return null;
  var p = dateStr.split("-");
  return new Date(p[0], p[1] - 1, p[2]);
}

function sortTasks(tasks) {
  var checked = [];
  var unchecked = [];

  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].done) {
      checked.push(tasks[i]);
    } else {
      unchecked.push(tasks[i]);
    }
  }

  checked.sort(function(a, b) {
    var da = a.doneDate ? new Date(a.doneDate).getTime() : 0;
    var db = b.doneDate ? new Date(b.doneDate).getTime() : 0;
    return db - da;
  });

  unchecked.sort(function(a, b) {
    var da = a.scheduled ? new Date(a.scheduled).getTime() : (a.due ? new Date(a.due).getTime() : Infinity);
    var db = b.scheduled ? new Date(b.scheduled).getTime() : (b.due ? new Date(b.due).getTime() : Infinity);
    return da - db;
  });

  return checked.concat(unchecked);
}

function groupTasksByFile(tasks) {
  var groups = {};
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    var file = task.file;
    if (!groups[file]) {
      groups[file] = [];
    }
    groups[file].push(task);
  }
  return groups;
}

function getFileName(filePath) {
  return filePath.split(/[\\/]/).pop();
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderFileContainer(filePath, tasks) {
  var container = document.createElement('div');
  container.className = 'task-section';

  var h2 = document.createElement('h2');
  h2.textContent = getFileName(filePath);
  container.appendChild(h2);

  var scrollContainer = document.createElement('div');
  scrollContainer.className = 'task-container';
  container.appendChild(scrollContainer);

  var ul = document.createElement('ul');
  ul.className = 'tasks-list';
  scrollContainer.appendChild(ul);

  var sorted = sortTasks(tasks);
  var visibleCount = Math.min(10, sorted.length);

  for (var i = 0; i < sorted.length; i++) {
    var task = sorted[i];
    var li = document.createElement('li');
    li.className = 'task-item';

    var label = document.createElement('label');
    label.className = 'task-card';

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;

    checkbox.onclick = function(e, t) {
      return function(ev) {
        ev.stopPropagation();
        toggleTask(t);
      };
    }(checkbox, task);

    var fakebox = document.createElement('span');
    fakebox.className = 'obsidian-checkbox';

    var textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = ' ' + task.text;

    label.appendChild(checkbox);
    label.appendChild(fakebox);
    label.appendChild(textSpan);
    li.appendChild(label);
    ul.appendChild(li);
  }

  var countDiv = document.createElement('div');
  countDiv.className = 'task-count';
  countDiv.textContent = sorted.length + ' tarefa' + (sorted.length !== 1 ? 's' : '');
  container.appendChild(countDiv);

  setTimeout(function() {
    var checkedItems = ul.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedItems.length > 0) {
      var lastChecked = checkedItems[checkedItems.length - 1];
      if (lastChecked) {
        var item = lastChecked;
        while (item && item.className.indexOf('task-item') === -1) {
          item = item.parentElement;
        }
        if (item) {
          item.scrollIntoView();
        }
      }
    }
  }, 0);

  return container;
}

function showEmptyState() {
  var emptyState = document.getElementById('empty-state');
  var tasksContent = document.getElementById('tasks-content');
  if (emptyState) emptyState.style.display = 'block';
  if (tasksContent) tasksContent.style.display = 'none';
}

function showTasksContent() {
  var emptyState = document.getElementById('empty-state');
  var tasksContent = document.getElementById('tasks-content');
  if (emptyState) emptyState.style.display = 'none';
  if (tasksContent) tasksContent.style.display = 'block';
}

function loadPresets() {
  httpGet("/api/presets", function(data) {
    var select = document.getElementById('load-preset');
    if (!select) return;

    while (select.options.length > 1) {
      select.remove(1);
    }

    if (data && data.presets && data.presets.length > 0) {
      select.disabled = false;
      for (var i = 0; i < data.presets.length; i++) {
        var preset = data.presets[i];
        var option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        select.appendChild(option);
      }
    } else {
      select.disabled = true;
    }
  });
}

function loadTasks() {
  var filterFiles = [];
  try {
    var stored = localStorage.getItem('taskFilterFiles');
    if (stored) {
      filterFiles = JSON.parse(stored);
    }
  } catch (e) {
    console.log("Error reading filter files:", e);
    filterFiles = [];
  }

  if (!filterFiles || filterFiles.length === 0) {
    showEmptyState();
    return;
  }

  showTasksContent();

  httpGet("/api/tasks", function(tasks) {
    if (!Array.isArray(tasks)) {
      alert("Resposta inválida do servidor: " + JSON.stringify(tasks));
      return;
    }

    var filtered = tasks.filter(function(task) {
      return filterFiles.indexOf(task.file) !== -1;
    });

    var groups = groupTasksByFile(filtered);
    var content = document.getElementById('tasks-content');
    if (!content) return;

    content.innerHTML = '';

    var hasTasks = false;
    for (var filePath in groups) {
      if (groups.hasOwnProperty(filePath)) {
        hasTasks = true;
        var container = renderFileContainer(filePath, groups[filePath]);
        content.appendChild(container);
      }
    }

    if (!hasTasks) {
      content.innerHTML = '<div class="empty-state"><p>Nenhuma tarefa encontrada nos arquivos selecionados</p></div>';
    }
  });
}

function toggleTask(task) {
  httpPost("/api/tasks/toggle", { file: task.file, line: task.line }, function(err, response) {
    if (err) {
      alert("Erro ao alternar tarefa: " + err.message);
      return;
    }
    loadTasks();
  });
}

function clearFilters() {
  localStorage.removeItem('taskFilterFiles');
  showEmptyState();
  loadTasks();
}

function savePreset() {
  var filterFiles = [];
  try {
    var stored = localStorage.getItem('taskFilterFiles');
    if (stored) {
      filterFiles = JSON.parse(stored);
    }
  } catch (e) {
    console.log("Error reading filter files:", e);
  }

  if (!filterFiles || filterFiles.length === 0) {
    alert("Nenhum filtro para salvar");
    return;
  }

  var name = prompt("Nome do preset:");
  if (!name || !name.trim()) {
    return;
  }

  httpPost("/api/presets", { name: name.trim(), files: filterFiles }, function(err, response) {
    if (err) {
      alert("Erro ao salvar preset: " + err.message);
      return;
    }
    alert("Preset salvo!");
    loadPresets();
  });
}

function onLoadPresetChange() {
  var select = document.getElementById('load-preset');
  var presetId = select.value;

  if (!presetId) return;

  httpGet("/api/presets", function(data) {
    if (!data || !data.presets) return;

    var preset = data.presets.find(function(p) { return p.id === presetId; });
    if (!preset) return;

    localStorage.setItem('taskFilterFiles', JSON.stringify(preset.files || []));
    loadTasks();
    select.value = '';
  });
}

function loadScript(src, callback) {
  var script = document.createElement("script");
  script.src = src;
  script.onload = callback;
  document.head.appendChild(script);
}

function initPage() {
  loadPresets();
  loadTasks();

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

  var btnClear = document.getElementById('btn-clear-filters');
  if (btnClear) {
    btnClear.onclick = clearFilters;
  }

  var btnSave = document.getElementById('btn-save-preset');
  if (btnSave) {
    btnSave.onclick = savePreset;
  }

  var selectPreset = document.getElementById('load-preset');
  if (selectPreset) {
    selectPreset.onchange = onLoadPresetChange;
  }
}

window.onload = initPage;