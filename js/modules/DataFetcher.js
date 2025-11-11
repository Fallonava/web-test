/**
 * DataFetcher - Enhanced HTTP client with retry logic and error handling
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
   * Main fetch method with retry logic
   * @param {string} url 
   * @param {Object} options 
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
   * @param {string} url 
   * @param {Object} options 
   * @param {string} requestId 
   * @returns {Promise<any>}
   */
  async executeFetch(url, options, requestId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    // Add cache busting for GET requests
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
   * Retry logic with exponential backoff
   * @param {string} url 
   * @param {Object} options 
   * @param {string} requestId 
   * @param {Error} originalError 
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
      timeout: options.timeout * 1.5 // Increase timeout for retries
    });
  }

  /**
   * Calculate retry delay with exponential backoff
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
   * Add cache busting parameter to URL
   * @param {string} url 
   * @param {string} method 
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
   * Parse response based on content type
   * @param {Response} response 
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
   * @param {any} data 
   */
  validateResponse(data) {
    if (data === null || data === undefined) {
      throw new Error('Response data is null or undefined');
    }
    
    // Add custom validation logic based on your API
    if (typeof data === 'object' && data.error) {
      throw new Error(data.error.message || 'API returned error');
    }
  }

  /**
   * Determine if request should be retried
   * @param {Error} error 
   * @returns {boolean}
   */
  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx status codes
    if (error.name === 'AbortError') return true;
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) return true;
    if (error instanceof HttpError && error.status >= 500) return true;
    
    return false;
  }

  /**
   * Enhance error with additional context
   * @param {Error} error 
   * @param {string} url 
   * @param {string} requestId 
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
   * @param {string} requestId 
   * @param {string} url 
   * @param {number} duration 
   */
  trackSuccess(requestId, url, duration) {
    Analytics.trackEvent('Network', 'Success', url, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Request ${requestId} succeeded in ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Track failed request
   * @param {string} requestId 
   * @param {string} url 
   * @param {Error} error 
   * @param {number} duration 
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
   * Utility function for delays
   * @param {number} ms 
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
   * Reset statistics and retry count
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

  /**
   * Create pre-configured instance with custom options
   * @param {Object} options 
   * @returns {DataFetcher}
   */
  static create(options = {}) {
    return new DataFetcher(options);
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

/**
 * Pre-configured instances for common use cases
 */
export const fastFetcher = new DataFetcher({
  timeout: 5000,
  maxRetries: 2,
  retryDelay: 500
});

export const reliableFetcher = new DataFetcher({
  timeout: 15000,
  maxRetries: 5,
  retryDelay: 2000,
  retryBackoff: true
});

// Export singleton instance
export const defaultFetcher = new DataFetcher();
