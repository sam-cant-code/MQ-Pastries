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
      
      // Process cart items with variations
      pastery_list.map((item)=>{
        // Check if item has variations
        if(item.variations && typeof item.variations === 'object') {
          // Handle variations - cartItems should store variation info
          Object.keys(item.variations).forEach(variation => {
            const cartKey = `${item._id}_${variation}`;
            if(cartItems[cartKey] && cartItems[cartKey] > 0) {
              let itemInfo = { 
                ...item, 
                quantity: cartItems[cartKey],
                selectedVariation: variation,
                variationPrice: item.variations[variation],
                // Use variation price instead of base price
                price: item.variations[variation]
              };
              orderItems.push(itemInfo);
            }
          });
        } else {
          // Handle items without variations (legacy support)
          if(cartItems[item._id] && cartItems[item._id] > 0) {
            let itemInfo = { 
              ...item, 
              quantity: cartItems[item._id],
              selectedVariation: null,
              variationPrice: item.price
            };
            orderItems.push(itemInfo);
          }
        }
      });
      
      let orderData = {
        address: data,
        items: orderItems,
        amount: getTotalCartAmount(),
        userId: token // Assuming token contains userId, adjust if needed
      }
      
      console.log("Order data being sent:", orderData);
      
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

  // Helper function to get cart items with variations for display
  const getCartItemsForDisplay = () => {
    const displayItems = [];
    
    pastery_list.forEach((item) => {
      if(item.variations && typeof item.variations === 'object') {
        // Handle variations
        Object.keys(item.variations).forEach(variation => {
          const cartKey = `${item._id}_${variation}`;
          if(cartItems[cartKey] && cartItems[cartKey] > 0) {
            displayItems.push({
              ...item,
              quantity: cartItems[cartKey],
              selectedVariation: variation,
              displayPrice: item.variations[variation],
              cartKey: cartKey
            });
          }
        });
      } else {
        // Handle items without variations
        if(cartItems[item._id] && cartItems[item._id] > 0) {
          displayItems.push({
            ...item,
            quantity: cartItems[item._id],
            selectedVariation: null,
            displayPrice: item.price,
            cartKey: item._id
          });
        }
      }
    });
    
    return displayItems;
  };

  const subtotal = getTotalCartAmount();
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
                    <div className="variation-info">({item.selectedVariation})</div>
                  )}
                </div>
                <div className="unit-price">₹{item.displayPrice}</div>
                <div className="quantity">{item.quantity}</div>
                <div className="total-price">₹{item.displayPrice * item.quantity}</div>
                
                {/* Mobile layout */}
                <div className="mobile-row">
                  <span>₹{item.displayPrice} × {item.quantity}</span>
                  <span>₹{item.displayPrice * item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bill totals */}
          <div className="bill-totals">
            <div className="cart-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="cart-total-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
            <div className="cart-total-row total">
              <span>Total Amount</span>
              <span>₹{total}</span>
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
