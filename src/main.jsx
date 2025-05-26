// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CartProvider } from "./components/CartContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <CartProvider> {/* ¡Aquí es donde debe estar! */}
    <BrowserRouter>
        <App />
    </BrowserRouter>
      </CartProvider>
  </React.StrictMode>
);