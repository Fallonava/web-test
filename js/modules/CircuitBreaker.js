/**
 * CircuitBreaker - Implementasi circuit breaker pattern untuk handling failure
 * @version 1.0.0
 */

export class CircuitBreaker {
    constructor(failureThreshold = 5, resetTimeout = 60000) {
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }
    
    /**
     * Execute function dengan circuit breaker protection
     * @param {Function} fn - Function yang akan di-execute
     * @returns {Promise<any>}
     */
    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log('🔄 Circuit breaker transitioning to HALF_OPEN');
            } else {
                throw new Error('Circuit breaker is OPEN - service unavailable');
            }
        }
        
        try {
            const result = await fn();
            this.success();
            return result;
        } catch (error) {
            this.failure();
            throw error;
        }
    }
    
    /**
     * Reset state ketika success
     */
    success() {
        this.failureCount = 0;
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            console.log('✅ Circuit breaker reset to CLOSED');
        }
    }
    
    /**
     * Update state ketika failure
     */
    failure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.warn('🚨 Circuit breaker OPEN - too many failures');
        }
    }
    
    /**
     * Get current circuit breaker status
     * @returns {Object}
     */
    getStatus() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailure: this.lastFailureTime
        };
    }
    
    /**
     * Reset circuit breaker ke initial state
     */
    reset() {
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED';
        console.log('🔄 Circuit breaker reset');
    }
}
