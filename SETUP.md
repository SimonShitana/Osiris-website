# Osiris — Firebase & Firestore Setup

Personal educational platform. No advertisements.

## 1. Create Firestore Database

1. Open [Firebase Console](https://console.firebase.google.com/) → project **peerconnect-a06f4**
2. Go to **Build → Firestore Database**
3. Click **Create database**
4. Choose **Start in production mode** (you will paste rules below)
5. Pick a region close to your users (e.g. `europe-west1` or `us-central1`)

## 2. Enable Authentication

1. **Build → Authentication → Get started**
2. Enable **Email/Password** sign-in
3. (Optional) Add **simonshitana21@gmail.com** as a project owner in **Project settings → Users and permissions**

## 3. Enable Storage (profile photos)

1. **Build → Storage → Get started**
2. Use default bucket: `peerconnect-a06f4.firebasestorage.app`

### Storage rules (Firebase Console → Storage → Rules)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 4. Deploy Firestore Rules

Copy the contents of `firestore.rules` in this folder.

**Option A — Firebase Console**

1. Firestore → **Rules** tab
2. Paste the rules from `firestore.rules`
3. Click **Publish**

**Option B — Firebase CLI**

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select existing project peerconnect-a06f4
firebase deploy --only firestore:rules --project peerconnect-a06f4
```

Publish the rules after changing them in this repository. Permission changes do not take effect in Firestore until they are deployed.

## 5. Create Your Admin Profile (one-time)

After a student signs up via the website, promote your account to admin in Firestore:

1. Firestore → **Data** → collection `profiles`
2. Find your user document (UID from Authentication tab)
3. Edit field `role` from `student` to `admin`

> Admin login on the website still uses username/password from `js/osiris-config.js` for the channel composer. Firebase admin role is for Firestore rule enforcement.

## 6. Collections (created automatically)

Firestore creates each collection when the first document is written; do not create placeholder documents.

| Collection | Purpose |
|---|---|
| `profiles` | User name, email, role, photo URL; created during account setup |
| `channelPosts` | Admin channel writings |
| `assignmentEnquiries` | Student assignment help requests |
| `projects` | Optional live project feed; the current website composer stores new entries locally |
| `chatMessages` | Student chat messages |
| `notifications` | Per-user notifications |

## 7. Folder Structure

```
resources/
  pdfs/           ← all PDF resources
    mechanics-2/  ← Mechanics 2 chapters (Chapter1–6.PDF)
  files/          ← images & non-PDF assets
images/
  NEW.jpg         ← default user profile avatar
  profile.jpg     ← admin channel avatar only
css/pages/        ← per-page styles (auth, profile, home-extras)
js/pages/         ← per-page scripts (auth, profile, projects, assignment-help)
```

## 8. OpenAI API Key (IMPORTANT)

**Never put your OpenAI API key in frontend JavaScript.** Anyone can steal it from the browser.

Use a Firebase Cloud Function or similar backend:

1. Store the key in Firebase environment config: `firebase functions:secrets:set OPENAI_API_KEY`
2. Deploy a HTTPS function that calls OpenAI server-side
3. Set `OSIRIS_CONFIG.ai.endpoint` in `js/osiris-config.js` to your function URL

Until then, Osiris AI uses the built-in rule-based assistant in `js/script.js`.

## 9. Google Form

Linked in config and profile page:

https://docs.google.com/forms/d/e/1FAIpQLScXAFrCG1seW42CMP0XP2TFQYrTzz4Ul-GtONYjSJe6CR3Quw/viewform

## 10. Local Testing

Open `index.html` in a browser or use Live Server. Firebase Auth requires HTTPS or `localhost` for full functionality.

---

**Contact:** simonshitana21@gmail.com
