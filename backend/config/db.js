import mongoose from "mongoose";

export const connectDB = async()=>{
    try{
        await mongoose.connect('mongodb+srv://samjp0001:s%40Mypwd2d2b!@cluster0.0yc2rmj.mongodb.net/Food-Ordering-Website').then(()=>console.log("Database Connected"));
    }
    catch(error){
        console.log("Failed to Connect to Database");
    }
}