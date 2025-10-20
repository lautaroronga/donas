import { useEffect, useState } from "react";
import Dona from "./components/Dona";
import Header from "./components/Header";
import { db as localDB } from "./data/db";
import { datab } from "./firebase/config";
import { collection, getDocs, addDoc, serverTimestamp, onSnapshot, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

function App() {
  const [data, setData] = useState(localDB);
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [promociones, setPromociones] = useState([]);
  
  // Estados para códigos de descuento
  const [codigoDescuento, setCodigoDescuento] = useState("");
  const [descuentoAplicado, setDescuentoAplicado] = useState(null);
  const [mostrarInputCodigo, setMostrarInputCodigo] = useState(false);
  const [mensajeCodigo, setMensajeCodigo] = useState("");

  // 🔹 FUNCIÓN QUE FALTABA: removeFromCart
  const removeFromCart = (id) => {
    const updatedCart = cart.filter((donas) => donas.id !== id);
    setCart(updatedCart);
  };

  // 🔹 FUNCIÓN QUE FALTABA: increaseQuantity
  const increaseQuantity = (id) => {
    const updatedCart = cart.map((item) => {
      if (item.id === id && item.quantity < MAX_ITEMS) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });
    setCart(updatedCart);
  };

  // 🔹 FUNCIÓN QUE FALTABA: decreaseQuantity
  const decreaseQuantity = (id) => {
    const updatedCart = cart.map((item) => {
      if (item.id === id && item.quantity > MIN_ITEMS) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    setCart(updatedCart);
  };

  // 🔹 FUNCIÓN QUE FALTABA: clearCart
  const clearCart = () => {
    setCart([]);
  };

  // 🔹 FUNCIÓN QUE FALTABA: pay
  const pay = (metodoPago) => {
    setShowModal(true);
    console.log(`Pagando con: ${metodoPago}`);
  };

  // Constantes para límites del carrito
  const MAX_ITEMS = 12;
  const MIN_ITEMS = 1;

  // Función para obtener fecha en formato YYYY-MM-DD
  const getDateString = (date) => {
    const d = date.toDate ? date.toDate() : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Cargar productos desde Firestore
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(datab, "productos"));
        
        const productosFirebase = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.nombre,
            price: parseFloat(data.precio) || 0,
            image: data.imagen || "",
            description: data.descripcion,
          };
        });

        setData([...localDB, ...productosFirebase]);
      } catch (error) {
        console.error("❌ Error al cargar productos desde Firestore:", error);
      }
    };

    fetchProductos();
  }, []);

  // Cargar promociones en tiempo real
  useEffect(() => {
    const promocionesCol = collection(datab, "promociones");
    
    const unsub = onSnapshot(promocionesCol, (snapshot) => {
      const promocionesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaInicioStr: doc.data().fechaInicio ? getDateString(doc.data().fechaInicio) : "",
        fechaFinStr: doc.data().fechaFin ? getDateString(doc.data().fechaFin) : ""
      }));
      
      setPromociones(promocionesData);
    });

    return () => unsub();
  }, []);

  // Obtener promociones activas HOY
  const promocionesActivasHoy = promociones.filter(promo => {
    const hoy = new Date();
    const hoyString = getDateString(hoy);
    const inicio = promo.fechaInicioStr;
    const fin = promo.fechaFinStr;
    return hoyString >= inicio && hoyString <= fin;
  });

  // Función para aplicar descuentos a los productos
  const productosConDescuento = data.map(producto => {
    let precioOriginal = producto.price;
    let precioConDescuento = precioOriginal;
    let promocionAplicada = null;

    // Buscar promociones que apliquen a este producto
    promocionesActivasHoy.forEach(promo => {
      const aplicaAProducto = 
        !promo.productosAplicables || 
        promo.productosAplicables.length === 0 || 
        promo.productosAplicables.includes(producto.id);
      
      if (aplicaAProducto && promo.descuento > 0) {
        const descuento = precioOriginal * (promo.descuento / 100);
        precioConDescuento = precioOriginal - descuento;
        promocionAplicada = promo;
      }
    });

    return {
      ...producto,
      price: precioConDescuento,
      precioOriginal: precioOriginal,
      enPromocion: promocionAplicada !== null,
      promocion: promocionAplicada
    };
  });

  // Guardar en Local Storage cuando cambia el carrito
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Cargar desde Local Storage al inicio
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
        setCart(JSON.parse(storedCart));
    }
  }, []);

  // 🔹 FUNCIÓN addToCart (ya existía pero la incluyo por completitud)
  function addToCart(item) {
    const itemExistsIndex = cart.findIndex((donas) => donas.id === item.id);

    if (itemExistsIndex >= 0) {
      const updatedCart = cart.map((donas, index) => {
        if (index === itemExistsIndex && donas.quantity < MAX_ITEMS) {
          return { ...donas, quantity: donas.quantity + 1 };
        }
        return donas;
      });
      setCart(updatedCart);
    } else {
      const newItem = { 
        ...item, 
        quantity: 1,
        precioOriginal: item.precioOriginal || item.price
      };
      const updatedCart = [...cart, newItem];
      setCart(updatedCart);
    }
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
  }

  // 🔹 FUNCIÓN calcularTotal
  function calcularTotal() {
    return cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  // 🔹 FUNCIÓN calcularAhorro
  function calcularAhorro() {
    return cart.reduce((total, item) => {
      if (item.precioOriginal && item.precioOriginal > item.price) {
        return total + ((item.precioOriginal - item.price) * item.quantity);
      }
      return total;
    }, 0);
  }

  // Función para verificar si el usuario es recurrente
  const esClienteRecurrente = async (nombreCliente) => {
    if (!nombreCliente.trim()) return false;
    
    try {
      const pedidosQuery = query(
        collection(datab, "pedidos"),
        where("nombre", "==", nombreCliente.trim())
      );
      
      const querySnapshot = await getDocs(pedidosQuery);
      return querySnapshot.size >= 2;
    } catch (error) {
      console.error("Error verificando cliente recurrente:", error);
      return false;
    }
  };

  // Función para aplicar código de descuento
  const aplicarCodigoDescuento = async () => {
    if (!codigoDescuento.trim()) {
      setMensajeCodigo("❌ Ingresá un código de descuento");
      return;
    }

    try {
      const codigosRef = collection(datab, "codigosDescuento");
      const q = query(codigosRef, where("codigo", "==", codigoDescuento.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMensajeCodigo("❌ Código inválido");
        return;
      }

      const codigoDoc = querySnapshot.docs[0];
      const codigoData = codigoDoc.data();

      const ahora = new Date();
      if (!codigoData.activo || (codigoData.fechaExpiracion && codigoData.fechaExpiracion.toDate() < ahora)) {
        setMensajeCodigo("❌ Código expirado o inactivo");
        return;
      }

      if (codigoData.maxUsos && codigoData.usosActuales >= codigoData.maxUsos) {
        setMensajeCodigo("❌ Código ya fue utilizado el máximo de veces");
        return;
      }

      setDescuentoAplicado({
        tipo: codigoData.tipo,
        valor: codigoData.valor,
        codigo: codigoData.codigo,
        id: codigoDoc.id
      });

      setMensajeCodigo(`✅ ¡Código aplicado! Descuento: ${codigoData.tipo === 'porcentaje' ? codigoData.valor + '%' : '$' + codigoData.valor}`);
      
      await updateDoc(doc(datab, "codigosDescuento", codigoDoc.id), {
        usosActuales: (codigoData.usosActuales || 0) + 1,
        ultimoUso: serverTimestamp()
      });

    } catch (error) {
      console.error("Error aplicando código:", error);
      setMensajeCodigo("❌ Error al aplicar el código");
    }
  };

  // Función para calcular total con código de descuento
  const calcularTotalConDescuento = () => {
    const subtotal = calcularTotal();
    
    if (!descuentoAplicado) return subtotal;
    
    let descuento = 0;
    
    if (descuentoAplicado.tipo === 'porcentaje') {
      descuento = subtotal * (descuentoAplicado.valor / 100);
    } else if (descuentoAplicado.tipo === 'monto_fijo') {
      descuento = Math.min(descuentoAplicado.valor, subtotal);
    }
    
    return Math.max(0, subtotal - descuento);
  };

  // Effect para verificar si mostrar código al cliente recurrente
  useEffect(() => {
    const verificarYMostrarCodigo = async () => {
      if (nombreUsuario.trim()) {
        const esRecurrente = await esClienteRecurrente(nombreUsuario);
        if (esRecurrente) {
          setMostrarInputCodigo(true);
        }
      }
    };

    verificarYMostrarCodigo();
  }, [nombreUsuario]);

  // Función para quitar código de descuento
  const quitarCodigoDescuento = () => {
    setDescuentoAplicado(null);
    setCodigoDescuento("");
    setMensajeCodigo("");
  };

  // Lógica de Pago y Guardado de Pedido
  const handleConfirmOrder = async () => {
    if (!nombreUsuario.trim()) {
      alert("Por favor ingresá tu nombre antes de confirmar el pedido.");
      return;
    }

    try {
      const totalConDescuento = calcularTotalConDescuento();
      const descuentoCodigo = calcularTotal() - totalConDescuento;

      const pedido = {
        fecha: serverTimestamp(),
        nombre: nombreUsuario,
        items: cart.map((item) => ({
          nombre: item.name,
          cantidad: item.quantity,
          precio: item.price,
          precioOriginal: item.precioOriginal || item.price,
          descuentoAplicado: item.precioOriginal ? (item.precioOriginal - item.price) : 0
        })),
        total: totalConDescuento,
        ahorroTotal: calcularAhorro() + descuentoCodigo,
        promocionesAplicadas: promocionesActivasHoy.map(p => p.nombre),
        codigoDescuentoAplicado: descuentoAplicado ? {
          codigo: descuentoAplicado.codigo,
          tipo: descuentoAplicado.tipo,
          valor: descuentoAplicado.valor,
          descuentoAplicado: descuentoCodigo
        } : null,
        esClienteRecurrente: await esClienteRecurrente(nombreUsuario)
      };

      await addDoc(collection(datab, "pedidos"), pedido);

      // Lógica de WhatsApp
      const itemsComprados = cart.map((item) => {
        const precioUnitario = item.price;
        const totalItem = precioUnitario * item.quantity;
        let itemText = `🍩 ${item.name} x${item.quantity} = $${totalItem.toFixed(2)}`;
        
        if (item.precioOriginal && item.precioOriginal > item.price) {
          const ahorroItem = (item.precioOriginal - item.price) * item.quantity;
          itemText += ` (Ahorraste: $${ahorroItem.toFixed(2)})`;
        }
        
        return itemText;
      }).join("\n");

      const total = totalConDescuento.toFixed(2);
      const ahorroTotal = (calcularAhorro() + descuentoCodigo).toFixed(2);
      
      let mensaje = `Hola! Quiero confirmar mi pedido:\n\n${itemsComprados}\n\n💰 Total: $${total}`;
      
      if (ahorroTotal > 0) {
        mensaje += `\n🎉 Ahorraste: $${ahorroTotal}`;
      }

      if (descuentoAplicado) {
        mensaje += `\n🎁 Código aplicado: ${descuentoAplicado.codigo}`;
      }
      
      mensaje += `\n\n🙋‍♂️ Nombre: ${nombreUsuario}`;
      
      const numeroTelefono = "543541293736";
      const url = `https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");

      // Limpiar estados
      setShowModal(false);
      clearCart();
      setNombreUsuario("");
      setDescuentoAplicado(null);
      setCodigoDescuento("");
      setMostrarInputCodigo(false);
      
    } catch (error) {
      console.error("❌ Error al guardar el pedido:", error);
      alert("Error al procesar el pedido. Intenta de nuevo.");
    }
  };

  return (
    <>
      <Header
        cart={cart}
        removeFromCart={removeFromCart}
        increaseQuantity={increaseQuantity}
        decreaseQuantity={decreaseQuantity}
        clearCart={clearCart}
        pay={pay}
        promocionesActivas={promocionesActivasHoy}
        calcularTotal={calcularTotal}
        calcularAhorro={calcularAhorro}
        codigoDescuento={codigoDescuento}
        setCodigoDescuento={setCodigoDescuento}
        descuentoAplicado={descuentoAplicado}
        aplicarCodigoDescuento={aplicarCodigoDescuento}
        quitarCodigoDescuento={quitarCodigoDescuento}
        mensajeCodigo={mensajeCodigo}
        mostrarInputCodigo={mostrarInputCodigo}
        calcularTotalConDescuento={calcularTotalConDescuento}
      />

      {showMessage && (
        <div
          style={{
            position: "fixed",
            top: "90%",
            right: "20px",
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        >
          Producto agregado al carrito!!!!
        </div>
      )}

      {/* Banner de promociones activas */}
      {promocionesActivasHoy.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
          color: 'white',
          padding: '15px',
          textAlign: 'center',
          marginBottom: '20px',
          borderRadius: '0 0 10px 10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>🎉 ¡PROMOCIONES ACTIVAS! 🎉</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {promocionesActivasHoy.map(promo => (
              <div key={promo.id} style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 15px',
                borderRadius: '20px',
                fontSize: '14px'
              }}>
                <strong>{promo.nombre}</strong> - {promo.descripcion}
                {promo.descuento > 0 && (
                  <span style={{ marginLeft: '8px' }}>🏷️ {promo.descuento}% OFF</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <main>
        <section id="intro">
          <h2 id="prota" className="text-center">
            ¿Cuál es tu <br /> protagonista <br /> del día?
          </h2>

          <div>
            <img id="donut" src="/img/header.png" />
          </div>
        </section>

        <h2 id="cartelera" className="text-center">
          Cartelera de sabores
        </h2>

        <div id="all" className="row mt-5">
          {productosConDescuento.map((donas) => (
            <Dona
              key={donas.id}
              donas={donas}
              setCart={setCart}
              addToCart={addToCart}
            />
          ))}
        </div>
      </main>

      <footer id="foot">
        <div className="footer-content">
          <p id="foottext">Visita nuestras redes sociales!</p>
          <div className="social-wrapper">
            <div className="social-item">
              <a href="https://www.tiktok.com/@donasyaccion">
                <img className="tiktok" src="/img/tiktok.png" alt="TikTok" />
                <p id="red1">donasyaccion</p>
              </a>
            </div>
            <div className="social-item">
              <a href="https://www.instagram.com/donasyaccion">
                <img className="ig" src="/img/ig.png" alt="Instagram" />
                <p id="red2">donasyaccion</p>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "10px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2>Gracias por tu compra 🎉</h2>
            
            {descuentoAplicado && (
              <div style={{
                background: '#e3f2fd',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px',
                color: '#1976d2'
              }}>
                <strong>🎁 Código {descuentoAplicado.codigo} aplicado: </strong>
                {descuentoAplicado.tipo === 'porcentaje' ? 
                  `${descuentoAplicado.valor}% de descuento` : 
                  `$${descuentoAplicado.valor} de descuento`
                }
              </div>
            )}

            {calcularAhorro() > 0 && (
              <div style={{
                background: '#e8f5e8',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px',
                color: '#2e7d32'
              }}>
                <strong>🎉 ¡Ahorraste: ${calcularAhorro().toFixed(2)} en promociones!</strong>
              </div>
            )}
            
            <p id="precio">
              Total: <strong>${calcularTotalConDescuento().toFixed(2)}</strong>
            </p>

            {!descuentoAplicado && (
  <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '5px' }}>
    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#856404' }}>
      🎁 <strong>¡Tenés un código de descuento?</strong> Ingresalo aquí.
    </p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <input
        type="text"
        placeholder="Ingresá tu código"
        value={codigoDescuento}
        onChange={(e) => setCodigoDescuento(e.target.value)}
        style={{
          flex: 1,
          padding: '8px',
          borderRadius: '5px',
          border: '1px solid #ccc',
        }}
      />
      <button
        onClick={aplicarCodigoDescuento}
        style={{
          padding: '8px 15px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Aplicar
      </button>
    </div>
    {mensajeCodigo && (
      <p style={{ 
        margin: '10px 0 0 0', 
        fontSize: '12px', 
        color: mensajeCodigo.includes('✅') ? '#28a745' : '#dc3545' 
      }}>
        {mensajeCodigo}
      </p>
    )}
  </div>
)}

            <p id="alias">
              Alias: <strong>Donasyaccion</strong>
              <img
                src="/img/copy.png"
                alt="Copiar alias"
                onClick={() => {
                  const textToCopy = "Donasyaccion";
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy);
                  } else {
                    const tempInput = document.createElement('input');
                    tempInput.value = textToCopy;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                  }
                }}
                style={{
                  marginLeft: "10px",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                }}
              />
            </p>

            <div style={{ marginTop: "15px" }}>
              <input
                type="text"
                placeholder="Tu nombre (obligatorio)"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                style={{
                  width: "80%",
                  padding: "0.5rem",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <button
              style={{
                marginTop: "10px",
                padding: "0.5rem 1rem",
                backgroundColor: "#25D366",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={handleConfirmOrder}
            >
              Hacer pedido por WhatsApp
            </button>

            <br />
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "5px",
                padding: "0.5rem 1rem",
                backgroundColor: "#f4f4f4",
                color: "#333",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;