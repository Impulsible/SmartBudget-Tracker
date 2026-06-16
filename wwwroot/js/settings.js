// ============================================
// SMARTBUDGET SETTINGS PAGE
// ============================================
console.log('Settings JS: Loaded');

let currentUserEmail = '';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page initializing...');
    initSidebar();
    initTabs();
    loadUserData();
});

function initSidebar() {
    var toggleBtn = document.getElementById('sidebarToggleBtn');
    var closeBtn = document.getElementById('sidebarCloseBtn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');

    if (toggleBtn) {
        toggleBtn.onclick = function() {
            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.add('open');
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

function initTabs() {
    console.log('Initializing tabs...');
    
    var tabs = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.settings-panel');
    
    console.log('Found tabs:', tabs.length);
    console.log('Found panels:', panels.length);
    
    if (!tabs.length) {
        console.log('No tabs found, retrying...');
        setTimeout(initTabs, 500);
        return;
    }
    
    // Remove any existing event listeners by cloning
    for (var i = 0; i < tabs.length; i++) {
        var newTab = tabs[i].cloneNode(true);
        tabs[i].parentNode.replaceChild(newTab, tabs[i]);
        tabs[i] = newTab;
    }
    
    // Refresh tabs collection
    tabs = document.querySelectorAll('.tab-btn');
    
    // Add click event to each tab
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', createTabHandler(tabs[i]));
    }
    
    // Show the first panel by default if none is active
    var hasActive = false;
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].classList.contains('active')) {
            hasActive = true;
            break;
        }
    }
    
    if (!hasActive && tabs.length > 0) {
        tabs[0].classList.add('active');
        var firstPanel = document.getElementById(tabs[0].getAttribute('data-tab') + 'Panel');
        if (firstPanel) firstPanel.classList.add('active');
    }
}

function createTabHandler(tab) {
    return function(e) {
        e.preventDefault();
        var tabId = tab.getAttribute('data-tab');
        console.log('Tab clicked:', tabId);
        
        // Get all tabs and panels
        var allTabs = document.querySelectorAll('.tab-btn');
        var allPanels = document.querySelectorAll('.settings-panel');
        
        // Remove active class from all tabs
        for (var i = 0; i < allTabs.length; i++) {
            allTabs[i].classList.remove('active');
        }
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all panels
        for (var i = 0; i < allPanels.length; i++) {
            allPanels[i].classList.remove('active');
        }
        
        // Show selected panel
        var activePanel = document.getElementById(tabId + 'Panel');
        if (activePanel) {
            activePanel.classList.add('active');
            console.log('Activated panel:', tabId + 'Panel');
        } else {
            console.log('Panel not found:', tabId + 'Panel');
        }
    };
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
    toast.innerHTML = '<i class="bi bi-' + (type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill') + '"></i><span>' + message + '</span>';
    toast.style.cssText = 'background:#1E293B;border-left:3px solid ' + (type === 'success' ? '#10B981' : '#EF4444') + ';padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        if (toast && toast.remove) toast.remove();
    }, 3000);
}

async function loadUserData() {
    try {
        var response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            console.log('Profile fetch failed:', response.status);
            setDefaultValues();
            return;
        }
        
        var data = await response.json();
        console.log('Profile data:', data);
        
        if (data && data.success) {
            currentUserEmail = data.email || '';
            
            var emailInput = document.getElementById('email');
            var fullNameInput = document.getElementById('fullName');
            var phoneInput = document.getElementById('phoneNumber');
            var currencySelect = document.getElementById('currency');
            
            if (emailInput) emailInput.value = data.email || '';
            if (fullNameInput) fullNameInput.value = data.fullName || '';
            if (phoneInput && data.phoneNumber) phoneInput.value = data.phoneNumber;
            
            loadSavedPreferences();
        } else {
            setDefaultValues();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        setDefaultValues();
    }
}

function setDefaultValues() {
    var emailInput = document.getElementById('email');
    var fullNameInput = document.getElementById('fullName');
    
    if (emailInput) emailInput.value = 'user@example.com';
    if (fullNameInput) fullNameInput.value = 'User';
    
    loadSavedPreferences();
}

function loadSavedPreferences() {
    var savedTheme = localStorage.getItem('theme') || 'dark';
    var savedDateFormat = localStorage.getItem('dateFormat') || 'MM/dd/yyyy';
    var savedDefaultView = localStorage.getItem('defaultView') || 'overview';
    var savedEmailNotifications = localStorage.getItem('emailNotifications') === 'true';
    var savedBudgetAlerts = localStorage.getItem('budgetAlerts') === 'true';
    
    var themeSelect = document.getElementById('theme');
    var dateFormatSelect = document.getElementById('dateFormat');
    var defaultViewSelect = document.getElementById('defaultView');
    var emailNotificationsCheck = document.getElementById('emailNotifications');
    var budgetAlertsCheck = document.getElementById('budgetAlerts');
    
    if (themeSelect) themeSelect.value = savedTheme;
    if (dateFormatSelect) dateFormatSelect.value = savedDateFormat;
    if (defaultViewSelect) defaultViewSelect.value = savedDefaultView;
    if (emailNotificationsCheck) emailNotificationsCheck.checked = savedEmailNotifications;
    if (budgetAlertsCheck) budgetAlertsCheck.checked = savedBudgetAlerts;
}

function saveProfile() {
    var fullNameInput = document.getElementById('fullName');
    var phoneNumberInput = document.getElementById('phoneNumber');
    var currencySelect = document.getElementById('currency');
    
    var fullName = fullNameInput ? fullNameInput.value : '';
    var phoneNumber = phoneNumberInput ? phoneNumberInput.value : '';
    var currency = currencySelect ? currencySelect.value : 'NGN';

    try {
        if (currencySelect) localStorage.setItem('currency', currency);
        if (phoneNumberInput) localStorage.setItem('phoneNumber', phoneNumber);
        
        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        showToast('Error updating profile', 'error');
        console.error(error);
    }
}

function savePreferences() {
    var themeSelect = document.getElementById('theme');
    var dateFormatSelect = document.getElementById('dateFormat');
    var defaultViewSelect = document.getElementById('defaultView');
    var emailNotificationsCheck = document.getElementById('emailNotifications');
    var budgetAlertsCheck = document.getElementById('budgetAlerts');
    
    var theme = themeSelect ? themeSelect.value : 'dark';
    var dateFormat = dateFormatSelect ? dateFormatSelect.value : 'MM/dd/yyyy';
    var defaultView = defaultViewSelect ? defaultViewSelect.value : 'overview';
    var emailNotifications = emailNotificationsCheck ? emailNotificationsCheck.checked : false;
    var budgetAlerts = budgetAlertsCheck ? budgetAlertsCheck.checked : false;

    try {
        localStorage.setItem('theme', theme);
        localStorage.setItem('dateFormat', dateFormat);
        localStorage.setItem('defaultView', defaultView);
        localStorage.setItem('emailNotifications', emailNotifications);
        localStorage.setItem('budgetAlerts', budgetAlerts);
        
        applyTheme(theme);
        
        showToast('Preferences saved successfully!', 'success');
    } catch (error) {
        showToast('Error saving preferences', 'error');
        console.error(error);
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
}

async function changePassword() {
    var currentPasswordInput = document.getElementById('currentPassword');
    var newPasswordInput = document.getElementById('newPassword');
    var confirmPasswordInput = document.getElementById('confirmPassword');
    
    var currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
    var newPassword = newPasswordInput ? newPasswordInput.value : '';
    var confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        var response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                currentPassword: currentPassword, 
                newPassword: newPassword 
            })
        });

        if (response.ok) {
            showToast('Password changed successfully!', 'success');
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
        } else {
            var error = await response.json();
            showToast(error.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        showToast('Error changing password', 'error');
        console.error(error);
    }
}

function setup2FA() {
    showToast('2FA setup will be available soon', 'info');
}

function viewSessions() {
    showToast('Session management coming soon', 'info');
}

function showDeleteConfirm() {
    var modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeDeleteModal() {
    var modal = document.getElementById('deleteModal');
    var confirmInput = document.getElementById('deleteConfirmText');
    
    if (modal) modal.style.display = 'none';
    if (confirmInput) confirmInput.value = '';
}

async function deleteAccount() {
    var confirmInput = document.getElementById('deleteConfirmText');
    var confirmText = confirmInput ? confirmInput.value : '';
    
    if (confirmText !== 'DELETE') {
        showToast('Please type "DELETE" to confirm account deletion', 'error');
        return;
    }

    try {
        var response = await fetch('/api/auth/delete-account', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            showToast('Account deleted. Redirecting...', 'success');
            setTimeout(function() {
                window.location.href = '/Account/Logout';
            }, 2000);
        } else {
            var error = await response.json();
            showToast(error.message || 'Failed to delete account', 'error');
        }
    } catch (error) {
        showToast('Error deleting account', 'error');
        console.error(error);
    }
}

// Make functions global
window.saveProfile = saveProfile;
window.savePreferences = savePreferences;
window.changePassword = changePassword;
window.setup2FA = setup2FA;
window.viewSessions = viewSessions;
window.showDeleteConfirm = showDeleteConfirm;
window.closeDeleteModal = closeDeleteModal;
window.deleteAccount = deleteAccount;

// ============================================
// SETTINGS INIT FUNCTION - EXPOSE FOR BLAZOR
// ============================================
window.initSettingsPage = function() {
    console.log('🔄 settings: init called from Blazor');
    initSidebar();
    initTabs();
    loadUserData();
    console.log('✅ settings: initialized');
};