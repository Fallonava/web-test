/**
 * Doctor Schedule App - Main Application File
 * @version 1.0.0
 */

import { SmartDataSync } from './modules/DataSync.js';
import { DOMRenderer } from './modules/DOMRenderer.js';
import { Analytics } from './modules/Analytics.js';
import { ResourceManager } from './modules/ResourceManager.js';
import { DataFetcher } from './modules/DataFetcher.js';

// Configuration
const CONFIG = {
    MAIN_SHEET_URL: "https://script.google.com/macros/s/AKfycbyVnM9JhKx8xj2EZhETj1BdSCnmJxtNBV4eFmohKE0denRS4VEA3JqPI-RVsQFg7ZuEtw/exec",
    FOOTER_SHEET_URL: "https://script.google.com/macros/s/AKfycbxYREx42acZcDyDe8DF75UJlB0hroAoQ4QH_gpd71RgGtbI889yAAtzegrjgwvfLkFY4Q/exec",
    REFRESH_INTERVAL: 30000,
    CACHE_DURATION: 300000,
    FETCH_TIMEOUT: 10000
};

class DoctorScheduleApp {
    constructor() {
        this.allData = [];
        this.cutiData = [];
        this.dataInterval = null;
        this.loadingMessageInterval = null;
        
        // Initialize managers
        this.resources = new ResourceManager();
        this.dataFetcher = new DataFetcher();
        this.smartSync = new SmartDataSync();
        this.domRenderer = new DOMRenderer();
        
        // UI Elements
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.liveRegion = document.getElementById('liveRegion');
        this.offlineBanner = document.getElementById('offlineBanner');
        this.onlineBanner = document.getElementById('onlineBanner');
        this.updateNotification = document.getElementById('updateNotification');
        this.syncStatus = document.getElementById('syncStatus');

        this.initializeApp();
    }

    /**
     * Initialize aplikasi
     */
    initializeApp() {
        try {
            this.initializeParticles();
            this.initializeOfflineDetection();
            this.initializeKeyboardNavigation();
            this.initializeModalEvents();
            
            this.updateDateTime();
            this.domRenderer.showSkeletonLoading();
            this.loadInitialData();
            
            // Start intervals
            this.resources.setInterval(() => this.updateDateTime(), 1000);
            this.startSmartPolling();
            
            this.setupEventListeners();
            
            Analytics.trackEvent('App', 'Initialized');
            console.log('🚀 Doctor Schedule App initialized');
            
        } catch (error) {
            Analytics.trackError(error, { phase: 'initialization' });
            console.error('❌ App initialization failed:', error);
            this.showErrorState('Aplikasi gagal dimulai. Silakan refresh halaman.');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.resources.addEventListener(document, 'visibilitychange', () => this.handleVisibilityChange());
        this.resources.addEventListener(window, 'online', () => this.handleOnlineStatus());
        this.resources.addEventListener(window, 'offline', () => this.handleOnlineStatus());
        this.resources.addEventListener(window, 'beforeunload', () => this.cleanup());
    }

    /**
     * Load initial data dengan cache fallback
     */
    async loadInitialData() {
        const cached = this.getCachedData();
        if (cached) {
            console.log('📂 Loading from cache');
            this.domRenderer.renderData(cached.mainData);
            this.domRenderer.renderCutiData(cached.cutiData);
            this.domRenderer.initializeCutiEvents();
            
            this.smartSync.lastDataHash = this.smartSync.generateDataHash(cached.mainData);
            this.hideLoading();
            
            setTimeout(() => this.loadCutiData(), 1000);
            return;
        }

        try {
            this.showLoading();
            this.showSmartLoading();
            
            const [mainData, footerData] = await Promise.all([
                this.dataFetcher.fetchWithRetry(CONFIG.MAIN_SHEET_URL),
                this.dataFetcher.fetchWithRetry(CONFIG.FOOTER_SHEET_URL)
            ]);
            
            if (!this.validateMainData(mainData)) {
                throw new Error('Format data utama tidak valid');
            }
            
            this.allData = mainData;
            this.cutiData = footerData;
            
            this.smartSync.lastDataHash = this.smartSync.generateDataHash(mainData);
            
            this.cacheData({ mainData, cutiData: footerData });
            this.domRenderer.renderData(mainData);
            this.domRenderer.renderCutiData(footerData);
            this.domRenderer.initializeCutiEvents();
            this.hideLoading();
            this.stopSmartLoading();
            
            this.announceToScreenReader('Data jadwal dokter telah dimuat');
            Analytics.trackEvent('Data', 'Loaded', 'Initial');
            
        } catch (err) {
            console.error("Gagal memuat data:", err);
            Analytics.trackError(err, { phase: 'initialLoad' });
            this.stopSmartLoading();
            this.showErrorState(this.getUserFriendlyError(err));
            this.hideLoading();
        }
    }

    /**
     * Load data cuti secara terpisah
     */
    async loadCutiData() {
        try {
            const footerData = await this.dataFetcher.fetchWithRetry(CONFIG.FOOTER_SHEET_URL);
            this.cutiData = footerData;
            this.domRenderer.renderCutiData(footerData);
            
            // Update cache
            const cached = this.getCachedData() || {};
            this.cacheData({ mainData: cached.mainData || this.allData, cutiData: footerData });
            
            console.log('✅ Cuti data loaded successfully');
        } catch (err) {
            console.warn('⚠️ Gagal memuat data cuti:', err.message);
            // Continue without cuti data
        }
    }

    /**
     * Validate main data structure
     * @param {Array} data - Data to validate
     * @returns {boolean}
     */
    validateMainData(data) {
        if (!Array.isArray(data)) return false;
        return data.every(item => 
            item && 
            typeof item === 'object' &&
            'Spesialis' in item &&
            'Dokter' in item &&
            'Status' in item &&
            'Jenis' in item
        );
    }

    /**
     * Get user friendly error message
     * @param {Error} error - Error object
     * @returns {string}
     */
    getUserFriendlyError(error) {
        if (error.name === 'AbortError') {
            return 'Timeout: Server tidak merespons. Memuat data cache jika tersedia.';
        } else if (error.message.includes('Failed to fetch')) {
            return 'Koneksi internet terputus. Memuat data cache terakhir.';
        } else if (error.message.includes('HTTP 5')) {
            return 'Server sedang maintenance. Coba beberapa saat lagi.';
        } else {
            return 'Gagal memuat data jadwal. Memuat data cache jika tersedia.';
        }
    }

    /**
     * Cache data ke localStorage
     * @param {Object} data - Data to cache
     */
    cacheData(data) {
        try {
            const cache = {
                mainData: data.mainData,
                cutiData: data.cutiData,
                timestamp: Date.now()
            };
            localStorage.setItem('doctorSchedule', JSON.stringify(cache));
        } catch (e) {
            console.warn('Gagal menyimpan cache:', e);
        }
    }

    /**
     * Get cached data dari localStorage
     * @returns {Object|null}
     */
    getCachedData() {
        try {
            const cached = localStorage.getItem('doctorSchedule');
            if (!cached) return null;
            
            const { mainData, cutiData, timestamp } = JSON.parse(cached);
            
            if (Date.now() - timestamp < CONFIG.CACHE_DURATION) {
                return { mainData, cutiData };
            }
        } catch (e) {
            console.warn('Gagal memuat cache:', e);
        }
        return null;
    }

    /**
     * Start smart polling untuk data updates
     */
    startSmartPolling() {
        this.dataInterval = this.resources.setInterval(async () => {
            await this.checkForDataUpdates();
        }, CONFIG.REFRESH_INTERVAL);

        console.log('🔄 Smart polling started');
    }

    /**
     * Check for data updates
     */
    async checkForDataUpdates() {
        this.updateSyncStatus('syncing');
        
        const updateResult = await this.smartSync.checkForUpdates();
        
        if (updateResult) {
            console.log('🎉 Data updated, refreshing display...');
            await this.processDataUpdate(updateResult.data);
            this.showUpdateNotification();
            this.updateSyncStatus('up-to-date');
            
            this.cacheData({ mainData: updateResult.data, cutiData: this.cutiData });
            
        } else {
            this.updateSyncStatus('up-to-date');
            console.log('✅ No data changes detected');
        }
    }

    /**
     * Process data update
     * @param {Array} newData - New data
     */
    async processDataUpdate(newData) {
        if (!this.validateMainData(newData)) {
            throw new Error('Data tidak valid dari server');
        }

        this.allData = newData;
        this.domRenderer.renderData(newData);
        
        this.announceToScreenReader('Data jadwal dokter telah diperbarui');
    }

    /**
     * Update sync status indicator
     * @param {string} status - Sync status
     */
    updateSyncStatus(status) {
        this.syncStatus.className = `sync-status ${status}`;
        
        const statusText = {
            'syncing': 'Memeriksa update...',
            'up-to-date': 'Data terkini'
        }[status] || 'Data terkini';
        
        this.syncStatus.textContent = statusText;
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        this.updateNotification.style.display = 'flex';
        
        this.resources.setTimeout(() => {
            this.updateNotification.style.display = 'none';
        }, 3000);
    }

    /**
     * Show smart loading dengan rotating messages
     */
    showSmartLoading() {
        const messages = [
            "Memuat jadwal terbaru...",
            "Memperbarui data dokter...", 
            "Menyinkronkan informasi..."
        ];
        
        let messageIndex = 0;
        this.loadingMessage.textContent = messages[messageIndex];
        
        this.loadingMessageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            this.loadingMessage.textContent = messages[messageIndex];
        }, 3000);
    }

    /**
     * Stop smart loading
     */
    stopSmartLoading() {
        if (this.loadingMessageInterval) {
            clearInterval(this.loadingMessageInterval);
            this.loadingMessageInterval = null;
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.loadingIndicator.style.display = 'block';
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    showErrorState(message = '⚠️ Gagal memuat data jadwal dokter.') {
        const errorHTML = `
            <tr>
                <td colspan="4" class="error-message">
                    ${message}<br>
                    <button onclick="app.loadInitialData()">Coba Lagi</button>
                </td>
            </tr>
        `;
        
        document.querySelectorAll('tbody').forEach(tbody => {
            if (tbody.children.length === 0 || tbody.querySelector('.skeleton-row')) {
                tbody.innerHTML = errorHTML;
            }
        });
    }

    /**
     * Initialize modal events
     */
    initializeModalEvents() {
        const modal = document.getElementById('cutiDetailModal');
        const closeBtn = document.getElementById('cutiModalClose');
        
        this.resources.addEventListener(modal, 'click', (e) => {
            if (e.target === modal) {
                this.closeCutiModal();
            }
        });
        
        this.resources.addEventListener(closeBtn, 'click', () => {
            this.closeCutiModal();
        });
        
        this.resources.addEventListener(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCutiModal();
            }
        });
    }

    /**
     * Close cuti modal
     */
    closeCutiModal() {
        document.getElementById('cutiDetailModal').classList.remove('active');
    }

    /**
     * Announce to screen reader
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        this.liveRegion.textContent = message;
    }

    /**
     * Update date and time display
     */
    updateDateTime() {
        const now = new Date();
        const tanggal = now.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const jam = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        const detik = now.toLocaleTimeString('id-ID', { 
            second: '2-digit'
        });
    
        document.getElementById('tanggal').textContent = tanggal;
        document.getElementById('jam').innerHTML = `
            <span class="jam-utama">${jam}</span>
            <span class="jam-detik">${detik}</span>
        `;
    }

    /**
     * Initialize particles animation
     */
    initializeParticles() {
        const particlesContainer = document.getElementById("particles");
        const particleCount = Math.min(15, window.innerWidth / 40);
        
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement("div");
            p.className = "particle";
            const size = Math.random() * 6 + 3;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}%`;
            p.style.animationDuration = `${10 + Math.random() * 10}s`;
            p.style.animationDelay = `${Math.random() * 5}s`;
            particlesContainer.appendChild(p);
        }
    }

    /**
     * Initialize offline detection
     */
    initializeOfflineDetection() {
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                this.offlineBanner.style.display = 'none';
                this.onlineBanner.style.display = 'block';
                this.resources.setTimeout(() => {
                    this.onlineBanner.style.display = 'none';
                }, 3000);
            } else {
                this.offlineBanner.style.display = 'block';
                this.onlineBanner.style.display = 'none';
            }
        };

        updateOnlineStatus();
    }

    /**
     * Initialize keyboard navigation
     */
    initializeKeyboardNavigation() {
        const skipLink = document.querySelector('.skip-link');
        this.resources.addEventListener(skipLink, 'click', (e) => {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            mainContent.setAttribute('tabindex', '-1');
            mainContent.focus();
            this.announceToScreenReader('Loncat ke konten utama');
        });
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            if (this.dataInterval) {
                this.resources.clearInterval(this.dataInterval);
            }
        } else {
            this.startSmartPolling();
            setTimeout(() => this.checkForDataUpdates(), 1000);
        }
    }

    /**
     * Handle online/offline status
     */
    handleOnlineStatus() {
        if (navigator.onLine) {
            setTimeout(() => this.checkForDataUpdates(), 2000);
            this.announceToScreenReader('Koneksi internet tersedia. Memperbarui data...');
        } else {
            this.announceToScreenReader('Koneksi internet terputus. Menampilkan data cache.');
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.resources.cleanup();
        if (this.loadingMessageInterval) {
            clearInterval(this.loadingMessageInterval);
        }
        Analytics.trackEvent('App', 'Cleanup');
    }
}

// Initialize application ketika DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new DoctorScheduleApp();
    });
} else {
    window.app = new DoctorScheduleApp();
}

// Export untuk debugging dan external access
window.DoctorScheduleApp = DoctorScheduleApp;
window.Analytics = Analytics;

console.log('📁 Doctor Schedule App module loaded');
