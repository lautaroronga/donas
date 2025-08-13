import {useMemo} from 'react'

export default function Header({cart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, pay}) {
    const isEmpty=useMemo(()=>cart.length===0, [cart])
    const cartTotal=useMemo(()=>cart.reduce((total, item)=>total+(item.quantity*item.price),0),[cart])

    return (
        <>
            <header id="head" className="header">
    <div className="container-xl">
        <div className="">
            <div className="">
                <a href="index.html">
                    <img id="logo" className="img-fluid" src="/img/logo.png" alt="imagen logo" />
                </a>
            </div>
            <div>
                <h3 id="eslogan">Tus donas favoritas en un solo lugar</h3>
            </div>
            <nav>
                <div className="carrito">
                    
                    <img id="carro" src="/img/carrito.png" alt="imagen carrito" />
                    <div id="carrito" className="bg-white p-3">
                        
                        {isEmpty?(
                        <p className="text-center">El carrito está vacío</p>
                    ):(
                        <>
                        <table className="w-100 table">
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                        {cart.map(donas=>(
                                    <tr key={donas.id}>
                                    <td>
                                        <img className="img-fluid" src={`/img/${donas.image}.png`} alt="imagen donas" />
                                    </td>
                                    <td>{donas.name}</td>
                                    <td id="donaprecio" className="fw-bold">
                                        ${donas.price}
                                    </td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <button type="button" className="btn btn-dark cantidad" onClick={() => decreaseQuantity(donas.id)}>-</button>
                                            <span>{donas.quantity}</span>
                                          <button type="button" className="btn btn-dark cantidad" onClick={() => increaseQuantity(donas.id)}>+</button>
                                    </td>
                                    <td id="eliminado">
                                        <button className="btn btn-danger" type="button" onClick={()=>removeFromCart(donas.id)}>X</button>
                                    </td>
                                </tr>))}
                                
                            </tbody>
                        </table>
                        <p className="text-end">Total a pagar: <span className="fw-bold">${cartTotal}</span></p>
                        <button id="addcart" className="btn btn-dark w-100 mt-3 p-2" type="button" onClick={pay}>Pagar</button>
                        <button id="addcart" className="btn btn-dark w-100 mt-3 p-2" type="button" onClick={clearCart}>Vaciar Carrito</button>
                        </>
                        )}
                        
                    </div>
                </div>
            </nav>
        </div>
    </div>
</header>
        </>
        
    )
}