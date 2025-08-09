// src/components/Header.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logoSrc from "../assets/logo.png"; // Asegúrate que esta ruta sea correcta
import CartIcon from "./CartIcon";

export default function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    if (isNavOpen) {
      setIsNavOpen(false);
    }
  };

  return (
    <header className="site-header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/" onClick={closeNav}>
            <img src={logoSrc} alt="Logo Distribuidora" className="site-logo" />
          </Link>
        </div>
        <div className="welcome-message">
          <h1>Distribuidora Marcial</h1>
        </div>
        <div className="header-actions">
          <button 
            className={`nav-toggle ${isNavOpen ? "open" : ""}`} 
            onClick={toggleNav} 
            aria-label="Toggle navigation"
            aria-expanded={isNavOpen}
          >
            <span className="hamburger-icon"></span>
          </button>
        </div>
      </div>
      <nav className={`main-nav ${isNavOpen ? "open" : ""}`}>
        <ul>
          <li><NavLink to="/" onClick={closeNav} end>Productos</NavLink></li>
          <li><NavLink to="/admin" onClick={closeNav}>Admin</NavLink></li>
        </ul>
      </nav>
    </header>
  );
}