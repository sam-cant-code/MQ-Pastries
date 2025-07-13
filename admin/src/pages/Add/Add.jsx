import React, { useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Add = () => {

  const url = import.meta.env.VITE_BACKEND_URL;
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    category: "Brownies" 
  })
  
  // State for managing variations (size-price pairs)
  const [variations, setVariations] = useState([
    { size: "", price: "" }
  ]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }))
  }

  // Handle variation changes
  const handleVariationChange = (index, field, value) => {
    const newVariations = [...variations];
    newVariations[index][field] = value;
    setVariations(newVariations);
  }

  // Add new variation
  const addVariation = () => {
    setVariations([...variations, { size: "", price: "" }]);
  }

  // Remove variation
  const removeVariation = (index) => {
    if (variations.length > 1) {
      const newVariations = variations.filter((_, i) => i !== index);
      setVariations(newVariations);
    }
  }

  // Add form submission handler
  const onSubmitHandler = async (event) => {
    event.preventDefault(); // Prevent page refresh
    
    // Basic validation FIRST (before API call)
    if (!image) {
      toast.error("Please upload an image", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (!data.name.trim()) {
      toast.error("Please enter a product name", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (!data.description.trim()) {
      toast.error("Please enter a product description", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Validate variations
    const validVariations = {};
    let hasValidVariation = false;

    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      
      if (variation.size.trim() && variation.price) {
        const price = Number(variation.price);
        if (isNaN(price) || price <= 0) {
          toast.error(`Invalid price for variation "${variation.size}". Must be a positive number.`, {
            position: "top-right",
            autoClose: 3000,
          });
          return;
        }
        validVariations[variation.size.trim()] = price;
        hasValidVariation = true;
      }
    }

    if (!hasValidVariation) {
      toast.error("Please add at least one valid variation with size and price", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Set loading state
    setLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Adding product...", {
      position: "top-right",
    });

    // Create FormData for API call
    const formData = new FormData();
    formData.append("name", data.name)
    formData.append("description", data.description)
    formData.append("category", data.category)
    formData.append("variations", JSON.stringify(validVariations))
    formData.append("image", image)

    try {
      const response = await axios.post(`${url}/api/food/add`, formData)
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        toast.success("Product added successfully! 🎉", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Reset form after successful submission
        setData({
          name: "",
          description: "",
          category: "Brownies" 
        })
        setVariations([{ size: "", price: "" }]);
        setImage(null);
      } else {
        toast.error(`Failed to add product: ${response.data.message || "Unknown error"}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.error("Error adding product:", error);
      
      // More specific error handling
      if (error.response) {
        // Server responded with error status
        toast.error(`Server Error: ${error.response.data.message || error.response.statusText}`, {
          position: "top-right",
          autoClose: 5000,
        });
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Network Error: Please check your connection and try again", {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        // Something else happened
        toast.error("An unexpected error occurred. Please try again.", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img 
              src={image ? URL.createObjectURL(image) : assets.upload_icon} 
              alt={image ? "Uploaded product" : "Upload icon"} 
            />
          </label>
          <input 
            type="file" 
            id="image" 
            hidden 
            required 
            accept="image/*"
            onChange={(e) => {
              const selectedFile = e.target.files[0];
              if (selectedFile) {
                // Optional: Add file size validation
                if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                  toast.warning("Image size should be less than 5MB", {
                    position: "top-right",
                    autoClose: 4000,
                  });
                  return;
                }
                setImage(selectedFile);
                toast.info("Image selected successfully", {
                  position: "top-right",
                  autoClose: 2000,
                });
              }
            }}
            disabled={loading}
          />
        </div>
        
        <div className="add-product-name flex-col">
          <p>Product Name</p>
          <input 
            onChange={onChangeHandler} 
            value={data.name} 
            type="text" 
            name="name" 
            placeholder="Type here"
            required
            disabled={loading}
          />
        </div>
        
        <div className="add-product-description flex-col">
          <p>Product Description</p>
          <textarea 
            onChange={onChangeHandler} 
            value={data.description} 
            name="description" 
            rows="6" 
            placeholder="Write description here"
            required
            disabled={loading}
          />
        </div>
        
        <div className="add-category flex-col">
          <p>Product Category</p>
          <select 
            onChange={onChangeHandler} 
            value={data.category} 
            name="category"
            disabled={loading}
          >
            <option value="Brownies">Brownies</option>
            <option value="Cakes">Cakes</option>
            <option value="Fried Treats">Fried Treats</option>
            <option value="Cookies">Cookies</option>
            <option value="Speciality Sweets">Speciality Sweets</option>
          </select>
        </div>    

        {/* Variations Section */}
        <div className="add-variations flex-col">
          <div className="variations-header">
            <p>Product Variations (Size & Price)</p>
            <button 
              type="button" 
              onClick={addVariation}
              className="add-variation-btn"
              disabled={loading}
            >
              + Add Variation
            </button>
          </div>
          
          {variations.map((variation, index) => (
            <div key={index} className="variation-row">
              <div className="variation-size">
                <input
                  type="text"
                  placeholder="Size (e.g., Small, Medium, Large)"
                  value={variation.size}
                  onChange={(e) => handleVariationChange(index, 'size', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="variation-price">
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={variation.price}
                  onChange={(e) => handleVariationChange(index, 'price', e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              {variations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariation(index)}
                  className="remove-variation-btn"
                  disabled={loading}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button 
          type="submit" 
          className={`add-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'ADDING...' : 'ADD PRODUCT'}
        </button>
      </form>
    </div>
  )
}

export default Add