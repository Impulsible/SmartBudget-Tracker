// ============================================
// SMARTBUDGET REPORTS PAGE - Auto-updating Charts
// ============================================
console.log('Reports JS: Loaded');

var reportTrendChart = null;
var reportExpenseChart = null;
var reportSavingsChart = null;
var currentPeriod = 'month';
var refreshInterval = null;
var allTransactions = [];

// ============================================
// SIDEBAR SETUP
// ============================================
function setupReportsSidebar() {
    var toggleBtn = document.getElementById('sidebarToggleBtn');
    var closeBtn = document.getElementById('sidebarCloseBtn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');

    if (!toggleBtn || !sidebar || !overlay) return;

    toggleBtn.onclick = function() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    if (closeBtn) {
        closeBtn.onclick = function() {
            closeReportsSidebar();
        };
    }

    overlay.onclick = function() {
        closeReportsSidebar();
    };
}

function closeReportsSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================
// FETCH TRANSACTIONS WITH AUTO-REFRESH
// ============================================
async function fetchReportTransactions(period) {
    try {
        var response = await fetch('/api/reports/transactions?period=' + period);
        if (!response.ok) {
            console.log('Reports API not available, using demo data');
            return getDemoTransactions();
        }
        var data = await response.json();
        if (data.success && data.transactions) {
            allTransactions = data.transactions;
            return allTransactions;
        }
        return getDemoTransactions();
    } catch (e) {
        console.error('Error fetching transactions:', e);
        return getDemoTransactions();
    }
}

function getDemoTransactions() {
    var transactions = [];
    var now = new Date();
    var categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Other'];
    
    // Generate realistic demo data
    for (var i = 0; i < 30; i++) {
        var date = new Date();
        date.setDate(date.getDate() - i);
        var isIncome = Math.random() > 0.65;
        var amount = isIncome ? 
            Math.floor(Math.random() * 100000) + 20000 : 
            Math.floor(Math.random() * 30000) + 1000;
        transactions.push({
            id: i + 1,
            title: isIncome ? 'Income ' + (i + 1) : 'Expense ' + (i + 1),
            amount: amount,
            type: isIncome ? 'income' : 'expense',
            date: date,
            category: categories[Math.floor(Math.random() * categories.length)]
        });
    }
    return transactions;
}

// ============================================
// AUTO-REFRESH SETUP
// ============================================
function startAutoRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Refresh every 60 seconds
    refreshInterval = setInterval(function() {
        console.log('Reports: Auto-refreshing data...');
        loadReportData();
    }, 60000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ============================================
// LOAD REPORT DATA
// ============================================
async function loadReportData() {
    var periodSelect = document.querySelector('.report-period.active');
    if (periodSelect) {
        var period = periodSelect.getAttribute('data-period');
        if (period) currentPeriod = period;
    }
    
    console.log('Reports: Loading data for period:', currentPeriod);
    
    var transactions = await fetchReportTransactions(currentPeriod);
    
    if (!transactions || transactions.length === 0) {
        console.log('Reports: No transactions found');
        setEmptyState();
        return;
    }
    
    // Calculate stats
    var totalIncome = transactions.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    var totalExpenses = transactions.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    var netSavings = totalIncome - totalExpenses;
    
    // Update stat cards with animation
    animateStatValue('rptIncome', '₦' + totalIncome.toLocaleString());
    animateStatValue('rptExpenses', '₦' + totalExpenses.toLocaleString());
    animateStatValue('rptSavings', '₦' + netSavings.toLocaleString());
    animateStatValue('rptCount', transactions.length.toString());
    
    // Update date display
    var reportDate = document.getElementById('reportDate');
    if (reportDate) {
        var now = new Date();
        var dateText = '';
        if (currentPeriod === 'month') {
            dateText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (currentPeriod === 'quarter') {
            var quarter = Math.floor(now.getMonth() / 3) + 1;
            dateText = 'Q' + quarter + ' ' + now.getFullYear();
        } else if (currentPeriod === 'year') {
            dateText = now.getFullYear().toString();
        } else {
            dateText = 'All Time';
        }
        reportDate.textContent = dateText;
    }
    
    // Update charts
    updateTrendChart(transactions);
    updateExpenseChart(transactions);
    updateSavingsChart(transactions);
    updateTopCategories(transactions);
}

function setEmptyState() {
    var rptIncome = document.getElementById('rptIncome');
    var rptExpenses = document.getElementById('rptExpenses');
    var rptSavings = document.getElementById('rptSavings');
    var rptCount = document.getElementById('rptCount');
    
    if (rptIncome) rptIncome.textContent = '₦0';
    if (rptExpenses) rptExpenses.textContent = '₦0';
    if (rptSavings) rptSavings.textContent = '₦0';
    if (rptCount) rptCount.textContent = '0';
    
    // Show empty state in charts
    var ctx1 = document.getElementById('reportTrendChart');
    var ctx2 = document.getElementById('reportExpenseChart');
    var ctx3 = document.getElementById('reportSavingsChart');
    
    if (ctx1) {
        if (reportTrendChart) reportTrendChart.destroy();
        reportTrendChart = new Chart(ctx1, {
            type: 'line',
            data: { labels: ['No Data'], datasets: [{ label: 'Income', data: [0], borderColor: '#10B981' }, { label: 'Expenses', data: [0], borderColor: '#EF4444' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94A3B8' } } } }
        });
    }
    
    var container = document.getElementById('topCategories');
    if (container) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748B;">No expense data available</div>';
    }
}

function animateStatValue(elementId, newValue) {
    var element = document.getElementById(elementId);
    if (!element) return;
    
    var currentValue = element.textContent;
    if (currentValue === newValue) return;
    
    // Simple fade animation
    element.style.transition = 'opacity 0.3s';
    element.style.opacity = '0';
    
    setTimeout(function() {
        element.textContent = newValue;
        element.style.opacity = '1';
    }, 150);
}

// ============================================
// UPDATE CHARTS
// ============================================
function updateTrendChart(transactions) {
    var ctx = document.getElementById('reportTrendChart');
    if (!ctx) return;
    
    if (reportTrendChart) reportTrendChart.destroy();
    
    // Group by date
    var grouped = {};
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    transactions.forEach(function(t) {
        var date = new Date(t.date);
        var key;
        if (currentPeriod === 'month') {
            var weekNum = Math.ceil(date.getDate() / 7);
            key = 'Week ' + weekNum;
        } else if (currentPeriod === 'quarter' || currentPeriod === 'year') {
            key = months[date.getMonth()];
        } else {
            key = date.getFullYear().toString();
        }
        
        if (!grouped[key]) {
            grouped[key] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            grouped[key].income += t.amount;
        } else {
            grouped[key].expense += t.amount;
        }
    });
    
    var labels = Object.keys(grouped);
    var incomeData = labels.map(function(l) { return grouped[l].income; });
    var expenseData = labels.map(function(l) { return grouped[l].expense; });
    
    reportTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: 'Income', 
                    data: incomeData, 
                    borderColor: '#10B981', 
                    backgroundColor: 'rgba(16,185,129,0.1)', 
                    borderWidth: 2, 
                    fill: true, 
                    tension: 0.4,
                    pointBackgroundColor: '#10B981'
                },
                { 
                    label: 'Expenses', 
                    data: expenseData, 
                    borderColor: '#EF4444', 
                    backgroundColor: 'rgba(239,68,68,0.1)', 
                    borderWidth: 2, 
                    fill: true, 
                    tension: 0.4,
                    pointBackgroundColor: '#EF4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top', 
                    labels: { 
                        color: '#94A3B8', 
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 11 }
                    } 
                },
                tooltip: { 
                    backgroundColor: '#1E293B',
                    titleColor: '#F1F5F9',
                    bodyColor: '#CBD5E1',
                    borderColor: 'rgba(148,163,184,0.2)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: { 
                        label: function(c) { 
                            return c.dataset.label + ': ₦' + c.parsed.y.toLocaleString(); 
                        } 
                    } 
                }
            },
            scales: {
                x: { 
                    ticks: { color: '#64748B' }, 
                    grid: { color: 'rgba(148,163,184,0.06)' } 
                },
                y: { 
                    ticks: { 
                        color: '#64748B', 
                        callback: function(v) { return '₦' + v.toLocaleString(); } 
                    }, 
                    grid: { color: 'rgba(148,163,184,0.06)' },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateExpenseChart(transactions) {
    var ctx = document.getElementById('reportExpenseChart');
    if (!ctx) return;
    
    if (reportExpenseChart) reportExpenseChart.destroy();
    
    var expenses = transactions.filter(function(t) { return t.type === 'expense'; });
    if (expenses.length === 0) {
        reportExpenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#64748B'] }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '60%' }
        });
        return;
    }
    
    var categoryTotals = {};
    expenses.forEach(function(t) {
        var cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });
    
    var categories = Object.keys(categoryTotals);
    var amounts = categories.map(function(c) { return categoryTotals[c]; });
    var colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316', '#14B8A6'];
    
    reportExpenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{ 
                data: amounts, 
                backgroundColor: colors.slice(0, categories.length), 
                borderWidth: 2, 
                borderColor: '#1E293B' 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: '#94A3B8', 
                        usePointStyle: true, 
                        font: { size: 11 },
                        padding: 14
                    } 
                },
                tooltip: { 
                    backgroundColor: '#1E293B',
                    titleColor: '#F1F5F9',
                    bodyColor: '#CBD5E1',
                    borderColor: 'rgba(148,163,184,0.2)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: { 
                        label: function(c) { 
                            var total = c.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                            var pct = total > 0 ? ((c.parsed / total) * 100).toFixed(1) : 0;
                            return c.label + ': ₦' + c.parsed.toLocaleString() + ' (' + pct + '%)';
                        } 
                    } 
                }
            }
        }
    });
}

function updateSavingsChart(transactions) {
    var ctx = document.getElementById('reportSavingsChart');
    if (!ctx) return;
    
    if (reportSavingsChart) reportSavingsChart.destroy();
    
    var totalIncome = transactions.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    var totalExpenses = transactions.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    var savings = Math.max(0, totalIncome - totalExpenses);
    var spent = totalExpenses;
    
    if (totalIncome === 0 && totalExpenses === 0) {
        reportSavingsChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#64748B'] }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        });
        return;
    }
    
    reportSavingsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Savings', 'Spent'],
            datasets: [{ 
                data: [savings, spent], 
                backgroundColor: ['#10B981', 'rgba(239,68,68,0.3)'], 
                borderWidth: 2, 
                borderColor: '#1E293B' 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                tooltip: { 
                    backgroundColor: '#1E293B',
                    titleColor: '#F1F5F9',
                    bodyColor: '#CBD5E1',
                    borderColor: 'rgba(148,163,184,0.2)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: { 
                        label: function(c) { 
                            var total = c.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                            var pct = total > 0 ? ((c.parsed / total) * 100).toFixed(1) : 0;
                            return c.label + ': ₦' + c.parsed.toLocaleString() + ' (' + pct + '%)';
                        } 
                    } 
                }
            }
        },
        plugins: [{
            id: 'savingsCenterText',
            afterDraw: function(chart) {
                if (chart.id !== reportSavingsChart?.id) return;
                var ctx = chart.ctx, w = chart.width, h = chart.height;
                var total = savings + spent;
                var percentage = total > 0 ? ((savings / total) * 100).toFixed(0) : 0;
                ctx.restore();
                ctx.font = 'bold 1.2rem Inter, sans-serif';
                ctx.fillStyle = '#F1F5F9';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(percentage + '%', w / 2, h / 2 - 8);
                ctx.font = '0.7rem Inter, sans-serif';
                ctx.fillStyle = '#94A3B8';
                ctx.fillText('Savings Rate', w / 2, h / 2 + 16);
                ctx.save();
            }
        }]
    });
}

function updateTopCategories(transactions) {
    var container = document.getElementById('topCategories');
    if (!container) return;
    
    var expenses = transactions.filter(function(t) { return t.type === 'expense'; });
    if (expenses.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748B;">No expense data available</div>';
        return;
    }
    
    var categoryTotals = {};
    var totalExpense = 0;
    
    expenses.forEach(function(t) {
        var cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        totalExpense += t.amount;
    });
    
    var sorted = Object.keys(categoryTotals).map(function(c) {
        return { name: c, amount: categoryTotals[c], percent: totalExpense > 0 ? (categoryTotals[c] / totalExpense) * 100 : 0 };
    }).sort(function(a, b) { return b.amount - a.amount; }).slice(0, 5);
    
    var colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    container.innerHTML = sorted.map(function(cat, index) {
        return '<div class="top-cat-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:rgba(255,255,255,0.02);border-radius:10px;margin-bottom:0.5rem;">' +
            '<div class="top-cat-rank" style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:white;background:' + colors[index % colors.length] + ';flex-shrink:0;">' + (index + 1) + '</div>' +
            '<div class="top-cat-info" style="flex:1;">' +
                '<div class="top-cat-name" style="font-size:0.875rem;font-weight:600;color:var(--text-primary);">' + cat.name + '</div>' +
                '<div class="top-cat-amount" style="font-size:0.75rem;color:var(--text-muted);">₦' + cat.amount.toLocaleString() + '</div>' +
            '</div>' +
            '<div class="top-cat-bar" style="width:80px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;flex-shrink:0;">' +
                '<div class="top-cat-fill" style="width:' + cat.percent + '%;height:100%;border-radius:3px;background:' + colors[index % colors.length] + ';"></div>' +
            '</div>' +
            '<div class="top-cat-percent" style="font-size:0.75rem;font-weight:600;color:var(--text-secondary);width:50px;text-align:right;flex-shrink:0;">' + cat.percent.toFixed(0) + '%</div>' +
        '</div>';
    }).join('');
}

// ============================================
// CHANGE PERIOD
// ============================================
window.changeReportPeriod = function(period, element) {
    currentPeriod = period;
    
    var btns = document.querySelectorAll('.report-period');
    btns.forEach(function(btn) {
        btn.classList.remove('active');
    });
    if (element) element.classList.add('active');
    
    // Show loading state
    showToast('Loading ' + period + ' data...', 'info');
    
    // Reload data
    loadReportData();
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) {
        var newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1000;';
        document.body.appendChild(newContainer);
        container = newContainer;
    }
    
    var toast = document.createElement('div');
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + (type === 'success' ? '#10B981' : type === 'info' ? '#3B82F6' : '#EF4444') + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;color:white;';
    toast.innerHTML = '<i class="bi bi-' + (type === 'success' ? 'check-circle-fill' : type === 'info' ? 'info-circle-fill' : 'exclamation-triangle-fill') + '" style="color:' + (type === 'success' ? '#10B981' : type === 'info' ? '#3B82F6' : '#EF4444') + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reports page initializing...');
    setupReportsSidebar();
    
    setTimeout(function() {
        loadReportData();
        startAutoRefresh(); // Start auto-refresh
        console.log('Reports page initialized with auto-refresh');
    }, 200);
    
    console.log('Reports page initialized');
});

// Make functions global
window.changeReportPeriod = changeReportPeriod;
window.loadReportData = loadReportData;
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;