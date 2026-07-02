const dailyChecklistModel = require('../models/dailyChecklistModel');

function getDailyChecklist(req, res) {
  try {
    const config = dailyChecklistModel.getDailyChecklistConfig();
    res.json(config);
  } catch (error) {
    console.error('Failed to load daily checklist config:', error);
    res.status(500).json({ message: 'Failed to load daily checklist config' });
  }
}

module.exports = {
  getDailyChecklist,
};
