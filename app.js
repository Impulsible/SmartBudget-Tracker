// /wwwroot/js/app.js
// ============================================
// SMARTBUDGET APP - SPA Lifecycle Manager
// ============================================
console.log('📦 App JS: Loading...');

// Global page registry
window.pageRegistry = {
    pages: {},
    
    register: function(pageName, handlers) {
        this.pages[pageName] = {
            init: handlers.init || function() { console.log(`⚠️ ${pageName}: No init handler`); },
            destroy: handlers.destroy || function() { console.log(`⚠️ ${pageName}: No destroy handler`); },
            refresh: handlers.refresh || function() { console.log(`⚠️ ${pageName}: No refresh handler`); },
            isInitialized: false
        };
        console.log(`✅ Registered: ${pageName}`);
    },
    
    init: function(pageName) {
        console.log(`🚀 initPage called for: ${pageName}`);
        const page = this.pages[pageName];
        if (!page) {
            console.error(`❌ Page not found: ${pageName}`);
            return;
        }
        
        // If already initialized, destroy first (clean slate)
        if (page.isInitialized) {
            console.log(`🔄 Re-initializing: ${pageName}`);
            try {
                page.destroy();
            } catch(e) {
                console.warn(`Destroy error:`, e);
            }
            page.isInitialized = false;
        }
        
        // Initialize fresh
        console.log(`🚀 Initializing: ${pageName}`);
        try {
            page.init();
            page.isInitialized = true;
            console.log(`✅ ${pageName} initialized successfully`);
        } catch(e) {
            console.error(`❌ ${pageName} init error:`, e);
        }
    },
    
    destroy: function(pageName) {
        const page = this.pages[pageName];
        if (page && page.isInitialized) {
            console.log(`🗑️ Destroying: ${pageName}`);
            try {
                page.destroy();
            } catch(e) {
                console.warn(`Destroy error:`, e);
            }
            page.isInitialized = false;
        }
    },
    
    refresh: function(pageName) {
        const page = this.pages[pageName];
        if (page && page.isInitialized) {
            console.log(`🔄 Refreshing: ${pageName}`);
            try {
                page.refresh();
            } catch(e) {
                console.warn(`Refresh error:`, e);
            }
        }
    }
};

// Global functions for Blazor to call
window.initPage = function(pageName) {
    console.log(`📞 Blazor called initPage: ${pageName}`);
    if (window.pageRegistry) {
        window.pageRegistry.init(pageName);
    } else {
        console.error('❌ pageRegistry not found!');
    }
};

window.destroyPage = function(pageName) {
    console.log(`📞 Blazor called destroyPage: ${pageName}`);
    if (window.pageRegistry) {
        window.pageRegistry.destroy(pageName);
    }
};

window.refreshPage = function(pageName) {
    console.log(`📞 Blazor called refreshPage: ${pageName}`);
    if (window.pageRegistry) {
        window.pageRegistry.refresh(pageName);
    }
};

console.log('✅ App JS: Loaded');