import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import { Routes, Route } from 'react-router'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './components/Footer/Footer'
import LoginPopUp from './components/LoginPopUp/LoginPopUp'
import { ToastContainer, toast } from 'react-toastify';
import Verify from './pages/Verify/Verify'
import UserOrders from './pages/UserOrders/UserOrders'


const App = () => {
  <ToastContainer/>
  const [showLogin, setShowLogin] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navbar functionality
  useEffect(() => {
    let timeoutId;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);

      // Only trigger if scroll difference is significant (prevents jittery behavior)
      if (scrollDifference < 5) return;

      // Clear any existing timeout
      clearTimeout(timeoutId);

      // Show navbar at top of page
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
      }
      // Hide when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsNavbarVisible(true);
      }

      // Debounce scroll updates
      timeoutId = setTimeout(() => {
        setLastScrollY(currentScrollY);
      }, 10);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  return (
    <>
      {showLogin ? <LoginPopUp setShowLogin={setShowLogin}/> : <></>}
      
      {/* Navbar with auto-hide functionality */}
      <div 
        className={`navbar-wrapper ${isNavbarVisible ? 'navbar-visible' : 'navbar-hidden'}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100vw'
        }}
      >
        <Navbar setShowLogin={setShowLogin}/>
      </div>
      
      {/* Spacer to account for fixed navbar */}
      <div style={{ height: '85px' }}></div>
      
      <div className="app">
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/cart' element={<Cart/>}/>
          <Route path='/order' element={<PlaceOrder/>}/>
          <Route path='/verify' element={<Verify/>}/>
          <Route path='/myorders' element={<UserOrders/>}/>
        </Routes>
      </div>
      
      {/* Footer outside of app container if you want it full width too */}
      <Footer/>
    </>
  )
}

export default App