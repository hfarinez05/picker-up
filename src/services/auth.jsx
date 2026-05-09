import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function registrar(email, password) {
  //console.log("👉 INICIANDO REGISTRO con:", email);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    //console.log("✔ AUTH OK:", userCredential);

    const uid = userCredential.user.uid;
    const data = {
      email: email.toLowerCase().trim(),
      activo: false,
    };

    await setDoc(doc(db, "usuarios", uid), data);
    console.log("✔ FIRESTORE OK: Documento creado en 'usuarios' con ID:", uid);

    return userCredential;
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      //console.error("❌ ERROR: El correo ya está registrado");
      alert("Este correo ya está registrado. Usa otro o inicia sesión.");
    } else {
      //console.error("❌ ERROR EN REGISTRO:", error);
      alert(error.message);
    }
    throw error;
  }
}

export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return await signOut(auth);
}
