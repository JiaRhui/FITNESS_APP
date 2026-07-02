const express = require('express');
const dailyChecklistController = require('../controllers/dailyChecklistController');

const router = express.Router();

router.get('/', dailyChecklistController.getDailyChecklist);

module.exports = router;
