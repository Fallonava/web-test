// ==================== CONFIGURATION ====================
    const CONFIG = {
      MAIN_SHEET_URL: "https://script.google.com/macros/s/AKfycbyVnM9JhKx8xj2EZhETj1BdSCnmJxtNBV4eFmohKE0denRS4VEA3JqPI-RVsQFg7ZuEtw/exec",
      FOOTER_SHEET_URL: "https://script.google.com/macros/s/AKfycbxYREx42acZcDyDe8DF75UJlB0hroAoQ4QH_gpd71RgGtbI889yAAtzegrjgwvfLkFY4Q/exec",
      REFRESH_INTERVAL: 120000,
      CACHE_DURATION: 600000,
      FETCH_TIMEOUT: 15000,
      MAX_RETRIES: 3
    };

    // ==================== OPTIMIZED UTILITY FUNCTIONS ====================
    const Utils = {
      escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      },

      getInitials(name) {
        if (!name) return 'DR';
        return name
          .split(/\s+/)
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .substring(0, 2);
      },

      debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            timeout = null;
            if (!immediate) func(...args);
          };
          const callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) func(...args);
        };
      },

      throttle(func, limit) {
        let inThrottle;
        return function(...args) {
          if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      }
    };

    // ==================== OPTIMIZED EVENT MANAGER ====================
    class EventManager {
      constructor() {
        this.handlers = new Map();
      }
      
      addDelegatedEvent(container, event, selector, handler) {
        const wrappedHandler = (e) => {
          const target = e.target.closest(selector);
          if (target) {
            handler(e, target);
          }
        };
        container.addEventListener(event, wrappedHandler);
        const key = `${event}-${selector}`;
        this.handlers.set(key, { handler: wrappedHandler, container });
      }
      
      removeDelegatedEvent(container, event, selector) {
        const key = `${event}-${selector}`;
        const handlerInfo = this.handlers.get(key);
        if (handlerInfo) {
          container.removeEventListener(event, handlerInfo.handler);
          this.handlers.delete(key);
        }
      }
      
      cleanup() {
        for (const [key, { handler, container }] of this.handlers) {
          const [event] = key.split('-');
          container.removeEventListener(event, handler);
        }
        this.handlers.clear();
      }
    }

    // ==================== OPTIMIZED SYNC SYSTEM ====================
    class TVOptimizedSync {
      constructor() {
        this.lastDataHash = null;
        this.isChecking = false;
        this.consecutiveFailures = 0;
        this.lastSuccessTime = 0;
      }

      generateSimpleHash(data) {
        if (!data || !Array.isArray(data)) return 'invalid';
        
        // Optimized hash generation
        let hash = 0;
        for (const doctor of data) {
          hash = ((hash << 5) - hash) + 
            (doctor.Dokter?.length || 0) + 
            (doctor.Status?.length || 0);
          hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
      }

      async checkForUpdates() {
        if (this.isChecking || document.hidden) {
          return false;
        }

        // Optimized frequency limiting
        if (Date.now() - this.lastSuccessTime < 30000 && this.consecutiveFailures === 0) {
          return false;
        }

        this.isChecking = true;

        try {
          const response = await this.fetchWithTimeout(CONFIG.MAIN_SHEET_URL, 8000);

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          
          if (!this.validateData(data)) throw new Error('Invalid data');

          const newHash = this.generateSimpleHash(data);
          const hasChanged = newHash !== this.lastDataHash;

          this.lastDataHash = newHash;
          this.consecutiveFailures = 0;
          this.lastSuccessTime = Date.now();

          return hasChanged ? { data, hash: newHash } : false;

        } catch (error) {
          this.consecutiveFailures++;
          console.warn('❌ Update check failed:', error.message);
          return false;
        } finally {
          this.isChecking = false;
        }
      }

      async fetchWithTimeout(url, timeout = 8000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { 
            signal: controller.signal,
            cache: 'no-cache'
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }

      validateData(data) {
        return Array.isArray(data) && data.every(item => 
          item && 
          typeof item === 'object' &&
          'Spesialis' in item &&
          'Dokter' in item &&
          'Status' in item
        );
      }
    }

    // ==================== OPTIMIZED RESOURCE MANAGER ====================
    class SimpleResourceManager {
      constructor() {
        this.intervals = [];
        this.timeouts = [];
        this.eventListeners = [];
        this.animationFrames = [];
      }

      setInterval(callback, delay) {
        const id = setInterval(callback, delay);
        this.intervals.push(id);
        return id;
      }

      setTimeout(callback, delay) {
        const id = setTimeout(callback, delay);
        this.timeouts.push(id);
        return id;
      }

      requestAnimationFrame(callback) {
        const id = requestAnimationFrame(callback);
        this.animationFrames.push(id);
        return id;
      }

      addEventListener(target, event, handler, options) {
        target.addEventListener(event, handler, options);
        this.eventListeners.push({ target, event, handler });
      }

      cleanup() {
        this.intervals.forEach(clearInterval);
        this.timeouts.forEach(clearTimeout);
        this.animationFrames.forEach(cancelAnimationFrame);
        this.eventListeners.forEach(({ target, event, handler }) => {
          target.removeEventListener(event, handler);
        });
        
        this.intervals = [];
        this.timeouts = [];
        this.animationFrames = [];
        this.eventListeners = [];
      }
    }

    // ==================== OPTIMIZED DATA RENDERER ====================
    class DataRenderer {
      static getStatusClass(status) {
        if (!status) return 'status--tidak';
        
        const statusUpper = status.toUpperCase();
        if (statusUpper.includes('BUKA')) return 'status--buka';
        if (statusUpper.includes('PENUH')) return 'status--penuh';
        if (statusUpper.includes('SELESAI')) return 'status--selesai';
        if (statusUpper.includes('CUTI')) return 'status--cuti';
        if (statusUpper.includes('TIDAK ADA POLI') || statusUpper.includes('TIDAK-ADA-POLI')) return 'status--tidak-poli';
        if (statusUpper.includes('TIDAK')) return 'status--tidak';
        
        return 'status--tidak';
      }

      static createTableRow(item) {
        const tr = document.createElement('tr');
        const statusClass = this.getStatusClass(item.Status);
        
        tr.innerHTML = `
          <td class="table-align-left">${Utils.escapeHtml(item.Spesialis || '-')}</td>
          <td class="table-align-left">${Utils.escapeHtml(item.Dokter || '-')}</td>
          <td class="table-align-center"><span class="status ${statusClass}">${Utils.escapeHtml(item.Status || 'TIDAK')}</span></td>
          <td class="table-align-center">${Utils.escapeHtml(item.Jam || '-')}</td>
        `;
        
        return tr;
      }

      static showData(data) {
        const bedahTable = document.getElementById("bedahBody");
        const nonBedahTable = document.getElementById("nonBedahBody");
        
        if (!data || data.length === 0) {
          this.showEmptyState();
          return;
        }

        // Use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
          const bedahFragment = document.createDocumentFragment();
          const nonBedahFragment = document.createDocumentFragment();

          for (const item of data) {
            const row = this.createTableRow(item);
            if (item.Jenis === "Bedah") {
              bedahFragment.appendChild(row);
            } else {
              nonBedahFragment.appendChild(row);
            }
          }

          bedahTable.innerHTML = '';
          nonBedahTable.innerHTML = '';
          bedahTable.appendChild(bedahFragment);
          nonBedahTable.appendChild(nonBedahFragment);

          // Animate sections with optimized timing
          document.querySelectorAll('.section').forEach((sec, index) => {
            sec.classList.remove('show');
            setTimeout(() => sec.classList.add('show'), index * 50);
          });
        });
      }

      static showEmptyState() {
        const emptyHTML = `
          <tr>
            <td colspan="4" class="error-message">
              📝 Tidak ada data jadwal dokter yang tersedia.
            </td>
          </tr>
        `;
        
        document.querySelectorAll('tbody').forEach(tbody => {
          tbody.innerHTML = emptyHTML;
        });
      }

      static displayCutiDoctors(data) {
        const cutiContainer = document.getElementById('cutiScrollContent');
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          cutiContainer.innerHTML = '<div class="cuti-empty">Tidak ada dokter yang sedang cuti</div>';
          return;
        }

        requestAnimationFrame(() => {
          const fragment = document.createDocumentFragment();
          let validItems = 0;
          
          for (const doctor of data) {
            try {
              const namaDokter = doctor.Dokter || doctor.Nama || doctor['Nama Dokter'];
              if (!namaDokter) continue;

              const spesialis = doctor.Spesialis || doctor.Poli || doctor['Spesialisasi'] || 'Spesialis';
              const tanggalCuti = doctor.Tanggal || doctor.Period || doctor.Jam || doctor['Periode Cuti'] || 'Cuti';
              
              const cutiItem = document.createElement('div');
              cutiItem.className = 'cuti-item';
              cutiItem.setAttribute('data-dokter', Utils.escapeHtml(namaDokter));
              cutiItem.innerHTML = `
                <div class="cuti-avatar">${Utils.getInitials(namaDokter)}</div>
                <div class="cuti-info">
                  <div class="cuti-name-row">
                    <span class="cuti-dokter-name">${Utils.escapeHtml(namaDokter)}</span>
                    <span class="cuti-separator">-</span>
                    <span class="cuti-spesialis">${Utils.escapeHtml(spesialis)}</span>
                  </div>
                  <div class="cuti-date-row">
                    <span class="cuti-date-icon">📅</span>
                    <span>${Utils.escapeHtml(tanggalCuti)}</span>
                  </div>
                </div>
                <div class="cuti-badge">CUTI</div>
              `;
              
              fragment.appendChild(cutiItem);
              validItems++;
              
            } catch (error) {
              console.error('Error processing cuti doctor:', error);
            }
          }

          cutiContainer.innerHTML = '';
          cutiContainer.appendChild(fragment);
          
          if (validItems === 0) {
            cutiContainer.innerHTML = '<div class="cuti-empty">Tidak ada data cuti yang valid</div>';
          }
        });
      }
    }

    // ==================== OPTIMIZED CACHE MANAGER ====================
    class CacheManager {
      static cacheData(data) {
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

      static getCachedData() {
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

      static clearCache() {
        try {
          localStorage.removeItem('doctorSchedule');
        } catch (e) {
          console.warn('Gagal menghapus cache:', e);
        }
      }
    }

    // ==================== OPTIMIZED APPLICATION STATE ====================
    const AppState = {
      allData: [],
      cutiData: [],
      dataInterval: null,
      resources: new SimpleResourceManager(),
      smartSync: new TVOptimizedSync(),
      eventManager: new EventManager(),
      
      // DOM Elements cache
      elements: {},

      initialize() {
        this.cacheDOMElements();
        this.initializeOfflineDetection();
        this.initializeEventDelegation();
        this.initializeModalEvents();
        
        this.updateDateTime();
        this.showSkeletonLoading();
        this.loadInitialData();
        
        this.resources.setInterval(() => this.updateDateTime(), 1000);
        this.startTVOptimizedPolling();
        
        this.resources.addEventListener(document, 'visibilitychange', () => this.handleVisibilityChange());
        this.resources.addEventListener(window, 'online', () => this.handleOnlineStatus());
        this.resources.addEventListener(window, 'offline', () => this.handleOnlineStatus());
        this.resources.addEventListener(window, 'beforeunload', () => this.cleanup());
      },

      cacheDOMElements() {
        this.elements = {
          loadingIndicator: document.getElementById('loadingIndicator'),
          loadingMessage: document.getElementById('loadingMessage'),
          liveRegion: document.getElementById('liveRegion'),
          offlineBanner: document.getElementById('offlineBanner'),
          onlineBanner: document.getElementById('onlineBanner'),
          updateNotification: document.getElementById('updateNotification'),
          syncStatus: document.getElementById('syncStatus'),
          cutiModal: document.getElementById('cutiDetailModal'),
          cutiModalClose: document.getElementById('cutiModalClose'),
          cutiDetailContent: document.getElementById('cutiDetailContent'),
          cutiScrollContent: document.getElementById('cutiScrollContent'),
          tanggal: document.getElementById('tanggal'),
          jam: document.getElementById('jam')
        };
      },

      cleanup() {
        console.log('🧹 Cleaning up application...');
        this.resources.cleanup();
        this.eventManager.cleanup();
      },

      initializeOfflineDetection() {
        this.updateOnlineStatus();
      },

      updateOnlineStatus() {
        const isOnline = navigator.onLine;
        this.elements.offlineBanner.style.display = isOnline ? 'none' : 'block';
        
        if (isOnline) {
          this.elements.onlineBanner.style.display = 'block';
          this.resources.setTimeout(() => {
            this.elements.onlineBanner.style.display = 'none';
          }, 3000);
        } else {
          this.elements.onlineBanner.style.display = 'none';
        }
      },

      initializeEventDelegation() {
        // Use event delegation for cuti items
        this.eventManager.addDelegatedEvent(
          this.elements.cutiScrollContent,
          'click',
          '.cuti-item',
          (e, target) => {
            const dokter = target.getAttribute('data-dokter');
            const spesialis = target.querySelector('.cuti-spesialis').textContent;
            const tanggal = target.querySelector('.cuti-date-row span:last-child').textContent;
            this.showCutiDetail(dokter, spesialis, tanggal);
          }
        );
      },

      initializeModalEvents() {
        this.resources.addEventListener(this.elements.cutiModalClose, 'click', () => this.closeCutiModal());
        this.resources.addEventListener(document, 'keydown', (e) => {
          if (e.key === 'Escape') this.closeCutiModal();
        });
        this.resources.addEventListener(this.elements.cutiModal, 'click', (e) => {
          if (e.target === this.elements.cutiModal) this.closeCutiModal();
        });
      },

      async loadInitialData() {
        const cached = CacheManager.getCachedData();
        if (cached) {
          console.log('📂 Loading from cache');
          DataRenderer.showData(cached.mainData);
          DataRenderer.displayCutiDoctors(cached.cutiData);
          this.smartSync.lastDataHash = this.smartSync.generateSimpleHash(cached.mainData);
          this.hideLoading();
          this.resources.setTimeout(() => this.loadCutiData(), 1000);
          return;
        }

        try {
          this.showLoading();
          const [mainData, footerData] = await Promise.all([
            this.fetchWithRetry(CONFIG.MAIN_SHEET_URL),
            this.fetchWithRetry(CONFIG.FOOTER_SHEET_URL)
          ]);
          
          if (!this.validateMainData(mainData)) {
            throw new Error('Format data utama tidak valid');
          }
          
          this.allData = mainData;
          this.cutiData = footerData;
          this.smartSync.lastDataHash = this.smartSync.generateSimpleHash(mainData);
          
          CacheManager.cacheData({ mainData, cutiData: footerData });
          DataRenderer.showData(mainData);
          DataRenderer.displayCutiDoctors(footerData);
          this.hideLoading();
          
          this.announceToScreenReader('Data jadwal dokter telah dimuat');
          
        } catch (err) {
          console.error("Gagal memuat data:", err);
          this.showErrorState(this.getUserFriendlyError(err));
          this.hideLoading();
        }
      },

      async fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
        for (let i = 0; i < retries; i++) {
          try {
            return await this.fetchWithTimeout(url);
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      },

      async fetchWithTimeout(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
        
        try {
          const response = await fetch(url, { 
            signal: controller.signal,
            cache: 'no-cache'
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },

      async loadCutiData() {
        try {
          const footerData = await this.fetchWithRetry(CONFIG.FOOTER_SHEET_URL);
          this.cutiData = footerData;
          DataRenderer.displayCutiDoctors(footerData);
          
          const cached = CacheManager.getCachedData() || {};
          CacheManager.cacheData({ mainData: cached.mainData || this.allData, cutiData: footerData });
          
        } catch (err) {
          console.warn('⚠️ Gagal memuat data cuti:', err.message);
        }
      },

      validateMainData(data) {
        return Array.isArray(data) && data.every(item => 
          item && typeof item === 'object' &&
          'Spesialis' in item && 'Dokter' in item &&
          'Status' in item && 'Jenis' in item
        );
      },

      getUserFriendlyError(error) {
        if (error.name === 'AbortError') {
          return 'Timeout: Server tidak merespons. Memuat data cache jika tersedia.';
        } else if (error.message.includes('Failed to fetch')) {
          return 'Koneksi internet terputus. Memuat data cache terakhir.';
        } else {
          return 'Gagal memuat data jadwal. Memuat data cache jika tersedia.';
        }
      },

      startTVOptimizedPolling() {
        this.dataInterval = this.resources.setInterval(async () => {
          await this.checkForDataUpdates();
        }, CONFIG.REFRESH_INTERVAL);
      },

      async checkForDataUpdates() {
        if (document.hidden) return;
        
        this.updateSyncStatus('syncing');
        const updateResult = await this.smartSync.checkForUpdates();
        
        if (updateResult) {
          console.log('🎉 Data updated');
          await this.processDataUpdate(updateResult.data);
          this.showUpdateNotification();
          this.updateSyncStatus('up-to-date');
          CacheManager.cacheData({ mainData: updateResult.data, cutiData: this.cutiData });
        } else {
          this.updateSyncStatus('up-to-date');
        }
      },

      async processDataUpdate(newData) {
        if (!this.validateMainData(newData)) {
          throw new Error('Data tidak valid dari server');
        }
        this.allData = newData;
        DataRenderer.showData(newData);
        this.announceToScreenReader('Data jadwal dokter telah diperbarui');
      },

      updateSyncStatus(status) {
        this.elements.syncStatus.className = `sync-status ${status}`;
        this.elements.syncStatus.textContent = status === 'syncing' ? 'Memeriksa update...' : 'Data terkini';
      },

      showUpdateNotification() {
        this.elements.updateNotification.style.display = 'flex';
        this.resources.setTimeout(() => {
          this.elements.updateNotification.style.display = 'none';
        }, 3000);
      },

      showSkeletonLoading() {
        const skeletonRow = `
          <tr class="skeleton-row">
            <td class="table-align-left"><div class="skeleton"></div></td>
            <td class="table-align-left"><div class="skeleton"></div></td>
            <td class="table-align-center"><div class="skeleton" style="width: 85px; height: 28px; margin: 0 auto;"></div></td>
            <td class="table-align-center"><div class="skeleton"></div></td>
          </tr>
        `;
        
        document.getElementById('bedahBody').innerHTML = skeletonRow.repeat(3);
        document.getElementById('nonBedahBody').innerHTML = skeletonRow.repeat(5);
        
        document.querySelectorAll('.section').forEach(sec => {
          sec.classList.add('show');
        });
      },

      showLoading() {
        this.elements.loadingIndicator.style.display = 'block';
      },

      hideLoading() {
        this.elements.loadingIndicator.style.display = 'none';
      },

      showErrorState(message = '⚠️ Gagal memuat data jadwal dokter.') {
        const errorHTML = `
          <tr>
            <td colspan="4" class="error-message">
              ${message}<br>
              <button onclick="AppState.loadInitialData()">Coba Lagi</button>
            </td>
          </tr>
        `;
        
        document.querySelectorAll('tbody').forEach(tbody => {
          if (tbody.children.length === 0) tbody.innerHTML = errorHTML;
        });
      },

      updateDateTime() {
        const now = new Date();
        this.elements.tanggal.textContent = now.toLocaleDateString('id-ID', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        
        const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const detik = now.toLocaleTimeString('id-ID', { second: '2-digit' });
      
        this.elements.jam.innerHTML = `
          <span class="jam-utama">${jam}</span>
          <span class="jam-detik">${detik}</span>
        `;
      },

      handleVisibilityChange() {
        if (document.hidden) {
          if (this.dataInterval) {
            clearInterval(this.dataInterval);
            this.dataInterval = null;
          }
        } else {
          this.startTVOptimizedPolling();
          this.resources.setTimeout(() => this.checkForDataUpdates(), 1000);
        }
      },

      handleOnlineStatus() {
        this.updateOnlineStatus();
        if (navigator.onLine) {
          this.resources.setTimeout(() => this.checkForDataUpdates(), 2000);
        }
      },

      announceToScreenReader(message) {
        this.elements.liveRegion.textContent = message;
      },

      showCutiDetail(nama, spesialis, tanggal) {
        this.elements.cutiDetailContent.innerHTML = `
          <div class="cuti-detail-item">
            <div class="cuti-detail-avatar">${Utils.getInitials(nama)}</div>
            <div class="cuti-detail-info">
              <div class="cuti-detail-name">${Utils.escapeHtml(nama)}</div>
              <div class="cuti-detail-spec">${Utils.escapeHtml(spesialis)}</div>
              <div class="cuti-detail-dates">
                <span>📅 ${Utils.escapeHtml(tanggal)}</span>
              </div>
            </div>
            <div class="cuti-detail-status">CUTI</div>
          </div>
        `;
        this.elements.cutiModal.classList.add('active');
      },

      closeCutiModal() {
        this.elements.cutiModal.classList.remove('active');
      }
    };

    // ==================== INITIALIZATION ====================
    document.addEventListener('DOMContentLoaded', () => {
      AppState.initialize();
    });

    // Global exports
    window.AppState = AppState;