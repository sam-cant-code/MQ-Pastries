import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// ✅ RESTORED: Simple middleware to verify token and attach payload.
// Used for the first step in admin checks.
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer token
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attaches the raw decoded payload (e.g., {id: '...'})
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

// ✅ RESTORED: Full middleware to verify token AND fetch user data from DB.
// Used for routes like cart, orders, etc., that need the full user object.
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please log in to continue."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from database to ensure user still exists
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Attach a clean user object to the request for controllers to use
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};


// Middleware to check if user is admin (works with `authenticate`)
const authorizeAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Fetch user from database using the ID from the token
        const user = await userModel.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        req.user.role = user.role; // Optionally add role to req.user
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error during admin authorization",
            error: error.message
        });
    }
};

// ✅ RESTORED: Combined middleware for admin routes using the correct functions.
export const adminAuth = [authenticate, authorizeAdmin];
export { authenticateUser };
