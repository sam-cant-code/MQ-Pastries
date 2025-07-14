import React, { useContext, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Verify.css'
import { StoreContext } from '../../context/StoreContext'

const Verify = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const success = searchParams.get("success")
  const orderId = searchParams.get("orderId")
  const { url } = useContext(StoreContext)
  const navigate = useNavigate()

  const verifyPayment = async () => {
    try {
      console.log("Verifying payment with:", { success, orderId })
      
      const response = await axios.post(url + "/api/order/verify", { success, orderId })
      
      console.log("Verification response:", response.data)
      
      if (response.data.success) {
        navigate("/myorders")
      } else {
        navigate("/")
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      navigate("/")
    }
  }

  useEffect(() => {
    if (success && orderId) {
      verifyPayment()
    } else {
      console.log("Missing success or orderId parameters")
      navigate("/")
    }
  }, [])

  return (
    <div className="verify-container">
      <div className="spinner"></div>
      <p>Verifying your payment...</p>
    </div>
  )
}

export default Verify
