const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/income', (req, res) => {
  const filePath = path.join(__dirname, '../data/incomeData.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).json({ code: 1001, msg: 'internal error', success: false });
      return;
    }
    res.json(JSON.parse(data));
  });
});

module.exports = router;
