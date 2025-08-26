/**
 * ==========================================
 * API CLIENT
 * Cliente para todas las llamadas al servidor
 * ==========================================
 */

/**
 * APIClient - Maneja todas las comunicaciones con el backend
 */
class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        
        // Request interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        console.log('🌐 API Client creado');
    }
    
    /**
     * Initialize API client
     */
    async init() {
        console.log('🌐 API Client inicializado');
        
        // Test connectivity
        try {
            await this.get('/test');
            console.log('✅ Conexión con API establecida');
        } catch (error) {
            console.warn('⚠️ No se pudo conectar con la API:', error.message);
        }
    }
    
    /**
     * Main request method
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        // Prepare config
        const config = {
            headers: { ...this.defaultHeaders },
            ...options
        };
        
        // Add auth headers if available
        const authToken = localStorage.getItem('pos_token');
        if (authToken && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }
        
        // Merge headers
        config.headers = { ...config.headers, ...options.headers };
        
        try {
            console.log(`🌐 ${config.method || 'GET'} ${endpoint}`);
            
            // Apply request interceptors
            const finalConfig = await this.applyRequestInterceptors(config);
            
            // Make request
            const response = await fetch(url, finalConfig);
            
            // Handle different response types
            let data;
            const contentType = response.headers.get('Content-Type') || '';
            
            if (contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType.includes('text/')) {
                data = await response.text();
            } else {
                data = await response.blob();
            }
            
            // Check if response is ok
            if (!response.ok) {
                const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = response;
                error.data = data;
                throw error;
            }
            
            // Apply response interceptors
            const finalData = await this.applyResponseInterceptors(data, response);
            
            console.log(`✅ ${config.method || 'GET'} ${endpoint} - Success`);
            return finalData;
            
        } catch (error) {
            console.error(`❌ ${config.method || 'GET'} ${endpoint} - Error:`, error.message);
            
            // Handle specific error cases
            if (error.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('pos_token');
                localStorage.removeItem('pos_user');
                
                // Only redirect if not already on login
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
            
            throw error;
        }
    }
    
    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }
    
    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    /**
     * PATCH request
     */
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * Upload file
     */
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional data
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set content-type for FormData
        });
    }
    
    /**
     * Request interceptors
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }
    
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }
    
    async applyRequestInterceptors(config) {
        let finalConfig = config;
        
        for (const interceptor of this.requestInterceptors) {
            try {
                finalConfig = await interceptor(finalConfig);
            } catch (error) {
                console.error('❌ Error en request interceptor:', error);
            }
        }
        
        return finalConfig;
    }
    
    async applyResponseInterceptors(data, response) {
        let finalData = data;
        
        for (const interceptor of this.responseInterceptors) {
            try {
                finalData = await interceptor(finalData, response);
            } catch (error) {
                console.error('❌ Error en response interceptor:', error);
            }
        }
        
        return finalData;
    }
    
    /**
     * Convenience methods for common API calls
     */
    
    // Auth endpoints
    async login(username, password) {
        return this.post('/auth/login', { username, password });
    }
    
    async logout() {
        return this.post('/auth/logout');
    }
    
    async verifyToken() {
        return this.post('/auth/verify-token');
    }
    
    // Products endpoints
    async getProducts() {
        return this.get('/products');
    }
    
    async createProduct(productData) {
        return this.post('/products', productData);
    }
    
    async updateProduct(id, productData) {
        return this.put(`/products/${id}`, productData);
    }
    
    async deleteProduct(id) {
        return this.delete(`/products/${id}`);
    }
    
    // Categories endpoints
    async getCategories() {
        return this.get('/categories');
    }
    
    async createCategory(categoryData) {
        return this.post('/categories', categoryData);
    }
    
    // Sales endpoints
    async createSale(saleData) {
        return this.post('/sales', saleData);
    }
    
    async getSales(params = {}) {
        return this.get('/sales', params);
    }
    
    async getTodaySales() {
        return this.get('/sales/today');
    }
    
    // Reports endpoints
    async getDashboard() {
        return this.get('/reports/dashboard');
    }
    
    async getDailyReport(date) {
        return this.get('/reports/daily', { date });
    }
    
    // Printer endpoints
    async printTest() {
        return this.post('/printer/test');
    }
    
    async printSale(saleData) {
        return this.post('/printer/print-sale', { sale_data: saleData });
    }
    
    async getPrinterStatus() {
        return this.get('/printer/status');
    }
    
    /**
     * Utility methods
     */
    isOnline() {
        return navigator.onLine;
    }
    
    getBaseURL() {
        return this.baseURL;
    }
    
    setBaseURL(url) {
        this.baseURL = url;
        console.log(`🌐 Base URL actualizada: ${url}`);
    }
    
    /**
     * Error handling helpers
     */
    isNetworkError(error) {
        return error.message.includes('fetch') || error.message.includes('network');
    }
    
    isAuthError(error) {
        return error.status === 401;
    }
    
    isServerError(error) {
        return error.status >= 500;
    }
    
    isClientError(error) {
        return error.status >= 400 && error.status < 500;
    }
}

// Export the APIClient
export { APIClient };