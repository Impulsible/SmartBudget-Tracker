// ============================================
// FORGOT PASSWORD PAGE
// ============================================
console.log('Forgot Password JS: Loaded');

function showError(msg) {
    var errorDiv = document.getElementById('errorMessageDiv');
    var errorText = document.getElementById('errorText');
    var successDiv = document.getElementById('successMessageDiv');
    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv && errorText) {
        errorText.innerText = msg;
        errorDiv.style.display = 'flex';
    }
}

function showSuccess(msg) {
    var successDiv = document.getElementById('successMessageDiv');
    var successText = document.getElementById('successText');
    var errorDiv = document.getElementById('errorMessageDiv');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv && successText) {
        successText.innerText = msg;
        successDiv.style.display = 'flex';
    }
}

function showStep1() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
}

async function sendResetLink() {
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
}

document.addEventListener('DOMContentLoaded', function() {
    var sendBtn = document.getElementById('sendResetBtn');
    if (sendBtn) {
        sendBtn.onclick = sendResetLink;
    }
    
    var emailInput = document.getElementById('forgotEmail');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendResetLink();
        });
        setTimeout(function() { emailInput.focus(); }, 300);
    }
});