import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    // 🛒 Load cart items from localStorage on initialization
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem("cartItems");
            return savedCart ? JSON.parse(savedCart) : {};
        } catch (error) {
            console.error("Error loading cart from localStorage:", error);
            return {};
        }
    });

    const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    // 🔐 Load token and name from localStorage
    const [token, setToken] = useState(() => localStorage.getItem("token") || "");
    const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");
    
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

    // 🛒 Save cart items to localStorage whenever cartItems changes
    useEffect(() => {
        try {
            localStorage.setItem("cartItems", JSON.stringify(cartItems));
        } catch (error) {
            console.error("Error saving cart to localStorage:", error);
        }
    }, [cartItems]);

    // 🔄 Sync token and name to localStorage
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    useEffect(() => {
        if (userName) {
            localStorage.setItem("userName", userName);
        } else {
            localStorage.removeItem("userName");
        }
    }, [userName]);

    // 🔄 Load cart data from server (for logged-in users)
    const fetchCartList = async (token) => {
        try {
            const response = await axios.post(url+"/api/cart/get", {}, {headers:{token}});
            setCartItems(response.data.cartData);
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

    // 🛒 Helper function to create cart key
    const createCartKey = (itemId, variationKey = null) => {
        return variationKey ? `${itemId}_${variationKey}` : itemId;
    };

    // 🛒 Helper function to parse cart key
    const parseCartKey = (cartKey) => {
        if (cartKey.includes('_')) {
            const [itemId, variationKey] = cartKey.split('_');
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
        
        setCartItems((prev) => ({
            ...prev,
            [cartKey]: (prev[cartKey] || 0) + 1
        }));
        
        if(token){
            // You may need to update your backend API to handle variations
            await axios.post(url+"/api/cart/add", {
                itemId, 
                variationKey,
                cartKey
            }, {headers:{token}})
        }
    };

    const removeFromCart = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
            const { [cartKey]: removed, ...rest } = prev;
            return rest;
        });
        
        if(token){
            await axios.post(url+"/api/cart/remove", {
                itemId,
                variationKey,
                cartKey
            }, {headers:{token}})
        }
    };

    // ✅ Updated decreaseQuantity function with variation support
    const decreaseQuantity = async (itemId, variationKey = null) => {
        const cartKey = createCartKey(itemId, variationKey);
        
        setCartItems((prev) => {
            const currentQuantity = prev[cartKey] || 0;
            if (currentQuantity <= 1) {
                // Remove item completely if quantity would become 0 or less
                const { [cartKey]: removed, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [cartKey]: currentQuantity - 1
            };
        });
        
        // Sync with server if logged in
        if(token){
            await axios.post(url+"/api/cart/decrease", {
                itemId,
                variationKey,
                cartKey
            }, {headers:{token}})
        }
    };

    // 🗑️ Clear entire cart
    const clearCart = () => {
        setCartItems({});
    };

    // 💰 Updated calculate total cart amount with variation support
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        if (!pastery_list || !Array.isArray(pastery_list)) return totalAmount;

        for (const cartKey in cartItems) {
            if (cartItems[cartKey] > 0) {
                const { itemId, variationKey } = parseCartKey(cartKey);
                const itemPrice = getItemPrice(itemId, variationKey);
                totalAmount += itemPrice * cartItems[cartKey];
            }
        }
        return totalAmount;
    };

    // 🔢 Calculate total cart items
    const getTotalCartItems = () => {
        let totalItems = 0;
        for (const cartKey in cartItems) {
            if (cartItems[cartKey] > 0) {
                totalItems += cartItems[cartKey];
            }
        }
        return totalItems;
    };

    // 🛒 Get cart items with their details (including variations)
    const getCartItemsWithDetails = () => {
        const cartItemsArray = [];
        
        for (const cartKey in cartItems) {
            if (cartItems[cartKey] > 0) {
                const { itemId, variationKey } = parseCartKey(cartKey);
                const item = pastery_list.find(product => product._id === itemId);
                
                if (item) {
                    cartItemsArray.push({
                        ...item,
                        cartKey,
                        quantity: cartItems[cartKey],
                        variationKey,
                        currentPrice: getItemPrice(itemId, variationKey),
                        totalPrice: getItemPrice(itemId, variationKey) * cartItems[cartKey]
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