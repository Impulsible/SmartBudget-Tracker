// ============================================
// SMARTBUDGET DASHBOARD - Production Ready
// FIXED: Category Dropdown Now Populates
// ============================================
console.log('Dashboard JS: Loaded (Fixed v3)');

var spendingChart = null;
var budgetChart = null;
var nextId = 1;
var isLiveDashboardRunning = false;
var liveSpendingData = null;
var chartAnimationInterval = null;
var dashboardBudgets = [];
var dashboardTransactions = [];

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

// Default categories to show when no data exists
var defaultCategories = [
    "Food", "Transport", "Shopping", "Bills", "Entertainment",
    "Salary", "Utilities", "Rent", "Insurance", "Education", "Health", "Other"
];

// ============================================
// FALLBACK STORAGE
// ============================================
function getFallbackBudgets() {
    try {
        var stored = localStorage.getItem('smartbudget_budgets_fallback');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.log('Fallback read error:', e);
    }
    return null;
}

function getFallbackTransactions() {
    try {
        var stored = localStorage.getItem('smartbudget_transactions_fallback');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.log('Fallback read error:', e);
    }
    return null;
}

function setFallbackTransactions(transactions) {
    try {
        localStorage.setItem('smartbudget_transactions_fallback', JSON.stringify(transactions));
    } catch (e) {
        console.log('Fallback write error:', e);
    }
}

// ============================================
// RENDER CATEGORY OPTIONS - FIXED
// ============================================
function renderCategoryOptions() {
    var select = document.getElementById('txCategory');
    if (!select) {
        console.log('Dashboard: txCategory select not found in DOM - will retry');
        return;
    }
    
    console.log('Dashboard: Rendering category options...');
    console.log('Dashboard: dashboardBudgets:', dashboardBudgets.length);
    console.log('Dashboard: dashboardTransactions:', dashboardTransactions.length);
    
    var allCategories = {};
    
    defaultCategories.forEach(function(cat) {
        allCategories[cat] = true;
    });
    
    dashboardBudgets.forEach(function(c) {
        if (c.name && c.name !== "No Expenses" && c.name !== "No Data") {
            allCategories[c.name] = true;
        }
    });
    
    dashboardTransactions.forEach(function(t) {
        if (t.cat) {
            allCategories[t.cat] = true;
        }
    });
    
    var uniqueCats = Object.keys(allCategories).sort();
    console.log('Dashboard: Categories for dropdown:', uniqueCats);
    
    var html = '<option value="">Select category</option>';
    uniqueCats.forEach(function(c) {
        html += '<option value="' + c + '">' + c + '</option>';
    });
    
    select.innerHTML = html;
    console.log('Dashboard: Category dropdown populated with', uniqueCats.length, 'options');
}

// ============================================
// GET OR CREATE CATEGORY COLOR
// ============================================
function getCategoryColor(categoryName) {
    if (categoryColors[categoryName]) {
        return categoryColors[categoryName];
    }
    
    var existing = dashboardBudgets.find(function(c) { return c.name === categoryName; });
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
    
    dashboardTransactions.forEach(function(t) {
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
    
    dashboardBudgets.forEach(function(c) {
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
        dashboardBudgets = [
            { name: "No Expenses", amount: 1, color: "#64748B" }
        ];
    } else {
        dashboardBudgets = newCategories;
    }
}

// ============================================
// LOAD DATA FROM API
// ============================================
async function loadTransactionsFromApi() {
    try {
        console.log('Dashboard: Fetching transactions...');
        var response = await fetch('/api/transactions?pageSize=100', {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            console.log('Dashboard: Not authenticated - using fallback');
            var fallbackData = getFallbackTransactions();
            if (fallbackData && fallbackData.length > 0) {
                dashboardTransactions = fallbackData;
                return true;
            }
            dashboardTransactions = [];
            return false;
        }
        
        if (response.ok) {
            var data = await response.json();
            if (data.success && data.transactions && data.transactions.length > 0) {
                dashboardTransactions = data.transactions.map(function(t) {
                    return {
                        id: t.id,
                        desc: t.title || t.description || 'Unknown',
                        cat: t.category || 'Other',
                        date: new Date(t.date),
                        amount: t.amount || 0,
                        type: t.type || 'expense',
                        status: t.status || 'Completed'
                    };
                });
                setFallbackTransactions(dashboardTransactions);
                var ids = dashboardTransactions.map(function(t) { return t.id; });
                if (ids.length > 0) {
                    nextId = Math.max.apply(null, ids) + 1;
                }
                console.log('Dashboard: Loaded', dashboardTransactions.length, 'transactions');
                return true;
            } else {
                console.log('Dashboard: No transactions found');
                var fallbackData = getFallbackTransactions();
                if (fallbackData && fallbackData.length > 0) {
                    dashboardTransactions = fallbackData;
                    return true;
                }
                dashboardTransactions = [];
                return false;
            }
        }
        console.log('Dashboard: API error');
        var fallbackData = getFallbackTransactions();
        if (fallbackData && fallbackData.length > 0) {
            dashboardTransactions = fallbackData;
            return true;
        }
        dashboardTransactions = [];
        return false;
    } catch (e) {
        console.log('Dashboard: Network error:', e.message);
        var fallbackData = getFallbackTransactions();
        if (fallbackData && fallbackData.length > 0) {
            dashboardTransactions = fallbackData;
            return true;
        }
        dashboardTransactions = [];
        return false;
    }
}

async function loadBudgetsFromApi() {
    try {
        console.log('Dashboard: Fetching budgets...');
        var response = await fetch('/api/budgets', {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            console.log('Dashboard: Not authenticated - using fallback');
            var fallbackData = getFallbackBudgets();
            if (fallbackData && fallbackData.length > 0) {
                dashboardBudgets = fallbackData.map(function(b) {
                    if (b.color) categoryColors[b.name] = b.color;
                    return { 
                        name: b.name, 
                        amount: b.amount || 0, 
                        color: b.color || getCategoryColor(b.name)
                    };
                });
                return true;
            }
            dashboardBudgets = [];
            return false;
        }
        
        if (response.ok) {
            var data = await response.json();
            if (data.success && data.budgets && data.budgets.length > 0) {
                dashboardBudgets = data.budgets.map(function(b) {
                    if (b.color) categoryColors[b.name] = b.color;
                    return { 
                        name: b.name, 
                        amount: b.amount || 0, 
                        color: b.color || getCategoryColor(b.name)
                    };
                });
                console.log('Dashboard: Loaded', dashboardBudgets.length, 'budgets');
                return true;
            } else {
                console.log('Dashboard: No budgets found');
                var fallbackData = getFallbackBudgets();
                if (fallbackData && fallbackData.length > 0) {
                    dashboardBudgets = fallbackData.map(function(b) {
                        if (b.color) categoryColors[b.name] = b.color;
                        return { 
                            name: b.name, 
                            amount: b.amount || 0, 
                            color: b.color || getCategoryColor(b.name)
                        };
                    });
                    return true;
                }
                dashboardBudgets = [];
                return false;
            }
        }
        console.log('Dashboard: Budgets API error');
        var fallbackData = getFallbackBudgets();
        if (fallbackData && fallbackData.length > 0) {
            dashboardBudgets = fallbackData.map(function(b) {
                if (b.color) categoryColors[b.name] = b.color;
                return { 
                    name: b.name, 
                    amount: b.amount || 0, 
                    color: b.color || getCategoryColor(b.name)
                };
            });
            return true;
        }
        dashboardBudgets = [];
        return false;
    } catch (e) {
        console.log('Dashboard: Network error:', e.message);
        var fallbackData = getFallbackBudgets();
        if (fallbackData && fallbackData.length > 0) {
            dashboardBudgets = fallbackData.map(function(b) {
                if (b.color) categoryColors[b.name] = b.color;
                return { 
                    name: b.name, 
                    amount: b.amount || 0, 
                    color: b.color || getCategoryColor(b.name)
                };
            });
            return true;
        }
        dashboardBudgets = [];
        return false;
    }
}

async function loadAllData() {
    console.log('Dashboard: Loading all data...');
    await Promise.all([loadTransactionsFromApi(), loadBudgetsFromApi()]);
    
    if (dashboardTransactions.length > 0 && dashboardBudgets.length === 0) {
        updateBudgetCategoriesFromTransactions();
    }
    
    console.log('Dashboard: Data loaded - Tx:', dashboardTransactions.length, 'Budgets:', dashboardBudgets.length);
}

// ============================================
// ANIMATE COUNTERS - FIXED (Added missing function)
// ============================================
function animateCounters() {
    var counters = document.querySelectorAll('.stat-value');
    counters.forEach(function(counter) {
        var target = parseInt(counter.textContent.replace(/[₦,]/g, '')) || 0;
        var current = 0;
        var increment = Math.ceil(target / 60);
        var duration = 1500;
        var steps = 60;
        var stepTime = duration / steps;
        
        var timer = setInterval(function() {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = '₦' + current.toLocaleString();
        }, stepTime);
    });
}

// ============================================
// UPDATE SPENDING PERIOD - FIXED (Added full implementation)
// ============================================
window.updateSpendingPeriod = function(period) {
    console.log('📊 updateSpendingPeriod:', period);
    var btns = document.querySelectorAll('.chart-period');
    btns.forEach(function(b) { b.classList.remove('active'); });
    
    if (spendingChart) {
        spendingChart.destroy();
        spendingChart = null;
    }
    
    var ctx = document.getElementById('spendingChart');
    if (!ctx) {
        console.log('❌ Spending chart canvas not found');
        return;
    }
    
    var data = generateSpendingData(period);
    
    // Set active button
    var activeBtn = period === 'Monthly' ? btns[0] : btns[1];
    if (activeBtn) activeBtn.classList.add('active');
    
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
// GENERATE SPENDING DATA
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
        
        dashboardTransactions.forEach(function(t) {
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
        
        dashboardTransactions.forEach(function(t) {
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

// ============================================
// WINDOW.LOADUSERINFO - FIXED (Added missing function)
// ============================================
window.loadUserInfo = function(userInfo) {
    console.log('👤 Loading user info from Blazor:', userInfo);
    
    if (!userInfo) {
        console.warn('No user info provided');
        return;
    }
    
    var fullName = userInfo.name || 'User';
    var email = userInfo.email || '';
    var initials = userInfo.initials || 'U';
    
    // Update sidebar
    var sidebarName = document.getElementById('sidebarFullName');
    var sidebarEmail = document.getElementById('sidebarEmail');
    var sidebarInitials = document.getElementById('sidebarInitials');
    
    if (sidebarName) sidebarName.textContent = fullName;
    if (sidebarEmail) sidebarEmail.textContent = email;
    if (sidebarInitials) sidebarInitials.textContent = initials;
    
    // Update header
    var headerInitials = document.getElementById('headerInitials');
    var headerGreeting = document.getElementById('headerGreeting');
    
    if (headerInitials) headerInitials.textContent = initials;
    if (headerGreeting) {
        var timeOfDay = getTimeOfDay();
        var firstName = fullName.split(' ')[0];
        headerGreeting.textContent = 'Good ' + timeOfDay + ', ' + firstName + '! 👋';
    }
    
    console.log('✅ User info loaded successfully');
};

function getTimeOfDay() {
    var hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
}

// ============================================
// ADD TRANSACTION - FIXED
// ============================================
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
            credentials: 'include',
            body: JSON.stringify({ 
                title: desc, 
                description: desc, 
                amount: parseFloat(amount), 
                type: type, 
                category: cat 
            })
        });
        
        if (!response.ok) {
            // Save to fallback
            var newTx = {
                id: Date.now(),
                desc: desc,
                cat: cat,
                date: new Date(),
                amount: parseFloat(amount),
                type: type,
                status: 'Completed'
            };
            var fallbackTxs = getFallbackTransactions() || [];
            fallbackTxs.push(newTx);
            setFallbackTransactions(fallbackTxs);
            dashboardTransactions = fallbackTxs;
            closeModal('transactionModal');
            await loadAllData();
            renderTransactions();
            renderCategoryOptions();
            updateStatsFromTransactions();
            updateSpendingChart();
            updateBudgetChart();
            showToast('Transaction saved locally (offline mode)', 'info');
            return;
        }
        
        var data = await response.json();
        if (data.success) {
            closeModal('transactionModal');
            await loadAllData();
            renderTransactions();
            renderCategoryOptions();
            updateStatsFromTransactions();
            updateSpendingChart();
            updateBudgetChart();
            showToast('Transaction added successfully!', 'success');
        } else { 
            alert('Failed to add transaction: ' + (data.message || 'Unknown error')); 
        }
    } catch (e) { 
        // Save to fallback on network error
        var newTx = {
            id: Date.now(),
            desc: desc,
            cat: cat,
            date: new Date(),
            amount: parseFloat(amount),
            type: type,
            status: 'Completed'
        };
        var fallbackTxs = getFallbackTransactions() || [];
        fallbackTxs.push(newTx);
        setFallbackTransactions(fallbackTxs);
        dashboardTransactions = fallbackTxs;
        closeModal('transactionModal');
        await loadAllData();
        renderTransactions();
        renderCategoryOptions();
        updateStatsFromTransactions();
        updateSpendingChart();
        updateBudgetChart();
        showToast('Transaction saved locally (offline mode)', 'info');
    }
};

// ============================================
// ADD CATEGORY - FIXED
// ============================================
window.addCategory = async function() {
    var name = document.getElementById('catName').value.trim();
    var amount = parseFloat(document.getElementById('catAmount').value);
    var color = document.getElementById('catColor').value;
    if (!name || !amount) { alert('Please fill in all fields.'); return; }
    
    try {
        var response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: name, amount: amount, color: color })
        });
        var data = await response.json();
        
        if (data.success) {
            await loadBudgetsFromApi();
            renderCategoryOptions();
            updateBudgetChart();
            updateStatsFromTransactions();
            closeModal('categoryModal');
            showToast('Category "' + name + '" added successfully!', 'success');
        } else {
            // Save to fallback
            var fallbackBudgets = getFallbackBudgets() || [];
            fallbackBudgets.push({ id: Date.now(), name: name, amount: amount, color: color, spent: 0 });
            localStorage.setItem('smartbudget_budgets_fallback', JSON.stringify(fallbackBudgets));
            dashboardBudgets = fallbackBudgets;
            renderCategoryOptions();
            updateBudgetChart();
            updateStatsFromTransactions();
            closeModal('categoryModal');
            showToast('Category "' + name + '" saved locally (offline mode)', 'info');
        }
    } catch (e) {
        console.error('Error adding category:', e);
        // Save to fallback
        var fallbackBudgets = getFallbackBudgets() || [];
        fallbackBudgets.push({ id: Date.now(), name: name, amount: amount, color: color, spent: 0 });
        localStorage.setItem('smartbudget_budgets_fallback', JSON.stringify(fallbackBudgets));
        dashboardBudgets = fallbackBudgets;
        renderCategoryOptions();
        updateBudgetChart();
        updateStatsFromTransactions();
        closeModal('categoryModal');
        showToast('Category "' + name + '" saved locally (offline mode)', 'info');
    }
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
    var iconColor = type === 'success' ? '#10B981' : (type === 'info' ? '#3B82F6' : '#EF4444');
    var icon = type === 'success' ? 'check-circle-fill' : (type === 'info' ? 'info-circle-fill' : 'exclamation-triangle-fill');
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + iconColor + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;color:white;';
    toast.innerHTML = '<i class="bi bi-' + icon + '" style="color:' + iconColor + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// ============================================
// DELETE TRANSACTION
// ============================================
window.deleteTransaction = async function(id) {
    if (confirm('Delete this transaction?')) {
        try {
            var response = await fetch('/api/transactions/' + id, { 
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                // Delete from fallback
                var fallbackTxs = getFallbackTransactions() || [];
                fallbackTxs = fallbackTxs.filter(function(t) { return t.id !== id; });
                setFallbackTransactions(fallbackTxs);
                dashboardTransactions = fallbackTxs;
                await loadAllData();
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
                return;
            }
            
            var data = await response.json();
            if (data.success) {
                await loadAllData();
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
            }
        } catch (e) { 
            // Delete from fallback on network error
            var fallbackTxs = getFallbackTransactions() || [];
            fallbackTxs = fallbackTxs.filter(function(t) { return t.id !== id; });
            setFallbackTransactions(fallbackTxs);
            dashboardTransactions = fallbackTxs;
            await loadAllData();
            renderTransactions();
            renderCategoryOptions();
            updateStatsFromTransactions();
            updateSpendingChart();
            updateBudgetChart();
        }
    }
};

// ============================================
// RESET BUDGET CATEGORIES
// ============================================
window.resetBudgetCategories = function() {
    if (confirm('Reset budget categories?')) {
        dashboardBudgets = [];
        updateBudgetCategoriesFromTransactions();
        updateBudgetChart();
        renderCategoryOptions();
        updateStatsFromTransactions();
    }
};

// ============================================
// CLEAR ALL TRANSACTIONS
// ============================================
window.clearAllTransactions = async function() {
    if (dashboardTransactions.length === 0) { alert('No transactions to clear.'); return; }
    if (confirm('Delete ALL transactions? This cannot be undone.')) {
        try {
            var response = await fetch('/api/transactions/clear', { 
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                // Clear fallback
                setFallbackTransactions([]);
                dashboardTransactions = [];
                await loadAllData();
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
                return;
            }
            
            var data = await response.json();
            if (data.success) {
                setFallbackTransactions([]);
                await loadAllData();
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
            }
        } catch (e) { 
            setFallbackTransactions([]);
            dashboardTransactions = [];
            await loadAllData();
            renderTransactions();
            renderCategoryOptions();
            updateStatsFromTransactions();
            updateSpendingChart();
            updateBudgetChart();
        }
    }
};

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
// USER INFO - FIXED (Combined fetch function)
// ============================================
async function fetchUserProfile() {
    try {
        var response = await fetch('/api/auth/profile', {
            credentials: 'include'
        });
        if (!response.ok) return;
        var data = await response.json();
        if (!data.success) return;
        var fullName = data.fullName || 'User';
        var email = data.email || '';
        var firstName = fullName.split(' ')[0];
        var initials = firstName.substring(0, 2).toUpperCase();
        var sf = document.getElementById('sidebarFullName');
        var se = document.getElementById('sidebarEmail');
        var si = document.getElementById('sidebarInitials');
        var hg = document.getElementById('headerGreeting');
        var hi = document.getElementById('headerInitials');
        if (sf) sf.textContent = fullName;
        if (se) se.textContent = email;
        if (si) si.textContent = initials;
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
        var preview = document.getElementById('colorPreview');
        if (preview) preview.style.background = this.value;
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
            document.querySelectorAll('.modal-overlay').forEach(function(m) { 
                m.style.display = 'none'; 
            });
            document.body.style.overflow = '';
        }
    });
}

// ============================================
// MODAL FUNCTIONS - FIXED
// ============================================
function openModal(id) {
    console.log('Opening modal:', id);
    var modal = document.getElementById(id);
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    if (id === 'categoryModal') {
        document.getElementById('catName').value = '';
        document.getElementById('catAmount').value = '';
        document.getElementById('catColor').value = '#10B981';
        var preview = document.getElementById('colorPreview');
        if (preview) preview.style.background = '#10B981';
    }
    
    if (id === 'transactionModal') {
        document.getElementById('txDescription').value = '';
        document.getElementById('txAmount').value = '';
        setTimeout(function() {
            renderCategoryOptions();
        }, 50);
    }
}

function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
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
                
                budgetChart.data.labels = dashboardBudgets.map(function(c) { return c.name; });
                budgetChart.data.datasets[0].data = dashboardBudgets.map(function(c) { return c.amount; });
                budgetChart.data.datasets[0].backgroundColor = dashboardBudgets.map(function(c) { return c.color; });
                
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
                budgetChart.data.labels = dashboardBudgets.map(function(c) { return c.name; });
                budgetChart.data.datasets[0].data = dashboardBudgets.map(function(c) { return c.amount; });
                budgetChart.data.datasets[0].backgroundColor = dashboardBudgets.map(function(c) { return c.color; });
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

    dashboardTransactions.forEach(function(t) {
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

    var total = dashboardBudgets.reduce(function(s, c) { return s + c.amount; }, 0);

    if (dashboardBudgets.length === 0 || total === 0) {
        dashboardBudgets = [{ name: "No Data", amount: 1, color: "#64748B" }];
    }

    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dashboardBudgets.map(function(c) { return c.name; }),
            datasets: [{
                data: dashboardBudgets.map(function(c) { return c.amount; }),
                backgroundColor: dashboardBudgets.map(function(c) { return c.color; }),
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
    dashboardTransactions.forEach(function(t) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpenses += t.amount;
    });
    var totalSavings = Math.max(totalIncome - totalExpenses, 0);
    var budgetTotal = dashboardBudgets.reduce(function(s, c) { return s + c.amount; }, 0);
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
// RENDER TRANSACTIONS
// ============================================
function renderTransactions() {
    var tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    if (dashboardTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:#64748B;"><i class="bi bi-receipt" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>No transactions found.<br>Click "Add Transaction" to get started.</td></tr>';
        return;
    }
    tbody.innerHTML = dashboardTransactions.slice(0, 10).map(function(t) {
        var icon = t.type === 'income' ? 'bi-arrow-down' : 'bi-arrow-up';
        var iconClass = t.type === 'income' ? 'income' : 'expense';
        var sign = t.type === 'income' ? '+' : '-';
        var amountClass = t.type === 'income' ? 'amount-income' : 'amount-expense';
        var dateStr = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        return '<tr>' +
            '<td><div class="transaction-desc"><div class="transaction-icon ' + iconClass + '"><i class="bi ' + icon + '"></i></div><span>' + (t.desc || 'Unknown') + '</span></div></td>' +
            '<td><span class="category-badge">' + (t.cat || 'Other') + '</span></td>' +
            '<td>' + dateStr + '</td>' +
            '<td class="' + amountClass + '">' + sign + '₦' + (t.amount || 0).toLocaleString() + '</td>' +
            '<td><span class="status-badge ' + (t.status || 'Completed') + '">' + (t.status || 'Completed') + '</span></td>' +
            '<td><button class="btn-delete" onclick="deleteTransaction(' + t.id + ')" title="Delete"><i class="bi bi-trash"></i></button></td>' +
        '</tr>';
    }).join('');
}

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

// ============================================
// DASHBOARD INIT FUNCTION - EXPOSE FOR BLAZOR (SINGLE DEFINITION)
// ============================================
window.initDashboardPage = function() {
    console.log('🔄 dashboard: init called from Blazor');
    setupSidebar();
    fetchUserProfile();
    setupEventListeners();
    animateCounters();
    loadAllData().then(function() {
        handleResponsiveCharts();
        renderTransactions();
        renderCategoryOptions();
        updateStatsFromTransactions();
        updateSpendingChart();
        updateBudgetChart();
        startLiveDashboard();
    });
    console.log('✅ dashboard: initialized');
};

// ============================================
// DESTROY PAGE - REGISTER WITH PAGE REGISTRY
// ============================================
window.destroyPage = function(pageName) {
    if (pageName === 'dashboard' || !pageName) {
        window.cleanupDashboard();
    }
};

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================
if (window.pageRegistry) {
    window.pageRegistry.register('dashboard', {
        init: window.initDashboardPage,
        destroy: window.cleanupDashboard,
        refresh: function() {
            console.log('🔄 Dashboard: Refreshing...');
            loadAllData().then(function() {
                renderTransactions();
                renderCategoryOptions();
                updateStatsFromTransactions();
                updateSpendingChart();
                updateBudgetChart();
            });
        }
    });
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.addTransaction = window.addTransaction;
window.deleteTransaction = window.deleteTransaction;
window.addCategory = window.addCategory;
window.resetBudgetCategories = window.resetBudgetCategories;
window.clearAllTransactions = window.clearAllTransactions;
window.openModal = openModal;
window.closeModal = closeModal;
window.updateSpendingPeriod = window.updateSpendingPeriod;
window.loadUserInfo = window.loadUserInfo;

// ============================================
// AUTO-START
// ============================================
(function autoStartDashboard() {
    console.log('Dashboard: Auto-starting...');
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
            console.log('Dashboard: Auto-started');
        });
    }, 100);
})();