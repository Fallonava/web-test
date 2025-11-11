/**
 * DataFetcher - Enhanced HTTP client dengan retry logic dan error handling
 * @version 1.0.0
 */

import { Analytics } from './Analytics.js';

export class DataFetcher {
    constructor(options = {}) {
        this.defaultOptions = {
            timeout: 10000,
            maxRetries: 3,
            retryDelay: 1000,
            retryBackoff: true,
            ...options
        };
        
        this.retryCount = 0;
        this.totalRequests = 0;
        this.failedRequests = 0;
        this.cache = new Map();
    }

    /**
     * Main fetch method dengan retry logic
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<any>}
     */
    async fetchWithRetry(url, options = {}) {
        const startTime = performance.now();
        const requestId = this.generateRequestId();
        
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            },
            ...options,
            timeout: options.timeout || this.defaultOptions.timeout
        };

        this.totalRequests++;
        
        try {
            const data = await this.executeFetch(url, fetchOptions, requestId);
            
            const duration = performance.now() - startTime;
            this.trackSuccess(requestId, url, duration);
            
            return data;
            
        } catch (error) {
            this.failedRequests++;
            const duration = performance.now() - startTime;
            this.trackError(requestId, url, error, duration);
            
            if (this.shouldRetry(error)) {
                return this.retryFetch(url, fetchOptions, requestId, error);
            }
            
            throw this.enhanceError(error, url, requestId);
        }
    }

    /**
     * Execute single fetch request
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @param {string} requestId - Request ID
     * @returns {Promise<any>}
     */
    async executeFetch(url, options, requestId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        // Add cache busting untuk GET requests
        const finalUrl = this.addCacheBusting(url, options.method);
        
        console.log(`🌐 Fetching [${requestId}]:`, finalUrl);
        
        const response = await fetch(finalUrl, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new HttpError(response.status, `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await this.parseResponse(response);
        this.validateResponse(data);
        
        return data;
    }

    /**
     * Retry logic dengan exponential backoff
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @param {string} requestId - Request ID
     * @param {Error} originalError - Original error
     * @returns {Promise<any>}
     */
    async retryFetch(url, options, requestId, originalError) {
        this.retryCount++;
        
        if (this.retryCount > this.defaultOptions.maxRetries) {
            throw new Error(
                `Gagal memuat data setelah ${this.defaultOptions.maxRetries} percobaan: ${originalError.message}`
            );
        }
        
        const delay = this.calculateRetryDelay();
        console.log(`🔄 Retry ${this.retryCount}/${this.defaultOptions.maxRetries} in ${delay}ms`);
        
        Analytics.trackEvent('Network', 'Retry', url, this.retryCount);
        
        await this.delay(delay);
        
        return this.fetchWithRetry(url, {
            ...options,
            timeout: options.timeout * 1.5 // Increase timeout untuk retries
        });
    }

    /**
     * Calculate retry delay dengan exponential backoff
     * @returns {number}
     */
    calculateRetryDelay() {
        if (!this.defaultOptions.retryBackoff) {
            return this.defaultOptions.retryDelay;
        }
        
        return Math.min(
            this.defaultOptions.retryDelay * Math.pow(2, this.retryCount - 1),
            30000 // Max 30 seconds
        );
    }

    /**
     * Add cache busting parameter ke URL
     * @param {string} url - URL
     * @param {string} method - HTTP method
     * @returns {string}
     */
    addCacheBusting(url, method) {
        if (method && method.toUpperCase() !== 'GET') {
            return url;
        }
        
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('_t', Date.now());
        return urlObj.toString();
    }

    /**
     * Parse response berdasarkan content type
     * @param {Response} response - Fetch response
     * @returns {Promise<any>}
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            return response.json();
        }
        
        if (contentType.includes('text/')) {
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        }
        
        return response.text();
    }

    /**
     * Validate response data structure
     * @param {any} data - Response data
     */
    validateResponse(data) {
        if (data === null || data === undefined) {
            throw new Error('Response data is null or undefined');
        }
        
        // Add custom validation logic berdasarkan API
        if (typeof data === 'object' && data.error) {
            throw new Error(data.error.message || 'API returned error');
        }
    }

    /**
     * Determine jika request harus di-retry
     * @param {Error} error - Error object
     * @returns {boolean}
     */
    shouldRetry(error) {
        // Retry on network errors, timeouts, dan 5xx status codes
        if (error.name === 'AbortError') return true;
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) return true;
        if (error instanceof HttpError && error.status >= 500) return true;
        
        return false;
    }

    /**
     * Enhance error dengan additional context
     * @param {Error} error - Original error
     * @param {string} url - Request URL
     * @param {string} requestId - Request ID
     * @returns {Error}
     */
    enhanceError(error, url, requestId) {
        const enhancedError = new Error(error.message);
        enhancedError.name = error.name;
        enhancedError.stack = error.stack;
        enhancedError.url = url;
        enhancedError.requestId = requestId;
        enhancedError.retryCount = this.retryCount;
        enhancedError.timestamp = new Date().toISOString();
        
        return enhancedError;
    }

    /**
     * Generate unique request ID
     * @returns {string}
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Track successful request
     * @param {string} requestId - Request ID
     * @param {string} url - Request URL
     * @param {number} duration - Request duration
     */
    trackSuccess(requestId, url, duration) {
        Analytics.trackEvent('Network', 'Success', url, duration);
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Request ${requestId} succeeded in ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Track failed request
     * @param {string} requestId - Request ID
     * @param {string} url - Request URL
     * @param {Error} error - Error object
     * @param {number} duration - Request duration
     */
    trackError(requestId, url, error, duration) {
        Analytics.trackError(error, { 
            requestId, 
            url, 
            duration,
            retryCount: this.retryCount 
        });
        
        console.warn(`❌ Request ${requestId} failed after ${duration.toFixed(2)}ms:`, error.message);
    }

    /**
     * Utility function untuk delays
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get fetch statistics
     * @returns {Object}
     */
    getStats() {
        const successRate = this.totalRequests > 0 
            ? ((this.totalRequests - this.failedRequests) / this.totalRequests * 100).toFixed(1)
            : 0;

        return {
            totalRequests: this.totalRequests,
            failedRequests: this.failedRequests,
            retryCount: this.retryCount,
            successRate: `${successRate}%`,
            cacheSize: this.cache.size
        };
    }

    /**
     * Reset statistics dan retry count
     */
    resetStats() {
        this.retryCount = 0;
        this.totalRequests = 0;
        this.failedRequests = 0;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 DataFetcher cache cleared');
    }
}

/**
 * Custom HTTP Error class
 */
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

// Export singleton instance
export const defaultFetcher = new DataFetcher();
