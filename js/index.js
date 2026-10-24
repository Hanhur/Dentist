import { botTranslations } from './bot-translations.js';

(function () {
    const form = document.getElementById('chatBotForm');
    const statusEl = document.getElementById('cb-status');

    // ==== НАСТРОЙКИ ====
    const BOT_TOKEN = '';
    const CHAT_ID = '';
    // ===================

    // Получаем текущий язык сайта (сохраняется в i18next.js)
    const getLang = () => {
        const lang = localStorage.getItem('lang');
        return (lang && botTranslations[lang]) ? lang : 'cs';
    };

    const showStatus = (text, type = 'info') => {
        statusEl.textContent = text;
        statusEl.dataset.type = type;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = Object.fromEntries(new FormData(form).entries());

        // Берём переводы под текущий язык
        const lang = getLang();
        const t = botTranslations[lang];

        const text = [
            t.header,
            '',
            `${t.name} ${escapeHtml(data.name)}`,
            `${t.email} ${escapeHtml(data.email)}`,
            `${t.phone} ${escapeHtml(data.phone)}`,
            `${t.service} ${escapeHtml(data.service)}`,
            '',
            `${t.message}\n${escapeHtml(data.message)}`,
        ].join('\n');

        const btn = form.querySelector('.form-btn');
        btn.disabled = true;
        showStatus(t.sending, 'info');

        try {
            const res = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text,
                        parse_mode: 'HTML',
                    }),
                }
            );

            const json = await res.json();
            if (!json.ok) throw new Error(json.description || 'Ошибка отправки');

            form.reset();
            showStatus(t.success, 'success');
        } catch (err) {
            console.error(err);
            showStatus(t.error, 'error');
        } finally {
            btn.disabled = false;
        }
    });

    function escapeHtml(str = '') {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
})();