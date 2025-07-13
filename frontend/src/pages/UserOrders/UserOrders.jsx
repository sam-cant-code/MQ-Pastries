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
      console.log("Full response:", response.data.data);
      
      // Debug: Check the structure of each order
      response.data.data.forEach((order, index) => {
        console.log(`Order ${index}:`, order);
        console.log(`Order ${index} items:`, order.items);
        console.log(`Order ${index} items length:`, order.items ? order.items.length : 'No items property');
      });
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

  // Helper function to format item name with variation
  const formatItemNameWithVariation = (item) => {
    if (item.variation && item.variation.trim() !== '') {
      return `${item.name} (${item.variation})`;
    }
    return item.name;
  };

  const formatItemsDisplay = (items) => {
    // Debug: Check if items exist and have length
    if (!items || !Array.isArray(items)) {
      console.log("Items is not an array or is null/undefined:", items);
      return "No items data";
    }
    
    if (items.length === 0) {
      console.log("Items array is empty");
      return "No items";
    }

    const itemTexts = items.map(item => {
      const itemName = formatItemNameWithVariation(item);
      return `${itemName}×${item.quantity}`;
    });
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

  // Helper function to create full tooltip text
  const getFullItemsText = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return "No items available";
    }
    
    return items.map(item => {
      const itemName = formatItemNameWithVariation(item);
      return `${itemName}×${item.quantity}`;
    }).join(', ');
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
                    <span className="value items-display" title={getFullItemsText(order.items)}>
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
                {/* Debug: Show items structure */}
                {!order.items || !Array.isArray(order.items) ? (
                  <p style={{color: 'red', fontStyle: 'italic'}}>
                    Debug: Items data is missing or not an array. 
                    Items value: {JSON.stringify(order.items)}
                  </p>
                ) : order.items.length === 0 ? (
                  <p style={{color: 'orange', fontStyle: 'italic'}}>
                    Debug: Items array is empty
                  </p>
                ) : (
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={item._id || idx}>
                        <div className="item-details">
                          <span className="item-name">{formatItemNameWithVariation(item)}</span>
                          {item.description && (
                            <span className="item-description"> - {item.description}</span>
                          )}
                          <div className="item-quantity-price">
                            <span className="quantity">Qty: {item.quantity}</span>
                            <span className="price">Price: ₹{item.price}</span>
                            {item.variation && (
                              <span className="variation-info">Variation: {item.variation}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
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