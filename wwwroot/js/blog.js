// ============================================
// BLOG PAGE JAVASCRIPT
// ============================================
console.log('Blog Page JS: Loaded');

// ============================================
// FILTER POSTS BY CATEGORY
// ============================================
window.filterPosts = function(category) {
    var posts = document.querySelectorAll('.post-card');
    var buttons = document.querySelectorAll('.category-btn');
    
    // Update active button
    buttons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    // Find and activate the matching button
    buttons.forEach(function(btn) {
        var onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes("'" + category + "'")) {
            btn.classList.add('active');
        }
    });
    
    // Filter posts
    posts.forEach(function(post) {
        if (category === 'all' || post.dataset.category === category) {
            post.style.display = 'block';
            post.style.animation = 'fadeIn 0.4s ease';
        } else {
            post.style.display = 'none';
        }
    });
};

// ============================================
// NEWSLETTER SUBSCRIPTION
// ============================================
window.subscribeNewsletter = function() {
    var emailInput = document.getElementById('newsletterEmail');
    var messageDiv = document.getElementById('newsletterMessage');
    var email = emailInput.value.trim();
    
    if (!email) {
        showNewsletterMessage('Please enter your email address.', 'error');
        emailInput.focus();
        return;
    }
    
    if (!isValidEmail(email)) {
        showNewsletterMessage('Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
    }
    
    // Simulate API call
    var btn = document.querySelector('.newsletter-btn');
    var originalText = btn.textContent;
    btn.textContent = 'Subscribing...';
    btn.disabled = true;
    
    setTimeout(function() {
        showNewsletterMessage('🎉 Thank you for subscribing! Check your email for confirmation.', 'success');
        emailInput.value = '';
        btn.textContent = originalText;
        btn.disabled = false;
    }, 1500);
};

function showNewsletterMessage(message, type) {
    var messageDiv = document.getElementById('newsletterMessage');
    messageDiv.style.display = 'block';
    messageDiv.className = type === 'success' ? 'newsletter-message-success' : 'newsletter-message-error';
    messageDiv.textContent = message;
    
    setTimeout(function() {
        messageDiv.style.display = 'none';
    }, 5000);
}

function isValidEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ============================================
// ADD ANIMATION KEYFRAMES
// ============================================
var style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================
if (window.pageRegistry) {
    window.pageRegistry.register('blog', {
        init: function() {
            console.log('📝 Blog page initialized');
        },
        destroy: function() {
            console.log('🗑️ Blog: Cleanup');
        },
        refresh: function() {
            console.log('🔄 Blog: Refresh');
        }
    });
}

// Expose functions globally
window.filterPosts = window.filterPosts;
window.subscribeNewsletter = window.subscribeNewsletter;

console.log('✅ Blog Page JS: Loaded');