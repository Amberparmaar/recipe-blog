
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


  const firebaseConfig = {
    apiKey: "AIzaSyA2SsNphcJpxIcltr8ci6OXwE1Om_lTZuA",
    authDomain: "recipe-b99ef.firebaseapp.com",
    projectId: "recipe-b99ef",
    storageBucket: "recipe-b99ef.firebasestorage.app",
    messagingSenderId: "488003811880",
    appId: "1:488003811880:web:63ad6d9c4cd3de39e2931d"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;