import React, { useState, useContext, useEffect } from 'react';
import './UserOrders.css';
import { StoreContext } from '../../context/StoreContext.jsx';
import axios from 'axios';

const UserOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
      
      console.log("Full API response:", response.data);
      
      // Handle different possible response structures
      let ordersData = [];
      if (response.data && response.data.data) {
        ordersData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && response.data.orders) {
        ordersData = response.data.orders;
      } else {
        console.warn("Unexpected response structure:", response.data);
        ordersData = [];
      }

      // Ensure ordersData is an array
      if (!Array.isArray(ordersData)) {
        console.warn("Orders data is not an array:", ordersData);
        ordersData = [];
      }

      setData(ordersData);
      
      // Debug: Check the structure of each order
      ordersData.forEach((order, index) => {
        console.log(`Order ${index}:`, order);
        console.log(`Order ${index} items:`, order.items);
        order.items && order.items.forEach((item, itemIndex) => {
          console.log(`  Item ${itemIndex} variation: "${item.variation}"`);
        });
      });
      
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
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

  // Helper function to format order ID - show last 8 characters
  const formatOrderId = (orderId) => {
    if (!orderId) return 'Unknown ID';
    return `#${orderId.slice(-8)}`;
  };

  // Improved helper function to format item name with variation
  const formatItemNameWithVariation = (item) => {
    if (!item || !item.name) return 'Unknown item';
    
    // Check if variation exists and is not empty/Regular
    if (item.variation && 
        item.variation.trim() !== '' && 
        item.variation.toLowerCase() !== 'regular') {
      return `${item.name} (${item.variation})`;
    }
    return item.name;
  };

  const formatItemsDisplay = (items) => {
    if (!items || !Array.isArray(items)) {
      return "No items data";
    }
    
    if (items.length === 0) {
      return "No items";
    }

    const itemTexts = items.map(item => {
      const itemName = formatItemNameWithVariation(item);
      const quantity = item.quantity || 1;
      return `${itemName}×${quantity}`;
    });
    const fullText = itemTexts.join(', ');
    
    if (fullText.length > 80) {
      let truncated = '';
      for (let i = 0; i < itemTexts.length; i++) {
        const nextText = truncated ? `${truncated}, ${itemTexts[i]}` : itemTexts[i];
        if (nextText.length > 77) {
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
      const quantity = item.quantity || 1;
      return `${itemName}×${quantity}`;
    }).join(', ');
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-processing';
    
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-processing';
    }
  };

  // Safe access to order properties
  const getOrderProperty = (order, property, fallback = 'N/A') => {
    return order && order[property] !== undefined ? order[property] : fallback;
  };

  const getAddressProperty = (address, property, fallback = 'N/A') => {
    return address && address[property] !== undefined ? address[property] : fallback;
  };

  if (loading) {
    return (
      <div className="user-orders">
        <h2>My Orders</h2>
        <div className="container">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-orders">
        <h2>My Orders</h2>
        <div className="container">
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchOrders} style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="user-orders">
        <h2>My Orders</h2>
        <div className="container">
          <p>Please log in to view your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          data.map((order) => (
            <div key={order._id || Math.random()} className="my-orders-orders">
              <div className="order-summary">
                <div className="order-main-info">
                  <div className="order-info-item">
                    <span className="label">Order ID</span>
                    <span className="value order-id">{formatOrderId(order._id)}</span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Date</span>
                    <span className="value">
                      {order.date ? new Date(order.date).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Status</span>
                    <span className={`value order-status ${getStatusClass(order.status)}`}>
                      {getOrderProperty(order, 'status', 'Processing')}
                    </span>
                  </div>
                  
                  <div className="order-info-item">
                    <span className="label">Amount</span>
                    <span className="value order-amount">₹{getOrderProperty(order, 'amount', '0')}</span>
                  </div>
                  
                  <div className="order-info-item items-section">
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
                {!order.items || !Array.isArray(order.items) ? (
                  <p style={{color: 'red', fontStyle: 'italic'}}>
                    Items data is missing or not an array.
                  </p>
                ) : order.items.length === 0 ? (
                  <p style={{color: 'orange', fontStyle: 'italic'}}>
                    No items in this order
                  </p>
                ) : (
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={item._id || idx}>
                        <div className="item-details">
                          <span className="item-name">{formatItemNameWithVariation(item)}</span>
                          {}
                          <div className="item-quantity-price">
                            <span className="quantity">Qty: {item.quantity || 1}</span>
                            <span className="price">Price: ₹{item.price || 0}</span>
                            {/* Only show variation if it's not empty and not "Regular" */}
                            {item.variation && 
                             item.variation.trim() !== '' && 
                             item.variation.toLowerCase() !== 'regular' && (
                              <span className="variation-info">Size: {item.variation}</span>
                            )}
                            {item.category && item.category.trim() !== '' && (
                              <span className="category-info">Category: {item.category}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                <h4>Delivery Address</h4>
                {order.address ? (
                  <div className="address-info">
                    {/* Handle both old and new address formats */}
                    {(order.address.firstName || order.address.lastName) && (
                      <div>
                        <strong>
                          {getAddressProperty(order.address, 'firstName')} {getAddressProperty(order.address, 'lastName')}
                        </strong><br />
                      </div>
                    )}
                    
                    <div>
                      {getAddressProperty(order.address, 'street')}<br />
                      {getAddressProperty(order.address, 'city')}, {getAddressProperty(order.address, 'state')} - {getAddressProperty(order.address, 'zipcode', getAddressProperty(order.address, 'pincode'))}<br />
                      {getAddressProperty(order.address, 'country')}
                    </div>
                    
                    {(order.address.email || order.address.phone) && (
                      <div>
                        <br />
                        <strong>Contact:</strong><br />
                        {order.address.email && `Email: ${order.address.email}`}<br />
                        {order.address.phone && `Phone: ${order.address.phone}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{color: 'red', fontStyle: 'italic'}}>
                    Address information not available
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};  

export default UserOrders;