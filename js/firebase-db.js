/**

 * Firestore helpers — profiles, channel, enquiries, chat, notifications

 */

window.OsirisDB = {

    async ensureUserProfile(uid, data) {

        if (!window.OsirisFirebase?.ready) return null;

        const db = OsirisFirebase.db;

        const ref = db.collection('profiles').doc(uid);

        const snap = await ref.get();

        const defaultPhoto = OSIRIS_CONFIG?.assets?.defaultAvatar || '';

        if (!snap.exists) {

            await ref.set({

                displayName: data.displayName || 'Student',

                email: data.email || '',

                role: data.role || 'student',

                photoURL: data.photoURL || defaultPhoto,

                createdAt: firebase.firestore.FieldValue.serverTimestamp(),

                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()

            });

        } else {

            await ref.update({

                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),

                updatedAt: firebase.firestore.FieldValue.serverTimestamp()

            });

        }

        return (await ref.get()).data();

    },



    async getUserProfile(uid) {

        if (!window.OsirisFirebase?.ready) return null;

        const snap = await OsirisFirebase.db.collection('profiles').doc(uid).get();

        return snap.exists ? snap.data() : null;

    },



    async updateUserProfile(uid, updates) {

        if (!window.OsirisFirebase?.ready) return;

        await OsirisFirebase.db.collection('profiles').doc(uid).update({

            ...updates,

            updatedAt: firebase.firestore.FieldValue.serverTimestamp()

        });

    },



    async listStudents() {

        if (!window.OsirisFirebase?.ready) return [];

        const snap = await OsirisFirebase.db.collection('profiles')

            .where('role', '==', 'student')

            .orderBy('lastLoginAt', 'desc')

            .limit(100)

            .get()

            .catch(() => OsirisFirebase.db.collection('profiles').where('role', '==', 'student').limit(100).get());

        return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    },



    async uploadProfilePhoto(uid, file) {

        if (!window.OsirisFirebase?.ready) throw new Error('Firebase not ready');

        const path = `profiles/${uid}/${Date.now()}_${file.name}`;

        const storageRef = OsirisFirebase.storage.ref(path);

        await storageRef.put(file);

        const url = await storageRef.getDownloadURL();

        await this.updateUserProfile(uid, { photoURL: url });

        return url;

    },



    subscribeChannelPosts(callback) {

        if (!window.OsirisFirebase?.ready) return () => {};

        return OsirisFirebase.db.collection('channelPosts')

            .orderBy('createdAt', 'desc')

            .onSnapshot(

                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),

                () => callback(null)

            );

    },



    async publishChannelPost(post) {

        if (!window.OsirisFirebase?.ready) throw new Error('Firebase not ready');

        return OsirisFirebase.db.collection('channelPosts').add({

            ...post,

            createdAt: firebase.firestore.FieldValue.serverTimestamp(),

            reactions: post.reactions || { like: 0, fire: 0, heart: 0 },

            comments: post.comments || []

        });

    },



    async submitAssignmentEnquiry(data) {

        if (!window.OsirisFirebase?.ready) {

            const key = 'osiris_assignment_enquiries';

            const list = JSON.parse(localStorage.getItem(key) || '[]');

            list.push({ ...data, createdAt: new Date().toISOString(), status: 'pending' });

            localStorage.setItem(key, JSON.stringify(list));

            return;

        }

        return OsirisFirebase.db.collection('assignmentEnquiries').add({

            ...data,

            status: 'pending',

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });

    },



    subscribeChatMessages(callback) {

        if (!window.OsirisFirebase?.ready) return () => {};

        return OsirisFirebase.db.collection('chatMessages')

            .orderBy('createdAt', 'asc')

            .limitToLast(200)

            .onSnapshot(

                (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),

                () => callback(null)

            );

    },



    async sendChatMessage(data) {

        if (!window.OsirisFirebase?.ready) {

            const key = 'osiris_chat_messages';

            const list = JSON.parse(localStorage.getItem(key) || '[]');

            const msg = { ...data, id: 'local_' + Date.now(), createdAt: new Date().toISOString() };

            list.push(msg);

            localStorage.setItem(key, JSON.stringify(list.slice(-200)));

            window.dispatchEvent(new CustomEvent('osiris-chat-local', { detail: msg }));

            return msg;

        }

        const ref = await OsirisFirebase.db.collection('chatMessages').add({

            ...data,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });

        return { id: ref.id, ...data };

    },



    async deleteChatMessage(id) {

        if (!window.OsirisFirebase?.ready) {

            const key = 'osiris_chat_messages';

            const list = JSON.parse(localStorage.getItem(key) || '[]').filter((m) => m.id !== id);

            localStorage.setItem(key, JSON.stringify(list));

            return;

        }

        await OsirisFirebase.db.collection('chatMessages').doc(id).delete();

    },



    async pushNotification(data) {

        if (!window.OsirisFirebase?.ready) return;

        return OsirisFirebase.db.collection('notifications').add({

            ...data,

            read: false,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });

    },



    subscribeNotifications(email, callback) {

        if (!window.OsirisFirebase?.ready || !email) return () => {};

        return OsirisFirebase.db.collection('notifications')

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


