import mongoose from "mongoose";
import dotenv from "dotenv"

export const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL);
    }
    catch(error){
        console.log("Failed to Connect to Database");
    }
}