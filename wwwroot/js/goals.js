// ============================================
// SMARTBUDGET GOALS PAGE
// Full CRUD with Database Persistence via API
// ============================================
console.log('Goals JS: Loaded');

var currentPage = 1;
var itemsPerPage = 6;
var allGoals = [];

// ============================================
// SIDEBAR SETUP
// ============================================
function setupGoalsSidebar() {
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
            closeGoalsSidebar();
        };
    }

    overlay.onclick = function() {
        closeGoalsSidebar();
    };

    sidebar.querySelectorAll('.nav-item').forEach(function(link) {
        link.addEventListener('click', function() {
            closeGoalsSidebar();
        });
    });
}

function closeGoalsSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================
// API CALLS
// ============================================
async function fetchGoals() {
    try {
        var response = await fetch('/api/goals');
        if (!response.ok) {
            console.error('Failed to fetch goals:', response.status);
            return [];
        }
        var data = await response.json();
        if (data.success && data.goals) {
            allGoals = data.goals;
            return allGoals;
        }
        return [];
    } catch (e) {
        console.error('Error fetching goals:', e);
        return [];
    }
}

async function saveGoalToApi(goal) {
    try {
        var body = {
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount || 0,
            color: goal.color || '#10B981',
            icon: goal.icon || 'bi-flag',
            targetDate: goal.targetDate || new Date().toISOString().split('T')[0]
        };
        
        console.log('Saving goal:', body);
        
        var response = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        var data = await response.json();
        console.log('Save response:', data);
        
        return data.success === true;
    } catch (e) {
        console.error('Error saving goal:', e);
        return false;
    }
}

async function updateGoalInApi(id, goal) {
    try {
        var body = {
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount || 0,
            color: goal.color || '#10B981',
            icon: goal.icon || 'bi-flag',
            targetDate: goal.targetDate
        };
        
        var response = await fetch('/api/goals/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        var data = await response.json();
        return data.success === true;
    } catch (e) {
        console.error('Error updating goal:', e);
        return false;
    }
}

async function deleteGoalFromApi(id) {
    try {
        var response = await fetch('/api/goals/' + id, { method: 'DELETE' });
        var data = await response.json();
        return data.success === true;
    } catch (e) {
        console.error('Error deleting goal:', e);
        return false;
    }
}

// ============================================
// MODAL HANDLERS
// ============================================
function openGoalModal() {
    var modal = document.getElementById('goalModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Clear form
        document.getElementById('goalId').value = '';
        document.getElementById('goalName').value = '';
        document.getElementById('goalTargetAmount').value = '';
        document.getElementById('goalCurrentAmount').value = '0';
        document.getElementById('goalTargetDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('goalColor').value = '#10B981';
        document.getElementById('goalIcon').value = 'bi-flag';
        
        document.getElementById('goalModalTitle').textContent = 'Add Savings Goal';
    }
}

function closeGoalModal() {
    var modal = document.getElementById('goalModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function openEditGoalModal(id) {
    try {
        var goal = allGoals.find(function(g) { return g.id === id; });
        if (!goal) return;
        
        document.getElementById('goalId').value = goal.id;
        document.getElementById('goalName').value = goal.name;
        document.getElementById('goalTargetAmount').value = goal.targetAmount;
        document.getElementById('goalCurrentAmount').value = goal.currentAmount || 0;
        document.getElementById('goalTargetDate').value = goal.targetDate ? goal.targetDate.split('T')[0] : new Date().toISOString().split('T')[0];
        document.getElementById('goalColor').value = goal.color || '#10B981';
        document.getElementById('goalIcon').value = goal.icon || 'bi-flag';
        
        document.getElementById('goalModalTitle').textContent = 'Edit Savings Goal';
        document.getElementById('goalModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch (e) {
        console.error('Error opening edit modal:', e);
    }
}

// ============================================
// ADD SAVINGS
// ============================================
async function addToGoal(goalId) {
    var goal = allGoals.find(function(g) { return g.id === goalId; });
    if (!goal) return;
    
    var amount = prompt('Enter amount to add to ' + goal.name + ':', '0');
    if (amount === null) return;
    
    var addAmount = parseFloat(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    var newAmount = (goal.currentAmount || 0) + addAmount;
    
    var success = await updateGoalInApi(goalId, {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: newAmount,
        color: goal.color,
        icon: goal.icon,
        targetDate: goal.targetDate
    });
    
    if (success) {
        await renderAllGoals();
        showToast('Added ₦' + addAmount.toLocaleString() + ' to ' + goal.name, 'success');
    } else {
        alert('Failed to add to goal.');
    }
}

// ============================================
// SAVE GOAL
// ============================================
async function saveGoal() {
    var id = document.getElementById('goalId').value;
    var name = document.getElementById('goalName').value.trim();
    var targetAmount = parseFloat(document.getElementById('goalTargetAmount').value);
    var currentAmount = parseFloat(document.getElementById('goalCurrentAmount').value) || 0;
    var color = document.getElementById('goalColor').value;
    var icon = document.getElementById('goalIcon').value;
    var targetDate = document.getElementById('goalTargetDate').value;
    
    if (!name) {
        alert('Please enter a goal name.');
        return;
    }
    
    if (!targetAmount || targetAmount <= 0) {
        alert('Please enter a valid target amount.');
        return;
    }
    
    var saveBtn = document.querySelector('#goalModal .btn-save');
    var originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';
    saveBtn.disabled = true;
    
    var success;
    if (id) {
        success = await updateGoalInApi(id, {
            name: name,
            targetAmount: targetAmount,
            currentAmount: currentAmount,
            color: color,
            icon: icon,
            targetDate: targetDate
        });
    } else {
        success = await saveGoalToApi({
            name: name,
            targetAmount: targetAmount,
            currentAmount: currentAmount,
            color: color,
            icon: icon,
            targetDate: targetDate
        });
    }
    
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
    
    if (success) {
        closeGoalModal();
        await renderAllGoals();
        showToast(id ? 'Goal updated successfully!' : 'Goal created successfully!', 'success');
    } else {
        alert('Failed to save goal. Please try again.');
    }
}

// ============================================
// DELETE GOAL
// ============================================
async function deleteGoal(id) {
    if (confirm('Are you sure you want to delete this goal?')) {
        var success = await deleteGoalFromApi(id);
        if (success) {
            await renderAllGoals();
            showToast('Goal deleted successfully!', 'success');
        } else {
            alert('Failed to delete goal.');
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

// Add spinner CSS
if (!document.querySelector('#spinnerStyle')) {
    var style = document.createElement('style');
    style.id = 'spinnerStyle';
    style.textContent = '.spinner-sm{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(style);
}

// ============================================
// RENDER ALL GOALS
// ============================================
async function renderAllGoals() {
    var goals = await fetchGoals();
    
    // Update stats - Check if elements exist before setting
    var totalTargetEl = document.getElementById('goalTotalTarget');
    var totalSavedEl = document.getElementById('goalTotalSaved');
    var totalCountEl = document.getElementById('goalTotalCount');
    var completedEl = document.getElementById('goalCompleted');
    
    if (totalTargetEl) {
        var totalTarget = goals.reduce(function(sum, g) { return sum + g.targetAmount; }, 0);
        totalTargetEl.textContent = '₦' + totalTarget.toLocaleString();
    }
    
    if (totalSavedEl) {
        var totalSaved = goals.reduce(function(sum, g) { return sum + (g.currentAmount || 0); }, 0);
        totalSavedEl.textContent = '₦' + totalSaved.toLocaleString();
    }
    
    if (totalCountEl) {
        totalCountEl.textContent = goals.length;
    }
    
    if (completedEl) {
        var completed = goals.filter(function(g) { return g.isCompleted === true; }).length;
        completedEl.textContent = completed;
    }
    
    // Render goals grid
    var grid = document.getElementById('goalsGrid');
    if (!grid) return;
    
    if (goals.length === 0) {
        grid.innerHTML = '<div class="no-data" style="grid-column:span 3;text-align:center;padding:3rem;color:#64748B;"><i class="bi bi-flag" style="font-size:3rem;display:block;margin-bottom:1rem;"></i>No savings goals yet.<br>Click "Add Goal" to create your first goal.</div>';
        return;
    }
    
    grid.innerHTML = goals.map(function(goal) {
        var percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        percentage = Math.min(percentage, 100);
        var isCompleted = goal.isCompleted === true;
        var statusClass = isCompleted ? 'completed' : '';
        var targetDate = goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No deadline';
        
        return `
            <div class="goal-card ${statusClass}" style="position:relative;overflow:hidden;">
                <div class="goal-card-color" style="background:${goal.color}"></div>
                ${isCompleted ? '<div class="goal-completed-badge">Completed!</div>' : ''}
                <div class="goal-card-header">
                    <div class="goal-card-icon" style="background:${goal.color}20;color:${goal.color}">
                        <i class="bi ${goal.icon}"></i>
                    </div>
                    <div class="goal-card-actions">
                        <button class="btn-edit-goal" onclick="openEditGoalModal(${goal.id})" title="Edit Goal"><i class="bi bi-pencil"></i></button>
                        <button class="btn-delete-goal" onclick="deleteGoal(${goal.id})" title="Delete Goal"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
                <div class="goal-card-title">${escapeHtml(goal.name)}</div>
                <div class="goal-card-amounts">
                    <div class="goal-card-saved">₦${(goal.currentAmount || 0).toLocaleString()}</div>
                    <div class="goal-card-target">of ₦${goal.targetAmount.toLocaleString()}</div>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width:${percentage}%;background:${goal.color}"></div>
                </div>
                <div class="goal-progress-label">${percentage.toFixed(0)}% Complete</div>
                <div class="goal-card-date"><i class="bi bi-calendar3"></i> ${targetDate}</div>
                ${!isCompleted ? `<button class="btn-add-saving" onclick="addToGoal(${goal.id})"><i class="bi bi-plus-lg"></i> Add Savings</button>` : ''}
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

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Goals page initializing...');
    setupGoalsSidebar();
    
    // Wait for DOM elements to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await renderAllGoals();
    console.log('Goals page initialized');

    // Close modal on overlay click
    var goalModal = document.getElementById('goalModal');
    if (goalModal) {
        goalModal.addEventListener('click', function(e) {
            if (e.target === this) closeGoalModal();
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeGoalModal();
        }
    });
});

// Make functions global
window.openGoalModal = openGoalModal;
window.closeGoalModal = closeGoalModal;
window.saveGoal = saveGoal;
window.deleteGoal = deleteGoal;
window.openEditGoalModal = openEditGoalModal;
window.addToGoal = addToGoal;

// ============================================
// GOALS INIT FUNCTION - EXPOSE FOR BLAZOR
// ============================================
window.initGoalsPage = async function() {
    console.log('🔄 goals: init called from Blazor');
    setupGoalsSidebar();
    await renderAllGoals();
    console.log('✅ goals: initialized');
};

window.renderAllGoals = renderAllGoals;