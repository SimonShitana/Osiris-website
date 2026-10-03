/**
 * Shared navigation — role-aware links
 */
(function () {
    const NAV_LINKS = [
        { href: 'home.html', label: 'Home', page: 'home.html', icon: 'ri-home-5-line', section: 'Workspace' },
        { href: 'channel.html', label: 'Channel', page: 'channel.html', icon: 'ri-article-line', section: 'Workspace' },
        { href: 'chat.html', label: 'Chat', page: 'chat.html', icon: 'ri-chat-3-line', section: 'Workspace' },
        { href: 'study-room.html', label: 'Study Room', page: 'study-room.html', icon: 'ri-book-open-line', section: 'Workspace' },
        { href: 'projects.html', label: 'Projects', page: 'projects.html', icon: 'ri-code-box-line', section: 'Explore' },
        { href: 'programs.html', label: 'Programs', page: 'programs.html', icon: 'ri-graduation-cap-line', section: 'Explore' },
        { href: 'resources.html', label: 'Resources', page: 'resources.html', icon: 'ri-folder-open-line', section: 'Explore' },
        { href: 'events.html', label: 'Events', page: 'events.html', icon: 'ri-calendar-event-line', section: 'Explore' },
        { href: 'students.html', label: 'Students', page: 'students.html', icon: 'ri-team-line', section: 'Community' },
        { href: 'about.html', label: 'About', page: 'about.html', icon: 'ri-information-line', section: 'Community' },
        { href: 'contact.html', label: 'Contact', page: 'contact.html', icon: 'ri-mail-line', section: 'Community' }
    ];

    window.OsirisNav = { links: NAV_LINKS };

    document.addEventListener('DOMContentLoaded', () => {
        const list = document.getElementById('navbarList');
        if (!list || list.dataset.built === 'true') return;

        const current = window.location.pathname.split('/').pop() || 'home.html';

        const menu = document.getElementById('navbarMenu');
        const session = window.OsirisAuth?.getSession?.();
        const menuHeader = document.createElement('div');
        menuHeader.className = 'navbar__sidebar-head';
        menuHeader.innerHTML = `
            <a class="navbar__account" href="profile.html" aria-label="Open profile">
                <span class="navbar__account-avatar">
                    <img id="navAvatar" alt="" hidden>
                    <i class="ri-user-3-line" aria-hidden="true"></i>
                </span>
                <span class="navbar__account-details">
                    <strong id="navUserLabel">Osiris</strong>
                    <small id="navUserRole">Learning space</small>
                </span>
            </a>
            <button type="button" class="navbar__collapse" id="navbarCollapse" aria-label="Collapse sidebar" aria-expanded="true" title="Collapse sidebar">
                <i class="ri-layout-left-line" aria-hidden="true"></i>
            </button>`;
        menu.insertBefore(menuHeader, list);

        const sections = [];
        NAV_LINKS.forEach((link) => {
            let section = sections[sections.length - 1];
            if (!section || section.label !== link.section) {
                section = { label: link.section, links: [] };
                sections.push(section);
            }
            section.links.push(link);
        });

        list.innerHTML = sections.map((section) => `
            <li class="navbar__section" aria-hidden="true">${section.label}</li>
            ${section.links.map((link) => {
            const active = link.page === current ? ' navbar__link--active' : '';
            return `<li><a href="${link.href}" class="navbar__link${active}" title="${link.label}">
                <i class="${link.icon}" aria-hidden="true"></i><span>${link.label}</span>
            </a></li>`;
        }).join('')}`).join('') + `
            <li class="navbar__section navbar__section--account" aria-hidden="true">Account</li>
            <li class="navbar__notify-link">
                <a href="profile.html#notifications" class="navbar__link navbar__link--notify" id="navNotifyBtn" title="Notifications">
                    <i class="ri-notification-3-line" aria-hidden="true"></i><span>Notifications</span>
                    <span class="nav-notify-badge" id="navNotifyBadge" hidden>0</span>
                </a>
            </li>
            <li><a href="profile.html" class="navbar__link${current === 'profile.html' ? ' navbar__link--active' : ''}" title="Profile">
                <i class="ri-user-settings-line" aria-hidden="true"></i><span>Profile</span>
            </a></li>`;

        const userLabel = menuHeader.querySelector('#navUserLabel');
        const userRole = menuHeader.querySelector('#navUserRole');
        const avatar = menuHeader.querySelector('#navAvatar');
        const avatarIcon = menuHeader.querySelector('.navbar__account-avatar i');
        const updateAccount = (activeSession) => {
            if (!activeSession) return;
            userLabel.textContent = activeSession.role === 'admin' ? `Admin · ${activeSession.name}` : activeSession.name;
            userRole.textContent = activeSession.role === 'admin' ? 'Administrator' : 'Student account';
            const photoUrl = window.OsirisAuth?.getPhotoURL?.();
            if (photoUrl) {
                avatar.src = photoUrl;
                avatar.alt = activeSession.name;
                avatar.hidden = false;
                avatarIcon.hidden = true;
            }
        };
        updateAccount(session);
        window.addEventListener('osiris-auth-change', (event) => updateAccount(event.detail || window.OsirisAuth?.getSession?.()));

        const collapseButton = menuHeader.querySelector('#navbarCollapse');
        collapseButton.addEventListener('click', () => {
            const collapsed = menu.classList.toggle('navbar__menu--collapsed');
            collapseButton.setAttribute('aria-expanded', String(!collapsed));
            collapseButton.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
            collapseButton.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
            collapseButton.innerHTML = `<i class="${collapsed ? 'ri-layout-right-line' : 'ri-layout-left-line'}" aria-hidden="true"></i>`;
        });

        list.dataset.built = 'true';
        menu.addEventListener('click', (event) => {
            if (event.target.closest('.navbar__account')) {
                document.getElementById('hamburger')?.click();
            }
        });
        // Legacy call removed; notification badge is managed by Modulus notifications module.
        window.ModulusNotifications?.updateBadge?.();

    });
})();
