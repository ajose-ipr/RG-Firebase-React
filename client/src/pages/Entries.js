import { useState } from 'react';
import Navigation from '../components/Navigation';
import EntryForm from '../components/EntryForm';
import EntryTable from '../components/EntryTable';

export default function Entries() {
  const [editingEntry, setEditingEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setShowForm(false);
  };

  return (
    <>
      <Navigation />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Entry Management</h1>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingEntry(null);
              setShowForm(!showForm);
            }}
          >
            {showForm && !editingEntry ? 'Hide Form' : 'Create New Entry'}
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <EntryForm 
              entry={editingEntry}
              onSuccess={handleFormSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

        <EntryTable onEdit={handleEdit} />
      </div>
    </>
  );
}