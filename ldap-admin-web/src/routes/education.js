const express = require('express');
const router = express.Router();

// Ruta básica de educación
router.get('/', (req, res) => {
  res.render('education/index', {
    title: 'Aprender LDAP'
  });
});

module.exports = router;