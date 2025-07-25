import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import "dotenv/config";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// App config
const app = express();
const port = process.env.PORT || 4000;

// Middleware
// CORS MUST come FIRST to handle pre-flight requests
app.use(cors({
    origin: [
        "http://localhost:5174",
        "http://localhost:5173",
        "https://mq-pastries-7qdw.onrender.com" // Your frontend URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

// This middleware is for parsing JSON bodies
app.use(express.json());

// --- Static file serving for images ---
// This line makes the 'uploads' folder public at the '/images' URL
app.use("/images", express.static('uploads'));

// API endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

// Connect to the database
connectDB();

// Default route to check if the API is running
app.get("/", (req, res) => {
    res.send("API Working");
});

// Start the server
app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`);
});