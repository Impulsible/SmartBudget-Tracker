// ============================================
// SMARTBUDGET GOALS PAGE - Full CRUD with API
// FIXED: API endpoints and error handling
// ============================================
console.log('Goals JS: Loaded (Fixed)');

var currentPage = 1;
var itemsPerPage = 6;
var allGoals = [];
var isUsingFallback = false;

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
}

function closeGoalsSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================
// FALLBACK STORAGE - LocalStorage
// ============================================
function getFallbackGoals() {
    try {
        var stored = localStorage.getItem('smartbudget_goals_fallback');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.log('Fallback read error:', e);
    }
    return null;
}

function setFallbackGoals(goals) {
    try {
        localStorage.setItem('smartbudget_goals_fallback', JSON.stringify(goals));
    } catch (e) {
        console.log('Fallback write error:', e);
    }
}

function getDefaultGoals() {
    return [
        { 
            id: 1, 
            name: "Emergency Fund", 
            targetAmount: 500000, 
            currentAmount: 50000, 
            color: "#10B981", 
            icon: "bi-shield-check",
            targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isCompleted: false
        },
        { 
            id: 2, 
            name: "New Laptop", 
            targetAmount: 350000, 
            currentAmount: 150000, 
            color: "#3B82F6", 
            icon: "bi-laptop",
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isCompleted: false
        }
    ];
}

// ============================================
// API CALLS
// ============================================
async function fetchGoals() {
    try {
        console.log('🔍 Fetching goals from API...');
        var response = await fetch('/api/goals', {
            credentials: 'include'
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.status === 401) {
            console.log('❌ Not authenticated - using fallback');
            isUsingFallback = true;
            var fallbackData = getFallbackGoals();
            if (fallbackData && fallbackData.length > 0) {
                allGoals = fallbackData;
                return allGoals;
            }
            allGoals = getDefaultGoals();
            setFallbackGoals(allGoals);
            return allGoals;
        }
        
        if (!response.ok) {
            console.log('❌ Goals API returned:', response.status);
            var fallbackData = getFallbackGoals();
            if (fallbackData && fallbackData.length > 0) {
                console.log('📂 Using fallback data');
                allGoals = fallbackData;
                isUsingFallback = true;
                return allGoals;
            }
            allGoals = getDefaultGoals();
            setFallbackGoals(allGoals);
            return allGoals;
        }
        
        var data = await response.json();
        console.log('✅ Goals response:', data);
        
        if (data.success && data.goals && data.goals.length > 0) {
            allGoals = data.goals;
            setFallbackGoals(allGoals);
            isUsingFallback = false;
            console.log('✅ Loaded ' + allGoals.length + ' goals from API');
        } else {
            var fallbackData = getFallbackGoals();
            if (fallbackData && fallbackData.length > 0) {
                console.log('📂 Using fallback data (no API data)');
                allGoals = fallbackData;
                isUsingFallback = true;
            } else {
                allGoals = getDefaultGoals();
                setFallbackGoals(allGoals);
            }
        }
        return allGoals;
    } catch (e) {
        console.error('❌ Error fetching goals:', e);
        var fallbackData = getFallbackGoals();
        if (fallbackData && fallbackData.length > 0) {
            console.log('📂 Using fallback data (network error)');
            allGoals = fallbackData;
            isUsingFallback = true;
            return allGoals;
        }
        allGoals = getDefaultGoals();
        setFallbackGoals(allGoals);
        return allGoals;
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
        
        console.log('📤 Saving goal to API:', JSON.stringify(body, null, 2));
        
        var response = await fetch('/api/goals', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            var errorText = await response.text();
            console.log('⚠️ API save failed with status:', response.status, errorText);
            // Save to fallback
            var fallbackGoals = getFallbackGoals() || [];
            var newGoal = { 
                id: Date.now(), 
                name: goal.name, 
                targetAmount: goal.targetAmount, 
                currentAmount: goal.currentAmount || 0, 
                color: goal.color || '#10B981', 
                icon: goal.icon || 'bi-flag',
                targetDate: goal.targetDate || new Date().toISOString().split('T')[0],
                isCompleted: false
            };
            fallbackGoals.push(newGoal);
            setFallbackGoals(fallbackGoals);
            allGoals = fallbackGoals;
            isUsingFallback = true;
            showToast('Goal saved locally (offline mode)', 'info');
            return true;
        }
        
        var data = await response.json();
        console.log('✅ Response data:', data);
        
        if (data.success === true) {
            await fetchGoals();
            return true;
        } else {
            // Save to fallback
            var fallbackGoals = getFallbackGoals() || [];
            var newGoal = { 
                id: Date.now(), 
                name: goal.name, 
                targetAmount: goal.targetAmount, 
                currentAmount: goal.currentAmount || 0, 
                color: goal.color || '#10B981', 
                icon: goal.icon || 'bi-flag',
                targetDate: goal.targetDate || new Date().toISOString().split('T')[0],
                isCompleted: false
            };
            fallbackGoals.push(newGoal);
            setFallbackGoals(fallbackGoals);
            allGoals = fallbackGoals;
            isUsingFallback = true;
            showToast('Goal saved locally (offline mode)', 'info');
            return true;
        }
    } catch (e) {
        console.error('❌ Error saving goal:', e);
        // Save to fallback
        var fallbackGoals = getFallbackGoals() || [];
        var newGoal = { 
            id: Date.now(), 
            name: goal.name, 
            targetAmount: goal.targetAmount, 
            currentAmount: goal.currentAmount || 0, 
            color: goal.color || '#10B981', 
            icon: goal.icon || 'bi-flag',
            targetDate: goal.targetDate || new Date().toISOString().split('T')[0],
            isCompleted: false
        };
        fallbackGoals.push(newGoal);
        setFallbackGoals(fallbackGoals);
        allGoals = fallbackGoals;
        isUsingFallback = true;
        showToast('Goal saved locally (offline mode)', 'info');
        return true;
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
        
        console.log('📤 Updating goal in API:', id, JSON.stringify(body, null, 2));
        
        var response = await fetch('/api/goals/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            console.log('⚠️ API update failed with status:', response.status);
            // Update in fallback
            var fallbackGoals = getFallbackGoals() || [];
            var index = fallbackGoals.findIndex(function(g) { return g.id === id; });
            if (index !== -1) {
                fallbackGoals[index].name = goal.name;
                fallbackGoals[index].targetAmount = goal.targetAmount;
                fallbackGoals[index].currentAmount = goal.currentAmount || 0;
                fallbackGoals[index].color = goal.color || '#10B981';
                fallbackGoals[index].icon = goal.icon || 'bi-flag';
                fallbackGoals[index].targetDate = goal.targetDate;
                fallbackGoals[index].isCompleted = fallbackGoals[index].currentAmount >= fallbackGoals[index].targetAmount;
                setFallbackGoals(fallbackGoals);
                allGoals = fallbackGoals;
                isUsingFallback = true;
            }
            return true;
        }
        
        var data = await response.json();
        console.log('✅ Update response:', data);
        
        if (data.success === true) {
            await fetchGoals();
            return true;
        } else {
            // Update in fallback
            var fallbackGoals = getFallbackGoals() || [];
            var index = fallbackGoals.findIndex(function(g) { return g.id === id; });
            if (index !== -1) {
                fallbackGoals[index].name = goal.name;
                fallbackGoals[index].targetAmount = goal.targetAmount;
                fallbackGoals[index].currentAmount = goal.currentAmount || 0;
                fallbackGoals[index].color = goal.color || '#10B981';
                fallbackGoals[index].icon = goal.icon || 'bi-flag';
                fallbackGoals[index].targetDate = goal.targetDate;
                fallbackGoals[index].isCompleted = fallbackGoals[index].currentAmount >= fallbackGoals[index].targetAmount;
                setFallbackGoals(fallbackGoals);
                allGoals = fallbackGoals;
                isUsingFallback = true;
            }
            return true;
        }
    } catch (e) {
        console.error('❌ Error updating goal:', e);
        // Update in fallback
        var fallbackGoals = getFallbackGoals() || [];
        var index = fallbackGoals.findIndex(function(g) { return g.id === id; });
        if (index !== -1) {
            fallbackGoals[index].name = goal.name;
            fallbackGoals[index].targetAmount = goal.targetAmount;
            fallbackGoals[index].currentAmount = goal.currentAmount || 0;
            fallbackGoals[index].color = goal.color || '#10B981';
            fallbackGoals[index].icon = goal.icon || 'bi-flag';
            fallbackGoals[index].targetDate = goal.targetDate;
            fallbackGoals[index].isCompleted = fallbackGoals[index].currentAmount >= fallbackGoals[index].targetAmount;
            setFallbackGoals(fallbackGoals);
            allGoals = fallbackGoals;
            isUsingFallback = true;
        }
        return true;
    }
}

async function deleteGoalFromApi(id) {
    try {
        var response = await fetch('/api/goals/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.log('⚠️ API delete failed with status:', response.status);
            // Delete from fallback
            var fallbackGoals = getFallbackGoals() || [];
            fallbackGoals = fallbackGoals.filter(function(g) { return g.id !== id; });
            setFallbackGoals(fallbackGoals);
            allGoals = fallbackGoals;
            isUsingFallback = true;
            return true;
        }
        
        var data = await response.json();
        if (data.success === true) {
            await fetchGoals();
            return true;
        } else {
            // Delete from fallback
            var fallbackGoals = getFallbackGoals() || [];
            fallbackGoals = fallbackGoals.filter(function(g) { return g.id !== id; });
            setFallbackGoals(fallbackGoals);
            allGoals = fallbackGoals;
            isUsingFallback = true;
            return true;
        }
    } catch (e) {
        console.error('❌ Error deleting goal:', e);
        var fallbackGoals = getFallbackGoals() || [];
        fallbackGoals = fallbackGoals.filter(function(g) { return g.id !== id; });
        setFallbackGoals(fallbackGoals);
        allGoals = fallbackGoals;
        isUsingFallback = true;
        return true;
    }
}

// ============================================
// MODAL HANDLERS
// ============================================
function openGoalModal() {
    console.log('📝 openGoalModal called');
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
        if (!goal) {
            console.error('Goal not found:', id);
            return;
        }
        
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
// ADD SAVINGS TO GOAL
// ============================================
async function addToGoal(goalId) {
    var goal = allGoals.find(function(g) { return g.id === goalId; });
    if (!goal) {
        console.error('Goal not found:', goalId);
        return;
    }
    
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
    console.log('📝 saveGoal called');
    
    var idInput = document.getElementById('goalId');
    var nameInput = document.getElementById('goalName');
    var targetInput = document.getElementById('goalTargetAmount');
    var currentInput = document.getElementById('goalCurrentAmount');
    var colorInput = document.getElementById('goalColor');
    var iconInput = document.getElementById('goalIcon');
    var dateInput = document.getElementById('goalTargetDate');
    
    var id = idInput ? idInput.value : '';
    var name = nameInput ? nameInput.value.trim() : '';
    var targetAmount = targetInput ? parseFloat(targetInput.value) : 0;
    var currentAmount = currentInput ? parseFloat(currentInput.value) || 0 : 0;
    var color = colorInput ? colorInput.value : '#10B981';
    var icon = iconInput ? iconInput.value : 'bi-flag';
    var targetDate = dateInput ? dateInput.value : '';
    
    console.log('📋 Form values:', { id, name, targetAmount, currentAmount, color, icon, targetDate });
    
    if (!name) {
        alert('Please enter a goal name.');
        return;
    }
    
    if (!targetAmount || targetAmount <= 0) {
        alert('Please enter a valid target amount.');
        return;
    }
    
    var saveBtn = document.querySelector('#goalModal .btn-save');
    if (saveBtn) {
        var originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';
        saveBtn.disabled = true;
    }
    
    var success;
    try {
        if (id) {
            success = await updateGoalInApi(parseInt(id), {
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
    } catch (error) {
        console.error('❌ Error in saveGoal:', error);
        success = false;
    }
    
    if (saveBtn) {
        saveBtn.innerHTML = originalText || 'Save Goal';
        saveBtn.disabled = false;
    }
    
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
    var iconColor = type === 'success' ? '#10B981' : (type === 'info' ? '#3B82F6' : '#EF4444');
    var icon = type === 'success' ? 'check-circle-fill' : (type === 'info' ? 'info-circle-fill' : 'exclamation-triangle-fill');
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + iconColor + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;color:white;';
    toast.innerHTML = '<i class="bi bi-' + icon + '" style="color:' + iconColor + '"></i><span>' + message + '</span>';
    
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
    allGoals = goals;
    
    // Update stats
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

console.log('✅ Goals JS: Fully loaded and ready');