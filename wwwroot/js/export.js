// ============================================
// SMARTBUDGET - EXPORT PAGE
// ============================================
console.log('📤 Export JS: Loaded');

// ============================================
// SIDEBAR SETUP
// ============================================
function setupExportSidebar() {
    var toggleBtn = document.getElementById('sidebarToggleBtn');
    var closeBtn = document.getElementById('sidebarCloseBtn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');

    if (!toggleBtn || !sidebar || !overlay) return;

    var newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
    
    newToggleBtn.onclick = function() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    if (closeBtn) {
        var newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = function() {
            closeExportSidebar();
        };
    }

    overlay.onclick = function() {
        closeExportSidebar();
    };
}

function closeExportSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
    
    var icon = type === 'error' ? 'exclamation-circle' : 'check-circle';
    toast.innerHTML = '<i class="bi bi-' + icon + '"></i> ' + message;
    
    container.appendChild(toast);
    
    setTimeout(function() {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

// Export Transactions as CSV
window.exportTransactionsCSV = function() {
    console.log('📊 Exporting transactions...');
    showToast('Generating transactions export...', 'success');
    
    try {
        // Get filter values
        var dateRange = document.getElementById('txDateRange')?.value || 'all';
        var typeFilter = document.getElementById('txTypeFilter')?.value || 'all';
        
        // Get transactions from localStorage or API
        var transactions = getTransactions();
        
        // Apply filters
        if (dateRange !== 'all') {
            var now = new Date();
            var cutoff = new Date();
            if (dateRange === 'month') cutoff.setDate(now.getDate() - 30);
            else if (dateRange === 'quarter') cutoff.setDate(now.getDate() - 90);
            else if (dateRange === 'year') cutoff.setDate(now.getDate() - 365);
            
            transactions = transactions.filter(function(t) {
                var date = new Date(t.date);
                return date >= cutoff;
            });
        }
        
        if (typeFilter !== 'all') {
            transactions = transactions.filter(function(t) {
                return t.type === typeFilter;
            });
        }
        
        if (transactions.length === 0) {
            showToast('No transactions to export', 'error');
            return;
        }
        
        // Convert to CSV
        var csv = 'Description,Category,Date,Amount,Type,Status\n';
        transactions.forEach(function(t) {
            var date = new Date(t.date).toLocaleDateString();
            csv += '"' + (t.title || t.description || 'Unknown') + '",';
            csv += '"' + (t.category || 'Other') + '",';
            csv += '"' + date + '",';
            csv += t.amount + ',';
            csv += t.type + ',';
            csv += (t.status || 'Completed') + '\n';
        });
        
        // Download
        downloadCSV(csv, 'transactions_export.csv');
        showToast('Transactions exported successfully!', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showToast('Error exporting transactions: ' + e.message, 'error');
    }
};

// Export Budgets as CSV
window.exportBudgetsCSV = function() {
    console.log('📊 Exporting budgets...');
    showToast('Generating budgets export...', 'success');
    
    try {
        var year = document.getElementById('budgetYear')?.value || new Date().getFullYear();
        var budgets = getBudgets();
        
        if (budgets.length === 0) {
            showToast('No budgets to export', 'error');
            return;
        }
        
        // Convert to CSV
        var csv = 'Category,Budget Amount,Spent,Remaining,Progress (%)\n';
        budgets.forEach(function(b) {
            var spent = b.spent || 0;
            var remaining = b.amount - spent;
            var progress = b.amount > 0 ? ((spent / b.amount) * 100).toFixed(1) : 0;
            csv += '"' + b.name + '",';
            csv += b.amount + ',';
            csv += spent + ',';
            csv += remaining + ',';
            csv += progress + '\n';
        });
        
        downloadCSV(csv, 'budgets_export_' + year + '.csv');
        showToast('Budgets exported successfully!', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showToast('Error exporting budgets: ' + e.message, 'error');
    }
};

// Export Goals as CSV
window.exportGoalsCSV = function() {
    console.log('📊 Exporting goals...');
    showToast('Generating goals export...', 'success');
    
    try {
        var status = document.getElementById('goalStatus')?.value || 'all';
        var goals = getGoals();
        
        // Apply status filter
        if (status !== 'all') {
            goals = goals.filter(function(g) {
                if (status === 'active') return g.current < g.target;
                if (status === 'completed') return g.current >= g.target;
                return true;
            });
        }
        
        if (goals.length === 0) {
            showToast('No goals to export', 'error');
            return;
        }
        
        // Convert to CSV
        var csv = 'Goal,Target Amount,Current Amount,Progress (%),Target Date,Status\n';
        goals.forEach(function(g) {
            var progress = g.target > 0 ? ((g.current / g.target) * 100).toFixed(1) : 0;
            var targetDate = g.targetDate ? new Date(g.targetDate).toLocaleDateString() : 'Not set';
            var status = g.current >= g.target ? 'Completed' : 'Active';
            csv += '"' + g.name + '",';
            csv += g.target + ',';
            csv += g.current + ',';
            csv += progress + ',';
            csv += '"' + targetDate + '",';
            csv += status + '\n';
        });
        
        downloadCSV(csv, 'goals_export.csv');
        showToast('Goals exported successfully!', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showToast('Error exporting goals: ' + e.message, 'error');
    }
};

// Export All Data as JSON
window.exportAllDataJSON = function() {
    console.log('📊 Exporting all data...');
    showToast('Generating complete data export...', 'success');
    
    try {
        var data = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            transactions: getTransactions(),
            budgets: getBudgets(),
            goals: getGoals()
        };
        
        var json = JSON.stringify(data, null, 2);
        downloadJSON(json, 'smartbudget_complete_export.json');
        showToast('Complete data exported successfully!', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showToast('Error exporting data: ' + e.message, 'error');
    }
};

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

function getTransactions() {
    try {
        // Try to get from localStorage fallback
        var stored = localStorage.getItem('smartbudget_transactions_fallback');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (e) {
        console.error('Error fetching transactions:', e);
        return [];
    }
}

function getBudgets() {
    try {
        var stored = localStorage.getItem('smartbudget_budgets_fallback');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (e) {
        console.error('Error fetching budgets:', e);
        return [];
    }
}

function getGoals() {
    try {
        var stored = localStorage.getItem('smartbudget_goals_fallback');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (e) {
        console.error('Error fetching goals:', e);
        return [];
    }
}

// ============================================
// DOWNLOAD HELPERS
// ============================================

function downloadCSV(csv, filename) {
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

function downloadJSON(json, filename) {
    var blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
    var link = document.createElement('a');
    if (link.download !== undefined) {
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        showToast('Your browser does not support file downloads', 'error');
    }
}

// ============================================
// INITIALIZATION
// ============================================

function initExportPage() {
    console.log('📤 Export page initializing...');
    setupExportSidebar();
    console.log('✅ Export page initialized');
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initExportPage();
    });
} else {
    initExportPage();
}

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================

if (window.pageRegistry) {
    window.pageRegistry.register('export', {
        init: initExportPage,
        destroy: function() {
            console.log('🗑️ Export: Cleanup');
        },
        refresh: function() {
            console.log('🔄 Export: Refresh');
        }
    });
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.exportTransactionsCSV = window.exportTransactionsCSV;
window.exportBudgetsCSV = window.exportBudgetsCSV;
window.exportGoalsCSV = window.exportGoalsCSV;
window.exportAllDataJSON = window.exportAllDataJSON;
window.setupExportSidebar = setupExportSidebar;
window.showToast = showToast;

console.log('✅ Export JS: Loaded');