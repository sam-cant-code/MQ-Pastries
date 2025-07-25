import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import './LoginPopUp.css';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'info': return 'ℹ';
      default: return '!';
    }
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__content">
        <span className="toast__icon">{getIcon()}</span>
        <span className="toast__message">{message}</span>
        <button className="toast__close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

const LoginPopUp = ({ setShowLogin }) => { // FIXED: Accept setShowLogin as prop
  const { url, login } = useContext(StoreContext); // FIXED: Removed setShowLogin from context
  const navigate = useNavigate();
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI states
  const [currState, setCurrState] = useState("Login");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Derived states
  const isForgotPassword = currState === "Forgot Password";
  const isResetPassword = currState === "Reset Password";
  const isSignUp = currState === "Sign Up";
  const isLogin = currState === "Login";

  // Toast functions
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const closeToast = () => {
    setToast(null);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // FIXED: Simplified close function
  const closePopup = () => {
    setShowLogin(false);
  };

  // FIXED: Simplified overlay click handler
  const handleOverlayClick = (e) => {
    // Only close if clicking on the overlay itself, not its children
    if (e.target.classList.contains('login-popup__overlay')) {
      closePopup();
    }
  };

  // 🔐 LOGIN FUNCTION
  const onLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = isSignUp ? '/api/user/register' : '/api/user/login';
      const payload = isSignUp 
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };
      
      console.log(`🔄 ${isSignUp ? 'Registering' : 'Logging in'} user...`);
      
      const response = await axios.post(`${url}${endpoint}`, payload);
      
      console.log("Backend response:", response.data);
      
      if (response.data.success) {
        if (isSignUp) {
          showToast('Account created successfully! Please login.', 'success');
          setCurrState("Login");
          setFormData(prev => ({ ...prev, password: '', name: '' }));
        } else {
          const userData = {
            name: response.data.name,
            role: response.data.role
          };
          
          console.log("✅ User logged in:", userData);
          
          await login(userData, response.data.token);
          
          console.log("✅ Token set:", response.data.token);
          
          showToast(`Welcome back, ${userData.name}!`, 'success');
          
          // FIXED: Close popup immediately and then navigate
          closePopup();
          
          // Small delay to ensure popup closes before navigation
          setTimeout(() => {
            if (response.data.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/');
            }
          }, 100);
        }
      } else {
        showToast(response.data.message || `${isSignUp ? 'Registration' : 'Login'} failed`, 'error');
      }
    } catch (error) {
      console.error(`${isSignUp ? 'Registration' : 'Login'} error:`, error);
      showToast(error.response?.data?.message || `${isSignUp ? 'Registration' : 'Login'} failed. Please try again.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 📧 SEND OTP FUNCTION
  const sendOTP = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    if (!formData.email) {
      showToast('Please enter your email address', 'error');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('📧 Sending OTP to:', formData.email);
      
      const response = await axios.post(`${url}/api/user/send-otp`, {
        email: formData.email
      });
      
      console.log("Send OTP response:", response.data);
      
      if (response.data.success) {
        showToast('OTP sent to your email! Please check your inbox.', 'success');
        setCurrState("Reset Password");
      } else {
        showToast(response.data.message || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      showToast(error.response?.data?.message || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔑 RESET PASSWORD FUNCTION
  const resetPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    // Validation
    if (!formData.email || !formData.otp || !formData.newPassword || !formData.confirmPassword) {
      showToast('Please fill in all fields', 'error');
      setIsLoading(false);
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      setIsLoading(false);
      return;
    }
    
    if (formData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔑 Resetting password for:', formData.email);
      
      const response = await axios.post(`${url}/api/user/reset-password`, {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      
      console.log("Reset password response:", response.data);
      
      if (response.data.success) {
        showToast('Password reset successful! Please login with your new password.', 'success');
        setCurrState("Login");
        setFormData({
          email: formData.email,
          password: '',
          name: '',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showToast(response.data.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showToast(error.response?.data?.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 MAIN SUBMIT HANDLER
  const handleSubmit = (event) => {
    if (isForgotPassword) {
      sendOTP(event);
    } else if (isResetPassword) {
      resetPassword(event);
    } else {
      onLogin(event);
    }
  };

  // Helper function to get button text
  const getButtonText = () => {
    if (isLoading) {
      return (
        <div className="login-popup__loading">
          <div className="login-popup__spinner"></div>
          <span>Please wait...</span>
        </div>
      );
    }
    
    switch (currState) {
      case "Login": return "Login";
      case "Sign Up": return "Create Account";
      case "Forgot Password": return "Send OTP";
      case "Reset Password": return "Reset Password";
      default: return "Submit";
    }
  };

  // Helper function to get form title
  const getFormTitle = () => {
    switch (currState) {
      case "Login": return "Welcome Back";
      case "Sign Up": return "Join Our Bakery";
      case "Forgot Password": return "Forgot Password";
      case "Reset Password": return "Reset Password";
      default: return "Login";
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
      
      {/* FIXED: Simplified structure */}
      <div className="login-popup">
        <div className="login-popup__overlay" onClick={handleOverlayClick}></div>
        
        <div className="login-popup__container">
          <div className="login-popup__header">
            <h2 className="login-popup__title">{getFormTitle()}</h2>
            <button 
              type="button"
              onClick={closePopup} // FIXED: Direct close function
              className="login-popup__close-btn"
              disabled={isLoading}
            >
              <img src={assets.cross_icon} alt="Close" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="login-popup__inputs">
              {/* Name field - only for Sign Up */}
              {isSignUp && (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className="login-popup__input"
                  disabled={isLoading}
                  required
                />
              )}
              
              {/* Email field - for all states */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email address"
                className="login-popup__input"
                disabled={isLoading}
                required
              />
              
              {/* Password field - for Login and Sign Up only */}
              {(isLogin || isSignUp) && (
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Your password"
                  className="login-popup__input"
                  disabled={isLoading}
                  required
                />
              )}
              
              {/* OTP field - for Reset Password only */}
              {isResetPassword && (
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  placeholder="Enter 6-digit OTP"
                  className="login-popup__input"
                  disabled={isLoading}
                  maxLength="6"
                  required
                />
              )}
              
              {/* New Password fields - for Reset Password only */}
              {isResetPassword && (
                <>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="New password (min 6 characters)"
                    className="login-popup__input"
                    disabled={isLoading}
                    required
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="login-popup__input"
                    disabled={isLoading}
                    required
                  />
                </>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="login-popup__submit-btn"
            >
              {getButtonText()}
            </button>
          </form>
          
          {/* State switching links */}
          <div className="login-popup__footer">
            {isLogin && (
              <>
                <p className="login-popup__toggle">
                  New to our bakery?
                  <button 
                    type="button"
                    onClick={() => setCurrState("Sign Up")}
                    className="login-popup__toggle-btn"
                    disabled={isLoading}
                  >
                    Create account
                  </button>
                </p>
                <p className="login-popup__toggle">
                  Forgot your password?
                  <button 
                    type="button"
                    onClick={() => setCurrState("Forgot Password")}
                    className="login-popup__toggle-btn"
                    disabled={isLoading}
                  >
                    Reset here
                  </button>
                </p>
              </>
            )}
            
            {isSignUp && (
              <p className="login-popup__toggle">
                Already have an account?
                <button 
                  type="button"
                  onClick={() => setCurrState("Login")}
                  className="login-popup__toggle-btn"
                  disabled={isLoading}
                >
                  Login here
                </button>
              </p>
            )}
            
            {isForgotPassword && (
              <p className="login-popup__toggle">
                Remember your password?
                <button 
                  type="button"
                  onClick={() => setCurrState("Login")}
                  className="login-popup__toggle-btn"
                  disabled={isLoading}
                >
                  Login here
                </button>
              </p>
            )}
            
            {isResetPassword && (
              <>
                <p className="login-popup__toggle">
                  Didn't receive OTP?
                  <button 
                    type="button"
                    onClick={() => setCurrState("Forgot Password")}
                    className="login-popup__toggle-btn"
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                </p>
                <p className="login-popup__toggle">
                  Remember your password?
                  <button 
                    type="button"
                    onClick={() => setCurrState("Login")}
                    className="login-popup__toggle-btn"
                    disabled={isLoading}
                  >
                    Login here
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPopUp;