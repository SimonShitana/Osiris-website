const MUSIC_KEY = 'osiris_music_tracks';
const TASKS_KEY_PREFIX = 'osiris_study_tasks_';

document.addEventListener('DOMContentLoaded', () => {
    const session = OsirisAuth?.getSession();
    if (!session) return;

    initStudyTabs();
    initStudyModules();
    initMusic();
    initTasks(session.email);
    initMotivation();
    initPdfPicker();
});

function initStudyTabs() {
    document.querySelectorAll('[data-study-tab]').forEach((tab) => {
        tab.addEventListener('click', () => {
            const id = tab.dataset.studyTab;
            document.querySelectorAll('[data-study-tab]').forEach((t) => t.classList.toggle('study-tab--active', t === tab));
            document.querySelectorAll('.study-panel').forEach((p) => p.classList.toggle('study-panel--active', p.id === `study-${id}`));
        });
    });
}

function initStudyModules() {
    window.renderStudyModules = () => {
        if (window.OsirisResources?.renderModuleFolders) {
            OsirisResources.renderModuleFolders('study-resources', 'studyModuleGrid', 'studyModuleSearch');
        }
    };
    renderStudyModules();
}

function getMusicTracks() {
    try {
        return JSON.parse(localStorage.getItem(MUSIC_KEY) || '[]');
    } catch { return []; }
}

function saveMusicTracks(tracks) {
    // IMPORTANT: do NOT store full audio files as base64 in localStorage.
    // localStorage quota will quickly be exceeded and break uploads.
    // We only persist lightweight metadata for custom tracks; audio playback
    // should come from server/Firestore or be reuploaded.
    try {
        const trimmed = (tracks || []).slice(0, 12).map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            file: null, // remove base64 payload
            fileName: t.fileName,
            uploaded: t.uploaded,
            uploadedAt: t.uploadedAt,
            source: t.source || 'custom'
        }));
        localStorage.setItem(MUSIC_KEY, JSON.stringify(trimmed));
    } catch (_) {
        // If quota still fails, skip persisting.
    }
}


async function getStaticMusicTracks() {
    const configured = Array.isArray(OSIRIS_CONFIG?.musicTracks) ? OSIRIS_CONFIG.musicTracks.filter((t) => t.file) : [];

    try {
        // Directory listing is often disabled on production hosts (Render), so we load
        // a pre-generated manifest instead.
        const manifestRes = await fetch('resources/music/manifest.json', { cache: 'no-store' });
        if (!manifestRes.ok) return configured;
        const files = await manifestRes.json();
        if (!Array.isArray(files) || !files.length) return configured;

        return files.map((filePath, index) => {
            const safeFile = String(filePath);
            const clean = safeFile.replace(/^resources\/music\//i, '');
            const displayName = decodeURIComponent(clean)
                .replace(/\.mp3$/i, '')
                .replace(/[_-]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return {
                id: `static-music-${index}`,
                title: displayName || `Track ${index + 1}`,
                artist: '',
                file: safeFile.startsWith('resources/music/') ? safeFile : `resources/music/${clean}`,
                source: 'static'
            };
        });

    } catch (_) {
        return configured;
    }
}

async function getAllMusicTracks() {
    const custom = getMusicTracks();
    const staticTracks = await getStaticMusicTracks();
    return [...staticTracks, ...custom];
}

function initMusic() {
    const panel = document.getElementById('musicAdminPanel');
    if (panel) panel.hidden = !OsirisAuth.isAdmin();

    const audio = document.getElementById('studyAudio');
    const list = document.getElementById('musicList');
    const modal = document.getElementById('musicModal');
    const modalTitle = document.getElementById('musicModalTitle');
    const openModalBtn = document.getElementById('musicOpenModal');
    const modalArtist = document.getElementById('musicModalArtist');
    const playBtn = document.getElementById('musicPlayPause');
    const nextBtn = document.getElementById('musicNext');
    const prevBtn = document.getElementById('musicPrev');
    const shuffleBtn = document.getElementById('musicShuffle');
    const repeatBtn = document.getElementById('musicRepeat');

    let queue = [];
    let currentIndex = -1;
    let shuffleMode = false;
    let repeatMode = false;
    let originalQueue = [];

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Could not read the audio file.'));
            reader.readAsDataURL(file);
        });
    }

    function updateNowPlaying(track, index) {
        if (!track) return;
        document.getElementById('nowPlayingTitle').textContent = track.title || 'Untitled track';
        document.getElementById('nowPlayingArtist').textContent = track.artist || '';
        modalTitle.textContent = track.title || 'Untitled track';
        modalArtist.textContent = track.artist || 'Saved by name';
        audio.dataset.index = String(index);
        playBtn.innerHTML = audio.paused ? '<i class="ri-play-fill"></i> Play' : '<i class="ri-pause-fill"></i> Pause';
    }

    function setQueue(tracks) {
        queue = tracks.filter((t) => t.file);
        originalQueue = [...queue];
        currentIndex = queue.findIndex((t, i) => String(i) === audio.dataset.index);
        if (currentIndex < 0 && queue.length) currentIndex = 0;
    }

    async function renderMusic() {
        const tracks = (await getAllMusicTracks()).filter((t) => t.file);
        setQueue(tracks);
        if (!tracks.length) {
            list.innerHTML = '<li style="cursor:default;color:var(--text-muted);padding:1rem;text-align:center">No tracks yet. Admin can upload .mp3 files above.</li>';
            return;
        }
        list.innerHTML = tracks.map((t, i) => `
            <li data-index="${i}" class="${audio.dataset.index == i ? 'music-list__active' : ''}">
                <span class="music-list__label">
                    <strong class="music-list__title">${escapeHtml(t.title || t.fileName || 'Untitled track')}</strong>
                </span>
                ${OsirisAuth.isAdmin() && t.uploaded ? `<button type="button" data-remove="${t.id}" class="btn btn--ghost btn--sm music-list__delete" title="Delete track"><i class="ri-delete-bin-line"></i></button>` : ''}
            </li>
        `).join('');

        list.querySelectorAll('li[data-index]').forEach((li) => {
            li.addEventListener('click', (e) => {
                if (e.target.closest('[data-remove]')) return;
                const idx = +li.dataset.index;
                playTrack(tracks[idx], idx);
                if (modal) modal.hidden = false;
            });
        });
        list.querySelectorAll('[data-remove]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!confirm('Delete this track? It will be removed for all users.')) return;
                const custom = getMusicTracks().filter((t) => t.id !== btn.dataset.remove);
                saveMusicTracks(custom);
                renderMusic();
            });
        });
    }

    function playTrack(track, index) {
        if (!track || !track.file) return;
        currentIndex = index;
        audio.src = track.file;
        updateNowPlaying(track, index);
        audio.play().catch(() => {});
        if (modal) modal.hidden = false;
        renderMusic();
    }

    function playCurrent() {
        if (!queue.length) return;
        const track = queue[currentIndex] || queue[0];
        if (!track) return;
        playTrack(track, queue.indexOf(track));
    }

    function nextTrack() {
        if (!queue.length) return;
        if (shuffleMode) {
            currentIndex = Math.floor(Math.random() * queue.length);
        } else {
            currentIndex = (currentIndex + 1 + queue.length) % queue.length;
        }
        playCurrent();
    }

    function prevTrack() {
        if (!queue.length) return;
        currentIndex = (currentIndex - 1 + queue.length) % queue.length;
        playCurrent();
    }

    function toggleShuffle() {
        shuffleMode = !shuffleMode;
        shuffleBtn.classList.toggle('music-btn--active', shuffleMode);
        shuffleBtn.setAttribute('aria-pressed', String(shuffleMode));
        OsirisNotify?.info('Shuffle', shuffleMode ? 'Shuffle is on.' : 'Shuffle is off.');
    }

    function toggleRepeat() {
        repeatMode = !repeatMode;
        repeatBtn.classList.toggle('music-btn--active', repeatMode);
        repeatBtn.setAttribute('aria-pressed', String(repeatMode));
        OsirisNotify?.info('Repeat', repeatMode ? 'Repeat is on.' : 'Repeat is off.');
    }

    openModalBtn?.addEventListener('click', () => { if (modal) modal.hidden = false; });
    playBtn?.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
        playBtn.innerHTML = audio.paused ? '<i class="ri-play-fill"></i> Play' : '<i class="ri-pause-fill"></i> Pause';
    });
    nextBtn?.addEventListener('click', nextTrack);
    prevBtn?.addEventListener('click', prevTrack);
    shuffleBtn?.addEventListener('click', toggleShuffle);
    repeatBtn?.addEventListener('click', toggleRepeat);
    document.getElementById('musicModalClose')?.addEventListener('click', () => { if (modal) modal.hidden = true; });
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

    audio?.addEventListener('play', () => {
        if (queue.length) {
            const index = Number(audio.dataset.index ?? currentIndex);
            if (queue[index]) updateNowPlaying(queue[index], index);
        }
        playBtn.innerHTML = '<i class="ri-pause-fill"></i> Pause';
    });
    audio?.addEventListener('pause', () => {
        playBtn.innerHTML = '<i class="ri-play-fill"></i> Play';
    });
    audio?.addEventListener('ended', () => {
        if (repeatMode) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
            return;
        }
        nextTrack();
    });

    renderMusic();

    const fileInput = document.getElementById('musicFile');
    const uploadForm = document.getElementById('musicUploadForm');

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file && !document.getElementById('musicTitle').value.trim()) {
            document.getElementById('musicTitle').value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        }
    });

    uploadForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput?.files?.[0];
        if (!file) {
            OsirisNotify?.warning('No file', 'Please select an MP3 file first.');
            return;
        }

        const title = document.getElementById('musicTitle').value.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        const artist = document.getElementById('musicArtist').value.trim();

        try {
            // Do not store the full mp3 as base64 in localStorage.
            // Persist lightweight metadata only; audio should play from server/static.
            const tracks = getMusicTracks();
            tracks.unshift({
                id: 'music_' + Date.now(),
                title,
                artist,
                file: null,
                fileName: file.name,
                uploaded: true,
                uploadedAt: new Date().toISOString(),
                source: 'custom'
            });
            saveMusicTracks(tracks);
            uploadForm.reset();
            await renderMusic();
            OsirisNotify?.success('Track added', `${title} added. (Custom audio is not persisted locally to avoid quota issues.)`);
        } catch (error) {
            OsirisNotify?.error('Upload Error', error.message || 'Could not read the audio file.');
        }

    });
}

function initTasks(email) {
    const key = TASKS_KEY_PREFIX + email;
    const listEl = document.getElementById('taskList');

    function getTasks() {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    }

    function saveTasks(tasks) {
        localStorage.setItem(key, JSON.stringify(tasks));
    }

    function render() {
        const tasks = getTasks();
        listEl.innerHTML = tasks.length
            ? tasks.map((t) => `<li class="${t.done ? 'done' : ''}">
                <input type="checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''}>
                <span>${escapeHtml(t.text)}</span>
                <button type="button" data-del="${t.id}"><i class="ri-close-line"></i></button>
            </li>`).join('')
            : '<li style="color:var(--text-muted);border:none">No tasks yet — add one above.</li>';

        listEl.querySelectorAll('input[type=checkbox]').forEach((cb) => {
            cb.addEventListener('change', () => {
                const tasks = getTasks();
                const task = tasks.find((t) => t.id === cb.dataset.id);
                if (task) task.done = cb.checked;
                saveTasks(tasks);
                render();
            });
        });
        listEl.querySelectorAll('[data-del]').forEach((btn) => {
            btn.addEventListener('click', () => {
                saveTasks(getTasks().filter((t) => t.id !== btn.dataset.del));
                render();
            });
        });
    }

    document.getElementById('taskForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        if (!text) return;
        const tasks = getTasks();
        tasks.unshift({ id: 't_' + Date.now(), text, done: false });
        saveTasks(tasks);
        input.value = '';
        render();
    });

    render();
}

function initMotivation() {
    const el = document.getElementById('motivationQuote');
    const quotes = OSIRIS_CONFIG?.motivationalQuotes || [];

    function showQuote() {
        const q = quotes[Math.floor(Math.random() * quotes.length)] || { text: 'Keep going.', author: 'Osiris' };
        el.innerHTML = `<blockquote>"${escapeHtml(q.text)}"</blockquote><cite>— ${escapeHtml(q.author)}</cite>`;
    }

    showQuote();
    document.getElementById('newQuoteBtn')?.addEventListener('click', showQuote);
}

function initPdfPicker() {
    const select = document.getElementById('studyPdfSelect');
    const resources = window.OsirisResources?.getAllResources?.() || [];
    resources.filter((r) => r.file).forEach((r) => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.title;
        select.appendChild(opt);
    });

    document.getElementById('studyPdfOpen')?.addEventListener('click', () => {
        const id = select.value;
        if (id) OsirisResources.openPdf(id);
    });

    document.getElementById('studyPdfUpload')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const id = 'local_pdf_' + Date.now();
            if (!window._studyLocalPdfs) window._studyLocalPdfs = [];
            window._studyLocalPdfs.push({ id, title: file.name, file: reader.result });
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = file.name;
            select.appendChild(opt);
            select.value = id;
            openLocalPdf(id);
        };
        reader.readAsDataURL(file);
    });
}

function openLocalPdf(id) {
    const pdf = window._studyLocalPdfs?.find((p) => p.id === id);
    if (pdf && window.OsirisResources) {
        const orig = OsirisResources.getAllResources;
        OsirisResources.getAllResources = () => [...(orig?.() || []), ...(window._studyLocalPdfs || [])];
        OsirisResources.openPdf(id);
        OsirisResources.getAllResources = orig;
    }
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}
