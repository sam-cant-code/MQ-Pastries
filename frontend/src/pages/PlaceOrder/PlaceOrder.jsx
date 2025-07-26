import React, { useContext, useState, useEffect } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { validPincodes } from '../../data/pincodes.js';

const Checkout = () => {
    const navigate = useNavigate();
    const { getTotalCartAmount, token, pastery_list, cartItems, url, clearCart } = useContext(StoreContext);

    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "India",
        phone: ""
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!token) {
            toast.info("Please log in to place an order.");
            navigate('/cart');
        } else if (getTotalCartAmount() === 0) {
            toast.info("Your cart is empty.");
            navigate('/');
        }
    }, [token, getTotalCartAmount, navigate]);

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        
        if (name === 'state') {
            setData(data => ({ ...data, [name]: value, zipcode: "" }));
            if (errors.zipcode) setErrors(errors => ({ ...errors, zipcode: "" }));
        } else if (name === 'zipcode') {
            setData(data => ({ ...data, [name]: value.replace(/\D/g, '') }));
        } else {
            setData(data => ({ ...data, [name]: value }));
        }
        
        if (errors[name]) {
            setErrors(errors => ({ ...errors, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!data.firstName.trim()) newErrors.firstName = "First name is required";
        if (!data.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!data.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Please enter a valid email";
        if (!data.street.trim()) newErrors.street = "Street address is required";
        if (!data.city.trim()) newErrors.city = "City is required";
        if (!data.state.trim()) newErrors.state = "State is required";
        if (!data.zipcode.trim()) newErrors.zipcode = "Pincode is required";
        else if (data.zipcode.length !== 6) newErrors.zipcode = "Pincode must be 6 digits";
        else if (data.state && validPincodes[data.state] && !validPincodes[data.state].includes(parseInt(data.zipcode))) {
            newErrors.zipcode = `Sorry, we don't deliver to this pincode yet.`;
        }
        if (!data.phone.trim()) newErrors.phone = "Phone number is required";
        else if (!/^\+?[\d\s\-()]{10,}$/.test(data.phone)) newErrors.phone = "Please enter a valid phone number";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        return Object.values(data).every(field => field.trim() !== "");
    };

    const onCheckout = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }
        
        let orderItems = [];
        Object.entries(cartItems).forEach(([cartKey, quantity]) => {
            if (quantity > 0) {
                const { itemId, variationKey } = parseCartKey(cartKey);
                const item = pastery_list.find(p => p._id === itemId);
                if (item) {
                    const itemPrice = getVariationPrice(item, variationKey);
                    orderItems.push({ 
                        _id: item._id,
                        name: item.name,
                        description: item.description || '',
                        image: item.image || '',
                        category: item.category || '',
                        quantity: quantity,
                        price: itemPrice,
                        variation: variationKey || 'default'
                    });
                }
            }
        });

        if (orderItems.length === 0) {
            toast.error("Your cart is empty.");
            return;
        }

        const orderData = {
            address: data,
            items: orderItems,
            amount: getTotalCartAmount(),
        };
        
        try {
            const response = await axios.post(url + "/api/order/place", orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const { order_id, key_id, amount, currency, orderId } = response.data;
                const options = {
                    key: key_id,
                    amount: amount,
                    currency: currency,
                    name: "MQ-Pastries",
                    description: "Order Payment",
                    order_id: order_id,
                    handler: function (paymentResponse) {
                        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
                        navigate(`/verify?orderId=${orderId}&razorpay_payment_id=${razorpay_payment_id}&razorpay_order_id=${razorpay_order_id}&razorpay_signature=${razorpay_signature}`);
                    },
                    prefill: {
                        name: `${data.firstName} ${data.lastName}`,
                        email: data.email,
                        contact: data.phone
                    },
                    theme: { color: "#4a90e2" },
                    modal: {
                        ondismiss: function() {
                            toast.error("Payment cancelled. Please try again.");
                            navigate('/cart');
                        }
                    }
                };
                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                toast.error(response.data.message || "Order placement failed. Please try again.");
            }
        } catch (error) {
            console.error("Checkout request failed:", error);
            toast.error(error.response?.data?.message || "A network error occurred. Please try again.");
        }
    };

    // ✅ FIXED: Correctly decodes the variation key to prevent price errors
    const parseCartKey = (cartKey) => {
        if (cartKey && cartKey.includes('_')) {
            const parts = cartKey.split('_');
            const itemId = parts[0];
            const encodedVariation = parts.slice(1).join('_');
            try {
                // Decoding is crucial for matching with the item's variation object
                const variationKey = decodeURIComponent(encodedVariation);
                return { itemId, variationKey };
            } catch (e) {
                console.error("Failed to decode variation key", e);
                return { itemId, variationKey: encodedVariation }; // Fallback
            }
        }
        return { itemId: cartKey, variationKey: null };
    };

    const getVariationPrice = (item, variationKey) => {
        if (variationKey && item.variations && item.variations[variationKey]) {
            return Number(item.variations[variationKey]);
        }
        return item.price || 0;
    };

    const getCartItemsForDisplay = () => {
        return Object.entries(cartItems).map(([cartKey, quantity]) => {
            if (quantity > 0) {
                const { itemId, variationKey } = parseCartKey(cartKey);
                const item = pastery_list.find(p => p._id === itemId);
                if (item) {
                    const displayPrice = getVariationPrice(item, variationKey);
                    return {
                        ...item,
                        quantity,
                        selectedVariation: variationKey,
                        displayPrice,
                        totalPrice: displayPrice * quantity
                    };
                }
            }
            return null;
        }).filter(Boolean);
    };

    const subtotal = getTotalCartAmount();
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;

    return (
        <div className="checkout-container">
            <div className="checkout-navigation">
                <button className="back-btn" onClick={() => navigate('/cart')}>← Back to Cart</button>
            </div>
            <div className="checkout-content">
                <div className="checkout-left">
                    <h2>Delivery Information</h2>
                    <div className="shipping-notice">
                        <div className="shipping-icon">🚚</div>
                        <div className="shipping-text">
                            We currently deliver only to <strong>Karnataka</strong> and <strong>Tamil Nadu</strong>.
                            <br />Enjoy free shipping on all orders!
                        </div>
                    </div>
                    <form className="delivery-form" onSubmit={onCheckout}>
                        <div className="form-row">
                            <div className="form-field">
                                <input name="firstName" type="text" onChange={onChangeHandler} value={data.firstName} placeholder="First name" className={errors.firstName ? 'error' : ''} required />
                                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                            </div>
                            <div className="form-field">
                                <input name="lastName" type="text" onChange={onChangeHandler} value={data.lastName} placeholder="Last name" className={errors.lastName ? 'error' : ''} required />
                                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                            </div>
                        </div>
                        <div className="form-field">
                            <input name="email" type="email" onChange={onChangeHandler} value={data.email} placeholder="Email address" className={errors.email ? 'error' : ''} required />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>
                        <div className="form-field">
                            <input name="street" type="text" onChange={onChangeHandler} value={data.street} placeholder="Street" className={errors.street ? 'error' : ''} required />
                            {errors.street && <span className="error-message">{errors.street}</span>}
                        </div>
                        <div className="form-row">
                            <div className="form-field">
                                <input name="city" type="text" onChange={onChangeHandler} value={data.city} placeholder="City" className={errors.city ? 'error' : ''} required />
                                {errors.city && <span className="error-message">{errors.city}</span>}
                            </div>
                            <div className="form-field">
                                <select name="state" onChange={onChangeHandler} value={data.state} className={errors.state ? 'error' : ''} required>
                                    <option value="">Select State</option>
                                    {Object.keys(validPincodes).map(state => (<option key={state} value={state}>{state}</option>))}
                                </select>
                                {errors.state && <span className="error-message">{errors.state}</span>}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-field">
                                <input name="zipcode" type="text" onChange={onChangeHandler} value={data.zipcode} placeholder="Enter 6-digit pincode" className={errors.zipcode ? 'error' : ''} maxLength={6} required />
                                {errors.zipcode && <span className="error-message">{errors.zipcode}</span>}
                            </div>
                            <div className="form-field">
                                <input name="country" type="text" value={data.country} placeholder="Country" readOnly required />
                            </div>
                        </div>
                        <div className="form-field">
                            <input name="phone" type="tel" onChange={onChangeHandler} value={data.phone} placeholder="Phone" className={errors.phone ? 'error' : ''} required />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>
                    </form>
                </div>
                <div className="checkout-right">
                    <h2>Invoice</h2>
                    <div className="cart-items-summary">
                        <h3>Order Details</h3>
                        <div className="bill-header">
                            <span>Item</span>
                            <span>Price</span>
                            <span>Qty</span>
                            <span>Total</span>
                        </div>
                        {getCartItemsForDisplay().map((item, index) => (
                            // ✅ FIXED: Invoice row now displays all data correctly
                            <div key={index} className="cart-item-row">
                                <div className="item-details">
                                    <div className="item-name">{item.name}</div>
                                    {item.selectedVariation && (<div className="variation-info">{item.selectedVariation}</div>)}
                                </div>
                                <div className="unit-price">₹{item.displayPrice.toFixed(2)}</div>
                                <div className="quantity">{item.quantity}</div>
                                <div className="total-price">₹{item.totalPrice.toFixed(2)}</div>
                                
                                {/* Mobile view row */}
                                <div className="mobile-row">
                                    <span>{item.name} {item.selectedVariation && `(${item.selectedVariation})`}</span>
                                    <span>₹{item.displayPrice.toFixed(2)} × {item.quantity} = <strong>₹{item.totalPrice.toFixed(2)}</strong></span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bill-totals">
                        <div className="cart-total-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="cart-total-row"><span>Delivery Fee</span><span>₹{deliveryFee.toFixed(2)}</span></div>
                        <div className="cart-total-row total"><span>Total Amount</span><span>₹{total.toFixed(2)}</span></div>
                    </div>
                    <button onClick={onCheckout} className={`checkout-btn ${!isFormValid() ? 'disabled' : ''}`} disabled={!isFormValid()}>
                        {!isFormValid() ? 'Fill Required Fields' : 'Proceed to Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default Checkout;