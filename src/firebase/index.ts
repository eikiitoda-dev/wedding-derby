import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhyht5guQLkAYEdMQ-C1c-JOQSFpVA47c",
  authDomain: "wedding-derby.firebaseapp.com",
  projectId: "wedding-derby",
  storageBucket: "wedding-derby.firebasestorage.app",
  messagingSenderId: "776397264194",
  appId: "1:776397264194:web:3d9bc4ec1100e9a791a4db",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);