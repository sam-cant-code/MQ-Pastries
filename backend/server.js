import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import "dotenv/config"
import userRouter from "./routes/userRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"    

//app config
const app = express()
const port = process.env.PORT || 4000

//middleware
app.use(express.json())

// Update CORS configuration
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://mq-pastries-7qdw.onrender.com" // Your frontend URL
    ],
    credentials: true
}))

//api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)

//connect with database
connectDB()

app.get("/", (req,res)=>{
    res.send("dflaksjdlfajd;lfja;ldjkfa;l")
})

app.listen(port, ()=>{
    console.log(`Server Started on localhost:${port}`)
})
