import React, { useContext, useEffect, useState } from 'react';
import './Cart.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const {
    cartItems,
    pastery_list,
    removeFromCart,
    getTotalCartAmount,
    addToCart,
    decreaseQuantity,
    url
  } = useContext(StoreContext);

  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []);

  // Toast logic
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, isVisible: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(toast =>
        toast.id === id ? { ...toast, isVisible: true } : toast
      ));
    }, 100);
    setTimeout(() => {
      setToasts(prev => prev.map(toast =>
        toast.id === id ? { ...toast, isVisible: false } : toast
      ));
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 300);
    }, 2500);
  };

  if (!pastery_list || !Array.isArray(pastery_list)) {
    return <div className="loading">Loading...</div>;
  }

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleRemoveFromCart = (id, name) => {
    removeFromCart(id);
    showToast(`${name} removed from cart!`, 'info');
  };

  const handleAddToCart = (id, name) => {
    addToCart(id);
    showToast(`${name} added to cart!`, 'success');
  };

  const handleDecreaseQuantity = (id, name) => {
    decreaseQuantity(id);
    showToast(`Decreased quantity of ${name}`, 'info');
  };

  const isCartEmpty = Object.keys(cartItems).length === 0 ||
    Object.values(cartItems).every(quantity => quantity === 0);

  return (
    <div className="cart">
      {/* Toasts */}
      <div className="toast-container-bottom">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast-bottom toast-${toast.type} ${toast.isVisible ? 'toast-visible' : ''}`}
          >
            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-container">
        <div className="cart-items-section">
          {isCartEmpty ? (
            <div className="empty-cart-message">
              <p>Your cart is empty</p>
              <button onClick={handleContinueShopping} className="continue-shopping-btn">
                Start Shopping
              </button>
            </div>
          ) : (
            pastery_list.map((item, index) => {
              if (cartItems[item._id] > 0) {
                const imgSrc = item.image
                  ? item.image.startsWith('http')
                    ? item.image
                    : `${url}/images/${item.image.replace(/^\/+/, '')}`
                  : '';
                return (
                  <div key={index} className="cart-item-row">
                    <div className="item-content">
                      <div className="item-image">
                        <img src={imgSrc} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <div className="item-title">{item.name}</div>
                        <div className="item-subtitle">
                          {item.category || "Regular"} | {item.description || "New Hand Tossed"}
                        </div>
                        <div className="item-controls">
                          <div className="quantity-price-section">
                            <div className="quantity-toggle">
                              <button
                                className="qty-btn"
                                onClick={() => handleDecreaseQuantity(item._id, item.name)}
                              >
                                −
                              </button>
                              <span>{cartItems[item._id]}</span>
                              <button
                                className="qty-btn"
                                onClick={() => handleAddToCart(item._id, item.name)}
                              >
                                +
                              </button>
                            </div>
                            <div className="price-section">
                              <div className="item-total">₹{item.price * cartItems[item._id]}</div>
                            </div>
                          </div>
                          <div className="item-remove">
                            <button
                              onClick={() => handleRemoveFromCart(item._id, item.name)}
                              className="remove-btn"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
        {!isCartEmpty && (
          <div className="cart-summary-section">
            <div className="cart-totals">
              <h2>Cart Totals</h2>
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{getTotalCartAmount()}</span>
              </div>
              <div className="total-row">
                <span>Delivery Fee</span>
                <span>₹{getTotalCartAmount() === 0 ? 0 : 50}</span>
              </div>
              <div className="total-row total-final">
                <strong>Total</strong>
                <strong>
                  ₹{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 50}
                </strong>
              </div>
            </div>
            <div className="action-buttons">
              <button
                onClick={handleContinueShopping}
                className="continue-shopping-btn"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/order')}
                className="checkout-btn"
                disabled={getTotalCartAmount() === 0}
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;