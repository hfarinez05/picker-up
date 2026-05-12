import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

function AdminPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [correoBusqueda, setCorreoBusqueda] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [mensaje, setMensaje] = useState("");

  // Cargar todos los usuarios
  const cargarUsuarios = async () => {
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      const lista = snap.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      }));
      setUsuarios(lista);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setMensaje("No se pudieron cargar los usuarios");
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Buscar usuario por correo
  const buscarUsuarioPorCorreo = async () => {
    try {
      if (!correoBusqueda) {
        setMensaje("Debes ingresar un correo");
        return;
      }
      const q = query(
        collection(db, "usuarios"),
        where("email", "==", correoBusqueda.toLowerCase().trim()),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setUsuarioEncontrado(null);
        setMensaje("No se encontró usuario con ese correo");
        return;
      }

      const docu = snap.docs[0];
      setUsuarioEncontrado({ id: docu.id, ...docu.data() });
      setMensaje(`UID encontrado: ${docu.id}`);
    } catch (error) {
      console.error("Error al buscar usuario:", error);
      setMensaje("Error al buscar usuario");
    }
  };

  // Cambiar estado activo
  const cambiarEstadoUsuario = async (uid, nuevoEstado) => {
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, { activo: nuevoEstado });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, activo: nuevoEstado } : u)),
      );
      if (usuarioEncontrado && usuarioEncontrado.id === uid) {
        setUsuarioEncontrado({ ...usuarioEncontrado, activo: nuevoEstado });
      }
      setMensaje(`Usuario ${uid} actualizado a activo=${nuevoEstado}`);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      setMensaje("No se pudo actualizar el estado");
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtro === "activos") return u.activo === true;
    if (filtro === "inactivos") return u.activo === false;
    return true;
  });

  return (
    <div
      style={{
        padding: "30px",
        background: "#f0f2f5",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ color: "#0d6efd", marginBottom: "10px" }}>
          ⚙️ Panel de Administración
        </h2>
        <p style={{ color: "#555", marginBottom: "20px" }}>
          Activa o desactiva usuarios, busca por correo y filtra por estado.
        </p>

        {/* Buscador */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="email"
            placeholder="Correo del usuario"
            value={correoBusqueda}
            onChange={(e) => setCorreoBusqueda(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              marginRight: "10px",
              width: "250px",
            }}
          />
          <button
            onClick={buscarUsuarioPorCorreo}
            style={{
              background: "#0d6efd",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Buscar
          </button>
        </div>

        {/* Usuario encontrado */}
        {usuarioEncontrado && (
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <p>
              <strong>Correo:</strong> {usuarioEncontrado.email}
            </p>
            <p>
              <strong>UID:</strong> {usuarioEncontrado.id}
            </p>
            <p>
              <strong>Activo:</strong>{" "}
              {usuarioEncontrado.activo ? "✅ Sí" : "❌ No"}
            </p>
            <button
              onClick={() => cambiarEstadoUsuario(usuarioEncontrado.id, true)}
              style={{
                background: "green",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              Activar
            </button>
            <button
              onClick={() => cambiarEstadoUsuario(usuarioEncontrado.id, false)}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Desactivar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setFiltro("todos")}
            style={{ marginRight: "10px" }}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro("activos")}
            style={{ marginRight: "10px" }}
          >
            Activos
          </button>
          <button onClick={() => setFiltro("inactivos")}>Inactivos</button>
        </div>

        {/* Tabla */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
          }}
        >
          <thead>
            <tr style={{ background: "#e9ecef" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Correo</th>
              <th style={{ padding: "10px", textAlign: "left" }}>UID</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Activo</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px" }}>{u.email}</td>
                <td style={{ padding: "8px" }}>{u.id}</td>
                <td style={{ padding: "8px" }}>
                  {u.activo ? "✅ Sí" : "❌ No"}
                </td>
                <td style={{ padding: "8px" }}>
                  <button
                    onClick={() => cambiarEstadoUsuario(u.id, true)}
                    style={{
                      background: "green",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      marginRight: "10px",
                      cursor: "pointer",
                    }}
                  >
                    Activar
                  </button>
                  <button
                    onClick={() => cambiarEstadoUsuario(u.id, false)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {mensaje && (
          <p style={{ color: "#0d6efd", fontWeight: "bold" }}>{mensaje}</p>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
