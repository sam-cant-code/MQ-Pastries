import React, { useState, useContext, useCallback, useMemo } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { Link, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', sectionId: 'header' },
  { id: 'menu', label: 'Menu', sectionId: 'explore-menu' },
  { id: 'contact', label: 'Contact', sectionId: 'footer' }
];

const Navbar = ({ setShowLogin }) => {
  const [activeMenu, setActiveMenu] = useState('home');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const {
    getTotalCartItems,
    token,
    setToken,
    userName,
    setUserName,
  } = useContext(StoreContext);

  const cartItemCount = useMemo(() => getTotalCartItems(), [getTotalCartItems]);
  const displayName = useMemo(() => 
    userName?.split(' ')[0] || 'User', 
    [userName]
  );

  const scrollToSection = useCallback((sectionId) => {
    if (location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
      return;
    }

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }, [location.pathname]);

  const handleMenuClick = useCallback((menuItem, sectionId = null) => {
    setActiveMenu(menuItem);
    setIsDropdownOpen(false);
    if (sectionId) {
      scrollToSection(sectionId);
    }
  }, [scrollToSection]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      setToken("");
      setUserName("");
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [setToken, setUserName]);

  const handleProfileClick = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const handleLogoClick = useCallback(() => {
    setActiveMenu('home');
    setIsDropdownOpen(false);
  }, []);

  const handleSignInClick = useCallback(() => {
    setShowLogin(true);
    setIsDropdownOpen(false);
  }, [setShowLogin]);

  // ✅ New function to handle cart click and scroll to top
  const handleCartClick = useCallback((e) => {
    // Scroll to top immediately when cart is clicked
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-brand">
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="logo-link"
            aria-label="Go to homepage"
          >
            <img src={assets.logo} alt="Logo" className="logo" />
          </Link>
        </div>

        {/* Navigation Menu */}
        <ul className="navbar-menu" role="menubar">
          {MENU_ITEMS.map(({ id, label, sectionId }) => (
            <li key={id} role="none">
              <button
                onClick={() => handleMenuClick(id, sectionId)}
                className={`navbar-menu-item ${activeMenu === id ? 'active' : ''}`}
                role="menuitem"
                aria-current={activeMenu === id ? 'page' : undefined}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {/* Search Icon */}
          <button className="navbar-icon-button" aria-label="Search">
            <img src={assets.search_icon} alt="" className="navbar-icon" />
          </button>

          {/* Cart Icon - ✅ Added onClick handler */}
          <div className="cart-container">
            <Link 
              to="/cart" 
              className="cart-link" 
              aria-label={`Cart with ${cartItemCount} items`}
              onClick={handleCartClick}
            >
              <div className="cart-icon-wrapper">
                <img src={assets.bag_icon} alt="" className="navbar-icon" />
                {cartItemCount > 0 && (
                  <span className="cart-badge" aria-label={`${cartItemCount} items in cart`}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Authentication Section */}
          {!token ? (
            <button 
              onClick={handleSignInClick} 
              className="sign-in-button"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
          ) : (
            <div className="profile-container">
              <button
                onClick={handleProfileClick}
                className="profile-button"
                aria-label="User profile menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <img src={assets.profile_icon} alt="" className="profile-icon" />
                <span className="profile-chevron" aria-hidden="true">▼</span>
              </button>

              {isDropdownOpen && (
                <div 
                  className="profile-dropdown"
                  role="menu"
                  aria-label="Profile menu"
                >
                  <div className="dropdown-header">
                    <p className="username">Hi, {displayName}</p>
                  </div>
                  
                  <div className="dropdown-divider" role="separator"></div>
                  
                  <Link to="/orders" className="dropdown-item" role="menuitem">
                    <img src={assets.bag_icon} alt="" className="dropdown-icon" />
                    <span>Orders</span>
                  </Link>
                  
                  <div className="dropdown-divider" role="separator"></div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="dropdown-item logout-item"
                    role="menuitem"
                  >
                    <img src={assets.logout_icon} alt="" className="dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;