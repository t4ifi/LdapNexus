/**
 * LDAP Admin Web - Utilidades JavaScript
 * Funciones adicionales para mejorar la experiencia de usuario
 */

// Utilidades para botones de carga
class ButtonLoader {
    static setLoading(button, text = 'Cargando...') {
        if (typeof button === 'string') {
            button = document.getElementById(button);
        }
        
        if (!button) return;
        
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.classList.add('loading');
        
        // Cambiar texto si se proporciona
        if (text !== button.dataset.originalText) {
            button.innerHTML = `<span class="me-2">${text}</span>`;
        }
    }
    
    static removeLoading(button) {
        if (typeof button === 'string') {
            button = document.getElementById(button);
        }
        
        if (!button) return;
        
        button.disabled = false;
        button.classList.remove('loading');
        
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }
}

// Utilidades para formularios
class FormUtils {
    static serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    static clearForm(form) {
        if (typeof form === 'string') {
            form = document.getElementById(form);
        }
        
        if (!form) return;
        
        // Limpiar campos
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
            
            // Remover clases de validación
            input.classList.remove('is-valid', 'is-invalid');
        });
        
        // Remover mensajes de feedback
        const feedbacks = form.querySelectorAll('.valid-feedback, .invalid-feedback');
        feedbacks.forEach(feedback => feedback.remove());
    }
    
    static resetValidation(form) {
        if (typeof form === 'string') {
            form = document.getElementById(form);
        }
        
        if (!form) return;
        
        const inputs = form.querySelectorAll('.is-valid, .is-invalid');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
        
        const feedbacks = form.querySelectorAll('.valid-feedback, .invalid-feedback');
        feedbacks.forEach(feedback => feedback.remove());
    }
}

// Utilidades para animaciones
class AnimationUtils {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = performance.now();
        
        function animate(currentTime) {
            let elapsed = currentTime - start;
            let progress = elapsed / duration;
            
            if (progress > 1) progress = 1;
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    static fadeOut(element, duration = 300) {
        let start = performance.now();
        let initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(currentTime) {
            let elapsed = currentTime - start;
            let progress = elapsed / duration;
            
            if (progress > 1) progress = 1;
            
            element.style.opacity = initialOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    static slideDown(element, duration = 300) {
        element.style.height = '0px';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        let targetHeight = element.scrollHeight;
        let start = performance.now();
        
        function animate(currentTime) {
            let elapsed = currentTime - start;
            let progress = elapsed / duration;
            
            if (progress > 1) progress = 1;
            
            element.style.height = (targetHeight * progress) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
                element.style.overflow = '';
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// Utilidades para notificaciones
class NotificationUtils {
    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = this.getToastContainer();
        const toastId = 'toast-' + Date.now();
        
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${icons[type] || 'info-circle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: duration
        });
        
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
        
        return toast;
    }
    
    static getToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }
    
    static showAlert(message, type = 'info', container = document.body) {
        const alertId = 'alert-' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const alert = bootstrap.Alert.getInstance(alertElement);
                if (alert) {
                    alert.close();
                }
            }
        }, 5000);
    }
}

// Utilidades para LDAP
class LDAPUtils {
    static formatDN(dn) {
        if (!dn) return 'N/A';
        
        // Dividir el DN en partes y formatear
        const parts = dn.split(',').map(part => part.trim());
        return parts.join(',\n');
    }
    
    static extractUsername(dn) {
        if (!dn) return 'N/A';
        
        const match = dn.match(/^(cn|uid)=([^,]+)/i);
        return match ? match[2] : dn;
    }
    
    static extractOU(dn) {
        if (!dn) return 'N/A';
        
        const match = dn.match(/ou=([^,]+)/i);
        return match ? match[1] : 'N/A';
    }
    
    static formatAttributes(attributes) {
        const formatted = {};
        
        for (const [key, value] of Object.entries(attributes)) {
            if (Array.isArray(value)) {
                formatted[key] = value.join(', ');
            } else {
                formatted[key] = value;
            }
        }
        
        return formatted;
    }
}

// Utilidades para tablas
class TableUtils {
    static addSorting(table) {
        if (typeof table === 'string') {
            table = document.querySelector(table);
        }
        
        if (!table) return;
        
        const headers = table.querySelectorAll('th[data-sortable]');
        
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.innerHTML += ' <i class="fas fa-sort text-muted"></i>';
            
            header.addEventListener('click', () => {
                this.sortTable(table, header);
            });
        });
    }
    
    static sortTable(table, header) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const columnIndex = Array.from(header.parentNode.children).indexOf(header);
        const isAscending = !header.classList.contains('sorted-asc');
        
        // Remover iconos de ordenamiento anteriores
        table.querySelectorAll('th i').forEach(icon => {
            icon.className = 'fas fa-sort text-muted';
        });
        
        // Actualizar icono actual
        const icon = header.querySelector('i');
        icon.className = isAscending ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary';
        
        // Remover clases de ordenamiento anteriores
        table.querySelectorAll('th').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        // Agregar clase actual
        header.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
        
        // Ordenar filas
        rows.sort((a, b) => {
            const aValue = a.children[columnIndex].textContent.trim();
            const bValue = b.children[columnIndex].textContent.trim();
            
            if (isAscending) {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
        
        // Reordenar en el DOM
        rows.forEach(row => tbody.appendChild(row));
    }
    
    static addSearch(table, searchInput) {
        if (typeof table === 'string') {
            table = document.querySelector(table);
        }
        if (typeof searchInput === 'string') {
            searchInput = document.querySelector(searchInput);
        }
        
        if (!table || !searchInput) return;
        
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// Exponer utilidades globalmente
window.ButtonLoader = ButtonLoader;
window.FormUtils = FormUtils;
window.AnimationUtils = AnimationUtils;
window.NotificationUtils = NotificationUtils;
window.LDAPUtils = LDAPUtils;
window.TableUtils = TableUtils;

// Inicialización automática
document.addEventListener('DOMContentLoaded', function() {
    // Auto-agregar sorting a tablas que lo requieran
    const sortableTables = document.querySelectorAll('table[data-sortable]');
    sortableTables.forEach(table => {
        TableUtils.addSorting(table);
    });
    
    // Auto-conectar búsquedas con tablas
    const searchInputs = document.querySelectorAll('input[data-table-search]');
    searchInputs.forEach(input => {
        const tableSelector = input.getAttribute('data-table-search');
        const table = document.querySelector(tableSelector);
        if (table) {
            TableUtils.addSearch(table, input);
        }
    });
});