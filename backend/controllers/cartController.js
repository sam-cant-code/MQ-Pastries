import userModel from "../models/userModel.js";

// Add item to user cart
const addToCart = async (req, res) => {
    try {
        // ✅ CHANGED: Use req.user.id from the authentication middleware
        let userData = await userModel.findById(req.user.id);

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let cartData = await userData.cartData;
        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = 1;
        } else {
            cartData[req.body.itemId] += 1;
        }
        
        // ✅ CHANGED: Use req.user.id to update the correct user
        await userModel.findByIdAndUpdate(req.user.id, { cartData });
        res.json({ success: true, message: "Added to Cart" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error adding to cart" });
    }
};

// Remove item from user cart
const removeFromCart = async (req, res) => {
    try {
        // ✅ CHANGED: Use req.user.id from the authentication middleware
        let userData = await userModel.findById(req.user.id);

        if (!userData) {
            return res.status(404).json({ success: false, message: "Could not process cart request. Please try again." });
        }

        let cartData = userData.cartData;

        if (cartData[req.body.itemId] > 0) {
            cartData[req.body.itemId] -= 1;
            if (cartData[req.body.itemId] === 0) {
                delete cartData[req.body.itemId];
            }
        } else {
            return res.json({ success: false, message: "Could not process cart request. Please try again." });
        }
        
        // ✅ CHANGED: Use req.user.id to update the correct user
        await userModel.findByIdAndUpdate(req.user.id, { cartData });
        res.json({ success: true, message: "Removed from Cart" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error removing from cart" });
    }
};

// Get user cart data
const getCart = async (req, res) => {
    try {
        // ✅ CHANGED: Use req.user.id from the authentication middleware
        let userData = await userModel.findById(req.user.id);

        if (!userData) {
            return res.status(404).json({ success: false, message: "Could not process cart request. Please try again." });
        }

        let cartData = await userData.cartData;
        res.json({ success: true, cartData });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error fetching cart" });
    }
};

export { addToCart, removeFromCart, getCart };