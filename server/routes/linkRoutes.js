const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/links
router.get('/', (req, res) => {
  try {
    const db = readDB();
    res.status(200).json(db.links);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/links
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, url, gridSpanX, gridSpanY } = req.body;
    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }
    // Simple validation for URL format
    if (!url.startsWith('http')) {
      return res.status(400).json({ message: 'URL must start with http' });
    }

    const newLink = {
      _id: uuidv4(),
      title: title.trim(),
      url: url.trim(),
      gridSpanX: Math.min(Math.max(Number(gridSpanX) || 1, 1), 4),
      gridSpanY: Math.min(Math.max(Number(gridSpanY) || 1, 1), 4),
      clickCount: 0,
    };
    const db = readDB();
    db.links.push(newLink);
    writeDB(db);
    res.status(201).json(newLink);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/links/click/:id
router.patch('/click/:id', (req, res) => {
  try {
    const db = readDB();
    const index = db.links.findIndex(l => l._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Link not found' });
    }
    db.links[index].clickCount += 1;
    writeDB(db);
    res.status(200).json(db.links[index]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
