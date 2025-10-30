// Login form functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (!loginForm) return; // Exit if not on login page

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Form submission
    if (loginForm && loginBtn) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Reset validation states
            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            
            // Show loading state
            const btnText = loginBtn.querySelector('.btn-text');
            const btnSpinner = loginBtn.querySelector('.btn-spinner');
            
            if (btnText && btnSpinner) {
                btnText.classList.add('d-none');
                btnSpinner.classList.remove('d-none');
            }
            loginBtn.disabled = true;

            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Submit via fetch
            fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Success - redirect
                    window.location.href = data.redirectUrl || '/dashboard';
                } else {
                    // Error - show message
                    showAlert(data.error || 'Error de autenticación', 'danger');
                    
                    // Show field-specific errors
                    if (data.details && Array.isArray(data.details)) {
                        data.details.forEach(error => {
                            const field = document.querySelector(`[name="${error.path || error.param}"]`);
                            if (field) {
                                field.classList.add('is-invalid');
                                const feedback = field.parentElement.querySelector('.invalid-feedback');
                                if (feedback) {
                                    feedback.textContent = error.msg || error.message;
                                }
                            }
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                showAlert('Error de conexión. Intente nuevamente.', 'danger');
            })
            .finally(() => {
                // Reset loading state
                if (btnText && btnSpinner) {
                    btnText.classList.remove('d-none');
                    btnSpinner.classList.add('d-none');
                }
                loginBtn.disabled = false;
            });
        });
    }

    function showAlert(message, type = 'info') {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.insertBefore(alertDiv, loginForm.firstChild);
        }
    }
});