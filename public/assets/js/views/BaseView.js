/**
 * ==========================================
 * BASE VIEW CLASS
 * Clase base para todas las vistas del sistema
 * ==========================================
 */

/**
 * BaseView - Clase base abstracta para todas las vistas
 */
class BaseView {
    constructor(options = {}) {
        // Core properties
        this.container = options.container;
        this.params = options.params || {};
        this.app = options.app;
        
        // View metadata
        this.name = 'base';
        this.title = 'Base View';
        
        // State management
        this.isInitialized = false;
        this.isDestroyed = false;
        this.state = {};
        
        // Event listeners tracking
        this.eventListeners = [];
        this.timeouts = [];
        this.intervals = [];
        
        // Validation
        if (!this.container) {
            throw new Error('Container es requerido para la vista');
        }
        
        if (!this.app) {
            throw new Error('App instance es requerida para la vista');
        }
        
        // Bind common methods
        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);
        this.addEventListener = this.addEventListener.bind(this);
        this.removeEventListeners = this.removeEventListeners.bind(this);
    }
    
    /**
     * Initialize the view (abstract method)
     * Should be implemented by child classes
     */
    async init() {
        if (this.isInitialized) {
            console.warn(`Vista ${this.name} ya está inicializada`);
            return;
        }
        
        console.log(`🎨 Inicializando vista: ${this.name}`);
        
        try {
            // Set document title
            this.setDocumentTitle();
            
            // Add view class to body
            this.addViewClass();
            
            // Call child implementation
            await this.onInit();
            
            this.isInitialized = true;
            console.log(`✅ Vista ${this.name} inicializada`);
            
        } catch (error) {
            console.error(`❌ Error inicializando vista ${this.name}:`, error);
            throw error;
        }
    }
    
    /**
     * Render the view (abstract method)
     * Should be implemented by child classes
     */
    async render() {
        throw new Error('render() method must be implemented by child class');
    }
    
    /**
     * Destroy the view and cleanup resources
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }
        
        console.log(`🗑️ Destruyendo vista: ${this.name}`);
        
        try {
            // Call child cleanup
            this.onDestroy();
            
            // Remove event listeners
            this.removeEventListeners();
            
            // Clear timeouts
            this.clearTimeouts();
            
            // Clear intervals
            this.clearIntervals();
            
            // Remove view class from body
            this.removeViewClass();
            
            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
            }
            
            // Reset state
            this.state = {};
            this.isInitialized = false;
            this.isDestroyed = true;
            
            console.log(`✅ Vista ${this.name} destruida`);
            
        } catch (error) {
            console.error(`❌ Error destruyendo vista ${this.name}:`, error);
        }
    }
    
    /**
     * Child class lifecycle hooks
     */
    async onInit() {
        // Override in child classes
    }
    
    onDestroy() {
        // Override in child classes
    }
    
    onPageVisible() {
        // Called when page becomes visible
        // Override in child classes
    }
    
    onNetworkRestore() {
        // Called when network is restored
        // Override in child classes
    }
    
    /**
     * State management
     */
    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Trigger state change event
        this.onStateChange(key, value, oldValue);
        
        return this;
    }
    
    getState(key) {
        return key ? this.state[key] : { ...this.state };
    }
    
    onStateChange(key, newValue, oldValue) {
        // Override in child classes to react to state changes
        console.log(`Estado cambiado en ${this.name}:`, { key, newValue, oldValue });
    }
    
    /**
     * Event listener management
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element || !event || !handler) {
            console.warn('addEventListener requires element, event, and handler');
            return;
        }
        
        // Store reference for cleanup
        const listenerInfo = {
            element,
            event,
            handler,
            options
        };
        
        this.eventListeners.push(listenerInfo);
        
        // Add the event listener
        element.addEventListener(event, handler, options);
        
        return listenerInfo;
    }
    
    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('Error removing event listener:', error);
            }
        });
        
        this.eventListeners = [];
    }
    
    /**
     * Timer management
     */
    setTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            // Remove from tracking array
            const index = this.timeouts.indexOf(timeoutId);
            if (index > -1) {
                this.timeouts.splice(index, 1);
            }
            
            callback();
        }, delay);
        
        this.timeouts.push(timeoutId);
        return timeoutId;
    }
    
    setInterval(callback, interval) {
        const intervalId = setInterval(callback, interval);
        this.intervals.push(intervalId);
        return intervalId;
    }
    
    clearTimeouts() {
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
    }
    
    clearIntervals() {
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
    }
    
    /**
     * DOM utilities
     */
    $(selector, context = this.container) {
        return context.querySelector(selector);
    }
    
    $$(selector, context = this.container) {
        return Array.from(context.querySelectorAll(selector));
    }
    
    createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'class') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    }
    
    /**
     * View management utilities
     */
    setDocumentTitle() {
        if (this.title) {
            document.title = `${this.title} - Sistema POS`;
        }
    }
    
    addViewClass() {
        if (this.name) {
            document.body.classList.add(`view-${this.name}`);
        }
    }
    
    removeViewClass() {
        if (this.name) {
            document.body.classList.remove(`view-${this.name}`);
        }
    }
    
    /**
     * Loading states
     */
    showLoading(message = 'Cargando...') {
        this.hideLoading(); // Remove any existing loading
        
        const loadingEl = this.createElement('div', {
            class: 'view-loading-overlay',
            dataset: { viewLoading: 'true' }
        });
        
        loadingEl.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        
        this.container.appendChild(loadingEl);
        
        // Auto-hide after 10 seconds to prevent infinite loading
        this.setTimeout(() => {
            this.hideLoading();
        }, 10000);
    }
    
    hideLoading() {
        const loadingEl = this.container.querySelector('[data-view-loading="true"]');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
    
    /**
     * Error handling
     */
    showError(message, details = null) {
        console.error(`Error en vista ${this.name}:`, message, details);
        
        // Show error notification
        if (this.app && this.app.notifications) {
            this.app.notifications.error(message);
        } else {
            // Fallback error display
            alert(`Error: ${message}`);
        }
    }
    
    showSuccess(message) {
        if (this.app && this.app.notifications) {
            this.app.notifications.success(message);
        }
    }
    
    showInfo(message) {
        if (this.app && this.app.notifications) {
            this.app.notifications.info(message);
        }
    }
    
    showWarning(message) {
        if (this.app && this.app.notifications) {
            this.app.notifications.warning(message);
        }
    }
    
    /**
     * API utilities
     */
    async apiCall(url, options = {}) {
        if (!this.app.api) {
            throw new Error('API client no disponible');
        }
        
        try {
            this.showLoading('Cargando datos...');
            const response = await this.app.api.request(url, options);
            this.hideLoading();
            return response;
            
        } catch (error) {
            this.hideLoading();
            this.showError('Error conectando con el servidor');
            throw error;
        }
    }
    
    /**
     * Form utilities
     */
    getFormData(formElement) {
        if (!formElement) return {};
        
        const formData = new FormData(formElement);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            // Handle multiple values (checkboxes, multi-select)
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    validateForm(formElement, rules = {}) {
        if (!formElement) return false;
        
        let isValid = true;
        const data = this.getFormData(formElement);
        
        Object.entries(rules).forEach(([field, fieldRules]) => {
            const value = data[field];
            const fieldElement = formElement.querySelector(`[name="${field}"]`);
            
            if (!this.validateField(field, value, fieldRules, fieldElement)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(fieldName, value, rules, fieldElement = null) {
        let isValid = true;
        let errorMessage = '';
        
        // Required validation
        if (rules.required && (!value || !value.toString().trim())) {
            isValid = false;
            errorMessage = `${rules.label || fieldName} es requerido`;
        }
        
        // Min length validation
        if (isValid && rules.minLength && value && value.length < rules.minLength) {
            isValid = false;
            errorMessage = `Mínimo ${rules.minLength} caracteres`;
        }
        
        // Max length validation
        if (isValid && rules.maxLength && value && value.length > rules.maxLength) {
            isValid = false;
            errorMessage = `Máximo ${rules.maxLength} caracteres`;
        }
        
        // Pattern validation
        if (isValid && rules.pattern && value && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.patternMessage || 'Formato inválido';
        }
        
        // Custom validation
        if (isValid && rules.validator && typeof rules.validator === 'function') {
            const customResult = rules.validator(value);
            if (customResult !== true) {
                isValid = false;
                errorMessage = customResult;
            }
        }
        
        // Show/hide error on field
        if (fieldElement) {
            this.setFieldError(fieldElement, isValid ? null : errorMessage);
        }
        
        return isValid;
    }
    
    setFieldError(fieldElement, errorMessage) {
        const errorId = `${fieldElement.name || fieldElement.id}-error`;
        let errorElement = this.container.querySelector(`#${errorId}`);
        
        if (errorMessage) {
            // Show error
            if (!errorElement) {
                errorElement = this.createElement('div', {
                    id: errorId,
                    class: 'field-error',
                    role: 'alert'
                });
                fieldElement.parentNode.appendChild(errorElement);
            }
            
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
            fieldElement.classList.add('error');
            fieldElement.setAttribute('aria-invalid', 'true');
            
        } else {
            // Hide error
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            fieldElement.classList.remove('error');
            fieldElement.removeAttribute('aria-invalid');
        }
    }
    
    /**
     * URL utilities
     */
    getCurrentParams() {
        return this.params;
    }
    
    getUrlParam(key, defaultValue = null) {
        return this.params[key] || defaultValue;
    }
    
    /**
     * Storage utilities
     */
    setLocalData(key, value) {
        try {
            const prefixedKey = `${this.name}_${key}`;
            localStorage.setItem(prefixedKey, JSON.stringify(value));
        } catch (error) {
            console.warn('Error guardando en localStorage:', error);
        }
    }
    
    getLocalData(key, defaultValue = null) {
        try {
            const prefixedKey = `${this.name}_${key}`;
            const value = localStorage.getItem(prefixedKey);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.warn('Error leyendo localStorage:', error);
            return defaultValue;
        }
    }
    
    removeLocalData(key) {
        try {
            const prefixedKey = `${this.name}_${key}`;
            localStorage.removeItem(prefixedKey);
        } catch (error) {
            console.warn('Error eliminando de localStorage:', error);
        }
    }
    
    /**
     * Animation utilities
     */
    animate(element, animation, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.animation = `${animation} ${duration}ms ease-in-out`;
            
            const handleAnimationEnd = () => {
                element.style.animation = '';
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
            
            // Fallback timeout
            this.setTimeout(resolve, duration + 100);
        });
    }
    
    fadeIn(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        return new Promise((resolve) => {
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = '1';
            
            this.setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }
    
    fadeOut(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise((resolve) => {
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = '0';
            
            this.setTimeout(() => {
                element.style.display = 'none';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }
    
    /**
     * Accessibility utilities
     */
    setFocus(element, options = {}) {
        if (element) {
            element.focus(options);
            
            // Scroll into view if needed
            if (options.scroll !== false) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    }
    
    announceToScreenReader(message) {
        // Create temporary element for screen reader announcement
        const announcement = this.createElement('div', {
            class: 'sr-only',
            'aria-live': 'polite',
            'aria-atomic': 'true'
        }, message);
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        this.setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }
    
    /**
     * Responsive utilities
     */
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }
    
    isDesktop() {
        return window.innerWidth > 1024;
    }
    
    /**
     * Check if view has unsaved changes
     */
    hasUnsavedChanges() {
        // Override in child classes
        return false;
    }
    
    /**
     * Cleanup helper for child classes
     */
    cleanupChildView() {
        // Override in child classes for specific cleanup
        this.removeEventListeners();
        this.clearTimeouts();
        this.clearIntervals();
    }
    
    /**
     * Debug utilities
     */
    log(...args) {
        console.log(`[${this.name.toUpperCase()}]`, ...args);
    }
    
    warn(...args) {
        console.warn(`[${this.name.toUpperCase()}]`, ...args);
    }
    
    error(...args) {
        console.error(`[${this.name.toUpperCase()}]`, ...args);
    }
    
    /**
     * Utility method to check if view is still active
     */
    isActive() {
        return this.isInitialized && !this.isDestroyed;
    }
    
    /**
     * Get view information
     */
    getViewInfo() {
        return {
            name: this.name,
            title: this.title,
            isInitialized: this.isInitialized,
            isDestroyed: this.isDestroyed,
            params: this.params,
            state: this.state
        };
    }
}

// Export the BaseView class
export { BaseView };