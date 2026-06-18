// ============================================
// GUIDES PAGE JAVASCRIPT
// ============================================
console.log('Guides Page JS: Loaded');

// ============================================
// FILTER GUIDES BY CATEGORY
// ============================================
window.filterGuides = function(category) {
    var guides = document.querySelectorAll('.guide-card');
    var pills = document.querySelectorAll('.category-pill');
    
    pills.forEach(function(pill) {
        pill.classList.remove('active');
        var pillCategory = pill.getAttribute('data-category');
        if (pillCategory === category) {
            pill.classList.add('active');
        }
    });
    
    var hasResults = false;
    guides.forEach(function(guide) {
        var guideCategory = guide.getAttribute('data-category');
        if (category === 'all' || guideCategory === category) {
            guide.style.display = 'block';
            hasResults = true;
        } else {
            guide.style.display = 'none';
        }
    });
    
    var grid = document.getElementById('guidesGrid');
    var noResults = grid.querySelector('.no-results');
    if (!hasResults) {
        if (!noResults) {
            var msg = document.createElement('div');
            msg.className = 'no-results';
            msg.innerHTML = '<i class="bi bi-folder-open"></i><p>No guides in this category</p><p>Try selecting a different category.</p>';
            grid.appendChild(msg);
        }
    } else {
        if (noResults) {
            noResults.remove();
        }
    }
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
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    var allPill = document.querySelector('.category-pill[data-category="all"]');
    if (allPill) {
        allPill.classList.add('active');
    }
    console.log('📚 Guides page initialized - 10 guides loaded');
});

// ============================================
// REGISTER WITH PAGE REGISTRY
// ============================================
if (window.pageRegistry) {
    window.pageRegistry.register('guides', {
        init: function() {
            console.log('📚 Guides page initialized');
            var allPill = document.querySelector('.category-pill[data-category="all"]');
            if (allPill) {
                allPill.classList.add('active');
            }
        },
        destroy: function() {
            console.log('🗑️ Guides: Cleanup');
        },
        refresh: function() {
            console.log('🔄 Guides: Refresh');
        }
    });
}

window.filterGuides = window.filterGuides;
window.subscribeNewsletter = window.subscribeNewsletter;

console.log('✅ Guides Page JS: Loaded');