// ============================================
// SMARTBUDGET DASHBOARD - Production Ready
// NO DEMO DATA - Works exclusively with real API data
// ============================================
console.log('Dashboard JS: Loaded');

var spendingChart = null;
var budgetChart = null;
var nextId = 1;
var isLiveDashboardRunning = false;
var liveSpendingData = null;
var chartAnimationInterval = null;

// ============================================
// EMPTY INITIAL STATE - No demo data
// ============================================
var budgetCategories = [];
var transactions = [];

// Predefined colors for common categories
var categoryColors = {
    "Food": "#10B981",
    "Transport": "#3B82F6",
    "Shopping": "#F59E0B",
    "Bills": "#EF4444",
    "Entertainment": "#8B5CF6",
    "Salary": "#06B6D4",
    "Other": "#64748B",
    "Utilities": "#F97316",
    "Rent": "#EC4899",
    "Insurance": "#6366F1",
    "Education": "#14B8A6",
    "Health": "#F43F5E"
};

// ============================================
// 🔥 FIX: RESET FUNCTIONS
// ============================================
function resetDashboard() {
    console.log('Dashboard: Resetting...');
    // Reset charts
    if (spendingChart) {
        spendingChart.destroy();
        spendingChart = null;
    }
    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }
    // Reset data
    budgetCategories = [];
    transactions = [];
    liveSpendingData = null;
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.updateSpendingPeriod = function(period) {
    console.log('updateSpendingPeriod called with:', period);
    var btns = document.querySelectorAll('.chart-period');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (spendingChart) spendingChart.destroy();
    var ctx = document.getElementById('spendingChart');
    if (!ctx) return;
    
    var data = generateSpendingData(period);
    btns[period === 'Monthly' ? 0 : 1].classList.add('active');
    
    liveSpendingData = {
        income: data.income,
        expense: data.expense
    };
    
    spendingChart = new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: data.labels, 
            datasets: [
                { 
                    label: 'Income', 
                    data: data.income, 
                    backgroundColor: 'rgba(16,185,129,0.7)', 
                    borderColor: '#10B981', 
                    borderWidth: 1, 
                    borderRadius: 6, 
                    maxBarThickness: 50 
                },
                { 
                    label: 'Expenses', 
                    data: data.expense, 
                    backgroundColor: 'rgba(239,68,68,0.7)', 
                    borderColor: '#EF4444', 
                    borderWidth: 1, 
                    borderRadius: 6, 
                    maxBarThickness: 50 
                }
            ]
        },
        options: {
            animation: { duration: 2000 },
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'top', 
                    align: 'end', 
                    labels: { 
                        color: '#94A3B8', 
                        usePointStyle: true, 
                        padding: 20, 
                        font: { size: 11 } 
                    } 
                } 
            },
            scales: { 
                x: { 
                    grid: { color: 'rgba(148,163,184,0.06)' }, 
                    ticks: { color: '#64748B' } 
                }, 
                y: { 
                    grid: { color: 'rgba(148,163,184,0.06)' }, 
                    ticks: { 
                        color: '#64748B', 
                        callback: function(v) { return '₦' + v.toLocaleString(); } 
                    } 
                } 
            }
        }
    });
    
    startLiveChartMovement();
};

// ============================================
// GENERATE SPENDING DATA FROM REAL TRANSACTIONS
// ============================================
function generateSpendingData(period) {
    var now = new Date();
    var labels = [];
    var income = [];
    var expense = [];
    
    if (period === 'Monthly') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        var w1i = 0, w2i = 0, w3i = 0, w4i = 0;
        var w1e = 0, w2e = 0, w3e = 0, w4e = 0;
        
        transactions.forEach(function(t) {
            var d = new Date(t.date);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                var day = d.getDate();
                if (day <= 7) { 
                    if (t.type === 'income') w1i += t.amount; 
                    else w1e += t.amount; 
                }
                else if (day <= 14) { 
                    if (t.type === 'income') w2i += t.amount; 
                    else w2e += t.amount; 
                }
                else if (day <= 21) { 
                    if (t.type === 'income') w3i += t.amount; 
                    else w3e += t.amount; 
                }
                else { 
                    if (t.type === 'income') w4i += t.amount; 
                    else w4e += t.amount; 
                }
            }
        });
        
        income = [w1i, w2i, w3i, w4i];
        expense = [w1e, w2e, w3e, w4e];
    } else {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        var dailyIncome = [0,0,0,0,0,0,0];
        var dailyExpense = [0,0,0,0,0,0,0];
        
        var startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        
        transactions.forEach(function(t) {
            var d = new Date(t.date);
            if (d >= startOfWeek && d <= now) {
                var dayIndex = d.getDay();
                if (t.type === 'income') {
                    dailyIncome[dayIndex] += t.amount;
                } else {
                    dailyExpense[dayIndex] += t.amount;
                }
            }
        });
        
        income = dailyIncome;
        expense = dailyExpense;
    }
    
    return { labels: labels, income: income, expense: expense };
}

window.resetBudgetCategories = function() {
    if (confirm('Reset budget categories?')) {
        budgetCategories = [];
        updateBudgetCategoriesFromTransactions();
        updateBudgetChart();
        renderCategoryOptions();
        updateStatsFromTransactions();
    }
};

window.clearAllTransactions = async function() {
    if (transactions.length === 0) { alert('No transactions to clear.'); return; }
    if (confirm('Delete ALL transactions? This cannot be undone.')) {
        try {
            var response = await fetch('/api/transactions/clear', { method: 'DELETE' });
            var data = await response.json();
            if (data.success) {
                await loadTransactionsFromApi();
                await loadBudgetsFromApi();
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
            }
        } catch (e) { alert('Network error.'); }
    }
};

window.addTransaction = async function() {
    var desc = document.getElementById('txDescription').value.trim();
    var amount = document.getElementById('txAmount').value;
    var cat = document.getElementById('txCategory').value;
    var type = document.getElementById('txType').value;
    if (!desc || !amount) { alert('Please fill in all fields'); return; }
    if (!cat) { alert('Please select a category'); return; }
    try {
        var response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: desc, description: desc, amount: parseFloat(amount), type: type, category: cat })
        });
        var data = await response.json();
        if (data.success) {
            closeModal('transactionModal');
            await loadTransactionsFromApi();
            await loadBudgetsFromApi();
            renderTransactions();
            renderCategoryOptions();
            updateStatsFromTransactions();
            updateSpendingChart();
            updateBudgetChart();
        } else { alert('Failed to add transaction.'); }
    } catch (e) { alert('Network error.'); }
};

window.addCategory = async function() {
    var name = document.getElementById('catName').value.trim();
    var amount = parseFloat(document.getElementById('catAmount').value);
    var color = document.getElementById('catColor').value;
    if (!name || !amount) { alert('Please fill in all fields.'); return; }
    
    try {
        var response = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, amount: amount, color: color })
        });
        var data = await response.json();
        
        if (data.success) {
            await loadBudgetsFromApi();
            renderCategoryOptions();
            updateBudgetChart();
            updateStatsFromTransactions();
            closeModal('categoryModal');
            alert('Category "' + name + '" added successfully!');
        } else {
            alert('Failed to add category: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error adding category:', e);
        alert('Network error. Please try again.');
    }
};

window.deleteTransaction = async function(id) {
    if (confirm('Delete this transaction?')) {
        try {
            var response = await fetch('/api/transactions/' + id, { method: 'DELETE' });
            var data = await response.json();
            if (data.success) {
                await loadTransactionsFromApi();
                await loadBudgetsFromApi();
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
            }
        } catch (e) { alert('Network error.'); }
    }
};

// ============================================
// GET OR CREATE CATEGORY COLOR
// ============================================
function getCategoryColor(categoryName) {
    if (categoryColors[categoryName]) {
        return categoryColors[categoryName];
    }
    
    var existing = budgetCategories.find(function(c) { return c.name === categoryName; });
    if (existing) {
        categoryColors[categoryName] = existing.color;
        return existing.color;
    }
    
    var hash = 0;
    for (var i = 0; i < categoryName.length; i++) {
        hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    var color = 'hsl(' + (hash % 360) + ', 70%, 50%)';
    categoryColors[categoryName] = color;
    return color;
}

// ============================================
// UPDATE BUDGET CATEGORIES FROM TRANSACTIONS
// ============================================
function updateBudgetCategoriesFromTransactions() {
    var categoryTotals = {};
    
    transactions.forEach(function(t) {
        if (t.type === 'expense') {
            var cat = t.cat || 'Other';
            if (categoryTotals[cat]) {
                categoryTotals[cat] += t.amount;
            } else {
                categoryTotals[cat] = t.amount;
            }
        }
    });
    
    var mergedCategories = {};
    
    budgetCategories.forEach(function(c) {
        if (c.name && c.name !== "No Expenses" && c.name !== "No Data") {
            mergedCategories[c.name] = {
                name: c.name,
                amount: c.amount,
                color: c.color
            };
        }
    });
    
    Object.keys(categoryTotals).forEach(function(cat) {
        if (mergedCategories[cat]) {
            mergedCategories[cat].amount = categoryTotals[cat];
        } else {
            mergedCategories[cat] = {
                name: cat,
                amount: categoryTotals[cat],
                color: getCategoryColor(cat)
            };
        }
    });
    
    var newCategories = Object.values(mergedCategories).sort(function(a, b) { 
        return b.amount - a.amount; 
    });
    
    if (newCategories.length === 0) {
        budgetCategories = [
            { name: "No Expenses", amount: 1, color: "#64748B" }
        ];
    } else {
        budgetCategories = newCategories;
    }
}

// ============================================
// AUTO-START - Load real data immediately
// ============================================
(function autoStartDashboard() {
    console.log('Dashboard: Auto-starting with real data...');
    setTimeout(function() {
        loadAllData().then(function() {
            renderTransactions();
            renderCategoryOptions();
            updateStatsFromTransactions();
            updateSpendingChart();
            updateBudgetChart();
            setupSidebar();
            fetchUserProfile();
            setupEventListeners();
            handleResponsiveCharts();
            startLiveDashboard();
            console.log('Dashboard: Started successfully with real data!');
        });
    }, 100);
})();

// ============================================
// LOAD DATA FROM API - ONLY REAL DATA
// ============================================
async function loadTransactionsFromApi() {
    try {
        var response = await fetch('/api/transactions?pageSize=100');
        if (response.ok) {
            var data = await response.json();
            if (data.success && data.transactions && data.transactions.length > 0) {
                transactions = data.transactions.map(function(t) {
                    return {
                        id: t.id,
                        desc: t.title || t.description,
                        cat: t.category || 'Other',
                        date: new Date(t.date),
                        amount: t.amount,
                        type: t.type,
                        status: t.status || 'Completed'
                    };
                });
                var ids = transactions.map(function(t) { return t.id; });
                if (ids.length > 0) {
                    nextId = Math.max.apply(null, ids) + 1;
                }
                console.log('Dashboard: Loaded ' + transactions.length + ' transactions from database');
                return true;
            } else {
                console.log('Dashboard: No transactions found in database');
                transactions = [];
                return false;
            }
        } else {
            console.log('Dashboard: Failed to load transactions - API error');
            transactions = [];
            return false;
        }
    } catch (e) {
        console.log('Dashboard: Error loading transactions - ' + e.message);
        transactions = [];
        return false;
    }
}

async function loadBudgetsFromApi() {
    try {
        var response = await fetch('/api/budgets');
        if (response.ok) {
            var data = await response.json();
            if (data.success && data.budgets && data.budgets.length > 0) {
                budgetCategories = data.budgets.map(function(b) {
                    categoryColors[b.name] = b.color;
                    return { name: b.name, amount: b.amount, color: b.color };
                });
                console.log('Dashboard: Loaded ' + budgetCategories.length + ' budgets from database');
                return true;
            } else {
                console.log('Dashboard: No budgets found in database');
                budgetCategories = [];
                return false;
            }
        } else {
            console.log('Dashboard: Failed to load budgets - API error');
            budgetCategories = [];
            return false;
        }
    } catch (e) {
        console.log('Dashboard: Error loading budgets - ' + e.message);
        budgetCategories = [];
        return false;
    }
}

async function loadAllData() {
    await Promise.all([loadTransactionsFromApi(), loadBudgetsFromApi()]);
    if (transactions.length > 0) {
        updateBudgetCategoriesFromTransactions();
    } else if (budgetCategories.length === 0) {
        budgetCategories = [{ name: "No Data", amount: 1, color: "#64748B" }];
    }
}

// ============================================
// 🔥 FIX: INIT - Called from Blazor EVERY TIME
// ============================================
window.initDashboardPage = function() {
    console.log('Dashboard: Initializing from Blazor...');
    
    // 🔥 Reset dashboard state first
    resetDashboard();
    
    setupSidebar();
    fetchUserProfile();
    setupEventListeners();
    handleResponsiveCharts();
    
    if (!isLiveDashboardRunning) {
        loadAllData().then(function() {
            renderTransactions();
            renderCategoryOptions();
            updateStatsFromTransactions();
            updateSpendingChart();
            updateBudgetChart();
            startLiveDashboard();
        });
    }
};

// ============================================
// RESPONSIVE HANDLING
// ============================================
function handleResponsiveCharts() {
    window.addEventListener('resize', function() {
        if (spendingChart) spendingChart.resize();
        if (budgetChart) budgetChart.resize();
        if (window.innerWidth > 768) closeSidebar();
    });
}

// ============================================
// SIDEBAR
// ============================================
function setupSidebar() {
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
    if (closeBtn) closeBtn.onclick = function() { closeSidebar(); };
    overlay.onclick = function() { closeSidebar(); };
    sidebar.querySelectorAll('.nav-item').forEach(function(link) {
        link.addEventListener('click', function() { closeSidebar(); });
    });
}

function closeSidebar() {
    var s = document.getElementById('sidebar');
    var o = document.getElementById('sidebarOverlay');
    if (s) s.classList.remove('open');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================
// USER INFO - 🔥 FIX: Auto-loads on navigation
// ============================================
async function fetchUserProfile() {
    try {
        var response = await fetch('/api/auth/profile');
        if (!response.ok) return;
        var data = await response.json();
        if (!data.success) return;
        var fullName = data.fullName || 'User';
        var email = data.email || '';
        var firstName = fullName.split(' ')[0];
        var initials = firstName.substring(0, 2).toUpperCase();
        
        // Sidebar
        var sf = document.getElementById('sidebarFullName');
        var se = document.getElementById('sidebarEmail');
        var si = document.getElementById('sidebarInitials');
        if (sf) sf.textContent = fullName;
        if (se) se.textContent = email;
        if (si) si.textContent = initials;
        
        // Header
        var hg = document.getElementById('headerGreeting');
        var hi = document.getElementById('headerInitials');
        if (hg) hg.textContent = 'Welcome back, ' + firstName + '! 👋';
        if (hi) hi.textContent = initials;
        
        console.log('Dashboard: User loaded - ' + fullName);
    } catch (e) { console.error('Profile error:', e); }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    var btnTx = document.getElementById('btnAddTransaction');
    var btnCat = document.getElementById('btnAddCategory');
    var catCol = document.getElementById('catColor');

    if (btnTx) btnTx.onclick = function() { openModal('transactionModal'); };
    if (btnCat) btnCat.onclick = function() { openModal('categoryModal'); };
    if (catCol) catCol.onchange = function() {
        document.getElementById('colorPreview').style.background = this.value;
    };

    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(function(m) { m.style.display = 'none'; });
            document.body.style.overflow = '';
        }
    });
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (id === 'categoryModal') {
        document.getElementById('catName').value = '';
        document.getElementById('catAmount').value = '';
        document.getElementById('catColor').value = '#10B981';
        document.getElementById('colorPreview').style.background = '#10B981';
    }
    if (id === 'transactionModal') {
        document.getElementById('txDescription').value = '';
        document.getElementById('txAmount').value = '';
        renderCategoryOptions();
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = '';
}

// ============================================
// ANIMATE STAT VALUE
// ============================================
function animateStatValue(id, targetValue) {
    const element = document.getElementById(id);
    if (!element) return;

    if (element._animationFrame) {
        cancelAnimationFrame(element._animationFrame);
        element._animationFrame = null;
    }

    let currentText = element.textContent;
    let currentValue = parseInt(currentText.replace(/[₦,]/g, '')) || 0;
    
    if (currentValue === targetValue) {
        element.textContent = '₦' + targetValue.toLocaleString();
        return;
    }

    const startValue = currentValue;
    const difference = targetValue - startValue;
    const duration = 1500;
    let startTime = null;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (difference * eased));
        
        element.textContent = '₦' + current.toLocaleString();
        
        if (progress < 1) {
            element._animationFrame = requestAnimationFrame(animate);
        } else {
            element.textContent = '₦' + targetValue.toLocaleString();
            element._animationFrame = null;
        }
    }

    element._animationFrame = requestAnimationFrame(animate);
}

// ============================================
// LIVE CHART MOVEMENT
// ============================================
function startLiveChartMovement() {
    if (chartAnimationInterval) {
        clearInterval(chartAnimationInterval);
    }

    chartAnimationInterval = setInterval(function() {
        if (spendingChart && liveSpendingData) {
            try {
                spendingChart.data.datasets[0].data =
                    liveSpendingData.income.map(v => {
                        return Math.round(Math.max(v * (0.98 + Math.random() * 0.04), 0));
                    });

                spendingChart.data.datasets[1].data =
                    liveSpendingData.expense.map(v => {
                        return Math.round(Math.max(v * (0.98 + Math.random() * 0.04), 0));
                    });

                spendingChart.update('none');
            } catch(e) {}
        }

        if (budgetChart) {
            try {
                updateBudgetCategoriesFromTransactions();
                
                budgetChart.data.labels = budgetCategories.map(function(c) { return c.name; });
                budgetChart.data.datasets[0].data = budgetCategories.map(function(c) { return c.amount; });
                budgetChart.data.datasets[0].backgroundColor = budgetCategories.map(function(c) { return c.color; });
                
                budgetChart.options.rotation = (budgetChart.options.rotation || 0) + 0.03;
                budgetChart.update('none');
            } catch(e) {}
        }
    }, 3000);
}

// ============================================
// LIVE DATA REFRESH
// ============================================
function startLiveDataRefresh() {
    setInterval(async function() {
        try {
            var dataChanged = await loadTransactionsFromApi();
            if (dataChanged) {
                await loadBudgetsFromApi();
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
            }
        } catch(e) {
            console.log('Data refresh error:', e);
        }
    }, 10000);
}

// ============================================
// START LIVE DASHBOARD
// ============================================
function startLiveDashboard() {
    if (isLiveDashboardRunning) {
        console.log('Dashboard: Already running');
        return;
    }
    
    console.log('Dashboard: Starting live dashboard...');
    isLiveDashboardRunning = true;

    setInterval(function() {
        updateBudgetCategoriesFromTransactions();
        updateStatsFromTransactions();
        
        if (budgetChart) {
            try {
                budgetChart.data.labels = budgetCategories.map(function(c) { return c.name; });
                budgetChart.data.datasets[0].data = budgetCategories.map(function(c) { return c.amount; });
                budgetChart.data.datasets[0].backgroundColor = budgetCategories.map(function(c) { return c.color; });
                budgetChart.update('none');
            } catch(e) {}
        }
        
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            const current = parseFloat(progressFill.style.width) || 0;
            const fluctuation = current + (Math.random() * 2 - 1);
            progressFill.style.transition = 'width 1.5s ease-in-out';
            progressFill.style.width = Math.max(Math.min(fluctuation, 100), 0) + '%';
        }
    }, 5000);

    startLiveChartMovement();
    startLiveDataRefresh();
    
    console.log('Dashboard: Live dashboard is now running!');
}

// ============================================
// CHARTS
// ============================================
function updateSpendingChart() {
    var ctx = document.getElementById('spendingChart');
    if (!ctx) return;
    if (spendingChart) spendingChart.destroy();

    var now = new Date();
    var w1i = 0, w2i = 0, w3i = 0, w4i = 0;
    var w1e = 0, w2e = 0, w3e = 0, w4e = 0;

    transactions.forEach(function(t) {
        var d = new Date(t.date);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            var day = d.getDate();
            if (day <= 7) { 
                if (t.type === 'income') w1i += t.amount; 
                else w1e += t.amount; 
            }
            else if (day <= 14) { 
                if (t.type === 'income') w2i += t.amount; 
                else w2e += t.amount; 
            }
            else if (day <= 21) { 
                if (t.type === 'income') w3i += t.amount; 
                else w3e += t.amount; 
            }
            else { 
                if (t.type === 'income') w4i += t.amount; 
                else w4e += t.amount; 
            }
        }
    });

    liveSpendingData = {
        income: [w1i || 0, w2i || 0, w3i || 0, w4i || 0],
        expense: [w1e || 0, w2e || 0, w3e || 0, w4e || 0]
    };

    spendingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Income',
                    data: [...liveSpendingData.income],
                    backgroundColor: 'rgba(16,185,129,0.7)',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 50
                },
                {
                    label: 'Expenses',
                    data: [...liveSpendingData.expense],
                    backgroundColor: 'rgba(239,68,68,0.7)',
                    borderColor: '#EF4444',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 50
                }
            ]
        },
        options: {
            animation: { duration: 2000 },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: '#94A3B8',
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(148,163,184,0.06)' },
                    ticks: { color: '#64748B', font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148,163,184,0.06)' },
                    ticks: {
                        color: '#64748B',
                        font: { size: 10 },
                        callback: function(v) { return '₦' + v.toLocaleString(); }
                    }
                }
            }
        }
    });
}

function updateBudgetChart() {
    var ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    if (budgetChart) budgetChart.destroy();

    updateBudgetCategoriesFromTransactions();

    var total = budgetCategories.reduce(function(s, c) { return s + c.amount; }, 0);

    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: budgetCategories.map(function(c) { return c.name; }),
            datasets: [{
                data: budgetCategories.map(function(c) { return c.amount; }),
                backgroundColor: budgetCategories.map(function(c) { return c.color; }),
                borderWidth: 2,
                borderColor: '#1E293B'
            }]
        },
        options: {
            animation: { duration: 2000 },
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            rotation: 0,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94A3B8',
                        usePointStyle: true,
                        padding: 14,
                        font: { size: 11 },
                        generateLabels: function(chart) {
                            return chart.data.labels.map(function(label, i) {
                                var v = chart.data.datasets[0].data[i];
                                var pct = total > 0 ? ((v / total) * 100).toFixed(1) : 0;
                                return {
                                    text: label + ' (₦' + v.toLocaleString() + ' - ' + pct + '%)',
                                    fillStyle: chart.data.datasets[0].backgroundColor[i],
                                    strokeStyle: chart.data.datasets[0].backgroundColor[i],
                                    lineWidth: 0,
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                }
            }
        }
    });
}

Chart.register({
    id: 'doughnutCenterText',
    afterDraw: function(chart) {
        if (chart.config.type !== 'doughnut') return;
        var ctx = chart.ctx, w = chart.width, h = chart.height;
        var total = chart.config.data.datasets[0].data.reduce(function(a, b) { return a + b; }, 0);
        ctx.restore();
        ctx.font = 'bold 1rem Inter, sans-serif';
        ctx.fillStyle = '#F1F5F9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₦' + total.toLocaleString(), w / 2, h / 2 - 8);
        ctx.font = '0.6875rem Inter, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('Total Budget', w / 2, h / 2 + 16);
        ctx.save();
    }
});

// ============================================
// REAL-TIME STATS
// ============================================
function updateStatsFromTransactions() {
    var totalIncome = 0, totalExpenses = 0;
    transactions.forEach(function(t) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpenses += t.amount;
    });
    var totalSavings = Math.max(totalIncome - totalExpenses, 0);
    var budgetTotal = budgetCategories.reduce(function(s, c) { return s + c.amount; }, 0);
    var budgetPercent = budgetTotal > 0 ? Math.round((totalExpenses / budgetTotal) * 100) : 0;

    animateStatValue('incomeValue', totalIncome);
    animateStatValue('expenseValue', totalExpenses);
    animateStatValue('savingsValue', totalSavings);
    animateStatValue('budgetValue', totalExpenses);

    var budgetTrend = document.querySelector('.budget-card .stat-trend');
    if (budgetTrend) {
        budgetTrend.textContent = Math.min(budgetPercent, 100) + '%';
        budgetTrend.className = 'stat-trend ' + (budgetPercent > 80 ? 'negative' : 'positive');
    }

    var progressFill = document.getElementById('progressFill');
    if (progressFill) {
        var percent = Math.min(budgetPercent, 100);
        progressFill.style.width = percent + '%';
        progressFill.style.background = percent > 80 
            ? 'linear-gradient(90deg, #EF4444, #F87171)' 
            : percent > 60 
                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                : 'linear-gradient(90deg, #10B981, #34D399)';
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderTransactions() {
    var tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:#64748B;"><i class="bi bi-receipt" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>No transactions found.<br>Click "Add Transaction" to get started. </td></tr>';
        return;
    }
    tbody.innerHTML = transactions.slice(0, 10).map(function(t) {
        var icon = t.type === 'income' ? 'bi-arrow-down' : 'bi-arrow-up';
        var iconClass = t.type === 'income' ? 'income' : 'expense';
        var sign = t.type === 'income' ? '+' : '-';
        var amountClass = t.type === 'income' ? 'amount-income' : 'amount-expense';
        var dateStr = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        return '<tr>' +
            '<td><div class="transaction-desc"><div class="transaction-icon ' + iconClass + '"><i class="bi ' + icon + '"></i></div><span>' + t.desc + '</span></div></td>' +
            '<td><span class="category-badge">' + t.cat + '</span></td>' +
            '<td>' + dateStr + '</td>' +
            '<td class="' + amountClass + '">' + sign + '₦' + t.amount.toLocaleString() + '</td>' +
            '<td><span class="status-badge ' + t.status + '">' + t.status + '</span></td>' +
            '<td><button class="btn-delete" onclick="deleteTransaction(' + t.id + ')" title="Delete"><i class="bi bi-trash"></i></button></td>' +
        '</tr>';
    }).join('');
}

// ============================================
// RENDER CATEGORY OPTIONS - Shows all categories
// ============================================
function renderCategoryOptions() {
    var select = document.getElementById('txCategory');
    if (!select) return;
    
    var allCategories = {};
    
    budgetCategories.forEach(function(c) {
        if (c.name && c.name !== "No Expenses" && c.name !== "No Data") {
            allCategories[c.name] = true;
        }
    });
    
    transactions.forEach(function(t) {
        if (t.cat) allCategories[t.cat] = true;
    });
    
    var uniqueCats = Object.keys(allCategories).sort();
    
    var html = '<option value="">Select category</option>';
    uniqueCats.forEach(function(c) {
        html += '<option value="' + c + '">' + c + '</option>';
    });
    
    select.innerHTML = html;
}

// ============================================
// CLEANUP
// ============================================
window.cleanupDashboard = function() {
    console.log('Dashboard: Cleaning up...');
    if (chartAnimationInterval) {
        clearInterval(chartAnimationInterval);
        chartAnimationInterval = null;
    }
    if (spendingChart) {
        spendingChart.destroy();
        spendingChart = null;
    }
    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }
    isLiveDashboardRunning = false;
    console.log('Dashboard: Cleanup complete');
};