import React, { useState, useContext } from 'react';
import './LoginPopUp.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const LoginPopUp = ({ setShowLogin }) => {
  const { url, setToken, setUserName } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState("Sign Up");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    otp: '',
    newPassword: ''
  });

  const isSignUp = currentState === "Sign Up";
  const isLogin = currentState === "Login";
  const isForgotPassword = currentState === "Forgot Password";
  const isResetPassword = currentState === "Reset Password";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    let newUrl = url;
    if (currentState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    try {
      const response = await axios.post(newUrl, formData);
      console.log("🧪 Backend response:", response.data);

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        console.log("✅ Token set:", response.data.token);

        if ("name" in response.data) {
          setUserName(response.data.name);
          localStorage.setItem("userName", response.data.name);
          console.log("✅ userName set:", response.data.name);
        } else {
          console.warn("⚠️ 'name' not found in response!");
        }

        setShowLogin(false);
      } else {
        alert(response.data.message);
        console.warn("❌ Login/Register failed:", response.data.message);
      }
    } catch (error) {
      console.error("🚨 Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (event) => {
    event.preventDefault();
    
    if (!formData.email) {
      alert("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${url}/api/user/send-otp`, {
        email: formData.email
      });

      console.log("🧪 OTP Response:", response.data);

      if (response.data.success) {
        alert("OTP sent to your email!");
        setCurrentState("Reset Password");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("🚨 OTP error:", error);
      alert("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    
    if (!formData.email || !formData.otp || !formData.newPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (formData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${url}/api/user/reset-password`, {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      console.log("🧪 Reset Response:", response.data);

      if (response.data.success) {
        alert("Password reset successfully! You can now login with your new password.");
        setCurrentState("Login");
        setFormData({ name: '', email: '', password: '', otp: '', newPassword: '' });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("🚨 Reset error:", error);
      alert("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleState = () => {
    if (isSignUp) {
      setCurrentState("Login");
    } else if (isLogin) {
      setCurrentState("Sign Up");
    } else {
      setCurrentState("Login");
    }
    setFormData({ name: '', email: '', password: '', otp: '', newPassword: '' });
  };

  const goToForgotPassword = () => {
    setCurrentState("Forgot Password");
    setFormData({ name: '', email: '', password: '', otp: '', newPassword: '' });
  };

  const goBackToLogin = () => {
    setCurrentState("Login");
    setFormData({ name: '', email: '', password: '', otp: '', newPassword: '' });
  };

  const closePopup = () => {
    setShowLogin(false);
  };

  const handleSubmit = (event) => {
    if (isForgotPassword) {
      sendOTP(event);
    } else if (isResetPassword) {
      resetPassword(event);
    } else {
      onLogin(event);
    }
  };

  const getSubmitButtonText = () => {
    if (isLoading) {
      if (isForgotPassword) return "Sending OTP...";
      if (isResetPassword) return "Resetting Password...";
      return isSignUp ? "Creating Account..." : "Logging in...";
    }
    
    if (isForgotPassword) return "Send OTP";
    if (isResetPassword) return "Reset Password";
    return isSignUp ? "Create Account" : "Login";
  };

  return (
    <div className="login-popup">
      <div className="login-popup__overlay" onClick={closePopup} />

      <form className="login-popup__container" onSubmit={handleSubmit}>
        <header className="login-popup__header">
          <h2 className="login-popup__title">{currentState}</h2>
          <button
            type="button"
            className="login-popup__close-btn"
            onClick={closePopup}
            aria-label="Close popup"
            disabled={isLoading}
          >
            <img src={assets.cross_icon} alt="Close" />
          </button>
        </header>

        <div className="login-popup__inputs">
          {/* Name field - only for Sign Up */}
          {isSignUp && (
            <input
              type="text"
              name="name"
              className="login-popup__input"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          )}

          {/* Email field - for all states */}
          <input
            type="email"
            name="email"
            className="login-popup__input"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />

          {/* Password field - only for Sign Up and Login */}
          {(isSignUp || isLogin) && (
            <input
              type="password"
              name="password"
              className="login-popup__input"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          )}

          {/* OTP field - only for Reset Password */}
          {isResetPassword && (
            <input
              type="text"
              name="otp"
              className="login-popup__input"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={handleInputChange}
              disabled={isLoading}
              required
              maxLength="6"
            />
          )}

          {/* New Password field - only for Reset Password */}
          {isResetPassword && (
            <input
              type="password"
              name="newPassword"
              className="login-popup__input"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          )}
        </div>

        <button 
          type="submit" 
          className="login-popup__submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="login-popup__loading">
              <div className="login-popup__spinner"></div>
              <span>{getSubmitButtonText()}</span>
            </div>
          ) : (
            getSubmitButtonText()
          )}
        </button>

        {/* Toggle buttons */}
        <div className="login-popup__footer">
          {(isSignUp || isLogin) && (
            <>
              <p className="login-popup__toggle">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  type="button"
                  className="login-popup__toggle-btn"
                  onClick={toggleState}
                  disabled={isLoading}
                >
                  {isSignUp ? "Login here" : "Sign up here"}
                </button>
              </p>
              
              {isLogin && (
                <p className="login-popup__toggle">
                  <button
                    type="button"
                    className="login-popup__toggle-btn"
                    onClick={goToForgotPassword}
                    disabled={isLoading}
                  >
                    Forgot Password?
                  </button>
                </p>
              )}
            </>
          )}

          {(isForgotPassword || isResetPassword) && (
            <p className="login-popup__toggle">
              <button
                type="button"
                className="login-popup__toggle-btn"
                onClick={goBackToLogin}
                disabled={isLoading}
              >
                Back to Login
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPopUp;