import { placeOrder, verifyOrder, userOrders, allUserOrders} from "../controllers/orderControllers.js";
import express from 'express'
import authMiddleWare from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleWare, placeOrder)
orderRouter.post("/verify", verifyOrder)
orderRouter.post("/userorders", authMiddleWare, userOrders)
orderRouter.get("/list", allUserOrders)

export default orderRouter