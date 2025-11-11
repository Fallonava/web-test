/**
 * DataSync - Smart data synchronization dengan ETag dan hash checking
 * @version 1.0.0
 */

import { CircuitBreaker } from './CircuitBreaker.js';
import { Analytics } from './Analytics.js';

// Configuration
const CONFIG = {
    MAIN_SHEET_URL: "https://script.google.com/macros/s/AKfycbyVnM9JhKx8xj2EZhETj1BdSCnmJxtNBV4eFmohKE0denRS4VEA3JqPI-RVsQFg7ZuEtw/exec",
    FETCH_TIMEOUT: 10000
};

export class SmartDataSync {
    constructor() {
        this.lastDataHash = null;
        this.lastETag = null;
        this.lastModified = null;
        this.isChecking = false;
        this.consecutiveFailures = 0;
        this.totalChecks = 0;
        this.changesDetected = 0;
        
        this.circuitBreaker = new CircuitBreaker(3, 30000);
    }

    /**
     * Generate hash dari data untuk comparison
     * @param {Array} data - Data array
     * @returns {string}
     */
    generateDataHash(data) {
        if (!data || !Array.isArray(data)) return 'invalid';
        
        const dataString = data.map(doctor => 
            `${this.sanitizeString(doctor.Dokter)}|${this.sanitizeString(doctor.Spesialis)}|${this.sanitizeString(doctor.Status)}|${this.sanitizeString(doctor.Jam)}|${this.sanitizeString(doctor.Jenis)}`
        ).sort().join('||');
        
        return this.simpleHash(dataString);
    }

    /**
     * Sanitize input string untuk security
     * @param {string} str - Input string
     * @returns {string}
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').substring(0, 100);
    }

    /**
     * Simple hash function
     * @param {string} str - String to hash
     * @returns {string}
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Check for data updates
     * @returns {Promise<Object|boolean>}
     */
    async checkForUpdates() {
        if (this.isChecking) {
            console.log('⏳ Update check already in progress, skipping...');
            return false;
        }

        this.isChecking = true;
        this.totalChecks++;

        const startTime = performance.now();

        try {
            const result = await this.circuitBreaker.execute(() => this.fetchWithSecurity());
            
            const duration = performance.now() - startTime;
            Analytics.trackPerformance('DataSync', duration, { 
                checks: this.totalChecks,
                changes: this.changesDetected 
            });

            return result;

        } catch (error) {
            Analytics.trackError(error, { operation: 'checkForUpdates' });
            this.consecutiveFailures++;
            
            if (this.consecutiveFailures > 5) {
                console.log('🔄 Resetting sync state after consecutive failures');
                this.lastETag = null;
                this.lastModified = null;
            }
            
            return false;
        } finally {
            this.isChecking = false;
        }
    }

    /**
     * Fetch data dengan security headers
     * @returns {Promise<Object|boolean>}
     */
    async fetchWithSecurity() {
        // CSRF Protection - Add timestamp
        const timestamp = Date.now();
        const url = new URL(CONFIG.MAIN_SHEET_URL);
        url.searchParams.set('_t', timestamp);

        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        };

        if (this.lastETag) headers['If-None-Match'] = this.lastETag;
        if (this.lastModified) headers['If-Modified-Since'] = this.lastModified;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: headers,
                signal: controller.signal,
                credentials: 'same-origin'
            });

            clearTimeout(timeoutId);

            // Security headers check
            const securityHeaders = this.checkSecurityHeaders(response.headers);
            if (!securityHeaders.secure) {
                console.warn('⚠️ Missing security headers:', securityHeaders.missing);
            }

            this.lastETag = response.headers.get('ETag') || this.lastETag;
            this.lastModified = response.headers.get('Last-Modified') || this.lastModified;

            if (response.status === 304) {
                console.log('✅ Data unchanged (304)');
                this.consecutiveFailures = 0;
                return false;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!this.validateDataStructure(data)) {
                throw new Error('Invalid data structure received');
            }

            const newHash = this.generateDataHash(data);
            const oldHash = this.lastDataHash;

            if (newHash === oldHash && oldHash !== null) {
                console.log('✅ Data unchanged (hash match)');
                this.consecutiveFailures = 0;
                return false;
            }

            console.log('🔄 Data changed detected!', {
                oldHash: oldHash?.substring(0, 8),
                newHash: newHash.substring(0, 8)
            });

            this.lastDataHash = newHash;
            this.changesDetected++;
            this.consecutiveFailures = 0;

            return {
                data: data,
                hash: newHash,
                type: oldHash ? 'update' : 'initial'
            };

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Check security headers
     * @param {Headers} headers - Response headers
     * @returns {Object}
     */
    checkSecurityHeaders(headers) {
        const required = ['x-content-type-options', 'x-frame-options'];
        const missing = required.filter(header => !headers.get(header));
        
        return {
            secure: missing.length === 0,
            missing: missing
        };
    }

    /**
     * Validate data structure
     * @param {Array} data - Data to validate
     * @returns {boolean}
     */
    validateDataStructure(data) {
        if (!Array.isArray(data)) return false;
        
        return data.every(item => 
            item && 
            typeof item === 'object' &&
            this.isValidField(item.Spesialis) &&
            this.isValidField(item.Dokter) &&
            this.isValidField(item.Status) &&
            this.isValidField(item.Jenis)
        );
    }

    /**
     * Check if field is valid
     * @param {any} value - Field value
     * @returns {boolean}
     */
    isValidField(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.length > 200) return false;
        return true;
    }

    /**
     * Get sync statistics
     * @returns {Object}
     */
    getStats() {
        const successRate = this.totalChecks > 0 
            ? ((this.totalChecks - this.consecutiveFailures) / this.totalChecks * 100).toFixed(1)
            : 0;

        return {
            totalChecks: this.totalChecks,
            changesDetected: this.changesDetected,
            consecutiveFailures: this.consecutiveFailures,
            successRate: successRate,
            circuitState: this.circuitBreaker.getStatus()
        };
    }

    /**
     * Reset sync state
     */
    reset() {
        this.lastDataHash = null;
        this.lastETag = null;
        this.lastModified = null;
        this.consecutiveFailures = 0;
        this.circuitBreaker = new CircuitBreaker();
        console.log('🔄 Sync state reset');
    }
              }
