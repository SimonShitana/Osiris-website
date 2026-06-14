/**
 * Firebase initialization — disabled on file:// (use local auth + local server for Firebase)
 */
(function () {
    const isFileProtocol = location.protocol === 'file:';

    if (isFileProtocol) {
        console.info('Osiris: file:// detected — using local accounts. Run a local server for Firebase sync.');
        window.OsirisFirebase = { ready: false, fileMode: true };
        return;
    }

    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded. Using local auth fallback.');
        window.OsirisFirebase = { ready: false };
        return;
    }

    const firebaseConfig = {
        apiKey: 'AIzaSyAmgNXCWwHhl_7IGFwztY-d4KIdW7z_-F8',
        authDomain: 'appproject-8fb74.firebaseapp.com',
        projectId: 'appproject-8fb74',
        storageBucket: 'appproject-8fb74.firebasestorage.app',
        messagingSenderId: '929414042618',
        appId: '1:929414042618:web:60f78e0f488f0ee665ca43',
        measurementId: 'G-RKYRFZE4X9'
    };

    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

    if (typeof firebase.analytics === 'function' && location.hostname !== 'localhost') {
        try { firebase.analytics(); } catch (_) { /* optional */ }
    }

    window.OsirisFirebase = { ready: true, app, auth, db, storage, firebaseConfig, fileMode: false };
})();
