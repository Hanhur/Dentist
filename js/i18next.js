import { translations } from "./translations.js";

function applyTranslations(lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key] !== undefined) {
            el.innerHTML = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[lang] && translations[lang][key] !== undefined) {
            el.placeholder = translations[lang][key];
        }
    });

    document.querySelectorAll('select[data-i18n-select]').forEach(select => {
        const savedValue = select.value;
        if (savedValue) {
            requestAnimationFrame(() => { select.value = savedValue; });
        }
    });

    localStorage.setItem('lang', lang);
}

const savedLang = localStorage.getItem('lang') || 'cs';
applyTranslations(savedLang);

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('langSelect');
    if (select) {
        select.value = savedLang;
        select.addEventListener('change', event => applyTranslations(event.target.value));
    }

    document.querySelectorAll('.form-select-wrapper').forEach(wrapper => {
        const select = wrapper.querySelector('.form-select');
        const icon = wrapper.querySelector('.form-img');
        if (!select || !icon) return;

        icon.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (typeof select.showPicker === 'function') {
                try {
                    select.showPicker();
                } catch (err) {
                    select.focus();
                    select.click();
                }
            } else {
                select.focus();
                select.click();
            }
        });

        select.addEventListener('mousedown', () => {
            wrapper.classList.add('is-open');
        });

        select.addEventListener('focus', () => {
            wrapper.classList.add('is-open');
        });

        select.addEventListener('blur', () => {
            wrapper.classList.remove('is-open');
        });

        select.addEventListener('change', () => {
            wrapper.classList.remove('is-open');
        });
    });
});