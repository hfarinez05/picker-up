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
      try {
        if (usuario) {
          setUser(usuario);

          const ref = doc(db, "usuarios", usuario.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setActivo(snap.data().activo);
          } else {
            setActivo(false);
          }
        } else {
          setUser(null);
          setActivo(null);
        }
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
        setUser(null);
        setActivo(false);
      } finally {
        setLoading(false);
      }
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

  // 🚫 Usuario bloqueado
  if (user && activo === false) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8d7da",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <h2 style={{ color: "#dc3545" }}>🚫 Cuenta bloqueada</h2>
          <p style={{ margin: "15px 0", color: "#333" }}>
            Tu cuenta está desactivada. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={!user ? <LoginForm /> : <Navigate to="/pedidos" />}
        />

        {/* Register */}
        <Route
          path="/register"
          element={!user ? <RegisterForm /> : <Navigate to="/pedidos" />}
        />

        {/* Pedidos (PROTEGIDO) */}
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

        {/* Admin (PROTEGIDO BÁSICO) */}
        <Route
          path="/admin"
          element={user && activo ? <AdminPage /> : <Navigate to="/login" />}
        />

        {/* Home */}
        <Route
          path="/"
          element={<Navigate to={user ? "/pedidos" : "/register"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
