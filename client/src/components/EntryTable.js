import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getParticularsFullForm, getClientCodeFullForm, getSiteNameFullForm } from '../utils/constants';

export default function EntryTable({ onEdit }) {
  console.log('🚀 EntryTable component mounted/re-rendered');
  
  const { user } = useAuth();
  const { entries, loading, pagination, fetchEntries, deleteEntry } = useData();
  
  console.log('👤 Current user:', user ? { uid: user.uid, role: user.role, email: user.email } : 'Not authenticated');
  console.log('📊 Entries data:', { count: entries?.length || 0, loading });
  console.log('📄 Pagination info:', pagination);
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('SL_NO');
  const [sortOrder, setSortOrder] = useState('desc');

  console.log('🔍 Current search/sort state:', { search, sortBy, sortOrder });

  const handleSearch = (e) => {
    console.log('🔍 Search form submitted with query:', search);
    e.preventDefault();
    console.log('📞 Calling fetchEntries with search parameters:', { 
      page: 1, 
      search, 
      sortBy, 
      sortOrder 
    });
    fetchEntries(1, search, sortBy, sortOrder);
  };

  const handleSort = (field) => {
    console.log('📊 Sort clicked for field:', field);
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    console.log('📊 Sort order changed:', { 
      previousField: sortBy, 
      newField: field, 
      previousOrder: sortOrder, 
      newOrder 
    });
    setSortBy(field);
    setSortOrder(newOrder);
    console.log('📞 Calling fetchEntries with new sort parameters:', { 
      page: pagination.currentPage, 
      search, 
      sortBy: field, 
      sortOrder: newOrder 
    });
    fetchEntries(pagination.currentPage, search, field, newOrder);
  };

  const handlePageChange = (page) => {
    console.log('📄 Page change requested:', { 
      currentPage: pagination.currentPage, 
      newPage: page, 
      totalPages: pagination.totalPages 
    });
    if (page < 1 || page > pagination.totalPages) {
      console.log('⚠️ Invalid page number requested:', page);
      return;
    }
    console.log('📞 Calling fetchEntries for page change:', { page, search, sortBy, sortOrder });
    fetchEntries(page, search, sortBy, sortOrder);
  };

  const handleDelete = async (entry) => {
    console.log('🗑️ Delete requested for entry:', { 
      id: entry._id || entry.id, 
      refCode: entry.REFERENCE_CODE 
    });
    if (window.confirm(`Are you sure you want to delete entry ${entry.REFERENCE_CODE}?`)) {
      console.log('✅ User confirmed deletion');
      try {
        console.log('📞 Calling deleteEntry API');
        await deleteEntry(entry._id || entry.id);
        console.log('✅ Entry deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting entry:', error);
        console.error('📊 Error details:', {
          entryId: entry._id || entry.id,
          message: error.message,
          stack: error.stack
        });
        alert('Error deleting entry: ' + (error.message || 'Unknown error'));
      }
    } else {
      console.log('❌ User cancelled deletion');
    }
  };

  const canModifyEntry = (entry) => {
    const canModify = user?.role === 'admin';
    console.log('🔐 Permission check for entry:', { 
      entryId: entry._id || entry.id, 
      userRole: user?.role, 
      canModify 
    });
    return canModify;
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateField) => {
    console.log('📅 Formatting date field:', dateField);
    try {
      let date;
      if (dateField?.seconds) {
        // Firestore Timestamp
        console.log('📅 Processing Firestore timestamp');
        date = new Date(dateField.seconds * 1000);
      } else if (dateField instanceof Date) {
        console.log('📅 Processing Date object');
        date = dateField;
      } else if (dateField) {
        console.log('📅 Processing string/number date');
        date = new Date(dateField);
      } else {
        console.log('⚠️ No date field provided');
        return 'N/A';
      }
      const formatted = date.toLocaleDateString();
      console.log('📅 Date formatted successfully:', formatted);
      return formatted;
    } catch (error) {
      console.error('❌ Error formatting date:', error, 'Original value:', dateField);
      return 'Invalid Date';
    }
  };

  const formatTime = (dateField) => {
    console.log('🕐 Formatting time field:', dateField);
    try {
      let date;
      if (dateField?.seconds) {
        // Firestore Timestamp
        console.log('🕐 Processing Firestore timestamp for time');
        date = new Date(dateField.seconds * 1000);
      } else if (dateField instanceof Date) {
        console.log('🕐 Processing Date object for time');
        date = dateField;
      } else if (dateField) {
        console.log('🕐 Processing string/number date for time');
        date = new Date(dateField);
      } else {
        console.log('⚠️ No time field provided');
        return 'N/A';
      }
      const formatted = date.toLocaleTimeString();
      console.log('🕐 Time formatted successfully:', formatted);
      return formatted;
    } catch (error) {
      console.error('❌ Error formatting time:', error, 'Original value:', dateField);
      return 'Invalid Time';
    }
  };

  if (loading) {
    console.log('⏳ Component in loading state');
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  console.log('📋 Rendering table with entries:', entries?.length || 0);

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5>Entries ({entries.length})</h5>
          
          <form onSubmit={handleSearch} className="d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Search entries..."
              value={search}
              onChange={(e) => {
                console.log('🔍 Search input changed:', e.target.value);
                setSearch(e.target.value);
              }}
              style={{ width: '250px' }}
            />
            <button 
              type="submit" 
              className="btn btn-outline-primary"
              onClick={() => console.log('🔘 Search button clicked')}
            >
              Search
            </button>
          </form>
        </div>
      </div>
      
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 SL_NO column header clicked for sorting');
                    handleSort('SL_NO');
                  }}
                >
                  SL {getSortIcon('SL_NO')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 USER_NAME column header clicked for sorting');
                    handleSort('USER_NAME');
                  }}
                >
                  User {getSortIcon('USER_NAME')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 PARTICULARS column header clicked for sorting');
                    handleSort('PARTICULARS');
                  }}
                >
                  Particulars {getSortIcon('PARTICULARS')}
                </th>
                <th>Particulars Full Form</th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 CLIENT_CODE column header clicked for sorting');
                    handleSort('CLIENT_CODE');
                  }}
                >
                  Client {getSortIcon('CLIENT_CODE')}
                </th>
                <th>Client Full Form</th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 CAPACITY_MW column header clicked for sorting');
                    handleSort('CAPACITY_MW');
                  }}
                >
                  Capacity {getSortIcon('CAPACITY_MW')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 STATE_NAME column header clicked for sorting');
                    handleSort('STATE_NAME');
                  }}
                >
                  State {getSortIcon('STATE_NAME')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 SITE_NAME column header clicked for sorting');
                    handleSort('SITE_NAME');
                  }}
                >
                  Site {getSortIcon('SITE_NAME')}
                </th>
                <th>Site Full Form</th>
                <th>Reference Code</th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('🔘 CREATED_AT column header clicked for sorting');
                    handleSort('CREATED_AT');
                  }}
                >
                  Created {getSortIcon('CREATED_AT')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center text-muted py-4">
                    No entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => {
                  console.log(`📋 Rendering entry row ${index + 1}:`, { 
                    id: entry._id || entry.id, 
                    refCode: entry.REFERENCE_CODE,
                    createdBy: entry.CREATED_BY,
                    isCurrentUser: entry.CREATED_BY === user?.uid
                  });
                  
                  return (
                    <tr 
                      key={entry._id || entry.id} 
                      className={index === 0 ? 'table-info' : ''}
                    >
                      <td>{entry.SL_NO}</td>
                      <td>{entry.USER_NAME}</td>
                      <td>
                        <span className="badge bg-secondary">{entry.PARTICULARS}</span>
                      </td>
                      <td>
                        <small className="text-muted">{getParticularsFullForm(entry.PARTICULARS)}</small>
                      </td>
                      <td>
                        <span className="badge bg-primary">{entry.CLIENT_CODE}</span>
                      </td>
                      <td>
                        <small className="text-muted">{getClientCodeFullForm(entry.CLIENT_CODE)}</small>
                      </td>
                      <td>{entry.CAPACITY_MW}MW</td>
                      <td>
                        <span className="badge bg-success">{entry.STATE_NAME}</span>
                      </td>
                      <td>
                        <span className="badge bg-success">{entry.SITE_NAME}</span>
                      </td>
                      <td>
                        <small className="text-muted">{getSiteNameFullForm(entry.SITE_NAME)}</small>
                      </td>
                      <td>
                        <code className="small">{entry.REFERENCE_CODE}</code>
                      </td>
                      <td>
                        <small>
                          {formatDate(entry.CREATED_AT)}
                          <br />
                          {formatTime(entry.CREATED_AT)}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {canModifyEntry(entry) ? (
                            <>
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  console.log('🔘 Edit button clicked for entry:', entry._id || entry.id);
                                  onEdit?.(entry);
                                }}
                                title="Edit Entry"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => {
                                  console.log('🔘 Delete button clicked for entry:', entry._id || entry.id);
                                  handleDelete(entry);
                                }}
                                title="Delete Entry"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <span className="text-muted small">View Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <nav className="mt-3">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => {
                    console.log('🔘 Previous page button clicked');
                    handlePageChange(pagination.currentPage - 1);
                  }}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </button>
              </li>
              
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <li 
                    key={page} 
                    className={`page-item ${pagination.currentPage === page ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => {
                        console.log(`🔘 Page ${page} button clicked`);
                        handlePageChange(page);
                      }}
                    >
                      {page}
                    </button>
                  </li>
                );
              })}
              
              <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => {
                    console.log('🔘 Next page button clicked');
                    handlePageChange(pagination.currentPage + 1);
                  }}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}