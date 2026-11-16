/* Dental booking calendar (patient-facing). Self-contained, no dependencies.
 * Opens from any "Book" button and from the chat widget.
 * Availability: GET /api/booking/availability?date=YYYY-MM-DD
 * Request:      POST /api/booking/request  {name,phone,date,time,service,lang}  (variant Б — no CRM write)
 * Added 2026-11-11.
 */
(function () {
	'use strict';
	if (window.__dentalBookingCalendarLoaded) return;
	window.__dentalBookingCalendarLoaded = true;

	var API_BASE = 'https://granion.org/api/booking';
	var WORKING_ISO_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri (client-side hint; server is authoritative)
	var MAX_AHEAD_DAYS = 60;

	var I18N = {
		cs: {
			title: 'Objednat se', step_date: 'Vyberte datum', step_time: 'Vyberte čas',
			step_form: 'Vaše údaje', name: 'Jméno a příjmení', phone: 'Telefon',
			service: 'Služba (nepovinné)', confirm: 'Odeslat žádost', back: 'Zpět',
			no_slots: 'Na tento den nejsou volné termíny. Zkuste jiný den.',
			closed: 'Zavřeno v tento den.', loading: 'Načítání…', checkup_note: 'Pátek — pouze prohlídky.',
			success_title: 'Žádost odeslána!',
			success_text: 'Děkujeme! Vaši žádost jsme přijali. Klinika vás kontaktuje pro potvrzení termínu.',
			err_name: 'Zadejte prosím jméno.', err_phone: 'Zadejte prosím platné telefonní číslo.',
			err_send: 'Odeslání se nezdařilo. Zkuste to prosím znovu.', close: 'Zavřít', choose_time: '📅 Vybrat čas',
			months: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
			wd: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
		},
		uk: {
			title: 'Записатися', step_date: 'Оберіть дату', step_time: 'Оберіть час',
			step_form: 'Ваші дані', name: "Ім'я та прізвище", phone: 'Телефон',
			service: 'Послуга (необов’язково)', confirm: 'Надіслати заявку', back: 'Назад',
			no_slots: 'На цей день немає вільних місць. Оберіть інший день.',
			closed: 'Цього дня зачинено.', loading: 'Завантаження…', checkup_note: 'П’ятниця — лише огляди.',
			success_title: 'Заявку надіслано!',
			success_text: 'Дякуємо! Ми отримали вашу заявку. Клініка зв’яжеться з вами для підтвердження запису.',
			err_name: 'Будь ласка, вкажіть ім’я.', err_phone: 'Вкажіть, будь ласка, коректний номер телефону.',
			err_send: 'Не вдалося надіслати. Спробуйте ще раз.', close: 'Закрити', choose_time: '📅 Обрати час',
			months: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
			wd: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
		},
		en: {
			title: 'Book an appointment', step_date: 'Choose a date', step_time: 'Choose a time',
			step_form: 'Your details', name: 'Full name', phone: 'Phone',
			service: 'Service (optional)', confirm: 'Send request', back: 'Back',
			no_slots: 'No free slots on this day. Please try another day.',
			closed: 'Closed on this day.', loading: 'Loading…', checkup_note: 'Friday — check-ups only.',
			success_title: 'Request sent!',
			success_text: 'Thank you! We received your request. The clinic will contact you to confirm the appointment.',
			err_name: 'Please enter your name.', err_phone: 'Please enter a valid phone number.',
			err_send: 'Could not send. Please try again.', close: 'Close', choose_time: '📅 Choose a time',
			months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			wd: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
		}
	};

	function lang() { var l = (localStorage.getItem('lang') || 'cs').toLowerCase(); return I18N[l] ? l : 'cs'; }
	function t() { return I18N[lang()]; }

	function pad(n) { return String(n).padStart(2, '0'); }
	function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
	function isoWeekday(d) { var j = d.getDay(); return j === 0 ? 7 : j; }
	function todayLocal() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }

	var state = { viewYear: 0, viewMonth: 0, date: null, time: null };

	function injectStyles() {
		if (document.getElementById('bkc-styles')) return;
		var css = ''
			+ '#bkc-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:99999;display:none;align-items:center;justify-content:center;padding:16px;font-family:inherit}'
			+ '#bkc-overlay.open{display:flex}'
			+ '#bkc-modal{background:#fff;width:100%;max-width:420px;max-height:90vh;overflow:hidden;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);display:flex;flex-direction:column}'
			+ '#bkc-head{background:#2563eb;color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between}'
			+ '#bkc-head h3{margin:0;font-size:17px;font-weight:600}'
			+ '#bkc-close{background:none;border:none;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:0 4px}'
			+ '#bkc-body{padding:16px 18px;overflow-y:auto}'
			+ '.bkc-sub{font-size:13px;color:#64748b;margin:0 0 12px}'
			+ '.bkc-cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}'
			+ '.bkc-cal-nav button{background:#f1f5f9;border:none;border-radius:8px;width:34px;height:34px;font-size:18px;cursor:pointer;color:#2563eb}'
			+ '.bkc-cal-nav span{font-weight:600;font-size:15px;color:#0f172a}'
			+ '.bkc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}'
			+ '.bkc-wd{text-align:center;font-size:11px;color:#94a3b8;padding:4px 0;font-weight:600}'
			+ '.bkc-day{aspect-ratio:1;border:none;background:#f8fafc;border-radius:8px;font-size:14px;cursor:pointer;color:#0f172a;display:flex;align-items:center;justify-content:center}'
			+ '.bkc-day:hover:not(:disabled){background:#dbeafe}'
			+ '.bkc-day:disabled{color:#cbd5e1;cursor:default;background:transparent}'
			+ '.bkc-day.sel{background:#2563eb;color:#fff}'
			+ '.bkc-day.empty{background:transparent;cursor:default}'
			+ '.bkc-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}'
			+ '.bkc-note{background:#eff6ff;color:#1e3a8a;border:1px solid #bfdbfe;border-radius:8px;padding:8px 10px;font-size:13px;margin-bottom:10px;text-align:center}'
			+ '.bkc-slot{padding:10px 6px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;font-size:14px;cursor:pointer;color:#0f172a;text-align:center}'
			+ '.bkc-slot:hover{border-color:#2563eb;background:#eff6ff}'
			+ '.bkc-msg{text-align:center;color:#64748b;font-size:14px;padding:18px 4px}'
			+ '.bkc-field{margin-bottom:12px}'
			+ '.bkc-field label{display:block;font-size:13px;color:#334155;margin-bottom:5px;font-weight:500}'
			+ '.bkc-field input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font-size:15px;outline:none}'
			+ '.bkc-field input:focus{border-color:#2563eb}'
			+ '.bkc-pick{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 12px;font-size:14px;color:#1e40af;margin-bottom:14px}'
			+ '.bkc-err{color:#dc2626;font-size:13px;margin:-6px 0 10px}'
			+ '.bkc-btn{width:100%;background:#2563eb;color:#fff;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:600;cursor:pointer}'
			+ '.bkc-btn:disabled{opacity:.6;cursor:default}'
			+ '.bkc-back{background:none;border:none;color:#2563eb;font-size:14px;cursor:pointer;padding:0;margin-top:12px}'
			+ '.bkc-success{text-align:center;padding:12px 4px}'
			+ '.bkc-success .ic{font-size:46px}'
			+ '.bkc-success h4{margin:10px 0 8px;font-size:18px;color:#0f172a}'
			+ '.bkc-success p{color:#64748b;font-size:14px;margin:0 0 16px}';
		var s = document.createElement('style');
		s.id = 'bkc-styles';
		s.textContent = css;
		document.head.appendChild(s);
	}

	function ensureModal() {
		if (document.getElementById('bkc-overlay')) return;
		var o = document.createElement('div');
		o.id = 'bkc-overlay';
		o.innerHTML = '<div id="bkc-modal" role="dialog" aria-modal="true">'
			+ '<div id="bkc-head"><h3 id="bkc-title"></h3><button id="bkc-close" aria-label="close">&times;</button></div>'
			+ '<div id="bkc-body"></div></div>';
		document.body.appendChild(o);
		o.addEventListener('click', function (e) { if (e.target === o) closeModal(); });
		document.getElementById('bkc-close').addEventListener('click', closeModal);
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
	}

	function closeModal() { var o = document.getElementById('bkc-overlay'); if (o) o.classList.remove('open'); }

	function openModal() {
		injectStyles();
		ensureModal();
		var d = todayLocal();
		state = { viewYear: d.getFullYear(), viewMonth: d.getMonth(), date: null, time: null };
		document.getElementById('bkc-title').textContent = t().title;
		renderDateStep();
		document.getElementById('bkc-overlay').classList.add('open');
	}

	function renderDateStep() {
		var L = t(), body = document.getElementById('bkc-body');
		var today = todayLocal();
		var maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + MAX_AHEAD_DAYS);
		var first = new Date(state.viewYear, state.viewMonth, 1);
		var startPad = (isoWeekday(first) - 1);
		var daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
		var canPrev = !(state.viewYear === today.getFullYear() && state.viewMonth === today.getMonth());

		var html = '<p class="bkc-sub">' + L.step_date + '</p>';
		html += '<div class="bkc-cal-nav"><button id="bkc-prev"' + (canPrev ? '' : ' disabled style="opacity:.3"') + '>&#8249;</button>'
			+ '<span>' + L.months[state.viewMonth] + ' ' + state.viewYear + '</span>'
			+ '<button id="bkc-next">&#8250;</button></div>';
		html += '<div class="bkc-grid">';
		for (var w = 0; w < 7; w++) html += '<div class="bkc-wd">' + L.wd[w] + '</div>';
		for (var p = 0; p < startPad; p++) html += '<div class="bkc-day empty"></div>';
		for (var day = 1; day <= daysInMonth; day++) {
			var dd = new Date(state.viewYear, state.viewMonth, day);
			var disabled = dd < today || dd > maxDate || WORKING_ISO_DAYS.indexOf(isoWeekday(dd)) === -1;
			html += '<button class="bkc-day' + (state.date === ymd(dd) ? ' sel' : '') + '" data-d="' + ymd(dd) + '"'
				+ (disabled ? ' disabled' : '') + '>' + day + '</button>';
		}
		html += '</div>';
		body.innerHTML = html;

		var prev = document.getElementById('bkc-prev'), next = document.getElementById('bkc-next');
		if (prev && canPrev) prev.addEventListener('click', function () { shiftMonth(-1); });
		if (next) next.addEventListener('click', function () {
			var nm = new Date(state.viewYear, state.viewMonth + 1, 1);
			if (nm <= maxDate) shiftMonth(1);
		});
		Array.prototype.forEach.call(body.querySelectorAll('.bkc-day[data-d]:not([disabled])'), function (btn) {
			btn.addEventListener('click', function () { state.date = btn.getAttribute('data-d'); loadSlots(); });
		});
	}

	function shiftMonth(delta) {
		var m = state.viewMonth + delta;
		state.viewYear += Math.floor(m / 12);
		state.viewMonth = ((m % 12) + 12) % 12;
		renderDateStep();
	}

	function loadSlots() {
		var L = t(), body = document.getElementById('bkc-body');
		body.innerHTML = '<p class="bkc-sub">' + L.step_time + '</p><div class="bkc-msg">' + L.loading + '</div>';
		fetch(API_BASE + '/availability?date=' + encodeURIComponent(state.date))
			.then(function (r) { return r.json(); })
			.then(function (d) {
				if (!d || !d.ok) return renderSlots([], false);
				renderSlots(d.slots || [], d.open !== false, !!d.checkup);
			})
			.catch(function () { renderSlots([], true); });
	}

	function renderSlots(slots, open, checkup) {
		var L = t(), body = document.getElementById('bkc-body');
		var html = '<p class="bkc-sub">' + L.step_time + ' — ' + state.date + '</p>';
		if (open && checkup && L.checkup_note) html += '<div class="bkc-note">' + L.checkup_note + '</div>';
		if (!open) html += '<div class="bkc-msg">' + L.closed + '</div>';
		else if (!slots.length) html += '<div class="bkc-msg">' + L.no_slots + '</div>';
		else {
			html += '<div class="bkc-slots">';
			slots.forEach(function (s) { html += '<button class="bkc-slot" data-t="' + s.time_start + '">' + s.time_start + '</button>'; });
			html += '</div>';
		}
		html += '<button class="bkc-back" id="bkc-back-date">&#8592; ' + L.back + '</button>';
		body.innerHTML = html;
		document.getElementById('bkc-back-date').addEventListener('click', renderDateStep);
		Array.prototype.forEach.call(body.querySelectorAll('.bkc-slot'), function (btn) {
			btn.addEventListener('click', function () { state.time = btn.getAttribute('data-t'); renderForm(); });
		});
	}

	function renderForm() {
		var L = t(), body = document.getElementById('bkc-body');
		body.innerHTML = '<p class="bkc-sub">' + L.step_form + '</p>'
			+ '<div class="bkc-pick">📅 ' + state.date + ' &nbsp; ⏰ ' + state.time + '</div>'
			+ '<div id="bkc-ferr" class="bkc-err" style="display:none"></div>'
			+ '<div class="bkc-field"><label>' + L.name + '</label><input id="bkc-name" type="text" autocomplete="name"></div>'
			+ '<div class="bkc-field"><label>' + L.phone + '</label><input id="bkc-phone" type="tel" autocomplete="tel" placeholder="+420 ..."></div>'
			+ '<div class="bkc-field"><label>' + L.service + '</label><input id="bkc-service" type="text"></div>'
			+ '<button class="bkc-btn" id="bkc-submit">' + L.confirm + '</button>'
			+ '<button class="bkc-back" id="bkc-back-slots">&#8592; ' + L.back + '</button>';
		document.getElementById('bkc-back-slots').addEventListener('click', loadSlots);
		document.getElementById('bkc-submit').addEventListener('click', submit);
	}

	function submit() {
		var L = t();
		var name = document.getElementById('bkc-name').value.trim();
		var phone = document.getElementById('bkc-phone').value.trim();
		var service = document.getElementById('bkc-service').value.trim();
		var err = document.getElementById('bkc-ferr');
		function showErr(m) { err.textContent = m; err.style.display = 'block'; }
		if (name.length < 2) return showErr(L.err_name);
		if (!/^[+()\d\s\-]{6,}$/.test(phone)) return showErr(L.err_phone);
		err.style.display = 'none';
		var btn = document.getElementById('bkc-submit');
		btn.disabled = true; btn.textContent = L.loading;
		fetch(API_BASE + '/request', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name, phone: phone, date: state.date, time: state.time, service: service, lang: lang() })
		})
			.then(function (r) { return r.json(); })
			.then(function (d) {
				if (d && d.ok) renderSuccess();
				else { btn.disabled = false; btn.textContent = L.confirm; showErr(L.err_send); }
			})
			.catch(function () { btn.disabled = false; btn.textContent = L.confirm; showErr(L.err_send); });
	}

	function renderSuccess() {
		var L = t(), body = document.getElementById('bkc-body');
		body.innerHTML = '<div class="bkc-success"><div class="ic">✅</div><h4>' + L.success_title + '</h4>'
			+ '<p>' + L.success_text + '</p><button class="bkc-btn" id="bkc-done">' + L.close + '</button></div>';
		document.getElementById('bkc-done').addEventListener('click', closeModal);
	}

	window.openBookingCalendar = openModal;

	// Wire existing "Book" buttons/links across the site. These are inert in the template.
	function wireButtons() {
		var sels = [
			'.header-btn', '.clinic-btn', '.our-team_dental-btn', '.box-btn',
			'[data-i18n="nav.bookNow"]', '[data-i18n="hero.btn1"]', '[data-i18n="ourServices.btn"]',
			'[data-i18n="contactBox.book"]'
		];
		var nodes = document.querySelectorAll(sels.join(','));
		Array.prototype.forEach.call(nodes, function (el) {
			if (el.getAttribute('data-bkc-wired')) return;
			el.setAttribute('data-bkc-wired', '1');
			el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
		});

		// Add a "Choose a time" button into the chat widget (index page only).
		var chatBox = document.getElementById('chat-messages');
		if (chatBox && !document.getElementById('bkc-chat-cta')) {
			var row = document.getElementById('chat-input-row');
			if (row && row.parentNode) {
				var cta = document.createElement('button');
				cta.id = 'bkc-chat-cta';
				cta.type = 'button';
				cta.textContent = t().choose_time;
				cta.style.cssText = 'margin:0 10px 8px;padding:9px;border:1px solid #2563eb;background:#eff6ff;color:#2563eb;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600';
				cta.addEventListener('click', openModal);
				row.parentNode.insertBefore(cta, row);
			}
		}
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireButtons);
	else wireButtons();
})();
