import React, { useState } from 'react';
import { assets } from '../../../assets/assets';
import foodService from '../../../components/services/foodService';
import { toast } from 'react-toastify';
import './Add.css';

const Add = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    category: "Cakes" // Default category
  });
  const [variations, setVariations] = useState([{ size: "", price: "" }]);

  const categoryList = ["Cakes", "Brownies", "Fried Treats", "Cookies", "Speciality Sweets"];

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData(prevData => ({ ...prevData, [name]: value }));
  };

  const processFile = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageChange = (e) => {
    processFile(e.target.files[0]);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleVariationChange = (index, field, value) => {
    const newVariations = [...variations];
    newVariations[index][field] = value;
    setVariations(newVariations);
  };

  const addVariation = () => {
    setVariations([...variations, { size: "", price: "" }]);
  };

  const removeVariation = (index) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index));
    } else {
      toast.warn("You must have at least one variation.");
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!image) {
        toast.error("Please upload an image for the product.");
        return;
    }

    const validVariations = {};
    for (const v of variations) {
      if (v.size.trim() && v.price) {
        const price = Number(v.price);
        if (isNaN(price) || price <= 0) {
          toast.error(`Invalid price for variation "${v.size}".`);
          return;
        }
        validVariations[v.size.trim()] = price;
      }
    }

    if (Object.keys(validVariations).length === 0) {
      toast.error("Please add at least one valid variation with both size and price.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("variations", JSON.stringify(validVariations));
    formData.append("image", image);

    try {
      const response = await foodService.addFood(formData);
      if (response.success) {
        toast.success("Product added successfully! 🎉");
        setData({ name: "", description: "", category: "Cakes" });
        setVariations([{ size: "", price: "" }]);
        setImage(null);
        setImagePreview(null);
        // This is a reliable way to reset the file input visually
        document.getElementById('image-upload').value = "";
      } else {
        toast.error(response.message || "Failed to add product.");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-component">
      <form onSubmit={onSubmitHandler} className="add-form">
        <h2>Add New Pastery Item</h2>

        <div className="form-group">
          <label>Upload Image</label>
          <label
            htmlFor="image-upload"
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <div className="drop-zone-prompt">
                {/* <img src={assets.upload_icon} alt="upload icon" /> */}
                <p>Drag & Drop Image Here</p>
                <p>or click to select</p>
              </div>
            )}
          </label>
          <input
            onChange={handleImageChange}
            type="file"
            id="image-upload"
            hidden
            accept="image/*"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Product Name</label>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            id="name"
            name="name"
            placeholder="Type here"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Product Description</label>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            id="description"
            name="description"
            rows="4"
            placeholder="Write description here"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Product Category</label>
          <select
            onChange={onChangeHandler}
            value={data.category}
            id="category"
            name="category"
            disabled={loading}
          >
            {categoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="variations-section">
          <div className="variations-header">
            <label>Product Variations</label>
            <button type="button" onClick={addVariation} disabled={loading} className="btn-add-variation">
              + Add Variation
            </button>
          </div>
          {variations.map((variation, index) => (
            <div key={index} className="variation-row">
              <input
                type="text"
                placeholder="Size (e.g., Small, 1kg)"
                value={variation.size}
                onChange={(e) => handleVariationChange(index, 'size', e.target.value)}
                disabled={loading}
                required
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={variation.price}
                onChange={(e) => handleVariationChange(index, 'price', e.target.value)}
                min="0"
                step="any"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => removeVariation(index)}
                disabled={loading || variations.length <= 1}
                className="btn-remove-variation"
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'ADDING...' : 'ADD PRODUCT'}
        </button>
      </form>
    </div>
  );
};

export default Add;
