const PROJECTS_KEY = 'osiris_admin_projects';

function getAdminProjects() {
    try { return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'); } catch { return []; }
}

function saveAdminProjects(projects) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function escapeProjectHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function allProjects() {
    const configured = (OSIRIS_CONFIG?.codingProjects || []).map((p) => ({
        ...p,
        kind: p.kind || 'Project',
        image: p.image || null,
        adminCreated: false
    }));
    return [...getAdminProjects(), ...configured];
}

function renderProjectsFromList(list) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const isAdmin = OsirisAuth?.isAdmin();
    grid.innerHTML = list.map((p, i) => `
        <article class="project-card reveal${i ? ' reveal--delay-' + Math.min(i, 4) : ''}">
            ${p.image ? `<div class="project-card__image"><img src="${p.image}" alt=""></div>` : ''}
            <span class="project-card__status">${escapeProjectHtml(p.status || 'Published')}</span>
            <span class="project-card__tag">${escapeProjectHtml(p.kind || p.tag || 'Project')}</span>
            <h3>${escapeProjectHtml(p.title)}</h3>
            <p class="project-card__stack">${escapeProjectHtml(p.stack || p.tag || '')}</p>
            <p>${escapeProjectHtml(p.description)}</p>
            ${p.link ? `<a href="${p.link}" class="btn btn--ghost btn--sm" target="_blank" rel="noopener" style="margin-top:1rem">Open <i class="ri-arrow-right-line"></i></a>` : ''}
            ${isAdmin && p.adminCreated ? `<button type="button" class="btn btn--ghost btn--sm project-delete" data-id="${p.id}" style="margin-top:1rem">Delete</button>` : ''}
        </article>
    `).join('');


    grid.querySelectorAll('.project-delete').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!confirm('Delete this project/article?')) return;
            saveAdminProjects(getAdminProjects().filter((p) => p.id !== btn.dataset.id));
            renderProjects();
        });
    });

    if (typeof initScrollReveal === 'function') initScrollReveal();
}

function initProjectComposer() {
    const composer = document.getElementById('projectComposer');
    if (!composer) return;
    if (!OsirisAuth?.isAdmin()) {
        composer.hidden = true;
        return;
    }
    composer.hidden = false;

    const imageInput = document.getElementById('projectImage');
    let imageData = null;
    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) { imageData = null; return; }
        const reader = new FileReader();
        reader.onload = () => { imageData = reader.result; };
        reader.readAsDataURL(file);
    });

    document.getElementById('projectForm')?.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('projectTitle').value.trim();
        const kind = document.getElementById('projectKind').value;
        const stack = document.getElementById('projectStack').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        // Firestore path is best, but your project composer historically used localStorage.
        // We keep localStorage as fallback.
        (async () => {
            try {
                if (window.OsirisFirebase?.ready && window.OsirisDB) {
                    // No helper exists yet in firebase-db.js for projects CRUD; fallback to local.
                    throw new Error('No projects helper configured');
                }
            } catch (_) {
                const projects = getAdminProjects();
                projects.unshift({
                    id: 'project_' + Date.now(),
                    title,
                    kind,
                    tag: kind,
                    stack,
                    description,
                    status: 'Published',
                    image: imageData,
                    adminCreated: true,
                    createdAt: new Date().toISOString()
                });
                saveAdminProjects(projects);
                e.target.reset();
                imageData = null;
                renderProjectsFromList(allProjects());
                const msg = document.getElementById('projectMsg');
                if (msg) {
                    msg.textContent = 'Published to personal projects.';
                    setTimeout(() => { msg.textContent = ''; }, 3000);
                }
            }
        })();
    });
}

function initProjectsRealtime() {
    // Render initial list (configured + admin-created localStorage)
    renderProjectsFromList(allProjects());

    // Real-time Firestore updates if the helper is available.
    try {
        if (window.OsirisFirebase?.ready && OsirisFirebase.db) {
            return OsirisFirebase.db.collection('projects')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .onSnapshot((snap) => {
                    const firestoreProjects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    // Merge: configured projects + firestore projects. Keep local adminCreated too.
                    const merged = [...firestoreProjects, ...configuredProjectsOnly()];
                    renderProjectsFromList(merged);
                });
        }
    } catch (_) {}

    return null;
}

function configuredProjectsOnly() {
    return (OSIRIS_CONFIG?.codingProjects || []).map((p) => ({
        ...p,
        kind: p.kind || 'Project',
        image: p.image || null,
        adminCreated: false
    }));
}

document.addEventListener('DOMContentLoaded', () => {
    initProjectComposer();
    initProjectsRealtime();
});

