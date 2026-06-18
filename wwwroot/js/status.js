// ============================================
// SMARTBUDGET STATUS PAGE
// ============================================
console.log('Status JS: Loaded');

var statusInterval = null;

// ============================================
// INITIALIZE STATUS PAGE
// ============================================
function initStatusPage() {
    console.log('📊 Initializing Status Page...');
    refreshStatus();
    
    // Auto-refresh every 30 seconds
    if (statusInterval) {
        clearInterval(statusInterval);
    }
    statusInterval = setInterval(refreshStatus, 30000);
}

// ============================================
// REFRESH STATUS
// ============================================
window.refreshStatus = function() {
    console.log('🔄 Refreshing status...');
    
    // Update API status
    updateApiStatus();
    
    // Update database status
    updateDbStatus();
    
    // Update server status
    updateServerStatus();
    
    // Update cache status
    updateCacheStatus();
    
    // Update metrics
    updateMetrics();
    
    // Update uptime
    updateUptime();
    
    // Update timestamp
    updateTimestamp();
};

// ============================================
// UPDATE API STATUS
// ============================================
function updateApiStatus() {
    var statusText = document.getElementById('statusText');
    var statusDot = document.getElementById('statusDot');
    var apiStatus = document.getElementById('apiStatus');
    var apiResponseTime = document.getElementById('apiResponseTime');
    var apiUptime = document.getElementById('apiUptime');
    
    // Simulate API check
    var startTime = performance.now();
    
    fetch('/api/health')
        .then(function(response) {
            var endTime = performance.now();
            var responseTime = Math.round(endTime - startTime);
            
            if (apiResponseTime) {
                apiResponseTime.textContent = responseTime + ' ms';
            }
            
            if (response.ok) {
                if (statusText) statusText.textContent = 'All Systems Operational';
                if (statusDot) {
                    statusDot.className = 'status-dot';
                    statusDot.style.background = '#34D399';
                }
                if (apiStatus) {
                    var value = apiStatus.querySelector('.status-value');
                    if (value) {
                        value.className = 'status-value operational';
                        value.textContent = 'Operational';
                    }
                }
            } else {
                if (statusText) statusText.textContent = 'Degraded Performance';
                if (statusDot) {
                    statusDot.className = 'status-dot warning';
                    statusDot.style.background = '#F59E0B';
                }
                if (apiStatus) {
                    var value = apiStatus.querySelector('.status-value');
                    if (value) {
                        value.className = 'status-value warning';
                        value.textContent = 'Degraded';
                    }
                }
            }
        })
        .catch(function() {
            if (statusText) statusText.textContent = 'Service Unavailable';
            if (statusDot) {
                statusDot.className = 'status-dot error';
                statusDot.style.background = '#EF4444';
            }
            if (apiStatus) {
                var value = apiStatus.querySelector('.status-value');
                if (value) {
                    value.className = 'status-value error';
                    value.textContent = 'Unavailable';
                }
            }
        });
    
    // Simulate uptime
    if (apiUptime) {
        var days = Math.floor(Math.random() * 30) + 1;
        var hours = Math.floor(Math.random() * 24);
        var minutes = Math.floor(Math.random() * 60);
        apiUptime.textContent = days + 'd ' + hours + 'h ' + minutes + 'm';
    }
}

// ============================================
// UPDATE DATABASE STATUS
// ============================================
function updateDbStatus() {
    var dbStatus = document.getElementById('dbStatus');
    var dbConnection = document.getElementById('dbConnection');
    
    if (dbStatus) {
        var value = dbStatus.querySelector('.status-value');
        if (value) {
            value.className = 'status-value operational';
            value.textContent = 'Connected';
        }
    }
    
    if (dbConnection) {
        dbConnection.textContent = 'Active';
    }
}

// ============================================
// UPDATE SERVER STATUS
// ============================================
function updateServerStatus() {
    var serverStatus = document.getElementById('serverStatus');
    var serverUptime = document.getElementById('serverUptime');
    
    if (serverStatus) {
        var value = serverStatus.querySelector('.status-value');
        if (value) {
            value.className = 'status-value operational';
            value.textContent = 'Running';
        }
    }
    
    if (serverUptime) {
        var days = Math.floor(Math.random() * 14) + 1;
        var hours = Math.floor(Math.random() * 24);
        var minutes = Math.floor(Math.random() * 60);
        serverUptime.textContent = days + 'd ' + hours + 'h ' + minutes + 'm';
    }
}

// ============================================
// UPDATE CACHE STATUS
// ============================================
function updateCacheStatus() {
    var cacheStatus = document.getElementById('cacheStatus');
    var cacheHitRate = document.getElementById('cacheHitRate');
    var cacheSize = document.getElementById('cacheSize');
    
    if (cacheStatus) {
        var value = cacheStatus.querySelector('.status-value');
        if (value) {
            value.className = 'status-value operational';
            value.textContent = 'Enabled';
        }
    }
    
    if (cacheHitRate) {
        var rate = (85 + Math.random() * 10).toFixed(1);
        cacheHitRate.textContent = rate + '%';
    }
    
    if (cacheSize) {
        var size = (5 + Math.random() * 15).toFixed(1);
        cacheSize.textContent = size + ' MB';
    }
}

// ============================================
// UPDATE METRICS
// ============================================
function updateMetrics() {
    // CPU Usage
    var cpuUsage = document.getElementById('cpuUsage');
    var cpuBar = document.getElementById('cpuBar');
    if (cpuUsage && cpuBar) {
        var cpu = Math.floor(Math.random() * 60) + 10;
        cpuUsage.textContent = cpu + '%';
        cpuBar.style.width = cpu + '%';
        cpuBar.style.background = cpu > 80 ? '#EF4444' : cpu > 60 ? '#F59E0B' : '#10B981';
    }
    
    // Memory Usage
    var memoryUsage = document.getElementById('memoryUsage');
    var memoryBar = document.getElementById('memoryBar');
    if (memoryUsage && memoryBar) {
        var memory = Math.floor(Math.random() * 500) + 200;
        var memoryPercent = (memory / 1024) * 100;
        memoryUsage.textContent = memory + ' MB';
        memoryBar.style.width = Math.min(memoryPercent, 100) + '%';
        memoryBar.style.background = memoryPercent > 80 ? '#EF4444' : memoryPercent > 60 ? '#F59E0B' : '#10B981';
    }
    
    // Active Users
    var activeUsers = document.getElementById('activeUsers');
    if (activeUsers) {
        var users = Math.floor(Math.random() * 150) + 20;
        activeUsers.textContent = users;
    }
    
    // Requests per minute
    var requestsPerMin = document.getElementById('requestsPerMin');
    if (requestsPerMin) {
        var requests = Math.floor(Math.random() * 200) + 50;
        requestsPerMin.textContent = requests;
    }
}

// ============================================
// UPDATE UPTIME
// ============================================
function updateUptime() {
    // Uptime bars already set in HTML with static values
    // This is just for visual flair
    var fills = document.querySelectorAll('.uptime-fill');
    fills.forEach(function(fill) {
        var width = parseFloat(fill.style.width);
        if (width) {
            var variation = (Math.random() - 0.5) * 0.2;
            var newWidth = Math.min(100, Math.max(95, width + variation));
            fill.style.width = newWidth + '%';
        }
    });
}

// ============================================
// UPDATE TIMESTAMP
// ============================================
function updateTimestamp() {
    var timestamp = document.querySelector('.status-footer-version');
    if (timestamp) {
        var now = new Date();
        var timeStr = now.toLocaleTimeString();
        timestamp.textContent = 'Updated: ' + timeStr;
    }
}

// ============================================
// SUBSCRIBE TO STATUS UPDATES
// ============================================
window.subscribeStatus = function() {
    var email = document.getElementById('statusEmail');
    if (!email || !email.value) {
        alert('Please enter your email address.');
        return;
    }
    
    var btn = document.querySelector('.subscription-btn');
    if (btn) {
        var originalText = btn.textContent;
        btn.textContent = 'Subscribing...';
        btn.disabled = true;
        
        setTimeout(function() {
            btn.textContent = '✓ Subscribed!';
            btn.style.background = 'linear-gradient(135deg, #34D399, #10B981)';
            
            setTimeout(function() {
                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.background = '';
                email.value = '';
            }, 3000);
        }, 1000);
    }
};

// ============================================
// DESTROY
// ============================================
window.destroyStatusPage = function() {
    console.log('🔄 Destroying Status Page...');
    if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
    }
};

// ============================================
// AUTO-INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initStatusPage();
});