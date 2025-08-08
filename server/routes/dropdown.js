const express = require('express');
const { db, admin } = require('../firebase');

// Middleware to verify Firebase token and check admin
async function authenticateToken(req, res, next) {
  const idToken = req.headers.authorization?.split(' ')[1];
  if (!idToken) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin' || req.user?.admin === true) return next();
  return res.status(403).json({ error: 'Admin only' });
}

const router = express.Router();

// Get dropdown options by type
router.get('/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['PARTICULARS', 'CLIENT_CODE', 'SITE_NAME', 'STATE_NAME'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid dropdown type' });
    }
    const q = db.collection('dropdown_options').where('type', '==', type.toUpperCase());
    const snapshot = await q.get();
    const options = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(options);
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new dropdown option
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, value } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'Type and value are required' });
    }
    const validTypes = ['PARTICULARS', 'CLIENT_CODE', 'SITE_NAME', 'STATE_NAME'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid dropdown type' });
    }
    if (
      (['CLIENT_CODE', 'SITE_NAME', 'STATE_NAME'].includes(type.toUpperCase())) &&
      (value.length < 2 || value.length > 4)
    ) {
      return res.status(400).json({ error: `${type} must be between 2-4 characters` });
    }
    // Check for duplicate
    const q = db.collection('dropdown_options')
      .where('type', '==', type.toUpperCase())
      .where('value', '==', value.toUpperCase());
    const snapshot = await q.get();
    if (!snapshot.empty) {
      return res.status(400).json({ error: 'Option already exists' });
    }
    const docRef = await db.collection('dropdown_options').add({
      type: type.toUpperCase(),
      value: value.toUpperCase(),
      isActive: true,
      isCustom: true,
      createdBy: req.user.uid,
      createdAt: new Date()
    });
    const newDoc = await docRef.get();
    res.status(201).json({ id: docRef.id, ...newDoc.data() });
  } catch (error) {
    console.error('Error adding dropdown option:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update dropdown option (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { value, isActive } = req.body;
    const optionRef = db.collection('dropdown_options').doc(req.params.id);
    const optionSnap = await optionRef.get();
    if (!optionSnap.exists) {
      return res.status(404).json({ error: 'Option not found' });
    }
    const updateData = {};
    if (value !== undefined) updateData.value = value.toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;
    await optionRef.update(updateData);
    const updated = await optionRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('Error updating dropdown option:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete dropdown option (admin only, only custom)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const optionRef = db.collection('dropdown_options').doc(req.params.id);
    const optionSnap = await optionRef.get();
    if (!optionSnap.exists) {
      return res.status(404).json({ error: 'Option not found' });
    }
    const option = optionSnap.data();
    if (!option.isCustom) {
      return res.status(403).json({ error: 'Cannot delete system options' });
    }
    await optionRef.delete();
    res.json({ message: 'Option deleted successfully' });
  } catch (error) {
    console.error('Error deleting dropdown option:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all dropdown options (admin only - for management)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, includeInactive = false } = req.query;
    let q = db.collection('dropdown_options');
    if (type) {
      q = q.where('type', '==', type.toUpperCase());
    }
    if (!includeInactive) {
      q = q.where('isActive', '==', true);
    }
    const snapshot = await q.get();
    const options = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(options);
  } catch (error) {
    console.error('Error fetching all dropdown options:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;