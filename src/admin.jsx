import { useEffect, useState, useMemo } from "react";
import { datab } from "./firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { Link } from "react-router-dom";

// Estilos base para reusar
const buttonBaseStyle = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background 0.3s",
};

// Función de utilidad para formatear la fecha
const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    if (date.toDate) return date.toDate().toLocaleString('es-AR');
    return date;
}

// Función de utilidad para obtener la fecha en formato YYYY-MM-DD
const getDateString = (date) => {
    const d = date.toDate ? date.toDate() : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Componente para la Administración
function AdminPage() {
  // --- Estados para Productos (CRUD) ---
  const [productos, setProductos] = useState([]);
  const [formProducto, setFormProducto] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    imagen: "",
  });
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const productosCol = collection(datab, "productos");

  // --- Estados para Pedidos y Ventas ---
  const [pedidos, setPedidos] = useState([]);
  const pedidosCol = collection(datab, "pedidos");
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));

  // --- Estados para Promociones ---
  const [promociones, setPromociones] = useState([]);
  const [formPromocion, setFormPromocion] = useState({
    nombre: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    horaFin: "23:59",
    descuento: "",
    tipoDescuento: "porcentaje",
    montoFijo: "",
    stackeable: true,
    productosAplicables: [],
    activa: true
  });
  const [mostrarFormPromocion, setMostrarFormPromocion] = useState(false);
  const promocionesCol = collection(datab, "promociones");

  // --- Estados para Códigos de Descuento ---
  const [codigos, setCodigos] = useState([]);
  const [formCodigo, setFormCodigo] = useState({
    codigo: "",
    tipo: "porcentaje",
    valor: "",
    maxUsos: "",
    fechaExpiracion: "",
    activo: true
  });
  const [mostrarFormCodigo, setMostrarFormCodigo] = useState(false);
  const codigosCol = collection(datab, "codigosDescuento");

  // --- LÓGICA DE PRODUCTOS (CRUD) ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormProducto({ ...formProducto, [name]: value });
  };

  // LECTURA de productos en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(
      productosCol,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProductos(arr);
      },
      (err) => console.error("Error escuchando productos:", err)
    );
    return () => unsub();
  }, []);

  const crearProducto = async () => {
    if (!formProducto.nombre || !formProducto.precio) {
      alert("Completá al menos nombre y precio.");
      return;
    }
    try {
      await addDoc(productosCol, {
        nombre: formProducto.nombre,
        precio: parseFloat(formProducto.precio) || 0,
        descripcion: formProducto.descripcion,
        imagen: formProducto.imagen || "",
        creadoEn: serverTimestamp(),
      });
      setFormProducto({ nombre: "", precio: "", descripcion: "", imagen: "" });
    } catch (err) {
      console.error("Error creando producto:", err);
      alert("Error al crear el producto");
    }
  };

  const editarProductoPreparar = (p) => {
    setEditandoProductoId(p.id);
    setFormProducto({
      nombre: p.nombre || "",
      precio: p.precio?.toString() || "",
      descripcion: p.descripcion || "",
      imagen: p.imagen || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardarEdicionProducto = async () => {
    if (!editandoProductoId) return;
    try {
      const ref = doc(datab, "productos", editandoProductoId);
      await updateDoc(ref, {
        nombre: formProducto.nombre,
        precio: parseFloat(formProducto.precio) || 0,
        descripcion: formProducto.descripcion,
        imagen: formProducto.imagen || "",
      });
      setEditandoProductoId(null);
      setFormProducto({ nombre: "", precio: "", descripcion: "", imagen: "" });
    } catch (err) {
      console.error("Error actualizando producto:", err);
      alert("Error al actualizar el producto");
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar producto? Esta acción es irreversible.")) return;
    try {
      await deleteDoc(doc(datab, "productos", id));
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
  };

  const cancelarEdicion = () => {
    setEditandoProductoId(null);
    setFormProducto({ nombre: "", precio: "", descripcion: "", imagen: "" });
  };

  // --- LÓGICA DE PEDIDOS Y VENTAS ---
  useEffect(() => {
    const q = query(pedidosCol);
    const unsubPedidos = onSnapshot(
      q,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.fecha,
            fecha: formatDate(data.fecha),
          };
        });
        arr.sort((a, b) => {
          const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return tb - ta;
        });
        setPedidos(arr);
      },
      (err) => console.error("Error escuchando pedidos:", err)
    );
    return () => unsubPedidos();
  }, []);

  // FILTRADO DE PEDIDOS Y CÁLCULO DE TOTALES
  const { filteredPedidos, totalVentasDia } = useMemo(() => {
    const targetDateString = selectedDate;
    const filtered = pedidos.filter(pedido => {
      if (!pedido.timestamp) return false;
      const pedidoDateString = getDateString(pedido.timestamp);
      return pedidoDateString === targetDateString;
    });
    const total = filtered.reduce((sum, pedido) => sum + (pedido.total || 0), 0);
    return {
      filteredPedidos: filtered,
      totalVentasDia: total.toFixed(2),
    };
  }, [pedidos, selectedDate]);

  // --- LÓGICA DE PROMOCIONES ---
  useEffect(() => {
    const unsub = onSnapshot(
      promocionesCol,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({ 
          id: d.id, 
          ...d.data(),
          fechaInicioStr: d.data().fechaInicio ? getDateString(d.data().fechaInicio) : "",
          fechaFinStr: d.data().fechaFin ? getDateString(d.data().fechaFin) : ""
        }));
        setPromociones(arr);
      },
      (err) => console.error("Error escuchando promociones:", err)
    );
    return () => unsub();
  }, []);

  // Obtener promociones activas HOY
  const promocionesActivasHoy = useMemo(() => {
    const hoy = new Date();
    const hoyString = getDateString(hoy);
    return promociones.filter(promo => {
      const inicio = promo.fechaInicioStr;
      const fin = promo.fechaFinStr;
      return hoyString >= inicio && hoyString <= fin;
    });
  }, [promociones]);

  // Función para combinar fecha y hora
  const combinarFechaYHora = (fecha, hora) => {
    if (!fecha || !hora) return new Date(fecha);
    const [horas, minutos] = hora.split(':');
    const fechaCompleta = new Date(fecha);
    fechaCompleta.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    return fechaCompleta;
  };

  // Crear/editar promoción
  const guardarPromocion = async () => {
    if (!formPromocion.nombre || !formPromocion.fechaInicio || !formPromocion.fechaFin) {
      alert("Completá nombre y fechas de la promoción");
      return;
    }

    if (!formPromocion.descuento && !formPromocion.montoFijo) {
      alert("Completá al menos un tipo de descuento (porcentaje o monto fijo)");
      return;
    }

    try {
      const fechaFinCompleta = combinarFechaYHora(formPromocion.fechaFin, formPromocion.horaFin);

      const promocionData = {
        nombre: formPromocion.nombre,
        descripcion: formPromocion.descripcion,
        fechaInicio: new Date(formPromocion.fechaInicio),
        fechaFin: fechaFinCompleta,
        descuento: parseFloat(formPromocion.descuento) || 0,
        tipoDescuento: formPromocion.tipoDescuento,
        montoFijo: parseFloat(formPromocion.montoFijo) || 0,
        stackeable: formPromocion.stackeable,
        productosAplicables: formPromocion.productosAplicables,
        activa: true,
        creadoEn: serverTimestamp()
      };

      if (formPromocion.id) {
        await updateDoc(doc(datab, "promociones", formPromocion.id), promocionData);
      } else {
        await addDoc(promocionesCol, promocionData);
      }

      setFormPromocion({
        nombre: "", descripcion: "", fechaInicio: "", fechaFin: "", horaFin: "23:59",
        descuento: "", tipoDescuento: "porcentaje", montoFijo: "", stackeable: true,
        productosAplicables: [], activa: true
      });
      setMostrarFormPromocion(false);
      alert("✅ Promoción guardada!");
      
    } catch (err) {
      console.error("Error:", err);
      alert("Error al guardar promoción");
    }
  };

  const editarPromocion = (promo) => {
    let horaFin = "23:59";
    if (promo.fechaFin) {
      const fechaFin = promo.fechaFin.toDate ? promo.fechaFin.toDate() : new Date(promo.fechaFin);
      horaFin = `${fechaFin.getHours().toString().padStart(2, '0')}:${fechaFin.getMinutes().toString().padStart(2, '0')}`;
    }

    setFormPromocion({
      id: promo.id,
      nombre: promo.nombre,
      descripcion: promo.descripcion,
      fechaInicio: promo.fechaInicioStr,
      fechaFin: promo.fechaFinStr,
      horaFin: horaFin,
      descuento: promo.descuento?.toString() || "",
      tipoDescuento: promo.tipoDescuento || "porcentaje",
      montoFijo: promo.montoFijo?.toString() || "",
      stackeable: promo.stackeable !== undefined ? promo.stackeable : true,
      productosAplicables: promo.productosAplicables || [],
      activa: promo.activa
    });
    setMostrarFormPromocion(true);
  };

  const eliminarPromocion = async (id) => {
    if (!window.confirm("¿Eliminar esta promoción?")) return;
    try {
      await deleteDoc(doc(datab, "promociones", id));
    } catch (err) {
      console.error("Error eliminando promoción:", err);
    }
  };

  const toggleProductoPromocion = (productoId) => {
    setFormPromocion(prev => {
      const productos = [...prev.productosAplicables];
      const index = productos.indexOf(productoId);
      if (index > -1) {
        productos.splice(index, 1);
      } else {
        productos.push(productoId);
      }
      return { ...prev, productosAplicables: productos };
    });
  };

  // Función para formatear hora de finalización
  const getHoraFin = (promo) => {
    if (!promo.fechaFin) return "23:59";
    const fechaFin = promo.fechaFin.toDate ? promo.fechaFin.toDate() : new Date(promo.fechaFin);
    return `${fechaFin.getHours().toString().padStart(2, '0')}:${fechaFin.getMinutes().toString().padStart(2, '0')}`;
  };

  // --- LÓGICA DE CÓDIGOS DE DESCUENTO ---
  useEffect(() => {
    const unsub = onSnapshot(
      codigosCol,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({ 
          id: d.id, 
          ...d.data(),
          fechaExpiracionStr: d.data().fechaExpiracion ? getDateString(d.data().fechaExpiracion) : ""
        }));
        setCodigos(arr);
      },
      (err) => console.error("Error escuchando códigos:", err)
    );
    return () => unsub();
  }, []);

  const guardarCodigo = async () => {
    if (!formCodigo.codigo || !formCodigo.valor) {
      alert("Completá código y valor del descuento");
      return;
    }

    try {
      const codigoData = {
        codigo: formCodigo.codigo.toUpperCase(),
        tipo: formCodigo.tipo,
        valor: parseFloat(formCodigo.valor) || 0,
        maxUsos: formCodigo.maxUsos ? parseInt(formCodigo.maxUsos) : null,
        fechaExpiracion: formCodigo.fechaExpiracion ? new Date(formCodigo.fechaExpiracion) : null,
        activo: true,
        usosActuales: 0,
        creadoEn: serverTimestamp()
      };

      await addDoc(codigosCol, codigoData);

      setFormCodigo({
        codigo: "",
        tipo: "porcentaje",
        valor: "",
        maxUsos: "",
        fechaExpiracion: "",
        activo: true
      });
      setMostrarFormCodigo(false);
      alert("✅ Código creado exitosamente!");
      
    } catch (err) {
      console.error("Error creando código:", err);
      alert("Error al crear el código");
    }
  };

  const toggleActivoCodigo = async (id, activo) => {
    try {
      await updateDoc(doc(datab, "codigosDescuento", id), {
        activo: activo
      });
    } catch (err) {
      console.error("Error actualizando código:", err);
    }
  };

  const eliminarCodigo = async (id) => {
    if (!window.confirm("¿Eliminar este código?")) return;
    try {
      await deleteDoc(doc(datab, "codigosDescuento", id));
    } catch (err) {
      console.error("Error eliminando código:", err);
    }
  };

  // --- UI ---
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", background: "#f8f8f8", minHeight: "100vh" }}>
      {/* Botón Volver */}
      <Link to="/">
        <button style={{ ...buttonBaseStyle, marginBottom: "20px", padding: "10px 15px", backgroundColor: "#ff69b4", color: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          ⬅ Volver a la página principal
        </button>
      </Link>

      <h1>🛠 Panel de Administración</h1>
      
      {/* --- FORM PRODUCTO (CRUD) --- */}
      <section style={{ marginTop: "12px", marginBottom: "24px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", background: "#fff", maxWidth: "720px", boxShadow: "0 4px 8px rgba(0,0,0,0.05)" }}>
        <h2 style={{ marginTop: 0 }}>{editandoProductoId ? "✏️ Editar producto" : "➕ Crear producto"}</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: 'center' }}>
          <input style={{ flex: "1 1 200px", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }} placeholder="Nombre" name="nombre" value={formProducto.nombre} onChange={handleFormChange} />
          <input style={{ width: "120px", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }} placeholder="Precio" name="precio" type="number" value={formProducto.precio} onChange={handleFormChange} />
          <input style={{ width: "120px", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }} placeholder="Descripción" name="descripcion" value={formProducto.descripcion} onChange={handleFormChange} />
          <input style={{ flex: "1 1 200px", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }} placeholder="URL imagen (opcional)" name="imagen" value={formProducto.imagen} onChange={handleFormChange} />
        </div>
        <div style={{ marginTop: "12px" }}>
          {editandoProductoId ? (
            <>
              <button onClick={guardarEdicionProducto} style={{ ...buttonBaseStyle, marginRight: 8, background: "#4CAF50", color: "white" }}>💾 Guardar cambios</button>
              <button onClick={cancelarEdicion} style={{...buttonBaseStyle, background: "#ccc"}}>❌ Cancelar</button>
            </>
          ) : (
            <button onClick={crearProducto} style={{ ...buttonBaseStyle, background: "#2196F3", color: "white" }}>➕ Crear producto</button>
          )}
        </div>
      </section>

      <hr style={{ margin: "30px 0", borderTop: "1px dashed #ccc" }} />

      {/* --- LISTA PRODUCTOS --- */}
      <section style={{ marginBottom: "30px" }}>
        <h2>🧾 Productos en catálogo ({productos.length})</h2>
        {productos.length === 0 ? (
          <p>No hay productos aún.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {productos.map((p) => (
              <div key={p.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/f0f0f0/888?text=Sin+Img"; }} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", textAlign: "center", lineHeight: "1.2" }}>Sin Img</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>{p.nombre}</h3>
                    <p style={{ margin: "6px 0 0" }}><strong>${p.precio}</strong></p>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#666" }}>{p.descripcion}</p>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => editarProductoPreparar(p)} style={{ ...buttonBaseStyle, marginRight: 8, padding: "6px 10px", background: "#FFA500", color: "white" }}>✏️ Editar</button>
                  <button onClick={() => eliminarProducto(p.id)} style={{ ...buttonBaseStyle, padding: "6px 10px", background: "#e74c3c", color: "white" }}>🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr style={{ margin: "30px 0", borderTop: "1px dashed #ccc" }} />

      {/* --- SECCIÓN PROMOCIONES AUTOMÁTICAS --- */}
      <section style={{ marginBottom: "30px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🎁 Sistema de Promociones Avanzadas</h2>
          <button onClick={() => setMostrarFormPromocion(!mostrarFormPromocion)} style={{ ...buttonBaseStyle, background: "#9C27B0", color: "white", padding: "10px 15px" }}>
            {mostrarFormPromocion ? "❌ Cancelar" : "➕ Nueva Promoción"}
          </button>
        </div>

        {/* Banner de Promociones Activas HOY */}
        {promocionesActivasHoy.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>🎉 Promociones Activas HOY</h3>
            {promocionesActivasHoy.map(promo => (
              <div key={promo.id} style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '5px', marginBottom: '5px' }}>
                <strong>{promo.nombre}</strong> - {promo.descripcion}
                {promo.descuento > 0 && <span style={{ marginLeft: '10px' }}>🏷️ {promo.descuento}% OFF</span>}
                {promo.montoFijo > 0 && <span style={{ marginLeft: '10px' }}>💰 ${promo.montoFijo} OFF</span>}
                {promo.stackeable && <span style={{ marginLeft: '10px' }}>🔗 Stackeable</span>}
              </div>
            ))}
          </div>
        )}

        {/* FORMULARIO DE PROMOCIÓN */}
        {mostrarFormPromocion && (
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
            <h3>{formPromocion.id ? "✏️ Editar Promoción" : "➕ Crear Nueva Promoción"}</h3>
            
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
              <input placeholder="Nombre de la promoción" value={formPromocion.nombre} onChange={(e) => setFormPromocion(prev => ({ ...prev, nombre: e.target.value }))} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              
              <select value={formPromocion.tipoDescuento} onChange={(e) => setFormPromocion(prev => ({ ...prev, tipoDescuento: e.target.value }))} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="porcentaje">Descuento en %</option>
                <option value="monto_fijo">Descuento en $</option>
                <option value="ambos">Ambos</option>
              </select>
              
              {formPromocion.tipoDescuento !== 'monto_fijo' && (
                <input type="number" placeholder="% Descuento" value={formPromocion.descuento} onChange={(e) => setFormPromocion(prev => ({ ...prev, descuento: e.target.value }))} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              )}
              
              {formPromocion.tipoDescuento !== 'porcentaje' && (
                <input type="number" placeholder="Monto fijo ($)" value={formPromocion.montoFijo} onChange={(e) => setFormPromocion(prev => ({ ...prev, montoFijo: e.target.value }))} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              )}
              
              <input type="date" placeholder="Fecha inicio" value={formPromocion.fechaInicio} onChange={(e) => setFormPromocion(prev => ({ ...prev, fechaInicio: e.target.value }))} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="date" placeholder="Fecha fin" value={formPromocion.fechaFin} onChange={(e) => setFormPromocion(prev => ({ ...prev, fechaFin: e.target.value }))} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <input type="time" value={formPromocion.horaFin} onChange={(e) => setFormPromocion(prev => ({ ...prev, horaFin: e.target.value }))} style={{ width: '120px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
            </div>

            <textarea placeholder="Descripción de la promoción" value={formPromocion.descripcion} onChange={(e) => setFormPromocion(prev => ({ ...prev, descripcion: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '10px', minHeight: '60px' }} />

            {/* Checkbox para promociones stackeables */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={formPromocion.stackeable} onChange={(e) => setFormPromocion(prev => ({ ...prev, stackeable: e.target.checked }))} />
                <span style={{ fontWeight: 'bold' }}>🔗 Esta promoción es STACKEABLE (se puede acumular con otras)</span>
              </label>
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                Si está desactivada, esta promoción no se acumulará con otras promociones activas
              </small>
            </div>

            {/* Selección de productos aplicables */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                🎯 Productos específicos (opcional - si no seleccionas, aplica a todos):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                {productos.map(producto => (
                  <label key={producto.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input type="checkbox" checked={formPromocion.productosAplicables.includes(producto.id)} onChange={() => toggleProductoPromocion(producto.id)} />
                    {producto.nombre} (${producto.precio})
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <button onClick={guardarPromocion} style={{ ...buttonBaseStyle, background: "#4CAF50", color: "white", marginRight: '10px' }}>💾 Guardar Promoción</button>
              <button onClick={() => setMostrarFormPromocion(false)} style={{ ...buttonBaseStyle, background: "#ccc" }}>❌ Cancelar</button>
            </div>
          </div>
        )}

        {/* LISTA DE PROMOCIONES */}
        <div>
          <h3>📅 Todas las Promociones ({promociones.length})</h3>
          {promociones.length === 0 ? (
            <p>No hay promociones configuradas.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {promociones.map(promo => {
                const esActiva = promocionesActivasHoy.some(p => p.id === promo.id);
                const hoy = new Date();
                const inicio = new Date(promo.fechaInicioStr);
                const esFutura = hoy < inicio;
                const horaFin = getHoraFin(promo);
                
                return (
                  <div key={promo.id} style={{ border: `2px solid ${esActiva ? '#4CAF50' : esFutura ? '#FF9800' : '#ccc'}`, padding: '15px', borderRadius: '8px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 5px 0', color: esActiva ? '#4CAF50' : '#333' }}>
                          {promo.nombre} {esActiva && '🔥'}
                          {!promo.stackeable && <span style={{ marginLeft: '8px', fontSize: '12px', background: '#ff9800', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>NO STACKEABLE</span>}
                        </h4>
                        <p style={{ margin: '0 0 10px 0', color: '#666' }}>{promo.descripcion}</p>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          <strong>📅 Fechas:</strong> {promo.fechaInicioStr} al {promo.fechaFinStr} a las {horaFin}
                          {promo.descuento > 0 && <span style={{ marginLeft: '15px' }}><strong>🏷️ Descuento:</strong> {promo.descuento}%</span>}
                          {promo.montoFijo > 0 && <span style={{ marginLeft: '15px' }}><strong>💰 Monto fijo:</strong> ${promo.montoFijo}</span>}
                        </div>
                        {promo.productosAplicables && promo.productosAplicables.length > 0 && (
                          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                            <strong>🎯 Productos específicos:</strong> {promo.productosAplicables.length} productos
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => editarPromocion(promo)} style={{ ...buttonBaseStyle, padding: '6px 10px', background: "#FFA500", color: "white", fontSize: '12px' }}>✏️</button>
                        <button onClick={() => eliminarPromocion(promo.id)} style={{ ...buttonBaseStyle, padding: '6px 10px', background: "#e74c3c", color: "white", fontSize: '12px' }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', padding: '8px', background: esActiva ? '#e8f5e8' : esFutura ? '#fff3cd' : '#f8f9fa', borderRadius: '4px', fontSize: '12px', color: esActiva ? '#2e7d32' : esFutura ? '#856404' : '#666' }}>
                      {esActiva ? '🎉 Esta promoción está ACTIVA hoy' : esFutura ? '⏰ Programada para el futuro' : '❌ Esta promoción ya expiró'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <hr style={{ margin: "30px 0", borderTop: "1px dashed #ccc" }} />

      {/* --- SECCIÓN CÓDIGOS DE DESCUENTO --- */}
      <section style={{ marginBottom: "30px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🎫 Códigos de Descuento para Clientes Recurrentes</h2>
          <button onClick={() => setMostrarFormCodigo(!mostrarFormCodigo)} style={{ ...buttonBaseStyle, background: "#FF9800", color: "white", padding: "10px 15px" }}>
            {mostrarFormCodigo ? "❌ Cancelar" : "➕ Nuevo Código"}
          </button>
        </div>

        {/* Formulario para crear códigos */}
        {mostrarFormCodigo && (
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
            <h3>Crear Nuevo Código de Descuento</h3>
            
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
              <input
                placeholder="Código (ej: CLIENTE10)"
                value={formCodigo.codigo}
                onChange={(e) => setFormCodigo(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <select
                value={formCodigo.tipo}
                onChange={(e) => setFormCodigo(prev => ({ ...prev, tipo: e.target.value }))}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo ($)</option>
              </select>
              <input
                type="number"
                placeholder={formCodigo.tipo === 'porcentaje' ? 'Porcentaje descuento' : 'Monto descuento'}
                value={formCodigo.valor}
                onChange={(e) => setFormCodigo(prev => ({ ...prev, valor: e.target.value }))}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                type="number"
                placeholder="Máximo de usos (opcional)"
                value={formCodigo.maxUsos}
                onChange={(e) => setFormCodigo(prev => ({ ...prev, maxUsos: e.target.value }))}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                type="date"
                placeholder="Fecha expiración"
                value={formCodigo.fechaExpiracion}
                onChange={(e) => setFormCodigo(prev => ({ ...prev, fechaExpiracion: e.target.value }))}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginTop: '15px' }}>
              <button onClick={guardarCodigo} style={{ ...buttonBaseStyle, background: "#4CAF50", color: "white", marginRight: '10px' }}>
                💾 Crear Código
              </button>
              <button onClick={() => setMostrarFormCodigo(false)} style={{ ...buttonBaseStyle, background: "#ccc" }}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de códigos existentes */}
        <div>
          <h3>Códigos Activos ({codigos.filter(c => c.activo).length})</h3>
          {codigos.length === 0 ? (
            <p>No hay códigos creados.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {codigos.map(codigo => (
                <div key={codigo.id} style={{
                  border: `2px solid ${codigo.activo ? '#4CAF50' : '#ccc'}`,
                  padding: '12px',
                  borderRadius: '6px',
                  background: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{codigo.codigo}</strong>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {codigo.tipo === 'porcentaje' ? `${codigo.valor}% descuento` : `$${codigo.valor} descuento`}
                        {codigo.maxUsos && <span> • Máx: {codigo.usosActuales || 0}/{codigo.maxUsos} usos</span>}
                        {codigo.fechaExpiracion && <span> • Expira: {getDateString(codigo.fechaExpiracion)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => toggleActivoCodigo(codigo.id, !codigo.activo)}
                        style={{
                          ...buttonBaseStyle,
                          padding: '4px 8px',
                          background: codigo.activo ? "#FF9800" : "#4CAF50",
                          color: "white",
                          fontSize: '11px'
                        }}
                      >
                        {codigo.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => eliminarCodigo(codigo.id)}
                        style={{
                          ...buttonBaseStyle,
                          padding: '4px 8px',
                          background: "#e74c3c",
                          color: "white",
                          fontSize: '11px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <hr style={{ margin: "30px 0", borderTop: "1px dashed #ccc" }} />

      {/* --- SECCIÓN VENTAS Y FILTRO --- */}
      <section>
        <h2>💰 Análisis de Ventas</h2>
        <div style={{ marginBottom: "15px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", background: "#fff", display: "flex", alignItems: "center", gap: "20px" }}>
          <label style={{ fontWeight: 'bold' }}>Seleccionar Fecha:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: "8px", borderRadius: 4, border: "1px solid #ccc" }} />
          <div style={{ marginLeft: 'auto', padding: '10px 20px', backgroundColor: '#ffcc00', borderRadius: '6px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Total Ventas del Día: <strong style={{fontSize: '1.2em'}}>${totalVentasDia}</strong></h3>
          </div>
        </div>

        {/* Resumen de Ventas */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <div style={{ background: '#4CAF50', color: 'white', padding: '15px', borderRadius: '8px', flex: '1', minWidth: '200px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>📦 Pedidos Hoy</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{filteredPedidos.length}</div>
          </div>
          <div style={{ background: '#2196F3', color: 'white', padding: '15px', borderRadius: '8px', flex: '1', minWidth: '200px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>💰 Total Ingresos</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${totalVentasDia}</div>
          </div>
          <div style={{ background: '#FF9800', color: 'white', padding: '15px', borderRadius: '8px', flex: '1', minWidth: '200px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>🍩 Artículos Vendidos</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {filteredPedidos.reduce((total, pedido) => {
                return total + (Array.isArray(pedido.items) ? pedido.items.reduce((sum, item) => sum + (item.cantidad || 1), 0) : 0);
              }, 0)}
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <h3>📦 Pedidos de la fecha ({filteredPedidos.length})</h3>
        {filteredPedidos.length === 0 ? (
          <p>No hay pedidos para la fecha seleccionada ({selectedDate}).</p>
        ) : (
          filteredPedidos.map((pedido) => (
            <div key={pedido.id} style={{ border: "1px solid #f0f0f0", padding: 12, borderRadius: 8, marginBottom: 10, background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, borderBottom: "1px dashed #eee", paddingBottom: 8, marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Cliente: {pedido.nombre || "Sin nombre"}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: '#666' }}>Fecha y Hora: {pedido.fecha}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 18, color: '#007bff', fontWeight: 'bold' }}>Total: ${pedido.total.toFixed(2)}</p>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <strong style={{fontSize: 14}}>Productos:</strong>
                <ul style={{ marginTop: 6, listStyleType: "none", paddingLeft: "10px" }}>
                  {Array.isArray(pedido.items) ? (
                    pedido.items.map((it, i) => (
                      <li key={i} style={{fontSize: 14, padding: '2px 0'}}>
                        {it.nombre ? `${it.nombre} x${it.cantidad ?? 1} (Precio unitario: $${it.precio})` : `Item (${i + 1}): ${JSON.stringify(it)}`}
                      </li>
                    ))
                  ) : (
                    <li>Sin items</li>
                  )}
                </ul>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default AdminPage;