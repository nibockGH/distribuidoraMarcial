// src/components/Header.jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSearch } from './SearchContext'; // <-- Importamos el hook
import logoSrc from '../assets/logo.png';
import CartIcon from './CartIcon';

export default function Header() {
  const { setSearchTerm } = useSearch(); // <-- Usamos el contexto para setear la búsqueda
  const [localSearch, setLocalSearch] = useState(''); // Estado local para el input
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(localSearch); // Enviamos el término de búsqueda al contexto global
    navigate('/'); // Navegamos a la lista de productos para ver los resultados
  };

  return (
    <header className="main-header">
      <div className="main-header-content">
        <div className="logo-wrapper">
          <Link to="/" className="logo-link">
            <img src={logoSrc} alt="Logo Distribuidora Marcial" className="site-logo" />
          </Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li><NavLink to="/" end>Productos</NavLink></li>
            <li><NavLink to="/nosotros">Nosotros</NavLink></li>
            <li><NavLink to="/faq">Preguntas Frecuentes</NavLink></li>
          </ul>
        </nav>
        <div className="header-actions">
          {/* --- FORMULARIO DE BÚSQUEDA FUNCIONAL --- */}
          <form onSubmit={handleSearchSubmit} className="header-search">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            <button type="submit" aria-label="Buscar">
              <i className="fas fa-search"></i>
            </button>
          </form>
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
