/**
 * ResourceManager - Manages application resources and cleanup
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
   * Wrapper for setInterval with automatic cleanup
   * @param {Function} callback 
   * @param {number} delay 
   * @returns {number} intervalId
   */
  setInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.intervals.push(id);
    return id;
  }

  /**
   * Wrapper for setTimeout with automatic cleanup
   * @param {Function} callback 
   * @param {number} delay 
   * @returns {number} timeoutId
   */
  setTimeout(callback, delay) {
    const id = setTimeout(callback, delay);
    this.timeouts.push(id);
    return id;
  }

  /**
   * Wrapper for addEventListener with automatic cleanup
   * @param {EventTarget} target 
   * @param {string} event 
   * @param {Function} handler 
   * @param {Object} options 
   */
  addEventListener(target, event, handler, options = {}) {
    target.addEventListener(event, handler, options);
    this.eventListeners.push({ target, event, handler, options });
  }

  /**
   * Wrapper for MutationObserver with automatic cleanup
   * @param {MutationObserver} observer 
   * @param {Node} target 
   * @param {Object} options 
   */
  addObserver(observer, target, options) {
    observer.observe(target, options);
    this.observers.push(observer);
  }

  /**
   * Create and track AbortController for fetch requests
   * @returns {AbortController}
   */
  createAbortController() {
    const controller = new AbortController();
    this.controllers.push(controller);
    return controller;
  }

  /**
   * Remove specific interval
   * @param {number} id 
   */
  clearInterval(id) {
    clearInterval(id);
    this.intervals = this.intervals.filter(intervalId => intervalId !== id);
  }

  /**
   * Remove specific timeout
   * @param {number} id 
   */
  clearTimeout(id) {
    clearTimeout(id);
    this.timeouts = this.timeouts.filter(timeoutId => timeoutId !== id);
  }

  /**
   * Remove specific event listener
   * @param {EventTarget} target 
   * @param {string} event 
   * @param {Function} handler 
   * @param {Object} options 
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
   * Remove all resources of specific type
   * @param {string} type - 'intervals', 'timeouts', 'listeners', 'observers', 'controllers'
   */
  clearType(type) {
    switch (type) {
      case 'intervals':
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
        break;
      
      case 'timeouts':
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
        break;
      
      case 'listeners':
        this.eventListeners.forEach(({ target, event, handler, options }) => {
          target.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
        break;
      
      case 'observers':
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        break;
      
      case 'controllers':
        this.controllers.forEach(controller => controller.abort());
        this.controllers = [];
        break;
    }
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
   * Cleanup all resources
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
   * Auto-cleanup when page is unloaded
   */
  enableAutoCleanup() {
    // Cleanup on page unload
    this.addEventListener(window, 'beforeunload', () => {
      this.cleanup();
    });

    // Cleanup on page hide (for SPA navigation)
    this.addEventListener(document, 'visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Keep resources but log stats
        console.log('📊 Resources on page hide:', this.getStats());
      }
    });

    // Prevent memory leaks in development
    if (process.env.NODE_ENV === 'development') {
      this.addEventListener(window, 'load', () => {
        console.log('🔧 ResourceManager initialized with auto-cleanup');
      });
    }
  }

  /**
   * Create a scoped resource manager for specific components
   * @returns {ResourceManager}
   */
  createScope() {
    return new ResourceManager();
  }

  /**
   * Merge another ResourceManager into this one
   * @param {ResourceManager} otherManager 
   */
  merge(otherManager) {
    this.intervals.push(...otherManager.intervals);
    this.timeouts.push(...otherManager.timeouts);
    this.eventListeners.push(...otherManager.eventListeners);
    this.observers.push(...otherManager.observers);
    this.controllers.push(...otherManager.controllers);
    
    // Clear the other manager's arrays to avoid double cleanup
    otherManager.intervals = [];
    otherManager.timeouts = [];
    otherManager.eventListeners = [];
    otherManager.observers = [];
    otherManager.controllers = [];
  }
}

// Export singleton instance for global use
export const globalResourceManager = new ResourceManager();

// Auto-enable cleanup for global instance
if (typeof window !== 'undefined') {
  globalResourceManager.enableAutoCleanup();
}