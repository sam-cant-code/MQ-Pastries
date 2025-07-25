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

// ✅ CHANGED: Temporarily opened CORS for debugging.
// WARNING: This is for testing only. It allows requests from ANY origin.
// If this fixes the mobile issue, it confirms the problem is a mismatch
// between your FRONTEND_URL environment variable and the actual origin
// being sent by the mobile browser.
// Once confirmed, revert to the previous, more secure corsOptions.
app.use(cors({ credentials: true, origin: "*" }));


/*
// --- Previous Secure CORS Config (REVERT TO THIS AFTER DEBUGGING) ---
const allowedOrigins = [
    "http://localhost:5174",
    "http://localhost:5173",
    process.env.FRONTEND_URL // Use environment variable for your live URL
];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
};
app.use(cors(corsOptions));
*/


// This middleware is for parsing JSON bodies
app.use(express.json());

// --- Static file serving for images ---
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
