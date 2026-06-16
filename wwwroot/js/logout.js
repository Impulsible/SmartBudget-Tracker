// ============================================
// LOGOUT PAGE - Countdown & Redirect
// ============================================
window.startLogoutCountdown = function(seconds) {
    console.log('Logout countdown started: ' + seconds + ' seconds');
    
    var countdownDisplay = document.getElementById('countdownDisplay');
    var autoRedirect = document.getElementById('autoRedirect');
    var countdown = seconds;
    
    if (!countdownDisplay) {
        console.log('Countdown display not found, redirecting immediately');
        setTimeout(function() {
            window.location.href = '/';
        }, 1000);
        return;
    }
    
    var interval = setInterval(function() {
        countdown--;
        
        if (countdownDisplay) {
            countdownDisplay.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(interval);
            
            // Add fade effect before redirect
            if (autoRedirect) {
                autoRedirect.style.opacity = '0.5';
                autoRedirect.style.transition = 'opacity 0.3s ease';
                autoRedirect.querySelector('p').textContent = 'Redirecting now...';
            }
            
            // Redirect to home page
            setTimeout(function() {
                window.location.href = '/';
            }, 500);
        }
    }, 1000);
    
    // Allow clicking the buttons to cancel auto-redirect
    var actionButtons = document.querySelectorAll('.btn-home, .btn-login');
    actionButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            clearInterval(interval);
            console.log('Auto-redirect cancelled - user clicked a button');
        });
    });
};