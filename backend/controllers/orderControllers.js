import orderModel from "../models/OrderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto"; // <-- Use ES module import

const razorPay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const placeOrder = async (req, res) => {
    const frontend_url = "https://mq-pastries-7qdw.onrender.com/";

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
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

const verifyOrder = async(req,res) =>{
    const {orderId, success} = req.body;
    try{
        if(success=="true"){
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            res.json({success:true, message:"Paid"})
        }
        else{
            await orderModel.findByIdAndDelete(orderId, {payment:false});
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

export { placeOrder, verifyPayment, verifyOrder };

