const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();
router.get('/users', adminController.getUsers);
router.delete('/users/:email', (req, res, next) => { req.body.email = req.params.email; adminController.deleteUser(req, res, next); });
router.post('/users/delete', adminController.deleteUser);
router.post('/users/overview', adminController.userOverview);
module.exports = router;
