import express from "express"
import { loginUser, registerUser, resetPassword, sendResetOtp} from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/send-otp", sendResetOtp)
userRouter.post("/reset-password", resetPassword)


export default userRouter