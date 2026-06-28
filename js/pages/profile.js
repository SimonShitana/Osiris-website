document.addEventListener('DOMContentLoaded', () => {

    const session = OsirisAuth?.getSession();

    if (!session) return;



    const photo = document.getElementById('profilePhoto');

    const welcomeAvatar = document.getElementById('profileWelcomeAvatar');

    const nameEl = document.getElementById('profileName');

    const emailEl = document.getElementById('profileEmail');

    const roleEl = document.getElementById('profileRole');

    const nameInput = document.getElementById('displayNameInput');

    const placeholder = OSIRIS_CONFIG?.assets?.defaultAvatar || '';



    function hasCustomPhoto(url) {

        return url && url !== placeholder && !url.includes('NEW.jpg') && !url.includes('profile.jpg');

    }



    function render() {

        const s = OsirisAuth.getSession();

        const photoUrl = OsirisAuth.getPhotoURL();

        if (photo) {

            photo.src = photoUrl;

            photo.classList.toggle('profile-sidebar__photo--empty', !hasCustomPhoto(photoUrl));

        }

        if (welcomeAvatar) {

            welcomeAvatar.src = photoUrl;

            welcomeAvatar.classList.toggle('profile-sidebar__photo--empty', !hasCustomPhoto(photoUrl));

        }

        if (nameEl) nameEl.textContent = s.name;

        if (emailEl) emailEl.textContent = s.email;

        if (roleEl) {

            roleEl.textContent = s.role === 'admin' ? 'Administrator' : 'Student';

            roleEl.className = `profile-sidebar__role profile-sidebar__role--${s.role === 'admin' ? 'admin' : 'student'}`;

        }

        if (nameInput) nameInput.value = s.name;

        const welcomeTitle = document.getElementById('profileWelcomeTitle');

        const welcomeSub = document.getElementById('profileWelcomeSub');

        if (welcomeTitle) {

            welcomeTitle.textContent = s.role === 'admin'

                ? `Welcome back, ${s.name}`

                : `Hey ${s.name.split(' ')[0]}, ready to learn?`;

        }

        if (welcomeSub) {

            welcomeSub.textContent = s.role === 'admin'

                ? 'Admin dashboard — manage the platform and communicate with students.'

                : 'Your student hub — chat, study room, resources, and more.';

        }

    }

    render();



    if (location.hash === '#notifications') {

        document.querySelector('[data-profile-tab="notifications"]')?.click();

    }



    document.querySelectorAll('[data-profile-tab]').forEach((btn) => {

        btn.addEventListener('click', () => {

            const tab = btn.dataset.profileTab;

            document.querySelectorAll('[data-profile-tab]').forEach((b) => b.classList.toggle('profile-nav--active', b === btn));

            document.querySelectorAll('.profile-panel').forEach((p) => p.classList.toggle('profile-panel--active', p.id === `tab-${tab}`));

            if (tab === 'notifications') OsirisNotifications?.renderInbox?.(document.getElementById('notificationsInbox'));

        });

    });



    OsirisNotifications?.renderInbox?.(document.getElementById('notificationsInbox'));

    document.getElementById('markAllRead')?.addEventListener('click', () => {

        OsirisNotifications?.markAllRead?.();

        OsirisNotifications?.renderInbox?.(document.getElementById('notificationsInbox'));

    });



    async function handlePhoto(file) {

        if (!file) return;

        try {

            await OsirisAuth.updatePhoto(file);

            render();

            initNavUser?.();

            showMsg('nameMsg', 'Photo updated!', 'success');

        } catch (ex) {

            showMsg('nameMsg', ex.message, 'error');

        }

    }



    ['photoInput', 'photoInput2'].forEach((id) => {

        document.getElementById(id)?.addEventListener('change', (e) => handlePhoto(e.target.files?.[0]));

    });



    document.getElementById('nameForm')?.addEventListener('submit', async (e) => {

        e.preventDefault();

        const name = nameInput?.value?.trim();

        if (!name) return;

        try {

            await OsirisAuth.updateProfile({ name });

            render();

            showMsg('nameMsg', 'Name saved.', 'success');

        } catch (ex) {

            showMsg('nameMsg', ex.message, 'error');

        }

    });



    document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {

        e.preventDefault();

        const current = document.getElementById('currentPassword')?.value || '';

        const next = document.getElementById('newPassword')?.value || '';

        const confirm = document.getElementById('confirmPassword')?.value || '';

        if (next !== confirm) {

            showMsg('passwordMsg', 'New passwords do not match.', 'error');

            return;

        }

        try {

            await OsirisAuth.changePassword(current, next);

            e.target.reset();

            showMsg('passwordMsg', 'Password updated.', 'success');

        } catch (ex) {

            showMsg('passwordMsg', ex.message || 'Could not update password.', 'error');

        }

    });



    ['profileLogout', 'securityLogout'].forEach((id) => {

        document.getElementById(id)?.addEventListener('click', () => OsirisAuth.logout());

    });



    const prefKey = `osiris_prefs_${session.email}`;

    const prefs = JSON.parse(localStorage.getItem(prefKey) || '{}');

    const prefFields = {

        prefNewsletter: 'newsletter',

        prefChannel: 'channel',

        prefChat: 'chat',

        prefUpdates: 'updates',

        prefCompact: 'compact',

        prefAnimations: 'animations'

    };

    Object.entries(prefFields).forEach(([id, key]) => {

        const el = document.getElementById(id);

        if (el) el.checked = prefs[key] !== false && (key === 'newsletter' || key === 'channel' ? !!prefs[key] : prefs[key] !== false);

    });



    document.getElementById('savePrefs')?.addEventListener('click', () => {

        const saved = {};

        Object.entries(prefFields).forEach(([id, key]) => {

            saved[key] = document.getElementById(id)?.checked;

        });

        localStorage.setItem(prefKey, JSON.stringify(saved));

        showMsg('prefMsg', 'Settings saved.', 'success');

    });



    renderActivity(session.email);

    if (OsirisAuth.isAdmin()) loadAdminStudents();

});


function renderActivity(email) {

    const list = document.getElementById('activityList');

    if (!list) return;

    const notifs = OsirisNotifications?.getAll?.().slice(0, 8) || [];

    const localTasks = JSON.parse(localStorage.getItem(`osiris_study_tasks_${email}`) || '[]');

    const items = [

        ...notifs.map((n) => ({ text: n.title, time: n.createdAt })),

        ...localTasks.slice(0, 3).map((t) => ({ text: `Task: ${t.text}${t.done ? ' (done)' : ''}`, time: new Date().toISOString() }))

    ];

    list.innerHTML = items.length

        ? items.map((a) => `<li><span>${escapeHtml(a.text)}</span><time>${new Date(a.time).toLocaleDateString()}</time></li>`).join('')

        : '<li style="color:var(--text-muted);border:none">No recent activity yet.</li>';


    // If Firestore is available, also show recent assignment enquiries for this student.
    if (window.OsirisFirebase?.ready && window.OsirisDB?.submitAssignmentEnquiry) {
        try {
            const db = OsirisFirebase.db;
            if (db) {
                db.collection('assignmentEnquiries')
                    .where('studentEmail', '==', email)
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get()
                    .then((snap) => {
                        const enquiries = snap.docs.map((d) => ({
                            text: `Enquiry: ${d.data().subject || ''} · ${d.data().topic || ''}`.trim() || 'Enquiry submitted',
                            time: d.data().createdAt
                        }));
                        const merged = [...items, ...enquiries]
                            .sort((a, b) => new Date(b.time).valueOf() - new Date(a.time).valueOf())
                            .slice(0, 8);
                        list.innerHTML = merged.length
                            ? merged.map((a) => `<li><span>${escapeHtml(a.text)}</span><time>${new Date(a.time).toLocaleDateString()}</time></li>`).join('')
                            : '<li style="color:var(--text-muted);border:none">No recent activity yet.</li>';
                    })
                    .catch(() => {});
            }
        } catch (_) {}
    }
}




async function loadAdminStudents() {

    const container = document.getElementById('adminStudentList');

    if (!container) return;



    let students = [];

    if (window.OsirisDB?.listStudents) {

        try { students = await OsirisDB.listStudents(); } catch (_) { /* index may be missing */ }

    }

    if (!students.length) {

        try {

            const local = JSON.parse(localStorage.getItem('osiris_users') || '[]');

            students = local.map((u) => ({

                displayName: u.name,

                email: u.email,

                lastLoginAt: u.createdAt

            }));

        } catch (_) { /* ok */ }

    }



    if (!students.length) {

        container.innerHTML = '<p style="color:var(--text-muted)">No student profiles yet. Students appear here after Google sign-in.</p>';

        return;

    }



    container.innerHTML = `<table class="admin-student-table">

        <thead><tr><th>Name</th><th>Email</th><th>Last active</th></tr></thead>

        <tbody>${students.map((s) => {

            const last = s.lastLoginAt?.seconds

                ? new Date(s.lastLoginAt.seconds * 1000).toLocaleString()

                : (s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : '—');

            return `<tr><td>${escapeHtml(s.displayName || '—')}</td><td>${escapeHtml(s.email || '')}</td><td>${last}</td></tr>`;

        }).join('')}</tbody>

    </table>`;

}



function showMsg(id, text, type) {

    const el = document.getElementById(id);

    if (!el) return;

    el.textContent = text;

    el.className = `profile-msg profile-msg--${type}`;

    el.hidden = false;

    setTimeout(() => { el.hidden = true; }, 4000);

}



function escapeHtml(str) {

    const d = document.createElement('div');

    d.textContent = str || '';

    return d.innerHTML;

}


