import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const user = await login(email, password);
      navigate("/pedidos"); // redirige inmediatamente al listado de pedidos
    } catch (err) {
      console.error("❌ Error en login:", err.code, err.message);

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        alert("Este correo no está registrado. Debe registrarse primero.");
        navigate("/register");
      } else if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta. Intente nuevamente.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f2f5",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "350px",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#0d6efd" }}>🔑 Login</h2>
        <input
          id="email"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <input
          id="password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#0d6efd",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Iniciar sesión
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "15px", fontSize: "14px" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

export default LoginForm;
