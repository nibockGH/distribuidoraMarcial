// src/components/WhatsAppButton.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import whatsapp_icon from "../assets/whatsapp_icon.png";

export default function WhatsAppButton() {
  const location = useLocation();

  // Oculta el botón de WhatsApp en la página del carrito
  if (location.pathname === '/cart') {
    return null;
  }

  // Número de WhatsApp (ejemplo: +5493425953685 -> 5493425953685)
  const phoneNumber = '5493425953685';
  const message = encodeURIComponent('Hola, me gustaría hacer un pedido.'); // Mensaje predefinido

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button-floating"
      title="Contactar por WhatsApp"
    >
      <img src={whatsapp_icon} alt="WhatsApp" className="whatsapp-icon" /> {/* Asegúrate de tener este icono en /public */}
    </a>
  );
}