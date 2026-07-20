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

function httpPut(url, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("PUT", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");

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

  xhr.send(JSON.stringify(data));
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

    if (data && data.presets && data.presets.length > 0) {
      select.disabled = false;
      var presets = data.presets.slice().sort(function(a, b) {
        return (a.order || 0) - (b.order || 0);
      });
      for (var i = 0; i < presets.length; i++) {
        var preset = presets[i];
        var option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        select.appendChild(option);
      }
      if (window.currentPresetId) {
        select.value = window.currentPresetId;
      }
    } else {
      select.disabled = true;
    }
  });
}

function getActiveVaultIndex() {
  if (window.currentPresetId) {
    var presetData = localStorage.getItem('currentPresetData');
    if (presetData) {
      try {
        var preset = JSON.parse(presetData);
        if (preset.vaultIndex !== undefined) return preset.vaultIndex.toString();
      } catch (e) {}
    }
  }
  return localStorage.getItem("selectedVault") || "0";
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

  var presetData = null;
  try {
    var stored = localStorage.getItem('currentPresetData');
    if (stored) presetData = JSON.parse(stored);
  } catch (e) {}

  var fileOrder = {};
  if (presetData && presetData.files) {
    presetData.files.forEach(function(f, i) { fileOrder[f.path] = f.order !== undefined ? f.order : i; });
  }

  httpGet("/api/tasks?vault=" + getActiveVaultIndex(), function(tasks) {
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
    var filePaths = Object.keys(groups);
    filePaths.sort(function(a, b) {
      var oa = fileOrder[a] !== undefined ? fileOrder[a] : 9999;
      var ob = fileOrder[b] !== undefined ? fileOrder[b] : 9999;
      return oa - ob;
    });
    for (var i = 0; i < filePaths.length; i++) {
      var filePath = filePaths[i];
      hasTasks = true;
      var container = renderFileContainer(filePath, groups[filePath]);
      content.appendChild(container);
    }

    if (!hasTasks) {
      content.innerHTML = '<div class="empty-state"><p>Nenhuma tarefa encontrada nos arquivos selecionados</p></div>';
    }
  });
}

function toggleTask(task) {
  var vaultIndex = getActiveVaultIndex();
  httpPost("/api/tasks/toggle", { file: task.file, line: task.line, vaultIndex: vaultIndex }, function(err, response) {
    if (err) {
      alert("Erro ao alternar tarefa: " + err.message);
      return;
    }
    loadTasks();
  });
}

function clearFilters() {
  localStorage.removeItem('taskFilterFiles');
  localStorage.removeItem('currentPresetData');
  window.currentPresetId = null;
  var select = document.getElementById('load-preset');
  if (select) select.value = "";
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

  var vaultIndex = localStorage.getItem("selectedVault") || "0";
  var filesWithOrder = filterFiles.map(function(f, i) { return { path: f, order: i }; });

  httpPost("/api/presets", { name: name.trim(), files: filesWithOrder, vaultIndex: parseInt(vaultIndex, 10) }, function(err, response) {
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

  if (presetId === "") {
    localStorage.removeItem('currentPresetData');
    window.currentPresetId = null;
    loadTasks();
    return;
  }

  httpGet("/api/presets", function(data) {
    if (!data || !data.presets) return;

    var preset = data.presets.find(function(p) { return p.id === presetId; });
    if (!preset) return;

    var files = (preset.files || []).map(function(f) { return typeof f === 'string' ? { path: f } : f; });
    localStorage.setItem('taskFilterFiles', JSON.stringify(files.map(function(f) { return f.path; })));

    localStorage.setItem('currentPresetData', JSON.stringify({
      vaultIndex: preset.vaultIndex,
      files: files
    }));
    window.currentPresetId = presetId;

    loadTasks();
    select.value = presetId;
  });
}

function movePreset(presetId, direction) {
  httpGet("/api/presets", function(data) {
    if (!data || !data.presets) return;

    var presets = data.presets.slice().sort(function(a, b) {
      return (a.order || 0) - (b.order || 0);
    });

    var index = presets.findIndex(function(p) { return p.id === presetId; });
    if (index === -1) return;

    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= presets.length) return;

    var temp = presets[index].order;
    presets[index].order = presets[newIndex].order;
    presets[newIndex].order = temp;

    httpPut("/api/presets/" + presetId, { order: presets[index].order }, function(err) {
      if (!err) loadPresets();
    });

    httpPut("/api/presets/" + presets[newIndex].id, { order: presets[newIndex].order }, function(err) {
      if (!err) loadPresets();
    });
  });
}

function openPresetManager() {
  var modal = document.getElementById('preset-manager-modal');
  if (!modal) return;
  renderPresetManager();
  modal.style.display = 'flex';
}

function closePresetManager() {
  var modal = document.getElementById('preset-manager-modal');
  if (modal) modal.style.display = 'none';
}

function renderPresetManager() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  list.innerHTML = '<div class="loading-placeholder">Carregando...</div>';

  httpGet("/api/presets", function(data) {
    list.innerHTML = '';
    if (!data || !data.presets || data.presets.length === 0) {
      list.innerHTML = '<div class="empty-state">Nenhum preset salvo</div>';
      return;
    }
    var presets = data.presets.slice().sort(function(a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    presets.forEach(function(preset) {
      var item = document.createElement('div');
      item.className = 'preset-manager-item';
      item.draggable = true;
      item.dataset.id = preset.id;
      item.innerHTML = '<span class="preset-drag-handle">&#9776;</span>' +
        '<span class="preset-name">' + escapeHtml(preset.name) + '</span>' +
        '<span class="preset-vault">Vault ' + (preset.vaultIndex || 0) + '</span>' +
        '<button class="btn-small preset-reorder-files" data-id="' + preset.id + '" data-name="' + escapeHtml(preset.name) + '">Ordenar Arquivos</button>' +
        '<button class="btn-small preset-delete" data-id="' + preset.id + '">Excluir</button>';
      list.appendChild(item);
    });
    initPresetDragDrop();
    initPresetDelete();
    initPresetFileReorder();
  });
}

function initPresetDragDrop() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  var items = list.querySelectorAll('.preset-manager-item');
  var dragged = null;

  items.forEach(function(item) {
    item.addEventListener('dragstart', function(e) {
      dragged = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', function() {
      item.classList.remove('dragging');
      dragged = null;
    });
    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragged && dragged !== item) {
        var rect = item.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          list.insertBefore(dragged, item);
        } else {
          list.insertBefore(dragged, item.nextSibling);
        }
      }
    });
  });
}

function initPresetDelete() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  list.addEventListener('click', function(e) {
    if (e.target.classList.contains('preset-delete')) {
      var id = e.target.dataset.id;
      if (confirm('Excluir preset?')) {
        httpDelete("/api/presets/" + id, function(err) {
          if (!err) renderPresetManager();
        });
      }
    }
  });
}

function savePresetOrder() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  var items = list.querySelectorAll('.preset-manager-item');
  var ids = Array.prototype.map.call(items, function(item) { return item.dataset.id; });
  httpPut("/api/presets/reorder", { presetIds: ids }, function(err) {
    if (!err) {
      loadPresets();
      closePresetManager();
    }
  });
}

function initPresetFileReorder() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  list.addEventListener('click', function(e) {
    if (e.target.classList.contains('preset-reorder-files')) {
      var presetId = e.target.dataset.id;
      var presetName = e.target.dataset.name;
      openFileReorderModal(presetId, presetName);
    }
  });
}

function openFileReorderModal(presetId, presetName) {
  var modal = document.getElementById('file-reorder-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'file-reorder-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = '<div class="modal">' +
      '<div class="modal-header">' +
        '<h2>Ordenar Arquivos: <span id="file-reorder-preset-name"></span></h2>' +
        '<button class="modal-close" onclick="closeFileReorderModal()">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div id="file-reorder-list" class="preset-manager-list"></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn" onclick="saveFileOrder()">Salvar Ordem</button>' +
        '<button class="btn btn-secondary" onclick="closeFileReorderModal()">Fechar</button>' +
      '</div>' +
    '</div>';
    document.body.appendChild(modal);
  }
  document.getElementById('file-reorder-preset-name').textContent = presetName;
  modal.dataset.presetId = presetId;
  modal.style.display = 'flex';
  renderFileReorderList(presetId);
}

function closeFileReorderModal() {
  var modal = document.getElementById('file-reorder-modal');
  if (modal) modal.style.display = 'none';
}

function renderFileReorderList(presetId) {
  var list = document.getElementById('file-reorder-list');
  if (!list) return;
  list.innerHTML = '<div class="loading-placeholder">Carregando...</div>';

  httpGet("/api/presets", function(data) {
    if (!data || !data.presets) return;
    var preset = data.presets.find(function(p) { return p.id === presetId; });
    if (!preset) return;

    list.innerHTML = '';
    var files = preset.files || [];
    if (files.length === 0) {
      list.innerHTML = '<div class="empty-state">Nenhum arquivo neste preset</div>';
      return;
    }
    var normalizedFiles = files.map(function(f) { return typeof f === 'string' ? { path: f } : f; });
    normalizedFiles.forEach(function(file, index) {
      var item = document.createElement('div');
      item.className = 'preset-manager-item';
      item.dataset.path = file.path;
      var fileName = escapeHtml(file.path.split(/[\\/]/).pop());
      var upDisabled = index === 0 ? ' disabled' : '';
      var downDisabled = index === normalizedFiles.length - 1 ? ' disabled' : '';
      item.innerHTML = '<span class="preset-name">' + fileName + '</span>' +
        '<span class="preset-vault">Ordem: ' + (index + 1) + '</span>' +
        '<button class="btn-small btn-move-up' + upDisabled + '" data-action="up" title="Mover para cima" aria-label="Mover para cima"' + upDisabled + '>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg></button>' +
        '<button class="btn-small btn-move-down' + downDisabled + '" data-action="down" title="Mover para baixo" aria-label="Mover para baixo"' + downDisabled + '>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg></button>';
      list.appendChild(item);
    });
    initFileReorderButtons(list);
  });
}

function initFileReorderButtons(list) {
  if (!list) return;
  list.addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var item = btn.closest('.preset-manager-item');
    if (!item) return;
    var action = btn.dataset.action;
    var items = list.querySelectorAll('.preset-manager-item');
    var index = Array.prototype.indexOf.call(items, item);
    if (action === 'up' && index > 0) {
      list.insertBefore(item, items[index - 1]);
      updateFileOrderNumbers(list);
    } else if (action === 'down' && index < items.length - 1) {
      list.insertBefore(item, items[index + 1].nextSibling);
      updateFileOrderNumbers(list);
    }
  });
}

function updateFileOrderNumbers(list) {
  var items = list.querySelectorAll('.preset-manager-item');
  items.forEach(function(item, index) {
    var vaultSpan = item.querySelector('.preset-vault');
    if (vaultSpan) vaultSpan.textContent = 'Ordem: ' + (index + 1);
  });
}

function saveFileOrder() {
  var modal = document.getElementById('file-reorder-modal');
  if (!modal) return;
  var presetId = modal.dataset.presetId;
  var list = document.getElementById('file-reorder-list');
  if (!list) return;

  var items = list.querySelectorAll('.preset-manager-item');
  var files = Array.prototype.map.call(items, function(item, index) { return { path: item.dataset.path, order: index }; });

  httpGet("/api/presets", function(data) {
    if (!data || !data.presets) return;
    var presetIndex = data.presets.findIndex(function(p) { return p.id === presetId; });
    if (presetIndex === -1) return;

    data.presets[presetIndex].files = files;
    httpPut("/api/presets/" + presetId + "/files", { files: files }, function(err) {
      if (!err) {
        closeFileReorderModal();
        renderPresetManager();
        if (window.currentPresetId === presetId) loadTasks();
      }
    });
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

  var btnMoveUp = document.getElementById('btn-preset-up');
  if (btnMoveUp) {
    btnMoveUp.onclick = function() {
      var select = document.getElementById('load-preset');
      if (select && select.value) movePreset(select.value, -1);
    };
  }

  var btnMoveDown = document.getElementById('btn-preset-down');
  if (btnMoveDown) {
    btnMoveDown.onclick = function() {
      var select = document.getElementById('load-preset');
      if (select && select.value) movePreset(select.value, 1);
    };
  }

  var btnManage = document.getElementById('btn-preset-manage');
  if (btnManage) {
    btnManage.onclick = openManagePresetsModal;
  }

  var btnReorderFiles = document.getElementById('btn-reorder-files');
  if (btnReorderFiles) {
    btnReorderFiles.onclick = function() {
      if (window.currentPresetId) {
        httpGet("/api/presets", function(data) {
          if (!data || !data.presets) return;
          var preset = data.presets.find(function(p) { return p.id === window.currentPresetId; });
          if (preset) openFileReorderModal(preset.id, preset.name);
        });
      }
    };
  }
}

function openManagePresetsModal() {
  var modal = document.getElementById('preset-manager-modal');
  if (modal) modal.style.display = 'flex';
  renderPresetManager();
}

function closePresetManager() {
  var modal = document.getElementById('preset-manager-modal');
  if (modal) modal.style.display = 'none';
}

function renderPresetManager() {
  httpGet("/api/presets", function(data) {
    var list = document.getElementById('preset-manager-list');
    if (!list) return;
    list.innerHTML = '';
    if (!data || !data.presets || data.presets.length === 0) {
      list.innerHTML = '<div class="empty-state">Nenhum preset salvo</div>';
      return;
    }
    var presets = data.presets.slice().sort(function(a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    presets.forEach(function(preset) {
      var item = document.createElement('div');
      item.className = 'preset-manager-item';
      item.draggable = true;
      item.dataset.id = preset.id;
      item.innerHTML = '<span class="preset-drag-handle">&#9776;</span>' +
        '<span class="preset-name">' + escapeHtml(preset.name) + '</span>' +
        '<span class="preset-vault">Vault ' + (preset.vaultIndex || 0) + '</span>' +
        '<button class="btn-small preset-delete" data-id="' + preset.id + '">Excluir</button>';
      list.appendChild(item);
    });
    initPresetDragDrop();
    initPresetDelete();
  });
}

function initPresetDragDrop() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  var items = list.querySelectorAll('.preset-manager-item');
  var dragged = null;

  items.forEach(function(item) {
    item.addEventListener('dragstart', function(e) {
      dragged = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', function() {
      item.classList.remove('dragging');
      dragged = null;
    });
    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragged && dragged !== item) {
        var rect = item.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          list.insertBefore(dragged, item);
        } else {
          list.insertBefore(dragged, item.nextSibling);
        }
      }
    });
  });
}

function initPresetDelete() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  list.addEventListener('click', function(e) {
    if (e.target.classList.contains('preset-delete')) {
      var id = e.target.dataset.id;
      if (confirm('Excluir preset?')) {
        httpDelete("/api/presets/" + id, function(err) {
          if (!err) renderPresetManager();
        });
      }
    }
  });
}

function savePresetOrder() {
  var list = document.getElementById('preset-manager-list');
  if (!list) return;
  var items = list.querySelectorAll('.preset-manager-item');
  var ids = Array.prototype.map.call(items, function(item) { return item.dataset.id; });
  httpPut("/api/presets/reorder", { presetIds: ids }, function(err) {
    if (!err) {
      loadPresets();
      closePresetManager();
    }
  });
}

window.onload = initPage;