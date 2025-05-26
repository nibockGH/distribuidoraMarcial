// src/CartContext.jsx
import { createContext, useState } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Agrega o incrementa un producto
  const addToCart = (product) => {
    console.log("CartContext: addToCart llamado con:", product); // Depuración
    setCartItems((prev) => {
      console.log("CartContext: Estado previo del carrito:", prev); // Depuración
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        console.log("CartContext: Producto existente, incrementando cantidad."); // Depuración
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        console.log("CartContext: Producto nuevo, agregando al carrito con cantidad 1."); // Depuración
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  // Resta o elimina un producto
  // ¡CORRECCIÓN CLAVE! Ahora removeFromCaart espera solo el ID del producto
  const removeFromCart = (productId) => { // <-- Cambiado 'product' a 'productId'
    console.log("CartContext: removeFromCart llamado con ID:", productId); // Depuración
    setCartItems((prev) => {
      console.log("CartContext: Estado previo del carrito:", prev); // Depuración
      const existing = prev.find((item) => item.id === productId); // <-- Usa productId
      if (!existing) {
        console.log("CartContext: Producto no encontrado en el carrito para remover."); // Depuración
        return prev;
      }

      if (existing.quantity === 1) {
        console.log("CartContext: Cantidad 1, eliminando producto del carrito."); // Depuración
        return prev.filter((item) => item.id !== productId); // <-- Usa productId
      } else {
        console.log("CartContext: Disminuyendo cantidad de producto."); // Depuración
        return prev.map((item) =>
          item.id === productId // <-- Usa productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
    });
  };

  // Vaciar carrito
  const clearCart = () => {
    console.log("CartContext: Vaciando carrito."); // Depuración
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
