import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function registrar(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const uid = userCredential.user.uid;
    const data = {
      email: email.toLowerCase().trim(),
      activo: false,
      admin: false,
    };

    await setDoc(doc(db, "usuarios", uid), data);
    //console.log("✔ FIRESTORE OK: Documento creado en 'usuarios' con ID:", uid);

    return userCredential; // 👈 solo retorna si todo salió bien
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error(
        "Este correo ya está registrado. Usa otro o inicia sesión.",
      );
    } else {
      throw error; // 👈 lanza el error para que RegisterForm lo capture
    }
  }
}

export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return await signOut(auth);
}
