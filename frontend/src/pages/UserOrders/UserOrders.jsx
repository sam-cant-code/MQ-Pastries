import React, { useState, useContext, useEffect, useCallback } from 'react';
import './UserOrders.css';
import { StoreContext } from '../../context/StoreContext.jsx';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserOrders = () => {
    const { url, token } = useContext(StoreContext);
    const [data, setData] = useState([]);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // (The rest of your component logic remains the same)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.post(url + "/api/order/userorders", {}, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            if (response.data.success) {
                setData(response.data.data || []);
            } else {
                throw new Error(response.data.message || "Failed to fetch orders.");
            }
            
        } catch (err) {
            console.error("Failed to fetch orders:", err);
            setError(err.response?.data?.message || "Failed to load orders. Please try again.");
            toast.error(err.response?.data?.message || "Could not load your orders.");
        } finally {
            setLoading(false);
        }
    }, [token, url]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const toggleOrderDetails = (orderId) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            newSet.has(orderId) ? newSet.delete(orderId) : newSet.add(orderId);
            return newSet;
        });
    };

    const formatOrderId = (orderId) => `#${orderId.slice(-8)}`;

    const formatItemNameWithVariation = (item) => {
        if (!item || !item.name) return 'Unknown item';
        if (item.variation && item.variation.toLowerCase() !== 'default' && item.variation.toLowerCase() !== 'regular') {
            return `${item.name} (${item.variation})`;
        }
        return item.name;
    };

    const formatItemsDisplay = (items) => {
        if (!Array.isArray(items) || items.length === 0) return "No items";
        return items.map(item => `${formatItemNameWithVariation(item)} × ${item.quantity || 1}`).join(', ');
    };

    const getStatusClass = (status) => {
        if (!status) return 'status-processing';
        const s = status.toLowerCase();
        if (s.includes('delivered')) return 'status-delivered';
        if (s.includes('cancelled')) return 'status-cancelled';
        return 'status-processing';
    };

    if (loading) {
        return (
            <div className="user-orders">
                <h2>My Orders</h2>
                <div className="container loading-state">
                    <div className="spinner"></div>
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-orders">
                <h2>My Orders</h2>
                <div className="container error-state">
                    <p>{error}</p>
                    <button onClick={fetchOrders} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-orders-page-wrapper">
            <div className="user-orders">
                <h2>My Orders</h2>
                <div className="container">
                    {data.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't placed any orders yet.</p>
                        </div>
                    ) : (
                        data.map((order) => (
                            <div key={order._id} className="order-card">
                                <div className="order-summary" onClick={() => toggleOrderDetails(order._id)}>
                                    <div className="order-main-info">
                                        <div className="info-block">
                                            <span className="label">Order ID</span>
                                            <span className="value order-id">{formatOrderId(order._id)}</span>
                                        </div>
                                        <div className="info-block">
                                            <span className="label">Date</span>
                                            <span className="value">{new Date(order.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="info-block">
                                            <span className="label">Status</span>
                                            <span className={`value order-status ${getStatusClass(order.status)}`}>{order.status}</span>
                                        </div>
                                        <div className="info-block">
                                            <span className="label">Amount</span>
                                            <span className="value order-amount">₹{order.amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="order-items-preview" title={formatItemsDisplay(order.items)}>
                                        {formatItemsDisplay(order.items)}
                                    </div>
                                    <button className="view-details-btn">
                                        {expandedOrders.has(order._id) ? '▲' : '▼'}
                                    </button>
                                </div>
                                
                                <div className={`order-details ${expandedOrders.has(order._id) ? 'show' : ''}`}>
                                    <h4>Order Items</h4>
                                    <ul>
                                        {order.items.map((item, idx) => (
                                            <li key={idx}>
                                                <span className="item-name">{formatItemNameWithVariation(item)}</span>
                                                <span className="item-quantity-price">
                                                    {item.quantity} × ₹{item.price.toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <h4>Delivery Address</h4>
                                    <div className="address-info">
                                        <p><strong>{order.address.firstName} {order.address.lastName}</strong></p>
                                        <p>{order.address.street},</p>
                                        <p>{order.address.city}, {order.address.state} - {order.address.zipcode}</p>
                                        <p>{order.address.country}</p>
                                        <p>Phone: {order.address.phone}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserOrders;
