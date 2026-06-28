// Firebase Modulus setup — Firestore + Auth only (modular v10+).
// This file is intended to be included as a normal <script src="js/firebase-config.js"></script> (not type="module").

(function () {
  // Ensure a shared namespace exists immediately to prevent load-order crashes.
  window.ModulusFirebase = window.ModulusFirebase || {};

  const isFileProtocol = window.location.protocol === 'file:';

  if (isFileProtocol) {
    console.info('Modulus: file:// detected — running in local mode (no live Firebase connection).');
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
    apiKey: "AIzaSyDGoyHspzIK9s2vkbjL033h8-4M_dsziiE",
    authDomain: "symon-8ac14.firebaseapp.com",
    projectId: "symon-8ac14",
    storageBucket: "symon-8ac14.firebasestorage.app",
    messagingSenderId: "532244774030",
    appId: "1:532244774030:web:7bbbe5630ab1f893b5dddf",
    measurementId: "G-JTHT9NL7X4"
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

      console.log('Modulus: Firebase (Firestore/Auth) synced successfully!');
    } catch (error) {
      console.error('Modulus: Critical error during live Firebase init:', error);
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

