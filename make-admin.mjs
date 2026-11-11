import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: applicationDefault() });

const uid = 'wwv5MkWYCgTjYFKv1UkzX8C8yma2';
const user = await getAuth().getUser(uid);

await getAuth().setCustomUserClaims(uid, {
  ...(user.customClaims ?? {}),
  admin: true,
});

console.log('Admin definido:', user.email, uid);