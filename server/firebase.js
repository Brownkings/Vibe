import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import service account (using require for JSON)
// Assuming serviceAccountKey.json is in the root
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export const db = admin.firestore();
