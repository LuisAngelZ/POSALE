/**
 * ==========================================
 * STATE MANAGER
 * Sistema de gestión de estado global
 * ==========================================
 */

/**
 * StateManager - Gestiona el estado global de la aplicación
 */
class StateManager {
    constructor() {
        this.state = {};
        this.subscribers = {};
        this.history = [];
        this.maxHistorySize = 50;
        
        // Sensitive data keys that should be cleared on logout
        this.sensitiveKeys = new Set(['user', 'token', 'cart', 'currentSale']);
        
        console.log('📊 StateManager inicializado');
    }
    
    /**
     * Initialize state manager
     */
    init() {
        // Load persisted state from localStorage
        this.loadPersistedState();
        
        // Setup auto-persistence for certain keys
        this.setupAutoPersistence();
        
        console.log('✅ StateManager configurado');
    }
    
    /**
     * Set state value
     */
    setState(key, value) {
        const oldValue = this.state[key];
        
        // Don't update if value hasn't changed
        if (this.deepEqual(oldValue, value)) {
            return this;
        }
        
        // Store in history
        this.addToHistory(key, oldValue, value);
        
        // Update state
        this.state[key] = value;
        
        // Notify subscribers
        this.notifySubscribers(key, value, oldValue);
        
        // Auto-persist if configured
        this.autoPersist(key, value);
        
        console.log(`📊 Estado actualizado: ${key}`, { oldValue, newValue: value });
        
        return this;
    }
    
    /**
     * Get state value
     */
    getState(key) {
        return key ? this.state[key] : { ...this.state };
    }
    
    /**
     * Check if state has key
     */
    hasState(key) {
        return key in this.state;
    }
    
    /**
     * Remove state key
     */
    removeState(key) {
        if (!(key in this.state)) {
            return this;
        }
        
        const oldValue = this.state[key];
        delete this.state[key];
        
        // Add to history
        this.addToHistory(key, oldValue, undefined);
        
        // Notify subscribers
        this.notifySubscribers(key, undefined, oldValue);
        
        // Remove from persistence
        this.removePersisted(key);
        
        console.log(`📊 Estado eliminado: ${key}`);
        
        return this;
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.subscribers[key]) {
            this.subscribers[key] = [];
        }
        
        this.subscribers[key].push(callback);
        
        // Call immediately with current value
        if (key in this.state) {
            try {
                callback(this.state[key], undefined);
            } catch (error) {
                console.error(`❌ Error en subscriber inicial para ${key}:`, error);
            }
        }
        
        // Return unsubscribe function
        return () => this.unsubscribe(key, callback);
    }
    
    /**
     * Unsubscribe from state changes
     */
    unsubscribe(key, callback) {
        if (this.subscribers[key]) {
            const index = this.subscribers[key].indexOf(callback);
            if (index > -1) {
                this.subscribers[key].splice(index, 1);
            }
        }
    }
    
    /**
     * Subscribe to multiple keys
     */
    subscribeToMultiple(keys, callback) {
        const unsubscribeFns = keys.map(key => 
            this.subscribe(key, (value, oldValue) => 
                callback(key, value, oldValue, this.getState())
            )
        );
        
        // Return function to unsubscribe from all
        return () => unsubscribeFns.forEach(fn => fn());
    }
    
    /**
     * Notify subscribers of state changes
     */
    notifySubscribers(key, newValue, oldValue) {
        if (this.subscribers[key]) {
            this.subscribers[key].forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`❌ Error en subscriber para ${key}:`, error);
                }
            });
        }
        
        // Notify wildcard subscribers
        if (this.subscribers['*']) {
            this.subscribers['*'].forEach(callback => {
                try {
                    callback(key, newValue, oldValue, this.getState());
                } catch (error) {
                    console.error(`❌ Error en subscriber wildcard:`, error);
                }
            });
        }
    }
    
    /**
     * Batch state updates
     */
    batchUpdate(updates) {
        const oldStates = {};
        
        // Collect old values
        Object.keys(updates).forEach(key => {
            oldStates[key] = this.state[key];
        });
        
        // Apply all updates
        Object.entries(updates).forEach(([key, value]) => {
            this.state[key] = value;
            this.addToHistory(key, oldStates[key], value);
        });
        
        // Notify subscribers for all changes
        Object.entries(updates).forEach(([key, value]) => {
            this.notifySubscribers(key, value, oldStates[key]);
            this.autoPersist(key, value);
        });
        
        console.log('📊 Batch update aplicado:', updates);
        
        return this;
    }
    
    /**
     * Reset state to initial values
     */
    reset(keysToKeep = []) {
        const currentState = { ...this.state };
        
        // Clear all state except keys to keep
        this.state = {};
        keysToKeep.forEach(key => {
            if (key in currentState) {
                this.state[key] = currentState[key];
            }
        });
        
        // Notify all subscribers of reset
        Object.keys(currentState).forEach(key => {
            if (!keysToKeep.includes(key)) {
                this.notifySubscribers(key, undefined, currentState[key]);
            }
        });
        
        // Clear persisted data except keys to keep
        this.clearPersistence(keysToKeep);
        
        console.log('📊 Estado resetado, manteniendo:', keysToKeep);
        
        return this;
    }
    
    /**
     * Clear sensitive data (on logout, etc.)
     */
    clearSensitiveData() {
        const sensitiveKeys = Array.from(this.sensitiveKeys);
        const oldValues = {};
        
        sensitiveKeys.forEach(key => {
            if (key in this.state) {
                oldValues[key] = this.state[key];
                delete this.state[key];
            }
        });
        
        // Notify subscribers
        Object.entries(oldValues).forEach(([key, oldValue]) => {
            this.notifySubscribers(key, undefined, oldValue);
        });
        
        // Remove from persistence
        sensitiveKeys.forEach(key => this.removePersisted(key));
        
        console.log('🧹 Datos sensibles limpiados:', sensitiveKeys);
        
        return this;
    }
    
    /**
     * Add key as sensitive
     */
    addSensitiveKey(key) {
        this.sensitiveKeys.add(key);
        return this;
    }
    
    /**
     * Remove key from sensitive
     */
    removeSensitiveKey(key) {
        this.sensitiveKeys.delete(key);
        return this;
    }
    
    /**
     * History management
     */
    addToHistory(key, oldValue, newValue) {
        const historyEntry = {
            key,
            oldValue,
            newValue,
            timestamp: Date.now()
        };
        
        this.history.unshift(historyEntry);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
    }
    
    /**
     * Get state history
     */
    getHistory(key = null) {
        if (key) {
            return this.history.filter(entry => entry.key === key);
        }
        return [...this.history];
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        return this;
    }
    
    /**
     * Persistence management
     */
    setupAutoPersistence() {
        // Keys that should be auto-persisted
        this.persistedKeys = new Set([
            'theme',
            'language',
            'userPreferences',
            'uiState'
        ]);
    }
    
    autoPersist(key, value) {
        if (this.persistedKeys.has(key)) {
            this.persistState(key, value);
        }
    }
    
    persistState(key, value) {
        try {
            const storageKey = `pos_state_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
            console.warn(`⚠️ Error persistiendo estado ${key}:`, error);
        }
    }
    
    loadPersistedState() {
        this.persistedKeys.forEach(key => {
            try {
                const storageKey = `pos_state_${key}`;
                const value = localStorage.getItem(storageKey);
                
                if (value !== null) {
                    this.state[key] = JSON.parse(value);
                    console.log(`📱 Estado cargado del storage: ${key}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando estado ${key}:`, error);
            }
        });
    }
    
    removePersisted(key) {
        try {
            const storageKey = `pos_state_${key}`;
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.warn(`⚠️ Error eliminando estado persistido ${key}:`, error);
        }
    }
    
    clearPersistence(keysToKeep = []) {
        // Get all state keys from localStorage
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('pos_state_')) {
                const stateKey = key.replace('pos_state_', '');
                if (!keysToKeep.includes(stateKey)) {
                    keysToRemove.push(key);
                }
            }
        }
        
        // Remove keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }
    
    /**
     * Computed state (derived values)
     */
    addComputed(key, computeFn, dependencies = []) {
        // Subscribe to dependencies and recompute when they change
        const recompute = () => {
            try {
                const result = computeFn(this.getState());
                this.setState(key, result);
            } catch (error) {
                console.error(`❌ Error en computed ${key}:`, error);
            }
        };
        
        // Initial computation
        recompute();
        
        // Subscribe to dependencies
        const unsubscribeFns = dependencies.map(dep => 
            this.subscribe(dep, recompute)
        );
        
        // Return function to remove computed
        return () => {
            unsubscribeFns.forEach(fn => fn());
            this.removeState(key);
        };
    }
    
    /**
     * State validation
     */
    addValidator(key, validatorFn) {
        return this.subscribe(key, (newValue, oldValue) => {
            try {
                const isValid = validatorFn(newValue, oldValue);
                if (!isValid) {
                    console.warn(`⚠️ Validación fallida para ${key}:`, newValue);
                    // Optionally revert to old value
                    // this.setState(key, oldValue);
                }
            } catch (error) {
                console.error(`❌ Error en validador para ${key}:`, error);
            }
        });
    }
    
    /**
     * Utility methods
     */
    deepEqual(a, b) {
        if (a === b) return true;
        
        if (a == null || b == null) return false;
        
        if (typeof a !== typeof b) return false;
        
        if (typeof a !== 'object') return a === b;
        
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (let key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!this.deepEqual(a[key], b[key])) return false;
        }
        
        return true;
    }
    
    /**
     * Debug utilities
     */
    getDebugInfo() {
        return {
            stateKeys: Object.keys(this.state),
            subscriberKeys: Object.keys(this.subscribers),
            historySize: this.history.length,
            sensitiveKeys: Array.from(this.sensitiveKeys),
            persistedKeys: Array.from(this.persistedKeys)
        };
    }
    
    logState() {
        console.table(this.state);
    }
    
    logSubscribers() {
        console.log('📊 Subscribers:', this.subscribers);
    }
    
    /**
     * Destroy state manager
     */
    destroy() {
        // Clear all subscribers
        this.subscribers = {};
        
        // Clear state
        this.state = {};
        
        // Clear history
        this.history = [];
        
        console.log('🗑️ StateManager destruido');
    }
}

// Export the StateManager
export { StateManager };