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

//middlware
app.use(express.json())
app.use(cors()) 

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

