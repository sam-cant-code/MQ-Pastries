import orderModel from "../models/OrderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorPay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const placeOrder = async (req, res) => {
    const frontend_url = "https://mq-pastries-7qdw.onrender.com/";

    try {
        console.log("Received order request:", req.body);
        console.log("Items received:", req.body.items);

        // Transform items to match the new schema structure
        const transformedItems = req.body.items.map(item => ({
            _id: item._id || item.id, // Use _id if available, fallback to id
            name: item.name,
            description: item.description || "",
            image: item.image || "",
            price: item.price,
            quantity: item.quantity,
            // FIXED: Use selectedVariation instead of variation
            variation: item.selectedVariation || item.variation || item.size || "Regular",
            category: item.category || ""
        }));

        console.log("Transformed items:", transformedItems);

        const newOrder = new orderModel({
            userId: req.body.userId,
            items: transformedItems,
            amount: req.body.amount,
            address: req.body.address
        });
        
        await newOrder.save();
        console.log("Order saved successfully:", newOrder._id);

        await userModel.findByIdAndUpdate(req.body.userId, { cartdata: {} });

        // Calculate total amount in paisa (Razorpay uses smallest currency unit)
        const totalAmount = (req.body.amount + 0) * 100; // +2 for delivery charges, *100 for paisa

        // Create Razorpay order
        const options = {
            amount: totalAmount, // amount in paisa
            currency: "INR",
            receipt: `order_${newOrder._id}`,
            notes: {
                orderId: newOrder._id.toString(),
                userId: req.body.userId
            }
        };

        console.log("Creating Razorpay order with options:", options);
        const razorpayOrder = await razorPay.orders.create(options);
        console.log("Razorpay order created:", razorpayOrder.id);

        res.json({
            success: true,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            orderId: newOrder._id
        });

    } catch (error) {
        console.log("Error in placeOrder:", error);
        res.json({ success: false, message: "Error creating order" });
    }
};

const verifyOrder = async(req,res) => {
    const {orderId, success} = req.body;
    try{
        if(success=="true"){
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            res.json({success:true, message:"Paid"})
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false, message:"Not Paid"})
        }
    }
    catch(error){
        console.log(error);
        res.json({success:false, message:"Error"})
    }
}

// Payment verification function
const verifyPayment = async (req, res) => {
    try {
        console.log("Payment verification request body:", req.body);
        console.log("Headers:", req.headers);
        
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
        
        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            console.log("Missing required fields for payment verification");
            return res.json({ 
                success: false, 
                message: "Missing required fields for payment verification" 
            });
        }
        
        console.log("Verifying payment with:");
        console.log("Order ID:", razorpay_order_id);
        console.log("Payment ID:", razorpay_payment_id);
        console.log("Signature:", razorpay_signature);
        console.log("Database Order ID:", orderId);
        
        // Verify payment signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');
        
        console.log("Generated signature:", generated_signature);
        console.log("Received signature:", razorpay_signature);
        console.log("Signatures match:", generated_signature === razorpay_signature);

        if (generated_signature === razorpay_signature) {
            // Payment is verified, update order status
            console.log("Payment verified successfully, updating order:", orderId);
            
            const updatedOrder = await orderModel.findByIdAndUpdate(
                orderId, 
                { payment: true }, 
                { new: true }
            );
            
            if (!updatedOrder) {
                console.log("Order not found for ID:", orderId);
                return res.json({ 
                    success: false, 
                    message: "Order not found" 
                });
            }
            
            console.log("Order updated successfully:", updatedOrder._id);
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            console.log("Payment signature verification failed");
            res.json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.log("Error in payment verification:", error);
        res.json({ success: false, message: "Payment verification failed: " + error.message });
    }
};

// FIXED: Remove the populate call since items are embedded documents
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.body.userId})
            .sort({ date: -1 }); // Sort by newest first
        
        console.log("User orders fetched:", orders.length);
        if (orders.length > 0) {
            console.log("First order items:", orders[0].items);
        }
        
        res.json({success:true, data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error fetching user orders"})
    }
}

// FIXED: Remove the populate call for items since they're embedded documents
const allUserOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({})
            .populate('userId', 'name email') // Only populate user details
            .sort({ date: -1 }); // Sort by newest first
        
        console.log("All orders fetched:", orders.length);
        
        res.json({success:true, data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error fetching all orders"})
    }
}

// Additional function to update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        const validStatuses = ["Order Processing", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
        
        if (!validStatuses.includes(status)) {
            return res.json({ success: false, message: "Invalid status" });
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId, 
            { status: status }, 
            { new: true }
        );

        if (!updatedOrder) {
            return res.json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating order status" });
    }
};

export { placeOrder, verifyPayment, verifyOrder, userOrders, allUserOrders, updateOrderStatus };
