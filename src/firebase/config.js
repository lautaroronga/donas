import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDEsF_8XD6KY3BKlzzXUCBXgfdLEGHqZh0",
  authDomain: "donasaccion.firebaseapp.com",
  projectId: "donasaccion",
  storageBucket: "donasaccion.firebasestorage.app",
  messagingSenderId: "307279988541",
  appId: "1:307279988541:web:55d318c75387ea97466754"
};
const app = initializeApp(firebaseConfig);

export const datab = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); 
