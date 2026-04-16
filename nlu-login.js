/**
 * <nlu-login> Web Component
 *
 * Hỗ trợ 2 mode đăng nhập Google:
 *   mode="form"  (default) — Form POST → Blazor/ASP.NET server-side OAuth
 *   mode="event"           — Gọi hàm callback → React SPA client-side OAuth
 *
 * Attributes:
 *   - mode          : "form" (default) | "event"
 *   - system-name   : Tên hệ thống, dùng &#10; để xuống dòng
 *   - form-action   : [mode=form] URL action (default "account/ExternalLogin")
 *   - provider      : [mode=form] Provider name (default "Google")
 *   - return-url    : [mode=form] Return URL (default "/")
 *   - on-login      : [mode=event] Tên hàm global sẽ được gọi khi click đăng nhập
 *   - error         : Thông báo lỗi (hiện alert đỏ)
 *   - info          : Thông báo info (hiện alert xanh)
 *   - logo-src      : URL logo
 *   - bg-src        : URL ảnh nền
 *
 * Events (mode="event" only):
 *   - nlu-login     : Fired khi click nút đăng nhập
 *
 * Usage (Blazor):
 *   <nlu-login form-action="account/ExternalLogin" return-url="/"
 *              error="Email không hợp lệ"></nlu-login>
 *
 * Usage (React SPA):
 *   <nlu-login mode="event" on-login="handleGoogleLogin"></nlu-login>
 *   <script> function handleGoogleLogin() { google.accounts.oauth2... } </script>
 */
class NluLogin extends HTMLElement {
    static get observedAttributes() {
        return ["logo-src", "bg-src", "system-name", "form-action",
            "provider", "return-url", "mode", "error", "info", "on-login"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        NluLogin._injectFonts();
        this.render();
        this._bindEvents();
    }

    attributeChangedCallback() {
        if (this.shadowRoot && this.isConnected) {
            this.render();
            this._bindEvents();
        }
    }

    // ── Font injection (once per page) ──

    static _fontsInjected = false;
    static _injectFonts() {
        if (NluLogin._fontsInjected) return;
        NluLogin._fontsInjected = true;
        [
            "https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap",
            "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        ].forEach(function (href) {
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
        });
    }

    // ── Attribute getters ──

    get loginMode() { return this.getAttribute("mode") || "form"; }
    get provider() { return this.getAttribute("provider") || "Google"; }
    get onLoginFn() { return this.getAttribute("on-login") || ""; }

    get logoSrc() {
        return this.getAttribute("logo-src") ||
            "/Logo.png";
    }

    get bgSrc() {
        return this.getAttribute("bg-src") ||
            "/bg.jpg";
    }

    get systemName() {
        var raw = this.getAttribute("system-name") || "QUẢN LÝ\nCHUẨN ĐẦU RA";
        var esc = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        return esc.replace(/\n/g, "<br/>");
    }

    get formAction() {
        var base = this.getAttribute("form-action") || "account/ExternalLogin";
        var ret = this.getAttribute("return-url") || "/";
        return base + "?returnUrl=" + encodeURIComponent(ret);
    }

    get errorMsg() {
        var v = this.getAttribute("error");
        return v ? v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }

    get infoMsg() {
        var v = this.getAttribute("info");
        return v ? v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }

    // ── Event binding (mode=event only) ──

    _bindEvents() {
        if (this.loginMode !== "event") return;
        var btn = this.shadowRoot.querySelector("#sso-btn");
        var self = this;
        if (btn) {
            btn.addEventListener("click", function () {
                // Gọi hàm global nếu có attribute on-login
                var fnName = self.onLoginFn;
                if (fnName && typeof window[fnName] === "function") {
                    window[fnName]();
                }
                // Vẫn dispatch event để hỗ trợ cả 2 cách dùng
                self.dispatchEvent(new CustomEvent("nlu-login", { bubbles: true, composed: true }));
            });
        }
    }

    // ── Render ──

    render() {
        var prov = this.provider.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        this.shadowRoot.innerHTML =
            "<style>" + NluLogin.getStyles(this.bgSrc) + "</style>" +
            NluLogin.getTemplate(this.logoSrc, this.systemName, this.formAction,
                prov, this.loginMode, this.errorMsg, this.infoMsg);
    }

    // ── Google icon SVG ──

    static googleIcon() {
        return '<div class="g-icon"><svg viewBox="0 0 24 24">' +
            '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>' +
            '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
            '<path d="M5.84 14.09c-.22-.66-.35-1.46-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>' +
            '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>' +
            '</svg></div>';
    }

    // ── Button HTML (switches on mode) ──

    static getButtonHtml(formAction, provider, mode) {
        var icon = NluLogin.googleIcon();
        var label = '<span>Đăng nhập bằng tài khoản NLU (Google)</span>';

        if (mode === "event") {
            // mode=event: plain button → gọi hàm on-login + dispatch "nlu-login" event
            return '<button id="sso-btn" type="button" class="sso-btn">' + icon + label + '</button>';
        }
        // mode=form: native form POST
        return '<form action="' + formAction + '" method="post">' +
            '<input type="hidden" name="provider" value="' + provider + '" />' +
            '<button type="submit" class="sso-btn">' + icon + label + '</button>' +
            '</form>';
    }

    // ── Alert HTML ──

    static getAlertHtml(errorMsg, infoMsg) {
        var h = "";
        if (errorMsg) {
            h += '<div class="alert alert-error">' +
                '<span class="material-symbols-outlined">error</span>' +
                '<span>' + errorMsg + '</span></div>';
        }
        if (infoMsg) {
            h += '<div class="alert alert-info">' +
                '<span class="material-symbols-outlined">info</span>' +
                '<span>' + infoMsg + '</span></div>';
        }
        return h;
    }

    // ── Styles ──

    static getStyles(bgSrc) {
        return ":host{--primary:#006b33;--primary-container:#008743;--secondary:#705d00;--secondary-container:#fcd400;--surface-container-low:#eff5ec;--on-surface:#171d17;--on-surface-variant:#3e4a3f;--outline-variant:#bdcabc;display:block;font-family:'Manrope',sans-serif}" +
            "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
            ".material-symbols-outlined{font-family:'Material Symbols Outlined';font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;display:inline-block;vertical-align:middle;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;white-space:nowrap;direction:ltr;-webkit-font-smoothing:antialiased}" +
            ".page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;position:relative;background:url('" + bgSrc + "') center/cover no-repeat}" +
            ".blur-overlay{position:absolute;inset:0;background:rgba(255,255,255,0.3);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}" +
            ".wrapper{position:relative;z-index:10;width:100%;max-width:64rem;display:flex;flex-direction:column;align-items:center}" +
            ".card{width:100%;background:#fff;border-radius:1.5rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.15);overflow:hidden;display:flex;flex-direction:column;min-height:500px}" +
            ".branding{width:100%;background:var(--primary);padding:2rem 2.5rem;display:flex;flex-direction:column;justify-content:space-between;color:#fff;position:relative;overflow:hidden}" +
            ".branding .decor{position:absolute;top:0;right:0;width:8rem;height:8rem;background:rgba(255,255,255,0.05);border-radius:9999px;margin-right:-4rem;margin-top:-4rem}" +
            ".branding .content{position:relative;z-index:1}" +
            ".branding img{height:5rem;width:auto;margin-bottom:2rem;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))}" +
            ".branding .university-name{font-size:0.5625rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;opacity:0.9;margin-bottom:0.5rem;white-space:nowrap}" +
            ".branding h1{font-size:1.875rem;font-weight:800;line-height:1.1;letter-spacing:-0.01em;text-transform:uppercase}" +
            ".branding .accent-bar{height:0.25rem;width:4rem;background:var(--secondary-container);margin-top:1rem;border-radius:2px}" +
            ".branding .values{margin-top:3rem;position:relative;z-index:1}" +
            ".branding .values p{color:var(--secondary-container);font-weight:700;font-size:0.625rem;letter-spacing:0.05em;line-height:1.6;white-space:nowrap}" +
            ".login{width:100%;background:#fff;padding:2rem;display:flex;flex-direction:column;justify-content:center}" +
            ".login-inner{max-width:28rem;margin:0 auto;width:100%}" +
            ".login h2{color:var(--primary);font-size:1.5rem;font-weight:800;letter-spacing:-0.01em;text-transform:uppercase;margin-bottom:2rem}" +
            ".alert{width:100%;padding:0.75rem 1rem;border-radius:0.75rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;font-weight:500;animation:slideDown .3s ease-out}" +
            ".alert-error{background:#ffdad6;color:#93000a}" +
            ".alert-info{background:#d6f0ff;color:#00497a}" +
            "@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}" +
            ".info-box{background:var(--surface-container-low);padding:1rem;border-radius:0.75rem;border-left:4px solid var(--primary);margin-bottom:1.5rem}" +
            ".info-box p{font-size:0.875rem;color:var(--on-surface);font-weight:500;line-height:1.6}" +
            ".info-box .hl{color:var(--primary);font-weight:700}" +
            "form{display:block}" +
            ".sso-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:0.75rem;padding:1rem 1.5rem;background:var(--primary);color:#fff;font-weight:700;font-size:0.9375rem;border:none;border-radius:0.75rem;cursor:pointer;transition:background .2s,box-shadow .2s;box-shadow:0 10px 15px -3px rgba(0,107,51,0.2);font-family:'Manrope',sans-serif}" +
            ".sso-btn:hover{background:var(--primary-container)}" +
            ".sso-btn:focus-visible{outline:3px solid var(--primary);outline-offset:2px}" +
            ".sso-btn .g-icon{background:#fff;padding:0.25rem;border-radius:0.125rem;display:flex;align-items:center;justify-content:center}" +
            ".sso-btn svg{width:1.25rem;height:1.25rem;display:block}" +
            ".help{padding-top:1rem;margin-top:1.5rem;border-top:1px solid rgba(189,202,188,0.3);display:flex;align-items:flex-start;gap:0.75rem}" +
            ".help .icon{color:var(--secondary);font-size:1.25rem;margin-top:0.125rem}" +
            ".help p{font-size:0.75rem;color:var(--on-surface-variant);line-height:1.6}" +
            ".help .hl{font-weight:700;color:var(--primary)}" +
            "footer{margin-top:2rem;text-align:center}" +
            "footer p{font-size:0.6875rem;font-weight:700;color:rgba(23,29,23,0.6);text-transform:uppercase;letter-spacing:0.1em}" +
            "@media(min-width:768px){.card{flex-direction:row}.branding{width:45%;padding:2.5rem}.branding .university-name{font-size:0.625rem}.branding h1{font-size:2.25rem}.branding .values p{font-size:0.6875rem}.login{width:55%;padding:3rem}.login h2{font-size:1.875rem}}" +
            "@media(min-width:1024px){.branding{padding:3rem}.branding .university-name{font-size:0.75rem}.branding h1{font-size:3rem}.branding .values p{font-size:0.875rem}.login{padding:4rem}}";
    }

    // ── Template ──

    static getTemplate(logoSrc, systemName, formAction, provider, mode, errorMsg, infoMsg) {
        return '<div class="page"><div class="blur-overlay"></div><div class="wrapper">' +
            NluLogin.getAlertHtml(errorMsg, infoMsg) +
            '<main class="card">' +
            '<section class="branding"><div class="decor"></div><div class="content">' +
            '<img alt="Nong Lam University logo" src="' + logoSrc + '" />' +
            '<p class="university-name">TRƯỜNG ĐẠI HỌC NÔNG LÂM TP. HỒ CHÍ MINH</p>' +
            '<h1>' + systemName + '</h1>' +
            '<div class="accent-bar"></div></div>' +
            '<div class="values"><p>Nhân văn • Nhân bản • Phục vụ • Đổi mới • Hội nhập</p></div>' +
            '</section>' +
            '<section class="login"><div class="login-inner">' +
            '<h2>ĐĂNG NHẬP</h2>' +
            '<div class="info-box"><p>' +
            'Chỉ đăng nhập vào hệ thống bằng email sinh viên được nhà trường cấp ' +
            '(<span class="hl">@st.hcmuaf.edu.vn</span>) hoặc email cán bộ ' +
            '(<span class="hl">@hcmuaf.edu.vn</span>).</p></div>' +
            NluLogin.getButtonHtml(formAction, provider, mode) +
            '<div class="help">' +
            '<span class="material-symbols-outlined icon">help_center</span>' +
            '<p>Sinh viên quên mật khẩu email vui lòng liên hệ <span class="hl">phòng Hỗ trợ người học</span> để được hỗ trợ. ' +
            'Cán bộ/Giảng viên gặp vấn đề về tài khoản vui lòng liên hệ <span class="hl">Văn phòng Trường</span>.</p>' +
            '</div></div></section>' +
            '</main>' +
            '<footer><p>© 2026 TRƯỜNG ĐẠI HỌC NÔNG LÂM TP.HCM</p></footer>' +
            '</div></div>';
    }
}

customElements.define("nlu-login", NluLogin);