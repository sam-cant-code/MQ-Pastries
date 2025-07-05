import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img className="footer-logo" src={assets.logo} alt="Logo" />
          <p>Freshly homebaked goodies at budget friendly prices!</p>
          <div className="footer-social-icons">
<<<<<<< HEAD
              <a
                href="https://www.instagram.com/mq_pastries?igsh=Njl3NzR3dTY2YjBq"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={assets.instagram_icon} alt="Instagram" />
              </a>
              <img src={assets.youtube_icon} alt="YouTube" />
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
            <li>mailmayqueen@gmail.com</li>
          </ul>
=======
            <img src={assets.instagram_icon} alt="Instagram" />
            <img src={assets.youtube_icon} alt="YouTube" />
          </div>
>>>>>>> 53e1e0417ca4a2bc9d172aca2880206fb28562df
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
      
      {/* FSSAI Section */}
      <div className="footer-fssai">
        <div className="fssai-info">
          <span className="fssai-label">FSSAI Lic. No:</span>
          <span className="fssai-number">21225192001266</span>
        </div>
      </div>
      
      {/* Copyright Section */}
      <div className="footer-bottom">
        <p>&copy; 2025 MQ Pastries. All rights reserved.</p>
      </div>
    </div>
  )
}

<<<<<<< HEAD
export default Footer
=======
export default Footer
>>>>>>> 53e1e0417ca4a2bc9d172aca2880206fb28562df
