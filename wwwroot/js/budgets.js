// ============================================
// SMARTBUDGET BUDGETS PAGE - PERSISTENT DATA
// ============================================
console.log('Budgets JS: Loaded');

var allBudgets = [];
var budgetChart = null;
var isUsingFallback = false;
var chartRetryCount = 0;
var maxChartRetries = 10;

// ============================================
// SIDEBAR SETUP
// ============================================
function setupBudgetsSidebar() {
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
            closeBudgetsSidebar();
        };
    }

    overlay.onclick = function() {
        closeBudgetsSidebar();
    };
}

function closeBudgetsSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

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

function setFallbackBudgets(budgets) {
    try {
        localStorage.setItem('smartbudget_budgets_fallback', JSON.stringify(budgets));
    } catch (e) {
        console.log('Fallback write error:', e);
    }
}

function getDefaultBudgets() {
    return [
        { id: 1, name: "Food", amount: 65000, color: "#10B981", spent: 0 },
        { id: 2, name: "Transport", amount: 35000, color: "#3B82F6", spent: 0 },
        { id: 3, name: "Shopping", amount: 45000, color: "#F59E0B", spent: 0 },
        { id: 4, name: "Bills", amount: 30000, color: "#EF4444", spent: 0 },
        { id: 5, name: "Entertainment", amount: 20000, color: "#8B5CF6", spent: 0 }
    ];
}

// ============================================
// API CALLS
// ============================================
async function fetchBudgets() {
    try {
        console.log('🔍 Fetching budgets from API...');
        var response = await fetch('/api/budgets', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.status === 401) {
            console.log('❌ Not authenticated - using fallback');
            isUsingFallback = true;
            var fallbackData = getFallbackBudgets();
            if (fallbackData && fallbackData.length > 0) {
                allBudgets = fallbackData;
                return allBudgets;
            }
            allBudgets = getDefaultBudgets();
            setFallbackBudgets(allBudgets);
            return allBudgets;
        }
        
        if (!response.ok) {
            console.log('❌ Budgets API returned:', response.status);
            var fallbackData = getFallbackBudgets();
            if (fallbackData && fallbackData.length > 0) {
                console.log('📂 Using fallback data');
                allBudgets = fallbackData;
                isUsingFallback = true;
                return allBudgets;
            }
            allBudgets = getDefaultBudgets();
            setFallbackBudgets(allBudgets);
            return allBudgets;
        }
        
        var data = await response.json();
        console.log('✅ Budgets response:', data);
        
        if (data.success && data.budgets && data.budgets.length > 0) {
            allBudgets = data.budgets;
            setFallbackBudgets(allBudgets);
            isUsingFallback = false;
            console.log('✅ Loaded ' + allBudgets.length + ' budgets from API');
        } else {
            var fallbackData = getFallbackBudgets();
            if (fallbackData && fallbackData.length > 0) {
                console.log('📂 Using fallback data (no API data)');
                allBudgets = fallbackData;
                isUsingFallback = true;
            } else {
                allBudgets = getDefaultBudgets();
                setFallbackBudgets(allBudgets);
            }
        }
        return allBudgets;
    } catch (e) {
        console.error('❌ Error fetching budgets:', e);
        var fallbackData = getFallbackBudgets();
        if (fallbackData && fallbackData.length > 0) {
            console.log('📂 Using fallback data (network error)');
            allBudgets = fallbackData;
            isUsingFallback = true;
            return allBudgets;
        }
        allBudgets = getDefaultBudgets();
        setFallbackBudgets(allBudgets);
        return allBudgets;
    }
}

async function saveBudgetToApi(budget) {
    try {
        var body = {
            name: budget.name,
            amount: budget.amount,
            color: budget.color,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        };
        
        console.log('📤 Saving budget to API:', body);
        
        var response = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            console.log('⚠️ API save failed with status:', response.status);
            var fallbackBudgets = getFallbackBudgets() || [];
            var newBudget = { 
                id: Date.now(), 
                name: budget.name, 
                amount: budget.amount, 
                color: budget.color,
                spent: 0
            };
            fallbackBudgets.push(newBudget);
            setFallbackBudgets(fallbackBudgets);
            allBudgets = fallbackBudgets;
            isUsingFallback = true;
            showToast('Budget saved locally (offline mode)', 'info');
            return true;
        }
        
        var data = await response.json();
        console.log('✅ Response data:', data);
        
        if (data.success === true) {
            await fetchBudgets();
            return true;
        } else {
            var fallbackBudgets = getFallbackBudgets() || [];
            var newBudget = { 
                id: Date.now(), 
                name: budget.name, 
                amount: budget.amount, 
                color: budget.color,
                spent: 0
            };
            fallbackBudgets.push(newBudget);
            setFallbackBudgets(fallbackBudgets);
            allBudgets = fallbackBudgets;
            isUsingFallback = true;
            showToast('Budget saved locally (offline mode)', 'info');
            return true;
        }
    } catch (e) {
        console.error('❌ Error saving budget:', e);
        var fallbackBudgets = getFallbackBudgets() || [];
        var newBudget = { 
            id: Date.now(), 
            name: budget.name, 
            amount: budget.amount, 
            color: budget.color,
            spent: 0
        };
        fallbackBudgets.push(newBudget);
        setFallbackBudgets(fallbackBudgets);
        allBudgets = fallbackBudgets;
        isUsingFallback = true;
        showToast('Budget saved locally (offline mode)', 'info');
        return true;
    }
}

async function updateBudgetInApi(id, budget) {
    try {
        var body = {
            name: budget.name,
            amount: budget.amount,
            color: budget.color
        };
        
        console.log('📤 Updating budget in API:', id, body);
        
        var response = await fetch('/api/budgets/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            console.log('⚠️ API update failed with status:', response.status);
            var fallbackBudgets = getFallbackBudgets() || [];
            var index = fallbackBudgets.findIndex(function(b) { return b.id === id; });
            if (index !== -1) {
                fallbackBudgets[index].name = budget.name;
                fallbackBudgets[index].amount = budget.amount;
                fallbackBudgets[index].color = budget.color;
                setFallbackBudgets(fallbackBudgets);
                allBudgets = fallbackBudgets;
                isUsingFallback = true;
            }
            return true;
        }
        
        var data = await response.json();
        console.log('✅ Update response:', data);
        
        if (data.success === true) {
            await fetchBudgets();
            return true;
        } else {
            var fallbackBudgets = getFallbackBudgets() || [];
            var index = fallbackBudgets.findIndex(function(b) { return b.id === id; });
            if (index !== -1) {
                fallbackBudgets[index].name = budget.name;
                fallbackBudgets[index].amount = budget.amount;
                fallbackBudgets[index].color = budget.color;
                setFallbackBudgets(fallbackBudgets);
                allBudgets = fallbackBudgets;
                isUsingFallback = true;
            }
            return true;
        }
    } catch (e) {
        console.error('❌ Error updating budget:', e);
        var fallbackBudgets = getFallbackBudgets() || [];
        var index = fallbackBudgets.findIndex(function(b) { return b.id === id; });
        if (index !== -1) {
            fallbackBudgets[index].name = budget.name;
            fallbackBudgets[index].amount = budget.amount;
            fallbackBudgets[index].color = budget.color;
            setFallbackBudgets(fallbackBudgets);
            allBudgets = fallbackBudgets;
            isUsingFallback = true;
        }
        return true;
    }
}

async function deleteBudgetFromApi(id) {
    try {
        var response = await fetch('/api/budgets/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.log('⚠️ API delete failed with status:', response.status);
            var fallbackBudgets = getFallbackBudgets() || [];
            fallbackBudgets = fallbackBudgets.filter(function(b) { return b.id !== id; });
            setFallbackBudgets(fallbackBudgets);
            allBudgets = fallbackBudgets;
            isUsingFallback = true;
            return true;
        }
        
        var data = await response.json();
        if (data.success === true) {
            await fetchBudgets();
            return true;
        } else {
            var fallbackBudgets = getFallbackBudgets() || [];
            fallbackBudgets = fallbackBudgets.filter(function(b) { return b.id !== id; });
            setFallbackBudgets(fallbackBudgets);
            allBudgets = fallbackBudgets;
            isUsingFallback = true;
            return true;
        }
    } catch (e) {
        console.error('❌ Error deleting budget:', e);
        var fallbackBudgets = getFallbackBudgets() || [];
        fallbackBudgets = fallbackBudgets.filter(function(b) { return b.id !== id; });
        setFallbackBudgets(fallbackBudgets);
        allBudgets = fallbackBudgets;
        isUsingFallback = true;
        return true;
    }
}

// ============================================
// MODAL HANDLERS
// ============================================
function openBudgetModal() {
    console.log('📝 openBudgetModal called');
    var modal = document.getElementById('budgetModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        var budgetId = document.getElementById('budgetId');
        var budgetName = document.getElementById('budgetName');
        var budgetAmount = document.getElementById('budgetAmount');
        var budgetColor = document.getElementById('budgetColor');
        var colorPreview = document.getElementById('budgetColorPreview');
        var modalTitle = document.getElementById('budgetModalTitle');
        
        if (budgetId) budgetId.value = '';
        if (budgetName) budgetName.value = '';
        if (budgetAmount) budgetAmount.value = '';
        if (budgetColor) budgetColor.value = '#10B981';
        if (colorPreview) colorPreview.style.background = '#10B981';
        if (modalTitle) modalTitle.textContent = 'Add Budget Category';
    }
}

function closeBudgetModal() {
    var modal = document.getElementById('budgetModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function updateColorPreview() {
    var colorInput = document.getElementById('budgetColor');
    var preview = document.getElementById('budgetColorPreview');
    if (colorInput && preview) {
        preview.style.background = colorInput.value;
    }
}

async function openEditBudgetModal(id) {
    try {
        var budget = allBudgets.find(function(b) { return b.id === id; });
        if (!budget) return;
        
        var budgetId = document.getElementById('budgetId');
        var budgetName = document.getElementById('budgetName');
        var budgetAmount = document.getElementById('budgetAmount');
        var budgetColor = document.getElementById('budgetColor');
        var colorPreview = document.getElementById('budgetColorPreview');
        var modalTitle = document.getElementById('budgetModalTitle');
        
        if (budgetId) budgetId.value = budget.id;
        if (budgetName) budgetName.value = budget.name;
        if (budgetAmount) budgetAmount.value = budget.amount;
        if (budgetColor) budgetColor.value = budget.color || '#10B981';
        if (colorPreview) colorPreview.style.background = budget.color || '#10B981';
        if (modalTitle) modalTitle.textContent = 'Edit Budget Category';
        
        var modal = document.getElementById('budgetModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    } catch (e) {
        console.error('Error opening edit modal:', e);
    }
}

// ============================================
// SAVE BUDGET
// ============================================
async function saveBudget() {
    console.log('📝 saveBudget called');
    
    var idInput = document.getElementById('budgetId');
    var nameInput = document.getElementById('budgetName');
    var amountInput = document.getElementById('budgetAmount');
    var colorInput = document.getElementById('budgetColor');
    
    var id = idInput ? idInput.value : '';
    var name = nameInput ? nameInput.value.trim() : '';
    var amount = amountInput ? parseFloat(amountInput.value) : 0;
    var color = colorInput ? colorInput.value : '#10B981';
    
    console.log('📝 Form values:', { id: id, name: name, amount: amount, color: color });
    
    if (!name) {
        alert('Please enter a category name.');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid budget amount.');
        return;
    }
    
    var saveBtn = document.querySelector('#budgetModal .btn-save');
    if (saveBtn) {
        var originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';
        saveBtn.disabled = true;
    }
    
    var success;
    try {
        if (id) {
            success = await updateBudgetInApi(parseInt(id), { name: name, amount: amount, color: color });
        } else {
            success = await saveBudgetToApi({ name: name, amount: amount, color: color });
        }
    } catch (error) {
        console.error('❌ Error in saveBudget:', error);
        success = false;
    }
    
    if (saveBtn) {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
    
    if (success) {
        closeBudgetModal();
        await renderAllBudgets();
        if (isUsingFallback) {
            showToast('Budget ' + (id ? 'updated' : 'created') + ' successfully! (Offline mode)', 'info');
        } else {
            showToast('Budget ' + (id ? 'updated' : 'created') + ' successfully!', 'success');
        }
    } else {
        alert('Failed to save budget. Please try again.');
    }
}

// ============================================
// DELETE BUDGET
// ============================================
async function deleteBudget(id) {
    if (confirm('Are you sure you want to delete this budget category?')) {
        var success = await deleteBudgetFromApi(id);
        if (success) {
            await renderAllBudgets();
            showToast('Budget deleted successfully!', 'success');
        } else {
            alert('Failed to delete budget.');
        }
    }
}

// ============================================
// RESET BUDGET CATEGORIES
// ============================================
async function resetBudgetCategories() {
    console.log('📝 resetBudgetCategories called');
    if (confirm('Reset budget categories to default?')) {
        var defaultBudgets = getDefaultBudgets();
        setFallbackBudgets(defaultBudgets);
        allBudgets = defaultBudgets;
        isUsingFallback = true;
        await renderAllBudgets();
        showToast('Budget categories reset to default!', 'success');
    }
}

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

// Add spinner CSS if not exists
if (!document.querySelector('#spinnerStyle')) {
    var style = document.createElement('style');
    style.id = 'spinnerStyle';
    style.textContent = '.spinner-sm{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(style);
}

// ============================================
// UPDATE BUDGET CHART - WITH RETRY
// ============================================
function updateBudgetChart() {
    console.log('📊 Updating budget chart with:', allBudgets);
    
    var ctx = document.getElementById('budgetChart');
    if (!ctx) {
        chartRetryCount++;
        if (chartRetryCount <= maxChartRetries) {
            console.log('❌ Budget chart canvas not found, retrying... (' + chartRetryCount + '/' + maxChartRetries + ')');
            setTimeout(function() {
                updateBudgetChart();
            }, 300);
        } else {
            console.log('⚠️ Budget chart canvas not found after ' + maxChartRetries + ' attempts. Skipping chart render.');
        }
        return;
    }
    
    // Reset retry counter on success
    chartRetryCount = 0;
    
    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }
    
    var budgets = allBudgets;
    
    if (!budgets || budgets.length === 0) {
        console.log('📊 No budgets found, showing empty chart');
        budgetChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Budgets'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#64748B'],
                    borderWidth: 2,
                    borderColor: '#1E293B'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94A3B8',
                            usePointStyle: true,
                            padding: 14,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
        return;
    }
    
    var total = budgets.reduce(function(s, c) { return s + (c.amount || 0); }, 0);
    
    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: budgets.map(function(c) { return c.name; }),
            datasets: [{
                data: budgets.map(function(c) { return c.amount || 0; }),
                backgroundColor: budgets.map(function(c) { return c.color || '#10B981'; }),
                borderWidth: 2,
                borderColor: '#1E293B'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
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
    
    // Register center text plugin
    Chart.register({
        id: 'budgetCenterText',
        afterDraw: function(chart) {
            if (chart.id !== budgetChart?.id) return;
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
    
    console.log('✅ Budget chart updated with real data');
}

// ============================================
// RENDER ALL BUDGETS
// ============================================
async function renderAllBudgets() {
    var budgets = await fetchBudgets();
    allBudgets = budgets;
    
    var totalBudget = budgets.reduce(function(sum, b) { return sum + (b.amount || 0); }, 0);
    var totalSpent = budgets.reduce(function(sum, b) { return sum + (b.spent || 0); }, 0);
    var totalRemaining = totalBudget - totalSpent;
    
    var budgetTotalEl = document.getElementById('budgetTotal');
    var budgetSpentEl = document.getElementById('budgetSpent');
    var budgetRemainingEl = document.getElementById('budgetRemaining');
    var budgetCountEl = document.getElementById('budgetCount');
    
    if (budgetTotalEl) budgetTotalEl.textContent = '₦' + totalBudget.toLocaleString();
    if (budgetSpentEl) budgetSpentEl.textContent = '₦' + totalSpent.toLocaleString();
    if (budgetRemainingEl) budgetRemainingEl.textContent = '₦' + totalRemaining.toLocaleString();
    if (budgetCountEl) budgetCountEl.textContent = budgets.length;
    
    var grid = document.getElementById('budgetGrid');
    if (!grid) {
        console.log('Budget grid element not found');
        return;
    }
    
    if (budgets.length === 0) {
        grid.innerHTML = '<div class="no-data" style="text-align:center;padding:3rem;color:#64748B;grid-column:span 3;"><i class="bi bi-pie-chart" style="font-size:3rem;display:block;margin-bottom:1rem;"></i>No budget categories yet.<br>Click "Add Budget" to create your first budget.</div>';
        updateBudgetChart();
        return;
    }
    
    var html = '';
    for (var i = 0; i < budgets.length; i++) {
        var budget = budgets[i];
        var spent = budget.spent || 0;
        var amount = budget.amount || 0;
        var percentage = amount > 0 ? (spent / amount) * 100 : 0;
        percentage = Math.min(percentage, 100);
        var isOver = spent > amount;
        
        html += '<div class="budget-card" style="position:relative;overflow:hidden;">';
        html += '<div class="budget-card-color" style="background:' + (budget.color || '#10B981') + ';"></div>';
        html += '<div class="budget-card-header">';
        html += '<div class="budget-card-title">' + escapeHtml(budget.name) + '</div>';
        html += '<div class="budget-card-actions">';
        html += '<button class="btn-edit-budget" onclick="openEditBudgetModal(' + budget.id + ')" title="Edit Budget"><i class="bi bi-pencil"></i></button>';
        html += '<button class="btn-delete-budget" onclick="deleteBudget(' + budget.id + ')" title="Delete Budget"><i class="bi bi-trash"></i></button>';
        html += '</div></div>';
        html += '<div class="budget-card-amount">₦' + amount.toLocaleString() + '</div>';
        html += '<div class="budget-card-spent">Spent: ₦' + spent.toLocaleString() + '</div>';
        html += '<div class="budget-progress-bar">';
        html += '<div class="budget-progress-fill" style="width:' + percentage + '%;background:' + (budget.color || '#10B981') + ';"></div>';
        html += '</div>';
        html += '<div class="budget-progress-label ' + (isOver ? 'over' : '') + '">' + percentage.toFixed(0) + '% used</div>';
        html += '</div>';
    }
    
    grid.innerHTML = html;
    updateBudgetChart();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.openBudgetModal = openBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.saveBudget = saveBudget;
window.deleteBudget = deleteBudget;
window.openEditBudgetModal = openEditBudgetModal;
window.resetBudgetCategories = resetBudgetCategories;
window.updateBudgetChart = updateBudgetChart;
window.renderAllBudgets = renderAllBudgets;
window.updateColorPreview = updateColorPreview;
window.budgets = {
    openModal: openBudgetModal,
    closeModal: closeBudgetModal,
    saveBudget: saveBudget,
    updateColorPreview: updateColorPreview
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Budgets page initializing...');
    setupBudgetsSidebar();
    
    while (typeof Chart === 'undefined') {
        console.log('⏳ Waiting for Chart.js to load...');
        await new Promise(function(resolve) { setTimeout(resolve, 100); });
    }
    
    await renderAllBudgets();
    console.log('Budgets page initialized with ' + allBudgets.length + ' budgets');

    var budgetModal = document.getElementById('budgetModal');
    if (budgetModal) {
        budgetModal.addEventListener('click', function(e) {
            if (e.target === this) closeBudgetModal();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeBudgetModal();
        }
    });
    
    if (isUsingFallback) {
        console.log('⚠️ Using offline/fallback mode for budgets');
    }
});

// ============================================
// BUDGETS INIT FUNCTION - EXPOSE FOR BLAZOR
// ============================================
window.initBudgetsPage = async function() {
    console.log('🔄 budgets: init called from Blazor');
    setupBudgetsSidebar();
    await renderAllBudgets();
    console.log('✅ budgets: initialized');
};

window.renderAllBudgets = renderAllBudgets;

console.log('✅ Budgets JS: Fully loaded and ready');