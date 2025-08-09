// src/components/Cart.jsx
import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from './CartContext';
import { createOrderInBackend } from './orderService';

export default function CartPage() {
  const { cartItems, addToCart, removeFromCart, clearCart } = useContext(CartContext);
  
  const [customerContactInfo, setCustomerContactInfo] = useState({ name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderProcessingSteps, setOrderProcessingSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState(null);

  const handleCustomerContactChange = (e) => {
    const { name, value } = e.target;
    setCustomerContactInfo(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.precio * item.quantity, 0);
  };

  const handleCheckout = async () => {
    setError('');
    setOrderProcessingSteps([]);
    setCurrentStep(0);
    setIsOrderCompleted(false);
    setFinalOrderId(null);

    if (cartItems.length === 0) {
      setError("Tu carrito está vacío."); return;
    }
    if (!customerContactInfo.name.trim()) {
      setError("Por favor, ingresa un nombre para el pedido."); return;
    }

    for (const item of cartItems) {
      if (item.stock !== undefined && item.quantity > item.stock) {
        setError(`Stock insuficiente para ${item.nombre}. Disponible: ${item.stock}, Pedido: ${item.quantity}.`);
        return;
      }
    }
    
    setIsLoading(true);
    const steps = [];
    const addStep = (message, isSuccess = true) => {
        steps.push({ message, isSuccess });
        setOrderProcessingSteps([...steps]);
        setCurrentStep(steps.length);
    };
    
    addStep("1. Validando stock y preparando pedido...");
    await new Promise(resolve => setTimeout(resolve, 700));

    try {
      addStep("2. Registrando pedido y actualizando stock...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orderItemsPayload = cartItems.map(item => ({
        product_id: item.id, product_name: item.nombre, 
        quantity: item.quantity, price_per_unit: item.precio
      }));
      const orderDataForBackend = {
        items: orderItemsPayload,
        total_amount: calculateTotal(),
        status: 'Pendiente',
        // --- LÍNEA AÑADIDA ---
        customer_name: customerContactInfo.name 
    };
    
      
      const backendResponse = await createOrderInBackend(orderDataForBackend);
      setFinalOrderId(backendResponse.order_id);
      addStep(`3. ¡Pedido #${backendResponse.order_id} registrado! Stock actualizado.`);
      await new Promise(resolve => setTimeout(resolve, 700));

      addStep("4. Preparando mensaje para WhatsApp...");
      const whatsAppLines = cartItems.map(i => `${i.nombre} (x${i.quantity})`);
      whatsAppLines.push(`Total: $${calculateTotal().toLocaleString('es-AR')}`);
      if (backendResponse.order_id) {
        whatsAppLines.push(`Referencia Pedido: #${backendResponse.order_id}`);
      }
      
      const message = `Hola! Quisiera confirmar el siguiente pedido a nombre de ${customerContactInfo.name}:\n${whatsAppLines.join('\n')}`;
      const text = encodeURIComponent(message);
      const phoneNumber = '5493425953685'; // Tu número de WhatsApp
      const url = `https://wa.me/${phoneNumber}?text=${text}`;

      window.open(url, '_blank');
      addStep("5. ¡Listo! Completa tu pedido por WhatsApp.");
      
      setIsOrderCompleted(true);
      clearCart();
      setCustomerContactInfo({ name: '' });

    } catch (err) {
      console.error("Error en el checkout:", err);
      const errorMessage = `Error al procesar el pedido: ${err.message}`;
      addStep(errorMessage, false);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cart-container">
      <h2>Tu Carrito</h2>
      {orderProcessingSteps.length > 0 && (
        <div className="order-status-stepper">
          <h4>Procesando tu Pedido:</h4>
          <ul>
            {orderProcessingSteps.map((step, index) => (
              <li key={index} className={step.isSuccess ? (index < currentStep -1 || (isOrderCompleted && index === orderProcessingSteps.length -1) ? 'completed' : (index === currentStep-1 ? 'processing' : 'pending')) : 'error-step'}>
                <span className="step-icon">
                  {step.isSuccess ? (index < currentStep -1 || (isOrderCompleted && index === orderProcessingSteps.length -1) ? '✅' : (index === currentStep-1 && isLoading ? '⏳' : '◻️')) : '❌'}
                </span>
                {step.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && !isOrderCompleted && <p className="error-message global-error">{error}</p>}

      {cartItems.length === 0 && !isOrderCompleted ? (
        <p className="empty-cart-message">Tu carrito está vacío.</p>
      ) : cartItems.length > 0 && !isOrderCompleted ? (
        <>
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.nombre}</span>
                  <span className="cart-item-price">${item.precio.toLocaleString('es-AR')}</span>
                  {item.stock !== undefined && <span className="cart-item-stock-indicator">(Disponible: {item.stock})</span>}
                </div>
                <div className="product-controls">
                  <button onClick={() => removeFromCart(item.id)} disabled={isLoading}>-</button>
                  <span className="product-quantity">{item.quantity}</span>
                  <button onClick={() => addToCart(item)} disabled={isLoading || (item.stock !== undefined && item.quantity >= item.stock)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="customer-details-form" style={{ marginTop: '20px', marginBottom: '20px'}}>
            <h3>Datos para el Pedido (WhatsApp)</h3>
            <div>
              <label htmlFor="customerName">Tu Nombre:</label>
              <input type="text" id="customerName" name="name" value={customerContactInfo.name} onChange={handleCustomerContactChange} required disabled={isLoading} />
            </div>
          </div>
          <div className="cart-summary">
            <h3>Total: ${calculateTotal().toLocaleString('es-AR')}</h3>
            <button onClick={handleCheckout} disabled={isLoading || cartItems.length === 0}>
              {isLoading ? 'Procesando Pedido...' : 'Finalizar y Enviar por WhatsApp'}
            </button>
            <button onClick={() => { 
                clearCart(); setCustomerContactInfo({ name: '' });
                setError(''); setOrderProcessingSteps([]); setCurrentStep(0); setIsOrderCompleted(false); setFinalOrderId(null);
              }} 
              disabled={isLoading || cartItems.length === 0} className="clear-cart-button">
              Vaciar Carrito
            </button>
          </div>
        </>
      ) : null}
      {isOrderCompleted && !error && <p className="order-final-success">¡Pedido #{finalOrderId} listo para enviar por WhatsApp! Serás redirigido.</p>}
    </div>
  );
}