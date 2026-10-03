// Firebase Osiris setup — Firestore + Auth (modular SDK).
// This file is intended to be included as a normal <script src="js/firebase-config.js"></script> (not type="module").

(function () {
  // Ensure a shared namespace exists immediately to prevent load-order crashes.
  window.ModulusFirebase = window.ModulusFirebase || {};
  window.OsirisFirebase = window.ModulusFirebase;

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
    window.OsirisFirebase = window.ModulusFirebase;
    return;
  }

  // live mode: fill ModulusFirebase asynchronously below

  const firebaseConfig = {
    apiKey: "AIzaSyBN4cfbqmFnemrF4j4ICzeM3Rlt9TorXEY",
    authDomain: "peerconnect-a06f4.firebaseapp.com",
    projectId: "peerconnect-a06f4",
    storageBucket: "peerconnect-a06f4.firebasestorage.app",
    messagingSenderId: "259442977638",
    appId: "1:259442977638:web:db2a479e49929d7e47f6a7",
    measurementId: "G-GK41G62ETT"
  };

  (async () => {
    try {
      const [{ initializeApp }, { getAnalytics }, authSdk, firestoreUtils] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js'),
      ]);

      const app = initializeApp(firebaseConfig);
      const auth = authSdk.getAuth(app);
      const db = firestoreUtils.getFirestore(app);

      let analytics = null;
      if (window.location.hostname !== 'localhost') {
        analytics = getAnalytics(app);
      }

      Object.assign(window.ModulusFirebase, {
        ready: true,
        fileMode: false,
        app,
        auth,
        db,
        analytics,
        firestoreUtils: {
          serverTimestamp: firestoreUtils.serverTimestamp,
          collection: firestoreUtils.collection,
          doc: firestoreUtils.doc,
          getDoc: firestoreUtils.getDoc,
          getDocs: firestoreUtils.getDocs,
          setDoc: firestoreUtils.setDoc,
          updateDoc: firestoreUtils.updateDoc,
          addDoc: firestoreUtils.addDoc,
          deleteDoc: firestoreUtils.deleteDoc,
          query: firestoreUtils.query,
          where: firestoreUtils.where,
          orderBy: firestoreUtils.orderBy,
          limit: firestoreUtils.limit,
          limitToLast: firestoreUtils.limitToLast,
          onSnapshot: firestoreUtils.onSnapshot
        },
        authUtils: {
          EmailAuthProvider: authSdk.EmailAuthProvider,
          createUserWithEmailAndPassword: authSdk.createUserWithEmailAndPassword,
          signInWithEmailAndPassword: authSdk.signInWithEmailAndPassword,
          signOut: authSdk.signOut,
          updateProfile: authSdk.updateProfile,
          updatePassword: authSdk.updatePassword,
          onAuthStateChanged: authSdk.onAuthStateChanged,
          reauthenticateWithCredential: authSdk.reauthenticateWithCredential
        }
      });
      window.OsirisFirebase = window.ModulusFirebase;
      window.dispatchEvent(new Event('osiris-firebase-ready'));

      console.log('Osiris: Firebase (Firestore/Auth) synced successfully!');
    } catch (error) {
      console.error('Osiris: Critical error during live Firebase init:', error);
      Object.assign(window.ModulusFirebase, {
        ready: false,
        error,
        fileMode: false,
        firestoreUtils: { serverTimestamp: () => null },
        auth: {},
        authUtils: {},
        db: {}
      });
      window.OsirisFirebase = window.ModulusFirebase;
      window.dispatchEvent(new Event('osiris-firebase-ready'));
    }
  })();
})();
