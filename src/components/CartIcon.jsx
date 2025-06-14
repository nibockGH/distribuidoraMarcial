// cartIcon.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "./CartContext"; // <-- SOLO necesitas CartContext para useContext


export default function CartIcon() {
  const { cartItems } = useContext(CartContext); // ✅ CAMBIO CLAVE
  const [isPop, setIsPop] = useState(false);

  useEffect(() => {
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      setIsPop(true);
      const id = setTimeout(() => setIsPop(false), 300);
      return () => clearTimeout(id);
    }
  }, [cartItems.length]);

  return (
    <Link to="/cart" className={`cart-icon ${isPop ? "pop" : ""}`}>
      🛒
      <span className="cart-badge">{cartItems.length}</span>
    </Link>
  );
}
