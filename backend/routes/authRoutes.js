const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/session', authController.checkSession);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);
module.exports = router;
