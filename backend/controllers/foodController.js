import FoodModel from '../models/FoodModel.js'
import fs from 'fs';

// Add food item
const addFood = async (req, res) => {
  // console.log("🧾 Full req.body:", req.body);
  

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const image_filename = req.file.filename;

    // Parse variations from request body
    // Expected format: { "Small": 10, "Medium": 15, "Large": 20 } or JSON string
    let variations;
    if (typeof req.body.variations === 'string') {
      try {
        variations = JSON.parse(req.body.variations);
      } catch (parseError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid variations format. Expected JSON object." 
        });
      }
    } else if (typeof req.body.variations === 'object') {
      variations = req.body.variations;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Variations field is required and must be an object." 
      });
    }

    // Validate that variations is not empty and contains valid price values
    if (!variations || Object.keys(variations).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one variation must be provided." 
      });
    }

    // Convert variations to Map and validate prices
    const variationsMap = new Map();
    for (const [key, value] of Object.entries(variations)) {
      const price = Number(value);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid price for variation "${key}". Must be a non-negative number.` 
        });
      }
      variationsMap.set(key, price);
    }

    const food = new FoodModel({
      name: req.body.name,
      description: req.body.description,
      image: image_filename,
      category: req.body.category,
      variations: variationsMap,
    });

    await food.save();
    res.json({ success: true, message: "Food Added" });

  } catch (error) {
    console.error("❌ Error saving food:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// List all food items
const listFood = async (req, res) => {
  try {
    const foods = await FoodModel.find();
    
    // Convert Map to Object for JSON serialization
    const foodsWithVariations = foods.map(food => {
      const foodObj = food.toObject();
      if (foodObj.variations) {
        // Convert Map to plain object for JSON response
        foodObj.variations = Object.fromEntries(foodObj.variations);
      }
      return foodObj;
    });

    res.json({ success: true, data: foodsWithVariations });
  } catch (error) {
    console.error("❌ Error fetching food list:", error);
    res.status(500).json({ success: false, message: "Failed to fetch food items" });
  }
};

// Edit/Update food item
const editFood = async (req, res) => {
    console.log("🧾 Full req.body:", req.body);

  try {
    console.log("📝 Edit request body:", req.body);
    console.log("📁 File info:", req.file);

    if (!req.body.id) {
      console.log("⚠️ No ID provided for edit");
      return res.status(400).json({ success: false, message: "No ID provided" });
    }

    const food = await FoodModel.findById(req.body.id);

    if (!food) {
      console.log("❌ Food not found in DB for ID:", req.body.id);
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    console.log("📦 Found food to edit:", food);

    // Prepare update data
    const updateData = {
      name: req.body.name || food.name,
      description: req.body.description || food.description,
      category: req.body.category || food.category,
    };

    // Handle variations update
    if (req.body.variations) {
      let variations;
      if (typeof req.body.variations === 'string') {
        try {
          variations = JSON.parse(req.body.variations);
        } catch (parseError) {
          return res.status(400).json({ 
            success: false, 
            message: "Invalid variations format. Expected JSON object." 
          });
        }
      } else if (typeof req.body.variations === 'object') {
        variations = req.body.variations;
      }

      if (variations) {
        // Validate that variations is not empty and contains valid price values
        if (Object.keys(variations).length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: "At least one variation must be provided." 
          });
        }

        // Convert variations to Map and validate prices
        const variationsMap = new Map();
        for (const [key, value] of Object.entries(variations)) {
          const price = Number(value);
          if (isNaN(price) || price < 0) {
            return res.status(400).json({ 
              success: false, 
              message: `Invalid price for variation "${key}". Must be a non-negative number.` 
            });
          }
          variationsMap.set(key, price);
        }
        updateData.variations = variationsMap;
      }
    }

    // Handle image update if new image is provided
    if (req.file) {
      const new_image_filename = req.file.filename;
      
      // Delete old image file
      const oldImagePath = `uploads/${food.image}`;
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("🛑 Failed to delete old image file:", err.message);
        } else {
          console.log("🗑️ Deleted old image:", food.image);
        }
      });

      updateData.image = new_image_filename;
      console.log("🖼️ New image uploaded:", new_image_filename);
    }

    // Update the food item
    const updatedFood = await FoodModel.findByIdAndUpdate(
      req.body.id,
      updateData,
      { new: true } // Return the updated document
    );

    // Convert Map to Object for JSON response
    const updatedFoodObj = updatedFood.toObject();
    if (updatedFoodObj.variations) {
      updatedFoodObj.variations = Object.fromEntries(updatedFoodObj.variations);
    }

    console.log("✅ Food item updated:", updatedFoodObj);
    res.json({ success: true, message: "Food Updated", data: updatedFoodObj });

  } catch (error) {
    console.error("🔥 Unhandled error in editFood:", error);
    res.status(500).json({ success: false, message: "Failed to update food item" });
  }
};

// Delete food item
const deleteFood = async (req, res) => {
  try {
    console.log("🧾 Request body:", req.body);

    if (!req.body.id) {
      console.log("⚠️ No ID provided");
      return res.status(400).json({ success: false, message: "No ID provided" });
    }

    const food = await FoodModel.findById(req.body.id);

    if (!food) {
      console.log("❌ Food not found in DB for ID:", req.body.id);
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    console.log("📦 Found food:", food);

    // Delete the image
    const imagePath = `uploads/${food.image}`;
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("🛑 Failed to delete image file:", err.message);
      } else {
        console.log("🗑️ Deleted image:", food.image);
      }
    });

    await FoodModel.findByIdAndDelete(req.body.id);
    console.log("✅ Food item deleted");

    res.json({ success: true, message: "Food Removed" });

  } catch (error) {
    console.error("🔥 Unhandled error in deleteFood:", error);
    res.status(500).json({ success: false, message: "Failed to delete food item" });
  }
};

export { addFood, listFood, editFood, deleteFood }