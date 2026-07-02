const express = require('express');
const userController = require('../controllers/userController');
const { requireSession } = require('../middleware/helpers');
const router = express.Router();
router.get('/me', requireSession, userController.getCurrentUser);
router.get('/', userController.listUsers);
module.exports = router;
