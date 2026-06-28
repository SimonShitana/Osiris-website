/**

 * In-app notifications — localStorage + Firestore sync when available

 */

(function () {

    const NOTIF_KEY = 'osiris_notifications';

    const BROADCAST_KEY = 'osiris_broadcast_notifications';



    function getLocalNotifications(email) {

        try {

            const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');

            return all[email] || [];

        } catch { return []; }

    }



    function saveLocalNotifications(email, list) {

        const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');

        all[email] = list.slice(0, 100);

        localStorage.setItem(NOTIF_KEY, JSON.stringify(all));

    }



    function getBroadcasts() {

        try { return JSON.parse(localStorage.getItem(BROADCAST_KEY) || '[]'); } catch { return []; }

    }



    function saveBroadcasts(list) {

        localStorage.setItem(BROADCAST_KEY, JSON.stringify(list.slice(0, 50)));

    }



    function sessionEmail() {

        return OsirisAuth?.getSession()?.email || '';

    }



    window.OsirisNotifications = {

        getAll() {

            const email = sessionEmail();

            if (!email) return [];

            const personal = getLocalNotifications(email);

            const broadcasts = getBroadcasts().filter((b) => !personal.some((p) => p.id === b.id));

            return [...broadcasts, ...personal].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        },



        getUnreadCount() {

            return this.getAll().filter((n) => !n.read).length;

        },



        markRead(id) {

            const email = sessionEmail();

            if (!email) return;

            const list = getLocalNotifications(email);

            const item = list.find((n) => n.id === id);

            if (item) item.read = true;

            else list.unshift({ id, read: true, createdAt: new Date().toISOString() });

            saveLocalNotifications(email, list);

            this.updateBadge();

        },



        markAllRead() {

            const email = sessionEmail();

            if (!email) return;

            const all = this.getAll().map((n) => ({ ...n, read: true }));

            saveLocalNotifications(email, all);

            this.updateBadge();

        },



        push(type, title, body, link) {

            const email = sessionEmail();

            if (!email) return;

            const list = getLocalNotifications(email);

            list.unshift({

                id: 'n_' + Date.now(),

                type,

                title,

                body,

                link: link || '',

                read: false,

                createdAt: new Date().toISOString()

            });

            saveLocalNotifications(email, list);

            this.updateBadge();

            OsirisNotify?.info(title, body);

            if (window.OsirisDB?.pushNotification) {

                OsirisDB.pushNotification({ email, type, title, body, link }).catch(() => {});

            }

        },



        broadcast(type, title, body, link) {

            const item = {

                id: 'b_' + Date.now(),

                type,

                title,

                body,

                link: link || '',

                read: false,

                createdAt: new Date().toISOString()

            };

            const broadcasts = getBroadcasts();

            broadcasts.unshift(item);

            saveBroadcasts(broadcasts);

            this.push(type, title, body, link);

            window.dispatchEvent(new CustomEvent('osiris-notification', { detail: item }));

        },



        updateBadge() {

            const badge = document.getElementById('navNotifyBadge');

            if (!badge) return;

            const count = this.getUnreadCount();

            badge.textContent = count > 99 ? '99+' : String(count);

            badge.hidden = count === 0;

        },



        renderInbox(container) {

            if (!container) return;

            const items = this.getAll();

            if (!items.length) {

                container.innerHTML = '<p class="notif-empty">No notifications yet. You\'ll be notified about uploads, channel posts, and chat messages.</p>';

                return;

            }

            container.innerHTML = items.map((n) => `

                <article class="notif-item${n.read ? '' : ' notif-item--unread'}" data-id="${n.id}">

                    <div class="notif-item__icon"><i class="ri-${iconForType(n.type)}"></i></div>

                    <div class="notif-item__body">

                        <strong>${escapeHtml(n.title)}</strong>

                        <p>${escapeHtml(n.body)}</p>

                        <time>${new Date(n.createdAt).toLocaleString()}</time>

                    </div>

                </article>

            `).join('');

            container.querySelectorAll('.notif-item').forEach((el) => {

                el.addEventListener('click', () => {

                    this.markRead(el.dataset.id);

                    el.classList.remove('notif-item--unread');

                    const link = items.find((n) => n.id === el.dataset.id)?.link;

                    if (link) window.location.href = link;

                });

            });

        },



        init() {

            this.updateBadge();

            window.addEventListener('osiris-auth-change', () => this.updateBadge());

            window.addEventListener('osiris-notification', () => this.updateBadge());

            window.addEventListener('storage', (e) => {

                if (e.key === BROADCAST_KEY || e.key === NOTIF_KEY) this.updateBadge();

            });

            if (window.OsirisDB?.subscribeNotifications) {

                const email = sessionEmail();

                if (email) {

                    OsirisDB.subscribeNotifications(email, (items) => {

                        if (!items?.length) return;

                        items.forEach((n) => this.push(n.type, n.title, n.body, n.link));

                    });

                }

            }

        }

    };



    function iconForType(type) {

        return ({ resource: 'file-upload-line', channel: 'broadcast-line', chat: 'chat-3-line', update: 'notification-3-line' })[type] || 'notification-3-line';

    }



    function escapeHtml(str) {

        const d = document.createElement('div');

        d.textContent = str || '';

        return d.innerHTML;

    }



    document.addEventListener('DOMContentLoaded', () => OsirisNotifications.init());

})();


