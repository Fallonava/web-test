// ==================== TV MODE AUTO TOGGLE FIX ====================
// File: tv-mode-fix.js
// Tanggal: 2024
// Fungsi: Memperbaiki auto toggle floating footer di TV Mode

console.log('🔧 Loading TV Mode Auto Toggle Fix...');

class TVAutoToggleFix {
    constructor() {
        this.isTVMode = false;
        this.autoToggleCheckInterval = null;
        this.init();
    }
    
    init() {
        // Deteksi TV mode berdasarkan lebar layar
        this.isTVMode = window.innerWidth >= 1280;
        
        if (this.isTVMode) {
            console.log('📺 TV Mode Detected - Applying Auto Toggle Fix');
            this.applyFix();
        } else {
            console.log('📱 Mobile/Desktop Mode - Auto Toggle Fix Skipped');
        }
    }
    
    applyFix() {
        // Step 1: Tunggu hingga AppState selesai loading
        this.waitForAppState().then(() => {
            // Step 2: Restart auto toggle dengan timing yang dioptimalkan untuk TV
            this.restartAutoToggle();
            
            // Step 3: Terapkan CSS optimizations untuk TV
            this.applyTVOptimizations();
            
            // Step 4: Monitor dan maintenance
            this.startAutoToggleMonitoring();
            
            console.log('✅ TV Mode Auto Toggle Fix Applied Successfully');
        }).catch(error => {
            console.error('❌ Failed to apply TV Auto Toggle Fix:', error);
        });
    }
    
    waitForAppState() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 30; // 30 attempts = 15 detik
            
            const checkAppState = () => {
                attempts++;
                
                if (window.AppState && AppState.isInitialized && AppState.floatingFooter) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('AppState not initialized within timeout'));
                } else {
                    setTimeout(checkAppState, 500); // Check setiap 500ms
                }
            };
            
            checkAppState();
        });
    }
    
    restartAutoToggle() {
        try {
            console.log('🔄 Restarting Auto Toggle for TV Mode');
            
            // Stop existing auto toggle
            if (AppState.floatingFooter.stop) {
                AppState.floatingFooter.stop();
            }
            
            // Reset timing untuk TV (lebih lambat untuk experience yang lebih baik)
            AppState.floatingFooter.initialDelay = 25000;    // 25 detik delay awal
            AppState.floatingFooter.openIntervalTime = 150000; // 2.5 menit buka
            AppState.floatingFooter.closeDelay = 30000;      // 30 detik tutup
            
            // Enable dan restart
            AppState.floatingFooter.isAutoToggleEnabled = true;
            
            // Start dengan resource manager yang aman
            if (AppState.resources) {
                AppState.floatingFooter.start(AppState.resources);
            } else {
                console.warn('⚠️ Resource manager not available, using fallback');
                this.startFallbackAutoToggle();
            }
            
            console.log('✅ Auto Toggle Restarted with TV-optimized timing');
            
        } catch (error) {
            console.error('❌ Failed to restart auto toggle:', error);
            this.startFallbackAutoToggle();
        }
    }
    
    startFallbackAutoToggle() {
        console.log('🔄 Starting Fallback Auto Toggle');
        
        // Fallback implementation jika AppState tidak tersedia
        const footer = document.getElementById('floatingFooter');
        const toggle = document.getElementById('floatingFooterToggle');
        
        if (!footer || !toggle) {
            console.error('❌ Floating footer elements not found');
            return;
        }
        
        // Simple interval-based auto toggle
        let isOpen = true;
        
        setInterval(() => {
            if (!document.hidden && this.isTVMode) {
                if (isOpen) {
                    // Tutup footer
                    footer.classList.add('collapsed');
                    toggle.querySelector('span').textContent = '+';
                    isOpen = false;
                } else {
                    // Buka footer
                    footer.classList.remove('collapsed');
                    toggle.querySelector('span').textContent = '−';
                    isOpen = true;
                }
            }
        }, 120000); // Ganti state setiap 2 menit
    }
    
    applyTVOptimizations() {
        const style = document.createElement('style');
        style.id = 'tv-auto-toggle-optimizations';
        style.textContent = `
            /* TV Auto Toggle Optimizations */
            @media (min-width: 1280px) {
                .floating-footer {
                    transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                    transform-origin: center !important;
                }
                
                .floating-footer:not(.collapsed) {
                    transform: translateX(-50%) scale(1.02) !important;
                    box-shadow: 
                        0 20px 50px rgba(0, 0, 0, 0.15),
                        0 8px 25px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
                }
                
                .floating-footer.collapsed {
                    transform: translateX(-50%) scale(1) !important;
                }
                
                .floating-footer-header {
                    cursor: none !important;
                }
                
                /* Smooth scroll untuk cuti items di TV */
                .floating-cuti-scroll-content {
                    animation-duration: 180s !important;
                }
            }
            
            /* Enhanced visibility untuk TV viewing distance */
            @media (min-width: 1280px) and (min-height: 720px) {
                .floating-footer-title {
                    font-size: 1.3rem !important;
                }
                
                .floating-cuti-dokter-name {
                    font-size: 1.1rem !important;
                    font-weight: 700 !important;
                }
                
                .floating-cuti-spesialis {
                    font-size: 1rem !important;
                }
            }
        `;
        
        // Hapus style lama jika ada
        const existingStyle = document.getElementById('tv-auto-toggle-optimizations');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('✅ TV CSS Optimizations Applied');
    }
    
    startAutoToggleMonitoring() {
        // Monitor kesehatan auto toggle setiap 1 menit
        this.autoToggleCheckInterval = setInterval(() => {
            this.checkAutoToggleHealth();
        }, 60000);
        
        // Reset auto toggle setiap 30 menit untuk prevent issues
        setTimeout(() => {
            if (this.isTVMode) {
                console.log('🔄 Scheduled Auto Toggle Refresh');
                this.restartAutoToggle();
            }
        }, 1800000); // 30 menit
    }
    
    checkAutoToggleHealth() {
        if (!this.isTVMode || document.hidden) return;
        
        const footer = document.getElementById('floatingFooter');
        if (!footer) {
            console.warn('⚠️ Floating footer not found in DOM');
            return;
        }
        
        // Check jika footer stuck dalam state tertentu terlalu lama
        const isCollapsed = footer.classList.contains('collapsed');
        console.log(`🔍 Auto Toggle Health Check: ${isCollapsed ? 'Collapsed' : 'Expanded'}`);
        
        // Jika perlu, bisa ditambahkan logic recovery di sini
    }
    
    cleanup() {
        if (this.autoToggleCheckInterval) {
            clearInterval(this.autoToggleCheckInterval);
        }
        
        // Hapus CSS optimizations
        const style = document.getElementById('tv-auto-toggle-optimizations');
        if (style) {
            style.remove();
        }
        
        console.log('🧹 TV Auto Toggle Fix Cleaned Up');
    }
}

// ==================== ENHANCED FLOATING FOOTER METHODS ====================

// Extend existing MemorySafeFloatingFooter class dengan method baru
function enhanceFloatingFooter() {
    if (!window.AppState || !AppState.floatingFooter) return;
    
    // Tambahkan method restart jika belum ada
    if (typeof AppState.floatingFooter.restart !== 'function') {
        AppState.floatingFooter.restart = function() {
            console.log('🔄 Enhanced: Restarting Floating Footer Auto Toggle');
            this.stop();
            this.isAutoToggleEnabled = true;
            
            // Gunakan timing yang berbeda untuk TV vs non-TV
            const isTV = window.innerWidth >= 1280;
            
            if (isTV) {
                this.initialDelay = 25000;
                this.openIntervalTime = 150000;
                this.closeDelay = 30000;
            } else {
                this.initialDelay = 20000;
                this.openIntervalTime = 120000;
                this.closeDelay = 20000;
            }
            
            if (AppState.resources) {
                this.start(AppState.resources);
            }
        };
    }
    
    // Tambahkan method health check
    AppState.floatingFooter.healthCheck = function() {
        const footer = document.getElementById('floatingFooter');
        if (!footer) return 'footer_not_found';
        
        const isCollapsed = footer.classList.contains('collapsed');
        const toggle = document.getElementById('floatingFooterToggle');
        const toggleText = toggle ? toggle.querySelector('span').textContent : 'unknown';
        
        return {
            isAutoToggleEnabled: this.isAutoToggleEnabled,
            isCollapsed: isCollapsed,
            toggleText: toggleText,
            state: 'healthy'
        };
    };
    
    console.log('✅ Floating Footer Methods Enhanced');
}

// ==================== INITIALIZATION ====================

// Initialize ketika DOM ready
let tvAutoToggleFix;

function initializeTVAutoToggleFix() {
    console.log('🎯 Initializing TV Auto Toggle Fix...');
    
    try {
        tvAutoToggleFix = new TVAutoToggleFix();
        
        // Enhance existing floating footer methods
        setTimeout(enhanceFloatingFooter, 2000);
        
        console.log('✅ TV Auto Toggle Fix Initialized Successfully');
    } catch (error) {
        console.error('❌ TV Auto Toggle Fix Initialization Failed:', error);
    }
}

// Handle page visibility changes
function handleVisibilityChange() {
    if (!document.hidden && tvAutoToggleFix && tvAutoToggleFix.isTVMode) {
        // Page menjadi visible, refresh auto toggle jika needed
        setTimeout(() => {
            if (AppState.floatingFooter && AppState.floatingFooter.restart) {
                AppState.floatingFooter.restart();
            }
        }, 3000);
    }
}

// ==================== SETUP EVENT LISTENERS ====================

// Initialize ketika DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTVAutoToggleFix);
} else {
    // DOM sudah ready, initialize dengan delay kecil
    setTimeout(initializeTVAutoToggleFix, 1000);
}

// Handle page visibility
document.addEventListener('visibilitychange', handleVisibilityChange);

// Handle resize events untuk mode switching
window.addEventListener('resize', () => {
    const isNowTV = window.innerWidth >= 1280;
    
    if (tvAutoToggleFix && isNowTV !== tvAutoToggleFix.isTVMode) {
        console.log('🔄 Screen size changed, reinitializing TV Auto Toggle');
        if (tvAutoToggleFix.cleanup) {
            tvAutoToggleFix.cleanup();
        }
        setTimeout(initializeTVAutoToggleFix, 1000);
    }
});

// Cleanup pada page unload
window.addEventListener('beforeunload', () => {
    if (tvAutoToggleFix && tvAutoToggleFix.cleanup) {
        tvAutoToggleFix.cleanup();
    }
});

// Export untuk debugging
window.TVAutoToggleFix = {
    instance: tvAutoToggleFix,
    initialize: initializeTVAutoToggleFix,
    enhanceFloatingFooter: enhanceFloatingFooter
};

console.log('🔧 TV Auto Toggle Fix System Loaded');
