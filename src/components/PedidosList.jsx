import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";
import "../styles/pedidosList.css";

function PedidosList({ user }) {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  // Inputs controlados
  const [fecha, setFecha] = useState("");
  const [skus, setSkus] = useState("");

  function formatearFecha(fecha) {
    const d = new Date(fecha.seconds ? fecha.seconds * 1000 : fecha);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  // 🔹 Funciones matemáticas
  function obtenerPiqueoUnitario(skus) {
    if (skus >= 1 && skus <= 10) return 120;
    else if (skus >= 11 && skus <= 20) return 70;
    else if (skus >= 21 && skus <= 30) return 60;
    else if (skus >= 31 && skus <= 40) return 55;
    else if (skus >= 41 && skus <= 50) return 50;
    else return 40;
  }

  function calcularBase(skus) {
    return skus <= 50 ? 1000 : 1200;
  }

  function aplicarDescuentos(total) {
    const afp = total * 0.1058;
    const fonasa = total * 0.05;
    const afc = total * 0.0292;
    const neto = total - (afp + fonasa + afc);
    return { afp, fonasa, afc, neto };
  }

  // 🔹 Agregar pedido
  async function agregarPedido() {
    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }
    if (!fecha || !skus) {
      alert("Datos inválidos");
      return;
    }

    const [anio, mes, dia] = fecha.split("-");
    const fechaObj = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
    if (isNaN(fechaObj.getTime())) {
      alert("La fecha ingresada no es válida");
      return;
    }

    const ahora = new Date();
    fechaObj.setHours(ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());

    const skusNum = parseInt(skus);
    const piqueoUnitario = obtenerPiqueoUnitario(skusNum);
    const piqueoTotal = piqueoUnitario * skusNum;
    const base = calcularBase(skusNum);
    const total = piqueoTotal + base;
    const { afp, fonasa, afc, neto } = aplicarDescuentos(total);

    await addDoc(collection(db, "usuarios", user.uid, "pedidos"), {
      fecha: fechaObj,
      skus: skusNum,
      piqueoUnitario,
      piqueoTotal,
      base,
      total,
      afp,
      fonasa,
      afc,
      neto,
    });

    //setFecha("");
    setSkus("");
    cargarPedidosIniciales();
  }

  // 🔹 Cargar pedidos iniciales
  async function cargarPedidosIniciales() {
    setLoading(true);
    const pedidosRef = collection(db, "usuarios", user.uid, "pedidos");
    const q = query(pedidosRef, orderBy("fecha", "desc"), limit(20));
    const snap = await getDocs(q);

    const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPedidos(docs);
    setUltimoDoc(snap.docs[snap.docs.length - 1]);
    setLoading(false);
  }

  // 🔹 Cargar más pedidos
  async function cargarMasPedidos() {
    if (!ultimoDoc) return;
    setLoading(true);
    const pedidosRef = collection(db, "usuarios", user.uid, "pedidos");
    const q = query(
      pedidosRef,
      orderBy("fecha", "desc"),
      startAfter(ultimoDoc),
      limit(20),
    );
    const snap = await getDocs(q);

    const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPedidos((prev) => [...prev, ...docs]);
    setUltimoDoc(snap.docs[snap.docs.length - 1]);
    setLoading(false);
  }

  useEffect(() => {
    if (user) cargarPedidosIniciales();
  }, [user]);

  // 🔹 Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      alert("No se pudo cerrar sesión");
    }
  };

  // 🔹 Eliminar pedido individual
  async function eliminarPedido(id) {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "usuarios", user.uid, "pedidos", id));
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      alert("No se pudo eliminar el pedido");
    }
  }

  // 🔹 Eliminar todos los pedidos del mes
  async function eliminarTodosLosPedidos() {
    if (!user) return;
    const confirmacion = confirm(
      "¿Seguro que quieres borrar TODOS los pedidos del mes?",
    );
    if (!confirmacion) return;

    try {
      const pedidosRef = collection(db, "usuarios", user.uid, "pedidos");
      const snapshot = await getDocs(pedidosRef);

      if (snapshot.empty) {
        alert("No hay pedidos para eliminar");
        return;
      }

      const eliminaciones = snapshot.docs.map((docu) =>
        deleteDoc(doc(db, "usuarios", user.uid, "pedidos", docu.id)),
      );

      await Promise.all(eliminaciones);
      setPedidos([]);
      alert("Todos los pedidos del mes fueron eliminados");
    } catch (error) {
      console.error("Error al eliminar todos los pedidos:", error);
      alert("No se pudieron eliminar los pedidos");
    }
  }

  // 🔹 Agrupar pedidos por día
  const pedidosAgrupados = pedidos.reduce((acc, p) => {
    const fechaStr = formatearFecha(p.fecha);
    if (!acc[fechaStr]) acc[fechaStr] = [];
    acc[fechaStr].push(p);
    return acc;
  }, {});

  // 🔹 Totales mensuales
  const totalMes = pedidos.reduce((sum, p) => sum + p.total, 0);
  const descuentosMes = pedidos.reduce(
    (sum, p) => sum + (p.afp + p.fonasa + p.afc),
    0,
  );
  const netoMes = totalMes - descuentosMes;
  const pedidosMes = pedidos.length;

  return (
    <div className="tabla-pedidos-container">
      <h2>📋 Registrar Pedidos del Día</h2>
      <p>Bienvenido {user?.email}</p>

      {/* Formulario controlado */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          agregarPedido();
        }}
      >
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <input
          type="number"
          min="1"
          value={skus}
          onChange={(e) => setSkus(e.target.value)}
          placeholder="SKU's"
          required
        />
        <button type="submit">Agregar Pedido</button>
      </form>

      {/* Tabla agrupada por día */}
      {Object.keys(pedidosAgrupados).map((dia) => {
        const totalDia = pedidosAgrupados[dia].reduce(
          (sum, p) => sum + p.total,
          0,
        );
        const descuentosDia = pedidosAgrupados[dia].reduce(
          (sum, p) => sum + (p.afp + p.fonasa + p.afc),
          0,
        );
        const netoDia = totalDia - descuentosDia;

        return (
          <div key={dia} className="grupo-dia">
            <table className="tabla-pedidos">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>SKU'S</th>
                  <th>Piqueo</th>
                  <th>Base</th>
                  <th>Total</th>
                  <th>
                    <button
                      onClick={eliminarTodosLosPedidos}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        marginTop: "10px",
                      }}
                    >
                      X
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pedidosAgrupados[dia].map((p) => (
                  <tr key={p.id}>
                    <td>{formatearFecha(p.fecha)}</td>
                    <td>{p.skus}</td>
                    <td>
                      {p.piqueoUnitario} x {p.skus} = {p.piqueoTotal}
                    </td>
                    <td>{p.base}</td>
                    <td>{p.total}</td>
                    <td>
                      <button
                        onClick={() => eliminarPedido(p.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#dc3545",
                          fontWeight: "bold",
                          fontSize: "16px",
                        }}
                        title="Eliminar pedido"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <strong>Subtotal del día:</strong> ${totalDia.toFixed(2)}
            </p>
            <p>
              <strong>Total menos descuentos (18.5%):</strong> $
              {netoDia.toFixed(2)}
            </p>
          </div>
        );
      })}

      {/* Totales mensuales */}
      <div className="totales-mes">
        <h3>📅 Totales del mes</h3>
        <p>
          <strong>Total del mes:</strong> ${totalMes.toFixed(2)}
        </p>
        <p>
          <strong>Total menos descuentos:</strong> ${netoMes.toFixed(2)}
        </p>
        <p>
          <strong>Pedidos del mes:</strong> {pedidosMes}
        </p>
      </div>

      {loading && <p>⏳ Cargando...</p>}
      <button onClick={cargarMasPedidos}>Cargar más</button>
      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Cerrar sesión
      </button>
    </div>
  );
}

export default PedidosList;
