/**
 * ==========================================
 * COMPONENT REGISTRY
 * Sistema de registro y gestión de componentes
 * ==========================================
 */

/**
 * ComponentRegistry - Gestiona los componentes reutilizables del sistema
 */
class ComponentRegistry {
    constructor() {
        this.components = new Map();
        this.instances = new Map();
        this.globalComponents = new Set();
        
        console.log('🧩 ComponentRegistry creado');
    }
    
    /**
     * Initialize component registry
     */
    init() {
        console.log('🧩 ComponentRegistry inicializado');
        
        // Register built-in components
        this.registerBuiltInComponents();
        
        // Initialize global components
        this.initializeGlobalComponents();
    }
    
    /**
     * Register a component
     */
    register(name, componentClass, options = {}) {
        if (this.components.has(name)) {
            console.warn(`⚠️ Componente '${name}' ya está registrado, sobrescribiendo...`);
        }
        
        this.components.set(name, {
            class: componentClass,
            options: {
                global: false,
                singleton: false,
                autoInit: false,
                ...options
            }
        });
        
        console.log(`🧩 Componente registrado: ${name}`);
        
        // If global, add to global components set
        if (options.global) {
            this.globalComponents.add(name);
        }
        
        // If auto-init, initialize immediately
        if (options.autoInit) {
            this.initialize(name);
        }
    }
    
    /**
     * Get a component class
     */
    get(name) {
        const component = this.components.get(name);
        return component ? component.class : null;
    }
    
    /**
     * Create component instance
     */
    create(name, options = {}) {
        const component = this.components.get(name);
        
        if (!component) {
            throw new Error(`Componente '${name}' no encontrado`);
        }
        
        // Check if singleton and already exists
        if (component.options.singleton && this.instances.has(name)) {
            return this.instances.get(name);
        }
        
        try {
            // Create instance
            const instance = new component.class(options);
            
            // Store if singleton
            if (component.options.singleton) {
                this.instances.set(name, instance);
            }
            
            console.log(`✅ Instancia de '${name}' creada`);
            return instance;
            
        } catch (error) {
            console.error(`❌ Error creando instancia de '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Initialize component (create and store)
     */
    initialize(name, options = {}) {
        const instance = this.create(name, options);
        
        // Initialize if method exists
        if (instance.init && typeof instance.init === 'function') {
            instance.init();
        }
        
        return instance;
    }
    
    /**
     * Get existing instance
     */
    getInstance(name) {
        return this.instances.get(name);
    }
    
    /**
     * Destroy component instance
     */
    destroy(name) {
        const instance = this.instances.get(name);
        
        if (instance) {
            // Call destroy method if exists
            if (instance.destroy && typeof instance.destroy === 'function') {
                instance.destroy();
            }
            
            this.instances.delete(name);
            console.log(`🗑️ Instancia de '${name}' destruida`);
        }
    }
    
    /**
     * Check if component is registered
     */
    has(name) {
        return this.components.has(name);
    }
    
    /**
     * List all registered components
     */
    list() {
        return Array.from(this.components.keys());
    }
    
    /**
     * Get component info
     */
    getInfo(name) {
        const component = this.components.get(name);
        if (!component) return null;
        
        return {
            name,
            options: component.options,
            hasInstance: this.instances.has(name),
            isGlobal: this.globalComponents.has(name)
        };
    }
    
    /**
     * Register built-in components
     */
    registerBuiltInComponents() {
        // Button component
        this.register('Button', class Button {
            constructor(options = {}) {
                this.element = null;
                this.options = {
                    text: 'Button',
                    type: 'button',
                    variant: 'primary',
                    size: 'md',
                    disabled: false,
                    loading: false,
                    ...options
                };
            }
            
            render(container) {
                this.element = document.createElement('button');
                this.element.className = this.getClasses();
                this.element.textContent = this.options.text;
                this.element.type = this.options.type;
                this.element.disabled = this.options.disabled || this.options.loading;
                
                if (container) {
                    container.appendChild(this.element);
                }
                
                return this.element;
            }
            
            getClasses() {
                const classes = ['btn'];
                classes.push(`btn-${this.options.variant}`);
                classes.push(`btn-${this.options.size}`);
                
                if (this.options.loading) {
                    classes.push('is-loading');
                }
                
                return classes.join(' ');
            }
            
            setText(text) {
                this.options.text = text;
                if (this.element) {
                    this.element.textContent = text;
                }
            }
            
            setLoading(loading) {
                this.options.loading = loading;
                if (this.element) {
                    this.element.disabled = loading || this.options.disabled;
                    this.element.classList.toggle('is-loading', loading);
                }
            }
            
            destroy() {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
                this.element = null;
            }
        });
        
        // Modal component
        this.register('Modal', class Modal {
            constructor(options = {}) {
                this.element = null;
                this.backdrop = null;
                this.isOpen = false;
                this.options = {
                    title: 'Modal',
                    content: '',
                    closable: true,
                    size: 'md',
                    ...options
                };
            }
            
            render() {
                // Create backdrop
                this.backdrop = document.createElement('div');
                this.backdrop.className = 'modal-backdrop';
                
                // Create modal
                this.element = document.createElement('div');
                this.element.className = `modal modal-${this.options.size}`;
                
                // Modal content
                const content = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">${this.options.title}</h3>
                            ${this.options.closable ? '<button class="modal-close" aria-label="Cerrar">&times;</button>' : ''}
                        </div>
                        <div class="modal-body">
                            ${this.options.content}
                        </div>
                    </div>
                `;
                
                this.element.innerHTML = content;
                this.backdrop.appendChild(this.element);
                
                // Event listeners
                if (this.options.closable) {
                    const closeBtn = this.element.querySelector('.modal-close');
                    closeBtn.addEventListener('click', () => this.close());
                    
                    this.backdrop.addEventListener('click', (e) => {
                        if (e.target === this.backdrop) {
                            this.close();
                        }
                    });
                }
                
                return this.element;
            }
            
            open() {
                if (this.isOpen) return;
                
                if (!this.element) {
                    this.render();
                }
                
                document.body.appendChild(this.backdrop);
                
                // Trigger reflow and add show class
                this.backdrop.offsetHeight;
                this.backdrop.classList.add('show');
                
                this.isOpen = true;
                
                // Focus management
                const firstFocusable = this.element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }
            
            close() {
                if (!this.isOpen) return;
                
                this.backdrop.classList.remove('show');
                
                setTimeout(() => {
                    if (document.body.contains(this.backdrop)) {
                        document.body.removeChild(this.backdrop);
                    }
                    this.isOpen = false;
                }, 300);
            }
            
            setContent(content) {
                this.options.content = content;
                if (this.element) {
                    const body = this.element.querySelector('.modal-body');
                    if (body) {
                        body.innerHTML = content;
                    }
                }
            }
            
            destroy() {
                this.close();
                this.element = null;
                this.backdrop = null;
            }
        });
        
        console.log('🧩 Componentes built-in registrados');
    }
    
    /**
     * Initialize global components
     */
    initializeGlobalComponents() {
        this.globalComponents.forEach(name => {
            try {
                this.initialize(name);
                console.log(`🌐 Componente global '${name}' inicializado`);
            } catch (error) {
                console.error(`❌ Error inicializando componente global '${name}':`, error);
            }
        });
    }
    
    /**
     * Auto-discover and register components from DOM
     */
    discoverFromDOM() {
        const components = document.querySelectorAll('[data-component]');
        
        components.forEach(element => {
            const componentName = element.dataset.component;
            const options = element.dataset.options ? JSON.parse(element.dataset.options) : {};
            
            if (this.has(componentName)) {
                try {
                    const instance = this.create(componentName, { ...options, element });
                    if (instance.init) {
                        instance.init();
                    }
                } catch (error) {
                    console.error(`❌ Error auto-inicializando componente '${componentName}':`, error);
                }
            }
        });
    }
    
    /**
     * Destroy all instances
     */
    destroyAll() {
        this.instances.forEach((instance, name) => {
            this.destroy(name);
        });
        
        console.log('🗑️ Todas las instancias destruidas');
    }
    
    /**
     * Debug information
     */
    getDebugInfo() {
        return {
            registeredComponents: this.list(),
            activeInstances: Array.from(this.instances.keys()),
            globalComponents: Array.from(this.globalComponents)
        };
    }
}

// Export the ComponentRegistry
export { ComponentRegistry };