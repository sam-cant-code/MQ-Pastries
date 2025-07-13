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

  const handleRemoveFromCart = (cartKey, itemName, variationKey) => {
    removeFromCart(cartKey.includes('_') ? cartKey.split('_')[0] : cartKey, variationKey);
    const variationLabel = variationKey ? ` (${variationKey})` : '';
    showToast(`${itemName}${variationLabel} removed from cart!`, 'info');
  };

  const handleAddToCart = (cartKey, itemName, variationKey) => {
    addToCart(cartKey.includes('_') ? cartKey.split('_')[0] : cartKey, variationKey);
    const variationLabel = variationKey ? ` (${variationKey})` : '';
    showToast(`${itemName}${variationLabel} added to cart!`, 'success');
  };

  const handleDecreaseQuantity = (cartKey, itemName, variationKey) => {
    decreaseQuantity(cartKey.includes('_') ? cartKey.split('_')[0] : cartKey, variationKey);
    const variationLabel = variationKey ? ` (${variationKey})` : '';
    showToast(`Decreased quantity of ${itemName}${variationLabel}`, 'info');
  };

  // Helper function to get price for a specific variation
  const getVariationPrice = (item, variationKey) => {
    if (item.variations && variationKey && item.variations[variationKey] !== undefined) {
      return item.variations[variationKey];
    }
    return item.price || 0;
  };

  // Helper function to parse cart key and get variation info
  const parseCartKey = (cartKey) => {
    if (cartKey.includes('_')) {
      const [itemId, variationKey] = cartKey.split('_');
      return { itemId, variationKey };
    }
    return { itemId: cartKey, variationKey: null };
  };

  // Get all cart items with their variations
  const getCartItemsWithVariations = () => {
    const cartItemsArray = [];
    
    Object.entries(cartItems).forEach(([cartKey, quantity]) => {
      if (quantity > 0) {
        const { itemId, variationKey } = parseCartKey(cartKey);
        const item = pastery_list.find(item => item._id === itemId);
        
        if (item) {
          cartItemsArray.push({
            ...item,
            cartKey,
            quantity,
            variationKey,
            currentPrice: getVariationPrice(item, variationKey)
          });
        }
      }
    });
    
    return cartItemsArray;
  };

  const cartItemsWithVariations = getCartItemsWithVariations();
  const isCartEmpty = cartItemsWithVariations.length === 0;

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
            cartItemsWithVariations.map((cartItem, index) => {
              const imgSrc = cartItem.image
                ? cartItem.image.startsWith('http')
                  ? cartItem.image
                  : `${url}/images/${cartItem.image.replace(/^\/+/, '')}`
                : '';

              return (
                <div key={`${cartItem.cartKey}-${index}`} className="cart-item-row">
                  <div className="item-content">
                    <div className="item-image">
                      <img src={imgSrc} alt={cartItem.name} />
                    </div>
                    <div className="item-details">
                      <div className="item-title">{cartItem.name}</div>
                      <div className="item-subtitle">
                        {cartItem.category || "Regular"} | {cartItem.description || "New Hand Tossed"}
                        {cartItem.variationKey && (
                          <span className="variation-label"> | {cartItem.variationKey}</span>
                        )}
                      </div>
                      <div className="item-controls">
                        <div className="quantity-price-section">
                          <div className="quantity-toggle">
                            <button
                              className="qty-btn"
                              onClick={() => handleDecreaseQuantity(cartItem.cartKey, cartItem.name, cartItem.variationKey)}
                            >
                              −
                            </button>
                            <span>{cartItem.quantity}</span>
                            <button
                              className="qty-btn"
                              onClick={() => handleAddToCart(cartItem.cartKey, cartItem.name, cartItem.variationKey)}
                            >
                              +
                            </button>
                          </div>
                          <div className="price-section">
                            <div className="item-total">₹{cartItem.currentPrice * cartItem.quantity}</div>
                            {cartItem.variationKey && (
                              <div className="item-unit-price">₹{cartItem.currentPrice} each</div>
                            )}
                          </div>
                        </div>
                        <div className="item-remove">
                          <button
                            onClick={() => handleRemoveFromCart(cartItem.cartKey, cartItem.name, cartItem.variationKey)}
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