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
    price: "",
    unit: "", 
    category: "Brownies" 
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }))
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
    if (!data.price || data.price <= 0) {
      toast.error("Please enter a valid price", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (!data.unit.trim()) {
      toast.error("Please enter a unit (e.g., per piece, per kg, per dozen)", {
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
    formData.append("price", Number(data.price))
    formData.append("unit", data.unit)
    formData.append("category", data.category)
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
          price: "",
          unit: "", 
          category: "Brownies" 
        })
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
        
        <div className="add-category-price">
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
          
          <div className="add-price flex-col">
            <p>Product Price</p>
            <input 
              onChange={onChangeHandler} 
              value={data.price} 
              type="number" 
              name="price" 
              placeholder="₹0.00"
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>     
        </div>

        <div className="add-unit flex-col">
          <p>Product Unit</p>
          <input 
            onChange={onChangeHandler} 
            value={data.unit} 
            type="text" 
            name="unit" 
            placeholder="e.g., per piece, per kg, per dozen, per box"
            required
            disabled={loading}
          />
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