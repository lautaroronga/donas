import {useMemo, useState, useEffect} from 'react'

export default function Header({
  cart, 
  removeFromCart, 
  increaseQuantity, 
  decreaseQuantity, 
  clearCart, 
  pay, 
  promocionesActivas = [],
  calcularTotal,
  calcularAhorro,
  codigoDescuento,
  setCodigoDescuento,
  descuentoAplicado,
  aplicarCodigoDescuento,
  quitarCodigoDescuento,
  mensajeCodigo,
  mostrarInputCodigo,
  calcularTotalConDescuento
}) {
    const isEmpty = useMemo(() => cart.length === 0, [cart]);
    const cartTotal = useMemo(() => calcularTotal ? calcularTotal() : cart.reduce((total, item) => total + (item.quantity * item.price), 0), [cart, calcularTotal]);
    const ahorroTotal = useMemo(() => calcularAhorro ? calcularAhorro() : 0, [cart, calcularAhorro]);
    const totalConDescuento = useMemo(() => calcularTotalConDescuento ? calcularTotalConDescuento() : cartTotal, [cartTotal, calcularTotalConDescuento]);

    // 🔹 Función para determinar la fuente de la imagen
    const getImageSource = (item) => {
        if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
            return item.image;
        }
        else if (item.image) {
            return `/img/${item.image}.png`;
        }
        else {
            return '/img/default-dona.png';
        }
    };

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
                                
                                {promocionesActivas.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: '#FF6B6B',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        🎉
                                    </div>
                                )}
                                
                                <div id="carrito" className="bg-white p-3">
                                    {isEmpty ? (
                                        <p className="text-center">El carrito está vacío</p>
                                    ) : (
                                        <>
                                            {/* Input para código de descuento en el carrito */}
                                            {mostrarInputCodigo && !descuentoAplicado && (
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                    color: 'white',
                                                    padding: '12px',
                                                    borderRadius: '5px',
                                                    marginBottom: '15px'
                                                }}>
                                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                                        🎁 ¡Eres un cliente recurrente!
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Ingresá tu código"
                                                            value={codigoDescuento}
                                                            onChange={(e) => setCodigoDescuento(e.target.value)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '6px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                fontSize: '12px'
                                                            }}
                                                        />
                                                        <button
                                                            onClick={aplicarCodigoDescuento}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            Aplicar
                                                        </button>
                                                    </div>
                                                    {mensajeCodigo && (
                                                        <p style={{ 
                                                            margin: '8px 0 0 0', 
                                                            fontSize: '11px', 
                                                            color: mensajeCodigo.includes('✅') ? '#c8e6c9' : '#ffcdd2',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {mensajeCodigo}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mostrar descuento aplicado por código */}
                                            {descuentoAplicado && (
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                                    color: 'white',
                                                    padding: '10px',
                                                    borderRadius: '5px',
                                                    marginBottom: '15px',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <strong>🎁 Código: {descuentoAplicado.codigo}</strong>
                                                            <div style={{ fontSize: '12px' }}>
                                                                {descuentoAplicado.tipo === 'porcentaje' ? 
                                                                    `${descuentoAplicado.valor}% de descuento` : 
                                                                    `$${descuentoAplicado.valor} de descuento`
                                                                }
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={quitarCodigoDescuento}
                                                            style={{
                                                                background: 'rgba(255,255,255,0.2)',
                                                                color: 'white',
                                                                border: '1px solid white',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            ❌
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {ahorroTotal > 0 && (
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                                                    color: 'white',
                                                    padding: '10px',
                                                    borderRadius: '5px',
                                                    marginBottom: '15px',
                                                    textAlign: 'center'
                                                }}>
                                                    <strong>🎉 ¡Ahorraste: ${ahorroTotal.toFixed(2)} en promociones!</strong>
                                                </div>
                                            )}

                                            {/* 🔹 TABLA DE PRODUCTOS DEL CARRITO - ESTO ES LO QUE FALTABA */}
                                            <table className="w-100 table">
                                                <thead>
                                                    <tr>
                                                        <th>Imagen</th>
                                                        <th>Nombre</th>
                                                        <th>Precio</th>
                                                        <th>Cantidad</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cart.map(donas => (
                                                        <tr key={donas.id}>
                                                            <td>
                                                                <img 
                                                                    className="img-fluid" 
                                                                    src={getImageSource(donas)} 
                                                                    alt={donas.name}
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '5px'
                                                                    }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = '/img/default-dona.png';
                                                                    }}
                                                                />
                                                            </td>
                                                            <td id="nombredona">
                                                                {donas.name}
                                                                {donas.precioOriginal && donas.precioOriginal > donas.price && (
                                                                    <div style={{
                                                                        fontSize: '12px',
                                                                        color: '#4CAF50',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        🏷️ ${(donas.precioOriginal - donas.price).toFixed(2)} de descuento
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td id="donaprecio" className="fw-bold">
                                                                {donas.precioOriginal && donas.precioOriginal > donas.price ? (
                                                                    <div>
                                                                        <span style={{
                                                                            textDecoration: 'line-through',
                                                                            color: '#999',
                                                                            fontSize: '14px'
                                                                        }}>
                                                                            ${donas.precioOriginal}
                                                                        </span>
                                                                        <br />
                                                                        <span style={{ color: '#e74c3c' }}>
                                                                            ${donas.price}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    `$${donas.price}`
                                                                )}
                                                            </td>
                                                            <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-dark cantidad" 
                                                                    onClick={() => decreaseQuantity(donas.id)}
                                                                    style={{
                                                                        width: '30px',
                                                                        height: '30px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        padding: 0
                                                                    }}
                                                                >
                                                                    -
                                                                </button>
                                                                <span style={{ 
                                                                    minWidth: '20px', 
                                                                    textAlign: 'center',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {donas.quantity}
                                                                </span>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-dark cantidad" 
                                                                    onClick={() => increaseQuantity(donas.id)}
                                                                    style={{
                                                                        width: '30px',
                                                                        height: '30px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        padding: 0
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </td>
                                                            <td id="eliminado">
                                                                <button 
                                                                    className="btn btn-danger" 
                                                                    type="button" 
                                                                    onClick={() => removeFromCart(donas.id)}
                                                                    style={{
                                                                        padding: '5px 10px',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    X
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            
                                            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                {ahorroTotal > 0 && (
                                                    <p className="text-end" style={{ color: '#2196F3', fontSize: '14px' }}>
                                                        Ahorro por promociones: <strong>${ahorroTotal.toFixed(2)}</strong>
                                                    </p>
                                                )}
                                                
                                                {/* Mostrar descuento por código */}
                                                {descuentoAplicado && (
                                                    <p className="text-end" style={{ color: '#4CAF50', fontSize: '14px' }}>
                                                        Descuento por código: <strong>
                                                            {descuentoAplicado.tipo === 'porcentaje' ? 
                                                                `-${descuentoAplicado.valor}%` : 
                                                                `-$${descuentoAplicado.valor}`
                                                            }
                                                        </strong>
                                                    </p>
                                                )}
                                                
                                                <p className="text-end">
                                                    Total a pagar: <span className="fw-bold" style={{ 
                                                        fontSize: '18px', 
                                                        color: '#007bff',
                                                        textDecoration: descuentoAplicado ? 'line-through' : 'none',
                                                        opacity: descuentoAplicado ? 0.6 : 1
                                                    }}>
                                                        ${cartTotal.toFixed(2)}
                                                    </span>
                                                    
                                                    {/* Mostrar total con descuento aplicado */}
                                                    {descuentoAplicado && (
                                                        <span className="fw-bold" style={{ 
                                                            fontSize: '20px', 
                                                            color: '#28a745',
                                                            marginLeft: '10px'
                                                        }}>
                                                            ${totalConDescuento.toFixed(2)}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            
                                            <button 
                                                id="addcart" 
                                                className="btn btn-dark w-100 mt-3 p-2" 
                                                type="button" 
                                                onClick={pay}
                                                style={{
                                                    backgroundColor: '#28a745',
                                                    border: 'none',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                💳 Pagar
                                            </button>
                                            <button 
                                                id="addcart" 
                                                className="btn btn-dark w-100 mt-3 p-2" 
                                                type="button" 
                                                onClick={clearCart}
                                                style={{
                                                    backgroundColor: '#dc3545',
                                                    border: 'none',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                🗑️ Vaciar Carrito
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>
        </>
    );
}