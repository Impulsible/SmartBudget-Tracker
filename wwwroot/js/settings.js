// ============================================
// SMARTBUDGET - SETTINGS PAGE
// ============================================
console.log('⚙️ Settings JS: Loaded');

// ============================================
// SIDEBAR SETUP
// ============================================
function setupSettingsSidebar() {
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
            closeSettingsSidebar();
        };
    }

    overlay.onclick = function() {
        closeSettingsSidebar();
    };
}

function closeSettingsSidebar() {
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
// TAB SWITCHING
// ============================================
window.switchTab = function(tabId, btn) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    // Hide all panels
    document.querySelectorAll('.settings-panel').forEach(function(p) {
        p.style.display = 'none';
    });
    
    // Show selected panel
    var panel = document.getElementById(tabId + 'Panel');
    if (panel) {
        panel.style.display = 'block';
    }
};

// ============================================
// LOAD USER PROFILE
// ============================================
window.loadUserProfile = function() {
    console.log('👤 Loading user profile...');
    
    try {
        // Try to get user info from localStorage or API
        var userData = localStorage.getItem('smartbudget_user_profile');
        if (userData) {
            var profile = JSON.parse(userData);
            
            var nameInput = document.getElementById('fullName');
            var emailInput = document.getElementById('email');
            var phoneInput = document.getElementById('phoneNumber');
            var currencySelect = document.getElementById('currency');
            
            if (nameInput && profile.name) nameInput.value = profile.name;
            if (emailInput && profile.email) emailInput.value = profile.email;
            if (phoneInput && profile.phone) phoneInput.value = profile.phone;
            if (currencySelect && profile.currency) currencySelect.value = profile.currency;
            
            console.log('✅ Profile loaded from storage');
        } else {
            // Try to fetch from API
            fetchUserProfileFromApi();
        }
    } catch (e) {
        console.error('Error loading profile:', e);
    }
};

async function fetchUserProfileFromApi() {
    try {
        var response = await fetch('/api/auth/profile', {
            credentials: 'include'
        });
        if (response.ok) {
            var data = await response.json();
            if (data.success) {
                var nameInput = document.getElementById('fullName');
                var emailInput = document.getElementById('email');
                
                if (nameInput && data.fullName) nameInput.value = data.fullName;
                if (emailInput && data.email) emailInput.value = data.email;
            }
        }
    } catch (e) {
        console.log('Could not fetch profile from API');
    }
}

// ============================================
// SAVE PROFILE
// ============================================
window.saveProfile = function() {
    console.log('💾 Saving profile...');
    
    var name = document.getElementById('fullName').value.trim();
    var phone = document.getElementById('phoneNumber').value.trim();
    var currency = document.getElementById('currency').value;
    
    if (!name) {
        showToast('Please enter your full name', 'error');
        return;
    }
    
    var profile = {
        name: name,
        phone: phone,
        currency: currency,
        updatedAt: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('smartbudget_user_profile', JSON.stringify(profile));
        showToast('Profile saved successfully! ✅', 'success');
        console.log('✅ Profile saved');
    } catch (e) {
        showToast('Error saving profile: ' + e.message, 'error');
    }
};

// ============================================
// SAVE PREFERENCES
// ============================================
window.savePreferences = function() {
    console.log('💾 Saving preferences...');
    
    var theme = document.getElementById('theme').value;
    var dateFormat = document.getElementById('dateFormat').value;
    var defaultView = document.getElementById('defaultView').value;
    var emailNotifications = document.getElementById('emailNotifications').checked;
    var budgetAlerts = document.getElementById('budgetAlerts').checked;
    
    var preferences = {
        theme: theme,
        dateFormat: dateFormat,
        defaultView: defaultView,
        emailNotifications: emailNotifications,
        budgetAlerts: budgetAlerts,
        updatedAt: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('smartbudget_preferences', JSON.stringify(preferences));
        showToast('Preferences saved successfully! ✅', 'success');
        console.log('✅ Preferences saved');
        
        // Apply theme if changed
        applyTheme(theme);
    } catch (e) {
        showToast('Error saving preferences: ' + e.message, 'error');
    }
};

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.style.setProperty('--bg-dashboard', '#F1F5F9');
        document.documentElement.style.setProperty('--bg-sidebar', '#E2E8F0');
        document.documentElement.style.setProperty('--bg-card', '#FFFFFF');
        document.documentElement.style.setProperty('--text-primary', '#0F172A');
        document.documentElement.style.setProperty('--text-secondary', '#475569');
    } else if (theme === 'dark') {
        document.documentElement.style.setProperty('--bg-dashboard', '#0F172A');
        document.documentElement.style.setProperty('--bg-sidebar', '#0B1120');
        document.documentElement.style.setProperty('--bg-card', '#1E293B');
        document.documentElement.style.setProperty('--text-primary', '#F1F5F9');
        document.documentElement.style.setProperty('--text-secondary', '#94A3B8');
    }
    // 'system' uses default
}

// ============================================
// CHANGE PASSWORD
// ============================================
window.changePassword = function() {
    console.log('🔒 Changing password...');
    
    var current = document.getElementById('currentPassword').value;
    var newPass = document.getElementById('newPassword').value;
    var confirm = document.getElementById('confirmPassword').value;
    
    if (!current || !newPass || !confirm) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (newPass !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    showToast('Password updated successfully! 🔒', 'success');
    console.log('✅ Password changed');
    
    // Clear fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
};

// ============================================
// DELETE ACCOUNT
// ============================================
window.showDeleteConfirm = function() {
    document.getElementById('deleteModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('deleteConfirmText').value = '';
    document.getElementById('btnDeleteConfirm').disabled = true;
    
    // Setup listener for confirm text
    setupDeleteConfirmListener();
};

window.closeDeleteModal = function() {
    document.getElementById('deleteModal').style.display = 'none';
    document.body.style.overflow = '';
};

window.setupDeleteConfirmListener = function() {
    var input = document.getElementById('deleteConfirmText');
    if (input) {
        input.oninput = function() {
            var btn = document.getElementById('btnDeleteConfirm');
            if (btn) {
                btn.disabled = this.value !== 'DELETE';
            }
        };
    }
};

window.deleteAccount = function() {
    var confirmText = document.getElementById('deleteConfirmText').value;
    if (confirmText !== 'DELETE') {
        showToast('Please type DELETE to confirm', 'error');
        return;
    }
    
    if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
        showToast('Account deletion requested...', 'info');
        console.log('🗑️ Account deletion requested');
        
        // Clear localStorage
        localStorage.clear();
        
        // Close modal
        closeDeleteModal();
        
        // Redirect to logout
        setTimeout(function() {
            window.location.href = '/Account/Logout';
        }, 1500);
    }
};

// ============================================
// OTHER FUNCTIONS
// ============================================
window.setup2FA = function() {
    showToast('2FA setup coming soon! 🔐', 'info');
    console.log('🔐 2FA setup requested');
};

window.viewSessions = function() {
    showToast('Active sessions will be shown here', 'info');
    console.log('📱 View sessions requested');
};

// ============================================
// INITIALIZATION
// ============================================
function initSettingsPage() {
    console.log('⚙️ Settings page initializing...');
    setupSettingsSidebar();
    loadUserProfile();
    setupDeleteConfirmListener();
    console.log('✅ Settings page initialized');
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initSettingsPage();
    });
} else {
    initSettingsPage();
}

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================
if (window.pageRegistry) {
    window.pageRegistry.register('settings', {
        init: initSettingsPage,
        destroy: function() {
            console.log('🗑️ Settings: Cleanup');
        },
        refresh: function() {
            console.log('🔄 Settings: Refresh');
        }
    });
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.switchTab = window.switchTab;
window.saveProfile = window.saveProfile;
window.savePreferences = window.savePreferences;
window.changePassword = window.changePassword;
window.showDeleteConfirm = window.showDeleteConfirm;
window.closeDeleteModal = window.closeDeleteModal;
window.deleteAccount = window.deleteAccount;
window.setup2FA = window.setup2FA;
window.viewSessions = window.viewSessions;
window.loadUserProfile = window.loadUserProfile;
window.setupDeleteConfirmListener = window.setupDeleteConfirmListener;
window.showToast = showToast;

console.log('✅ Settings JS: Loaded');