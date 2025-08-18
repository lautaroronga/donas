import { useState, useEffect } from "react"
import Dona from "./components/Dona"
import Header from "./components/Header"
import {db} from "./data/db"


function App() {
  const initialCart=() =>{
    const localStorageCart = localStorage.getItem('cart')
    return localStorageCart ? JSON.parse(localStorageCart) : []
  }
  const [data] = useState(db)
  const [cart, setCart] = useState(initialCart)
  const [showModal, setShowModal] = useState(false)
  const [showMessage, setShowMessage] = useState(false)

  const MAX_ITEMS = 12
const MIN_ITEMS = 1

function addToCart(item) {
  const itemExists = cart.findIndex(donas => donas.id === item.id)
   let updatedCart;
   
  if (itemExists >= 0) {
    const updatedCart = cart.map((donas, index) => {
      if (index === itemExists && donas.quantity < MAX_ITEMS) {
        return { ...donas, quantity: donas.quantity + 1 }
      }
      return donas
    })
    setCart(updatedCart)
    saveLocalStorage(updatedCart)
  } else {
    const newItem = { ...item, quantity: 1 }
    const updatedCart = [...cart, newItem]
    setCart(updatedCart)
    saveLocalStorage(updatedCart)
  }
  setShowMessage(true)
  setTimeout(() => setShowMessage(false), 2000)

}


function removeFromCart(id) {
  const updatedCart = cart.filter(donas => donas.id !== id)
  setCart(updatedCart)
  saveLocalStorage(updatedCart)
}

function increaseQuantity(id) {
  const updatedCart = cart.map(item => {
    if (item.id === id && item.quantity < MAX_ITEMS) {
      return { ...item, quantity: item.quantity + 1 }
    }
    return item
  })
  setCart(updatedCart)
  saveLocalStorage(updatedCart)
}

function decreaseQuantity(id) {
  const updatedCart = cart.map(item => {
    if (item.id === id && item.quantity > MIN_ITEMS) {
      return { ...item, quantity: item.quantity - 1 }
    }
    return item
  })
  setCart(updatedCart)
  saveLocalStorage(updatedCart)
}

function clearCart() {
  setCart([])
  saveLocalStorage([])
}
function pay() {
  setShowModal(true)
}
function calcularTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0)
}


function saveLocalStorage(data) {
  localStorage.setItem('cart', JSON.stringify(data))
}

function redirectToWhatsApp() {
  const nombrePlaceholder = "Escribí tu nombre acá"
  const itemsComprados = cart.map(item => 
    `🍩 ${item.name} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n')

  const total = calcularTotal().toFixed(2)

  const mensaje = `Hola! Quiero confirmar mi pedido:\n\n${itemsComprados}\n\n💰 Total: $${total}\n\n🙋‍♂️ Nombre: ${nombrePlaceholder}`

  const numeroTelefono = "543541293736" // Cambiá por tu número de WhatsApp sin el "+" (por ejemplo: 5491123456789)
  const url = `https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`

  window.open(url, '_blank')
}

  return (
    <>
    <Header 
    cart={cart}
    removeFromCart={removeFromCart}
    increaseQuantity={increaseQuantity}
    decreaseQuantity={decreaseQuantity}
    clearCart={clearCart}
    pay={pay}
    />
    {showMessage && (
  <div style={{
    position: 'fixed',
    top: '90%',
    right: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    boxShadow: '0px 0px 10px rgba(0,0,0,0.3)',
    zIndex: 1000
  }}>
     Producto agregado al carrito!!!!
  </div>
)}

    <main cla>
        <section id="intro">
            <h2 id="prota" className="text-center">¿Cuál es tu 
            <br/>
             protagonista
             <br/>
            del día?</h2>
       

            <div  >
                <img id="donut" src="/img/header.png"></img>
            </div>
        </section>
        
           
        
            
        <h2 id="cartelera" className="text-center">Cartelera de sabores</h2>
       

        <div id="all" className="row mt-5">
            {data.map((donas) =>(
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
        <a href="https://www.tiktok.com/@donasyaccion?is_from_webapp=1&sender_device=pc">
          <img className="tiktok" src="/img/tiktok.png" alt="TikTok" />
          <p id="red1">donasyaccion</p>
        </a>
      </div>
      <div className="social-item">
        <a href="https://www.instagram.com/donasyaccion?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==">
          <img className="ig" src="/img/ig.png" alt="Instagram" />
          <p id="red2">donasyaccion</p>
        </a>
      </div>
    </div>
  </div>
  
</footer>

   {showModal && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '10px',
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      <h2>Gracias por tu compra 🎉</h2>
      <p id="precio">Total: <strong>${calcularTotal().toFixed(2)}</strong></p>

      <p id="alias">
  Alias: <strong>Donasyaccion</strong>
  <img 
    src="/img/copy.png" 
    alt="Copiar alias"
    onClick={() => navigator.clipboard.writeText("Donasyaccion")}
    style={{ 
      marginLeft: "10px", 
      width: "20px", 
      height: "20px", 
      cursor: "pointer" 
    }}
  />
</p>


      <button
        onClick={() => {
          redirectToWhatsApp();
          setShowModal(false);
          clearCart();
        }}
        style={{ marginTop: '2px', padding: '0.5rem 1rem' }}
      >
        Hacer pedido
      </button>

      <br/>
      <button
        onClick={() => setShowModal(false)}
        style={{marginTop: '5px',  padding: '0.5rem 1rem' }}
      >
        Cerrar
      </button>
    </div>
  </div>
)}
    </>
  )
}


export default App