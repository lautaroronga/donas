export default function Dona({donas, setCart, addToCart}) {
    
    const{ id, name, image, description, price}=donas



    return (
    <div id="donass" className="col-md-6 col-lg-4 my-4 row align-items-center">
                    <div className="col-4">
                        <img id="catalogo" className="img-fluid" src={`/img/${image}.png`} alt="imagen donas" />
                    </div>
                    <div className="col-8">
                        <h3 className="fs-4 fw-bold text-uppercase">{name}</h3>
                        <p>{description}</p>
                        <p className="fw-black text-primary fs-3">${price}</p>
                        <button 
                            type="button"
                            id="addcart"
                            className="btn btn-dark "
                            onClick={()=>addToCart(donas)}
                            >Agregar al Carrito
                        </button>
                    </div>
                </div>
    
    )
    }