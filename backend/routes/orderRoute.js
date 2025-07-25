// routes/orderRouter.js
import { placeOrder, processPaymentVerification, userOrders, allUserOrders, updateOrderStatus } from "../controllers/orderControllers.js";
import express from 'express';
import { authenticateUser, adminAuth } from "../middleware/auth.js";

const orderRouter = express.Router();

// --- Admin-Only Routes ---
orderRouter.get("/list", adminAuth, allUserOrders);
orderRouter.put("/status", adminAuth, updateOrderStatus);

// --- Authenticated User Routes ---
orderRouter.post("/place", authenticateUser, placeOrder);
orderRouter.post("/userorders", authenticateUser, userOrders);

// ✅ NEW SECURE ROUTE: This route is protected and performs signature verification.
// The URL will look like: /api/order/verify-payment?orderId=...
orderRouter.post("/verify-payment", authenticateUser, processPaymentVerification);

// ❌ REMOVED: The insecure verify route is no longer needed.
// orderRouter.post("/verify", verifyOrder);

export default orderRouter;