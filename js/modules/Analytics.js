/**
 * Analytics - Tracking events dan errors untuk monitoring
 * @version 1.0.0
 */

export class Analytics {
    /**
     * Track custom event
     * @param {string} category - Event category
     * @param {string} action - Event action
     * @param {string} label - Event label (optional)
     * @param {number} value - Event value (optional)
     */
    static trackEvent(category, action, label = null, value = null) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }
        
        // Console untuk development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Analytics: ${category} - ${action}`, { label, value });
        }
    }
    
    /**
     * Track application error
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    static trackError(error, context = {}) {
        const errorInfo = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error('🚨 Application Error:', errorInfo);
        
        // Send to error tracking service
        this.trackEvent('Errors', error.name, error.message, 1);
        
        // Store in localStorage untuk debugging
        this.storeErrorLog(errorInfo);
    }
    
    /**
     * Store error log di localStorage
     * @param {Object} errorInfo - Error information
     */
    static storeErrorLog(errorInfo) {
        try {
            const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            errorLogs.unshift(errorInfo);
            errorLogs.splice(50); // Keep only last 50 errors
            localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
        } catch (e) {
            console.warn('Could not store error log:', e);
        }
    }
    
    /**
     * Track performance metrics
     * @param {string} metricName - Metric name
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Additional metadata
     */
    static trackPerformance(metricName, duration, metadata = {}) {
        this.trackEvent('Performance', metricName, null, duration);
        
        if (duration > 1000) { // Log slow operations
            console.warn(`🐌 Slow ${metricName}: ${duration}ms`, metadata);
        }
    }
    
    /**
     * Get stored error logs
     * @returns {Array}
     */
    static getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('errorLogs') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Clear error logs
     */
    static clearErrorLogs() {
        localStorage.removeItem('errorLogs');
    }
}
