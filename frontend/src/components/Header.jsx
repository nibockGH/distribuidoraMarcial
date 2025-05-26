import React from "react";
import { Link } from "react-router-dom";
import logoSrc from "../assets/logo.png";
import CartIcon from "./CartIcon";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/">
            <img src={logoSrc} alt="Logo Distribuidora Marcial" className="site-logo" />
          </Link>
        </div>

        {/* Nuevo contenedor para el texto de bienvenida */}
        <div className="welcome-message">
          <h1>¡Bienvenidos a Distribuidora Marcial!</h1>
        </div>

        <div className="cart-icon-header-container">
          <CartIcon />
        </div>
      </div>
      {/* El site-title anterior lo movemos y lo integramos en welcome-message */}
      {/* <h1 className="site-title">Precios y Productos</h1> */}
    </header>
  );
}