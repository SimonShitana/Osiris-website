/**
 * Osiris authentication — Firebase (http/https) + local fallback (file://)
 */
(function () {
    const SESSION_KEY = 'osiris_session';
    const USERS_KEY = 'osiris_users';
    const PROFILE_KEY = 'osiris_profile_local';
    const PUBLIC_PAGES = ['index.html', ''];

    function getPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    function useFirebase() {
        return window.OsirisFirebase?.ready && !OsirisFirebase.fileMode;
    }

    function hashPass(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
        return 'h' + Math.abs(h).toString(36);
    }

    function getUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
    }

    function saveUsers(users) {
        try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch (e) {
            throw new Error('Browser blocked storage. Use a local server (see serve.bat) or allow site storage.');
        }
    }

    function getLocalProfile(email) {
        try {
            const all = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
            return all[email] || null;
        } catch { return null; }
    }

    function saveLocalProfile(email, data) {
        const all = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
        all[email] = { ...all[email], ...data };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(all));
    }

    function setSession(user) {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        } catch (e) {
            throw new Error('Could not save your session. Browser storage may be blocked — try a local server.');
        }
        window.dispatchEvent(new CustomEvent('osiris-auth-change', { detail: user }));
    }

    function defaultAvatar() {
        return OSIRIS_CONFIG?.assets?.defaultAvatar || 'images/NEW.jpg';
    }

    function mapFirebaseError(ex) {
        const map = {
            'auth/email-already-in-use': 'An account with this email already exists. Switch to Sign In.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/user-not-found': 'No account found with this email. Create an account first.',
            'auth/wrong-password': 'Incorrect password. Try again.',
            'auth/invalid-credential': 'Invalid email or password. Check your details or sign up.',
            'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
            'auth/network-request-failed': 'Network error. Check your connection or use a local server.',
            'auth/operation-not-allowed': 'Email sign-in is not enabled in Firebase. Enable it in the Firebase Console.'
        };
        return map[ex?.code] || ex?.message || 'Authentication failed. Please try again.';
    }

    window.OsirisAuth = {
        getSession() {
            try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
        },
        isAuthenticated() { return !!this.getSession(); },
        isAdmin() { return this.getSession()?.role === 'admin'; },
        isStudent() { return this.getSession()?.role === 'student'; },
        usesLocalAuth() { return !useFirebase(); },
        getPhotoURL() {
            const s = this.getSession();
            if (!s) return defaultAvatar();
            return s.photoURL || getLocalProfile(s.email)?.photoURL || defaultAvatar();
        },
        logout() {
            if (useFirebase()) OsirisFirebase.auth.signOut().catch(() => {});
            localStorage.removeItem(SESSION_KEY);
            window.location.href = 'index.html';
        },
        async updateProfile(updates) {
            const session = this.getSession();
            if (!session) throw new Error('Not signed in.');
            const merged = { ...session, ...updates };
            setSession(merged);
            if (session.uid && useFirebase() && window.OsirisDB) {
                try { await OsirisDB.updateUserProfile(session.uid, updates); } catch (_) { /* offline ok */ }
            } else if (session.email) {
                saveLocalProfile(session.email, updates);
            }
            return merged;
        },
        async updatePhoto(file) {
            const session = this.getSession();
            if (!session) throw new Error('Not signed in.');
            let photoURL;
            if (session.uid && useFirebase() && window.OsirisDB?.uploadProfilePhoto) {
                try {
                    photoURL = await OsirisDB.uploadProfilePhoto(session.uid, file);
                } catch (_) {
                    photoURL = await readFileAsDataURL(file);
                    saveLocalProfile(session.email, { photoURL });
                }
            } else {
                photoURL = await readFileAsDataURL(file);
                saveLocalProfile(session.email, { photoURL });
            }
            await this.updateProfile({ photoURL });
            return photoURL;
        },
        async changePassword(currentPassword, newPassword) {
            const session = this.getSession();
            if (!session) throw new Error('Not signed in.');
            if (!newPassword || newPassword.length < 6) throw new Error('New password must be at least 6 characters.');

            if (session.uid && useFirebase()) {
                const user = OsirisFirebase.auth.currentUser;
                if (!user || !session.email) throw new Error('Please sign in again before changing your password.');
                const credential = firebase.auth.EmailAuthProvider.credential(session.email, currentPassword || '');
                await user.reauthenticateWithCredential(credential);
                await user.updatePassword(newPassword);
                return true;
            }

            if (session.role === 'admin') {
                throw new Error('Admin password is configured in js/osiris-config.js for this static build.');
            }

            const users = getUsers();
            const user = users.find((u) => u.email === session.email);
            if (!user) throw new Error('Local account not found.');
            if (user.passwordHash !== hashPass(currentPassword || '')) throw new Error('Current password is incorrect.');
            user.passwordHash = hashPass(newPassword);
            saveUsers(users);
            return true;
        },
        async signup(email, password, name) {
            const normalized = email.trim().toLowerCase();
            if (!normalized || !password) throw new Error('Email and password are required.');
            if (password.length < 6) throw new Error('Password must be at least 6 characters.');
            if (!name || !name.trim()) throw new Error('Full name is required.');

            if (useFirebase()) {
                try {
                    const cred = await OsirisFirebase.auth.createUserWithEmailAndPassword(normalized, password);
                    await cred.user.updateProfile({ displayName: name.trim() });
                    const profile = await OsirisDB.ensureUserProfile(cred.user.uid, {
                        displayName: name.trim(),
                        email: normalized,
                        role: 'student',
                        photoURL: defaultAvatar()
                    });
                    setSession({
                        uid: cred.user.uid,
                        email: normalized,
                        name: name.trim(),
                        role: 'student',
                        photoURL: profile?.photoURL || defaultAvatar()
                    });
                    return true;
                } catch (ex) {
                    throw new Error(mapFirebaseError(ex));
                }
            }

            const users = getUsers();
            if (users.find((u) => u.email === normalized)) {
                throw new Error('An account with this email already exists. Switch to Sign In.');
            }
            const newUser = {
                email: normalized,
                name: name.trim(),
                passwordHash: hashPass(password),
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            saveUsers(users);
            setSession({
                email: normalized,
                name: name.trim(),
                role: 'student',
                photoURL: defaultAvatar()
            });
            return true;
        },
        async loginStudent(email, password) {
            const normalized = email.trim().toLowerCase();
            if (!normalized || !password) throw new Error('Email and password are required.');

            if (useFirebase()) {
                try {
                    const cred = await OsirisFirebase.auth.signInWithEmailAndPassword(normalized, password);
                    let photoURL = defaultAvatar();
                    let displayName = cred.user.displayName || normalized.split('@')[0];
                    try {
                        const profile = await OsirisDB.ensureUserProfile(cred.user.uid, {
                            displayName, email: normalized, role: 'student'
                        });
                        if (profile?.displayName) displayName = profile.displayName;
                        if (profile?.photoURL) photoURL = profile.photoURL;
                    } catch (_) { /* Firestore optional */ }
                    setSession({
                        uid: cred.user.uid,
                        email: normalized,
                        name: displayName,
                        role: 'student',
                        photoURL
                    });
                    return true;
                } catch (ex) {
                    throw new Error(mapFirebaseError(ex));
                }
            }

            const user = getUsers().find((u) => u.email === normalized && u.passwordHash === hashPass(password));
            if (!user) {
                const exists = getUsers().some((u) => u.email === normalized);
                throw new Error(exists
                    ? 'Incorrect password. Try again.'
                    : 'No account found. Create an account on the Sign Up tab first.');
            }
            const local = getLocalProfile(normalized);
            setSession({
                email: user.email,
                name: user.name,
                role: 'student',
                photoURL: local?.photoURL || user.photoURL || defaultAvatar()
            });
            return true;
        },
        loginAdmin(username, password) {
            const cfg = typeof OSIRIS_CONFIG !== 'undefined' ? OSIRIS_CONFIG.admin : { username: 'Stjohns', password: 'Stjohns@26', email: 'osiris11978@gmail.com' };
            if (username.trim() !== cfg.username || password !== cfg.password) {
                throw new Error('Invalid admin username or password.');
            }
            setSession({
                email: cfg.email,
                name: 'Simon Shitana',
                role: 'admin',
                username: cfg.username,
                photoURL: OSIRIS_CONFIG?.assets?.defaultAvatar || ''
            });
            return true;
        }
    };

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    if (useFirebase()) {
        OsirisFirebase.auth.onAuthStateChanged(async (user) => {
            if (!user || getPage() === 'index.html') return;
            const existing = OsirisAuth.getSession();
            if (existing?.role === 'admin') return;
            let photoURL = defaultAvatar();
            let displayName = user.displayName || user.email.split('@')[0];
            try {
                const profile = await OsirisDB.getUserProfile(user.uid);
                if (profile?.displayName) displayName = profile.displayName;
                if (profile?.photoURL) photoURL = profile.photoURL;
                if (profile?.role === 'admin') return;
            } catch (_) { /* ok */ }
            setSession({
                uid: user.uid,
                email: user.email,
                name: displayName,
                role: 'student',
                photoURL
            });
        });
    }

    const page = getPage();
    if (!PUBLIC_PAGES.includes(page) && !OsirisAuth.isAuthenticated()) {
        window.location.replace('index.html');
        return;
    }
    if (PUBLIC_PAGES.includes(page) && OsirisAuth.isAuthenticated() && page === 'index.html') {
        window.location.replace('home.html');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    initNavUser();
    initRoleBoundaries();
    showFileModeBanner();

    const authForm = document.getElementById('authForm');
    if (!authForm) return;

    const tabs = document.querySelectorAll('[data-auth-tab]');
    const panels = document.querySelectorAll('[data-auth-panel]');
    let mode = 'signin';

    const studentFields = document.getElementById('studentAuthFields');
    const authEmail = document.getElementById('authEmail');
    const authPass = document.getElementById('authPass');
    const authError = document.getElementById('authError');
    const signupName = document.getElementById('signupName');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            mode = tab.dataset.authTab;
            tabs.forEach((t) => t.classList.toggle('auth-tab--active', t === tab));
            panels.forEach((p) => p.classList.toggle('auth-panel--active', p.dataset.authPanel === mode));
            if (authError) authError.textContent = '';
            const isAdmin = mode === 'admin';
            if (studentFields) studentFields.style.display = isAdmin ? 'none' : 'block';
            if (authEmail) authEmail.required = !isAdmin;
            if (authPass) authPass.required = !isAdmin;
            if (signupName) signupName.style.display = mode === 'signup' ? 'block' : 'none';
        });
    });
    if (authEmail) authEmail.required = true;
    if (authPass) authPass.required = true;
    if (signupName) signupName.style.display = 'none';

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = authForm.querySelector('[type="submit"]');
        if (authError) authError.textContent = '';
            submitBtn.disabled = true;
        const originalLabel = submitBtn.textContent;
        // Keep UI fast/clean on slow networks
        submitBtn.textContent = 'Creating…';


        try {
            if (mode === 'admin') {
                OsirisAuth.loginAdmin(document.getElementById('adminUser').value, document.getElementById('adminPass').value);
                OsirisNotify?.success('Welcome back', 'Admin session started.');
            } else if (mode === 'signup') {
                await OsirisAuth.signup(
                    document.getElementById('authEmail').value,
                    document.getElementById('authPass').value,
                    document.getElementById('signupName').value
                );
                OsirisNotify?.success('Account created', 'Welcome to Osiris! Redirecting…');
            } else {
                await OsirisAuth.loginStudent(
                    document.getElementById('authEmail').value,
                    document.getElementById('authPass').value
                );
                OsirisNotify?.success('Signed in', 'Welcome back! Redirecting…');
            }
            setTimeout(() => { window.location.href = 'home.html'; }, 600);
        } catch (ex) {
            const msg = ex.message || 'Something went wrong. Try again.';
            if (authError) authError.textContent = msg;
            OsirisNotify?.error(
                mode === 'signup' ? 'Sign up failed' : mode === 'admin' ? 'Admin login failed' : 'Sign in failed',
                msg
            );
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
        }
    });

    window.addEventListener('osiris-auth-change', initNavUser);
});

function showFileModeBanner() {
    if (location.protocol !== 'file:' || document.getElementById('fileModeBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'fileModeBanner';
    banner.className = 'file-mode-banner';
    banner.innerHTML = 'Local file mode — accounts saved on this device. For Firebase sync & PDFs, run <code>serve.bat</code> then open <strong>http://localhost:5500</strong>';
    document.body.appendChild(banner);
}

function initNavUser() {
    const userLabel = document.getElementById('navUserLabel');
    const navAvatar = document.getElementById('navAvatar');
    const session = OsirisAuth?.getSession();
    if (userLabel && session) {
        userLabel.textContent = session.role === 'admin' ? `Admin · ${session.name}` : session.name;
    }
    if (navAvatar && session) {
        navAvatar.src = OsirisAuth.getPhotoURL();
        navAvatar.alt = session.name;
    }
}

function initRoleBoundaries() {
    const session = OsirisAuth?.getSession();
    if (!session) return;
    const isAdmin = session.role === 'admin';

    document.querySelectorAll('[data-admin-only]').forEach((el) => {
        el.hidden = !isAdmin;
        el.style.display = isAdmin ? '' : 'none';
    });
    document.querySelectorAll('[data-student-only]').forEach((el) => {
        el.hidden = isAdmin;
        el.style.display = isAdmin ? 'none' : '';
    });

    const welcome = document.getElementById('welcomePanel');
    if (welcome) {
        const title = welcome.querySelector('[data-welcome-title]');
        const sub = welcome.querySelector('[data-welcome-sub]');
        if (title) {
            title.textContent = isAdmin
                ? `Welcome back, ${session.name}`
                : `Hey ${session.name.split(' ')[0]}, ready to learn?`;
        }
        if (sub) {
            sub.textContent = isAdmin
                ? 'Admin dashboard — publish channel posts, review enquiries, manage the platform.'
                : 'Your student hub — resources, projects, assignment help, and peer education await.';
        }
        welcome.classList.toggle('welcome-panel--admin', isAdmin);
        welcome.classList.toggle('welcome-panel--student', !isAdmin);
    }
}
