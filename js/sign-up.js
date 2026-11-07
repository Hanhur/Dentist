import { translations } from "./translations.js";

// Получить перевод по ключу с текущим языком
function t(key) {
    const lang = localStorage.getItem('lang') || 'cs';
    return translations[lang]?.[key] ?? key;
}

const form = document.getElementById('registerForm');
const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const terms = document.getElementById('terms');

const usernameError = document.getElementById('usernameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const termsError = document.getElementById('termsError');
const successMessage = document.getElementById('successMessage');
const strengthBar = document.getElementById('strengthBar');

// Валидация полей
function validateUsername() {
    const ok = username.value.trim().length >= 3;
    usernameError.textContent = t('signup.usernameError');
    usernameError.classList.toggle('visible', !ok);
    return ok;
}

function validateEmail() {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    emailError.textContent = t('signup.emailError');
    emailError.classList.toggle('visible', !ok);
    return ok;
}

function validatePassword() {
    const val = password.value;
    const ok = val.length >= 6;

    // индикатор силы
    let strength = 0;
    if (val.length >= 6) strength++;
    if (val.length >= 10) strength++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength++;
    if (/\d/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    strengthBar.style.width = (strength / 5) * 100 + '%';
    strengthBar.style.background =
        strength <= 2 ? '#e74c3c' : strength <= 4 ? '#f39c12' : '#2ecc71';

    passwordError.textContent = t('signup.passwordError');
    passwordError.classList.toggle('visible', !ok);
    return ok;
}

function validateConfirm() {
    const ok = confirmPassword.value === password.value && confirmPassword.value !== '';
    confirmError.textContent = t('signup.confirmError');
    confirmError.classList.toggle('visible', !ok);
    return ok;
}

function validateTerms() {
    const ok = terms.checked;
    termsError.textContent = t('signup.termsError');
    termsError.classList.toggle('visible', !ok);
    return ok;
}

// Живая валидация
username.addEventListener('input', validateUsername);
email.addEventListener('input', validateEmail);
password.addEventListener('input', () => { validatePassword(); validateConfirm(); });
confirmPassword.addEventListener('input', validateConfirm);
terms.addEventListener('change', validateTerms);

// Сабмит
form.addEventListener('submit', (e) => {
    e.preventDefault();
    successMessage.classList.remove('visible');

    const ok =
        validateUsername() &
        validateEmail() &
        validatePassword() &
        validateConfirm() &
        validateTerms();

    if (ok) {
        successMessage.textContent = t('signup.success');
        successMessage.classList.add('visible');
        form.reset();
        strengthBar.style.width = '0';
        // здесь можно отправить данные на сервер
    }
});

// При смене языка — перерисовать активные ошибки
document.getElementById('langSelect')?.addEventListener('change', () => {
    // небольшой таймаут, чтобы applyTranslations из i18next.js успел сработать
    setTimeout(() => {
        if (usernameError.classList.contains('visible')) validateUsername();
        if (emailError.classList.contains('visible')) validateEmail();
        if (passwordError.classList.contains('visible')) validatePassword();
        if (confirmError.classList.contains('visible')) validateConfirm();
        if (termsError.classList.contains('visible')) validateTerms();
        if (successMessage.classList.contains('visible')) {
            successMessage.textContent = t('signup.success');
        }
    }, 0);
});