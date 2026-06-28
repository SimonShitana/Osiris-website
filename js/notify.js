/**
 * Osiris notification modals — errors, success, warnings
 */
(function () {
    const ICONS = {
        error: 'ri-error-warning-fill',
        success: 'ri-checkbox-circle-fill',
        warning: 'ri-alert-fill',
        info: 'ri-information-fill'
    };

    function ensureRoot() {
        let root = document.getElementById('osirisNotifyRoot');
        if (root) return root;
        root = document.createElement('div');
        root.id = 'osirisNotifyRoot';
        root.className = 'osiris-notify-root';
        root.setAttribute('aria-live', 'polite');
        document.body.appendChild(root);
        return root;
    }

    function show(type, title, message, options = {}) {
        const root = ensureRoot();
        const duration = options.duration ?? (type === 'error' ? 6000 : 4500);

        const overlay = document.createElement('div');
        overlay.className = 'osiris-notify-overlay';
        overlay.innerHTML = `
            <div class="osiris-notify osiris-notify--${type}" role="alertdialog" aria-labelledby="osirisNotifyTitle">
                <div class="osiris-notify__icon"><i class="${ICONS[type] || ICONS.info}"></i></div>
                <div class="osiris-notify__body">
                    <h3 id="osirisNotifyTitle">${escapeHtml(title)}</h3>
                    <p>${escapeHtml(message)}</p>
                </div>
                <button type="button" class="osiris-notify__close" aria-label="Close"><i class="ri-close-line"></i></button>
            </div>`;

        const close = () => {
            overlay.classList.add('osiris-notify-overlay--out');
            setTimeout(() => overlay.remove(), 280);
        };

        overlay.querySelector('.osiris-notify__close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        root.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('osiris-notify-overlay--in'));

        if (duration > 0) setTimeout(close, duration);
        return close;
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str ?? '';
        return d.innerHTML;
    }

    window.OsirisNotify = {
        error(title, message, opts) { return show('error', title, message, opts); },
        success(title, message, opts) { return show('success', title, message, opts); },
        warning(title, message, opts) { return show('warning', title, message, opts); },
        info(title, message, opts) { return show('info', title, message, opts); }
    };
})();
