import React, { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { Package, Clock, CheckCircle, XCircle, Calendar, Receipt, Truck } from 'lucide-react'

const UserOrders = () => {
  const { url, token } = useContext(StoreContext)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchUserOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(url + "/api/order/userorders", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const result = await response.json()
      setData(result.data || [])
    } catch (err) {
      setError('Failed to fetch orders. Please try again.')
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUserOrders()
    }
  }, [token])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredOrders = data.filter(order => {
    if (filter === 'all') return true
    if (filter === 'paid') return order.payment
    if (filter === 'pending') return !order.payment
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-lg">{error}</p>
          <button
            onClick={fetchUserOrders}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Orders Section */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
            
            {/* Filter Pills */}
            <div className="flex space-x-4 mb-8">
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'paid', label: 'Paid' },
                { key: 'pending', label: 'Pending' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                    filter === tab.key
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-lg font-medium text-gray-900 mb-3">No orders found</h3>
                  <p className="text-gray-500">
                    {filter === 'all' 
                      ? "You haven't placed any orders yet." 
                      : `No ${filter} orders found.`}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order, index) => (
                  <div key={index} className="bg-white rounded-lg p-8 shadow-sm">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Order #{order._id?.slice(-8) || 'Unknown'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {formatDate(order.createdAt || order.date)}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        order.payment 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {order.payment ? 'Paid' : 'Pending'}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4 mb-6">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          {item.price && (
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ₹{item.price * item.quantity}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 text-lg">Total Amount</span>
                        <span className="text-2xl font-bold text-gray-900">₹{order.amount}</span>
                      </div>
                      {order.payment && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Truck className="w-5 h-5" />
                          <span className="text-sm">Ready for delivery</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-8 shadow-sm sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Order Summary</h2>
              
              <div className="space-y-6">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium text-gray-900">{data.length}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Paid Orders</span>
                  <span className="font-medium text-green-600">
                    {data.filter(order => order.payment).length}
                  </span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Pending Orders</span>
                  <span className="font-medium text-orange-600">
                    {data.filter(order => !order.payment).length}
                  </span>
                </div>
                
                <hr className="my-6" />
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-medium text-gray-900">Total Spent</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{data.reduce((sum, order) => sum + (order.amount || 0), 0)}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={fetchUserOrders}
                className="w-full mt-8 bg-amber-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                REFRESH ORDERS
              </button>
              
              <button className="w-full mt-4 border border-amber-600 text-amber-600 py-4 px-6 rounded-lg font-medium hover:bg-amber-50 transition-colors">
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserOrders