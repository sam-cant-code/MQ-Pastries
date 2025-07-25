import React, { useState, useContext, useEffect } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/assets'

const FoodDisplay = () => {
    const { 
        pastery_list, 
        cartItems, 
        addToCart, 
        removeFromCart, 
        decreaseQuantity,
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
    const [selectedVariations, setSelectedVariations] = useState({});

    const loadingMessages = [
        "Loading delicious pastries...",
        "Preparing fresh bakery items...",
        "Putting finishing touches...",
        "Your treats are coming right up..."
    ];

    useEffect(() => {
        if (pastery_list && Array.isArray(pastery_list) && pastery_list.length > 0) {
            const initialVariations = {};
            pastery_list.forEach(item => {
                if (item.variations && Object.keys(item.variations).length > 0) {
                    const firstVariation = Object.keys(item.variations)[0];
                    initialVariations[item._id] = firstVariation;
                }
            });
            setSelectedVariations(initialVariations);
        }
    }, [pastery_list]);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isLoading, loadingMessages.length]);

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

    const handleVariationChange = (itemId, variationKey) => {
        setSelectedVariations(prev => ({
            ...prev,
            [itemId]: variationKey
        }));
    };

    const getCurrentPrice = (item) => {
        if (item.variations && Object.keys(item.variations).length > 0) {
            const selectedVariation = selectedVariations[item._id];
            if (selectedVariation && item.variations[selectedVariation] !== undefined) {
                return item.variations[selectedVariation];
            }
            const firstVariation = Object.keys(item.variations)[0];
            return item.variations[firstVariation];
        }
        return item.price || 0;
    };

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        const newToast = { id, message, type, isVisible: false };
        setToasts([newToast]);
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

    const removeToast = (id) => {
        setToasts(prev => prev.map(toast =>
            toast.id === id ? { ...toast, isVisible: false } : toast
        ));
        setTimeout(() => {
            setToasts([]);
        }, 300);
    };

    const handleAddToCart = (itemId, itemName, variationKey) => {
        try {
            addToCart(itemId, variationKey);
            const variationLabel = variationKey ? ` (${variationKey})` : '';
            showToast(`${itemName}${variationLabel} added to cart!`, 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast('Error adding to cart', 'error');
        }
    };

    const handleDecreaseQuantity = (cartKey, itemName, variationKey) => {
        try {
            const itemId = cartKey.includes('_') ? cartKey.split('_')[0] : cartKey;
            const decodedVariationKey = variationKey ? decodeURIComponent(variationKey) : null;
            if (decreaseQuantity) {
                decreaseQuantity(itemId, decodedVariationKey);
            } else {
                removeFromCart(itemId, decodedVariationKey);
            }
            const variationLabel = variationKey ? ` (${decodeURIComponent(variationKey)})` : '';
            showToast(`Decreased quantity of ${itemName}${variationLabel}`, 'info');
        } catch (error) {
            console.error('Error decreasing quantity:', error);
            showToast('Error updating quantity', 'error');
        }
    };

    const getDisplayTitle = () => {
        if (searchQuery) {
            return `Search Results for "${searchQuery}"`;
        }
        if (category === "all") {
            return "All Pastries";
        }
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

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
        <div className='food-display-wrapper'>
            <div className='food-display' id='food-display'>
                <div className="toast-container-bottom">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`toast-bottom toast-${toast.type} ${toast.isVisible ? 'toast-visible' : ''}`}
                        >
                            <div className="toast-content">
                                <div className="toast-icon">
                                    {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}
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
                            const currentVariation = selectedVariations[item._id] || 
                                                     (item.variations && Object.keys(item.variations).length > 0 ? 
                                                      Object.keys(item.variations)[0] : null);
                            
                            const cartKey = currentVariation ? 
                                `${item._id}_${encodeURIComponent(currentVariation)}` : 
                                item._id;
                            
                            const currentCart = cartItems && typeof cartItems === 'object' ? cartItems : {};
                            const currentCount = currentCart[cartKey] || 0;

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
                                                <div className='add' onClick={() => handleAddToCart(item._id, item.name, currentVariation)}>
                                                    Add +
                                                </div>
                                            ) : (
                                                <div className='food-item-counter'>
                                                    <div
                                                        onClick={() => handleDecreaseQuantity(cartKey, item.name, currentVariation)}
                                                        className='counter-btn minus-btn'
                                                    >
                                                        −
                                                    </div>
                                                    <p>{currentCount}</p>
                                                    <div 
                                                        onClick={() => handleAddToCart(item._id, item.name, currentVariation)}
                                                        className='counter-btn plus-btn'
                                                    >
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
                                        
                                        {item.variations && Object.keys(item.variations).length > 0 && (
                                            <div className='variations-container'>
                                                <select 
                                                    className='variations-dropdown'
                                                    value={selectedVariations[item._id] || Object.keys(item.variations)[0]}
                                                    onChange={(e) => handleVariationChange(item._id, e.target.value)}
                                                >
                                                    {Object.entries(item.variations).map(([key, price]) => (
                                                        <option key={key} value={key}>
                                                            {key}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        
                                        <div className='price-container'>
                                            <p className='food-item-price'>₹{getCurrentPrice(item)}</p>
                                            {/* ✅ CHANGED: Logic to display variation or unit */}
                                            {item.variations && Object.keys(item.variations).length > 0 ? (
                                                <p className='food-item-unit'>per {currentVariation}</p>
                                            ) : (
                                                <p className='food-item-unit'>{item.unit || "per unit"}</p>
                                            )}
                                        </div>
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
        </div>
    )
}

export default FoodDisplay
