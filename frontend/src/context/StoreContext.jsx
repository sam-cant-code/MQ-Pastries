import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    // 🛒 Load cart items from localStorage on initialization
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem("cartItems");
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

    // 🔐 Initialize auth states from localStorage (NO userRole)
    const [token, setToken] = useState(() => {
        const savedToken = localStorage.getItem("token");
        return (savedToken && savedToken !== "null" && savedToken !== "undefined") ? savedToken : "";
    });
    
    const [userName, setUserName] = useState(() => {
        const savedName = localStorage.getItem("userName");
        return (savedName && savedName !== "null" && savedName !== "undefined") ? savedName : "";
    });

    // 🔐 Simplified initialization state
    const [isInitializing, setIsInitializing] = useState(false);
    
    // 🔄 Login popup state
    const [showLogin, setShowLogin] = useState(false);

    // 🍰 Dynamic pastry list from backend
    const [pastery_list, setPasteryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔍 Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState("all");

    // 🔐 Helper function to clear auth data
    const clearAuth = useCallback(() => {
        setToken("");
        setUserName("");
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole"); // Clean up old data
        console.log("🧹 Auth data cleared");
    }, []);

    // 🔐 Simplified user initialization
    useEffect(() => {
        const initializeUser = async () => {
            console.log("🔄 Initializing user...");
            
            const savedToken = localStorage.getItem("token");
            const savedName = localStorage.getItem("userName");
            
            // Clean up any old userRole data from localStorage
            localStorage.removeItem("userRole");
            
            if (savedToken && savedName && 
                savedToken !== "null" && savedName !== "null") {
                console.log("✅ Using cached token and name");
                setToken(savedToken);
                setUserName(savedName);
            } else if (savedToken && savedToken !== "null") {
                console.log("✅ Using cached token");
                setToken(savedToken);
            } else {
                console.log("❌ No valid auth data found");
                clearAuth();
            }
            
            setIsInitializing(false);
            console.log("🏁 User initialization complete");
        };

        initializeUser();
    }, [clearAuth]);

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
                setPasteryList([]);
            }
        } catch (error) {
            console.error("Error fetching food list:", error);
            setError("Network error - unable to load products");
            setPasteryList([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchFoodList();
            if (token) {
                await fetchCartList(token);
            }
        };
        loadData();
    }, [token]);

    // 🛒 Save cart items to localStorage whenever cartItems changes
    useEffect(() => {
        try {
            if (cartItems && typeof cartItems === 'object') {
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            }
        } catch (error) {
            console.error("Error saving cart to localStorage:", error);
        }
    }, [cartItems]);

    // 🔄 Sync token to localStorage
    useEffect(() => {
        if (token && token !== "undefined" && token !== "null") {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    // 🔄 Sync userName to localStorage
    useEffect(() => {
        if (userName && userName !== "undefined" && userName !== "null") {
            localStorage.setItem("userName", userName);
        } else {
            localStorage.removeItem("userName");
        }
    }, [userName]);

    // 🔄 Load cart data from server
    const fetchCartList = async (authToken) => {
        try {
            const response = await axios.post(url+"/api/cart/get", {}, {
                headers: { 
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.data.cartData) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.error("Error loading cart from server:", error);
        }
    };

    // 🔐 Login function (NO userRole storage)
    const login = async (userData, userToken) => {
        console.log("🔐 Starting login process:", userData);
        
        // Store only token and userName - NO role in localStorage
        localStorage.setItem("token", userToken);
        localStorage.setItem("userName", userData.name);
        
        // Update only token and userName state
        setToken(userToken);
        setUserName(userData.name);
        
        console.log("✅ Login state updated:", {
            token: !!userToken,
            name: userData.name
            // Role will be verified by ProtectedRoute when needed
        });
        
        try {
            // Load user's cart from server
            await fetchCartList(userToken);
        } catch (error) {
            console.error("Error loading cart after login:", error);
            // Don't fail login if cart loading fails
        }
        
        console.log("🎉 Login process complete");
    };

    // 🔓 Logout function
    const logout = () => {
        console.log("🔓 Logging out user");
        
        setToken("");
        setUserName("");
        setCartItems({});
        setSearchQuery("");
        setCategory("all");
        
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole"); // Clean up old data
        localStorage.removeItem("cartItems");
        
        console.log("✅ Logout complete");
    };

    // 🛒 Cart management functions
    const createCartKey = (itemId, variationKey = null) => {
        if (variationKey) {
            const encodedVariation = encodeURIComponent(variationKey);
            return `${itemId}_${encodedVariation}`;
        }
        return itemId;
    };

    const parseCartKey = (cartKey) => {
        if (cartKey.includes('_')) {
            const parts = cartKey.split('_');
            const itemId = parts[0];
            const encodedVariation = parts.slice(1).join('_');
            const variationKey = decodeURIComponent(encodedVariation);
            return { itemId, variationKey };
        }
        return { itemId: cartKey, variationKey: null };
    };

    const getItemPrice = (itemId, variationKey = null) => {
        const item = pastery_list.find(product => product._id === itemId);
        if (!item) return 0;
        
        if (variationKey && item.variations && item.variations[variationKey] !== undefined) {
            return item.variations[variationKey];
        }
        
        return item.price || 0;
    };

    const addToCart = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
            const currentCart = prev && typeof prev === 'object' ? prev : {};
            return {
                ...currentCart,
                [cartKey]: (currentCart[cartKey] || 0) + 1
            };
        });
        
        if(token){
            try {
                await axios.post(url+"/api/cart/add", {
                    itemId, 
                    variationKey,
                    cartKey
                }, {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                })
            } catch (error) {
                console.error("Error adding to cart on server:", error);
            }
        }
    };

    const removeFromCart = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
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
                }, {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                })
            } catch (error) {
                console.error("Error removing from cart on server:", error);
            }
        }
    };

    const decreaseQuantity = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
            const currentCart = prev && typeof prev === 'object' ? prev : {};
            const currentQuantity = currentCart[cartKey] || 0;
            
            if (currentQuantity <= 1) {
                const { [cartKey]: removed, ...rest } = currentCart;
                return rest;
            }
            return {
                ...currentCart,
                [cartKey]: currentQuantity - 1
            };
        });
        
        if(token){
            try {
                await axios.post(url+"/api/cart/decrease", {
                    itemId,
                    variationKey,
                    cartKey
                }, {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                })
            } catch (error) {
                console.error("Error decreasing quantity on server:", error);
            }
        }
    };

    const clearCart = () => {
        setCartItems({});
    };

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        if (!pastery_list || !Array.isArray(pastery_list)) return totalAmount;
        
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

    const getTotalCartItems = () => {
        let totalItems = 0;
        const currentCart = cartItems && typeof cartItems === 'object' ? cartItems : {};
        
        for (const cartKey in currentCart) {
            if (currentCart[cartKey] > 0) {
                totalItems += currentCart[cartKey];
            }
        }
        return totalItems;
    };

    const getCartItemsWithDetails = () => {
        const cartItemsArray = [];
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

    const refreshFoodList = async () => {
        await fetchFoodList();
    };

    const getFilteredItems = () => {
        if (!pastery_list || !Array.isArray(pastery_list)) return [];

        return pastery_list.filter((item) => {
            const matchesCategory = category === "all" || category === item.category;
            const matchesSearch = !searchQuery || 
                item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesCategory && matchesSearch;
        });
    };

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
        // Removed: userRole, setUserRole, isAdmin, isAuthenticated
        isInitializing,
        login,
        logout,
        showLogin,
        setShowLogin,
        loading,
        error,
        refreshFoodList,
        fetchFoodList,
        fetchCartList,
        searchQuery,
        setSearchQuery,
        category,
        setCategory,
        getFilteredItems,
        clearSearch,
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

export default StoreContextProvider