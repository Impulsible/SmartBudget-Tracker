// Export page JavaScript

// Initialize sidebar
document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
});

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const openBtn = document.getElementById('sidebarToggleBtn');
    const closeBtn = document.getElementById('sidebarCloseBtn');

    if (openBtn) {
        openBtn.onclick = () => {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        };
    }

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    };

    if (closeBtn) closeBtn.onclick = closeSidebar;
    if (overlay) overlay.onclick = closeSidebar;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function exportTransactions() {
    const dateRange = document.getElementById('txDateRange')?.value || 'all';
    const type = document.getElementById('txType')?.value || 'all';

    showToast('Preparing transactions export...', 'success');

    try {
        const response = await fetch(`/api/transactions/export?range=${dateRange}&type=${type}`, {
            method: 'GET',
            headers: { 'Accept': 'text/csv' }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Transactions exported successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to export transactions', 'error');
        }
    } catch (error) {
        showToast('Error exporting transactions', 'error');
        console.error(error);
    }
}

async function exportBudgets() {
    const year = document.getElementById('budgetYear')?.value || '0';

    showToast('Preparing budgets export...', 'success');

    try {
        const response = await fetch(`/api/budgets/export?year=${year}`, {
            method: 'GET',
            headers: { 'Accept': 'text/csv' }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `budgets_${year === '0' ? 'current' : year}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Budgets exported successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to export budgets', 'error');
        }
    } catch (error) {
        showToast('Error exporting budgets', 'error');
        console.error(error);
    }
}

async function exportGoals() {
    const status = document.getElementById('goalStatus')?.value || 'all';

    showToast('Preparing goals export...', 'success');

    try {
        const response = await fetch(`/api/goals/export?status=${status}`, {
            method: 'GET',
            headers: { 'Accept': 'text/csv' }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `goals_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Savings goals exported successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to export goals', 'error');
        }
    } catch (error) {
        showToast('Error exporting goals', 'error');
        console.error(error);
    }
}

async function exportAllData() {
    showToast('Preparing complete export...', 'success');

    try {
        const response = await fetch('/api/export/all', {
            method: 'GET'
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smartbudget_export_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Complete export completed successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to export data', 'error');
        }
    } catch (error) {
        showToast('Error exporting data', 'error');
        console.error(error);
    }
}