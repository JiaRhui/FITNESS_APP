const express = require('express');
const dailyChecklistController = require('../controllers/dailyChecklistController');
const { requireSession } = require('../middleware/helpers');

const router = express.Router();

router.use(requireSession);
router.get('/', dailyChecklistController.getDailyChecklist);
router.patch('/', dailyChecklistController.updateDailyChecklist);

module.exports = router;
