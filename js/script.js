document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initScrollProgress();
    initNavigation();
    initHeaderScroll();
    initScrollReveal();
    initDynamicYear();
    initAcademicStatus();
    initContactForm();
    initQuoteRotator();
    initImpactCounters();
    initPoll();
    initQuiz();
    initAnonymousQA();
    initForum();
    initAIChat();
    initEventsCalendar();
    initResourceTabs();
    initHubTabs();
    initHashNavigation();
    initCardTilt();
    initGoogleFormLinks();
    initPeerEducatorEmail();
});

function initHashNavigation() {
    const hashMap = {
        '#peer-education': 'hub-peer',
        '#stories': 'hub-stories',
        '#clubs': 'hub-clubs',
        '#career': 'hub-career',
        '#media': 'hub-media',
        '#interactive': 'hub-interactive',
        '#join': 'hub-peer',
        '#feedback': 'hub-interactive'
    };
    const hash = window.location.hash;
    if (!hash) return;
    const hubId = hashMap[hash];
    if (hubId) {
        const tab = document.querySelector(`.hub-tab[data-hub="${hubId}"]`);
        if (tab) tab.click();
    }
    const target = document.querySelector(hash);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
}

function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    window.addEventListener('load', () => {
        setTimeout(() => preloader.classList.add('preloader--hidden'), 600);
    });
    setTimeout(() => preloader.classList.add('preloader--hidden'), 2500);
}

function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = docHeight > 0 ? `${(scrollTop / docHeight) * 100}%` : '0%';
    }, { passive: true });
}

function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    const toggle = () => {
        const scrolled = window.scrollY > 50;
        header.classList.toggle('header--scrolled', scrolled);
        if (header.classList.contains('header--transparent')) {
            header.style.background = scrolled ? '' : 'transparent';
        }
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
}

function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal--visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => observer.observe(el));
}

function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('navbarMenu');
    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
        menu.classList.toggle('navbar__menu--open');
        hamburger.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('navbar__menu--open') ? 'hidden' : '';
    });

    document.querySelectorAll('.navbar__link').forEach((link) => {
        link.addEventListener('click', () => {
            menu.classList.remove('navbar__menu--open');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

function initDynamicYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach((el) => { el.textContent = year; });
}

function initAcademicStatus() {
    if (typeof getAcademicStatus !== 'function') return;
    const status = getAcademicStatus();
    const timeline = getGraduationTimeline();
    document.querySelectorAll('[data-academic-status]').forEach((el) => { el.textContent = status; });
    document.querySelectorAll('[data-academic-timeline]').forEach((el) => { el.textContent = timeline.label; });
}

function initContactForm() {
    const form = document.getElementById('messageForm');
    const reply = document.getElementById('form-reply');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = OSIRIS_CONFIG?.founder?.email || 'simonshitana21@gmail.com';

        if (reply) {
            reply.textContent = `Message received. Simon will reply within 24 hours at ${email}.`;
        }
        form.reset();
    });
}

function initQuoteRotator() {
    const container = document.getElementById('rotatingQuote');
    if (!container || !OSIRIS_CONFIG?.motivationalQuotes?.length) return;
    let index = 0;
    const quotes = OSIRIS_CONFIG.motivationalQuotes;
    const render = () => {
        const q = quotes[index];
        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = `<i class="ri-double-quotes-l"></i><p>${q.text}</p><span>— ${q.author}</span>`;
            container.style.opacity = '1';
        }, 300);
        index = (index + 1) % quotes.length;
    };
    container.style.transition = 'opacity 0.4s ease';
    render();
    setInterval(render, 7000);
}

function initImpactCounters() {
    const metrics = OSIRIS_CONFIG?.impactMetrics;
    if (!metrics) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const key = el.dataset.metric;
            const target = metrics[key];
            if (target == null) return;
            const suffix = el.dataset.suffix || '';
            const duration = 2000;
            const start = performance.now();
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 4);
                el.textContent = Math.floor(target * eased) + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-metric]').forEach((el) => observer.observe(el));
}

function initPoll() {
    const poll = document.getElementById('communityPoll');
    if (!poll) return;
    const storageKey = 'osiris_poll_vote';
    const results = document.getElementById('pollResults');
    const options = poll.querySelectorAll('.poll-option');
    const counts = JSON.parse(localStorage.getItem(storageKey + '_counts') || '{"workshops":0,"mentoring":0,"resources":0,"social":0}');
    const showResults = () => {
        const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
        results.innerHTML = Object.entries(counts).map(([key, count]) => {
            const pct = Math.round((count / total) * 100);
            const labels = { workshops: 'More workshops', mentoring: 'More mentoring', resources: 'More resources', social: 'More social events' };
            return `<div class="poll-bar"><span>${labels[key]}</span><div class="poll-bar__track"><div class="poll-bar__fill" style="width:${pct}%"></div></div><strong>${pct}%</strong></div>`;
        }).join('');
        results.hidden = false;
        options.forEach((btn) => { btn.disabled = true; });
    };
    if (localStorage.getItem(storageKey)) showResults();
    options.forEach((btn) => {
        btn.addEventListener('click', () => {
            const choice = btn.dataset.choice;
            if (!choice || localStorage.getItem(storageKey)) return;
            counts[choice] = (counts[choice] || 0) + 1;
            localStorage.setItem(storageKey, choice);
            localStorage.setItem(storageKey + '_counts', JSON.stringify(counts));
            showResults();
        });
    });
}

function initQuiz() {
    const quiz = document.getElementById('peerQuiz');
    if (!quiz) return;
    const questions = [
        { q: 'What is peer education built on?', options: ['Competition', 'Students helping students', 'Only lectures', 'Paid tutoring only'], correct: 1 },
        { q: 'Modulus shares resources to help you…', options: ['Cheat on exams', 'Learn from past materials', 'Skip classes', 'Avoid studying'], correct: 1 },

        { q: 'After mechanical engineering, Simon plans to study…', options: ['Law', 'Biomedical Engineering', 'Architecture', 'Finance'], correct: 1 },
{ q: 'What colour palette does Modulus use?', options: ['Orange & yellow', 'Black, white & electric blue', 'Pink & purple', 'Green & brown'], correct: 1 }
    ];
    let current = 0, score = 0;
    const questionEl = document.getElementById('quizQuestion');
    const optionsEl = document.getElementById('quizOptions');
    const scoreEl = document.getElementById('quizScore');
    const renderQuestion = () => {
        if (current >= questions.length) {
            questionEl.textContent = 'Assessment complete';
            optionsEl.innerHTML = `<p class="quiz-score">Final score: ${score}/${questions.length} — ${score === questions.length ? 'Outstanding!' : 'Keep learning with Osiris.'}</p>`;
            return;
        }
        const item = questions[current];
        questionEl.textContent = `Q${current + 1}: ${item.q}`;
        optionsEl.innerHTML = item.options.map((opt, i) =>
            `<button type="button" class="quiz-option" data-index="${i}">${opt}</button>`
        ).join('');
        optionsEl.querySelectorAll('.quiz-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (parseInt(btn.dataset.index, 10) === item.correct) score++;
                current++;
                if (scoreEl) scoreEl.textContent = `Score: ${score}`;
                renderQuestion();
            });
        });
    };
    renderQuestion();
}

function initAnonymousQA() {
    const form = document.getElementById('anonQAForm');
    const list = document.getElementById('anonQAList');
    if (!form || !list) return;
    const storageKey = 'osiris_anon_qa';
    const entries = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const render = () => {
        list.innerHTML = entries.length
            ? entries.slice(-5).reverse().map((e) =>
                `<div class="anon-qa-item"><p>${escapeHtml(e.text)}</p><small>Anonymous · ${e.date}</small></div>`
            ).join('')
            : '<p style="color:var(--text-muted);font-size:0.85rem">No questions yet — be the first.</p>';
    };
    render();
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('anonQAInput');
        const text = input?.value?.trim();
        if (!text) return;
        entries.push({ text, date: new Date().toLocaleDateString() });
        localStorage.setItem(storageKey, JSON.stringify(entries.slice(-20)));
        input.value = '';
        render();
    });
}

function initForum() {
    const form = document.getElementById('forumForm');
    const list = document.getElementById('forumList');
    if (!form || !list) return;
    const storageKey = 'osiris_forum';
    let threads = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const render = () => {
        list.innerHTML = threads.length
            ? threads.slice(-10).reverse().map((t) =>
                `<div class="forum-thread"><div class="forum-thread__meta">Student · ${t.date}</div><div class="forum-thread__text">${escapeHtml(t.text)}</div></div>`
            ).join('')
            : '<p style="color:var(--text-muted);font-size:0.85rem">Start the conversation — post a question or tip.</p>';
    };
    render();
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('forumInput');
        const text = input?.value?.trim();
        if (!text) return;
        threads.push({ text, date: new Date().toLocaleDateString() });
        localStorage.setItem(storageKey, JSON.stringify(threads.slice(-30)));
        input.value = '';
        render();
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initEventsCalendar() {
    const grid = document.getElementById('eventsCalendar');
    if (!grid) return;
    const year = new Date().getFullYear();
    const events = [
        { date: `${year}-03-15`, title: 'MATLAB Basics Workshop', type: 'Workshop' },
        { date: `${year}-04-02`, title: 'Peer Mentor Training', type: 'Training' },
        { date: `${year}-04-20`, title: 'Study Skills Seminar', type: 'Seminar' },
        { date: `${year}-05-10`, title: 'Engineering Social Night', type: 'Social' },
        { date: `${year}-06-01`, title: 'Exam Prep Bootcamp', type: 'Training' },
        { date: `${year}-07-12`, title: 'CAD Design Masterclass', type: 'Workshop' },
        { date: `${year}-08-05`, title: 'Career CV Clinic', type: 'Career' },
        { date: `${year}-09-18`, title: 'Biomedical Engineering Talk', type: 'Talk' }
    ];
    const now = new Date();
    const upcoming = events.map((e) => ({ ...e, dateObj: new Date(e.date) }))
        .filter((e) => e.dateObj >= now).sort((a, b) => a.dateObj - b.dateObj);
    grid.innerHTML = (upcoming.length ? upcoming : events).map((e) => {
        const d = e.dateObj || new Date(e.date);
        return `<article class="event-card reveal"><div class="event-card__date"><span class="event-card__day">${d.getDate()}</span><span class="event-card__month">${d.toLocaleString('en', { month: 'short' })}</span></div><div><span class="event-card__type">${e.type}</span><h3>${e.title}</h3></div></article>`;
    }).join('');
    initScrollReveal();
}

function initResourceTabs() {
    const tabs = document.querySelectorAll('.resource-tab');
    const panels = document.querySelectorAll('.resource-panel');
    if (!tabs.length) return;
    tabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.dataset.tab;
            tabs.forEach((t) => t.classList.toggle('resource-tab--active', t === tab));
            panels.forEach((p) => p.classList.toggle('resource-panel--active', p.id === target));
            if (target === 'tab-modules') {
window.OsirisResources?.renderModuleFolders?.('tab-modules', 'moduleGrid', 'moduleSearch');
            }
        });
    });
}

function initHubTabs() {
    const tabs = document.querySelectorAll('.hub-tab');
    const panels = document.querySelectorAll('.hub-panel');
    if (!tabs.length) return;
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.hub;
            tabs.forEach((t) => t.classList.toggle('hub-tab--active', t === tab));
            panels.forEach((p) => p.classList.toggle('hub-panel--active', p.id === target));
        });
    });
}

function initCardTilt() {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

function initGoogleFormLinks() {
    if (!OSIRIS_CONFIG?.googleForms) return;
    document.querySelectorAll('[data-form]').forEach((el) => {
        const key = el.dataset.form;
        if (OSIRIS_CONFIG.googleForms[key]) el.href = OSIRIS_CONFIG.googleForms[key];
    });
    const fb = document.getElementById('feedbackFormLink');
    if (fb) fb.href = OSIRIS_CONFIG.googleForms.feedback;
    const nl = document.getElementById('newsletterFormLink');
    if (nl) nl.href = OSIRIS_CONFIG.googleForms.newsletter;
}

function initAIChat() {
    if (document.getElementById('osirisAIWidget')) return;
    const widget = document.createElement('div');
    widget.id = 'osirisAIWidget';
    widget.className = 'ai-widget';
    widget.innerHTML = `
<button type="button" class="ai-widget__toggle" id="aiToggle" aria-label="Open Modulus AI">
            <img src="${OSIRIS_CONFIG?.assets?.logo || 'assets/Osiris%20logo.png'}" alt="Osiris" style="width:28px;height:28px;object-fit:contain" />
        </button>
        <div class="ai-widget__panel" id="aiPanel" hidden>
            <div class="ai-widget__header">
                <div style="display:flex;align-items:center;gap:0.75rem">
                    <img src="${OSIRIS_CONFIG?.assets?.logo || 'assets/Osiris%20logo.png'}" alt="Osiris" style="width:30px;height:30px;object-fit:contain" />
                    <div><strong>Osiris AI</strong><small>Integrated assistant · Ask anything</small></div>
                </div>
                <button type="button" id="aiClose" aria-label="Close"><i class="ri-close-line"></i></button>
            </div>
            <div class="ai-widget__messages" id="aiMessages">
                <div class="ai-msg ai-msg--bot">Welcome. I'm Osiris AI — ask about resources, programs, peer education, events, or career support.</div>
            </div>
            <form class="ai-widget__input" id="aiForm">
                <input type="text" id="aiInput" placeholder="Ask Osiris…" autocomplete="off" required>
                <button type="submit"><i class="ri-send-plane-fill"></i></button>
            </form>
        </div>`;

    document.body.appendChild(widget);
    const panel = document.getElementById('aiPanel');
    document.getElementById('aiToggle').addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) document.getElementById('aiInput').focus();
    });
    document.getElementById('aiClose').addEventListener('click', () => { panel.hidden = true; });
    document.getElementById('aiForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('aiInput');
        const messages = document.getElementById('aiMessages');
        const text = input.value.trim();
        if (!text) return;
        appendMessage(messages, text, 'user');
        input.value = '';
        appendMessage(messages, '…', 'bot');
        const botMsgs = messages.querySelectorAll('.ai-msg--bot');
        const thinking = botMsgs[botMsgs.length - 1];
        const response = await fetchAIResponse(text);
        thinking.innerHTML = response.replace(/\n/g, '<br>');
    });
}

async function fetchAIResponse(question) {
    const endpoint = OSIRIS_CONFIG?.ai?.endpoint;
    if (endpoint) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            if (res.ok) {
                const data = await res.json();
                return data.reply || data.message || getAIResponse(question);
            }
        } catch (_) { /* fallback */ }
    }
    return getAIResponse(question);
}

function appendMessage(container, text, role) {
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg--${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function getAIResponse(question) {
    const q = question.toLowerCase().trim();
    const cfg = OSIRIS_CONFIG;
    const founder = cfg.founder?.name || 'Simon Shitana';

    if (q.includes('resource') || q.includes('past paper') || q.includes('exam') || q.includes('pdf') || q.includes('module')) {
        return `Osiris Resources are organized by university module folders — each module has its own folder with past papers, memos, and notes.

How to use them:
1. Go to Resources (or Study Room → Resources tab).
2. Search or scroll to your module (e.g. Engineering Mechanics II, Fluid Mechanics I).
3. Click the folder to expand it — folders stay open while you browse.
4. Click Open to read in the browser, or Download to save.

Static PDFs live in resources/pdfs/ on the server, so they don't use Firebase storage. Admin can also upload files directly to any module folder. Mechanics 2 chapters are now under Engineering Mechanics II like all other modules.`;
    }

    if (q.includes('study room') || q.includes('music') || q.includes('task') || q.includes('motivat')) {
        return `The Study Room is your all-in-one focus space:

• Resources — same module folders as the Resources page
• Music — study tracks from resources/music/; admin can upload more
• Tasks — personal to-do list saved to your account
• Motivation — rotating quotes to keep you going
• PDF Viewer — upload your own PDF or open any resource in fullscreen modal

Find it in the nav bar or from your home welcome panel.`;
    }

    if (q.includes('chat') || q.includes('message') || q.includes('whatsapp') || q.includes('colleague')) {
        return `Student Chat is an open group area — like a shared WhatsApp group for all Osiris students.

Everyone signed in can read and send messages. Your name and photo appear on your messages. Admin can delete inappropriate messages.

You'll get a notification when someone sends a new message (if enabled in Profile → Settings). Open Chat from the navigation bar or home page.`;
    }

    if (q.includes('peer') || q.includes('mentor') || q.includes('wellness')) {
        return `Peer education is central to Osiris. Visit the Students page for programs, forums, and wellness resources.

You can email the UNESCO Peer Educators directly at ${cfg.peerEducation?.email || 'unescopeereducators@gmail.com'}.

Simon Shitana also runs workshops and mentoring — check Events for upcoming sessions, or use Assignment Help on the Students page to reach Simon directly about coursework.`;
    }

    if (q.includes('event') || q.includes('seminar') || q.includes('workshop')) {
        return `The Events page lists upcoming seminars, training sessions, and student activities.

Events are updated by Simon as they are scheduled. Enable "Notify me about platform updates" in Profile → Settings to get alerts when new events are posted on the admin channel.`;
    }

    if (q.includes('channel') || q.includes('admin') || q.includes('broadcast') || q.includes('update')) {
        return `The Admin Channel is Simon Shitana's one-way broadcast to all students — essays, motivation, polls, and platform updates.

Students can react and vote on polls anonymously. When Simon publishes something new, you'll receive a notification if channel alerts are enabled in your profile settings.

Admin login is separate from student Google sign-in — only Simon has publish and delete rights on channel posts, resources, and chat moderation.`;
    }

    if (q.includes('career') || q.includes('cv') || q.includes('internship') || q.includes('job')) {
        return `Career support lives on the Students page under Career Development.

You'll find CV tips, internship guidance, and links to job boards. Engineering employers value project experience — check Projects to see what Simon has built and what's coming.

For personal mentoring on career direction, email Simon at ${cfg.founder?.email || 'osiris11978@gmail.com'}.`;
    }

    if (q.includes('contact') || q.includes('email') || q.includes('simon') || q.includes('phone')) {
        return `${founder} is the owner and administrator of Osiris.

Email: ${cfg.founder?.email || 'osiris11978@gmail.com'}
Phone: ${cfg.founder?.phone || '0817687816'}
WhatsApp: https://wa.me/27817687816

Use Contact page, Assignment Help, or Student Chat depending on what you need. Simon reads messages and uses this platform to communicate directly with students.`;
    }

    if (q.includes('who') && (q.includes('osiris') || q.includes('owner') || q.includes('founder'))) {
        return `Osiris is an educational platform owned and run by ${founder}.

${cfg.founder?.intro || ''}

The platform shares engineering resources, peer education, an admin channel, student chat, a study room, and this AI assistant. Osiris Agent helps curate content across the site.`;
    }

    if (q.includes('mechanical') || q.includes('engineering') || q.includes('year') || q.includes('student')) {
        return `${founder} is ${getAcademicStatus()}.

Osiris was built from his own experience as an engineering student — collecting past papers, helping peers, and wanting one place where everyone could access resources and talk to each other.

The platform reflects that mission: resources by module, open student chat, and direct communication from admin to students.`;
    }

    if (q.includes('sign') || q.includes('register') || q.includes('login') || q.includes('google') || q.includes('account')) {
        return `To join Osiris:

1. Click Continue with Google on the sign-in page.
2. Use a verified Google email account (required for registration).
3. Upload your profile photo in Profile — no default image is used.
4. Explore Home, Resources, Chat, and Study Room.

Existing email/password accounts can still sign in, but new registration is Google-only. Admin access is separate.`;
    }

    if (q.includes('profile') || q.includes('setting') || q.includes('notification') || q.includes('photo')) {
        return `Your Profile has several sections:

• General — name, photo upload, quick links
• Activity — recent notifications and tasks
• Notifications — inbox for uploads, channel posts, and chat
• Security — password and logout (logout is only here, not in the header)
• Settings — notification preferences, display options

Upload your own photo — the platform uses a placeholder until you do.`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        const session = typeof OsirisAuth !== 'undefined' ? OsirisAuth.getSession() : null;
        const name = session?.name?.split(' ')[0] || 'there';
        return `Hey ${name}! I'm Osiris AI — ask me anything about resources, the study room, chat, events, peer education, or how to reach ${founder}.

Try: "Where are Mechanics 2 notes?", "How does student chat work?", or "How do I contact Simon?"`;
    }

    return `I'm Osiris AI. Ask me something specific and I'll give you a detailed answer.

Popular topics:
• Resources & module folders
• Study Room (music, tasks, PDFs)
• Student Chat
• Admin Channel & notifications
• Contacting ${founder}
• Signing in with Google
• Profile & settings

Example: "How do I find past papers for Fluid Mechanics?" or "What is the study room?"`;
}

function initPeerEducatorEmail() {
    const email = OSIRIS_CONFIG?.peerEducation?.email;
    if (!email) return;

    const mailtoBase = `mailto:${email}`;
const mailtoWithSubject = `${mailtoBase}?subject=${encodeURIComponent('Modulus Peer Education Inquiry')}`;

    document.querySelectorAll('[data-peer-email]').forEach((el) => {
        if (el.tagName === 'A') {
            el.href = el.dataset.peerEmailTemplate === 'subject' ? mailtoWithSubject : mailtoBase;
        } else {
            el.textContent = email;
        }
    });

    const form = document.getElementById('peerEducatorForm');
    const reply = document.getElementById('peerFormReply');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('[name="name"]')?.value?.trim() || '';
        const from = form.querySelector('[name="email"]')?.value?.trim() || '';
        const topic = form.querySelector('[name="topic"]')?.value?.trim() || 'General';
        const message = form.querySelector('[name="message"]')?.value?.trim() || '';
        const body = `Name: ${name}\nReply-to: ${from}\nTopic: ${topic}\n\n${message}`;
        const url = `${mailtoBase}?subject=${encodeURIComponent(`Peer Education: ${topic}`)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
        if (reply) {
            reply.textContent = 'Opening your email app to send to the peer educators…';
        }
        form.reset();
    });
}
