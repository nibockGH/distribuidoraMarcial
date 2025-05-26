import React from "react";
// Importa los íconos necesarios de react-icons
import { FaInstagram, FaPhone } from 'react-icons/fa';

// Importa tus imágenes de marca (asegúrate de que las rutas sean correctas)
import marca1 from "../assets/marca1.png";
import marca2 from "../assets/marca2.png";
import marca3 from "../assets/marca3.png";
import marca4 from "../assets/marca4.png";
import marca5 from "../assets/marca5.png";
import marca6 from "../assets/marca6.png";
import marca7 from "../assets/marca7.png";

export default function Footer() {
  // Reemplaza con tu información real
  const phoneNumber = "+54 9 342 628-8271"; // Ejemplo: Tu número de teléfono
  const instagramLink = "https://www.instagram.com/distribuidoramarcial/"; // Ejemplo: Tu enlace de Instagram
  // Si tienes un enlace a Google Maps específico, úsalo aquí.
  // Ejemplo: const googleMapsLink = "https://maps.app.goo.gl/abcdefg";
  // O un enlace genérico de búsqueda:


  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Sección de Contacto */}
        <div className="footer-section footer-contact">
          <h3>Contacto</h3>
          <p>
            <FaPhone className="footer-icon" />{' '}
            {/* El enlace 'tel:' permite llamar directamente desde móviles */}
            <a href={`tel:${phoneNumber.replace(/\s/g, '')}`}>{phoneNumber}</a>
          </p>
          <p>
            
            <FaInstagram className="footer-icon" />{' '}
            {/* El enlace abre Instagram en una nueva pestaña */}
            <a href={instagramLink} target="_blank" rel="noopener noreferrer">
              Seguinos en Instagram
            </a>
          </p>
        </div>

        {/* Sección de Marcas */}
        <div className="footer-section footer-brands">
          <h3>Nuestras Marcas</h3>
          <div className="footer-logos">
            {/* Asegúrate de que tus imágenes estén en la carpeta ../assets/ */}
            <img src={marca1} alt="Marca 1" />
            <img src={marca2} alt="Marca 2" />
            <img src={marca3} alt="Marca 3" />
            <img src={marca4} alt="Marca 4" />
            <img src={marca5} alt="Marca 5" />
            <img src={marca6} alt="Marca 6" />
            <img src={marca7} alt="Marca 7" />
          </div>
        </div>

        
      </div> {/* Fin footer-content */}

      {/* Sección de Copyright */}
      <div className="copy-footer">
        {/* El año se actualiza automáticamente */}
        <p>Distribuidora Marcial © {new Date().getFullYear()} Todos los derechos reservados</p>
      </div>
    </footer>
  );
}