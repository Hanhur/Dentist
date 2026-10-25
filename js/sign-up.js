const form = document.getElementById('registerForm');
const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const terms = document.getElementById('terms');
const strengthBar = document.getElementById('strengthBar');
const successMessage = document.getElementById('successMessage');

function showError(input, errorId, show) {
    const error = document.getElementById(errorId);
    if (show) {
        input.classList.add('error');
        error.classList.add('show');
    } else {
        input.classList.remove('error');
        error.classList.remove('show');
    }
}

// Индикатор надёжности пароля
password.addEventListener('input', () => {
    const val = password.value;
    let strength = 0;
    if (val.length >= 6) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71'];
    const widths = ['25%', '50%', '75%', '100%'];
    if (val.length === 0) {
        strengthBar.style.width = '0';
    } else {
        const idx = Math.min(strength - 1, 3);
        strengthBar.style.width = widths[idx];
        strengthBar.style.background = colors[idx];
    }
});

// Валидация при отправке
form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Имя
    if (username.value.trim().length < 3) {
        showError(username, 'usernameError', true);
        valid = false;
    } else {
        showError(username, 'usernameError', false);
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        showError(email, 'emailError', true);
        valid = false;
    } else {
        showError(email, 'emailError', false);
    }

    // Пароль
    if (password.value.length < 6) {
        showError(password, 'passwordError', true);
        valid = false;
    } else {
        showError(password, 'passwordError', false);
    }

    // Подтверждение пароля
    if (password.value !== confirmPassword.value || confirmPassword.value === '') {
        showError(confirmPassword, 'confirmError', true);
        valid = false;
    } else {
        showError(confirmPassword, 'confirmError', false);
    }

    // Согласие
    if (!terms.checked) {
        document.getElementById('termsError').classList.add('show');
        valid = false;
    } else {
        document.getElementById('termsError').classList.remove('show');
    }

    if (valid) {
        successMessage.style.display = 'block';
        form.reset();
        strengthBar.style.width = '0';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 4000);
    }
});

// Скрытие ошибок при вводе
[username, email, password, confirmPassword].forEach(input => {
    input.addEventListener('input', () => {
        input.classList.remove('error');
        const errorId = input.id + 'Error';
        const el = document.getElementById(errorId);
        if (el) el.classList.remove('show');
    });
});