/**
 * LDAP Admin Web - JavaScript Principal
 * Funcionalidades comunes y utilidades para la interfaz web
 */

// Configuración global
window.LDAPAdmin = {
    config: {
        apiBase: '/api/v1',
        timeout: 30000,
        retryAttempts: 3
    },
    
    // Estado global de la aplicación
    state: {
        user: null,
        isAuthenticated: false,
        currentView: null
    },

    // Utilidades
    utils: {},
    
    // Componentes UI
    ui: {},
    
    // Gestión de API
    api: {},
    
    // Eventos personalizados
    events: {}
};

// =============================================================================
// UTILIDADES GENERALES
// =============================================================================

LDAPAdmin.utils = {
    // Formatear fechas
    formatDate(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
    },

    // Escapar HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Debounce function
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Validar DN LDAP
    isValidDN(dn) {
        if (!dn || typeof dn !== 'string') return false;
        const dnPattern = /^([a-zA-Z]+=.+)(,\s*[a-zA-Z]+=.+)*$/;
        return dnPattern.test(dn) && dn.length <= 500;
    },

    // Validar email
    isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    },

    // Generate UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Copiar al portapapeles
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            LDAPAdmin.ui.showToast('Copiado al portapapeles', 'success');
        } catch (err) {
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            LDAPAdmin.ui.showToast('Copiado al portapapeles', 'success');
        }
    },

    // Formatear bytes
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
};

// =============================================================================
// GESTIÓN DE INTERFAZ DE USUARIO
// =============================================================================

LDAPAdmin.ui = {
    // Mostrar toast/notificación
    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${this.getIconForType(type)} me-2"></i>
                    ${LDAPAdmin.utils.escapeHtml(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.remove();
        }, duration);
        
        // Initialize Bootstrap toast
        new bootstrap.Toast(toast);
    },

    // Crear contenedor de toasts
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    },

    // Obtener icono para tipo de mensaje
    getIconForType(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle',
            danger: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    },

    // Mostrar modal de confirmación
    showConfirmModal(title, message, onConfirm, onCancel = null) {
        const modalId = 'confirmModal-' + LDAPAdmin.utils.generateUUID();
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${LDAPAdmin.utils.escapeHtml(title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${LDAPAdmin.utils.escapeHtml(message)}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="confirmBtn">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById(modalId);
        const confirmBtn = modal.querySelector('#confirmBtn');
        
        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            bootstrap.Modal.getInstance(modal).hide();
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            if (onCancel) onCancel();
            modal.remove();
        });
        
        new bootstrap.Modal(modal).show();
    },

    // Mostrar loading spinner
    showLoading(element, message = 'Cargando...') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;
        
        element.classList.add('loading');
        element.setAttribute('data-original-content', element.innerHTML);
        element.innerHTML = `
            <div class="d-flex align-items-center justify-content-center p-3">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                <span>${message}</span>
            </div>
        `;
    },

    // Ocultar loading spinner
    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;
        
        element.classList.remove('loading');
        const originalContent = element.getAttribute('data-original-content');
        if (originalContent) {
            element.innerHTML = originalContent;
            element.removeAttribute('data-original-content');
        }
    },

    // Validar formulario
    validateForm(form) {
        if (typeof form === 'string') {
            form = document.querySelector(form);
        }
        
        if (!form) return false;
        
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            }
            
            // Validaciones específicas
            if (input.type === 'email' && input.value && !LDAPAdmin.utils.isValidEmail(input.value)) {
                input.classList.add('is-invalid');
                isValid = false;
            }
        });
        
        return isValid;
    },

    // Inicializar tooltips
    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
};

// =============================================================================
// GESTIÓN DE API
// =============================================================================

LDAPAdmin.api = {
    // Realizar petición HTTP
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: LDAPAdmin.config.timeout
        };
        
        // Agregar CSRF token si existe
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            defaultOptions.headers['X-CSRF-Token'] = csrfToken;
        }
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Manejar body para POST/PUT
        if (finalOptions.body && typeof finalOptions.body === 'object') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }
        
        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },

    // Métodos de conveniencia
    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    },

    post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', body: data });
    },

    put(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PUT', body: data });
    },

    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    },

    // Buscar usuarios
    async searchUsers(query = '', limit = 50) {
        const params = new URLSearchParams({ q: query, limit });
        return this.get(`${LDAPAdmin.config.apiBase}/users/search?${params}`);
    },

    // Obtener usuario por DN
    async getUser(dn) {
        return this.get(`${LDAPAdmin.config.apiBase}/users/${encodeURIComponent(dn)}`);
    },

    // Crear usuario
    async createUser(userData) {
        return this.post(`${LDAPAdmin.config.apiBase}/users`, userData);
    },

    // Actualizar usuario
    async updateUser(dn, userData) {
        return this.put(`${LDAPAdmin.config.apiBase}/users/${encodeURIComponent(dn)}`, userData);
    },

    // Eliminar usuario
    async deleteUser(dn) {
        return this.delete(`${LDAPAdmin.config.apiBase}/users/${encodeURIComponent(dn)}`);
    },

    // Obtener estadísticas
    async getStats() {
        return this.get(`${LDAPAdmin.config.apiBase}/stats`);
    }
};

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes de Bootstrap
    LDAPAdmin.ui.initTooltips();
    
    // Configurar CSRF token para todas las peticiones
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
        // Agregar token a formularios existentes
        document.querySelectorAll('form').forEach(form => {
            if (!form.querySelector('input[name="_csrf"]')) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = '_csrf';
                input.value = csrfToken;
                form.appendChild(input);
            }
        });
    }
    
    // Manejar enlaces con confirmación
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-confirm]');
        if (target) {
            e.preventDefault();
            const message = target.getAttribute('data-confirm');
            LDAPAdmin.ui.showConfirmModal(
                'Confirmación',
                message,
                () => {
                    if (target.tagName === 'A') {
                        window.location.href = target.href;
                    } else if (target.type === 'submit') {
                        target.closest('form').submit();
                    }
                }
            );
        }
    });
    
    // Auto-refresh de tokens de sesión
    setInterval(async () => {
        try {
            await LDAPAdmin.api.post('/auth/refresh');
        } catch (error) {
            console.warn('Session refresh failed:', error);
        }
    }, 10 * 60 * 1000); // Cada 10 minutos
    
    // Manejar errores globales
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        LDAPAdmin.ui.showToast('Ha ocurrido un error inesperado', 'error');
    });
    
    // Manejar promesas rechazadas
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        LDAPAdmin.ui.showToast('Error de conexión o servidor', 'error');
    });
    
    // Marcar como inicializado
    LDAPAdmin.initialized = true;
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('ldapAdminReady', {
        detail: { version: '1.0.0' }
    }));
});

// =============================================================================
// EXPORTAR PARA USO GLOBAL
// =============================================================================

// Aliases para facilidad de uso
window.showToast = LDAPAdmin.ui.showToast.bind(LDAPAdmin.ui);
window.showLoading = LDAPAdmin.ui.showLoading.bind(LDAPAdmin.ui);
window.hideLoading = LDAPAdmin.ui.hideLoading.bind(LDAPAdmin.ui);
window.confirmAction = LDAPAdmin.ui.showConfirmModal.bind(LDAPAdmin.ui);