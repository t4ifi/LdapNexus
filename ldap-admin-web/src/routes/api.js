const express = require('express');
const router = express.Router();

// Rutas básicas de API
router.get('/stats', async (req, res) => {
  res.json({
    users: 0,
    groups: 0,
    status: 'ok'
  });
});

module.exports = router;