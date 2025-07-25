import express from "express"
import { loginUser, registerUser, resetPassword, sendResetOtp, verifyAuth} from "../controllers/userController.js"
import { authenticateUser } from "../middleware/auth.js"

const userRouter = express.Router()

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/send-otp", sendResetOtp)
userRouter.post("/reset-password", resetPassword)
userRouter.get("/verify-auth", authenticateUser, verifyAuth)



export default userRouter