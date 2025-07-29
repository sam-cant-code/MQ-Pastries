import userModel from "../models/userModel.js";

// Add item to user cart
const addToCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);

        // Add this check!
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let cartData = await userData.cartData;
        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = 1;
        } else {
            cartData[req.body.itemId] += 1;
        }
        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: "Added to Cart" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error adding to cart" });
    }
};

// Remove item from user cart
const removeFromCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let cartData = userData.cartData;

        if (cartData[req.body.itemId] > 0) {
            cartData[req.body.itemId] -= 1;
            // If quantity becomes zero, delete the item from the cart
            if (cartData[req.body.itemId] === 0) {
                delete cartData[req.body.itemId];
            }
        } else {
            // It's good practice to let the frontend know if the item wasn't in the cart
            return res.json({ success: false, message: "Item not in cart" });
        }

        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: "Removed from Cart" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error removing from cart" });
    }
};

// Get user cart data
const getCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let cartData = await userData.cartData;
        res.json({ success: true, cartData });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error fetching cart" });
    }
};

export { addToCart, removeFromCart, getCart };