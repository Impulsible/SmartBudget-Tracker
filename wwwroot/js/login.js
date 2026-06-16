// ============================================
// LOGIN PAGE - Eye Toggle & Form Submit
// ============================================
console.log('Login JS: Loaded');

// Toggle password visibility
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

// Show error message
function showLoginError(message) {
    console.log('Showing error:', message);
    
    var errorDiv = document.getElementById('errorMessageDiv');
    var errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.innerText = message;
        errorDiv.style.display = 'flex';
        
        // Auto-hide after 6 seconds
        if (window.errorTimeout) {
            clearTimeout(window.errorTimeout);
        }
        window.errorTimeout = setTimeout(function() {
            errorDiv.style.display = 'none';
        }, 6000);
    } else {
        // Fallback
        alert(message);
    }
}

// Perform login
async function performLogin() {
    console.log('Login: performLogin called');
    
    var emailInput = document.getElementById('loginEmail');
    var passwordInput = document.getElementById('loginPassword');
    var rememberMeCheckbox = document.getElementById('rememberMeCheckbox');
    var btn = document.getElementById('loginBtn');
    
    // Validate elements exist
    if (!emailInput) {
        console.error('Login: Email input not found');
        showLoginError('Form error. Please refresh the page.');
        return;
    }
    
    if (!passwordInput) {
        console.error('Login: Password input not found');
        showLoginError('Form error. Please refresh the page.');
        return;
    }
    
    if (!btn) {
        console.error('Login: Login button not found');
        showLoginError('Form error. Please refresh the page.');
        return;
    }
    
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : true;
    
    // Validation
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
    
    // Save original button text
    var originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner-sm"></div><span>Signing in...</span>';
    
    try {
        console.log('Login: Sending request to /api/auth/login');
        
        var response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                email: email, 
                password: password, 
                rememberMe: rememberMe 
            })
        });
        
        console.log('Login: Response status:', response.status);
        
        var result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('Login: Failed to parse response:', parseError);
            showLoginError('Server error. Please try again.');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            return;
        }
        
        console.log('Login: Response data:', result);
        
        if (result.success) {
            console.log('Login: Success, redirecting to dashboard...');
            // Store user info in session
            if (result.user) {
                sessionStorage.setItem('user', JSON.stringify(result.user));
            }
            window.location.href = '/dashboard';
        } else {
            showLoginError(result.message || 'Invalid email or password. Please try again.');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            // Clear password on failure
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login JS: DOM ready, initializing...');
    
    // Setup login button
    var loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn) {
        // Remove any existing event listeners by cloning
        var newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        loginBtn = newBtn;
        
        loginBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            performLogin();
        };
        console.log('Login JS: Button handler attached');
    } else {
        console.warn('Login JS: Login button not found');
    }
    
    // Setup Enter key on email field
    var emailInput = document.getElementById('loginEmail');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performLogin();
            }
        });
        console.log('Login JS: Email input handler attached');
    }
    
    // Setup Enter key on password field
    var passwordInput = document.getElementById('loginPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performLogin();
            }
        });
        console.log('Login JS: Password input handler attached');
    }
    
    // Auto-focus email
    if (emailInput) {
        setTimeout(function() { 
            emailInput.focus(); 
        }, 300);
    }
    
    // Hide error on input change
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            var errorDiv = document.getElementById('errorMessageDiv');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            var errorDiv = document.getElementById('errorMessageDiv');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
    }
    
    console.log('Login JS: Initialized');
});

// Make functions globally accessible for inline onclick handlers
window.performLogin = performLogin;
window.toggleLoginPassword = toggleLoginPassword;
window.showLoginError = showLoginError;