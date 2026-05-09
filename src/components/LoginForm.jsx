import { useNavigate } from "react-router-dom";
import { login } from "../services/auth"; // tu función login

function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await login(email, password);
      //console.log("✔ LOGIN OK, redirigiendo a /pedidos");
      navigate("/pedidos"); // 👈 redirige a la ruta pedidos
    } catch (error) {
      //console.error("❌ ERROR EN LOGIN:", error);
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input id="email" type="email" placeholder="Correo" />
      <input id="password" type="password" placeholder="Contraseña" />
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;
