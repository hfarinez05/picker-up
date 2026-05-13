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

import "../styles/adminPage.css";

function AdminPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [correoBusqueda, setCorreoBusqueda] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [filtro, setFiltro] = useState("todos");

  // ------------------------
  // CARGAR USUARIOS
  // ------------------------
  const cargarUsuarios = async () => {
    const snap = await getDocs(collection(db, "usuarios"));
    setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ------------------------
  // BUSCAR USUARIO
  // ------------------------
  const buscarUsuario = async () => {
    if (!correoBusqueda) return;

    const q = query(
      collection(db, "usuarios"),
      where("email", "==", correoBusqueda.toLowerCase().trim()),
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      setUsuarioEncontrado(null);
      setMensaje("Usuario no encontrado");
      return;
    }

    const docu = snap.docs[0];
    setUsuarioEncontrado({ id: docu.id, ...docu.data() });
  };

  // ------------------------
  // LIMPIAR BÚSQUEDA
  // ------------------------
  const limpiarBusqueda = () => {
    setUsuarioEncontrado(null);
    setCorreoBusqueda("");
    setMensaje("");
  };

  // ------------------------
  // CAMBIAR ESTADO
  // ------------------------
  const cambiarEstado = async (uid, estado) => {
    await updateDoc(doc(db, "usuarios", uid), { activo: estado });

    setUsuarios((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, activo: estado } : u)),
    );

    if (usuarioEncontrado?.id === uid) {
      setUsuarioEncontrado({ ...usuarioEncontrado, activo: estado });
    }

    setMensaje("Usuario actualizado");
  };

  // ------------------------
  // FILTRO
  // ------------------------
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtro === "activos") return u.activo === true;
    if (filtro === "inactivos") return u.activo === false;
    return true;
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>⚙️ Panel de Administración</h2>

        {/* BUSCADOR */}
        <div style={styles.search}>
          <input
            placeholder="Buscar usuario por correo..."
            value={correoBusqueda}
            onChange={(e) => setCorreoBusqueda(e.target.value)}
            style={styles.input}
          />

          <button onClick={buscarUsuario} style={styles.button}>
            Buscar
          </button>

          {usuarioEncontrado && (
            <button onClick={limpiarBusqueda} style={styles.secondaryButton}>
              Limpiar
            </button>
          )}
        </div>

        {/* FILTROS */}
        {!usuarioEncontrado && (
          <div style={styles.filters}>
            <button
              onClick={() => setFiltro("todos")}
              style={filtro === "todos" ? styles.filterActive : styles.filter}
            >
              Todos
            </button>

            <button
              onClick={() => setFiltro("activos")}
              style={filtro === "activos" ? styles.filterActive : styles.filter}
            >
              Activos
            </button>

            <button
              onClick={() => setFiltro("inactivos")}
              style={
                filtro === "inactivos" ? styles.filterActive : styles.filter
              }
            >
              Inactivos
            </button>
          </div>
        )}

        {/* USUARIO ENCONTRADO (SOLO UNO) */}
        {usuarioEncontrado && (
          <div style={styles.card}>
            <p style={styles.email}>{usuarioEncontrado.email}</p>

            <p
              style={usuarioEncontrado.activo ? styles.active : styles.inactive}
            >
              {usuarioEncontrado.activo ? "Activo" : "Inactivo"}
            </p>

            <div style={styles.row}>
              <button
                style={styles.btnGreen}
                onClick={() => cambiarEstado(usuarioEncontrado.id, true)}
              >
                Activar
              </button>

              <button
                style={styles.btnRed}
                onClick={() => cambiarEstado(usuarioEncontrado.id, false)}
              >
                Desactivar
              </button>
            </div>
          </div>
        )}

        {/* LISTA SOLO SI NO HAY BÚSQUEDA */}
        {!usuarioEncontrado && (
          <div style={styles.grid}>
            {usuariosFiltrados.map((u) => (
              <div key={u.id} style={styles.card}>
                <p style={styles.email}>{u.email}</p>

                <p style={u.activo ? styles.active : styles.inactive}>
                  {u.activo ? "Activo" : "Inactivo"}
                </p>

                <div style={styles.row}>
                  <button
                    style={styles.btnGreen}
                    onClick={() => cambiarEstado(u.id, true)}
                  >
                    Activar
                  </button>

                  <button
                    style={styles.btnRed}
                    onClick={() => cambiarEstado(u.id, false)}
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {mensaje && <p style={styles.msg}>{mensaje}</p>}
      </div>
    </div>
  );
}

// ------------------------
// ESTILOS
// ------------------------
const styles = {
  page: {
    background: "#f4f6f9",
    minHeight: "100vh",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
  },

  container: {
    width: "100%",
    maxWidth: "900px",
  },

  title: {
    marginBottom: "20px",
  },

  search: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "15px",
  },

  input: {
    flex: 1,
    minWidth: "200px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },

  button: {
    padding: "12px 16px",
    background: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "8px",
  },

  secondaryButton: {
    padding: "12px 16px",
    background: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "8px",
  },

  filters: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
    flexWrap: "wrap",
  },

  filter: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  },

  filterActive: {
    padding: "8px 12px",
    borderRadius: "8px",
    background: "#0d6efd",
    color: "white",
    border: "1px solid #0d6efd",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px",
  },

  card: {
    background: "white",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  email: {
    fontWeight: "bold",
    wordBreak: "break-word",
  },

  row: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
    flexWrap: "wrap",
  },

  btnGreen: {
    background: "#28a745",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
  },

  btnRed: {
    background: "#dc3545",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
  },

  active: {
    color: "green",
    fontWeight: "bold",
  },

  inactive: {
    color: "red",
    fontWeight: "bold",
  },

  msg: {
    marginTop: "15px",
    color: "#0d6efd",
    fontWeight: "bold",
  },
};

export default AdminPage;
