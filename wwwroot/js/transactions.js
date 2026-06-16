// ============================================
// SMARTBUDGET TRANSACTIONS PAGE
// Full CRUD with Database Persistence via API
// AUTO-START ON PAGE LOAD
// FIXED: Category dropdown always populates
// ============================================
console.log('Transactions JS: Loaded (Fixed)');

var currentPage = 1;
var itemsPerPage = 10;

// ============================================
// LIVE TRANSACTIONS ANIMATION ENGINE
// ============================================
var liveTransactionsInterval = null;
var isLiveTransactionsRunning = false;

// ============================================
// AUTO-START TRANSACTIONS PAGE - IMMEDIATELY
// ============================================
(function autoStartTransactions() {
    console.log('Transactions: Auto-starting...');
    setTimeout(function() {
        setupTxSidebar();
        renderCategoryDropdowns();
        renderAllTransactions();
        startLiveTransactions();
        console.log('Transactions: Live updates started!');
    }, 100);
})();

// ============================================
// SIDEBAR SETUP
// ============================================
function setupTxSidebar() {
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
            closeTxSidebar();
        };
    }

    overlay.onclick = function() {
        closeTxSidebar();
    };

    sidebar.querySelectorAll('.nav-item').forEach(function(link) {
        link.addEventListener('click', function() {
            closeTxSidebar();
        });
    });
}

function closeTxSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================
// LIVE TRANSACTIONS - Auto Refresh
// ============================================
function startLiveTransactions() {
    if (isLiveTransactionsRunning) {
        console.log('Transactions: Live updates already running');
        return;
    }
    
    console.log('Transactions: Starting live updates...');
    isLiveTransactionsRunning = true;

    if (liveTransactionsInterval) {
        clearInterval(liveTransactionsInterval);
    }

    // Refresh every 5 seconds
    liveTransactionsInterval = setInterval(function() {
        renderAllTransactions();
        console.log('Transactions: Auto-refreshed');
    }, 5000);
}

// ============================================
// API CALLS
// ============================================
async function getTransactionsFromApi() {
    try {
        var response = await fetch('/api/transactions?pageSize=200');
        if (!response.ok) return [];
        var data = await response.json();
        if (data.success && data.transactions) {
            return data.transactions.map(function(t) {
                return {
                    id: t.id,
                    desc: t.title || t.description,
                    cat: t.category,
                    date: new Date(t.date),
                    amount: t.amount,
                    type: t.type,
                    status: t.status || 'Completed'
                };
            });
        }
        return [];
    } catch (e) {
        console.error('Error fetching transactions:', e);
        return [];
    }
}

async function saveTransactionToApi(tx) {
    try {
        var body = {
            title: tx.desc,
            description: tx.desc,
            amount: tx.amount,
            type: tx.type,
            category: tx.cat,  // FIXED: Added category field
            date: tx.date || new Date().toISOString()
        };
        
        console.log('Saving transaction:', JSON.stringify(body, null, 2));
        
        var response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        console.log('Response status:', response.status);
        
        var data = await response.json();
        console.log('Response data:', data);
        
        return data.success === true;
    } catch (e) {
        console.error('Error saving transaction:', e);
        return false;
    }
}

async function getCategoriesFromApi() {
    try {
        // Try to get categories from budgets first
        var response = await fetch('/api/budgets');
        if (response.ok) {
            var data = await response.json();
            if (data.success && data.budgets && data.budgets.length > 0) {
                console.log('Transactions: Loaded categories from budgets API');
                return data.budgets.map(function(b) {
                    return { id: b.id, name: b.name, color: b.color };
                });
            }
        }
    } catch (e) {
        console.error('Error fetching categories:', e);
    }
    
    // Also try categories endpoint
    try {
        var catResponse = await fetch('/api/categories');
        if (catResponse.ok) {
            var catData = await catResponse.json();
            if (catData.success && catData.categories && catData.categories.length > 0) {
                console.log('Transactions: Loaded categories from categories API');
                return catData.categories.map(function(c) {
                    return { id: c.id, name: c.name, color: c.color };
                });
            }
        }
    } catch (e) {
        console.error('Error fetching from categories endpoint:', e);
    }
    
    // Default categories as fallback
    console.log('Transactions: Using default categories');
    return [
        { id: 1, name: "Food", color: "#10B981" },
        { id: 2, name: "Transport", color: "#3B82F6" },
        { id: 3, name: "Shopping", color: "#F59E0B" },
        { id: 4, name: "Bills", color: "#EF4444" },
        { id: 5, name: "Entertainment", color: "#8B5CF6" },
        { id: 6, name: "Salary", color: "#06B6D4" },
        { id: 7, name: "Utilities", color: "#F97316" },
        { id: 8, name: "Rent", color: "#EC4899" },
        { id: 9, name: "Insurance", color: "#6366F1" },
        { id: 10, name: "Education", color: "#14B8A6" },
        { id: 11, name: "Health", color: "#F43F5E" },
        { id: 12, name: "Other", color: "#64748B" }
    ];
}

// ============================================
// MODAL HANDLERS - FIXED
// ============================================
function openTxModal() {
    console.log('Opening transaction modal');
    var modal = document.getElementById('txModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        var dateInput = document.getElementById('txDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Clear previous values
        var descInput = document.getElementById('txDesc');
        var amountInput = document.getElementById('txAmt');
        if (descInput) descInput.value = '';
        if (amountInput) amountInput.value = '';
        
        // IMPORTANT: Populate category dropdown when opening modal
        renderCategoryDropdowns();
    }
}

function closeTxModal() {
    var modal = document.getElementById('txModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ============================================
// RENDER CATEGORY DROPDOWNS - FIXED
// ============================================
async function renderCategoryDropdowns() {
    console.log('Rendering category dropdowns...');
    var categories = await getCategoriesFromApi();
    
    console.log('Categories for dropdown:', categories);
    
    var html = '<option value="">-- Select Category --</option>';
    categories.forEach(function(c) {
        html += '<option value="' + c.name + '">' + c.name + '</option>';
    });
    
    var txCat = document.getElementById('txCat');
    var filterCat = document.getElementById('txFilterCategory');
    
    if (txCat) {
        txCat.innerHTML = html;
        console.log('Transaction category dropdown populated with', categories.length, 'options');
    } else {
        console.log('txCat element not found');
    }
    
    if (filterCat) {
        var filterHtml = '<option value="all">All Categories</option>';
        categories.forEach(function(c) {
            filterHtml += '<option value="' + c.name + '">' + c.name + '</option>';
        });
        filterCat.innerHTML = filterHtml;
        console.log('Filter category dropdown populated');
    } else {
        console.log('txFilterCategory element not found');
    }
}

// ============================================
// ADD TRANSACTION - FIXED
// ============================================
window.addTransactionFull = async function() {
    console.log('addTransactionFull called');
    
    var desc = document.getElementById('txDesc').value.trim();
    var amount = document.getElementById('txAmt').value;
    var cat = document.getElementById('txCat').value;
    var type = document.getElementById('txTyp').value;
    var dateVal = document.getElementById('txDate').value;

    console.log('Form values:', { desc, amount, cat, type, dateVal });

    // Validation
    if (!desc) {
        alert('Please enter a description.');
        return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    if (!cat) {
        alert('Please select a category.');
        return;
    }

    // Disable save button and show loading
    var saveBtn = document.querySelector('#txModal .btn-save');
    var originalText = '';
    if (saveBtn) {
        originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;"></span> Saving...';
        saveBtn.disabled = true;
        
        // Add spin animation if not exists
        if (!document.querySelector('#spinStyle')) {
            var style = document.createElement('style');
            style.id = 'spinStyle';
            style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
            document.head.appendChild(style);
        }
    }

    var success = await saveTransactionToApi({
        desc: desc,
        cat: cat,
        date: dateVal || new Date().toISOString(),
        amount: parseFloat(amount),
        type: type
    });

    // Restore button
    if (saveBtn) {
        saveBtn.innerHTML = originalText || 'Save Transaction';
        saveBtn.disabled = false;
    }

    if (success) {
        closeTxModal();
        currentPage = 1;
        await renderAllTransactions();
        // Also refresh category dropdowns in case new category was added
        await renderCategoryDropdowns();
        showToast('Transaction added successfully!', 'success');
    } else {
        alert('Failed to save transaction. Check console for details.');
    }
};

// ============================================
// DELETE TRANSACTION
// ============================================
window.deleteTxFull = async function(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            var response = await fetch('/api/transactions/' + id, { method: 'DELETE' });
            var data = await response.json();
            if (data.success) {
                await renderAllTransactions();
                showToast('Transaction deleted successfully!', 'success');
            } else {
                alert('Failed to delete transaction.');
            }
        } catch (e) {
            alert('Error deleting transaction.');
        }
    }
};

// ============================================
// EXPORT CSV
// ============================================
window.exportTransactions = async function() {
    var transactions = await getTransactionsFromApi();
    if (transactions.length === 0) {
        alert('No transactions to export.');
        return;
    }

    var csv = 'Description,Category,Date,Amount,Type,Status\n';
    transactions.forEach(function(t) {
        var dateStr = new Date(t.date).toLocaleDateString('en-US');
        csv += '"' + (t.desc || '').replace(/"/g, '""') + '","' + (t.cat || '').replace(/"/g, '""') + '","' + dateStr + '",' + t.amount + ',"' + t.type + '","' + (t.status || 'Completed') + '"\n';
    });

    var blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'smartbudget-transactions-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Transactions exported successfully!', 'success');
};

// ============================================
// CLEAR ALL TRANSACTIONS
// ============================================
window.clearAllTransactionsFull = async function() {
    var transactions = await getTransactionsFromApi();
    if (transactions.length === 0) {
        alert('No transactions to clear.');
        return;
    }
    if (confirm('WARNING: This will delete ALL your transactions. This cannot be undone. Are you sure?')) {
        try {
            var response = await fetch('/api/transactions/clear', { method: 'DELETE' });
            var data = await response.json();
            if (data.success) {
                currentPage = 1;
                await renderAllTransactions();
                showToast('All transactions cleared!', 'success');
            } else {
                alert('Failed to clear transactions.');
            }
        } catch (e) {
            alert('Error clearing transactions.');
        }
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
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + (type === 'success' ? '#10B981' : '#EF4444') + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;color:white;';
    toast.innerHTML = '<i class="bi bi-' + (type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill') + '" style="color:' + (type === 'success' ? '#10B981' : '#EF4444') + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 3000);
}

// ============================================
// RENDER ALL TRANSACTIONS
// ============================================
async function renderAllTransactions() {
    var transactions = await getTransactionsFromApi();

    // Apply filters
    var searchInput = document.getElementById('txSearch');
    var typeFilter = document.getElementById('txFilterType');
    var catFilter = document.getElementById('txFilterCategory');
    
    var search = searchInput ? (searchInput.value || '').toLowerCase() : '';
    var typeFilterValue = typeFilter ? typeFilter.value : 'all';
    var catFilterValue = catFilter ? catFilter.value : 'all';

    var filtered = [...transactions];
    
    if (search) {
        filtered = filtered.filter(function(t) {
            return (t.desc || '').toLowerCase().includes(search) ||
                   (t.cat || '').toLowerCase().includes(search);
        });
    }
    if (typeFilterValue !== 'all') {
        filtered = filtered.filter(function(t) { return t.type === typeFilterValue; });
    }
    if (catFilterValue !== 'all') {
        filtered = filtered.filter(function(t) { return t.cat === catFilterValue; });
    }

    // Sort by date (newest first)
    filtered.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    // Update stats
    var totalIncome = 0;
    var totalExpenses = 0;
    filtered.forEach(function(t) {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpenses += t.amount;
        }
    });

    var incomeEl = document.getElementById('txTotalIncome');
    var expenseEl = document.getElementById('txTotalExpenses');
    var balanceEl = document.getElementById('txBalance');
    var countEl = document.getElementById('txCount');
    
    if (incomeEl) animateTxStatValue(incomeEl, totalIncome);
    if (expenseEl) animateTxStatValue(expenseEl, totalExpenses);
    if (balanceEl) animateTxStatValue(balanceEl, totalIncome - totalExpenses);
    if (countEl) animateTxStatValue(countEl, filtered.length, false);

    // Pagination
    var totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * itemsPerPage;
    var pageItems = filtered.slice(start, start + itemsPerPage);

    // Render table
    var tbody = document.getElementById('txFullBody');
    if (!tbody) return;

    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:#64748B;"><i class="bi bi-receipt" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>No transactions found.<br>Click "Add Transaction" to get started.</td></tr>';
    } else {
        tbody.innerHTML = pageItems.map(function(t) {
            var icon = t.type === 'income' ? 'bi-arrow-down' : 'bi-arrow-up';
            var iconClass = t.type === 'income' ? 'income' : 'expense';
            var sign = t.type === 'income' ? '+' : '-';
            var amountClass = t.type === 'income' ? 'amount-income' : 'amount-expense';
            var typeClass = t.type === 'income' ? 'income' : 'expense';
            var dateStr = new Date(t.date).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });

            return '<tr>' +
                '<td>' +
                    '<div class="transaction-desc">' +
                        '<div class="transaction-icon ' + iconClass + '"><i class="bi ' + icon + '"></i></div>' +
                        '<span>' + escapeHtml(t.desc || '') + '</span>' +
                    '</div>' +
                '</td>' +
                '<td><span class="category-badge">' + escapeHtml(t.cat || 'Other') + '</span></td>' +
                '<td>' + dateStr + '</td>' +
                '<td class="' + amountClass + '">' + sign + '₦' + (t.amount || 0).toLocaleString() + '</td>' +
                '<td><span class="type-badge ' + typeClass + '">' + (t.type || 'expense') + '</span></td>' +
                '<td><span class="status-badge Completed">Completed</span></td>' +
                '<td>' +
                    '<div class="tx-actions">' +
                        '<button class="btn-delete" onclick="deleteTxFull(' + t.id + ')" title="Delete"><i class="bi bi-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    // Render pagination
    var pagination = document.getElementById('txPagination');
    if (pagination && totalPages > 1) {
        var paginationHTML = '';
        paginationHTML += '<button class="tx-page-btn" onclick="changePage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '><i class="bi bi-chevron-left"></i></button>';
        
        for (var i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += '<button class="tx-page-btn ' + (i === currentPage ? 'active' : '') + '" onclick="changePage(' + i + ')">' + i + '</button>';
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += '<span style="color:#64748B;padding:0.5rem;">...</span>';
            }
        }
        
        paginationHTML += '<button class="tx-page-btn" onclick="changePage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '><i class="bi bi-chevron-right"></i></button>';
        pagination.innerHTML = paginationHTML;
    } else if (pagination) {
        pagination.innerHTML = '';
    }
}

// ============================================
// ANIMATE TRANSACTION STAT VALUE
// ============================================
function animateTxStatValue(element, value, isCurrency) {
    if (!element) return;
    
    var currentText = element.textContent;
    var currentValue = parseFloat(currentText.replace(/[^0-9.-]/g, '')) || 0;
    var targetValue = value || 0;
    
    if (currentValue === targetValue) {
        if (isCurrency !== false) {
            element.textContent = '₦' + targetValue.toLocaleString();
        } else {
            element.textContent = targetValue.toLocaleString();
        }
        return;
    }
    
    var startTime = null;
    var duration = 600;
    
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = currentValue + (targetValue - currentValue) * eased;
        
        if (isCurrency !== false) {
            element.textContent = '₦' + Math.round(current).toLocaleString();
        } else {
            element.textContent = Math.round(current).toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            if (isCurrency !== false) {
                element.textContent = '₦' + targetValue.toLocaleString();
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        }
    }
    
    requestAnimationFrame(step);
}

function changePage(page) {
    currentPage = page;
    renderAllTransactions();
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
// CLEANUP FUNCTION
// ============================================
function cleanupTransactions() {
    if (liveTransactionsInterval) {
        clearInterval(liveTransactionsInterval);
        liveTransactionsInterval = null;
    }
    isLiveTransactionsRunning = false;
    console.log('Transactions: Cleanup complete');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Transactions: DOM loaded - checking initialization...');
    
    if (!isLiveTransactionsRunning) {
        console.log('Transactions: Initializing...');
        setupTxSidebar();
        await renderCategoryDropdowns();
        await renderAllTransactions();
        startLiveTransactions();
        console.log('Transactions: Initialization complete');
    }

    // Close modal on overlay click
    var txModal = document.getElementById('txModal');
    if (txModal) {
        txModal.addEventListener('click', function(e) {
            if (e.target === this) closeTxModal();
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTxModal();
        }
    });
    
    // Search input handler
    var searchInput = document.getElementById('txSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            renderAllTransactions();
        });
    }
    
    // Filter handlers
    var typeFilter = document.getElementById('txFilterType');
    var catFilter = document.getElementById('txFilterCategory');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            currentPage = 1;
            renderAllTransactions();
        });
    }
    
    if (catFilter) {
        catFilter.addEventListener('change', function() {
            currentPage = 1;
            renderAllTransactions();
        });
    }
});

// ============================================
// EXPOSE FOR BLAZOR INTEROP
// ============================================
window.cleanupTransactions = function() {
    console.log('Transactions: Cleanup called from Blazor');
    cleanupTransactions();
};

// Make functions globally available
window.openTxModal = openTxModal;
window.closeTxModal = closeTxModal;

// ============================================
// FALLBACK: Check if elements exist and start anyway
// ============================================
setTimeout(function() {
    if (!isLiveTransactionsRunning) {
        console.log('Transactions: Force starting (fallback)...');
        setupTxSidebar();
        renderCategoryDropdowns();
        renderAllTransactions();
        startLiveTransactions();
    }
}, 1000);

// ============================================
// PAGE VISIBILITY - Pause updates when tab is hidden
// ============================================
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        if (liveTransactionsInterval) {
            clearInterval(liveTransactionsInterval);
            liveTransactionsInterval = null;
        }
        console.log('Transactions: Updates paused (tab hidden)');
    } else {
        if (!liveTransactionsInterval && isLiveTransactionsRunning) {
            liveTransactionsInterval = setInterval(function() {
                renderAllTransactions();
            }, 5000);
            console.log('Transactions: Updates resumed (tab visible)');
        }
    }
});

// ============================================
// TRANSACTIONS INIT FUNCTION - EXPOSE FOR BLAZOR
// ============================================
window.initTransactionsPage = async function() {
    console.log('🔄 transactions: init called from Blazor');
    setupTxSidebar();
    await renderCategoryDropdowns();
    await renderAllTransactions();
    console.log('✅ transactions: initialized');
};

window.renderAllTransactions = renderAllTransactions;