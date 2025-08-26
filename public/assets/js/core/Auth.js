/**
 * ==========================================
 * AUTHENTICATION MANAGER
 * Sistema de Autenticación para POS
 * ==========================================
 */

/**
 * AuthManager - Maneja toda la lógica de autenticación
 */
class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.refreshTimer = null;
        this.listeners = new Map();
        
        // Storage keys
        this.TOKEN_KEY = 'pos_token';
        this.USER_KEY = 'pos_user';
        this.REFRESH_KEY = 'pos_refresh_token';
        
        // API endpoints
        this.API_BASE = '/api';
        
        // Token refresh settings
        this.TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
        this.TOKEN_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
        
        // Bind methods
        this.refreshToken = this.refreshToken.bind(this);
        this.handleStorageChange = this.handleStorageChange.bind(this);
        
        // Listen for storage changes (multi-tab sync)
        window.addEventListener('storage', this.handleStorageChange);
    }
    
    /**
     * Initialize authentication system
     */
    async init() {
        console.log('🔐 Inicializando sistema de autenticación...');
        
        try {
            // Load stored authentication data
            await this.loadStoredAuth();
            
            // Start token refresh timer if authenticated
            if (this.isAuthenticated()) {
                this.startTokenRefreshTimer();
            }
            
            console.log('✅ Sistema de autenticación inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando auth:', error);
            await this.logout();
        }
    }
    
    /**
     * Load authentication data from storage
     */
    async loadStoredAuth() {
        try {
            const token = localStorage.getItem(this.TOKEN_KEY);
            const userStr = localStorage.getItem(this.USER_KEY);
            
            if (token && userStr) {
                this.token = token;
                this.user = JSON.parse(userStr);
                
                console.log('📱 Datos de auth cargados del storage');
                
                // Verify token is still valid
                const isValid = await this.verifyToken();
                if (!isValid) {
                    await this.logout();
                    return false;
                }
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ Error cargando auth del storage:', error);
            await this.clearStoredAuth();
        }
        
        return false;
    }
    
    /**
     * Login with credentials
     */
    async login(username, password) {
        try {
            console.log('🔐 Iniciando login para:', username);
            
            const response = await fetch(`${this.API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error de autenticación');
            }
            
            const data = await response.json();
            
            if (!data.success || !data.token || !data.user) {
                throw new Error('Respuesta de login inválida');
            }
            
            // Store authentication data
            await this.setAuthentication(data.token, data.user);
            
            console.log('✅ Login exitoso:', this.user.full_name);
            
            // Emit login event
            this.emit('login', this.user);
            
            return {
                success: true,
                user: this.user,
                token: this.token
            };
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    }
    
    /**
     * Logout current user
     */
    async logout() {
        try {
            console.log('🚪 Cerrando sesión...');
            
            // Stop refresh timer
            this.stopTokenRefreshTimer();
            
            // Clear server-side session (optional)
            if (this.token) {
                try {
                    await fetch(`${this.API_BASE}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    // Ignore logout API errors
                    console.warn('⚠️ Error en logout API (ignorado):', error.message);
                }
            }
            
            const wasAuthenticated = this.isAuthenticated();
            const previousUser = this.user;
            
            // Clear authentication data
            await this.clearAuthentication();
            
            console.log('✅ Sesión cerrada');
            
            // Emit logout event
            if (wasAuthenticated) {
                this.emit('logout', previousUser);
            }
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Even if logout fails, clear local data
            await this.clearAuthentication();
        }
    }
    
    /**
     * Set authentication data
     */
    async setAuthentication(token, user) {
        this.token = token;
        this.user = user;
        
        // Store in localStorage
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        
        // Start token refresh timer
        this.startTokenRefreshTimer();
        
        // Emit authentication change
        this.emit('authChange', true, user);
    }
    
    /**
     * Clear authentication data
     */
    async clearAuthentication() {
        this.token = null;
        this.user = null;
        
        // Clear from storage
        await this.clearStoredAuth();
        
        // Stop refresh timer
        this.stopTokenRefreshTimer();
        
        // Emit authentication change
        this.emit('authChange', false, null);
    }
    
    /**
     * Clear stored authentication data
     */
    async clearStoredAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.REFRESH_KEY);
    }
    
    /**
     * Verify current token with server
     */
    async verifyToken() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            
            if (!data.success || !data.user) {
                return false;
            }
            
            // Update user data if it changed
            if (JSON.stringify(this.user) !== JSON.stringify(data.user)) {
                this.user = data.user;
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
                this.emit('userUpdated', data.user);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error verificando token:', error);
            return false;
        }
    }
    
    /**
     * Refresh authentication token
     */
    async refreshToken() {
        if (!this.token) {
            return false;
        }
        
        try {
            console.log('🔄 Refrescando token...');
            
            const response = await fetch(`${this.API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Error refrescando token');
            }
            
            const data = await response.json();
            
            if (data.success && data.token) {
                this.token = data.token;
                localStorage.setItem(this.TOKEN_KEY, data.token);
                
                console.log('✅ Token refrescado');
                this.emit('tokenRefreshed', data.token);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error refrescando token:', error);
            
            // If refresh fails, logout user
            await this.logout();
            return false;
        }
    }
    
    /**
     * Start automatic token refresh
     */
    startTokenRefreshTimer() {
        // Clear existing timer
        this.stopTokenRefreshTimer();
        
        // Set new timer
        this.refreshTimer = setInterval(() => {
            this.refreshToken();
        }, this.TOKEN_REFRESH_INTERVAL);
        
        console.log('⏰ Timer de refresh de token iniciado');
    }
    
    /**
     * Stop automatic token refresh
     */
    stopTokenRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('⏰ Timer de refresh de token detenido');
        }
    }
    
    /**
     * Handle storage changes (multi-tab sync)
     */
    handleStorageChange(event) {
        // Only handle our storage keys
        if (![this.TOKEN_KEY, this.USER_KEY].includes(event.key)) {
            return;
        }
        
        console.log('📱 Cambio detectado en storage:', event.key);
        
        // If token was removed in another tab
        if (event.key === this.TOKEN_KEY && !event.newValue && this.isAuthenticated()) {
            console.log('🔄 Token eliminado en otra pestaña, cerrando sesión');
            this.clearAuthentication();
        }
        
        // If token was added in another tab
        if (event.key === this.TOKEN_KEY && event.newValue && !this.isAuthenticated()) {
            console.log('🔄 Token agregado en otra pestaña, cargando sesión');
            this.loadStoredAuth();
        }
        
        // If user data was updated
        if (event.key === this.USER_KEY && event.newValue) {
            try {
                const newUser = JSON.parse(event.newValue);
                if (JSON.stringify(this.user) !== JSON.stringify(newUser)) {
                    this.user = newUser;
                    this.emit('userUpdated', newUser);
                }
            } catch (error) {
                console.error('❌ Error procesando cambio de usuario:', error);
            }
        }
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }
    
    /**
     * Get current token
     */
    getToken() {
        return this.token;
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!(this.token && this.user);
    }
    
    /**
     * Check if current user is admin
     */
    isAdmin() {
        return this.user?.role === 'admin';
    }
    
    /**
     * Check if current user has specific role
     */
    hasRole(role) {
        return this.user?.role === role;
    }
    
    /**
     * Check if current user has permission
     */
    hasPermission(permission) {
        if (this.isAdmin()) {
            return true; // Admins have all permissions
        }
        
        // Add permission checking logic here
        return this.user?.permissions?.includes(permission) || false;
    }
    
    /**
     * Get user full name
     */
    getUserFullName() {
        return this.user?.full_name || 'Usuario';
    }
    
    /**
     * Get user role display name
     */
    getUserRoleDisplay() {
        const roleMap = {
            'admin': 'Administrador',
            'user': 'Usuario',
            'cashier': 'Cajero',
            'manager': 'Gerente'
        };
        
        return roleMap[this.user?.role] || this.user?.role || 'Usuario';
    }
    
    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        if (!this.isAuthenticated()) {
            throw new Error('No autenticado');
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error actualizando perfil');
            }
            
            const data = await response.json();
            
            if (data.success && data.user) {
                this.user = data.user;
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
                this.emit('userUpdated', data.user);
                
                console.log('✅ Perfil actualizado');
                return data.user;
            }
            
            throw new Error('Respuesta inválida del servidor');
            
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            throw error;
        }
    }
    
    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        if (!this.isAuthenticated()) {
            throw new Error('No autenticado');
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldPassword: currentPassword,
                    newPassword: newPassword
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error cambiando contraseña');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error cambiando contraseña');
            }
            
            console.log('✅ Contraseña cambiada');
            this.emit('passwordChanged');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            throw error;
        }
    }
    
    /**
     * Event system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`❌ Error en listener de auth evento ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Get authentication headers for API calls
     */
    getAuthHeaders() {
        if (!this.token) {
            return {};
        }
        
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }
    
    /**
     * Create authenticated fetch wrapper
     */
    createAuthenticatedFetch() {
        return async (url, options = {}) => {
            const authHeaders = this.getAuthHeaders();
            
            const finalOptions = {
                ...options,
                headers: {
                    ...authHeaders,
                    ...options.headers
                }
            };
            
            const response = await fetch(url, finalOptions);
            
            // Handle 401 unauthorized
            if (response.status === 401) {
                console.warn('⚠️ Token expirado o inválido');
                await this.logout();
                throw new Error('Sesión expirada');
            }
            
            return response;
        };
    }
    
    /**
     * Destroy authentication manager
     */
    destroy() {
        this.stopTokenRefreshTimer();
        window.removeEventListener('storage', this.handleStorageChange);
        this.listeners.clear();
        this.user = null;
        this.token = null;
        
        console.log('🗑️ AuthManager destruido');
    }
}

// Export the AuthManager
export { AuthManager };