/**
 * Shared navigation — role-aware links
 */
(function () {
    const NAV_LINKS = [
        { href: 'home.html', label: 'Home', page: 'home.html' },
        { href: 'channel.html', label: 'Channel', page: 'channel.html' },
        { href: 'chat.html', label: 'Chat', page: 'chat.html' },
        { href: 'study-room.html', label: 'Study Room', page: 'study-room.html' },
        { href: 'projects.html', label: 'Projects', page: 'projects.html' },
        { href: 'about.html', label: 'About', page: 'about.html' },
        { href: 'programs.html', label: 'Programs', page: 'programs.html' },
        { href: 'resources.html', label: 'Resources', page: 'resources.html' },
        { href: 'events.html', label: 'Events', page: 'events.html' },
        { href: 'students.html', label: 'Students', page: 'students.html' },
        { href: 'contact.html', label: 'Contact', page: 'contact.html' }
    ];

    window.OsirisNav = { links: NAV_LINKS };

    document.addEventListener('DOMContentLoaded', () => {
        const list = document.getElementById('navbarList');
        if (!list || list.dataset.built === 'true') return;

        const current = window.location.pathname.split('/').pop() || 'home.html';

        list.innerHTML = NAV_LINKS.map((link) => {
            const active = link.page === current ? ' navbar__link--active' : '';
            return `<li><a href="${link.href}" class="navbar__link${active}">${link.label}</a></li>`;
        }).join('') + `
            <li class="navbar__notify-link">
                <a href="profile.html#notifications" class="navbar__link navbar__link--notify" id="navNotifyBtn" title="Notifications">
                    <i class="ri-notification-3-line"></i>
                    <span class="nav-notify-badge" id="navNotifyBadge" hidden>0</span>
                </a>
            </li>
            <li><a href="profile.html" class="navbar__link" title="Profile Settings"><i class="ri-user-settings-line"></i></a></li>`;

        list.dataset.built = 'true';
        OsirisNotifications?.updateBadge?.();
    });
})();
