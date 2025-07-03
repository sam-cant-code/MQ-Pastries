  import React from 'react'
  import './Footer.css'
  import { assets } from '../../assets/assets'

  const Footer = () => {
    return (
      <div className="footer" id="footer"> {/* Add ID here */}
        <div className="footer-content">
          <div className="footer-content-left">
            <img className="footer-logo" src={assets.logo} alt="Logo" />
            <p>Freshly homebaked goodies at budget friendly prices!</p>
            <div className="footer-social-icons">
              <img src={assets.instagram_icon} alt="Instagram" />
              <img src={assets.youtube_icon} alt="YouTube" />
              {/* Optional: Add fallback or remove empty <img> */}
            </div>
          </div>
          <div className="footer-content-center">
            <h2>MQ PASTRIES</h2>
            <ul>
              <li>Home</li>
              <li>About us</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
          <div className="footer-content-right">
            <h2>GET IN TOUCH</h2>
            <ul>
              <li>email@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  export default Footer
