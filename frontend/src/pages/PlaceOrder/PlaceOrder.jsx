import React, { useContext, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const navigate = useNavigate();
  
  // Use StoreContext to get cart and total functions
  const { getTotalCartAmount, token, pastery_list, cartItems, url } = useContext(StoreContext);

  const onCheckout = async(event) =>{
    event.preventDefault();
    
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

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: ""
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }));
  };

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
          <form className="delivery-form">
            <div className="form-row">
              <input 
                name="firstName" 
                type="text" 
                onChange={onChangeHandler} 
                value={data.firstName} 
                placeholder="First name" 
                required
              />
              <input 
                name="lastName" 
                type="text" 
                onChange={onChangeHandler} 
                value={data.lastName} 
                placeholder="Last name" 
                required
              />
            </div>
            <input 
              name="email" 
              type="email" 
              onChange={onChangeHandler} 
              value={data.email} 
              placeholder="Email address" 
              required
            />
            <input 
              name="street" 
              type="text" 
              onChange={onChangeHandler} 
              value={data.street} 
              placeholder="Street" 
              required
            />
            <div className="form-row">
              <input 
                name="city" 
                type="text" 
                onChange={onChangeHandler} 
                value={data.city} 
                placeholder="City" 
                required
              />
              <input 
                name="state" 
                type="text" 
                onChange={onChangeHandler} 
                value={data.state} 
                placeholder="State" 
                required
              />
            </div>
            <div className="form-row">
              <input 
                name="zipcode" 
                type="text" 
                onChange={onChangeHandler} 
                value={data.zipcode} 
                placeholder="Zip code" 
                required
              />
              <input 
                name="country" 
                type="text" 
                onChange={onChangeHandler} 
                value={data.country} 
                placeholder="Country" 
                required
              />
            </div>
            <input 
              name="phone" 
              type="tel" 
              onChange={onChangeHandler} 
              value={data.phone} 
              placeholder="Phone" 
              required
            />
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
            <div className="cart-total-row total">
              <span>Total Amount</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          
         
          
          {/* Payment button */}
          <button onClick={onCheckout} className="checkout-btn">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;