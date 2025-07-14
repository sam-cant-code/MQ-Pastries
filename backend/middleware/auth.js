import jwt from "jsonwebtoken"

const authMiddleWare = async(req, res, next) => {
    // Try multiple ways to get the token
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    
    if(!token){
        return res.json({success:false, message:"Login to make payment"})
    }
    
    try{
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.userId = token_decode.id;
        next(); 
    } catch(error){
        console.log("JWT Error:", error.message);
        
        // Handle different JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.json({success:false, message:"Invalid token, please login again"});
        } else if (error.name === 'TokenExpiredError') {
            return res.json({success:false, message:"Token expired, please login again"});
        }
        
        return res.json({success:false, message:"Authentication failed"});
    }
}

export default authMiddleWare