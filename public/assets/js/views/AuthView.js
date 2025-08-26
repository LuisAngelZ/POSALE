/**
 * ==========================================
 * AUTH VIEW - VISTA DE AUTENTICACIÓN
 * Sistema de Login Modular - Arquitectura MVC
 * ==========================================
 */

import { BaseView } from './BaseView.js';

/**
 * AuthView - Vista de autenticación (login/registro)
 */
class AuthView extends BaseView {
    constructor(options) {
        super(options);
        
        this.name = 'auth';
        this.title = 'Iniciar Sesión';
        
        // Form state
        this.isLoading = false;
        this.formData = {
            username: '',
            password: ''
        };
        
        // Validation rules
        this.validationRules = {
            username: {
                required: true,
                minLength: 2,
                message: 'El usuario debe tener al menos 2 caracteres'
            },
            password: {
                required: true,
                minLength: 6,
                message: 'La contraseña debe tener al menos 6 caracteres'
            }
        };
        
        // Elements
        this.elements = {};
        
        // Bind methods
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }
    
    /**
     * Initialize the view
     */
    async init() {
        console.log('🔐 Inicializando AuthView...');
        
        try {
            // Check if already authenticated
            if (this.app.auth.isAuthenticated()) {
                this.app.router.navigate('/dashboard');
                return;
            }
            
            // Render the view
            await this.render();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup visual effects
            this.setupVisualEffects();
            
            // Auto focus username field
            setTimeout(() => {
                if (this.elements.usernameInput) {
                    this.elements.usernameInput.focus();
                }
            }, 100);
            
            console.log('✅ AuthView inicializada');
            
        } catch (error) {
            console.error('❌ Error inicializando AuthView:', error);
            this.showError('Error cargando el formulario de login');
        }
    }
    
    /**
     * Render the view
     */
    async render() {
        this.container.innerHTML = this.getTemplate();
        
        // Cache DOM elements
        this.cacheElements();
        
        // Apply initial styles
        this.applyInitialStyles();
    }
    
    /**
     * Get HTML template
     */
    getTemplate() {
        return `
            <div class="auth-container">
                <!-- Background Elements -->
                <div class="auth-background">
                    <div class="bg-decoration circle-1"></div>
                    <div class="bg-decoration circle-2"></div>
                    <div class="bg-decoration circle-3"></div>
                </div>
                
                <!-- Main Login Card -->
                <div class="auth-card" data-aos="fade-up" data-aos-duration="800">
                    <!-- Header -->
                    <div class="auth-header">
                        <div class="auth-logo">
                            <div class="logo-icon">🏪</div>
                            <div class="logo-text">
                                <h1>Sistema POS</h1>
                                <p>Punto de Venta Moderno</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Login Form -->
                    <form id="loginForm" class="auth-form" novalidate>
                        <div class="form-group" data-aos="fade-right" data-aos-delay="200">
                            <label for="username" class="form-label">
                                <span class="label-icon">👤</span>
                                Usuario
                            </label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username"
                                class="form-input" 
                                placeholder="Ingresa tu usuario"
                                autocomplete="username"
                                required
                                aria-describedby="username-error"
                            >
                            <div id="username-error" class="input-error" role="alert"></div>
                        </div>
                        
                        <div class="form-group" data-aos="fade-right" data-aos-delay="300">
                            <label for="password" class="form-label">
                                <span class="label-icon">🔒</span>
                                Contraseña
                            </label>
                            <div class="password-field">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password"
                                    class="form-input" 
                                    placeholder="Ingresa tu contraseña"
                                    autocomplete="current-password"
                                    required
                                    aria-describedby="password-error"
                                >
                                <button type="button" class="password-toggle" aria-label="Mostrar contraseña">
                                    <span class="toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div id="password-error" class="input-error" role="alert"></div>
                        </div>
                        
                        <!-- Submit Button -->
                        <button 
                            type="submit" 
                            class="btn btn-primary btn-lg btn-block auth-submit-btn"
                            data-aos="fade-up" 
                            data-aos-delay="400"
                            disabled
                        >
                            <span class="btn-text">🚀 Iniciar Sesión</span>
                            <span class="btn-loading">
                                <span class="loading-spinner"></span>
                                Iniciando...
                            </span>
                        </button>
                    </form>
                    
                    <!-- Quick Login Helpers (Development) -->
                    <div class="auth-helpers" data-aos="fade-up" data-aos-delay="500">
                        <div class="helper-title">⚡ Acceso Rápido (Desarrollo):</div>
                        <div class="helper-buttons">
                            <button type="button" class="btn btn-sm btn-outline-primary quick-login" data-user="admin">
                                👑 Admin
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary quick-login" data-user="cajero">
                                💼 Cajero
                            </button>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="auth-footer" data-aos="fade-up" data-aos-delay="600">
                        <p>&copy; 2025 Sistema POS. Todos los derechos reservados.</p>
                        <div class="auth-version">v2.0 - Arquitectura Moderna</div>
                    </div>
                </div>
                
                <!-- Loading Overlay -->
                <div id="authLoadingOverlay" class="auth-loading-overlay">
                    <div class="loading-content">
                        <div class="loading-spinner large"></div>
                        <p>Autenticando...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            form: this.container.querySelector('#loginForm'),
            usernameInput: this.container.querySelector('#username'),
            passwordInput: this.container.querySelector('#password'),
            submitButton: this.container.querySelector('.auth-submit-btn'),
            btnText: this.container.querySelector('.btn-text'),
            btnLoading: this.container.querySelector('.btn-loading'),
            passwordToggle: this.container.querySelector('.password-toggle'),
            quickLoginBtns: this.container.querySelectorAll('.quick-login'),
            loadingOverlay: this.container.querySelector('#authLoadingOverlay'),
            authCard: this.container.querySelector('.auth-card')
        };
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', this.handleSubmit);
        
        // Input changes
        this.elements.usernameInput.addEventListener('input', this.handleInputChange);
        this.elements.passwordInput.addEventListener('input', this.handleInputChange);
        
        // Keyboard events
        this.elements.usernameInput.addEventListener('keypress', this.handleKeyPress);
        this.elements.passwordInput.addEventListener('keypress', this.handleKeyPress);
        
        // Password toggle
        this.elements.passwordToggle.addEventListener('click', this.togglePasswordVisibility.bind(this));
        
        // Quick login buttons (development)
        this.elements.quickLoginBtns.forEach(btn => {
            btn.addEventListener('click', this.handleQuickLogin.bind(this));
        });
        
        // Real-time validation
        this.elements.usernameInput.addEventListener('blur', () => this.validateField('username'));
        this.elements.passwordInput.addEventListener('blur', () => this.validateField('password'));
        
        // Form state updates
        this.elements.form.addEventListener('input', this.updateFormState.bind(this));
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleGlobalKeyboard.bind(this));
    }
    
    /**
     * Setup visual effects
     */
    setupVisualEffects() {
        // Animate background decorations
        this.animateBackgroundElements();
        
        // Setup parallax effect on mouse move
        this.setupParallaxEffect();
        
        // Setup form focus effects
        this.setupFocusEffects();
        
        // Initialize AOS animations if available
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                once: true
            });
        }
    }
    
    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        // Get form data
        const formData = new FormData(this.elements.form);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        
        // Validate form
        if (!this.validateForm({ username, password })) {
            return;
        }
        
        try {
            this.setLoadingState(true);
            
            // Attempt login
            const result = await this.app.auth.login(username, password);
            
            if (result.success) {
                this.showSuccess(`¡Bienvenido, ${result.user.full_name}!`);
                
                // Add success animation
                this.animateSuccess();
                
                // Redirect after animation
                setTimeout(() => {
                    this.app.router.navigate('/dashboard');
                }, 1500);
                
            } else {
                throw new Error(result.message || 'Error de autenticación');
            }
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            this.showError(this.getErrorMessage(error));
            this.animateError();
            
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Handle input changes
     */
    handleInputChange(event) {
        const { name, value } = event.target;
        this.formData[name] = value;
        
        // Clear error state
        this.clearFieldError(name);
        
        // Real-time validation for better UX
        if (value.length > 0) {
            setTimeout(() => this.validateField(name), 300);
        }
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            
            if (event.target === this.elements.usernameInput) {
                this.elements.passwordInput.focus();
            } else if (event.target === this.elements.passwordInput) {
                if (this.isFormValid()) {
                    this.elements.form.dispatchEvent(new Event('submit'));
                }
            }
        }
    }
    
    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeyboard(event) {
        // Admin shortcut: Ctrl + Shift + A
        if (event.ctrlKey && event.shiftKey && event.key === 'A') {
            event.preventDefault();
            this.fillCredentials('admin', '123456');
            this.showInfo('Credenciales admin cargadas');
        }
        
        // Cajero shortcut: Ctrl + Shift + C
        if (event.ctrlKey && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            this.fillCredentials('cajero', '123456');
            this.showInfo('Credenciales cajero cargadas');
        }
        
        // Escape to clear form
        if (event.key === 'Escape') {
            this.clearForm();
        }
    }
    
    /**
     * Handle quick login (development feature)
     */
    handleQuickLogin(event) {
        const userType = event.target.getAttribute('data-user');
        const credentials = {
            'admin': { username: 'admin', password: '123456' },
            'cajero': { username: 'cajero', password: '123456' }
        };
        
        const creds = credentials[userType];
        if (creds) {
            this.fillCredentials(creds.username, creds.password);
            this.showInfo(`Credenciales de ${userType} cargadas`);
        }
    }
    
    /**
     * Validation methods
     */
    validateForm(data) {
        let isValid = true;
        
        // Validate each field
        Object.keys(this.validationRules).forEach(field => {
            if (!this.validateField(field, data[field])) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(fieldName, value = null) {
        const fieldValue = value || this.elements[fieldName + 'Input']?.value || '';
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;
        
        let isValid = true;
        let errorMessage = '';
        
        // Required validation
        if (rules.required && !fieldValue.trim()) {
            isValid = false;
            errorMessage = `${this.getFieldDisplayName(fieldName)} es requerido`;
        }
        
        // Min length validation
        if (isValid && rules.minLength && fieldValue.trim().length < rules.minLength) {
            isValid = false;
            errorMessage = rules.message || `Mínimo ${rules.minLength} caracteres`;
        }
        
        // Custom validation
        if (isValid && rules.validator) {
            const customResult = rules.validator(fieldValue);
            if (customResult !== true) {
                isValid = false;
                errorMessage = customResult;
            }
        }
        
        // Show/hide error
        if (isValid) {
            this.clearFieldError(fieldName);
        } else {
            this.showFieldError(fieldName, errorMessage);
        }
        
        return isValid;
    }
    
    /**
     * Form state management
     */
    updateFormState() {
        const isValid = this.isFormValid();
        this.elements.submitButton.disabled = !isValid;
        
        // Update visual state
        this.elements.submitButton.classList.toggle('btn-disabled', !isValid);
    }
    
    isFormValid() {
        const username = this.elements.usernameInput.value.trim();
        const password = this.elements.passwordInput.value.trim();
        
        return username.length >= 2 && password.length >= 6;
    }
    
    setLoadingState(loading) {
        this.isLoading = loading;
        
        // Update button state
        this.elements.submitButton.disabled = loading;
        this.elements.submitButton.classList.toggle('is-loading', loading);
        
        // Show/hide overlay
        this.elements.loadingOverlay.classList.toggle('show', loading);
        
        // Disable form inputs
        this.elements.usernameInput.disabled = loading;
        this.elements.passwordInput.disabled = loading;
    }
    
    /**
     * Utility methods
     */
    fillCredentials(username, password) {
        this.elements.usernameInput.value = username;
        this.elements.passwordInput.value = password;
        this.updateFormState();
    }
    
    clearForm() {
        this.elements.form.reset();
        this.clearAllErrors();
        this.updateFormState();
        this.elements.usernameInput.focus();
    }
    
    togglePasswordVisibility() {
        const input = this.elements.passwordInput;
        const icon = this.elements.passwordToggle.querySelector('.toggle-icon');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = '🙈';
        } else {
            input.type = 'password';
            icon.textContent = '👁️';
        }
    }
    
    getFieldDisplayName(fieldName) {
        const names = {
            'username': 'Usuario',
            'password': 'Contraseña'
        };
        return names[fieldName] || fieldName;
    }
    
    /**
     * Error handling
     */
    showFieldError(fieldName, message) {
        const errorElement = this.container.querySelector(`#${fieldName}-error`);
        const inputElement = this.elements[fieldName + 'Input'];
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputElement) {
            inputElement.classList.add('error');
            inputElement.setAttribute('aria-invalid', 'true');
        }
    }
    
    clearFieldError(fieldName) {
        const errorElement = this.container.querySelector(`#${fieldName}-error`);
        const inputElement = this.elements[fieldName + 'Input'];
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.classList.remove('error');
            inputElement.removeAttribute('aria-invalid');
        }
    }
    
    clearAllErrors() {
        Object.keys(this.validationRules).forEach(field => {
            this.clearFieldError(field);
        });
    }
    
    getErrorMessage(error) {
        const message = error.message || 'Error de autenticación';
        
        if (message.includes('Credenciales')) {
            return '🔐 Usuario o contraseña incorrectos';
        }
        
        if (message.includes('network') || message.includes('fetch')) {
            return '🌐 Error de conexión con el servidor';
        }
        
        return `⚠️ ${message}`;
    }
    
    /**
     * Visual effects
     */
    animateBackgroundElements() {
        const decorations = this.container.querySelectorAll('.bg-decoration');
        decorations.forEach((decoration, index) => {
            decoration.style.animationDelay = `${index * 0.5}s`;
        });
    }
    
    setupParallaxEffect() {
        this.container.addEventListener('mousemove', (e) => {
            const decorations = this.container.querySelectorAll('.bg-decoration');
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            const mouseX = (clientX / innerWidth) - 0.5;
            const mouseY = (clientY / innerHeight) - 0.5;
            
            decorations.forEach((decoration, index) => {
                const speed = (index + 1) * 10;
                const x = mouseX * speed;
                const y = mouseY * speed;
                
                decoration.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
    
    setupFocusEffects() {
        const inputs = [this.elements.usernameInput, this.elements.passwordInput];
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });
        });
    }
    
    animateSuccess() {
        this.elements.authCard.classList.add('success-animation');
        
        // Create success particles
        this.createSuccessParticles();
    }
    
    animateError() {
        this.elements.authCard.classList.add('error-shake');
        
        setTimeout(() => {
            this.elements.authCard.classList.remove('error-shake');
        }, 600);
    }
    
    createSuccessParticles() {
        // Create animated success particles
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'success-particle';
            particle.textContent = '✨';
            
            const angle = (i / 15) * 2 * Math.PI;
            const velocity = 100 + Math.random() * 50;
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--x', `${x}px`);
            particle.style.setProperty('--y', `${y}px`);
            
            this.elements.authCard.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    /**
     * Apply initial styles
     */
    applyInitialStyles() {
        // Set initial form state
        this.updateFormState();
        
        // Apply theme
        this.container.classList.add('auth-view');
        document.body.classList.add('auth-page');
    }
    
    /**
     * Cleanup
     */
    destroy() {
        console.log('🗑️ Destruyendo AuthView...');
        
        // Remove global event listeners
        document.removeEventListener('keydown', this.handleGlobalKeyboard.bind(this));
        document.body.classList.remove('auth-page');
        
        // Clear timers if any
        // Clear intervals if any
        
        // Call parent destroy
        super.destroy();
    }
    
    /**
     * Notification helpers
     */
    showSuccess(message) {
        this.app.notifications.success(message);
    }
    
    showError(message) {
        this.app.notifications.error(message);
    }
    
    showInfo(message) {
        this.app.notifications.info(message);
    }
}

export default AuthView;