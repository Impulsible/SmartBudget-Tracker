// ============================================
// CONTACT PAGE JAVASCRIPT
// ============================================
console.log('Contact Page JS: Loaded');

// ============================================
// SEND CONTACT MESSAGE
// ============================================
window.sendContactMessage = function() {
    // Get form values
    var name = document.getElementById('contactName').value.trim();
    var email = document.getElementById('contactEmail').value.trim();
    var subject = document.getElementById('contactSubject').value;
    var message = document.getElementById('contactMessage').value.trim();
    
    // Hide any previous messages
    var successMsg = document.getElementById('contactSuccessMessage');
    var errorMsg = document.getElementById('contactErrorMessage');
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
    
    // Validate form
    if (!name) {
        showContactError('Please enter your name.');
        return;
    }
    
    if (!email) {
        showContactError('Please enter your email address.');
        return;
    }
    
    if (!isValidEmail(email)) {
        showContactError('Please enter a valid email address.');
        return;
    }
    
    if (!message) {
        showContactError('Please enter your message.');
        return;
    }
    
    if (message.length < 10) {
        showContactError('Your message must be at least 10 characters long.');
        return;
    }
    
    // Disable button and show loading state
    var btn = document.getElementById('sendContactBtn');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-sm"></span> Sending...';
    btn.disabled = true;
    
    // Simulate sending (replace with actual API call)
    setTimeout(function() {
        // Success
        showContactSuccess();
        
        // Reset form
        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';
        document.getElementById('contactSubject').value = 'general';
        
        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // Log for analytics
        console.log('📧 Contact message sent:', { name, email, subject, message });
        
    }, 1500);
};

// ============================================
// VALIDATE EMAIL
// ============================================
function isValidEmail(email) {
    var re = /^[^\s@@]+@@[^\s@@]+\.[^\s@@]+$/;
    return re.test(email);
}

// ============================================
// SHOW SUCCESS MESSAGE
// ============================================
function showContactSuccess() {
    var successMsg = document.getElementById('contactSuccessMessage');
    var errorMsg = document.getElementById('contactErrorMessage');
    
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) {
        successMsg.style.display = 'flex';
        
        // Auto-hide after 8 seconds
        setTimeout(function() {
            successMsg.style.display = 'none';
        }, 8000);
    }
}

// ============================================
// SHOW ERROR MESSAGE
// ============================================
function showContactError(text) {
    var errorMsg = document.getElementById('contactErrorMessage');
    var errorText = document.getElementById('contactErrorText');
    
    if (errorText) errorText.textContent = text;
    if (errorMsg) {
        errorMsg.style.display = 'flex';
        
        // Auto-hide after 6 seconds
        setTimeout(function() {
            errorMsg.style.display = 'none';
        }, 6000);
    }
}

// ============================================
// FAQ TOGGLE
// ============================================
function toggleFaq(element) {
    var item = element.closest('.faq-item');
    if (!item) return;
    
    item.classList.toggle('open');
}

// ============================================
// INITIALIZE FAQ TOGGLES
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to FAQ questions
    var faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(function(q) {
        q.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
    
    console.log('📋 FAQ toggles initialized');
});

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================
if (window.pageRegistry) {
    window.pageRegistry.register('contact', {
        init: function() {
            console.log('📬 Contact page initialized');
        },
        destroy: function() {
            console.log('🗑️ Contact: Cleanup');
        },
        refresh: function() {
            console.log('🔄 Contact: Refresh');
        }
    });
}

console.log('✅ Contact Page JS: Loaded');