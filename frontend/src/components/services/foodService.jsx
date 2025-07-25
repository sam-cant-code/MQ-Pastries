class FoodService {
  constructor() {
    // Use your existing URL structure
    this.baseURL = 'http://localhost:4000';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async addFood(formData) {
    const response = await fetch(`${this.baseURL}/api/food/add`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add food');
    return data;
  }

  async editFood(formData) {
    const response = await fetch(`${this.baseURL}/api/food/edit`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to edit food');
    return data;
  }

  async deleteFood(foodId) {
    const response = await fetch(`${this.baseURL}/api/food/delete/${foodId}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete food');
    return data;
  }

  async listFood() {
    const response = await fetch(`${this.baseURL}/api/food/list`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch food list');
    return data;
  }
}

export default new FoodService();