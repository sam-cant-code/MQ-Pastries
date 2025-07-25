import express from 'express'
import { addToCart, removeFromCart, getCart} from '../controllers/cartController.js'
import { authenticateUser } from '../middleware/auth.js';

const cartRouter = express.Router();

cartRouter.post("/add", authenticateUser, addToCart)
cartRouter.post("/remove", authenticateUser, removeFromCart)
cartRouter.post("/get", authenticateUser, getCart)

export default cartRouter