import React, { useContext, useState, useEffect } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/assets'


const FoodDisplay = () => {
    const { 
        pastery_list, 
        cartItems, 
        addToCart, 
        removeFromCart, 
        url,
        searchQuery,
        category,
        getFilteredItems,
        loading,
        error
    } = useContext(StoreContext);

    const [showBackButton, setShowBackButton] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        "Loading delicious pastries...",
        "Preparing fresh bakery items...",
        "Putting finishing touches...",
        "Your treats are coming right up..."
    ];

    // Cycle through loading messages
    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [isLoading, loadingMessages.length]);

    // Show back button when near bottom of page
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

    // Handle loading state
    useEffect(() => {
        if (pastery_list && Array.isArray(pastery_list) && pastery_list.length > 0) {
            const timer = setTimeout(() => {
                setIsLoading(false);
                setLoadingMessageIndex(0);
            }, 500);
            
            return () => clearTimeout(timer);
        } else if (!loading) {
            setIsLoading(false);
        }
    }, [pastery_list, loading]);

    // Show toast message
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        const newToast = { id, message, type, isVisible: false };

        setToasts(prev => [...prev, newToast]);

        setTimeout(() => {
            setToasts(prev => prev.map(toast =>
                toast.id === id ? { ...toast, isVisible: true } : toast
            ));
        }, 100);

        setTimeout(() => {
            setToasts(prev => prev.map(toast =>
                toast.id === id ? { ...toast, isVisible: false } : toast
            ));

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

    // Add to cart with toast
    const handleAddToCart = (itemId, itemName) => {
        addToCart(itemId);
        showToast(`${itemName} added to cart!`, 'success');
    };

    // Remove from cart with toast
    const handleRemoveFromCart = (itemId, itemName) => {
        removeFromCart(itemId);
        showToast(`${itemName} removed from cart!`, 'info');
    };

    // Get display title based on category and search
    const getDisplayTitle = () => {
        if (searchQuery) {
            return `Search Results for "${searchQuery}"`;
        }
        if (category === "all") {
            return "All Pastries";
        }
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    // Scroll back to menu
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

    // Loading component
    const LoadingComponent = () => (
        <div className="loading-container">
            <div className="loading-spinner">
                <div className="loading-text">{loadingMessages[loadingMessageIndex]}</div>
                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );

    // Error component
    const ErrorComponent = () => (
        <div className="error-container">
            <div className="error-content">
                <div className="error-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="retry-btn">
                    Try Again
                </button>
            </div>
        </div>
    );

    if (isLoading || loading) {
        return (
            <div className='food-display' id='food-display'>
                <LoadingComponent />
            </div>
        );
    }

    if (error) {
        return (
            <div className='food-display' id='food-display'>
                <ErrorComponent />
            </div>
        );
    }

    const filteredItems = getFilteredItems();

    return (
        <div className='food-display' id='food-display'>
            {/* Toast Container */}
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
                {searchQuery && (
                    <p className="search-results-count">
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                    </p>
                )}
            </div>

            {filteredItems.length === 0 ? (
                <div className="no-results">
                    <div className="no-results-content">
                        {/* <div className="no-results-icon"><img src={assets.search_icon} alt="" /></div> */}
                        <h3>No items found</h3>
                        <p>
                            {searchQuery 
                                ? `No pastries match "${searchQuery}". Try a different search term.`
                                : "No items available in this category."
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className='food-display-list'>
                    {filteredItems.map((item, index) => {
                        const currentCount = cartItems[item._id] || 0;

                        const imgSrc = item.image
                            ? item.image.startsWith('http')
                                ? item.image
                                : `${url}/images/${item.image.replace(/^\/+/, '')}`
                            : '';

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
                    })}
                </div>
            )}

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