// ============================================
// HERMES // OS - Websidian Server Live Monitor
// ES5 Compatible (Android 4+)
// ============================================

// Configuração da API Beszel (carregada de /api/client-config)
var BESZEL_API_BASE = '/api/beszel'; // Proxy no servidor Websidian
var BESZEL_API_TOKEN = ''; // Não precisa token - proxy injeta

// Estado da aplicação
var currentSystemId = null;
var pollingInterval = null;
var chartInterval = null;
var isStreaming = true;
var tickCount = 0;
var POLL_INTERVAL_MS = 1000;

// Histórico de dados para gráficos (últimos 60 pontos = 60s)
var maxHistoryPoints = 60;
var cpuHistory = [];
var cpuTempHistory = [];
var gpuLoadHistory = [];
var gpuVramHistory = [];
var gpuTempHistory = [];
var nvmeReadHistory = [];
var nvmeWriteHistory = [];
var memUsageHistory = [];
var diskUsageHistory = [];
var diskBusyHistory = [];

// Dados simulados para fallback (GPU, NVMe details, containers - não disponíveis na API básica)
var fallbackData = {
    gpu: { load: 0, vram: 0, vramTotal: 8, temp: 0 },  // 8GB VRAM for AMD RX 580
    nvme: { read: 0, write: 0, iops: 0, queueDepth: 0, health: 100 },
    mem: { usage: 22.3, avail: 12.5, used: 3.5, total: 16, swapUsed: 0, swapTotal: 0 },
    containers: [
        { name: 'hermes-agent-core', tag: 'orchestration \u2022 node 0', status: 'healthy', cpu: '8.4%', ram: '3.4 GB', net: '4.2 MB/s', healthClass: 'health-healthy', sparkline: 'primary' },
        { name: 'websidian-db', tag: 'postgres:16-alpine', status: 'healthy', cpu: '4.2%', ram: '2.1 GB', queries: '340 q/s', healthClass: 'health-healthy', sparkline: 'warning' },
        { name: 'beszel-agent', tag: 'telemetry probe v0.9.1', status: 'tick', cpu: '0.8%', ram: '48 MB', buffer: 'sync OK', healthClass: 'health-tick', sparkline: 'primary' },
        { name: 'redis-cache', tag: 'key-value store', status: 'healthy', cpu: '1.1%', ram: '512 MB', hitRate: '99.4%', healthClass: 'health-healthy', sparkline: 'success' },
        { name: 'nginx-gateway', tag: 'reverse-proxy ssl', status: 'healthy', cpu: '2.3%', ram: '180 MB', traffic: '842 req/s', healthClass: 'health-healthy', sparkline: 'cyan' }
    ]
};

// SVG Path templates for charts
var chartPaths = {
    cpu: {
        area: 'M 0 80 Q 70 62, 140 68 T 280 71 T 420 40 T 540 62 T 600 68 L 600 120 L 0 120 Z',
        line: 'M 0 80 Q 70 62, 140 68 T 280 71 T 420 40 T 540 62 T 600 68',
        temp: 'M 0 65 Q 60 62, 120 64 T 240 68 T 360 63 T 480 66 T 600 64'
    },
    gpu: {
        area: 'M 0 60 Q 60 70, 120 50 T 240 40 T 360 55 T 480 35 T 600 48 L 600 120 L 0 120 Z',
        line: 'M 0 60 Q 60 70, 120 50 T 240 40 T 360 55 T 480 35 T 600 48',
        vram: 'M 0 52 Q 60 51, 120 53 T 240 50 T 360 48 T 480 49 T 600 50',
        temp: 'M 0 58 Q 60 56, 120 59 T 240 55 T 360 57 T 480 54 T 600 56'
    },
    nvme: {
        readArea: 'M 0 90 Q 50 40, 100 85 T 200 45 T 300 95 T 400 30 T 500 70 T 600 50 L 600 120 L 0 120 Z',
        readLine: 'M 0 90 Q 50 40, 100 85 T 200 45 T 300 95 T 400 30 T 500 70 T 600 50',
        writeLine: 'M 0 100 Q 50 95, 100 90 T 200 85 T 300 70 T 400 90 T 500 85 T 600 88'
    }
};

// Utilitários
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function formatNumber(num, decimals) {
    if (num === null || num === undefined) return '--';
    var d = decimals || 1;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function formatBytes(bytes) {
    if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ============================================
// XMLHttpRequest Wrapper (ES5) - usa proxy /api/beszel
// ============================================
function xhrGet(url, callback, errorCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    console.log('xhrGet:', url);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log('xhrGet response:', url, 'status:', xhr.status);
            if (xhr.status >= 200 && xhr.status < 300) {
                try { callback(JSON.parse(xhr.responseText)); } catch (e) { if (errorCallback) errorCallback('Parse error: ' + e.message); }
            } else { if (errorCallback) errorCallback('HTTP ' + xhr.status); }
        }
    };
    xhr.onerror = function() { if (errorCallback) errorCallback('Network error'); };
    xhr.ontimeout = function() { if (errorCallback) errorCallback('Timeout'); };
    xhr.timeout = 5000;
    xhr.send();
}

// XHR para API local (sem token Beszel)
function localXhrGet(url, callback, errorCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                try { callback(JSON.parse(xhr.responseText)); } catch (e) { if (errorCallback) errorCallback('Parse error: ' + e.message); }
            } else { if (errorCallback) errorCallback('HTTP ' + xhr.status); }
        }
    };
    xhr.onerror = function() { if (errorCallback) errorCallback('Network error'); };
    xhr.ontimeout = function() { if (errorCallback) errorCallback('Timeout'); };
    xhr.timeout = 5000;
    xhr.send();
}

// Buscar config do servidor local
function fetchClientConfig(callback, errorCallback) {
    localXhrGet('/api/client-config', function(data) {
        console.log('fetchClientConfig response:', data);
        if (data && data.beszelApiUrl && data.beszelApiKey) {
            // Usar proxy local - não sobrescrever BESZEL_API_BASE
            console.log('Config validated - using proxy at', BESZEL_API_BASE);
            callback();
        } else {
            errorCallback('Config inválida: ' + JSON.stringify(data));
        }
    }, errorCallback);
}

// ============================================
// API Beszel (via proxy /api/beszel)
// ============================================
function fetchSystems(cb, eb) {
    var url = BESZEL_API_BASE + '/api/collections/systems/records?filter=(status="up")&perPage=1';
    console.log('fetchSystems: calling xhrGet');
    xhrGet(url, function(data) {
        console.log('fetchSystems success callback, data:', data);
        if (data.items && data.items.length > 0) {
            console.log('fetchSystems: calling cb with system', data.items[0].id);
            cb(data.items[0]);
        } else {
            console.log('fetchSystems: no items, calling eb');
            eb('No active systems');
        }
    }, function(err) {
        console.log('fetchSystems error callback:', err);
        eb(err);
    });
}

function fetchLatestStats(systemId, cb, eb) {
    var url = BESZEL_API_BASE + '/api/collections/system_stats/records?filter=(system="' + encodeURIComponent(systemId) + '"%20%26%26%20type="1m")&sort=-created&perPage=1&fields=created,stats';
    xhrGet(url, function(data) {
        if (data.items && data.items.length > 0) cb(data.items[0].stats, data.items[0].created);
        else eb('No metrics data');
    }, eb);
}

function parseMetrics(stats) {
    if (!stats) return null;
    
    console.log('parseMetrics raw stats:', JSON.stringify(stats).substring(0, 500));
    
    // Extrair temperatura da CPU se disponível
    var cpuTemp = 0;
    if (stats.t && Object.keys(stats.t).length > 0) {
        var temps = Object.keys(stats.t).map(function(k) { return stats.t[k]; });
        cpuTemp = Math.max.apply(Math, temps);
    }
    
    // Extrair dados de GPU se disponíveis
    var gpuLoad = 0, gpuVram = 0, gpuVramTotal = 0, gpuTemp = 0, gpuName = '';
    if (stats.g && Object.keys(stats.g).length > 0) {
        var gpuKeys = Object.keys(stats.g);
        if (gpuKeys.length > 0) {
            var firstGpu = stats.g[gpuKeys[0]];
            gpuName = firstGpu.n || gpuKeys[0];
            console.log('GPU raw data:', firstGpu);
            // Beszel GPU fields: u=utilization %, mu=mem_used MB, mt=mem_total MB, p=power W
            gpuLoad = firstGpu.u || 0;
            gpuVram = (firstGpu.mu || 0) / 1024; // MB to GB
            gpuVramTotal = (firstGpu.mt || 0) / 1024; // MB to GB
            // Clamp VRAM total to known value (8GB for RX 580) if Beszel returns unrealistic value
            if (gpuVramTotal > 10 || gpuVramTotal < 1) {
                gpuVramTotal = 8;
            }
            // GPU temp is in stats.t with the GPU name as key
            gpuTemp = (stats.t && stats.t[gpuName]) || 0;
        }
    }
    
    console.log('Parsed metrics:', {
        cpu: stats.cpu || 0,
        cpuTemp: cpuTemp,
        gpuLoad: gpuLoad,
        gpuVram: gpuVram,
        gpuVramTotal: gpuVramTotal,
        gpuTemp: gpuTemp,
        diskReadPs: stats.dr || 0,
        diskWritePs: stats.dw || 0,
        diskBusyPct: (stats.dios && stats.dios[2]) || 0,
        memPct: stats.mp || 0,
        diskPct: stats.dp || 0
    });
    
    return {
        // CPU
        cpu: stats.cpu || 0,
        cpuTemp: cpuTemp,
        cpuBreakdown: stats.cpub || [0,0,0,0,0],
        
        // Memory
        memTotal: stats.m || 0,
        memUsed: stats.mu || 0,
        memPct: stats.mp || 0,
        swapTotal: stats.s || 0,
        swapUsed: stats.su || 0,
        
        // Disk
        diskTotal: stats.d || 0,
        diskUsed: stats.du || 0,
        diskPct: stats.dp || 0,
        diskReadPs: stats.dr || 0,
        diskWritePs: stats.dw || 0,
        diskBusyPct: (stats.dios && stats.dios[2]) || 0,
        
        // Network
        netSent: stats.b ? stats.b[0] : 0,
        netRecv: stats.b ? stats.b[1] : 0,
        netInterfaces: stats.ni || {},
        
        // Load
        loadAvg: stats.la || [0,0,0],
        
        // GPU (Beszel fields: u=util %, mu=mem_used MB, mt=mem_total MB, p=power W)
        gpuLoad: gpuLoad,
        gpuVram: gpuVram,
        gpuVramTotal: gpuVramTotal,
        gpuTemp: gpuTemp,
        gpuName: gpuName,
        
        // Temperatures
        temperatures: stats.t || {},
        
        // Extra filesystems
        extraFs: stats.efs || {}
    };
}

// ============================================
// History Management
// ============================================
function addToHistory(history, value) {
    history.push(value);
    if (history.length > maxHistoryPoints) {
        history.shift();
    }
}

function updateHistories(metrics) {
    if (!metrics) return;
    
    addToHistory(cpuHistory, metrics.cpu);
    addToHistory(cpuTempHistory, metrics.cpuTemp || 0);
    addToHistory(gpuLoadHistory, metrics.gpuLoad || 0);
    addToHistory(gpuVramHistory, metrics.gpuVram || 0);
    addToHistory(gpuTempHistory, metrics.gpuTemp || 0);
    // Beszel returns diskReadPs/diskWritePs in MB/s already (dr, dw fields)
    addToHistory(nvmeReadHistory, metrics.diskReadPs || 0);
    addToHistory(nvmeWriteHistory, metrics.diskWritePs || 0);
    addToHistory(memUsageHistory, metrics.memPct || 0);
    addToHistory(diskUsageHistory, metrics.diskPct || 0);
    addToHistory(diskBusyHistory, metrics.diskBusyPct || 0);
}

// ============================================
// Chart Rendering (Real Data)
// ============================================
function buildPathFromHistory(history, minY, maxY, height, offsetY) {
    if (history.length < 2) return 'M 0 ' + height + ' L 600 ' + height;
    
    var stepX = 600 / (maxHistoryPoints - 1);
    var range = maxY - minY;
    if (range === 0) range = 1;
    
    var path = 'M 0 ' + (height - ((history[0] - minY) / range) * height);
    for (var i = 1; i < history.length; i++) {
        var x = i * stepX;
        var y = height - ((history[i] - minY) / range) * height;
        if (i === 1) {
            path += ' Q ' + (x/2) + ' ' + y + ', ' + x + ' ' + y;
        } else if (i === 2) {
            path += ' T ' + x + ' ' + y;
        } else {
            path += ' T ' + x + ' ' + y;
        }
    }
    return path;
}

function buildAreaPathFromHistory(history, minY, maxY, height) {
    var linePath = buildPathFromHistory(history, minY, maxY, height, 0);
    return linePath + ' L 600 ' + height + ' L 0 ' + height + ' Z';
}

function animateCharts() {
    if (!isStreaming) return;
    tickCount++;
    
    // CPU chart (0-100%)
    var cpuLine = buildPathFromHistory(cpuHistory, 0, 100, 120);
    var cpuArea = buildAreaPathFromHistory(cpuHistory, 0, 100, 120);
    setPath('pathCpuArea', cpuArea);
    setPath('pathCpuLine', cpuLine);
    
    // CPU Temp chart (0-100°C)
    var cpuTempMax = 100;
    var cpuTempLine = buildPathFromHistory(cpuTempHistory, 0, cpuTempMax, 120);
    setPath('pathCpuTemp', cpuTempLine);
    
    // GPU chart (0-100%)
    var gpuLine = buildPathFromHistory(gpuLoadHistory, 0, 100, 120);
    var gpuArea = buildAreaPathFromHistory(gpuLoadHistory, 0, 100, 120);
    setPath('pathGpuArea', gpuArea);
    setPath('pathGpuLine', gpuLine);
    
    // GPU VRAM chart (0-vramTotal GB)
    var vramMax = fallbackData.gpu.vramTotal; // 8GB for RX 580
    var vramLine = buildPathFromHistory(gpuVramHistory, 0, vramMax, 120);
    setPath('pathGpuVram', vramLine);
    
    // GPU Temp chart (0-100°C)
    var gpuTempLine = buildPathFromHistory(gpuTempHistory, 0, 100, 120);
    setPath('pathGpuTemp', gpuTempLine);
    
    // NVMe Read chart (dynamic range)
    var readMax = Math.max.apply(Math, nvmeReadHistory.concat([1]));
    var readLine = buildPathFromHistory(nvmeReadHistory, 0, readMax, 120);
    var readArea = buildAreaPathFromHistory(nvmeReadHistory, 0, readMax, 120);
    setPath('pathNvmeReadArea', readArea);
    setPath('pathNvmeRead', readLine);
    
    // NVMe Write chart (dynamic range)
    var writeMax = Math.max.apply(Math, nvmeWriteHistory.concat([1]));
    var writeLine = buildPathFromHistory(nvmeWriteHistory, 0, writeMax, 120);
    setPath('pathNvmeWrite', writeLine);
    
    // Memory Usage chart (0-100%)
    var memLine = buildPathFromHistory(memUsageHistory, 0, 100, 120);
    var memArea = buildAreaPathFromHistory(memUsageHistory, 0, 100, 120);
    setPath('pathMemArea', memArea);
    setPath('pathMemLine', memLine);
    
    // Disk Busy chart (0-100%)
    var busyLine = buildPathFromHistory(diskBusyHistory, 0, 100, 120);
    var busyArea = buildAreaPathFromHistory(diskBusyHistory, 0, 100, 120);
    setPath('pathDiskBusyArea', busyArea);
    setPath('pathDiskBusyLine', busyLine);
}

function setPath(id, d) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('d', d);
}

// ============================================
// UI Updates
// ============================================
function updateCPU(metrics) {
    var val = metrics ? metrics.cpu : 0;
    var temp = metrics ? metrics.cpuTemp : 0;
    
    var cpuVal = document.getElementById('cpuMetricVal');
    if (cpuVal) cpuVal.innerHTML = formatNumber(val) + '<span class="metric-unit">%</span>';
    
    var cpuTempEl = document.getElementById('cpuTempVal');
    if (cpuTempEl) cpuTempEl.innerHTML = Math.round(temp) + '<span class="metric-unit">\u00B0C</span>';
    
    // Update chart stats
    var cpuPeak = cpuHistory.length > 0 ? Math.max.apply(Math, cpuHistory) : 0;
    var cpuAvg = cpuHistory.length > 0 ? (cpuHistory.reduce(function(a,b){return a+b;},0) / cpuHistory.length) : 0;
    var statEls = document.querySelectorAll('#cpuRow .stat-value');
    if (statEls[0]) statEls[0].textContent = formatNumber(cpuPeak) + '%';
    if (statEls[1]) statEls[1].textContent = formatNumber(cpuAvg) + '%';
}

function updateMemory(metrics) {
    var usage = metrics ? metrics.memPct : fallbackData.mem.usage;
    // Beszel returns memTotal (m) and memUsed (mu) in GB already
    var usedGB = metrics ? metrics.memUsed : fallbackData.mem.used;
    var totalGB = metrics ? metrics.memTotal : fallbackData.mem.total;
    var availGB = metrics ? (metrics.memTotal - metrics.memUsed) : fallbackData.mem.avail;
    var swapUsed = metrics ? (metrics.swapUsed || 0) : fallbackData.mem.swapUsed;
    var swapTotal = metrics ? (metrics.swapTotal || 0) : fallbackData.mem.swapTotal;
    
    var memUsageEl = document.getElementById('memUsageVal');
    if (memUsageEl) memUsageEl.innerHTML = formatNumber(usedGB) + '<span class="metric-unit">GB</span>';
    
    var memAvailEl = document.getElementById('memAvailVal');
    if (memAvailEl) memAvailEl.innerHTML = formatNumber(totalGB) + '<span class="metric-unit">GB</span>';
    
    var memUsedEl = document.getElementById('memUsedVal');
    if (memUsedEl) memUsedEl.innerHTML = formatNumber(usedGB) + ' GB';
    
    // Update swap
    var swapEl = document.getElementById('memSwapVal');
    if (swapEl) swapEl.innerHTML = formatNumber(swapUsed) + ' GB / ' + formatNumber(swapTotal) + ' GB';
    
    // Update chart stats (keep percentage on right chart)
    var memPeak = memUsageHistory.length > 0 ? Math.max.apply(Math, memUsageHistory) : 0;
    var memAvg = memUsageHistory.length > 0 ? (memUsageHistory.reduce(function(a,b){return a+b;},0) / memUsageHistory.length) : 0;
    var statEls = document.querySelectorAll('#memRow .stat-value');
    if (statEls[0]) statEls[0].textContent = formatNumber(memPeak) + '%';
    if (statEls[1]) statEls[1].textContent = formatNumber(memAvg) + '%';
}

function updateGPU(metrics) {
    var gpuLoad = metrics ? metrics.gpuLoad : fallbackData.gpu.load;
    var gpuVram = metrics ? metrics.gpuVram : fallbackData.gpu.vram;
    // Use known VRAM total (8GB for RX 580) instead of Beszel's potentially incorrect value
    var gpuVramTotal = fallbackData.gpu.vramTotal;
    var gpuTemp = metrics ? metrics.gpuTemp : fallbackData.gpu.temp;
    
    var gpuLoadEl = document.getElementById('gpuLoadVal');
    if (gpuLoadEl) gpuLoadEl.innerHTML = formatNumber(gpuLoad) + '<span class="metric-unit">%</span>';
    
    var gpuVramEl = document.getElementById('gpuVramVal');
    if (gpuVramEl) gpuVramEl.innerHTML = formatNumber(gpuVram) + '<span class="metric-unit">/' + gpuVramTotal + 'G</span>';
    
    var gpuTempEl = document.getElementById('gpuTempVal');
    if (gpuTempEl) gpuTempEl.innerHTML = Math.round(gpuTemp) + '<span class="metric-unit">\u00B0C</span>';
    
    // Update chart stats
    var gpuPeak = gpuLoadHistory.length > 0 ? Math.max.apply(Math, gpuLoadHistory) : 0;
    var gpuAvg = gpuLoadHistory.length > 0 ? (gpuLoadHistory.reduce(function(a,b){return a+b;},0) / gpuLoadHistory.length) : 0;
    var statEls = document.querySelectorAll('#gpuRow .stat-value');
    if (statEls[0]) statEls[0].textContent = formatNumber(gpuPeak) + '%';
    if (statEls[1]) statEls[1].textContent = formatNumber(gpuAvg) + '%';
}

function updateNVMe(metrics) {
    var readMB = metrics ? metrics.diskReadPs : fallbackData.nvme.read;
    var writeMB = metrics ? metrics.diskWritePs : fallbackData.nvme.write;
    var diskPct = metrics ? metrics.diskPct : fallbackData.nvme.iops;
    // Beszel returns disk in GB (d=total GB, du=used GB)
    var diskUsed = metrics ? metrics.diskUsed : 0;
    var diskTotal = metrics ? metrics.diskTotal : 0;
    
    // Update disk ring chart (only used portion, no free ring)
    var ringUsed = document.getElementById('diskRingUsed');
    var ringTextUsed = document.getElementById('diskRingTextUsed');
    var ringTextTotal = document.getElementById('diskRingTextTotal');
    var ringTextPct = document.getElementById('diskRingTextPct');
    
    if (ringUsed && metrics) {
        var circumference = 2 * Math.PI * 58; // 364.42
        var usedOffset = circumference * (1 - diskPct / 100);
        ringUsed.style.strokeDashoffset = usedOffset;
        if (ringTextUsed) ringTextUsed.textContent = formatNumber(diskUsed) + ' GB';
        if (ringTextTotal) ringTextTotal.textContent = '/ ' + formatNumber(diskTotal) + ' GB';
        if (ringTextPct) ringTextPct.textContent = diskPct.toFixed(1) + '%';
    }
    
    // Update header status
    var diskUsageEl = document.querySelector('#storageRow .row-status');
    if (diskUsageEl && metrics) diskUsageEl.textContent = diskPct.toFixed(1) + '% USED';
    
    // Update chart stats - Disk Busy %
    var busyPeak = diskBusyHistory.length > 0 ? Math.max.apply(Math, diskBusyHistory) : 0;
    var busyAvg = diskBusyHistory.length > 0 ? (diskBusyHistory.reduce(function(a,b){return a+b;},0) / diskBusyHistory.length) : 0;
    var statEls = document.querySelectorAll('#storageRow .stat-value');
    if (statEls[0]) statEls[0].textContent = formatNumber(busyPeak) + '%';
    if (statEls[1]) statEls[1].textContent = formatNumber(busyAvg) + '%';
}

function updateSystemInfo(metrics) {
    if (!metrics) return;
    
    // Update load average
    var loadEls = document.querySelectorAll('.detail-value');
    // Could update load avg, network interfaces, etc.
}

function updateHardwareNames(metrics) {
    if (!metrics) return;
    
    // GPU name from Beszel
    var gpuNameEl = document.getElementById('gpuName');
    if (gpuNameEl && metrics.gpuName) {
        gpuNameEl.textContent = metrics.gpuName;
    }
    
    // GPU subtitle with VRAM total
    var gpuSubtitleEl = document.getElementById('gpuSubtitle');
    if (gpuSubtitleEl && metrics.gpuVramTotal) {
        gpuSubtitleEl.textContent = 'VRAM Total: ' + metrics.gpuVramTotal.toFixed(1) + ' GB';
    }
    
    // CPU name - generic since Beszel doesn't provide model in stats
    var cpuNameEl = document.getElementById('cpuName');
    if (cpuNameEl) {
        cpuNameEl.textContent = 'Processador Desconhecido';
    }
    
    // CPU subtitle
    var cpuCoreVal = document.getElementById('cpuCoresVal');
    if (cpuCoreVal) {
        cpuCoreVal.textContent = metrics.cpuBreakdown ? metrics.cpuBreakdown.length + 1 : '?';
    }
    
    // Memory subtitle
    var memSubtitleEl = document.getElementById('memSubtitle');
    if (memSubtitleEl && metrics.memTotal) {
        memSubtitleEl.textContent = 'Total: ' + metrics.memTotal.toFixed(1) + ' GB';
    }
    
    // Disk name
    var diskNameEl = document.getElementById('diskName');
    if (diskNameEl && metrics.diskTotal) {
        diskNameEl.textContent = metrics.diskTotal.toFixed(1) + ' GB';
    }
    
    // Disk subtitle
    var diskSubtitleEl = document.getElementById('diskSubtitle');
    if (diskSubtitleEl && metrics.diskTotal && metrics.diskUsed) {
        diskSubtitleEl.textContent = metrics.diskUsed.toFixed(1) + ' GB / ' + metrics.diskTotal.toFixed(1) + ' GB';
    }
}

function updateContainers() {
    xhrGet(BESZEL_API_BASE + '/api/collections/containers/records?perPage=50', function(data) {
        var tbody = document.getElementById('dockerTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!data || !data.items || data.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#958ea0;padding:20px;">Nenhum container encontrado</td></tr>';
            return;
        }
        
        for (var i = 0; i < data.items.length; i++) {
            var c = data.items[i];
            var row = document.createElement('tr');
            
            // Health class
            var healthClass = 'health-unknown';
            var healthText = 'Desconhecido';
            if (c.health === 2) { healthClass = 'health-healthy'; healthText = 'Saudável'; }
            else if (c.health === 1) { healthClass = 'health-unhealthy'; healthText = 'Não saudável'; }
            else if (c.health === 0) { healthClass = 'health-unknown'; healthText = 'Sem check'; }
            
            // Format memory (MB to GB)
            var memGB = (c.memory / 1024).toFixed(2);
            
            // Format network (bytes to KB/MB)
            var netStr = formatNet(c.net);
            
            // Format timestamp
            var updatedStr = formatTimestamp(c.updated);
            
            row.innerHTML = 
                '<td class="name">' + escapeHtml(c.name) + '</td>' +
                '<td>' + escapeHtml(c.system || '-') + '</td>' +
                '<td class="cpu">' + formatNumber(c.cpu || 0) + '%</td>' +
                '<td class="memory">' + memGB + ' GB</td>' +
                '<td class="net">' + netStr + '</td>' +
                '<td class="health ' + healthClass + '">' + healthText + '</td>' +
                '<td class="ports">' + escapeHtml(c.ports || '-') + '</td>' +
                '<td class="image" title="' + escapeHtml(c.image) + '">' + escapeHtml(c.image) + '</td>' +
                '<td class="status">' + escapeHtml(c.status || '-') + '</td>' +
                '<td class="updated">' + updatedStr + '</td>';
            
            tbody.appendChild(row);
        }
    }, function(err) {
        console.error('Failed to fetch containers:', err);
        var tbody = document.getElementById('dockerTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#ef4444;padding:20px;">Erro ao carregar containers</td></tr>';
    });
}

// Helper functions
function formatNet(bytes) {
    if (!bytes || bytes === 0) return '0 B/s';
    if (bytes < 1024) return bytes + ' B/s';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB/s';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB/s';
}

function formatTimestamp(ts) {
    if (!ts) return '-';
    var date = new Date(ts);
    if (isNaN(date.getTime())) return '-';
    var now = new Date();
    var diffMs = now - date;
    var diffSec = Math.floor(diffMs / 1000);
    var diffMin = Math.floor(diffSec / 60);
    var diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) return 'agora';
    if (diffMin < 60) return 'h\u00E1 ' + diffMin + 'min';
    if (diffHour < 24) return 'h\u00E1 ' + diffHour + 'h';
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateUI(metrics) {
    if (!metrics) {
        console.log('updateUI called with null metrics, using fallback');
        updateCPU(null);
        updateGPU(null);
        updateNVMe(null);
        updateMemory(null);
        return;
    }
    
    console.log('updateUI called with metrics:', {
        cpu: metrics.cpu,
        cpuTemp: metrics.cpuTemp,
        gpuLoad: metrics.gpuLoad,
        gpuVram: metrics.gpuVram,
        gpuVramTotal: metrics.gpuVramTotal,
        gpuTemp: metrics.gpuTemp,
        diskReadPs: metrics.diskReadPs,
        diskWritePs: metrics.diskWritePs
    });
    
    // Atualizar históricos
    updateHistories(metrics);
    
    // Atualizar UI
    updateCPU(metrics);
    updateGPU(metrics);
    updateNVMe(metrics);
    updateMemory(metrics);
    updateSystemInfo(metrics);
    updateHardwareNames(metrics);
}

function updateLatency() {
    var latency = (3.8 + Math.random() * 0.9).toFixed(1);
    var el = document.getElementById('latencyVal');
    if (el) el.textContent = latency + 'ms';
}

function toggleStream() {
    isStreaming = !isStreaming;
    var btn = document.getElementById('streamToggle');
    var txt = document.getElementById('streamText');
    var icon = document.querySelector('.toggle-icon');
    if (txt) txt.textContent = isStreaming ? 'Pausar' : 'Retomar';
    if (icon) icon.textContent = isStreaming ? 'pause_circle' : 'play_circle';
    if (btn) {
        if (!isStreaming) btn.className += ' text-amber-300';
        else btn.className = btn.className.replace(' text-amber-300', '');
    }
}

// ============================================
// Polling
// ============================================
function pollMetrics() {
    if (!currentSystemId) {
        fetchSystems(
            function(system) {
                currentSystemId = system.id;
                console.log('System found:', system.name || system.host || system.id);
                doPoll();
            },
            function(err) {
                console.log('Using fallback data:', err);
                updateUI(null);
                updateContainers();
            }
        );
        return;
    }
    doPoll();
}

function doPoll() {
    fetchLatestStats(
        currentSystemId,
        function(stats, created) {
            var metrics = parseMetrics(stats);
            if (metrics) updateUI(metrics);
            updateContainers();
        },
        function(err) {
            console.log('Poll error, using fallback:', err);
            updateUI(null);
            updateContainers();
        }
    );
}

function startPolling(intervalMs) {
    if (pollingInterval) clearInterval(pollingInterval);
    pollMetrics();
    pollingInterval = setInterval(pollMetrics, intervalMs || POLL_INTERVAL_MS);
    
    // Chart animation interval
    if (chartInterval) clearInterval(chartInterval);
    chartInterval = setInterval(function() {
        animateCharts();
        updateLatency();
    }, 1000);
}

// ============================================
// Init
// ============================================
function init() {
    // Stream toggle
    var toggleBtn = document.getElementById('streamToggle');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleStream);
    
    // Window buttons
    var winBtns = document.querySelectorAll('.win-btn');
    for (var i = 0; i < winBtns.length; i++) {
        winBtns[i].addEventListener('click', function() {
            var btns = document.querySelectorAll('.win-btn');
            for (var j = 0; j < btns.length; j++) btns[j].className = btns[j].className.replace(' active', '');
            this.className += ' active';
        });
    }
    
    // Initial renders
    updateContainers();
    animateCharts();
    
    // Fetch config from local server, then start polling
    fetchClientConfig(
        function() {
            console.log('Config loaded:', BESZEL_API_BASE);
            startPolling(POLL_INTERVAL_MS);
        },
        function(err) {
            console.log('Config fetch failed, using fallback:', err);
            startPolling(POLL_INTERVAL_MS);
        }
    );
}

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Global debug
window.ServerMonitor = {
    start: startPolling,
    toggle: toggleStream,
    config: {
        setBaseUrl: function(u) { BESZEL_API_BASE = u; },
        setToken: function(t) { BESZEL_API_TOKEN = t; }
    }
};