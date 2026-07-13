const dailyChecklistModel = require('../models/dailyChecklistModel');

function getDailyChecklist(req, res) {
  try {
    const checklist = dailyChecklistModel.getCurrentMonthForUser(req.session.user);
    return res.json({ success: true, checklist });
  } catch (error) {
    console.error('Failed to load daily checklist:', error);
    return res.status(500).json({ success: false, message: 'Failed to load daily checklist' });
  }
}

function updateDailyChecklist(req, res) {
  try {
    const { habitKey, completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, message: 'completed must be true or false' });
    }

    const checklist = dailyChecklistModel.updateTodayHabit(
      req.session.user,
      habitKey,
      completed
    );

    return res.json({ success: true, checklist });
  } catch (error) {
    console.error('Failed to update daily checklist:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update daily checklist'
    });
  }
}

module.exports = {
  getDailyChecklist,
  updateDailyChecklist
};
