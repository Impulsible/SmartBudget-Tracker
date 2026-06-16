// ============================================
// SMARTBUDGET EXPORT PAGE
// ============================================
console.log('Export JS: Loaded');

// Initialize sidebar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Export page initializing...');
    initSidebar();
    setupExportButtons();
});

function initSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var openBtn = document.getElementById('sidebarToggleBtn');
    var closeBtn = document.getElementById('sidebarCloseBtn');

    if (openBtn && sidebar && overlay) {
        openBtn.onclick = function() {
            sidebar.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        };
    }

    var closeSidebar = function() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.onclick = closeSidebar;
    if (overlay) overlay.onclick = closeSidebar;
}

function setupExportButtons() {
    // Get all export buttons and add loading states
    var exportBtns = document.querySelectorAll('.export-btn');
    exportBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Buttons handle their own loading state in their functions
        });
    });
}

function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) {
        var newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.className = 'toast-container';
        newContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1000;';
        document.body.appendChild(newContainer);
        container = newContainer;
    }
    
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    var iconMap = {
        'success': 'check-circle-fill',
        'error': 'exclamation-triangle-fill',
        'info': 'info-circle-fill',
        'warning': 'exclamation-triangle-fill'
    };
    var colorMap = {
        'success': '#10B981',
        'error': '#EF4444',
        'info': '#3B82F6',
        'warning': '#F59E0B'
    };
    
    toast.innerHTML = '<i class="bi bi-' + (iconMap[type] || iconMap['success']) + '" style="color:' + (colorMap[type] || colorMap['success']) + ';"></i><span>' + message + '</span>';
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + (colorMap[type] || colorMap['success']) + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;color:white;font-family:Inter,sans-serif;';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 4000);
}

async function exportTransactions() {
    var dateRange = document.getElementById('txDateRange');
    var typeSelect = document.getElementById('txType');
    var btn = document.querySelector('.export-card:first-child .export-btn');
    
    var range = dateRange ? dateRange.value : 'all';
    var type = typeSelect ? typeSelect.value : 'all';
    
    // Disable button and show loading
    if (btn) {
        btn.disabled = true;
        var originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-sm"></span> Exporting...';
    }
    
    showToast('Preparing transactions export...', 'info');
    
    try {
        console.log('Exporting transactions with range:', range, 'type:', type);
        
        var response = await fetch('/api/transactions/export?range=' + encodeURIComponent(range) + '&type=' + encodeURIComponent(type), {
            method: 'GET',
            headers: { 'Accept': 'text/csv' }
        });
        
        if (response.ok) {
            var blob = await response.blob();
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'transactions_' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Transactions exported successfully!', 'success');
        } else {
            var errorText = await response.text();
            console.error('Export error:', errorText);
            showToast('Failed to export transactions. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Network error. Please check your connection.', 'error');
    } finally {
        // Re-enable button
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-download"></i> Export CSV';
        }
    }
}

async function exportBudgets() {
    var yearSelect = document.getElementById('budgetYear');
    var btn = document.querySelector('.export-card:nth-child(2) .export-btn');
    
    var year = yearSelect ? yearSelect.value : '0';
    
    if (btn) {
        btn.disabled = true;
        var originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-sm"></span> Exporting...';
    }
    
    showToast('Preparing budgets export...', 'info');
    
    try {
        console.log('Exporting budgets for year:', year);
        
        var response = await fetch('/api/budgets/export?year=' + encodeURIComponent(year), {
            method: 'GET',
            headers: { 'Accept': 'text/csv' }
        });
        
        if (response.ok) {
            var blob = await response.blob();
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'budgets_' + (year === '0' ? 'current' : year) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Budgets exported successfully!', 'success');
        } else {
            var errorText = await response.text();
            console.error('Export error:', errorText);
            showToast('Failed to export budgets. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Network error. Please check your connection.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-download"></i> Export CSV';
        }
    }
}

async function exportGoals() {
    var statusSelect = document.getElementById('goalStatus');
    var btn = document.querySelector('.export-card:nth-child(3) .export-btn');
    
    var status = statusSelect ? statusSelect.value : 'all';
    
    if (btn) {
        btn.disabled = true;
        var originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-sm"></span> Exporting...';
    }
    
    showToast('Preparing goals export...', 'info');
    
    try {
        console.log('Exporting goals with status:', status);
        
        var response = await fetch('/api/goals/export?status=' + encodeURIComponent(status), {
            method: 'GET',
            headers: { 'Accept': 'text/csv' }
        });
        
        if (response.ok) {
            var blob = await response.blob();
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'goals_' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Savings goals exported successfully!', 'success');
        } else {
            var errorText = await response.text();
            console.error('Export error:', errorText);
            showToast('Failed to export goals. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Network error. Please check your connection.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-download"></i> Export CSV';
        }
    }
}

async function exportAllData() {
    var btn = document.querySelector('.export-all-btn');
    
    if (btn) {
        btn.disabled = true;
        var originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-sm"></span> Preparing...';
    }
    
    showToast('Preparing complete export...', 'info');
    
    try {
        console.log('Exporting all data...');
        
        var response = await fetch('/api/export/all', {
            method: 'GET'
        });
        
        if (response.ok) {
            var blob = await response.blob();
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'smartbudget_export_' + new Date().toISOString().split('T')[0] + '.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Complete export completed successfully!', 'success');
        } else {
            var errorText = await response.text();
            console.error('Export error:', errorText);
            showToast('Failed to export data. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Network error. Please check your connection.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-file-zip"></i> Export All Data (ZIP)';
        }
    }
}

// Make functions globally available
window.exportTransactions = exportTransactions;
window.exportBudgets = exportBudgets;
window.exportGoals = exportGoals;
window.exportAllData = exportAllData;

// Add spinner CSS if not exists
if (!document.querySelector('#spinnerStyle')) {
    var style = document.createElement('style');
    style.id = 'spinnerStyle';
    style.textContent = '.spinner-sm{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(style);
}

console.log('Export JS: Initialized');

// ============================================
// EXPORT INIT FUNCTION - EXPOSE FOR BLAZOR
// ============================================
window.initExportPage = function() {
    console.log('🔄 export: init called from Blazor');
    initSidebar();
    console.log('✅ export: initialized');
};