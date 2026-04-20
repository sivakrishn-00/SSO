(function() {
    // 1. Ghost Mask - Hide the page immediately so typing is invisible
    const createMask = () => {
        if (window.top !== window.self || document.getElementById('sso-ghost-mask')) return;
        const mask = document.createElement('div');
        mask.id = 'sso-ghost-mask';
        mask.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:#ffffff;z-index:9999999;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:'Inter',sans-serif;";
        mask.innerHTML = `
            <div style="width:50px;height:50px;border:5px solid #f3f3f3;border-top:5px solid #6366f1;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
            <div style="font-size:20px;font-weight:700;color:#1e293b;">Bavya SSO Hub</div>
            <div style="font-size:14px;color:#94a3b8;margin-top:10px;">Authenticating securely, please wait...</div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        document.documentElement.appendChild(mask);
    };

    // 2. OneSignal & ServiceWorker Armor
    const ghost = new Proxy(() => {}, {
        get: (target, prop) => {
            if (prop === 'push') return (fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };
            return ghost;
        },
        apply: () => ghost
    });
    ghost.Qe = {}; ghost.logout = () => {}; ghost.init = () => {};
    if (!window.OneSignal) window.OneSignal = ghost;

    if (navigator.serviceWorker) {
        navigator.serviceWorker.register = () => new Promise((resolve) => resolve({ active: { postMessage: () => {} } }));
    }

    const url = new URL(window.location.href);
    const host = window.location.hostname;
    const ssoToken = url.searchParams.get('sso_token');

    if (ssoToken) {
        createMask(); // Hide the page if we are doing a handshake
        url.searchParams.delete('sso_token');
        window.history.replaceState({}, document.title, url.toString());
        chrome.runtime.sendMessage({ type: "FETCH_CREDS", token: ssoToken }, (data) => {
            if (data && data.u) performLogin(data.u, data.p);
        });
    }

    const SERVICE_CONFIGS = {
        "ehr.bhspl.in": { user: "#email", pass: "#pv_id_9", btn: "button.p-button" },
        "one.bhspl.in": { user: "input[type='text']", pass: "input[type='password']", btn: "[type='submit']" }
    };

    function performLogin(u, p) {
        const drive = async (el, val) => {
            if (!el) return;
            el.focus(); el.click();
            await new Promise(r => setTimeout(r, 50));
            el.value = "";
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (setter) setter.call(el, "");
            for (let char of val) { document.execCommand('insertText', false, char); }
            el.dispatchEvent(new InputEvent('input', { data: val, bubbles: true }));
            ['change', 'blur'].forEach(n => el.dispatchEvent(new Event(n, { bubbles: true })));
        };

        const scan = () => {
            if (window._sso_locked || window.location.pathname.includes('dashboard')) {
                const mask = document.getElementById('sso-ghost-mask');
                if (mask) mask.remove(); // Reveal dashboard
                return true;
            }

            const config = SERVICE_CONFIGS[host] || {};
            const user = document.querySelector(config.user) || document.querySelector('#email, input[type="email"], input[name*="user" i], input[type="tel"], input[type="text"]');
            const pass = document.querySelector(config.pass) || document.querySelector('#pv_id_9, input[type="password"]');
            const btn = document.querySelector(config.btn) || document.querySelector('button[type="submit"], .p-button');
            const targetBtn = btn || Array.from(document.querySelectorAll('button')).find(b => b.innerText.toUpperCase().includes('SIGN IN') && b.innerText.length < 20);

            if (user && pass && targetBtn) {
                if (user.value.length > 0 && pass.value.length > 0) {
                     window._sso_locked = true;
                     setTimeout(() => {
                        try {
                            targetBtn.disabled = false;
                            ['mousedown', 'mouseup', 'click'].forEach(type => {
                                targetBtn.dispatchEvent(new MouseEvent(type, { bubbles: true, view: window, buttons: 1 }));
                            });
                            pass.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                        } catch(e) {}
                     }, 500);
                     return true;
                }
                drive(user, u);
                setTimeout(() => drive(pass, p), 200);
            }
            return false;
        };

        window._sso_interval = setInterval(scan, 600);
        setTimeout(() => clearInterval(window._sso_interval), 30000);
    }

    // Safety: If we reach dashboard without token, just make sure mask is gone
    if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('home')) {
        const mask = document.getElementById('sso-ghost-mask');
        if (mask) mask.remove();
        
        // Always show the switch-back link on dashboards
        let el = document.getElementById('sso-bridge-status');
        if (!el) {
            el = document.createElement('div');
            el.id = 'sso-bridge-status';
            el.style = "position:fixed;top:10px;right:10px;padding:8px 15px;background:#6366f1;color:white;z-index:999999;border-radius:8px;font-family:sans-serif;box-shadow:0 12px 24px rgba(0,0,0,0.3);font-weight:bold;display:flex;align-items:center;gap:12px;opacity:0.8;transition:opacity 0.3s;";
            el.onmouseover = () => el.style.opacity = "1";
            el.onmouseout = () => el.style.opacity = "0.8";
            el.innerHTML = `<a href="http://localhost:5173/dashboard" target="_self" onclick="window.location.href='http://localhost:5173/dashboard';return false;" style="color:#ffffff;text-decoration:none;font-size:12px;">🏠 Back to System Hub</a>`;
            document.body.appendChild(el);
        }
    }
})();
