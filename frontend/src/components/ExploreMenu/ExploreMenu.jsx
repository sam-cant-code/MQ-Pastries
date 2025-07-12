import React, { useState, useEffect, useRef, useContext } from 'react'
import './ExploreMenu.css'
import { category_list } from '../../assets/assets'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'


const ExploreMenu = () => {
  const { 
    category, 
    setCategory, 
    searchQuery, 
    setSearchQuery, 
    clearSearch 
  } = useContext(StoreContext);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef(null);

  const scrollToFoodDisplay = () => {
    const foodDisplaySection = document.getElementById('food-display');
    if (foodDisplaySection) {
      foodDisplaySection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  const handleCategoryClick = (menuName) => {
    setCategory(prev => prev === menuName ? "all" : menuName);
    // Clear search when category is selected
    setSearchQuery('');
    // Add a small delay to ensure the category change is processed before scrolling
    setTimeout(() => {
      scrollToFoodDisplay();
    }, 100);
  }

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If searching, set category to "all" to show all matching results
    if (query.trim()) {
      setCategory("all");
    }
    
    // REMOVED: Auto-scroll functionality that was causing the issue
    // The user can manually scroll or click categories to navigate
  }

  const handleClearSearch = () => {
    clearSearch();
  }

  const checkScrollArrows = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      // Show left arrow if we can scroll left
      setShowLeftArrow(scrollLeft > 0);
      
      // Show right arrow if we can scroll right
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  }

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Check arrows on initial load
      checkScrollArrows();
      
      // Add scroll event listener
      container.addEventListener('scroll', checkScrollArrows);
      
      // Add resize event listener to handle window resize
      window.addEventListener('resize', checkScrollArrows);
      
      // Cleanup event listeners
      return () => {
        container.removeEventListener('scroll', checkScrollArrows);
        window.removeEventListener('resize', checkScrollArrows);
      };
    }
  }, []);

  return (
    <div className="explore-menu" id="explore-menu">
      <h1>Explore our variety of pastries</h1>
      <p className="explore-menu-text">Choose from our diverse pastry options</p>
      
      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search for pastries..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <div className="search-icon">
              <img src={assets.search_icon} alt="Search" />
            </div>
            {searchQuery && (
              <button 
                onClick={handleClearSearch}
                className="clear-search-btn"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
      </div>

      <div className="explore-menu-list-container">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button 
            className="scroll-arrow scroll-arrow-left" 
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <img src={assets.scrollbarArrow_left} alt="Scroll left" />
          </button>
        )}
        
        {/* Right Arrow */}
        {showRightArrow && (
          <button 
            className="scroll-arrow scroll-arrow-right" 
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <img src={assets.scrollbarArrow_right} alt="Scroll right" />
          </button>
        )}
        
        <div className="explore-menu-list" ref={scrollContainerRef}>
          {category_list.map((item, index) => {
            return (
              <div 
                onClick={() => handleCategoryClick(item.menu_name)} 
                key={index} 
                className={`explore-menu-list-item ${searchQuery ? 'search-active' : ''}`}
              >
                <img 
                  className={category === item.menu_name ? "active" : ""} 
                  src={item.menu_image} 
                  alt={item.menu_name} 
                />
                <p className={category === item.menu_name ? "active" : ""}>{item.menu_name}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ExploreMenu