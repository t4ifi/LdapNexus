/**
 * LDAP Admin Web - Validaciones del Cliente
 * Sistema de validación en tiempo real con feedback visual
 */

class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.rules = {};
        this.messages = {};
        this.init();
    }

    init() {
        if (!this.form) return;
        
        // Prevenir envío de formulario inválido
        this.form.addEventListener('submit', (e) => {
            if (!this.validateAll()) {
                e.preventDefault();
                this.showErrorToast('Por favor corrige los errores antes de continuar');
            }
        });

        // Validación en tiempo real
        this.form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });

        this.form.addEventListener('blur', (e) => {
            this.validateField(e.target);
        }, true);
    }

    // Configurar reglas de validación
    addRule(fieldName, rules, message = '') {
        this.rules[fieldName] = rules;
        this.messages[fieldName] = message;
        return this;
    }

    // Validar un campo específico
    validateField(field) {
        const fieldName = field.name;
        if (!fieldName || !this.rules[fieldName]) return true;

        const value = field.value.trim();
        const rules = this.rules[fieldName];
        let isValid = true;
        let errorMessage = '';

        // Verificar cada regla
        for (const rule of rules) {
            if (rule.type === 'required' && !value) {
                isValid = false;
                errorMessage = rule.message || 'Este campo es obligatorio';
                break;
            }

            if (rule.type === 'minLength' && value && value.length < rule.value) {
                isValid = false;
                errorMessage = rule.message || `Mínimo ${rule.value} caracteres`;
                break;
            }

            if (rule.type === 'maxLength' && value && value.length > rule.value) {
                isValid = false;
                errorMessage = rule.message || `Máximo ${rule.value} caracteres`;
                break;
            }

            if (rule.type === 'email' && value && !this.isValidEmail(value)) {
                isValid = false;
                errorMessage = rule.message || 'Email inválido';
                break;
            }

            if (rule.type === 'username' && value && !this.isValidUsername(value)) {
                isValid = false;
                errorMessage = rule.message || 'Usuario debe ser alfanumérico (a-z, 0-9, -, _)';
                break;
            }

            if (rule.type === 'phone' && value && !this.isValidPhone(value)) {
                isValid = false;
                errorMessage = rule.message || 'Número de teléfono inválido';
                break;
            }

            if (rule.type === 'custom' && value && !rule.validator(value)) {
                isValid = false;
                errorMessage = rule.message || 'Valor inválido';
                break;
            }
        }

        this.updateFieldUI(field, isValid, errorMessage);
        return isValid;
    }

    // Validar todos los campos
    validateAll() {
        let allValid = true;
        const fields = this.form.querySelectorAll('[name]');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                allValid = false;
            }
        });

        return allValid;
    }

    // Actualizar interfaz del campo
    updateFieldUI(field, isValid, errorMessage) {
        const fieldGroup = field.closest('.mb-3') || field.closest('.form-group');
        if (!fieldGroup) return;

        // Remover clases anteriores
        field.classList.remove('is-valid', 'is-invalid');
        
        // Remover mensaje anterior
        const oldFeedback = fieldGroup.querySelector('.invalid-feedback, .valid-feedback');
        if (oldFeedback) {
            oldFeedback.remove();
        }

        if (field.value.trim()) {
            if (isValid) {
                field.classList.add('is-valid');
                const feedback = document.createElement('div');
                feedback.className = 'valid-feedback';
                feedback.innerHTML = '<i class="fas fa-check"></i> Válido';
                fieldGroup.appendChild(feedback);
            } else {
                field.classList.add('is-invalid');
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`;
                fieldGroup.appendChild(feedback);
            }
        }
    }

    // Validadores específicos
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        return usernameRegex.test(username) && username.length >= 3;
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    // Mostrar toast de error
    showErrorToast(message) {
        this.showToast(message, 'danger');
    }

    // Mostrar toast de éxito
    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    // Sistema de toast
    showToast(message, type = 'info') {
        // Crear contenedor de toasts si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Crear toast
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Mostrar toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: type === 'danger' ? 5000 : 3000
        });
        
        toast.show();

        // Remover del DOM después de ocultarse
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Clase para modales
class ModalManager {
    constructor() {
        this.createDeleteModal();
        this.createSuccessModal();
        this.createLoadingModal();
    }

    // Modal de confirmación de eliminación
    createDeleteModal() {
        if (document.getElementById('deleteModal')) return;

        const modalHtml = `
            <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Confirmar Eliminación
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <i class="fas fa-user-times fa-3x text-danger mb-3"></i>
                                <h6>¿Estás seguro que deseas eliminar este usuario?</h6>
                                <p class="text-muted mb-0">Esta acción no se puede deshacer</p>
                            </div>
                            <div class="alert alert-light border">
                                <strong>Usuario:</strong> <span id="deleteUserName"></span><br>
                                <strong>Email:</strong> <span id="deleteUserEmail"></span><br>
                                <strong>DN:</strong> <small class="text-muted" id="deleteUserDN"></small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                                <i class="fas fa-trash me-1"></i> Eliminar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Modal de éxito
    createSuccessModal() {
        if (document.getElementById('successModal')) return;

        const modalHtml = `
            <div class="modal fade" id="successModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-body text-center p-4">
                            <div class="mb-3">
                                <i class="fas fa-check-circle fa-4x text-success"></i>
                            </div>
                            <h5 class="modal-title mb-3" id="successTitle">¡Operación Exitosa!</h5>
                            <p class="text-muted mb-4" id="successMessage">La operación se completó correctamente</p>
                            <button type="button" class="btn btn-success" data-bs-dismiss="modal">
                                <i class="fas fa-check me-1"></i> Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Modal de carga
    createLoadingModal() {
        if (document.getElementById('loadingModal')) return;

        const modalHtml = `
            <div class="modal fade" id="loadingModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-body text-center p-4">
                            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                            <h6 class="mb-2" id="loadingTitle">Procesando...</h6>
                            <small class="text-muted" id="loadingMessage">Por favor espera</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Mostrar modal de confirmación de eliminación
    showDeleteConfirmation(userData, onConfirm) {
        document.getElementById('deleteUserName').textContent = userData.cn || userData.name || 'Usuario';
        document.getElementById('deleteUserEmail').textContent = userData.mail || userData.email || 'No especificado';
        document.getElementById('deleteUserDN').textContent = userData.dn || 'No especificado';

        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

        newBtn.addEventListener('click', () => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            onConfirm();
        });

        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    // Mostrar modal de éxito
    showSuccess(title, message) {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMessage').textContent = message;
        
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
    }

    // Mostrar modal de carga
    showLoading(title = 'Procesando...', message = 'Por favor espera') {
        document.getElementById('loadingTitle').textContent = title;
        document.getElementById('loadingMessage').textContent = message;
        
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
        return modal;
    }

    // Ocultar modal de carga
    hideLoading() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) {
            modal.hide();
        }
    }
}

// Utilidades globales
window.FormValidator = FormValidator;
window.ModalManager = ModalManager;

// Instancia global del gestor de modales
window.modalManager = new ModalManager();

// Utilidades para formularios LDAP
window.LDAPValidation = {
    // Validar DN (Distinguished Name)
    isValidDN(dn) {
        const dnRegex = /^([a-zA-Z][a-zA-Z0-9]*=[^,=]+,)*([a-zA-Z][a-zA-Z0-9]*=[^,=]+)$/;
        return dnRegex.test(dn);
    },

    // Validar atributo LDAP
    isValidAttribute(attr) {
        const attrRegex = /^[a-zA-Z][a-zA-Z0-9-]*$/;
        return attrRegex.test(attr);
    },

    // Generar DN desde formulario
    generateUserDN(username, baseDN = 'ou=users,dc=company,dc=local') {
        return `uid=${username},${baseDN}`;
    },

    // Validar formato de grupo
    isValidGroup(group) {
        const groupRegex = /^[a-zA-Z0-9_-]+$/;
        return groupRegex.test(group);
    }
};