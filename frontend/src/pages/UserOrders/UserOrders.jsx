import React, { useState, useContext, useEffect } from 'react';
import './UserOrders.css';
import { StoreContext } from '../../context/StoreContext.jsx';
import axios from 'axios';

const UserOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const fetchOrders = async () => {
    try {
      const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
      setData(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const toggleOrderDetails = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatItemsDisplay = (items) => {
    const itemTexts = items.map(item => `${item.name}×${item.quantity}`);
    const fullText = itemTexts.join(', ');
    
    if (fullText.length > 50) {
      let truncated = '';
      for (let i = 0; i < itemTexts.length; i++) {
        const nextText = truncated ? `${truncated}, ${itemTexts[i]}` : itemTexts[i];
        if (nextText.length > 47) {
          break;
        }
        truncated = nextText;
      }
      return truncated + '...';
    }
    
    return fullText;
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-processing';
    }
  };

  return (
    <div className="user-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          data.map((order) => (
            <div key={order._id} className="my-orders-orders">
              <div className="order-summary">
                <div className="order-main-info">
                  <div className="order-info-item">
                    <span className="label">Order ID</span>
                    <span className="value order-id">{order._id}</span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Date</span>
                    <span className="value">{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Status</span>
                    <span className={`value order-status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Payment</span>
                    <span className={`value ${order.payment ? 'payment-paid' : 'payment-pending'}`}>
                      {order.payment ? "Paid" : "Pending"}
                    </span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Amount</span>
                    <span className="value order-amount">₹{order.amount}</span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Items</span>
                    <span className="value items-display" title={order.items.map(item => `${item.name}×${item.quantity}`).join(', ')}>
                      {formatItemsDisplay(order.items)}
                    </span>
                  </div>
                </div>
                
                <button 
                  className="view-details-btn"
                  onClick={() => toggleOrderDetails(order._id)}
                >
                  {expandedOrders.has(order._id) ? 'Hide Details' : 'View Details'}
                </button>
              </div>
              
              <div className={`order-details ${expandedOrders.has(order._id) ? 'show' : ''}`}>
                <h4>Order Items</h4>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={item._id || idx}>
                      <span className="item-name">{item.name}</span> - {item.description} | 
                      Qty: {item.quantity} | Price: ₹{item.price}
                    </li>
                  ))}
                </ul>
                
                <h4>Delivery Address</h4>
                <div className="address-info">
                  <strong>{order.address.firstName} {order.address.lastName}</strong><br />
                  {order.address.street}<br />
                  {order.address.city}, {order.address.state} - {order.address.zipcode}<br />
                  {order.address.country}<br />
                  <br />
                  <strong>Contact:</strong><br />
                  Email: {order.address.email}<br />
                  Phone: {order.address.phone}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};  

export default UserOrders;