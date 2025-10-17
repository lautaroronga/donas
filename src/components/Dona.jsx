export default function Dona({donas, addToCart}) {
    
    // Desestructuramos las propiedades, que ahora están HOMOGENEIZADAS
    // en App.jsx para usar 'name', 'price', e 'image' consistentemente.
    const { name, image, description, price, off } = donas;

    // Función para determinar la fuente de la imagen (local o URL de Firebase)
    const getImageUrl = (img) => {
        if (!img) {
            // Placeholder si no hay imagen
            return "https://placehold.co/150x150/f0f0f0/888?text=Sin+Imagen";
        }
        
        // 1. Verifica si es una URL completa de Firebase o externa
        if (img.startsWith("http://") || img.startsWith("https://")) {
            return img; // Es una URL, úsala directamente
        }

        // 2. Si no es una URL, asume que es un nombre de archivo local (como antes)
        return `/img/${img}.png`;
    };

    return (
        <div id="donass" className="col-md-6 col-lg-4 my-4 row align-items-center">
            <div className="col-4">
                <img 
                    id="catalogo" 
                    className="img-fluid" 
                    src={getImageUrl(image)} 
                    alt={`Imagen de ${name}`} 
                    style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '1 / 1' // Asegura que la imagen sea cuadrada
                    }}
                />
            </div>
            <div className="col-8">
                <h3 className="fs-4 fw-bold text-uppercase">{name}</h3>
                {/* Asumo que 'description' es una propiedad que también agregaste en Firebase si quieres mostrarla */}
                {description && <p>{description}</p>} 
                
                {/* Mostramos 'off' si existe */}
                {off && <p id="pers" style={{color: 'red', fontWeight: 'bold'}}>{off}</p>}
                
                <p className="fw-black text-primary fs-3">${price}</p>
                <button 
                    type="button"
                    id="addcart"
                    className="btn btn-dark"
                    onClick={()=>addToCart(donas)}
                >
                    Agregar al Carrito
                </button>
            </div>
        </div>
    )
}
