/**

 * PDF resources — view in-browser (PDF.js + iframe fallback for file://)

 */

let pdfModal, pdfCanvas, pdfCtx, pdfIframe, pdfBody, currentPdf = null;

let currentPage = 1, totalPages = 1, currentResource = null, viewMode = 'canvas';

let openModuleFolders = new Set();

const RESOURCE_UPLOADS_KEY = 'osiris_module_resources';

const STATIC_HIDDEN_KEY = 'osiris_hidden_static_resources';

const UNIVERSITY_MODULES = [

    'Skills Portfolio',

    // Existing

    'Academic Literacy I', 'Academic Literacy II', 'Digital Literacy', 'National and Global Citizenship',

    'Introduction to Civil Engineering', 'Engineering Mathematics I', 'Engineering Mathematics Support I', 'Engineering Drawing',

    'Physics for Engineers I', 'Physics for Engineers Support I', 'Chemistry for Engineers', 'Chemistry for Engineers Support',

    'Computing Fundamentals', 'Engineering Mathematics II', 'Engineering Mathematics Support II', 'Physics for Engineers II',

    'Physics for Engineers Support II', 'Materials Science', 'Fundamentals of Electrical Engineering', 'Engineering Mechanics I',

    'Engineering Mechanics II', 'Statistics for Engineers', 'Engineering Entrepreneurship', 'Workshop Practice', 'Engineering Mathematics III',

    'Engineering Economics', 'Computer Programming I', 'Introduction to Engineering Geology', 'Strength of Materials',

    'Theory of Structures I', 'Fluid Mechanics I', 'Building Materials', 'Surveying for Engineers', 'Theory of Structures II',

    'Engineering Mathematics IV', 'Structural Design I', 'Urban Engineering', 'Construction Management', 'Hydrology for Engineers',

    'Transportation Engineering I', 'Water Treatment', 'Technical Writing', 'Hydraulics and Hydro-Engineering',

    'Structural Design II', 'Environmental Engineering', 'Geotechnical Engineering I', 'Transportation Engineering II',

    'Research Methods and Experimental Design', 'Wastewater Treatment', 'Structural Design III', 'Geotechnical Engineering II',

    'Transportation Engineering III', 'Industrial Training', 'Project Management', 'Civil Engineering Design Project',

    'Research Project', 'Engineering Ethics and Practice', 'Introduction to Electrical, Electronics and Computer Engineering',

    'Electrical Circuit Analysis I', 'Computer Networks', 'Analogue Electronics I', 'Computer Programming II',

    'Electrical Circuit Analysis II', 'Digital Electronics', 'Signals and Systems', 'Measurements and Instrumentation',

    'Microprocessor Systems', 'Machine Learning', 'Applied Electromagnetics', 'Analogue Electronics II',

    'Electronic Product Development', 'Analogue and Digital Communication', 'Microcontroller Architecture and Programming',

    'RF and Microwave Engineering', 'Database Systems', 'Operating Systems', 'Control Engineering', 'Embedded Systems and Robotics',

    'Wireless Communication', 'Digital Signal Processing', 'Computer Software Engineering',

    // Newly added folders under resources/pdfs/ (from your folder list)

    'Academic Literacy',

    'Academic literacy II',

    'Engineering Physics 2',

    'Engineerin Economics',

    'engineering entrepreneurship',

    'engineering-mechanics-ii',

    'Fundamental of Electrical engineering',

    'Physics for engineers 1st year',

    'workshops',

    'Mechanics-2',

    'math for engineers',

    'Math for Engineers',

    'Math for Engineers/1 Study guide.pdf',

    'Math for Engineers/Chapter 1 (Functions).pdf',

    'Math for Engineers/Chapter 2 (Differentition).pdf',

    'Math for Engineers/Chapter 3 (Integration).pdf',

    'Math for Engineers/Chapter 4 (Sequences and Series of Numbers).pdf',

    'Math for Engineers/Chapter 5 (Polar Coordinates).pdf',

    'Math for Engineers/Chapter 6 (Lines & Planes).pdf',

    'Math for Engineers/Chapter 7 (Systems of Linear Equations).pdf',


    'Chem for engineers',

    'Computing Fundamentals',

    'Engineering Economics',

    'Engineering Drawing',

    'Engineering Entrepreneurship',

    'Engineering Math 2',

    'Math for Engineers',


    'Engineering Mechanics II',

    'Fundamental of Electrical Engineering',

    'Introduction to Mechanical Engineering',

    'Mechanics-2',

    'Physics for Engineers 1st year',

    'Workshops'

];




function initPdfViewer() {

    if (!document.getElementById('resourceListContainer') && !document.getElementById('studyModuleGrid')) return;



    if (typeof pdfjsLib !== 'undefined') {

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    }



    pdfModal = document.getElementById('pdfModal');

    pdfCanvas = document.getElementById('pdfCanvas');

    pdfIframe = document.getElementById('pdfIframe');

    pdfBody = document.getElementById('pdfModalBody');

    if (pdfCanvas) pdfCtx = pdfCanvas.getContext('2d');



    renderResourceLists();

    initResourceUpload();

    bindPdfModalControls();

}



function getHiddenStaticIds() {

    try { return JSON.parse(localStorage.getItem(STATIC_HIDDEN_KEY) || '[]'); } catch { return []; }

}



function hideStaticResource(id) {

    const hidden = getHiddenStaticIds();

    if (!hidden.includes(id)) {

        hidden.push(id);

        localStorage.setItem(STATIC_HIDDEN_KEY, JSON.stringify(hidden));

    }

}



function getStaticModuleResources(moduleName) {

    const hidden = getHiddenStaticIds();

    const items = (OSIRIS_CONFIG?.moduleResources?.[moduleName] || [])

        .filter((item) => !hidden.includes(item.id))

        .map((item) => ({ ...item, static: true }));

    return items;

}



function getUploadedResources() {

    try { return JSON.parse(localStorage.getItem(RESOURCE_UPLOADS_KEY) || '[]'); } catch { return []; }

}



function saveUploadedResources(items) {

    localStorage.setItem(RESOURCE_UPLOADS_KEY, JSON.stringify(items));

}



function getAllResources() {

    const staticModule = Object.values(OSIRIS_CONFIG?.moduleResources || {}).flat();

    return [...(OSIRIS_CONFIG?.pdfResources || []), ...staticModule, ...getUploadedResources()];

}



function getModuleResources(moduleName) {

    const uploads = getUploadedResources().filter((item) => item.module === moduleName);

    return [...getStaticModuleResources(moduleName), ...uploads];

}



function renderResourceLists() {

    const container = document.getElementById('resourceListContainer');

    if (!container || !OSIRIS_CONFIG?.pdfResources) return;



    renderModuleFolders('tab-modules', 'moduleGrid', 'moduleSearch');



    const tabs = { guides: 'tab-guides', ebooks: 'tab-ebooks', toolkits: 'tab-toolkits', papers: 'tab-papers' };

    Object.entries(tabs).forEach(([cat, tabId]) => {

        const panel = document.getElementById(tabId);

        if (!panel) return;

        const hidden = getHiddenStaticIds();

        const items = OSIRIS_CONFIG.pdfResources.filter((r) => r.category === cat && !hidden.includes(r.id));

        const ul = document.createElement('ul');

        ul.className = 'resource-list';

        ul.innerHTML = items.length

            ? items.map((r) => renderResourceListItem(r)).join('')

            : '<li style="color:var(--text-muted);padding:1rem 0">No files in this category yet.</li>';

        const existing = panel.querySelector('.resource-list');

        if (existing) existing.replaceWith(ul);

        else panel.appendChild(ul);

    });



    container.querySelectorAll('.resource-view').forEach((btn) => {

        btn.addEventListener('click', () => openPdf(btn.dataset.id));

    });

    container.querySelectorAll('.resource-download').forEach((btn) => {

        btn.addEventListener('click', () => downloadPdf(btn.dataset.id));

    });

    container.querySelectorAll('.resource-delete').forEach((btn) => {

        btn.addEventListener('click', () => deleteResource(btn.dataset.id, btn.dataset.type));

    });

}



function renderResourceListItem(r) {

    const adminDel = OsirisAuth?.isAdmin()

        ? `<button type="button" class="btn btn--ghost btn--sm resource-delete" data-id="${r.id}" data-type="static"><i class="ri-delete-bin-line"></i></button>`

        : '';

    return `<li class="resource-item">

        <span><i class="ri-file-pdf-line"></i> ${r.title}</span>

        <div class="resource-item__actions">

            <button type="button" class="btn btn--ghost btn--sm resource-view" data-id="${r.id}"><i class="ri-eye-line"></i> Read</button>

            <button type="button" class="btn btn--primary btn--sm resource-download" data-id="${r.id}"><i class="ri-download-line"></i> Download</button>

            ${adminDel}

        </div>

    </li>`;

}



const moduleGridsBound = new Set();

function renderModuleFolders(panelId, gridId, searchId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    if (panel.dataset.modulesReady !== 'true') {
        if (!panel.querySelector(`#${gridId}`)) {
            panel.innerHTML = `
                <div class="module-search">
                    <input type="search" id="${searchId}" placeholder="Search modules..." autocomplete="off">
                </div>
                <div class="module-grid" id="${gridId}"></div>
            `;
        }
        document.getElementById(searchId)?.addEventListener('input', () => renderModuleGrid(gridId, searchId));
        bindModuleGrid(gridId);
        panel.dataset.modulesReady = 'true';
    }

    renderModuleGrid(gridId, searchId);
}

function bindModuleGrid(gridId) {
    if (moduleGridsBound.has(gridId)) return;
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        const header = e.target.closest('.module-folder__header');
        if (header) {
            e.preventDefault();
            e.stopPropagation();
            const folder = header.closest('.module-folder');
            if (!folder) return;
            const moduleName = folder.dataset.module;
            const willOpen = !folder.classList.contains('module-folder--open');
            folder.classList.toggle('module-folder--open', willOpen);
            header.setAttribute('aria-expanded', String(willOpen));
            if (willOpen) openModuleFolders.add(moduleName);
            else openModuleFolders.delete(moduleName);
            return;
        }

        const openBtn = e.target.closest('.module-open');
        if (openBtn) {
            e.preventDefault();
            e.stopPropagation();
            openPdf(openBtn.dataset.id);
            return;
        }

        const delBtn = e.target.closest('.module-delete');
        if (delBtn) {
            e.preventDefault();
            e.stopPropagation();
            deleteResource(delBtn.dataset.id, delBtn.dataset.type);
        }
    });

    moduleGridsBound.add(gridId);
}

function renderModuleGrid(gridId, searchId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const q = (document.getElementById(searchId)?.value || '').toLowerCase();
    const modules = UNIVERSITY_MODULES.filter((name) => name.toLowerCase().includes(q));

    grid.innerHTML = modules.map((name) => {
        const count = getModuleResources(name).length;
        const isOpen = openModuleFolders.has(name);
        return `<div class="module-folder${isOpen ? ' module-folder--open' : ''}" data-module="${escapeAttr(name)}">
            <button type="button" class="module-folder__header" aria-expanded="${isOpen}">
                <span><i class="ri-folder-3-line"></i> ${escapeHtml(name)}</span>
                <strong>${count} file${count === 1 ? '' : 's'}</strong>
                <i class="ri-arrow-down-s-line module-folder__chevron"></i>
            </button>
            <div class="module-folder__files">
                ${renderModuleFiles(name)}
                ${OsirisAuth?.isAdmin() ? `<div style="margin-top:0.75rem;display:flex;gap:0.5rem;justify-content:flex-end;">
                    <button type="button" class="btn btn--ghost btn--sm module-folder-hide" data-module="${escapeAttr(name)}" title="Hide this module from everyone">Hide folder</button>
                </div>` : ''}
            </div>
        </div>`;
    }).join('');
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

function renderModuleFiles(moduleName) {

    const items = getModuleResources(moduleName);

    if (!items.length) return '<p class="module-empty">No files yet. Admin can upload or add PDFs to the module folder on the server.</p>';

    return items.map((item) => `<div class="module-file">

        <div><strong>${item.title}</strong><span>${item.type || 'Resource'}${item.folder ? ` · ${escapeHtml(item.folder)}` : ''}</span></div>

        <div class="resource-item__actions">

            <button type="button" class="btn btn--ghost btn--sm module-open" data-id="${item.id}"><i class="ri-eye-line"></i> Open</button>

            ${OsirisAuth?.isAdmin() ? `<button type="button" class="btn btn--ghost btn--sm module-delete" data-id="${item.id}" data-type="${item.uploaded ? 'upload' : 'static'}"><i class="ri-delete-bin-line"></i></button>` : ''}

        </div>

    </div>`).join('');

}



function deleteResource(id, type) {

    if (!OsirisAuth?.isAdmin()) return;

    if (!confirm('Delete this resource? Students will no longer see it.')) return;

    if (type === 'upload') {

        saveUploadedResources(getUploadedResources().filter((item) => item.id !== id));

    } else {

        hideStaticResource(id);

    }

    OsirisNotifications?.broadcast?.('resource', 'Resource removed', 'An admin removed a resource from the library.');

    renderResourceLists();
    if (window.renderStudyModules) window.renderStudyModules();
}

function refreshModuleGrids() {
    renderModuleGrid('moduleGrid', 'moduleSearch');
    if (document.getElementById('studyModuleGrid')) {
        renderModuleGrid('studyModuleGrid', 'studyModuleSearch');
    }
}



function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsDataURL(file);
    });
}

function initResourceUpload() {

    const panel = document.getElementById('resourceAdminPanel');

    if (panel) panel.hidden = !OsirisAuth?.isAdmin();



    const datalist = document.getElementById('moduleNameList');

    if (datalist) datalist.innerHTML = UNIVERSITY_MODULES.map((name) => `<option value="${name}"></option>`).join('');



    const fileInput = document.getElementById('resourceFile');






    document.getElementById('resourceUploadForm')?.addEventListener('submit', async (e) => {

        e.preventDefault();

        const file = fileInput?.files?.[0];

        if (!file) {

            document.getElementById('resourceUploadMsg').textContent = 'Choose a PDF or image first.';

            return;

        }

        const moduleName = document.getElementById('resourceModule').value.trim();
        const title = document.getElementById('resourceTitle').value.trim();
        const folder = document.getElementById('resourceFolder').value.trim();

        if (!moduleName || !title) {
            document.getElementById('resourceUploadMsg').textContent = 'Module name and resource title are required.';
            return;
        }

        try {

            const fileData = await readFileAsDataURL(file);

            const items = getUploadedResources();

            items.unshift({

                id: 'upload_' + Date.now(),

                module: moduleName,

                title,

                folder,

                type: document.getElementById('resourceType').value,

                file: fileData,

                fileName: file.name,

                uploaded: true,

                createdAt: new Date().toISOString()

            });

            saveUploadedResources(items);

            if (!UNIVERSITY_MODULES.includes(moduleName)) UNIVERSITY_MODULES.unshift(moduleName);

            e.target.reset();

            renderResourceLists();

            OsirisNotifications?.broadcast?.('resource', 'New resource uploaded', `${title} was added to ${moduleName}${folder ? ` / ${folder}` : ''}.`);

            document.getElementById('resourceUploadMsg').textContent = 'Added to module folder.';

            setTimeout(() => { document.getElementById('resourceUploadMsg').textContent = ''; }, 3000);

        } catch (error) {
            document.getElementById('resourceUploadMsg').textContent = error.message || 'Could not upload the file.';
        }

    });

}



function encodeLocalPath(path) {

    if (!path || path.startsWith('data:')) return path;

    return path.split('/').map((part) => encodeURIComponent(part)).join('/');

}



async function resolvePdfUrl(resource) {

    if (resource.file?.startsWith('data:')) return resource.file;

    const localPath = encodeLocalPath(resource.file);



    if (location.protocol === 'file:') return localPath;



    try {

        const res = await fetch(resource.file, { method: 'HEAD' });

        if (res.ok) return resource.file;

    } catch (_) { /* fallback below */ }



    return resource.demo || resource.file;

}



function setPdfLoading(loading) {

    if (!pdfBody) return;

    let loader = pdfBody.querySelector('.pdf-modal__loading');

    if (loading) {

        if (!loader) {

            loader = document.createElement('div');

            loader.className = 'pdf-modal__loading';

            loader.innerHTML = '<i class="ri-loader-4-line"></i><p>Loading PDF…</p>';

            pdfBody.appendChild(loader);

        }

        loader.hidden = false;

    } else if (loader) {

        loader.hidden = true;

    }

}



function showCanvasMode() {

    viewMode = 'canvas';

    if (pdfCanvas) pdfCanvas.hidden = false;

    if (pdfIframe) { pdfIframe.hidden = true; pdfIframe.src = 'about:blank'; }

    pdfBody?.classList.remove('pdf-modal__body--iframe');

    document.getElementById('pdfPrev')?.removeAttribute('hidden');

    document.getElementById('pdfNext')?.removeAttribute('hidden');

    document.getElementById('pdfPageInfo')?.removeAttribute('hidden');

}



function showIframeMode(url) {

    viewMode = 'iframe';

    if (pdfCanvas) pdfCanvas.hidden = true;

    if (pdfIframe) {

        pdfIframe.hidden = false;

        pdfIframe.src = url;

    }

    pdfBody?.classList.add('pdf-modal__body--iframe');

    document.getElementById('pdfPrev')?.setAttribute('hidden', '');

    document.getElementById('pdfNext')?.setAttribute('hidden', '');

    const pageInfo = document.getElementById('pdfPageInfo');

    if (pageInfo) {

        pageInfo.textContent = 'Scroll to read';

        pageInfo.removeAttribute('hidden');

    }

}



async function openPdf(id) {

    const resource = getAllResources().find((r) => r.id === id);

    if (!resource || !pdfModal) return;



    currentResource = resource;

    currentPage = 1;

    currentPdf = null;

    document.getElementById('pdfModalTitle').textContent = resource.title;

    pdfModal.hidden = false;

    pdfModal.classList.remove('pdf-modal--fullscreen');

    document.body.style.overflow = 'hidden';

    setPdfLoading(true);

    showCanvasMode();



    const url = await resolvePdfUrl(resource);



    if (location.protocol === 'file:') {

        setPdfLoading(false);

        showIframeMode(url);

        return;

    }



    if (resource.file?.startsWith('data:image')) {

        setPdfLoading(false);

        showIframeMode(url);

        return;

    }



    if (typeof pdfjsLib === 'undefined') {

        setPdfLoading(false);

        showIframeMode(url);

        return;

    }



    try {

        const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false });

        currentPdf = await loadingTask.promise;

        totalPages = currentPdf.numPages;

        document.getElementById('pdfPageInfo').textContent = `Page ${currentPage} of ${totalPages}`;

        setPdfLoading(false);

        showCanvasMode();

        await renderPdfPage();

    } catch (err) {

        console.warn('PDF.js failed, using iframe:', err);

        setPdfLoading(false);

        showIframeMode(url);

        OsirisNotify?.warning('Viewer fallback', 'Opened PDF in embedded reader. Use Download if pages do not appear.');

    }

}



async function renderPdfPage() {

    if (!currentPdf || !pdfCanvas || viewMode !== 'canvas') return;

    const page = await currentPdf.getPage(currentPage);

    const scale = Math.min(1.6, (pdfBody?.clientWidth || 800) / page.getViewport({ scale: 1 }).width);

    const viewport = page.getViewport({ scale });

    pdfCanvas.height = viewport.height;

    pdfCanvas.width = viewport.width;

    await page.render({ canvasContext: pdfCtx, viewport }).promise;

    document.getElementById('pdfPageInfo').textContent = `Page ${currentPage} of ${totalPages}`;

}



function bindPdfModalControls() {

    document.getElementById('pdfClose')?.addEventListener('click', closePdfModal);

    document.getElementById('pdfFullscreen')?.addEventListener('click', () => {

        pdfModal?.classList.toggle('pdf-modal--fullscreen');

    });

    document.getElementById('pdfPrev')?.addEventListener('click', async () => {

        if (currentPage > 1) { currentPage--; await renderPdfPage(); }

    });

    document.getElementById('pdfNext')?.addEventListener('click', async () => {

        if (currentPage < totalPages) { currentPage++; await renderPdfPage(); }

    });

    document.getElementById('pdfDownloadBtn')?.addEventListener('click', () => {

        if (currentResource) downloadPdf(currentResource.id);

    });

    document.getElementById('pdfOpenTab')?.addEventListener('click', async () => {

        if (!currentResource) return;

        const url = await resolvePdfUrl(currentResource);

        window.open(url, '_blank', 'noopener');

    });

    pdfModal?.addEventListener('click', (e) => { if (e.target === pdfModal) closePdfModal(); });

    document.addEventListener('keydown', (e) => {

        if (e.key === 'Escape' && pdfModal && !pdfModal.hidden) closePdfModal();

    });

}



function closePdfModal() {

    if (pdfModal) pdfModal.hidden = true;

    document.body.style.overflow = '';

    currentPdf = null;

    if (pdfIframe) pdfIframe.src = 'about:blank';

}



async function downloadPdf(id) {

    const resource = getAllResources().find((r) => r.id === id);

    if (!resource) return;

    const url = await resolvePdfUrl(resource);

    const a = document.createElement('a');

    a.href = url;

    a.download = resource.title.replace(/\s+/g, '-').toLowerCase() + '.pdf';

    a.target = '_blank';

    a.rel = 'noopener';

    document.body.appendChild(a);

    a.click();

    a.remove();

    OsirisNotify?.success('Download started', resource.title);

}



window.OsirisResources = {

    getModuleResources,

    getAllResources,

    openPdf,

    renderModuleFolders,

    UNIVERSITY_MODULES

};



document.addEventListener('DOMContentLoaded', initPdfViewer);


