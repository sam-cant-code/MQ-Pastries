import React, { useContext, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { validPincodes } from '../../data/pincodes.js';

const Checkout = () => {
  const navigate = useNavigate();
  
  // Use StoreContext to get cart and total functions
  const { getTotalCartAmount, token, pastery_list, cartItems, url } = useContext(StoreContext);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India", // Set default country to India
    phone: ""
  });

  const [errors, setErrors] = useState({});

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    
    // If state is changed, clear zipcode
    if (name === 'state') {
      setData(data => ({ ...data, [name]: value, zipcode: "" }));
      // Clear zipcode error when state changes
      if (errors.zipcode) {
        setErrors(errors => ({ ...errors, zipcode: "" }));
      }
    } else if (name === 'zipcode') {
      // Only allow numeric input for zipcode
      const numericValue = value.replace(/\D/g, '');
      setData(data => ({ ...data, [name]: numericValue }));
    } else {
      setData(data => ({ ...data, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(errors => ({ ...errors, [name]: "" }));
    }
  };

  // Validation functions
  const validateForm = () => {
    const newErrors = {};
    
    if (!data.firstName.trim()) newErrors.firstName = "First name is required";
    if (!data.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!data.street.trim()) newErrors.street = "Street address is required";
    if (!data.city.trim()) newErrors.city = "City is required";
    if (!data.state.trim()) {
      newErrors.state = "State is required";
    } else if (!validPincodes[data.state]) {
      newErrors.state = "Please select Tamil Nadu or Karnataka";
    }
    if (!data.zipcode.trim()) {
      newErrors.zipcode = "Pincode is required";
    } else {
      // Validate pincode length (Indian pincodes are 6 digits)
      if (data.zipcode.length !== 6) {
        newErrors.zipcode = "Pincode must be 6 digits";
      } else {
        // Validate pincode based on selected state
        const pincode = parseInt(data.zipcode);
        if (data.state && validPincodes[data.state]) {
          if (!validPincodes[data.state].includes(pincode)) {
            newErrors.zipcode = `Invalid pincode for ${data.state}. We don't deliver to this area yet.`;
          }
        }
      }
    }
    if (!data.country.trim()) newErrors.country = "Country is required";
    if (!data.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid (all fields filled)
  const isFormValid = () => {
    return data.firstName.trim() && 
           data.lastName.trim() && 
           data.email.trim() && 
           data.street.trim() && 
           data.city.trim() && 
           data.state.trim() && 
           data.zipcode.trim() && 
           data.country.trim() && 
           data.phone.trim();
  };

  const onCheckout = async(event) => {
    event.preventDefault();
    
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    
    try {
      let orderItems = [];
      
      // Debug: Log cart items to see what's in the cart
      console.log("Cart items:", cartItems);
      console.log("Pastery list:", pastery_list);
      console.log("Cart items keys:", Object.keys(cartItems));
      
      // Process cart items directly from cartItems object (like in Cart component)
      Object.entries(cartItems).forEach(([cartKey, quantity]) => {
        if (quantity > 0) {
          // Parse cart key to get item ID and variation
          const { itemId, variationKey } = parseCartKey(cartKey);
          
          // Find the item in pastery_list
          const item = pastery_list.find(item => item._id === itemId);
          
          if (item) {
            // Get the correct price for this variation
            const itemPrice = getVariationPrice(item, variationKey);
            
            // Ensure variation is never null/undefined (schema requires it)
            const variation = variationKey || 'default';
            
            let itemInfo = { 
              _id: item._id,
              name: item.name,
              description: item.description || '',
              image: item.image || '',
              category: item.category || '',
              quantity: quantity,
              price: itemPrice,        // Only send the variation price as required by schema
              variation: variation     // Ensure this is always a string as required by schema
            };
            orderItems.push(itemInfo);
          }
        }
      });
      
      // Debug: Check if orderItems is populated
      console.log("Order items after processing:", orderItems);
      
      // Check if cart is empty
      if(orderItems.length === 0) {
        alert("Your cart is empty. Please add items to your cart before checkout.");
        return;
      }
      
      // Validate order items before sending
      const isValidOrder = orderItems.every(item => 
        item._id && item.name && item.variation && item.price && item.quantity
      );

      if (!isValidOrder) {
        console.error("Invalid order items:", orderItems);
        alert("Some items in your cart are missing required information.");
        return;
      }
      
      let orderData = {
        address: data,
        items: orderItems,
        amount: getTotalCartAmount(),
        userId: token // Assuming token contains userId, adjust if needed
      }
      
      console.log("Order data being sent:", orderData);
      console.log("Order items structure:", orderItems);
      
      let response = await axios.post(url+"/api/order/place", orderData, {headers:{token}})
      
      console.log("Response received:", response.data);
      
      if(response.data.success){
        // Initialize Razorpay payment
        const options = {
          key: response.data.key_id,
          amount: response.data.amount,
          currency: response.data.currency,
          name: "MQ-Pastries",
          description: "Order Payment",
          order_id: response.data.order_id,
          handler: function (paymentResponse) {
            console.log("Payment successful:", paymentResponse);
            // Navigate to verify page with success parameters
            navigate(`/verify?success=true&orderId=${response.data.orderId}`);
          },
          prefill: {
            name: data.firstName + " " + data.lastName,
            email: data.email,
            contact: data.phone
          },
          theme: {
            color: "#3399cc"
          },
          modal: {
            ondismiss: function() {
              console.log("Payment cancelled by user");
              // Navigate to verify page with failure parameters
              navigate(`/verify?success=false&orderId=${response.data.orderId}`);
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
      else{
        console.error("Order failed:", response.data);
        alert("Error: " + (response.data.message || "Order placement failed"));
      }
    } catch (error) {
      console.error("Request failed:", error);
      alert("Network error: " + error.message);
    }
  }

  // FIXED: Helper function to get price for a specific variation
  const getVariationPrice = (item, variationKey) => {
    // Debug logging
    console.log("Getting price for item:", item.name, "variation:", variationKey);
    console.log("Item variations:", item.variations);
    console.log("Item base price:", item.price);
    
    // If no variation key, return base price
    if (!variationKey) {
      console.log("No variation key, returning base price:", item.price);
      return item.price || 0;
    }
    
    // If no variations object, return base price
    if (!item.variations) {
      console.log("No variations object, returning base price:", item.price);
      return item.price || 0;
    }
    
    // Try different variation key formats
    let variationPrice;
    
    // Try the variation key as-is
    variationPrice = item.variations[variationKey];
    console.log("Direct variation lookup:", variationPrice);
    
    // If not found, try URL decoded version
    if (variationPrice === undefined) {
      const decodedKey = decodeURIComponent(variationKey);
      variationPrice = item.variations[decodedKey];
      console.log("Decoded variation lookup:", decodedKey, "->", variationPrice);
    }
    
    // If still not found, try with different formats
    if (variationPrice === undefined) {
      // Try to find a key that contains the variation
      const matchingKey = Object.keys(item.variations).find(key => 
        key.includes(variationKey) || variationKey.includes(key)
      );
      if (matchingKey) {
        variationPrice = item.variations[matchingKey];
        console.log("Matching key found:", matchingKey, "->", variationPrice);
      }
    }
    
    // If variation price exists and is a valid number, return it
    if (variationPrice !== undefined && variationPrice !== null && !isNaN(variationPrice)) {
      console.log("Returning variation price:", variationPrice);
      return Number(variationPrice);
    }
    
    // Fallback to base price if variation price not found
    console.log("Variation price not found, returning base price:", item.price);
    return item.price || 0;
  };

  // Helper function to parse cart key and get variation info
  const parseCartKey = (cartKey) => {
    if (cartKey && cartKey.includes('_')) {
      const [itemId, ...variationParts] = cartKey.split('_');
      const variationKey = variationParts.join('_') || null; // Handle variations with underscores
      return { itemId, variationKey };
    }
    return { itemId: cartKey, variationKey: null };
  };

  // FIXED: Helper function to get cart items with variations for display
  const getCartItemsForDisplay = () => {
    const displayItems = [];
    
    Object.entries(cartItems).forEach(([cartKey, quantity]) => {
      if (quantity > 0) {
        const { itemId, variationKey } = parseCartKey(cartKey);
        const item = pastery_list.find(item => item._id === itemId);
        
        if (item) {
          const itemPrice = getVariationPrice(item, variationKey);
          
          // Debug logging for each item
          console.log(`Item: ${item.name}, Variation: ${variationKey}, Price: ${itemPrice}, Quantity: ${quantity}`);
          
          displayItems.push({
            ...item,
            quantity: quantity,
            selectedVariation: variationKey,
            displayPrice: itemPrice, // Use the correctly calculated price
            cartKey: cartKey,
            totalPrice: itemPrice * quantity // Calculate total for this item
          });
        }
      }
    });
    
    return displayItems;
  };

  // FIXED: Calculate subtotal using the SAME logic as StoreContext
  const calculateSubtotal = () => {
    let total = 0;
    
    Object.entries(cartItems).forEach(([cartKey, quantity]) => {
      if (quantity > 0) {
        const { itemId, variationKey } = parseCartKey(cartKey);
        const item = pastery_list.find(item => item._id === itemId);
        
        if (item) {
          const itemPrice = getVariationPrice(item, variationKey);
          total += itemPrice * quantity;
          console.log(`Subtotal calc - Item: ${item.name}, Variation: ${variationKey}, Price: ${itemPrice}, Quantity: ${quantity}, Item Total: ${itemPrice * quantity}`);
        }
      }
    });
    
    console.log("Final calculated subtotal:", total);
    console.log("Context getTotalCartAmount():", getTotalCartAmount());
    
    return total;
  };

  const subtotal = getTotalCartAmount(); // Use the context total which is correct
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="checkout-container">
      {/* Navigation button */}
      <div className="checkout-navigation">
        <button 
          className="back-btn" 
          onClick={() => navigate('/cart')}
        >
          ← Back to Cart
        </button>
      </div>

      <div className="checkout-content">
        <div className="checkout-left">
          <h2>Delivery Information</h2>
          
          {/* Free Shipping Notice */}
          <div className="shipping-notice">
            <div className="shipping-icon">🚚</div>
            <div className="shipping-text">
              We currently deliver only to <strong>Karnataka</strong> and <strong>Tamil Nadu</strong> <br />
              Enjoy free shipping on all orders!
            </div>
          </div>
          
          <form className="delivery-form">
            <div className="form-row">
              <div className="form-field">
                <input 
                  name="firstName" 
                  type="text" 
                  onChange={onChangeHandler} 
                  value={data.firstName} 
                  placeholder="First name" 
                  className={errors.firstName ? 'error' : ''}
                  required
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="form-field">
                <input 
                  name="lastName" 
                  type="text" 
                  onChange={onChangeHandler} 
                  value={data.lastName} 
                  placeholder="Last name" 
                  className={errors.lastName ? 'error' : ''}
                  required
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>
            <div className="form-field">
              <input 
                name="email" 
                type="email" 
                onChange={onChangeHandler} 
                value={data.email} 
                placeholder="Email address" 
                className={errors.email ? 'error' : ''}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-field">
              <input 
                name="street" 
                type="text" 
                onChange={onChangeHandler} 
                value={data.street} 
                placeholder="Street" 
                className={errors.street ? 'error' : ''}
                required
              />
              {errors.street && <span className="error-message">{errors.street}</span>}
            </div>
            <div className="form-row">
              <div className="form-field">
                <input 
                  name="city" 
                  type="text" 
                  onChange={onChangeHandler} 
                  value={data.city} 
                  placeholder="City" 
                  className={errors.city ? 'error' : ''}
                  required
                />
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>
              <div className="form-field">
                <select 
                  name="state" 
                  onChange={onChangeHandler} 
                  value={data.state} 
                  className={errors.state ? 'error' : ''}
                  required
                >
                  <option value="">Select State</option>
                  {Object.keys(validPincodes).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <span className="error-message">{errors.state}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <input 
                  name="zipcode" 
                  type="text" 
                  onChange={onChangeHandler} 
                  value={data.zipcode} 
                  placeholder="Enter 6-digit pincode"
                  className={errors.zipcode ? 'error' : ''}
                  maxLength={6}
                  pattern="\d{6}"
                  required
                />
                {errors.zipcode && <span className="error-message">{errors.zipcode}</span>}
                {!errors.zipcode && data.state && data.zipcode.length === 6 && (
                  <span className="info-message">
                    {validPincodes[data.state]?.includes(parseInt(data.zipcode)) 
                      ? "✓ Delivery available" 
                      : "⚠ We don't deliver to this pincode yet"}
                  </span>
                )}
              </div>
              <div className="form-field">
                <input 
                  name="country" 
                  type="text" 
                  onChange={onChangeHandler} 
                  value={data.country} 
                  placeholder="Country" 
                  className={errors.country ? 'error' : ''}
                  readOnly
                  required
                />
                {errors.country && <span className="error-message">{errors.country}</span>}
              </div>
            </div>
            <div className="form-field">
              <input 
                name="phone" 
                type="tel" 
                onChange={onChangeHandler} 
                value={data.phone} 
                placeholder="Phone" 
                className={errors.phone ? 'error' : ''}
                required
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </form>
        </div>

        <div className="checkout-right">
          <h2>Invoice</h2>
          
          {/* Bill-style Order Summary */}
          <div className="cart-items-summary">
            <h3>Order Details</h3>
            
            {/* Bill header */}
            <div className="bill-header">
              <span>Item</span>
              <span>Price</span>
              <span>Qty</span>
              <span>Total</span>
            </div>
            
            {/* Bill items */}
            {getCartItemsForDisplay().map((item, index) => (
              <div key={index} className="cart-item-row">
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  {item.selectedVariation && (
                    <div className="variation-info">({decodeURIComponent(item.selectedVariation)})</div>
                  )}
                </div>
                <div className="unit-price">₹{item.displayPrice.toFixed(2)}</div>
                <div className="quantity">{item.quantity}</div>
                <div className="total-price">₹{(item.displayPrice * item.quantity).toFixed(2)}</div>
                
                {/* Mobile layout */}
                <div className="mobile-row">
                  <span>₹{item.displayPrice.toFixed(2)} × {item.quantity}</span>
                  <span>₹{(item.displayPrice * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bill totals */}
          <div className="bill-totals">
            <div className="cart-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-total-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="shipping-info">
              <small>✓ Inaugural offer: Free shipping within Karnataka & Tamil Nadu</small>
            </div>
            <div className="cart-total-row total">
              <span>Total Amount</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Payment button */}
          <button 
            onClick={onCheckout} 
            className={`checkout-btn ${!isFormValid() ? 'disabled' : ''}`}
            disabled={!isFormValid()}
          >
            {!isFormValid() ? 'Fill Required Fields to Proceed ' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;