import React, { useContext, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Add this import

const Checkout = () => {
  const navigate = useNavigate();
  
  // Use StoreContext to get cart and total functions
  const { getTotalCartAmount, token, pastery_list, cartItems, url } = useContext(StoreContext);

  const onCheckout = async(event) =>{
    event.preventDefault();
    
    try {
      let orderItems = [];
      pastery_list.map((item)=>{
        if(cartItems[item._id]>0){
          let itemInfo = { ...item, quantity: cartItems[item._id] }; // avoid mutating original item
          orderItems.push(itemInfo);
        }
      })
      
      let orderData = {
        address: data,
        items: orderItems,
        amount: getTotalCartAmount(),
        userId: token // Assuming token contains userId, adjust if needed
      }
      
      console.log("Order data being sent:", orderData);
      console.log("Token:", token);
      console.log("URL:", url);
      
      let response = await axios.post(url+"/api/order/place", orderData, {headers:{token}})
      
      console.log("Response received:", response.data);
      
      if(response.data.success){
        // Initialize Razorpay payment
        const options = {
          key: response.data.key_id,
          amount: response.data.amount,
          currency: response.data.currency,
          name: "Your Pastry Shop",
          description: "Order Payment",
          order_id: response.data.order_id,
          handler: function (paymentResponse) {
            // Verify payment on backend
            verifyPayment(paymentResponse, response.data.orderId);
          },
          prefill: {
            name: data.firstName + " " + data.lastName,
            email: data.email,
            contact: data.phone
          },
          theme: {
            color: "#3399cc"
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

  const verifyPayment = async (paymentResponse, orderId) => {
    try {
      const verifyData = {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        orderId: orderId
      };
      
      const response = await axios.post(url + "/api/order/verify", verifyData, {headers: {token}});
      
      if (response.data.success) {
        alert("Payment successful!");
        navigate("/orders"); // Navigate to orders page or wherever you want
      } else {
        alert("Payment verification failed!");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      alert("Payment verification failed!");
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
          <h2>Cart Totals</h2>
          <div className="cart-total-row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="cart-total-row">
            <span>Delivery Fee</span>
            <span>₹{deliveryFee}</span>
          </div>
          <div className="cart-total-row total">
            <strong>Total</strong>
            <strong>₹{total}</strong>
          </div>
          
          {/* Payment button moved here */}
          <button onClick={onCheckout} className="checkout-btn">
            PROCEED TO PAYMENT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
