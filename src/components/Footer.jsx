// src/components/Footer.jsx
import React from "react";
import { FaInstagram, FaPhone } from 'react-icons/fa';

export default function Footer() {
  const phoneNumber = "+54 9 342 628-8271"; 
  const instagramLink = "https://www.instagram.com/distribuidoramarcial/";

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section footer-contact">
          <h3>Contacto</h3>
          <p>
            <FaPhone className="footer-icon" />
            <a href={`tel:${phoneNumber.replace(/\s/g, '')}`}>{phoneNumber}</a>
          </p>
          <p>
            <FaInstagram className="footer-icon" />
            <a href={instagramLink} target="_blank" rel="noopener noreferrer">
              Seguinos en Instagram
            </a>
          </p>
        </div>
        <div className="footer-section footer-info">
          <h3>Distribuidora Marcial</h3>
          <p>Calidad y servicio en cada entrega.</p>
        </div>
      </div>
      <div className="copy-footer">
        <p>Distribuidora Marcial© {new Date().getFullYear()} Todos los derechos reservados</p>
      </div>
    </footer>
  );
}