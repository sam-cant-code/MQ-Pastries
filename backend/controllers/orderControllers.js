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
        // Transform items to match the new schema structure
        const transformedItems = req.body.items.map(item => ({
            _id: item._id || item.id, // Use _id if available, fallback to id
            name: item.name,
            description: item.description || "",
            image: item.image || "",
            price: item.price,
            quantity: item.quantity,
            variation: item.variation || item.size || "Regular", // Handle variation/size
            category: item.category || ""
        }));

        const newOrder = new orderModel({
            userId: req.body.userId,
            items: transformedItems,
            amount: req.body.amount,
            address: req.body.address
        });
        
        await newOrder.save();
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

        const razorpayOrder = await razorPay.orders.create(options);

        res.json({
            success: true,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            orderId: newOrder._id
        });

    } catch (error) {
        console.log(error);
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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
        
        // Verify payment signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            // Payment is verified, update order status
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Payment verification failed" });
    }
};

const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.body.userId})
            .populate('items._id', 'name description image category') // Populate food item details
            .sort({ date: -1 }); // Sort by newest first
        res.json({success:true, data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error fetching user orders"})
    }
}

const allUserOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({})
            .populate('items._id', 'name description image category') // Populate food item details
            .populate('userId', 'name email') // Populate user details
            .sort({ date: -1 }); // Sort by newest first
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