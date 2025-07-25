// src/pages/Verify/Verify.jsx
import React, { useContext, useEffect, useState } from 'react';
import './Verify.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Verify = () => {
    const [searchParams] = useSearchParams();
    // ✅ CHANGED: Get all required parameters from the URL
    const orderId = searchParams.get("orderId");
    const razorpay_payment_id = searchParams.get("razorpay_payment_id");
    const razorpay_order_id = searchParams.get("razorpay_order_id");
    const razorpay_signature = searchParams.get("razorpay_signature");
    
    // ✅ CHANGED: Get the token to authorize the request
    const { url, token } = useContext(StoreContext);
    const navigate = useNavigate();

    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            // ✅ CHANGED: Call the new, secure backend endpoint
            try {
                const response = await axios.post(
                    `${url}/api/order/verify-payment?orderId=${orderId}`, 
                    { razorpay_payment_id, razorpay_order_id, razorpay_signature },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (response.data.success) {
                    setVerificationStatus('success');
                    setTimeout(() => {
                        navigate("/myorders");
                    }, 4000);
                } else {
                    setVerificationStatus('failure');
                    setError(response.data.message || 'Payment verification failed.');
                    setTimeout(() => {
                        navigate("/");
                    }, 4000);
                }
            } catch (err) {
                setVerificationStatus('failure');
                setError(err.response?.data?.message || 'An error occurred during verification.');
                console.error("Verification API call failed:", err);
                setTimeout(() => {
                    navigate("/");
                }, 4000);
            }
        };

        if (token && orderId && razorpay_payment_id && razorpay_order_id && razorpay_signature) {
            verifyPayment();
        } else {
            setError("Missing verification details. Navigating home.");
            setTimeout(() => navigate("/"), 3000);
        }
        // ✅ CHANGED: Added token and other params to the dependency array
    }, [token, orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature, url, navigate]);

    return (
        <div className="verify-container">
            {verificationStatus === 'verifying' && (
                <div className="verification-box">
                    <div className="spinner"></div>
                    <h2>Verifying Payment...</h2>
                    <p>Please wait, we are confirming your transaction.</p>
                </div>
            )}
            {verificationStatus === 'success' && (
                <div className="verification-box success">
                    <div className="icon">✅</div>
                    <h2>Payment Successful!</h2>
                    <p>Your order has been placed. Thank you for your purchase!</p>
                    <p>You will be redirected to your orders page shortly.</p>
                </div>
            )}
            {verificationStatus === 'failure' && (
                <div className="verification-box failure">
                    <div className="icon">❌</div>
                    <h2>Payment Failed</h2>
                    <p>{error || "There was an issue with your payment."}</p>
                    <p>You will be redirected to the homepage.</p>
                </div>
            )}
        </div>
    );
};

export default Verify;