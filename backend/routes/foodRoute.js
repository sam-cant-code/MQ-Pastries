import express from 'express'
import { addFood, deleteFood, listFood, editFood } from '../controllers/foodController.js'
import { adminAuth } from '../middleware/auth.js'
import multer from 'multer'

const foodRouter = express.Router();

const storage = multer.diskStorage({
    destination: "uploads",
    filename:(req,file,cb )=>{
          return cb(null, `${Date.now()}${file.originalname}`)
    }
});

const upload = multer({storage:storage})

// Admin-only routes (protected)
foodRouter.post("/add", adminAuth, upload.single('image'), addFood)
foodRouter.put("/edit", adminAuth, upload.single('image'), editFood)
foodRouter.delete("/delete/:id", adminAuth, deleteFood)

// Public route (anyone can view the food list)
foodRouter.get("/list", listFood)

export default foodRouter;