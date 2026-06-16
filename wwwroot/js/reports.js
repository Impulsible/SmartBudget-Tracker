// ============================================
// SMARTBUDGET REPORTS PAGE
// ============================================
console.log('Reports JS: Loaded');

var reportTrendChart = null;
var reportExpenseChart = null;
var reportSavingsChart = null;
var currentPeriod = 'month';

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
// FETCH TRANSACTIONS
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
            return data.transactions;
        }
        return getDemoTransactions();
    } catch (e) {
        console.error('Error fetching transactions:', e);
        return getDemoTransactions();
    }
}

function getDemoTransactions() {
    var now = new Date();
    var transactions = [];
    
    // Generate demo transactions for the last 3 months
    for (var i = 0; i < 30; i++) {
        var date = new Date();
        date.setDate(date.getDate() - i);
        var isIncome = Math.random() > 0.6;
        transactions.push({
            id: i,
            title: isIncome ? 'Income ' + (i + 1) : 'Expense ' + (i + 1),
            amount: Math.floor(Math.random() * 50000) + 1000,
            type: isIncome ? 'income' : 'expense',
            date: date,
            category: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'][Math.floor(Math.random() * 5)]
        });
    }
    return transactions;
}

// ============================================
// LOAD REPORT DATA
// ============================================
async function loadReportData() {
    var periodSelect = document.querySelector('.report-period.active');
    if (periodSelect) {
        currentPeriod = periodSelect.getAttribute('data-period') || 'month';
    }
    
    var transactions = await fetchReportTransactions(currentPeriod);
    
    // Calculate stats - Check if elements exist before setting
    var totalIncome = transactions.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    var totalExpenses = transactions.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    var netSavings = totalIncome - totalExpenses;
    
    var rptIncome = document.getElementById('rptIncome');
    var rptExpenses = document.getElementById('rptExpenses');
    var rptSavings = document.getElementById('rptSavings');
    var rptCount = document.getElementById('rptCount');
    
    if (rptIncome) rptIncome.textContent = '₦' + totalIncome.toLocaleString();
    if (rptExpenses) rptExpenses.textContent = '₦' + totalExpenses.toLocaleString();
    if (rptSavings) rptSavings.textContent = '₦' + netSavings.toLocaleString();
    if (rptCount) rptCount.textContent = transactions.length;
    
    // Update date display
    var reportDate = document.getElementById('reportDate');
    if (reportDate) {
        var now = new Date();
        if (currentPeriod === 'month') {
            reportDate.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (currentPeriod === 'quarter') {
            var quarter = Math.floor(now.getMonth() / 3) + 1;
            reportDate.textContent = 'Q' + quarter + ' ' + now.getFullYear();
        } else if (currentPeriod === 'year') {
            reportDate.textContent = now.getFullYear().toString();
        } else {
            reportDate.textContent = 'All Time';
        }
    }
    
    updateTrendChart(transactions);
    updateExpenseChart(transactions);
    updateSavingsChart(transactions);
    updateTopCategories(transactions);
}

function updateTrendChart(transactions) {
    var ctx = document.getElementById('reportTrendChart');
    if (!ctx) return;
    
    if (reportTrendChart) reportTrendChart.destroy();
    
    // Group by date (weekly or monthly based on period)
    var grouped = {};
    var now = new Date();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    transactions.forEach(function(t) {
        var date = new Date(t.date);
        var key;
        if (currentPeriod === 'month') {
            var weekNum = Math.ceil(date.getDate() / 7);
            key = 'Week ' + weekNum;
        } else if (currentPeriod === 'quarter') {
            key = months[date.getMonth()];
        } else if (currentPeriod === 'year') {
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
                { label: 'Income', data: incomeData, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2, fill: true, tension: 0.4 },
                { label: 'Expenses', data: expenseData, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 2, fill: true, tension: 0.4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: '#94A3B8', usePointStyle: true } },
                tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ₦' + c.parsed.y.toLocaleString(); } } }
            },
            scales: {
                x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(148,163,184,0.06)' } },
                y: { ticks: { color: '#64748B', callback: function(v) { return '₦' + v.toLocaleString(); } }, grid: { color: 'rgba(148,163,184,0.06)' } }
            }
        }
    });
}

function updateExpenseChart(transactions) {
    var ctx = document.getElementById('reportExpenseChart');
    if (!ctx) return;
    
    if (reportExpenseChart) reportExpenseChart.destroy();
    
    var expenses = transactions.filter(function(t) { return t.type === 'expense'; });
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
            datasets: [{ data: amounts, backgroundColor: colors.slice(0, categories.length), borderWidth: 2, borderColor: '#1E293B' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94A3B8', usePointStyle: true, font: { size: 11 } } },
                tooltip: { callbacks: { label: function(c) { return c.label + ': ₦' + c.parsed.toLocaleString(); } } }
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
    
    reportSavingsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Savings', 'Spent'],
            datasets: [{ data: [savings, spent], backgroundColor: ['#10B981', 'rgba(239,68,68,0.3)'], borderWidth: 2, borderColor: '#1E293B' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                tooltip: { callbacks: { label: function(c) { return c.label + ': ₦' + c.parsed.toLocaleString(); } } }
            }
        }
    });
    
    // Add center text
    Chart.register({
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
    });
}

function updateTopCategories(transactions) {
    var container = document.getElementById('topCategories');
    if (!container) return;
    
    var expenses = transactions.filter(function(t) { return t.type === 'expense'; });
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
        return '<div class="top-cat-item">' +
            '<div class="top-cat-rank" style="background:' + colors[index % colors.length] + '">' + (index + 1) + '</div>' +
            '<div class="top-cat-info">' +
                '<div class="top-cat-name">' + cat.name + '</div>' +
                '<div class="top-cat-amount">₦' + cat.amount.toLocaleString() + '</div>' +
            '</div>' +
            '<div class="top-cat-bar"><div class="top-cat-fill" style="width:' + cat.percent + '%;background:' + colors[index % colors.length] + '"></div></div>' +
            '<div class="top-cat-percent">' + cat.percent.toFixed(0) + '%</div>' +
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
    
    loadReportData();
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reports page initializing...');
    setupReportsSidebar();
    
    setTimeout(function() {
        loadReportData();
    }, 200);
    
    console.log('Reports page initialized');
});

// Make functions global
window.changeReportPeriod = changeReportPeriod;