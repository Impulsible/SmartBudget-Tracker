// ============================================
// LOGOUT PAGE - Countdown & Redirect
// ============================================
window.startLogoutCountdown = function(seconds) {
    console.log('Logout countdown started: ' + seconds + ' seconds');
    
    var countdownDisplay = document.getElementById('countdownDisplay');
    var autoRedirect = document.getElementById('autoRedirect');
    var countdown = seconds || 5;
    
    if (!countdownDisplay) {
        console.log('Countdown display not found, redirecting immediately');
        setTimeout(function() {
            window.location.href = '/';
        }, 1000);
        return;
    }
    
    // Clear any existing interval
    if (window._countdownInterval) {
        clearInterval(window._countdownInterval);
    }
    
    var interval = setInterval(function() {
        countdown--;
        
        if (countdownDisplay) {
            countdownDisplay.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(interval);
            window._countdownInterval = null;
            
            // Add fade effect before redirect
            if (autoRedirect) {
                autoRedirect.style.opacity = '0.5';
                autoRedirect.style.transition = 'opacity 0.3s ease';
                var p = autoRedirect.querySelector('p');
                if (p) p.textContent = 'Redirecting now...';
            }
            
            // Redirect to home page
            setTimeout(function() {
                window.location.href = '/';
            }, 500);
        }
    }, 1000);
    
    window._countdownInterval = interval;
    
    // Allow clicking the buttons to cancel auto-redirect
    var actionButtons = document.querySelectorAll('.btn-home, .btn-login');
    actionButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (window._countdownInterval) {
                clearInterval(window._countdownInterval);
                window._countdownInterval = null;
                console.log('Auto-redirect cancelled - user clicked a button');
            }
        });
    });
};

// ============================================
// MANUAL REDIRECT FUNCTIONS
// ============================================
window.redirectToHome = function() {
    if (window._countdownInterval) {
        clearInterval(window._countdownInterval);
        window._countdownInterval = null;
    }
    window.location.href = '/';
};

window.redirectToLogin = function() {
    if (window._countdownInterval) {
        clearInterval(window._countdownInterval);
        window._countdownInterval = null;
    }
    window.location.href = '/Account/Login';
};

// ============================================
// INITIALIZATION
// ============================================
function initLogoutPage() {
    console.log('🔐 Logout page initializing...');
    
    // Check if we're on the success page (not logging out)
    var countdownEl = document.getElementById('countdownDisplay');
    if (countdownEl) {
        // Countdown will be started from Blazor OnAfterRenderAsync
        console.log('⏳ Waiting for countdown to start from Blazor');
    }
    
    console.log('✅ Logout page initialized');
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initLogoutPage();
    });
} else {
    setTimeout(initLogoutPage, 100);
}

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================
if (window.pageRegistry) {
    window.pageRegistry.register('logout', {
        init: initLogoutPage,
        destroy: function() {
            console.log('🗑️ Logout: Cleanup');
            if (window._countdownInterval) {
                clearInterval(window._countdownInterval);
                window._countdownInterval = null;
            }
        },
        refresh: function() {
            console.log('🔄 Logout: Refresh');
        }
    });
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.startLogoutCountdown = window.startLogoutCountdown;
window.redirectToHome = window.redirectToHome;
window.redirectToLogin = window.redirectToLogin;

console.log('✅ Logout JS: Loaded');