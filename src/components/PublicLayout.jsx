import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

const PublicLayout = () => {
return (
    <div className="public-view">
      <Header />
      <main className="main-content">
        <Outlet /> {/* Renders the child route component */}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

// Asegúrate de que esta línea esté al final y sea exactamente así
export default PublicLayout;