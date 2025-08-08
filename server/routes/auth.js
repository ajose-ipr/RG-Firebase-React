const express = require('express');
const { admin } = require('../firebase');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    const userRecord = await admin.auth().createUser({
      email: `${username}@yourdomain.com`,
      password,
      displayName: username,
    });
    // Optionally set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    res.status(201).json({ 
      user: { id: userRecord.uid, username, role }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login (client should use Firebase Auth SDK directly)
// Optionally, implement custom token logic if needed

// Get current user (token verification)
router.get('/me', async (req, res) => {
  const idToken = req.headers.authorization?.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.json({ user: decodedToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;