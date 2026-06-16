// ============================================
// SMARTBUDGET - MARKETING PAGE JAVASCRIPT
// Animated Counters, Mobile Menu, FAQ, Active Nav, Smooth Scroll
// LIVE DASHBOARD ANIMATION ENGINE INCLUDED
// AUTO-START ON PAGE LOAD
// ============================================

(function() {
    'use strict';
    console.log('SmartBudget JS: Script loaded');

    // Store observer instances to properly disconnect and reinitialize
    let countersObserver = null;
    let chartBarsObserver = null;
    let isInitialized = false;
    let isLiveRunning = false;

    // Retry counters - prevent infinite retries on non-marketing pages
    let mobileMenuRetries = 0;
    let faqRetries = 0;
    let activeNavRetries = 0;
    const MAX_RETRIES = 1;

    // Live animation globals
    let liveCounterInterval = null;
    let liveChartInterval = null;
    let liveBarInterval = null;

    // ============================================
    // USER AUTHENTICATION - Display First Name
    // ============================================
    async function loadUserProfile() {
        try {
            const response = await fetch('/api/auth/profile');
            if (!response.ok) return;
            
            const data = await response.json();
            if (!data.success) return;
            
            const fullName = data.fullName || 'User';
            const firstName = fullName.split(' ')[0];
            const initials = firstName.substring(0, 2).toUpperCase();
            
            // Update greeting in navbar
            const greetingElement = document.getElementById('userGreeting');
            if (greetingElement) {
                greetingElement.textContent = 'Welcome back, ' + firstName + '! 👋';
                greetingElement.style.display = 'inline-block';
            }
            
            // Update user initials circle
            const initialsElement = document.getElementById('userInitials');
            if (initialsElement) {
                initialsElement.textContent = initials;
                initialsElement.style.display = 'inline-flex';
            }
            
            // Update any mobile greeting
            const mobileGreeting = document.getElementById('mobileUserGreeting');
            if (mobileGreeting) {
                mobileGreeting.textContent = 'Hi, ' + firstName + '!';
                mobileGreeting.style.display = 'block';
            }
            
            // Update dashboard link with user name
            const dashboardLink = document.querySelector('.dashboard-link');
            if (dashboardLink) {
                dashboardLink.innerHTML = '<i class="bi bi-speedometer2"></i> Dashboard';
                dashboardLink.style.display = 'inline-flex';
            }
            
            // Show auth section, hide login/signup buttons
            const authSection = document.getElementById('authSection');
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');
            const mobileAuthSection = document.getElementById('mobileAuthSection');
            
            if (authSection) {
                authSection.style.display = 'flex';
                authSection.style.alignItems = 'center';
                authSection.style.gap = '12px';
            }
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            
            if (mobileAuthSection) {
                mobileAuthSection.style.display = 'block';
            }
            
            // Update mobile auth section
            const mobileGreetingText = document.querySelector('.mobile-user-greeting');
            if (mobileGreetingText) {
                mobileGreetingText.textContent = 'Hi, ' + firstName + '! 👋';
            }
            
            console.log('SmartBudget: User authenticated - ' + fullName);
        } catch (e) {
            console.log('SmartBudget: User not authenticated');
            // Show login/signup buttons
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (signupBtn) signupBtn.style.display = 'inline-flex';
        }
    }

    // ============================================
    // REMOVE YELLOW OUTLINE FROM ELEMENTS
    // ============================================
    function removeYellowOutline() {
        const style = document.createElement('style');
        style.textContent = `
            *:focus { outline: none !important; box-shadow: none !important; }
            a:focus, button:focus, .btn:focus, .btn-gradient:focus, .btn-outline-pro:focus { outline: none !important; box-shadow: none !important; }
            .gradient-text:focus { outline: none !important; }
            #userGreeting { display: none; }
            #userInitials { display: none; }
            #mobileUserGreeting { display: none; }
            .dashboard-link { display: none; }
            #authSection { display: none; }
            #mobileAuthSection { display: none; }
        `;
        document.head.appendChild(style);
        
        document.querySelectorAll('a, button, .btn, .btn-gradient, .btn-outline-pro').forEach(el => {
            el.addEventListener('focus', (e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
            });
        });
        console.log('SmartBudget: Yellow outline removed');
    }

    // ============================================
    // LIVE COUNTER ANIMATION - Continuous Forever
    // ============================================
    function startLiveCounters() {
        const counters = document.querySelectorAll('.counter');
        if (counters.length === 0) {
            console.log('SmartBudget: No counters found');
            return;
        }
        console.log('SmartBudget: Starting live counters for ' + counters.length + ' counters');

        // Clear any existing interval
        if (liveCounterInterval) {
            clearInterval(liveCounterInterval);
        }

        // Function to animate a single counter from 0 to target
        function animateCounterFromZero(counter) {
            const target = parseInt(counter.dataset.target) || 0;
            const prefix = counter.dataset.prefix || '';
            const suffix = counter.dataset.suffix || '';

            function startLoop() {
                let startTime = null;
                const duration = 2500;

                function animate(timestamp) {
                    if (!startTime) startTime = timestamp;

                    const progress = Math.min(
                        (timestamp - startTime) / duration,
                        1
                    );

                    const eased = 1 - Math.pow(1 - progress, 3);

                    counter.textContent =
                        prefix +
                        Math.floor(target * eased).toLocaleString() +
                        suffix;

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        counter.textContent = prefix + target.toLocaleString() + suffix;
                        setTimeout(startLoop, 1000);
                    }
                }

                counter.textContent = prefix + '0' + suffix;
                requestAnimationFrame(animate);
            }

            startLoop();
        }

        // Start animation for each counter
        counters.forEach(counter => {
            animateCounterFromZero(counter);
        });

        // Also update counters every 4 seconds to simulate live data
        liveCounterInterval = setInterval(() => {
            counters.forEach(counter => {
                const target = parseInt(counter.dataset.target) || 0;
                const prefix = counter.dataset.prefix || '';
                const suffix = counter.dataset.suffix || '';
                
                // Slight fluctuation (±1-3%) for live feel
                const fluctuation = 0.97 + (Math.random() * 0.06);
                const newValue = Math.floor(target * fluctuation);
                const finalValue = Math.max(newValue, 0);
                
                // Update the counter smoothly
                let startTime = null;
                const duration = 1500;
                const currentText = counter.textContent;
                const startValue = parseInt(currentText.replace(/[^0-9]/g, '')) || 0;

                function smoothUpdate(timestamp) {
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = Math.floor(startValue + (finalValue - startValue) * eased);
                    counter.textContent = prefix + current.toLocaleString() + suffix;
                    
                    if (progress < 1) {
                        requestAnimationFrame(smoothUpdate);
                    } else {
                        counter.textContent = prefix + finalValue.toLocaleString() + suffix;
                    }
                }
                requestAnimationFrame(smoothUpdate);
            });
        }, 4000);
    }

    // ============================================
    // LIVE CHART BARS ANIMATION
    // ============================================
    function startLiveChartBars() {
        const chartBars = document.querySelectorAll('.chart-bar[data-width]');
        if (chartBars.length === 0) {
            console.log('SmartBudget: No chart bars found');
            return;
        }
        console.log('SmartBudget: Starting live chart bars for ' + chartBars.length + ' bars');

        if (liveChartInterval) {
            clearInterval(liveChartInterval);
        }

        // Store original widths
        const barData = [];
        chartBars.forEach(bar => {
            const originalWidth = parseInt(bar.dataset.width);
            barData.push({
                element: bar,
                originalWidth: originalWidth,
                currentWidth: originalWidth
            });
        });

        function animateBar(barDataItem) {
            const bar = barDataItem.element;
            const originalWidth = barDataItem.originalWidth;
            
            // Fluctuate ±2-5%
            const fluctuation = 0.95 + (Math.random() * 0.10);
            const newWidth = Math.min(Math.max(Math.floor(originalWidth * fluctuation), 5), 100);
            
            barDataItem.currentWidth = newWidth;
            
            // Add a subtle color change based on value
            const intensity = newWidth / 100;
            const r = Math.floor(16 + (56 * intensity));
            const g = Math.floor(185 - (50 * intensity));
            const b = Math.floor(129 - (30 * intensity));
            
            bar.style.transition = 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            bar.style.width = newWidth + '%';
            bar.style.background = `linear-gradient(90deg, rgba(16,185,129,0.3) 0%, rgba(${r},${g},${b},0.8) 100%)`;
            bar.style.boxShadow = `0 4px 20px rgba(16,185,129,${0.2 + (intensity * 0.3)})`;
        }

        // Initial animation with stagger
        chartBars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.transition = 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                bar.style.width = bar.dataset.width + '%';
            }, 100 + (index * 150));
        });

        // Live updates every 3 seconds
        liveChartInterval = setInterval(() => {
            barData.forEach((item, index) => {
                setTimeout(() => {
                    animateBar(item);
                }, index * 100);
            });
        }, 3000);
    }

    // ============================================
    // PROGRESS BAR PULSE
    // ============================================
    function pulseProgressBars() {
        const progressBars = document.querySelectorAll('.progress-fill, .progress-bar');
        if (progressBars.length === 0) return;

        setInterval(() => {
            progressBars.forEach(bar => {
                const currentWidth = parseFloat(bar.style.width) || 50;
                
                // Pulse effect
                bar.style.transition = 'transform 1.2s ease, opacity 1.2s ease';
                bar.style.transform = 'scaleY(1.2)';
                bar.style.opacity = '0.8';
                
                setTimeout(() => {
                    bar.style.transform = 'scaleY(1)';
                    bar.style.opacity = '1';
                }, 600);
            });
        }, 2500);
    }

    // ============================================
    // SET COUNTERS TO FINAL VALUES (NO ANIMATION)
    // ============================================
    function setCountersToFinal() {
        const counters = document.querySelectorAll('.counter');
        console.log('SmartBudget: Setting ' + counters.length + ' counters to final values (no animation)');
        
        counters.forEach((counter) => {
            const target = parseInt(counter.dataset.target) || 0;
            const prefix = counter.dataset.prefix || '';
            const suffix = counter.dataset.suffix || '';
            counter.textContent = prefix + target.toLocaleString() + suffix;
            counter.dataset.animated = 'true';
        });
        
        const chartBars = document.querySelectorAll('.chart-bar[data-width]');
        chartBars.forEach((bar) => {
            const width = bar.dataset.width + '%';
            bar.style.width = width;
            bar.dataset.animated = 'true';
        });
    }

    // ============================================
    // ANIMATED COUNTERS (Initial Observer-based)
    // ============================================
    function initCounters() {
        const counters = document.querySelectorAll('.counter');
        if (counters.length === 0) {
            console.log('SmartBudget: No counters found (not on marketing page)');
            return;
        }
        console.log('SmartBudget: Found ' + counters.length + ' counters');

        if (countersObserver) {
            countersObserver.disconnect();
        }

        countersObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    if (counter.dataset.animated === 'true') return;
                    
                    counter.dataset.animated = 'true';

                    const target = parseInt(counter.dataset.target) || 0;
                    const prefix = counter.dataset.prefix || '';
                    const suffix = counter.dataset.suffix || '';
                    const duration = 2000;
                    let startTime = null;

                    function animate(timestamp) {
                        if (!startTime) startTime = timestamp;
                        const progress = Math.min((timestamp - startTime) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(eased * target);
                        counter.textContent = prefix + current.toLocaleString() + suffix;
                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            counter.textContent = prefix + target.toLocaleString() + suffix;
                        }
                    }
                    requestAnimationFrame(animate);
                    countersObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.3 });

        counters.forEach((counter) => {
            counter.dataset.animated = 'false';
            const prefix = counter.dataset.prefix || '';
            const suffix = counter.dataset.suffix || '';
            counter.textContent = prefix + '0' + suffix;
            countersObserver.observe(counter);
        });
    }

    // ============================================
    // CHART BARS ANIMATION (Initial Observer-based)
    // ============================================
    function initChartBars() {
        const chartBars = document.querySelectorAll('.chart-bar[data-width]');
        if (chartBars.length === 0) {
            console.log('SmartBudget: No chart bars found');
            return;
        }
        console.log('SmartBudget: Found ' + chartBars.length + ' chart bars');

        if (chartBarsObserver) {
            chartBarsObserver.disconnect();
        }

        chartBarsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    if (bar.dataset.animated === 'true') return;
                    
                    bar.dataset.animated = 'true';
                    
                    const width = bar.dataset.width + '%';
                    setTimeout(() => {
                        bar.style.transition = 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        bar.style.width = width;
                    }, 200);
                    chartBarsObserver.unobserve(bar);
                }
            });
        }, { threshold: 0.3 });

        chartBars.forEach((bar) => {
            bar.style.width = '0%';
            bar.dataset.animated = 'false';
            chartBarsObserver.observe(bar);
        });
    }

    // ============================================
    // MOBILE MENU - Fixed: stops retrying after MAX_RETRIES
    // ============================================
    function initMobileMenu() {
        let menuBtn = document.getElementById('mobileMenuBtn');
        let mobileMenu = document.getElementById('mobileMenu');
        let overlay = document.getElementById('mobileOverlay');
        let closeBtn = document.getElementById('mobileMenuClose');

        if (!menuBtn || !mobileMenu || !overlay) {
            mobileMenuRetries++;
            if (mobileMenuRetries <= MAX_RETRIES) {
                console.log('SmartBudget: Mobile menu not found (attempt ' + mobileMenuRetries + '), retrying once...');
                setTimeout(initMobileMenu, 500);
            } else {
                console.log('SmartBudget: Mobile menu not found - stopping retries (not on marketing page)');
            }
            return;
        }
        console.log('SmartBudget: Mobile menu initialized');

        function openMenu() {
            mobileMenu.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            const icon = menuBtn.querySelector('i');
            if (icon) icon.className = 'bi bi-x-lg';
            const text = menuBtn.querySelector('.menu-text');
            if (text) text.textContent = 'Close';
        }

        function closeMenu() {
            mobileMenu.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
            const icon = menuBtn.querySelector('i');
            if (icon) icon.className = 'bi bi-list';
            const text = menuBtn.querySelector('.menu-text');
            if (text) text.textContent = 'Menu';
        }

        const newMenuBtn = menuBtn.cloneNode(true);
        menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
        menuBtn = newMenuBtn;

        menuBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (mobileMenu.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        };

        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            closeBtn = newCloseBtn;
            closeBtn.onclick = (e) => {
                e.preventDefault();
                closeMenu();
            };
        }

        const newOverlay = overlay.cloneNode(true);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        overlay = newOverlay;
        overlay.onclick = closeMenu;

        const menuLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
        menuLinks.forEach((link) => {
            link.addEventListener('click', () => {
                setTimeout(closeMenu, 300);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    // ============================================
    // FAQ ACCORDION - Fixed: stops retrying after MAX_RETRIES
    // ============================================
    function initFaqAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems.length === 0) {
            faqRetries++;
            if (faqRetries <= MAX_RETRIES) {
                console.log('SmartBudget: No FAQ items found (attempt ' + faqRetries + '), retrying once...');
                setTimeout(initFaqAccordion, 500);
            } else {
                console.log('SmartBudget: No FAQ items found - stopping retries (not on marketing page)');
            }
            return;
        }
        console.log('SmartBudget: FAQ accordion initialized - ' + faqItems.length + ' items');

        faqItems.forEach((faqItem) => {
            let question = faqItem.querySelector('.faq-question');
            if (question) {
                const newQuestion = question.cloneNode(true);
                question.parentNode.replaceChild(newQuestion, question);
                question = newQuestion;

                question.onclick = () => {
                    faqItems.forEach((item) => {
                        if (item !== faqItem) {
                            item.classList.remove('open');
                        }
                    });
                    faqItem.classList.toggle('open');
                };
            }
        });
    }

    // ============================================
    // NAVBAR SCROLL EFFECT
    // ============================================
    function initNavbarScroll() {
        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
            if (navbar._scrollHandler) {
                window.removeEventListener('scroll', navbar._scrollHandler);
            }
            
            const scrollHandler = () => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            };
            
            navbar._scrollHandler = scrollHandler;
            window.addEventListener('scroll', scrollHandler, { passive: true });

            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            }
            console.log('SmartBudget: Navbar scroll initialized');
        }
    }

    // ============================================
    // ACTIVE NAV LINK HIGHLIGHTING - Fixed: stops retrying after MAX_RETRIES
    // ============================================
    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const desktopNavLinks = document.querySelectorAll('.nav-links-pro a[href^="#"]');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link[data-link]');

        if (sections.length === 0) {
            activeNavRetries++;
            if (activeNavRetries <= MAX_RETRIES) {
                console.log('SmartBudget: No sections found (attempt ' + activeNavRetries + '), retrying once...');
                setTimeout(initActiveNav, 500);
            } else {
                console.log('SmartBudget: No sections found - stopping retries (not on marketing page)');
            }
            return;
        }
        console.log('SmartBudget: Active nav initialized - ' + sections.length + ' sections tracked');

        function updateActiveNav() {
            const scrollPosition = window.scrollY + 120;
            let currentSection = '';

            sections.forEach((section) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = sectionId;
                }
            });

            desktopNavLinks.forEach((link) => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === '#' + currentSection) {
                    link.classList.add('active');
                }
            });

            mobileNavLinks.forEach((link) => {
                link.classList.remove('active');
                const dataLink = link.getAttribute('data-link');
                if (dataLink === currentSection) {
                    link.classList.add('active');
                }
            });

            if (window.scrollY < 200) {
                desktopNavLinks.forEach((link) => link.classList.remove('active'));
                mobileNavLinks.forEach((link) => link.classList.remove('active'));
            }
        }

        if (window._activeNavHandler) {
            window.removeEventListener('scroll', window._activeNavHandler);
        }
        
        window._activeNavHandler = updateActiveNav;
        window.addEventListener('scroll', updateActiveNav, { passive: true });

        updateActiveNav();
    }

    // ============================================
    // SMOOTH SCROLLING
    // ============================================
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        console.log('SmartBudget: Smooth scroll initialized - ' + links.length + ' links');

        links.forEach((link) => {
            if (link.dataset.processed === 'true') return;
            
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            newLink.dataset.processed = 'true';

            newLink.onclick = (e) => {
                const href = newLink.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        history.pushState(null, null, href);

                        const mobileMenu = document.getElementById('mobileMenu');
                        const overlay = document.getElementById('mobileOverlay');
                        if (mobileMenu && mobileMenu.classList.contains('open')) {
                            mobileMenu.classList.remove('open');
                            if (overlay) overlay.classList.remove('open');
                            document.body.style.overflow = '';

                            const menuBtn = document.getElementById('mobileMenuBtn');
                            if (menuBtn) {
                                const icon = menuBtn.querySelector('i');
                                if (icon) icon.className = 'bi bi-list';
                                const text = menuBtn.querySelector('.menu-text');
                                if (text) text.textContent = 'Menu';
                            }
                        }
                    }
                }
            };
        });
    }

    // ============================================
    // START ALL LIVE FEATURES
    // ============================================
    function startAllLiveFeatures() {
        if (isLiveRunning) {
            console.log('SmartBudget: Live features already running');
            return;
        }
        
        console.log('SmartBudget: Starting all live features...');
        isLiveRunning = true;
        
        // Start live animations
        startLiveCounters();
        startLiveChartBars();
        pulseProgressBars();
        
        console.log('SmartBudget: All live features started!');
    }

    // ============================================
    // COMPLETE RESET AND REINITIALIZE
    // ============================================
    function resetAndInitializeCounters() {
        console.log('SmartBudget: Resetting and animating from 0');
        
        if (countersObserver) {
            countersObserver.disconnect();
            countersObserver = null;
        }
        if (chartBarsObserver) {
            chartBarsObserver.disconnect();
            chartBarsObserver = null;
        }
        
        document.querySelectorAll('.counter').forEach((counter) => {
            counter.dataset.animated = 'false';
            const prefix = counter.dataset.prefix || '';
            const suffix = counter.dataset.suffix || '';
            counter.textContent = prefix + '0' + suffix;
        });
        
        document.querySelectorAll('.chart-bar').forEach((bar) => {
            bar.style.width = '0%';
            bar.dataset.animated = 'false';
        });
        
        setTimeout(() => {
            initCounters();
            initChartBars();
            window.dispatchEvent(new Event('scroll'));
        }, 100);
    }

    // ============================================
    // SET FINAL VALUES IMMEDIATELY (NAVIGATION MODE)
    // ============================================
    function setFinalValuesForNavigation() {
        console.log('SmartBudget: Setting final values immediately (no animation)');
        
        if (countersObserver) {
            countersObserver.disconnect();
            countersObserver = null;
        }
        if (chartBarsObserver) {
            chartBarsObserver.disconnect();
            chartBarsObserver = null;
        }
        
        document.querySelectorAll('.counter').forEach((counter) => {
            const target = parseInt(counter.dataset.target) || 0;
            const prefix = counter.dataset.prefix || '';
            const suffix = counter.dataset.suffix || '';
            counter.textContent = prefix + target.toLocaleString() + suffix;
            counter.dataset.animated = 'true';
        });
        
        document.querySelectorAll('.chart-bar').forEach((bar) => {
            const width = bar.dataset.width + '%';
            bar.style.width = width;
            bar.dataset.animated = 'true';
        });
    }

    // ============================================
    // INITIALIZE ALL FUNCTIONS
    // ============================================
    function initializeAll() {
        console.log('SmartBudget: Initializing all features...');
        removeYellowOutline();
        
        // Load user profile first
        loadUserProfile().then(() => {
            console.log('SmartBudget: User profile loaded');
        });
        
        initCounters();
        initChartBars();
        initMobileMenu();
        initFaqAccordion();
        initNavbarScroll();
        initActiveNav();
        initSmoothScroll();
        
        // Start live animations immediately
        startAllLiveFeatures();
        
        isInitialized = true;
        console.log('SmartBudget: All features initialized successfully!');
    }

    // ============================================
    // CLEANUP FUNCTION
    // ============================================
    function cleanup() {
        if (liveCounterInterval) {
            clearInterval(liveCounterInterval);
            liveCounterInterval = null;
        }
        if (liveChartInterval) {
            clearInterval(liveChartInterval);
            liveChartInterval = null;
        }
        if (liveBarInterval) {
            clearInterval(liveBarInterval);
            liveBarInterval = null;
        }
        if (countersObserver) {
            countersObserver.disconnect();
            countersObserver = null;
        }
        if (chartBarsObserver) {
            chartBarsObserver.disconnect();
            chartBarsObserver = null;
        }
        isLiveRunning = false;
        console.log('SmartBudget: Cleanup complete');
    }

    // ============================================
    // EXPOSE FOR BLZOR INTEROP
    // ============================================
    window.initializeMarketingPage = function() {
        console.log('SmartBudget: Called from Blazor (First Load)');
        cleanup();
        isInitialized = false;
        setTimeout(() => initializeAll(), 100);
    };

    window.resetAndInitializeCounters = function() {
        console.log('SmartBudget: Called from Blazor (Navigation Mode)');
        cleanup();
        setTimeout(() => setFinalValuesForNavigation(), 50);
    };

    window.cleanupMarketingPage = function() {
        console.log('SmartBudget: Cleanup called from Blazor');
        cleanup();
    };

    // ============================================
    // AUTO-START ON DOM READY - IMMEDIATE!
    // ============================================
    console.log('SmartBudget: Setting up auto-start...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('SmartBudget: DOMContentLoaded fired - initializing...');
            initializeAll();
        });
    } else {
        console.log('SmartBudget: DOM already loaded - initializing immediately...');
        initializeAll();
    }

    // ============================================
    // PAGE VISIBILITY - Pause animations when tab is hidden
    // ============================================
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause live animations
            if (liveCounterInterval) {
                clearInterval(liveCounterInterval);
                liveCounterInterval = null;
            }
            if (liveChartInterval) {
                clearInterval(liveChartInterval);
                liveChartInterval = null;
            }
            console.log('SmartBudget: Animations paused (tab hidden)');
        } else {
            // Resume live animations
            if (!liveCounterInterval) {
                startLiveCounters();
            }
            if (!liveChartInterval) {
                startLiveChartBars();
            }
            console.log('SmartBudget: Animations resumed (tab visible)');
        }
    });

    // ============================================
    // FALLBACK: Check if elements exist and start anyway
    // ============================================
    // If after 2 seconds nothing has started, force start
    setTimeout(() => {
        if (!isLiveRunning) {
            console.log('SmartBudget: Force starting live features (fallback)...');
            startAllLiveFeatures();
        }
    }, 2000);

})();