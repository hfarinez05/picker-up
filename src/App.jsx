import { useEffect, useState } from "react";
import { auth, db } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./components/LoginForm";
import PedidosList from "./components/PedidosList";
import AdminPage from "./pages/AdminPage";
import RegisterForm from "./components/RegisterForm";

function App() {
  const [user, setUser] = useState(null);
  const [activo, setActivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setActivo(snap.data().activo);
      } else {
        setUser(null);
        setActivo(null);
      }
      setLoading(false); // Ya tenemos el estado de autenticación, podemos mostrar la app
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <p>⏳ Verificando sesión...</p>
      </div>
    );
  }

  if (user && activo === false) {
    return (
      <div style={{ background: "red", color: "white" }}>
        🚫 Cuenta bloqueada
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de login */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        {/* Ruta de pedidos (solo si está logueado y activo) */}
        <Route
          path="/pedidos"
          element={
            user && activo ? (
              <PedidosList user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Ruta admin */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Ruta raíz */}
        <Route
          path="/"
          element={
            !user ? <Navigate to="/login" /> : <p>Bienvenido {user.email}</p>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
