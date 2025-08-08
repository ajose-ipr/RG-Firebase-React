import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { db } from '../utils/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

export default function Settings() {
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState({
    type: 'PARTICULARS',
    value: ''
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAllDropdownOptions();
    // eslint-disable-next-line
  }, [filter]);

  const fetchAllDropdownOptions = async () => {
    setLoading(true);
    try {
      let q = collection(db, 'dropdown_options');
      if (filter === 'active') {
        q = query(q, where('isActive', '==', true));
      } else if (filter === 'inactive') {
        q = query(q, where('isActive', '==', false));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      setDropdownOptions(data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOption.value.trim()) return;

    try {
      await addDoc(collection(db, 'dropdown_options'), {
        ...newOption,
        value: newOption.value.toUpperCase(),
        isActive: true,
        isCustom: true
      });
      setNewOption({ type: 'PARTICULARS', value: '' });
      await fetchAllDropdownOptions();
    } catch (error) {
      alert('Error adding option: ' + (error.message || 'Unknown error'));
    }
  };

  const handleToggleOption = async (id, currentStatus) => {
    try {
      const optionRef = doc(db, 'dropdown_options', id);
      await updateDoc(optionRef, { isActive: !currentStatus });
      await fetchAllDropdownOptions();
    } catch (error) {
      alert('Error updating option: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteOption = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom option?')) {
      try {
        await deleteDoc(doc(db, 'dropdown_options', id));
        await fetchAllDropdownOptions();
      } catch (error) {
        alert('Error deleting option: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const groupedOptions = dropdownOptions.reduce((acc, option) => {
    if (!acc[option.type]) acc[option.type] = [];
    acc[option.type].push(option);
    return acc;
  }, {});

  return (
    <>
      <Navigation />
      <div className="container mt-4">
        <h1 className="mb-4">Admin Settings</h1>

        {/* Add New Option */}
        <div className="card mb-4">
          <div className="card-header">
            <h5>Add New Dropdown Option</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddOption}>
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={newOption.type}
                    onChange={(e) => setNewOption({...newOption, type: e.target.value})}
                  >
                    <option value="PARTICULARS">Particulars</option>
                    <option value="CLIENT_CODE">Client Code</option>
                    <option value="SITE_NAME">Site Name</option>
                    <option value="STATE_NAME">State Name</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Value</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newOption.value}
                    onChange={(e) => setNewOption({...newOption, value: e.target.value.toUpperCase()})}
                    maxLength={newOption.type === 'PARTICULARS' ? 10 : 4}
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">&nbsp;</label>
                  <button type="submit" className="btn btn-primary d-block">
                    Add Option
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Filter Options */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5>Manage Dropdown Options</h5>
              <div className="btn-group" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="filter"
                  id="filter-all"
                  checked={filter === 'all'}
                  onChange={() => setFilter('all')}
                />
                <label className="btn btn-outline-primary" htmlFor="filter-all">All</label>

                <input
                  type="radio"
                  className="btn-check"
                  name="filter"
                  id="filter-active"
                  checked={filter === 'active'}
                  onChange={() => setFilter('active')}
                />
                <label className="btn btn-outline-success" htmlFor="filter-active">Active</label>

                <input
                  type="radio"
                  className="btn-check"
                  name="filter"
                  id="filter-inactive"
                  checked={filter === 'inactive'}
                  onChange={() => setFilter('inactive')}
                />
                <label className="btn btn-outline-danger" htmlFor="filter-inactive">Inactive</label>
              </div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                {Object.entries(groupedOptions).map(([type, options]) => (
                  <div key={type} className="col-md-4 mb-4">
                    <h6 className="text-primary">{type.replace('_', ' ')}</h6>
                    <div className="list-group">
                      {options.length === 0 ? (
                        <div className="list-group-item text-muted">No options</div>
                      ) : (
                        options.map(option => (
                          <div 
                            key={option.id} 
                            className={`list-group-item d-flex justify-content-between align-items-center ${
                              !option.isActive ? 'list-group-item-secondary' : ''
                            }`}
                          >
                            <div>
                              <span className={`badge ${option.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                {option.value}
                              </span>
                              {option.isCustom && (
                                <span className="badge bg-info ms-1">Custom</span>
                              )}
                              {!option.isActive && (
                                <span className="badge bg-danger ms-1">Inactive</span>
                              )}
                            </div>
                            <div className="btn-group btn-group-sm">
                              <button
                                className={`btn ${option.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                onClick={() => handleToggleOption(option.id, option.isActive)}
                                title={option.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {option.isActive ? '⏸️' : '▶️'}
                              </button>
                              {option.isCustom && (
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteOption(option.id)}
                                  title="Delete Custom Option"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="card">
          <div className="card-header">
            <h5>System Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Database Statistics</h6>
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Total Dropdown Options</span>
                    <span className="badge bg-primary">{dropdownOptions.length}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Active Options</span>
                    <span className="badge bg-success">
                      {dropdownOptions.filter(opt => opt.isActive).length}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Custom Options</span>
                    <span className="badge bg-info">
                      {dropdownOptions.filter(opt => opt.isCustom).length}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Quick Actions</h6>
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={fetchAllDropdownOptions}
                  >
                    🔄 Refresh Data
                  </button>
                  {/* Export buttons are not supported in client-only Firebase */}
                  <button 
                    className="btn btn-outline-info"
                    onClick={() => alert('Export is not supported in client-only Firebase.')}
                  >
                    📥 Export All Data
                  </button>
                  <button 
                    className="btn btn-outline-warning"
                    onClick={() => alert('Audit log export is not supported in client-only Firebase.')}
                  >
                    📊 Export Audit Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="card mt-4">
          <div className="card-header">
            <h5>Help & Guidelines</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Dropdown Option Rules</h6>
                <ul className="small">
                  <li><strong>PARTICULARS:</strong> Can be any text up to 10 characters</li>
                  <li><strong>CLIENT_CODE:</strong> Must be between 2-4 characters</li>
                  <li><strong>SITE_NAME:</strong> Must be between 2-4 characters</li>
                  <li><strong>STATE_NAME:</strong> Must be between 2-4 characters</li>
                  <li><strong>System Options:</strong> Cannot be deleted, only deactivated</li>
                  <li><strong>Custom Options:</strong> Can be deleted permanently</li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Reference Code Format</h6>
                <p className="small">
                  <code>IPR/[PARTICULARS]/[CLIENT_CODE]/[CAPACITY]MW/[STATE_NAME]/[SITE_NAME]/[CUMULATIVE]/[INCREMENTAL]</code>
                </p>
                <p className="small text-muted">
                  Example: <code>IPR/TC/HFE/100MW/KA/SJPR/2501/01</code>
                </p>
              </div>
               </div>
          </div>
        </div>
      </div>
    </>
  );
}