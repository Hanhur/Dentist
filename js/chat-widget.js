(function () {
    var uid = localStorage.getItem("chat_uid");
    if (!uid) { uid = "web_" + Math.random().toString(36).slice(2); localStorage.setItem("chat_uid", uid); }
    var panel = document.getElementById("cw-panel"), btn = document.getElementById("cw-btn"), closeBtn = document.getElementById("cw-close"), msgs = document.getElementById("cw-msgs"), input = document.getElementById("cw-input"), send = document.getElementById("cw-send");
    var AVA = '<div class="cw-mini"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
    function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function scr() { msgs.scrollTop = msgs.scrollHeight; }
    function addUser(t) { msgs.insertAdjacentHTML("beforeend", '<div class="cw-row user"><div class="cw-bub">' + esc(t) + '</div></div>'); scr(); }
    function addBot(t) { msgs.insertAdjacentHTML("beforeend", '<div class="cw-row bot">' + AVA + '<div class="cw-bub">' + esc(t) + '</div></div>'); scr(); }
    function showTyping() { var d = document.createElement("div"); d.className = "cw-row bot"; d.id = "cw-typing-row"; d.innerHTML = AVA + '<div class="cw-bub cw-typing"><span></span><span></span><span></span></div>'; msgs.appendChild(d); scr(); }
    function hideTyping() { var d = document.getElementById("cw-typing-row"); if (d) d.remove(); }
    function toggle() { panel.classList.toggle("open"); if (panel.classList.contains("open")) setTimeout(function () { input.focus(); }, 200); }
    btn.addEventListener("click", toggle); closeBtn.addEventListener("click", toggle);
    async function sendMsg() {
        var text = input.value.trim(); if (!text) return; input.value = ""; addUser(text); showTyping();
        try {
            var r = await fetch("https://granion.org/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ external_user_id: uid, text: text, channel: "web" }) });
            var d = await r.json(); hideTyping(); addBot(d.reply_text || d.final_patient_reply || "...");
        } catch (e) { hideTyping(); addBot("Извините, не удалось связаться. Попробуйте ещё раз."); }
    }
    send.addEventListener("click", sendMsg);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") sendMsg(); });
})();