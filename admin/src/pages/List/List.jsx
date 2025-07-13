import React, { useState, useEffect } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const List = () => {
  const url = import.meta.env.VITE_BACKEND_URL;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    variations: [{ size: '', price: '' }],
    image: null
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const fetchList = async (showToast = false) => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/food/list`);

      if(response.data.success){
        setList(response.data.data);
        // Only show success message on manual refresh, not on initial load
        if (showToast) {
          toast.success(`${response.data.data.length} food items loaded successfully!`);
        }
      }
      else{
        toast.error("Failed to load food items from server");
      }
    } catch (error) {
      console.error('Error fetching list:', error);
      if (error.response?.status === 404) {
        toast.error("Food items endpoint not found");
      } else if (error.response?.status >= 500) {
        toast.error("Server error - please try again later");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error("Unable to connect to server");
      } else {
        toast.error("Error loading food items");
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }

  const removeFood = async (foodId) => {
    // Find the item name for better toast message
    const itemToDelete = list.find(item => item._id === foodId);
    const itemName = itemToDelete?.name || 'this item';
    
    // Confirmation dialog before deletion
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.post(`${url}/api/food/delete`, { id: foodId });
      
      if (response.data.success) {
        // Toast message for successful deletion
        toast.success(`"${itemName}" has been removed successfully!`);
        await fetchList(); // Refresh the list without toast
      } else {
        toast.error(`Failed to remove "${itemName}" - ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      if (error.response?.status === 404) {
        toast.error(`"${itemName}" not found - it may have already been deleted`);
      } else if (error.response?.status === 403) {
        toast.error(`Not authorized to delete "${itemName}"`);
      } else {
        toast.error(`Error removing "${itemName}" - please try again`);
      }
    }
  }

  const startEdit = (item) => {
    setEditingItem(item._id);
    
    // Convert variations object to array format for editing
    const variationsArray = item.variations ? 
      Object.entries(item.variations).map(([size, price]) => ({ size, price: price.toString() })) :
      [{ size: '', price: '' }];
    
    setEditForm({
      name: item.name,
      description: item.description,
      category: item.category,
      variations: variationsArray,
      image: null // Reset image field
    });
  }

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      name: '',
      description: '',
      category: '',
      variations: [{ size: '', price: '' }],
      image: null
    });
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    const itemName = editForm.name || 'item';
    
    // Validate variations
    const validVariations = {};
    let hasValidVariation = false;

    for (let i = 0; i < editForm.variations.length; i++) {
      const variation = editForm.variations[i];
      
      if (variation.size.trim() && variation.price) {
        const price = Number(variation.price);
        if (isNaN(price) || price <= 0) {
          toast.error(`Invalid price for variation "${variation.size}". Must be a positive number.`);
          return;
        }
        validVariations[variation.size.trim()] = price;
        hasValidVariation = true;
      }
    }

    if (!hasValidVariation) {
      toast.error("Please add at least one valid variation with size and price");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('id', editingItem);
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('category', editForm.category);
      formData.append('variations', JSON.stringify(validVariations));
      
      if (editForm.image) {
        formData.append('image', editForm.image);
      }

      const response = await axios.put(`${url}/api/food/edit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Toast message for successful save/edit
        toast.success(`"${itemName}" updated successfully!`);
        setEditingItem(null);
        setEditForm({
          name: '',
          description: '',
          category: '',
          variations: [{ size: '', price: '' }],
          image: null
        });
        await fetchList(); // Refresh the list without toast
      } else {
        toast.error(`Failed to update "${itemName}" - ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      if (error.response?.status === 400) {
        toast.error(`Invalid data for "${itemName}" - please check all fields`);
      } else if (error.response?.status === 404) {
        toast.error(`"${itemName}" not found - it may have been deleted`);
      } else if (error.response?.status === 413) {
        toast.error(`Image file too large for "${itemName}"`);
      } else {
        toast.error(`Error updating "${itemName}" - please try again`);
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  const handleVariationChange = (index, field, value) => {
    const newVariations = [...editForm.variations];
    newVariations[index][field] = value;
    setEditForm(prev => ({
      ...prev,
      variations: newVariations
    }));
  }

  const addVariation = () => {
    setEditForm(prev => ({
      ...prev,
      variations: [...prev.variations, { size: '', price: '' }]
    }));
  }

  const removeVariation = (index) => {
    if (editForm.variations.length > 1) {
      const newVariations = editForm.variations.filter((_, i) => i !== index);
      setEditForm(prev => ({
        ...prev,
        variations: newVariations
      }));
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file too large. Please choose a file smaller than 5MB");
        e.target.value = '';
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        e.target.value = '';
        return;
      }
    }
    
    setEditForm(prev => ({
      ...prev,
      image: file
    }));
  }

  // Helper function to format variations for display
  const formatVariations = (variations) => {
    if (!variations || Object.keys(variations).length === 0) {
      return 'No variations';
    }
    
    return Object.entries(variations)
      .map(([size, price]) => `${size}: ₹${price}`)
      .join(', ');
  }

  useEffect(() => {
    fetchList();
  }, []) 

  if (loading) {
    return (
      <div className="list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading food items...
        </div>
      </div>
    );
  }

  return (
    <div className="list-container">
      {list.length === 0 ? (
        <div className="empty-list">
          <p>No food items found</p>
          <p className="empty-subtitle">Add some items to get started!</p>
          <button onClick={() => fetchList(true)} className="refresh-btn">
            Refresh List
          </button>
        </div>
      ) : (
        <div className="list-table-container">
          <div className="table-header">
            <h2>Food Items ({list.length})</h2>
            <button onClick={() => fetchList(true)} className="refresh-btn-small">
              Refresh
            </button>
          </div>
          <table className="list-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
                <th>Category</th>
                <th>Variations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, index) => (
                <tr key={item._id || index} className={editingItem === item._id ? 'editing-row' : ''}>
                  <td>
                    <div className="item-image">
                      <img 
                        src={`${url}/images/${item.image}`} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                  </td>
                  <td className="item-name">{item.name}</td>
                  <td className="item-description" title={item.description}>
                    {item.description}
                  </td>
                  <td className="item-category">{item.category}</td>
                  <td className="item-variations" title={formatVariations(item.variations)}>
                    {formatVariations(item.variations)}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="edit-btn"
                      onClick={() => startEdit(item)}
                      disabled={editingItem && editingItem !== item._id}
                      title={`Edit ${item.name}`}
                    >
                      Edit
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFood(item._id)}
                      disabled={editingItem}
                      title={`Delete ${item.name}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h3>Edit Food Item</h3>
              <button className="close-btn" onClick={cancelEdit} title="Cancel editing">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label>Name: *</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter food item name"
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter item description (optional)"
                />
              </div>

              <div className="form-group">
                <label>Category: *</label>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Brownies">Brownies</option>
                  <option value="Cakes">Cakes</option>
                  <option value="Fried Treats">Fried Treats</option>
                  <option value="Cookies">Cookies</option>
                  <option value="Speciality Sweets">Speciality Sweets</option>
                </select>
              </div>

              {/* Variations Section */}
              <div className="form-group">
                <div className="variations-header">
                  <label>Variations (Size & Price): *</label>
                  <button 
                    type="button" 
                    onClick={addVariation}
                    className="add-variation-btn-small"
                  >
                    + Add
                  </button>
                </div>
                
                {editForm.variations.map((variation, index) => (
                  <div key={index} className="edit-variation-row">
                    <input
                      type="text"
                      placeholder="Size"
                      value={variation.size}
                      onChange={(e) => handleVariationChange(index, 'size', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={variation.price}
                      onChange={(e) => handleVariationChange(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    {editForm.variations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariation(index)}
                        className="remove-variation-btn-small"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>New Image (optional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small>Leave empty to keep current image. Max size: 5MB</small>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default List