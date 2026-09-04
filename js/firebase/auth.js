import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { showToast } from "../utils.js";

export async function signUp(name, email, password, photoURL = '') {
  console.log("1. Signup started");

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  console.log("2. Auth user created:", cred.user.uid);

  await updateProfile(cred.user, {
    displayName: name,
    photoURL
  });

  console.log("3. Profile updated in Authentication");

  try {
    console.log("4. Creating Firestore user document...");

    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      photoURL: photoURL || '',
      bio: '',
      role: 'user',
      createdAt: serverTimestamp()
    });

    console.log("5. Firestore user document CREATED:", cred.user.uid);

  } catch (error) {
    console.error("FIRESTORE USER DOCUMENT ERROR:", error);
    throw error;
  }

  try {
    await sendEmailVerification(cred.user);
  } catch (e) {
    console.warn('Verification email failed', e);
  }

  return cred.user;
}
/** Login */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Logout */
export async function logout() {
  await signOut(auth);
  showToast('Logged out', 'See you next time!', 'info');
  window.location.href = 'index.html';
}

/** Password reset */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/** Listen to auth state changes */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Get current user (sync after first load) */
export function getCurrentUser() {
  return auth.currentUser;
}