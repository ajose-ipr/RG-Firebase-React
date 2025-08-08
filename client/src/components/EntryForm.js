import { useState } from 'react';
import { useData } from '../context/DataContext';
import { getParticularsFullForm, getClientCodeFullForm, getSiteNameFullForm } from '../utils/constants';

export default function EntryForm({ entry = null, onSuccess, onCancel }) {
  console.log('🚀 EntryForm component mounted/re-rendered with entry:', entry);
  
  const { dropdownOptions, createEntry, updateEntry, addCustomOption } = useData();
  console.log('📋 Dropdown options received:', dropdownOptions);
  
  // Extract options arrays safely
  const particularsOptions = dropdownOptions.PARTICULARS || [];
  const clientCodeOptions = dropdownOptions.CLIENT_CODE || [];
  const siteNameOptions = dropdownOptions.SITE_NAME || [];
  const stateNameOptions = dropdownOptions.STATE_NAME || [];

  console.log('🔧 Extracted options:', {
    particulars: particularsOptions.length,
    clientCode: clientCodeOptions.length,
    siteName: siteNameOptions.length,
    stateName: stateNameOptions.length
  });

  const [formData, setFormData] = useState({
    PARTICULARS: entry?.PARTICULARS || '',
    CLIENT_CODE: entry?.CLIENT_CODE || '',
    CAPACITY_MW: entry?.CAPACITY_MW || '',
    SITE_NAME: entry?.SITE_NAME || '',
    STATE_NAME: entry?.STATE_NAME || ''
  });
  console.log('📝 Initial form data set:', formData);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showCustomParticulars, setShowCustomParticulars] = useState(false);
  const [customParticulars, setCustomParticulars] = useState('');

  const [showCustomClients, setShowCustomClients] = useState(false);
  const [customClients, setCustomClients] = useState('');

  const [showCustomSites, setShowCustomSites] = useState(false);
  const [customSites, setCustomSites] = useState('');

  const [showCustomStates, setShowCustomStates] = useState(false);
  const [customStates, setCustomStates] = useState('');

  const validateForm = () => {
    console.log('🔍 Starting form validation with data:', formData);
    const newErrors = {};
    
    if (!formData.PARTICULARS) {
      newErrors.PARTICULARS = 'Particulars is required';
      console.log('❌ Validation error: Particulars is required');
    }
    
    if (!formData.CLIENT_CODE) {
      newErrors.CLIENT_CODE = 'Client Code is required';
      console.log('❌ Validation error: Client Code is required');
    } else if (formData.CLIENT_CODE.length < 2 || formData.CLIENT_CODE.length > 4) {
      newErrors.CLIENT_CODE = 'Client Code must be between 2-4 characters';
      console.log('❌ Validation error: Client Code length invalid:', formData.CLIENT_CODE.length);
    }

    const capacityValue = parseFloat(formData.CAPACITY_MW);
    if (!formData.CAPACITY_MW) {
      newErrors.CAPACITY_MW = 'Capacity is required';
      console.log('❌ Validation error: Capacity is required');
    } else if (isNaN(capacityValue) || capacityValue <= 0) {
      newErrors.CAPACITY_MW = 'Capacity must be a positive number';
      console.log('❌ Validation error: Invalid capacity value:', formData.CAPACITY_MW, 'parsed as:', capacityValue);
    }

    if (!formData.STATE_NAME) {
      newErrors.STATE_NAME = 'State Name is required';
      console.log('❌ Validation error: State Name is required');
    } else if (formData.STATE_NAME.length < 2 || formData.STATE_NAME.length > 4) {
      newErrors.STATE_NAME = 'State Name must be between 2-4 characters';
      console.log('❌ Validation error: State Name length invalid:', formData.STATE_NAME.length);
    }
    
    if (!formData.SITE_NAME) {
      newErrors.SITE_NAME = 'Site Name is required';
      console.log('❌ Validation error: Site Name is required');
    } else if (formData.SITE_NAME.length < 2 || formData.SITE_NAME.length > 4) {
      newErrors.SITE_NAME = 'Site Name must be between 2-4 characters';
      console.log('❌ Validation error: Site Name length invalid:', formData.SITE_NAME.length);
    }
    
    console.log('🔍 Validation complete. Errors found:', Object.keys(newErrors).length, newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    console.log('📤 Form submission started');
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('❌ Form validation failed, aborting submission');
      return;
    }
    
    console.log('✅ Form validation passed, proceeding with submission');
    setLoading(true);
    try {
      console.log('📊 Submitting form with data:', formData);

      // Add custom options first if they exist
      if (showCustomParticulars && customParticulars.trim()) {
        console.log('🔧 Adding custom particulars:', customParticulars.trim());
        await handleCustomOption('PARTICULARS', customParticulars.trim());
      }
      if (showCustomClients && customClients.trim()) {
        console.log('🔧 Adding custom client code:', customClients.trim());
        await handleCustomOption('CLIENT_CODE', customClients.trim());
      }
      if (showCustomSites && customSites.trim()) {
        console.log('🔧 Adding custom site name:', customSites.trim());
        await handleCustomOption('SITE_NAME', customSites.trim());
      }
      if (showCustomStates && customStates.trim()) {
        console.log('🔧 Adding custom state name:', customStates.trim());
        await handleCustomOption('STATE_NAME', customStates.trim());
      }

      if (entry) {
        console.log('📝 Updating existing entry with ID:', entry._id || entry.id);
        await updateEntry(entry._id || entry.id, formData);
        console.log('✅ Entry updated successfully');
      } else {
        console.log('➕ Creating new entry');
        await createEntry(formData);
        console.log('✅ Entry created successfully');
      }
      
      // Reset form if creating new entry
      if (!entry) {
        console.log('🔄 Resetting form data for new entry');
        setFormData({
          PARTICULARS: '',
          CLIENT_CODE: '',
          CAPACITY_MW: '',
          SITE_NAME: '',
          STATE_NAME: ''
        });
        setCustomParticulars('');
        setCustomClients('');
        setCustomSites('');
        setCustomStates('');

        setShowCustomParticulars(false);
        setShowCustomClients(false);
        setShowCustomSites(false);
        setShowCustomStates(false);
        console.log('✅ Form reset complete');
      }
      
      console.log('📞 Calling onSuccess callback');
      onSuccess?.();
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        formData: formData
      });
      setErrors({ 
        submit: error.message || 'An error occurred' 
      });
    } finally {
      console.log('🏁 Form submission process complete, setting loading to false');
      setLoading(false);
    }
  };

  const handleCustomOption = async (type, value) => {
    console.log(`🔧 Adding custom option - Type: ${type}, Value: ${value}`);
    if (value && value.length > 0) {
      const existingOptions = dropdownOptions[type] || [];
      console.log(`📋 Checking against ${existingOptions.length} existing options for ${type}`);
      
      const exists = existingOptions.find(opt => 
        opt.value?.toUpperCase?.() === value.toUpperCase()
      );
      
      if (!exists) {
        console.log(`➕ Option "${value}" doesn't exist for ${type}, adding new option`);
        try {
          await addCustomOption(type, value);
          console.log(`✅ Successfully added custom option "${value}" for ${type}`);
        } catch (error) {
          console.error(`❌ Error adding custom option "${value}" for ${type}:`, error);
        }
      } else {
        console.log(`⚠️ Option "${value}" already exists for ${type}, skipping`);
      }
    } else {
      console.log(`⚠️ Invalid value provided for ${type}:`, value);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>{entry ? 'Edit Entry' : 'Create New Entry'}</h5>
      </div>
      <div className="card-body">
        {errors.submit && (
          <div className="alert alert-danger">{errors.submit}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Particulars *</label>
                <select
                  className={`form-select ${errors.PARTICULARS ? 'is-invalid' : ''}`}
                  value={showCustomParticulars ? 'OTHERS' : formData.PARTICULARS}
                  onChange={(e) => {
                    console.log('🔄 Particulars selection changed:', e.target.value);
                    const isOther = e.target.value === 'OTHERS';
                    console.log('🔧 Is custom option selected:', isOther);
                    setShowCustomParticulars(isOther);
                    if (!isOther) {
                      console.log('📝 Setting particulars to predefined value:', e.target.value);
                      setFormData({...formData, PARTICULARS: e.target.value});
                      setCustomParticulars('');
                    } else {
                      console.log('📝 Setting particulars to custom value:', customParticulars);
                      setFormData({...formData, PARTICULARS: customParticulars});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {particularsOptions.map((opt, index) => (
                    <option key={opt.id || opt._id || index} value={opt.value}>
                      {opt.value} - {opt.displayName}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomParticulars && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.PARTICULARS ? 'is-invalid' : ''}`}
                      value={customParticulars}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        console.log('📝 Custom particulars input changed:', val);
                        setCustomParticulars(val);
                        setFormData({ ...formData, PARTICULARS: val });
                      }}
                      placeholder="Enter custom particulars"
                      required
                    />
                  </div>
                )}
                {errors.PARTICULARS && (
                  <div className="invalid-feedback">{errors.PARTICULARS}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Particulars Full Form</label>
                <input
                  type="text"
                  className="form-control"
                  value={getParticularsFullForm(formData.PARTICULARS)}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                />
                <small className="form-text text-muted">Auto-generated from selected particulars</small>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Client Code *</label>
                <select
                  className={`form-select ${errors.CLIENT_CODE ? 'is-invalid' : ''}`}
                  value={showCustomClients ? 'OTHERS' : formData.CLIENT_CODE}
                  onChange={(e) => {
                    console.log('🔄 Client code selection changed:', e.target.value);
                    const isOther = e.target.value === 'OTHERS';
                    console.log('🔧 Is custom client selected:', isOther);
                    setShowCustomClients(isOther);
                    if (!isOther) {
                      console.log('📝 Setting client code to predefined value:', e.target.value);
                      setFormData({...formData, CLIENT_CODE: e.target.value});
                      setCustomClients('');
                    } else {
                      console.log('📝 Setting client code to custom value:', customClients);
                      setFormData({...formData, CLIENT_CODE: customClients});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {clientCodeOptions.map((opt, index) => (
                    <option key={opt.id || opt._id || index} value={opt.value}>
                      {opt.value} - {opt.displayName}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomClients && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.CLIENT_CODE ? 'is-invalid' : ''}`}
                      value={customClients}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        console.log('📝 Custom client code input changed:', val);
                        setCustomClients(val);
                        setFormData({...formData, CLIENT_CODE: val});
                      }}
                      placeholder="Enter custom client code"
                      required
                    />
                  </div>
                )}
                {errors.CLIENT_CODE && (
                  <div className="invalid-feedback">{errors.CLIENT_CODE}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Client Full Form</label>
                <input
                  type="text"
                  className="form-control"
                  value={getClientCodeFullForm(formData.CLIENT_CODE)}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                />
                <small className="form-text text-muted">Auto-generated from selected client code</small>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Capacity (MW) *</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.CAPACITY_MW ? 'is-invalid' : ''}`}
                  value={formData.CAPACITY_MW}
                  onChange={(e) => {
                    console.log('📝 Capacity input changed:', e.target.value);
                    setFormData({ ...formData, CAPACITY_MW: e.target.value });
                  }}
                  required
                />
                {errors.CAPACITY_MW && (
                  <div className="invalid-feedback">{errors.CAPACITY_MW}</div>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">State Name *</label>
                <select
                  className={`form-select ${errors.STATE_NAME ? 'is-invalid' : ''}`}
                  value={showCustomStates ? 'OTHERS' : formData.STATE_NAME}
                  onChange={(e) => {
                    console.log('🔄 State name selection changed:', e.target.value);
                    const isOther = e.target.value === 'OTHERS';
                    console.log('🔧 Is custom state selected:', isOther);
                    setShowCustomStates(isOther);
                    if (!isOther) {
                      console.log('📝 Setting state name to predefined value:', e.target.value);
                      setFormData({...formData, STATE_NAME: e.target.value});
                      setCustomStates('');
                    } else {
                      console.log('📝 Setting state name to custom value:', customStates);
                      setFormData({...formData, STATE_NAME: customStates});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {stateNameOptions.map((opt, index) => (
                    <option key={opt.id || opt._id || index} value={opt.value}>
                      {opt.value} - {opt.displayName}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomStates && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.STATE_NAME ? 'is-invalid' : ''}`}
                      value={customStates}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        console.log('📝 Custom state name input changed:', val);
                        setCustomStates(val);
                        setFormData({ ...formData, STATE_NAME: val });
                      }}
                      placeholder="Enter custom state name"
                      required
                    />
                  </div>
                )}
                {errors.STATE_NAME && (
                  <div className="invalid-feedback">{errors.STATE_NAME}</div>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Site Name *</label>
                <select
                  className={`form-select ${errors.SITE_NAME ? 'is-invalid' : ''}`}
                  value={showCustomSites ? 'OTHERS' : formData.SITE_NAME}
                  onChange={(e) => {
                    console.log('🔄 Site name selection changed:', e.target.value);
                    const isOther = e.target.value === 'OTHERS';
                    console.log('🔧 Is custom site selected:', isOther);
                    setShowCustomSites(isOther);
                    if (!isOther) {
                      console.log('📝 Setting site name to predefined value:', e.target.value);
                      setFormData({...formData, SITE_NAME: e.target.value});
                      setCustomSites('');
                    } else {
                      console.log('📝 Setting site name to custom value:', customSites);
                      setFormData({...formData, SITE_NAME: customSites});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {siteNameOptions.map((opt, index) => (
                    <option key={opt.id || opt._id || index} value={opt.value}>
                      {opt.value} - {opt.displayName}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomSites && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.SITE_NAME ? 'is-invalid' : ''}`}
                      value={customSites}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        console.log('📝 Custom site name input changed:', val);
                        setCustomSites(val);
                        setFormData({ ...formData, SITE_NAME: val });
                      }}
                      placeholder="Enter custom site name"
                      required
                    />
                  </div>
                )}
                {errors.SITE_NAME && (
                  <div className="invalid-feedback">{errors.SITE_NAME}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Site Full Form</label>
                <input
                  type="text"
                  className="form-control"
                  value={getSiteNameFullForm(formData.SITE_NAME)}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                />
                <small className="form-text text-muted">Auto-generated from selected site name</small>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              onClick={() => console.log('🔘 Submit button clicked')}
            >
              {loading ? 'Processing...' : (entry ? 'Update Entry' : 'Generate Reference')}
            </button>
            {onCancel && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  console.log('🔘 Cancel button clicked');
                  onCancel();
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}