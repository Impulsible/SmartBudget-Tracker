// ============================================
// SMARTBUDGET - GLOBAL INITIALIZATION
// ============================================
console.log('App Init: Global initialization loaded');

// Store initialization state
var initializedPages = {};

// ============================================
// GENERIC PAGE INITIALIZATION
// ============================================
function initPage(pageName, initFunction) {
    console.log(`🔄 Initializing ${pageName}...`);
    
    // Check if already initialized
    if (initializedPages[pageName]) {
        console.log(`⚠️ ${pageName} already initialized, resetting...`);
        resetPage(pageName);
    }
    
    // Call the specific init function
    if (typeof window[initFunction] === 'function') {
        window[initFunction]();
        initializedPages[pageName] = true;
        console.log(`✅ ${pageName} initialized`);
    } else {
        console.warn(`⚠️ Init function ${initFunction} not found for ${pageName}`);
    }
}

function resetPage(pageName) {
    console.log(`🔄 Resetting ${pageName}...`);
    initializedPages[pageName] = false;
    
    // Clean up any charts or intervals
    if (pageName === 'dashboard' && window.spendingChart) {
        window.spendingChart.destroy();
        window.spendingChart = null;
    }
    if (pageName === 'dashboard' && window.budgetChart) {
        window.budgetChart.destroy();
        window.budgetChart = null;
    }
    if (pageName === 'budgets' && window.budgetChart) {
        window.budgetChart.destroy();
        window.budgetChart = null;
    }
    if (pageName === 'reports') {
        if (window.reportTrendChart) {
            window.reportTrendChart.destroy();
            window.reportTrendChart = null;
        }
        if (window.reportExpenseChart) {
            window.reportExpenseChart.destroy();
            window.reportExpenseChart = null;
        }
        if (window.reportSavingsChart) {
            window.reportSavingsChart.destroy();
            window.reportSavingsChart = null;
        }
    }
    
    console.log(`✅ ${pageName} reset`);
}

// ============================================
// PAGE-SPECIFIC INIT FUNCTIONS
// ============================================

// Dashboard
window.initDashboardPage = function() {
    console.log('📊 Initializing dashboard...');
    if (typeof initDashboardPage === 'function') {
        // The existing dashboard init function
        initDashboardPage();
    } else {
        console.warn('⚠️ initDashboardPage not found, loading dashboard.js...');
        // Fallback - call the existing function
        if (window.dashboardInit) window.dashboardInit();
    }
};

window.resetDashboardPage = function() {
    console.log('🔄 Resetting dashboard...');
    resetPage('dashboard');
};

// Budgets
window.initBudgetsPage = function() {
    console.log('📊 Initializing budgets...');
    if (typeof initBudgetsPage === 'function') {
        initBudgetsPage();
    } else {
        console.warn('⚠️ initBudgetsPage not found');
        // Fallback
        if (window.budgetsInit) window.budgetsInit();
    }
};

window.resetBudgetsPage = function() {
    console.log('🔄 Resetting budgets...');
    resetPage('budgets');
};

// Transactions
window.initTransactionsPage = function() {
    console.log('📊 Initializing transactions...');
    if (typeof initTransactionsPage === 'function') {
        initTransactionsPage();
    } else {
        console.warn('⚠️ initTransactionsPage not found');
        if (window.transactionsInit) window.transactionsInit();
    }
};

window.resetTransactionsPage = function() {
    console.log('🔄 Resetting transactions...');
    resetPage('transactions');
};

// Goals
window.initGoalsPage = function() {
    console.log('📊 Initializing goals...');
    if (typeof initGoalsPage === 'function') {
        initGoalsPage();
    } else {
        console.warn('⚠️ initGoalsPage not found');
        if (window.goalsInit) window.goalsInit();
    }
};

window.resetGoalsPage = function() {
    console.log('🔄 Resetting goals...');
    resetPage('goals');
};

// Reports
window.initReportsPage = function() {
    console.log('📊 Initializing reports...');
    if (typeof initReportsPage === 'function') {
        initReportsPage();
    } else {
        console.warn('⚠️ initReportsPage not found');
        if (window.reportsInit) window.reportsInit();
    }
};

window.resetReportsPage = function() {
    console.log('🔄 Resetting reports...');
    resetPage('reports');
};

// Export
window.initExportPage = function() {
    console.log('📊 Initializing export...');
    if (typeof initExportPage === 'function') {
        initExportPage();
    } else {
        console.warn('⚠️ initExportPage not found');
        if (window.exportInit) window.exportInit();
    }
};

// Settings
window.initSettingsPage = function() {
    console.log('📊 Initializing settings...');
    if (typeof initSettingsPage === 'function') {
        initSettingsPage();
    } else {
        console.warn('⚠️ initSettingsPage not found');
        if (window.settingsInit) window.settingsInit();
    }
};

// ============================================
// EXPOSE FOR BLAZOR
// ============================================
window.initPage = initPage;
window.resetPage = resetPage;

console.log('✅ App Init: Global initialization ready');