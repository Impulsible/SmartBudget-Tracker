// ============================================
// SMARTBUDGET BUDGETS PAGE - FIXED FOR RENDER
// ============================================
console.log('Budgets JS: Loaded');

var allBudgets = [];
var budgetChart = null;

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
// API CALLS
// ============================================
async function fetchBudgets() {
    try {
        console.log('🔍 Fetching budgets...');
        var response = await fetch('/api/budgets', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            console.log('❌ Budgets API returned:', response.status);
            return getDemoBudgets();
        }
        
        var data = await response.json();
        console.log('✅ Budgets response:', data);
        
        if (data.success && data.budgets && data.budgets.length > 0) {
            allBudgets = data.budgets;
            return allBudgets;
        }
        return getDemoBudgets();
    } catch (e) {
        console.error('❌ Error fetching budgets:', e);
        return getDemoBudgets();
    }
}

function getDemoBudgets() {
    return [
        { id: 1, name: "Food", amount: 65000, color: "#10B981", spent: 42000 },
        { id: 2, name: "Transport", amount: 35000, color: "#3B82F6", spent: 28000 },
        { id: 3, name: "Shopping", amount: 45000, color: "#F59E0B", spent: 31000 },
        { id: 4, name: "Bills", amount: 30000, color: "#EF4444", spent: 29000 },
        { id: 5, name: "Entertainment", amount: 20000, color: "#8B5CF6", spent: 15000 },
        { id: 6, name: "Other", amount: 15000, color: "#64748B", spent: 5000 }
    ];
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
        
        var data = await response.json();
        console.log('✅ Response data:', data);
        
        return data.success === true;
    } catch (e) {
        console.error('❌ Error saving budget:', e);
        return false;
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
        
        var data = await response.json();
        console.log('✅ Update response:', data);
        
        return data.success === true;
    } catch (e) {
        console.error('❌ Error updating budget:', e);
        return false;
    }
}

async function deleteBudgetFromApi(id) {
    try {
        var response = await fetch('/api/budgets/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        var data = await response.json();
        return data.success === true;
    } catch (e) {
        console.error('❌ Error deleting budget:', e);
        return false;
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
// SAVE BUDGET - FIXED
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
    
    console.log('📝 Form values:', { id, name, amount, color });
    
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
    if (id) {
        success = await updateBudgetInApi(id, { name: name, amount: amount, color: color });
    } else {
        success = await saveBudgetToApi({ name: name, amount: amount, color: color });
    }
    
    if (saveBtn) {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
    
    if (success) {
        closeBudgetModal();
        await renderAllBudgets();
        // ✅ FIX: Update the chart after saving
        updateBudgetChart();
        showToast(id ? 'Budget updated successfully!' : 'Budget created successfully!', 'success');
    } else {
        alert('Failed to save budget. Please check console for errors.');
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
            // ✅ FIX: Update the chart after deleting
            updateBudgetChart();
            showToast('Budget deleted successfully!', 'success');
        } else {
            alert('Failed to delete budget.');
        }
    }
}

// ============================================
// RESET BUDGET CATEGORIES
// ============================================
function resetBudgetCategories() {
    console.log('📝 resetBudgetCategories called');
    if (confirm('Reset budget categories to default?')) {
        // ✅ FIX: Update the chart after resetting
        updateBudgetChart();
        renderAllBudgets();
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
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + (type === 'success' ? '#10B981' : '#EF4444') + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;color:white;';
    toast.innerHTML = '<i class="bi bi-' + (type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill') + '" style="color:' + (type === 'success' ? '#10B981' : '#EF4444') + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// ============================================
// UPDATE BUDGET CHART - FIXED
// ============================================
function updateBudgetChart() {
    console.log('📊 Updating budget chart with:', allBudgets);
    
    var ctx = document.getElementById('budgetChart');
    if (!ctx) {
        console.log('❌ Budget chart canvas not found');
        return;
    }
    
    // If chart exists, destroy it
    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }
    
    // Get budget data
    var budgets = allBudgets.length > 0 ? allBudgets : getDemoBudgets();
    var total = budgets.reduce(function(s, c) { return s + c.amount; }, 0);
    
    // Create new chart
    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: budgets.map(function(c) { return c.name; }),
            datasets: [{
                data: budgets.map(function(c) { return c.amount; }),
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
    
    // Add center text
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
    
    console.log('✅ Budget chart updated successfully');
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
        return;
    }
    
    grid.innerHTML = budgets.map(function(budget) {
        var spent = budget.spent || 0;
        var amount = budget.amount || 0;
        var percentage = amount > 0 ? (spent / amount) * 100 : 0;
        percentage = Math.min(percentage, 100);
        var isOver = spent > amount;
        
        return `
            <div class="budget-card" style="position:relative;overflow:hidden;">
                <div class="budget-card-color" style="background:${budget.color || '#10B981'}"></div>
                <div class="budget-card-header">
                    <div class="budget-card-title">${escapeHtml(budget.name)}</div>
                    <div class="budget-card-actions">
                        <button class="btn-edit-budget" onclick="openEditBudgetModal(${budget.id})" title="Edit Budget"><i class="bi bi-pencil"></i></button>
                        <button class="btn-delete-budget" onclick="deleteBudget(${budget.id})" title="Delete Budget"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
                <div class="budget-card-amount">₦${(amount).toLocaleString()}</div>
                <div class="budget-card-spent">Spent: ₦${spent.toLocaleString()}</div>
                <div class="budget-progress-bar">
                    <div class="budget-progress-fill" style="width:${percentage}%;background:${budget.color || '#10B981'}"></div>
                </div>
                <div class="budget-progress-label ${isOver ? 'over' : ''}">${percentage.toFixed(0)}% used</div>
            </div>
        `;
    }).join('');
    
    // ✅ FIX: Update the chart after rendering
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

// Add spinner CSS if not exists
if (!document.querySelector('#spinnerStyle')) {
    var style = document.createElement('style');
    style.id = 'spinnerStyle';
    style.textContent = '.spinner-sm{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(style);
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

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Budgets page initializing...');
    setupBudgetsSidebar();
    
    // ✅ Wait for Chart.js to load
    while (typeof Chart === 'undefined') {
        console.log('⏳ Waiting for Chart.js to load...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setTimeout(async function() {
        await renderAllBudgets();
        console.log('Budgets page initialized');
    }, 200);

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
});