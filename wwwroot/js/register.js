// Password validation
function validatePassword() {
    const password = document.getElementById('password');
    if (!password) return;
    
    const value = password.value;
    const reqDiv = document.getElementById('passwordRequirements');
    
    // Show/hide requirements
    if (reqDiv) {
        reqDiv.style.display = value.length > 0 ? 'grid' : 'none';
    }
    
    // Length check
    const lengthReq = document.getElementById('lengthReq');
    if (lengthReq) {
        if (value.length >= 6) {
            lengthReq.classList.add('met');
            lengthReq.querySelector('i').className = 'bi bi-check-circle-fill';
        } else {
            lengthReq.classList.remove('met');
            lengthReq.querySelector('i').className = 'bi bi-circle';
        }
    }
    
    // Uppercase check
    const upperReq = document.getElementById('upperReq');
    if (upperReq) {
        if (/[A-Z]/.test(value)) {
            upperReq.classList.add('met');
            upperReq.querySelector('i').className = 'bi bi-check-circle-fill';
        } else {
            upperReq.classList.remove('met');
            upperReq.querySelector('i').className = 'bi bi-circle';
        }
    }
    
    // Lowercase check
    const lowerReq = document.getElementById('lowerReq');
    if (lowerReq) {
        if (/[a-z]/.test(value)) {
            lowerReq.classList.add('met');
            lowerReq.querySelector('i').className = 'bi bi-check-circle-fill';
        } else {
            lowerReq.classList.remove('met');
            lowerReq.querySelector('i').className = 'bi bi-circle';
        }
    }
    
    // Digit check
    const digitReq = document.getElementById('digitReq');
    if (digitReq) {
        if (/[0-9]/.test(value)) {
            digitReq.classList.add('met');
            digitReq.querySelector('i').className = 'bi bi-check-circle-fill';
        } else {
            digitReq.classList.remove('met');
            digitReq.querySelector('i').className = 'bi bi-circle';
        }
    }
    
    validateMatch();
}

// Password match validation
function validateMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPasswordInput');
    const matchMessage = document.getElementById('matchMessage');
    
    if (!password || !confirmPassword || !matchMessage) return;
    
    if (confirmPassword.value.length > 0) {
        if (password.value === confirmPassword.value) {
            matchMessage.innerHTML = '<div class="field-success"><i class="bi bi-check-circle"></i><span>Passwords match</span></div>';
        } else {
            matchMessage.innerHTML = '<div class="field-error"><i class="bi bi-x-circle"></i><span>Passwords do not match</span></div>';
        }
    } else {
        matchMessage.innerHTML = '';
    }
}

// Toggle password visibility
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessageDiv');
    const errorText = document.getElementById('errorText');
    const successDiv = document.getElementById('successMessageDiv');
    
    if (successDiv) successDiv.style.display = 'none';
    if (errorText) errorText.innerText = message;
    if (errorDiv) errorDiv.style.display = 'flex';
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessageDiv');
    const successText = document.getElementById('successText');
    const errorDiv = document.getElementById('errorMessageDiv');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successText) successText.innerText = message;
    if (successDiv) successDiv.style.display = 'flex';
}

// Create account function
async function createAccount() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    const agreeTerms = document.getElementById('agreeTermsCheckbox').checked;
    
    if (!fullName) {
        showError('Please enter your full name.');
        return;
    }
    
    if (!email || !email.includes('@')) {
        showError('Please enter a valid email address.');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
    }
    
    if (!/[A-Z]/.test(password)) {
        showError('Password must contain at least one uppercase letter.');
        return;
    }
    
    if (!/[a-z]/.test(password)) {
        showError('Password must contain at least one lowercase letter.');
        return;
    }
    
    if (!/[0-9]/.test(password)) {
        showError('Password must contain at least one number.');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }
    
    if (!agreeTerms) {
        showError('You must agree to the Terms of Service.');
        return;
    }
    
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner-sm"></div><span>Creating account...</span>';
    
    showSuccess('Creating account...');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Account created successfully! Redirecting...');
            setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
        } else {
            showError(result.message || 'Registration failed.');
            btn.disabled = false;
            btn.innerHTML = '<span>Create free account</span>';
        }
    } catch (error) {
        showError('Network error. Please try again.');
        btn.disabled = false;
        btn.innerHTML = '<span>Create free account</span>';
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['fullName', 'email', 'password', 'confirmPasswordInput'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    createAccount();
                }
            });
        }
    });
});