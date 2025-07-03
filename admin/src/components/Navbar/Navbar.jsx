import React from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <NavLink to="/" className="navbar-brand">
          <img src={assets.logo} alt="Logo" className="logo" />
        </NavLink>

        {/* Profile Section */}
        <div className="navbar-actions">
          <img src={assets.profile_icon} alt="Profile" className="profile-icon" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;