// ============================================
// CONTACT PAGE JAVASCRIPT
// ============================================
console.log('Contact Page JS: Loaded');

window.sendContactMessage = async function() {
    var name = document.getElementById('contactName').value.trim();
    var email = document.getElementById('contactEmail').value.trim();
    var subject = document.getElementById('contactSubject').value;
    var message = document.getElementById('contactMessage').value.trim();
    var btn = document.getElementById('sendContactBtn');
    
    if (!name) {
        showContactError('Please enter your name.');
        document.getElementById('contactName').focus();
        return;
    }
    
    if (!email) {
        showContactError('Please enter your email address.');
        document.getElementById('contactEmail').focus();
        return;
    }
    
    if (!isValidEmail(email)) {
        showContactError('Please enter a valid email address.');
        document.getElementById('contactEmail').focus();
        return;
    }
    
    if (!message) {
        showContactError('Please enter your message.');
        document.getElementById('contactMessage').focus();
        return;
    }
    
    hideContactMessages();
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Sending...';
    
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showContactSuccess();
        document.getElementById('contactForm').reset();
        btn.innerHTML = '<span>✓ Sent!</span>';
        setTimeout(function() {
            btn.innerHTML = '<span>Send Message</span> <i class="bi bi-send"></i>';
            btn.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('Error sending message:', error);
        showContactError('An error occurred. Please try again.');
        btn.disabled = false;
        btn.innerHTML = '<span>Send Message</span> <i class="bi bi-send"></i>';
    }
};

function isValidEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showContactSuccess() {
    var successDiv = document.getElementById('contactSuccessMessage');
    var errorDiv = document.getElementById('contactErrorMessage');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'flex';
    
    setTimeout(function() {
        if (successDiv) successDiv.style.display = 'none';
    }, 8000);
}

function showContactError(message) {
    var errorDiv = document.getElementById('contactErrorMessage');
    var errorText = document.getElementById('contactErrorText');
    var successDiv = document.getElementById('contactSuccessMessage');
    if (successDiv) successDiv.style.display = 'none';
    if (errorText) errorText.textContent = message;
    if (errorDiv) errorDiv.style.display = 'flex';
}

function hideContactMessages() {
    var errorDiv = document.getElementById('contactErrorMessage');
    var successDiv = document.getElementById('contactSuccessMessage');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

function initContactFaq() {
    var faqItems = document.querySelectorAll('.contact-faq .faq-item');
    faqItems.forEach(function(item) {
        var question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                faqItems.forEach(function(other) {
                    if (other !== item) {
                        other.classList.remove('open');
                    }
                });
                item.classList.toggle('open');
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var messageInput = document.getElementById('contactMessage');
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                window.sendContactMessage();
            }
        });
    }
    
    initContactFaq();
    console.log('Contact Page: Initialized');
});

if (window.pageRegistry) {
    window.pageRegistry.register('contact', {
        init: function() {
            console.log('📬 Contact page initialized');
            initContactFaq();
        },
        destroy: function() {
            console.log('🗑️ Contact: Cleanup');
        },
        refresh: function() {
            console.log('🔄 Contact: Refresh');
        }
    });
}

window.sendContactMessage = window.sendContactMessage;