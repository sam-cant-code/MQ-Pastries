import React, { useState, useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import Add from './Add/Add';
import List from './List/List';
import Orders from './Orders/Orders';
import './AdminPanel.css'; // Import the CSS file

const AdminPanel = () => {
  // Note: userName and userRole are no longer used in this component's layout
  const { userName, userRole } = useContext(StoreContext); 
  const [activeTab, setActiveTab] = useState('list');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'add':
        return <Add />;
      case 'list':
        return <List />;
      case 'orders':
        return <Orders />;
      default:
        return <List />;
    }
  };

  return (
    <div className='admin-panel'>
      {/* Main Content Layout (Sidebar + Content) */}
      <div className='admin-panel-content'>
        {/* Sidebar Navigation */}
        <div className='admin-sidebar'>
          {/* Admin Panel Title is now inside the sidebar */}
          <div className='sidebar-title'>
            <h1>Admin Panel</h1>
          </div>
          <nav className='admin-nav'>
            <button 
              onClick={() => setActiveTab('list')}
              className={`nav-btn ${activeTab === 'list' ? 'active' : ''}`}
            >
              <span className="icon">📦</span>
              <span className="nav-text">Pastery List</span>
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
            >
              <span className="icon">➕</span>
              <span className="nav-text">Add Pastery</span>
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            >
              <span className="icon">📋</span>
              <span className="nav-text">Orders</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className='admin-content'>
          {renderActiveComponent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
