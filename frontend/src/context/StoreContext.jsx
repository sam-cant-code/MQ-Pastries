import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    // 🛒 Load cart items from localStorage on initialization - FIXED
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem("cartItems");
            // Check if savedCart exists and is not "undefined" string
            if (savedCart && savedCart !== "undefined" && savedCart !== "null") {
                return JSON.parse(savedCart);
            }
            return {};
        } catch (error) {
            console.error("Error loading cart from localStorage:", error);
            return {};
        }
    });

    const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    // 🔐 Load token and name from localStorage - FIXED
    const [token, setToken] = useState(() => {
        const savedToken = localStorage.getItem("token");
        return (savedToken && savedToken !== "null" && savedToken !== "undefined") ? savedToken : "";
    });
    
    const [userName, setUserName] = useState(() => {
        const savedName = localStorage.getItem("userName");
        return (savedName && savedName !== "null" && savedName !== "undefined") ? savedName : "";
    });
    
    // 🔄 Login popup state
    const [showLogin, setShowLogin] = useState(false);

    // 🍰 Dynamic pastry list from backend
    const [pastery_list, setPasteryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔍 Search and filter states - NEW
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState("all");

    // 🔄 Fetch food list from backend
    const fetchFoodList = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(`${url}/api/food/list`);
            
            if (response.data.success && response.data.data) {
                setPasteryList(response.data.data);
                console.log("Food list fetched successfully:", response.data.data.length, "items");
            } else {
                console.error("Failed to fetch food list:", response.data.message);
                setError("Failed to load products");
                setPasteryList([]); // Set empty array as fallback
            }
        } catch (error) {
            console.error("Error fetching food list:", error);
            setError("Network error - unable to load products");
            setPasteryList([]); // Set empty array as fallback
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchFoodList();
            // If user is logged in, load cart from server
            if (token) {
                await fetchCartList(token);
            }
        };
        loadData();
    }, [url, token]); // Re-fetch if URL or token changes

    // 🛒 Save cart items to localStorage whenever cartItems changes - FIXED
    useEffect(() => {
        try {
            if (cartItems && typeof cartItems === 'object') {
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            }
        } catch (error) {
            console.error("Error saving cart to localStorage:", error);
        }
    }, [cartItems]);

    // 🔄 Sync token and name to localStorage - FIXED
    useEffect(() => {
        if (token && token !== "undefined" && token !== "null") {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    useEffect(() => {
        if (userName && userName !== "undefined" && userName !== "null") {
            localStorage.setItem("userName", userName);
        } else {
            localStorage.removeItem("userName");
        }
    }, [userName]);

    // 🔄 Load cart data from server (for logged-in users)
    const fetchCartList = async (token) => {
        try {
            const response = await axios.post(url+"/api/cart/get", {}, {headers:{token}});
            if (response.data.cartData) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.error("Error loading cart from server:", error);
        }
    };

    // 🔓 Logout function clears everything
    const logout = () => {
        setToken("");
        setUserName("");
        setCartItems({});
        setSearchQuery(""); // Clear search on logout
        setCategory("all"); // Reset category on logout
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("cartItems"); // Clear cart from localStorage too
    };

    // 🛒 Helper function to create cart key - FIXED to handle special characters
    const createCartKey = (itemId, variationKey = null) => {
        if (variationKey) {
            // Encode special characters to avoid issues
            const encodedVariation = encodeURIComponent(variationKey);
            return `${itemId}_${encodedVariation}`;
        }
        return itemId;
    };

    // 🛒 Helper function to parse cart key - FIXED
    const parseCartKey = (cartKey) => {
        if (cartKey.includes('_')) {
            const parts = cartKey.split('_');
            const itemId = parts[0];
            const encodedVariation = parts.slice(1).join('_'); // Handle multiple underscores
            const variationKey = decodeURIComponent(encodedVariation);
            return { itemId, variationKey };
        }
        return { itemId: cartKey, variationKey: null };
    };

    // 🛒 Get item price for specific variation
    const getItemPrice = (itemId, variationKey = null) => {
        const item = pastery_list.find(product => product._id === itemId);
        if (!item) return 0;
        
        if (variationKey && item.variations && item.variations[variationKey] !== undefined) {
            return item.variations[variationKey];
        }
        
        return item.price || 0;
    };

    // 🛒 Updated cart management functions with variation support
    const addToCart = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
            // Ensure prev is an object
            const currentCart = prev && typeof prev === 'object' ? prev : {};
            return {
                ...currentCart,
                [cartKey]: (currentCart[cartKey] || 0) + 1
            };
        });
        
        if(token){
            try {
                // You may need to update your backend API to handle variations
                await axios.post(url+"/api/cart/add", {
                    itemId, 
                    variationKey,
                    cartKey
                }, {headers:{token}})
            } catch (error) {
                console.error("Error adding to cart on server:", error);
            }
        }
    };

    const removeFromCart = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
            // Ensure prev is an object
            const currentCart = prev && typeof prev === 'object' ? prev : {};
            const { [cartKey]: removed, ...rest } = currentCart;
            return rest;
        });
        
        if(token){
            try {
                await axios.post(url+"/api/cart/remove", {
                    itemId,
                    variationKey,
                    cartKey
                }, {headers:{token}})
            } catch (error) {
                console.error("Error removing from cart on server:", error);
            }
        }
    };

    // ✅ Updated decreaseQuantity function with variation support
    const decreaseQuantity = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
            // Ensure prev is an object
            const currentCart = prev && typeof prev === 'object' ? prev : {};
            const currentQuantity = currentCart[cartKey] || 0;
            
            if (currentQuantity <= 1) {
                // Remove item completely if quantity would become 0 or less
                const { [cartKey]: removed, ...rest } = currentCart;
                return rest;
            }
            return {
                ...currentCart,
                [cartKey]: currentQuantity - 1
            };
        });
        
        // Sync with server if logged in
        if(token){
            try {
                await axios.post(url+"/api/cart/decrease", {
                    itemId,
                    variationKey,
                    cartKey
                }, {headers:{token}})
            } catch (error) {
                console.error("Error decreasing quantity on server:", error);
            }
        }
    };

    // 🗑️ Clear entire cart
    const clearCart = () => {
        setCartItems({});
    };

    // 💰 Updated calculate total cart amount with variation support - FIXED
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        if (!pastery_list || !Array.isArray(pastery_list)) return totalAmount;
        
        // Ensure cartItems is an object
        const currentCart = cartItems && typeof cartItems === 'object' ? cartItems : {};

        for (const cartKey in currentCart) {
            if (currentCart[cartKey] > 0) {
                const { itemId, variationKey } = parseCartKey(cartKey);
                const itemPrice = getItemPrice(itemId, variationKey);
                totalAmount += itemPrice * currentCart[cartKey];
            }
        }
        return totalAmount;
    };

    // 🔢 Calculate total cart items - FIXED
    const getTotalCartItems = () => {
        let totalItems = 0;
        // Ensure cartItems is an object
        const currentCart = cartItems && typeof cartItems === 'object' ? cartItems : {};
        
        for (const cartKey in currentCart) {
            if (currentCart[cartKey] > 0) {
                totalItems += currentCart[cartKey];
            }
        }
        return totalItems;
    };

    // 🛒 Get cart items with their details (including variations) - FIXED
    const getCartItemsWithDetails = () => {
        const cartItemsArray = [];
        // Ensure cartItems is an object
        const currentCart = cartItems && typeof cartItems === 'object' ? cartItems : {};
        
        for (const cartKey in currentCart) {
            if (currentCart[cartKey] > 0) {
                const { itemId, variationKey } = parseCartKey(cartKey);
                const item = pastery_list.find(product => product._id === itemId);
                
                if (item) {
                    cartItemsArray.push({
                        ...item,
                        cartKey,
                        quantity: currentCart[cartKey],
                        variationKey,
                        currentPrice: getItemPrice(itemId, variationKey),
                        totalPrice: getItemPrice(itemId, variationKey) * currentCart[cartKey]
                    });
                }
            }
        }
        
        return cartItemsArray;
    };

    // 🔄 Function to refresh product list (useful after adding new products)
    const refreshFoodList = async () => {
        await fetchFoodList();
    };

    // 🔍 Search and filter functions - NEW
    const getFilteredItems = () => {
        if (!pastery_list || !Array.isArray(pastery_list)) return [];

        return pastery_list.filter((item) => {
            // Category filter
            const matchesCategory = category === "all" || category === item.category;
            
            // Search filter
            const matchesSearch = !searchQuery || 
                item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesCategory && matchesSearch;
        });
    };

    // Clear search function
    const clearSearch = () => {
        setSearchQuery("");
        setCategory("all");
    };

    const contextValue = {
        pastery_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        decreaseQuantity,
        clearCart,
        getTotalCartAmount,
        getTotalCartItems,
        getCartItemsWithDetails,
        url,
        token,
        setToken,
        userName,
        setUserName,
        logout,
        showLogin,
        setShowLogin,
        // 🆕 New properties for dynamic data
        loading,
        error,
        refreshFoodList,
        fetchFoodList,
        fetchCartList,
        // 🔍 Search and filter properties - NEW
        searchQuery,
        setSearchQuery,
        category,
        setCategory,
        getFilteredItems,
        clearSearch,
        // 🛒 New variation helper functions
        createCartKey,
        parseCartKey,
        getItemPrice
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;