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
    <div>
      <div>
        <div>
          <h1>My Orders</h1>
          <p>View and track all your orders</p>
        </div>

        {orders.length === 0 && (
          <div>
            <div>📦</div>
            <h2>Loading Orders...</h2>
            <p>Fetching your order history</p>
          </div>
        )}

        <div>
          {orders.map((order) => (
            <div key={order._id}>
              <div>
                <div>
                  <div>
                    <div>📋</div>
                    <div>
                      <h3>Order #{order._id.slice(-8)}</h3>
                      <p>
                        <span>📅</span>
                        {formatDate(order.date)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="dropdown-container">
                      <button onClick={() => toggleDropdown(order._id)}>
                        {statusOptions.find(option => option.value === order.status)?.label || order.status}
                        <span>▼</span>
                      </button>
                      {openDropdown === order._id && (
                        <div>
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(order._id, option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p>{formatAmount(order.amount)}</p>
                      <p>
                        <span>💳</span>
                        {order.payment ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div>
                  <div>
                    <h4>Items Ordered</h4>
                    <div>
                      {order.items.map((item) => (
                        <div key={item._id}>
                          <div>🛍️</div>
                          <div>
                            <h5>{item.name}</h5>
                            <p>{item.description}</p>
                            <div>
                              <span>{item.category}</span>
                              <span>{item.unit}</span>
                            </div>
                          </div>
                          <div>
                            <p>{formatAmount(item.price)}</p>
                            <p>Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4>Delivery Address</h4>
                    <div>
                      {order.address && (order.address.firstName || order.address.lastName) ? (
                        <>
                          <div>
                            <span>👤</span>
                            <span>{order.address.firstName} {order.address.lastName}</span>
                          </div>
                          <div>
                            <span>📍</span>
                            <div>
                              <p>{order.address.street}</p>
                              <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                              <p>{order.address.country}</p>
                            </div>
                          </div>
                          <div>
                            {order.address.phone && (
                              <div>
                                <span>📞</span>
                                <span>{order.address.phone}</span>
                              </div>
                            )}
                            {order.address.email && (
                              <div>
                                <span>📧</span>
                                <span>{order.address.email}</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div>No delivery address provided</div>
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