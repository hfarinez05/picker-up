import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANdvRr-AufA8QGyVkYx4zom4RsKSg01b8",
  authDomain: "picker-up-e339d.firebaseapp.com",
  projectId: "picker-up-e339d",
  storageBucket: "picker-up-e339d.appspot.com",
  messagingSenderId: "263387222824",
  appId: "1:263387222824:web:d7e7676b98770f7142761d",
  measurementId: "G-GFMZK0V8R4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
