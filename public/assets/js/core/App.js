/**
 * ==========================================
 * CORE APPLICATION - SISTEMA POS
 * Arquitectura MVC + Single Page Application
 * ==========================================
 */

// Import modules (ES6 Modules)
import { Router } from './Router.js';
import { AuthManager } from './Auth.js';
import { APIClient } from './API.js';
import { StateManager } from './StateManager.js';
import { ComponentRegistry } from './ComponentRegistry.js';
import { NotificationSystem } from '../components/Notification.js';

/**
 * Main Application Class
 * Manages the entire POS system lifecycle
 */
class POSApp {
    constructor() {
        console.log('🚀 Inicializando Sistema POS - Arquitectura Moderna');
        
        // Core system instances
        this.router = new Router();
        this.auth = new AuthManager();
        this.api = new APIClient();
        this.state = new StateManager();
        this.components = new ComponentRegistry();
        this.notifications = new NotificationSystem();
        
        // App state
        this.isInitialized = false;
        this.currentView = null;
        this.user = null;
        
        // DOM elements
        this.appContainer = null;
        this.loadingScreen = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.handleAuthChange = this.handleAuthChange.bind(this);
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🔧 Configurando aplicación...');
            
            // Setup DOM references
            this.setupDOMReferences();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize core services
            await this.initializeServices();
            
            // Setup routing
            this.setupRouting();
            
            // Check authentication
            await this.checkAuthentication();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Sistema POS inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            this.handleCriticalError(error);
        }
    }
    
    /**
     * Setup DOM references
     */
    setupDOMReferences() {
        this.appContainer = document.getElementById('app');
        this.loadingScreen = document.getElementById('app-loading');
        
        if (!this.appContainer) {
            throw new Error('App container no encontrado');
        }
    }
    
    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Unhandled errors
        window.addEventListener('error', (event) => {
            console.error('🚨 Error no manejado:', event.error);
            this.notifications.error('Error inesperado en la aplicación');
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Promesa rechazada:', event.reason);
            this.notifications.error('Error de conexión o procesamiento');
            event.preventDefault();
        });
    }
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.handlePageVisible();
            }
        });
        
        // Network status changes
        window.addEventListener('online', () => {
            this.notifications.success('Conexión restaurada');
            this.handleNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.notifications.warning('Sin conexión a internet');
            this.handleNetworkStatusChange(false);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyboard(event);
        });
        
        // Before page unload
        window.addEventListener('beforeunload', (event) => {
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro?';
            }
        });
    }
    
    /**
     * Initialize core services
     */
    async initializeServices() {
        console.log('🔧 Inicializando servicios...');
        
        // Initialize API client
        await this.api.init();
        
        // Initialize notification system
        this.notifications.init();
        
        // Initialize component registry
        this.components.init();
        
        // Initialize state manager
        this.state.init();
        
        // Setup state subscriptions
        this.setupStateSubscriptions();
    }
    
    /**
     * Setup state subscriptions
     */
    setupStateSubscriptions() {
        // User state changes
        this.state.subscribe('user', (user) => {
            this.user = user;
            this.handleAuthChange(!!user);
        });
        
        // Network state changes
        this.state.subscribe('networkStatus', (isOnline) => {
            this.handleNetworkStatusChange(isOnline);
        });
        
        // Theme changes
        this.state.subscribe('theme', (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
        });
    }
    
    /**
     * Setup routing system
     */
    setupRouting() {
        console.log('🛣️ Configurando rutas...');
        
        // Public routes
        this.router.addRoute('/', () => this.redirectToLogin());
        this.router.addRoute('/login', () => this.loadView('auth'));
        
        // Protected routes
        this.router.addRoute('/dashboard', () => this.loadProtectedView('dashboard'));
        this.router.addRoute('/pos', () => this.loadProtectedView('pos'));
        this.router.addRoute('/products', () => this.loadProtectedView('products'));
        this.router.addRoute('/categories', () => this.loadProtectedView('categories'));
        this.router.addRoute('/reports', () => this.loadProtectedView('reports'));
        this.router.addRoute('/profile', () => this.loadProtectedView('profile'));
        
        // Admin-only routes
        this.router.addRoute('/users', () => this.loadAdminView('users'));
        this.router.addRoute('/settings', () => this.loadAdminView('settings'));
        
        // 404 route
        this.router.setNotFoundHandler(() => this.handle404());
        
        // Start routing
        this.router.start();
        
        // Listen for route changes
        this.router.on('routeChange', this.handleRouteChange);
    }
    
    /**
     * Check authentication status
     */
    async checkAuthentication() {
        console.log('🔐 Verificando autenticación...');
        
        try {
            const user = await this.auth.getCurrentUser();
            
            if (user) {
                this.state.setState('user', user);
                console.log('✅ Usuario autenticado:', user.full_name);
            } else {
                console.log('ℹ️ Usuario no autenticado');
            }
            
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            await this.auth.logout();
        }
    }
    
    /**
     * Handle route changes
     */
    async handleRouteChange(route, params) {
        console.log('🛣️ Navegando a:', route);
        
        // Update page title
        this.updatePageTitle(route);
        
        // Update active navigation
        this.updateActiveNavigation(route);
        
        // Track navigation (analytics)
        this.trackNavigation(route, params);
    }
    
    /**
     * Handle authentication changes
     */
    handleAuthChange(isAuthenticated) {
        console.log('🔐 Estado de auth cambió:', isAuthenticated);
        
        if (!isAuthenticated) {
            // Clear sensitive data
            this.state.clearSensitiveData();
            
            // Redirect to login if on protected route
            const currentRoute = this.router.getCurrentRoute();
            if (this.isProtectedRoute(currentRoute)) {
                this.router.navigate('/login');
            }
        }
    }
    
    /**
     * Load a view (generic)
     */
    async loadView(viewName, params = {}) {
        try {
            console.log(`📄 Cargando vista: ${viewName}`);
            
            // Show loading if needed
            this.showViewLoading();
            
            // Dynamic import of view
            const ViewClass = await this.importView(viewName);
            
            // Destroy current view
            if (this.currentView) {
                this.currentView.destroy();
            }
            
            // Create and initialize new view
            this.currentView = new ViewClass({
                container: this.appContainer,
                params: params,
                app: this
            });
            
            await this.currentView.init();
            
            // Hide loading
            this.hideViewLoading();
            
            console.log(`✅ Vista cargada: ${viewName}`);
            
        } catch (error) {
            console.error(`❌ Error cargando vista ${viewName}:`, error);
            this.handleViewError(viewName, error);
        }
    }
    
    /**
     * Load protected view (requires authentication)
     */
    async loadProtectedView(viewName, params = {}) {
        if (!this.auth.isAuthenticated()) {
            this.router.navigate('/login');
            return;
        }
        
        await this.loadView(viewName, params);
    }
    
    /**
     * Load admin view (requires admin role)
     */
    async loadAdminView(viewName, params = {}) {
        if (!this.auth.isAuthenticated()) {
            this.router.navigate('/login');
            return;
        }
        
        if (!this.auth.isAdmin()) {
            this.notifications.error('No tienes permisos para acceder a esta sección');
            this.router.navigate('/dashboard');
            return;
        }
        
        await this.loadView(viewName, params);
    }
    
    /**
     * Dynamic view import
     */
    async importView(viewName) {
        const viewMap = {
            'auth': () => import('../views/AuthView.js'),
            'dashboard': () => import('../views/DashboardView.js'),
            'pos': () => import('../views/POSView.js'),
            'products': () => import('../views/ProductsView.js'),
            'categories': () => import('../views/CategoriesView.js'),
            'reports': () => import('../views/ReportsView.js'),
            'profile': () => import('../views/ProfileView.js'),
            'users': () => import('../views/UsersView.js'),
            'settings': () => import('../views/SettingsView.js')
        };
        
        const importFn = viewMap[viewName];
        if (!importFn) {
            throw new Error(`Vista no encontrada: ${viewName}`);
        }
        
        const module = await importFn();
        return module.default;
    }
    
    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeyboard(event) {
        // F8 - Quick sale (only in POS view)
        if (event.key === 'F8' && this.currentView?.name === 'pos') {
            event.preventDefault();
            this.currentView.handleQuickSale();
        }
        
        // Ctrl+/ - Show help
        if (event.ctrlKey && event.key === '/') {
            event.preventDefault();
            this.showHelp();
        }
        
        // Escape - Close modals
        if (event.key === 'Escape') {
            this.closeActiveModals();
        }
    }
    
    /**
     * Utility methods
     */
    redirectToLogin() {
        this.router.navigate('/login');
    }
    
    isProtectedRoute(route) {
        const protectedRoutes = ['/dashboard', '/pos', '/products', '/categories', '/reports', '/profile', '/users', '/settings'];
        return protectedRoutes.some(protected => route.startsWith(protected));
    }
    
    updatePageTitle(route) {
        const titles = {
            '/': 'Sistema POS',
            '/login': 'Iniciar Sesión - Sistema POS',
            '/dashboard': 'Dashboard - Sistema POS',
            '/pos': 'Punto de Venta - Sistema POS',
            '/products': 'Productos - Sistema POS',
            '/categories': 'Categorías - Sistema POS',
            '/reports': 'Reportes - Sistema POS',
            '/profile': 'Mi Perfil - Sistema POS',
            '/users': 'Usuarios - Sistema POS',
            '/settings': 'Configuración - Sistema POS'
        };
        
        document.title = titles[route] || 'Sistema POS';
    }
    
    updateActiveNavigation(route) {
        // Update active nav items if sidebar exists
        const navItems = document.querySelectorAll('[data-nav-item]');
        navItems.forEach(item => {
            const itemRoute = item.getAttribute('data-nav-item');
            item.classList.toggle('active', route === itemRoute);
        });
    }
    
    trackNavigation(route, params) {
        // Analytics tracking would go here
        console.log('📊 Navigation tracked:', { route, params, timestamp: new Date() });
    }
    
    showViewLoading() {
        // Show loading indicator
        const loader = document.createElement('div');
        loader.className = 'view-loading';
        loader.innerHTML = '<div class="spinner"></div><p>Cargando...</p>';
        loader.id = 'view-loading';
        this.appContainer.appendChild(loader);
    }
    
    hideViewLoading() {
        const loader = document.getElementById('view-loading');
        if (loader) {
            loader.remove();
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 300);
        }
    }
    
    handlePageVisible() {
        // Refresh data when page becomes visible
        if (this.currentView && this.currentView.onPageVisible) {
            this.currentView.onPageVisible();
        }
    }
    
    handleNetworkStatusChange(isOnline) {
        this.state.setState('networkStatus', isOnline);
        
        if (isOnline && this.currentView && this.currentView.onNetworkRestore) {
            this.currentView.onNetworkRestore();
        }
    }
    
    hasUnsavedChanges() {
        return this.currentView && this.currentView.hasUnsavedChanges && this.currentView.hasUnsavedChanges();
    }
    
    handle404() {
        this.notifications.error('Página no encontrada');
        this.router.navigate('/dashboard');
    }
    
    handleViewError(viewName, error) {
        console.error(`Vista ${viewName} falló:`, error);
        this.notifications.error(`Error cargando ${viewName}`);
        
        // Fallback to dashboard
        if (viewName !== 'dashboard') {
            this.router.navigate('/dashboard');
        }
    }
    
    handleCriticalError(error) {
        console.error('🚨 Error crítico:', error);
        
        // Show critical error message
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; font-family: system-ui, sans-serif;">
                <h1 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Error del Sistema</h1>
                <p style="color: #6b7280; margin-bottom: 2rem;">Ha ocurrido un error crítico. Por favor, recarga la página.</p>
                <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;">
                    🔄 Recargar Página
                </button>
            </div>
        `;
    }
    
    showHelp() {
        this.notifications.info('Atajos: F8 (Venta rápida), Ctrl+/ (Ayuda), Esc (Cerrar)');
    }
    
    closeActiveModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            if (modal.hide) {
                modal.hide();
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.posApp = new POSApp();
    window.posApp.init();
});

// Export for module usage
export { POSApp };