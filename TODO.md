# TODO — Modulus migration

- [x] Inspect existing js/firebase-db.js, js/auth.js, js/firebase-config.js
- [ ] Unify auth/db namespace to window.ModulusFirebase (remove window.OsirisFirebase/OsirisFirebase)
- [ ] Replace all serverTimestamp usages with window.ModulusFirebase.firestoreUtils.serverTimestamp() (or equivalent)
- [ ] Migrate js/auth.js from legacy firebase.auth.* + non-modular auth calls to modular CDN auth
- [ ] Lock down js/firebase-config.js: window.ModulusFirebase is sole namespace; ensure file:// dummy object matches expected shape
- [ ] Add/ensure window.ModulusFirebase.firestoreUtils in firebase-config.js for timestamp utility
- [ ] Run quick local sanity check by grepping for leftover OsirisFirebase / firebase.auth / serverTimestamp().

