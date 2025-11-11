/**
 * ResourceManager - Manages application resources dan cleanup
 * @version 1.0.0
 */

export class ResourceManager {
    constructor() {
        this.intervals = [];
        this.timeouts = [];
        this.eventListeners = [];
        this.observers = [];
        this.controllers = [];
    }

    /**
     * Wrapper untuk setInterval dengan automatic cleanup
     * @param {Function} callback - Callback function
     * @param {number} delay - Delay in milliseconds
     * @returns {number} intervalId
     */
    setInterval(callback, delay) {
        const id = setInterval(callback, delay);
        this.intervals.push(id);
        return id;
    }

    /**
     * Wrapper untuk setTimeout dengan automatic cleanup
     * @param {Function} callback - Callback function
     * @param {number} delay - Delay in milliseconds
     * @returns {number} timeoutId
     */
    setTimeout(callback, delay) {
        const id = setTimeout(callback, delay);
        this.timeouts.push(id);
        return id;
    }

    /**
     * Wrapper untuk addEventListener dengan automatic cleanup
     * @param {EventTarget} target - Event target
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addEventListener(target, event, handler, options = {}) {
        target.addEventListener(event, handler, options);
        this.eventListeners.push({ target, event, handler, options });
    }

    /**
     * Wrapper untuk MutationObserver dengan automatic cleanup
     * @param {MutationObserver} observer - Observer instance
     * @param {Node} target - Target node
     * @param {Object} options - Observer options
     */
    addObserver(observer, target, options) {
        observer.observe(target, options);
        this.observers.push(observer);
    }

    /**
     * Create dan track AbortController untuk fetch requests
     * @returns {AbortController}
     */
    createAbortController() {
        const controller = new AbortController();
        this.controllers.push(controller);
        return controller;
    }

    /**
     * Remove specific interval
     * @param {number} id - Interval ID
     */
    clearInterval(id) {
        clearInterval(id);
        this.intervals = this.intervals.filter(intervalId => intervalId !== id);
    }

    /**
     * Remove specific timeout
     * @param {number} id - Timeout ID
     */
    clearTimeout(id) {
        clearTimeout(id);
        this.timeouts = this.timeouts.filter(timeoutId => timeoutId !== id);
    }

    /**
     * Remove specific event listener
     * @param {EventTarget} target - Event target
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    removeEventListener(target, event, handler, options = {}) {
        target.removeEventListener(event, handler, options);
        this.eventListeners = this.eventListeners.filter(
            listener => !(listener.target === target && 
                         listener.event === event && 
                         listener.handler === handler)
        );
    }

    /**
     * Get resource statistics
     * @returns {Object}
     */
    getStats() {
        return {
            intervals: this.intervals.length,
            timeouts: this.timeouts.length,
            eventListeners: this.eventListeners.length,
            observers: this.observers.length,
            controllers: this.controllers.length,
            total: this.intervals.length + this.timeouts.length + 
                   this.eventListeners.length + this.observers.length + 
                   this.controllers.length
        };
    }

    /**
     * Cleanup semua resources
     */
    cleanup() {
        console.group('🧹 ResourceManager Cleanup');
        
        // Clear intervals
        this.intervals.forEach(id => {
            clearInterval(id);
            console.log('✅ Cleared interval:', id);
        });
        
        // Clear timeouts
        this.timeouts.forEach(id => {
            clearTimeout(id);
            console.log('✅ Cleared timeout:', id);
        });
        
        // Remove event listeners
        this.eventListeners.forEach(({ target, event, handler, options }) => {
            target.removeEventListener(event, handler, options);
            console.log('✅ Removed event listener:', event, target);
        });
        
        // Disconnect observers
        this.observers.forEach(observer => {
            observer.disconnect();
            console.log('✅ Disconnected observer');
        });
        
        // Abort controllers
        this.controllers.forEach(controller => {
            controller.abort();
            console.log('✅ Aborted controller');
        });
        
        // Reset arrays
        this.intervals = [];
        this.timeouts = [];
        this.eventListeners = [];
        this.observers = [];
        this.controllers = [];
        
        const stats = this.getStats();
        console.log('📊 Final Stats:', stats);
        console.groupEnd();
        
        return stats;
    }

    /**
     * Auto-cleanup ketika page unload
     */
    enableAutoCleanup() {
        // Cleanup on page unload
        this.addEventListener(window, 'beforeunload', () => {
            this.cleanup();
        });

        // Cleanup on page hide (untuk SPA navigation)
        this.addEventListener(document, 'visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Keep resources but log stats
                console.log('📊 Resources on page hide:', this.getStats());
            }
        });
    }
}

// Export singleton instance untuk global use
export const globalResourceManager = new ResourceManager();

// Auto-enable cleanup untuk global instance
if (typeof window !== 'undefined') {
    globalResourceManager.enableAutoCleanup();
}
