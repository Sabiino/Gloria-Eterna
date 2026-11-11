import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const config = { apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID, measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID };
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);
const app = firebaseEnabled ? (getApps().length ? getApp() : initializeApp(config)) : undefined;
/** Use the browser defaults on web and AsyncStorage-backed persistence on native. */
export const auth = app
  ? Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : undefined;
export const db = app ? getFirestore(app) : undefined;
