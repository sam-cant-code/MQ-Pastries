import React, { useContext, useState, useEffect } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'

const FoodDisplay = ({ category }) => {
    // Always call hooks first!
    const { pastery_list, cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
    const [showBackButton, setShowBackButton] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Check if user has scrolled near the bottom of the page
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            const isNearBottom = scrollTop + windowHeight >= documentHeight - 200;
            setShowBackButton(isNearBottom);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Show loading message if pastery_list is missing or empty
    if (!pastery_list || !Array.isArray(pastery_list) || pastery_list.length === 0) {
        return <div className='food-display'>Loading food...</div>;
    }

    // Enhanced toast message function with slide-in animation
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        const newToast = { id, message, type, isVisible: false };

        setToasts(prev => [...prev, newToast]);

        // Trigger slide-in animation after a brief delay
        setTimeout(() => {
            setToasts(prev => prev.map(toast =>
                toast.id === id ? { ...toast, isVisible: true } : toast
            ));
        }, 100);

        // Auto remove toast after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.map(toast =>
                toast.id === id ? { ...toast, isVisible: false } : toast
            ));

            // Remove from DOM after animation completes
            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== id));
            }, 300);
        }, 3000);
    };

    // Remove toast manually
    const removeToast = (id) => {
        setToasts(prev => prev.map(toast =>
            toast.id === id ? { ...toast, isVisible: false } : toast
        ));

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 300);
    };

    // Enhanced add to cart with toast
    const handleAddToCart = (itemId, itemName) => {
        addToCart(itemId);
        showToast(`${itemName} added to cart!`, 'success');
    };

    // Enhanced remove from cart with toast
    const handleRemoveFromCart = (itemId, itemName) => {
        removeFromCart(itemId);
        showToast(`${itemName} removed from cart!`, 'info');
    };

    // Function to get display title based on category
    const getDisplayTitle = () => {
        if (category === "all") {
            return "All Pastries";
        }
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    // Function to scroll back to menu
    const scrollToMenu = () => {
        const menuSection = document.getElementById('explore-menu');
        if (menuSection) {
            const offsetTop = menuSection.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    return (
        <div className='food-display' id='food-display'>
            {/* Toast Container - Bottom Right */}
            <div className="toast-container-bottom">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast-bottom toast-${toast.type} ${toast.isVisible ? 'toast-visible' : ''}`}
                    >
                        <div className="toast-content">
                            <div className="toast-icon">
                                {toast.type === 'success' ? '✓' : 'ℹ'}
                            </div>
                            <span className="toast-message">{toast.message}</span>
                        </div>
                        <button
                            className="toast-close-btn"
                            onClick={() => removeToast(toast.id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="food-display-header">
                <h2>{getDisplayTitle()}</h2>
            </div>
            <div className='food-display-list'>
                {pastery_list.map((item, index) => {
                    if (category === "all" || category === item.category) {
                        if (!item._id) {
                            console.warn(`Item at index ${index} missing _id:`, item);
                        }
                        
                        const currentCount = cartItems[item._id] || 0;

                        // Compute image src and log for debugging
                        const imgSrc = item.image
                            ? item.image.startsWith('http')
                                ? item.image
                                : `${url}/images/${item.image.replace(/^\/+/, '')}`
                            : '';
                        // console.log('item.image:', item.image);
                        // console.log('img src:', imgSrc);

                        return (
                            <div key={item._id || index} className='food-item'>
                                <div className='food-item-img-container'>
                                    <img
                                        className='food-item-image'
                                        src={imgSrc}
                                        alt={item.name || 'Food item'}
                                        loading="lazy"
                                    />
                                    {
                                        currentCount === 0 ? (
                                            <div className='add' onClick={() => handleAddToCart(item._id, item.name)}>
                                                Add +
                                            </div>
                                        ) : (
                                            <div className='food-item-counter'>
                                                <div
                                                    onClick={() => {
                                                        if (currentCount > 0) handleRemoveFromCart(item._id, item.name);
                                                    }}
                                                    className={currentCount === 1 ? 'disabled' : ''}
                                                    style={{ opacity: currentCount === 0 ? 0.5 : 1, pointerEvents: currentCount === 0 ? 'none' : 'auto' }}
                                                >
                                                    −
                                                </div>
                                                <p>{currentCount}</p>
                                                <div onClick={() => handleAddToCart(item._id, item.name)}>
                                                    +
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                                <div className='food-item-info'>
                                    <div className='food-item-name-rating'>
                                        <p>{item.name || 'Unknown Item'}</p>
                                    </div>
                                    <p className='food-item-desc'>{item.description || 'No description'}</p>
                                    <p className='food-item-price'>₹{item.price || 0}</p>
                                    <p className='food-item-unit'>{item.unit || " per unit"}</p>
                                </div>
                            </div>
                        )
                    }
                    return null;
                })}
            </div>

            <button
                className={`back-button-scroll ${showBackButton ? 'show' : ''}`}
                onClick={scrollToMenu}
            >
                Back to Menu
            </button>
        </div>
    )
}

export default FoodDisplay