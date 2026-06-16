// ============================================
// SMARTBUDGET BUDGETS PAGE
// Full CRUD with Database Persistence via API
// ============================================
console.log('Budgets JS: Loaded');

var allBudgets = [];

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
        var response = await fetch('/api/budgets');
        if (!response.ok) {
            console.log('Budgets API not available, using demo data');
            return getDemoBudgets();
        }
        var data = await response.json();
        if (data.success && data.budgets && data.budgets.length > 0) {
            allBudgets = data.budgets;
            return allBudgets;
        }
        return getDemoBudgets();
    } catch (e) {
        console.error('Error fetching budgets:', e);
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
        var response = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: budget.name,
                amount: budget.amount,
                color: budget.color,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            })
        });
        var data = await response.json();
        return data.success === true;
    } catch (e) {
        console.error('Error saving budget:', e);
        return false;
    }
}

async function updateBudgetInApi(id, budget) {
    try {
        var response = await fetch('/api/budgets/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: budget.name,
                amount: budget.amount,
                color: budget.color
            })
        });
        var data = await response.json();
        return data.success === true;
    } catch (e) {
        console.error('Error updating budget:', e);
        return false;
    }
}

async function deleteBudgetFromApi(id) {
    try {
        var response = await fetch('/api/budgets/' + id, { method: 'DELETE' });
        var data = await response.json();
        return data.success === true;
    } catch (e) {
        console.error('Error deleting budget:', e);
        return false;
    }
}

// ============================================
// MODAL HANDLERS
// ============================================
function openBudgetModal() {
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
// SAVE BUDGET
// ============================================
async function saveBudget() {
    var idInput = document.getElementById('budgetId');
    var nameInput = document.getElementById('budgetName');
    var amountInput = document.getElementById('budgetAmount');
    var colorInput = document.getElementById('budgetColor');
    
    var id = idInput ? idInput.value : '';
    var name = nameInput ? nameInput.value.trim() : '';
    var amount = amountInput ? parseFloat(amountInput.value) : 0;
    var color = colorInput ? colorInput.value : '#10B981';
    
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
        showToast(id ? 'Budget updated successfully!' : 'Budget created successfully!', 'success');
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
// RENDER ALL BUDGETS
// ============================================
async function renderAllBudgets() {
    var budgets = await fetchBudgets();
    
    // Calculate stats - Check if elements exist before setting
    var totalBudget = budgets.reduce(function(sum, b) { return sum + (b.amount || 0); }, 0);
    var totalSpent = budgets.reduce(function(sum, b) { return sum + (b.spent || 0); }, 0);
    var totalRemaining = totalBudget - totalSpent;
    
    // Safely get elements and set values
    var budgetTotalEl = document.getElementById('budgetTotal');
    var budgetSpentEl = document.getElementById('budgetSpent');
    var budgetRemainingEl = document.getElementById('budgetRemaining');
    var budgetCountEl = document.getElementById('budgetCount');
    
    if (budgetTotalEl) budgetTotalEl.textContent = '₦' + totalBudget.toLocaleString();
    if (budgetSpentEl) budgetSpentEl.textContent = '₦' + totalSpent.toLocaleString();
    if (budgetRemainingEl) budgetRemainingEl.textContent = '₦' + totalRemaining.toLocaleString();
    if (budgetCountEl) budgetCountEl.textContent = budgets.length;
    
    // Render budget grid
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
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Budgets page initializing...');
    setupBudgetsSidebar();
    
    // Small delay to ensure DOM is ready
    setTimeout(async function() {
        await renderAllBudgets();
        console.log('Budgets page initialized');
    }, 200);

    // Close modal on overlay click
    var budgetModal = document.getElementById('budgetModal');
    if (budgetModal) {
        budgetModal.addEventListener('click', function(e) {
            if (e.target === this) closeBudgetModal();
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeBudgetModal();
        }
    });
});

// Make functions global
window.openBudgetModal = openBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.saveBudget = saveBudget;
window.deleteBudget = deleteBudget;
window.openEditBudgetModal = openEditBudgetModal;