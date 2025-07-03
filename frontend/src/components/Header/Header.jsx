import React from 'react'
import './Header.css'

const Header = () => {

  const scrollToMenu = () => {
    const menuSection = document.getElementById('explore-menu');
    if (menuSection) {
      menuSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  return (
    <div className="header">
      <div className="header-contents">
        <h2>Welcome to MQ Pastries!</h2>
        <p>Order your favourite items from the menu below</p>
        <button onClick={scrollToMenu}>View Menu</button>
      </div>
    </div>
  )
}

export default Header