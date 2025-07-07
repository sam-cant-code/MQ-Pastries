import React from 'react';
import { useState, useEffect } from 'react';

const url = import.meta.env.VITE_BACKEND_URL;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  const statusOptions = [
    { value: 'order processing', label: 'Order Processing' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'out for delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const fetchAllOrders = async () => {
    try {
      const response = await fetch(url + "/api/order/list");
      const data = await response.json();
      setOrders(data.data);
      console.log(data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'order processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out for delivery':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Update local state immediately
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      
      // Close dropdown
      setOpenDropdown(null);
      
      // Optional: Make API call to update backend
      // await fetch(url + "/api/order/update-status", {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     orderId: orderId,
      //     status: newStatus
      //   })
      // });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const toggleDropdown = (orderId) => {
    setOpenDropdown(openDropdown === orderId ? null : orderId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#faf8f6' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#8b4513' }}>My Orders</h1>
          <p style={{ color: '#a0522d' }}>View and track all your orders</p>
        </div>

        {/* Loading State */}
        {orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center" style={{ border: '1px solid #f5deb3' }}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#f5deb3', color: '#8b4513' }}>
              📦
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#8b4513' }}>Loading Orders...</h2>
            <p style={{ color: '#a0522d' }}>Fetching your order history</p>
          </div>
        )}

        {/* Orders Grid */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: '1px solid #f5deb3', boxShadow: '0 4px 20px rgba(139, 69, 19, 0.1)' }}>
              {/* Order Header */}
              <div className="px-6 py-4 border-b" style={{ backgroundColor: '#fdf6e3', borderBottomColor: '#f5deb3' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-lg" style={{ backgroundColor: '#8b4513' }}>
                      📋
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#8b4513' }}>Order #{order._id.slice(-8)}</h3>
                      <p className="text-sm flex items-center gap-1" style={{ color: '#a0522d' }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#8b4513' }}>
                          📅
                        </span>
                        {formatDate(order.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => toggleDropdown(order._id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 transition-colors hover:opacity-80 ${getStatusColor(order.status)}`}
                      >
                        {statusOptions.find(option => option.value === order.status)?.label || order.status}
                        <span className="text-xs transform transition-transform" style={{ 
                          transform: openDropdown === order._id ? 'rotate(180deg)' : 'rotate(0deg)' 
                        }}>▼</span>
                      </button>
                      {openDropdown === order._id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px]" style={{ borderColor: '#f5deb3' }}>
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(order._id, option.value)}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                                order.status === option.value ? 'font-semibold bg-gray-50' : ''
                              }`}
                              style={{ color: '#8b4513' }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: '#8b4513' }}>{formatAmount(order.amount)}</p>
                      <p className="text-sm flex items-center gap-1" style={{ color: '#a0522d' }}>
                        <span className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: '#8b4513' }}>
                          💳
                        </span>
                        {order.payment ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Items */}
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: '#8b4513' }}>Items Ordered</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: '#fdf6e3', borderColor: '#f5deb3' }}>
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: '#f5deb3', color: '#8b4513' }}>
                            🛍️
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium" style={{ color: '#8b4513' }}>{item.name}</h5>
                            <p className="text-sm" style={{ color: '#5d4037' }}>{item.description}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm px-2 py-1 rounded font-medium" style={{ backgroundColor: '#f5deb3', color: '#8b4513' }}>
                                {item.category}
                              </span>
                              <span className="text-sm" style={{ color: '#a0522d' }}>{item.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold" style={{ color: '#8b4513' }}>{formatAmount(item.price)}</p>
                            <p className="text-sm" style={{ color: '#a0522d' }}>Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: '#8b4513' }}>Delivery Address</h4>
                    <div className="rounded-lg border p-4" style={{ backgroundColor: '#fdf6e3', borderColor: '#f5deb3' }}>
                      {order.address && (order.address.firstName || order.address.lastName) ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: '#8b4513' }}>
                              👤
                            </span>
                            <span className="font-medium" style={{ color: '#8b4513' }}>
                              {order.address.firstName} {order.address.lastName}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="w-4 h-4 rounded flex items-center justify-center text-xs mt-0.5" style={{ backgroundColor: '#8b4513' }}>
                              📍
                            </span>
                            <div style={{ color: '#5d4037' }}>
                              <p>{order.address.street}</p>
                              <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                              <p>{order.address.country}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {order.address.phone && (
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: '#8b4513' }}>
                                  📞
                                </span>
                                <span style={{ color: '#5d4037' }}>{order.address.phone}</span>
                              </div>
                            )}
                            {order.address.email && (
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: '#8b4513' }}>
                                  📧
                                </span>
                                <span style={{ color: '#5d4037' }}>{order.address.email}</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="italic" style={{ color: '#a0522d' }}>No delivery address provided</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;