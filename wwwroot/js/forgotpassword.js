// ============================================
// FORGOT PASSWORD PAGE
// ============================================
console.log('Forgot Password JS: Loaded');

// ============================================
// SHOW ERROR MESSAGE
// ============================================
window.showError = function(msg) {
    var errorDiv = document.getElementById('errorMessageDiv');
    var errorText = document.getElementById('errorText');
    var successDiv = document.getElementById('successMessageDiv');
    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv && errorText) {
        errorText.innerText = msg;
        errorDiv.style.display = 'flex';
    }
};

// ============================================
// SHOW SUCCESS MESSAGE
// ============================================
window.showSuccess = function(msg) {
    var successDiv = document.getElementById('successMessageDiv');
    var successText = document.getElementById('successText');
    var errorDiv = document.getElementById('errorMessageDiv');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv && successText) {
        successText.innerText = msg;
        successDiv.style.display = 'flex';
    }
};

// ============================================
// SHOW STEP 1 (Email Form)
// ============================================
window.showStep1 = function() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('forgotEmail').focus();
};

// ============================================
// SEND RESET LINK
// ============================================
window.sendResetLink = async function() {
    var email = document.getElementById('forgotEmail').value.trim();
    var btn = document.getElementById('sendResetBtn');
    
    if (!email || !email.includes('@')) {
        showError('Please enter a valid email address.');
        return;
    }
    
    var originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner-sm"></div><span>Sending...</span>';
    
    try {
        var response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        var result = await response.json();
        
        if (result.success) {
            document.getElementById('sentEmailDisplay').innerText = email;
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            document.getElementById('errorMessageDiv').style.display = 'none';
            document.getElementById('successMessageDiv').style.display = 'none';
        } else {
            showError(result.message || 'Failed to send reset link. Please try again.');
        }
    } catch (e) {
        console.error('Error:', e);
        showError('Network error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
};

// ============================================
// INITIALIZE EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    var sendBtn = document.getElementById('sendResetBtn');
    if (sendBtn) {
        sendBtn.onclick = window.sendResetLink;
    }
    
    var emailInput = document.getElementById('forgotEmail');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.sendResetLink();
            }
        });
        setTimeout(function() { 
            emailInput.focus(); 
        }, 300);
    }
});

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================
if (window.pageRegistry) {
    window.pageRegistry.register('forgotpassword', {
        init: function() {
            console.log('🔐 Forgot Password page initialized');
        },
        destroy: function() {
            console.log('🗑️ Forgot Password: Cleanup');
        },
        refresh: function() {
            console.log('🔄 Forgot Password: Refresh');
        }
    });
}

console.log('✅ Forgot Password JS: Loaded');