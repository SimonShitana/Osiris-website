/**
 * Osiris Channel - one-way admin broadcasts with anonymous reactions and polls.
 */
const CHANNEL_KEY = 'osiris_channel_posts';
const CHANNEL_VOTES_KEY = 'osiris_channel_votes';

function getChannelPosts() {
    try { return JSON.parse(localStorage.getItem(CHANNEL_KEY) || '[]'); } catch { return []; }
}

function saveChannelPosts(posts) {
    localStorage.setItem(CHANNEL_KEY, JSON.stringify(posts));
    window.dispatchEvent(new CustomEvent('osiris-channel-update'));
}


function getChannelVotes() {
    try { return JSON.parse(localStorage.getItem(CHANNEL_VOTES_KEY) || '{}'); } catch { return {}; }
}

function saveChannelVotes(votes) {
    localStorage.setItem(CHANNEL_VOTES_KEY, JSON.stringify(votes));
}

function seedChannelIfEmpty() {
    if (getChannelPosts().length) return;
    const now = Date.now();
    saveChannelPosts([
        {
            id: 'seed-1',
            type: 'article',
            title: 'Welcome to the Osiris Channel',
            body: 'This is the official one-way Osiris broadcast channel. Admins publish updates, articles, polls, resources, and project news. Followers can react or vote privately.',
            category: 'motivation',
            image: null,
            pinned: true,
            author: 'Simon Shitana',
            createdAt: new Date(now - 86400000 * 2).toISOString(),
            reads: 487,
            reactions: { heart: 42, fire: 31, clap: 18 },
            poll: null
        },
        {
            id: 'seed-2',
            type: 'poll',
            title: 'What should Osiris upload next?',
            body: 'Vote privately. Your name, phone number, and profile picture are not shown to other followers.',
            category: 'resources',
            image: null,
            pinned: false,
            author: 'Simon Shitana',
            createdAt: new Date(now - 86400000).toISOString(),
            reads: 312,
            reactions: { heart: 20, fire: 12, clap: 9 },
            poll: {
                options: [
                    { text: 'Past papers', votes: 18 },
                    { text: 'Study guides', votes: 12 },
                    { text: 'Project tutorials', votes: 8 }
                ]
            }
        }
    ]);
}

function formatDate(iso) {
    return new Date(iso).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function postTypeIcon(type) {
    return {
        article: 'ri-article-line',
        poll: 'ri-bar-chart-grouped-line',
        project: 'ri-code-box-line',
        message: 'ri-broadcast-line'
    }[type] || 'ri-broadcast-line';
}

function renderPoll(post) {
    if (!post.poll?.options?.length) return '';
    const total = post.poll.options.reduce((sum, option) => sum + (option.votes || 0), 0) || 1;
    const votes = getChannelVotes();
    const voted = votes[`poll_${post.id}`];
    return `
        <div class="channel-poll">
            ${post.poll.options.map((option, index) => {
                const pct = Math.round(((option.votes || 0) / total) * 100);
                return `<button type="button" class="channel-poll__option ${voted === String(index) ? 'channel-poll__option--voted' : ''}" data-id="${post.id}" data-option="${index}" ${voted ? 'disabled' : ''}>
                    <span>${escapeHtml(option.text)}</span>
                    <strong>${pct}%</strong>
                    <i style="width:${pct}%"></i>
                </button>`;
            }).join('')}
            <small>${total} anonymous votes</small>
        </div>
    `;
}

function renderChannelFeed() {
    const feed = document.getElementById('channelFeed');
    const empty = document.getElementById('channelEmpty');
    if (!feed) return;

    const search = (document.getElementById('channelSearch')?.value || '').toLowerCase();
    const filter = document.getElementById('channelFilter')?.value || 'all';
    let posts = getChannelPosts();

    if (filter !== 'all') posts = posts.filter((p) => p.category === filter);
    if (search) posts = posts.filter((p) => `${p.title} ${p.body} ${p.category} ${p.type}`.toLowerCase().includes(search));

    posts.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (!posts.length) {
        feed.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
    }
    if (empty) empty.hidden = true;

    const votes = getChannelVotes();
    feed.innerHTML = posts.map((p) => `
        <article class="channel-post ${p.pinned ? 'channel-post--pinned' : ''}" data-id="${p.id}">
            <div class="channel-post__bubble">
                ${p.pinned ? '<span class="channel-post__pin"><i class="ri-pushpin-fill"></i> Pinned</span>' : ''}
                <div class="channel-post__header">
                    <img src="${OSIRIS_CONFIG?.assets?.channelAvatar || 'images/profile.jpg'}" alt="" class="channel-post__avatar">
                    <div>
                        <strong>${escapeHtml(p.author || 'Osiris Admin')}</strong>
                        <span class="channel-post__meta">${formatDate(p.createdAt)} · <span class="channel-post__cat channel-post__cat--${p.category}">${escapeHtml(p.category)}</span></span>
                    </div>
                    <span class="channel-post__type"><i class="${postTypeIcon(p.type)}"></i> ${escapeHtml(p.type || 'message')}</span>
                </div>
                <h2 class="channel-post__title">${escapeHtml(p.title)}</h2>
                <div class="channel-post__body">${escapeHtml(p.body).replace(/\n/g, '<br>')}</div>
                ${p.image ? `<div class="channel-post__image"><img src="${p.image}" alt="Broadcast image"></div>` : ''}
                ${renderPoll(p)}
                <div class="channel-privacy"><i class="ri-shield-check-line"></i> Followers are private. No phone numbers, profile photos, or names are shown.</div>
                <div class="channel-post__stats"><i class="ri-eye-line"></i> <span data-reads="${p.id}">${p.reads || 0}</span> reads</div>
                <div class="channel-post__actions">
                    <button type="button" class="channel-react ${votes[`react_${p.id}_heart`] ? 'channel-react--active' : ''}" data-id="${p.id}" data-type="heart">❤️ ${p.reactions?.heart || 0}</button>
                    <button type="button" class="channel-react ${votes[`react_${p.id}_fire`] ? 'channel-react--active' : ''}" data-id="${p.id}" data-type="fire">🔥 ${p.reactions?.fire || 0}</button>
                    <button type="button" class="channel-react ${votes[`react_${p.id}_clap`] ? 'channel-react--active' : ''}" data-id="${p.id}" data-type="clap">👏 ${p.reactions?.clap || 0}</button>
                </div>
                ${OsirisAuth?.isAdmin() ? `<div class="channel-post__admin">
                    <button type="button" class="btn btn--ghost btn--sm channel-pin" data-id="${p.id}">${p.pinned ? 'Unpin' : 'Pin'}</button>
                    <button type="button" class="btn btn--ghost btn--sm channel-delete" data-id="${p.id}">Delete</button>
                </div>` : ''}
            </div>
        </article>
    `).join('');

    feed.querySelectorAll('.channel-post').forEach((el) => {
        const id = el.dataset.id;
        if (!sessionStorage.getItem('read_' + id)) {
            const latest = getChannelPosts();
            const post = latest.find((p) => p.id === id);
            if (post) {
                post.reads = (post.reads || 0) + 1;
                saveChannelPosts(latest);
                sessionStorage.setItem('read_' + id, '1');
            }
        }
    });

    bindChannelEvents();
}

function bindChannelEvents() {
    document.querySelectorAll('.channel-react').forEach((btn) => {
        btn.onclick = () => {
            const voteKey = `react_${btn.dataset.id}_${btn.dataset.type}`;
            const votes = getChannelVotes();
            if (votes[voteKey]) return;
            const posts = getChannelPosts();
            const post = posts.find((p) => p.id === btn.dataset.id);
            if (!post) return;
            post.reactions = post.reactions || {};
            post.reactions[btn.dataset.type] = (post.reactions[btn.dataset.type] || 0) + 1;
            votes[voteKey] = true;
            saveChannelVotes(votes);
            saveChannelPosts(posts);
            renderChannelFeed();
        };
    });

    document.querySelectorAll('.channel-poll__option').forEach((btn) => {
        btn.onclick = () => {
            const votes = getChannelVotes();
            const voteKey = `poll_${btn.dataset.id}`;
            if (votes[voteKey]) return;
            const posts = getChannelPosts();
            const post = posts.find((p) => p.id === btn.dataset.id);
            const option = post?.poll?.options?.[Number(btn.dataset.option)];
            if (!option) return;
            option.votes = (option.votes || 0) + 1;
            votes[voteKey] = btn.dataset.option;
            saveChannelVotes(votes);
            saveChannelPosts(posts);
            renderChannelFeed();
        };
    });

    document.querySelectorAll('.channel-pin').forEach((btn) => {
        btn.onclick = () => {
            const posts = getChannelPosts();
            const post = posts.find((p) => p.id === btn.dataset.id);
            if (post) {
                post.pinned = !post.pinned;
                saveChannelPosts(posts);
                renderChannelFeed();
            }
        };
    });

    document.querySelectorAll('.channel-delete').forEach((btn) => {
        btn.onclick = () => {
            if (!confirm('Delete this broadcast?')) return;
            saveChannelPosts(getChannelPosts().filter((p) => p.id !== btn.dataset.id));
            renderChannelFeed();
        };
    });
}

function initAdminComposer() {
    const panel = document.getElementById('adminComposer');
    if (!panel || !OsirisAuth?.isAdmin()) {
        if (panel) panel.hidden = true;
        return;
    }
    panel.hidden = false;

    const form = document.getElementById('adminPostForm');
    const imageInput = document.getElementById('postImage');
    const postType = document.getElementById('postType');
    const pollWrap = document.getElementById('pollOptionsWrap');
    let imageData = null;

    postType?.addEventListener('change', () => {
        if (pollWrap) pollWrap.hidden = postType.value !== 'poll';
    });

    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) { imageData = null; return; }
        const reader = new FileReader();
        reader.onload = () => { imageData = reader.result; };
        reader.readAsDataURL(file);
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = postType?.value || 'message';
        const options = (document.getElementById('pollOptions')?.value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 6);
        if (type === 'poll' && options.length < 2) {
            document.getElementById('composerSuccess').textContent = 'Add at least two poll options.';
            return;
        }
        const posts = getChannelPosts();
        posts.unshift({
            id: 'post_' + Date.now(),
            type,
            title: document.getElementById('postTitle').value.trim(),
            body: document.getElementById('postBody').value.trim(),
            category: document.getElementById('postCategory').value,
            image: imageData,
            pinned: document.getElementById('postPinned').checked,
            author: 'Simon Shitana',
            createdAt: new Date().toISOString(),
            reads: 0,
            reactions: { heart: 0, fire: 0, clap: 0 },
            poll: type === 'poll' ? { options: options.map((text) => ({ text, votes: 0 })) } : null
        });
        saveChannelPosts(posts);
        OsirisNotifications?.broadcast?.('channel', posts[0].title, posts[0].body.slice(0, 120), 'channel.html');
        form.reset();
        if (pollWrap) pollWrap.hidden = true;
        imageData = null;
        renderChannelFeed();
        document.getElementById('composerSuccess').textContent = 'Broadcast published.';
        setTimeout(() => { document.getElementById('composerSuccess').textContent = ''; }, 3000);
    });
}

function initChannelDirectory() {
    const list = document.getElementById('directoryList');
    if (!list) return;
    const channels = [
        { name: 'Osiris Channel', category: 'education', country: 'Namibia', popularity: 1, badge: '#1' },
        { name: 'Engineering Support', category: 'engineering', country: 'Namibia', popularity: 2, badge: 'Popular' },
        { name: 'Student Resources', category: 'resources', country: 'Global', popularity: 3, badge: 'New' },
        { name: 'Civil Engineering Modules', category: 'engineering', country: 'Namibia', popularity: 4, badge: 'Modules' }
    ];

    const render = () => {
        const q = (document.getElementById('directorySearch')?.value || '').toLowerCase();
        const category = document.getElementById('directoryCategory')?.value || 'all';
        const country = document.getElementById('directoryCountry')?.value || 'all';
        const filtered = channels
            .filter((item) => item.name.toLowerCase().includes(q))
            .filter((item) => category === 'all' || item.category === category)
            .filter((item) => country === 'all' || item.country === country)
            .sort((a, b) => a.popularity - b.popularity);
        list.innerHTML = filtered.length
            ? filtered.map((item) => `<div class="channel-directory__item"><span>${escapeHtml(item.name)}<small>${escapeHtml(item.country)} · ${escapeHtml(item.category)}</small></span><strong>${escapeHtml(item.badge)}</strong></div>`).join('')
            : '<p class="channel-empty">No channels found.</p>';
    };

    ['directorySearch', 'directoryCategory', 'directoryCountry'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', render);
        document.getElementById(id)?.addEventListener('change', render);
    });
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('channelFeed')) return;
    seedChannelIfEmpty();
    renderChannelFeed();
    initAdminComposer();
    initChannelDirectory();

    document.getElementById('channelSearch')?.addEventListener('input', renderChannelFeed);
    document.getElementById('channelFilter')?.addEventListener('change', renderChannelFeed);

    window.addEventListener('storage', (e) => { if (e.key === CHANNEL_KEY) renderChannelFeed(); });
    window.addEventListener('osiris-channel-update', renderChannelFeed);

    const quote = document.getElementById('channelQuote');
    if (quote && OSIRIS_CONFIG?.motivationalQuotes?.length) {
        const q = OSIRIS_CONFIG.motivationalQuotes[Math.floor(Math.random() * OSIRIS_CONFIG.motivationalQuotes.length)];
        quote.innerHTML = `<i class="ri-double-quotes-l"></i> ${escapeHtml(q.text)} <span>- ${escapeHtml(q.author)}</span>`;
    }
});
