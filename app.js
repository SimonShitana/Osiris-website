// Modulus Firestore (CDN ES modules) — no npm / no Node
// Uses Firebase v10+ modular SDK via browser CDN imports.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Paste your Firebase project config here.
 * Example fields:
 * - apiKey
 * - authDomain
 * - projectId
 * - storageBucket
 * - messagingSenderId
 * - appId
 */
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE",
};

let _db = null;

function ensureDb() {
  if (_db) return _db;

  // If config is still placeholder, fail fast with a useful message.
  const hasRealConfig =
    firebaseConfig &&
    !String(firebaseConfig.apiKey || "").startsWith("PASTE_") &&
    !String(firebaseConfig.projectId || "").startsWith("PASTE_");

  if (!hasRealConfig) {
    throw new Error(
      "Modulus Firestore: firebaseConfig is placeholder. Paste real Firebase credentials into app.js."
    );
  }

  const app = initializeApp(firebaseConfig);
  _db = getFirestore(app);
  return _db;
}

const ModulusFirestore = {
  /** Call once (optional) to force initialization */
  init() {
    ensureDb();
    return { ready: true };
  },

  /** Upsert profile document: profiles/{uid} */
  async upsertUserProfile(uid, data = {}) {
    const db = ensureDb();

    if (!uid) throw new Error("upsertUserProfile: uid is required");

    const profileRef = doc(collection(db, "profiles"), uid);

    // Merge-like behavior using setDoc; Firestore will overwrite provided keys.
    // If you want true merge semantics, add merge: true.
    await setDoc(profileRef, {
      displayName: data.displayName ?? "Student",
      email: data.email ?? "",
      role: data.role ?? "student",
      photoURL: data.photoURL ?? "",
      createdAt: data.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      ...data,
      // Ensure timestamps are always fresh.
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      ...(data.createdAt ? { createdAt: data.createdAt } : { createdAt: serverTimestamp() }),
    });

    return { uid, ...data };
  },

  async setChannelPost(postId, data = {}) {
    const db = ensureDb();
    if (!postId) throw new Error("setChannelPost: postId is required");

    const postRef = doc(collection(db, "channelPosts"), postId);
    await setDoc(postRef, {
      ...data,
      createdAt: data.createdAt ?? serverTimestamp(),
      reactions: data.reactions ?? { like: 0, fire: 0, heart: 0, fire2: 0 },
      comments: data.comments ?? [],
    });

    return postRef.id;
  },

  async addChannelPost(data = {}) {
    const db = ensureDb();
    const colRef = collection(db, "channelPosts");

    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: data.createdAt ?? serverTimestamp(),
      reactions: data.reactions ?? { like: 0, fire: 0, heart: 0, fire2: 0 },
      comments: data.comments ?? [],
    });

    return docRef.id;
  },

  /** assignmentEnquiries/{enquiryId} */
  async setAssignmentEnquiry(enquiryId, data = {}) {
    const db = ensureDb();
    if (!enquiryId) throw new Error("setAssignmentEnquiry: enquiryId is required");

    const ref = doc(collection(db, "assignmentEnquiries"), enquiryId);

    await setDoc(ref, {
      ...data,
      status: data.status ?? "pending",
      createdAt: data.createdAt ?? serverTimestamp(),
    });

    return ref.id;
  },

  async addAssignmentEnquiry(data = {}) {
    const db = ensureDb();
    const ref = await addDoc(collection(db, "assignmentEnquiries"), {
      ...data,
      status: data.status ?? "pending",
      createdAt: data.createdAt ?? serverTimestamp(),
    });

    return ref.id;
  },

  /** projects/{projectId} */
  async setProject(projectId, data = {}) {
    const db = ensureDb();
    if (!projectId) throw new Error("setProject: projectId is required");

    const ref = doc(collection(db, "projects"), projectId);

    await setDoc(ref, {
      ...data,
      createdAt: data.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  },

  async addProject(data = {}) {
    const db = ensureDb();
    const ref = await addDoc(collection(db, "projects"), {
      ...data,
      createdAt: data.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  },

  /** chatMessages/{messageId} */
  async setChatMessage(messageId, data = {}) {
    const db = ensureDb();
    if (!messageId) throw new Error("setChatMessage: messageId is required");

    const ref = doc(collection(db, "chatMessages"), messageId);

    await setDoc(ref, {
      ...data,
      createdAt: data.createdAt ?? serverTimestamp(),
    });

    return ref.id;
  },

  async addChatMessage(data = {}) {
    const db = ensureDb();
    const ref = await addDoc(collection(db, "chatMessages"), {
      ...data,
      createdAt: data.createdAt ?? serverTimestamp(),
    });

    return ref.id;
  },

  /** notifications/{notifId} */
  async setNotification(notifId, data = {}) {
    const db = ensureDb();
    if (!notifId) throw new Error("setNotification: notifId is required");

    const ref = doc(collection(db, "notifications"), notifId);

    await setDoc(ref, {
      ...data,
      read: data.read ?? false,
      createdAt: data.createdAt ?? serverTimestamp(),
    });

    return ref.id;
  },

  async addNotification(data = {}) {
    const db = ensureDb();
    const ref = await addDoc(collection(db, "notifications"), {
      ...data,
      read: data.read ?? false,
      createdAt: data.createdAt ?? serverTimestamp(),
    });

    return ref.id;
  },
};

// Expose globally so your existing non-module scripts can call it.
window.ModulusFirestore = ModulusFirestore;

