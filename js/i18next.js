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
});