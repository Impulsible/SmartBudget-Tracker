// ============================================
// SMARTBUDGET - LOGIN PAGE JAVASCRIPT
// ============================================
console.log('Login JS: Loaded');

// ============================================
// TOGGLE PASSWORD VISIBILITY
// ============================================
function toggleLoginPassword() {
    var password = document.getElementById('loginPassword');
    var eyeIcon = document.getElementById('loginEyeIcon');
    
    if (!password || !eyeIcon) return;
    
    if (password.type === 'password') {
        password.type = 'text';
        eyeIcon.classList.remove('bi-eye');
        eyeIcon.classList.add('bi-eye-slash');
    } else {
        password.type = 'password';
        eyeIcon.classList.remove('bi-eye-slash');
        eyeIcon.classList.add('bi-eye');
    }
}

// ============================================
// SHOW ERROR MESSAGE
// ============================================
function showLoginError(message) {
    console.log('Login: Showing error:', message);
    
    var errorDiv = document.getElementById('errorMessageDiv');
    var errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.innerText = message;
        errorDiv.style.display = 'flex';
        
        if (window.errorTimeout) {
            clearTimeout(window.errorTimeout);
        }
        window.errorTimeout = setTimeout(function() {
            errorDiv.style.display = 'none';
        }, 6000);
    } else {
        alert(message);
    }
}

// ============================================
// HIDE ERROR MESSAGE
// ============================================
function hideLoginError() {
    var errorDiv = document.getElementById('errorMessageDiv');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// ============================================
// PERFORM LOGIN
// ============================================
async function performLogin() {
    console.log('Login: performLogin called');
    
    var emailInput = document.getElementById('loginEmail');
    var passwordInput = document.getElementById('loginPassword');
    var rememberMeCheckbox = document.getElementById('rememberMeCheckbox');
    var btn = document.getElementById('loginBtn');
    
    if (!emailInput || !passwordInput || !btn) {
        console.error('Login: Form elements not found');
        showLoginError('Form error. Please refresh the page.');
        return;
    }
    
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : true;
    
    if (!email) {
        showLoginError('Please enter your email address.');
        emailInput.focus();
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showLoginError('Please enter a valid email address.');
        emailInput.focus();
        return;
    }
    
    if (!password) {
        showLoginError('Please enter your password.');
        passwordInput.focus();
        return;
    }
    
    if (password.length < 6) {
        showLoginError('Password must be at least 6 characters.');
        passwordInput.focus();
        return;
    }
    
    var originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner-sm"></div><span>Signing in...</span>';
    
    try {
        console.log('Login: Sending request to /api/auth/login for:', email);
        
        var response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                email: email, 
                password: password, 
                rememberMe: rememberMe 
            })
        });
        
        console.log('Login: Response status:', response.status);
        
        var result = await response.json();
        console.log('Login: Response data:', result);
        
        if (result.success) {
            console.log('Login: Success, redirecting to dashboard...');
            window.location.href = '/dashboard';
        } else {
            showLoginError(result.message || 'Invalid email or password. Please try again.');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Network error. Please check your connection and try again.');
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login JS: DOM ready, initializing...');
    
    var loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn) {
        var newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        loginBtn = newBtn;
        
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            performLogin();
        });
        console.log('Login JS: Button handler attached');
    } else {
        console.warn('Login JS: Login button not found');
    }
    
    var emailInput = document.getElementById('loginEmail');
    if (emailInput) {
        emailInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performLogin();
            }
        });
        console.log('Login JS: Email input handler attached');
    }
    
    var passwordInput = document.getElementById('loginPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performLogin();
            }
        });
        console.log('Login JS: Password input handler attached');
    }
    
    if (emailInput) {
        setTimeout(function() { 
            emailInput.focus(); 
        }, 300);
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            hideLoginError();
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            hideLoginError();
        });
    }
    
    console.log('Login JS: Initialized');
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.performLogin = performLogin;
window.toggleLoginPassword = toggleLoginPassword;
window.showLoginError = showLoginError;
window.hideLoginError = hideLoginError;