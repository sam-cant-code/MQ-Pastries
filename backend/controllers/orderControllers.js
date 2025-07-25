// models/OrderModel.js
import orderModel from "../models/OrderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorPay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// ✅ No changes needed here, but the cart clearing logic is moved out
const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id; 

        if (!req.body.items || !req.body.amount || !req.body.address) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newOrder = new orderModel({
            userId: userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            status: "Order Processing",
            date: new Date(),
            payment: false
        });
        
        await newOrder.save();
        
        // ❌ REMOVED: Do NOT clear the cart here. Clear it after successful payment.
        // await userModel.findByIdAndUpdate(userId, { cartData: {} });

        const totalAmountInPaisa = req.body.amount * 100;

        const options = {
            amount: totalAmountInPaisa,
            currency: "INR",
            receipt: `order_${newOrder._id}`,
            notes: {
                orderId: newOrder._id.toString(),
                userId: userId
            }
        };

        const razorpayOrder = await razorPay.orders.create(options);

        res.json({
            success: true,
            order_id: razorpayOrder.id, // This is Razorpay's order ID
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            orderId: newOrder._id // This is your database order ID
        });

    } catch (error) {
        console.log("Error in placeOrder:", error);
        res.status(500).json({ success: false, message: "Error creating order" });
    }
};


// ✅ REPLACED: This is the new, secure verification function.
const processPaymentVerification = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { orderId } = req.query; // Get your DB orderId from the query parameter
    const userId = req.user.id; // Get userId from auth middleware

    try {
        // Step 1: Verify the signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) {
            // If signature is invalid, it's a fraudulent request.
            return res.status(400).json({ success: false, message: "Invalid payment signature. Request denied." });
        }

        // Step 2: Signature is valid. Update the order in your database.
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        
        order.payment = true;
        order.status = "Food Processing"; // Or any initial paid status
        await order.save();

        // Step 3: Clear the user's cart now that payment is confirmed.
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        res.json({ success: true, message: "Payment verified and order updated." });

    } catch (error) {
        console.error("Error in processPaymentVerification:", error);
        res.status(500).json({ success: false, message: "Internal server error during payment verification." });
    }
};

// ❌ DEPRECATED: This function is insecure and should be deleted.
// const verifyOrder = async(req, res) => { ... }


// --- Other functions remain the same ---

const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId: req.user.id}).sort({ date: -1 });
        res.json({success:true, data:orders})
    } catch (error) {
        res.status(500).json({success:false, message:"Error fetching user orders"})
    }
}

const allUserOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 });
        res.json({success:true, data:orders})
    } catch (error) {
        res.status(500).json({success:false, message:"Error fetching all orders"})
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        const validStatuses = ["Order Processing", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status: status }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Order status updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating order status" });
    }
};

export { placeOrder, processPaymentVerification, userOrders, allUserOrders, updateOrderStatus };