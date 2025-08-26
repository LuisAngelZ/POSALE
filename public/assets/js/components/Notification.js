/**
 * ==========================================
 * NOTIFICATION SYSTEM
 * Sistema de notificaciones toast modernas
 * ==========================================
 */

/**
 * NotificationSystem - Maneja todas las notificaciones del sistema
 */
class NotificationSystem {
    constructor(options = {}) {
        this.container = null;
        this.notifications = new Map();
        this.queue = [];
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        
        // Options
        this.options = {
            position: 'top-right', // top-right, top-left, bottom-right, bottom-left
            maxVisible: 5,
            defaultDuration: 4000,
            animationDuration: 300,
            ...options
        };
        
        // Sound enabled
        this.soundEnabled = true;
        
        console.log('🔔 NotificationSystem creado');
    }
    
    /**
     * Initialize notification system
     */
    init() {
        this.createContainer();
        this.setupKeyboardShortcuts();
        
        console.log('🔔 NotificationSystem inicializado');
    }
    
    /**
     * Create notification container
     */
    createContainer() {
        // Check if container already exists
        this.container = document.getElementById('notifications');
        
        if (!this.container) {
            this.container = this.createElement('div', {
                id: 'notifications',
                class: `notifications-container position-${this.options.position}`,
                role: 'region',
                'aria-label': 'Notificaciones',
                'aria-live': 'polite'
            });
            
            document.body.appendChild(this.container);
        }
        
        // Apply positioning classes
        this.container.className = `notifications-container position-${this.options.position}`;
    }
    
    /**
     * Show notification
     */
    show(message, type = 'info', options = {}) {
        const config = {
            id: this.generateId(),
            message,
            type,
            duration: options.duration !== undefined ? options.duration : this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || [],
            icon: options.icon || this.getDefaultIcon(type),
            timestamp: new Date().toISOString(),
            ...options
        };
        
        // Create notification element
        const notification = this.createNotification(config);
        
        // Store reference
        this.notifications.set(config.id, {
            element: notification,
            config,
            timer: null
        });
        
        // Add to container with animation
        this.addToContainer(notification, config);
        
        // Auto-hide if not persistent
        if (!config.persistent && config.duration > 0) {
            this.scheduleAutoHide(config.id, config.duration);
        }
        
        // Play sound
        if (this.soundEnabled) {
            this.playNotificationSound(type);
        }
        
        // Maintain max visible limit
        this.enforceMaxVisible();
        
        console.log(`🔔 Notificación mostrada: ${type} - ${message}`);
        
        return config.id;
    }
    
    /**
     * Create notification element
     */
    createNotification(config) {
        const notification = this.createElement('div', {
            class: `notification notification-${config.type}`,
            role: 'alert',
            'aria-live': config.type === 'error' ? 'assertive' : 'polite',
            'data-notification-id': config.id
        });
        
        // Build content
        const content = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon">${config.icon}</span>
                    <div class="notification-message">${config.message}</div>
                    <button class="notification-close" aria-label="Cerrar notificación" type="button">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                ${config.actions.length > 0 ? this.createActionsHTML(config.actions) : ''}
                ${config.duration > 0 && !config.persistent ? this.createProgressBarHTML(config.duration) : ''}
            </div>
        `;
        
        notification.innerHTML = content;
        
        // Add event listeners
        this.attachEventListeners(notification, config);
        
        return notification;
    }
    
    /**
     * Create actions HTML
     */
    createActionsHTML(actions) {
        const actionsHTML = actions.map(action => `
            <button class="notification-action btn btn-sm btn-${action.type || 'secondary'}" 
                    data-action="${action.id}">
                ${action.label}
            </button>
        `).join('');
        
        return `<div class="notification-actions">${actionsHTML}</div>`;
    }
    
    /**
     * Create progress bar HTML
     */
    createProgressBarHTML(duration) {
        return `
            <div class="notification-progress">
                <div class="notification-progress-bar" style="animation-duration: ${duration}ms"></div>
            </div>
        `;
    }
    
    /**
     * Attach event listeners to notification
     */
    attachEventListeners(notification, config) {
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide(config.id);
            });
        }
        
        // Action buttons
        const actionBtns = notification.querySelectorAll('.notification-action');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = btn.getAttribute('data-action');
                const action = config.actions.find(a => a.id === actionId);
                
                if (action && action.handler) {
                    action.handler(e, config.id);
                }
                
                // Auto-hide after action unless specified otherwise
                if (!action.keepOpen) {
                    this.hide(config.id);
                }
            });
        });
        
        // Pause auto-hide on hover
        if (config.duration > 0 && !config.persistent) {
            notification.addEventListener('mouseenter', () => {
                this.pauseAutoHide(config.id);
            });
            
            notification.addEventListener('mouseleave', () => {
                this.resumeAutoHide(config.id);
            });
        }
    }
    
    /**
     * Add notification to container with animation
     */
    addToContainer(notification, config) {
        // Set initial state
        notification.style.transform = this.getInitialTransform();
        notification.style.opacity = '0';
        
        // Add to container
        if (this.options.position.includes('top')) {
            this.container.appendChild(notification);
        } else {
            this.container.insertBefore(notification, this.container.firstChild);
        }
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
            notification.classList.add('notification-show');
        });
    }
    
    /**
     * Get initial transform based on position
     */
    getInitialTransform() {
        if (this.options.position.includes('right')) {
            return 'translateX(100%)';
        } else if (this.options.position.includes('left')) {
            return 'translateX(-100%)';
        }
        return 'translateY(-100%)';
    }
    
    /**
     * Hide notification
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Clear auto-hide timer
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        
        // Animate out
        const element = notification.element;
        element.style.transform = this.getExitTransform();
        element.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            if (this.container.contains(element)) {
                this.container.removeChild(element);
            }
            this.notifications.delete(id);
        }, this.options.animationDuration);
        
        console.log(`🔔 Notificación ocultada: ${id}`);
    }
    
    /**
     * Get exit transform
     */
    getExitTransform() {
        if (this.options.position.includes('right')) {
            return 'translateX(100%)';
        } else if (this.options.position.includes('left')) {
            return 'translateX(-100%)';
        }
        return 'translateY(-100%)';
    }
    
    /**
     * Schedule auto-hide
     */
    scheduleAutoHide(id, duration) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.timer = setTimeout(() => {
            this.hide(id);
        }, duration);
    }
    
    /**
     * Pause auto-hide
     */
    pauseAutoHide(id) {
        const notification = this.notifications.get(id);
        if (!notification || !notification.timer) return;
        
        clearTimeout(notification.timer);
        notification.timer = null;
        
        // Pause progress bar animation
        const progressBar = notification.element.querySelector('.notification-progress-bar');
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
        }
    }
    
    /**
     * Resume auto-hide
     */
    resumeAutoHide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Calculate remaining time (simplified - could be more accurate)
        const remainingTime = notification.config.duration * 0.3; // Approximate
        
        this.scheduleAutoHide(id, remainingTime);
        
        // Resume progress bar animation
        const progressBar = notification.element.querySelector('.notification-progress-bar');
        if (progressBar) {
            progressBar.style.animationPlayState = 'running';
        }
    }
    
    /**
     * Enforce maximum visible notifications
     */
    enforceMaxVisible() {
        const visibleNotifications = Array.from(this.notifications.values());
        
        if (visibleNotifications.length > this.options.maxVisible) {
            const oldestId = visibleNotifications[0].config.id;
            this.hide(oldestId);
        }
    }
    
    /**
     * Convenience methods
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }
    
    error(message, options = {}) {
        return this.show(message, 'error', {
            duration: 6000, // Errors stay longer
            ...options
        });
    }
    
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }
    
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
    
    /**
     * Specialized notification types
     */
    loading(message, options = {}) {
        return this.show(message, 'loading', {
            persistent: true,
            icon: '<div class="loading-spinner"></div>',
            ...options
        });
    }
    
    confirm(message, options = {}) {
        return this.show(message, 'confirm', {
            persistent: true,
            actions: [
                {
                    id: 'cancel',
                    label: 'Cancelar',
                    type: 'secondary',
                    handler: options.onCancel || (() => {})
                },
                {
                    id: 'confirm',
                    label: options.confirmLabel || 'Confirmar',
                    type: 'primary',
                    handler: options.onConfirm || (() => {})
                }
            ],
            ...options
        });
    }
    
    /**
     * Clear all notifications
     */
    clear() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
        
        console.log('🧹 Todas las notificaciones limpiadas');
    }
    
    /**
     * Get default icon for notification type
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '<div class="loading-spinner"></div>',
            confirm: '❓'
        };
        
        return icons[type] || icons.info;
    }
    
    /**
     * Play notification sound
     */
    playNotificationSound(type) {
        // Only for important notifications to avoid spam
        if (['error', 'success'].includes(type) && this.soundEnabled) {
            try {
                // Use Web Audio API if available
                if (window.AudioContext || window.webkitAudioContext) {
                    this.playBeep(type === 'error' ? 800 : 1000);
                }
            } catch (error) {
                // Silently fail - sound is not critical
            }
        }
    }
    
    /**
     * Generate beep sound
     */
    playBeep(frequency = 1000, duration = 200) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            // Silently fail
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape to clear all notifications
            if (e.key === 'Escape' && e.ctrlKey) {
                this.clear();
            }
            
            // Alt+N to toggle sound
            if (e.key === 'n' && e.altKey) {
                e.preventDefault();
                this.toggleSound();
            }
        });
    }
    
    /**
     * Toggle notification sound
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.show(
            `Sonido de notificaciones ${this.soundEnabled ? 'activado' : 'desactivado'}`,
            'info',
            { duration: 2000 }
        );
    }
    
    /**
     * Utility methods
     */
    generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'class') {
                element.className = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        return element;
    }
    
    /**
     * Get notification count
     */
    getCount() {
        return this.notifications.size;
    }
    
    /**
     * Get active notifications
     */
    getActive() {
        return Array.from(this.notifications.values()).map(n => ({
            id: n.config.id,
            type: n.config.type,
            message: n.config.message,
            timestamp: n.config.timestamp
        }));
    }
    
    /**
     * Set position
     */
    setPosition(position) {
        this.options.position = position;
        if (this.container) {
            this.container.className = `notifications-container position-${position}`;
        }
    }
    
    /**
     * Destroy notification system
     */
    destroy() {
        // Clear all notifications
        this.clear();
        
        // Remove container
        if (this.container && document.body.contains(this.container)) {
            document.body.removeChild(this.container);
        }
        
        // Clear references
        this.notifications.clear();
        this.container = null;
        
        console.log('🗑️ NotificationSystem destruido');
    }
    
    /**
     * Debug information
     */
    getDebugInfo() {
        return {
            activeCount: this.notifications.size,
            maxVisible: this.options.maxVisible,
            position: this.options.position,
            soundEnabled: this.soundEnabled,
            activeNotifications: this.getActive()
        };
    }
}

// Export the NotificationSystem
export { NotificationSystem };