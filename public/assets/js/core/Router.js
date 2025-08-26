/**
 * ==========================================
 * SPA ROUTER SYSTEM
 * Single Page Application Router para Sistema POS
 * ==========================================
 */

/**
 * Route definition class
 */
class Route {
    constructor(path, handler, options = {}) {
        this.path = path;
        this.handler = handler;
        this.name = options.name;
        this.middleware = options.middleware || [];
        this.params = {};
        
        // Convert path to regex for parameter matching
        this.regex = this.pathToRegex(path);
        this.paramNames = this.extractParamNames(path);
    }
    
    /**
     * Convert path pattern to regex
     */
    pathToRegex(path) {
        // Replace :param with regex group
        const regexPath = path
            .replace(/:\w+/g, '([^/]+)')
            .replace(/\*/g, '(.*)');
        
        return new RegExp(`^${regexPath}$`);
    }
    
    /**
     * Extract parameter names from path
     */
    extractParamNames(path) {
        const matches = path.match(/:(\w+)/g);
        return matches ? matches.map(match => match.substring(1)) : [];
    }
    
    /**
     * Test if current URL matches this route
     */
    match(pathname) {
        const matches = pathname.match(this.regex);
        
        if (matches) {
            // Extract parameters
            this.params = {};
            this.paramNames.forEach((name, index) => {
                this.params[name] = matches[index + 1];
            });
            
            return true;
        }
        
        return false;
    }
}

/**
 * Main Router class
 */
class Router {
    constructor(options = {}) {
        this.routes = new Map();
        this.middlewares = [];
        this.currentRoute = null;
        this.currentParams = {};
        this.notFoundHandler = null;
        this.errorHandler = null;
        this.listeners = new Map();
        
        // Options
        this.basePath = options.basePath || '';
        this.hashMode = options.hashMode || false;
        this.silent = options.silent || false;
        
        // Bind methods
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        
        // History state
        this.history = [];
        this.historyIndex = -1;
    }
    
    /**
     * Add a route
     */
    addRoute(path, handler, options = {}) {
        const route = new Route(path, handler, options);
        this.routes.set(path, route);
        
        if (!this.silent) {
            console.log(`🛣️ Ruta registrada: ${path}`);
        }
        
        return this;
    }
    
    /**
     * Add middleware
     */
    use(middleware) {
        if (typeof middleware === 'function') {
            this.middlewares.push(middleware);
        } else {
            console.error('Middleware debe ser una función');
        }
        return this;
    }
    
    /**
     * Set 404 handler
     */
    setNotFoundHandler(handler) {
        this.notFoundHandler = handler;
        return this;
    }
    
    /**
     * Set error handler
     */
    setErrorHandler(handler) {
        this.errorHandler = handler;
        return this;
    }
    
    /**
     * Start the router
     */
    start() {
        if (!this.silent) {
            console.log('🚀 Router iniciado');
        }
        
        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', this.handlePopState);
        
        // Listen for link clicks
        document.addEventListener('click', this.handleLinkClick);
        
        // Handle initial route
        this.handleNavigation(this.getCurrentPath());
    }
    
    /**
     * Stop the router
     */
    stop() {
        window.removeEventListener('popstate', this.handlePopState);
        document.removeEventListener('click', this.handleLinkClick);
        
        if (!this.silent) {
            console.log('⏹️ Router detenido');
        }
    }
    
    /**
     * Navigate to a path
     */
    navigate(path, options = {}) {
        const { replace = false, silent = false, state = null } = options;
        
        // Normalize path
        const normalizedPath = this.normalizePath(path);
        
        // Check if it's the same route
        if (normalizedPath === this.getCurrentPath() && !options.force) {
            return;
        }
        
        // Update browser history
        if (replace) {
            window.history.replaceState(state, '', this.getFullPath(normalizedPath));
        } else {
            window.history.pushState(state, '', this.getFullPath(normalizedPath));
        }
        
        // Handle the navigation
        if (!silent) {
            this.handleNavigation(normalizedPath, state);
        }
    }
    
    /**
     * Go back in history
     */
    goBack() {
        if (this.canGoBack()) {
            window.history.back();
        } else {
            this.navigate('/dashboard');
        }
    }
    
    /**
     * Go forward in history
     */
    goForward() {
        if (this.canGoForward()) {
            window.history.forward();
        }
    }
    
    /**
     * Check if can go back
     */
    canGoBack() {
        return window.history.length > 1;
    }
    
    /**
     * Check if can go forward
     */
    canGoForward() {
        // This is limited in browsers, but we can track it
        return this.historyIndex < this.history.length - 1;
    }
    
    /**
     * Reload current route
     */
    reload() {
        this.navigate(this.getCurrentPath(), { force: true });
    }
    
    /**
     * Handle navigation
     */
    async handleNavigation(path, state = null) {
        try {
            if (!this.silent) {
                console.log(`🧭 Navegando a: ${path}`);
            }
            
            // Update history tracking
            this.updateHistoryTracking(path);
            
            // Find matching route
            const matchedRoute = this.findRoute(path);
            
            if (!matchedRoute) {
                await this.handleNotFound(path);
                return;
            }
            
            // Run middlewares
            const middlewareResult = await this.runMiddlewares(path, matchedRoute.params, state);
            if (middlewareResult === false) {
                return; // Middleware blocked navigation
            }
            
            // Run route-specific middleware
            if (matchedRoute.route.middleware.length > 0) {
                const routeMiddlewareResult = await this.runRouteMiddlewares(
                    matchedRoute.route.middleware, 
                    path, 
                    matchedRoute.params, 
                    state
                );
                if (routeMiddlewareResult === false) {
                    return;
                }
            }
            
            // Update current route info
            this.currentRoute = path;
            this.currentParams = matchedRoute.params;
            
            // Execute route handler
            await matchedRoute.route.handler(matchedRoute.params, state);
            
            // Emit route change event
            this.emit('routeChange', path, matchedRoute.params, state);
            
            // Update page metadata
            this.updatePageMetadata(path, matchedRoute.params);
            
        } catch (error) {
            console.error('❌ Error en navegación:', error);
            await this.handleError(error, path);
        }
    }
    
    /**
     * Find route that matches path
     */
    findRoute(path) {
        for (const [routePath, route] of this.routes) {
            if (route.match(path)) {
                return {
                    route: route,
                    params: route.params
                };
            }
        }
        return null;
    }
    
    /**
     * Run global middlewares
     */
    async runMiddlewares(path, params, state) {
        for (const middleware of this.middlewares) {
            try {
                const result = await middleware(path, params, state, this);
                if (result === false) {
                    console.log('🚫 Navegación bloqueada por middleware');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error en middleware:', error);
                return false;
            }
        }
        return true;
    }
    
    /**
     * Run route-specific middlewares
     */
    async runRouteMiddlewares(middlewares, path, params, state) {
        for (const middleware of middlewares) {
            try {
                const result = await middleware(path, params, state, this);
                if (result === false) {
                    console.log('🚫 Navegación bloqueada por middleware de ruta');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error en middleware de ruta:', error);
                return false;
            }
        }
        return true;
    }
    
    /**
     * Handle popstate events (browser navigation)
     */
    handlePopState(event) {
        const path = this.getCurrentPath();
        this.handleNavigation(path, event.state);
    }
    
    /**
     * Handle link clicks for SPA navigation
     */
    handleLinkClick(event) {
        // Check if it's a navigation link
        const link = event.target.closest('a[href]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Skip if external link
        if (this.isExternalLink(href)) return;
        
        // Skip if has target attribute
        if (link.hasAttribute('target')) return;
        
        // Skip if has download attribute
        if (link.hasAttribute('download')) return;
        
        // Skip if modifier keys are pressed
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;
        
        // Skip if right click
        if (event.which === 2 || event.button === 1) return;
        
        // Prevent default and navigate
        event.preventDefault();
        
        const path = this.extractPath(href);
        this.navigate(path);
    }
    
    /**
     * Handle 404 not found
     */
    async handleNotFound(path) {
        console.warn(`⚠️ Ruta no encontrada: ${path}`);
        
        if (this.notFoundHandler) {
            try {
                await this.notFoundHandler(path);
            } catch (error) {
                console.error('❌ Error en handler 404:', error);
            }
        } else {
            // Default 404 behavior
            console.log('Redirigiendo a dashboard por ruta no encontrada');
            this.navigate('/dashboard', { replace: true });
        }
    }
    
    /**
     * Handle errors
     */
    async handleError(error, path) {
        if (this.errorHandler) {
            try {
                await this.errorHandler(error, path);
            } catch (handlerError) {
                console.error('❌ Error en error handler:', handlerError);
            }
        } else {
            // Default error behavior
            console.error('Error no manejado en router:', error);
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
                    console.error(`❌ Error en listener de evento ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Utility methods
     */
    getCurrentPath() {
        if (this.hashMode) {
            return window.location.hash.substring(1) || '/';
        } else {
            return window.location.pathname.substring(this.basePath.length) || '/';
        }
    }
    
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    getCurrentParams() {
        return { ...this.currentParams };
    }
    
    getFullPath(path) {
        if (this.hashMode) {
            return `#${path}`;
        } else {
            return this.basePath + path;
        }
    }
    
    normalizePath(path) {
        // Remove trailing slash except for root
        if (path.length > 1 && path.endsWith('/')) {
            path = path.substring(0, path.length - 1);
        }
        
        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return path;
    }
    
    extractPath(href) {
        if (href.startsWith('#')) {
            return href.substring(1);
        }
        
        // Handle relative and absolute paths
        const url = new URL(href, window.location.origin);
        return url.pathname.substring(this.basePath.length) || '/';
    }
    
    isExternalLink(href) {
        if (href.startsWith('http://') || href.startsWith('https://')) {
            return !href.startsWith(window.location.origin);
        }
        
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('ftp:')) {
            return true;
        }
        
        return false;
    }
    
    updateHistoryTracking(path) {
        // Add to internal history tracking
        if (this.historyIndex < this.history.length - 1) {
            // Remove forward history if we're navigating from middle
            this.history.splice(this.historyIndex + 1);
        }
        
        this.history.push({
            path: path,
            timestamp: Date.now(),
            title: document.title
        });
        
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    updatePageMetadata(path, params) {
        // Update page title, meta tags, etc.
        // This could be extended to handle SEO metadata
        
        // Add route info to body class
        document.body.className = document.body.className
            .replace(/route-[\w-]+/g, '')
            .trim();
        
        const routeClass = 'route-' + path.substring(1).replace(/[\/\:]/g, '-') || 'route-home';
        document.body.classList.add(routeClass);
        
        // Update meta description if needed
        // const metaDesc = document.querySelector('meta[name="description"]');
        // if (metaDesc) {
        //     metaDesc.setAttribute('content', this.getMetaDescription(path));
        // }
    }
    
    /**
     * Get navigation history
     */
    getHistory() {
        return [...this.history];
    }
    
    /**
     * Clear navigation history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
    }
    
    /**
     * Check if route exists
     */
    hasRoute(path) {
        return this.findRoute(path) !== null;
    }
    
    /**
     * Get all registered routes
     */
    getRoutes() {
        return Array.from(this.routes.keys());
    }
    
    /**
     * Generate URL for route with parameters
     */
    generateUrl(routePath, params = {}) {
        let url = routePath;
        
        // Replace parameters
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, encodeURIComponent(value));
        });
        
        return url;
    }
    
    /**
     * Destroy router
     */
    destroy() {
        this.stop();
        this.routes.clear();
        this.middlewares = [];
        this.listeners.clear();
        this.history = [];
        this.historyIndex = -1;
        
        console.log('🗑️ Router destruido');
    }
}

// Export the Router class
export { Router };