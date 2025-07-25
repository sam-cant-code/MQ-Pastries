import React, { useState, useEffect, useCallback } from 'react';
import './Orders.css';
import axios from 'axios'; // Using axios for consistency and better error handling

const url = import.meta.env.VITE_BACKEND_URL;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  const statusOptions = [
    { value: 'Order Processing', label: 'Processing', color: '#fbbf24' },
    { value: 'Preparing', label: 'Preparing', color: '#f59e0b' },
    { value: 'Out for Delivery', label: 'On its way', color: '#8b5cf6' },
    { value: 'Delivered', label: 'Delivered', color: '#10b981' },
    { value: 'Cancelled', label: 'Cancelled', color: '#ef4444' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Order Processing': return '⏳';
      case 'Preparing': return '👨‍🍳';
      case 'Out for Delivery': return '🚚';
      case 'Delivered': return '✅';
      case 'Cancelled': return '❌';
      default: return '📦';
    }
  };
  
  const tabs = [
    { key: 'all', label: 'All Orders', icon: '📦', color: '#6b7280' },
    ...statusOptions.map(status => ({
      key: status.value,
      label: status.label,
      icon: getStatusIcon(status.value),
      color: status.color
    }))
  ];

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const getOrderCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${url}/api/order/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatAmount = (amount) => `₹${amount.toLocaleString()}`;

  const getStatusConfig = (status) => {
    return statusOptions.find(option => option.value === status) || 
           { label: status, color: '#6b7280' };
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const originalOrders = [...orders];
    
    // Optimistic UI update
    setOrders(prevOrders => 
      prevOrders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );
    setOpenDropdown(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await axios.put(`${url}/api/order/status`, 
        { orderId, status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update status");
      }

      showToast(`Order status updated to ${newStatus}`, 'success');

    } catch (error) {
      console.error('Error updating order status:', error);
      // Revert the optimistic update on failure
      setOrders(originalOrders);
      showToast(error.message || 'Failed to update order status', 'error');
    }
  };

  const toggleDropdown = (orderId) => {
    setOpenDropdown(openDropdown === orderId ? null : orderId);
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      newSet.has(orderId) ? newSet.delete(orderId) : newSet.add(orderId);
      return newSet;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  if (loading) {
    return (
      <div className="orders-container">
        <div className="orders-header"><h1>Orders</h1></div>
        <div className="loading-state">
          <div className="loading-icon">📦</div>
          <h2>Loading Orders...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <div className="orders-header"><h1>Orders</h1></div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Orders</h2>
          <p>{error}</p>
          <button onClick={fetchAllOrders} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      <div className="orders-header"><h1>Orders</h1></div>

      <div className="status-tabs">
        <div className="tabs-wrapper">
          {tabs.map((tab) => {
            const count = getOrderCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`tab-button ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  '--tab-color': tab.color,
                  borderBottomColor: isActive ? tab.color : 'transparent',
                  color: isActive ? tab.color : '#6b7280'
                }}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{getStatusIcon(activeTab)}</div>
          <h2>{activeTab === 'all' ? 'No Orders Found' : `No ${activeTab} Orders`}</h2>
          <p>{activeTab === 'all' ? "When a new order comes in, it will appear here." : `There are no orders with the "${activeTab}" status.`}</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const isExpanded = expandedOrders.has(order._id);
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order._id.slice(-8)}</h3>
                    <p className="order-date">📅 {formatDate(order.date)}</p>
                  </div>
                  <div className="order-meta">
                    <div className="dropdown-container">
                      <button 
                        className="status-button"
                        onClick={() => toggleDropdown(order._id)}
                        style={{ backgroundColor: statusConfig.color }}
                      >
                        {statusConfig.label}
                        <span className="dropdown-arrow">▼</span>
                      </button>
                      {openDropdown === order._id && (
                        <div className="dropdown-menu">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              className="dropdown-item"
                              onClick={() => handleStatusChange(order._id, option.value)}
                            >
                              <span className="status-dot" style={{ backgroundColor: option.color }}></span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="order-summary">
                      <p className="order-amount">{formatAmount(order.amount)}</p>
                      <p className="payment-status">{order.payment ? '✅ Paid' : '⏳ Pending'}</p>
                    </div>
                  </div>
                </div>

                {!isExpanded && (
                  <div className="order-content-compact" onClick={() => toggleOrderDetails(order._id)}>
                    <div className="compact-info">
                      <span className="items-count">📦 {order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      <button className="view-details-btn-compact">View Details</button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="order-content-expanded">
                    <div className="expanded-header">
                      <h4>Order Details</h4>
                      <button className="hide-details-btn" onClick={() => toggleOrderDetails(order._id)}>Hide Details ▲</button>
                    </div>
                    <div className="details-grid">
                      <div className="order-items">
                        <h4>Items Ordered</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="item-card">
                            <div className="item-info">
                               <p className="item-name">{item.name} <span className="item-quantity">× {item.quantity}</span></p>
                               <p className="item-variation">{item.variation}</p>
                            </div>
                            <p className="item-price">{formatAmount(item.price)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="delivery-address">
                        <h4>Delivery Address</h4>
                        {order.address ? (
                          <div className="address-details">
                            <p>👤 {order.address.firstName} {order.address.lastName}</p>
                            <p>📍 {order.address.street}, {order.address.city}, {order.address.state} - {order.address.zipcode}</p>
                            <p>{order.address.country}</p>
                            {order.address.phone && <p>📞 {order.address.phone}</p>}
                            {order.address.email && <p>📧 {order.address.email}</p>}
                          </div>
                        ) : (
                          <p className="no-address">No delivery address provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
