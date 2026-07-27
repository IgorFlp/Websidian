/**
 * Websidian Sidebar - File Manager Navigation
 * Loads folder tree from /api/files, handles expand/collapse, selection, toolbar actions
 */

(function() {
  'use strict';

  // Set polyfill for old Android WebView (Android 4 / Chrome 30-40)
  if (typeof Set === 'undefined') {
    window.Set = function() {
      this._values = {};
      this.size = 0;
    };
    window.Set.prototype.add = function(value) {
      if (!this.has(value)) {
        this._values[value] = true;
        this.size++;
      }
      return this;
    };
    window.Set.prototype.has = function(value) {
      return this._values.hasOwnProperty(value);
    };
    window.Set.prototype.delete = function(value) {
      if (this.has(value)) {
        delete this._values[value];
        this.size--;
        return true;
      }
      return false;
    };
    window.Set.prototype.clear = function() {
      this._values = {};
      this.size = 0;
    };
    window.Set.prototype.forEach = function(callback) {
      for (var key in this._values) {
        if (this._values.hasOwnProperty(key)) {
          callback(key, key, this);
        }
      }
    };
  }

  // Array.from polyfill for old Android WebView
  if (typeof Array.from === 'undefined') {
    Array.from = function(iterable) {
      var result = [];
      if (iterable && typeof iterable.forEach === 'function') {
        iterable.forEach(function(value) {
          result.push(value);
        });
      }
      return result;
    };
  }

  var sidebar = null;
  var folderTree = null;
  var sidebarToolbar = null;
  var selectionCount = null;
  var btnOpenEditor = null;
  var btnClearSelection = null;
  var btnAddTaskView = null;
  var sidebarClose = null;
  var sidebarBackdrop = null;
  var sidebarResizer = null;
  var selectVault = null;

  var selectedFiles = [];
  var expandedFolders = new Set();
  var longPressTimer = null;
  var longPressElement = null;
  var isDragging = false;
  var startX = 0;
  var startWidth = 0;

  var STORAGE_KEYS = {
    FOLDERS: 'sidebar:folders',
    SELECTED_FILE: 'sidebar:selectedFile',
    WIDTH: 'sidebar:width',
    TASK_FILTER_FILES: 'taskFilterFiles'
  };

  var MAX_WIDTH = Math.min(window.innerWidth * 0.8, 320);
  var MIN_WIDTH = 200;
  
  function httpGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;

      if (xhr.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (xhr.status === 200) {
        try {
          if (url.indexOf('.html') !== -1 || url.indexOf('.css') !== -1) {
            callback(xhr.responseText);
            return;
          }
          var data = JSON.parse(xhr.responseText);
          callback(data);
        } catch (e) {
          console.error('Error parsing response:', e);
        }
      }
    };

    xhr.send();
  }  
  function loadVaults() {
    httpGet('/vaults', function(vaults) {
      if(vaults.length <= 0){
        console.error("No vault returned")
      }
      if(!localStorage.getItem("selectedVault")){
        localStorage.setItem("selectedVault", "0")
      }
      localStorage.setItem("vaults", JSON.stringify(vaults))
      createVaultOptions();
    });
  }
  function createVaultOptions(){
    var vaults = JSON.parse(localStorage.getItem("vaults"))
    var select = document.getElementById('select-vault')
    if (!select) return;
    for(var i = 0; i < vaults.length; i++){
      var option = document.createElement('option')
      option.value = vaults[i].id;
      option.text = vaults[i].name;
      select.appendChild(option)
    }
    select.value = localStorage.getItem("selectedVault") || "0";
  }
  function loadSidebar() {
    sidebar = document.getElementById('sidebar-placeholder');
    if (!sidebar) return;

    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'sidebar.css';
    document.head.appendChild(style);

    httpGet('sidebar.html', function(html) {
      sidebar.innerHTML = html;
      sidebar = document.getElementById('sidebar');
      initSidebarElements();
      loadState();
      bindEvents();
      loadFileTree();
      loadVaults();
    });
  }

  function initSidebarElements() {
    folderTree = document.getElementById('folder-tree');
    sidebarToolbar = document.getElementById('sidebar-toolbar');
    selectionCount = document.getElementById('selection-count');
    btnOpenEditor = document.getElementById('btn-open-editor');
    btnAddTaskView = document.getElementById('btn-add-task-view');
    btnClearSelection = document.getElementById('btn-clear-selection');
    sidebarClose = document.getElementById('sidebar-close');
    sidebarBackdrop = document.getElementById('sidebar-backdrop');
    sidebarResizer = document.getElementById('sidebar-resizer');
    selectVault = document.getElementById('select-vault');


    if (selectVault) {
      selectVault.addEventListener('change', function() {
        localStorage.setItem('selectedVault', this.value);
        loadFileTree();
      });
    }
    var savedWidth = localStorage.getItem(STORAGE_KEYS.WIDTH);
    if (savedWidth) {
      sidebar.style.width = Math.min(parseInt(savedWidth, 10), MAX_WIDTH) + 'px';
    }
  }

  function loadState() {
    var folders = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (folders) {
      try {
        expandedFolders = new Set(JSON.parse(folders));
      } catch (e) {
        expandedFolders = new Set();
      }
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(Array.from(expandedFolders)));
  }

  function bindEvents() {
    // Close handlers - use touchstart for immediate response on old Android
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarClose.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeSidebar();
    }, { passive: false });

    sidebarBackdrop.addEventListener('click', closeSidebar);
    sidebarBackdrop.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeSidebar();
    }, { passive: false });

    btnClearSelection.addEventListener('click', clearSelection);
    btnOpenEditor.addEventListener('click', openInEditor);
    btnAddTaskView.addEventListener('click', addToTaskView);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });

    sidebarResizer.addEventListener('mousedown', startDrag);
    sidebarResizer.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }

  function startDrag(e) {
    isDragging = true;
    startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    startWidth = sidebar.offsetWidth;
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  }

  function doDrag(e) {
    if (!isDragging) return;
    var clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    var delta = clientX - startX;
    var newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
    sidebar.style.width = newWidth + 'px';
    e.preventDefault();
  }

  function endDrag() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      localStorage.setItem(STORAGE_KEYS.WIDTH, sidebar.offsetWidth.toString());
    }
  }

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarBackdrop.classList.add('visible');
    document.body.classList.add('sidebar-open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('visible');
    document.body.classList.remove('sidebar-open');
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  window.toggleSidebar = toggleSidebar;

  function loadFileTree() {
    if (!folderTree) return;

    folderTree.innerHTML = '<li class="loading-placeholder">Carregando...</li>';

    httpGet('/api/files?vault='+localStorage.getItem('selectedVault'), function(data) {
      var tree = data.tree || [];
      if (tree.length === 0) {
        folderTree.innerHTML = '<li class="empty-state">Nenhum arquivo encontrado</li>';
        return;
      }
      folderTree.innerHTML = '';
      tree.forEach(function(node) {
        folderTree.appendChild(renderNode(node, 0));
      });
      restoreExpandedState();
    });
  }

  function renderNode(node, depth) {
    var li = document.createElement('li');
    li.className = 'folder-item';
    li.dataset.path = node.path;

    if (node.type === 'folder') {
      var isExpanded = expandedFolders.has(node.path);
      if (isExpanded) li.classList.add('open');

      var header = document.createElement('div');
      header.className = 'folder-header';
      header.innerHTML = '<span class="expand-icon">&#9654;</span><span class="folder-name">' + escapeHtml(node.name) + '</span>';
      header.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFolder(li, node.path);
      });
      li.appendChild(header);

      if (node.children && node.children.length > 0) {
        var ul = document.createElement('ul');
        ul.className = 'folder-children';
        node.children.forEach(function(child) {
          ul.appendChild(renderNode(child, depth + 1));
        });
        li.appendChild(ul);
      }
    } else {
      li.className = 'file-item';
      li.innerHTML = '<span class="file-icon">&#128196;</span><span class="file-name">' + escapeHtml(node.name) + '</span>';
      li.dataset.path = node.path;
      bindFileEvents(li);
    }

    return li;
  }

  function bindFileEvents(li) {
    var touchStartTime = 0;
    var touchMoved = false;
    var startTouchX = 0;
    var startTouchY = 0;

    function startLongPress(e) {
      var touch = e.touches ? e.touches[0] : e;
      touchStartTime = Date.now();
      touchMoved = false;
      startTouchX = touch.clientX;
      startTouchY = touch.clientY;
      longPressElement = li;

      longPressTimer = setTimeout(function() {
        if (!touchMoved && longPressElement === li) {
          selectFile(li);
        }
      }, 500);
    }

    function endLongPress(e) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressElement = null;
    }

    function moveLongPress(e) {
      if (!longPressTimer) return;
      var touch = e.touches ? e.touches[0] : e;
      var dx = Math.abs(touch.clientX - startTouchX);
      var dy = Math.abs(touch.clientY - startTouchY);
      if (dx > 10 || dy > 10) {
        touchMoved = true;
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    li.addEventListener('touchstart', startLongPress, { passive: true });
    li.addEventListener('touchend', endLongPress, { passive: true });
    li.addEventListener('touchmove', moveLongPress, { passive: true });
    li.addEventListener('mousedown', startLongPress);
    li.addEventListener('mouseup', endLongPress);
    li.addEventListener('mousemove', moveLongPress);
  }

  function selectFile(li) {
    var path = li.dataset.path;
    if (!path) return;

    var index = selectedFiles.indexOf(path);
    if (index === -1) {
      selectedFiles.push(path);
      li.classList.add('selected');
    } else {
      selectedFiles.splice(index, 1);
      li.classList.remove('selected');
    }

    updateToolbar();
    localStorage.setItem(STORAGE_KEYS.SELECTED_FILE, JSON.stringify(selectedFiles));
  }

  function clearSelection() {
    selectedFiles.forEach(function(path) {
      var item = folderTree.querySelector('.file-item[data-path="' + escapeSelector(path) + '"]');
      if (item) item.classList.remove('selected');
    });
    selectedFiles = [];
    updateToolbar();
    localStorage.setItem(STORAGE_KEYS.SELECTED_FILE, JSON.stringify(selectedFiles));
    localStorage.removeItem(STORAGE_KEYS.TASK_FILTER_FILES);
  }

  function addToTaskView() {
    if (selectedFiles.length === 0) return;

    localStorage.setItem(STORAGE_KEYS.TASK_FILTER_FILES, JSON.stringify(selectedFiles));
    window.location = "/tasks.html"
  }

  function updateToolbar() {
    if (selectedFiles.length > 0) {
      sidebarToolbar.style.display = 'flex';
      selectionCount.textContent = selectedFiles.length + ' selecionado(s)';
      btnOpenEditor.disabled = false;
      btnAddTaskView.disabled = false;
    } else {
      sidebarToolbar.style.display = 'none';
      btnOpenEditor.disabled = true;
      btnAddTaskView.disabled = true;
    }
  }

  function openInEditor() {
    if (selectedFiles.length === 0) return;
    openInEditorFromPath(selectedFiles[0]);
  }

  function openInEditorFromPath(path) {
    window.location.href = '/editor.html?path=' + encodeURIComponent(path);
  }

  function toggleFolder(li, path) {
    var isOpen = li.classList.toggle('open');
    if (isOpen) {
      expandedFolders.add(path);
    } else {
      expandedFolders.delete(path);
    }
    saveState();
  }

  function restoreExpandedState() {
    expandedFolders.forEach(function(path) {
      var item = folderTree.querySelector('.folder-item[data-path="' + escapeSelector(path) + '"]');
      if (item) item.classList.add('open');
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeSelector(text) {
    return text.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
  }

  function initSidebar() {
    if (sidebar) {
      loadState();
      restoreExpandedState();
      updateToolbar();
    } else {
      loadSidebar();
    }
  }
  window.initSidebar = initSidebar;

})();