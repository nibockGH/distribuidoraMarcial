import React, { useContext } from 'react';
import { CartContext } from './cartContext';

export default function CartPage() { // Renombré a CartPage para que sea consistente con el archivo
  const { cartItems, addToCart, removeFromCart, clearCart } = useContext(CartContext);

  const calculateTotal = () => {
    // Usamos item.precio ya que ahora es la propiedad correcta para el precio
    return cartItems.reduce((total, item) => total + item.precio * item.quantity, 0);
  };

  const handleCheckout = () => {
    // Usamos item.nombre ya que ahora es la propiedad correcta para el nombre del producto
    const lines = cartItems.map(i => `${i.nombre} x${i.quantity}`);
    lines.push(`Total: $${calculateTotal().toLocaleString('es-AR')}`); // Usamos calculateTotal() para el total

    const message = `Hola distribuidora marcial! Quiero hacer el siguiente pedido:\n${lines.join('\n')}`;

    const text = encodeURIComponent(message);
    const url = `https://wa.me/5493425953685?text=${text}`;

    console.log("Cart: URL de WhatsApp generada:", url);
    window.open(url, '_blank');
  };

  return (
    <div className="cart-container">
      <h2>Tu Carrito</h2>
      {cartItems.length === 0 ? (
        <p className="empty-cart-message">Tu carrito está vacío.</p>
      ) : (
        <>
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  {/* Aseguramos que se muestre item.nombre y item.precio */}
                  <span className="cart-item-name">{item.nombre}</span>
                  <span className="cart-item-price">${item.precio.toLocaleString('es-AR')}</span>
                </div>
                {/* Restauramos el div con la clase product-controls para mantener el estilo */}
                <div className="product-controls">
                  <button onClick={() => removeFromCart(item.id)}>-</button>
                  <span className="product-quantity">{item.quantity}</span>
                  <button onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            {/* Usamos calculateTotal() para el total */}
            <h3>Total: ${calculateTotal().toLocaleString('es-AR')}</h3>
            <button onClick={handleCheckout} disabled={cartItems.length === 0}>
              Finalizar pedido (WhatsApp)
            </button>
            <button onClick={clearCart} disabled={cartItems.length === 0}>
              Vaciar Carrito
            </button>
          </div>
        </>
      )}
    </div>
  );
}