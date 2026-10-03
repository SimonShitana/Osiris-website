/**
 * Firestore helpers — profiles, channel, enquiries, chat, notifications
 */

(function () {
  // Ensure ModulusFirebase exists to prevent load-order crashes.
  window.ModulusFirebase = window.ModulusFirebase || {};

  // Defer dbHelpers attachment until after Firebase namespace exists.
  window.ModulusFirebase.dbHelpers = {

    async ensureUserProfile(uid, data) {

        const ready = window.ModulusFirebase?.ready;
        if (!ready) return null;

        const { doc, getDoc, setDoc, updateDoc } = window.ModulusFirebase.firestoreUtils;
        const db = window.ModulusFirebase.db;
        const ref = doc(db, 'profiles', uid);
        const snap = await getDoc(ref);

        const defaultPhoto = OSIRIS_CONFIG?.assets?.defaultAvatar || '';

        if (!snap.exists()) {

            await setDoc(ref, {

                displayName: data.displayName || 'Student',

                email: data.email || '',

                role: data.role || 'student',

                photoURL: data.photoURL || defaultPhoto,

                createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

                updatedAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

                lastLoginAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

            });

        } else {

            await updateDoc(ref, {

                lastLoginAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

                updatedAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

            });

        }

        return (await getDoc(ref)).data();

    },



    async getUserProfile(uid) {

        if (!window.ModulusFirebase?.ready) return null;

        const { doc, getDoc } = window.ModulusFirebase.firestoreUtils;
        const snap = await getDoc(doc(window.ModulusFirebase.db, 'profiles', uid));

        return snap.exists() ? snap.data() : null;

    },



    async updateUserProfile(uid, updates) {

        if (!window.ModulusFirebase?.ready) return;

        const { doc, updateDoc } = window.ModulusFirebase.firestoreUtils;
        await updateDoc(doc(window.ModulusFirebase.db, 'profiles', uid), {

            ...updates,

            updatedAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

    },



    async listStudents() {

        if (!window.ModulusFirebase?.ready) return [];

        const { collection, getDocs, query, where, orderBy, limit } = window.ModulusFirebase.firestoreUtils;
        const students = collection(window.ModulusFirebase.db, 'profiles');
        let snap;
        try {
            snap = await getDocs(query(students, where('role', '==', 'student'), orderBy('lastLoginAt', 'desc'), limit(100)));
        } catch {
            snap = await getDocs(query(students, where('role', '==', 'student'), limit(100)));
        }

        return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    },



    async uploadProfilePhoto(uid, file) {

        // Firestore-only build: photo upload is not supported.
        throw new Error('Photo upload disabled: storage is not configured in this build.');

    },



    subscribeChannelPosts(callback) {

        if (!window.ModulusFirebase?.ready) return () => {};

        const { collection, query, orderBy, onSnapshot } = window.ModulusFirebase.firestoreUtils;
        return onSnapshot(
            query(collection(window.ModulusFirebase.db, 'channelPosts'), orderBy('createdAt', 'desc')),
                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                (error) => {
                    console.error('Osiris: Could not subscribe to channel posts:', error);
                    callback(null);
                }
            );

    },



    async publishChannelPost(post) {

        if (!window.ModulusFirebase?.ready) throw new Error('Firebase not ready');

        const { collection, addDoc } = window.ModulusFirebase.firestoreUtils;
        return addDoc(collection(window.ModulusFirebase.db, 'channelPosts'), {

            ...post,

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

            reactions: post.reactions || { like: 0, fire: 0, heart: 0 },

            comments: post.comments || []

        });

    },

    async publishProject(project) {

        if (!window.ModulusFirebase?.ready) throw new Error('Firebase not ready');

        const { collection, addDoc } = window.ModulusFirebase.firestoreUtils;
        return addDoc(collection(window.ModulusFirebase.db, 'projects'), {

            ...project,

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

    },

    async deleteProject(id) {

        if (!window.ModulusFirebase?.ready) throw new Error('Firebase not ready');

        const { doc, deleteDoc } = window.ModulusFirebase.firestoreUtils;
        await deleteDoc(doc(window.ModulusFirebase.db, 'projects', id));

    },



    async submitAssignmentEnquiry(data) {

        if (!window.ModulusFirebase?.ready) {

            const key = 'osiris_assignment_enquiries';

            const list = JSON.parse(localStorage.getItem(key) || '[]');

            list.push({ ...data, createdAt: new Date().toISOString(), status: 'pending' });

            localStorage.setItem(key, JSON.stringify(list));

            return;

        }

        const { collection, addDoc } = window.ModulusFirebase.firestoreUtils;
        return addDoc(collection(window.ModulusFirebase.db, 'assignmentEnquiries'), {

            ...data,

            status: 'pending',

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

    },



    subscribeChatMessages(callback) {

        if (!window.ModulusFirebase?.ready) return () => {};

        const { collection, query, orderBy, limitToLast, onSnapshot } = window.ModulusFirebase.firestoreUtils;
        return onSnapshot(
            query(collection(window.ModulusFirebase.db, 'chatMessages'), orderBy('createdAt', 'asc'), limitToLast(200)),
                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                (error) => {
                    console.error('Osiris: Could not subscribe to chat messages:', error);
                    callback(null);
                }
            );

    },



    async sendChatMessage(data) {

        if (!window.ModulusFirebase?.ready) {

            const key = 'osiris_chat_messages';

            const list = JSON.parse(localStorage.getItem(key) || '[]');

            const msg = { ...data, id: 'local_' + Date.now(), createdAt: new Date().toISOString() };

            list.push(msg);

            localStorage.setItem(key, JSON.stringify(list.slice(-200)));

            window.dispatchEvent(new CustomEvent('osiris-chat-local', { detail: msg }));

            return msg;

        }

        const { collection, addDoc } = window.ModulusFirebase.firestoreUtils;
        const ref = await addDoc(collection(window.ModulusFirebase.db, 'chatMessages'), {

            ...data,

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

        return { id: ref.id, ...data };

    },



    async deleteChatMessage(id) {

        if (!window.ModulusFirebase?.ready) {

            const key = 'osiris_chat_messages';

            const list = JSON.parse(localStorage.getItem(key) || '[]').filter((m) => m.id !== id);

            localStorage.setItem(key, JSON.stringify(list));

            return;

        }

        const { doc, deleteDoc } = window.ModulusFirebase.firestoreUtils;
        await deleteDoc(doc(window.ModulusFirebase.db, 'chatMessages', id));

    },



    async pushNotification(data) {

        if (!window.ModulusFirebase?.ready) return;

        const { collection, addDoc } = window.ModulusFirebase.firestoreUtils;
        return addDoc(collection(window.ModulusFirebase.db, 'notifications'), {

            ...data,

            read: false,

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

    },



    subscribeNotifications(email, callback) {

        const firebase = window.ModulusFirebase;
        const authEmail = firebase?.auth?.currentUser?.email;
        if (!firebase?.ready || !email || !authEmail || authEmail.toLowerCase() !== email.toLowerCase()) return () => {};

        const { collection, query, where, orderBy, limit, onSnapshot } = firebase.firestoreUtils;
        return onSnapshot(
            query(collection(firebase.db, 'notifications'), where('email', '==', authEmail), orderBy('createdAt', 'desc'), limit(20)),
                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                (error) => {
                    console.error('Osiris: Could not subscribe to notifications:', error);
                    callback(null);
                }
            );

    },



    getLocalChatMessages() {

        try { return JSON.parse(localStorage.getItem('osiris_chat_messages') || '[]'); } catch { return []; }

    }

};

window.OsirisDB = window.ModulusFirebase.dbHelpers;
})();
