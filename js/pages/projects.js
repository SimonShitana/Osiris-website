const PROJECTS_KEY = 'osiris_admin_projects';
let unsubscribeProjects = null;

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
            ${isAdmin && p.adminCreated ? `<button type="button" class="btn btn--ghost btn--sm project-delete" data-id="${p.id}" data-source="${p.firestoreId ? 'firestore' : 'local'}" style="margin-top:1rem">Delete</button>` : ''}
        </article>
    `).join('');


    grid.querySelectorAll('.project-delete').forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (!confirm('Delete this project/article?')) return;
            try {
                if (btn.dataset.source === 'firestore') {
                    await OsirisDB.deleteProject(btn.dataset.id);
                } else {
                    saveAdminProjects(getAdminProjects().filter((p) => p.id !== btn.dataset.id));
                    renderProjects();
                }
            } catch (error) {
                console.error('Osiris: Could not delete project:', error);
                const msg = document.getElementById('projectMsg');
                if (msg) msg.textContent = 'Could not delete project. Please try again.';
            }
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

    document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('projectTitle').value.trim();
        const kind = document.getElementById('projectKind').value;
        const stack = document.getElementById('projectStack').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        const project = {
            title,
            kind,
            tag: kind,
            stack,
            description,
            status: 'Published',
            image: imageData,
            adminCreated: true
        };

        const submitButton = document.querySelector('#projectForm [type="submit"]');
        if (submitButton) submitButton.disabled = true;
        try {
            if (window.ModulusFirebase?.ready && window.OsirisDB?.publishProject) {
                await OsirisDB.publishProject(project);
            } else {
                const projects = getAdminProjects();
                projects.unshift({ ...project, id: 'project_' + Date.now(), createdAt: new Date().toISOString() });
                saveAdminProjects(projects);
            }
            e.target.reset();
            imageData = null;
            const msg = document.getElementById('projectMsg');
            if (msg) {
                msg.textContent = window.ModulusFirebase?.ready
                    ? 'Project published.'
                    : 'Published to personal projects on this device.';
                setTimeout(() => { msg.textContent = ''; }, 3000);
            }
        } catch (error) {
            console.error('Osiris: Could not publish project:', error);
            const msg = document.getElementById('projectMsg');
            if (msg) msg.textContent = 'Could not publish project. Please try again.';
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

function initProjectsRealtime() {
    unsubscribeProjects?.();
    unsubscribeProjects = null;

    // Render configured and local projects immediately, before Firebase initializes.
    renderProjectsFromList(allProjects());

    // Real-time Firestore updates if the helper is available.
    try {
        if (window.OsirisFirebase?.ready && OsirisFirebase.db) {
            const { collection, query, orderBy, limit, onSnapshot } = OsirisFirebase.firestoreUtils;
            return onSnapshot(
                query(collection(OsirisFirebase.db, 'projects'), orderBy('createdAt', 'desc'), limit(100)),
                (snap) => {
                    const firestoreProjects = snap.docs.map((d) => ({
                        id: d.id,
                        firestoreId: d.id,
                        adminCreated: true,
                        ...d.data()
                    }));
                    const merged = [...firestoreProjects, ...getAdminProjects(), ...configuredProjectsOnly()];
                    renderProjectsFromList(merged);
                },
                (error) => console.error('Osiris: Could not subscribe to Firestore projects:', error)
            );
        }
    } catch (error) {
        console.error('Osiris: Could not initialize Firestore projects:', error);
    }

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
    window.addEventListener('osiris-firebase-ready', initProjectsRealtime);
});
