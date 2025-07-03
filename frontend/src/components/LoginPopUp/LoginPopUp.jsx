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
    password: ''
  });

  const isSignUp = currentState === "Sign Up";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true); // Start loading

    let newUrl = url;
    if (currentState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    try {
      const response = await axios.post(newUrl, formData);
      console.log("🧪 Backend response:", response.data); // Debug log

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
      setIsLoading(false); // Stop loading
    }
  };

  const toggleState = () => {
    setCurrentState(isSignUp ? "Login" : "Sign Up");
    setFormData({ name: '', email: '', password: '' });
  };

  const closePopup = () => {
    setShowLogin(false);
  };

  return (
    <div className="login-popup">
      <div className="login-popup__overlay" onClick={closePopup} />

      <form className="login-popup__container" onSubmit={onLogin}>
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
        </div>

        <button 
          type="submit" 
          className="login-popup__submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="login-popup__loading">
              <div className="login-popup__spinner"></div>
              <span>
                {isSignUp ? "Creating Account..." : "Logging in..."}
              </span>
            </div>
          ) : (
            isSignUp ? "Create Account" : "Login"
          )}
        </button>

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
      </form>
    </div>
  );
};

export default LoginPopUp;