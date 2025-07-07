import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Package, Clock, CheckCircle, XCircle, Calendar, Receipt, MapPin, Phone, Mail, Search, ChevronDown, Truck, ChefHat, ClipboardList, CheckCircle2 } from 'lucide-react';

const UserOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});

  // Order status options
  const statusOptions = [
    { value: 'Processing', label: 'Processing', icon: ClipboardList, color: 'bg-blue-100 text-blue-800' },
    { value: 'Being Baked', label: 'Being Baked', icon: ChefHat, color: 'bg-orange-100 text-orange-800' },
    { value: 'Out for Delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-purple-100 text-purple-800' },
    { value: 'Delivered', label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
    { value: 'Cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' }
  ];

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(url + "/api/order/userorders", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
      
      const response = await fetch(url + "/api/order/updatestatus", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      // Update local state
      setData(prevData => 
        prevData.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserOrders();
    }
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status) => {
    const config = statusOptions.find(option => option.value === status);
    return config || { 
      value: status, 
      label: status, 
      icon: Clock, 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  const filteredOrders = data.filter(order => {
    const matchesSearch = order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items?.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'paid') return order.payment && matchesSearch;
    if (filter === 'pending') return !order.payment && matchesSearch;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-orange-900 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-lg shadow-sm border">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <p className="text-red-600 mb-8 text-lg">{error}</p>
          <button
            onClick={fetchUserOrders}
            className="px-8 py-3 bg-orange-900 text-white rounded-lg hover:bg-orange-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            
           {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-900 focus:border-transparent"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'paid', label: 'Paid' },
                { key: 'pending', label: 'Pending' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-orange-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-16 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No orders found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't placed any orders yet." 
                : `No ${filter} orders found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  
                  {/* Order Header */}
                  <div className="bg-orange-900 text-white p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          Order #{order._id?.slice(-8) || 'Unknown'}
                        </h3>
                        <div className="flex items-center gap-6 text-orange-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(order.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4" />
                            <span>₹{order.amount}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Status Dropdown */}
                        <div className="relative min-w-48">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            disabled={updatingStatus[order._id]}
                            className="w-full appearance-none bg-white text-gray-900 rounded-lg px-4 py-2 pr-10 text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                          {updatingStatus[order._id] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
                              <div className="w-4 h-4 border-2 border-orange-900 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Payment Status */}
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          order.payment 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.payment ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-8 space-y-8">
                    
                    {/* Order Status Display */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h4>
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${statusConfig.color}`}>
                          <StatusIcon className="w-5 h-5" />
                          <span className="font-medium">{statusConfig.label}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Last updated: {formatDate(order.updatedAt || order.date)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Items */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h4>
                      <div className="space-y-4">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border">
                                <Package className="w-8 h-8 text-gray-500" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">{item.name}</h5>
                                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>Quantity: {item.quantity}</span>
                                  <span>Category: {item.category}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                ₹{item.price * item.quantity}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                ₹{item.price} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Delivery Address
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                          <div>
                            <p className="font-semibold text-gray-900 mb-2">
                              {order.address?.firstName} {order.address?.lastName}
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                              {order.address?.street}<br />
                              {order.address?.city}, {order.address?.state}<br />
                              {order.address?.zipcode}<br />
                              {order.address?.country}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">{order.address?.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">{order.address?.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Order Total</span>
                        <span className="text-2xl font-bold text-gray-900">₹{order.amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Order Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{data.length}</div>
              <div className="text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {data.filter(order => order.payment).length}
              </div>
              <div className="text-gray-600">Paid Orders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {data.filter(order => !order.payment).length}
              </div>
              <div className="text-gray-600">Pending Orders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ₹{data.reduce((sum, order) => sum + (order.amount || 0), 0)}
              </div>
              <div className="text-gray-600">Total Spent</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button 
            onClick={fetchUserOrders}
            className="px-8 py-3 bg-orange-900 text-white rounded-lg hover:bg-orange-800 transition-colors font-medium"
          >
            Refresh Orders
          </button>
          <button className="px-8 py-3 border border-orange-900 text-orange-900 rounded-lg hover:bg-orange-50 transition-colors font-medium">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserOrders;