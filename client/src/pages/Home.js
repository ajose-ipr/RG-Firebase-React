import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Home() {
  const { user } = useAuth();
  const { entries } = useData();

  // Safely handle entries array
  const safeEntries = Array.isArray(entries) ? entries : [];
  const recentEntries = safeEntries.slice(0, 5);

  // Helper to get role from Firebase user (if using custom claims, adjust as needed)
  const getUserRole = () => {
    // If you set custom claims, you may need to fetch them separately
    // For now, fallback to 'user'
    return user?.role || 'user';
  };

  const getMonthlyEntries = () => {
    return safeEntries.filter(e => {
      try {
        // Firestore Timestamp: e.CREATED_AT.seconds
        const entryDate = e.CREATED_AT?.seconds
          ? new Date(e.CREATED_AT.seconds * 1000)
          : new Date(e.CREATED_AT);
        const now = new Date();
        return entryDate.getMonth() === now.getMonth() &&
               entryDate.getFullYear() === now.getFullYear();
      } catch {
        return false;
      }
    }).length;
  };

  const getUserEntries = () => {
    return safeEntries.filter(e => e.CREATED_BY === user?.uid).length;
  };

  return (
    <>
      <Navigation />
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="display-6">Welcome, {user?.email}!</h1>
                <p className="text-muted">Reference Number Generator Dashboard</p>
              </div>
              <div>
                <span className="badge bg-primary fs-6">
                  Role: {getUserRole()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Entries</h5>
                <h2 className="card-text">{safeEntries.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">My Entries</h5>
                <h2 className="card-text">{getUserEntries()}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">This Month</h5>
                <h2 className="card-text">{getMonthlyEntries()}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Quick Actions</h5>
                <Link to="/entries" className="btn btn-light btn-sm">
                  View All Entries
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link to="/entries" className="btn btn-primary">
                    📝 Create New Entry
                  </Link>
                  {getUserRole() === 'admin' && (
                    <Link to="/settings" className="btn btn-warning">
                      ⚙️ Admin Settings
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Recent Entries</h5>
              </div>
              <div className="card-body">
                {recentEntries.length === 0 ? (
                  <p className="text-muted">No entries yet. Create your first entry!</p>
                ) : (
                  <div className="list-group">
                    {recentEntries.map(entry => (
                      <div key={entry.id} className="list-group-item">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">
                            <code className="small">{entry.REFERENCE_CODE || entry.referenceCode}</code>
                          </h6>
                          <small>
                            {entry.CREATED_AT
                              ? (
                                  entry.CREATED_AT.seconds
                                    ? new Date(entry.CREATED_AT.seconds * 1000).toLocaleDateString()
                                    : new Date(entry.CREATED_AT).toLocaleDateString()
                                )
                              : 'N/A'}
                          </small>
                        </div>
                        <p className="mb-1">
                          <span className="badge bg-secondary me-1">{entry.PARTICULARS || entry.particulars}</span>
                          <span className="badge bg-primary me-1">{entry.CLIENT_CODE || entry.clientCode}</span>
                          <span className="badge bg-success">{entry.CAPACITY_MW || entry.capacityMw}MW</span>
                        </p>
                        <small>Created by: {entry.USER_NAME || entry.userName || 'Unknown'}</small>
                      </div>
                    ))}
                  </div>
                )}
                {safeEntries.length > 5 && (
                  <div className="mt-3">
                    <Link to="/entries" className="btn btn-outline-primary btn-sm">
                      View All Entries →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}