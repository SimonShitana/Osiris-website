// Firebase Osiris setup — Firestore + Auth only (modular SDK).
// This file is intended to be included as a normal <script src="js/firebase-config.js"></script> (not type="module").

(function () {
  // Ensure a shared namespace exists immediately to prevent load-order crashes.
  window.ModulusFirebase = window.ModulusFirebase || {};

  const isFileProtocol = window.location.protocol === 'file:';

  if (isFileProtocol) {
    console.info('Osiris: file:// detected — running in local mode (no live Firebase connection).');
    window.ModulusFirebase = {
      // mark ready false for safe guards
      ready: false,
      fileMode: true,
      // Safe stubs so downstream scripts never throw in local file mode.
      firestoreUtils: {
        serverTimestamp: () => null
      },
      auth: {},
      authUtils: {},
      db: {},
      app: null,
      analytics: null
    };
    return;
  }

  // live mode: fill ModulusFirebase asynchronously below

  const firebaseConfig = {
    apiKey: "AIzaSyAmgNXCWwHhl_7IGFwztY-d4KIdW7z_-F8",
    authDomain: "appproject-8fb74.firebaseapp.com",
    projectId: "appproject-8fb74",
    storageBucket: "appproject-8fb74.firebasestorage.app",
    messagingSenderId: "929414042618",
    appId: "1:929414042618:web:6518362fb037550c65ca43",
    measurementId: "G-QYG0GRVHKR"
  };

  (async () => {
    try {
      const [{ initializeApp }, { getAnalytics }, { getAuth }, { getFirestore }, firestoreUtils, authUtils] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js')
      ]);

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);

      let analytics = null;
      if (window.location.hostname !== 'localhost') {
        analytics = getAnalytics(app);
      }

      window.ModulusFirebase = {
        ready: true,
        fileMode: false,
        app,
        auth,
        db,
        analytics,
        firestoreUtils: {
          serverTimestamp: firestoreUtils.serverTimestamp
        },
        authUtils: {
          EmailAuthProvider: authUtils.EmailAuthProvider,
          reauthenticateWithCredential: authUtils.reauthenticateWithCredential
        }
      };

      console.log('Osiris: Firebase (Firestore/Auth) synced successfully!');
    } catch (error) {
      console.error('Osiris: Critical error during live Firebase init:', error);
      window.ModulusFirebase = {
        ready: false,
        error,
        fileMode: false,
        firestoreUtils: { serverTimestamp: () => null },
        auth: {},
        authUtils: {},
        db: {}
      };
    }
  })();
})();
