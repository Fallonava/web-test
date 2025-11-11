export class Analytics {
  static trackEvent(category, action, label = null, value = null) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
    
    // Console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Analytics: ${category} - ${action}`, { label, value });
    }
  }
  
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
    
    // Store in localStorage for debugging
    this.storeErrorLog(errorInfo);
  }
  
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
  
  static trackPerformance(metricName, duration, metadata = {}) {
    this.trackEvent('Performance', metricName, null, duration);
    
    if (duration > 1000) { // Log slow operations
      console.warn(`🐌 Slow ${metricName}: ${duration}ms`, metadata);
    }
  }
}