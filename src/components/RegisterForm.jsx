import { useNavigate } from "react-router-dom";
import { registrar } from "../services/auth";

function RegisterForm() {
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await registrar(email, password);
      alert(
        "Usuario registrado con éxito. Debe ser habilitado por el administrador.",
      );
      navigate("/login"); // 👈 después de registro exitoso, va a login
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Este correo ya está registrado. Inicie sesión.");
        navigate("/login"); // 👈 si ya existe, redirige a login
      } else {
        alert(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input id="email" type="email" placeholder="Correo" />
      <input id="password" type="password" placeholder="Contraseña" />
      <button type="submit">Registrar</button>
    </form>
  );
}

export default RegisterForm;
