// ============================================
// SMARTBUDGET - PWA Installation Handler
// WITH PIGGY BANK ICON
// ============================================
console.log('📲 Install JS: Loaded');

var deferredPrompt = null;
var installBanner = null;
var installButton = null;
var dismissButton = null;

// ============================================
// SHOW INSTALL BANNER
// ============================================
function showInstallBanner() {
    if (window.navigator.standalone === true) {
        console.log('📱 Already installed as PWA');
        return;
    }
    
    if (localStorage.getItem('smartbudget_install_dismissed') === 'true') {
        console.log('📲 User dismissed install banner');
        return;
    }
    
    if (localStorage.getItem('smartbudget_pwa_installed') === 'true') {
        console.log('📲 PWA already installed');
        return;
    }
    
    if (window.matchMedia('(display-mode: browser)').matches) {
        console.log('🌐 Running in browser - showing install banner');
        createInstallBanner();
    }
}

// ============================================
// CREATE INSTALL BANNER WITH PIGGY LOGO
// ============================================
function createInstallBanner() {
    var existing = document.getElementById('installBanner');
    if (existing) {
        existing.remove();
    }
    
    installBanner = document.createElement('div');
    installBanner.id = 'installBanner';
    installBanner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #1E293B 0%, #253349 100%);
        padding: 1rem 1.5rem;
        z-index: 9999;
        border-top: 3px solid #10B981;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        box-shadow: 0 -4px 30px rgba(0,0,0,0.5);
        animation: slideUpBanner 0.5s ease;
        flex-wrap: wrap;
    `;
    
    if (!document.querySelector('#installBannerStyle')) {
        var style = document.createElement('style');
        style.id = 'installBannerStyle';
        style.textContent = `
            @keyframes slideUpBanner {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideDownBanner {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(100%); opacity: 0; }
            }
            .piggy-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                box-shadow: 0 4px 12px rgba(16,185,129,0.3);
                flex-shrink: 0;
            }
            .piggy-icon svg {
                width: 28px;
                height: 28px;
                fill: white;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Piggy bank icon using SVG
    var piggySVG = `
        <svg viewBox="0 0 512 512" width="28" height="28" fill="white">
            <path d="M320,128L320,128c-17.7,0-32-14.3-32-32v-6.4C288,68.8,300.8,56,316.8,56c6.4,0,12.8,1.6,17.6,4.8l12.8,6.4
                c4.8,3.2,9.6,4.8,14.4,4.8H384c17.7,0,32,14.3,32,32v16H320z"/>
            <path d="M456,192c17.7,0,32-14.3,32-32v-16c0-17.7-14.3-32-32-32h-8c-3.2-12.8-9.6-24-19.2-33.6
                C412.8,67.2,400,64,387.2,64h-30.4c-14.4,0-28.8-6.4-40-17.6l-8-4.8C299.2,35.2,281.6,28.8,264,28.8
                c-30.4,0-56,22.4-59.2,52.8C161.6,92.8,128,132.8,128,180v10c0,0,0,0,0,0C128,201.6,139.2,213.6,152,220.8
                c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0C148.8,228.8,147.2,236.8,147.2,244.8c0,14.4,4.8,27.2,12.8,38.4
                c-6.4,9.6-9.6,20.8-9.6,32c0,35.2,28.8,64,64,64c0,0,0,0,0,0h11.2c4.8,20.8,19.2,38.4,38.4,46.4
                c-6.4,6.4-11.2,14.4-11.2,24c0,17.7,14.3,32,32,32c17.7,0,32-14.3,32-32c0-4.8-1.6-9.6-3.2-14.4
                c1.6,0,3.2,0,4.8,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0
                c4.8,0,9.6,0,14.4-3.2c6.4-1.6,12.8-3.2,17.6-8L368,390.4c4.8-4.8,8-9.6,9.6-14.4l0,0c0,0,0,0,0,0
                c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0
                c12.8,3.2,27.2,1.6,38.4-6.4c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0
                c4.8-3.2,9.6-8,12.8-12.8c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0
                c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c4.8-6.4,8-14.4,8-22.4
                c0-9.6-3.2-19.2-8-27.2l0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0
                c6.4-9.6,9.6-22.4,9.6-35.2c0-9.6-1.6-19.2-6.4-27.2c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0
                c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0c0,0,0,0,0,0
                c20.8-17.6,33.6-43.2,35.2-72
                C456,225.6,464,209.6,464,192H456z M288,288c0,17.7-14.3,32-32,32s-32-14.3-32-32c0-17.7,14.3-32,32-32
                S288,270.3,288,288z M384,288c0,17.7-14.3,32-32,32s-32-14.3-32-32c0-17.7,14.3-32,32-32S384,270.3,384,288z"/>
        </svg>
    `;
    
    installBanner.innerHTML = `
        <div style="display:flex;align-items:center;gap:1rem;flex:1;min-width:200px;">
            <div class="piggy-icon">
                ${piggySVG}
            </div>
            <div>
                <div style="font-weight:700;color:#F1F5F9;font-size:0.95rem;">Install SmartBudget App</div>
                <div style="font-size:0.8rem;color:#94A3B8;">Track expenses, budget, and save — offline and fast</div>
            </div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button id="installAppBtn" style="
                padding:0.6rem 1.25rem;
                background:linear-gradient(135deg,#10B981,#059669);
                color:white;
                border:none;
                border-radius:8px;
                font-weight:600;
                font-size:0.85rem;
                cursor:pointer;
                font-family:'Inter',sans-serif;
                transition:all 0.2s ease;
                box-shadow:0 4px 12px rgba(16,185,129,0.2);
            ">Install App</button>
            <button id="dismissInstallBtn" style="
                padding:0.6rem 1rem;
                background:transparent;
                color:#94A3B8;
                border:1px solid rgba(148,163,184,0.2);
                border-radius:8px;
                font-weight:500;
                font-size:0.85rem;
                cursor:pointer;
                font-family:'Inter',sans-serif;
                transition:all 0.2s ease;
            ">Dismiss</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    installButton = document.getElementById('installAppBtn');
    dismissButton = document.getElementById('dismissInstallBtn');
    
    if (installButton) {
        installButton.addEventListener('click', handleInstallClick);
        installButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 24px rgba(16,185,129,0.35)';
        });
        installButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)';
        });
    }
    
    if (dismissButton) {
        dismissButton.addEventListener('click', handleDismissClick);
        dismissButton.addEventListener('mouseenter', function() {
            this.style.color = '#F1F5F9';
            this.style.borderColor = 'rgba(148,163,184,0.4)';
        });
        dismissButton.addEventListener('mouseleave', function() {
            this.style.color = '#94A3B8';
            this.style.borderColor = 'rgba(148,163,184,0.2)';
        });
    }
}

// ============================================
// HANDLE INSTALL CLICK
// ============================================
function handleInstallClick() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
                localStorage.setItem('smartbudget_pwa_installed', 'true');
                removeBanner();
                showInstallToast('🎉 Installing SmartBudget...');
            } else {
                console.log('❌ User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    } else {
        showInstallInstructions();
    }
}

// ============================================
// HANDLE DISMISS
// ============================================
function handleDismissClick() {
    localStorage.setItem('smartbudget_install_dismissed', 'true');
    removeBanner();
    console.log('📲 User dismissed install banner');
}

// ============================================
// REMOVE BANNER
// ============================================
function removeBanner() {
    if (installBanner) {
        installBanner.style.animation = 'slideDownBanner 0.4s ease forwards';
        setTimeout(function() {
            if (installBanner && installBanner.parentNode) {
                installBanner.remove();
                installBanner = null;
            }
        }, 400);
    }
}

// ============================================
// SHOW INSTALL INSTRUCTIONS
// ============================================
function showInstallInstructions() {
    var overlay = document.createElement('div');
    overlay.id = 'installInstructions';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(8px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: #1E293B;
            border-radius: 20px;
            padding: 2rem;
            max-width: 420px;
            width: 100%;
            border: 1px solid rgba(148,163,184,0.1);
            text-align: center;
        ">
            <div style="
                width:80px;
                height:80px;
                background:linear-gradient(135deg,#10B981,#059669);
                border-radius:20px;
                display:flex;
                align-items:center;
                justify-content:center;
                margin:0 auto 1rem;
                font-size:2.5rem;
                color:white;
                box-shadow:0 8px 24px rgba(16,185,129,0.3);
            ">🐷</div>
            <h3 style="color:#F1F5F9;font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Install SmartBudget</h3>
            <p style="color:#94A3B8;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">
                To install SmartBudget on your device, use your browser's install option:
            </p>
            <div style="text-align:left;background:#0F172A;border-radius:12px;padding:1rem;margin-bottom:1.5rem;">
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid rgba(148,163,184,0.06);">
                    <span style="background:#3B82F6;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0;">1</span>
                    <span style="color:#CBD5E1;font-size:0.85rem;">Click the <i class="bi bi-three-dots" style="color:#94A3B8;"></i> menu in your browser</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid rgba(148,163,184,0.06);">
                    <span style="background:#3B82F6;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0;">2</span>
                    <span style="color:#CBD5E1;font-size:0.85rem;">Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong></span>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;">
                    <span style="background:#3B82F6;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0;">3</span>
                    <span style="color:#CBD5E1;font-size:0.85rem;">Confirm installation</span>
                </div>
            </div>
            <button onclick="this.closest('#installInstructions').remove()" style="
                padding:0.7rem 2rem;
                background:linear-gradient(135deg,#10B981,#059669);
                color:white;
                border:none;
                border-radius:10px;
                font-weight:600;
                font-size:0.9rem;
                cursor:pointer;
                font-family:'Inter',sans-serif;
                transition:all 0.2s ease;
                width:100%;
            ">Got it!</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📲 Before install prompt captured');
    showInstallBanner();
});

window.addEventListener('appinstalled', function() {
    console.log('✅ App successfully installed!');
    localStorage.setItem('smartbudget_pwa_installed', 'true');
    removeBanner();
    showInstallToast('🎉 SmartBudget installed successfully!');
});

// ============================================
// TOAST
// ============================================
function showInstallToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1E293B;
        border-left: 4px solid #10B981;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        z-index: 10001;
        color: #F1F5F9;
        font-size: 0.95rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideDownBanner 0.5s ease;
        font-family: 'Inter', sans-serif;
    `;
    toast.innerHTML = `<span style="font-size:1.25rem;">🎉</span> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(function() {
            toast.remove();
        }, 500);
    }, 4000);
}

// ============================================
// CHECK IF INSTALLED
// ============================================
function checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        console.log('📱 Running as installed app');
        localStorage.setItem('smartbudget_pwa_installed', 'true');
        return true;
    }
    return false;
}

// ============================================
// AUTO-SHOW BANNER
// ============================================
function autoShowInstallBanner() {
    var path = window.location.pathname;
    if (path.includes('/Account/') || path.includes('/login') || path.includes('/register')) {
        console.log('📲 Skipping install banner on auth page');
        return;
    }
    
    if (checkIfInstalled()) {
        return;
    }
    
    setTimeout(function() {
        showInstallBanner();
    }, 3000);
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📲 Install JS: Initializing...');
    autoShowInstallBanner();
});

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        checkIfInstalled();
    }
});

// Expose functions
window.showInstallBanner = showInstallBanner;
window.handleInstallClick = handleInstallClick;
window.handleDismissClick = handleDismissClick;
window.installApp = handleInstallClick;
window.dismissInstall = handleDismissClick;

console.log('✅ Install JS: Ready!');