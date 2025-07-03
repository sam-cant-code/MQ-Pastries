import express from 'express'
import { addFood, deleteFood, listFood, editFood } from '../controllers/foodController.js'
import multer from 'multer'

const foodRouter = express.Router();

const storage = multer.diskStorage({
    destination: "uploads",
    filename:(req,file,cb )=>{
          return cb(null, `${Date.now()}${file.originalname}`)
    }
});

const upload = multer({storage:storage})

foodRouter.post("/add", upload.single('image'), addFood)
foodRouter.get("/list", listFood)
foodRouter.put("/edit", upload.single('image'), editFood)
foodRouter.post("/delete", deleteFood)

export default foodRouter;