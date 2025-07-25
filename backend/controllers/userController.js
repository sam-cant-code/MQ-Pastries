import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"
import transporter from "../config/nodemailer.js";

//login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user._id);
        res.json({ 
            success: true, 
            token, 
            name: user.name,
            role: user.role // Include role in response for frontend use
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error occurred" });
    }
};

const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET)
}

//register user
const registerUser = async (req, res) => {
    // Only extract allowed fields - ignoring any 'role' field sent by client
    const { name, password, email } = req.body;
    
    try {
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists!" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email!" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            // role: 'user' is set by default in schema, but you can be explicit:
            role: 'user' // Explicitly set as user, ignoring any role from request
        });

        const user = await newUser.save();
        const token = createToken(user._id);

        res.json({ 
            success: true, 
            token, 
            name: user.name,
            role: user.role // Include role in response
        });

    } catch (error) {
        console.error("Registration error:", error.message);
        res.json({ success: false, message: "Internal server error" });
    }
};

const sendResetOtp = async (req,res) => {
    const {email} = req.body

    if(!email){
        return res.json({success:false, message:"email is required"})
    }

    try {

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false, message:"user not found"});
        }

        const otp = String(Math.floor(100000+Math.random()*(900000)))

        user.resetOtp = otp;
        user.resetOtpExpire = Date.now() + 5 * 60 * 1000 // Fixed: was 5 * 50 * 1000

        await user.save()

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Your MQ Pastries Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It is valid for 5 minutes.`
        }
        
        await transporter.sendMail(mailOptions);

        return res.json({success:true, message:"otp sent to mail successfuly!"});

    } catch (error) {
        return res.json({success:false, message:error.message});
    }
}

const resetPassword = async (req,res)=>{
    // Only extract allowed fields for password reset
    const {email, otp, newPassword} = req.body;
        
    if(!email || !otp || !newPassword){
        return res.json({success:false, message:'email, otp, and new password Required'})
    }

    // Add password validation
    if (newPassword.length < 8) {
        return res.json({ success: false, message: "New password must be at least 8 characters long!" });
    }

    try {
       const user = await userModel.findOne({email});
       if(!user){
            return res.json({success:false, message:"user not found"});
       }

       if(user.resetOtp === null || user.resetOtp !== otp){
            return res.json({success:false, message:"invalid otp"});
       }

       if(user.resetOtpExpire < Date.now()){
            return res.json({success:false, message:"otp has expired"});
       }

       const hashedPassword = await bcrypt.hash(newPassword, 10);
       user.password = hashedPassword;
       user.resetOtp = null;
       user.resetOtpExpire = null;

       await user.save();

       res.json({success:true, message:"password has been changed successfully!"})

    } catch (error) {
        res.json({success:false, message:error.message})
    }
}

const verifyAuth = async (req, res) => {
    try {
        // The authenticateUser middleware already validates the token
        // and attaches user info to req.user
        res.json({
            success: true,
            authenticated: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error("Auth verification error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during authentication verification"
        });
    }
};

export {loginUser, registerUser, resetPassword, sendResetOtp, verifyAuth}