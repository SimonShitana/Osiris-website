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

        const db = window.ModulusFirebase.db;

        const ref = db.collection('profiles').doc(uid);

        const snap = await ref.get();

        const defaultPhoto = OSIRIS_CONFIG?.assets?.defaultAvatar || '';

        if (!snap.exists) {

            await ref.set({

                displayName: data.displayName || 'Student',

                email: data.email || '',

                role: data.role || 'student',

                photoURL: data.photoURL || defaultPhoto,

                createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

                updatedAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

                lastLoginAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

            });

        } else {

            await ref.update({

                lastLoginAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

                updatedAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

            });

        }

        return (await ref.get()).data();

    },



    async getUserProfile(uid) {

        if (!window.ModulusFirebase?.ready) return null;

        const snap = await window.ModulusFirebase.db.collection('profiles').doc(uid).get();

        return snap.exists ? snap.data() : null;

    },



    async updateUserProfile(uid, updates) {

        if (!window.ModulusFirebase?.ready) return;

        await window.ModulusFirebase.db.collection('profiles').doc(uid).update({

            ...updates,

            updatedAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

    },



    async listStudents() {

        if (!window.ModulusFirebase?.ready) return [];

        const snap = await window.ModulusFirebase.db.collection('profiles')

            .where('role', '==', 'student')

            .orderBy('lastLoginAt', 'desc')

            .limit(100)

            .get()

            .catch(() => window.ModulusFirebase.db.collection('profiles').where('role', '==', 'student').limit(100).get());

        return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    },



    async uploadProfilePhoto(uid, file) {

        // Firestore-only build: photo upload is not supported.
        throw new Error('Photo upload disabled: storage is not configured in this build.');

    },



    subscribeChannelPosts(callback) {

        if (!window.ModulusFirebase?.ready) return () => {};

        return window.ModulusFirebase.db.collection('channelPosts')

            .orderBy('createdAt', 'desc')

            .onSnapshot(

                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),

                () => callback(null)

            );

    },



    async publishChannelPost(post) {

        if (!window.ModulusFirebase?.ready) throw new Error('Firebase not ready');

        return window.ModulusFirebase.db.collection('channelPosts').add({

            ...post,

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp(),

            reactions: post.reactions || { like: 0, fire: 0, heart: 0 },

            comments: post.comments || []

        });

    },



    async submitAssignmentEnquiry(data) {

        if (!window.ModulusFirebase?.ready) {

            const key = 'osiris_assignment_enquiries';

            const list = JSON.parse(localStorage.getItem(key) || '[]');

            list.push({ ...data, createdAt: new Date().toISOString(), status: 'pending' });

            localStorage.setItem(key, JSON.stringify(list));

            return;

        }

        return window.ModulusFirebase.db.collection('assignmentEnquiries').add({

            ...data,

            status: 'pending',

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

    },



    subscribeChatMessages(callback) {

        if (!window.ModulusFirebase?.ready) return () => {};

        return window.ModulusFirebase.db.collection('chatMessages')

            .orderBy('createdAt', 'asc')

            .limitToLast(200)

            .onSnapshot(

                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),

                () => callback(null)

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

        const ref = await window.ModulusFirebase.db.collection('chatMessages').add({

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

        await window.ModulusFirebase.db.collection('chatMessages').doc(id).delete();

    },



    async pushNotification(data) {

        if (!window.ModulusFirebase?.ready) return;

        return window.ModulusFirebase.db.collection('notifications').add({

            ...data,

            read: false,

            createdAt: window.ModulusFirebase.firestoreUtils.serverTimestamp()

        });

    },



    subscribeNotifications(email, callback) {

        if (!window.ModulusFirebase?.ready || !email) return () => {};

        return window.ModulusFirebase.db.collection('notifications')

            .where('email', '==', email)

            .orderBy('createdAt', 'desc')

            .limit(20)

            .onSnapshot(

                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),

                () => callback(null)

            );

    },



    getLocalChatMessages() {

        try { return JSON.parse(localStorage.getItem('osiris_chat_messages') || '[]'); } catch { return []; }

    }

};

// (intentionally no OsirisDB namespace; ModulusFirebase is the only supported namespace)
})();


