const express = require('express');
const { db, admin } = require('../firebase');
const router = express.Router();

// Middleware to verify Firebase token
async function authenticateToken(req, res, next) {
  const idToken = req.headers.authorization?.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Get all entries
router.get('/', authenticateToken, async (req, res) => {
  const snapshot = await db.collection('entries').get();
  const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json({ entries });
});

// Create new entry
router.post('/', authenticateToken, async (req, res) => {
  const data = { ...req.body, createdBy: req.user.name || req.user.email, createdAt: new Date() };
  const docRef = await db.collection('entries').add(data);
  res.status(201).json({ id: docRef.id, ...data });
});

// Update entry
router.put('/:id', authenticateToken, async (req, res) => {
  await db.collection('entries').doc(req.params.id).update(req.body);
  res.json({ message: 'Entry updated' });
});

// Delete entry
router.delete('/:id', authenticateToken, async (req, res) => {
  await db.collection('entries').doc(req.params.id).delete();
  res.json({ message: 'Entry deleted' });
});

module.exports = router;