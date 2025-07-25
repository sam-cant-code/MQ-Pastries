import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const FilterBar = ({
  searchTerm, setSearchTerm, filterCategory, setFilterCategory,
  sortBy, setSortBy, sortOrder, setSortOrder,
  categories, clearFilters, fetchList,
  viewMode, setViewMode // <-- Added view mode props
}) => (
  <div className="filter-bar">
    <div className="search-box">
      <input
        type="text"
        placeholder="Search items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {searchTerm && <button onClick={() => setSearchTerm('')} className="clear-btn" title="Clear search">×</button>}
    </div>
    
    <div className="filter-right-controls">
       {/* ✅ ADDED: View toggle button */}
      <button className="view-toggle-btn" onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')} title={`Switch to ${viewMode === 'table' ? 'Card' : 'Table'} View`}>
        {viewMode === 'table' ? '🖼️' : '📄'}
      </button>
      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
        <option value="">All Categories</option>
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="name">Sort by Name</option>
        <option value="category">Sort by Category</option>
        <option value="price">Sort by Price</option>
      </select>
      <div className="button-group">
        <button className="sort-order-btn" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}>
          {sortOrder === 'asc' ? '↓' : '↑'}
        </button>
        <button className="refresh-btn" onClick={() => fetchList(true)} title="Refresh List">↻</button>
        {(searchTerm || filterCategory) && <button className="clear-filters-btn" onClick={clearFilters}>Clear</button>}
      </div>
    </div>
  </div>
);

const FoodTable = ({ list, url, startEdit, removeFood, editingItem, formatVariations }) => (
  <div className="table-wrapper">
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
            <td data-label="Image">
              <img
                src={`${url}/images/${item.image}`}
                alt={item.name}
                onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
              />
            </td>
            <td data-label="Name" className="item-name">{item.name}</td>
            <td data-label="Description" className="item-description" title={item.description}>{item.description}</td>
            <td data-label="Category" className="item-category">{item.category}</td>
            <td data-label="Variations" className="item-variations" title={formatVariations(item.variations)}>{formatVariations(item.variations)}</td>
            <td data-label="Actions" className="actions-cell">
              <button className="edit-btn" onClick={() => startEdit(item)} disabled={!!editingItem}>Edit</button>
              <button className="remove-btn" onClick={() => removeFood(item._id)} disabled={!!editingItem}>Remove</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ✅ ADDED: New component for Card View
const FoodCards = ({ list, url, startEdit, removeFood, editingItem, formatVariations }) => (
    <div className="card-grid-wrapper">
        {list.map((item) => (
            <div key={item._id} className={`admin-food-card ${editingItem === item._id ? 'editing-card' : ''}`}>
                <div className="admin-card-image-container">
                    <img 
                        src={`${url}/images/${item.image}`} 
                        alt={item.name}
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                    />
                </div>
                <div className="admin-card-content">
                    <span className="admin-card-category">{item.category}</span>
                    <h3 className="admin-card-name">{item.name}</h3>
                    <p className="admin-card-description" title={item.description}>{item.description}</p>
                    <p className="admin-card-variations" title={formatVariations(item.variations)}>{formatVariations(item.variations)}</p>
                </div>
                <div className="admin-card-actions">
                    <button className="edit-btn" onClick={() => startEdit(item)} disabled={!!editingItem}>Edit</button>
                    <button className="remove-btn" onClick={() => removeFood(item._id)} disabled={!!editingItem}>Remove</button>
                </div>
            </div>
        ))}
    </div>
);


const EditModal = ({
  editForm, handleInputChange, handleVariationChange, handleImageChange,
  addVariation, removeVariation, handleEditSubmit, cancelEdit
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <form onSubmit={handleEditSubmit}>
        <div className="modal-header">
          <h3>Edit Food Item</h3>
          <button type="button" className="close-btn" onClick={cancelEdit}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={editForm.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={editForm.category} onChange={handleInputChange} required>
                <option value="Brownies">Brownies</option>
                <option value="Cakes">Cakes</option>
                <option value="Fried Treats">Fried Treats</option>
                <option value="Cookies">Cookies</option>
                <option value="Speciality Sweets">Speciality Sweets</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={editForm.description} onChange={handleInputChange} rows="2" />
          </div>
          <div className="form-group">
            <div className="variations-header">
              <label>Variations</label>
              <button type="button" onClick={addVariation} className="add-variation-btn">+ Add</button>
            </div>
            <div className="variations-list">
              {editForm.variations.map((v, i) => (
                <div key={i} className="variation-row">
                  <input type="text" placeholder="Size (e.g., 1/2kg)" value={v.size} onChange={(e) => handleVariationChange(i, 'size', e.target.value)} />
                  <input type="number" placeholder="Price (₹)" value={v.price} onChange={(e) => handleVariationChange(i, 'price', e.target.value)} />
                  {editForm.variations.length > 1 && <button type="button" onClick={() => removeVariation(i)} className="remove-variation-btn">×</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>New Image (Optional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
            <small>Leave empty to keep the current image.</small>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="cancel-btn" onClick={cancelEdit}>Cancel</button>
          <button type="submit" className="save-btn">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
);

const List = () => {
  const url = import.meta.env.VITE_BACKEND_URL;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', category: '', variations: [{ size: '', price: '' }], image: null });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  useEffect(() => {
    if (editingItem) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [editingItem]);
  
  const fetchList = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setList(response.data.data);
        if (showToast) toast.success("Food list refreshed!");
      } else {
        toast.error("Failed to load food items");
      }
    } catch (error) {
      console.error('Error fetching list:', error);
      toast.error("Error loading food items");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const filteredAndSortedList = useMemo(() => {
    let temp_list = [...list];
    if (searchTerm) {
      temp_list = temp_list.filter(item =>
        ['name', 'description', 'category'].some(field => item[field].toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterCategory) {
      temp_list = temp_list.filter(item => item.category === filterCategory);
    }
    return temp_list.sort((a, b) => {
      let aValue = a.name.toLowerCase(), bValue = b.name.toLowerCase();
      if (sortBy === 'category') {
        aValue = a.category.toLowerCase(); bValue = b.category.toLowerCase();
      } else if (sortBy === 'price') {
        aValue = Math.min(Infinity, ...Object.values(a.variations || {}));
        bValue = Math.min(Infinity, ...Object.values(b.variations || {}));
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [list, searchTerm, sortBy, sortOrder, filterCategory]);

  const categories = useMemo(() => [...new Set(list.map(item => item.category))].sort(), [list]);

  const clearFilters = () => {
    setSearchTerm(''); setFilterCategory(''); setSortBy('name'); setSortOrder('asc');
  };

  const removeFood = async (foodId) => {
    const itemName = list.find(item => item._id === foodId)?.name || 'item';
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication error. Please log in again.");
        return;
      }
      
      const response = await axios.delete(`${url}/api/food/delete/${foodId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`"${itemName}" removed successfully!`);
        fetchList();
      } else {
        toast.error(response.data.message || `Failed to remove "${itemName}".`);
      }
    } catch (error) {
      console.error("Error removing food item:", error);
      toast.error(error.response?.data?.message || `Error removing "${itemName}".`);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item._id);
    const variationsArray = item.variations ? Object.entries(item.variations).map(([size, price]) => ({ size, price: String(price) })) : [{ size: '', price: '' }];
    setEditForm({ name: item.name, description: item.description, category: item.category, variations: variationsArray, image: null });
  };

  const cancelEdit = () => setEditingItem(null);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const validVariations = editForm.variations.reduce((acc, v) => {
      if (v.size.trim() && v.price) acc[v.size.trim()] = Number(v.price);
      return acc;
    }, {});
    if (Object.keys(validVariations).length === 0) {
      return toast.error("Please add at least one valid variation.");
    }
    const formData = new FormData();
    formData.append('id', editingItem);
    formData.append('name', editForm.name);
    formData.append('description', editForm.description);
    formData.append('category', editForm.category);
    formData.append('variations', JSON.stringify(validVariations));
    if (editForm.image) formData.append('image', editForm.image);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication error. Please log in again.");
        return;
      }

      const response = await axios.put(`${url}/api/food/edit`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`"${editForm.name}" updated successfully!`);
        cancelEdit();
        fetchList();
      } else {
        toast.error(response.data.message || `Failed to update "${editForm.name}".`);
      }
    } catch (error) {
      console.error("Error updating food item:", error);
      toast.error(error.response?.data?.message || `Error updating "${editForm.name}".`);
    }
  };

  const handleInputChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleImageChange = (e) => setEditForm(prev => ({ ...prev, image: e.target.files[0] }));
  const handleVariationChange = (index, field, value) => {
    const newVariations = [...editForm.variations];
    newVariations[index][field] = value;
    setEditForm(prev => ({ ...prev, variations: newVariations }));
  };
  const addVariation = () => setEditForm(prev => ({ ...prev, variations: [...prev.variations, { size: '', price: '' }] }));
  const removeVariation = (index) => {
    if (editForm.variations.length > 1) {
      setEditForm(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }));
    }
  };

  const formatVariations = (variations) => {
    if (!variations || Object.keys(variations).length === 0) return 'N/A';
    return Object.entries(variations).map(([size, price]) => `${size}: ₹${price}`).join(', ');
  };

  useEffect(() => { fetchList(); }, [fetchList]);

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading Items...</p></div>;

  return (
    <div className="list-page-wrapper">
        <div className="list-container">
        <div className="list-header">
            <h2>Food Items List</h2>
            <span>Showing {filteredAndSortedList.length} of {list.length} total</span>
        </div>

        <FilterBar {...{ searchTerm, setSearchTerm, filterCategory, setFilterCategory, sortBy, setSortBy, sortOrder, setSortOrder, categories, clearFilters, fetchList, viewMode, setViewMode }} />
        
        {list.length > 0 ? (
            filteredAndSortedList.length > 0 ? (
                // ✅ ADDED: Conditional rendering based on viewMode
                viewMode === 'table' ? (
                    <FoodTable {...{ list: filteredAndSortedList, url, startEdit, removeFood, editingItem, formatVariations }} />
                ) : (
                    <FoodCards {...{ list: filteredAndSortedList, url, startEdit, removeFood, editingItem, formatVariations }} />
                )
            ) : (
            <div className="no-results">
                <p>No items match your current filters.</p>
                <button onClick={clearFilters}>Clear Filters</button>
            </div>
            )
        ) : (
            <div className="no-results">
            <p>You haven't added any food items yet.</p>
            </div>
        )}

        {editingItem && <EditModal {...{ editForm, handleInputChange, handleVariationChange, handleImageChange, addVariation, removeVariation, handleEditSubmit, cancelEdit }} />}
        </div>
    </div>
  );
};

export default List;
