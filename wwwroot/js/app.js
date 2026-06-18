// ============================================
// SMARTBUDGET - Main Application JS
// ============================================
console.log('App JS: Loaded');

// ============================================
// TOAST NOTIFICATIONS - Global
// ============================================
window.showToast = function(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) {
        var newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1000;';
        document.body.appendChild(newContainer);
        container = newContainer;
    }
    
    var toast = document.createElement('div');
    var iconColor = type === 'success' ? '#10B981' : (type === 'info' ? '#3B82F6' : (type === 'warning' ? '#F59E0B' : '#EF4444'));
    var icon = type === 'success' ? 'check-circle-fill' : (type === 'info' ? 'info-circle-fill' : (type === 'warning' ? 'exclamation-triangle-fill' : 'x-circle-fill'));
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + iconColor + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;color:white;';
    toast.innerHTML = '<i class="bi bi-' + icon + '" style="color:' + iconColor + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 3000);
};

// ============================================
// DESTROY PAGE - Cleanup
// ============================================
window.destroyPage = function(pageName) {
    console.log('🗑️ Destroying page:', pageName);
    // Clean up any page-specific resources
};

// ============================================
// PAGE REGISTRY - For Blazor navigation
// ============================================
window.pageRegistry = window.pageRegistry || {};

window.pageRegistry.register = function(name, handlers) {
    console.log('📄 Registering page:', name);
    window.pageRegistry[name] = handlers;
};

// ============================================
// INIT
// ============================================
console.log('✅ App JS: Ready');