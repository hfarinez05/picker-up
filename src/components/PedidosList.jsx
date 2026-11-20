import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";
import "../styles/pedidosList.css";

const pad = (n) => String(n).padStart(2, "0");
const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function aFecha(f) {
  return f?.toDate ? f.toDate() : new Date(f);
}

function claveDia(f) {
  const d = aFecha(f);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatearDia(clave) {
  const [a, m, d] = clave.split("-");
  return `${d}/${m}/${a}`;
}

function obtenerPiqueoUnitario(skus) {
  if (skus <= 10) return 120;
  if (skus <= 20) return 70;
  if (skus <= 30) return 60;
  if (skus <= 40) return 55;
  if (skus <= 50) return 50;
  return 40;
}

function calcularBase(skus) {
  return skus <= 50 ? 1000 : 1200;
}

// Pedidos de un mes (formato "YYYY-MM")
function consultaMes(uid, mes) {
  const [a, m] = mes.split("-").map(Number);
  return query(
    collection(db, "usuarios", uid, "pedidos"),
    where("fecha", ">=", new Date(a, m - 1, 1)),
    where("fecha", "<", new Date(a, m, 1)),
    orderBy("fecha", "desc"),
  );
}

function PedidosList({ user }) {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [skus, setSkus] = useState("");
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [aviso, setAviso] = useState("");
  const [confirmando, setConfirmando] = useState(null);
  const [porcentaje, setPorcentaje] = useState(() => {
    try {
      return localStorage.getItem(`porcentaje_${user?.uid}`) ?? "";
    } catch {
      return "";
    }
  });

  function mostrarAviso(texto) {
    setAviso(texto);
    setTimeout(() => setAviso(""), 3500);
  }

  function pedirConfirmacion(clave) {
    setConfirmando(clave);
    setTimeout(() => setConfirmando((c) => (c === clave ? null : c)), 3000);
  }

  async function cargar() {
    setCargando(true);
    try {
      const snap = await getDocs(consultaMes(user.uid, mes));
      setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      mostrarAviso("No se pudieron cargar los pedidos.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (user && mes) cargar();
  }, [user, mes]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(`porcentaje_${user.uid}`, porcentaje);
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [porcentaje, user]);

  async function agregarPedido(e) {
    e.preventDefault();
    if (guardando) return;

    const n = parseInt(skus, 10);
    if (!fecha || !(n >= 1)) {
      mostrarAviso("Ingresa una fecha y una cantidad de SKUs de 1 o más.");
      return;
    }

    const [a, m, d] = fecha.split("-").map(Number);
    const ahora = new Date();
    const fechaObj = new Date(
      a,
      m - 1,
      d,
      ahora.getHours(),
      ahora.getMinutes(),
      ahora.getSeconds(),
    );

    const piqueoUnitario = obtenerPiqueoUnitario(n);
    const piqueoTotal = piqueoUnitario * n;
    const base = calcularBase(n);

    setGuardando(true);
    try {
      await addDoc(collection(db, "usuarios", user.uid, "pedidos"), {
        fecha: fechaObj,
        skus: n,
        piqueoUnitario,
        piqueoTotal,
        base,
        total: piqueoTotal + base,
      });
      setSkus("");
      const mesNuevo = fecha.slice(0, 7);
      if (mesNuevo !== mes) setMes(mesNuevo);
      else await cargar();
    } catch (error) {
      console.error("Error guardando pedido:", error);
      mostrarAviso("No se pudo guardar el pedido.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarPedido(id) {
    if (confirmando !== id) {
      pedirConfirmacion(id);
      return;
    }
    setConfirmando(null);
    try {
      await deleteDoc(doc(db, "usuarios", user.uid, "pedidos", id));
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error eliminando pedido:", error);
      mostrarAviso("No se pudo eliminar el pedido.");
    }
  }

  async function borrarMes() {
    if (confirmando !== "mes") {
      pedirConfirmacion("mes");
      return;
    }
    setConfirmando(null);
    try {
      const snap = await getDocs(consultaMes(user.uid, mes));
      if (snap.empty) {
        mostrarAviso("No hay pedidos en este mes.");
        return;
      }
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      setPedidos([]);
      mostrarAviso("Pedidos del mes eliminados.");
    } catch (error) {
      console.error("Error borrando el mes:", error);
      mostrarAviso("No se pudieron eliminar los pedidos.");
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      mostrarAviso("No se pudo cerrar sesión.");
    }
  };

  // Cálculos (porcentaje vacío = 0%)
  const pct = Number(porcentaje) || 0;
  const factor = pct / 100;

  const dias = [];
  const porDia = {};
  pedidos.forEach((p) => {
    const k = claveDia(p.fecha);
    if (!porDia[k]) {
      porDia[k] = [];
      dias.push(k);
    }
    porDia[k].push(p);
  });

  const totalMes = pedidos.reduce((s, p) => s + (Number(p.total) || 0), 0);
  const descuentoMes = totalMes * factor;
  const [anioMes, numMes] = mes.split("-");

  return (
    <div className="pl-page">
      <main className="pl-main">
        <h1 className="pl-title">Mis pedidos</h1>
        <p className="pl-user">{user?.email}</p>

        {aviso && (
          <p className="pl-aviso" role="status">
            {aviso}
          </p>
        )}

        <section className="pl-card">
          <form onSubmit={agregarPedido}>
            <div className="pl-row">
              <div>
                <label htmlFor="fecha">Fecha</label>
                <input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="skus">SKUs</label>
                <input
                  id="skus"
                  name="skus"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="0"
                  value={skus}
                  onChange={(e) => setSkus(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="pl-primary" type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Agregar pedido"}
            </button>
          </form>
        </section>

        <section className="pl-card">
          <div className="pl-row">
            <div>
              <label htmlFor="mes">Mes</label>
              <input
                id="mes"
                name="mes"
                type="month"
                value={mes}
                onChange={(e) => e.target.value && setMes(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="porcentaje">Descuento (%)</label>
              <input
                id="porcentaje"
                name="porcentaje"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                placeholder="Ej: 18.5"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
              />
            </div>
          </div>

          <div className="pl-resumen">
            <div>
              <span>Total bruto</span>
              <b>{clp(totalMes)}</b>
            </div>
            <div>
              <span>Descuento</span>
              <b className="pl-out">{clp(descuentoMes)}</b>
            </div>
            <div>
              <span>Total neto</span>
              <b className="pl-in">{clp(totalMes - descuentoMes)}</b>
            </div>
          </div>
          <p className="pl-cant">
            Pedidos del mes: <strong>{pedidos.length}</strong>
          </p>
        </section>

        {cargando && <p className="pl-vacio">Cargando...</p>}

        {!cargando && dias.length === 0 && (
          <section className="pl-card">
            <p className="pl-vacio">
              Aún no hay pedidos este mes. Agrega el primero arriba.
            </p>
          </section>
        )}

        {!cargando &&
          dias.map((k) => {
            const grupo = porDia[k];
            const sub = grupo.reduce((s, p) => s + (Number(p.total) || 0), 0);
            return (
              <section className="pl-card" key={k}>
                <h2 className="pl-dia-titulo">{formatearDia(k)}</h2>

                {grupo.map((p) => (
                  <div className="pl-item" key={p.id}>
                    <div>
                      <strong>{p.skus} SKUs</strong>
                      <small>
                        {p.piqueoUnitario} × {p.skus} = {clp(p.piqueoTotal)} ·
                        base {clp(p.base)}
                      </small>
                    </div>
                    <div className="pl-monto">{clp(p.total)}</div>
                    <button
                      type="button"
                      className={`pl-del ${confirmando === p.id ? "pl-sure" : ""}`}
                      onClick={() => eliminarPedido(p.id)}
                      aria-label="Eliminar pedido"
                    >
                      {confirmando === p.id ? "¿Eliminar?" : "✕"}
                    </button>
                  </div>
                ))}

                <div className="pl-dia">
                  <div>
                    <span>Subtotal</span>
                    {clp(sub)}
                  </div>
                  <div>
                    <span>Descuento ({pct}%)</span>
                    {clp(sub * factor)}
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{clp(sub - sub * factor)}</strong>
                  </div>
                </div>
              </section>
            );
          })}

        <div className="pl-pie">
          <button
            type="button"
            className={`pl-sec ${confirmando === "mes" ? "pl-sure" : ""}`}
            onClick={borrarMes}
          >
            {confirmando === "mes"
              ? `¿Borrar todo ${numMes}/${anioMes}?`
              : "Borrar mes"}
          </button>
          <button type="button" className="pl-sec" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </main>
    </div>
  );
}

export default PedidosList;
