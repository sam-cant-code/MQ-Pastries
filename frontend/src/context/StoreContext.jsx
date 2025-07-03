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
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("cartItems"); // Clear cart from localStorage too
    };

    // 🛒 Cart management functions
    const addToCart = async (itemId) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1
        }));
        if(token){
            await axios.post(url+"/api/cart/add", {itemId}, {headers:{token}})
        }
    };

    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
        if(token){
            await axios.post(url+"/api/cart/remove", {itemId}, {headers:{token}})
        }
    };

    // ✅ Added missing decreaseQuantity function
    const decreaseQuantity = async (itemId) => {
        setCartItems((prev) => {
            const currentQuantity = prev[itemId] || 0;
            if (currentQuantity <= 1) {
                // Remove item completely if quantity would become 0 or less
                const { [itemId]: removed, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [itemId]: currentQuantity - 1
            };
        });
        
        // Sync with server if logged in
        if(token){
            await axios.post(url+"/api/cart/remove", {itemId}, {headers:{token}})
        }
    };

    // 🗑️ Clear entire cart
    const clearCart = () => {
        setCartItems({});
    };

    // 💰 Calculate total cart amount
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        if (!pastery_list || !Array.isArray(pastery_list)) return totalAmount;

        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = pastery_list.find((product) => product._id === item);
                if (itemInfo) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }
        return totalAmount;
    };

    // 🔢 Calculate total cart items
    const getTotalCartItems = () => {
        let totalItems = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                totalItems += cartItems[item];
            }
        }
        return totalItems;
    };

    // 🔄 Function to refresh product list (useful after adding new products)
    const refreshFoodList = async () => {
        await fetchFoodList();
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
        fetchCartList
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;